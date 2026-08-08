# Mobile QA Report — 2026-08-08T15:22:00.147Z

## Executive summary

- **Kinds exercised:** choice, configuration, evidence, matching, multi-step, numeric, ordering, sort, word-bank
- **Console errors:** 1
- **Findings:** 24 unique (0 high, 18 medium, 6 low/info)
- **DB:** throwaway `/tmp/qa-151936.db` (never the user's real DB)
- **Viewport:** 390×844 @3x, hasTouch, dark theme

## Notes

Baseline audit run. 9 question kinds exercised on touch. Screenshots in screenshots/. Re-run after each feature phase.


## Baseline fixes already landed in this branch

- SortBoard: bucket containers were NOT tappable (onBucketTap never wired) — items could not be placed into empty buckets, so sort questions were unanswerable. Now role="button" + tap/keyboard handlers.
- Ordering drag: buttons had touch-action: manipulation (scroll hijack). .drag-handle now gets touch-action: none — touch drags reorder (verified in-run).
- ExamFlow Check gate: matching and multi-step children had no completeness check — Check enabled with 1/N connected, then the server rejected the response (error card). Added matchingAnswered() + stepAnswered() for all child kinds.
- Touch targets: ThemeToggle 36px→44px; home "Review → / Calendar → / History → / Full syllabus / Objective mastery →" links 20px→44px.

## Known remaining (accepted / polish)

- Mastery/review domain-filter chips (All (47), D1 (9), …) are 23px tall — deliberate dense chip design; candidates for a touch-target pass if the user wants bigger filters.
- Calendar day cells measure 43px wide (grid-constrained, borderline vs 44px).
- Lesson-complete ✓ button is 32×32px on the module page.
- View all text links on review/history are 20px tall.
- One 400 console error during sessions: expected (a retry-locked answer under the emulated flow).

## Console / page errors

- `console.error: Failed to load resource: the server responded with a status of 404 (Not Found)`

## Findings

### Issue 1: Touch target under 44px

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/`
- **Details:** a "View all" is 53×20px


### Issue 2: Touch target under 44px

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/modules/week-1`
- **Details:** a "← Syllabus" is 76×40px


### Issue 3: Touch target under 44px (×2)

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/modules/week-1`
- **Details:** button "✓" is 32×32px


### Issue 4: Touch target under 44px

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/review`
- **Details:** button "All (43)" is 63×23px


### Issue 5: Touch target under 44px

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/review`
- **Details:** button "D1 (5)" is 47×23px


### Issue 6: Touch target under 44px

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/review`
- **Details:** button "D2 (11)" is 52×23px


### Issue 7: Touch target under 44px

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/review`
- **Details:** button "D3 (9)" is 49×23px


### Issue 8: Touch target under 44px

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/review`
- **Details:** button "D4 (9)" is 50×23px


### Issue 9: Touch target under 44px

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/review`
- **Details:** button "D5 (9)" is 49×23px


### Issue 10: Touch target under 44px

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/progress`
- **Details:** a "View all" is 53×20px


### Issue 11: Touch target under 44px

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/calendar`
- **Details:** button "1" is 43×56px


### Issue 12: Touch target under 44px

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/calendar`
- **Details:** button "2" is 43×56px


### Issue 13: Touch target under 44px

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/calendar`
- **Details:** button "3" is 43×56px


### Issue 14: Touch target under 44px

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/calendar`
- **Details:** button "4" is 43×56px


### Issue 15: Touch target under 44px

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/calendar`
- **Details:** button "5" is 43×56px


### Issue 16: Touch target under 44px

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/calendar`
- **Details:** button "6" is 43×56px


### Issue 17: Touch target under 44px

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/calendar`
- **Details:** button "7" is 43×56px


### Issue 18: Touch target under 44px

- **Severity:** Medium · **Category:** Accessibility
- **Page:** `/calendar`
- **Details:** button "8" is 43×56px


### Issue 19: 1 small touch targets on page

- **Severity:** Info · **Category:** UX
- **Page:** `/`
- **Details:** see sweep details


### Issue 20: 1 small touch targets on page

- **Severity:** Info · **Category:** UX
- **Page:** `/progress`
- **Details:** see sweep details


### Issue 21: 3 small touch targets on page

- **Severity:** Info · **Category:** UX
- **Page:** `/modules/week-1`
- **Details:** see sweep details


### Issue 22: 31 small touch targets on page

- **Severity:** Info · **Category:** UX
- **Page:** `/calendar`
- **Details:** see sweep details


### Issue 23: 6 small touch targets on page

- **Severity:** Info · **Category:** UX
- **Page:** `/review`
- **Details:** see sweep details


### Issue 24: Ordering touch-drag verified

- **Severity:** Info · **Category:** UX
- **Page:** `pbq`
- **Details:** 10/13 touch drags reordered successfully (3 first-attempt flake under emulation).

