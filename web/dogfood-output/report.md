# Mobile QA Report — 2026-08-13T22:29:25.521Z

## Executive summary

- **Gate status:** ✅ PASS (exit 0)
- **Routes swept:** 11 owned + 1 deferred route(s)
- **Kinds exercised:** choice, configuration, matching, word-bank
- **Kinds NOT exercised (no bank items yet / post-merge re-audit):** evidence, multi-step, numeric, ordering, sort, hotspot
- **Console errors:** 0 · **Page errors:** 0 · **Failed resources:** 0
- **Findings:** 5 unique (0 high, 0 medium, 5 low/info)
- **DB:** throwaway `/tmp/qa-283819.db` (never the user's real DB)
- **Viewport:** 390×844 + 1400 @3x, hasTouch, dark theme

## Notes

Post-fix audit run (fail-threshold gate). Drills seeded via POST /api/quiz/start; every kind answered + screenshotted. Routes swept for ≥44px touch targets + 390px overflow; console/page errors fail the gate.


## Gate results

- **Small touch targets (<44px) on owned routes:** 0
- **Horizontal overflow:** 0
- **Console/page errors:** 0

- ✅ none — all owned routes clear the ≥44×44px contract at 390px, no overflow, no console errors.

## Console / page errors

- none



## Kinds exercised

- **choice:** exercised + screenshotted
- **configuration:** exercised + screenshotted
- **evidence:** not exercisable — no bank items in this build (engine kind; lands with WT-A/WT-D merges)
- **matching:** exercised + screenshotted
- **multi-step:** not exercisable — no bank items in this build (engine kind; lands with WT-A/WT-D merges)
- **numeric:** not exercisable — no bank items in this build (engine kind; lands with WT-A/WT-D merges)
- **ordering:** not exercisable — no bank items in this build (engine kind; lands with WT-A/WT-D merges)
- **sort:** not exercisable — no bank items in this build (engine kind; lands with WT-A/WT-D merges)
- **word-bank:** exercised + screenshotted
- **hotspot:** not exercisable — no bank items in this build (engine kind; lands with WT-A/WT-D merges)

## Screenshots

- `screenshots/kind-choice-390x1400.png`
- `screenshots/kind-choice-390x844.png`
- `screenshots/kind-configuration-390x1400.png`
- `screenshots/kind-configuration-390x844.png`
- `screenshots/kind-evidence-390x1400.png`
- `screenshots/kind-evidence-390x844.png`
- `screenshots/kind-matching-390x1400.png`
- `screenshots/kind-matching-390x844.png`
- `screenshots/kind-multi-step-390x1400.png`
- `screenshots/kind-multi-step-390x844.png`
- `screenshots/kind-ordering-390x1400.png`
- `screenshots/kind-ordering-390x844.png`
- `screenshots/kind-word-bank-390x1400.png`
- `screenshots/kind-word-bank-390x844.png`
- `screenshots/page-calendar-390x1400.png`
- `screenshots/page-calendar-390x844.png`
- `screenshots/page-gradebook-390x1400.png`
- `screenshots/page-gradebook-390x844.png`
- `screenshots/page-history-390x1400.png`
- `screenshots/page-history-390x844.png`
- `screenshots/page-mastery-390x1400.png`
- `screenshots/page-mastery-390x844.png`
- `screenshots/page-modules-week-1-390x1400.png`
- `screenshots/page-modules-week-1-390x844.png`
- `screenshots/page-page-390x1400.png`
- `screenshots/page-page-390x844.png`
- `screenshots/page-pbq-390x1400.png`
- `screenshots/page-pbq-390x844.png`
- `screenshots/page-progress-390x1400.png`
- `screenshots/page-progress-390x844.png`
- `screenshots/page-quiz-390x1400.png`
- `screenshots/page-quiz-390x844.png`
- `screenshots/page-review-390x1400.png`
- `screenshots/page-review-390x844.png`
- `screenshots/page-scenarios-390x1400.png`
- `screenshots/page-scenarios-390x844.png`
- `screenshots/page-syllabus-390x1400.png`
- `screenshots/page-syllabus-390x844.png`

## Remaining / deferred items (post-merge re-audit)

- Deferred routes swept and logged only (sibling workstream ownership): see findings tagged `(deferred)` below.
- Known, un-fixed by design: `/modules/[id]` lesson-complete ✓ (32×32) + "← Syllabus" (76×40) — owned by WT-C. ExamFlow question-navigator buttons (h-10 w-10 = 40px) — owned by WT-A. Both re-audited after their branches merge.

## Findings

### Issue 1: 15 small touch targets (deferred — post-merge re-audit)

- **Severity:** Info · **Category:** Accessibility
- **Page:** `pbq#word-bank`
- **Details:** e.g. button "1" 40×40px; button "2" 40×40px; button "3" 40×40px; button "4" 40×40px; button "5" 40×40px (+10 more)


### Issue 2: 3 small touch targets (deferred — post-merge re-audit)

- **Severity:** Info · **Category:** Accessibility
- **Page:** `/modules/week-1`
- **Details:** e.g. a "← Syllabus" 76×40px; button "Mark Domain 1 — General Security Concepts as rea" 32×32px; button "Mark Domain 2 — Threats, Vulnerabilities & Mitig" 32×32px


### Issue 3: 5 small touch targets (deferred — post-merge re-audit)

- **Severity:** Info · **Category:** Accessibility
- **Page:** `pbq#configuration`
- **Details:** e.g. button "1" 40×40px; button "2" 40×40px; button "3" 40×40px; button "4" 40×40px; button "5" 40×40px


### Issue 4: 5 small touch targets (deferred — post-merge re-audit)

- **Severity:** Info · **Category:** Accessibility
- **Page:** `pbq#choice`
- **Details:** e.g. button "1" 40×40px; button "2" 40×40px; button "3" 40×40px; button "4" 40×40px; button "5" 40×40px


### Issue 5: 5 small touch targets (deferred — post-merge re-audit)

- **Severity:** Info · **Category:** Accessibility
- **Page:** `pbq#matching`
- **Details:** e.g. button "1" 40×40px; button "2" 40×40px; button "3" 40×40px; button "4" 40×40px; button "5" 40×40px

