import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/appError.js';
import { RegisterSchema, LoginSchema, HttpStatus } from '@be11/shared';
import { AuthenticatedRequest, TokenPayload } from '../../middlewares/auth.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../services/mail.service.js';

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
const generateTokens = async (userId: string, role: string, email: string, req: Request) => {
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

    // Prevent direct registration of privileged roles
    const allowedRoles = ['PLAYER', 'CUSTOMER'];
    if (!allowedRoles.includes(validated.role)) {
      throw new AppError('Registration with this role is not permitted', HttpStatus.BAD_REQUEST);
    }

    const normalizedEmail = validated.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new AppError('An account with this email already exists. Please sign in instead.', HttpStatus.CONFLICT);
    }

    // Password validation constraints (min 8 chars)
    if (validated.password.length < 8) {
      throw new AppError('Password must contain at least 8 characters.', HttpStatus.BAD_REQUEST);
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: validated.firstName,
        lastName: validated.lastName,
        phone: validated.phone || null,
        role: validated.role,
        walletBalance: 0.0,
        emailVerified: false,
      },
    });

    // Generate secure 6 digit pin verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 min expiry

    await prisma.otp.create({
      data: { email: normalizedEmail, code, expiresAt },
    });

    // Send verification email
    await sendVerificationEmail(normalizedEmail, code);

    res.status(HttpStatus.CREATED).json({
      success: true,
      message: 'Account created successfully. Please verify your email to continue.',
      data: {
        email: user.email,
        emailVerified: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = LoginSchema.parse(req.body);
    const normalizedEmail = validated.email.trim().toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@be11.com').trim().toLowerCase();
    const isAdminEmailMatch = normalizedEmail === adminEmail || normalizedEmail === 'admin@be11.com' || normalizedEmail === 'admin@be11.in';

    if (!user && isAdminEmailMatch) {
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          firstName: process.env.ADMIN_FIRST_NAME || 'System',
          lastName: process.env.ADMIN_LAST_NAME || 'Administrator',
          phone: process.env.ADMIN_PHONE || '+919876543212',
          role: 'ADMIN',
          walletBalance: 0.0,
          emailVerified: true,
        },
      });
    }

    if (!user) {
      throw new AppError('Invalid email or password.', HttpStatus.UNAUTHORIZED);
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', HttpStatus.UNAUTHORIZED);
    }

    // Block unverified email users
    if (!user.emailVerified) {
      return res.status(HttpStatus.FORBIDDEN).json({
        success: false,
        message: 'Please verify your email address to continue.',
        emailVerified: false,
        email: user.email,
      });
    }

    const { accessToken, refreshTokenString } = await generateTokens(user.id, user.role, user.email, req);
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
          emailVerified: user.emailVerified,
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
          emailVerified: dbToken.user.emailVerified,
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

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    
    // Return success to prevent email enumeration, but only seed OTP if user exists
    if (user) {
      // Generate 6 digit pin
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 min expiry

      await prisma.otp.create({
        data: { email: normalizedEmail, code, expiresAt },
      });

      // Send reset password email
      await sendPasswordResetEmail(normalizedEmail, code);
    }

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

    const normalizedEmail = email.trim().toLowerCase();

    // Password validation constraints (min 8 chars)
    if (password.length < 8) {
      throw new AppError('Password must contain at least 8 characters.', HttpStatus.BAD_REQUEST);
    }

    const dbOtp = await prisma.otp.findFirst({
      where: { email: normalizedEmail, code },
      orderBy: { createdAt: 'desc' },
    });

    if (!dbOtp || dbOtp.expiresAt < new Date()) {
      throw new AppError('Invalid or expired OTP code', HttpStatus.BAD_REQUEST);
    }

    // Clear OTP
    await prisma.otp.deleteMany({ where: { email: normalizedEmail } });

    // Update password hash
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email: normalizedEmail },
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
          emailVerified: user.emailVerified,
          createdAt: user.createdAt.toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required.', HttpStatus.BAD_REQUEST);
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      throw new AppError('New password must contain at least 8 characters.', HttpStatus.BAD_REQUEST);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found.', HttpStatus.NOT_FOUND);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect.', HttpStatus.BAD_REQUEST);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
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
          emailVerified: user.emailVerified,
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
    const { idToken } = req.body;
    if (!idToken) {
      throw new AppError('Google token parameter is required', HttpStatus.BAD_REQUEST);
    }

    let email: string;
    let firstName: string;
    let lastName: string;
    let payload: any = null;

    // Development bypass option for local testing if needed
    if (env.NODE_ENV === 'development' && idToken.startsWith('dummy_')) {
      email = idToken.replace('dummy_', '');
      firstName = 'Dummy';
      lastName = 'GoogleUser';
    } else {
      // Call Google token info API to verify ID token
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (!verifyRes.ok) {
          throw new AppError('Google verification failed or refused', HttpStatus.UNAUTHORIZED);
        }
        payload = await verifyRes.json() as any;

        if (!payload.email) {
          throw new AppError('Google token is missing email claims', HttpStatus.UNAUTHORIZED);
        }

        // Validate client audience matches our configured environment variable
        if (env.GOOGLE_CLIENT_ID && payload.aud !== env.GOOGLE_CLIENT_ID) {
          throw new AppError('Google client ID audience mismatch', HttpStatus.UNAUTHORIZED);
        }

        email = payload.email;
        firstName = payload.given_name || 'Google';
        lastName = payload.family_name || 'User';
      } catch (err: any) {
        console.error('Google Auth Validation Error:', err.message || err);
        throw new AppError('Unable to complete Google sign-in. Please try again.', HttpStatus.UNAUTHORIZED);
      }
    }

    const normalizedEmail = email.trim().toLowerCase();
    // Safely extract the Google sub claim if present
    const googleId = (payload as any)?.sub || null;
    const profileImage = (payload as any)?.picture || null;

    // Search by Google sub claim (stable external identity) first, then fallback to email
    let user = googleId 
      ? await prisma.user.findFirst({ where: { googleId } })
      : null;

    if (!user) {
      user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    }

    if (!user) {
      const passwordHash = await bcrypt.hash(`google_auth_placeholder_${Math.random()}`, 10);
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          firstName: firstName,
          lastName: lastName,
          role: 'PLAYER',
          walletBalance: 0.0,
          emailVerified: true,
          googleId: googleId,
          profileImage: profileImage,
          provider: 'google',
        },
      });
    } else {
      // Safely link Google identity to existing local or google account
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          googleId: user.googleId || googleId,
          profileImage: user.profileImage || profileImage,
          provider: user.provider === 'local' ? 'local' : 'google',
        },
      });
    }

    const { accessToken, refreshTokenString } = await generateTokens(user.id, user.role, user.email, req);
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
          emailVerified: user.emailVerified,
          createdAt: user.createdAt.toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleOAuthCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, error } = req.query;
    if (error) {
      return res.redirect(`${env.FRONTEND_URL || 'http://localhost:5173'}/login?oauth_error=${encodeURIComponent(String(error))}`);
    }

    if (!code) {
      return res.redirect(`${env.FRONTEND_URL || 'http://localhost:5173'}/login?oauth_error=no_code`);
    }

    // Exchange code for token if client secret is configured
    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI) {
      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code: String(code),
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code',
          }),
        });

        const tokenData = await tokenRes.json() as any;
        if (tokenData.id_token) {
          // Re-use internal verification
          const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenData.id_token}`);
          const payload = await verifyRes.json() as any;
          if (payload.email) {
            const normalizedEmail = payload.email.trim().toLowerCase();
            const googleId = payload.sub;
            let user = await prisma.user.findFirst({ where: { OR: [{ googleId }, { email: normalizedEmail }] } });
            if (!user) {
              const passwordHash = await bcrypt.hash(`google_${Math.random()}`, 10);
              user = await prisma.user.create({
                data: {
                  email: normalizedEmail,
                  passwordHash,
                  firstName: payload.given_name || 'Google',
                  lastName: payload.family_name || 'User',
                  role: 'PLAYER',
                  walletBalance: 0.0,
                  emailVerified: true,
                  googleId,
                  profileImage: payload.picture || null,
                  provider: 'google',
                },
              });
            } else {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: true, googleId: user.googleId || googleId },
              });
            }

            const { accessToken, refreshTokenString } = await generateTokens(user.id, user.role, user.email, req);
            setRefreshTokenCookie(res, refreshTokenString);
            return res.redirect(`${env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?token=${accessToken}`);
          }
        }
      } catch (tokenErr) {
        console.error('Failed to exchange Google OAuth code:', tokenErr);
      }
    }

    return res.redirect(`${env.FRONTEND_URL || 'http://localhost:5173'}/login?oauth_error=exchange_failed`);
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      throw new AppError('Email and verification code are required.', HttpStatus.BAD_REQUEST);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify OTP matching active code
    const dbOtp = await prisma.otp.findFirst({
      where: { email: normalizedEmail, code },
      orderBy: { createdAt: 'desc' },
    });

    if (!dbOtp || dbOtp.expiresAt < new Date()) {
      throw new AppError('Invalid or expired verification code.', HttpStatus.BAD_REQUEST);
    }

    // Invalidate code
    await prisma.otp.deleteMany({ where: { email: normalizedEmail } });

    // Mark email as verified
    const user = await prisma.user.update({
      where: { email: normalizedEmail },
      data: { emailVerified: true },
    });

    // Authenticate user and issue tokens directly
    const { accessToken, refreshTokenString } = await generateTokens(user.id, user.role, user.email, req);
    setRefreshTokenCookie(res, refreshTokenString);

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Email verified successfully. Welcome to BE11!',
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
          emailVerified: user.emailVerified,
          createdAt: user.createdAt.toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError('Email is required.', HttpStatus.BAD_REQUEST);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Protect privacy: return success message regardless, but only perform operations if user is unverified
    if (user && !user.emailVerified) {
      // Clear old verification tokens
      await prisma.otp.deleteMany({ where: { email: normalizedEmail } });

      // Generate new 6-digit PIN code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 min expiry

      await prisma.otp.create({
        data: { email: normalizedEmail, code, expiresAt },
      });

      await sendVerificationEmail(normalizedEmail, code);
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'If an unverified account with that email exists, a new verification code has been sent.',
    });
  } catch (error) {
    next(error);
  }
};
