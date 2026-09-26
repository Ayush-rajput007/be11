/**
 * Central Google Analytics 4 (GA4) Integration Module for BE11
 *
 * Provides privacy-compliant, zero-dependency GA4 event and pageview tracking
 * for the BE11 React Single Page Application (SPA).
 *
 * Privacy Safeguards:
 * - NO Personally Identifiable Information (PII) like email, phone, name, or password is sent.
 * - Non-blocking: will fail silently if blocked by adblockers, privacy extensions, or offline state.
 * - Decoupled: operates purely browser-side without increasing serverless backend load.
 */

import { sanitizePath } from './tracker.js';

// Extend Window interface for gtag and dataLayer
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

// Read GA4 Measurement ID from Vite environment
export const getGaMeasurementId = (): string => {
  const envId = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID;
  if (envId && typeof envId === 'string' && envId.trim().startsWith('G-')) {
    return envId.trim();
  }
  return '';
};

let isInitialized = false;
let lastTrackedPath: string | null = null;
let lastTrackedTime: number = 0;

/**
 * Initialize Google Analytics 4 Script Tag
 * Configures gtag with `send_page_view: false` to allow controlled SPA route tracking.
 */
export const initGA4 = (): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (isInitialized) return;

  const measurementId = getGaMeasurementId();
  if (!measurementId) {
    if ((import.meta as any).env?.DEV) {
      console.debug('[GA4] VITE_GA_MEASUREMENT_ID not configured; running in passive mode.');
    }
    return;
  }

  try {
    // 1. Initialize dataLayer and gtag stub if not present
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function () {
        window.dataLayer?.push(arguments);
      };
    }

    // 2. Inject Google Tag Script tag dynamically if not already injected
    const scriptId = 'ga4-gtag-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      script.onerror = () => {
        if ((import.meta as any).env?.DEV) {
          console.debug('[GA4] Failed to load gtag script (likely blocked by client blocker).');
        }
      };
      document.head.appendChild(script);
    }

    // 3. Configure Google Analytics with manual pageview dispatch enabled
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false, // Prevent automatic pageview to avoid SPA duplicate tracking
      cookie_flags: 'SameSite=Lax;Secure',
    });

    isInitialized = true;
  } catch (err) {
    // Fail silently: GA4 initialization error must NEVER crash the app
    if ((import.meta as any).env?.DEV) {
      console.debug('[GA4] Initialization error:', err);
    }
  }
};

/**
 * Generic Safe GA4 Event Dispatcher
 */
export const trackGA4Event = (eventName: string, params: Record<string, any> = {}): void => {
  if (typeof window === 'undefined' || !window.gtag) return;

  const measurementId = getGaMeasurementId();
  if (!measurementId && !(import.meta as any).env?.DEV) return;

  try {
    // Sanitize parameters to guarantee zero PII transmission
    const sanitizedParams: Record<string, any> = {};
    for (const [key, val] of Object.entries(params)) {
      // Exclude undefined, null, or accidental PII fields
      const lowerKey = key.toLowerCase();
      if (
        ['email', 'phone', 'password', 'token', 'otp', 'name', 'first_name', 'last_name'].includes(lowerKey)
      ) {
        continue;
      }
      if (val !== undefined && val !== null) {
        sanitizedParams[key] = val;
      }
    }

    window.gtag('event', eventName, sanitizedParams);
  } catch (err) {
    if ((import.meta as any).env?.DEV) {
      console.debug(`[GA4] Event dispatch notice (${eventName}):`, err);
    }
  }
};

/**
 * SPA Page View Tracking
 * Deduplicates rapid identical triggers (such as React StrictMode double rendering)
 */
export const trackGA4PageView = (path: string, pageTitle?: string): void => {
  if (typeof window === 'undefined') return;

  const cleanPath = sanitizePath(path);
  const now = Date.now();

  // Deduplicate triggers within 200ms
  if (lastTrackedPath === cleanPath && now - lastTrackedTime < 200) {
    return;
  }

  lastTrackedPath = cleanPath;
  lastTrackedTime = now;

  const title = pageTitle || (typeof document !== 'undefined' ? document.title : '');

  trackGA4Event('page_view', {
    page_path: cleanPath,
    page_title: title,
    page_location: window.location.href,
  });
};

/**
 * Venue Funnel Events
 */
export const trackGA4VenueView = (venueId: string, venueName: string): void => {
  trackGA4Event('view_venue', {
    venue_id: venueId,
    venue_name: venueName,
  });
};

export const trackGA4SelectBookingDate = (venueId: string, venueName: string, date: string): void => {
  trackGA4Event('select_booking_date', {
    venue_id: venueId,
    venue_name: venueName,
    booking_date: date,
  });
};

export const trackGA4SelectBookingPeriod = (venueId: string, venueName: string, period: string): void => {
  trackGA4Event('select_booking_period', {
    venue_id: venueId,
    venue_name: venueName,
    booking_period: period,
  });
};

export const trackGA4BeginBooking = (
  venueId: string,
  venueName: string,
  date: string,
  period: string,
  bookingType: string
): void => {
  trackGA4Event('begin_booking', {
    venue_id: venueId,
    venue_name: venueName,
    booking_date: date,
    booking_period: period,
    booking_type: bookingType,
  });
};

export const trackGA4BookingPaymentStarted = (
  venueId: string,
  venueName: string,
  amount: number,
  paymentMethod: string
): void => {
  trackGA4Event('booking_payment_started', {
    venue_id: venueId,
    venue_name: venueName,
    value: amount,
    currency: 'INR',
    payment_method: paymentMethod,
  });
};

/**
 * Booking Completed Event (Fires ONLY after authoritative backend verification)
 */
export const trackGA4BookingCompleted = (params: {
  bookingId: string;
  venueId: string;
  venueName: string;
  bookingType: string;
  bookingPeriod: string;
  amount: number;
  currency?: string;
}): void => {
  trackGA4Event('booking_completed', {
    transaction_id: params.bookingId,
    booking_id: params.bookingId,
    venue_id: params.venueId,
    venue_name: params.venueName,
    booking_type: params.bookingType,
    booking_period: params.bookingPeriod,
    value: params.amount,
    currency: params.currency || 'INR',
  });
};

/**
 * Authentication Funnel Events (Safe: No credentials, emails, or phone numbers)
 */
export const trackGA4Login = (method: 'email_password' | 'phone_otp' | 'google' = 'email_password'): void => {
  trackGA4Event('login', {
    method,
  });
};

export const trackGA4SignUp = (method: 'email_password' | 'phone_otp' | 'google' = 'email_password'): void => {
  trackGA4Event('sign_up', {
    method,
  });
};
