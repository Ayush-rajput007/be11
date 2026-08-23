import { z } from 'zod';

const isDev = (import.meta as any).env.DEV;
const defaultApiUrl = isDev ? 'http://localhost:5000' : '';

const envSchema = z.object({
  VITE_API_URL: z.string().default(defaultApiUrl),
});

const parsed = envSchema.safeParse((import.meta as any).env);

export const env = parsed.success ? parsed.data : { VITE_API_URL: defaultApiUrl };
export const API_URL = env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
export const API_V1_URL = API_URL ? `${API_URL}/api/v1` : '/api/v1';
