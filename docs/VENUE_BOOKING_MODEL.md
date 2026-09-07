# BE11 Venue Booking Model Documentation

## 1. Executive Summary & Philosophy
BE11 has transitioned away from traditional, fragmented hourly slots (e.g., `06:00–07:00`, `07:00–08:00`) to a professional **Match Period & Match Package Model**. Cricket matches naturally require extended blocks of continuous play rather than single 60-minute time intervals.

The booking system operates on three primary axes:
1. **Match Date** (which dictates Weekday vs. Weekend operational rules).
2. **Match Period** (broad, structured match windows: `MORNING`, `AFTERNOON`, `DAY_NIGHT`, `NIGHT`).
3. **Booking Type** (capacity tier: `INDIVIDUAL`, `TEAM_OF_11`, `ENTIRE_VENUE`).

All final pricing, verification, and conflict detection are executed **server-side with zero-trust architecture**.

---

## 2. Match Periods

Match periods represent standard cricket match windows:

| Match Period Identifier | Name | Window | Weekday Available | Weekend Available |
| :--- | :--- | :--- | :--- | :--- |
| `MORNING` | Morning Match | 07:00 AM – 11:30 AM | Yes | Yes |
| `AFTERNOON` | Afternoon Match | 12:00 PM – 04:30 PM | Yes | Yes |
| `DAY_NIGHT` | Day-Night Match | 04:30 PM – 08:00 PM | **No** | **Yes** |
| `NIGHT` | Night Match | 08:00 PM – 11:30 PM | Yes | Yes |

*Note: Day-Night matches are reserved exclusively for weekends (Saturday & Sunday).*

---

## 3. Booking Types & Hierarchy

Users specify how they want to book the selected match period:

1. **`INDIVIDUAL`**: Single player looking to join a match roster (1 Player).
2. **`TEAM_OF_11`**: A complete 11-player squad reservation for one side of a match (11 Players).
3. **`ENTIRE_VENUE`**: Exclusive reservation of the entire ground, facilities, and pitch for both teams / tournaments.

---

## 4. Authoritative Pricing Rules & Logic

### Playnow Cricket Ground (`playnow-cricket-ground`)

#### Weekday Pricing (Monday through Friday)
- **Morning Match**: Entire Venue: ₹5,000 | Team of 11: ₹2,500 | Individual: ₹250
- **Afternoon Match**: Entire Venue: ₹5,000 | Team of 11: ₹2,500 | Individual: ₹250
- **Day-Night Match**: *Not available on weekdays*
- **Night Match**: Entire Venue: ₹10,000 | Team of 11: ₹5,000 | Individual: ₹500

#### Weekend Pricing (Saturday & Sunday)
- **Morning Match**: Entire Venue: ₹10,000 | Team of 11: ₹5,000 | Individual: ₹500
- **Afternoon Match**: Entire Venue: ₹5,000 | Team of 11: ₹2,500 | Individual: ₹250
- **Day-Night Match**: Entire Venue: ₹10,000 | Team of 11: ₹5,000 | Individual: ₹500
- **Night Match**: Entire Venue: ₹11,000 | Team of 11: ₹5,500 | Individual: ₹550

### AB Cricket Ground (`ab-cricket-ground`)
Configured via clean Match Packages (no hourly slots):
- **Standard Match Package**: ₹3,500 (Complete match setup with umpire, scorer, balls & pitch prep)
- **Extended Day Match Package**: ₹6,500 (Full-day match setup with pavilion access, flood lights setup & premium pitch)
- **Verified Facilities**: Umpires, Scorers, Drinking Water, Practice Nets, Flood Lights, Balls, Washrooms, Pavilion/Dugout, Sight Screen, Cafeteria.
- **Owner**: Rajesh Bajaj (+91 95402 28222)

### RRR Cricket Club Kidawali Faridabad (`rrr-cricket-club-kidawali-faridabad`)
- **Pricing**: `PRICE ON REQUEST` / `Contact Venue Owner`.
- **Owner**: Rishi (+91 97116 69718)
- No prices are fabricated or estimated.

---

## 5. Zero-Trust Server-Side Calculation Flow

The backend does not accept or trust any client-supplied `price` or `totalPrice`.

```
Client (Browser)
   │
   ├─► Sends { venueId, date, matchPeriod, bookingType }
   │
Backend API (/bookings)
   │
   ├─► 1. Authenticates session (rejects anonymous requests)
   ├─► 2. Validates ground existence and isActive state
   ├─► 3. Evaluates Date -> Weekday vs. Weekend
   ├─► 4. Checks Day-Night eligibility (rejects weekday DAY_NIGHT)
   ├─► 5. Queries active/pending reservations for (groundId, date, matchPeriod)
   ├─► 6. Recalculates authoritative price from pricing rules
   ├─► 7. Atomically creates Booking record with serverCalculatedPrice
   │
   └─► Returns { success: true, booking, serverCalculatedPrice }
```

---

## 6. Double-Booking Prevention & Collision Resistance

Reservations for match periods are protected against collisions:
- Uniqueness is enforced on `(groundId, date, matchPeriod)`.
- Cancelled bookings (`status: CANCELLED`) release the match period back into available inventory.
- Concurrent booking attempts for the same ground, date, and match period receive an immediate `409 Conflict` with:
  `"This match period has already been reserved for the selected date."`

---

## 7. Authentication Flow & State Preservation

- When an unauthenticated user clicks **CONTINUE TO BOOK**, the frontend routes to `/login` carrying:
  ```ts
  state: {
    from: location.pathname,
    bookingState: {
      date: '2026-09-12',
      selectedPeriod: 'DAY_NIGHT',
      bookingType: 'TEAM_OF_11'
    }
  }
  ```
- Upon successful login, the application automatically redirects back to the venue detail page and restores `date`, `selectedPeriod`, and `bookingType` so the user does not need to reselect their match preferences.
