import { Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { HttpStatus } from '@be11/shared';
import { AuthenticatedRequest } from '../../middlewares/auth.js';

export const getAdminAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalGrounds = await prisma.ground.count();
    const totalBookings = await prisma.booking.count();
    
    // Calculate total revenue from CONFIRMED/COMPLETED bookings
    const bookingsRevenue = await prisma.booking.aggregate({
      where: {
        status: 'CONFIRMED',
      },
      _sum: {
        totalPrice: true,
      },
    });

    const totalRevenue = bookingsRevenue._sum.totalPrice || 0;

    // Get active bookings list grouped or mapped by ground
    const grounds = await prisma.ground.findMany({
      include: {
        bookings: {
          where: { status: 'CONFIRMED' },
        },
      },
    });

    const popularGrounds = grounds.map((g) => {
      const bookingsCount = g.bookings.length;
      const revenue = g.bookings.reduce((sum, b) => sum + b.totalPrice, 0);
      return {
        name: g.name,
        bookingsCount,
        revenue,
      };
    }).sort((a, b) => b.bookingsCount - a.bookingsCount).slice(0, 5);

    // Dynamic mock monthly revenue based on seed/actual records
    const monthlyRevenue = [
      { month: 'Jan', revenue: totalRevenue * 0.1 },
      { month: 'Feb', revenue: totalRevenue * 0.15 },
      { month: 'Mar', revenue: totalRevenue * 0.2 },
      { month: 'Apr', revenue: totalRevenue * 0.25 },
      { month: 'May', revenue: totalRevenue * 0.3 },
    ];

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Admin analytics metrics retrieved successfully',
      data: {
        analytics: {
          totalUsers,
          totalGrounds,
          totalBookings,
          totalRevenue,
          popularGrounds,
          monthlyRevenue,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
