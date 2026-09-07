# BE11 Authentication & Security Architecture

## Overview
BE11 implements a robust, multi-provider authentication framework built on **JWT (JSON Web Tokens)**, salted **bcrypt** password hashing, secure **session persistence**, and **Google OAuth 2.0**.

---

## 1. Authentication Strategy

### Email / Password Login
1. User provides credentials via the branded BE11 login UI (`/login`).
2. Backend searches user by normalized lowercase email.
3. Password hash is verified using `bcrypt.compare`.
4. Access token (short-lived, 15m) and Refresh token (long-lived, 7d) are signed and returned.
5. User DTO returned contains:
   - `id`, `email`, `name`, `role`, `emailVerified`, `avatar`
   - **Never returns** `passwordHash`, `resetToken`, or secrets.

### Protected Routes & Session Persistence
- The client stores tokens in `localStorage` (`accessToken`, `refreshToken`) and initializes the global `useAuthStore` (Zustand).
- On application mount or browser reload, the frontend calls `GET /api/v1/auth/me`.
- If the token is valid, session state is automatically restored.
- If the access token expires, an Axios interceptor requests a new token via `POST /api/v1/auth/refresh`.
- `ProtectedRoute` ensures users with `emailVerified === false` are directed to `/verify-email` while verified users proceed directly to their role-specific dashboard.

### Logout
- User clicks "Sign Out" or "Logout".
- `POST /api/v1/auth/logout` is dispatched to clear refresh tokens on the server.
- `useAuthStore` wipes local state and credentials from `localStorage`.
- Protected routes immediately redirect unauthenticated visits back to `/login`.

---

## 2. Password Security & Sanitization
- **Salt Rounds:** 10 rounds with bcrypt.
- **Payload Sanitization:** `passwordHash`, verification codes, and reset tokens are excluded from all API outputs via Prisma select and DTO mapping.
- **Client Security:** Passwords are never persisted in web storage.

---

## 3. Email Verification Flow
1. Upon registration (`POST /api/v1/auth/register`), an account is created with `emailVerified: false`.
2. A 6-digit cryptographic verification code is generated with a 24-hour expiration (`emailVerificationExpires`).
3. User receives the verification code via email (or development log in local mode).
4. User submits the code on `/verify-email` (`POST /api/v1/auth/verify-email`).
5. On success, `emailVerified` becomes `true` and the token is consumed.
6. **Resend Rate Limiting:** `POST /api/v1/auth/resend-verification` enforces a 60-second cooldown per email to prevent abuse.

---

## 4. Password Reset Flow
1. User requests reset on `/forgot-password` with their email.
2. Backend generates a secure random token and expiration timestamp (1 hour).
3. Reset link is dispatched: `/reset-password?email={email}&code={token}`.
4. User enters a new password on `/reset-password` (meeting minimum strength requirements).
5. Backend verifies token validity, securely hashes new password, clears the reset token, and invalidates existing sessions.

---

## 5. Google OAuth 2.0 Integration & Account Linking

### Flow
1. User clicks "Continue with Google".
2. If `VITE_GOOGLE_CLIENT_ID` is unconfigured, the UI presents an informative modal/guidance message rather than triggering an unhandled 401 error.
3. Upon user authorization in Google, the Google identity token/authorization code is processed by `POST /api/v1/auth/google`.
4. Backend verifies the Google `sub` (subject identifier) and email with Google's API.

### Account Linking Rules
- **Existing User with Same Email:** Safely links Google provider identity (`provider = GOOGLE`, `providerId = googleSub`) without duplicating the account. `emailVerified` is marked `true` since Google verifies ownership.
- **New User:** Automatically registers account with role `PLAYER`, initializes wallet with starting balance, and marks `emailVerified: true`.
- **Identity Stability:** The Google `sub` is stored as `providerId` to ensure consistent identification across email renames.

---

## 6. Environment Configuration

### Backend (`backend/.env`)
```bash
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://be11:be11secret@localhost:5432/be11_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_REFRESH_EXPIRES_IN="7d"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/v1/auth/google/callback"

# SMTP Email (Optional in dev; falls back to dev logging)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="smtp-username"
SMTP_PASSWORD="smtp-password"
SMTP_FROM="noreply@be11.com"
```

### Frontend (`frontend/.env`)
```bash
VITE_API_URL="http://localhost:5000/api/v1"
VITE_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
```

---

## 7. Production Deployment Checklist
- [ ] Rotate `JWT_SECRET` and `JWT_REFRESH_SECRET` to cryptographically secure 64-character hex strings.
- [ ] Configure production domain authorized origins and redirect URIs in Google Cloud Console.
- [ ] Ensure SMTP credentials are set up with a transactional email provider (SendGrid, AWS SES, or Postmark).
- [ ] Run `npm run build` across all workspaces to ensure zero type errors.
- [ ] Disable or change password of `player.demo@be11.local`.
