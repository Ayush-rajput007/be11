# BE11 — Production Deployment Guide

## 1. Prerequisites & Environment Variables

### Backend Configuration (`backend/.env`)
```bash
# Server & Runtime
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://be11.app

# Database
# For SQLite (default development):
DATABASE_URL="file:./dev.db"
# For PostgreSQL (production recommended):
# DATABASE_URL="postgresql://user:password@db-host:5432/be11?schema=public"

# Authentication & Security
JWT_SECRET=your_strong_production_jwt_secret_min_32_characters
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_min_32_characters
REFRESH_TOKEN_EXPIRES_IN=30d

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-production-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
GOOGLE_CALLBACK_URL=https://api.be11.app/api/v1/auth/google/callback

# Email Service (Nodemailer / SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_smtp_api_key
EMAIL_FROM=no-reply@be11.app

# Payment Gateway (Razorpay / Cashfree)
RAZORPAY_KEY_ID=your_production_key_id
RAZORPAY_KEY_SECRET=your_production_key_secret
```

### Frontend Configuration (`frontend/.env`)
```bash
VITE_API_URL=https://api.be11.app/api/v1
VITE_SOCKET_URL=https://api.be11.app
VITE_GOOGLE_CLIENT_ID=your-production-google-client-id.apps.googleusercontent.com
```

---

## 2. Database Setup & Migrations

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate --workspace=backend
   ```

3. **Deploy Database Migrations**:
   ```bash
   npx prisma migrate deploy --schema=backend/prisma/schema.prisma
   ```

4. **Seed Verified Venues & Initial Configuration**:
   ```bash
   npm run seed --workspace=backend
   ```
   *Note: Seeding creates only the 3 verified real venues with zero dummy bookings, zero dummy matches, and ₹0 player balances.*

---

## 3. Build Commands

### A. Shared Types Package
```bash
npm run build --workspace=@be11/shared
```

### B. Backend Compilation
```bash
npm run build --workspace=backend
```
Output: compiled JavaScript in `backend/dist/`.

### C. Frontend Bundle
```bash
npm run build --workspace=frontend
```
Output: production assets in `frontend/dist/`.

---

## 4. Vercel & Production Process Management

### A. Vercel Frontend Deployment
1. Connect repository `https://github.com/Ayush-rajput007/be11` to Vercel.
2. Configure settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (or select `frontend` if deploying frontend-only)
   - **Build Command**: `npm run build --workspace=@be11/shared && npm run build --workspace=frontend`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `npm install`
3. Configure Vercel Environment Variables:
   - `VITE_API_URL`: Your deployed production backend URL (e.g. `https://api.be11.com`)
   - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID

### B. Production Admin Account Initialization
Initialize the production administrator account securely without hardcoding passwords:
```bash
ADMIN_EMAIL="admin@be11.com" ADMIN_PASSWORD="YourStrongAdminPassword123!" npm run init:admin --workspace=backend
```

### C. Backend Process Management (PM2 / Docker)
Because the backend utilizes persistent WebSockets (`socket.io`) for real-time match events and notifications, it is deployed to a persistent Node.js environment (Render, Railway, Fly.io, AWS ECS, or a VPS):

#### PM2 Setup
```bash
# Start backend server
pm2 start backend/dist/server.js --name "be11-backend" --env production

# Serve frontend build with Nginx or static file server (if self-hosting)
pm2 serve frontend/dist 80 --name "be11-frontend" --spa
```

### Docker Setup
A standard multi-stage Docker build can be used:
```dockerfile
# Backend Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build --workspace=@be11/shared
RUN npm run build --workspace=backend

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./package.json
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

---

## 5. Static Assets & Media Deployment
- Venue media uses public HTTPS URLs hosted on Content Delivery Networks (CDN) or cloud storage (e.g. AWS S3, Cloudinary).
- No Windows filesystem paths or local development links are referenced in production assets.

---

## 6. Pre-Flight Verification Checklist
- [x] Only 3 real venues in database (`RRR Cricket Club`, `Playnow Cricket Ground`, `AB Cricket Ground`).
- [x] AB Cricket Ground owner is **Rajesh Bajaj** (+91 95402 28222).
- [x] Player initial wallet funds are **₹0.0**.
- [x] Zero test/dummy bookings in database.
- [x] Zero dummy matches on live match board.
- [x] Playnow dynamic weekday/weekend pricing active.
- [x] AB Cricket Ground ₹3,500/₹6,500 whole ground pricing active.
- [x] Server-side price calculation and double-booking transaction locks active.
- [x] Admin Venue Booking Management active at `/admin/bookings`.
- [x] Non-admin roles (Player, Coach, Owner) blocked with 403 Forbidden on all admin endpoints.

---

## 7. Seed Accounts & Roles

| Email | Password | Role | Access Level |
| :--- | :--- | :--- | :--- |
| `admin@be11.com` | `Admin@123` | `ADMIN` | Venue bookings management, confirm/cancel audits, KPIs |
| `superadmin@be11.com` | `SuperAdmin@123` | `SUPER_ADMIN` | Global platform administration |
| `player@be11.com` | `Player@123` | `PLAYER` | Cricket ground booking, customer `/my-bookings` portal |
| `coach@be11.com` | `Coach@123` | `COACH` | Training sessions & coaching |
| `owner@be11.com` | `Owner@123` | `VENUE_OWNER` | Venue owner management |

