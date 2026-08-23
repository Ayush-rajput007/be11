import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

let redisClient: any = null;

export const connectRedis = (): any => {
  if (redisClient) return redisClient;

  // Fault-tolerant Redis connection with error handler to avoid unhandled exceptions
  try {
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    client.on('error', (err) => {
      logger.warn('⚠️ Local Redis connection failed or refused. Switching to silent mock memory client.');
      setupMockClient();
    });

    client.connect()
      .then(() => {
        logger.info('🔌 Redis successfully connected');
      })
      .catch((err) => {
        setupMockClient();
      });

    redisClient = client;
  } catch (error) {
    logger.warn('⚠️ Redis startup failed. Using silent mock memory client.');
    setupMockClient();
  }

  return redisClient;
};

const setupMockClient = () => {
  redisClient = {
    on: (event: string, callback: any) => {},
    get: async () => null,
    set: async () => 'OK',
    disconnect: () => {},
  };
};

export const getRedisClient = (): any => {
  if (!redisClient) return connectRedis();
  return redisClient;
};
