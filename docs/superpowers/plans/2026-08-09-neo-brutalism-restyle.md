# Neo-Brutalist Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Class X English Study Portal from the nautical/romantic dark theme to Neo-Brutalism (light default + dark toggle, literature identity, book-cover cards, board-exam stamps) without touching content, API, or layout.

**Architecture:** All visual changes flow through `client/src/styles.css` — a token rewrite (`:root` values re-mapped to the neo palette, keeping the existing variable NAMES so the 149 existing `var()` usages keep working), a `[data-theme="dark"]` override block, and an appended "NEO-BRUTALIST LAYER" of override rules. Markup changes are limited to: `client/index.html` (fonts + theme pre-script), `Navbar.jsx` (theme toggle + marquee), `Home.jsx` (book-color classes on unit cards), `App.jsx` (heritage stamp), `Study.jsx` (tab labels). Theme state lives in `localStorage['tals-theme']`; no React context needed.

**Tech Stack:** React 18 + Vite (client), CSS custom properties, Google Fonts (Space Grotesk + Bricolage Grotesque), GitHub Pages deploy (existing workflow).

## Global Constraints

- Copy rules: no copyrighted text — marquee uses only unit titles + authors from the catalog; heritage stamp uses the poem title and year only.
- Mariner unit (`rime-of-the-ancient-mariner`) content and classes stay; only its badge label changes ("School legacy" → "CLASSIC").
- No changes to `server/*`, `client/src/api.js`, `client/src/data/*`, or auth logic.
- Keep existing CSS variable names (`--deep-sea`, `--ice`, `--parchment`, etc.) — re-map values, do not rename.
- Build must pass with default base AND `VITE_BASE=/The-Rime-Of-The-Ancient-Mariner/`.
- `node scripts/generate-fallback.cjs --check` (run from `client/`) must stay green: "Validation OK: 31 units, 842 content rows, 320 quiz questions".
- Working dir is the repo root unless a task says otherwise; shell is PowerShell 5.1.

---

### Task 1: index.html — fonts + theme pre-script

**Files:**
- Modify: `client/index.html`

**Interfaces:**
- Produces: `document.documentElement` attribute `data-theme="light"|"dark"` set before bundle loads; Google Fonts link for Space Grotesk + Bricolage Grotesque.

- [ ] **Step 1: Replace the font link**

Replace the Playfair Display / Source Sans 3 `<link>` (lines 10-13 of `client/index.html`) with:

```html
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600&display=swap"
      rel="stylesheet"
    />
```

- [ ] **Step 2: Add the theme pre-script**

Add this right before `</head>` (after the font link):

```html
    <script>
      (function () {
        try {
          if (localStorage.getItem('tals-theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        } catch (e) {}
      })();
    </script>
```

- [ ] **Step 3: Verify**

Run: `npm run build` in `client/`.
Expected: build succeeds; `client/dist/index.html` contains both the Space Grotesk link and the inline script.

- [ ] **Step 4: Commit**

```bash
git add client/index.html
git commit -m "Load neo-brutalism fonts and pre-set saved theme in index.html"
```

---

### Task 2: ThemeToggle component + Navbar (toggle + marquee)

**Files:**
- Create: `client/src/components/ThemeToggle.jsx`
- Modify: `client/src/components/Navbar.jsx` (full rewrite of the file)

**Interfaces:**
- Consumes: `localStorage['tals-theme']` (`'light'` default, `'dark'` stored).
- Produces: `ThemeToggle` — default export, no props, self-contained; sets/reads `data-theme` on `<html>`. Marquee derives items from `api.getUnits()` (returns `{ books: [{ id, name, tagline, units: [{ id, title, author }] }] }`).

- [ ] **Step 1: Create ThemeToggle**

Create `client/src/components/ThemeToggle.jsx`:

```jsx
import { useEffect, useState } from 'react';

const KEY = 'tals-theme';

function getInitial() {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* ignore storage errors */
    }
  }, [theme]);

  return (
    <button
      type="button"
      className="btn btn-ghost btn-small theme-toggle"
      onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? 'LIGHT ☀' : 'DARK ☾'}
    </button>
  );
}
```

- [ ] **Step 2: Rewrite Navbar with toggle + marquee**

Replace the entire content of `client/src/components/Navbar.jsx` with:

```jsx
import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../authContext';
import { api } from '../api';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [marqueeItems, setMarqueeItems] = useState([]);

  useEffect(() => {
    api
      .getUnits()
      .then((d) => {
        const items = (d.books || [])
          .flatMap((b) => b.units || [])
          .map((u) => `${u.title} · ${u.author || 'Anonymous'}`);
        setMarqueeItems(items);
      })
      .catch(() => {
        /* marquee is decorative; ignore failures */
      });
  }, []);

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <svg className="brand-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2C7 6 3 10 3 14a9 9 0 0 0 18 0c0-4-4-8-9-12Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M9 14a3 3 0 0 0 6 0c0-2-3-4-3-4s-3 2-3 4Z" fill="currentColor" opacity="0.85" />
        </svg>
        <span className="brand-text">
          Class X English Study Portal
          <span className="brand-sub">First Flight · Footprints · TALS</span>
        </span>
      </Link>

      <nav className="nav-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Home
        </NavLink>
        <NavLink to="/study" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Study
        </NavLink>
        <NavLink to="/questions" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Questions
        </NavLink>
        <NavLink to="/quiz" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Quiz
        </NavLink>
        <NavLink to="/flashcards" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Flashcards
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Search
        </NavLink>
      </nav>

      <div className="nav-auth">
        <ThemeToggle />
        {loading ? null : user ? (
          <>
            <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {user.name}
            </NavLink>
            {user.role === 'teacher' && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Admin
              </NavLink>
            )}
            <button className="btn btn-ghost btn-small" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Login
            </NavLink>
            <NavLink to="/register" className="btn btn-primary btn-small">
              Register
            </NavLink>
          </>
        )}
      </div>

      {marqueeItems.length > 0 && (
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <span key={i} className="marquee-item">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run build` in `client/`.
Expected: build succeeds. (Styles for `.marquee`, `.marquee-track`, `.marquee-item`, `.theme-toggle` land in Task 4; without them the marquee renders as plain wrapped spans — acceptable interim state.)

- [ ] **Step 4: Commit**

```bash
git add client/src/components/ThemeToggle.jsx client/src/components/Navbar.jsx
git commit -m "Add theme toggle and literature marquee to navbar"
```

---

### Task 3: styles.css — token rewrite + dark theme + flat base

**Files:**
- Modify: `client/src/styles.css` (lines 6-27 `:root` block, and the `body` block at lines 37-47)

**Interfaces:**
- Produces: re-mapped `:root` variables (same names, neo values) + new variables `--border-ink`, `--shadow-ink`, `--paper-dot`, `--yellow`, `--cyan`, `--magenta`, `--green`, `--red`, `--gold`; `[data-theme="dark"]` override block; flat paper-grain body.

- [ ] **Step 1: Replace the `:root` block**

Replace the entire `:root { ... }` block (currently lines 6-27) with:

```css
:root {
  /* light neo-brutalist theme (default) */
  --deep-sea: #f5f0e1; /* page background */
  --abyss: #111111; /* ink */
  --sea: #ffffff; /* card surface */
  --sea-mid: #ffd633; /* primary accent */
  --storm: #5a5a5a;
  --storm-light: #6b6b6b;
  --ice: #111111; /* primary text */
  --ice-dim: #444444;
  --parchment: #111111; /* links */
  --parchment-light: #111111;
  --parchment-deep: #000000;
  --ink: #ffffff; /* text on dark fills */
  --good: #3ddc84;
  --bad: #ff5a5f;
  --radius: 4px;
  --shadow: 4px 4px 0 var(--shadow-ink);
  --shadow-soft: 2px 2px 0 var(--shadow-ink);
  --glow: 0 0 0 3px var(--shadow-ink);
  --serif: 'Space Grotesk', 'Segoe UI', system-ui, sans-serif;
  --sans: 'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif;
  --border-ink: #111111;
  --shadow-ink: rgba(17, 17, 17, 0.92);
  --paper-dot: rgba(17, 17, 17, 0.05);
  --yellow: #ffd633;
  --cyan: #39d2e7;
  --magenta: #ff6bb0;
  --green: #3ddc84;
  --red: #ff5a5f;
  --gold: #e8b04b;
}

[data-theme='dark'] {
  --deep-sea: #141414;
  --abyss: #0e0e0e;
  --sea: #1e1e1e;
  --sea-mid: #ffd633;
  --storm: #8a8a8a;
  --storm-light: #9a9a9a;
  --ice: #f2f2f2;
  --ice-dim: #b4b4b4;
  --parchment: #f2f2f2;
  --parchment-light: #ffffff;
  --parchment-deep: #ffd633;
  --ink: #111111;
  --border-ink: #000000;
  --shadow-ink: rgba(0, 0, 0, 0.9);
  --paper-dot: rgba(255, 255, 255, 0.05);
}
```

- [ ] **Step 2: Replace the body block**

Replace the `body { ... }` block (lines 37-47) with:

```css
body {
  margin: 0;
  font-family: var(--sans);
  color: var(--ice);
  line-height: 1.65;
  background-color: var(--deep-sea);
  background-image: radial-gradient(var(--paper-dot) 1px, transparent 1px);
  background-size: 22px 22px;
  min-height: 100vh;
}
```

- [ ] **Step 3: Update selection, scrollbar and mark colors**

Replace the `::selection` rule (lines 49-52) with:

```css
::selection {
  background: var(--yellow);
  color: var(--abyss);
}
```

Replace the scrollbar thumb rules (lines 63-69) with:

```css
::-webkit-scrollbar-thumb {
  background: var(--border-ink);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--parchment-deep);
}
```

Replace the `mark` rule (lines 94-99) with:

```css
mark {
  background: var(--yellow);
  color: var(--abyss);
  border-radius: 2px;
  padding: 0 0.15rem;
}
```

- [ ] **Step 4: Verify**

Run: `npm run build` in `client/`.
Expected: build succeeds. Optionally start `npm run dev` and confirm the page renders cream with near-black text (dark theme via toggle only after Task 2/4 wiring — attribute set manually in devtools works now).

- [ ] **Step 5: Commit**

```bash
git add client/src/styles.css
git commit -m "Rewrite design tokens to neo-brutalism with dark theme"
```

---

### Task 4: styles.css — the NEO-BRUTALIST LAYER

**Files:**
- Modify: `client/src/styles.css` (append at end of file)

**Interfaces:**
- Consumes: tokens from Task 3; class names listed below (all verified to exist).
- Produces: override rules that win by cascade (appended after all earlier rules).

- [ ] **Step 1: Append the layer header + layout surfaces**

Append to the end of `client/src/styles.css`:

```css
/* ============================================================
   NEO-BRUTALIST LAYER
   ============================================================ */

/* ---------- surfaces ---------- */

.card,
.nav-card,
.journey-step,
.study-card,
.theme-card,
.device-card,
.q-card,
.quiz-runner,
.quiz-result,
.moti-bar,
.page-banner {
  background: var(--sea);
  border: 2.5px solid var(--border-ink);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
}

.card::before {
  display: none;
}

/* ---------- navbar ---------- */

.navbar {
  background: var(--deep-sea);
  border-bottom: 2.5px solid var(--border-ink);
  box-shadow: 0 4px 0 var(--shadow-ink);
  backdrop-filter: none;
}

.nav-link {
  color: var(--ice);
  font-weight: 600;
}

.nav-link.active {
  color: var(--ice);
  border-bottom: 3px solid var(--yellow);
}

.marquee {
  flex-basis: 100%;
  order: 10;
  overflow: hidden;
  border-top: 2.5px solid var(--border-ink);
  margin-top: 0.4rem;
  padding-top: 0.3rem;
}

.marquee-track {
  display: flex;
  gap: 3rem;
  white-space: nowrap;
  animation: marquee-scroll 45s linear infinite;
  width: max-content;
}

.marquee-item {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ice-dim);
}

@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.theme-toggle {
  letter-spacing: 0.04em;
}
```

- [ ] **Step 2: Append buttons**

```css
/* ---------- buttons ---------- */

.btn {
  border: 2.5px solid var(--border-ink);
  border-radius: var(--radius);
  color: var(--ice);
  box-shadow: 2px 2px 0 var(--shadow-ink);
  transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.15s ease;
}

.btn:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--shadow-ink);
}

.btn:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.btn-primary {
  background: var(--yellow);
  color: var(--abyss);
}

.btn-outline {
  background: var(--sea);
  color: var(--ice);
  border: 2.5px solid var(--border-ink);
}

.btn-ghost {
  background: transparent;
  color: var(--ice);
}

.btn-danger {
  background: var(--red);
  color: var(--abyss);
  border: 2.5px solid var(--border-ink);
}

.btn-known {
  background: var(--green);
  color: var(--abyss);
  border: 2.5px solid var(--border-ink);
}

.btn-learning {
  background: var(--yellow);
  color: var(--abyss);
  border: 2.5px solid var(--border-ink);
}
```

- [ ] **Step 3: Append inputs, tabs and study/devices**

```css
/* ---------- inputs ---------- */

input[type='text'],
input[type='password'],
input[type='email'],
input[type='search'],
textarea,
select {
  background: var(--sea);
  color: var(--ice);
  border: 2.5px solid var(--border-ink);
  border-radius: var(--radius);
  padding: 0.5rem 0.6rem;
  font-family: var(--sans);
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  box-shadow: 2px 2px 0 var(--shadow-ink);
}

/* ---------- tabs (printed labels) ---------- */

.tab {
  border: 2.5px solid var(--border-ink);
  border-radius: var(--radius);
  background: var(--sea);
  color: var(--ice);
  font-family: var(--serif);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tab.active {
  background: var(--yellow);
  color: var(--abyss);
  box-shadow: 2px 2px 0 var(--shadow-ink);
}

/* ---------- study cards (board-exam stamp) ---------- */

.study-card {
  position: relative;
  overflow: visible;
}

.study-card::after {
  content: 'BOARD EXAM READY';
  position: absolute;
  top: 0.6rem;
  right: -0.4rem;
  transform: rotate(6deg);
  font-family: var(--serif);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--ice-dim);
  border: 2px solid var(--ice-dim);
  border-radius: 3px;
  padding: 0.15rem 0.4rem;
  background: var(--sea);
  opacity: 0.85;
}

/* ---------- poetic devices as sticker chips ---------- */

.device-card {
  background: var(--sea);
  border: 2.5px solid var(--border-ink);
  border-radius: var(--radius);
  box-shadow: 2px 2px 0 var(--shadow-ink);
}

.device-name {
  display: inline-block;
  background: var(--yellow);
  color: var(--abyss);
  border: 2.5px solid var(--border-ink);
  border-radius: var(--radius);
  padding: 0.3rem 0.7rem;
  margin: 0 0 0.6rem;
  font-family: var(--serif);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 2px 2px 0 var(--shadow-ink);
  transform: rotate(-1deg);
}
```

- [ ] **Step 4: Append quiz + flashcards**

```css
/* ---------- quiz ---------- */

.quiz-option {
  border: 2.5px solid var(--border-ink);
  border-radius: var(--radius);
  background: var(--sea);
  color: var(--ice);
  box-shadow: 2px 2px 0 var(--shadow-ink);
  transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.15s ease;
}

.quiz-option:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--shadow-ink);
}

.quiz-option.correct {
  background: var(--green);
  color: var(--abyss);
  border-color: var(--border-ink);
}

.quiz-option.wrong {
  background: var(--red);
  color: var(--abyss);
  border-color: var(--border-ink);
}

.quiz-option.dimmed {
  opacity: 0.5;
}

.quiz-result {
  border: 3px solid var(--border-ink);
  box-shadow: 6px 6px 0 var(--shadow-ink);
}

.quiz-result::before {
  content: 'RESULT';
  position: absolute;
  top: 0.7rem;
  right: 0.7rem;
  transform: rotate(6deg);
  font-family: var(--serif);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--abyss);
  background: var(--yellow);
  border: 2.5px solid var(--border-ink);
  border-radius: 3px;
  padding: 0.2rem 0.5rem;
  box-shadow: 2px 2px 0 var(--shadow-ink);
}

.quiz-bar-fill {
  background: var(--yellow);
}

/* ---------- flashcards ---------- */

.flip-face {
  border: 2.5px solid var(--border-ink);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
  background: var(--sea);
  color: var(--ice);
}

.flip-hint {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--abyss);
  background: var(--cyan);
  border: 2px solid var(--border-ink);
  border-radius: 3px;
  padding: 0.15rem 0.5rem;
  box-shadow: 2px 2px 0 var(--shadow-ink);
}
```

- [ ] **Step 5: Append hero, book sections, misc**

```css
/* ---------- home hero poster ---------- */

.hero-books {
  background: var(--deep-sea);
}

.hero-content {
  border: 2.5px solid var(--border-ink);
  background: var(--sea);
  box-shadow: var(--shadow);
  padding: 2rem 2.5rem;
}

.hero-school {
  display: inline-block;
  font-family: var(--serif);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--abyss);
  background: var(--cyan);
  border: 2px solid var(--border-ink);
  border-radius: 3px;
  padding: 0.2rem 0.6rem;
  box-shadow: 2px 2px 0 var(--shadow-ink);
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.01em;
}

/* ---------- book covers ---------- */

.book-section-head {
  border-left: 6px solid var(--border-ink);
}

.unit-card {
  position: relative;
  background: var(--sea);
  border: 2.5px solid var(--border-ink);
  border-radius: var(--radius);
  box-shadow: 3px 3px 0 var(--shadow-ink);
  padding-left: 1.4rem;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.unit-card::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 7px;
  background: var(--book-accent, var(--sea-mid));
  border-right: 2px solid var(--border-ink);
}

.unit-card.book-first-flight {
  --book-accent: var(--cyan);
}

.unit-card.book-footprints {
  --book-accent: var(--magenta);
}

.unit-card:hover {
  transform: rotate(-1deg) translateY(-2px);
  box-shadow: 6px 6px 0 var(--shadow-ink);
}

.type-badge {
  font-family: var(--serif);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 2px solid var(--border-ink);
  border-radius: 3px;
  padding: 0.15rem 0.5rem;
  background: var(--sea);
  color: var(--ice);
  box-shadow: 1px 1px 0 var(--shadow-ink);
}

.type-poem {
  background: var(--yellow);
  color: var(--abyss);
}

.type-play {
  background: var(--green);
  color: var(--abyss);
}

.type-legacy {
  background: var(--gold);
  color: var(--abyss);
}

.unit-card-author {
  color: var(--storm-light);
  font-style: normal;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.8rem;
}

.unit-card-go {
  color: var(--ice);
  font-weight: 700;
}

/* ---------- misc ---------- */

.step-num {
  display: inline-block;
  font-family: var(--serif);
  font-weight: 700;
  color: var(--abyss);
  background: var(--magenta);
  border: 2.5px solid var(--border-ink);
  border-radius: var(--radius);
  box-shadow: 2px 2px 0 var(--shadow-ink);
}

.quote-band {
  border-top: 2.5px solid var(--border-ink);
  border-bottom: 2.5px solid var(--border-ink);
}

.site-footer {
  border-top: 2.5px solid var(--border-ink);
  background: var(--sea);
  color: var(--ice);
}

.site-footer .ornament {
  color: var(--ice);
}

.heritage-stamp {
  display: inline-block;
  font-family: var(--serif);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--abyss);
  background: var(--gold);
  border: 2px solid var(--border-ink);
  border-radius: 3px;
  padding: 0.2rem 0.6rem;
  box-shadow: 2px 2px 0 var(--shadow-ink);
  transform: rotate(-2deg);
  margin-top: 0.5rem;
}

/* ---------- page banner ---------- */

.page-banner {
  border: 2.5px solid var(--border-ink);
  border-radius: var(--radius);
  box-shadow: 3px 3px 0 var(--shadow-ink);
  overflow: hidden;
}

.banner-kicker {
  display: inline-block;
  font-family: var(--serif);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--abyss);
  background: var(--yellow);
  border: 2px solid var(--border-ink);
  border-radius: 3px;
  padding: 0.15rem 0.5rem;
  box-shadow: 2px 2px 0 var(--shadow-ink);
}
```

- [ ] **Step 6: Verify**

Run: `npm run build` in `client/`.
Expected: build succeeds. Manual check via `npm run dev` in `client/` (Ctrl+C to stop):
- Navbar has flat background, bottom black border, marquee scrolling under it; toggle button shows "LIGHT ☀", switches to dark (persists after reload).
- Cards/buttons have hard shadows; pressing a button shows translate+no-shadow.
- Quiz option press/correct/wrong states work; RESULT stamp visible.

- [ ] **Step 7: Commit**

```bash
git add client/src/styles.css
git commit -m "Add neo-brutalist layer: borders, hard shadows, stamps, chips"
```

---

### Task 5: Home book covers + footer heritage stamp

**Files:**
- Modify: `client/src/pages/Home.jsx`
- Modify: `client/src/App.jsx`

**Interfaces:**
- Consumes: `.book-first-flight` / `.book-footprints` CSS classes from Task 4; `.heritage-stamp` CSS from Task 4.
- Produces: unit cards tagged with book color; footer heritage badge.

- [ ] **Step 1: Add book-color class to unit cards**

In `client/src/pages/Home.jsx`, change the unit-card Link (line 55) from:

```jsx
                  <Link key={u.id} to={`/unit/${u.id}/study`} className="unit-card card">
```

to:

```jsx
                  <Link key={u.id} to={`/unit/${u.id}/study`} className={`unit-card card book-${book.id}`}>
```

- [ ] **Step 2: Retag the Mariner legacy badge**

In `client/src/pages/Home.jsx`, change line 58 from:

```jsx
                      {u.id === 'rime-of-the-ancient-mariner' && <span className="type-badge type-legacy">School legacy</span>}
```

to:

```jsx
                      {u.id === 'rime-of-the-ancient-mariner' && <span className="type-badge type-legacy">CLASSIC</span>}
```

- [ ] **Step 3: Add heritage stamp to footer**

In `client/src/App.jsx`, inside the `<footer className="site-footer">` block (after the second `<p>` at line 101), add:

```jsx
        <p className="heritage-stamp">Est. 1798 · The Rime of the Ancient Mariner</p>
```

- [ ] **Step 4: Verify**

Run: `npm run build` in `client/`.
Expected: build succeeds. In dev server: First Flight cards have a cyan spine, Footprints cards magenta; Mariner card shows the gold "CLASSIC" badge; footer shows the heritage stamp.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Home.jsx client/src/App.jsx
git commit -m "Tag unit cards by book color and add heritage stamp"
```

---

### Task 6: Study page — library labels

**Files:**
- Modify: `client/src/pages/Study.jsx`

**Interfaces:**
- Consumes: `.tab` styles from Task 4.
- Produces: renamed tab labels per spec (Chapter Notes, Character Sketches, Value Points).

- [ ] **Step 1: Rename the TABS labels**

In `client/src/pages/Study.jsx`, replace the `TABS` function (lines 43-50) with:

```jsx
  const TABS = (c) => [
    { key: 'summary', label: 'Chapter Notes', count: c.summaries.length },
    { key: 'theme', label: 'Themes', count: c.themes.length },
    { key: 'character', label: meta.type === 'poem' ? 'Speaker & Characters' : 'Character Sketches', count: c.characters.length },
    { key: 'analysis', label: 'Analysis', count: c.analysis.length },
    { key: 'device', label: 'Poetic Devices', count: c.devices.length },
    { key: 'value', label: 'Value Points', count: c.values.length }
  ];
```

- [ ] **Step 2: Verify**

Run: `npm run build` in `client/`.
Expected: build succeeds. Dev server: Study page tabs read "Chapter Notes", "Character Sketches" (prose/play), "Value Points"; poems keep "Speaker & Characters".

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Study.jsx
git commit -m "Rename study tabs to library labels"
```

---

### Task 7: Full verification + deploy

**Files:** none (verification only)

- [ ] **Step 1: Data validation**

Run (in `client/`): `node scripts/generate-fallback.cjs --check`
Expected: `Validation OK: 31 units, 842 content rows, 320 quiz questions.` (If it fails, nothing in this plan touched `server/content` — investigate before continuing.)

- [ ] **Step 2: Build both modes**

Run in `client/`: `npm run build` — expected `✓ built`.
Run in `client/`: `$env:VITE_BASE='/The-Rime-Of-The-Ancient-Mariner/'; npm run build` — expected `✓ built`.

- [ ] **Step 3: Server smoke test**

Run from repo root (PowerShell):

```powershell
$job = Start-Job -ScriptBlock { Set-Location 'C:\Users\LalithReddy.b\The-Rime-Of-The-Ancient-Mariner\server'; node index.js 2>&1 }
Start-Sleep -Seconds 6
try {
  $u = Invoke-RestMethod 'http://127.0.0.1:5000/api/units'
  Write-Output "units=$($u.units.length)"
} finally {
  Stop-Job $job -ErrorAction SilentlyContinue
  Remove-Job $job -Force -ErrorAction SilentlyContinue
}
```

Expected: `units=31`.

- [ ] **Step 4: Commit + push**

```bash
git status --short
git add -A
git commit -m "Apply neo-brutalist restyle to Class X English portal"
git push origin main
```

(If Task 5 and 6 were already committed separately, only `git add -A` what remains and commit the remainder.)

- [ ] **Step 5: Verify deploy**

```powershell
# GH_TOKEN must already be set in the environment (this session has it)
gh run list --repo Hustlenix/The-Rime-Of-The-Ancient-Mariner -L 1
```

Expected: latest run `completed  success` (poll with `gh run watch --repo Hustlenix/The-Rime-Of-The-Ancient-Mariner` if still running). Then:

```powershell
$r = Invoke-WebRequest -Uri 'https://hustlenix.github.io/The-Rime-Of-The-Ancient-Mariner/' -UseBasicParsing -Method Head
Write-Output "status=$($r.StatusCode)"
```

Expected: `status=200`.

- [ ] **Step 6: Final report**

Report: commit hashes, workflow run ID + status, live site status, and the `npm run gen-fallback` note (regeneration command unchanged).
