import { Router } from 'express';
import {
  createWalletTopupOrder,
  verifyWalletTopup,
  cancelWalletTopup,
  getTransactions,
} from '../payments/payments.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

// Authenticated wallet operations
router.use(authenticate as any);

// Wallet Top-up with Razorpay
router.post('/topup/create-order', createWalletTopupOrder as any);
router.post('/topup/verify', verifyWalletTopup as any);
router.post('/topup/cancel', cancelWalletTopup as any);

// Wallet Ledger Transactions
router.get('/transactions', getTransactions as any);

export default router;
