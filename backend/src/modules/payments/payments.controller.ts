import { Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/appError.js';
import { HttpStatus } from '@be11/shared';
import { AuthenticatedRequest } from '../../middlewares/auth.js';

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

// POST /api/v1/payments/topup - tops up user wallet balance
export const topupWallet = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { amount } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new AppError('Invalid top-up amount', HttpStatus.BAD_REQUEST);
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      await tx.walletTransaction.create({
        data: {
          userId,
          amount,
          type: 'CREDIT',
          description: 'Wallet top-up (Online Payment)',
        },
      });

      return tx.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: amount } },
      });
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: `Successfully topped up wallet by ₹${amount}`,
      data: {
        walletBalance: updatedUser.walletBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/payments/create-order - initiates Razorpay payment order
export const createRazorpayOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      throw new AppError('Invalid payment amount', HttpStatus.BAD_REQUEST);
    }

    // Simulate Razorpay order ID generation
    const razorpayOrderId = `order_${Math.random().toString(36).substring(2, 15)}`;

    res.status(HttpStatus.OK).json({
      success: true,
      data: {
        id: razorpayOrderId,
        amount: amount * 100, // paise
        currency: 'INR',
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/payments/verify - verifies Razorpay payment signatures
export const verifyRazorpayPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount, description } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !amount) {
      throw new AppError('Invalid payment credentials', HttpStatus.BAD_REQUEST);
    }

    // Automatically credit the user's wallet upon verification success,
    // allowing subsequent services (venue bookings, match joins) to settle
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Create wallet transaction log
      await tx.walletTransaction.create({
        data: {
          userId,
          amount: parseFloat(amount),
          type: 'CREDIT',
          description: description || 'Razorpay Gateway Auto Topup',
        },
      });

      // Update wallet balance
      return tx.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: parseFloat(amount) } },
      });
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Razorpay payment verified and account credited successfully',
      data: {
        walletBalance: updatedUser.walletBalance,
        paymentId: razorpayPaymentId,
      },
    });
  } catch (error) {
    next(error);
  }
};

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
          type: 'CREDIT', // Refund is credited back to wallet
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
