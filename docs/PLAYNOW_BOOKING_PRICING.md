# Playnow Cricket Ground — Booking & Pricing Architecture

## Overview
Playnow Cricket Ground utilizes a **Date-Based Match Period Booking System** rather than traditional hourly slots. Users book an entire match period (for both teams) on a selected calendar date.

---

## 1. Match Periods
Playnow offers four standard match periods:
- **Morning Match**: Ideal for morning fixtures (e.g. 07:00 – 11:00)
- **Afternoon Match**: Ideal for midday/afternoon fixtures (e.g. 11:30 – 15:30)
- **Day-Night Match**: Special extended fixture under lights (**Weekends only**)
- **Night Match**: Prime evening fixture under floodlights (e.g. 19:00 – 23:00)

> [!IMPORTANT]
> **Day-Night** is dynamically disabled and hidden on weekdays per business rules.

---

## 2. Official Pricing Rules

All prices cover **both teams** for the full period.

| Day Type | Match Period | Price (INR) | Availability |
| :--- | :--- | :--- | :--- |
| **Weekday** (Mon – Fri) | Morning | ₹5,000 | Available |
| **Weekday** (Mon – Fri) | Afternoon | ₹5,000 | Available |
| **Weekday** (Mon – Fri) | Day-Night | — | **Not Available** |
| **Weekday** (Mon – Fri) | Night | ₹10,000 | Available |
| **Weekend** (Sat – Sun) | Morning | ₹10,000 | Available |
| **Weekend** (Sat – Sun) | Afternoon | ₹5,000 | Available |
| **Weekend** (Sat – Sun) | Day-Night | ₹10,000 | Available |
| **Weekend** (Sat – Sun) | Night | ₹11,000 | Available |

---

## 3. Date & Day Type Determination
The day type is calculated strictly from the **user's selected calendar date** (not today's date):
```typescript
const d = new Date(selectedDate);
const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday
const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
```
- **Weekday**: Monday (1), Tuesday (2), Wednesday (3), Thursday (4), Friday (5)
- **Weekend**: Saturday (6), Sunday (0)

---

## 4. Zero-Trust Server-Side Price Calculation
The frontend displays dynamic prices and smooth animated transitions, but client-supplied prices are **never trusted**.

When the client issues a booking request:
```json
POST /api/v1/bookings
{
  "groundId": "c206e1cc-51fa-4c67-8773-d0cbd7b518c1",
  "date": "2026-09-12T00:00:00.000Z",
  "matchPeriod": "DAY_NIGHT"
}
```
The backend:
1. Validates the ground exists and reads its `pricingRules` JSON from the database.
2. Parses the date and validates it is not in the past.
3. Computes whether the date is a weekday or weekend.
4. Validates that the requested `matchPeriod` exists and is allowed for that day type (e.g. rejects `DAY_NIGHT` on weekdays with HTTP 400).
5. Reads the authoritative price from `pricingRules[dayType][matchPeriod]`. Any `price` field sent by the client is completely ignored.
6. Deducts the verified price from user's wallet or initiates payment gateway transaction.

---

## 5. Double Booking Protection & Atomic Locks
Each ground + date + match period can only be booked **once** (unless previous bookings were `CANCELLED`).
The backend enforces this inside an interactive Prisma database transaction (`$transaction`):
1. Checks for existing bookings on `(groundId, date, matchPeriod)` with status `PENDING` or `CONFIRMED`.
2. If found, aborts immediately with `HTTP 409 Conflict: "This match period is already booked for the selected date."`
3. Database index on `(groundId, date, matchPeriod)` ensures fast, collision-free lookup.

---

## 6. Venue Isolation
Pricing rules are strictly venue-specific:
- **Playnow Cricket Ground**: `TIME_SLOT_MATRIX` model with dynamic date + match period pricing.
- **AB Cricket Ground**: `PACKAGE_TIERS` model (Silver ₹3,500 / Gold ₹6,500) — untouched and isolated.
- **RRR Cricket Club**: `CONTACT_ONLY` model ("Price on Request") — untouched and isolated.

---

## 7. Adding Future Pricing Rules
Future pricing rule adjustments can be configured in the database `Ground.pricingRules` JSON column:
```json
{
  "currency": "INR",
  "periods": {
    "weekday": {
      "MORNING": { "price": 5000, "label": "Morning Match", "hours": "07:00 - 11:00", "available": true },
      "AFTERNOON": { "price": 5000, "label": "Afternoon Match", "hours": "11:30 - 15:30", "available": true },
      "DAY_NIGHT": { "price": 0, "label": "Day-Night Match", "available": false },
      "NIGHT": { "price": 10000, "label": "Night Match", "hours": "19:00 - 23:00", "available": true }
    },
    "weekend": {
      "MORNING": { "price": 10000, "label": "Morning Match", "hours": "07:00 - 11:00", "available": true },
      "AFTERNOON": { "price": 5000, "label": "Afternoon Match", "hours": "11:30 - 15:30", "available": true },
      "DAY_NIGHT": { "price": 10000, "label": "Day-Night Match", "hours": "15:00 - 20:00", "available": true },
      "NIGHT": { "price": 11000, "label": "Night Match", "hours": "19:00 - 23:00", "available": true }
    }
  }
}
```
The controller dynamically falls back to standard defaults if specific keys are omitted, ensuring full backward and forward compatibility.
