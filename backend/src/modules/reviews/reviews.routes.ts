import { Router } from 'express';
import { createReview, getGroundReviews, deleteReview } from './reviews.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.get('/ground/:groundId', getGroundReviews);
router.post('/', authenticate as any, createReview as any);
router.delete('/:id', authenticate as any, deleteReview as any);

export default router;
