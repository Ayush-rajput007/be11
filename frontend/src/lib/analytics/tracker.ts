import { api } from '../api.js';

const COOKIE_NAME = 'be11_visitor_id';
const STORAGE_KEY = 'be11_visitor_id';
const SESSION_STORAGE_KEY = 'be11_session_id';

/**
 * Generate a cryptographically secure RFC4122 v4 UUID
 */
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Read cookie value by name
 */
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
};

/**
 * Set a first-party cookie with 1-year expiration
 */
const setCookie = (name: string, value: string, days = 365) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const isSecure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${isSecure}`;
};

/**
 * Retrieve or initialize a first-party anonymous visitor ID
 */
export const getOrCreateVisitorId = (): string => {
  if (typeof window === 'undefined') return '';

  // 1. Check first-party cookie
  let visitorId = getCookie(COOKIE_NAME);

  // 2. Check localStorage fallback
  if (!visitorId) {
    try {
      visitorId = localStorage.getItem(STORAGE_KEY);
    } catch (_) {}
  }

  // 3. Generate new ID if not existing
  if (!visitorId || visitorId.length < 10) {
    visitorId = generateUUID();
  }

  // 4. Ensure synced in both cookie and localStorage
  setCookie(COOKIE_NAME, visitorId);
  try {
    localStorage.setItem(STORAGE_KEY, visitorId);
  } catch (_) {}

  return visitorId;
};

/**
 * Detect device type non-invasively
 */
export const detectDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
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

/**
 * Sanitize path to prevent logging tokens or sensitive params
 */
export const sanitizePath = (path: string): string => {
  if (!path) return '/';
  try {
    const url = new URL(path, 'http://localhost');
    const sensitive = ['token', 'access_token', 'id_token', 'password', 'otp', 'code', 'secret', 'key', 'auth'];
    const cleanParams = new URLSearchParams();

    url.searchParams.forEach((val, key) => {
      if (!sensitive.some((s) => key.toLowerCase().includes(s))) {
        cleanParams.append(key, val.slice(0, 50));
      }
    });

    const q = cleanParams.toString();
    return q ? `${url.pathname}?${q}` : url.pathname;
  } catch {
    return path.split('?')[0] || '/';
  }
};

/**
 * Get or set session ID from sessionStorage
 */
export const getSessionId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setSessionId = (sessionId: string) => {
  if (typeof window === 'undefined' || !sessionId) return;
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch (_) {}
};

/**
 * Record a page view event (fail-safe and asynchronous)
 */
export const trackPageView = async (path: string, userId?: string | null): Promise<void> => {
  try {
    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;

    const cleanPath = sanitizePath(path);
    const sessionId = getSessionId();
    const referrer = typeof document !== 'undefined' ? document.referrer : undefined;
    const deviceType = detectDeviceType();

    const res = await api.post('/analytics/pageview', {
      visitorId,
      sessionId,
      userId: userId || undefined,
      path: cleanPath,
      referrer,
      deviceType,
    });

    if (res.data?.data?.sessionId) {
      setSessionId(res.data.data.sessionId);
    }
  } catch (err) {
    // Non-blocking: fail silently without affecting user experience
    if (process.env.NODE_ENV === 'development') {
      console.debug('Analytics non-fatal notice:', (err as Error).message);
    }
  }
};

/**
 * Sync visitor ID with authenticated user ID
 */
export const syncVisitorWithUser = async (userId: string): Promise<void> => {
  try {
    const visitorId = getOrCreateVisitorId();
    if (!visitorId || !userId) return;

    await api.post('/analytics/sync', {
      visitorId,
      userId,
    });
  } catch (_) {
    // Fail silently
  }
};
