import { Router } from 'express';
import { getAdminDashboard } from './admin.dashboard.controller.js';
import { getAdminAnalytics, getAdminWalletTopups } from './admin.controller.js';
import {
  getAdminBookings,
  getAdminBookingStats,
  getAdminBookingById,
  confirmAdminBooking,
  cancelAdminBooking,
  getAdminVenueAvailability,
} from './admin.bookings.controller.js';
import {
  getAdminPayments,
  getAdminPaymentById,
  exportAdminPaymentsCsv,
} from './admin.payments.controller.js';
import {
  getAdminMatches,
  getAdminMatchById,
  createAdminMatch,
  cancelAdminMatch,
} from './admin.matches.controller.js';
import {
  getAdminReports,
  exportAdminBookingsCsv,
} from './admin.reports.controller.js';
import { getAdminVenues, getAdminAuditLogs } from './admin.venues.controller.js';
import { getAdminAiKnowledge, syncAdminAiKnowledge } from './admin.ai.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '@be11/shared';

const router = Router();

// ALL routes in /admin strictly require authenticated session with ADMIN or SUPER_ADMIN role
router.use(authenticate as any);
router.use(authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, 'ADMIN', 'SUPER_ADMIN') as any);

// 1. Unified Dashboard
router.get('/dashboard', getAdminDashboard as any);

// 2. Venue Bookings Management
router.get('/bookings', getAdminBookings as any);
router.get('/bookings/stats', getAdminBookingStats as any);
router.get('/bookings/export/csv', exportAdminBookingsCsv as any);
router.get('/bookings/:id', getAdminBookingById as any);
router.patch('/bookings/:id/confirm', confirmAdminBooking as any);
router.patch('/bookings/:id/cancel', cancelAdminBooking as any);
router.get('/venues/:venueId/availability', getAdminVenueAvailability as any);

// 3. Payments Ledger Management
router.get('/payments', getAdminPayments as any);
router.get('/payments/export/csv', exportAdminPaymentsCsv as any);
router.get('/payments/:id', getAdminPaymentById as any);

// 4. Live Matches Operations
router.get('/matches', getAdminMatches as any);
router.get('/matches/:id', getAdminMatchById as any);
router.post('/matches', createAdminMatch as any);
router.patch('/matches/:id/cancel', cancelAdminMatch as any);

// 5. Revenue & Operational Reports
router.get('/reports', getAdminReports as any);

// 6. Venues Management
router.get('/venues', getAdminVenues as any);

// 7. System Audit Log
router.get('/audit', getAdminAuditLogs as any);

// 8. AI Knowledge Management
router.get('/ai/knowledge', getAdminAiKnowledge as any);
router.post('/ai/knowledge/sync', syncAdminAiKnowledge as any);

// Legacy metrics endpoints
router.get('/analytics', getAdminAnalytics as any);
router.get('/wallet-topups', getAdminWalletTopups as any);

export default router;
