# Multi-Profile & Multi-Course Database Overhaul — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.
>
> **Depends on:** Phase 0 (shared foundation) below. Read `2026-08-05-*-comptia-aplus-v15-course.md` §Foundation — the two plans share Phase 0; land it on `main` once before forking worktrees.

**Goal:** Turn the single-user, single-course Security+ app into a two-user, multi-course study app (Security+ SY0-701 + A+ Core 1 220-1201 + A+ Core 2 220-1202) **without losing the existing user's progress**.

**Architecture:** In-place SQLite migration `user_version 5 → 6` (table-rebuild pattern where PKs change, guarded `ALTER` where they don't), backfilling all existing data to a seeded default profile and the Security+ course. Add a `profiles` table; scope every user-data table by `profile_id` (+`course_id` where progress is per-course); scope content tables by `course_id` and seed from a new course registry. Profile + course selection via cookies (`profile_id`, `course_id`) resolved by a `resolveScope(event)` helper in API routes — no auth/passwords (local study app).

**Tech Stack:** SvelteKit 5 (runes), better-sqlite3, Tailwind v4, vitest. Existing patterns: module singleton repo, `PRAGMA user_version`, guarded DDL.

---

## Context / assumptions (verified this session)

- Current schema: `user_version 5`, 15 tables, ALL global (no user/course dimension). `data/quiz.db` holds the user's real progress (sessions, answers, review cards, gradebook submissions, exam date). Exam is end of month — **progress must survive**.
- Blast radius: 74 references to `quizRepository`/`courseService` across `src/lib/server/*` and 21 API routes.
- No `hooks.server.ts` exists; cookie infra already used for `gcal_oauth_state`.
- Content tables (`course_modules/lessons/assignments`) are seeded from static `COURSE_DEFINITION` — safe to rebuild/re-seed; user data is not.
- `Domain` type is `1|2|3|4|5`; `ObjectiveId` is the hardcoded 28-value SY0-701 union (must be generalized — see Phase 0).

## Key decisions

| Decision | Choice | Why |
|---|---|---|
| Migration vs bottom-up redo | **In-place migration to v6** | Real progress in `data/quiz.db` (exam end of month). Redo = wipe. Migration pattern already established; only new technique is SQLite table rebuild for PK changes. |
| Profile identity | Seeded default profile + UI to add/rename (hard cap **2**) | User said exactly two users. Local app → no auth. |
| Scope model | `(profile_id, course_id)` orthogonal | Both users can study any course; generalizes for free. |
| Where scope lives | Cookies `profile_id` + `course_id`, resolved in a `resolveScope(event)` helper used by API routes | Matches existing cookie usage; pages are client-side fetch, so no SSR/hooks needed. |
| Question ID uniqueness | IDs unique **within** a course; composite PKs carry `course_id` | Avoids renaming 388 existing Security+ question IDs (churn) — collision impossible since each bank validates unique IDs per course. |
| study_log | Scoped by `profile_id` only | Streaks are a personal-habit metric, not per-course. |
| google_oauth / synced events | Scoped by `profile_id` only | Each user connects their own Google calendar. |
| Course switcher | Header pill → bottom sheet (3 courses), cookie `course_id` | Mobile-first, matches bottom-sheet pattern. |

---

## Phase 0 — Shared foundation (land on `main` FIRST, before forking)

*Shared with the A+ plan. Small, behavior-preserving. Kills the conflict surface between the two worktrees.*

### Task 0.1: Generalize the course model in `types.ts`

**Files:** Modify `web/src/lib/types.ts`

- Add `export type CourseId = 'secp-701' | 'aplus-1201' | 'aplus-1202';`
- Replace the hardcoded `ObjectiveId` union with `export type ObjectiveId = string;` (per-course validity is enforced by each course's bank validator, not the TS union — same safety net, less type churn).
- Add a per-course metadata interface:
  ```ts
  export interface CourseMeta {
    id: CourseId;
    title: string; code: string; examName: string;
    passingScore: number; scaleMax: number;       // 750/900 sec+, 675/900 + 700/900 A+
    domainWeights: Record<number, number>;         // domain → % of exam
    domains: number[];                             // [1,2,3,4,5] sec+/1201, [1,2,3,4] 1202
    objectives: Record<number, string[]>;          // domain → objective id list
  }
  ```
- `SourceRef.source` union: add `'professor-messer'` (A+ plan will cite free video sections).

**Verify:** `npm run check` (0 errors), `npm test` (green — behavior unchanged).

### Task 0.2: Course registry in `course.ts`

**Files:** Modify `web/src/lib/server/course.ts`; Modify `web/src/lib/server/db.ts`

- Rename `COURSE_DEFINITION` → keep export name but move under a registry:
  ```ts
  export const COURSES: Record<CourseId, CourseDefinition> = { 'secp-701': COURSE_DEFINITION };
  export const COURSE_META: Record<CourseId, CourseMeta> = { 'secp-701': { ... } };
  export const ACTIVE_COURSES: CourseId[] = ['secp-701']; // A+ worktree appends
  ```
- Generalize `defaultExamDate()` (per-course OK — same formula, keyed by course).
- `computeReadiness`/`computeGradebook`: parameterize the domain list (`course.domains`) and weights (`course.domainWeights`) instead of the hardcoded `[1,2,3,4,5]` and SY0-701 quotas. `quiz.ts` completion loop `for (const domain of [1,2,3,4,5])` → per-course domains.
- `seedCourse` in `db.ts`: loop `ACTIVE_COURSES`, upsert modules/lessons/assignments per course (ids stay globally unique — prefix new courses' ids, e.g. `a1-...`/`a2-...`).

**Verify:** `npm test` green; fresh `:memory:` DB seeds one course as before; `npm run build` OK.

### Task 0.3: Commit Phase 0

```bash
git add web/src/lib/types.ts web/src/lib/server/course.ts web/src/lib/server/db.ts web/src/lib/server/quiz.ts
git commit -m "refactor(course): multi-course registry + per-course domains/weights (behavior-preserving)"
git push origin main
```
**Then fork the two worktrees** (profiles = this plan; A+ content = the other plan).

---

## Phase 1 — Migration plumbing in `db.ts` (v5 → v6)

### Task 1.1: Back up the real DB before any migration work

```bash
cd web && cp data/quiz.db /tmp/quiz-v5-backup-$(date +%F).db && ls -la /tmp/quiz-v5-backup-*.db
```
Also copy `data/quiz.db` to `/tmp/migrate-test.db` — **all migration testing happens on the copy via `QUIZ_DB_PATH`**, never the real file.

### Task 1.2: New `profiles` table + v6 schema in the `CREATE` block

**Files:** Modify `web/src/lib/server/db.ts`

- Add to the `db.exec` CREATE block (fresh-DB path creates v6 shape directly):
  ```sql
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL DEFAULT '#b7f04c',
    created_at TEXT NOT NULL
  );
  ```
- All other tables keep their `CREATE TABLE IF NOT EXISTS` (v6 shape for new columns/PKs is enforced by the migrate block below, which runs on fresh DBs too — see Task 1.4).
- Seed the default profile inside `seedCourse` (idempotent):
  ```ts
  db.prepare("INSERT INTO profiles (id, name, color, created_at) VALUES ('default', 'Default', '#b7f04c', ?) ON CONFLICT(id) DO NOTHING").run(new Date().toISOString());
  ```

**Verify:** fresh `:memory:` repo has `profiles` with one row; `npm test` green.

### Task 1.3: The v6 migration — exact table-by-table map

**Files:** Modify `web/src/lib/server/db.ts` (inside `migrate()` transaction, `user_version = 6` at end)

**A. Simple column adds (guarded `ALTER`, existing pattern):**

| Table | Adds | Backfill |
|---|---|---|
| `quiz_sessions` | `profile_id TEXT NOT NULL DEFAULT 'default'`, `course_id TEXT NOT NULL DEFAULT 'secp-701'` | — |
| `quiz_answers` | same two columns (denormalized for simple per-scope aggregation) | — |
| `course_modules` / `course_lessons` / `course_assignments` | `course_id TEXT NOT NULL DEFAULT 'secp-701'` | — (re-seeded by registry upsert below) |

**B. Table rebuilds (SQLite 12-step: `CREATE new` → `INSERT SELECT` with backfill → `DROP old` → `RENAME`):**

| Old PK | New PK | Backfill constants |
|---|---|---|
| `domain_progress(domain)` | `(profile_id, course_id, domain)` | `'default'`, `'secp-701'` |
| `review_cards(question_id)` | `(profile_id, course_id, question_id)` | `'default'`, `'secp-701'` |
| `study_log(date_key)` | `(profile_id, date_key)` | `'default'` |
| `course_meta(key)` | `(profile_id, course_id, key)` — `exam_date` row becomes `('default','secp-701','exam_date')` | `'default'`, `'secp-701'` |
| `course_assignment_submissions(assignment_id, session_id)` | `(profile_id, assignment_id, session_id)` | `'default'` |
| `course_lesson_completions(lesson_id)` | `(profile_id, lesson_id)` | `'default'` |
| `google_oauth(id=1 CHECK)` | `(profile_id)` | `'default'` |
| `google_synced_events(source)` | `(profile_id, source)` | `'default'` |

Rebuild sketch (per table):
```sql
CREATE TABLE domain_progress_new (profile_id TEXT NOT NULL, course_id TEXT NOT NULL, domain INTEGER NOT NULL,
  total_attempted INTEGER NOT NULL DEFAULT 0, total_correct INTEGER NOT NULL DEFAULT 0,
  points_earned REAL NOT NULL DEFAULT 0, points_possible REAL NOT NULL DEFAULT 0, last_reviewed_at TEXT,
  PRIMARY KEY (profile_id, course_id, domain));
INSERT INTO domain_progress_new (profile_id, course_id, domain, total_attempted, total_correct, points_earned, points_possible, last_reviewed_at)
  SELECT 'default', 'secp-701', domain, total_attempted, total_correct, points_earned, points_possible, last_reviewed_at FROM domain_progress;
DROP TABLE domain_progress; ALTER TABLE domain_progress_new RENAME TO domain_progress;
```
**Every rebuild must be guarded** (only run when the OLD shape is detected — e.g. `PRAGMA table_info(domain_progress)` lacks `profile_id`), so the migrate block is idempotent and safe on fresh DBs. Run the whole migrate inside one transaction; bump `user_version = 6`.

**C. Content reseed:** after rebuilds, run the registry upsert (Task 0.2) so `course_modules/lessons/assignments` carry `course_id`; `INSERT OR IGNORE` for modules/assignments, `ON CONFLICT(id) DO UPDATE` for lessons (existing convention — lessons get content updates).

**Verify (on the COPY):**
```bash
cd web && QUIZ_DB_PATH=/tmp/migrate-test.db node -e "import('./build/index.js')" # or run the migration via a test
node -e "const D=require('better-sqlite3'); const db=new D('/tmp/migrate-test.db'); console.log(db.pragma('user_version',{simple:true})); console.log(db.prepare('SELECT COUNT(*) c FROM quiz_sessions').get(), db.prepare('SELECT COUNT(*) c FROM quiz_sessions WHERE profile_id=?').get('default'));"
```
Expected: `user_version` = 6; pre-migration row counts preserved (sessions/answers/review_cards/submissions all still present, now scoped to `('default','secp-701')`).

### Task 1.4: Fresh-DB parity

Ensure a brand-new `:memory:` DB reaches the same v6 shape (migrate no-ops when already v6; CREATE block + default-profile seed cover it). Add a test: `createRepo(':memory:')` → assert `profiles` seeded, `course_meta` has `('default','secp-701','exam_date')`.

---

## Phase 2 — Scope-aware repository API

### Task 2.1: Scope type + scoped repo view

**Files:** Modify `web/src/lib/server/db.ts`

```ts
export interface Scope { profileId: string; courseId: CourseId; }
export const DEFAULT_SCOPE: Scope = { profileId: 'default', courseId: 'secp-701' };
```
- Repo methods that touch scoped tables gain `scope: Scope` (or a `scope` param object). Prefer a **scoped view** to avoid re-plumbing 20 signatures:
  ```ts
  export function createScopedRepo(repo: QuizRepository, scope: Scope) { /* returns bound wrappers */ }
  ```
  Existing method names unchanged; call sites swap `quizRepository.x(...)` → `scopedRepo.x(...)`.
- `getActiveSession`/`getRecentSessions`/`getAllCompletedSessions`/`getSubmissions`/`getLessonCompletions`/`getExamDate`/`getReviewCards`/`getStudyLog`/`getObjectiveProgress`/`getWeakTopics`/`getAnswerHistory`/`getAnsweredQuestionIds`/`getGoogleOAuth`/`getSyncedEvents` → filter by scope.
- `createSession`/`recordSubmission`/`recordStudyDay`/`setLessonCompleted`/`setExamDate`/`upsertReviewCard`/`saveGoogleOAuth`/`recordSyncedEvent`/`removeSyncedEvent` → write scope columns.

**Verify:** repo tests compile + pass with scope threading; add a scope-isolation test (two scopes, assert no cross-visibility of sessions/review cards/exam date).

### Task 2.2: `resolveScope` helper + API-route threading

**Files:** Create `web/src/lib/server/scope.ts`; Modify all 21 files under `web/src/routes/api/**` that call repo/service methods (see AGENTS.md route table; count: overview, syllabus, modules, assignments, lessons, exam-date, gradebook, mastery, review, quiz/start, quiz/session, quiz/answer, quiz/complete, quiz/catalog, progress, history, cards, sync, calendar/google/*).

```ts
// scope.ts
export function resolveScope(event: RequestEvent): Scope {
  const profileId = event.cookies.get('profile_id') ?? DEFAULT_SCOPE.profileId;
  const courseId = (event.cookies.get('course_id') as CourseId) ?? DEFAULT_SCOPE.courseId;
  // validate against ACTIVE_COURSES + profiles table; fall back to defaults on unknown values
  return { profileId, courseId };
}
```
- Each route: `const scope = resolveScope(event);` then use `createScopedRepo(quizRepository, scope)` (or pass scope into `courseService`/`review`/`mastery` calls).
- `quiz.ts`/`review.ts`/`mastery.ts`/`course-service.ts`/`sync.ts`/`google-calendar.ts`: accept/thread scope (calendar: calendar name becomes `${course.title} Prep` from `COURSE_META`; sync event `source` keys scoped by profile).

**Verify:** `npm run check`, `npm test`, `npm run build` all green; manual curl smoke on dev server with cookies (`curl -b 'profile_id=default; course_id=secp-701' localhost:5173/api/course/overview`).

---

## Phase 3 — Profile + course switcher UI (mobile-first, dark study tool)

### Task 3.1: Scope cookie API

**Files:** Create `web/src/routes/api/scope/+server.ts` (GET: current scope + available profiles/courses; POST: `{profileId?, courseId?}` sets cookies, `maxAge` 1 year, `path: '/'`).

### Task 3.2: Profile switcher

**Files:** Create `web/src/lib/components/ProfileSwitcher.svelte`; Modify `web/src/routes/+layout.svelte` (header row), `web/src/lib/components/BottomNav.svelte` if needed.

- Header chip: profile name + color dot → bottom sheet (existing `MobileMenu` pattern): list profiles (≤2), "Add profile" (name input, color picker from 4 palette swatches), rename/delete via `DELETE` support in `/api/scope` (delete blocked while it's the active scope; deleting frees the cap).
- Selecting a profile sets the cookie and reloads — all pages re-fetch scoped data.
- Cap enforcement: `POST /api/scope` returns 400 when `profiles.count >= 2`.

### Task 3.3: Course switcher

**Files:** Create `web/src/lib/components/CourseSwitcher.svelte`; Modify header/layout.

- Header pill showing `COURSE_META[course].title` (short: "Security+", "A+ Core 1", "A+ Core 2") → bottom sheet of `ACTIVE_COURSES`.
- Switching course swaps exam date, syllabus, gradebook, mastery grid, review queue (all scoped server-side). Active-session conflict card is per-scope (a quiz running in Security+ doesn't block starting one in A+ Core 1).
- Home page banner/exam countdown already read from `/api/course/overview` — no page logic change beyond re-fetch.

**Verify:** headless screenshots (mobile 390×844 + desktop) via `scripts/screenshot-themes.sh`-style run; verify switchers render, course switch changes exam date, profile switch isolates progress.

### Task 3.4: Mastery/review surface updates

**Files:** Modify `web/src/routes/mastery/+page.svelte`, `web/src/routes/review/+page.svelte`

- Mastery matrix: cells come from `COURSE_META[scope.courseId].objectives` (28 → 27/30 for A+ cores) — grid renders from data, not the hardcoded 28.
- Review page labels: "Wall of Shame"/streak already per-scope via API; confirm headers show course name.

---

## Phase 4 — Tests, docs, verification

### Task 4.1: Migration + isolation tests

**Files:** Modify `web/src/lib/server/quiz.test.ts` (or new `web/src/lib/server/migration.test.ts`)

- Test 1: build a v5-shaped DB by executing the old DDL + a few rows (fixture inline), run `createQuizRepository` on it, assert: `user_version` 6, rows backfilled to `('default','secp-701')`, exam_date preserved.
- Test 2: scope isolation — `createScopedRepo` for two profiles; sessions/review cards/exam dates/submissions don't leak across scopes.
- Test 3: fresh `:memory:` reaches v6 shape, default profile seeded, `ACTIVE_COURSES` all seeded.

### Task 4.2: Full verification

```bash
cd web && npm run check && npm test && npm run build
# smoke on the real DB COPY (never the real one):
QUIZ_DB_PATH=/tmp/migrate-test.db PORT=4899 node build/index.js &
curl -s localhost:4899/api/course/overview -H 'Cookie: profile_id=default; course_id=secp-701' | head -c 300
# kill server, delete temp files
```
Update `web/AGENTS.md` (DB tables section, API route table + scope cookies, "No authentication" note → "local multi-profile").

### Task 4.3: Land the worktree

From the PRIMARY worktree: `git merge <branch> --no-ff`, verify `git log`, push. If the A+ worktree landed first, expect a small conflict in `seedCourse`/`ACTIVE_COURSES` — resolve by keeping both registrations.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Migration SQL corrupts the real DB | Back up `data/quiz.db` first; migrate/test only on `/tmp/migrate-test.db`; migration is transactional; guarded rebuilds are idempotent. |
| 74 touchpoints make scope threading error-prone | Scoped-repo wrapper keeps call-site churn mechanical; svelte-check + vitest + build gate; scope-isolation tests. |
| Legacy routes (`/api/progress`, `/api/history`, `/api/cards`, `/api/sync`) behave oddly scoped | Explicit decision per route: scope history/cards/sync by profile; progress by profile+course. |
| Worktree merge conflict with A+ content branch | Phase 0 on main first; A+ branch touches only additive content files + registry append; merge A+ first then profiles (or resolve `seedCourse` manually). |
| User's two profiles accidentally share the Google calendar | `google_oauth` keyed by profile; each user connects their own account; calendar name per course. |

## Open questions for the user

1. Default profile name: "Default" OK, or should the existing user be named now (e.g., first name)?
2. History page: show all courses for the profile, or only the active course? (Plan default: active course only.)
3. Hard cap of exactly 2 profiles, or allow more later? (Plan default: cap 2 per your statement.)
