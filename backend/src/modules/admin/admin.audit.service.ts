export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetEntity: string;
  targetId?: string;
  details?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export class AdminAuditService {
  private static instance: AdminAuditService;
  private logs: AuditLogEntry[] = [];
  private maxLogs = 500;

  private constructor() {
    this.logs.push({
      id: `audit_${Date.now()}_init`,
      adminId: 'system',
      adminName: 'BE11 System',
      action: 'SYSTEM_BOOT',
      targetEntity: 'System',
      details: 'BE11 Admin Control Center initialized',
      timestamp: new Date().toISOString(),
    });
  }

  public static getInstance(): AdminAuditService {
    if (!AdminAuditService.instance) {
      AdminAuditService.instance = new AdminAuditService();
    }
    return AdminAuditService.instance;
  }

  public recordAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(newEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    return newEntry;
  }

  public getLogs(params: { action?: string; limit?: number; search?: string } = {}): AuditLogEntry[] {
    let result = [...this.logs];

    if (params.action && params.action !== 'ALL') {
      result = result.filter((l) => l.action.toLowerCase() === params.action?.toLowerCase());
    }

    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.adminName.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.targetEntity.toLowerCase().includes(q) ||
          (l.details && l.details.toLowerCase().includes(q))
      );
    }

    return result.slice(0, params.limit || 50);
  }
}

export const adminAuditService = AdminAuditService.getInstance();
