import { Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { HttpStatus } from '@be11/shared';
import { AuthenticatedRequest } from '../../middlewares/auth.js';
import { adminAuditService } from './admin.audit.service.js';

function getDateRanges() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Start & End of current week (Monday to Sunday)
  const dayOfWeek = now.getDay();
  const diffToMon = (dayOfWeek + 6) % 7;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - diffToMon);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
  const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

  // Start & End of current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
  const endOfMonthStr = endOfMonth.toISOString().split('T')[0];

  return {
    todayStr,
    startOfWeekStr,
    endOfWeekStr,
    startOfMonthStr,
    endOfMonthStr,
  };
}

export const getAdminDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { todayStr, startOfWeekStr, endOfWeekStr, startOfMonthStr, endOfMonthStr } = getDateRanges();

    // 1. Parallel Database Aggregations
    const [
      totalUsers,
      totalGrounds,
      activeGrounds,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      todayBookings,
      upcomingBookings,
      pendingPaymentsCount,
      refundedBookingsCount,
      revenueAllTimeAgg,
      revenueTodayAgg,
      revenueWeekAgg,
      revenueMonthAgg,
      totalWalletTopups,
      paidWalletTopups,
      failedWalletTopups,
      refundedWalletTopups,
      totalMatches,
      activeMatches,
      recentBookings,
      upcomingMatches,
      grounds,
    ] = await Promise.all([
      // Users
      prisma.user.count(),

      // Grounds
      prisma.ground.count(),
      prisma.ground.count({ where: { isActive: true } }),

      // Bookings
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.booking.count({ where: { date: todayStr } }),
      prisma.booking.count({ where: { date: { gte: todayStr }, status: { in: ['CONFIRMED', 'PENDING'] } } }),
      prisma.booking.count({ where: { paymentStatus: 'PENDING', status: { not: 'CANCELLED' } } }),
      prisma.booking.count({ where: { paymentStatus: 'REFUNDED' } }),

      // Revenue aggregations (CONFIRMED + COMPLETED)
      prisma.booking.aggregate({
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
        _sum: { totalPrice: true },
      }),
      prisma.booking.aggregate({
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] }, date: todayStr },
        _sum: { totalPrice: true },
      }),
      prisma.booking.aggregate({
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] }, date: { gte: startOfWeekStr, lte: endOfWeekStr } },
        _sum: { totalPrice: true },
      }),
      prisma.booking.aggregate({
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] }, date: { gte: startOfMonthStr, lte: endOfMonthStr } },
        _sum: { totalPrice: true },
      }),

      // Payments / Wallet Topups
      prisma.walletTopUp.count(),
      prisma.walletTopUp.count({ where: { status: 'PAID' } }),
      prisma.walletTopUp.count({ where: { status: 'FAILED' } }),
      prisma.walletTopUp.count({ where: { status: 'REFUNDED' } }),

      // Matches
      prisma.match.count(),
      prisma.match.count({ where: { status: { in: ['Open', 'Live'] } } }),

      // Recent Bookings
      prisma.booking.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          ground: { select: { id: true, name: true, slug: true, city: true } },
          customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        },
      }),

      // Upcoming Live Matches
      prisma.match.findMany({
        where: { status: { in: ['Open', 'Live'] } },
        take: 6,
        orderBy: { date: 'asc' },
        include: {
          ground: { select: { id: true, name: true, slug: true, city: true } },
        },
      }),

      // Grounds with booking counts and revenue
      prisma.ground.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          sport: true,
          isActive: true,
          pricePerHour: true,
          pricingLabel: true,
          ownerName: true,
          ownerPhone: true,
          bookings: {
            where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
            select: { totalPrice: true },
          },
        },
      }),
    ]);

    const totalRevenue = revenueAllTimeAgg._sum.totalPrice || 0;
    const todayRevenue = revenueTodayAgg._sum.totalPrice || 0;
    const thisWeekRevenue = revenueWeekAgg._sum.totalPrice || 0;
    const thisMonthRevenue = revenueMonthAgg._sum.totalPrice || 0;

    // Venue performance breakdown
    const venueBreakdown = grounds.map((g) => {
      const confirmedCount = g.bookings.length;
      const venueRevenue = g.bookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0);
      return {
        id: g.id,
        name: g.name,
        slug: g.slug,
        city: g.city,
        sport: g.sport,
        isActive: g.isActive,
        pricingLabel: g.pricingLabel,
        ownerName: g.ownerName,
        ownerPhone: g.ownerPhone,
        confirmedBookings: confirmedCount,
        revenue: venueRevenue,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Recent system activity
    const auditLogs = await adminAuditService.getLogs({ limit: 8 });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Admin control center dashboard metrics retrieved successfully',
      data: {
        bookings: {
          total: totalBookings,
          today: todayBookings,
          upcoming: upcomingBookings,
          pending: pendingBookings,
          confirmed: confirmedBookings,
          completed: completedBookings,
          cancelled: cancelledBookings,
          refunded: refundedBookingsCount,
        },
        payments: {
          total: totalWalletTopups + confirmedBookings + completedBookings,
          successful: paidWalletTopups + confirmedBookings + completedBookings,
          pending: pendingPaymentsCount,
          failed: failedWalletTopups,
          refunded: refundedWalletTopups + refundedBookingsCount,
          bookingPaymentsCount: confirmedBookings + completedBookings,
          walletTopupsCount: paidWalletTopups,
        },
        revenue: {
          total: totalRevenue,
          today: todayRevenue,
          thisWeek: thisWeekRevenue,
          thisMonth: thisMonthRevenue,
          byVenue: venueBreakdown,
          accountingModel: 'REALIZED_BOOKINGS_ONLY',
        },
        users: {
          total: totalUsers,
        },
        matches: {
          total: totalMatches,
          active: activeMatches,
        },
        venues: {
          total: totalGrounds,
          active: activeGrounds,
          list: venueBreakdown,
        },
        recentBookings: recentBookings.map((b) => ({
          id: b.id,
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          matchPeriod: b.matchPeriod,
          totalPrice: b.totalPrice,
          status: b.status,
          paymentStatus: b.paymentStatus,
          bookingType: b.bookingType,
          customerName: b.customerName || `${b.customer?.firstName} ${b.customer?.lastName}`,
          customerEmail: b.customerEmail || b.customer?.email,
          customerPhone: b.customerPhone || b.customer?.phone,
          groundName: b.ground?.name,
          groundSlug: b.ground?.slug,
          createdAt: b.createdAt.toISOString(),
        })),
        upcomingMatches: upcomingMatches.map((m) => ({
          id: m.id,
          sport: m.sport,
          date: m.date,
          startTime: m.startTime,
          entryFee: m.entryFee,
          playersJoined: m.playersJoined,
          totalPlayers: m.totalPlayers,
          status: m.status,
          hostName: m.hostName,
          groundName: m.ground?.name,
          groundSlug: m.ground?.slug,
        })),
        recentActivity: auditLogs,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
