import { Router } from 'express';
import { 
  register, login, getMe, logout, refresh, 
  forgotPassword, resetPassword, sendOtp, verifyOtp, 
  getSessions, logoutAllDevices, googleAuth, updateProfile
} from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Authenticated routes
router.get('/me', authenticate as any, getMe as any);
router.get('/sessions', authenticate as any, getSessions as any);
router.post('/logout-all', authenticate as any, logoutAllDevices as any);
router.patch('/profile', authenticate as any, updateProfile as any);

// Mock Google Auth endpoint
router.post('/google', googleAuth);

export default router;
