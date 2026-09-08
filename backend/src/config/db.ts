import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

export const prisma = new PrismaClient();

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('📚 Database successfully connected via Prisma');
  } catch (error) {
    logger.error('❌ Failed to connect to the database:', error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};
