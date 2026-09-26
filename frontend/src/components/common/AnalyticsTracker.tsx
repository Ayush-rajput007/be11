import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { trackPageView, syncVisitorWithUser, getOrCreateVisitorId } from '../../lib/analytics/tracker.js';
import { initGA4, trackGA4PageView } from '../../lib/analytics/ga4.js';

export const AnalyticsTracker: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const lastTrackedPath = useRef<string | null>(null);
  const lastTrackedTime = useRef<number>(0);

  // Initialize first-party visitor ID and GA4 on initial mount
  useEffect(() => {
    getOrCreateVisitorId();
    initGA4();
  }, []);

  // Sync visitor with user upon login/authentication
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      syncVisitorWithUser(user.id);
    }
  }, [isAuthenticated, user?.id]);

  // Track page views on route changes
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    const now = Date.now();

    // Deduplicate rapid duplicate events within 200ms (e.g., React StrictMode double rendering)
    if (lastTrackedPath.current === currentPath && now - lastTrackedTime.current < 200) {
      return;
    }

    lastTrackedPath.current = currentPath;
    lastTrackedTime.current = now;

    // Asynchronously dispatch first-party page view tracking
    trackPageView(currentPath, user?.id);

    // Dispatch Google Analytics 4 SPA page view
    trackGA4PageView(currentPath);
  }, [location.pathname, location.search, user?.id]);

  return null;
};
