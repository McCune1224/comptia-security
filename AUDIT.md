# Full System Audit — 2026-10-13

Read-only audit of material, PBQs, UI, and architecture. Every finding below was
verified against the file it names (spot-checked directly, not only via review).

**Headline:** the question bank is in genuinely good shape — 797 items, 100%
explanations/hints/source refs, all 28 objectives covered, validator-enforced
uniqueness, zero "all of the above". The decay is concentrated in four places:
the notes vault and Anki decks, a silent PBQ draft-loss bug, screen-reader
silence, and a likely-broken Docker/Railway deploy path.

---

## Status — fixed in the 2026-10-13 pass

Resolved (verified by `npm run verify`: 164 unit, svelte-check 0, build, 17 e2e,
whitespace):

- **P1** partial-draft loss — practice drafts now persist for every kind
  (`draft-state.ts` + `silentSave`), and the server accepts partial drafts on
  `check: false` saves. Graded lock semantics unchanged.
- **Retry-row root cause** (found in review): row existence implied a prior
  scored attempt, so a draft, a flag, or a hint reveal cost the first real
  attempt 40%. Unscored rows now store `retries = -1`; the scored upsert lands
  them on 0. Pinned by a new quiz test.
- **U1** zero `aria-live` — feedback, save acks, and admin/calendar status
  messages announce now.
- **U3, U4, U5, U8, U9** — lazy per-tab fetch (grades always, for the rail),
  palette fetch-once, admin error styling, lesson-toggle rollback, loading
  states on calendar/admin. Plus a skip-to-content link (U10).
- **C1** Docker/Railway — Dockerfile moved to repo root, `.dockerignore` added,
  RAILWAY.md corrected; `docker build .` verified green.
- **C2** review completion is transactional.
- **C5, C6, P7** — 33 one-shot scripts, three dead API routes, `cards.ts` +
  `csv-parse`, orphaned `sync.ts`, `pbq-questions.json` deleted.
- **C9, P8, P9, M12, N2–N6, A1–A4** — README/AGENTS/notes/anki
  corrections: SQLite claims fixed, A+ PBQ counts (28), objectives fence removed
  and the 28-objective table added, domain README filenames corrected, V3
  combined deck regenerated (1,288), V1/V2 archived, Dion README recounted,
  `anki/README.md` added.
- **M5, M7, N4** — validator floors pinned to exact counts (692 total, per
  objective, per domain), the four defective items fixed, `mcqDomainTotals`
  brought to exact.
- **Docs drift** — Coverage-Audit corrections (3×90 + 1×20, date, test count,
  deleted-script runbooks), cost hedged, PBQ guide rewritten against the app.

## Open — deliberately deferred

- **M1, M2** — rewriting the 268-item definition template and tightening its
  distractors. Content authorship with real quality risk right before a
  November exam; needs an authored pass, not a script.
- **N1** — the notes vault itself still needs domain content (1 note for 28
  objectives).
- **M3, M6** — bank domain rebalance toward Domain 4; coverage-manifest
  extension (44% of the bank is referenced).
- **P3, P4, P5** — typed-answer PBQs, firewall rule-table builder, hotspot
  content. Feature work.
- **U2** — oversized files (ExamFlow 1,626L, four routes >550L).
- **C7** — lint gate not added: baseline is red (81 prettier files, 190 eslint
  errors needing hand edits). Run `npx prettier --write .` and triage eslint as
  its own change first.
- **C3, C4** — wall-items aggregation in SQL; overview fetch parallelization.
- **0.1** — exam-lifecycle callout skipped at the owner's request (taking
  SY0-701 in November 2026).

---

## 0. Exam lifecycle (strategic, time-sensitive)

Facts as of today: SY0-801 (V8) launches **on or around 2026-11-17**. English
SY0-701 retires **2027-06-11** (other languages 2027-08-13). The repo never
mentions this — zero hits for retirement/SY0-801 across all markdown.

| # | Sev | Finding | Evidence | Fix |
|---|-----|---------|----------|-----|
| 0.1 | MED | No exam-lifecycle callout anywhere, despite V8 launching in ~5 weeks | grep over `*.md` = 0 hits | Add a dated callout to `README.md` and `notes/01-Index/`: V8 launch, V7 retirement, and which one this course targets |
| 0.2 | LOW | Exam cost stale: `~$404 USD` | `notes/01-Index/Exam Checklist.md:54` | Update to current list price ($439 since 2026-06) |
| 0.3 | LOW | Study timeline expired: anchored to "Today is Aug 5 … EXAM DAY (Aug 31)" | `notes/05-Exam-Prep/Exam-Timeline.md:3-15` | Re-anchor to the current exam date or archive |

## 1. Material

### 1.1 Question bank (source of truth: `web/src/lib/server/data/question-bank.json`)

Counts: 692 MCQ + 105 PBQ (+32 multi-step children). Styles: recall 376,
keyword 159, scenario 109, short-form 48. Objective tags 797/797.

| # | Sev | Finding | Evidence | Fix |
|---|-----|---------|----------|-----|
| M1 | HIGH | **Stem monoculture:** 268/692 MCQs (38.7%) open verbatim `Which security term is defined as: "…"?`. In 260 of them the quoted definition is repeated verbatim inside the explanation, so the explanation adds no reasoning. | grep count = 268 in `question-bank.json` | Cap the template ≤15% of recall items; rewrite the rest as scenarios, term→definition matching, or word-bank |
| M2 | HIGH | **Weak distractors** in the definition family — random-term fillers discardable without subject knowledge: `mcq-5-130` (correct NIST CSF; distractors DAC/Risk/Quantitative risk), `mcq-1-053` (AAA vs Race condition/Legal hold/NIDS), `mcq-1-049` (Confidentiality vs DLP/SaaS/Hashing) | `question-bank.json` | Validator rule: distractors must come from the same objective's term pool |
| M3 | MED | **Domain mix vs exam weights:** Domain 4 (28% of exam) is 21.5% of the bank (−6.5pp); Domain 3 is +5.2pp over. Full exams are correct (quota `11/20/16/25/18` in `quiz.ts:90`), but every objective quiz, drill, and review pull inherits the skew | computed vs `notes/01-Index/SY0-701 Exam Overview.md:7-11` | Rebalance toward D4 or document the skew as intentional |
| M4 | MED | **Answer-position bias in stored data:** correct = option `a` 52.3% overall; among non-definition single-choice items 73.6% (243/330). Currently neutralized — `quiz.ts` Fisher-Yates shuffles every presentation — but the data is only safe because of the shuffle | `quiz.ts:110-134`, distribution computed from bank | Re-sort stored `correctOptionIds` to uniform so safety is by construction |
| M5 | MED | **Validation floors allow silent content loss:** MCQ floor `>= 523` vs actual 692 (24% could vanish and still pass); per-objective floors sum to 332 vs 692 actual. PBQs, by contrast, are locked exactly at 105 | `question-bank.ts:256,201-207,257` | Raise MCQ and per-objective floors to current counts; fix the repeated assertion in `question-bank.test.ts:338` |
| M6 | MED | **Coverage manifest guards only 44% of the bank:** 349 of 797 questions referenced; objective 4.2 has 3 referenced of 14 | `security-objective-coverage.json`, `security-content.test.ts` | Extend `questionIds` to ≥20 referenced per objective and assert it |
| M7 | MED | Four concrete broken items: `mcq-4-033` (order-of-volatility dup of `mcq-4-076`, wrong objective tag 4.5), `mcq-4-041` (leftover stem fragment glued on; verbose keyed option telegraphs itself), `mcq-1-004` (options "Preventive and Detective" vs "Detective and Preventive" — same pair), `mcq-2-009` (multi-select missing "Select TWO", stem asks singular "What attack type") | `question-bank.json` | Fix the four items; add a validator rule for unordered-pair duplicates |

**Clean (verified, do not re-report):** 0 exact duplicate prompts, 0 duplicate
ids, 0 "all of the above", 0 missing explanations/hints/source refs/option
rationales, all 28 objectives have MCQ *and* PBQ coverage (min PBQ = 2 per
objective), answer leakage guarded (`leaksAnswer`, fail-closed summary,
public-payload redaction asserted in `question-bank.test.ts:350-354`).

### 1.2 Notes vault (`notes/`) — the weakest surface

| # | Sev | Finding | Evidence | Fix |
|---|-----|---------|----------|-----|
| N1 | HIGH | **Vault is ~96% empty:** Domains 2–5 are README-only stubs. The only content note is `Domain-01/1.1 - Security Controls.md` and it is an unfilled template (`# Untitled`, empty Definitions table). 1 of 28 objectives has a file, 0 have content. | `find notes/02-Domains -type f` = 6 files | Write the notes or stop presenting `notes/` as a study surface; delete the `# Untitled` template |
| N2 | HIGH | **`notes/01-Index/Objectives.md` renders as a code block** — the whole body sits inside a ` ```markdown ` fence (L6–L275), so checkboxes and `[[links]]` are inert. It contains **zero** of the 28 objective IDs despite every index note linking `[[Objectives]]` | `Objectives.md:6,275` | Remove the fence; add the real 28-objective table or rename to `Cram Plan.md` |
| N3 | MED | Domain README example filenames contradict official numbering in 4 of 5 folders (e.g. `Domain-04/README.md` suggests `4.3 - Incident Response.md`; IR is 4.8; `Domain-01` swaps 1.1/1.2 titles) | each `notes/02-Domains/*/README.md` | Regenerate examples from `security-objective-coverage.json` |
| N4 | LOW | Stub notes: `QuizApp-Weak-Topics.md` (26 bytes), `QuizApp-Dashboard.md` (29 bytes); `START-HERE.md:14` documents a `99-Archive/` folder that does not exist | files | Delete or populate; drop the dead line |
| N5 | LOW | `SY0-701 Exam Overview.md` typos: "Sys-701", "Migrations" (→ Mitigations); "Exam Procedure" section ends mid-thought with no passing score | L3, L8, L13-16 | Fix and complete |
| N6 | MED | Coverage Audit self-inconsistencies: L25 claims "4 × 90-question exams" (code: 3 × 90 + 1 × 20 checkpoint); L6 says "Audited: 2026-09-29" but git shows the file was created 2026-10-12 | `notes/05-Exam-Prep/SY0-701-Coverage-Audit.md` | Correct both |

### 1.3 Anki decks (`anki/`)

| # | Sev | Finding | Evidence | Fix |
|---|-----|---------|----------|-----|
| A1 | HIGH | **`V3/_All_V3_Cards_Combined.csv` is out of sync with its own parts:** 10 parts = 1,288 cards, combined = 1,223; 134 cards exist only in parts, 69 only in the combined file. Importing the combined deck gets stale content | diff parts vs combined | Regenerate from parts or delete the combined file |
| A2 | MED | **V1 + V2 = 1,015 dead cards**, untouched since 2026-06, superseded, referenced by nothing | `anki/AI Security+/V1`, `/V2` | Delete or move to `anki/_archive/` |
| A3 | MED | **Dion README is wrong twice:** L4 says it "Replaces the older V1/V2/V3 decks" (V3 was updated the same day as Dion); L10-17 card counts are +45% off (claims 671, actual 970; Domain5 claims 20, actual 79) | `anki/Dion Security+ SY0-701/README.md` | Fix the claim and the count table |
| A4 | MED | **V3 ∩ Dion = 398 identical card fronts (41% of Dion)** — importing both duplicates ~400 cards | front-diff across decks | Pick one owner deck per topic; document it in a new `anki/README.md` |
| A5 | LOW | Ports/acronyms/formulas triplicated across vault note, lesson widget, and 4 decks (e.g. 28 of the vault's 34 acronyms appear verbatim in Dion) | `notes/03-Flashcards/`, deck CSVs | One owner per topic, cross-link instead of restating |

## 2. PBQ system

Implemented kinds: matching (24 q), word-bank (20), configuration (18),
multi-step (11), evidence (9), ordering (8), multiple-choice (4), sort (4),
slider (3), hotspot (2), single-choice (2), memory (**0**). Renderers:
`ExamFlow.svelte` (one file, 1,626 lines) + `MatchConnect`, `SortBoard`,
`Hotspot`, `MemoryBoard`.

| # | Sev | Finding | Evidence | Fix |
|---|-----|---------|----------|-----|
| P1 | HIGH | **Partial drafts silently discarded:** `silentSave()` gates on full completeness for word-bank, matching, sort, memory, and choice (`answered` check at L399-408). Navigating away with a half-filled word-bank or matching question returns at L408 and the work is lost on refresh. Ordering/configuration/evidence/slider partial drafts do save. The function's own docstring says "answers are never lost". | `ExamFlow.svelte:386-430` | Save partial drafts for every kind, same as ordering already does |
| P2 | MED | **`memory` kind fully built but unreachable:** component + scoring + tests exist, zero questions in all three banks | bank grep: 0 hits | Author ≥4 memory PBQs or delete `MemoryBoard.svelte` |
| P3 | MED | **No typed-answer PBQ at all:** `fill-blank` banned by validator, `numeric` deprecated → zero CLI/config-completion items, a common real-exam format | `question-bank.ts:315-316` | Reinstate a constrained typed kind (word-bank-style picker or validated text) for command/config completion |
| P4 | MED | **No firewall/ACL rule-table builder:** configuration is static `<select>` dropdowns only. The canonical "build the rule set" interaction (add/remove/reorder rows) does not exist | `ExamFlow.svelte:1017-1030` | One rule-builder field type: rows of src/dst/port/action |
| P5 | MED | **Hotspot underused:** 2 questions; 3 of 4 SVG templates (`osi-stack`, `packet-frame`, `log-lines`) have zero questions — both hotspot items use `topology-basic` | `hotspot-templates.ts` | Author hotspot PBQs against the unused templates |
| P6 | MED | **Test gaps:** no scoring test mentions `evidence` (grep 0); no top-level multi-step scoring case in `scoring.test.ts`; e2e covers ordering only — no word-bank/hotspot/match/sort/config e2e, no PBQ test at mobile viewport | `scoring.test.ts`, `e2e/` | One scoring case per kind + a word-bank persistence e2e |
| P7 | LOW | Dead files: `server/pbq-questions.json` (30 legacy Qs incl. banned `numeric`) imported by nothing, plus its generator | `web/scripts/generate-pbq-questions.py` | Delete both |
| P8 | LOW | `notes/05-Exam-Prep/PBQs/PBQ-Practice-Guide.md` tells the user to practice PBQs on external sites and never references the app's own 105-PBQ bank or `/pbq` | file | Rewrite against the 11 implemented kinds |
| P9 | LOW | `AGENTS.md` says A+ banks have 20 PBQs; actual `pbqTotal: 28` | `bank-aplus-1201.ts:14` | Correct the doc |

**Clean:** drag works on touch (`forceFallback` + drag handles), ordering has
arrow-key reordering, all widgets are native buttons ≥44px, mobile matching
falls back to inline text, scoring is partial-credit where the real exam would
be, full exams assemble 5 distinct-kind PBQs (one per domain).

## 3. UI / UX

| # | Sev | Finding | Evidence | Fix |
|---|-----|---------|----------|-----|
| U1 | HIGH | **Zero `aria-live`/`role="status"`/`role="alert"` in the entire codebase.** Quiz correct/incorrect feedback (`ExamFlow.svelte:1521-1541`), the "Answer saved" ack, "Saving…" state, and admin/calendar save messages are all invisible to screen readers | grep over `src/` = 0 hits | `aria-live="polite"` on the feedback panel and every save-message element |
| U2 | MED | **Oversized files:** `ExamFlow.svelte` 1,626 lines (result screen + 10 PBQ kinds + flags + timer + hints + retries), `/history/[sessionId]` 738, `/calendar` 708, `/progress` 663, `/admin` 573 | `wc -l` | Extract `ExamResult`, per-kind `QuestionRenderer`; split the four routes by section |
| U3 | MED | **`/progress` fires all three APIs on mount** (`/api/gradebook`, `/api/mastery`, `/api/history`) regardless of requested tab | `progress/+page.svelte:94-104` | Fetch per active tab |
| U4 | MED | **CommandPalette refetches `/api/course/overview` on every open** | `CommandPalette.svelte:50-55` | Cache after first load |
| U5 | MED | **Admin error messages styled as success** — "Could not save the override." and reset failures render `text-accent` (green); the backup block does it correctly with `text-success`/`text-danger` | `admin/+page.svelte:284,413` vs `:359` | Branch on success/error like the backup block |
| U6 | MED | **`kindLabel()` copy-pasted in 7 files**; `pctClass`/`domainBarClass` re-implement `getPercentColor`/`getBarColor` | routes listed in review | Export from `utils.ts` |
| U7 | MED | **CommandPalette has no focus trap** (Tab walks out) and no focus restore on close | `CommandPalette.svelte:95-158` | Trap Tab; return focus to trigger |
| U8 | MED | **Optimistic lesson toggle never checks the response or rolls back** on failure | `modules/[id]/+page.svelte:53-65` | Revert on non-ok |
| U9 | MED | `/calendar` and `/admin` have **no loading states**; `/practice` degrades silently with no error path | routes | Add spinners/error strings matching the other pages |
| U10 | LOW | AppRail expands on `mouseenter` only — keyboard focus never reveals labels; question-grid buttons named by `title` only (no `aria-label`, no `aria-current`); no skip-to-content link; abandon uses native `confirm()`; `.glass` legacy class still ships | component files | Small a11y pass |

**Clean (verified):** no hardcoded hex outside data-driven swatches, no
gradients, no dead components (all 23 imported), 44px floor systemic
(`.btn` min-height, chip override, PBQ widgets), tables become stacked cards
below `md:`, contrast e2e-enforced at 4.5:1 in both themes
(`e2e/theme-mobile.spec.ts`), empty states good.

## 4. Architecture / engineering health

| # | Sev | Finding | Evidence | Fix |
|---|-----|---------|----------|-----|
| C1 | HIGH | **Docker/Railway deploy path is inconsistent as committed.** `web/Dockerfile` COPYs `web/...`, so build context must be repo root (`docker build -f web/Dockerfile .`), but it lives in `web/`; `railway.toml` sits at repo root with `builder = "DOCKERFILE"` and no `dockerfilePath`; `web/RAILWAY.md:117` depicts the Dockerfile at root — it is not there. One of the three documented deploy paths is broken | `web/Dockerfile:7,13`, root `railway.toml`, `RAILWAY.md:117` | Move the Dockerfile to repo root (matching its COPY paths and the RAILWAY.md diagram) or set an explicit dockerfilePath |
| C2 | MED | **`recordCompletion` runs without a transaction:** `study_log` upsert + per-answer `review_cards` upserts; mid-loop failure leaves the study day advanced with cards stale | `review.ts:225-238` | Wrap in `sql.begin` (pattern already exists in `db-pg.ts`) |
| C3 | MED | **`wallItems()` loads the entire answer history into memory** on every `/api/review` summary; grows unbounded per profile | `review.ts:138-170`, `db-pg.ts:369-376` | Aggregate wrong counts in SQL (`GROUP BY question_id`) |
| C4 | MED | **`getOverview()` is ~10 sequential awaits, and `getSyllabus`/`getModule`/`getAssignment` each recompute the entire overview** — opening one assignment computes readiness + gradebook + all modules | `course-service.ts:139-225` | `Promise.all`; narrow single-item queries |
| C5 | MED | **~30 orphaned one-shot scripts** (`fix-bank-defects*.py`, `expand-d1..d5.py`, `generate-domain4-questions.py` 81KB, `replace-domain2.py` 75KB, …) — none referenced by package.json/Makefile/configs; `web/scripts` has 51 entries | file listing | Move to `scripts/attic/` or delete; git history keeps them |
| C6 | MED | **Dead legacy routes:** no frontend fetches `/api/progress`, `/api/cards`, or `/api/sync` (verified 0 consumer matches). `cards.ts` + the `csv-parse` runtime dep exist solely for `/api/cards`, which reads CSVs outside `web/` | grep over `src/` | Delete the three routes, `cards.ts`, and `csv-parse` |
| C7 | MED | **`verify.mjs` never runs lint** although `npm run lint` (prettier + eslint) exists — and the repo has no CI | `scripts/verify.mjs`, `package.json:13` | Add lint to the verify pipeline |
| C8 | MED | **`ExamFlow.svelte` (1,626 lines) has zero unit tests**; hotspot region-hit logic and the word-bank renderer untested at unit level | `src/**/*.test.ts` | Component tests for scoring-adjacent UI state |
| C9 | LOW | Stale docs: `README.md:8` "runs locally with SQLite" (Postgres-only since 2026-10-12); `AGENTS.md:43` same claim; `AGENTS.md` Phase 2 list ships two items (explanations, spaced repetition); `google-calendar.ts:17` "token lives in SQLite"; Coverage Audit "136 tests" count | lines cited | One doc-correction pass |
| C10 | LOW | Duplication/deps: byte-identical `formatDate` in `utils.ts:37` and `course.ts:951`; `// ponytail:` stray token `utils.ts:1`; `playwright-core` alongside `@playwright/test`; `better-sqlite3` native compile on every `ci` for the legacy migration only | cited | Housekeeping pass |

**Clean (verified):** all SQL parameterized (3 `.unsafe()` calls are static DDL
or test-only), 10 `sql.begin` transaction sites around multi-table writes, zero
TODO/FIXME markers, `build/ coverage/ test-results/` correctly untracked,
`npm run check` green (0 errors, 0 warnings), lean runtime deps (5).

---

## Suggested order of work

1. **P1 — partial draft loss** (real user-facing data loss in the core loop).
2. **C1 — Docker/Railway path** (one of three deploy stories is broken).
3. **U1 — aria-live pass** (whole feedback channel invisible to screen readers).
4. **0.1 + C9 — freshness pass** (exam lifecycle callout, SQLite/README/AGENTS corrections).
5. **M1 + M2 — bank quality**: break the 268-item definition template, tighten distractors.
6. **A1–A4 — Anki consolidation**: regenerate or drop the combined V3 file, archive V1/V2, fix the Dion README, pick one owner deck.
7. **N1/N2 — decide the vault's fate**: write domain notes or stop advertising them.
8. **M5/M6 — validator tightening**: raise MCQ floors, extend the coverage manifest.
9. **P3/P4/P5 — PBQ format gaps**: typed answers, rule-table builder, hotspot content.
10. **C5/C6 — deletion sweep**: orphaned scripts, dead routes, `csv-parse`.
