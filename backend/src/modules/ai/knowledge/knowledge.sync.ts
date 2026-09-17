import { KnowledgeExtractor } from './knowledge.extractor.js';
import { KnowledgeStore } from './knowledge.store.js';
import { logger } from '../../../config/logger.js';

export interface SyncReport {
  timestamp: string;
  totalExtracted: number;
  inserted: number;
  updated: number;
  unchanged: number;
  categories: string[];
}

export async function syncAiKnowledge(): Promise<SyncReport> {
  const startTime = Date.now();
  try {
    const extractor = KnowledgeExtractor.getInstance();
    const store = KnowledgeStore.getInstance();

    const items = await extractor.extractAll();
    const stats = store.updateIndex(items);

    const categories = Array.from(new Set(items.map((i) => i.category))).sort();

    const report: SyncReport = {
      timestamp: new Date().toISOString(),
      totalExtracted: items.length,
      inserted: stats.inserted,
      updated: stats.updated,
      unchanged: stats.unchanged,
      categories,
    };

    logger.info(
      `🤖 BE11 AI Knowledge Synced in ${Date.now() - startTime}ms: ${items.length} items (${stats.inserted} new, ${stats.updated} updated, ${stats.unchanged} unchanged across ${categories.length} categories)`
    );

    return report;
  } catch (error) {
    logger.error('Failed to synchronize AI knowledge:', error);
    throw error;
  }
}
