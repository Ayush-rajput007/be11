import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import {
  getTournaments,
  getTournamentById,
  registerTeam,
  cancelRegistration,
  toggleFavorite,
  getFavorites,
  getLiveMatches,
  addTournamentReview,
  createTournament
} from './tournaments.controller.js';

const router = Router();

router.get('/', getTournaments);
router.get('/live/matches', getLiveMatches);
router.get('/favs/my', authenticate, getFavorites);
router.get('/:id', getTournamentById);
router.post('/:id/register', authenticate, registerTeam);
router.post('/:id/cancel', authenticate, cancelRegistration);
router.post('/:id/favorite', authenticate, toggleFavorite);
router.post('/:id/reviews', authenticate, addTournamentReview);
router.post('/admin/create', authenticate, createTournament);

export default router;
