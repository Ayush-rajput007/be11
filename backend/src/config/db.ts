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
        `CREATE TABLE IF NOT EXISTS "WalletTopUp" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          "amount" DOUBLE PRECISION NOT NULL,
          "currency" TEXT NOT NULL DEFAULT 'INR',
          "status" TEXT NOT NULL DEFAULT 'CREATED',
          "razorpayOrderId" TEXT NOT NULL,
          "razorpayPaymentId" TEXT,
          "razorpaySignature" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
        'CREATE UNIQUE INDEX IF NOT EXISTS "WalletTopUp_razorpayOrderId_key" ON "WalletTopUp"("razorpayOrderId")',
        'CREATE UNIQUE INDEX IF NOT EXISTS "WalletTopUp_razorpayPaymentId_key" ON "WalletTopUp"("razorpayPaymentId")',
        'CREATE INDEX IF NOT EXISTS "WalletTopUp_userId_idx" ON "WalletTopUp"("userId")',
        'CREATE INDEX IF NOT EXISTS "WalletTopUp_status_idx" ON "WalletTopUp"("status")',
        'ALTER TABLE "WalletTransaction" ADD COLUMN IF NOT EXISTS "razorpayOrderId" TEXT',
        'ALTER TABLE "WalletTransaction" ADD COLUMN IF NOT EXISTS "razorpayPaymentId" TEXT',
      ];
      for (const q of queries) {
        await prisma.$executeRawUnsafe(q);
      }
      schemaEnsured = true;
      logger.info('✅ Database schema verified in PostgreSQL (Phone auth, WalletTopUp & transactions)');
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
