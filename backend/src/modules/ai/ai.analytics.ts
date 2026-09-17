export interface ChatLogEntry {
  id: string;
  timestamp: string;
  category: string;
  resolved: boolean;
  escalated: boolean;
  latencyMs: number;
  route?: string;
  userRole?: string;
}

export class AiAnalytics {
  private static instance: AiAnalytics;
  private logs: ChatLogEntry[] = [];
  private maxLogs: number = 200;

  public static getInstance(): AiAnalytics {
    if (!AiAnalytics.instance) {
      AiAnalytics.instance = new AiAnalytics();
    }
    return AiAnalytics.instance;
  }

  public recordEvent(entry: Omit<ChatLogEntry, 'id' | 'timestamp'>): void {
    const log: ChatLogEntry = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  public getSummary() {
    const total = this.logs.length;
    const escalated = this.logs.filter((l) => l.escalated).length;
    const categoryCounts: Record<string, number> = {};

    for (const log of this.logs) {
      categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1;
    }

    const avgLatency =
      total > 0 ? Math.round(this.logs.reduce((acc, l) => acc + l.latencyMs, 0) / total) : 0;

    return {
      totalQueries: total,
      escalatedQueries: escalated,
      escalationRate: total > 0 ? `${((escalated / total) * 100).toFixed(1)}%` : '0%',
      averageLatencyMs: avgLatency,
      topCategories: categoryCounts,
      recentLogs: this.logs.slice(0, 15),
    };
  }
}
