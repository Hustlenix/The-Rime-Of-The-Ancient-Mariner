# Grade 10 English Literature Reader

Hey! I'm Lalith. I made this because I'm in Class 10 and I wanted something actually useful for revising English instead of just opening a huge PDF or scrolling through random notes.

Live site: https://hustlenix.github.io/The-Rime-Of-The-Ancient-Mariner/

![Screenshot of the website](https://image.thum.io/get/width/1200/noanimate/https://hustlenix.github.io/The-Rime-Of-The-Ancient-Mariner/)

## How this project even started

This project was **not** supposed to become this big 😭

At first I only wanted to make a website for **The Rime of the Ancient Mariner** for school. The first version was basically:

- summary
- theme
- poetic devices
- question/answers
- quiz
- flashcards
- and an auth system that was honestly kind of useless because most of the website worked as a guest anyway lol

After making that, I realised the same idea would actually be more useful if I did it for the **whole Class 10 Literature Reader**, because I would need all those chapters for exams anyway.

So I slowly changed the project from one poem into a complete Literature Reader site with all 13 units.

## Why I made it

The main reason is pretty simple: I get bored reading normal study notes.

I wanted a site where I could open one chapter, read only what I needed, test myself immediately, and come back later without feeling like I was reading another textbook.

I also wanted it to work for people in my school, not just for me. That is why I kept adding things like question practice, quiz explanations, flashcards, search, mobile support and the "continue where you left off" system.

Later I also started thinking about teachers. If the website already had a big question bank, why not use that same data to generate test papers? That is how the teacher tools started.

## How it changed while I was building it

The design changed a LOT.

I first tried a **neo-brutalist** style with thick borders, hard shadows and bright blocks. I liked the idea but it looked weird for an English literature website and I wasn't really happy with it.

After that I changed it into the current parchment / old-book / voyage style. Since one of the main poems is *The Rime of the Ancient Mariner*, the voyage theme actually fitted the project really well, so I kept that idea even after expanding the website to the whole book.

I also changed the home page into a kind of **voyage chart**. The chapters are split into Prose, Poetry and Drama, and you can jump into any one instead of being forced through them in order.

One bug/decision I remember was that I originally had chapter locking. That sounded cool, but for a study website it was annoying because if someone has an exam tomorrow they obviously should be able to open any lesson they want. So I removed the locking completely.

## Stuff that is in the website now

### For students

There are 13 Literature Reader units:

- Two Gentlemen of Verona
- Mrs Packletide's Tiger
- The Letter
- A Shady Plot
- Patol Babu, Film Star
- Virtually True
- The Frog and the Nightingale
- Not Marble, Nor the Gilded Monuments
- Ozymandias
- Snake
- The Rime of the Ancient Mariner
- The Dear Departed
- Julius Caesar

For each unit I tried to keep the same flow so it is easy to use:

**Study → Questions → Flashcards → Quiz**

The study pages include things like summaries, themes, character sketches and poetic devices depending on the chapter.

Questions have hidden answers so I can actually try answering first instead of accidentally reading the answer.

The quiz gives feedback after answering, and the flashcards can be marked as known / still learning.

Other things I added:

- search across the study content
- last-opened lesson / continue studying
- dark mode
- responsive mobile layout
- streaks and Mariner Coins
- an Albatross mascot with small tips
- progress indicators
- offline/PWA support
- keyboard + screen-reader improvements
- Google Analytics so I can see if anyone actually uses the site

## The games

I didn't want the site to only be cards and text, so I added a small section called **The Printing Press Arcade**.

Right now it has two games:

### Quote Matcher

You get quotes and their sources and have to match them together.

### Device Speed Run

You get 60 seconds to identify poetic devices from extracts. Correct answers build a streak and give more points.

These aren't meant to replace studying. They are just there to make the last few minutes of revision less boring.

## Teacher tools

This became one of the biggest upgrades I made.

There is a teacher-side question bank and test-paper system with:

- question bank CRUD
- CSV question importing
- difficulty levels
- chapter filters
- question type filters
- paper templates
- a multi-step paper builder
- automatic question selection
- a paper library
- printable papers

The autofill system also tracks how often questions are used. I added that because a random generator can easily keep picking the same questions again and again, which makes it pretty useless.

When a paper gets generated, it stores a snapshot of the selected questions too. That way if somebody edits a question in the bank later, an old generated paper does not suddenly change.

## One annoying problem: GitHub Pages has no backend

The full project uses:

- React + Vite on the frontend
- Node.js + Express on the backend
- SQLite
- JWT login/auth

But GitHub Pages can only host static files.

I still wanted the Stardance reviewer (and anyone else) to be able to open the project instantly, so I made a **static fallback version** of the study data.

That means the GitHub Pages version can still run the important student features even without the Express server.

Things that need the real database, like saved accounts, server-side quiz history and teacher paper storage, need the full server version.

This part caused quite a few deployment problems because the app originally expected the API to always exist.

I also had a service-worker problem where deploying a new version could break an already-open page because the old JS files disappeared. I changed the cache behaviour so an in-progress page can keep using the previous assets during a deployment.

## Performance / boring technical stuff I still spent time on

At one point the initial JS bundle was around **221 KB**.

I changed the pages to lazy-loaded routes so the first bundle dropped to around **186 KB** instead of downloading every page immediately.

I also added tests for things like:

- theme persistence
- quiz feedback
- the app shell
- fallback study data

The fallback dataset was checked for all 13 units, hundreds of content rows and the quiz bank because I really did not want the public GitHub Pages build to randomly miss a chapter.

## AI/tools I used

I want to be clear about this because this is a Hack Club project and AI was part of my workflow.

I used **OpenCode** a lot as my coding assistant. I also used ChatGPT, Claude, Gemini and Perplexity at different points for research, checking ideas/content and helping me work through code.

I did **not** just give one prompt and get this whole project.

Most of the project happened as lots of smaller changes: I would try something, run it, realise I didn't like it or it broke something, then change the idea and keep going.

For example:

- I tried neo-brutalism and later replaced it.
- I started with one poem and changed the data model when I expanded to the whole book.
- I removed chapter locking after testing the flow.
- I added a static fallback because GitHub Pages couldn't run my backend.
- I later added teacher tools because the question-bank data could do more than just display questions.
- I changed the UI again into the current voyage/parchment version.
- I added games, accessibility fixes, PWA caching and tests after the basic site already existed.

So yeah, AI helped me code and research, but the project itself came from me continuously changing what I wanted the website to be.

## Running it locally

You need Node.js.

### Backend

```bash
cd server
npm install
npm start
```

Server runs on:

```
http://localhost:5000
```

### Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

## Demo accounts

These are only seeded development accounts.

| Role | Email | Password |
| --- | --- | --- |
| Teacher | teacher@tals.edu | teacher123 |
| Student | student@tals.edu | student123 |

## Main project folders

```
client/
  src/
    components/
    data/
    games/
    pages/
      teacher/

server/
  content/
  lib/
  routes/
  db.js
  seedData.js

.github/workflows/
  deploy.yml
```

## What I want to improve next

The website is definitely not "finished forever".

Things I still want to improve are:

- better mobile game controls/layout
- better revision analytics
- more useful progress tracking
- cleaner teacher paper export
- checking and improving the study content whenever I find mistakes
- making the whole thing faster and less cluttered

The funny part is that the repo is still called **The-Rime-Of-The-Ancient-Mariner** even though the project stopped being only about that poem a long time ago 😭

That name is basically a fossil from version 1.

---

Made by **Lalith (@Hustlenix)** for Hack Club Stardance.
