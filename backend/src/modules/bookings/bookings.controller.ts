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

    // 1. Fetch user and verify wallet
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new AppError('Customer not found', HttpStatus.NOT_FOUND);
    }

    // 2. Fetch ground and price
    const ground = await prisma.ground.findUnique({
      where: { id: validated.groundId },
    });
    if (!ground) {
      throw new AppError('Ground not found', HttpStatus.NOT_FOUND);
    }

    // Calculate total price. Currently hourly slots, so duration is 1 hour
    const totalPrice = ground.pricePerHour;

    if (customer.walletBalance < totalPrice) {
      throw new AppError('Insufficient wallet balance. Please add funds.', HttpStatus.BAD_REQUEST);
    }

    // 3. Double booking prevention (Transactions lock)
    const collision = await prisma.booking.findFirst({
      where: {
        groundId: validated.groundId,
        date: validated.date,
        startTime: validated.startTime,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    });

    if (collision) {
      throw new AppError('This time slot is already booked', HttpStatus.CONFLICT);
    }

    // 4. Perform atomic operations
    const booking = await prisma.$transaction(async (tx) => {
      // Deduct balance
      await tx.user.update({
        where: { id: customerId },
        data: { walletBalance: { decrement: totalPrice } },
      });

      // Log transaction
      await tx.walletTransaction.create({
        data: {
          userId: customerId,
          amount: totalPrice,
          type: 'DEBIT',
          description: `Booking for ${ground.name} (${validated.date} ${validated.startTime})`,
        },
      });

      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          groundId: validated.groundId,
          customerId,
          date: validated.date,
          startTime: validated.startTime,
          endTime: validated.endTime,
          totalPrice,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
        },
        include: {
          ground: true,
        },
      });

      // Create Notification
      await tx.notification.create({
        data: {
          userId: customerId,
          title: 'Booking Confirmed!',
          message: `Your booking for ${ground.name} on ${validated.date} at ${validated.startTime} has been confirmed.`,
        },
      });

      return newBooking;
    });

    // Send real-time notification
    sendNotification(customerId, {
      title: 'Booking Confirmed!',
      message: `Your booking for ${ground.name} on ${validated.date} at ${validated.startTime} has been confirmed.`,
    });

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking },
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
