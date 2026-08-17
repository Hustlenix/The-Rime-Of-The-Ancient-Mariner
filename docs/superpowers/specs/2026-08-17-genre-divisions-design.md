# Genre Divisions (Prose, Poetry, Drama) & Student-Focused UI/UX Specification

**Date:** 2026-08-17  
**Status:** Approved  
**Project:** Class X English Study Portal (TALS) — The-Rime-Of-The-Ancient-Mariner

---

## 1. Vision & Purpose

In CBSE Class X English Literature Reader (*Interact in English*), the 13 curriculum units are structured into three distinct genres: **Prose (Lessons)**, **Poetry (Poems)**, and **Drama (Plays)**. Schools and teachers organize their term curriculum, exam blueprints, and revision sessions around these divisions.

This specification elevates the portal from a flat list of 13 units into a structured, chaptered study experience with dedicated visual identities, sticky filter bars, live completion tracking per division, and portal-wide genre categorization.

---

## 2. Curriculum Divisions & Data Mapping

All 13 units are formally assigned to one of three genre divisions:

| Division | Units | Count | Genre Key | Label | Icon |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **I. Prose (Lessons)** | *Two Gentlemen of Verona*, *Mrs Packletide's Tiger*, *The Letter*, *A Shady Plot*, *Patol Babu, Film Star*, *Virtually True* | 6 | `prose` | `Prose / Lessons` | 📜 Scroll |
| **II. Poetry (Poems)** | *The Frog and the Nightingale*, *Not Marble, Nor the Gilded Monuments*, *Ozymandias*, *Snake*, *The Rime of the Ancient Mariner* | 5 | `poem` | `Poetry / Poems` | 🪶 Quill |
| **III. Drama (Plays)** | *The Dear Departed*, *Julius Caesar* | 2 | `drama` | `Drama / Plays` | 🎭 Masks |

### Data Changes
1. **Unit JSONs (`client/src/data/units/*.json`)**:
   - Add `"genre": "prose" | "poem" | "drama"` to every unit definition.
2. **Metadata Helper (`client/src/data/units.js` & `client/src/api.js`)**:
   - Export division constants `GENRE_DIVISIONS`, `GENRES`, and helper `getUnitsByGenre(genre)`.
   - Update fallback generator (`client/scripts/generate-fallback.cjs`) to preserve `genre` metadata in static builds.

---

## 3. Visual Identity & Color System

Each genre receives a distinct color accent and iconography to serve as wayfinding cues throughout the portal without breaking the warm parchment aesthetic:

- **Prose Tokens (Warm Amber & Parchment)**:
  - `--genre-prose-primary: #b87333` (warm copper/amber)
  - `--genre-prose-bg: #fbf7ee`
  - `--genre-prose-border: #e6cca8`
  - Dark mode: `--genre-prose-bg-dark: #2a2016`, `--genre-prose-border-dark: #5c3e21`
- **Poetry Tokens (Deep Teal & Coastal Tide)**:
  - `--genre-poem-primary: #2a7b88` (deep teal / nautical echo)
  - `--genre-poem-bg: #eaf4f6`
  - `--genre-poem-border: #a2ced6`
  - Dark mode: `--genre-poem-bg-dark: #14282c`, `--genre-poem-border-dark: #26555e`
- **Drama Tokens (Royal Burgundy & Velvet Stage)**:
  - `--genre-drama-primary: #7a2850` (royal burgundy)
  - `--genre-drama-bg: #f8eaee`
  - `--genre-drama-border: #dcb3c3`
  - Dark mode: `--genre-drama-bg-dark: #2c121e`, `--genre-drama-border-dark: #58213b`

### Accessibility & Contrast
- Color is never the sole indicator: every badge and tab combines an SVG icon, explicit text label, and distinct border style.
- Contrast ratio ≥ 4.5:1 for all text against division backgrounds in both light and dark modes.

---

## 4. UI & Component Enhancements

### 4.1 Home Page & Voyage Chart (`VoyageChart.jsx` & `Home.jsx`)
- **Sticky Division Filter Bar**:
  - Horizontal chip tabs at the top of the chart:
    - `All (13)` • `📜 Prose (6)` • `🪶 Poetry (5)` • `🎭 Drama (2)`
  - Each tab shows live charted progress (e.g. `Prose 4/6` • `Poetry 2/5` • `Drama 1/2`).
  - Filtering highlights or isolates the selected division on the nautical chart without disrupting scroll position.
- **3 Chapter Sections on Chart**:
  - **Chapter I: Prose Cove / Lessons (6 Units)**
  - **Chapter II: Poetry Isles / Poems (5 Units)**
  - **Chapter III: Drama Strait / Plays (2 Units)**
  - Each chapter section features a division banner card with icon, description, and progress bar (`% Charted`).
- **Micro-Reward Milestone**:
  - Completing all units in a division unlocks a golden chapter seal and displays a celebratory toast banner (*"Chapter Charted: 100% of CBSE Poetry Complete!"*).

### 4.2 Portal-Wide Navigation & Dropdowns
- **Navbar & Unit Switchers (`UnitSwitcher.jsx`, `Navbar.jsx`)**:
  - Dropdown options organized into `<optgroup>` divisions:
    - `📜 Prose (Lessons)`
    - `🪶 Poetry (Poems)`
    - `🎭 Drama (Plays)`
- **Search Page (`Search.jsx`)**:
  - Add quick filter chips for `All`, `Prose`, `Poetry`, `Drama` to allow filtering content by literature genre.
- **Lesson Page Headers (`PageBanner.jsx`, `Breadcrumbs.jsx`)**:
  - Display genre pill tag alongside the kicker (e.g. `📜 PROSE • LESSON 1`).

---

## 5. Testing & Verification

1. **New Unit Tests**:
   - `client/test/genre.test.js`:
     - Verifies all 13 unit JSON files contain valid `genre` attributes (`prose`, `poem`, `drama`).
     - Verifies division counts: Prose = 6, Poetry = 5, Drama = 2 (Sum = 13).
     - Verifies metadata helper functions (`getUnitsByGenre`, `GENRE_DIVISIONS`).
2. **Regression & Build Checks**:
   - `npm run check-fallback`: Ensures generated fallback files validate with 13 units and genre metadata.
   - `npm test`: All tests pass.
   - `npm run build`: Production bundle builds cleanly with no type or asset errors.
3. **Playwright Smoke Test**:
   - Verify filter tabs work on Home page.
   - Verify chapter division headers render with correct unit groupings.
   - Verify unit switchers render optgroup divisions.
   - Verify search genre filters work.

---

## 6. Out of Scope

- Modifying the underlying 425 question rows or 142 quiz questions (content is preserved).
- Altering the print question-paper wizard styling.
