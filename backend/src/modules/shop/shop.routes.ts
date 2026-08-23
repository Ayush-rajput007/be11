import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import {
  getProducts,
  getProductById,
  createOrder,
  getUserOrders,
  getAdminOrders,
  saveJerseyDesign,
  getSavedJerseys,
  updateSavedJersey,
  deleteSavedJersey,
  getJerseyTemplates,
  getUserAddresses,
  addUserAddress,
  deleteUserAddress,
  addProductReview,
  submitProductReturn,
  getCoupons,
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
} from './shop.controller.js';

const router = Router();

router.get('/products', getProducts as any);
router.get('/products/:id', getProductById as any);
router.post('/orders', authenticate as any, createOrder as any);
router.get('/orders/my', authenticate as any, getUserOrders as any);
router.get('/orders/admin', authenticate as any, getAdminOrders as any);

// Jersey design workspace endpoints
router.post('/jerseys/saved', authenticate as any, saveJerseyDesign as any);
router.get('/jerseys/saved', authenticate as any, getSavedJerseys as any);
router.put('/jerseys/saved/:id', authenticate as any, updateSavedJersey as any);
router.delete('/jerseys/saved/:id', authenticate as any, deleteSavedJersey as any);
router.get('/jerseys/templates', getJerseyTemplates as any);

// New e-commerce endpoints
router.get('/addresses', authenticate as any, getUserAddresses as any);
router.post('/addresses', authenticate as any, addUserAddress as any);
router.delete('/addresses/:id', authenticate as any, deleteUserAddress as any);
router.post('/products/:id/reviews', authenticate as any, addProductReview as any);
router.post('/orders/:id/return', authenticate as any, submitProductReturn as any);
router.get('/coupons', getCoupons as any);

// Payments simulator
router.post('/payments/create-order', authenticate as any, createRazorpayOrder as any);
router.post('/payments/verify', authenticate as any, verifyRazorpayPayment as any);
router.post('/payments/webhook', razorpayWebhook as any);

export default router;
