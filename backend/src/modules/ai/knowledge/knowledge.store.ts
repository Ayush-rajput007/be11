import { KnowledgeIndex, KnowledgeItem, RetrievalResult } from './knowledge.types.js';

export class KnowledgeStore {
  private static instance: KnowledgeStore;
  private itemsMap: Map<string, KnowledgeItem> = new Map();
  private lastSyncTimestamp: string = new Date().toISOString();
  private version: string = '1.0.0';

  public static getInstance(): KnowledgeStore {
    if (!KnowledgeStore.instance) {
      KnowledgeStore.instance = new KnowledgeStore();
    }
    return KnowledgeStore.instance;
  }

  /**
   * Updates or inserts knowledge items, tracking content hashes.
   */
  public updateIndex(newItems: KnowledgeItem[]): { inserted: number; updated: number; unchanged: number } {
    let inserted = 0;
    let updated = 0;
    let unchanged = 0;

    for (const item of newItems) {
      const existing = this.itemsMap.get(item.id);
      if (!existing) {
        this.itemsMap.set(item.id, item);
        inserted++;
      } else if (existing.hash !== item.hash) {
        this.itemsMap.set(item.id, item);
        updated++;
      } else {
        unchanged++;
      }
    }

    this.lastSyncTimestamp = new Date().toISOString();
    return { inserted, updated, unchanged };
  }

  /**
   * Retrieves all currently active indexed knowledge items.
   */
  public getAllItems(): KnowledgeItem[] {
    return Array.from(this.itemsMap.values()).filter((item) => item.active);
  }

  /**
   * Returns complete index summary for admin dashboard.
   */
  public getIndexSummary(): KnowledgeIndex {
    const items = this.getAllItems();
    const categories = Array.from(new Set(items.map((i) => i.category))).sort();

    return {
      version: this.version,
      lastSyncTimestamp: this.lastSyncTimestamp,
      itemCount: items.length,
      categories,
      items,
    };
  }

  /**
   * Semantic/Token scoring retrieval for user queries.
   */
  public search(query: string, topK: number = 4, categoryFilter?: string): RetrievalResult[] {
    const cleanQuery = query.toLowerCase().trim();
    const queryTokens = cleanQuery
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const results: RetrievalResult[] = [];

    for (const item of this.getAllItems()) {
      if (categoryFilter && item.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        continue;
      }

      let score = 0;
      const matchedTags: string[] = [];

      const titleLower = item.title.toLowerCase();
      const contentLower = item.content.toLowerCase();

      // Direct exact phrase match bonus
      if (cleanQuery.length > 3 && (titleLower.includes(cleanQuery) || contentLower.includes(cleanQuery))) {
        score += 40;
      }

      // Tag matching
      for (const tag of item.tags) {
        const tagLower = tag.toLowerCase();
        if (cleanQuery.includes(tagLower) || tagLower.includes(cleanQuery)) {
          score += 25;
          matchedTags.push(tag);
        } else {
          // Token match within multi-word tags
          const tagTokens = tagLower.split(/\s+/);
          const hasCommonToken = tagTokens.some((tt) => tt.length > 2 && queryTokens.includes(tt));
          if (hasCommonToken) {
            score += 15;
            if (!matchedTags.includes(tag)) matchedTags.push(tag);
          }
        }
      }

      // Token matching
      for (const token of queryTokens) {
        if (titleLower.includes(token)) {
          score += 15;
        }
        if (contentLower.includes(token)) {
          score += 5;
        }
        for (const tag of item.tags) {
          if (tag.toLowerCase().includes(token)) {
            score += 10;
            if (!matchedTags.includes(tag)) matchedTags.push(tag);
          }
        }
      }

      if (score > 0) {
        results.push({ item, score, matchedTags });
      }
    }

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, topK);
  }
}
