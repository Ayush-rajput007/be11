# be11 Authentication Testing Credentials

This document provides a guide for testing user management, authentication sessions, and Role-Based Access Control (RBAC) permissions across the be11 platform.

## Test Accounts Registry

| Role | Email | Password | Access Level | Expected Dashboard |
|---|---|---|---|---|
| **Super Admin** | `superadmin@be11.com` | `SuperAdmin@123` | Full DB & system audit access | `/admin` (System Analytics) |
| **Admin** | `admin@be11.com` | `Admin@123` | System audit & reporting | `/admin` (System Analytics) |
| **Player** | `player@be11.com` | `Player@123` | Standard booking and slot credits | `/dashboard` (My Bookings) |
| **Coach** | `coach@be11.com` | `Coach@123` | Coaching workspace and availability | `/dashboard` (Student Sessions) |
| **Ground Owner** | `groundowner@be11.com` | `Ground@123` | Venue details and pricing slots | `/dashboard` (My Grounds) |
| **Vendor** | `vendor@be11.com` | `Vendor@123` | Product cataloging and inventory | `/dashboard` (Products Manager) |
| **Store Manager** | `store@be11.com` | `Store@123` | Store items and order returns | `/dashboard` (Standard) |
| **Organizer** | `organizer@be11.com` | `Organizer@123` | Tournament management and fixtures | `/dashboard` (Standard) |
| **Support** | `support@be11.com` | `Support@123` | Support tickets logs | `/dashboard` (Standard) |

---

## QA Testing Checklist

### 1. Registration Flow
- Navigate to `/signup`.
- Fill in name, email, phone, password, and pick a role (e.g. `Coach` or `Player`).
- Submit registration and verify that you are logged in and redirected to `/dashboard`.

### 2. Login & JWT Cookie Flow
- Navigate to `/login`.
- Input any of the test emails and passwords listed above.
- Verify that authentication succeeds.
- Open Developer Tools -> Application -> Cookies. Verify that an HTTP-Only secure cookie named `be11_refresh_token` is present.
- Verify that a short-lived access token is stored in the React context/Zustand store.

### 3. Silent Refresh Rotation
- Access token rotation happens automatically when requesting profile details or checking sessions.
- In Dev Tools -> Network, check calls to `/api/v1/auth/refresh`. Verify it returns success and updates the client session access token.

### 4. Forgot / Reset Password OTP Verification
- Navigate to `/forgot-password`.
- Input a valid email (e.g., `player@be11.com`) and submit.
- Open the backend node server console output. You will find a debug log listing the generated verification code:
  `[TEST OTP CODE] Reset password code for player@be11.com is: <6-digit-code>`
- Input the code on the Step 2 screen, set your new password, and verify that password update succeeds.

### 5. Multi-Device Session Termination
- Log in and navigate to `/settings`.
- Scroll to **Session Security**. Review the list of active device logins, user-agent details, and IP logs.
- Click **Logout Others** and verify that other device sessions are terminated from the database.

### 6. Logout
- Click the account circle dropdown icon in the top right header, then click **Log Out**.
- Verify that:
  - Access token in local storage / memory state is wiped.
  - HttpOnly `be11_refresh_token` cookie is cleared.
  - User is redirected to `/` (Home page).
