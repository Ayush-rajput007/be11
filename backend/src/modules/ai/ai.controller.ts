import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AiService } from './ai.service.js';
import { syncAiKnowledge } from './knowledge/knowledge.sync.js';
import { KnowledgeStore } from './knowledge/knowledge.store.js';
import { AppError } from '../../utils/appError.js';
import { HttpStatus } from '@be11/shared';

const ChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message cannot exceed 1000 characters'),
  conversationId: z.string().optional(),
  pageContext: z
    .object({
      route: z.string().optional(),
      page: z.string().optional(),
      venueId: z.string().optional(),
      matchId: z.string().optional(),
      sport: z.string().optional(),
    })
    .optional(),
});

export const chatHandler = async (req: any, res: Response, next: NextFunction) => {
  try {
    const parseResult = ChatSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError(parseResult.error.issues[0]?.message || 'Invalid chat request', HttpStatus.BAD_REQUEST);
    }

    const { message, conversationId, pageContext } = parseResult.data;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const aiService = AiService.getInstance();
    const result = await aiService.handleChat({
      message,
      conversationId,
      pageContext,
      userId,
      userRole,
    });

    res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const healthHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const store = KnowledgeStore.getInstance();
    const summary = store.getIndexSummary();

    res.status(HttpStatus.OK).json({
      success: true,
      status: 'operational',
      model: 'BE11-AI-Hybrid',
      lastSyncTimestamp: summary.lastSyncTimestamp,
      indexedItemsCount: summary.itemCount,
      categoriesCount: summary.categories.length,
      categories: summary.categories,
    });
  } catch (error) {
    next(error);
  }
};

export const syncKnowledgeHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await syncAiKnowledge();
    res.status(HttpStatus.OK).json({
      success: true,
      message: 'AI knowledge synchronized successfully',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};
