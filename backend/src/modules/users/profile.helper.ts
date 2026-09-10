import {
  CricketProfileDTO,
  FootballProfileDTO,
  UserDTO,
  CRICKET_ROLES,
  IPL_TEAMS,
  BATTING_STYLES,
  BOWLING_STYLES,
  FOOTBALL_POSITIONS,
  PREFERRED_FEET,
} from '@be11/shared';
import { AppError } from '../../utils/appError.js';
import { HttpStatus } from '@be11/shared';

export function formatUserProfile(user: any): UserDTO {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    walletBalance: user.walletBalance,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified ?? false,
    city: user.city || 'Mumbai',
    state: user.state || 'Maharashtra',
    favoriteSport: user.favoriteSport || 'Cricket',
    cricketProfile: {
      playingRole: user.cricketPlayingRole || null,
      favoriteIplTeam: user.favoriteIplTeam || null,
      favoritePlayer: user.favoriteCricketPlayer || null,
      battingStyle: user.battingStyle || null,
      bowlingStyle: user.bowlingStyle || null,
    },
    footballProfile: {
      position: user.footballPosition || null,
      favoriteClub: user.favoriteFootballClub || null,
      favoritePlayer: user.favoriteFootballPlayer || null,
      preferredFoot: user.preferredFoot || null,
    },
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
  };
}

export function buildProfileResponse(user: any) {
  const formattedUser = formatUserProfile(user);
  return {
    user: formattedUser,
    favoriteSport: formattedUser.favoriteSport,
    cricketProfile: formattedUser.cricketProfile,
    footballProfile: formattedUser.footballProfile,
  };
}

export function validateAndSanitizeSportsProfile(body: any) {
  const updateData: Record<string, any> = {};

  // Support favoriteSport
  if (body.favoriteSport !== undefined) {
    if (typeof body.favoriteSport !== 'string') {
      throw new AppError('Invalid favoriteSport format', HttpStatus.BAD_REQUEST);
    }
    const cleanSport = body.favoriteSport.trim();
    if (cleanSport && !['Cricket', 'Football', 'cricket', 'football'].includes(cleanSport)) {
      throw new AppError('Currently supported sports are Cricket and Football.', HttpStatus.BAD_REQUEST);
    }
    updateData.favoriteSport = cleanSport ? (cleanSport.toLowerCase() === 'football' ? 'Football' : 'Cricket') : null;
  }

  // Handle nested cricketProfile or flat fields
  const cricketInput = body.cricketProfile || {};
  const playingRole = cricketInput.playingRole !== undefined ? cricketInput.playingRole : body.cricketPlayingRole;
  const favoriteIplTeam = cricketInput.favoriteIplTeam !== undefined ? cricketInput.favoriteIplTeam : body.favoriteIplTeam;
  const favoriteCricketPlayer = cricketInput.favoritePlayer !== undefined ? cricketInput.favoritePlayer : body.favoriteCricketPlayer;
  const battingStyle = cricketInput.battingStyle !== undefined ? cricketInput.battingStyle : body.battingStyle;
  const bowlingStyle = cricketInput.bowlingStyle !== undefined ? cricketInput.bowlingStyle : body.bowlingStyle;

  if (playingRole !== undefined) {
    const val = typeof playingRole === 'string' ? playingRole.trim() : null;
    if (val && !CRICKET_ROLES.includes(val as any)) {
      throw new AppError(`Invalid cricket playing role: ${val}`, HttpStatus.BAD_REQUEST);
    }
    updateData.cricketPlayingRole = val || null;
  }

  if (favoriteIplTeam !== undefined) {
    const val = typeof favoriteIplTeam === 'string' ? favoriteIplTeam.trim() : null;
    if (val && !IPL_TEAMS.includes(val as any)) {
      throw new AppError(`Invalid favorite IPL team: ${val}`, HttpStatus.BAD_REQUEST);
    }
    updateData.favoriteIplTeam = val || null;
  }

  if (favoriteCricketPlayer !== undefined) {
    const val = typeof favoriteCricketPlayer === 'string' ? favoriteCricketPlayer.trim() : null;
    if (val && val.length > 80) {
      throw new AppError('Favorite cricket player name must be 80 characters or fewer.', HttpStatus.BAD_REQUEST);
    }
    updateData.favoriteCricketPlayer = val || null;
  }

  if (battingStyle !== undefined) {
    const val = typeof battingStyle === 'string' ? battingStyle.trim() : null;
    if (val && !BATTING_STYLES.includes(val as any)) {
      throw new AppError(`Invalid batting style: ${val}`, HttpStatus.BAD_REQUEST);
    }
    updateData.battingStyle = val || null;
  }

  if (bowlingStyle !== undefined) {
    const val = typeof bowlingStyle === 'string' ? bowlingStyle.trim() : null;
    if (val && !BOWLING_STYLES.includes(val as any)) {
      throw new AppError(`Invalid bowling style: ${val}`, HttpStatus.BAD_REQUEST);
    }
    updateData.bowlingStyle = val || null;
  }

  // Handle nested footballProfile or flat fields
  const footballInput = body.footballProfile || {};
  const position = footballInput.position !== undefined ? footballInput.position : body.footballPosition;
  const favoriteClub = footballInput.favoriteClub !== undefined ? footballInput.favoriteClub : body.favoriteFootballClub;
  const favoriteFootballPlayer = footballInput.favoritePlayer !== undefined ? footballInput.favoritePlayer : body.favoriteFootballPlayer;
  const preferredFoot = footballInput.preferredFoot !== undefined ? footballInput.preferredFoot : body.preferredFoot;

  if (position !== undefined) {
    const val = typeof position === 'string' ? position.trim() : null;
    if (val && !FOOTBALL_POSITIONS.includes(val as any)) {
      throw new AppError(`Invalid football position: ${val}`, HttpStatus.BAD_REQUEST);
    }
    updateData.footballPosition = val || null;
  }

  if (favoriteClub !== undefined) {
    const val = typeof favoriteClub === 'string' ? favoriteClub.trim() : null;
    if (val && val.length > 80) {
      throw new AppError('Favorite football club name must be 80 characters or fewer.', HttpStatus.BAD_REQUEST);
    }
    updateData.favoriteFootballClub = val || null;
  }

  if (favoriteFootballPlayer !== undefined) {
    const val = typeof favoriteFootballPlayer === 'string' ? favoriteFootballPlayer.trim() : null;
    if (val && val.length > 80) {
      throw new AppError('Favorite football player name must be 80 characters or fewer.', HttpStatus.BAD_REQUEST);
    }
    updateData.favoriteFootballPlayer = val || null;
  }

  if (preferredFoot !== undefined) {
    const val = typeof preferredFoot === 'string' ? preferredFoot.trim() : null;
    if (val && !PREFERRED_FEET.includes(val as any)) {
      throw new AppError(`Invalid preferred foot: ${val}`, HttpStatus.BAD_REQUEST);
    }
    updateData.preferredFoot = val || null;
  }

  return updateData;
}
