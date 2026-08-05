# Security+ Course — SY0-701 Exam Prep

A Blackboard-style **course learning system** for the CompTIA Security+ (SY0-701) exam. It turns a
static quiz app into a structured college-style course: weekly modules with lessons, deadline-driven
graded assignments, a weighted gradebook, an exam-readiness meter, and a calendar of everything due —
all anchored to your actual exam date.

Built with SvelteKit 5 (runes), Tailwind CSS v4, and SQLite (better-sqlite3).

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

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

First run seeds the course, sets your exam date to today + 28 days, and creates
`data/quiz.db`. Change the exam date anytime from the Syllabus page.

## Verify

```bash
npm run check      # svelte-check (0 errors)
npm run test       # vitest — 23 tests
npm run build      # production build (adapter-node)
```

## Docs

See [AGENTS.md](AGENTS.md) for the full architecture, data model, API routes, and page map.

## Deploy

The repo's `Makefile` deploys via systemd (`quizapp` service) — `make deploy` pulls, installs,
builds, and restarts.
