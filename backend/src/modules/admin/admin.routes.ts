import { Router } from 'express';
import { getAdminAnalytics } from './admin.controller.js';
import {
  getAdminBookings,
  getAdminBookingStats,
  getAdminBookingById,
  confirmAdminBooking,
  cancelAdminBooking,
  getAdminVenueAvailability,
} from './admin.bookings.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '@be11/shared';

const router = Router();

// All routes in /admin require authenticated session with ADMIN or SUPER_ADMIN role
router.use(authenticate as any);
router.use(authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, 'ADMIN', 'SUPER_ADMIN') as any);

// Analytics
router.get('/analytics', getAdminAnalytics as any);

// Venue Bookings Management
router.get('/bookings', getAdminBookings as any);
router.get('/bookings/stats', getAdminBookingStats as any);
router.get('/bookings/:id', getAdminBookingById as any);
router.patch('/bookings/:id/confirm', confirmAdminBooking as any);
router.patch('/bookings/:id/cancel', cancelAdminBooking as any);
router.get('/venues/:venueId/availability', getAdminVenueAvailability as any);

export default router;
