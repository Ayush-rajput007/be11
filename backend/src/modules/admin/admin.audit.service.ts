import { prisma } from '../../config/db.js';
import { logger } from '../../config/logger.js';

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName?: string | null;
  adminEmail?: string | null;
  action: string;
  targetEntity: string;
  targetId?: string | null;
  details?: string | null;
  metadata?: Record<string, any> | null;
  ip?: string | null;
  timestamp: string;
}

export class AdminAuditService {
  private static instance: AdminAuditService;
  private memoryCache: AuditLogEntry[] = [];
  private maxCacheSize = 200;

  private constructor() {
    this.memoryCache.push({
      id: `audit_${Date.now()}_init`,
      adminId: 'system',
      adminName: 'BE11 System',
      adminEmail: 'system@be11.in',
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

  /**
   * Persist audit record to PostgreSQL database asynchronously and maintain in-memory buffer
   */
  public async recordAction(entry: {
    adminId: string;
    adminName?: string | null;
    adminEmail?: string | null;
    action: string;
    targetEntity: string;
    targetId?: string | null;
    details?: string | null;
    metadata?: Record<string, any> | null;
    ip?: string | null;
  }): Promise<AuditLogEntry> {
    const memoryEntry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      adminId: entry.adminId,
      adminName: entry.adminName || 'Admin',
      adminEmail: entry.adminEmail || null,
      action: entry.action,
      targetEntity: entry.targetEntity,
      targetId: entry.targetId || null,
      details: entry.details || null,
      metadata: entry.metadata || null,
      ip: entry.ip || null,
      timestamp: new Date().toISOString(),
    };

    this.memoryCache.unshift(memoryEntry);
    if (this.memoryCache.length > this.maxCacheSize) {
      this.memoryCache.pop();
    }

    try {
      if ((prisma as any).auditLog) {
        const dbRecord = await (prisma as any).auditLog.create({
          data: {
            adminId: entry.adminId,
            adminName: entry.adminName || 'Admin',
            adminEmail: entry.adminEmail || null,
            action: entry.action,
            targetEntity: entry.targetEntity,
            targetId: entry.targetId || null,
            details: entry.details || null,
            metadata: entry.metadata ? (entry.metadata as any) : undefined,
            ip: entry.ip || null,
          },
        });

        return {
          id: dbRecord.id,
          adminId: dbRecord.adminId,
          adminName: dbRecord.adminName,
          adminEmail: dbRecord.adminEmail,
          action: dbRecord.action,
          targetEntity: dbRecord.targetEntity,
          targetId: dbRecord.targetId,
          details: dbRecord.details,
          metadata: dbRecord.metadata as any,
          ip: dbRecord.ip,
          timestamp: dbRecord.timestamp.toISOString(),
        };
      }
    } catch (err: any) {
      logger.warn('⚠️ Non-fatal: PostgreSQL audit log insert error, fallback to memory cache:', err?.message || err);
    }

    return memoryEntry;
  }

  /**
   * Retrieve audit logs from PostgreSQL (with fallback to in-memory cache)
   */
  public async getLogs(params: {
    action?: string;
    targetEntity?: string;
    limit?: number;
    search?: string;
  } = {}): Promise<AuditLogEntry[]> {
    const takeNum = Math.min(200, Math.max(1, params.limit || 50));

    try {
      if ((prisma as any).auditLog) {
        const where: any = {};

        if (params.action && params.action !== 'ALL') {
          where.action = params.action;
        }

        if (params.targetEntity && params.targetEntity !== 'ALL') {
          where.targetEntity = params.targetEntity;
        }

        if (params.search && params.search.trim()) {
          const q = params.search.trim();
          where.OR = [
            { action: { contains: q, mode: 'insensitive' } },
            { targetEntity: { contains: q, mode: 'insensitive' } },
            { adminEmail: { contains: q, mode: 'insensitive' } },
            { adminName: { contains: q, mode: 'insensitive' } },
            { targetId: { contains: q, mode: 'insensitive' } },
            { details: { contains: q, mode: 'insensitive' } },
          ];
        }

        const dbLogs = await (prisma as any).auditLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: takeNum,
        });

        if (dbLogs && dbLogs.length > 0) {
          return dbLogs.map((l: any) => ({
            id: l.id,
            adminId: l.adminId,
            adminName: l.adminName,
            adminEmail: l.adminEmail,
            action: l.action,
            targetEntity: l.targetEntity,
            targetId: l.targetId,
            details: l.details,
            metadata: l.metadata,
            ip: l.ip,
            timestamp: l.timestamp.toISOString(),
          }));
        }
      }
    } catch (err: any) {
      logger.warn('⚠️ Non-fatal: PostgreSQL audit log fetch error, reading memory cache:', err?.message || err);
    }

    // Fallback to in-memory cache
    let result = [...this.memoryCache];

    if (params.action && params.action !== 'ALL') {
      result = result.filter((l) => l.action.toLowerCase() === params.action?.toLowerCase());
    }

    if (params.targetEntity && params.targetEntity !== 'ALL') {
      result = result.filter((l) => l.targetEntity.toLowerCase() === params.targetEntity?.toLowerCase());
    }

    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (l) =>
          (l.adminName && l.adminName.toLowerCase().includes(q)) ||
          (l.adminEmail && l.adminEmail.toLowerCase().includes(q)) ||
          l.action.toLowerCase().includes(q) ||
          l.targetEntity.toLowerCase().includes(q) ||
          (l.targetId && l.targetId.toLowerCase().includes(q)) ||
          (l.details && l.details.toLowerCase().includes(q))
      );
    }

    return result.slice(0, takeNum);
  }
}

export const adminAuditService = AdminAuditService.getInstance();
