# The Rime of the Ancient Mariner — Study Portal

A full-stack study portal for Samuel Taylor Coleridge's *The Rime of the Ancient Mariner*, built for **The Ashok Leyland School (TALS)** question bank.

## Features

- **Study** — summaries (Part I & Part II), the central theme, and 10 poetic devices with quoted examples
- **Questions** — short & long answer Q&As from the school question bank, with reveal-on-click model answers
- **Quiz practice mode** — 10 random MCQs with instant feedback and explanations; scores saved for logged-in users (guest practice works without login)
- **Flashcards** — flip-card deck built from the question bank, mark Known / Still learning, progress ring
- **Search** — server-side full-text search across summaries, themes, devices and questions, with client-side highlighting
- **Accounts** — register/login (JWT), profile with quiz history and flashcard mastery stats
- **Admin** — teacher-only CRUD for questions and quiz questions

## Tech stack

- Backend: Node.js + Express + better-sqlite3 (SQLite, plain SQL) · bcryptjs · jsonwebtoken (1h expiry)
- Frontend: React 18 + Vite (JavaScript) + react-router-dom, hand-written nautical CSS

## Prerequisites

- Node.js 18+ (tested on Node 24)

## Setup

```bash
# Terminal 1 — API server
cd server
npm install
npm start        # listens on http://localhost:5000

# Terminal 2 — frontend
cd client
npm install
npm run dev      # opens http://localhost:5173
```

The SQLite database (`server/data.db`) is created automatically on first server start and seeded with the full question bank plus two demo accounts. Delete `server/data.db` at any time to reset to a fresh state (it will be recreated and re-seeded on next start).

## Default accounts

| Role | Email | Password |
|---|---|---|
| Teacher | teacher@tals.edu | teacher123 |
| Student | student@tals.edu | student123 |

## Deployment (Render, free tier)

The repo includes a `render.yaml` blueprint, so deploying is nearly one click:

1. Create a free account at https://render.com (GitHub sign-in).
2. Click **New → Blueprint** and select the `The-Rime-Of-The-Ancient-Mariner` repo.
3. Render reads `render.yaml`, builds the frontend, installs the server deps, and starts the API — done. The live URL is shown in the dashboard.
4. The SQLite database is created and seeded automatically on first start (it resets on redeploys of the free tier — the app reseeds itself, so this is harmless).

**Note:** JWT signing uses a built-in default secret; for a real deployment set a `JWT_SECRET` environment variable in Render.

## Production build (optional)

```bash
cd client && npm run build   # outputs client/dist
node server/index.js         # Express serves the built frontend + API on :5000
```

## API summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | {name, email, password} → {token, user} |
| POST | /api/auth/login | — | {email, password} → {token, user} |
| GET | /api/auth/me | JWT | current user |
| GET | /api/content | — | {summaries, themes, devices} |
| GET | /api/questions?category=short | — | questions list (category: summary/theme/device/short/long) |
| GET | /api/content/search?q= | — | full-text search |
| GET | /api/quiz/questions?limit=10 | — | random quiz questions |
| POST | /api/quiz/attempts | JWT | {score, total} — save attempt |
| GET | /api/quiz/attempts | JWT | attempt history |
| POST | /api/flashcards/:questionId/known | JWT | {known: bool} — upsert progress |
| GET | /api/flashcards/progress | JWT | progress map |
| POST/PUT/DELETE | /api/admin/questions[/:id] | teacher | question CRUD |
| GET/POST/PUT/DELETE | /api/admin/quiz-questions[/:id] | teacher | quiz question CRUD |

## Project structure

```
server/
  index.js          Express app, middleware, route mounting
  db.js             SQLite connection, schema, idempotent seeding
  seedData.js       All question-bank content (verbatim)
  routes/
    auth.js         register/login/me + JWT middlewares
    content.js      summaries, themes, devices, questions, search
    quiz.js         quiz questions, attempts, history
    flashcards.js   known/progress
    admin.js        teacher-only CRUD
client/
  vite.config.js    /api proxy → localhost:5000
  index.html
  src/
    main.jsx, App.jsx, api.js, authContext.jsx, styles.css
    components/     Navbar, ProtectedRoute, QuizRunner, Flashcard(s), QuestionCard, SearchBar
    pages/          Home, Study, Questions, Quiz, Flashcards, Search, Login, Register, Profile, Admin
```
