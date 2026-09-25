import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service.js';
import { HttpStatus } from '@be11/shared';
import { AuthenticatedRequest } from '../../middlewares/auth.js';

// Helper to extract visitorId from headers, cookies, or body
export const extractVisitorId = (req: Request): string | null => {
  return (
    req.body?.visitorId ||
    req.headers['x-visitor-id'] ||
    req.cookies?.be11_visitor_id ||
    null
  );
};

// Helper to extract user ID if authenticated
export const extractUserId = (req: Request): string | null => {
  return (req as any).user?.userId || req.body?.userId || null;
};

// Date range parser
export const parseDateRange = (req: Request): { startDate: Date; endDate: Date } => {
  const { period, startDate: customStart, endDate: customEnd } = req.query;
  const now = new Date();
  let startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // default 30 days
  let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (customStart && customEnd) {
    startDate = new Date(String(customStart));
    endDate = new Date(String(customEnd));
    endDate.setHours(23, 59, 59, 999);
  } else if (period) {
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        break;
      case '7d':
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }
  }

  return { startDate, endDate };
};

export const trackVisitor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visitorId = extractVisitorId(req);
    const userId = extractUserId(req);

    if (!visitorId) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'visitorId is required',
      });
    }

    const visitor = await AnalyticsService.recordVisitor(visitorId, userId);

    res.status(HttpStatus.OK).json({
      success: true,
      data: { visitorId: visitor?.visitorId },
    });
  } catch (error) {
    next(error);
  }
};

export const trackSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visitorId = extractVisitorId(req);
    const userId = extractUserId(req);
    const { path, referrer, userAgent, deviceType } = req.body || {};

    if (!visitorId) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'visitorId is required',
      });
    }

    const session = await AnalyticsService.recordSession({
      visitorId,
      userId,
      path,
      userAgent: userAgent || req.headers['user-agent'],
      deviceType,
      referrer,
    });

    res.status(HttpStatus.OK).json({
      success: true,
      data: { sessionId: session?.id },
    });
  } catch (error) {
    next(error);
  }
};

export const trackPageView = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visitorId = extractVisitorId(req);
    const userId = extractUserId(req);
    const { path, sessionId, referrer, deviceType } = req.body || {};

    if (!visitorId || !path) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'visitorId and path are required',
      });
    }

    const result = await AnalyticsService.recordPageView({
      visitorId,
      sessionId,
      userId,
      path,
      referrer,
      userAgent: req.headers['user-agent'],
      deviceType,
    });

    res.status(HttpStatus.OK).json({
      success: true,
      data: {
        pageViewId: result?.pageView?.id,
        sessionId: result?.sessionId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const syncVisitor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visitorId = extractVisitorId(req);
    const userId = extractUserId(req);

    if (visitorId && userId) {
      await AnalyticsService.linkVisitorToUser(visitorId, userId);
    }

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Visitor synced with user',
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminOverview = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const overview = await AnalyticsService.getOverviewMetrics(startDate, endDate);

    res.status(HttpStatus.OK).json({
      success: true,
      message: 'Analytics overview retrieved successfully',
      data: {
        ...overview,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminVisitors = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const visitors = await AnalyticsService.getRecentVisitors(limit);

    res.status(HttpStatus.OK).json({
      success: true,
      data: { visitors },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminPageViews = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const path = req.query.path ? String(req.query.path) : undefined;
    const pageViews = await AnalyticsService.getRecentPageViews(limit, path);

    res.status(HttpStatus.OK).json({
      success: true,
      data: { pageViews },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminTrends = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const trends = await AnalyticsService.getDailyTrends(startDate, endDate);

    res.status(HttpStatus.OK).json({
      success: true,
      data: { trends },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminTopPages = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = parseDateRange(req);
    const overview = await AnalyticsService.getOverviewMetrics(startDate, endDate);

    res.status(HttpStatus.OK).json({
      success: true,
      data: { topPages: overview.topPages },
    });
  } catch (error) {
    next(error);
  }
};
