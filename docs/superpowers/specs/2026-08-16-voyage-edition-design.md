# "The Voyage Edition" — Interactive Literary-Artifact Layer

**Date:** 2026-08-16
**Status:** Approved (design + refinements)
**Project:** Class X English Study Portal (TALS) — The-Rime-Of-The-Ancient-Mariner

## 1. Vision

Layer gamified interactivity onto the study portal without breaking its warm
parchment (Anthropic-style) identity: every mechanic is rethemed as a classic
literary artifact — nautical charts, wax seals, manuscript marginalia, woodcut
illustration, printing-press cards. All state lives client-side so the GitHub
Pages static deployment keeps working with zero server changes.

## 2. Design language (new CSS layer, appended to `client/src/styles.css`)

- Wax-seal tones: `--seal-gold: #c9a227`, `--seal-copper: #b87333`,
  `--seal-brass: #8a7a3c` (light + dark variants in `[data-theme='dark']`).
- Hand-drawn compass paths: dashed `stroke-dasharray` SVG lines in ink/gold.
- Fountain-pen underlines: thin gold gradient underline (2px, rounded) on
  key terms inside marginalia drawers.
- Marginalia drawers: parchment-bordered side panels (serif, aged-paper
  background `#f6efdf`-family), slide-in from the right.
- Woodcut mascot: cross-hatched ink SVG (stroke-based etching, gold accent).
- Printing-press cards: serif headers, gold-foil border
  (`1px solid var(--seal-gold)` + subtle gradient), flip animations.
- Accessibility: all new interactive elements ≥ 48px touch targets on mobile;
  `@media (prefers-reduced-motion: reduce)` disables flips/drawer slides.
- Do NOT touch the exam-paper print stylesheet or the teacher-tools layer.

## 3. Data & state (all client-side, no server changes)

- `client/src/games/progress.js` — single progress store:
  - `localStorage` with **try-catch + in-memory fallback** (incognito/blocked
    storage must not crash the app).
  - Keys: `tals-logbook` (streak + daily activity), `tals-coins` (Mariner
    Coins balance + ledger), `tals-seals` (per-unit completion map),
    `tals-unlocks` (derived, not stored), quiz best scores reused from the
    existing quiz storage.
  - Streak rule: a "day at sea" is banked when the student answers ≥5
    flashcards or reviews ≥1 summary (Study page visit counts as review) on a
    calendar day; streak = consecutive days with an entry.
  - Coins: +10 for a study day, +25 for a gold seal (100% quiz), +15 for a
    completed unit seal; spendable in the Ship's Stores.
- `client/src/games/pairs.js` — curated Quote Matcher pairs (quote → poem or
  character) and Device Speed Run prompts (extract → device) drawn strictly
  from existing unit content answers/device entries; every pair validated
  against the catalog at module load (throw-friendly dev check).
- `client/src/games/mascotTips.js` — unit-aware tip bank (exam warnings,
  common mistakes, quote reminders, streak nudges).

## 4. Components (new)

1. **VoyageChart** (`client/src/components/VoyageChart.jsx`) — replaces the
   flat unit shelf on Home:
   - SVG nautical chart on aged parchment; units grouped by kind
     (Prose Cove → Poetry Isles → Drama Strait) in catalog order; dashed
     compass paths between waypoints.
   - Waypoint states: `sealed` (gold seal = quiz ≥90%, copper = completed),
     `unlocked` (next uncompleted), `locked` (dimmed, tap shows a friendly
     "chart not yet drawn" hint). Completing a quiz seals the node and draws
     the path line onward.
   - "Board Exam Readiness" percentage bar (completed units / 13).
   - Mobile: winding vertical reflow, ≥48px touch targets.
2. **StreakCoins bar** (`client/src/components/StreakCoins.jsx`) — header bar:
   "Days at Sea" logbook flame/compass icon + Mariner Coins balance; small
   Ship's Stores modal to spend coins (dark-mode accent themes — gold /
   copper / brass — stored as `data-accent` attribute; custom avatar frame
   for the mascot; 1 downloadable PDF cheat-sheet page is OUT of scope this
   round — store shows theme + frame only, both cosmetic).
3. **DeviceMarginalia** (`client/src/components/DeviceMarginalia.jsx`) —
   integrated into the Study page: device entries become clickable chips; a
   click slides in a parchment marginalia drawer (device name, explanation,
   fountain-pen underlines, archaic-word glosses from `notes`).
4. **AlbatrossMascot** (`client/src/components/AlbatrossMascot.jsx`) —
   mounted once in the App shell: woodcut SVG albatross, fixed bottom corner,
   serif speech bubbles with unit-aware tips; dismissible per session;
   celebratory bubble on streak milestones.
5. **Games page** (`client/src/pages/Games.jsx`) — new `/games` route + nav
   link, two modes styled as printing-press cards:
   - **Quote Matcher**: match 4–6 quote/character (or quote/poem) pairs,
     tap-to-match (mobile-friendly; drag-and-drop only as progressive
     enhancement), instant gold-flash feedback.
   - **Device Speed Run**: 60-second timer; identify the device in a poem
     extract (alliteration / metaphor / personification / simile /
     imagery); streak multiplier; wax-seal score screen.

## 5. Integration points

- `client/src/App.jsx`: add lazy `Games` route, mount `AlbatrossMascot`,
  mount `StreakCoins` in the shell near the navbar.
- `client/src/components/Navbar.jsx`: "Games" link.
- `client/src/pages/Home.jsx`: swap shelf grid for `VoyageChart` (keep the
  "Continue studying" resume card and journey steps).
- `client/src/pages/Study.jsx`: render `DeviceMarginalia` chips + drawer for
  units that have `category === 'device'` content; else a glossary gloss
  mode from `notes`.
- `client/src/api.js`: untouched. `client/src/styles.css`: append the
  artifact layer at the very end.

## 6. Verification

- New vitest tests: `progress.js` (streak math, storage fallback, coins),
  `pairs.js` (pair validity, no duplicates, every id resolves).
- `npm run build`, `npm run check-fallback`, `npm test` (note: one
  pre-existing flaky `app.test.jsx` shelf test fails on clean HEAD — not a
  regression).
- Manual: Home chart states, Study marginalia, mascot bubbles, both games,
  mobile 375px viewport, `prefers-reduced-motion`, incognito mode.

## 7. Out of scope this round

- Server-side streaks/coins (static-first by design).
- Downloadable cheat-sheet store item (store ships theme + frame only).
- Audio/sound effects.
- Git commits/push/deploy — handled by the main session after review.