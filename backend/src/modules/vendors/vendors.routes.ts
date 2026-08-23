import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { registerVendor, getVendorRequests, approveVendorRequest } from './vendors.controller.js';

const router = Router();

router.post('/register', authenticate, registerVendor);
router.get('/requests', authenticate, getVendorRequests);
router.patch('/requests/:id/approve', authenticate, approveVendorRequest);

export default router;
