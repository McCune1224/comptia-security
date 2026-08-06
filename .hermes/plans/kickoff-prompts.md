# Worktree Kickoff Prompts — Profiles & A+ V15

Ready-to-paste prompts for the two feature worktrees. Fork from `main` (foundation commit
`32dca8e` already landed), then paste the matching prompt into the agent in each worktree.

## Fork

```bash
git worktree add .worktrees/profiles -b feat/profiles
git worktree add .worktrees/aplus -b feat/aplus-v15
```

## Worktree A — Profiles (paste into the `profiles` worktree)

````text
You are implementing the multi-profile + multi-course database overhaul for the CompTIA study
app in this worktree (SvelteKit 5 + better-sqlite3, app lives in web/).

START by reading the plan: .hermes/plans/2026-08-05_profiles-multiuser-db-migration.md — follow
it phase by phase. Also read web/AGENTS.md for architecture and styling conventions.

ALREADY DONE on main (do not redo): the multi-course foundation — CourseId/CourseMeta types,
COURSES/COURSE_META/ACTIVE_COURSES registry in web/src/lib/server/course.ts, generalized
computeReadiness (domains + quotas params), quiz.ts ExamConfig + assemblePbqSet, registry-driven
seeding in db.ts. Verified green: check/tests/build (commit 32dca8e).

YOUR SCOPE:
1. v5→v6 DB migration — profiles table, profile_id/course_id scoping on every user-data table,
   PK rebuilds (SQLite 12-step pattern) for the 8 tables whose primary key changes, backfill all
   existing data to ('default','secp-701').
2. Scope-aware repository + resolveScope(event) cookie helper threaded through ALL API routes and
   server libs (quiz.ts, review.ts, mastery.ts, course-service.ts, sync.ts, google-calendar.ts).
3. Profile + course switcher UI — mobile-first, dark study tool design per AGENTS.md (flat
   surfaces, acid-lime accent, sharp corners, bottom sheets; NO corporate look). Hard cap: 2
   profiles. No auth/passwords — profile_id + course_id cookies.

HARD RULES:
- NEVER open or migrate the real data/quiz.db. Copy it to /tmp/migrate-test.db and run all
  migration testing against the copy via QUIZ_DB_PATH. Migration must preserve existing progress.
- Migration must be transactional + idempotent; bump user_version to 6; fresh :memory: DBs must
  reach the same v6 shape (migrate no-ops).
- Existing 53 tests must keep passing; add migration + scope-isolation tests (two profiles must
  not see each other's sessions/review cards/exam dates).

VERIFY BEFORE EVERY COMMIT: cd web && npm run check (0 errors) && npm test (all pass) && npm run build.
COMMIT per phase (migration → repo scoping → switcher UI) with clear messages. Do NOT merge or
push — the user merges from the primary checkout.
````

## Worktree B — A+ V15 course (paste into the `aplus` worktree)

````text
You are building the CompTIA A+ (V15) courses for the study app in this worktree (SvelteKit 5 +
better-sqlite3, app lives in web/).

START by reading the plan: .hermes/plans/2026-08-05_comptia-aplus-v15-course.md — follow it phase
by phase (skip Phase 0: the multi-course foundation is already on main, commit 32dca8e). Read
web/AGENTS.md. For the bank-authoring pipeline, follow the Security+ pattern: Python merge
scripts (web/scripts/bank-lib.py) → bank JSON → per-course validator constants → locked-count
tests (the "4-file process").

VERSION FACTS (do not second-guess): 220-1101/1102 retired 2025-09-25. Target ONLY V15 — Core 1 =
220-1201 (90 Q / 90 min, pass 675/900, 5 domains 13/23/25/11/28%, 27 objectives), Core 2 =
220-1202 (90 Q / 90 min, pass 700/900, 4 domains 28/28/23/21%, 30 objectives). Both cores
required, same version.

SOURCES (topic maps + format reference ONLY — every question and lesson must be ORIGINAL text):
- Official objectives PDFs at /tmp/aplus-220-1201-objectives.pdf and /tmp/aplus-220-1202-objectives.pdf
  — copy into the repo root as "CompTIA_A+_220-1201_Exam_Objectives.pdf" / "..._1202_...". If /tmp
  was wiped, re-download from https://www.onlc.com/comptia/comptia-a-220-1201-exam-objectives.pdf
  and https://www.examcompass.com/comptia-certifications/a-plus/core-2/comptia-a-plus-220-1202-exam-objectives.pdf
- Professor Messer free course INDEX pages = per-objective topic map: scrape
  https://www.professormesser.com/free-a-plus-training/220-1201/220-1201-video/220-1201-training-course/
  and the 220-1202 equivalent (1201 index cached at ~/.hermes/cache/web/www.professormesser.com-6cdbbe0dad.md).
  His course notes PDF is PAID — never scrape or reproduce it.
- ExamCompass free topic index (cached: ~/.hermes/cache/web/www.examcompass.com-08e290df23.md) and
  Crucial Exams free practice tests: topic cross-check + format patterns only.
- ETHICS (non-negotiable): never copy vendor question text, never use braindumps, never reproduce
  paid notes. After authoring, grep distinctive phrases from source pages to confirm nothing was
  copied verbatim.

DELIVERABLES: register both cores in COURSES/COURSE_META/ACTIVE_COURSES (ids 'aplus-1201' /
'aplus-1202', question IDs prefixed a1-/a2-), bank baselines 150 MCQ + 20 PBQ per core (MCQ quotas
proportional to domain weights), lessons/assignments mirroring the Security+ course shape
(4 modules, 90-Q full exams via examConfig quotas — Core 2 has FOUR domains), acronym drills from
the objectives PDFs' acronym lists. Ship Core 1 complete and verified first, then Core 2. It's a
large content lift — delegate per-domain authoring if you can, but validate everything yourself.

INTEGRATION NOTE: the UI is still single-course until the profiles branch lands (course switcher +
per-course mastery are that branch's scope). Your end-to-end verification is at the data/service
level: bank validation, registry seeding, quiz sessions with the A+ banks, course definitions.
Final UI wiring happens at merge time — expect a small merge in ACTIVE_COURSES.

VERIFY: cd web && npm run check (0 errors) && npm test && npm run build. Smoke on a throwaway DB
(QUIZ_DB_PATH=/tmp/smoke-aplus.db): start/answer/complete a 90-Q full exam per core.
COMMIT per phase; do not merge or push — the user merges from the primary checkout.
````

## Sequencing note

Both branches run fully in parallel. The A+ branch builds data + registration only and never
touches the UI-scoping files the profiles branch owns; the only shared file is `ACTIVE_COURSES`
in `web/src/lib/server/course.ts` (A+ appends, profiles reads) — a trivial merge. Merge the
profiles branch first if you want the course switcher live sooner; either order works.
