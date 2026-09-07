# BE11 — Production Deployment Pre-Flight & Post-Flight Checklist

This checklist tracks the compliance and verification status across all 53 phases of production readiness for the BE11 sports platform.

---

## 1. Data Integrity & Venues
- [x] **No dummy venues**: Zero mock venues ("Elite Cricket Turf", "Victory Football Turf", "PowerPlay Arena" have been purged).
- [x] **Exact 3 real production venues**:
  - **RRR Cricket Club Kidawali Faridabad** (Rishi • +91 97116 69718 • 28.466611, 77.397333)
  - **Playnow Cricket Ground** (Aanurag Jain • +91 95992 80399 • Dynamic Weekday/Weekend Period Matrix)
  - **AB Cricket Ground** (Rajesh Bajaj • +91 95402 28222 • ₹3,500/₹6,500 Whole Ground)
- [x] **Zero dummy bookings**: Database bookings reset to 0 initial records.
- [x] **Zero fake live matches**: `/live-matches` displays a professional empty state ("NO LIVE MATCHES RIGHT NOW").
- [x] **Zero initial player funds**: Player default wallet balance is strictly `₹0.00`. No demo funds or mock transactions.

---

## 2. Booking Model & Anti-Collision Security
- [x] **No hourly slots**: Replaced entirely with Match Periods (`MORNING`, `AFTERNOON`, `DAY_NIGHT`, `NIGHT`).
- [x] **Customer booking flow**: Sequential 4-step wizard (`Date & Period` → `Details` → `Type: Team of 11 vs Whole Ground` → `Summary`).
- [x] **Date-based server-side pricing**: Dynamic weekday vs weekend prices calculated atomically on the backend. Client-provided prices are strictly ignored.
- [x] **Double booking protection**: Server-side transactional locks prevent conflicting reservations for the same venue, date, and match period.

---

## 3. Administrative Control
- [x] **Admin venue booking dashboard**: Accessible at `/admin/bookings` for `ADMIN` and `SUPER_ADMIN`.
- [x] **Real database KPIs**: Live counts of Total Bookings, Pending Requests, Confirmed, Cancelled, Today's Bookings, and Booked Revenue (zero hardcoded numbers).
- [x] **Booking approval & anti-collision guard**: Admins can approve pending requests with collision checks, logging `confirmedAt` and `confirmedById`.
- [x] **Booking cancellation & wallet refund**: Requires cancellation reason, logs `cancelledAt`, `cancelledById`, `cancellationReason`, and automates wallet refunds for paid reservations.
- [x] **Customer in-app notifications**: Confirmation and cancellation emit notifications to the customer.
- [x] **Venue availability inspector**: Visual slot-by-slot status cards (`AVAILABLE` vs `CONFIRMED`) across all 4 periods.
- [x] **RBAC security guard**: Non-admin users (`PLAYER`, `COACH`, `VENUE_OWNER`) receive HTTP 403 Forbidden on all `/api/v1/admin/*` endpoints.

---

## 4. Media, Assets & Interactive Features
- [x] **Venue images**: Stored in public assets (`/venues/rrr/*`, `/venues/playnow/*`, `/venues/ab/*`) using root-relative paths. No Windows/localhost filesystem paths.
- [x] **Venue videos**: Playnow ground videos served via static assets.
- [x] **Maps & location system**: Interactive Leaflet maps using decimal coordinates. Nearest venue calculations based on Haversine distance with geolocation fallback.
- [x] **Empty state location message**: Unlisted locations (e.g. Gurugram, Delhi) show `"NO VERIFIED VENUES AVAILABLE"`.
- [x] **Jersey Builder**: 3D canvas loads `/shirt_baked.glb` with dynamic colors, numbers, names, textures, and download previews.
- [x] **Coin Toss**: Audio playback powered by `/audio/Ipl_Toss_Audio.mp3` triggered only on user interaction with sound toggle and 3D coin animation.

---

## 5. Security & Authentication
- [x] **No secrets in Git**: `.gitignore` strictly ignores `.env*` (except `.env.example`), `dev.db`, `scratch/`, and build artifacts.
- [x] **Environment templates**: Root `.env.example`, `backend/.env.example`, and `frontend/.env.example` contain clean placeholders without hardcoded credentials.
- [x] **Google OAuth 2.0**: Environment-variable based (`VITE_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`). No hardcoded secrets. Documented in `docs/GOOGLE_OAUTH_SETUP.md`.
- [x] **Email verification & password reset**: Implemented with time-limited tokens and secure bcrypt hashing.
- [x] **Secure admin setup**: Production admin initialization script `npm run init:admin --workspace=backend`. No hardcoded admin passwords in frontend code.
- [x] **CORS configuration**: Backend restricts origins based on `FRONTEND_URL` environment variable.

---

## 6. Build, Testing & Deployment
- [x] **Production build passes**: `npm run build` cleanly compiles `@be11/shared`, `backend` (`tsc`), and `frontend` (`tsc && vite build`).
- [x] **Automated test suite**: `npx tsx backend/scripts/verify-admin-bookings.ts` runs 13 end-to-end checks against live backend API with 100% pass rate.
- [x] **Frontend production API configuration**: `frontend/src/config/env.ts` uses `VITE_API_URL` in production, eliminating hardcoded `localhost:5000`.
- [x] **Vercel deployment**: Configured in `vercel.json` with monorepo build command, `frontend/dist` output directory, and SPA routing rewrites.
- [x] **Backend deployment**: Documented for containerized/PM2 hosting with Dockerfile, `docker-compose.yml`, and environment variable specifications.
