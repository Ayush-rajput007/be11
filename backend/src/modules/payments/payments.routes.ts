import { Router } from 'express';
import {
  getPublicKey,
  topupWallet,
  getTransactions,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createBookingPaymentOrder,
  verifyBookingPayment,
  paymentRefund,
  handleRazorpayWebhook,
} from './payments.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

// Publicly accessible payment helper endpoints
router.get('/public-key', getPublicKey as any);
router.post('/webhook', handleRazorpayWebhook as any);

// Authenticated payment actions
router.use(authenticate as any);

// Venue Booking Payments
router.post('/booking/create-order', createBookingPaymentOrder as any);
router.post('/booking/verify', verifyBookingPayment as any);

// Wallet & Top-up Payments
router.post('/topup', topupWallet as any);
router.get('/transactions', getTransactions as any);
router.post('/create-order', createRazorpayOrder as any);
router.post('/verify', verifyRazorpayPayment as any);
router.post('/refund', paymentRefund as any);

export default router;
