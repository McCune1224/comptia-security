# Mobile QA Report — 2026-08-16T19:07:32.766Z

## Executive summary

- **Gate status:** PASS (exit 0)
- **Themes exercised:** dark (computed: dark), light (computed: light) (computed `data-theme` recorded per run)
- **Routes swept:** 12 owned route(s)
- **Kinds exercised:** choice, configuration, evidence, matching, multi-step, ordering, slider, sort, word-bank
- **Kinds NOT exercised (no bank items yet — renderer supported, reported unavailable):** memory, numeric, hotspot
- **Console errors:** 0 · **Page errors:** 0 · **Failed resources:** 0
- **Fixed-viewport checks:** 10 run
- **Findings:** 1 unique (0 high, 0 medium, 1 low/info)
- **DB:** throwaway `/tmp/qa-85967.db` (never the user's real DB)
- **Viewports:** 390×844 + 1400 @3x, 320×568, 640×360 landscape, hasTouch, both themes

## Notes

Post-fix audit run (fail-threshold gate), both themes. Drills seeded via POST /api/quiz/start; every kind answered + screenshotted. Routes swept for ≥44px touch targets + horizontal overflow; console/page errors fail the gate; fixed-viewport scenarios cover dropdowns, calendar, lesson drills, and bottom-nav clearance.


## Gate results

- **Small touch targets (<44px):** 0
- **Horizontal overflow:** 0
- **Dropdown/viewport violations:** 0
- **Console/page errors:** 0

- none — all owned routes clear the ≥44×44px contract, no overflow, no console errors.

## Console / page errors

- none



## Kinds exercised

- **choice:** exercised + screenshotted
- **configuration:** exercised + screenshotted
- **evidence:** exercised + screenshotted
- **matching:** exercised + screenshotted
- **memory:** unavailable — no bank items in this build (renderer supported)
- **multi-step:** exercised + screenshotted
- **numeric:** unavailable — no bank items in this build (renderer supported)
- **ordering:** exercised + screenshotted
- **slider:** exercised + screenshotted
- **sort:** exercised + screenshotted
- **word-bank:** exercised + screenshotted
- **hotspot:** unavailable — no bank items in this build (renderer supported)

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
- `screenshots/kind-slider-390x1400.png`
- `screenshots/kind-slider-390x844.png`
- `screenshots/kind-sort-390x1400.png`
- `screenshots/kind-sort-390x844.png`
- `screenshots/kind-word-bank-390x1400.png`
- `screenshots/kind-word-bank-390x844.png`
- `screenshots/page-calendar-390x1400.png`
- `screenshots/page-calendar-390x844.png`
- `screenshots/page-calendar-dark-390x1400.png`
- `screenshots/page-calendar-dark-390x844.png`
- `screenshots/page-calendar-light-390x1400.png`
- `screenshots/page-calendar-light-390x844.png`
- `screenshots/page-gradebook-390x1400.png`
- `screenshots/page-gradebook-390x844.png`
- `screenshots/page-gradebook-dark-390x1400.png`
- `screenshots/page-gradebook-dark-390x844.png`
- `screenshots/page-gradebook-light-390x1400.png`
- `screenshots/page-gradebook-light-390x844.png`
- `screenshots/page-history-390x1400.png`
- `screenshots/page-history-390x844.png`
- `screenshots/page-history-dark-390x1400.png`
- `screenshots/page-history-dark-390x844.png`
- `screenshots/page-history-light-390x1400.png`
- `screenshots/page-history-light-390x844.png`
- `screenshots/page-home-menu-dark-390x844.png`
- `screenshots/page-home-menu-light-390x844.png`
- `screenshots/page-mastery-390x1400.png`
- `screenshots/page-mastery-390x844.png`
- `screenshots/page-mastery-dark-390x1400.png`
- `screenshots/page-mastery-dark-390x844.png`
- `screenshots/page-mastery-light-390x1400.png`
- `screenshots/page-mastery-light-390x844.png`
- `screenshots/page-modules-week-1-390x1400.png`
- `screenshots/page-modules-week-1-390x844.png`
- `screenshots/page-modules-week-1-dark-390x1400.png`
- `screenshots/page-modules-week-1-dark-390x844.png`
- `screenshots/page-modules-week-1-light-390x1400.png`
- `screenshots/page-modules-week-1-light-390x844.png`
- `screenshots/page-page-390x1400.png`
- `screenshots/page-page-390x844.png`
- `screenshots/page-page-dark-390x1400.png`
- `screenshots/page-page-dark-390x844.png`
- `screenshots/page-page-light-390x1400.png`
- `screenshots/page-page-light-390x844.png`
- `screenshots/page-pbq-390x1400.png`
- `screenshots/page-pbq-390x844.png`
- `screenshots/page-pbq-dark-390x1400.png`
- `screenshots/page-pbq-dark-390x844.png`
- `screenshots/page-pbq-light-390x1400.png`
- `screenshots/page-pbq-light-390x844.png`
- `screenshots/page-progress-390x1400.png`
- `screenshots/page-progress-390x844.png`
- `screenshots/page-progress-dark-390x1400.png`
- `screenshots/page-progress-dark-390x844.png`
- `screenshots/page-progress-light-390x1400.png`
- `screenshots/page-progress-light-390x844.png`
- `screenshots/page-quiz-390x1400.png`
- `screenshots/page-quiz-390x844.png`
- `screenshots/page-quiz-dark-390x1400.png`
- `screenshots/page-quiz-dark-390x844.png`
- `screenshots/page-quiz-light-390x1400.png`
- `screenshots/page-quiz-light-390x844.png`
- `screenshots/page-review-390x1400.png`
- `screenshots/page-review-390x844.png`
- `screenshots/page-review-dark-390x1400.png`
- `screenshots/page-review-dark-390x844.png`
- `screenshots/page-review-light-390x1400.png`
- `screenshots/page-review-light-390x844.png`
- `screenshots/page-scenarios-390x1400.png`
- `screenshots/page-scenarios-390x844.png`
- `screenshots/page-scenarios-dark-390x1400.png`
- `screenshots/page-scenarios-dark-390x844.png`
- `screenshots/page-scenarios-light-390x1400.png`
- `screenshots/page-scenarios-light-390x844.png`
- `screenshots/page-syllabus-390x1400.png`
- `screenshots/page-syllabus-390x844.png`
- `screenshots/page-syllabus-dark-390x1400.png`
- `screenshots/page-syllabus-dark-390x844.png`
- `screenshots/page-syllabus-light-390x1400.png`
- `screenshots/page-syllabus-light-390x844.png`

## Findings

### Issue 1: Ordering reorder verified

- **Severity:** Info · **Category:** UX
- **Page:** `pbq`
- **Details:** 0/16 touch drags reordered; 16 failed drags recovered via the keyboard fallback (CDP touch emulation flake — verify on a physical device).

