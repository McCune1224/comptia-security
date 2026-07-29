# Security+ Quiz App — Project Context

## Overview

Security+ exam prep web app built with SvelteKit 5 (runes). Sources Anki-style CSV flashcards from the parent `anki/` directory and presents them as interactive quizzes — multiple choice, performance-based questions (drag-and-rank), and scenario-based questions — with persistent progress tracking via SQLite.

## Architecture

```
anki/AI Security+/V3/*.csv  ──→  src/lib/server/cards.ts  ──→  quiz.ts  ──→  API routes
                                                            ↕
                                                      db.ts (better-sqlite3)
                                                            ↕
                                                        data/quiz.db
```

- **No SSR needed** — all page data is fetched client-side via `fetch('/api/...')`.
- **No authentication** — local-only single-user app.
- **No ORM** — raw `better-sqlite3` queries.

## Data Sources

CSV files in `anki/AI Security+/V3/`:

| File                              | Content                                | Type         |
| --------------------------------- | -------------------------------------- | ------------ |
| `{1..5}_Definitions_Domain_*.csv` | Domain 1–5 definition Q&A cards        | `definition` |
| `7_Scenario_Practice.csv`         | Scenario-based situational questions   | `scenario`   |
| `8_PBQ_Practice.csv`              | Performance-based (ordering) questions | `pbq`        |

Each CSV row: `front,back,tags` where tags encode domain + category (`1::General Concepts`).

## Data Model (`src/lib/types.ts`)

```ts
Card          — front, back, domain, tags[]
Question      — prompt, correctAnswer, options[4], domain, category, type
PbqQuestion   — prompt, correctSteps[], domain, category
QuizSession   — id, startedAt, type, domain, questions[], answers[], completed
QuizAnswer    — questionIndex, selected, correct, domain
QuizResult    — sessionId, score, total, percentage, domainBreakdown, type, completedAt
```

## Server Lib (`src/lib/server/`)

| Module          | Purpose                                                                            |
| --------------- | ---------------------------------------------------------------------------------- |
| `cards.ts`      | Reads & caches CSVs by type (definition/scenario/pbq)                              |
| `distractor.ts` | Token/Jaccard-similarity distractor picker for multiple-choice options             |
| `quiz.ts`       | Session lifecycle: start, submitAnswer, complete. Holds active sessions in memory. |
| `db.ts`         | SQLite CRUD: sessions, answers, domain progress. Schema auto-created.              |
| `sync.ts`       | Writes results back to Obsidian vault notes (dashboard, weak topics, mock exams)   |

## API Routes

| Method | Path                 | Body/Params                            | Returns                                        |
| ------ | -------------------- | -------------------------------------- | ---------------------------------------------- |
| `POST` | `/api/quiz/start`    | `{ type, count?, domain? }`            | `{ sessionId, questions[] }`                   |
| `POST` | `/api/quiz/answer`   | `{ sessionId, questionIndex, answer }` | `{ correct, correctAnswer, isComplete }`       |
| `POST` | `/api/quiz/complete` | `{ sessionId }`                        | `QuizResult`                                   |
| `GET`  | `/api/progress`      | —                                      | `{ progress, recentSessions[], weakTopics[] }` |
| `GET`  | `/api/cards`         | `?domain=&type=`                       | `{ total, cards[] }`                           |
| `POST` | `/api/sync`          | `{ sessionId }`                        | `{ success, messages[] }`                      |

`type` values: `'quiz'` (definition MC), `'scenario'`, `'pbq'`, `'full'` (90-quest exam).

## Frontend Pages (all use Svelte 5 runes, Tailwind CSS v4)

| Route        | File                                | Purpose                                                                                   |
| ------------ | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `/`          | `src/routes/+page.svelte`           | **Dashboard** — domain progress cards, quick-action buttons, recent sessions, weak topics |
| `/quiz`      | `src/routes/quiz/+page.svelte`      | **Quiz** — domain/count setup → multiple-choice flow → results                            |
| `/pbq`       | `src/routes/pbq/+page.svelte`       | **PBQ** — SortableJS drag-to-rank ordering → check answer → results                       |
| `/scenarios` | `src/routes/scenarios/+page.svelte` | **Scenarios** — count setup → scenario MC flow → results                                  |
| `/progress`  | `src/routes/progress/+page.svelte`  | **Progress** — domain breakdown, recent sessions, weak topics table                       |

All pages are single-file `+page.svelte` components — no shared component library, no stores, no SSR load functions. Data fetched via `fetch` in `onMount`/`$effect`.

### Key Patterns

- **State**: `let x = $state(...)`
- **Derived**: `let y = $derived(x * 2)`
- **Effects** (SortableJS, etc.): `$effect(() => { /* setup */ return () => cleanup })`
- **Props**: `let { prop } = $props()`
- **Events**: `onclick={() => ...}` (not `on:click`)
- **Conditionals**: `{#if}`, `{#each}` with keyed items
- **No legacy**: no `$:`, `export let`, `on:`, `<slot>`, stores

## Sessions & State

- Active quiz sessions live in server memory (max one per user).
- `POST /api/quiz/start` creates both in-memory session and DB row.
- `POST /api/quiz/answer` persists answer to DB and updates domain progress.
- On `isComplete === true`, the session is auto-finalized in DB.
- `POST /api/quiz/complete` manually finalizes if needed (returns `QuizResult`).
- **Refresh loses in-memory session** — acceptable for MVP.

## Build & Test

```bash
npm run dev          # dev server on localhost:5173
npm run build        # production build (adapter-node)
npm run check        # svelte-check type checking
npm run lint         # prettier + eslint
npm run format       # auto-format
```

## Distractor Algorithm

`distractor.ts` tokenizes the correct answer's text, computes Jaccard similarity against all other cards in the same domain, and picks the 3 most similar-sounding wrong answers as distractors. Falls back to random cards from other domains if the domain has < 4 cards.

## Styling

- Tailwind CSS v4 — `@import "tailwindcss"` in `app.css`, no config file.
- Dark nav bar (`bg-slate-900`) with cyan accent hover.
- Content area: `max-w-4xl mx-auto p-6`.
- Progress colors: red (`<60%`), yellow (`60–84%`), green (`≥85%`).

## Dependencies

- Production: `better-sqlite3`, `sortablejs`
- Dev: `@sveltejs/kit`, `@sveltejs/adapter-node`, `svelte` (v5), tailwindcss v4, prettier, eslint, typescript v6

## Phase 2 Candidates (not yet implemented)

- Per-question explanation display from optional CSV column.
- Persistent answer review (review wrong answers after quiz).
- Spaced-repetition scheduling (anki-like).
- Mobile-responsive layout.
- Drag-and-drop file import for custom card decks.
