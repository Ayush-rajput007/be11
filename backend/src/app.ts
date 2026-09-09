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

import http from 'http';
import { createRequire } from 'module';
import { Server as SocketIOServer } from 'socket.io';
import { setIoInstance } from './modules/notifications/notifications.controller.js';

// Statically trace package.json with @vercel/nft so the lambda bundle root contains package.json with type: module
const require = createRequire(import.meta.url);
try {
  require('../package.json');
} catch (_) {}

const app = express();

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: env.FRONTEND_URL || (env.NODE_ENV === 'development' ? 'http://localhost:5173' : true),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);
app.set('server', server);
setIoInstance(io);

app.use(helmet({
  crossOriginResourcePolicy: false
}));

app.use(
  cors({
    origin: env.FRONTEND_URL || (env.NODE_ENV === 'development' ? 'http://localhost:5173' : true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
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

app.get('/api/health', (req, res) => {
  res.status(HttpStatus.OK).json({
    success: true,
    message: 'BE11 API is running',
  });
});

// Socket.io handshake and polling handler for Express / serverless runtime
app.all('/socket.io*', (req, res, next) => {
  const io = app.get('io');
  if (io && io.engine) {
    io.engine.handleRequest(req, res);
  } else {
    next();
  }
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

export { app, server, io };
export default app;
