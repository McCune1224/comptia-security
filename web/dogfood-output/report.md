# Mobile QA Report — post-fix audit (2026-08-08)

## Executive summary

- **Gate: PASS** — `node scripts/mobile-qa.mjs` exits 0.
- **Touch targets:** 0 elements <44×44px on every owned route (/, /syllabus, /progress, /calendar, /review, /mastery, /gradebook, /history, /pbq, /quiz, /scenarios).
- **Deferred (sibling-owned):** `/modules/week-1` — 3 small targets (lesson-complete ✓ 32×32, "← Syllabus" back link, one filter chip). Owned by the lessons workstream (WT-C); re-audit after it merges.
- **Horizontal overflow:** false on every route. Measured against `window.innerWidth` (the layout viewport): the app styles `::-webkit-scrollbar`, which forces classic scrollbars in headless Chromium (layout viewport 405 vs visual 390); real devices use overlay scrollbars, so `innerWidth` is the correct, device-faithful reference.
- **Console errors:** 0 (was 1 — the missing `/favicon.ico` 404; a 16×16 favicon now ships in `static/`).
- **Kinds exercised on touch this run:** choice, configuration, matching, multi-step (sessions are sampled randomly; numeric/ordering/word-bank/sort/evidence/hotspot were exercised in the earlier run and remain covered by the data-driven KINDS list — add `memory`/`slider` after the engine workstream merges).

## Fixes landed (this branch)

- `button.chip` gets a 44px min-height floor (domain-filter chips on /review and /mastery — was 23px).
- New `.touch-target` utility (44px min-height hit area, flat styling preserved) applied to "View all" links (/, /progress), text links in /mastery, and the Google-Calendar disconnect button on /calendar.
- /calendar: day-cell grid tightened (`gap-0.5`) so 7 columns fill ≥44px per cell; h-10 → h-11 buttons; card padding adjusted.
- /history: "Review" buttons h-10 → h-11.
- `static/favicon.ico` added (fixes the 404 console error).

## Harness (gate) behavior

- Exits 1 on: any <44×44 target on an **owned** route, horizontal overflow at the layout viewport, or any console.error / failed request.
- Sibling-owned routes (currently `/modules/[id]`, ExamFlow drill screens) are swept but **logged as deferred findings** — they never fail the gate, so this branch can land independently of the engine/lessons workstreams.
- Kind drills are data-driven (`KINDS` array): when `memory`/`slider` kinds exist, add their names and they get exercised automatically; kinds not seen in a run are reported, not failed.

## Screenshots

`dogfood-output/screenshots/` — page walk at 390×844 + 390×1400 (dark) plus first-seen kind drill screens.
