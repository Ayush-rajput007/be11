# BE11 Development Login Credentials

> [!WARNING]
> **DEVELOPMENT / TESTING ONLY**  
> These credentials must **NEVER** be presented or used as production credentials.  
> The password must be changed or this account disabled before any production deployment.

---

### PLAYER Account

- **Email:** `player.demo@be11.local`
- **Password:** `BE11Player@2026!`
- **Role:** `PLAYER`
- **Purpose:** Development and local automated/manual testing.
- **Initial Wallet Balance:** ₹100,000.00
- **Email Status:** Verified (`emailVerified: true`)

---

### Security Notes

1. **Password Hashing:** Stored as a salted bcrypt hash in the database via the idempotent seed script (`backend/prisma/seed/seed.ts`).
2. **Public UI Isolation:** These credentials are not displayed or hardcoded anywhere in the public login page UI.
3. **Role Enforcement:** Account is strictly restricted to the `PLAYER` role (no `ADMIN`, `SUPER_ADMIN`, `COACH`, or `OWNER` permissions).
