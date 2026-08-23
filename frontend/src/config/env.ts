import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:5000'),
});

const parsed = envSchema.safeParse((import.meta as any).env);

export const env = parsed.success ? parsed.data : { VITE_API_URL: 'http://localhost:5000' };
export const API_URL = env.VITE_API_URL;
export const API_V1_URL = `${API_URL}/api/v1`;
