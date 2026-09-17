import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { chatHandler, healthHandler, syncKnowledgeHandler } from './ai.controller.js';
import { env } from '../../config/env.js';
import { TokenPayload } from '../../middlewares/auth.js';

const router = Router();

// Optional JWT authentication: populates req.user if a valid token is sent
const optionalAuthenticate = (req: any, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      req.user = decoded;
    } catch {
      // Ignore invalid token for public chat
    }
  }
  next();
};

// Rate limiter for AI chat: 60 requests per minute per IP
const aiChatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'Too many requests to BE11 AI Assistant. Please wait a moment before asking again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI endpoints
router.get('/health', healthHandler);
router.post('/chat', aiChatRateLimiter, optionalAuthenticate, chatHandler);
router.post('/knowledge/sync', optionalAuthenticate, syncKnowledgeHandler);

export default router;
