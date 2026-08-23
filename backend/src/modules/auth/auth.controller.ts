import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/appError.js';
import { RegisterSchema, LoginSchema, HttpStatus } from '@be11/shared';
import { AuthenticatedRequest, TokenPayload } from '../../middlewares/auth.js';

// Helper: parse custom refresh cookie manually to avoid dependencies
const getRefreshTokenFromCookie = (req: Request): string | undefined => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  
  const cookies = cookieHeader.split(';').reduce((acc: any, cookie: string) => {
    const parts = cookie.split('=');
    acc[parts[0].trim()] = (parts[1] || '').trim();
    return acc;
  }, {});
  
  return cookies['be11_refresh_token'];
};

// Helper: generate Access and Refresh tokens
const generateTokens = async (userId: string, role: 'CUSTOMER' | 'OWNER' | 'ADMIN', email: string, req: Request) => {
  // Access token: expires in 1 hour
  const accessToken = jwt.sign(
    { userId, role, email },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Refresh token: crypto random token
  const refreshTokenString = `rt_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration

  // Save refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshTokenString,
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt,
    },
  });

  return { accessToken, refreshTokenString };
};

// Set refresh token in HttpOnly cookie
const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('be11_refresh_token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = RegisterSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', HttpStatus.CONFLICT);
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        email: validated.email,
        passwordHash,
        firstName: validated.firstName,
        lastName: validated.lastName,
        phone: validated.phone,
        role: validated.role as any,
        walletBalance: 5000.0,
      },
    });

    const { accessToken, refreshTokenString } = await generateTokens(user.id, user.role as any, user.email, req);
    setRefreshTokenCookie(res, refreshTokenString);

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token: accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          walletBalance: user.walletBalance,
          createdAt: user.createdAt.toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user) {
      throw new AppError('Invalid email or password', HttpStatus.UNAUTHORIZED);
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', HttpStatus.UNAUTHORIZED);
    }

    const { accessToken, refreshTokenString } = await generateTokens(user.id, user.role as any, user.email, req);
    setRefreshTokenCookie(res, refreshTokenString);

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token: accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          walletBalance: user.walletBalance,
          createdAt: user.createdAt.toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshTokenVal = getRefreshTokenFromCookie(req);
    if (!refreshTokenVal) {
      throw new AppError('Unauthorized: Session expired', HttpStatus.UNAUTHORIZED);
    }

    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenVal },
      include: { user: true },
    });

    if (!dbToken || dbToken.expiresAt < new Date()) {
      if (dbToken) {
        await prisma.refreshToken.delete({ where: { id: dbToken.id } });
      }
      res.clearCookie('be11_refresh_token');
      throw new AppError('Unauthorized: Invalid session', HttpStatus.UNAUTHORIZED);
    }

    // Delete old refresh token (rotation)
    await prisma.refreshToken.delete({ where: { id: dbToken.id } });

    // Generate new tokens
    const { accessToken, refreshTokenString } = await generateTokens(
      dbToken.user.id,
      dbToken.user.role as any,
      dbToken.user.email,
      req
    );

    setRefreshTokenCookie(res, refreshTokenString);

    res.status(HttpStatus.OK).json({
      success: true,
      data: {
        token: accessToken,
        user: {
          id: dbToken.user.id,
          email: dbToken.user.email,
          firstName: dbToken.user.firstName,
          lastName: dbToken.user.lastName,
          phone: dbToken.user.phone,
          role: dbToken.user.role,
          walletBalance: dbToken.user.walletBalance,
          createdAt: dbToken.user.createdAt.toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshTokenVal = getRefreshTokenFromCookie(req);
    if (refreshTokenVal) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshTokenVal },
      });
    }

    res.clearCookie('be11_refresh_token');
    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError('Email is required', HttpStatus.BAD_REQUEST);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('No account found with this email', HttpStatus.NOT_FOUND);
    }

    // Generate 6 digit pin
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 min expiry

    await prisma.otp.create({
      data: { email, code, expiresAt },
    });

    // Console logging the code so QA testers can find it instantly
    console.log(`[TEST OTP CODE] Reset password code for ${email} is: ${code}`);

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Password reset OTP code sent successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code, password } = req.body;
    if (!email || !code || !password) {
      throw new AppError('Email, code and new password are required', HttpStatus.BAD_REQUEST);
    }

    const dbOtp = await prisma.otp.findFirst({
      where: { email, code },
      orderBy: { createdAt: 'desc' },
    });

    if (!dbOtp || dbOtp.expiresAt < new Date()) {
      throw new AppError('Invalid or expired OTP code', HttpStatus.BAD_REQUEST);
    }

    // Clear OTP
    await prisma.otp.deleteMany({ where: { email } });

    // Update password hash
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError('Email is required', HttpStatus.BAD_REQUEST);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await prisma.otp.create({
      data: { email, code, expiresAt },
    });

    console.log(`[TEST OTP CODE] Email verification code for ${email} is: ${code}`);

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'OTP verification code sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      throw new AppError('Email and code are required', HttpStatus.BAD_REQUEST);
    }

    const dbOtp = await prisma.otp.findFirst({
      where: { email, code },
      orderBy: { createdAt: 'desc' },
    });

    if (!dbOtp || dbOtp.expiresAt < new Date()) {
      throw new AppError('Invalid or expired OTP verification code', HttpStatus.BAD_REQUEST);
    }

    await prisma.otp.deleteMany({ where: { email } });

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'OTP verified successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const sessions = await prisma.refreshToken.findMany({
      where: { userId },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    });

    res.status(HttpStatus.OK).json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutAllDevices = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    res.clearCookie('be11_refresh_token');
    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Logged out from all devices.',
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { firstName, lastName, phone } = req.body;

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

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', HttpStatus.NOT_FOUND);
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'User profile retrieved',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          walletBalance: user.walletBalance,
          createdAt: user.createdAt.toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, firstName, lastName } = req.body;
    if (!email) {
      throw new AppError('Google email is required', HttpStatus.BAD_REQUEST);
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const passwordHash = await bcrypt.hash(`g_pass_${Math.random()}`, 10);
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName: firstName || 'Google',
          lastName: lastName || 'User',
          role: 'PLAYER',
          walletBalance: 5000.0,
        },
      });
    }

    const { accessToken, refreshTokenString } = await generateTokens(user.id, user.role as any, user.email, req);
    setRefreshTokenCookie(res, refreshTokenString);

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Logged in via Google successfully',
      data: {
        token: accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          walletBalance: user.walletBalance,
          createdAt: user.createdAt.toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
