# Security+ Course — Project Context

## Overview

A Blackboard-style **course learning system** for CompTIA certification exam prep, built with
SvelteKit 5 (runes) and PostgreSQL. It combines a structured course (4 weekly modules, lessons, and
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
db.ts (promise-based QuizRepository contract) → db-pg.ts (PostgreSQL implementation;
    DATABASE_URL resolved via $env/dynamic/private — sessions, answers, domain progress, course tables)
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
  `resolveScope(event)` in `src/lib/server/scope.ts` (async); every API route builds a
  scoped view via `scopedServices(scope)` (`src/lib/server/services.ts`).
- **No ORM** — raw `postgres` queries in `db-pg.ts`; the schema lives in
  `schema-pg.ts` and is applied by `npm run db:setup` (idempotent). Seeding
  (`pg-seed.ts`) is shared by `npm run db:seed`, the repository's `seed()`, and
  the test helper.

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
  - `full` (4) — 90-question timed full exams + week-1 checkpoint, 50% weight. A full exam
    assembles 5 PBQs (one distinct kind per domain) placed **first**, then domain-weighted MCQs
    interleaved; PBQs are scored at `ExamConfig.pbqPoints` (SY0-701 = 6, so 5 PBQs ≈ 26% of the
    score) while MCQs are worth 1 — mirroring the real exam's 20–30% PBQ weight.
- **Question banks:** Security+ 692 MCQs (104/164/166/139/119 across Domains 1–5; styles: recall 376, keyword 159, scenario 109, short-form 48)
  - 105 PBQs (matching, ordering, evidence, configuration, numeric, word-bank, sort, multi-step). **A+ Core 1 (220-1201): 150 MCQs** (20/34/38/16/42 across Domains 1–5, 21
    multi-selects) **+ 20 PBQs** (3/5/4/2/6 per domain, 8 kinds). **A+ Core 2 (220-1202): 150
    MCQs** (42/42/34/32 across Domains 1–4, 22 multi-selects) **+ 20 PBQs** (5/6/4/5 per domain,
    8 kinds). Bank ids: `mcq-/pbq-` (Security+), `a1-`/`a1-pbq-` (A+ Core 1), `a2-`/`a2-pbq-`
    (A+ Core 2). A+ banks validate against per-course `CourseBankSpec` constants in
    `bank-aplus-1201.ts` / `bank-aplus-1202.ts` (validator generalized in `question-bank.ts`).
    A+ authoring pipeline: `web/scripts/aplus-lib.py` + `merge-aplus-fragments.py` merge JSON
    fragments from `web/scripts/data/frags/` (fragments are authored directly; the expand-_.py
    scripts merge PBQs). Exam specs: A+ Core 1 90Q/90min pass 675; Core 2 90Q/90min pass 700 —
    both read from `COURSE_META.passingScore` (readiness thresholds 675/900 and 700/900).
    Bank expansion scripts live in `web/scripts/expand-d_.py`, `expand-pbqs.py`,
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
- **Practice hints** (`src/lib/server/hints.ts` + `POST /api/quiz/hint`): revealed after a wrong
  answer in free-practice mode. Authored per-question hints are optional (validator rejects hints
  containing the correct answer text); every question without one gets a deterministic auto-hint
  (choice kinds only name WRONG options — answer-neutral by construction; other kinds reveal at
  most one correct element). The 25% point cost is recorded server-side in `hint_used` and applied
  by `scoreQuestion`. Exam-mode payloads never ship hint text.
- **Retake flow** (`POST /api/quiz/retake`): from a completed session's result screen or the
  history page, relaunch a practice session containing only the missed questions.
- **Scheduling:** every assignment has a `dueOffsetDays` (negative = days before exam). The exam
  date lives in `course_meta` (`exam_date`, default: **last day of the current month**) and can be
  changed from the Syllabus page or `/admin` — changing it reschedules every due date, and the
  editor previews each shift before saving (`POST /api/course/exam-date/preview`). Any assignment
  can also carry a **per-scope due-date override** (`course_assignment_overrides`, keyed
  `(profile_id, course_id, assignment_id)`): an explicit `YYYY-MM-DD` that beats the derived
  date everywhere (`effectiveDueDate()` in `course.ts` is the single precedence point — home,
  syllabus, modules, assignment detail, gradebook, status, and Google Calendar sync). Overrides
  hold still when the exam date moves; clearing one returns the assignment to the schedule.

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
`db-pg.ts` is scope-agnostic — `createScopedRepo(repo, scope)` returns a bound view
over the same pool, and all reads/writes filter by the scope.

- `profiles` — id, name, color (hard cap `MAX_PROFILES = 2`; `default` is seeded and undeletable).
- Quiz engine: `quiz_sessions`, `quiz_answers`, `domain_progress` — scoped by
  `(profile_id, course_id)`; `quiz_session_state`, `quiz_session_responses` keyed by session.
- Course layer: `course_meta` (`(profile_id, course_id, key)` — per-scope
  `exam_date`), `course_modules` / `course_lessons` / `course_assignments`
  (content, `course_id` column), `course_assignment_overrides` (per-scope
  explicit due dates), `course_assignment_submissions` and
  `course_lesson_completions` (scoped by `profile_id`).
- Review layer: `review_cards` (`(profile_id, course_id, question_id)`),
  `study_log` (`(profile_id, date_key)` — streaks are per-profile, not per-course).
- Google Calendar: `google_oauth` (one row per profile), `google_synced_events`
  (`(profile_id, source)`).

The active-session invariant (one per scope) is enforced by the partial unique
index `quiz_sessions_one_active_scope`; the schema is created by `db:setup` and
`seedCourseContent` seeds the two default profiles + exam date per active
course. Scope isolation and profile-cap coverage lives in `db-pg.test.ts`.

## Initialization

```bash
npm run db:setup      # apply schema-pg.ts to DATABASE_URL (idempotent)
npm run db:seed       # seed course content + default profiles (idempotent)
npm run db:migrate    # import legacy SQLite data/quiz.db (optional)
```

Tests run against `TEST_DATABASE_URL` (an isolated database that the suite
wipes); `createTestRepository()` in `test-db.ts` resets + reseeds per call and
`vite.config.ts` forces sequential file execution for that reason.

## API Routes

| Method             | Path                                                       | Purpose                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`              | `/api/scope`                                               | Current scope + available profiles & courses (drives the header switchers)                                                                                                                                                                                                                                                                        |
| `POST`             | `/api/scope`                                               | `{action:'switch', profileId?, courseId?}` sets scope cookies; `{action:'create', name, color}` (400 past 2-profile cap); `{action:'rename', profileId, name}`                                                                                                                                                                                    |
| `DELETE`           | `/api/scope?profileId=`                                    | Delete a profile (blocked while it is the active scope; `default` is protected)                                                                                                                                                                                                                                                                   |
| `GET`              | `/api/course/overview`                                     | Home payload: exam date/countdown, readiness, gradebook summary, modules w/ progress, to-do list, recent sessions                                                                                                                                                                                                                                 |
| `GET`              | `/api/course/syllabus`                                     | All modules with lessons + assignments + statuses                                                                                                                                                                                                                                                                                                 |
| `GET`              | `/api/course/modules/[id]`                                 | Single module (lessons + assignments)                                                                                                                                                                                                                                                                                                             |
| `GET`              | `/api/course/assignments/[id]`                             | Assignment detail incl. best submission + launch config                                                                                                                                                                                                                                                                                           |
| `POST`             | `/api/course/lessons/[id]`                                 | Mark lesson `{ completed: boolean }`                                                                                                                                                                                                                                                                                                              |
| `POST`             | `/api/course/exam-date`                                    | Set exam date `{ examDate: 'YYYY-MM-DD' }` (real calendar date; reschedules all non-overridden assignments)                                                                                                                                                                                                                                       |
| `POST`             | `/api/course/exam-date/preview`                            | Dry-run: `{ examDate }` → per-assignment `{ from, to, overridden }` shifts, nothing saved                                                                                                                                                                                                                                                         |
| `POST`             | `/api/course/due-date`                                     | `{ assignmentId, dueDate: 'YYYY-MM-DD' \| null }` — pin or clear a per-scope due-date override (assignment must belong to the active course)                                                                                                                                                                                                      |
| `GET`              | `/api/gradebook`                                           | `{ gradebook, readiness }`                                                                                                                                                                                                                                                                                                                        |
| `GET`              | `/api/mastery`                                             | Per-objective + per-domain accuracy across all 28 SY0-701 objectives (from `quiz_answers`)                                                                                                                                                                                                                                                        |
| `GET`              | `/api/review`                                              | Daily-review summary: streak, due cards, today count, 84-day heatmap, wall of shame (with wall items)                                                                                                                                                                                                                                             |
| `POST`             | `/api/quiz/start`                                          | Session start — accepts optional `assignmentId`; `type: 'quiz'` accepts optional `objective` filter; `type: 'review'` requires `reviewSource: 'daily' \| 'wall'`                                                                                                                                                                                  |
| `GET/PATCH/DELETE` | `/api/quiz/session/[id]`                                   | Resume, move/flag, abandon                                                                                                                                                                                                                                                                                                                        |
| `PUT`              | `/api/quiz/answer`                                         | Save answer. Practice returns feedback (correct response + explanation); **graded assignment sessions (`assignmentId` set) return no feedback and lock each response after saving** — results appear on completion. Retries are capped at 2 (60%/30% factors) in practice only.                                                                   |
| `POST`             | `/api/quiz/hint`                                           | Practice-mode hint reveal `{ sessionId, questionIndex }` — returns `{ hint: { text } }` and records the 25% point cost **server-side** (`quiz_session_responses.hint_used`). Authored hints take precedence; otherwise an answer-safe auto-hint is generated per kind (see `src/lib/server/hints.ts`). Refused for exam mode and graded sessions. |
| `POST`             | `/api/quiz/retake`                                         | `{ sessionId }` (completed session) → starts a practice session containing only the missed questions                                                                                                                                                                                                                                              |
| `POST`             | `/api/quiz/complete`                                       | Finalize; records assignment submission when linked                                                                                                                                                                                                                                                                                               |
| `GET`              | `/api/progress`, `/api/history`, `/api/cards`, `/api/sync` | Legacy analytics/tools                                                                                                                                                                                                                                                                                                                            |
| `GET`              | `/api/calendar/google/status`                              | Google Calendar connection status (`configured`, `connected`, `email`, `syncedCount`, `lastSyncAt`)                                                                                                                                                                                                                                               |
| `GET`              | `/api/calendar/google/auth-url`                            | Starts OAuth: returns auth URL, sets `gcal_oauth_state` cookie (PKCE + state)                                                                                                                                                                                                                                                                     |
| `GET`              | `/api/calendar/google/callback`                            | OAuth callback: exchanges code, stores token, redirects to `/calendar?connected=1`                                                                                                                                                                                                                                                                |
| `GET`              | `/api/calendar/google/events?start&end`                    | Merged events from the user's visible calendars (server-side proxy)                                                                                                                                                                                                                                                                               |
| `POST`             | `/api/calendar/google/sync`                                | Pushes exam + assignment deadlines into the per-course "… Prep" calendar (create/update/delete)                                                                                                                                                                                                                                                   |
| `POST`             | `/api/calendar/google/disconnect`                          | Clears the stored OAuth token + sync tracking                                                                                                                                                                                                                                                                                                     |
| `POST`             | `/api/admin/reset`                                         | Full progress reset for the ACTIVE profile+course (from scope cookies). Requires `{ confirm: true }`. Wipes quiz sessions/answers/state/responses, domain progress, review cards, study log (per-profile by design), this course's submissions + lesson completions. Profiles, content, exam date, and overrides survive.                         |
| `GET`              | `/api/admin/backup`                                        | Download the active profile+course progress as JSON (`course-progress-backup` v1: sessions+state+responses+answers, domain progress, review cards, study log, submissions, lesson completions, exam date, overrides)                                                                                                                              |
| `POST`             | `/api/admin/backup`                                        | Restore a backup into the active scope: same `courseId` required (400 `COURSE_MISMATCH`), payload validated by `parseProgressBackup` (400 `INVALID_BACKUP`), progress wiped first, session ids remapped                                                                                                                                           |

## Frontend Pages (Svelte 5 runes, Tailwind CSS v4)

| Route                       | File                                       | Purpose                                                                                                                                                                                                                                                                                                |
| --------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`                         | `src/routes/+page.svelte`                  | **Course home** — bento grid: readiness hero (ring, grade, domain/exam bars), today, what's due, course path, drills, recent                                                                                                                                                                           |
| `/syllabus`                 | `src/routes/syllabus/+page.svelte`         | Full schedule in a two-pane layout; exam-date editor, module jump list and progress live in the right context rail                                                                                                                                                                                     |
| `/modules/[id]`             | `src/routes/modules/[id]/+page.svelte`     | Module detail in two panes; lessons expand in place, and the rail outline jumps to and opens a lesson                                                                                                                                                                                                  |
| `/assignments/[id]`         | `src/routes/assignments/[id]/+page.svelte` | Assignment detail — due date, status, best submission, launch                                                                                                                                                                                                                                          |
| `/practice`                 | `src/routes/practice/+page.svelte`         | **Practice hub** — the drill room: cards for Quiz, Scenarios, PBQs, full exam, Today's 10, Wall of Shame                                                                                                                                                                                               |
| `/progress`                 | `src/routes/progress/+page.svelte`         | **Progress ledger** — one tabbed hub (`?tab=grades\|mastery\|sessions`, default `grades`) merging the gradebook, the mastery matrix, and session history. Legacy `/gradebook`, `/mastery`, `/history` 308-redirect into the matching tab; `/history/[sessionId]` still serves the session detail page. |
| `/calendar`                 | `src/routes/calendar/+page.svelte`         | Month grid of deadlines + "Next up" list; Google Calendar connect/sync (see `GOOGLE-CALENDAR.md`)                                                                                                                                                                                                      |
| `/quiz` `/scenarios` `/pbq` | existing                                   | Free practice tools (not graded); accept `?assignment=` to run a graded assignment; `/quiz?review=daily\|wall` launches a review session                                                                                                                                                               |
| `/review`                   | `src/routes/review/+page.svelte`           | **Daily review** — streak hero, "Today's 10" launcher, 12-week heatmap, filterable Wall of Shame                                                                                                                                                                                                       |
| `/admin`                    | `src/routes/admin/+page.svelte`            | **Self-service administration** — exam-date editor (with shift preview), per-assignment due-date overrides, backup export/import, progress reset (type-RESET gate), and profile management. All scoping resolved server-side from the scope cookies.                                                   |
| `/mastery`                  | `src/routes/mastery/+page.server.ts`       | 308 redirect to `/progress?tab=mastery`                                                                                                                                                                                                                                                                |

### Shared components

- `StatusChip.svelte` — assignment status badge.
- `ProgressRing.svelte` — circular percentage (readiness/grade).
- `AppRail.svelte` — **desktop primary navigation**: an icon rail (4rem) that expands to show
  labels on hover and pins open (`localStorage['rail-pinned']`). Holds the groups Study, Drill,
  Track, plus Admin and the pin toggle; carries `nav[aria-label="Main navigation"]`.
- `CommandPalette.svelte` — Cmd+K / header-triggered navigation dialog (sections + modules).
- `ContextRail.svelte` — sticky right-hand rail (`hidden xl:block`) that content pages fill with
  orientation and quick actions. Used by syllabus, modules, assignments, progress, review, calendar,
  admin, and every drill launcher.
- `DrillLauncher.svelte` — the shared launcher shell for `/quiz`, `/scenarios`, and `/pbq`: hero with
  icon + eyebrow + heading, an options card, and the drills rail.
- `BottomNav.svelte` / `MobileMenu.svelte` — mobile chrome. Bottom tab bar (hidden from `lg`):
  Home, Course, Practice (raised center button), Progress, Review. `MobileMenu.svelte` is a
  self-contained hamburger trigger + top dropdown for Calendar, Quiz, Scenarios, PBQs, Admin and
  the theme toggle.
- `ProfileSwitcher.svelte` / `CourseSwitcher.svelte` — header chips → top dropdowns
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
npm run test         # vitest, against TEST_DATABASE_URL
npm run test:e2e     # build + Playwright (needs a database; see below)
npm run verify       # unit + check + build + e2e + whitespace gates
```

Playwright starts the built server and passes it `DATABASE_URL`, preferring `TEST_DATABASE_URL`
from `web/.env` (loaded by `playwright.config.ts`) so runs never touch real progress.
`e2e/quiz-presentation.spec.ts` is stateful: the app allows one active session per scope, so a
spec that leaves a session active makes a later spec resume it. Reset the scope (or run specs
against a fresh database) if those two tests fail in sequence.

`course.test.ts` covers the course definition, scheduling (incl. due-date override precedence and
exam-shift preview), assignment status, gradebook math, readiness, and the course service
end-to-end. `admin.test.ts` covers the scoped progress reset (target scope wiped, other profile +
other course intact) and the backup export→wipe→import round trip plus import validation. DB tests
use `createTestRepository()` from
`test-db.ts` (fresh truncated + reseeded Postgres per call, `TEST_DATABASE_URL` only).
`db-pg.test.ts` covers scope isolation between profiles, the 2-profile cap,
DB-enforced single active session, completion timing persistence, and seed healing.

## Styling

- Tailwind CSS v4 — `@import "tailwindcss"` in `app.css`, no config file.
- **"Paper & Ink" design system** (v2) — a beautifully typeset textbook. Warm paper + ink
  typography with one deep-green accent and one brass secondary. **Paper (light) is the default theme**
  (`#f7f6f0` bg, `#1a1c18` ink); **ink mode** (dark) is deep forest (`#131611` bg) with cream text.
  Accent = forest green (`--color-accent`, `#1f5d3f` light / `#84c79d` dark); secondary = brass (`#7a5c1e` / `#c2a566`).
  Semantic status colors only for success/danger/info/warning — never brand accents.
  Primary buttons are ink-filled (light) / cream-filled (dark) via `--color-primary` /
  `--color-on-primary`, not the accent color.
- Fonts: **Fraunces Variable** (serif display: `.h-display`, `.num-display`, `.serif-italic`) +
  **Inter Variable** (body), self-hosted via `@fontsource-variable/*` — works offline.
- Component classes in `app.css`: `.card` (4px radius, hairline border, whisper shadow),
  `.btn` / `.btn-primary` / `.btn-ghost` / `.btn-danger` (≥44px touch targets, 4px radius),
  `.chip` (square tag), `.eyebrow` (small-caps editoral label), `.serif-italic` (the editorial
  flourish), `.gradient-text` (solid accent), `.touch-target` (44px inline hit area), `.pb-safe`.
  Radius scale is crisp, not soft: `rounded`/`-md`/`-lg`/`-xl` = 4px, `rounded-sm` = 2px,
  `rounded-2xl` = 6px. Only true circles use `rounded-full`.
- **Full contract: `web/DESIGN.md`** — tokens, patterns, and hard rules. Read it before restyling
  any page; `src/routes/+page.svelte` and `src/routes/practice/+page.svelte` are the reference
  implementations.
- **Mobile-first**: bottom nav (`BottomNav.svelte`) has 5 tabs with a raised accent Practice
  button; the mobile "more" menu is a top dropdown (`MobileMenu.svelte`); gradebook/history tables become
  stacked cards below `md:`. Desktop uses the left icon rail plus a slim top strip, and the
  content column is `max-w-7xl` inside the shell.
- Progress colors: red (<60%), amber (60–84%), green (≥85%) via `getPercentColor` /
  `getBarColor` in `utils.ts`.
- Design rules: no gradients, no glow/colored shadows, no hardcoded hex in components — always
  theme tokens. Crisp radii (4px), hairline warm borders, serif headings, generous
  whitespace. `e2e/theme-mobile.spec.ts` enforces WCAG AA (4.5:1) for every text token against
  every surface in both themes.

## Phase 2 Candidates (not yet implemented)

- Per-question explanation display from optional CSV column (question bank already has rationales).
- Spaced-repetition scheduling (anki-like) for weak topics.
- Drag-and-drop file import for custom question decks.
- Calendar "week" view; assignment resubmission history table.
