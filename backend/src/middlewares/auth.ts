import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { HttpStatus } from '@be11/shared';

export interface TokenPayload {
  userId: string;
  role: 'CUSTOMER' | 'OWNER' | 'ADMIN';
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized: Token missing', HttpStatus.UNAUTHORIZED));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError('Unauthorized: Invalid or expired token', HttpStatus.UNAUTHORIZED));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthorized', HttpStatus.UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Access denied', HttpStatus.FORBIDDEN));
    }

    next();
  };
};
