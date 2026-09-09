import { Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/appError.js';
import { BookingCreateSchema, HttpStatus } from '@be11/shared';
import { AuthenticatedRequest } from '../../middlewares/auth.js';
import { sendNotification } from '../notifications/notifications.controller.js';

export const createBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = BookingCreateSchema.parse(req.body);
    const customerId = req.user?.userId;

    if (!customerId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const targetGroundId = validated.venueId || validated.groundId;
    if (!targetGroundId) {
      throw new AppError('Venue or ground ID is required', HttpStatus.BAD_REQUEST);
    }

    // 1. Fetch user and verify exists
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new AppError('Customer not found', HttpStatus.NOT_FOUND);
    }

    // 2. Fetch ground and pricing rules
    const ground = await prisma.ground.findFirst({
      where: {
        OR: [
          { id: targetGroundId },
          { slug: targetGroundId },
        ],
      },
    });
    if (!ground) {
      throw new AppError('Ground not found', HttpStatus.NOT_FOUND);
    }

    // 3. Validate date (format and no past dates)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (validated.date < todayStr) {
      throw new AppError('Cannot book dates in the past.', HttpStatus.BAD_REQUEST);
    }

    const [year, month, day] = validated.date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let pricingRules: any = null;
    if (typeof ground.pricingRules === 'string') {
      try {
        pricingRules = JSON.parse(ground.pricingRules);
      } catch {
        pricingRules = null;
      }
    } else {
      pricingRules = ground.pricingRules;
    }

    // 4. Server-side price calculation and match period validation
    let totalPrice = 0;
    let matchPeriodNormalized: string | null = null;
    let startTime = validated.startTime || '07:00';
    let endTime = validated.endTime || '11:30';

    const rawBookingType = (validated.bookingType || 'WHOLE_GROUND').toUpperCase().replace('-', '_');
    const isSingleTeam = rawBookingType === 'TEAM_OF_11' || rawBookingType === 'SINGLE_TEAM_OF_11';
    const bookingType: 'SINGLE_TEAM_OF_11' | 'WHOLE_GROUND' = isSingleTeam ? 'SINGLE_TEAM_OF_11' : 'WHOLE_GROUND';

    const extractPrices = (rulesMap: any, periodKey: string) => {
      const val = rulesMap?.[periodKey];
      if (!val) return { entireVenue: 0, teamOf11: 0 };
      if (typeof val === 'number') {
        return {
          entireVenue: val,
          teamOf11: Math.round(val / 2),
        };
      }
      const entireVenue = val.ENTIRE_VENUE ?? val.entireVenue ?? 0;
      const teamOf11 = val.TEAM_OF_11 ?? val.teamOf11 ?? Math.round(entireVenue / 2);
      return { entireVenue, teamOf11 };
    };

    if (ground.slug === 'playnow-cricket-ground' || pricingRules?.type === 'TIME_SLOT_MATRIX') {
      // Playnow Cricket Ground Date-Based Match Period System
      if (!validated.matchPeriod) {
        throw new AppError('Match period (MORNING, AFTERNOON, DAY_NIGHT, or NIGHT) is required for Playnow bookings.', HttpStatus.BAD_REQUEST);
      }

      const rawPeriod = validated.matchPeriod.toUpperCase().replace('-', '_');
      if (!['MORNING', 'AFTERNOON', 'DAY_NIGHT', 'NIGHT'].includes(rawPeriod)) {
        throw new AppError('Invalid match period. Must be MORNING, AFTERNOON, DAY_NIGHT, or NIGHT.', HttpStatus.BAD_REQUEST);
      }

      // Business Rule: Day-Night is NOT available on weekdays
      if (rawPeriod === 'DAY_NIGHT' && !isWeekend) {
        throw new AppError('Day-Night match period is not available on weekdays (available only on Saturday and Sunday).', HttpStatus.BAD_REQUEST);
      }

      matchPeriodNormalized = rawPeriod;

      const weekdayRules = pricingRules?.weekday || {};
      const weekendRules = pricingRules?.weekend || {};
      const activeRules = isWeekend ? weekendRules : weekdayRules;

      let periodKey = 'morning';
      if (rawPeriod === 'MORNING') {
        periodKey = 'morning';
        startTime = '07:00';
        endTime = '11:30';
      } else if (rawPeriod === 'AFTERNOON') {
        periodKey = 'afternoon';
        startTime = '12:00';
        endTime = '16:30';
      } else if (rawPeriod === 'DAY_NIGHT') {
        periodKey = 'dayNight';
        startTime = '16:30';
        endTime = '20:00';
      } else if (rawPeriod === 'NIGHT') {
        periodKey = 'night';
        startTime = '20:00';
        endTime = '23:30';
      }

      const periodPrices = extractPrices(activeRules, periodKey);
      if (isSingleTeam) {
        totalPrice = periodPrices.teamOf11;
      } else {
        totalPrice = periodPrices.entireVenue;
      }
    } else if (ground.slug === 'ab-cricket-ground' || pricingRules?.type === 'PACKAGE_TIERS') {
      // AB Cricket Ground Whole Ground Match Pricing
      if (isSingleTeam) {
        throw new AppError('Single Team of 11 pricing for AB Cricket Ground is on request. Please contact venue owner Rajesh Bajaj at +91 95402 28222.', HttpStatus.BAD_REQUEST);
      }

      if (validated.matchPeriod) {
        matchPeriodNormalized = validated.matchPeriod.toUpperCase().replace('-', '_');
      }

      if (validated.priceTier === 'extended' || matchPeriodNormalized === 'NIGHT' || matchPeriodNormalized === 'DAY_NIGHT' || (startTime && startTime >= '16:00')) {
        totalPrice = 6500;
        startTime = startTime || '18:00';
        endTime = endTime || '22:30';
      } else {
        totalPrice = 3500;
        startTime = startTime || '07:00';
        endTime = endTime || '11:30';
      }
    } else if (ground.slug === 'rrr-cricket-club-kidawali-faridabad') {
      // RRR Cricket Club: exactly 3 fixed 4-hour periods per day
      // 1. MORNING: 06:00 -> 10:00
      // 2. AFTERNOON: 10:00 -> 14:00
      // 3. EVENING: 14:00 -> 18:00
      const validPeriods = ['MORNING', 'AFTERNOON', 'EVENING'];
      if (!matchPeriodNormalized || !validPeriods.includes(matchPeriodNormalized)) {
        throw new AppError('Invalid booking period for RRR Cricket Club. Must be MORNING (6-10 AM), AFTERNOON (10 AM-2 PM), or EVENING (2-6 PM).', HttpStatus.BAD_REQUEST);
      }

      if (matchPeriodNormalized === 'MORNING') {
        startTime = '06:00';
        endTime = '10:00';
      } else if (matchPeriodNormalized === 'AFTERNOON') {
        startTime = '10:00';
        endTime = '14:00';
      } else if (matchPeriodNormalized === 'EVENING') {
        startTime = '14:00';
        endTime = '18:00';
      }

      // Authoritative pricing:
      // A. BOOK AS INDIVIDUAL: Base ₹299 (Display ₹373.75 - ₹74.75 coupon)
      // B. BOOK HALF TEAM FOR A MATCH: Base ₹2,600 (Display ₹3,250 - ₹650 coupon)
      // C. BOOK ENTIRE VENUE: Base ₹5,000 (Display ₹6,250 - ₹1,250 coupon)
      const bType = (bookingType || '').toUpperCase();
      if (bType === 'INDIVIDUAL') {
        totalPrice = 299;
      } else if (bType === 'HALF_TEAM' || bType === 'HALF_TEAM_MATCH' || bType === 'SINGLE_TEAM_OF_11') {
        totalPrice = 2600;
      } else if (bType === 'ENTIRE_VENUE' || bType === 'WHOLE_GROUND') {
        totalPrice = 5000;
      } else {
        throw new AppError(`Invalid booking type "${bookingType}" for RRR Cricket Club. Must be INDIVIDUAL, HALF_TEAM, or ENTIRE_VENUE.`, HttpStatus.BAD_REQUEST);
      }
    } else if (pricingRules?.type === 'CONTACT_ONLY' || ground.pricePerHour === 0) {
      throw new AppError('This ground requires direct contact with the venue owner for booking.', HttpStatus.BAD_REQUEST);
    } else {
      totalPrice = ground.pricePerHour;
    }

    // Customer details
    const customerName = validated.customerName || `${customer.firstName} ${customer.lastName}`;
    const customerPhone = validated.customerPhone || customer.phone || '';
    const customerEmail = validated.customerEmail || customer.email;

    // 5. Double booking prevention (Transactions lock)
    // Only block if an existing booking is CONFIRMED or PENDING (CANCELLED/EXPIRED bookings do not block)
    const collisionFilter: any = {
      groundId: ground.id,
      date: validated.date,
      status: { in: ['CONFIRMED', 'PENDING'] },
    };

    if (matchPeriodNormalized) {
      collisionFilter.OR = [
        { matchPeriod: matchPeriodNormalized },
        { startTime: startTime },
      ];
    } else {
      collisionFilter.startTime = startTime;
    }

    const collision = await prisma.booking.findFirst({
      where: collisionFilter,
    });

    if (collision) {
      const label = matchPeriodNormalized ? `${matchPeriodNormalized} match period` : `time slot (${startTime} - ${endTime})`;
      throw new AppError(`The ${label} on ${validated.date} is already booked. Please choose another date or period.`, HttpStatus.CONFLICT);
    }

    // 6. Perform atomic operations in transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Double check inside transaction for race-condition prevention
      const txCollision = await tx.booking.findFirst({
        where: collisionFilter,
      });
      if (txCollision) {
        throw new AppError('This match slot was just booked by another user. Please choose another slot.', HttpStatus.CONFLICT);
      }

      let bookingStatus = 'PENDING';
      let paymentStatus = 'PENDING';

      // If user has sufficient wallet credit, instantly confirm
      if (customer.walletBalance >= totalPrice && totalPrice > 0) {
        bookingStatus = 'CONFIRMED';
        paymentStatus = 'PAID';
        await tx.user.update({
          where: { id: customerId },
          data: { walletBalance: { decrement: totalPrice } },
        });

        await tx.walletTransaction.create({
          data: {
            userId: customerId,
            amount: totalPrice,
            type: 'DEBIT',
            description: `Booking for ${ground.name} (${validated.date} ${matchPeriodNormalized || startTime} - ${bookingType})`,
          },
        });
      } else {
        // Real payment gateway is not integrated yet: create booking as PENDING (Payment Pending)
        bookingStatus = 'PENDING';
        paymentStatus = 'PAYMENT_PENDING';
      }

      // Create booking with server-calculated price and customer details
      const newBooking = await tx.booking.create({
        data: {
          groundId: ground.id,
          customerId,
          customerName,
          customerPhone,
          customerEmail,
          date: validated.date,
          startTime,
          endTime,
          matchPeriod: matchPeriodNormalized,
          bookingType,
          totalPrice,
          status: bookingStatus,
          paymentStatus,
        },
        include: {
          ground: true,
        },
      });

      // Create Notification
      await tx.notification.create({
        data: {
          userId: customerId,
          title: bookingStatus === 'CONFIRMED' ? 'Booking Confirmed!' : 'Booking Request Received (Pending Payment)',
          message: bookingStatus === 'CONFIRMED'
            ? `Your match booking for ${ground.name} on ${validated.date} (${matchPeriodNormalized || startTime}) has been confirmed.`
            : `Your reservation request for ${ground.name} on ${validated.date} (${matchPeriodNormalized || startTime}) has been received with status PENDING.`,
        },
      });

      return newBooking;
    });

    // Send real-time notification
    sendNotification(customerId, {
      title: 'Booking Confirmed!',
      message: `Your match booking for ${ground.name} on ${validated.date} (${matchPeriodNormalized || startTime}) has been confirmed.`,
    });

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking,
        serverCalculatedPrice: totalPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    let bookings;

    if (role === 'OWNER') {
      // Fetch bookings for grounds owned by this user
      bookings = await prisma.booking.findMany({
        where: {
          ground: { ownerId: userId },
        },
        include: {
          ground: true,
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Customer bookings
      bookings = await prisma.booking.findMany({
        where: { customerId: userId },
        include: { ground: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Bookings retrieved successfully',
      data: { bookings },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const booking = await prisma.booking.findUnique({
      where: { id: id as string },
      include: { ground: true },
    });

    if (!booking) {
      throw new AppError('Booking not found', HttpStatus.NOT_FOUND);
    }

    if (booking.customerId !== userId && (booking as any).ground.ownerId !== userId) {
      throw new AppError('Unauthorized to cancel this booking', HttpStatus.FORBIDDEN);
    }

    if (booking.status === 'CANCELLED') {
      throw new AppError('Booking is already cancelled', HttpStatus.BAD_REQUEST);
    }

    await prisma.$transaction(async (tx) => {
      // Refund user balance
      await tx.user.update({
        where: { id: booking.customerId },
        data: { walletBalance: { increment: booking.totalPrice } },
      });

      // Log transaction
      await tx.walletTransaction.create({
        data: {
          userId: booking.customerId,
          amount: booking.totalPrice,
          type: 'CREDIT',
          description: `Refund for Cancelled Booking: ${(booking as any).ground.name}`,
        },
      });

      // Update Booking
      await tx.booking.update({
        where: { id: id as string },
        data: { status: 'CANCELLED', paymentStatus: 'REFUNDED' },
      });

      // Create alert notification
      await tx.notification.create({
        data: {
          userId: booking.customerId,
          title: 'Booking Cancelled',
          message: `Your booking for ${(booking as any).ground.name} has been cancelled. ₹${booking.totalPrice} has been refunded to your wallet.`,
        },
      });
    });

    sendNotification(booking.customerId, {
      title: 'Booking Cancelled',
      message: `Your booking for ${(booking as any).ground.name} has been cancelled and refunded.`,
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Booking cancelled and refunded successfully',
    });
  } catch (error) {
    next(error);
  }
};
