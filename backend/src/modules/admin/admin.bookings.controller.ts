import { Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { HttpStatus } from '@be11/shared';
import { AppError } from '../../utils/appError.js';
import { AuthenticatedRequest } from '../../middlewares/auth.js';

/**
 * Helper to compute date range strings in YYYY-MM-DD
 */
const getDatePresets = () => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Start & End of current week (Monday to Sunday)
  const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon
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
    tomorrowStr,
    startOfWeekStr,
    endOfWeekStr,
    startOfMonthStr,
    endOfMonthStr,
  };
};

/**
 * 1. Get All Admin Bookings (with multi-criteria filters, search, pagination)
 */
export const getAdminBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      limit = '10',
      status,
      venueId,
      date,
      datePreset,
      startDate,
      endDate,
      bookingType,
      matchPeriod,
      search,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const takeNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skipNum = (pageNum - 1) * takeNum;

    const where: any = {};

    // Filter by status
    if (status && typeof status === 'string' && status.toUpperCase() !== 'ALL') {
      where.status = status.toUpperCase();
    }

    // Filter by Venue ID or Slug
    if (venueId && typeof venueId === 'string' && venueId.toUpperCase() !== 'ALL') {
      const vId = venueId as string;
      const ground = await prisma.ground.findFirst({
        where: {
          OR: [{ id: vId }, { slug: vId }],
        },
      });
      if (ground) {
        where.groundId = ground.id;
      } else {
        where.groundId = vId;
      }
    }

    // Filter by Date or Date Presets
    const { todayStr, tomorrowStr, startOfWeekStr, endOfWeekStr, startOfMonthStr, endOfMonthStr } = getDatePresets();

    if (date && typeof date === 'string') {
      where.date = date;
    } else if (datePreset && typeof datePreset === 'string') {
      const preset = datePreset.toLowerCase();
      if (preset === 'today') {
        where.date = todayStr;
      } else if (preset === 'tomorrow') {
        where.date = tomorrowStr;
      } else if (preset === 'this_week') {
        where.date = { gte: startOfWeekStr, lte: endOfWeekStr };
      } else if (preset === 'this_month') {
        where.date = { gte: startOfMonthStr, lte: endOfMonthStr };
      }
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate as string;
      if (endDate) where.date.lte = endDate as string;
    }

    // Filter by Booking Type
    if (bookingType && typeof bookingType === 'string' && bookingType.toUpperCase() !== 'ALL') {
      const rawType = (bookingType as string).toUpperCase().replace('-', '_');
      if (rawType === 'SINGLE_TEAM_OF_11' || rawType === 'TEAM_OF_11') {
        where.bookingType = { in: ['SINGLE_TEAM_OF_11', 'TEAM_OF_11'] };
      } else if (rawType === 'WHOLE_GROUND' || rawType === 'ENTIRE_VENUE') {
        where.bookingType = { in: ['WHOLE_GROUND', 'ENTIRE_VENUE'] };
      }
    }

    // Filter by Match Period
    if (matchPeriod && typeof matchPeriod === 'string' && matchPeriod.toUpperCase() !== 'ALL') {
      where.matchPeriod = (matchPeriod as string).toUpperCase().replace('-', '_');
    }

    // Global Search Filter (ID, customer name, phone, email, ground name)
    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { id: { contains: term } },
            { customerName: { contains: term } },
            { customerPhone: { contains: term } },
            { customerEmail: { contains: term } },
            { ground: { name: { contains: term } } },
          ],
        },
      ];
    }

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: {
          ground: {
            select: {
              id: true,
              name: true,
              slug: true,
              location: true,
              city: true,
              ownerName: true,
              ownerPhone: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          confirmedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          cancelledBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: skipNum,
        take: takeNum,
      }),
    ]);

    const totalPages = Math.ceil(total / takeNum) || 1;

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Admin bookings retrieved successfully',
      data: {
        bookings,
        pagination: {
          page: pageNum,
          limit: takeNum,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Get Real Database Overview Stats for Venue Bookings
 */
export const getAdminBookingStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { todayStr } = getDatePresets();

    const [totalBookings, pendingBookings, confirmedBookings, cancelledBookings, todayBookings, revenueAgg] =
      await Promise.all([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: 'PENDING' } }),
        prisma.booking.count({ where: { status: 'CONFIRMED' } }),
        prisma.booking.count({ where: { status: 'CANCELLED' } }),
        prisma.booking.count({ where: { date: todayStr } }),
        prisma.booking.aggregate({
          where: { status: 'CONFIRMED' },
          _sum: { totalPrice: true },
        }),
      ]);

    const totalRevenue = revenueAgg._sum.totalPrice || 0;

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Admin booking metrics retrieved successfully',
      data: {
        stats: {
          totalBookings,
          pendingBookings,
          confirmedBookings,
          cancelledBookings,
          todayBookings,
          totalRevenue,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Get Single Booking Details
 */
export const getAdminBookingById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        ground: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            walletBalance: true,
          },
        },
        confirmedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        cancelledBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', HttpStatus.NOT_FOUND);
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Booking details retrieved successfully',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Confirm / Approve a Pending Booking (Transactional with Double-Booking check)
 */
export const confirmAdminBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const adminUserId = req.user?.userId;

    if (!adminUserId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      // 1. Fetch booking with lock
      const rawBooking = await tx.booking.findUnique({
        where: { id },
        include: { ground: true },
      });

      if (!rawBooking) {
        throw new AppError('Booking not found', HttpStatus.NOT_FOUND);
      }

      const booking = rawBooking as any;

      if (booking.status === 'CONFIRMED') {
        throw new AppError('Booking is already confirmed', HttpStatus.BAD_REQUEST);
      }

      if (booking.status === 'CANCELLED') {
        throw new AppError('Cannot confirm a cancelled booking', HttpStatus.BAD_REQUEST);
      }

      // 2. Anti-collision verify: Ensure no OTHER confirmed booking occupies this period
      const collision = await tx.booking.findFirst({
        where: {
          id: { not: id },
          groundId: booking.groundId,
          date: booking.date,
          status: 'CONFIRMED',
          OR: [
            ...(booking.matchPeriod ? [{ matchPeriod: booking.matchPeriod }] : []),
            { startTime: booking.startTime },
          ],
        },
      });

      if (collision) {
        throw new AppError(
          `Cannot confirm: Conflicting confirmed reservation exists for ${booking.ground?.name} on ${booking.date} (${booking.matchPeriod || booking.startTime}).`,
          HttpStatus.CONFLICT
        );
      }

      // 3. Mark booking CONFIRMED
      const confirmed = await tx.booking.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          confirmedById: adminUserId,
        },
        include: {
          ground: true,
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
          confirmedBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // 4. Send customer in-app notification
      await tx.notification.create({
        data: {
          userId: booking.customerId,
          title: 'Booking Confirmed!',
          message: `Your booking for ${booking.ground?.name} on ${booking.date} (${booking.matchPeriod || booking.startTime}) has been officially confirmed by Admin.`,
        },
      });

      return confirmed;
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Booking successfully confirmed',
      data: { booking: updatedBooking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Cancel Booking (Transactional with Reason & History Preservation)
 */
export const cancelAdminBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { cancellationReason } = req.body;
    const adminUserId = req.user?.userId;

    if (!adminUserId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const reason = (cancellationReason && typeof cancellationReason === 'string' && cancellationReason.trim())
      ? cancellationReason.trim()
      : 'Cancelled by administrator';

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const rawBooking = await tx.booking.findUnique({
        where: { id },
        include: { ground: true, customer: true },
      });

      if (!rawBooking) {
        throw new AppError('Booking not found', HttpStatus.NOT_FOUND);
      }

      const booking = rawBooking as any;

      if (booking.status === 'CANCELLED') {
        throw new AppError('Booking is already cancelled', HttpStatus.BAD_REQUEST);
      }

      let paymentStatus = booking.paymentStatus;

      // If booking was paid from customer wallet, issue refund
      if (booking.paymentStatus === 'PAID' && booking.totalPrice > 0) {
        paymentStatus = 'REFUNDED';
        await tx.user.update({
          where: { id: booking.customerId },
          data: { walletBalance: { increment: booking.totalPrice } },
        });

        await tx.walletTransaction.create({
          data: {
            userId: booking.customerId,
            amount: booking.totalPrice,
            type: 'CREDIT',
            description: `Refund for cancelled booking: ${booking.ground?.name} (${booking.date} - ${booking.matchPeriod || booking.startTime})`,
          },
        });
      }

      // Update booking status
      const cancelled = await tx.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          paymentStatus,
          cancelledAt: new Date(),
          cancelledById: adminUserId,
          cancellationReason: reason,
        },
        include: {
          ground: true,
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
          cancelledBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // Customer notification
      await tx.notification.create({
        data: {
          userId: booking.customerId,
          title: 'Booking Cancelled',
          message: `Your booking for ${booking.ground?.name} on ${booking.date} (${booking.matchPeriod || booking.startTime}) was cancelled. Reason: ${reason}`,
        },
      });

      return cancelled;
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Booking successfully cancelled',
      data: { booking: updatedBooking },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Venue Availability Inspection for Admin
 */
export const getAdminVenueAvailability = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const venueId = req.params.venueId as string;
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      throw new AppError('Date query param is required (YYYY-MM-DD)', HttpStatus.BAD_REQUEST);
    }

    const ground = await prisma.ground.findFirst({
      where: {
        OR: [{ id: venueId }, { slug: venueId }],
      },
    });

    if (!ground) {
      throw new AppError('Venue not found', HttpStatus.NOT_FOUND);
    }

    const [year, month, day] = (date as string).split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    const isWeekend = parsedDate.getDay() === 0 || parsedDate.getDay() === 6;

    // Active reservations for that date
    const bookings = await prisma.booking.findMany({
      where: {
        groundId: ground.id,
        date: date as string,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
      },
    });

    const isPlaynow = ground.slug === 'playnow-cricket-ground';
    const isRRR = ground.slug === 'rrr-cricket-club-kidawali-faridabad';

    const periodsList = isRRR
      ? [
          { id: 'MORNING', name: 'Morning Match', timeRange: '06:00 AM – 10:00 AM' },
          { id: 'AFTERNOON', name: 'Afternoon Match', timeRange: '10:00 AM – 02:00 PM' },
          { id: 'EVENING', name: 'Evening Match', timeRange: '02:00 PM – 06:00 PM' },
        ]
      : isPlaynow
      ? isWeekend
        ? [
            { id: 'MORNING', name: 'Morning Match', timeRange: '07:00 AM - 11:30 AM' },
            { id: 'AFTERNOON', name: 'Afternoon Match', timeRange: '12:00 PM - 04:30 PM' },
            { id: 'DAY_NIGHT', name: 'Day-Night Match', timeRange: '04:30 PM - 08:00 PM' },
            { id: 'NIGHT', name: 'Night Match', timeRange: '08:00 PM - 11:30 PM' },
          ]
        : [
            { id: 'MORNING', name: 'Morning Match', timeRange: '07:00 AM - 11:30 AM' },
            { id: 'AFTERNOON', name: 'Afternoon Match', timeRange: '12:00 PM - 04:30 PM' },
            { id: 'NIGHT', name: 'Night Match', timeRange: '08:00 PM - 11:30 PM' },
          ]
      : [
          { id: 'MORNING', name: 'Morning Match', timeRange: '07:00 AM - 11:30 AM' },
          { id: 'AFTERNOON', name: 'Afternoon Match', timeRange: '12:00 PM - 04:30 PM' },
          { id: 'NIGHT', name: 'Night / Floodlit Match', timeRange: '06:00 PM - 10:30 PM' },
        ];

    const availability = periodsList.map((p) => {
      const matchBooking = bookings.find(
        (b) => b.matchPeriod === p.id || (p.id === 'MORNING' && b.startTime < '10:00' && isRRR) || (p.id === 'MORNING' && b.startTime < '12:00' && !isRRR)
      );

      return {
        periodId: p.id,
        periodName: p.name,
        timeRange: p.timeRange,
        isAvailable: !matchBooking,
        status: matchBooking ? matchBooking.status : 'AVAILABLE',
        booking: matchBooking
          ? {
              id: matchBooking.id,
              customerName: matchBooking.customerName || `${matchBooking.customer?.firstName} ${matchBooking.customer?.lastName}`,
              customerPhone: matchBooking.customerPhone || matchBooking.customer?.phone,
              customerEmail: matchBooking.customerEmail || matchBooking.customer?.email,
              bookingType: matchBooking.bookingType,
              status: matchBooking.status,
              totalPrice: matchBooking.totalPrice,
            }
          : null,
      };
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Venue availability retrieved successfully',
      data: {
        ground: {
          id: ground.id,
          name: ground.name,
          slug: ground.slug,
          location: ground.location,
          ownerName: ground.ownerName,
          ownerPhone: ground.ownerPhone,
        },
        date,
        availability,
      },
    });
  } catch (error) {
    next(error);
  }
};
