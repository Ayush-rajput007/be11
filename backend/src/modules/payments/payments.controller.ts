import { Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/appError.js';
import { HttpStatus, WalletTopupOrderSchema, WalletTopupVerifySchema } from '@be11/shared';
import { AuthenticatedRequest } from '../../middlewares/auth.js';
import {
  getRazorpayPublicKey,
  isRazorpayConfigured,
  createRazorpayOrder as createServerOrder,
  verifyRazorpaySignature,
  fetchRazorpayPayment,
  verifyWebhookSignature,
} from '../../services/razorpay.service.js';
import { logger } from '../../config/logger.js';
import { sendNotification } from '../notifications/notifications.controller.js';

// GET /api/v1/payments/public-key - safely returns the public Razorpay Key ID
export const getPublicKey = async (_req: any, res: Response) => {
  const keyId = getRazorpayPublicKey();
  res.status(HttpStatus.OK).json({
    success: true,
    data: {
      keyId,
      isConfigured: Boolean(keyId),
    },
  });
};

// GET /api/v1/payments/transactions - lists wallet transactions
export const getTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Wallet transaction history retrieved',
      data: { transactions },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/payments/topup - deprecated direct topup, now redirects to Razorpay flow
export const topupWallet = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    throw new AppError(
      'Direct wallet top-up is disabled. Please create a Razorpay order via /api/v1/wallet/topup/create-order',
      HttpStatus.BAD_REQUEST
    );
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/payments/booking/create-order - initiates Razorpay order for venue booking
export const createBookingPaymentOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const { bookingId } = req.body;
    if (!bookingId) {
      throw new AppError('Booking ID is required to initiate payment', HttpStatus.BAD_REQUEST);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { ground: true },
    });

    if (!booking) {
      throw new AppError('Booking not found', HttpStatus.NOT_FOUND);
    }

    // Ownership check (Customer or Admin)
    if (booking.customerId !== userId && req.user?.role !== 'ADMIN') {
      throw new AppError('Unauthorized access to booking', HttpStatus.FORBIDDEN);
    }

    if (booking.status === 'CANCELLED') {
      throw new AppError('Cannot pay for a cancelled booking. Please reserve a new slot.', HttpStatus.BAD_REQUEST);
    }

    // Prevent duplicate payment
    if (booking.paymentStatus === 'PAID') {
      throw new AppError('This booking has already been paid for.', HttpStatus.BAD_REQUEST);
    }

    // Authoritative amount in paise calculated STRICTLY from booking.totalPrice
    const amountPaise = Math.round(booking.totalPrice * 100);
    if (!amountPaise || amountPaise <= 0) {
      throw new AppError('Invalid booking total amount for payment', HttpStatus.BAD_REQUEST);
    }

    let razorpayOrderId: string;

    if (isRazorpayConfigured()) {
      const order = await createServerOrder({
        amountPaise,
        currency: 'INR',
        receipt: booking.id,
        notes: {
          bookingId: booking.id,
          groundId: booking.groundId,
          groundName: booking.ground?.name || 'Cricket Ground',
          bookingType: booking.bookingType,
          date: booking.date,
          matchPeriod: booking.matchPeriod || `${booking.startTime}-${booking.endTime}`,
        },
      });
      razorpayOrderId = order.id;
    } else {
      // Development fallback if credentials are absent
      razorpayOrderId = `order_sim_${Math.random().toString(36).substring(2, 15)}`;
    }

    // Store Razorpay order ID in booking transactionId for audit trail & idempotency
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        transactionId: razorpayOrderId,
      },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Razorpay order created successfully',
      data: {
        orderId: razorpayOrderId,
        amount: amountPaise,
        currency: 'INR',
        keyId: getRazorpayPublicKey(),
        bookingId: booking.id,
        totalPrice: booking.totalPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/payments/booking/verify - verifies Razorpay payment for venue booking
export const verifyBookingPayment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new AppError(
        'Missing required payment credentials (bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature)',
        HttpStatus.BAD_REQUEST
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { ground: true },
    });

    if (!booking) {
      throw new AppError('Booking not found', HttpStatus.NOT_FOUND);
    }

    if (booking.customerId !== userId && req.user?.role !== 'ADMIN') {
      throw new AppError('Unauthorized access to booking', HttpStatus.FORBIDDEN);
    }

    // Idempotency: If already marked PAID, return existing booking without error
    if (booking.paymentStatus === 'PAID') {
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Payment has already been confirmed for this booking',
        data: {
          booking,
        },
      });
    }

    // Verify HMAC SHA256 signature server-side
    if (isRazorpayConfigured()) {
      const isValidSignature = verifyRazorpaySignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      });

      if (!isValidSignature) {
        throw new AppError('Payment signature verification failed. Invalid credentials.', HttpStatus.BAD_REQUEST);
      }

      // Verify payment details with Razorpay API (authoritative amount & status)
      const paymentDetails = await fetchRazorpayPayment(razorpayPaymentId);
      const expectedAmountPaise = Math.round(booking.totalPrice * 100);

      if (paymentDetails.amount !== expectedAmountPaise) {
        logger.error('Payment amount manipulation detected', {
          bookingId: booking.id,
          expectedPaise: expectedAmountPaise,
          receivedPaise: paymentDetails.amount,
        });
        throw new AppError(
          'Payment amount mismatch. Transaction has been rejected for security reasons.',
          HttpStatus.BAD_REQUEST
        );
      }

      if (paymentDetails.currency !== 'INR') {
        throw new AppError('Invalid payment currency', HttpStatus.BAD_REQUEST);
      }

      if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
        throw new AppError(
          `Payment is not in an authorized or captured state (Status: ${paymentDetails.status})`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Atomic update: Mark paymentStatus as PAID, record transactionId
    // CRITICAL: booking.status MUST REMAIN 'PENDING' until admin approval!
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: 'PAID',
        transactionId: razorpayPaymentId,
      },
      include: { ground: true },
    });

    // Create persistent Notification for customer
    await prisma.notification.create({
      data: {
        userId: booking.customerId,
        title: 'Payment Received (₹' + booking.totalPrice + ')',
        message: `Your payment of ₹${booking.totalPrice} for ${booking.ground.name} on ${booking.date} has been confirmed. Your booking request is now PENDING admin approval.`,
      },
    });

    // Send real-time notification via Socket.IO
    sendNotification(booking.customerId, {
      title: 'Payment Received',
      message: `Your payment of ₹${booking.totalPrice} for ${booking.ground.name} has been confirmed. Booking is awaiting admin confirmation.`,
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Payment verified successfully. Booking is awaiting admin approval.',
      data: {
        booking: updatedBooking,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/wallet/topup/create-order - initiates Razorpay order for wallet top-up
export const createWalletTopupOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const parseResult = WalletTopupOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid top-up amount';
      throw new AppError(firstError, HttpStatus.BAD_REQUEST);
    }

    const { amount } = parseResult.data;
    const amountPaise = Math.round(amount * 100);

    let razorpayOrderId: string;
    if (isRazorpayConfigured()) {
      const order = await createServerOrder({
        amountPaise,
        currency: 'INR',
        receipt: `topup_${Date.now()}`,
        notes: {
          userId,
          type: 'WALLET_TOPUP',
        },
      });
      razorpayOrderId = order.id;
    } else {
      razorpayOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    // Persist WalletTopUp record in database
    await prisma.walletTopUp.create({
      data: {
        userId,
        amount,
        currency: 'INR',
        status: 'CREATED',
        razorpayOrderId,
      },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Razorpay wallet top-up order created successfully',
      data: {
        orderId: razorpayOrderId,
        amount: amountPaise,
        currency: 'INR',
        keyId: getRazorpayPublicKey(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/wallet/topup/verify - cryptographically verifies Razorpay payment & idempotently credits wallet
export const verifyWalletTopup = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const parseResult = WalletTopupVerifySchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid payment credentials';
      throw new AppError(firstError, HttpStatus.BAD_REQUEST);
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parseResult.data;

    const topUp = await prisma.walletTopUp.findUnique({
      where: { razorpayOrderId },
      include: { user: true },
    });

    if (!topUp) {
      throw new AppError('Top-up order not found', HttpStatus.NOT_FOUND);
    }

    if (topUp.userId !== userId && req.user?.role !== 'ADMIN') {
      throw new AppError('Unauthorized access to top-up order', HttpStatus.FORBIDDEN);
    }

    // IDEMPOTENCY: If already marked PAID, return existing verified status without re-crediting
    if (topUp.status === 'PAID') {
      const currentUser = await prisma.user.findUnique({ where: { id: userId } });
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Payment has already been verified and credited to your wallet',
        data: {
          walletBalance: currentUser?.walletBalance ?? topUp.user.walletBalance,
          amount: topUp.amount,
          paymentId: topUp.razorpayPaymentId || razorpayPaymentId,
        },
      });
    }

    // Cryptographic signature verification via HMAC-SHA256
    if (isRazorpayConfigured()) {
      const isValid = verifyRazorpaySignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      });

      if (!isValid) {
        await prisma.walletTopUp.update({
          where: { id: topUp.id },
          data: { status: 'FAILED' },
        });
        throw new AppError('Payment signature verification failed', HttpStatus.BAD_REQUEST);
      }

      // Verify payment details with Razorpay API (authoritative amount, currency, and status)
      const paymentDetails = await fetchRazorpayPayment(razorpayPaymentId);
      const expectedPaise = Math.round(topUp.amount * 100);

      if (paymentDetails.amount !== expectedPaise) {
        logger.error('Wallet top-up amount tampering detected', {
          expectedPaise,
          receivedPaise: paymentDetails.amount,
          userId,
          orderId: razorpayOrderId,
        });
        await prisma.walletTopUp.update({
          where: { id: topUp.id },
          data: { status: 'FAILED' },
        });
        throw new AppError('Payment amount mismatch. Transaction rejected.', HttpStatus.BAD_REQUEST);
      }

      if (paymentDetails.currency !== 'INR') {
        throw new AppError('Invalid payment currency', HttpStatus.BAD_REQUEST);
      }

      if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
        throw new AppError(
          `Payment is not in captured or authorized state (Status: ${paymentDetails.status})`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // Protect against reusing payment ID
    const existingPaymentUsage = await prisma.walletTopUp.findFirst({
      where: {
        razorpayPaymentId,
        status: 'PAID',
        NOT: { id: topUp.id },
      },
    });
    if (existingPaymentUsage) {
      throw new AppError('This payment ID has already been credited', HttpStatus.CONFLICT);
    }

    // Idempotent Atomic Database Transaction: Update TopUp record, create ledger entry, increment user wallet
    const updatedUser = await prisma.$transaction(async (tx) => {
      await tx.walletTopUp.update({
        where: { id: topUp.id },
        data: {
          status: 'PAID',
          razorpayPaymentId,
          razorpaySignature,
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          amount: topUp.amount,
          type: 'CREDIT',
          description: 'Wallet top-up (Razorpay)',
          razorpayOrderId,
          razorpayPaymentId,
        },
      });

      return tx.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: topUp.amount } },
      });
    });

    // Create persistent notification for user
    await prisma.notification.create({
      data: {
        userId,
        title: `Wallet Top-up Successful (₹${topUp.amount})`,
        message: `₹${topUp.amount} has been successfully added to your BE11 wallet via Razorpay.`,
      },
    });

    // Real-time notification
    sendNotification(userId, {
      title: 'Wallet Top-up Successful',
      message: `₹${topUp.amount} added to your BE11 wallet.`,
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: `Payment successful! ₹${topUp.amount} added to your BE11 wallet.`,
      data: {
        walletBalance: updatedUser.walletBalance,
        amount: topUp.amount,
        paymentId: razorpayPaymentId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/wallet/topup/cancel - marks cancelled top-up attempt
export const cancelWalletTopup = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const { razorpayOrderId, reason } = req.body;
    if (!razorpayOrderId) {
      throw new AppError('Razorpay order ID is required', HttpStatus.BAD_REQUEST);
    }

    const topUp = await prisma.walletTopUp.findUnique({
      where: { razorpayOrderId },
    });

    if (!topUp) {
      throw new AppError('Top-up order not found', HttpStatus.NOT_FOUND);
    }

    if (topUp.userId !== userId && req.user?.role !== 'ADMIN') {
      throw new AppError('Unauthorized access to top-up order', HttpStatus.FORBIDDEN);
    }

    if (topUp.status !== 'PAID') {
      await prisma.walletTopUp.update({
        where: { id: topUp.id },
        data: { status: 'CANCELLED' },
      });
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Payment was not completed. Your wallet has not been charged/credited.',
      data: {
        status: topUp.status === 'PAID' ? 'PAID' : 'CANCELLED',
        reason: reason || 'User cancelled checkout',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Backwards-compatible aliases
export const createRazorpayOrder = createWalletTopupOrder;
export const verifyRazorpayPayment = verifyWalletTopup;


// POST /api/v1/payments/refund - simulates processing a refund
export const paymentRefund = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { amount, description } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (!amount || amount <= 0) {
      throw new AppError('Invalid refund amount', HttpStatus.BAD_REQUEST);
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      await tx.walletTransaction.create({
        data: {
          userId,
          amount,
          type: 'CREDIT',
          description: description || 'Order Refund Credited',
        },
      });

      return tx.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: amount } },
      });
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        walletBalance: updatedUser.walletBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/payments/webhook - Razorpay webhook handler
export const handleRazorpayWebhook = async (req: any, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (signature) {
      const isValid = verifyWebhookSignature(rawBody, signature as string);
      if (!isValid) {
        logger.warn('Received Razorpay webhook with invalid signature');
        return res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid webhook signature' });
      }
    }

    const { event, payload } = req.body;
    logger.info(`Received Razorpay webhook event: ${event}`);

    // Handle payment.captured or order.paid
    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload?.payment?.entity;
      const orderId = payment?.order_id || payload?.order?.entity?.id;
      const paymentId = payment?.id;
      const bookingId = payment?.notes?.bookingId;

      if (bookingId || orderId) {
        const booking = await prisma.booking.findFirst({
          where: {
            OR: [
              ...(bookingId ? [{ id: bookingId }] : []),
              ...(orderId ? [{ transactionId: orderId }] : []),
            ],
          },
          include: { ground: true },
        });

        if (booking && booking.paymentStatus !== 'PAID') {
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              paymentStatus: 'PAID',
              transactionId: paymentId || orderId,
              // STATUS REMAINS PENDING
            },
          });
          logger.info(`Webhook idempotently confirmed payment for booking ${booking.id}`);
        }
      }
    }

    res.status(HttpStatus.OK).json({ status: 'ok' });
  } catch (error) {
    logger.error('Error processing Razorpay webhook', { error: (error as any)?.message });
    next(error);
  }
};
