# Security+ Course — Project Context

## Overview

A Blackboard-style **course learning system** for CompTIA certification exam prep, built with
SvelteKit 5 (runes) and SQLite. It combines a structured course (4 weekly modules, lessons, and
deadline-driven graded assignments) with the quiz engine (MCQs, scenarios, PBQs, full-length exams)
and rigorous evaluation (weighted gradebook, exam-readiness meter).

**Three courses are registered** in the shared registry (`COURSES` / `COURSE_META` /
`ACTIVE_COURSES` in `course.ts`): Security+ SY0-701 (`secp-701`), A+ Core 1 220-1201
(`aplus-1201`), and A+ Core 2 220-1202 (`aplus-1202`). The UI is still single-course
(Security+) until the profiles branch lands the course switcher — the A+ definitions, banks,
and registry wiring are data/service-level and verified by tests and the smoke suite.

## Architecture

```
course.ts (definition + scheduling + gradebook logic)
    ↕
db.ts (better-sqlite3 — sessions, answers, domain progress, course tables)
    ↕
course-service.ts (aggregates course + gradebook + readiness views)
    ↕
quiz.ts (session lifecycle; records assignment submissions on completion)
    ↕
API routes → SvelteKit pages (course home, syllabus, modules, assignments, gradebook, calendar)
```

- **No SSR needed** — all page data is fetched client-side via `fetch('/api/...')`.
- **No authentication** — local multi-profile app. Scope (which profile + course a
  request acts as) comes from `profile_id` / `course_id` cookies, resolved by
  `resolveScope(event)` in `src/lib/server/scope.ts`; every API route builds a
  scoped view via `scopedServices(scope)` (`src/lib/server/services.ts`).
- **No ORM** — raw `better-sqlite3` queries; schema auto-created + migrated (user_version 6).

## Course Model (`src/lib/server/course.ts`)

The course is a static definition (`COURSE_DEFINITION`) seeded into SQLite on first run:

- **4 modules** (`week-1`…`week-4`) mirroring a 3–4 week study plan:
  1. Foundations & Threats (Domains 1–2)
  2. Architecture & Operations I (Domains 3–4)
  3. Operations II & Program Management (Domain 4 finish + Domain 5)
  4. Final Review & Readiness (targeted review + final full exam)
- **7 lessons** with study content (summary + interactive body rendered by `LessonContent.svelte`) per module; lessons are marked read. Lesson bodies are block-parsed into skim cards (tables/headings/lists) and can embed `::widget <id>::` markers resolved through `src/lib/components/widgets/` (osi-explorer, port-flip-cards, subnet-calculator, topology-spotlight); each secp lesson carries an `objectiveId` powering a per-lesson "Drill this topic" launch.
- **12 graded assignments** across three weighted categories:
  - `quiz` (6) — 20-question objective quizzes, 30% weight
  - `scenario-pbq` (2) — scenario sets and PBQ sets, 20% weight
  - `full` (4) — 90-question timed full exams + week-1 checkpoint, 50% weight
- **Question banks:** Security+ 300 MCQs (45/66/55/77/57 across Domains 1–5, all scenario-format)
  + 88 PBQs (matching, ordering, evidence, configuration, numeric, word-bank, sort, multi-step). **A+ Core 1 (220-1201): 150 MCQs** (20/34/38/16/42 across Domains 1–5, 21
  multi-selects) **+ 20 PBQs** (3/5/4/2/6 per domain, 8 kinds). **A+ Core 2 (220-1202): 150
  MCQs** (42/42/34/32 across Domains 1–4, 22 multi-selects) **+ 20 PBQs** (5/6/4/5 per domain,
  8 kinds). Bank ids: `mcq-/pbq-` (Security+), `a1-`/`a1-pbq-` (A+ Core 1), `a2-`/`a2-pbq-`
  (A+ Core 2). A+ banks validate against per-course `CourseBankSpec` constants in
  `bank-aplus-1201.ts` / `bank-aplus-1202.ts` (validator generalized in `question-bank.ts`).
  A+ authoring pipeline: `web/scripts/aplus-lib.py` + `merge-aplus-fragments.py` merge JSON
  fragments from `web/scripts/data/frags/` (fragments are authored directly; the expand-*.py
  scripts merge PBQs). Exam specs: A+ Core 1 90Q/90min pass 675; Core 2 90Q/90min pass 700 —
  both read from `COURSE_META.passingScore` (readiness thresholds 675/900 and 700/900).
  Bank expansion scripts live in `web/scripts/expand-d*.py`, `expand-pbqs.py`,
  `expand-exam-aligned.py`, `expand-pbqs-exam-style.py`; `bank-lib.py` merges them idempotently.
  PBQ coverage spans all 28 objectives; real-exam formats include firewall ACL rule ordering,
  certificate-type matching, crypto-algorithm selection, SQLi/Windows-event log analysis,
  vulnerability-scan prioritization, device-placement/segmentation, least-privilege permissions,
  MFA/SSO configuration, SOAR/automation matching, investigation data sources, sensitive-data
  handling, and recovery metrics.
- **Interactive kinds:** `word-bank` (sentence blanks + word chips with distractors, click-to-fill,
  partial credit per assignment), `sort` (tap-to-bucket classification with ≥1 distractor bucket),
  `hotspot` (tap regions on a shared diagram template — `osi-stack` / `topology-basic` /
  `packet-frame` / `log-lines`; penalty scoring `max(0, hits−misses)/correct`, correct flag never
  leaks to the client), `matching` (tap-to-connect via MatchConnect), `ordering` (drag/tap
  ordering), `configuration` (dropdown rule builders), `evidence` (artifact line selection),
  `numeric` (typed number entry — DEPRECATED, being converted to `slider`/word-bank),
  `multi-step` (2–4 guided child steps). **`fill-blank` is banned from authoring** (validator
  rejects it top-level and as a multi-step child) and renders legacy read-only for stored session
  snapshots. Interactive renderers: `MatchConnect.svelte`, `SortBoard.svelte`, `Hotspot.svelte` —
  all ≥44px touch targets.
- **Daily review engine** (`src/lib/server/review.ts`): SM-2-lite spaced repetition over the bank.
  `review_cards` holds per-question interval/ease/lapses/due date (local calendar day); `study_log`
  records per-day question counts for streaks and the 12-week heatmap. `composeQueue('daily')`
  builds "Today's 10" from due cards (most-lapsed first) + weak-objective questions (<85% on ≥3
  attempts) + brand-new questions; `composeQueue('wall')` drills the Wall of Shame (questions
  answered wrong at least once, cleared only after review proves mastery: interval ≥ 3 days =
  two consecutive corrects). Completing ANY session logs a study day; review sessions also update
  cards (`reviewSvc.recordCompletion` hook in `quiz.ts`). `/review` page: streak hero, heatmap,
  filterable wall; home page has a review strip. Start a review session via
  `POST /api/quiz/start {type:'review', reviewSource:'daily'|'wall'}` or `/quiz?review=daily`.
- **Scheduling:** every assignment has a `dueOffsetDays` (negative = days before exam). The exam
  date lives in `course_meta` (`exam_date`, default: **last day of the current month**) and can be
  changed from the Syllabus page — changing it reschedules every due date.

### Gradebook

- `computeGradebook()` — per-assignment best score (retakes keep the best), category percentages,
  weighted overall percentage, letter grade (A ≥ 90 … F < 60).
- Assignment status: `open` / `due-soon` (≤2 days) / `overdue` / `in-progress` (active session
  linked to the assignment) / `submitted`.
- `computeReadiness()` — blends domain mastery (weighted by the real SY0-701 question quotas
  11/20/16/25/18) with the average of the last two full exams; projects a 100–900 scaled score;
  `ready` = score ≥ 83.3% (750/900).

### Assignment → session integration

- `POST /api/quiz/start` accepts an optional `assignmentId`; stored on `quiz_sessions.assignment_id`.
- When a linked session is completed, `quiz.ts` records a submission row
  (`course_assignment_submissions`) via `courseService.recordCompletion(...)`.
- Launch config comes from `sessionLaunchFor(assignment)` (type/mode/count/domain).

## DB Tables

User data is scoped by `profile_id` (+ `course_id` where progress is per-course);
`profiles` holds the (max 2) local users. The `quizRepository` singleton in
`db.ts` is scope-agnostic — `createScopedRepo(repo, scope)` returns a bound view
over the same connection, and all reads/writes filter by the scope.

- `profiles` — id, name, color (hard cap `MAX_PROFILES = 2`; `default` is seeded and undeletable).
- Quiz engine: `quiz_sessions`, `quiz_answers`, `domain_progress` — scoped by
  `(profile_id, course_id)`; `quiz_session_state`, `quiz_session_responses` keyed by session.
- Course layer: `course_meta` (`(profile_id, course_id, key)` — per-scope
  `exam_date`), `course_modules` / `course_lessons` / `course_assignments`
  (content, `course_id` column), `course_assignment_submissions` and
  `course_lesson_completions` (scoped by `profile_id`).
- Review layer: `review_cards` (`(profile_id, course_id, question_id)`),
  `study_log` (`(profile_id, date_key)` — streaks are per-profile, not per-course).
- Google Calendar: `google_oauth` (one row per profile), `google_synced_events`
  (`(profile_id, source)`).

The v5 → v6 migration (transactional, idempotent, `user_version = 6`) adds the
scope columns and rebuilds the 8 tables whose primary key changed, backfilling
all pre-existing rows to `('default', 'secp-701')`. Fresh databases are created
in the v6 shape directly; `seedCourse` seeds the default profile + exam date per
active course. Migration/isolation coverage lives in `migration.test.ts`.

## API Routes

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET`  | `/api/scope` | Current scope + available profiles & courses (drives the header switchers) |
| `POST` | `/api/scope` | `{action:'switch', profileId?, courseId?}` sets scope cookies; `{action:'create', name, color}` (400 past 2-profile cap); `{action:'rename', profileId, name}` |
| `DELETE` | `/api/scope?profileId=` | Delete a profile (blocked while it is the active scope; `default` is protected) |
| `GET`  | `/api/course/overview` | Home payload: exam date/countdown, readiness, gradebook summary, modules w/ progress, to-do list, recent sessions |
| `GET`  | `/api/course/syllabus` | All modules with lessons + assignments + statuses |
| `GET`  | `/api/course/modules/[id]` | Single module (lessons + assignments) |
| `GET`  | `/api/course/assignments/[id]` | Assignment detail incl. best submission + launch config |
| `POST` | `/api/course/lessons/[id]` | Mark lesson `{ completed: boolean }` |
| `POST` | `/api/course/exam-date` | Set exam date `{ examDate: 'YYYY-MM-DD' }` (reschedules all) |
| `GET`  | `/api/gradebook` | `{ gradebook, readiness }` |
| `GET`  | `/api/mastery` | Per-objective + per-domain accuracy across all 28 SY0-701 objectives (from `quiz_answers`) |
| `GET`  | `/api/review` | Daily-review summary: streak, due cards, today count, 84-day heatmap, wall of shame (with wall items) |
| `POST` | `/api/quiz/start` | Session start — accepts optional `assignmentId`; `type: 'quiz'` accepts optional `objective` filter; `type: 'review'` requires `reviewSource: 'daily' \| 'wall'` |
| `GET/PATCH/DELETE` | `/api/quiz/session/[id]` | Resume, move/flag, abandon |
| `PUT`  | `/api/quiz/answer` | Save answer (practice returns feedback) |
| `POST` | `/api/quiz/complete` | Finalize; records assignment submission when linked |
| `GET`  | `/api/progress`, `/api/history`, `/api/cards`, `/api/sync` | Legacy analytics/tools |
| `GET`  | `/api/calendar/google/status` | Google Calendar connection status (`configured`, `connected`, `email`, `syncedCount`, `lastSyncAt`) |
| `GET`  | `/api/calendar/google/auth-url` | Starts OAuth: returns auth URL, sets `gcal_oauth_state` cookie (PKCE + state) |
| `GET`  | `/api/calendar/google/callback` | OAuth callback: exchanges code, stores token, redirects to `/calendar?connected=1` |
| `GET`  | `/api/calendar/google/events?start&end` | Merged events from the user's visible calendars (server-side proxy) |
| `POST` | `/api/calendar/google/sync` | Pushes exam + assignment deadlines into the per-course "… Prep" calendar (create/update/delete) |
| `POST` | `/api/calendar/google/disconnect` | Clears the stored OAuth token + sync tracking |

## Frontend Pages (Svelte 5 runes, Tailwind CSS v4)

| Route | File | Purpose |
| ----- | ---- | ------- |
| `/` | `src/routes/+page.svelte` | **Course home** — banner w/ exam countdown, readiness ring, "What's due" to-do, module cards, recent sessions |
| `/syllabus` | `src/routes/syllabus/+page.svelte` | Full schedule + exam-date editor |
| `/modules/[id]` | `src/routes/modules/[id]/+page.svelte` | Module detail — lessons (expandable, mark read) + assignments |
| `/assignments/[id]` | `src/routes/assignments/[id]/+page.svelte` | Assignment detail — due date, status, best submission, launch |
| `/gradebook` | `src/routes/gradebook/+page.svelte` | Weighted grade, letter grade, category breakdown, per-assignment table |
| `/calendar` | `src/routes/calendar/+page.svelte` | Month grid of deadlines + "Next up" list; Google Calendar connect/sync (see `GOOGLE-CALENDAR.md`) |
| `/quiz` `/scenarios` `/pbq` | existing | Free practice tools (not graded); accept `?assignment=` to run a graded assignment; `/quiz?review=daily\|wall` launches a review session |
| `/review` | `src/routes/review/+page.svelte` | **Daily review** — streak hero, "Today's 10" launcher, 12-week heatmap, filterable Wall of Shame |
| `/mastery` | `src/routes/mastery/+page.svelte` | **Mastery matrix** — per-course objectives color-coded by accuracy (grid renders from `COURSE_META[course].objectives`); tap any cell to drill it (5-question practice session filtered to that objective) |
| `/progress` `/history` | existing | Legacy analytics |

### Shared components

- `StatusChip.svelte` — assignment status badge.
- `ProgressRing.svelte` — circular percentage (readiness/grade).
- `BottomNav.svelte` / `MobileMenu.svelte` — course navigation (Home, Syllabus, Grades, Calendar).
- `ProfileSwitcher.svelte` / `CourseSwitcher.svelte` — header chips → bottom sheets
  for profile (add/rename/delete, 2-profile cap) and course selection; switching
  sets the scope cookies and reloads.

### Key Patterns

- **State**: `let x = $state(...)`; **Derived**: `let y = $derived(...)`
- **Props**: `let { prop } = $props()`; **Events**: `onclick={() => ...}`
- **No legacy**: no `$:`, `export let`, `on:`, `<slot>`, stores
- `{#each}` blocks must be keyed (`(item.id)`); lesson content uses `{@html}` over trusted static data

## Build & Test

```bash
npm run dev          # dev server on localhost:5173
npm run build        # production build (adapter-node)
npm run check        # svelte-check type checking
npm run test         # vitest (23 tests: quiz, scoring, question-bank, cards, course)
```

`course.test.ts` covers the course definition, scheduling, assignment status, gradebook math,
readiness, and the course service end-to-end. DB tests use `:memory:`; the module-level
`quizRepository` singleton uses `:memory:` under vitest (`process.env.VITEST`) to avoid file races.
`migration.test.ts` covers the v5→v6 migration (fixture upgrade, idempotency, fresh-DB parity),
scope isolation between profiles, and the 2-profile cap. 60 tests total.

## Styling

- Tailwind CSS v4 — `@import "tailwindcss"` in `app.css`, no config file.
- **"Dark study tool" design system** — near-black warm charcoal + a single acid-lime accent.
  Dark theme (`#0e0d0b` bg) is the default; light theme (`#f4f3ee` warm gray, not beige) is for
  sunlight readability. Accent = acid lime (`--color-accent`, `#b7f04c` dark / `#557a10` light).
  Semantic status colors only for success/danger/info/warning — never brand accents.
- Fonts: **Inter Variable** (body) + **Space Grotesk Variable** (display, `.h-display` /
  `.num-display`), self-hosted via `@fontsource-variable/*` — works offline. No serif anywhere.
- Component classes in `app.css`: `.card` (sharp 6px, hairline border, flat — no shadows/glows),
  `.btn` / `.btn-primary` / `.btn-ghost` / `.btn-danger` (≥44px touch targets, flat, sharp),
  `.chip` (square, 0 radius), `.eyebrow` (mono uppercase), `.gradient-text` (solid lime), `.pb-safe`.
- **Mobile-first**: bottom nav (`BottomNav.svelte`) has 5 tabs with a raised center Practice
  button; mobile menu is a bottom sheet (`MobileMenu.svelte`); gradebook/history tables become
  stacked cards below `md:`; `max-w-6xl` content column.
- Progress colors: red (<60%), amber (60–84%), green (≥85%) via `getPercentColor` /
  `getBarColor` in `utils.ts`.
- Design rules: no gradients, no glow/colored shadows, no pill buttons, no serif — keep it
  flat, sharp (6px max), and dense.

## Phase 2 Candidates (not yet implemented)

- Per-question explanation display from optional CSV column (question bank already has rationales).
- Spaced-repetition scheduling (anki-like) for weak topics.
- Drag-and-drop file import for custom question decks.
- Calendar "week" view; assignment resubmission history table.
