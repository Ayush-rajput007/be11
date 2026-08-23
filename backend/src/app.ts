import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './utils/appError.js';
import { HttpStatus } from '@be11/shared';

// Import routers
import authRouter from './modules/auth/auth.routes.js';
import usersRouter from './modules/users/users.routes.js';
import groundsRouter from './modules/grounds/grounds.routes.js';
import bookingsRouter from './modules/bookings/bookings.routes.js';
import paymentsRouter from './modules/payments/payments.routes.js';
import notificationsRouter from './modules/notifications/notifications.routes.js';
import reviewsRouter from './modules/reviews/reviews.routes.js';
import adminRouter from './modules/admin/admin.routes.js';
import vendorsRouter from './modules/vendors/vendors.routes.js';
import shopRouter from './modules/shop/shop.routes.js';
import tournamentsRouter from './modules/tournaments/tournaments.routes.js';
import matchesRouter from './modules/matches/matches.routes.js';
import coachesRouter from './modules/coaches/coaches.routes.js';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false
}));

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const morganFormat = env.NODE_ENV === 'development' ? 'dev' : 'combined';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Health Check
app.get('/health', (req, res) => {
  res.status(HttpStatus.OK).json({
    success: true,
    message: 'be11 Backend API is fully operational',
    timestamp: new Date().toISOString(),
  });
});

// Apply rate limiter to general api endpoints
app.use('/api', rateLimiter);

// Register routers
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/grounds', groundsRouter);
app.use('/api/v1/bookings', bookingsRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/vendors', vendorsRouter);
app.use('/api/v1/shop', shopRouter);
app.use('/api/v1/tournaments', tournamentsRouter);
app.use('/api/v1/matches', matchesRouter);
app.use('/api/v1/coaches', coachesRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server`, HttpStatus.NOT_FOUND));
});

app.use(errorHandler);

export default app;
