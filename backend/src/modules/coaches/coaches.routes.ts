import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import {
  getCoaches,
  getAcademies,
  getCamps,
  getCoachById,
  applyAsCoach,
  joinCamp,
  bookSession,
  getStudentTrainings,
  getCoachDashboard,
  markAttendance,
  createCamp,
  awardCertificate,
} from './coaches.controller.js';

const router = Router();

// Public routes
router.get('/', getCoaches as any);
router.get('/academies', getAcademies as any);
router.get('/camps', getCamps as any);
router.get('/:id', getCoachById as any);

// Protected student routes
router.post('/apply', authenticate as any, applyAsCoach as any);
router.post('/camps/:id/join', authenticate as any, joinCamp as any);
router.post('/:id/book', authenticate as any, bookSession as any);
router.get('/student/trainings', authenticate as any, getStudentTrainings as any);

// Protected coach workspace routes
router.get('/coach/dashboard', authenticate as any, getCoachDashboard as any);
router.post('/dashboard/attendance', authenticate as any, markAttendance as any);
router.post('/dashboard/camps', authenticate as any, createCamp as any);
router.post('/dashboard/feedback', authenticate as any, awardCertificate as any);

export default router;
