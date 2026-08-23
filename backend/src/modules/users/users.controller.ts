import { Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/appError.js';
import { HttpStatus } from '@be11/shared';
import { AuthenticatedRequest } from '../../middlewares/auth.js';

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const userId = req.user?.userId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName, phone },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          walletBalance: user.walletBalance,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleFavorite = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { groundId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_groundId: { userId: userId as string, groundId: groundId as string },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: {
          id: existing.id,
        },
      });
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Removed from favorites',
        data: { isFavorite: false },
      });
    }

    await prisma.favorite.create({
      data: { userId: userId as string, groundId: groundId as string },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Added to favorites',
      data: { isFavorite: true },
    });
  } catch (error) {
    next(error);
  }
};

export const getFavorites = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        ground: true,
      },
    });

    const grounds = favorites.map((f) => f.ground);

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Favorites retrieved successfully',
      data: { grounds },
    });
  } catch (error) {
    next(error);
  }
};
