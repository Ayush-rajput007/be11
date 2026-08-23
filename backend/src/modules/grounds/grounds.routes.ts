import { Router } from 'express';
import { getGrounds, getGroundById, createGround, getGroundSlots } from './grounds.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { USER_ROLES } from '@be11/shared';

const router = Router();

router.get('/', getGrounds);
router.get('/:id', getGroundById);
router.get('/:id/slots', getGroundSlots);
router.post('/', authenticate as any, authorize(USER_ROLES.OWNER, USER_ROLES.ADMIN) as any, createGround as any);

export default router;
