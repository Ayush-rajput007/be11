import { Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/appError.js';
import { HttpStatus } from '@be11/shared';
import { AuthenticatedRequest } from '../../middlewares/auth.js';

import { formatUserProfile, buildProfileResponse, validateAndSanitizeSportsProfile } from './profile.helper.js';

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', HttpStatus.NOT_FOUND);
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: buildProfileResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const { firstName, lastName, phone, city, state, favoriteSport } = req.body;
    const updateData: Record<string, any> = {};

    if (firstName !== undefined) {
      if (typeof firstName !== 'string' || !firstName.trim()) {
        throw new AppError('First name cannot be empty', HttpStatus.BAD_REQUEST);
      }
      updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (typeof lastName !== 'string' || !lastName.trim()) {
        throw new AppError('Last name cannot be empty', HttpStatus.BAD_REQUEST);
      }
      updateData.lastName = lastName.trim();
    }

    if (phone !== undefined) {
      updateData.phone = typeof phone === 'string' && phone.trim() ? phone.trim() : null;
    }

    if (city !== undefined) {
      updateData.city = typeof city === 'string' && city.trim() ? city.trim() : null;
    }

    if (state !== undefined) {
      updateData.state = typeof state === 'string' && state.trim() ? state.trim() : null;
    }

    if (favoriteSport !== undefined) {
      const sportClean = typeof favoriteSport === 'string' ? favoriteSport.trim() : null;
      if (sportClean && !['Cricket', 'Football', 'cricket', 'football'].includes(sportClean)) {
        throw new AppError('Supported sports are Cricket and Football.', HttpStatus.BAD_REQUEST);
      }
      updateData.favoriteSport = sportClean ? (sportClean.toLowerCase() === 'football' ? 'Football' : 'Cricket') : null;
    }

    // Safely check if sports profile fields were also included
    const sportsFields = validateAndSanitizeSportsProfile(req.body);
    Object.assign(updateData, sportsFields);

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Profile updated successfully',
      data: buildProfileResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

export const updateSportsProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const sanitizedData = validateAndSanitizeSportsProfile(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: sanitizedData,
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Sports profile updated successfully',
      data: buildProfileResponse(user),
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
