import { Router } from 'express';
import {
  trackVisitor,
  trackSession,
  trackPageView,
  syncVisitor,
  getAdminOverview,
  getAdminVisitors,
  getAdminPageViews,
  getAdminTrends,
  getAdminTopPages,
} from './analytics.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '@be11/shared';

const router = Router();

// ==========================================
// 1. Public Analytics Tracking Endpoints
// ==========================================
router.post('/visitor', trackVisitor as any);
router.post('/session', trackSession as any);
router.post('/pageview', trackPageView as any);
router.post('/sync', syncVisitor as any);

// ==========================================
// 2. Admin-Only Protected Analytics Endpoints
// ==========================================
const adminAuth = [
  authenticate as any,
  authorize(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, 'ADMIN', 'SUPER_ADMIN') as any,
];

router.get('/overview', ...adminAuth, getAdminOverview as any);
router.get('/visitors', ...adminAuth, getAdminVisitors as any);
router.get('/pageviews', ...adminAuth, getAdminPageViews as any);
router.get('/trends', ...adminAuth, getAdminTrends as any);
router.get('/top-pages', ...adminAuth, getAdminTopPages as any);

export default router;
