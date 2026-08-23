# QA Regression Checklist

This checklist tracks quality validation procedures for all core sports studio modules.

## 🧭 Navigation & Routing
- [ ] **Homepage Cricket Redirection**:
  - Click anywhere on the Cricket card ("Master the Crease").
  - Target URL should resolve to `/live-matches?sport=cricket`.
  - Active filter tab should highlight **CRICKET**.
- [ ] **Homepage Football Redirection**:
  - Click anywhere on the Football card ("Control the Pitch").
  - Target URL should resolve to `/live-matches?sport=football`.
  - Active filter tab should highlight **FOOTBALL**.
- [ ] **Browser History & Back/Forward**:
  - From Homepage -> click Cricket card -> click Browser Back.
  - Verify back navigation returns to the homepage.
- [ ] **Header Links**:
  - Verify Venues, Live Matches, Coaches, Store, and Jersey Builder load correctly.
- [ ] **Footer Sitemap Links**:
  - Verify Terms, Privacy, Refund, and Quick sitemap links.

## 📜 Scroll Restoration
- [ ] **Scroll position reset**:
  - Scroll homepage to footer -> click Cricket card.
  - Destination page must scroll immediately to top (`scrollY = 0`).
- [ ] **Query parameter scroll reset**:
  - Scroll `/live-matches?sport=cricket` to bottom -> click Football filter.
  - Page must scroll immediately to top (`scrollY = 0`).

## 🏏 Pre-Match Coin Toss
- [ ] **Launch Page**:
  - Click Toss in Header. Browser navigates to `/toss` and page loads at the top.
- [ ] **Toss Audio play**:
  - Click "Flip Coin". The audio `/audio/lpl_Toss_Audio.mp3` plays.
  - Console logs do not show promise rejections or autoplay errors.
- [ ] **Sound Toggler controls**:
  - Toggle Sound Off. Verify coin spins in silence on next flip.
  - Refresh browser page. Verify sound setting remains persisted (retrieved from localStorage).
- [ ] **Outcome consistency**:
  - Verification that visual landing side matches calculated state (Heads/Tails).
- [ ] **Toss Again / Back to Home**:
  - Click Toss Again -> audio resets and plays again.
  - Click Back to Home -> redirects to `/` at scroll position 0.

## 🔒 Authentication & RBAC
- [ ] **Host Match Lobbies Access**:
  - Players cannot see "Host Match Lobbies".
  - Admins, Super Admins, Coaches, and Owners can see "Host Match Lobbies".
