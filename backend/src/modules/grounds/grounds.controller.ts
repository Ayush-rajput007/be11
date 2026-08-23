import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/appError.js';
import { GroundCreateSchema, HttpStatus } from '@be11/shared';
import { AuthenticatedRequest } from '../../middlewares/auth.js';

export const getGrounds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sport, city, search } = req.query;

    const filter: any = { isActive: true };

    if (sport && sport !== 'All') {
      filter.sport = sport as string;
    }

    if (city) {
      filter.city = city as string;
    }

    if (search) {
      filter.OR = [
        { name: { contains: search as string } },
        { location: { contains: search as string } },
      ];
    }

    const grounds = await prisma.ground.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Grounds retrieved successfully',
      data: { grounds },
    });
  } catch (error) {
    next(error);
  }
};

export const getGroundById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const ground = await prisma.ground.findUnique({
      where: { id: id as string },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!ground) {
      throw new AppError('Ground not found', HttpStatus.NOT_FOUND);
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Ground retrieved successfully',
      data: { ground },
    });
  } catch (error) {
    next(error);
  }
};

export const createGround = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = GroundCreateSchema.parse(req.body);
    const ownerId = req.user?.userId;

    if (!ownerId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const ground = await prisma.ground.create({
      data: {
        ...validated,
        ownerId,
      },
    });

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Ground created successfully',
      data: { ground },
    });
  } catch (error) {
    next(error);
  }
};

export const getGroundSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { date } = req.query; // format: YYYY-MM-DD

    if (!date) {
      throw new AppError('Date query param is required (YYYY-MM-DD)', HttpStatus.BAD_REQUEST);
    }

    const ground = await prisma.ground.findUnique({
      where: { id: id as string },
    });

    if (!ground) {
      throw new AppError('Ground not found', HttpStatus.NOT_FOUND);
    }

    // Find confirmed/pending bookings for this ground on this date
    const bookings = await prisma.booking.findMany({
      where: {
        groundId: id as string,
        date: date as string,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    });

    // Define business hours: 06:00 to 22:00 (1-hour slots)
    const startHour = 6;
    const endHour = 22;
    const slots = [];

    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

      // Check if slot is booked
      const isBooked = bookings.some((b) => {
        // Simple slot matching. If booking overlaps this slot.
        // A slot is hourly.
        return b.startTime === startTime;
      });

      slots.push({
        startTime,
        endTime,
        isAvailable: !isBooked,
        price: ground.pricePerHour,
      });
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Slots retrieved successfully',
      data: { slots },
    });
  } catch (error) {
    next(error);
  }
};
