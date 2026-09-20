import { Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { HttpStatus } from '@be11/shared';
import { AuthenticatedRequest } from '../../middlewares/auth.js';

export const getAdminReports = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();

    // 1. Parallel Database Inquiries
    const [
      allBookings,
      grounds,
      totalUsers,
      totalTopups,
    ] = await Promise.all([
      prisma.booking.findMany({
        select: {
          id: true,
          groundId: true,
          date: true,
          totalPrice: true,
          status: true,
          paymentStatus: true,
          bookingType: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      }),
      prisma.ground.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          sport: true,
          pricingLabel: true,
          ownerName: true,
          ownerPhone: true,
        },
      }),
      prisma.user.count(),
      prisma.walletTopUp.findMany({
        where: { status: 'PAID' },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      }),
    ]);

    // 2. Compute Summary Metrics
    const confirmedBookings = allBookings.filter((b) => b.status === 'CONFIRMED');
    const pendingBookings = allBookings.filter((b) => b.status === 'PENDING');
    const cancelledBookings = allBookings.filter((b) => b.status === 'CANCELLED');

    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const pendingRevenue = pendingBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const cancelledVolume = cancelledBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const totalWalletDepositsLoaded = totalTopups.reduce((sum, t) => sum + (t.amount || 0), 0);

    // 3. Daily Revenue Timeline (Last 14 Days)
    const dailyTimeline: Record<string, { date: string; revenue: number; bookingsCount: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyTimeline[dateStr] = { date: dateStr, revenue: 0, bookingsCount: 0 };
    }

    for (const b of confirmedBookings) {
      if (dailyTimeline[b.date]) {
        dailyTimeline[b.date].revenue += b.totalPrice || 0;
        dailyTimeline[b.date].bookingsCount += 1;
      }
    }

    const dailyRevenueChart = Object.values(dailyTimeline);

    // 4. Monthly Revenue Timeline (Last 6 Months)
    const monthlyTimeline: Record<string, { month: string; revenue: number; bookingsCount: number }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyTimeline[key] = { month: label, revenue: 0, bookingsCount: 0 };
    }

    for (const b of confirmedBookings) {
      if (b.date) {
        const monthKey = b.date.substring(0, 7);
        if (monthlyTimeline[monthKey]) {
          monthlyTimeline[monthKey].revenue += b.totalPrice || 0;
          monthlyTimeline[monthKey].bookingsCount += 1;
        }
      }
    }

    const monthlyRevenueChart = Object.values(monthlyTimeline);

    // 5. Venue Breakdown Matrix
    const venueMetrics = grounds.map((g) => {
      const vBookings = allBookings.filter((b) => b.groundId === g.id);
      const vConfirmed = vBookings.filter((b) => b.status === 'CONFIRMED');
      const vPending = vBookings.filter((b) => b.status === 'PENDING');
      const vCancelled = vBookings.filter((b) => b.status === 'CANCELLED');
      const vRevenue = vConfirmed.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const conversionRate = vBookings.length > 0 ? ((vConfirmed.length / vBookings.length) * 100).toFixed(1) : '0';

      return {
        id: g.id,
        name: g.name,
        slug: g.slug,
        city: g.city,
        sport: g.sport,
        pricingLabel: g.pricingLabel,
        ownerName: g.ownerName,
        ownerPhone: g.ownerPhone,
        totalBookings: vBookings.length,
        confirmedBookings: vConfirmed.length,
        pendingBookings: vPending.length,
        cancelledBookings: vCancelled.length,
        revenue: vRevenue,
        conversionRate: `${conversionRate}%`,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // 6. Booking Type Distribution
    const bookingTypeCounts = {
      WHOLE_GROUND: allBookings.filter((b) => b.bookingType === 'WHOLE_GROUND' || b.bookingType === 'ENTIRE_VENUE').length,
      TEAM_OF_11: allBookings.filter((b) => b.bookingType === 'TEAM_OF_11' || b.bookingType === 'SINGLE_TEAM_OF_11').length,
      INDIVIDUAL: allBookings.filter((b) => b.bookingType === 'INDIVIDUAL').length,
    };

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Admin reports generated successfully',
      data: {
        summary: {
          totalRevenue,
          pendingRevenue,
          cancelledVolume,
          totalWalletDepositsLoaded,
          totalWalletTopupRevenue: totalWalletDepositsLoaded,
          totalBookingsCount: allBookings.length,
          confirmedBookingsCount: confirmedBookings.length,
          pendingBookingsCount: pendingBookings.length,
          cancelledBookingsCount: cancelledBookings.length,
          conversionRate: allBookings.length > 0 ? `${((confirmedBookings.length / allBookings.length) * 100).toFixed(1)}%` : '0%',
          totalUsers,
          accountingNote: 'Revenue reflects confirmed booking receipts. User wallet top-ups are customer deposits.',
        },
        charts: {
          dailyRevenue: dailyRevenueChart,
          monthlyRevenue: monthlyRevenueChart,
          bookingTypeDistribution: bookingTypeCounts,
        },
        venuePerformance: venueMetrics,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportAdminBookingsCsv = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        ground: { select: { name: true, city: true } },
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        confirmedBy: { select: { firstName: true, lastName: true, email: true } },
        cancelledBy: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const rows: string[] = [
      'Booking ID,Customer Name,Email,Phone,Venue,City,Date,Start Time,End Time,Match Period,Booking Type,Total Price (INR),Status,Payment Status,Confirmed By,Cancelled By,Cancellation Reason,Created At',
    ];

    for (const b of bookings) {
      const customerName = b.customerName || `${b.customer?.firstName || ''} ${b.customer?.lastName || ''}`.trim();
      const email = b.customerEmail || b.customer?.email || '';
      const phone = b.customerPhone || b.customer?.phone || '';
      const confirmedBy = b.confirmedBy ? `${b.confirmedBy.firstName} ${b.confirmedBy.lastName}` : '';
      const cancelledBy = b.cancelledBy ? `${b.cancelledBy.firstName} ${b.cancelledBy.lastName}` : '';

      rows.push(
        `"${b.id}","${customerName}","${email}","${phone}","${b.ground?.name || ''}","${b.ground?.city || ''}","${b.date}","${b.startTime}","${b.endTime}","${b.matchPeriod || ''}","${b.bookingType}",${b.totalPrice},"${b.status}","${b.paymentStatus}","${confirmedBy}","${cancelledBy}","${b.cancellationReason || ''}","${b.createdAt.toISOString()}"`
      );
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="be11-bookings-export-${Date.now()}.csv"`);
    res.status(HttpStatus.OK).send(rows.join('\n'));
  } catch (error) {
    next(error);
  }
};
