import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { HttpStatus } from '@be11/shared';
import { AuthenticatedRequest } from '../../middlewares/auth.js';
import { AppError } from '../../utils/appError.js';

// Get all tournaments with advanced filtering
export const getTournaments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, sport, city, search, entryFeeMax, prizePoolMin } = req.query;
    const filter: any = {};

    if (status) filter.status = status as string;
    if (sport && sport !== 'All') filter.sport = sport as string;
    if (city) filter.city = city as string;
    if (search) {
      filter.name = { contains: search as string };
    }
    if (entryFeeMax) {
      filter.entryFee = { lte: parseFloat(entryFeeMax as string) };
    }
    if (prizePoolMin) {
      filter.prizePool = { gte: parseFloat(prizePoolMin as string) };
    }

    const tournaments = await prisma.tournament.findMany({
      where: filter,
      include: {
        ground: {
          select: {
            name: true,
            location: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Tournaments retrieved successfully',
      data: { tournaments },
    });
  } catch (error) {
    next(error);
  }
};

// Get single tournament by ID
export const getTournamentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tournament = await prisma.tournament.findUnique({
      where: { id: id as string },
      include: {
        ground: true,
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        registrations: true,
        matches: true,
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', HttpStatus.NOT_FOUND);
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Tournament retrieved successfully',
      data: { tournament },
    });
  } catch (error) {
    next(error);
  }
};

// Join Tournament (Registration with Wallet Deduction)
export const registerTeam = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params; // tournament ID
    const { teamName, captainName, contactPhone, playersList } = req.body;

    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (!teamName || !captainName || !contactPhone || !playersList) {
      throw new AppError('Missing required registration parameters', HttpStatus.BAD_REQUEST);
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: id as string },
      include: { registrations: true },
    });

    if (!tournament) {
      throw new AppError('Tournament not found', HttpStatus.NOT_FOUND);
    }

    if (tournament.registrations.length >= tournament.teamsLimit) {
      throw new AppError('Tournament limit reached. Registrations closed.', HttpStatus.BAD_REQUEST);
    }

    // Check if team name is already taken
    if (tournament.registrations.some((reg) => reg.teamName.toLowerCase() === teamName.toLowerCase())) {
      throw new AppError('A team with this name is already registered', HttpStatus.BAD_REQUEST);
    }

    // Check user profile for wallet balance deduction
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user) {
      throw new AppError('User not found', HttpStatus.NOT_FOUND);
    }

    if (tournament.entryFee > 0 && user.walletBalance < tournament.entryFee) {
      throw new AppError('Insufficient wallet balance to join this tournament.', HttpStatus.BAD_REQUEST);
    }

    const registration = await prisma.$transaction(async (tx) => {
      // Deduct entry fee if applicable
      if (tournament.entryFee > 0) {
        await tx.user.update({
          where: { id: userId as string },
          data: { walletBalance: { decrement: tournament.entryFee } },
        });

        await tx.walletTransaction.create({
          data: {
            userId: userId as string,
            amount: tournament.entryFee,
            type: 'DEBIT',
            description: `Tournament registration fee for ${tournament.name}`,
          },
        });
      }

      // Create registration
      return tx.tournamentRegistration.create({
        data: {
          tournamentId: id as string,
          teamName,
          captainName,
          contactPhone,
          playersList: JSON.stringify(playersList),
          status: 'APPROVED', // Auto approve for demo ease
        },
      });
    });

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Successfully registered for the tournament',
      data: { registration },
    });
  } catch (error) {
    next(error);
  }
};

// Cancel Registration
export const cancelRegistration = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { registrationId } = req.body;

    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const registration = await prisma.tournamentRegistration.findUnique({
      where: { id: registrationId as string },
      include: { tournament: true },
    });

    if (!registration) {
      throw new AppError('Registration details not found', HttpStatus.NOT_FOUND);
    }

    // Refund entry fee
    await prisma.$transaction(async (tx) => {
      if (registration.tournament.entryFee > 0) {
        await tx.user.update({
          where: { id: userId as string },
          data: { walletBalance: { increment: registration.tournament.entryFee } },
        });

        await tx.walletTransaction.create({
          data: {
            userId: userId as string,
            amount: registration.tournament.entryFee,
            type: 'CREDIT',
            description: `Refund for cancelled tournament registration: ${registration.tournament.name}`,
          },
        });
      }

      await tx.tournamentRegistration.delete({
        where: { id: registrationId as string },
      });
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Tournament registration successfully cancelled and refunded.',
    });
  } catch (error) {
    next(error);
  }
};

// Favorite Tournament Toggle
export const toggleFavorite = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params; // tournament ID

    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const existing = await prisma.tournamentFavorite.findUnique({
      where: {
        userId_tournamentId: {
          userId: userId as string,
          tournamentId: id as string,
        },
      },
    });

    if (existing) {
      await prisma.tournamentFavorite.delete({
        where: { id: existing.id },
      });
      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Removed from favorites',
        data: { isFavorite: false },
      });
    } else {
      await prisma.tournamentFavorite.create({
        data: {
          userId: userId as string,
          tournamentId: id as string,
        },
      });
      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Added to favorites',
        data: { isFavorite: true },
      });
    }
  } catch (error) {
    next(error);
  }
};

// Get User Favorites
export const getFavorites = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const favorites = await prisma.tournamentFavorite.findMany({
      where: { userId: userId as string },
      include: {
        tournament: true,
      },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Favorite tournaments retrieved successfully',
      data: { favorites },
    });
  } catch (error) {
    next(error);
  }
};

// Get Live Matches
export const getLiveMatches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const matches = await prisma.tournamentMatch.findMany({
      where: { status: 'LIVE' },
      include: {
        tournament: {
          select: {
            name: true,
            sport: true,
          },
        },
      },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Live matches retrieved successfully',
      data: { matches },
    });
  } catch (error) {
    next(error);
  }
};

// Create Review
export const addTournamentReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const review = await prisma.review.create({
      data: {
        tournamentId: id as string,
        userId: userId as string,
        rating: parseInt(rating, 10),
        comment,
      },
    });

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Review added successfully',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

// Organizer Endpoint: Create Tournament
export const createTournament = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId || (role !== 'ADMIN' && (role as string) !== 'ORGANIZER' && role !== 'OWNER')) {
      throw new AppError('Access forbidden', HttpStatus.FORBIDDEN);
    }

    const {
      name,
      description,
      sport,
      startDate,
      endDate,
      registrationDeadline,
      teamsLimit,
      entryFee,
      prizePool,
      groundId,
      city,
      rules,
    } = req.body;

    if (!name || !description || !sport || !startDate || !endDate || !teamsLimit || !city) {
      throw new AppError('Missing required tournament parameters', HttpStatus.BAD_REQUEST);
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        sport,
        startDate,
        endDate,
        registrationDeadline: registrationDeadline || null,
        teamsLimit: parseInt(teamsLimit, 10),
        entryFee: entryFee ? parseFloat(entryFee) : 0.0,
        prizePool: prizePool ? parseFloat(prizePool) : 0.0,
        organizerId: userId as string,
        groundId: groundId || null,
        city,
        rules: rules || null,
      },
    });

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Tournament created successfully',
      data: { tournament },
    });
  } catch (error) {
    next(error);
  }
};
