import { Request, Response, NextFunction } from 'express';
import { KnowledgeStore } from '../ai/knowledge/knowledge.store.js';
import { syncAiKnowledge } from '../ai/knowledge/knowledge.sync.js';
import { AiAnalytics } from '../ai/ai.analytics.js';
import { HttpStatus } from '@be11/shared';

export const getAdminAiKnowledge = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = KnowledgeStore.getInstance();
    const analytics = AiAnalytics.getInstance();

    const summary = store.getIndexSummary();
    const analyticsSummary = analytics.getSummary();

    const { category, search } = req.query;
    let items = summary.items;

    if (category && category !== 'All') {
      items = items.filter((i) => i.category.toLowerCase() === (category as string).toLowerCase());
    }

    if (search) {
      const q = (search as string).toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.content.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    res.status(HttpStatus.OK).json({
      success: true,
      data: {
        summary: {
          lastSyncTimestamp: summary.lastSyncTimestamp,
          totalItems: summary.itemCount,
          categories: summary.categories,
          version: summary.version,
        },
        analytics: analyticsSummary,
        items,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const syncAdminAiKnowledge = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await syncAiKnowledge();
    res.status(HttpStatus.OK).json({
      success: true,
      message: 'AI knowledge base synchronized successfully from live BE11 application',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};
