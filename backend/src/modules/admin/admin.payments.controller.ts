import { Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { HttpStatus } from '@be11/shared';
import { AppError } from '../../utils/appError.js';
import { AuthenticatedRequest } from '../../middlewares/auth.js';

export interface UnifiedPaymentRecord {
  id: string;
  sourceType: 'BOOKING' | 'WALLET_TOPUP';
  bookingId?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  venueName?: string;
  venueSlug?: string | null;
  amount: number;
  currency: string;
  provider: string;
  status: string; // PAID, PENDING, FAILED, REFUNDED
  gatewayOrderId?: string | null;
  gatewayPaymentId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export const getAdminPayments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      limit = '15',
      status,
      type,
      search,
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const takeNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 15));
    const skipNum = (pageNum - 1) * takeNum;

    // 1. Fetch Wallet Top-Up records
    const topupWhere: any = {};
    if (status && status !== 'ALL') {
      topupWhere.status = (status as string).toUpperCase();
    }
    if (startDate || endDate) {
      topupWhere.createdAt = {};
      if (startDate) topupWhere.createdAt.gte = new Date(startDate as string);
      if (endDate) topupWhere.createdAt.lte = new Date(endDate as string);
    }

    const [topups, bookings] = await Promise.all([
      type === 'BOOKING'
        ? []
        : prisma.walletTopUp.findMany({
            where: topupWhere,
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true, email: true, phone: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
          }),
      type === 'WALLET_TOPUP'
        ? []
        : prisma.booking.findMany({
            where: {
              ...(status && status !== 'ALL' ? { paymentStatus: (status as string).toUpperCase() } : {}),
              ...(startDate || endDate
                ? {
                    date: {
                      ...(startDate ? { gte: startDate as string } : {}),
                      ...(endDate ? { lte: endDate as string } : {}),
                    },
                  }
                : {}),
            },
            include: {
              ground: { select: { id: true, name: true, slug: true, city: true } },
              customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 200,
          }),
    ]);

    // 2. Unify into a single structured payments stream
    let unifiedList: UnifiedPaymentRecord[] = [];

    // Map Wallet Topups
    for (const t of topups) {
      unifiedList.push({
        id: t.id,
        sourceType: 'WALLET_TOPUP',
        customerId: t.userId,
        customerName: `${t.user?.firstName || 'BE11'} ${t.user?.lastName || 'User'}`,
        customerEmail: t.user?.email || '',
        customerPhone: t.user?.phone,
        venueName: 'BE11 Digital Wallet',
        venueSlug: 'wallet',
        amount: t.amount,
        currency: t.currency,
        provider: 'Razorpay UPI/Cards',
        status: t.status,
        gatewayOrderId: t.razorpayOrderId,
        gatewayPaymentId: t.razorpayPaymentId,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      });
    }

    // Map Booking payments
    for (const b of bookings) {
      unifiedList.push({
        id: `pay_b_${b.id.substring(0, 8)}`,
        sourceType: 'BOOKING',
        bookingId: b.id,
        customerId: b.customerId,
        customerName: b.customerName || `${b.customer?.firstName || 'Player'} ${b.customer?.lastName || ''}`,
        customerEmail: b.customerEmail || b.customer?.email || '',
        customerPhone: b.customerPhone || b.customer?.phone,
        venueName: b.ground?.name || 'BE11 Verified Ground',
        venueSlug: b.ground?.slug,
        amount: b.totalPrice,
        currency: 'INR',
        provider: b.paymentStatus === 'PAID' ? 'BE11 Wallet / Razorpay' : 'On-Ground / Pending',
        status: b.paymentStatus,
        gatewayOrderId: b.transactionId,
        gatewayPaymentId: b.invoice,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      });
    }

    // 3. Search Filter
    if (search && typeof search === 'string' && search.trim()) {
      const q = (search as string).toLowerCase().trim();
      unifiedList = unifiedList.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          (p.bookingId && p.bookingId.toLowerCase().includes(q)) ||
          p.customerName.toLowerCase().includes(q) ||
          p.customerEmail.toLowerCase().includes(q) ||
          (p.customerPhone && p.customerPhone.toLowerCase().includes(q)) ||
          (p.venueName && p.venueName.toLowerCase().includes(q)) ||
          (p.gatewayOrderId && p.gatewayOrderId.toLowerCase().includes(q)) ||
          (p.gatewayPaymentId && p.gatewayPaymentId.toLowerCase().includes(q))
      );
    }

    // Sort descending by createdAt
    unifiedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = unifiedList.length;
    const paginated = unifiedList.slice(skipNum, skipNum + takeNum);
    const totalPages = Math.ceil(total / takeNum) || 1;

    // Summary statistics
    const totalPaidAmount = unifiedList
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    const paidCount = unifiedList.filter((p) => p.status === 'PAID').length;
    const pendingCount = unifiedList.filter((p) => p.status === 'PENDING' || p.status === 'CREATED').length;
    const failedCount = unifiedList.filter((p) => p.status === 'FAILED').length;
    const refundedCount = unifiedList.filter((p) => p.status === 'REFUNDED').length;

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Admin payments retrieved successfully',
      data: {
        payments: paginated,
        pagination: {
          page: pageNum,
          limit: takeNum,
          total,
          totalPages,
        },
        stats: {
          totalTransactions: total,
          paidTransactions: paidCount,
          pendingTransactions: pendingCount,
          failedTransactions: failedCount,
          refundedTransactions: refundedCount,
          totalPaidVolume: totalPaidAmount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminPaymentById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    // Check if it's a WalletTopUp ID
    const topup = await prisma.walletTopUp.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    if (topup) {
      return res.status(HttpStatus.OK).json({
        success: true,
        data: {
          payment: {
            id: topup.id,
            sourceType: 'WALLET_TOPUP',
            customerId: topup.userId,
            customerName: `${topup.user?.firstName} ${topup.user?.lastName}`,
            customerEmail: topup.user?.email,
            customerPhone: topup.user?.phone,
            venueName: 'BE11 Digital Wallet Top-Up',
            amount: topup.amount,
            currency: topup.currency,
            provider: 'Razorpay Payment Gateway',
            status: topup.status,
            gatewayOrderId: topup.razorpayOrderId,
            gatewayPaymentId: topup.razorpayPaymentId,
            signatureVerified: !!topup.razorpaySignature,
            createdAt: topup.createdAt.toISOString(),
            updatedAt: topup.updatedAt.toISOString(),
          },
        },
      });
    }

    // Check if it's a Booking payment
    const rawBookingId = id.startsWith('pay_b_') ? id.replace('pay_b_', '') : id;
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id: id }, { id: { startsWith: rawBookingId } }],
      },
      include: {
        ground: true,
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    if (booking) {
      return res.status(HttpStatus.OK).json({
        success: true,
        data: {
          payment: {
            id: `pay_b_${booking.id.substring(0, 8)}`,
            sourceType: 'BOOKING',
            bookingId: booking.id,
            customerId: booking.customerId,
            customerName: booking.customerName || `${booking.customer?.firstName} ${booking.customer?.lastName}`,
            customerEmail: booking.customerEmail || booking.customer?.email,
            customerPhone: booking.customerPhone || booking.customer?.phone,
            venueName: booking.ground?.name,
            venueLocation: booking.ground?.location,
            amount: booking.totalPrice,
            currency: 'INR',
            provider: booking.paymentStatus === 'PAID' ? 'BE11 Wallet / Razorpay' : 'On-Ground Settlement',
            status: booking.paymentStatus,
            bookingStatus: booking.status,
            gatewayOrderId: booking.transactionId,
            gatewayPaymentId: booking.invoice,
            date: booking.date,
            matchPeriod: booking.matchPeriod || `${booking.startTime} - ${booking.endTime}`,
            createdAt: booking.createdAt.toISOString(),
            updatedAt: booking.updatedAt.toISOString(),
          },
        },
      });
    }

    throw new AppError('Payment transaction not found', HttpStatus.NOT_FOUND);
  } catch (error) {
    next(error);
  }
};

export const exportAdminPaymentsCsv = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const topups = await prisma.walletTopUp.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const bookings = await prisma.booking.findMany({
      include: {
        ground: { select: { name: true } },
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const rows: string[] = [
      'Transaction ID,Type,Customer,Email,Phone,Venue/Target,Amount,Currency,Status,Gateway Order ID,Gateway Payment ID,Date',
    ];

    for (const t of topups) {
      rows.push(
        `"${t.id}","WALLET_TOPUP","${t.user?.firstName || ''} ${t.user?.lastName || ''}","${t.user?.email || ''}","${t.user?.phone || ''}","Digital Wallet",${t.amount},"${t.currency}","${t.status}","${t.razorpayOrderId || ''}","${t.razorpayPaymentId || ''}","${t.createdAt.toISOString()}"`
      );
    }

    for (const b of bookings) {
      rows.push(
        `"${b.id}","BOOKING","${b.customerName || b.customer?.firstName || ''}","${b.customerEmail || b.customer?.email || ''}","${b.customerPhone || b.customer?.phone || ''}","${b.ground?.name || ''}",${b.totalPrice},"INR","${b.paymentStatus}","${b.transactionId || ''}","${b.invoice || ''}","${b.createdAt.toISOString()}"`
      );
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="be11-payments-export-${Date.now()}.csv"`);
    res.status(HttpStatus.OK).send(rows.join('\n'));
  } catch (error) {
    next(error);
  }
};
