# BE11 Live Matches Architecture & Data Integrity

## 1. Overview & Non-Negotiable Standards
BE11 mandates that the `/live-matches` page is strictly powered by real database records.
All fabricated cards, mock participants, dummy countdowns, seed matches, and simulated Delhi weather widgets have been permanently expunged.

---

## 2. Match Data Model & Lifecycle
Matches are tracked directly in the SQLite/Postgres database using the Prisma `Match` model:

- **States**:
  - `OPEN`: Match lobby is open for players/teams to join.
  - `LIVE`: Match is actively underway on the pitch.
  - `COMPLETED`: Match concluded, statistics finalized.
  - `CANCELLED`: Match aborted/cancelled.

- **Only `OPEN` and `LIVE` matches** are queried and displayed on the active match lobbies board.

---

## 3. Removal of Dummy Data
The following elements have been completely eradicated:
1. **Mock Match Cards**: No mock teams (e.g., `Sunday Morning Cricket XI`, `Evening Football Turf`, `Turf Practice Session`).
2. **Fake Metrics**: No artificial `18 / 22 joined`, `4 spots left`, or `₹299` placeholders.
3. **Simulated Weather Widget**: The hardcoded `Live Delhi Weather 32°C Clear Skies 84% Humidity` mock card was deleted. No unauthenticated or fabricated weather predictions are presented.
4. **No Fallback Mocking**: When `matches.length === 0`, the system explicitly returns an empty array `[]`. Under no circumstance are dummy matches generated as fallback items.

---

## 4. Professional Empty State
When the database contains zero open matches for the user's selected location and sport category, the frontend displays the verified, production-grade empty state:

```
┌────────────────────────────────────────────────────────┐
│                          🏟️                            │
│                                                        │
│               NO LIVE MATCHES RIGHT NOW                │
│                                                        │
│   There are currently no open matches available in     │
│   your area. Check back later or create/book your      │
│   own match.                                           │
│                                                        │
│                 [ EXPLORE VENUES ]                     │
└────────────────────────────────────────────────────────┘
```

Clicking **[ EXPLORE VENUES ]** navigates the user to `/venues` where they can view real grounds (RRR Cricket Club, Playnow Cricket Ground, AB Cricket Ground) and book match periods.

---

## 5. Real-Time Updates
The match board connects via Socket.IO to receive live updates (`match-update` events).
When a real match is created or a player registers, the board dynamically updates without requiring full-page reload.
