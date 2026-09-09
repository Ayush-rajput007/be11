import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

export const prisma = new PrismaClient();

let schemaEnsured = false;
export const ensureDatabaseSchema = async (): Promise<void> => {
  if (schemaEnsured) return;
  try {
    const isPostgres = process.env.DATABASE_URL?.includes('postgres');
    if (isPostgres) {
      const queries = [
        'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT false',
        'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneOtpHash" TEXT',
        'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneOtpExpiresAt" TIMESTAMP(3)',
        'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneOtpAttempts" INTEGER NOT NULL DEFAULT 0',
        'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneOtpLastSentAt" TIMESTAMP(3)',
        'CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone")',
      ];
      for (const q of queries) {
        await prisma.$executeRawUnsafe(q);
      }
      schemaEnsured = true;
      logger.info('✅ Phone verification schema columns and indexes verified in PostgreSQL');
    } else {
      schemaEnsured = true;
    }
  } catch (err: any) {
    logger.warn('⚠️ Non-fatal schema verification notice:', err?.message || err);
  }
};

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('📚 Database successfully connected via Prisma');
    await ensureDatabaseSchema();
  } catch (error) {
    logger.error('❌ Failed to connect to the database:', error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};
