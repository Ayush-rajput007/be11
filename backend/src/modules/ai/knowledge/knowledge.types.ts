export type KnowledgeSourceType = 
  | 'application-data' 
  | 'route-metadata' 
  | 'policy' 
  | 'database-schema' 
  | 'faq'
  | 'business-rule';

export interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  source: string;
  sourceType: KnowledgeSourceType;
  lastUpdated: string;
  version: string;
  active: boolean;
  hash: string;
  tags: string[];
  route?: string;
  metadata?: Record<string, any>;
}

export interface KnowledgeIndex {
  version: string;
  lastSyncTimestamp: string;
  itemCount: number;
  categories: string[];
  items: KnowledgeItem[];
}

export interface RetrievalResult {
  item: KnowledgeItem;
  score: number;
  matchedTags: string[];
}
