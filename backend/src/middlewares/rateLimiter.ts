import { rateLimit } from 'express-rate-limit';
import { HttpStatus } from '@be11/shared';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  statusCode: HttpStatus.TOO_MANY_REQUESTS,
});
