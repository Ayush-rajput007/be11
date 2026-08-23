import { Router } from 'express';
import { getAdminAnalytics } from './admin.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '@be11/shared';

const router = Router();

router.get(
  '/analytics',
  authenticate as any,
  authorize(USER_ROLES.ADMIN) as any,
  getAdminAnalytics as any
);

export default router;
