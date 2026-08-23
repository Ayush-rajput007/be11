import { Router } from 'express';
import { 
  topupWallet, 
  getTransactions, 
  createRazorpayOrder, 
  verifyRazorpayPayment, 
  paymentRefund 
} from './payments.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.use(authenticate as any);

router.post('/topup', topupWallet as any);
router.get('/transactions', getTransactions as any);
router.post('/create-order', createRazorpayOrder as any);
router.post('/verify', verifyRazorpayPayment as any);
router.post('/refund', paymentRefund as any);

export default router;
