import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/appError.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import { HttpStatus } from '@be11/shared';

export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || undefined;

  if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
    logger.error(`💥 Internal Error: ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`⚠️ Warning [${statusCode}] ${req.method} ${req.originalUrl} - ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
