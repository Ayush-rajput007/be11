# BE11 — Admin Venue Booking Management System

## 1. Executive Summary

The BE11 Admin Venue Booking Management System provides administrators and super administrators with comprehensive, real-time oversight and administrative control over cricket ground bookings across the platform.

The system connects the SQLite/PostgreSQL Prisma database through an Express REST API directly to a responsive, enterprise-grade React dashboard (`/admin/bookings`), enforcing strict role-based access control (RBAC), end-to-end audit logging, anti-collision verification, customer in-app notifications, and automated wallet refund processing.

---

## 2. Architecture & RBAC Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                 React Frontend Client                       │
│  - /admin/bookings (Admin Dashboard)                        │
│  - /my-bookings (Customer Dashboard)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ Bearer JWT Token
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Express Authentication Layer                │
│  - authenticate (Verifies valid JWT)                        │
│  - authorize('ADMIN', 'SUPER_ADMIN')                        │
│    (Rejects PLAYER, COACH, VENUE_OWNER with HTTP 403)       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Admin Bookings Controller                   │
│  - Metrics & Aggregations (Zero Hardcoded Stats)            │
│  - Paginated & Multi-Criteria Filtering                     │
│  - Confirm Booking (Anti-Collision + Notification)          │
│  - Cancel Booking (Audit Reason + Wallet Refund + Notif)    │
│  - Venue Availability Inspector                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Prisma ORM & Database Layer                 │
│  - Booking (audit fields: confirmedAt, confirmedById,       │
│    cancelledAt, cancelledById, cancellationReason)          │
│  - Compound indexes on status, date, and venueId            │
└─────────────────────────────────────────────────────────────┘
```

### Access Control Rules:
- **Authorized Roles**: `ADMIN`, `SUPER_ADMIN`.
- **Unauthorized Roles**: `PLAYER`, `COACH`, `VENUE_OWNER`.
- Any unauthorized caller attempting to access `/api/admin/*` receives an immediate `403 Forbidden` JSON response:
  ```json
  {
    "success": false,
    "error": {
      "code": "FORBIDDEN",
      "message": "Access denied. Insufficient permissions."
    }
  }
  ```

---

## 3. Database Schema & Audit Fields

The Prisma `Booking` model has been extended with full administrative audit fields and foreign key relations:

```prisma
model Booking {
  id                 String          @id @default(cuid())
  userId             String
  user               User            @relation(fields: [userId], references: [id])
  groundId           String
  ground             CricketGround   @relation(fields: [groundId], references: [id])
  date               String          // YYYY-MM-DD
  matchPeriod        String          // MORNING, AFTERNOON, DAY_NIGHT, NIGHT
  bookingType        String          // SINGLE_TEAM_OF_11, WHOLE_GROUND, etc.
  bookingFormat      String?         // SINGLE_TEAM_OF_11, ENTIRE_VENUE, INDIVIDUAL
  slot               String
  totalPrice         Float
  status             BookingStatus   @default(PENDING) // PENDING, CONFIRMED, CANCELLED, COMPLETED
  paymentStatus      PaymentStatus   @default(PENDING) // PENDING, PAID, FAILED, REFUNDED
  paymentMethod      PaymentMethod   @default(ONLINE)

  // Administrative Audit & Approval Tracking
  confirmedAt        DateTime?
  confirmedById      String?
  confirmedBy        User?           @relation("BookingConfirmedBy", fields: [confirmedById], references: [id])
  
  cancelledAt        DateTime?
  cancelledById      String?
  cancelledBy        User?           @relation("BookingCancelledBy", fields: [cancelledById], references: [id])
  cancellationReason String?

  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  @@index([status])
  @@index([date])
}
```

---

## 4. REST API Reference

All endpoints are prefixed with `/api/admin` and require an `Authorization: Bearer <token>` header with an `ADMIN` or `SUPER_ADMIN` role.

### 4.1. Real Database Overview Metrics
`GET /api/admin/bookings/stats`

Calculates live platform KPIs from real database records (no hardcoded numbers):
- `totalBookings`: Count of all bookings.
- `pendingRequests`: Count of bookings awaiting approval (`status = 'PENDING'`).
- `confirmed`: Count of active confirmed bookings (`status = 'CONFIRMED'`).
- `cancelled`: Count of cancelled bookings (`status = 'CANCELLED'`).
- `todayBookings`: Count of bookings scheduled for current calendar day.
- `bookedRevenue`: Sum of `totalPrice` for non-cancelled bookings.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalBookings": 12,
      "pendingRequests": 3,
      "confirmed": 8,
      "cancelled": 1,
      "todayBookings": 2,
      "bookedRevenue": 145000
    }
  }
}
```

### 4.2. Paginated Booking Listing & Filter Engine
`GET /api/admin/bookings`

Query Parameters:
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `status` (`PENDING` | `CONFIRMED` | `CANCELLED` | `COMPLETED` | `ALL`)
- `venueId` (e.g., `ab-cricket-ground`)
- `date` (YYYY-MM-DD)
- `datePreset` (`TODAY` | `TOMORROW` | `THIS_WEEK` | `THIS_MONTH`)
- `bookingType` (`SINGLE_TEAM_OF_11` | `WHOLE_GROUND`)
- `matchPeriod` (`MORNING` | `AFTERNOON` | `DAY_NIGHT` | `NIGHT`)
- `search` (searches Booking ID, Customer Full Name, Email, Phone Number, Venue Name)

### 4.3. Single Booking Detailed Inspection
`GET /api/admin/bookings/:id`

Returns full booking details including customer contact information, ground address & owner, and administrative audit history.

### 4.4. Confirm / Approve Booking Request
`PATCH /api/admin/bookings/:id/confirm`

Business Logic:
1. Validates that the booking exists and is currently in `PENDING` status.
2. Performs an **Anti-Collision Guard**: Checks if another booking has already been confirmed for the same `groundId`, `date`, and `matchPeriod`. If a collision is found, returns `409 Conflict`.
3. Updates `status` to `CONFIRMED`.
4. Records `confirmedAt = now()` and `confirmedById = admin.id`.
5. Emits an in-app customer notification informing the user that their ground booking has been officially confirmed.

### 4.5. Cancel Booking with Reason & Refund
`PATCH /api/admin/bookings/:id/cancel`

Request Body:
```json
{
  "cancellationReason": "Customer contacted support hotline requesting schedule change"
}
```

Business Logic:
1. Validates that the booking is not already `CANCELLED`.
2. Validates that `cancellationReason` is provided.
3. Updates `status` to `CANCELLED`.
4. Records `cancelledAt = now()`, `cancelledById = admin.id`, and `cancellationReason`.
5. **Wallet Refund Handling**: If the booking was paid via `WALLET` and `paymentStatus` was `PAID`, automatically refunds the `totalPrice` back to the customer's wallet balance and creates a `WALLET_REFUND` transaction record.
6. Updates `paymentStatus` to `REFUNDED`.
7. Emits an in-app customer notification informing the user of the cancellation and the recorded reason.

### 4.6. Venue Availability Inspector
`GET /api/admin/venues/:venueId/availability?date=YYYY-MM-DD`

Inspects real-time slot occupancy across all 4 match periods for any given ground and date:
- `MORNING` (06:00 - 10:00)
- `AFTERNOON` (11:00 - 15:00)
- `DAY_NIGHT` (16:00 - 20:00)
- `NIGHT` (20:30 - 00:30)

For each period, returns `status`: `AVAILABLE` or `BOOKED`, along with customer name and booking ID if occupied.

---

## 5. Frontend Features (`/admin/bookings`)

1. **Dashboard KPI Cards**: Live cards displaying Total Bookings, Pending Requests, Confirmed, Cancelled, Today's Games, and Booked Revenue.
2. **Navigation Tabs**:
   - `ALL BOOKINGS`: Complete filterable data table.
   - `BOOKING REQUESTS`: Focus queue for pending bookings requiring action.
   - `VENUE AVAILABILITY`: Date picker and ground selector showing slot-by-slot status cards.
   - `CALENDAR VIEW`: Full interactive month view with booking density dots and click-to-view date breakdown.
3. **Multi-Criteria Filter Bar**: Combined search box, venue selector, status dropdown, date presets, and reset button.
4. **Action Modals**:
   - **Booking Details Modal**: Full printable view of booking, customer, ground, and audit timestamps.
   - **Confirm Modal**: Safety confirmation dialog with slot anti-collision checks.
   - **Cancel Modal**: Mandatory cancellation reason textarea with audit tracking reminder.
