import { z } from 'zod';
import { USER_ROLES } from '../constants/index.js';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.enum([
    USER_ROLES.CUSTOMER,
    USER_ROLES.OWNER,
    USER_ROLES.ADMIN,
    USER_ROLES.COACH,
    USER_ROLES.ORGANIZER,
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.VENDOR,
    USER_ROLES.STORE_MANAGER,
    USER_ROLES.SUPPORT,
    USER_ROLES.PLAYER,
  ]).default(USER_ROLES.CUSTOMER),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const GroundCreateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(5, 'Location must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  pricePerHour: z.number().positive('Price must be greater than zero'),
  sport: z.string().min(1, 'Sport is required'),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  latitude: z.number().optional().default(0.0),
  longitude: z.number().optional().default(0.0),
});

export type GroundCreateInput = z.infer<typeof GroundCreateSchema>;

export const BookingCreateSchema = z.object({
  groundId: z.string().optional(),
  venueId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  matchPeriod: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'DAY_NIGHT', 'NIGHT', 'morning', 'afternoon', 'evening', 'day-night', 'dayNight', 'night']).optional(),
  bookingType: z.enum(['SINGLE_TEAM_OF_11', 'TEAM_OF_11', 'WHOLE_GROUND', 'ENTIRE_VENUE', 'single_team_of_11', 'team_of_11', 'whole_ground', 'entire_venue', 'INDIVIDUAL', 'individual', 'HALF_TEAM', 'half_team', 'HALF_TEAM_MATCH', 'half_team_match']).optional().default('WHOLE_GROUND'),
  customerName: z.string().min(1, 'Name is required').optional(),
  customerPhone: z.string().min(8, 'Phone number is required').optional(),
  customerEmail: z.string().email('Invalid email address').optional(),
  priceTier: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format').optional(),
}).refine((data) => data.groundId || data.venueId, {
  message: 'Either groundId or venueId is required',
  path: ['venueId'],
});

export type BookingCreateInput = z.infer<typeof BookingCreateSchema>;

export const ReviewCreateSchema = z.object({
  groundId: z.string().uuid('Invalid ground ID'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(3, 'Comment must be at least 3 characters'),
});

export type ReviewCreateInput = z.infer<typeof ReviewCreateSchema>;

export const BookingCancelSchema = z.object({
  cancellationReason: z.string().min(3, 'Cancellation reason must be at least 3 characters').optional(),
});

export type BookingCancelInput = z.infer<typeof BookingCancelSchema>;

