# SY0-701 bank review — artefacts and how to regenerate them

Everything in this directory was produced by the 2026-11 audit of the Security+ question bank.
The narrative findings and the per-item verdicts are in **`/SY0-701-BANK-REVIEW.md`** at the repo
root; this file only explains the machine artefacts so a future pass can re-derive them instead of
trusting stale numbers.

Inputs these scripts expect (already extracted to `/tmp/sy0701/` during the audit):

| File | What it is |
| --- | --- |
| `dion-study-notes.txt` | `pdftotext -layout` of `notes/04-Resources/CompTIA-Security-Plus-SY0-701-Study-Guide.pdf` — **this is the Dion Training study notes**, 405 pages, 226 `●` sections. The filename says CompTIA but the footer on every page is DionTraining.com and the md5 matches the current Dion download. |
| `objectives.txt` | `pdftotext -layout` of `…-Exam-Objectives.pdf` — official CompTIA SY0-701 objectives v5.0, 28 objectives. |
| `authored-items-for-review.json` | Snapshot of the 108 items authored during the audit, in the shape handed to the reviewer subagent. |

Regenerate the PDF text with:

```bash
cd notes/04-Resources
pdftotext -layout CompTIA-Security-Plus-SY0-701-Study-Guide.pdf /tmp/sy0701/dion-study-notes.txt
pdftotext -layout CompTIA-Security-Plus-SY0-701-Exam-Objectives.pdf /tmp/sy0701/objectives.txt
```

## Scripts

### `coverage.py`
Maps every bank item to the Dion section that actually teaches it, using TF-IDF cosine similarity
between the item text and each of the 226 section bodies.

```bash
python3 web/review-2026-11/coverage.py
```

Writes `/tmp/sy0701/item-section-map.json` and prints the per-section coverage matrix plus the
sections with no attributed item. **Note:** the matcher is reliable in bulk but fails on items whose
distinguishing token is a long literal (a `tcpdump` command, a list of blanks) or whose topic sits
under an unexpected heading. Roughly 15 of 812 were hand-corrected; expect to hand-correct a similar
number if you re-run it after large edits.

### `tagcheck.py`
Scores every item against the 28 official objective bullet-blocks and reports items whose tag is
disagreeing with the bullet text.

```bash
python3 web/review-2026-11/tagcheck.py
```

Writes `/tmp/sy0701/objective-fit.json`. **Read the output critically** — many "disagreements" are
near-neighbours (2.3↔2.4) and the matcher is wrong often enough that only ~20 of 95 were applied.
Verify each candidate against the objectives text before retagging.

## Data

### `dion-sections.txt`
The 226 top-level `●` headings with their line numbers in `dion-study-notes.txt`. This is the
authority behind `web/src/lib/server/data/dion-sections.json`, which the validator now requires every
`study-guide` sourceRef to name. If the study guide is ever replaced, regenerate both.

### `item-verdicts.csv` / `.json`
One row per item with its verdict (`KEEP` / `REVISE` / `REWRITE` / `REMOVE`) and the reason that
drove it. Priority is P0 correctness, then P1 realism, then P2 hygiene — an item gets the first
reason that matched, so the counts are a triage view, not a defect inventory.

### `final-lists.json`
Every ID list quoted in the report: answer-leaking stems, select-count defects, fabricated citations,
tag disagreements, near-duplicate pairs, farmable PBQs, and so on. Regenerate after any pass that
changes item IDs.

### `item-section-map.json`, `objective-fit.json`
Raw output of the two scripts above, kept so the report's numbers can be checked without re-running
Python.

## The standard a new item must meet

The validator enforces this mechanically (`src/lib/server/bank-quality.ts`, run from
`validateQuestionBank`). In prose:

1. **The stem is the item.** The scenario goes in `prompt`; `context` is reserved for PBQs. A stem
   must be ≥120 characters and must not be a bare tag question ("Which control is this?").
2. **Exam phrasing.** Scenario first, then a decision question. Options are short noun phrases, four
   of them for a single-answer item. No option carries its own rationale or evaluates itself.
3. **No answer leakage.** No keyed option's text may appear in the stem (word-boundary matched,
   3-character floor, so `rat` catches a leak but `rate` does not).
4. **Select count.** A multi-select must state how many options to pick, and `selectCount` must match
   both the statement and the number of keyed options.
5. **Distractors must be wrong but plausible.** Same-objective term pool; no jesters ("give each
   analyst a second monitor"). This one is **not** gate-enforceable — it is the failure an independent
   reviewer catches and the gates do not.
6. **Provenance.** Every `study-guide` sourceRef must name one of the 226 headings in
   `data/dion-sections.json`. If the concept is not in the Dion guide, cite nothing and use
   `exam-objectives` plus a vendor or standards reference instead of inventing a section.
7. **PBQ answer positions.** A configuration PBQ must not key the same option index in every field, and
   a matching/sort PBQ must not present an identity or uniform-rotation mapping. Rotating an identity
   mapping is still learnable ("shift by one"), so the shuffle is seeded and non-uniform.
8. **Evidence artifacts are raw.** A log line must not label its own finding
   (`GET /a?id=1 OR 1=1 -- SQL injection probe` is not a log line).

Run `npm test` in `web/` after authoring. The bank ledger (`web/question-bank-ledger.{json,md}`) must
cover every item exactly once — `question-bank-ledger.test.ts` fails if it does not, and the pinned
counts in `SECP701_BANK_SPEC` fail if an item vanishes.
