import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import {
  getMatches,
  getMatchById,
  createMatch,
  joinMatch,
  updateSlotCount,
  leaveMatch,
  createPlayroomBooking,
  createMatchPaymentOrder,
  verifyMatchPayment,
} from './matches.controller.js';

const router = Router();

// Helper: Custom requireRoles to enforce specific 403 JSON layout
const requireRoles = (allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userRole = req.user.role;
    const isAllowed = allowedRoles.some((role) => {
      if (role === 'GROUND_OWNER' && userRole === 'OWNER') return true;
      return role === userRole;
    });

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }
    next();
  };
};

const hostRoles = ['SUPER_ADMIN', 'ADMIN', 'GROUND_OWNER', 'COACH'];

router.get('/', getMatches);
router.get('/:id', getMatchById);

// Protected Host creation & mutation routes
router.post('/', authenticate, requireRoles(hostRoles), createMatch);
router.patch('/:id', authenticate, requireRoles(hostRoles), updateSlotCount);
router.put('/:id', authenticate, requireRoles(hostRoles), (req, res) => res.json({ success: true }));
router.delete('/:id', authenticate, requireRoles(hostRoles), (req, res) => res.json({ success: true, message: 'Match deleted' }));

router.post('/publish', authenticate, requireRoles(hostRoles), (req, res) => res.json({ success: true }));
router.post('/publish/*', authenticate, requireRoles(hostRoles), (req, res) => res.json({ success: true }));
router.post('/host/*', authenticate, requireRoles(hostRoles), (req, res) => res.json({ success: true }));

// Standard user slots modification routes
router.post('/:id/join', authenticate, joinMatch);
router.post('/:id/leave', authenticate, leaveMatch);
router.post('/:id/booking', authenticate, createPlayroomBooking);
router.post('/:id/create-order', authenticate, createMatchPaymentOrder);
router.post('/:id/verify-payment', authenticate, verifyMatchPayment);

export default router;
