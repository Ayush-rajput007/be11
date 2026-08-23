import { Router } from 'express';
import { getMyNotifications, markAsRead } from './notifications.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.use(authenticate as any);

router.get('/', getMyNotifications as any);
router.post('/:id/read', markAsRead as any);

export default router;
