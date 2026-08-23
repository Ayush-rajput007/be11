import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/appError.js';
import { ReviewCreateSchema, HttpStatus } from '@be11/shared';
import { AuthenticatedRequest } from '../../middlewares/auth.js';

const recalculateGroundRating = async (groundId: string) => {
  const reviews = await prisma.review.findMany({
    where: { groundId },
  });

  const reviewsCount = reviews.length;
  const rating = reviewsCount > 0 
    ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1)) 
    : 0.0;

  await prisma.ground.update({
    where: { id: groundId },
    data: { rating, reviewsCount },
  });
};

export const createReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = ReviewCreateSchema.parse(req.body);
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // Verify user booked this ground before allowing review (optional, but let's allow reviews generally)
    const ground = await prisma.ground.findUnique({
      where: { id: validated.groundId },
    });
    if (!ground) {
      throw new AppError('Ground not found', HttpStatus.NOT_FOUND);
    }

    const review = await prisma.review.create({
      data: {
        groundId: validated.groundId,
        userId,
        rating: validated.rating,
        comment: validated.comment,
      },
    });

    await recalculateGroundRating(validated.groundId);

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Review submitted successfully',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

export const getGroundReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { groundId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { groundId: groundId as string },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format reviews to flat structure matching ReviewDTO
    const formattedReviews = reviews.map((r) => ({
      id: r.id,
      groundId: r.groundId,
      userId: r.userId,
      userName: `${(r as any).user.firstName} ${(r as any).user.lastName}`,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }));

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Reviews retrieved successfully',
      data: { reviews: formattedReviews },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;

    const review = await prisma.review.findUnique({
      where: { id: id as string },
    });

    if (!review) {
      throw new AppError('Review not found', HttpStatus.NOT_FOUND);
    }

    if (review.userId !== userId && role !== 'ADMIN') {
      throw new AppError('Unauthorized to delete this review', HttpStatus.FORBIDDEN);
    }

    await prisma.review.delete({
      where: { id: id as string },
    });

    if (review.groundId) {
      await recalculateGroundRating(review.groundId);
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
