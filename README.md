# CompTIA Security+ Course

An offline-first, Blackboard-style course learning system for preparing for the CompTIA Security+
(SY0-701) certification exam.

The app combines a structured four-week course plan with adaptive practice, graded assignments,
PBQs, full-length exams, spaced repetition, a weighted gradebook, and exam-readiness tracking. It is
designed for focused study on desktop or mobile and runs locally on PostgreSQL.

> **A personal project first.** This is the tool I built and dogfooded for my own study sessions —
> the course plan, banks, and schedules are tuned for how _I_ study, not a generic audience, and it
> isn't a configurable product. That said, it's open source for a reason: fork it, use it, and steal
> whatever ideas work for you. If you'd like to see it go further, PRs are welcome.

![Course home dashboard](web/static/screenshots/home.png)

## Product Tour

### Course planning

The course home turns an exam date into an actionable study plan with countdown, readiness, daily
review, due assignments, quick drills, and module progress.

![Course home on mobile](web/static/screenshots/home-mobile.png)

The syllabus lays out four weeks of lessons, objective quizzes, scenario sets, PBQs, and timed full
exams. Changing the exam date recalculates the schedule.

![Course syllabus](web/static/screenshots/syllabus.png)

### Active practice

Practice sessions use scenario-based questions, objective labels, progress navigation, optional
context, and answer checks to turn the question bank into a guided drill.

![Practice quiz](web/static/screenshots/practice.png)

### Targeted improvement

Daily review combines due cards, weak objectives, new questions, a study heatmap, and a Wall of Shame
for questions that need another pass.

![Daily review](web/static/screenshots/review.png)

The mastery matrix shows accuracy across all 28 SY0-701 objectives. Any objective can launch a
targeted five-question practice session.

![Mastery matrix](web/static/screenshots/mastery.png)

## Features

- Four weekly modules covering all five Security+ exam domains
- Seven lessons with interactive study widgets
- Objective quizzes, scenario sets, PBQs, and 90-question timed full exams that mirror the real
  SY0-701: PBQs open the exam and carry ~26% of the score (5 PBQs at ~6 MCQ-points each), with
  domain quotas 11/20/16/25/18 across the five domains
- Interactive PBQ formats including matching, ordering, configuration, evidence, hotspot, sorting,
  word-bank, and multi-step tasks
- Daily spaced-repetition review with streaks, heatmap, and weak-topic recovery
- Mastery matrix across all 28 SY0-701 objectives
- Weighted gradebook with assignment statuses, retakes, category breakdowns, and letter grade
- Exam-readiness estimate against the official 750/900 passing threshold
- Multi-course support — Security+ SY0-701 plus A+ Core 1/2 (220-1201 / 220-1202) question banks
- Ready-to-import Anki flashcard decks — CSV exports for every domain plus ports/protocols and
  acronyms live in `anki/`, with matching flashcard notes in the vault
- Mobile-first — bottom navigation, ≥44px touch targets, and a layout that works one-handed between
  meetings
- Cheap to deploy — offline-first with self-hosted fonts and PostgreSQL storage, no external
  services; runs on a single small VPS (or a free-tier host) via `make deploy` (systemd)
- Optional Google Calendar synchronization for exam and assignment deadlines
- Responsive study-tool interface with a light default theme and full dark-mode support

## Quick Start

Requirements: Node.js 22 or newer, and a reachable PostgreSQL server.

```bash
cd web
npm install
cp .env.example .env          # then fill in DATABASE_URL + TEST_DATABASE_URL
npm run db:setup              # create tables + indexes
npm run db:seed               # seed course content + default profiles
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Seeding sets the default
exam date (today + 28 days) and creates the two default profiles; change the
exam date from the Syllabus page. `npm run db:migrate` imports legacy data from
an old SQLite `data/quiz.db`.

## Verify

Run these commands from `web/`:

```bash
npm run check
npm run test
npm run build
```

## Technology

- SvelteKit 5 with Svelte runes
- Tailwind CSS v4
- PostgreSQL (`postgres` driver) — the only runtime database
- Vitest for unit and service tests
- Playwright for end-to-end coverage
- Self-hosted Fraunces (display) and Inter (body) fonts

## Project Layout

```text
web/                          Course learning app (SvelteKit 5)
├── src/routes/               Course pages and API routes
├── src/lib/components/       Shared UI and interactive PBQ components
├── src/lib/server/           PostgreSQL repository, course model, quiz engine, and review engine
├── scripts/                  Question-bank, content tooling, and db setup/seed/migrate scripts
├── e2e/                      Playwright end-to-end tests
└── static/screenshots/       README product screenshots
notes/                        Obsidian study vault (domains, flashcards, exam resources)
anki/                         Anki flashcard exports
```

See [`web/README.md`](web/README.md) for the detailed architecture, data model, API route map,
authoring workflow, and deployment notes.

## Contributing

As noted up top, this is a personal, dogfood-first project rather than a configurable app. If you
find it useful (or just want to borrow the structure), please do — that's what it's here for. If
you hit a bug or have an idea, open a PR and I'll take a look.

## License

This project is released under the terms in [`LICENSE`](LICENSE).
