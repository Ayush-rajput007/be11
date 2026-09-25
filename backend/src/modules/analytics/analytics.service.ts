import { prisma } from '../../config/db.js';
import { logger } from '../../config/logger.js';

// Sanitize path to prevent logging tokens, passwords, OTPs, or sensitive params
export const sanitizePath = (rawPath: string): string => {
  if (!rawPath || typeof rawPath !== 'string') return '/';
  
  try {
    // If full URL passed, extract pathname + sanitized search
    const parsed = new URL(rawPath, 'http://localhost');
    const pathname = parsed.pathname;
    
    // Filter sensitive query parameters
    const sensitiveKeys = ['token', 'access_token', 'id_token', 'password', 'otp', 'code', 'secret', 'key', 'auth'];
    const sanitizedParams = new URLSearchParams();
    
    parsed.searchParams.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      if (!sensitiveKeys.some((s) => lowerKey.includes(s))) {
        sanitizedParams.append(key, val.slice(0, 50));
      }
    });

    const searchStr = sanitizedParams.toString();
    const finalPath = searchStr ? `${pathname}?${searchStr}` : pathname;
    return finalPath.slice(0, 255);
  } catch {
    return rawPath.split('?')[0].slice(0, 255) || '/';
  }
};

// Determine device category without invasive fingerprinting
export const detectDeviceType = (userAgent?: string): 'desktop' | 'mobile' | 'tablet' => {
  if (!userAgent) return 'desktop';
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
      ua
    )
  ) {
    return 'mobile';
  }
  return 'desktop';
};

// Normalize referrer sources cleanly
export const categorizeReferrer = (referrer?: string | null): string => {
  if (!referrer || referrer.trim() === '' || referrer === 'null' || referrer === 'undefined') {
    return 'Direct';
  }
  const ref = referrer.toLowerCase();
  if (ref.includes('google.')) return 'Google';
  if (ref.includes('instagram.')) return 'Instagram';
  if (ref.includes('whatsapp') || ref.includes('wa.me')) return 'WhatsApp';
  if (ref.includes('facebook.') || ref.includes('fb.')) return 'Facebook';
  if (ref.includes('twitter.') || ref.includes('x.com')) return 'Twitter / X';
  if (ref.includes('linkedin.')) return 'LinkedIn';
  if (ref.includes('youtube.')) return 'YouTube';
  if (ref.includes('bing.')) return 'Bing';
  if (ref.includes('localhost') || ref.includes('be11.in') || ref.includes('127.0.0.1')) return 'Internal / Direct';
  return 'Other';
};

export class AnalyticsService {
  /**
   * Record or touch a visitor record.
   */
  static async recordVisitor(visitorId: string, userId?: string | null) {
    if (!visitorId || typeof visitorId !== 'string') return null;

    try {
      const now = new Date();
      const existing = await prisma.visitor.findUnique({
        where: { visitorId },
      });

      if (existing) {
        return await prisma.visitor.update({
          where: { visitorId },
          data: {
            lastSeenAt: now,
            ...(userId && !existing.userId ? { userId } : {}),
          },
        });
      }

      return await prisma.visitor.create({
        data: {
          visitorId,
          userId: userId || null,
          firstSeenAt: now,
          lastSeenAt: now,
        },
      });
    } catch (err) {
      logger.warn('⚠️ Analytics: Failed to record visitor:', (err as Error).message);
      return null;
    }
  }

  /**
   * Record or maintain an active visitor session (30-minute inactivity threshold).
   */
  static async recordSession(params: {
    visitorId: string;
    userId?: string | null;
    path?: string;
    userAgent?: string;
    deviceType?: string;
    referrer?: string;
  }) {
    const { visitorId, userId, path, userAgent, referrer } = params;
    if (!visitorId) return null;

    try {
      const cleanPath = sanitizePath(path || '/');
      const device = params.deviceType || detectDeviceType(userAgent);
      const cleanReferrer = referrer ? referrer.slice(0, 500) : null;
      const now = new Date();
      const inactivityThresholdMs = 30 * 60 * 1000; // 30 minutes
      const thresholdDate = new Date(now.getTime() - inactivityThresholdMs);

      // Ensure visitor exists
      await this.recordVisitor(visitorId, userId);

      // Check for an active session within inactivity window
      const activeSession = await prisma.visitorSession.findFirst({
        where: {
          visitorId,
          endedAt: null,
          lastSeenAt: { gte: thresholdDate },
        },
        orderBy: { lastSeenAt: 'desc' },
      });

      if (activeSession) {
        return await prisma.visitorSession.update({
          where: { id: activeSession.id },
          data: {
            lastSeenAt: now,
            exitPage: cleanPath,
            ...(userId && !activeSession.userId ? { userId } : {}),
          },
        });
      }

      // Start new session
      return await prisma.visitorSession.create({
        data: {
          visitorId,
          userId: userId || null,
          startedAt: now,
          lastSeenAt: now,
          entryPage: cleanPath,
          exitPage: cleanPath,
          userAgent: userAgent ? userAgent.slice(0, 500) : null,
          deviceType: device,
          referrer: cleanReferrer,
        },
      });
    } catch (err) {
      logger.warn('⚠️ Analytics: Failed to record session:', (err as Error).message);
      return null;
    }
  }

  /**
   * Record a route / page view.
   */
  static async recordPageView(params: {
    visitorId: string;
    sessionId?: string | null;
    userId?: string | null;
    path: string;
    referrer?: string;
    userAgent?: string;
    deviceType?: string;
  }) {
    const { visitorId, userId, path, referrer, userAgent, deviceType } = params;
    if (!visitorId || !path) return null;

    try {
      const cleanPath = sanitizePath(path);
      const cleanReferrer = referrer ? referrer.slice(0, 500) : null;
      const now = new Date();

      // Ensure active session exists
      let session = null;
      if (params.sessionId) {
        session = await prisma.visitorSession.findUnique({
          where: { id: params.sessionId },
        });
      }

      if (!session) {
        session = await this.recordSession({
          visitorId,
          userId,
          path: cleanPath,
          userAgent,
          deviceType,
          referrer: cleanReferrer || undefined,
        });
      } else {
        // Touch session
        await prisma.visitorSession.update({
          where: { id: session.id },
          data: {
            lastSeenAt: now,
            exitPage: cleanPath,
            ...(userId && !session.userId ? { userId } : {}),
          },
        }).catch(() => null);
      }

      // Record page view
      const pageView = await prisma.pageView.create({
        data: {
          visitorId,
          sessionId: session ? session.id : null,
          userId: userId || null,
          path: cleanPath,
          referrer: cleanReferrer,
          createdAt: now,
        },
      });

      return { pageView, sessionId: session?.id };
    } catch (err) {
      logger.warn('⚠️ Analytics: Failed to record page view:', (err as Error).message);
      return null;
    }
  }

  /**
   * Connect an anonymous visitor to an authenticated user upon registration or login.
   * Preserves historical sessions and page views so past anonymous browsing remains accurate.
   */
  static async linkVisitorToUser(visitorId: string, userId: string) {
    if (!visitorId || !userId) return;

    try {
      const now = new Date();
      // 1. Update or create Visitor record with user linkage and firstAuthenticatedAt
      const existing = await prisma.visitor.findUnique({
        where: { visitorId },
      });

      if (existing) {
        await prisma.visitor.update({
          where: { visitorId },
          data: {
            userId,
            firstAuthenticatedAt: existing.firstAuthenticatedAt || now,
            lastSeenAt: now,
          },
        });
      } else {
        await prisma.visitor.create({
          data: {
            visitorId,
            userId,
            firstSeenAt: now,
            firstAuthenticatedAt: now,
            lastSeenAt: now,
          },
        });
      }

      // 2. Associate the current active session (within 30 mins) with the user
      const inactivityThresholdMs = 30 * 60 * 1000;
      const thresholdDate = new Date(now.getTime() - inactivityThresholdMs);

      await prisma.visitorSession.updateMany({
        where: {
          visitorId,
          userId: null,
          endedAt: null,
          lastSeenAt: { gte: thresholdDate },
        },
        data: { userId },
      });

      logger.info(`🔗 Linked visitor ${visitorId} to user ${userId}`);
    } catch (err) {
      logger.warn('⚠️ Analytics: Failed to link visitor to user:', (err as Error).message);
    }
  }

  /**
   * Calculate comprehensive admin analytics metrics for a given date range.
   * Derived temporally from historical session and pageview activity.
   */
  static async getOverviewMetrics(startDate: Date, endDate: Date) {
    // 1. Date filter boundaries
    const dateFilter = {
      createdAt: { gte: startDate, lte: endDate },
    };
    const sessionDateFilter = {
      startedAt: { gte: startDate, lte: endDate },
    };
    const visitorActiveFilter = {
      lastSeenAt: { gte: startDate, lte: endDate },
    };

    // 2. Core Counts
    const [
      activeVisitorGroups,
      anonymousVisitorGroups,
      registeredVisitorGroups,
      newVisitors,
      registrationsInPeriod,
      totalSessions,
      totalPageViews,
      totalUsers,
      totalBookings,
    ] = await Promise.all([
      // Distinct visitors who had sessions in period
      prisma.visitorSession.groupBy({
        by: ['visitorId'],
        where: sessionDateFilter,
      }),
      // Distinct visitors who browsed anonymously in period
      prisma.visitorSession.groupBy({
        by: ['visitorId'],
        where: {
          ...sessionDateFilter,
          userId: null,
        },
      }),
      // Distinct visitors who browsed authenticated in period
      prisma.visitorSession.groupBy({
        by: ['visitorId'],
        where: {
          ...sessionDateFilter,
          userId: { not: null },
        },
      }),
      // New visitors whose first visit is within the period
      prisma.visitor.count({
        where: { firstSeenAt: { gte: startDate, lte: endDate } },
      }),
      // Visitors who registered during this period
      prisma.visitor.count({
        where: { firstAuthenticatedAt: { gte: startDate, lte: endDate } },
      }),
      // Total sessions started in period
      prisma.visitorSession.count({ where: sessionDateFilter }),
      // Total page views in period
      prisma.pageView.count({ where: dateFilter }),
      // Total registered users in system
      prisma.user.count(),
      // Total bookings created in period
      prisma.booking.count({ where: dateFilter }),
    ]);

    const totalVisitors = activeVisitorGroups.length > 0
      ? activeVisitorGroups.length
      : await prisma.visitor.count({ where: visitorActiveFilter });

    const anonymousVisitors = anonymousVisitorGroups.length;
    const registeredVisitors = registeredVisitorGroups.length;
    const returningVisitors = Math.max(0, totalVisitors - newVisitors);

    // 3. Conversions & Funnel Calculations
    // A. Registrations in period
    const convertedVisitorsCount = registrationsInPeriod;

    // B. Registered users who placed at least one booking in period
    const usersWithBookings = await prisma.booking.groupBy({
      by: ['customerId'],
      where: dateFilter,
    });
    const usersWhoBookedCount = usersWithBookings.length;

    // C. Unique visitors associated with bookings in period
    const bookedUserIds = usersWithBookings.map((b) => b.customerId).filter(Boolean);
    const visitorsWhoBookedCount = bookedUserIds.length > 0
      ? (await prisma.visitor.findMany({
          where: {
            userId: { in: bookedUserIds },
          },
          select: { visitorId: true },
          distinct: ['visitorId'],
        })).length
      : 0;

    // Conversion percentages
    const visitorToRegistrationRate = totalVisitors > 0
      ? Number(((convertedVisitorsCount / totalVisitors) * 100).toFixed(2))
      : 0;

    const registrationToBookingRate = totalUsers > 0
      ? Number(((usersWhoBookedCount / totalUsers) * 100).toFixed(2))
      : 0;

    const visitorToBookingRate = totalVisitors > 0
      ? Number(((visitorsWhoBookedCount / totalVisitors) * 100).toFixed(2))
      : 0;

    // 4. Top Visited Pages
    const rawTopPages = await prisma.pageView.groupBy({
      by: ['path'],
      where: dateFilter,
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 10,
    });

    const topPages = rawTopPages.map((p) => ({
      path: p.path,
      views: p._count.path,
      percentage: totalPageViews > 0 ? Number(((p._count.path / totalPageViews) * 100).toFixed(1)) : 0,
    }));

    // 5. Device Breakdown
    const rawDevices = await prisma.visitorSession.groupBy({
      by: ['deviceType'],
      where: sessionDateFilter,
      _count: { deviceType: true },
    });

    const deviceMap: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    rawDevices.forEach((d) => {
      const dt = (d.deviceType || 'desktop').toLowerCase();
      if (deviceMap[dt] !== undefined) {
        deviceMap[dt] += d._count.deviceType;
      } else {
        deviceMap.desktop += d._count.deviceType;
      }
    });

    const totalDeviceSessions = deviceMap.desktop + deviceMap.mobile + deviceMap.tablet;
    const deviceBreakdown = [
      {
        type: 'Desktop',
        count: deviceMap.desktop,
        percentage: totalDeviceSessions > 0 ? Number(((deviceMap.desktop / totalDeviceSessions) * 100).toFixed(1)) : 0,
      },
      {
        type: 'Mobile',
        count: deviceMap.mobile,
        percentage: totalDeviceSessions > 0 ? Number(((deviceMap.mobile / totalDeviceSessions) * 100).toFixed(1)) : 0,
      },
      {
        type: 'Tablet',
        count: deviceMap.tablet,
        percentage: totalDeviceSessions > 0 ? Number(((deviceMap.tablet / totalDeviceSessions) * 100).toFixed(1)) : 0,
      },
    ];

    // 6. Referrers Breakdown
    const rawSessionsWithReferrers = await prisma.visitorSession.findMany({
      where: sessionDateFilter,
      select: { referrer: true },
      take: 5000,
    });

    const referrerCounts: Record<string, number> = {
      Direct: 0,
      Google: 0,
      Instagram: 0,
      WhatsApp: 0,
      Facebook: 0,
      Other: 0,
    };

    rawSessionsWithReferrers.forEach((s) => {
      const category = categorizeReferrer(s.referrer);
      if (referrerCounts[category] !== undefined) {
        referrerCounts[category]++;
      } else {
        referrerCounts.Other++;
      }
    });

    const totalReferrers = Object.values(referrerCounts).reduce((a, b) => a + b, 0);
    const referrersBreakdown = Object.entries(referrerCounts)
      .map(([source, count]) => ({
        source,
        count,
        percentage: totalReferrers > 0 ? Number(((count / totalReferrers) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 7. Daily Traffic Trends
    const trends = await this.getDailyTrends(startDate, endDate);

    return {
      summary: {
        totalVisitors,
        anonymousVisitors,
        registeredVisitors,
        newVisitors,
        returningVisitors,
        totalSessions,
        totalPageViews,
        totalRegisteredUsers: totalUsers,
        totalBookings,
      },
      conversions: {
        visitorToRegistrationRate,
        registrationToBookingRate,
        visitorToBookingRate,
        visitorsWhoRegisteredCount: convertedVisitorsCount,
        usersWhoBookedCount,
        visitorsWhoBookedCount,
      },
      trends,
      topPages,
      deviceBreakdown,
      referrersBreakdown,
    };
  }

  /**
   * Daily aggregated trends for line/bar charts.
   */
  static async getDailyTrends(startDate: Date, endDate: Date) {
    const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Generate day intervals
    const days: { dateStr: string; label: string; start: Date; end: Date }[] = [];
    for (let i = 0; i < daysDiff; i++) {
      const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days.push({ dateStr, label, start: startOfDay, end: endOfDay });
    }

    // Fetch daily page views, sessions, and visitors
    const trendsData = await Promise.all(
      days.map(async (day) => {
        const [pageViews, sessions, newVisitors, bookings] = await Promise.all([
          prisma.pageView.count({
            where: { createdAt: { gte: day.start, lte: day.end } },
          }),
          prisma.visitorSession.count({
            where: { startedAt: { gte: day.start, lte: day.end } },
          }),
          prisma.visitor.count({
            where: { firstSeenAt: { gte: day.start, lte: day.end } },
          }),
          prisma.booking.count({
            where: { createdAt: { gte: day.start, lte: day.end } },
          }),
        ]);

        return {
          date: day.dateStr,
          label: day.label,
          visitors: newVisitors,
          sessions,
          pageViews,
          bookings,
        };
      })
    );

    return trendsData;
  }

  /**
   * List recent page views for admin audit.
   */
  static async getRecentPageViews(limit = 50, path?: string) {
    return await prisma.pageView.findMany({
      where: path ? { path: { contains: path } } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * List recent visitors for admin audit.
   */
  static async getRecentVisitors(limit = 50) {
    return await prisma.visitor.findMany({
      orderBy: { lastSeenAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            sessions: true,
            pageViews: true,
          },
        },
      },
    });
  }
}
