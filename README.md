# Class X English Study Portal

> A free, school-friendly revision portal for the **CBSE Class X English Literature Reader (Interact in English)**, built for students at **The Ashok Leyland School**.

[**Open the live project →**](https://hustlenix.github.io/The-Rime-Of-The-Ancient-Mariner/)

![Live screenshot of the Class X English Study Portal](https://image.thum.io/get/width/1200/noanimate/https://hustlenix.github.io/The-Rime-Of-The-Ancient-Mariner/)

## Why I made this

I started with a small study website for **The Rime of the Ancient Mariner** because normal revision material felt static and easy to ignore. I wanted something I would actually use before an exam: fast summaries, model answers hidden until I try the question, flashcards, quizzes and small games instead of another long PDF.

That experiment grew into a portal for the **whole 13-unit Literature Reader**. The goal is simple: make serious Grade 10 revision feel less boring without hiding the actual syllabus behind gimmicks.

## What is built

### Student side

- **13 literature units** — prose, poems and plays from the Class X Literature Reader
- **Study pages** — summaries, themes, character sketches and poetic devices
- **Question practice** — short and long answers with reveal-on-click model answers
- **Quiz mode** — randomized MCQs with instant feedback and explanations
- **Flashcards** — flip cards with Known / Still learning progress
- **Search** — search across units, summaries, themes, devices and questions
- **Resume studying** — remembers the last unit on the device
- **Progress systems** — streak/coin UI and local progress where possible
- **Printing Press Arcade** — Quote Matcher + a 60-second Poetic Device Speed Run
- **Responsive UI** — designed for both desktop and phone
- **Accessibility work** — skip links, semantic controls, keyboard-friendly interactions and screen-reader status updates
- **PWA/static fallback** — core study material still works on GitHub Pages without the Express server

### Teacher side

The project is not only a reading site. It also contains a teacher workflow:

- question-bank management
- teacher-only CRUD
- CSV question import
- paper templates
- a multi-step paper builder
- difficulty/type/chapter filtering
- usage-aware autofill so the same questions do not dominate every paper
- paper library/history
- printable paper views

## 60-second reviewer tour

If you are reviewing the project, this is the fastest way to see the important parts:

1. Open the [live site](https://hustlenix.github.io/The-Rime-Of-The-Ancient-Mariner/).
2. Pick **The Rime of the Ancient Mariner**, **Ozymandias** or **Patol Babu, Film Star** from the shelf.
3. Open **Study** and inspect the structured revision content.
4. Open **Questions** and reveal a model answer only after attempting it.
5. Try **Flashcards** and **Quiz**.
6. Open **Games → Printing Press Arcade** and play both study games.
7. Search for a phrase such as `albatross`, `Ozymandias` or `irony`.
8. For the full local/server build, use the teacher account below to inspect the question bank and paper builder.

## Architecture

```text
Browser
  │
  ├── React 18 + Vite frontend
  │     ├── route-level lazy loading
  │     ├── static fallback content for GitHub Pages
  │     ├── quizzes / flashcards / search / games
  │     └── PWA service worker
  │
  └── Express API (full deployment / local development)
        ├── SQLite (better-sqlite3)
        ├── JWT authentication
        ├── quiz attempts + flashcard progress
        ├── teacher/admin APIs
        └── question-bank + paper-builder APIs
```

## Tech stack

- **Frontend:** React 18, Vite, React Router, handwritten CSS
- **Backend:** Node.js, Express
- **Database:** SQLite via `better-sqlite3`
- **Auth:** bcryptjs + JWT
- **Testing:** Vitest + Testing Library
- **Deployment:** GitHub Pages for the public static build; Render blueprint included for the full-stack build

## GitHub Pages vs full-stack mode

The public GitHub Pages build intentionally runs in a **static preview mode**. The syllabus content, study pages, questions, quizzes, flashcards, search and games remain usable.

Features that require a live database — account persistence, server-saved quiz attempts, teacher CRUD and paper storage — need the Express/SQLite build.

This separation lets anyone review and study from the public link while keeping the real backend architecture in the same repository.

## Run locally

### Prerequisites

- Node.js 18+

### Start the API

```bash
cd server
npm install
npm start
```

The API runs at `http://localhost:5000`.

### Start the frontend

```bash
cd client
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies `/api` to the local server.

### Run tests

```bash
cd client
npm test
```

### Production build

```bash
cd client
npm run build
cd ..
node server/index.js
```

## Demo accounts for the full server build

| Role | Email | Password |
|---|---|---|
| Teacher | `teacher@tals.edu` | `teacher123` |
| Student | `student@tals.edu` | `student123` |

> These are seeded demo credentials for development/review, not production credentials.

## Main routes

| Route | Purpose |
|---|---|
| `/` | Literature shelf / home |
| `/unit/:unitId/study` | Structured lesson revision |
| `/unit/:unitId/questions` | Short + long answer practice |
| `/unit/:unitId/quiz` | Unit quiz |
| `/unit/:unitId/flashcards` | Flashcard practice |
| `/search` | Full portal search |
| `/games` | Printing Press Arcade |
| `/teacher/bank` | Teacher question bank |
| `/teacher/build` | Test-paper builder |
| `/teacher/library` | Generated paper library |

## Project structure

```text
client/
  public/
    manifest.webmanifest
    sw.js
    images/
  src/
    components/
    data/
    games/
    pages/
      teacher/
    api.js
    App.jsx
    styles.css

server/
  content/
  lib/
  routes/
  db.js
  seedCatalog.js
  seedData.js
  smoke.js

.github/workflows/
  deploy.yml
```

## Deployment

### GitHub Pages

Every push to `main` runs `.github/workflows/deploy.yml`, builds the Vite frontend with the repository base path and deploys `client/dist` to GitHub Pages.

### Full-stack Render deployment

The repository includes `render.yaml`.

1. Create a Render account.
2. Choose **New → Blueprint**.
3. Select this repository.
4. Render installs/builds the frontend and server and starts the Express app.

For a real public deployment, set your own `JWT_SECRET`.

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/content` | Study content |
| GET | `/api/questions` | Question bank |
| GET | `/api/content/search?q=` | Search |
| GET | `/api/quiz/questions` | Random quiz questions |
| POST | `/api/quiz/attempts` | Save quiz attempt |
| GET | `/api/flashcards/progress` | Flashcard mastery |
| POST/PUT/DELETE | `/api/admin/questions[/:id]` | Teacher question CRUD |

## What I learned while building it

This project forced me to solve problems beyond simply rendering text:

- keeping a large syllabus usable on small screens
- designing revision interactions that do not immediately reveal answers
- supporting both a real API and a static GitHub Pages fallback
- route-level code splitting
- PWA/offline behavior
- accessibility feedback for interactive controls
- data modeling for teacher question banks and generated papers
- deterministic paper generation without constantly repeating the same questions
- maintaining a deployment pipeline while the app kept growing

## Project status

The project began as a single-poem experiment and is now a full Literature Reader portal. I am continuing to improve polish, exam usefulness, mobile UX, teacher tooling and the quality of the study data.

Built by **Lalith / @Hustlenix** for the Hack Club Stardance challenge.
