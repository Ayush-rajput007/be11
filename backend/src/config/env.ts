import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/be11'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters').default('be11-default-jwt-secret-key-change-in-production'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  FRONTEND_URL: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return undefined;
      if (!val.startsWith('http://') && !val.startsWith('https://')) {
        return `https://${val}`;
      }
      return val;
    }),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('⚠️ Environment variable parsing warnings:', parsed.error.format());
}

export const env: Env = parsed.success
  ? parsed.data
  : {
      PORT: 5000,
      NODE_ENV: (process.env.NODE_ENV as any) || 'production',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/be11',
      JWT_SECRET: process.env.JWT_SECRET || 'be11-default-jwt-secret-key-change-in-production',
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
      FRONTEND_URL: process.env.FRONTEND_URL || undefined,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || undefined,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || undefined,
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || undefined,
      SMTP_HOST: process.env.SMTP_HOST || undefined,
      SMTP_PORT: process.env.SMTP_PORT || undefined,
      SMTP_USER: process.env.SMTP_USER || undefined,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD || undefined,
      EMAIL_FROM: process.env.EMAIL_FROM || undefined,
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || undefined,
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || undefined,
      RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || undefined,
    };

