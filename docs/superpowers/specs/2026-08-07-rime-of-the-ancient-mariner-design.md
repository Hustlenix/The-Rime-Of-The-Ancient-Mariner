# The Rime of the Ancient Mariner — Study Portal | The Ashok Leyland School

> **Status:** APPROVED — this document records the design that was brainstormed with and approved by the user. Implementation must follow this document exactly. No new requirements may be invented.

## 1. Overview

A full-stack study portal for Samuel Taylor Coleridge's *The Rime of the Ancient Mariner*, built for The Ashok Leyland School (TALS) question bank. Students can browse summaries, themes and poetic devices, practice short/long answer questions, take random MCQ quizzes, train flashcards, and search all content. Teachers can log in to manage the question bank. The visual style is nautical / Romantic-era: deep sea blues, storm greys, ice whites and parchment gold, with serif display typography.

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Backend | Node.js + Express + better-sqlite3 (SQLite), plain SQL — no ORM |
| Auth | bcryptjs (password hashing, 10 rounds), jsonwebtoken (JWT, 1h expiry) |
| Middleware | cors (localhost:5173), express.json() |
| Frontend | React 18 + Vite (JavaScript, not TypeScript), react-router-dom v6 |
| Styling | Hand-written plain CSS (no Tailwind) — nautical theme |
| Ports | API `5000`, Vite dev `5173` with proxy `/api` → `http://localhost:5000` |

Node 18+ required. No npm workspaces — two independent `package.json` files.

## 3. Project Structure

```
The-Rime-Of-The-Ancient-Mariner/
├── server/
│   ├── index.js          # Express app entry, middleware, routes mount
│   ├── db.js             # SQLite connection, schema creation, seed function (idempotent)
│   ├── seedData.js       # ALL content (question bank, quiz questions, devices) as JS data
│   └── routes/
│       ├── auth.js       # register, login, me + JWT middlewares (requireAuth, requireTeacher)
│       ├── content.js    # summaries, themes, devices, questions list, search
│       ├── quiz.js       # quiz questions, attempt submission, history
│       ├── flashcards.js # mark known/unknown, get progress
│       └── admin.js      # teacher-only CRUD for questions + quiz questions
├── client/
│   ├── vite.config.js    # react plugin + /api proxy to :5000
│   ├── index.html        # Google Fonts (Playfair Display), site title
│   └── src/
│       ├── main.jsx      # ReactDOM + BrowserRouter
│       ├── App.jsx       # routes + auth context provider
│       ├── api.js        # fetch wrapper (JWT from localStorage, 401 handling)
│       ├── authContext.jsx
│       ├── styles.css    # whole nautical theme
│       ├── components/   # Navbar, ProtectedRoute, QuizRunner, Flashcard, FlashcardDeck, QuestionCard, SearchBar
│       └── pages/        # Home, Login, Register, Profile, Study, Questions, Quiz, Flashcards, Search, Admin
└── README.md             # setup + run instructions (two terminals)
```

## 4. Database Schema

SQLite database file: `server/data.db` (auto-created on first server start; schema + seed run idempotently — seeding only happens when the tables are empty).

### users
| column | type / constraint |
|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT |
| name | TEXT NOT NULL |
| email | TEXT NOT NULL UNIQUE |
| password_hash | TEXT NOT NULL |
| role | TEXT NOT NULL CHECK (role IN ('student','teacher')) DEFAULT 'student' |
| created_at | TEXT NOT NULL DEFAULT datetime('now') |

### questions
| column | type / constraint |
|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT |
| category | TEXT NOT NULL CHECK (category IN ('summary','theme','device','short','long')) |
| prompt | TEXT NOT NULL |
| answer | TEXT NOT NULL |
| notes | TEXT (nullable — used for device examples / extra material) |
| sort_order | INTEGER NOT NULL DEFAULT 0 |

### quiz_questions
| column | type / constraint |
|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT |
| question | TEXT NOT NULL |
| options | TEXT NOT NULL (JSON array of 4 strings) |
| correct_index | INTEGER NOT NULL |
| explanation | TEXT NOT NULL |
| topic | TEXT NOT NULL DEFAULT '' |

### quiz_attempts
| column | type / constraint |
|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT |
| user_id | INTEGER NOT NULL REFERENCES users(id) |
| score | INTEGER NOT NULL |
| total | INTEGER NOT NULL |
| created_at | TEXT NOT NULL DEFAULT datetime('now') |

### flashcard_progress
| column | type / constraint |
|---|---|
| user_id | INTEGER NOT NULL REFERENCES users(id) |
| question_id | INTEGER NOT NULL REFERENCES questions(id) |
| known | INTEGER NOT NULL DEFAULT 0 (0/1) |
| last_seen | TEXT NOT NULL DEFAULT datetime('now') |
| PRIMARY KEY | (user_id, question_id) |

Content model: summaries, themes and devices are stored in the `questions` table with categories `summary`, `theme`, `device` (prompt = title, answer = body); short/long Q&A use categories `short`/`long`. `GET /api/content` groups the first three into `{summaries, themes, devices}`.

## 5. API Endpoints

All responses JSON; errors carry `{error: "..."}` with proper status codes (400/401/403/404/500).

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | {name,email,password} → creates student, {token,user} |
| POST | /api/auth/login | — | {email,password} → {token,user} |
| GET | /api/auth/me | JWT | current user |
| GET | /api/content | — | {summaries, themes, devices} (optional category filter) |
| GET | /api/questions?category=short | — | question list (category optional; none = all) |
| GET | /api/content/search?q= | — | full-text (LIKE) search across summaries/themes/devices/questions → matched entries with category |
| GET | /api/quiz/questions?limit=10 | — | random selection of quiz questions |
| POST | /api/quiz/attempts | JWT | {score,total} → saves attempt |
| GET | /api/quiz/attempts | JWT | user's attempt history |
| POST | /api/flashcards/:questionId/known | JWT | {known:bool} → upsert progress |
| GET | /api/flashcards/progress | JWT | progress map {question_id: 0/1} |
| POST | /api/admin/questions | teacher | create question {category,prompt,answer,notes,sort_order} |
| PUT | /api/admin/questions/:id | teacher | update question |
| DELETE | /api/admin/questions/:id | teacher | delete question (clears its flashcard progress) |
| GET | /api/admin/quiz-questions | teacher | list all quiz questions (needed by Admin page) |
| POST | /api/admin/quiz-questions | teacher | create quiz question {question,options[4],correct_index,explanation,topic} |
| PUT | /api/admin/quiz-questions/:id | teacher | update quiz question |
| DELETE | /api/admin/quiz-questions/:id | teacher | delete quiz question |

Non-teacher JWT on admin routes → 403; missing/invalid JWT → 401.

## 6. Auth Model

- Register always creates `role='student'`; teacher accounts are seeded only.
- Passwords hashed with bcryptjs (10 rounds); never returned in responses.
- JWT: payload {id, role}, secret from `JWT_SECRET` env with sensible dev default, 1h expiry.
- Client stores token in localStorage (`token` key); `api.js` attaches `Authorization: Bearer <token>`; on 401 it clears the token and dispatches `auth:unauthorized` so the auth context logs out.
- Default seeded accounts: `teacher@tals.edu / teacher123` (teacher), `student@tals.edu / student123` (student). Documented in README and shown as a hint on the Login page.

## 7. Features

1. **Home** — hero with title, school name, poem tagline, navigation cards to Study/Questions/Quiz/Flashcards. Nautical imagery via CSS (gradient sea, waves, inline SVG albatross silhouette).
2. **Study** — tabs: Summary (Part I, Part II), Theme, Poetic Devices (each device with definition + quoted examples).
3. **Questions** — browse short & long answer Q&As, filter by category, reveal answer on click.
4. **Quiz** — "Quiz practice mode": 10 random MCQs, one at a time, instant feedback + explanation, final score; attempt saved if logged in; best score/history shown for logged-in users. Fully usable without login (guest practice; scores not saved).
5. **Flashcards** — flip cards (click to flip), mark "Known" / "Still learning", progress ring showing % known; built from short/long questions. Progress persists only for logged-in users; deck viewable by guests.
6. **Search** — server-side full-text search across summaries, themes, devices, questions (`GET /api/content/search?q=`), with client-side highlighting of matches (`<mark>`).
7. **Login / Register** — forms with validation (name required, email format, password ≥ 6 chars), error display, login-page hint with demo accounts.
8. **Profile** (auth) — user info, quiz attempt history with scores, flashcard mastery stats (known/total with ring).
9. **Admin** (teacher only, gated by ProtectedRoute with `requireTeacher`) — tabs for Questions and Quiz Questions; add/edit/delete with simple forms and tables.

Navbar: Home, Study, Questions, Quiz, Flashcards, Search + Login/Register, or (user name, Profile, Admin if teacher, Logout).

## 8. Visual Design — Nautical / Romantic-era

- Colors: deep sea blues `#0b2a43` / `#134e6f`, storm-grey `#5a7284`, ice whites `#e8f1f5`, parchment-yellow accents `#d9b36c` / `#e6c98a`.
- Typography: serif display for headings (Playfair Display via Google Fonts CDN, Georgia fallback), readable sans for body (Source Sans 3 / system sans).
- Layout: card-based, subtle wave/ship motifs (inline SVG), smooth transitions (hover lifts, card flips), fully responsive (single-column below ~768px).
- Site title: "The Rime of the Ancient Mariner — Study Portal | The Ashok Leyland School".

## 9. Content Inventory (seeded verbatim from the school question bank — no rewording)

| Category | Items |
|---|---|
| summary | Part I, Part II (verbatim prose) |
| theme | 1 central theme (verbatim prose) |
| device | 10 poetic devices: ALLITERATION, IMAGERY, IRONY, METAPHOR, ONOMATOPOEIA, PERSONIFICATION, HYPERBOLE, REPETITION, RHYME SCHEME (ab cb), SIMILE — each with definition + quoted examples |
| short | 7 short-answer questions with answers |
| long | 3 long-answer questions with answers |
| quiz | 20 MCQs (4 options each, correct index, 1–2 sentence explanation, topic tag) based on the poem/question bank |

All seed text lives in `server/seedData.js` and is copied verbatim from the approved question bank content.

## 10. Verification Plan (mandatory — evidence before claims)

1. `npm install` in `server/` and `client/` — must complete with no errors.
2. Start server (`node server/index.js`) — must log "listening on 5000".
3. Endpoint tests via Invoke-RestMethod / curl:
   - register a user → {token,user}; duplicate email → 400; bad email/short password → 400
   - login teacher + student → tokens; wrong password → 401
   - GET /api/auth/me with token → user; without → 401
   - GET /api/content → 2 summaries, 1 theme, 10 devices
   - GET /api/questions?category=short → 7; category=long → 3; no category → 23
   - GET /api/quiz/questions?limit=10 → 10 with parsed options
   - POST /api/quiz/attempts (student) → 201; GET attempts → history
   - POST /api/flashcards/1/known + GET progress → {1: 1}
   - GET /api/content/search?q=albatross → matched results
   - admin: no token → 401, student token → 403, teacher token → 201/200; full CRUD round-trip
4. `npm run build` in `client/` — must succeed with zero errors; `npm run dev` briefly — Vite must start on 5173.
5. Fix any errors found; re-run until all checks pass.
6. Server restart → seed idempotency check (counts unchanged). Remove test DB artifacts before handoff (`server/data.db` auto-recreated on next start; README notes this).
