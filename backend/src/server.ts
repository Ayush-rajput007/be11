import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { setIoInstance } from './modules/notifications/notifications.controller.js';

process.on('uncaughtException', (err: Error) => {
  logger.error('💥 Uncaught Exception! Shutting down server...', err);
  process.exit(1);
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.FRONTEND_URL || (env.NODE_ENV === 'development' ? 'http://localhost:5173' : true),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Configure Socket.io notifications controller hooks
setIoInstance(io);

const startServer = async () => {
  await connectDatabase();

  try {
    connectRedis();
  } catch (error) {
    logger.error('⚠️ Redis connection failed', error);
  }

  const port = env.PORT;
  server.listen(port, () => {
    logger.info(`🚀 Server running on port ${port} in ${env.NODE_ENV} mode`);
  });
};

startServer().catch((error) => {
  logger.error('💥 Server startup failed:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('💥 Unhandled Rejection! Shutting down server...', reason);
  server.close(() => {
    process.exit(1);
  });
});
