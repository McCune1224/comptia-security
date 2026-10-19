# Security+ Course — SY0-701 Exam Prep

A Blackboard-style **course learning system** for the CompTIA Security+ (SY0-701) exam. It turns a
static quiz app into a structured college-style course: weekly modules with lessons, deadline-driven
graded assignments, a weighted gradebook, an exam-readiness meter, and a calendar of everything due —
all anchored to your actual exam date.

Built with SvelteKit 5 (runes), Tailwind CSS v4, and PostgreSQL.

## What you get

- **Course home** — exam countdown, "What's due" to-do list, readiness ring, module progress.
- **Syllabus** — the full 4-week schedule; change your exam date and every due date recalculates.
- **Modules & lessons** — 4 weekly modules covering all 5 exam domains, with study content you can
  mark as read.
- **12 graded assignments** — objective quizzes, scenario sets, PBQs, and 90-question timed full
  exams, weighted 30% / 20% / 50% (quizzes / scenarios & PBQs / full exams). Retakes keep your best
  score.
- **Gradebook** — weighted percentage, letter grade, category breakdown, and per-assignment status
  (open / due soon / overdue / in progress / submitted).
- **Exam readiness** — blends your domain mastery with recent full-exam scores and projects your
  scaled score against the real 750/900 passing threshold.
- **Free practice** — the original quiz, scenario, and PBQ tools, ungraded, for open study.

## Screenshots

The app is designed as a focused study workspace that works on desktop and mobile, with a light
default theme and an optional dark mode.

### Course home

The home dashboard puts the exam countdown, readiness estimate, daily review, due work, quick drills,
and four-week course plan in one place.

![Course home dashboard](static/screenshots/home.png)

### Plan the course

The syllabus turns the exam date into a scheduled four-week plan, with lessons, quizzes, PBQs,
scenarios, and full exams grouped by module.

![Course syllabus](static/screenshots/syllabus.png)

### Practice and improve

Focused practice presents scenario-based questions with optional context, objective labels, progress
navigation, and immediate answer checks.

![Practice quiz](static/screenshots/practice.png)

The daily review loop combines spaced repetition, a 12-week study heatmap, and a Wall of Shame for
questions that need another pass.

![Daily review](static/screenshots/review.png)

The mastery matrix makes weak objectives easy to spot and turns any objective into a targeted
five-question drill.

![Mastery matrix](static/screenshots/mastery.png)

### Mobile-first layout

The same dashboard collapses into a compact mobile layout with bottom navigation and touch-friendly
study actions.

![Course home on mobile](static/screenshots/home-mobile.png)

## Quick start

```bash
npm install
cp .env.example .env          # then fill in DATABASE_URL + TEST_DATABASE_URL
npm run db:setup              # create tables + indexes in DATABASE_URL
npm run db:seed               # seed course content + default profiles
npm run dev                   # http://localhost:5173
```

Seeding sets your exam date to today + 28 days and creates the two default
profiles (Alex on Security+, Ash on A+). Change the exam date anytime from the
Syllabus page. To import legacy data from an old SQLite `data/quiz.db`, run
`npm run db:migrate`.

## Verify

```bash
npm run check      # svelte-check (0 errors)
npm run test       # vitest — runs against TEST_DATABASE_URL (never DATABASE_URL)
npm run build      # production build (adapter-node)
```

## Docs

See [AGENTS.md](AGENTS.md) for the full architecture, data model, API routes, and page map.

## Deploy

Deployed to **Railway** from the repo-root `Dockerfile` (see [RAILWAY.md](RAILWAY.md) for the full
guide). The Pi path is still supported: the repo's `Makefile` deploys via systemd (`quizapp`
service) — `make deploy` pulls, installs, builds, and restarts.

The database **schema applies itself at server startup** (`src/hooks.server.ts` → `applyPgSchema`,
all `CREATE ... IF NOT EXISTS`), so a release that adds a table needs no manual step. Course
**content** is seeded, not schemed — run `railway run npm run db:seed` when a release changes it.
