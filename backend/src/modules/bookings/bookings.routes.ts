import { Router } from 'express';
import { createBooking, getMyBookings, cancelBooking } from './bookings.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.use(authenticate as any);

router.post('/', createBooking as any);
router.get('/my', getMyBookings as any);
router.post('/:id/cancel', cancelBooking as any);

export default router;
