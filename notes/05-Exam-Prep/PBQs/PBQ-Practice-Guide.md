# PBQ (Performance-Based Questions) Practice

## Practice in the app

- Open `/pbq` for free PBQ practice. Start from the practice hub at `/practice` for every drill.
- The Security+ bank ships **120 PBQs**. Kinds and counts:
  - `matching` (24), `word-bank` (20), `configuration` (18), `multi-step` (11), `evidence` (9),
    `ordering` (8), `rule-table` (5), `cli` (5), `sort` (4), `multiple-choice` (4), `slider` (3),
    `hotspot` (3), `memory` (3), `single-choice` (3)
- Two new mechanics cover the real-exam shapes that were missing:
  - **Firewall / ACL rule-table builder** — fill source, destination, port, action for every row,
    then order the rules; scored with partial credit for cells and order.
  - **Constrained terminal / config completion** — type commands or directives from a bounded
    vocabulary (no arbitrary shell); each task scores independently.
- `memory` is now activated with three paired-recall items. It was implemented in the engine but
  previously had no bank content.
- The daily review queue at `/review` resurfaces the PBQs you get wrong.

## Drill modes

- **Low-drain quick round** (`/quick`): 4–15 questions, no timer, PBQs spread through the round
  rather than stacked at the front. Progress persists like any other session.
- **Chunked exam** (`/quiz?start=1&type=full&mode=exam&sections=3` or the Practice card): the
  90-question exam split into three sections with a start screen between sections. The exam
  clock keeps running; answers and the current section survive a reload.

## Exam strategy

- PBQs come first on the real exam. Expect roughly 2–5, with reports from 2 up to 3 in a 75–77
  question sitting.
- They take longer than multiple choice. Budget your time before you start.
- Do a first pass, flag anything slow, and finish the MCQs before returning.
- Do not over-invest. PBQs carry roughly a quarter of the score. Speed on the MCQs decides the pass.
- Read each prompt fully. Check your configuration before you submit.
- Partial credit is common: fill every sub-part, even when unsure.

## Sources

The full sourced type matrix — every interaction format, task scenario, evidence tier, source URL,
access date, and the item ids that cover it — is in `PBQ-TYPE-MATRIX.md`.
