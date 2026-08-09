# Neo-Brutalist Restyle of the Class X English Study Portal

Date: 2026-08-09
Status: Approved design (approach A — token + accent restyle)

## Goal

Restyle the existing Class X English Literature study portal from the current nautical/romantic dark theme to a Neo-Brutalist design that is unmistakably tied to Grade 10 English literature, without touching content, API, or layout structure. Two themes: light (default) and dark, switched by a Navbar toggle and persisted in localStorage.

## Design decisions (from brainstorming)

- Light neo-brutalism by default, dark mode via `data-theme` on `<html>`, persisted under `localStorage` key `tals-theme`.
- Street-art accent mix (yellow, cyan, magenta, green, red) with functional roles.
- Book-based wayfinding: First Flight units cyan, Footprints Without Feet units magenta, Mariner legacy gold "CLASSIC" stamp.
- Fonts: Space Grotesk (headings), Bricolage Grotesque (body).
- No third-party CSS library; restyle happens in `client/src/styles.css` plus small markup additions (theme toggle, marquee strip, sticker chips).

## 1. Design tokens

### Theme system
- `<html data-theme="light">` (default) or `<html data-theme="dark">`, set by inline script in `client/index.html` before the bundle runs (reads `localStorage['tals-theme']`, avoids flash of wrong theme).
- All colors flow through CSS variables defined under `:root` (light) and `[data-theme="dark"]` (dark). No component logic cares about the theme.

### Light theme
- Background: flat cream `#F5F0E1` with a faint repeating grain/paper pattern (no gradients, no blur).
- Surface (cards): `#FFFFFF`.
- Ink/text: `#111111`.
- Borders: `2.5px solid #111` on cards, buttons, inputs, navbar, badges.
- Shadows: hard offset `4px 4px 0 #111`; pressed state `2px 2px 0 #111` + translate. No blur, no glow.

### Dark theme
- Background: `#141414`, surfaces `#1E1E1E`, text `#F2F2F2`, borders/shadows `#000`.

### Accent palette
- `--yellow: #FFD633` — primary buttons/CTAs, highlights
- `--cyan: #39D2E7` — First Flight book cards, info accents
- `--magenta: #FF6BB0` — Footprints Without Feet book cards
- `--green: #3DDC84` — correct answers, success
- `--red: #FF5A5F` — wrong answers, errors
- Mariner legacy accent: gold `#E8B04B` for the CLASSIC stamp

### Typography
- Headings: Space Grotesk 600/700, tight letter-spacing.
- Body: Bricolage Grotesque 400/500.
- Code/mono unchanged.
- Google Fonts loaded via the existing CDN link approach in `index.html`.

### Shapes
- Border radius reduced to `4px` everywhere (sharp, slight snap). No rounded pill cards.

## 2. Literature identity elements

- **Book covers**: each Home unit card is a mini book cover — 2.5px border, hard shadow, book-colored top band + left spine strip, unit title, "By {author}" small-caps, type tag (POEM / PROSE / PLAY), row-count badges. Hover: slight rotate + shadow grows.
- **Board-exam stamps**: quiz/study cards carry a "BOARD EXAM READY" stamp (rotated, bordered, small-caps). Category tabs become printed library labels: Chapter Notes (summaries), Themes, Character Sketches, Poetic Devices, Value Points, Question Bank (device/analysis labels preserved as appropriate).
- **Device badges**: poetic-device rows render as stamped sticker chips on poem study pages.
- **Marquee strip**: a scrolling ticker under the navbar rotating unit titles + authors (e.g., "A Letter to God · G.L. Fuentes"), built from the units catalog — no copyrighted text.
- **Heritage stamp**: footer badge "Est. 1798 · The Rime of the Ancient Mariner" (facts/title only).
- **Type tags**: POEM / PROSE / PLAY labels on unit cards; Mariner unit carries "CLASSIC" gold stamp.

## 3. Theme toggle + persistence

- A small `ThemeToggle` component in the Navbar reads `localStorage['tals-theme']` (or defaults to `light`), sets `data-theme` on `<html>` and writes the storage key on toggle. No React context needed — only the Navbar uses the state.
- Toggle button in Navbar, right side: bordered chunky button, label `LIGHT ☀ / DARK ☾` showing the current mode; press-to-switch.
- Inline pre-bundle script in `index.html` applies the saved theme.
- Works identically on static Pages hosting (client-side only).

## 4. Component-level changes

- **Navbar**: flat solid background (cream in light, ink in dark), 2.5px black bottom border, hard shadow. Brand mark kept. Theme toggle added. Marquee strip beneath.
- **Home**: hero as a bold poster block — big Space Grotesk title, "CLASS X ENGLISH LITERATURE READER" kicker; book-cover cards as described above.
- **Study**: category tabs = printed labels; content cards bordered + hard shadows; device rows as sticker chips.
- **Quiz**: question cards as answer-sheet sheets; option buttons bordered with press state; correct = green fill, wrong = red fill + X stamp; score panel as thick-bordered RESULT CARD.
- **Flashcards**: flip behavior untouched; faces get borders + hard shadows; flip hint as stamped chip.
- **Search / Admin / Profile / Login / Register**: token-level only (colors, borders, shadows, radius). No structural changes.
- **Scrollbar, selection, code, mark**: re-tokenized to the new palette.

## 5. Scope guardrails

- No changes to content data (`server/content/*`, `client/src/data/*`), API routes, or auth logic.
- Mariner content stays verbatim (legacy unit untouched).
- No changes to layout structure except: marquee strip (Navbar), theme toggle (Navbar), sticker chip markup for devices (Study page).
- Dark mode is not a new backend feature — pure CSS token swap.

## 6. Verification

1. `node scripts/generate-fallback.cjs --check` in `client/` — must stay green (31 units) after any data regen.
2. Build both modes: default base and `VITE_BASE=/The-Rime-Of-The-Ancient-Mariner/ npm run build`.
3. Quick server smoke test (`/api/units` returns 31).
4. Manual sanity: toggle persists after reload (localStorage), light + dark both readable, marquee animates, device chips visible on a poem unit, quiz feedback colors correct.
5. Commit, push, confirm Pages workflow success, live site HTTP 200.
