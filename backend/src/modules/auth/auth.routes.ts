import { Router } from 'express';
import { 
  register, login, getMe, logout, refresh, 
  forgotPassword, resetPassword, sendOtp, verifyOtp, 
  getSessions, logoutAllDevices, googleAuth, googleOAuthCallback, updateProfile,
  verifyEmail, resendVerification, changePassword,
  sendPhoneOtp, verifyPhoneOtp
} from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { authRateLimiter } from '../../middlewares/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.post('/send-otp', authRateLimiter, sendOtp);
router.post('/verify-otp', authRateLimiter, verifyOtp);
router.post('/send-phone-otp', authRateLimiter, sendPhoneOtp);
router.post('/verify-phone-otp', authRateLimiter, verifyPhoneOtp);
router.post('/verify-email', authRateLimiter, verifyEmail);
router.post('/resend-verification', authRateLimiter, resendVerification);

// Authenticated routes
router.get('/me', authenticate as any, getMe as any);
router.get('/sessions', authenticate as any, getSessions as any);
router.post('/logout-all', authenticate as any, logoutAllDevices as any);
router.patch('/profile', authenticate as any, updateProfile as any);
router.post('/change-password', authenticate as any, changePassword as any);

// Google Auth endpoints
router.post('/google', authRateLimiter, googleAuth);
router.get('/google/callback', googleOAuthCallback);

export default router;
