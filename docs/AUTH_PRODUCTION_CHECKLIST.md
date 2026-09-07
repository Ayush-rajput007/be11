# BE11 Production Authentication Checklist

Use this checklist to verify that all authentication features are production-ready and securely configured before deploying to staging/production servers.

---

- [x] **Remove Demo Account UI**: Verify that the login page contains no preset quick login credentials or demo buttons.
- [ ] **Google OAuth Client Credentials**: Ensure `GOOGLE_CLIENT_ID` (backend) and `VITE_GOOGLE_CLIENT_ID` (frontend) are configured with real production credentials.
- [ ] **JWT Session Secret**: Change `JWT_SECRET` in the production environment variables to a long, secure, randomly generated secret string.
- [ ] **Rate Limiting Active**: Confirm rate limiters are active on critical authentication endpoints (`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/google`).
- [ ] **Disable Seeding in Production**: Ensure `NODE_ENV` is set to `production` so database seeding exits without writing test accounts.
- [ ] **CORS Settings Restricted**: Double check that `FRONTEND_URL` is configured to your production domain, prohibiting `*` wildcards.
- [ ] **Secure Session Cookies**: Check that cookies use `secure = true` and `SameSite = strict` flags in the production environment.
- [ ] **Password Strength Checks**: Verify that registration requires at least 8 characters.
- [ ] **Email Lowercasing/Trimming**: Verify that database checks lowercase the email address to avoid duplicate accounts.
