import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/appError.js';
import { HttpStatus } from '@be11/shared';
import { AuthenticatedRequest } from '../../middlewares/auth.js';
import { sendNotification, broadcastMatchUpdate } from '../notifications/notifications.controller.js';

// GET /api/v1/matches
export const getMatches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sport, city, search } = req.query;
    const conditions: any[] = [];

    if (sport && sport !== 'All' && sport !== 'All Sports') {
      const sportStr = (sport as string).trim();
      conditions.push({
        sport: { equals: sportStr, mode: 'insensitive' },
      });
    }

    if (city && city !== 'All' && city !== 'All Cities') {
      const cityStr = (city as string).trim();
      const cityLower = cityStr.toLowerCase();
      if (cityLower === 'haryana') {
        conditions.push({
          ground: {
            OR: [
              { state: { equals: 'Haryana', mode: 'insensitive' } },
              { city: { equals: 'Haryana', mode: 'insensitive' } },
              { city: { equals: 'Faridabad', mode: 'insensitive' } },
              { city: { equals: 'Gurugram', mode: 'insensitive' } },
              { location: { contains: 'Haryana', mode: 'insensitive' } },
              { address: { contains: 'Haryana', mode: 'insensitive' } },
              { location: { contains: 'Faridabad', mode: 'insensitive' } },
              { address: { contains: 'Faridabad', mode: 'insensitive' } },
            ],
          },
        });
      } else if (cityLower === 'delhi' || cityLower === 'delhi ncr' || cityLower === 'ncr') {
        conditions.push({
          ground: {
            OR: [
              { city: { equals: 'Delhi', mode: 'insensitive' } },
              { state: { equals: 'Delhi', mode: 'insensitive' } },
              { city: { equals: 'Noida', mode: 'insensitive' } },
              { city: { equals: 'Gurugram', mode: 'insensitive' } },
              { city: { equals: 'Faridabad', mode: 'insensitive' } },
              { location: { contains: 'Delhi', mode: 'insensitive' } },
              { address: { contains: 'Delhi', mode: 'insensitive' } },
            ],
          },
        });
      } else {
        conditions.push({
          ground: {
            OR: [
              { city: { equals: cityStr, mode: 'insensitive' } },
              { state: { equals: cityStr, mode: 'insensitive' } },
              { location: { contains: cityStr, mode: 'insensitive' } },
              { address: { contains: cityStr, mode: 'insensitive' } },
            ],
          },
        });
      }
    }

    if (search) {
      const searchStr = (search as string).trim();
      conditions.push({
        OR: [
          { sport: { contains: searchStr, mode: 'insensitive' } },
          { ground: { name: { contains: searchStr, mode: 'insensitive' } } },
          { ground: { location: { contains: searchStr, mode: 'insensitive' } } },
          { ground: { city: { contains: searchStr, mode: 'insensitive' } } },
          { ground: { address: { contains: searchStr, mode: 'insensitive' } } },
        ],
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const matches = await prisma.match.findMany({
      where,
      include: {
        ground: true,
      },
      orderBy: { date: 'asc' },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Matches retrieved successfully',
      data: { matches },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/matches/:id
export const getMatchById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        ground: true,
      },
    });

    if (!match) {
      throw new AppError('Match not found', HttpStatus.NOT_FOUND);
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Match retrieved successfully',
      data: { match },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/matches
export const createMatch = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const { groundId, sport, date, startTime, entryFee, totalPlayers, skillLevel } = req.body;

    const ground = await prisma.ground.findUnique({
      where: { id: groundId },
    });
    if (!ground) {
      throw new AppError('Ground not found', HttpStatus.NOT_FOUND);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new AppError('Host user not found', HttpStatus.NOT_FOUND);
    }

    const match = await prisma.match.create({
      data: {
        groundId,
        sport,
        date,
        startTime,
        entryFee: parseFloat(entryFee || 0),
        totalPlayers: parseInt(totalPlayers || 10, 10),
        skillLevel: skillLevel || 'Intermediate',
        hostId: userId,
        hostName: `${user.firstName} ${user.lastName}`,
        verifiedHost: user.role === 'OWNER' || user.role === 'ADMIN',
        status: 'Open',
        teamA: JSON.stringify([]),
        teamB: JSON.stringify([]),
      },
      include: {
        ground: true,
      },
    });

    // Broadcast update
    broadcastMatchUpdate(match.id, 'CREATED', match);

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Match created successfully',
      data: { match },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/matches/:id/join
export const joinMatch = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const id = req.params.id as string;
    const { team } = req.body; // 'A' or 'B'

    if (team !== 'A' && team !== 'B') {
      throw new AppError('Invalid team choice. Must be team A or team B.', HttpStatus.BAD_REQUEST);
    }

    const match = await prisma.match.findUnique({
      where: { id },
      include: { ground: true },
    }) as any;
    if (!match) {
      throw new AppError('Match not found', HttpStatus.NOT_FOUND);
    }

    if (match.playersJoined >= match.totalPlayers) {
      throw new AppError('Match is already full', HttpStatus.BAD_REQUEST);
    }

    // Parse team arrays
    const teamA = typeof match.teamA === 'string' ? JSON.parse(match.teamA) : (match.teamA || []);
    const teamB = typeof match.teamB === 'string' ? JSON.parse(match.teamB) : (match.teamB || []);

    // Check if user already joined
    const existsA = teamA.some((p: any) => p.id === userId);
    const existsB = teamB.some((p: any) => p.id === userId);
    if (existsA || existsB) {
      throw new AppError('You have already joined this match', HttpStatus.BAD_REQUEST);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new AppError('User not found', HttpStatus.NOT_FOUND);
    }

    if (user.walletBalance < match.entryFee) {
      throw new AppError('Insufficient wallet balance to join this match', HttpStatus.BAD_REQUEST);
    }

    const updatedMatch = await prisma.$transaction(async (tx) => {
      // 1. Deduct wallet balance
      if (match.entryFee > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { decrement: match.entryFee } },
        });

        // Log transaction
        await tx.walletTransaction.create({
          data: {
            userId,
            amount: match.entryFee,
            type: 'DEBIT',
            description: `Joined Match for ${match.sport} at ${match.ground.name}`,
          },
        });
      }

      // 2. Add player to team roster
      const playerDetails = { id: user.id, firstName: user.firstName, lastName: user.lastName };
      if (team === 'A') {
        teamA.push(playerDetails);
      } else {
        teamB.push(playerDetails);
      }

      const nextPlayersJoined = match.playersJoined + 1;
      let nextStatus = 'Open';

      const ratio = nextPlayersJoined / match.totalPlayers;
      if (nextPlayersJoined >= match.totalPlayers) {
        nextStatus = 'Match Full';
      } else if (ratio >= 0.95) {
        nextStatus = 'Almost Full';
      } else if (ratio >= 0.8) {
        nextStatus = 'Filling Fast';
      }

      const updated = await tx.match.update({
        where: { id },
        data: {
          playersJoined: nextPlayersJoined,
          status: nextStatus,
          teamA: JSON.stringify(teamA),
          teamB: JSON.stringify(teamB),
        },
        include: {
          ground: true,
        },
      });

      return updated;
    });

    // Send notifications & websockets broadcast
    await sendNotification(userId, {
      title: 'Joined Match!',
      message: `You successfully joined the ${match.sport} match at ${match.ground.name} on Team ${team}!`,
    });

    broadcastMatchUpdate(id, 'JOINED', updatedMatch);

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Joined match successfully',
      data: { match: updatedMatch },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/matches/:id
export const updateSlotCount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { totalPlayers } = req.body;

    const match = await prisma.match.findUnique({
      where: { id },
    });
    if (!match) {
      throw new AppError('Match not found', HttpStatus.NOT_FOUND);
    }

    const nextTotalPlayers = parseInt(totalPlayers, 10);
    if (nextTotalPlayers < match.playersJoined) {
      throw new AppError('Cannot reduce slots below currently joined players count', HttpStatus.BAD_REQUEST);
    }

    let nextStatus = 'Open';
    const ratio = match.playersJoined / nextTotalPlayers;
    if (match.playersJoined >= nextTotalPlayers) {
      nextStatus = 'Match Full';
    } else if (ratio >= 0.95) {
      nextStatus = 'Almost Full';
    } else if (ratio >= 0.8) {
      nextStatus = 'Filling Fast';
    }

    const updated = await prisma.match.update({
      where: { id },
      data: {
        totalPlayers: nextTotalPlayers,
        status: nextStatus,
      },
      include: {
        ground: true,
      },
    });

    broadcastMatchUpdate(id, 'UPDATED', updated);

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Slots updated successfully',
      data: { match: updated },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/matches/:id/leave
export const leaveMatch = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const id = req.params.id as string;

    const match = await prisma.match.findUnique({
      where: { id },
      include: { ground: true },
    }) as any;
    if (!match) {
      throw new AppError('Match not found', HttpStatus.NOT_FOUND);
    }

    // Parse team arrays
    let teamA = typeof match.teamA === 'string' ? JSON.parse(match.teamA) : (match.teamA || []);
    let teamB = typeof match.teamB === 'string' ? JSON.parse(match.teamB) : (match.teamB || []);

    const inA = teamA.some((p: any) => p.id === userId);
    const inB = teamB.some((p: any) => p.id === userId);

    if (!inA && !inB) {
      throw new AppError('You have not joined this match', HttpStatus.BAD_REQUEST);
    }

    // Remove player
    teamA = teamA.filter((p: any) => p.id !== userId);
    teamB = teamB.filter((p: any) => p.id !== userId);

    const nextPlayersJoined = Math.max(0, match.playersJoined - 1);
    let nextStatus = 'Open';
    const ratio = nextPlayersJoined / match.totalPlayers;
    if (nextPlayersJoined >= match.totalPlayers) {
      nextStatus = 'Match Full';
    } else if (ratio >= 0.95) {
      nextStatus = 'Almost Full';
    } else if (ratio >= 0.8) {
      nextStatus = 'Filling Fast';
    }

    const updatedMatch = await prisma.$transaction(async (tx) => {
      // 1. Refund wallet balance
      if (match.entryFee > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { increment: match.entryFee } },
        });

        // Log transaction
        await tx.walletTransaction.create({
          data: {
            userId,
            amount: match.entryFee,
            type: 'CREDIT',
            description: `Refund for leaving match at ${match.ground.name}`,
          },
        });
      }

      // 2. Update match roster
      const updated = await tx.match.update({
        where: { id },
        data: {
          playersJoined: nextPlayersJoined,
          status: nextStatus,
          teamA: JSON.stringify(teamA),
          teamB: JSON.stringify(teamB),
        },
        include: {
          ground: true,
        },
      });

      return updated;
    });

    // Send notifications & websockets broadcast
    await sendNotification(userId, {
      title: 'Left Match',
      message: `You successfully left the ${match.sport} match at ${match.ground.name}.`,
    });

    broadcastMatchUpdate(id, 'LEFT', updatedMatch);

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Left match successfully',
      data: { match: updatedMatch },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/matches/:id/booking
export const createPlayroomBooking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const id = req.params.id as string;
    const { bookingType, playerCount, captainName, teamName, couponCode, teamChoice, durationHours } = req.body;

    const match = await prisma.match.findUnique({
      where: { id },
      include: { ground: true },
    }) as any;

    if (!match) {
      throw new AppError('Match not found', HttpStatus.NOT_FOUND);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new AppError('User not found', HttpStatus.NOT_FOUND);
    }

    const effectiveBookingType = (bookingType === 'SINGLE' ? 'INDIVIDUAL' : bookingType) || 'INDIVIDUAL';

    // Check capacity and duplicate joining for individual/team bookings
    if (effectiveBookingType !== 'FULL_GROUND') {
      if (match.playersJoined >= match.totalPlayers) {
        throw new AppError('Match is already full', HttpStatus.BAD_REQUEST);
      }
      const teamA = typeof match.teamA === 'string' ? JSON.parse(match.teamA) : (match.teamA || []);
      const teamB = typeof match.teamB === 'string' ? JSON.parse(match.teamB) : (match.teamB || []);
      const existsA = teamA.some((p: any) => p.id === userId);
      const existsB = teamB.some((p: any) => p.id === userId);
      if (existsA || existsB) {
        throw new AppError('You have already joined this match', HttpStatus.BAD_REQUEST);
      }
    }

    // Calculate prices based on booking type
    let basePrice = 0;
    const count = parseInt(playerCount || '1', 10);
    const duration = parseInt(durationHours || '2', 10);

    if (effectiveBookingType === 'INDIVIDUAL') {
      basePrice = match.entryFee;
    } else if (effectiveBookingType === 'TEAM') {
      basePrice = match.entryFee * count;
    } else if (effectiveBookingType === 'FULL_GROUND') {
      basePrice = match.ground.pricePerHour * duration;
    }

    // Taxes & fees
    const gst = basePrice * 0.18;
    const platformFee = 20.0;
    let discount = 0;
    if (couponCode === 'BE11PLAY') {
      discount = 30.0;
    }

    const finalPrice = Math.max(0, basePrice + gst + platformFee - discount);

    if (user.walletBalance < finalPrice) {
      throw new AppError('Insufficient wallet credits to complete booking', HttpStatus.BAD_REQUEST);
    }

    // Process atomic checkout booking transaction
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Deduct wallet
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: finalPrice } },
      });

      // 2. Create Transaction receipt log
      await tx.walletTransaction.create({
        data: {
          userId,
          amount: -finalPrice,
          type: 'DEBIT',
          description: `Booking [${bookingType}] - ${match.ground.name}`,
        },
      });

      // 3. Create Booking DB entry with extended fields
      const newBooking = await tx.booking.create({
        data: {
          groundId: match.groundId,
          customerId: userId,
          date: match.date,
          startTime: match.startTime,
          endTime: match.startTime, // estimation
          totalPrice: finalPrice,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          bookingType,
          playerCount: count,
          captainName,
          teamName,
          groundReserved: bookingType === 'FULL_GROUND',
          invoice: `inv_m_${Math.floor(100000 + Math.random() * 900000)}`,
          transactionId: `tx_m_${Math.floor(10000000 + Math.random() * 90000000)}`,
          qrCode: `qr_m_${Math.floor(100000 + Math.random() * 900000)}`,
        },
        include: {
          ground: true,
        },
      });

      // 4. Update match rosters if not booking the entire ground
      if (effectiveBookingType !== 'FULL_GROUND') {
        const teamA = typeof match.teamA === 'string' ? JSON.parse(match.teamA) : (match.teamA || []);
        const teamB = typeof match.teamB === 'string' ? JSON.parse(match.teamB) : (match.teamB || []);
        const playerDetails = { id: user.id, firstName: user.firstName, lastName: user.lastName };

        // Auto assign or teamChoice
        const choice = teamChoice || (teamA.length <= teamB.length ? 'A' : 'B');
        if (effectiveBookingType === 'INDIVIDUAL') {
          if (choice === 'A') teamA.push(playerDetails);
          else teamB.push(playerDetails);
        } else if (effectiveBookingType === 'TEAM') {
          // Add captain plus team names mock placeholders
          teamA.push({ id: user.id, firstName: user.firstName, lastName: `(Captain - ${teamName})` });
          for (let i = 1; i < count; i++) {
            if (i % 2 === 0) {
              teamA.push({ id: `team-member-${i}`, firstName: `Squad Member ${i}`, lastName: '' });
            } else {
              teamB.push({ id: `team-member-${i}`, firstName: `Squad Member ${i}`, lastName: '' });
            }
          }
        }

        const nextPlayersJoined = Math.min(match.totalPlayers, match.playersJoined + count);
        let nextStatus = 'Open';
        if (nextPlayersJoined >= match.totalPlayers) nextStatus = 'Match Full';

        await tx.match.update({
          where: { id },
          data: {
            playersJoined: nextPlayersJoined,
            status: nextStatus,
            teamA: JSON.stringify(teamA),
            teamB: JSON.stringify(teamB),
          },
        });
      } else {
        // Mark match as reserved
        await tx.match.update({
          where: { id },
          data: {
            status: 'Reserved',
          },
        });
      }

      // 5. System Notification
      await tx.notification.create({
        data: {
          userId,
          title: `Playroom Booking Confirmed!`,
          message: `Your booking type [${effectiveBookingType}] at ${match.ground.name} has been successfully paid and reserved.`,
        },
      });

      return newBooking;
    });

    const updatedMatch = await prisma.match.findUnique({
      where: { id },
      include: { ground: true },
    });
    if (updatedMatch) {
      broadcastMatchUpdate(id, 'JOINED', updatedMatch);
    }

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};
