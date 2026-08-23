import { Router } from 'express';
import { updateProfile, toggleFavorite, getFavorites } from './users.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.use(authenticate as any);

router.patch('/profile', updateProfile as any);
router.post('/favorites/:groundId', toggleFavorite as any);
router.get('/favorites', getFavorites as any);

export default router;
