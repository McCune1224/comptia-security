# SY0-701 Question Bank — Review & Findings Report

**Date:** 2026-11-15, updated 2026-11-17 · **Bank:** `web/src/lib/server/data/question-bank.json` · **905 items** (801 MCQ + 104 PBQ)
**Status:** review complete; **Phases 1-7 applied and verified** (see §0). All seven phases plus the three follow-up residuals are closed (§0.5).

---

## 0. What was actually shipped (2026-11-16/17)

All seven phases were applied, plus the three follow-up residuals. Bank: **692 MCQ + 120 PBQ → 801 MCQ + 104 PBQ = 905 items.**

### 0.1 Phase 1 — correctness (surgical, 25 items)
- **10 stems printed their own answer** (`"Which malware type is this when the subject is worm?"` → key `Worm`). Rewritten to describe the distinguishing behaviour.
- **11 select-count defects** — 2 stems demanded two answers on a single-choice item (rebuilt as genuine multi-selects), 9 multi-selects gained `(Select TWO.)`.
- **4 wrong or degenerate keys.** `mcq-2-035` had CVSS Remediation Level backwards (Official Fix `0.95` weights *lower* than Temporary Fix `0.96`, per the FIRST spec) and also claimed `E:High` reduces a score when it is weighted `1.00`. `mcq-1-019` claimed P-384 ≈ RSA-2048; it is ~192- vs ~112-bit. `mcq-3-011` keyed an option its own rationale called wrong. `mcq-1-004` keyed the degenerate pair `"Corrective and Corrective"`.
- **New gates:** keyed answer must not appear in the stem (word-boundary, 3-char floor, so `rat` catches the leak and `rate` does not); `selectCount` must match the stated count; no degenerate `X and X` option.

### 0.2 Phase 2 — the PBQ bank could be farmed
- 13 of 18 configuration PBQs keyed **every** field to option #1; 24 of 28 matching PBQs used identity mapping. Both now measure as noise: config answer positions are **26/26/24/24%** across #1-#4, and **0** PBQs have an identity or uniform-rotation mapping.
- Rotating by a constant was not enough — a rotated identity is still "shift by one" — so matching/sort presentation order is a seeded non-uniform shuffle.
- 4 evidence artifacts had their findings **labelled in the log line** (`GET /a?id=1 OR 1=1 -- SQL injection probe`). Now raw.
- **New gates:** config answers must occupy ≥2 positions; matching must not be identity or a uniform shift; evidence lines must not carry interpretive labels.

### 0.3 Phase 3 — provenance rebuilt
- **39 of 812** items previously cited a real Dion section; 378 cited invented sections (`"Chapter 3: Symmetric Encryption and AES Key Sizes."`) and 395 cited none.
- All citations now resolve against the **226 real headings** (`web/src/lib/server/data/dion-sections.json`). **806 of 811** items cite one; **184 of 226** sections are cited.
- **5 items deliberately carry no Dion citation** because the concept is not in the guide: `mcq-2-129` (AI training-data poisoning), `pbq-4-908` (Windows event IDs), and `mcq-3-180/181/182` (full/incremental/differential backups — Dion covers onsite/offsite only, not backup types). Citing a section for these would recreate the fabrication this phase removed.
- **New gate:** every `study-guide` section must exist in the index. Whole-domain placeholders and invented chapters now fail validation.

### 0.4 Phases 4-7 — exam realism, tags, inventory, coverage
| Phase | Outcome |
|---|---|
| **4 — stems** | Scenario merged into the stem for all 651 MCQs; `context` emptied for MCQs. Median stem **60 → 324 chars**. **706/707** stems now open with the scenario instead of a Wh-word. Tag questions (`"Which control is this?"`) — **8 remaining, all rewritten**. |
| **5 — tags** | 17 objective tags corrected where content matched the *official objective bullet text* rather than a neighbour (e.g. RTO/RPO/MTTR/MTBF → 5.2, per the objectives doc, not 3.4; OCSP/CRL/TPM/HSM → 1.4, not 3.3). |
| **6 — inventory** | 10 mislabelled "PBQs" repatriated into the MCQ bank (7 plain multiple-choice, 3 sliders), 7 duplicates merged, 3 memory-matching games deleted, 4 dead `domain*-questions.json` files (156 orphan items) deleted. No PBQ in the bank is now a quiz question, a slider, or a game. |
| **7 — coverage** | Authored 8 items for the 8 Dion topics that had **no** item at all — shellcode, stage-2 downloader, actions-on-objectives, surveillance bypass, vendor selection & monitoring, technical implications of changes, selecting infrastructure controls, single pane of glass. All 8 now cited. |

### 0.5 Final state — the three residuals are closed

| Item | Was | Now |
|---|---|---|
| **Uncited Dion sections** | 42 uncited (8 topics had *no* item at all) | **224 / 226 cited**. The two that remain — `Introduction` and `Conclusion` — are structural headers with no topic content. The 8 genuinely-missing topics were authored (shellcode, stage-2 downloader, actions-on-objectives, surveillance bypass, vendor selection & monitoring, technical implications of changes, selecting infrastructure controls, single pane of glass), and 25 items whose stems were specifically about an uncited topic were re-cited to it. |
| **Domain 4 weighting** | 22.3% vs 28% (−5.7pp) | **27.3%** (−0.7pp). 63 Domain 4 items authored across all nine objectives. Domain 5 was then the worst residual, so 19 Domain 5 items were added as well. |
| **Emphasis words** | 220 / 707 (31%) | **319 / 806 (40%)**, and every one of the 13 items where `BEST` is grammatical received it. The remaining 60% are factual identification stems (`"Which protocol provides this graphical console access on TCP port 3389?"`) where CompTIA itself omits an emphasis word — its own ten published Security+ items use one only 3 times. Adding `MOST`/`BEST` to those would be cosmetic, and an earlier attempt to do it mechanically corrupted 30 stems before being reverted. |

### 0.5a Domain weighting, final

| Domain | Exam weight | Bank share | Delta |
|---|---|---|---|
| 1 General Security Concepts | 12% | 14.0% | +2.0 |
| 2 Threats, Vulnerabilities, Mitigations | 22% | 21.2% | −0.8 |
| 3 Security Architecture | 18% | 19.5% | +1.5 |
| 4 Security Operations | 28% | 27.3% | −0.7 |
| 5 Security Program Mgmt | 20% | 18.1% | −1.9 |

Every domain is now within ±2pp of the blueprint, versus −6.0/+5.2 at the start of this pass.

### 0.5b Independent SME review (and what it caught)

Because the 108 authored items had no human review, they were sent to a **fresh-context reviewer subagent** with no memory of the authoring work, briefed to treat keyed answers and explanations as guilty until proven correct — the explanations were written by the same generator, so they are not independent evidence.

**First round — 108 items:**

| Category | Count |
|---|---|
| Wrong key | **0** |
| Distractor also correct | 4 |
| Mis-tagged objective | 10 |
| Citation does not support item | 5 |
| Factual imprecision | 2 (reported as 3) |
| Phrasing / realism | 16 |
| No issue found | 71 |

It also found a systemic problem I had missed: roughly 20 distractors were **jesters** — "Give each analyst a second monitor", "Increase the browser's cache size", "The penetration tester's resume". Those items can be answered by a candidate with zero Security+ knowledge who simply picks the most conscientious-sounding option, so they measure diligence, not knowledge. That is a real defect, and it cost more than any individual wrong key would have.

**Applied from round 1:** all 10 mis-tags, 4 of 5 citations, both factual imprecisions (including a genuine error — the GPO item said an OU-linked policy must be "set to override inheritance", but LSDOU precedence already makes the OU link win; "Enforced" behaves the opposite way), all 4 also-correct distractors, 16 phrasing repairs, 21 jester distractors reworked to be plausible-but-wrong, 5 duplicate constructs retired, and the circular `"<option>" does not satisfy the stated requirement` boilerplate stripped from 20 explanations.

**Two findings I rejected, with reasons:**
- *"Domain weighting is badly skewed (D4 63%, D3 2.8%)"* — measured on the authored subset only. The bank as a whole is 14.4 / 21.3 / 19.8 / 26.3 / 18.2, all within ±2.4pp of the blueprint. The batch being D4-heavy was the point.
- *"pbq-1-016 is unshippable, options empty"* — an artifact of my export, which carried only `options`/`key` and dropped `premises`/`targets`/`correctMatches`. The item in the bank has 5/5/5 and renders correctly.

**One finding accepted but not actioned:** the cited section title `Security Content Automation and Protocol (SCAP)` is a typo in the Dion source (the objective says "Security Content Automation Protocol"). The citation must match the Dion index to pass the provenance gate, so the typo is inherited rather than introduced. Fix the source material, not the bank.

**Second round — 46 changed items, adversarial verification.** The reviewer was briefed that the person applying the fixes may have misread the report. It confirmed **16 of 18 claims** and found **2 P1 regressions that I introduced**:

- **`mcq-4-179`** — my distractor (c) fix also replaced (d), and the new (d) ("revoking a session token for a confirmed stolen device") was a *subset* of the keyed answer, so it satisfied the stem's own test. Restored to the original "automating all four" option with an explicit rebuttal.
- **20 explanations** — stripping the circular boilerplate left a sentence that repeated the rebuttal already present, so "Why the others fail" named the same distractor twice (three times in three items). Fixed by rebuilding those explanations from the pre-fix snapshot with exactly one rebuttal per distractor.

It also returned 7 P2 residuals, all applied: `mcq-4-191` citation → "Encryption Tools" (the TPM material is there, not under Trusted Operating Systems); `mcq-4-218` → "Digital Forensic Procedures" (legal hold lives there); `mcq-4-209` rewritten because the **"two-person rule" appears nowhere in the SY0-701 objectives** — replaced with an access control vestibule, which is in scope; `mcq-4-162` grammar (the *key* was the coordinated subject, so the sentence said the key could not be removed, not the drive); `mcq-2-176` residual pretext cue; `mcq-3-158` rebuttal now names the hardware-budget constraint; `mcq-4-168` residual concession.

Verified afterwards: **zero duplicated rebuttals, zero boilerplate**, 265 unit tests, 27 e2e, type check, build, whitespace all clean.

### 0.5c Merge verdict

**Ship it (after round 2).** 60 of 68 Domain 4 items were correct and objective-appropriate on first read; the failures were distribution and difficulty, not wrong answers. After the round-1 repairs the bank is 905 items with every domain within ±2.4pp, 224/226 Dion sections cited, and zero boilerplate explanations.

---

## 1. Bottom line

The bank's **structural engineering is strong** — validation gates pass, all 28 objectives are populated, every item has a context, a hint, an explanation, and option rationales, and there are no `all of the above` items. A previous pass (`web/question-bank-ledger.md`, 2026-11-14) fixed 659 items and the gates hold.

Three problems sit **outside** what the current validator checks, and they are the reason this review exists:

| # | Problem | Scale | Effect |
|---|---|---|---|
| **A** | **Provenance is fabricated.** Only **39 of 812** items (4.8%) cite a study-guide section that actually exists. 378 cite sections that don't exist; 395 cite none at all. | 96% of the bank | The "Dion coverage" claim in `AUDIT.md` is unsupportable today. You cannot tell what Dion taught vs what was invented. |
| **B** | **The questions don't read like SY0-701 questions.** The scenario lives in a separate `context` field; the stem is a short tag-question. 71% of MCQs are bare interrogatives. Median stem = **60 chars** vs CompTIA's published **149**. | 489 / 692 MCQs | Practising this bank does not rehearse the reading/parsing skill the exam tests. |
| **C** | **PBQs are farmable with zero knowledge.** 13 of 18 config PBQs key *every* field to option #1; 24 of 28 matching PBQs use identity mapping. | 37 / 120 PBQs | Score-and-mastery numbers from PBQs are meaningless. |

Plus **10 MCQs that print their own answer in the stem** and **11 broken select-count instructions**. Those two are day-one fixes.

---

## 2. What was reviewed, and against what

### Sources (all local, all verified)

| Source | File | Notes |
|---|---|---|
| **Dion Security+ (SY0-701) Study Notes** | `notes/04-Resources/CompTIA-Security-Plus-SY0-701-Study-Guide.pdf` | **405 pages, 226 top-level sections.** Verified Dion-authored (footer `https://www.DionTraining.com`, Google-Docs producer). **Misnamed in the repo as a CompTIA file.** md5 `d4e8c42…` matches the current Dion download byte-for-byte. |
| Dion Study Plan | `…-Study-Plan.pdf` | 11 pages. No exam content — planning only. |
| **CompTIA SY0-701 Exam Objectives v5.0** | `…-Exam-Objectives.pdf` | 28 objectives, 5 domains — the authoritative scope boundary. |
| CompTIA's own published Security+ practice questions | comptia.org (`/certifications/security/practice-questions`) | 10 official items — used as the **phrasing standard**. |
| CVSS v3.1 specification | first.org | Used to verify the CVSS item. |
| NIST SP 800-57 Part 1 | nvlpubs.nist.gov | Used to verify key-strength claims. |

### Method

Deterministic analysis over all 812 items (stem shape, emphasis words, option counts, select-count consistency, option-position bias, answer leakage, near-duplicate detection, context↔prompt vocabulary overlap), then:

- A **TF-IDF content match** of every item against all 226 Dion section bodies → real coverage map and a corrected section for each item.
- A second **TF-IDF match** of every item against the 28 official objective bullet-blocks → tag validation.
- A full read of all 120 PBQs and a large sample of MCQs, with targeted deep reads wherever a metric flagged something.
- Web verification of the two factual claims I judged likely wrong.

---

## 3. The standard: what an SY0-701 item actually looks like

Measured against CompTIA's ten published Security+ V7 items (verbatim from comptia.org):

| Property | CompTIA published | This bank | Verdict |
|---|---|---|---|
| Median stem length | **149 chars** | **60 chars** | 2.5× too short |
| Stem contains the scenario | **5 / 10** (the rest are definition-style, which the bank already covers) | **205 / 692 (30%)** | Gap |
| Opens `Which of the following …` | 5 / 10 | **4 / 692** | Effectively absent |
| Contains an emphasis word (most/best) | 3 / 10 | **140 / 692 (20%)** | Gap |
| Options | 4, short noun phrases, median 10 chars, max 24 | 4 mostly, but **median 17, max 300+**, 3% over 120 chars | Options drift into prose |
| Scenario rendered once | yes | **240 items restate the context inside the stem** | Duplicated scenario |
| Answer count stated | always | **11 items wrong** | Broken |

**The house pattern is:** `[1–3 sentence scenario in the stem]. Which of the following <BEST|MOST likely|FIRST> <verb> <object>?` with four short options.

The bank's pattern is: `context: <scene>. prompt: "Which <noun> is <this|the team using>?"` — the scenario and the question live in different fields, and 71% of stems cannot stand alone.

> Cross-reference: `ExamFlow.svelte:1016-1019` renders `context` **above** `prompt`. For the 240 items below, the learner reads the same scenario twice on screen.

---

## 4. P0 — Correctness and integrity (fix before any further authoring)

### 4.1 Answer printed in the stem — **10 items**

A generator appended a literal `when the subject is <answer>` clause to the stem. The keyed option is the same string.

| ID | Stem as it exists | Key |
|---|---|---|
| `mcq-2-073` | Which malware type is this **when the subject is worm**? | Worm |
| `mcq-2-078` | Which malware type is this **when the subject is rat**? | RAT |
| `mcq-2-107` | Which platform category is the team using **when the subject is soar**? | SOAR |
| `mcq-2-121` | Which platform category is the team using **when the subject is xdr**? | XDR |
| `mcq-3-087` | Which revocation mechanism is the browser using **when the subject is ocsp**? | OCSP |
| `mcq-3-094` | Which cloud service model is the company using **when the subject is saas**? | SaaS |
| `mcq-3-119` | Which protocol is the administrator using **when the subject is rdp**? | RDP |
| `mcq-3-134` | Which tool category is the team using **when the subject is cspm**? | CSPM |
| `mcq-3-184` | Which recovery target is the planner setting **when the subject is rpo**? | RPO |
| `mcq-5-067` | Which risk metric is the analyst calculating **when the subject is ale**? | ALE |

Each is one of a family (e.g. `mcq-3-086` CRL / `mcq-3-087` OCSP). The family is fine; the `when the subject is` variant is not.

**Fix:** strip the clause and give the variant a real distinguishing stem. **Also add a validator rule** — `leaksAnswer` currently misses this because the key token is a substring of the *stem*, not the options.

### 4.2 Select-count instructions that contradict the key — **11 items**

**Stem says "Select TWO", item is single-choice with one key — the UI draws radio buttons:**

| ID | Why it's broken |
|---|---|
| `mcq-1-005` | `"Which TWO control types are being used? (Select TWO.)"` — `kind=single-choice`, `selectCount=1`, 1 key. Both classifications are bundled into option (a). |
| `mcq-2-004` | `"Which TWO threat actor types…? (Select TWO.)"` — same shape; both answers bundled into option (a). |

**Multi-select that never tells the learner how many to pick (the real exam always does):**

`mcq-2-047`, `mcq-2-054`, `mcq-2-066`, `mcq-3-039`, `mcq-3-042`, `mcq-3-054`, `mcq-4-058`, `mcq-4-077`, `mcq-1-041`

**Fix:** convert the two to genuine multi-select (split the bundles into separate options) or drop `(Select TWO.)` from the stem. Add `(Select TWO.)` to the nine. Then gate: `selectCount > 1 ⟺ stem states the count`.

### 4.3 Keys that are wrong or indefensible — **4 items**

| ID | Problem | Evidence |
|---|---|---|
| `mcq-2-035` | Keyed answer says changing Remediation Level **from Official Fix to Temporary Fix** lowers the score. It **raises** it: RL weights are Official Fix `0.95`, Temporary Fix `0.96`, Workaround `0.97`, Unavailable `1.00`. The item also asks about the "environmental" score while answering with a Temporal metric, and asserts a "one point" reduction — fabricated precision. | [CVSS v3.1 spec, Table 10](https://www.first.org/cvss/v3.1/specification-document) |
| `mcq-1-019` | Keyed statement: ECC P-384 gives "equivalent security strength" to RSA-2048. P-384 ≈ **192-bit**, RSA-2048 ≈ **112-bit**. They are not equivalent; RSA-7680 is the 192-bit match. The bank's own `pbq-1-006` explanation says RSA-2048 ≈ 112 bits — the bank contradicts itself. | [NIST SP 800-57 Pt 1](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-57pt1r5.pdf) Table 2 |
| `mcq-3-011` | Stem says `(Choose TWO.)`. Option (a) is correct. Option (f) — *"Proxy firewall for requirement 1; NGFW for requirement 2"* — is keyed but **wrong**: requirement 2 explicitly demands a stateless device, and an NGFW is stateful. Two keys, only one defensible. | internal |
| `mcq-1-004` | Keyed option is `"Corrective and Corrective"`. A degenerate pair no exam would offer, and it makes (b) "Corrective and Detective" look like the intended answer. | internal |

### 4.4 PBQ scoring can be defeated without any knowledge — **37 items**

**Config PBQs where every field's answer is option #1 (13):**
`pbq-1-004`, `pbq-1-013`, `pbq-2-006`, `pbq-3-005`, `pbq-3-009`, `pbq-3-016`, `pbq-4-006`, `pbq-4-012`, `pbq-4-021`, `pbq-4-022`, `pbq-4-023`, `pbq-4-805`, `pbq-5-010`

Across all 18 config PBQs the answer position distribution is **option #1 = 78 (83%)**, #2 = 6, #3 = 6, #4 = 4.

**Matching/sort PBQs where p1→t1, p2→t2, … (24):**
`pbq-1-005`, `pbq-1-014`, `pbq-2-001`, `pbq-2-002`, `pbq-2-008`, `pbq-2-013`, `pbq-2-014`, `pbq-2-802`, `pbq-3-007`, `pbq-3-012`, `pbq-3-013`, `pbq-3-014`, `pbq-3-017`, `pbq-4-003`, `pbq-4-011`, `pbq-4-015`, `pbq-4-019`, `pbq-4-024`, `pbq-4-803`, `pbq-5-008`, `pbq-5-013`, `pbq-5-014`, `pbq-5-015`, `pbq-5-016`

Only 4 of 28 are shuffled. A learner who always maps first-to-first scores 100% on 24 PBQs.

**Fix:** shuffle option order per field and target order per match at *authoring* time, and add a gate: within a config PBQ, correct answers must occupy ≥2 distinct positions; within a matching PBQ, the mapping must not be identity.

### 4.5 Evidence PBQs that hand over the answer — **4 items**

The artifact lines are annotated with the attack class, so the exercise is reading comprehension, not detection.

| ID | Leak |
|---|---|
| `pbq-2-005` | 4 of 9 lines annotated: `…OR 1=1 -- SQL injection probe`, `…/etc/passwd -- path traversal attempt`, `<script>… -- reflected XSS payload`, `…;cat /etc/passwd -- OS command injection`. Context also enumerates the four answers. |
| `pbq-4-005` | 3 of 5 lines annotated: `(low-rate beacon)`, `(DNS tunnel)`, `(port scan)`. |
| `pbq-2-016` | Context is a tutorial: *"SQL injection shows up in web logs as unexpected characters… URL-encoded quotes (%27), OR conditions, and UNION SELECT clauses."* |
| `pbq-2-017` | Context: *"A successful brute force appears as a burst of failed logons (Event ID 4625)… followed by a successful logon (Event ID 4624) from the SAME source."* |

---

## 5. P1 — Exam realism (this is the "phrase it exactly like the exam" problem)

### 5.1 The stem does not carry the scenario — **489 items (71%)**

A "bare interrogative" is a stem shorter than 170 chars that opens with a Wh-word — meaning the entire premise lives in the separate `context` field.

| Style label in the bank | n | bare interrogative | median stem |
|---|---|---|---|
| `recall` | 80 | 76 (95%) | 52 |
| `keyword` | 394 | 330 (84%) | 53 |
| `scenario` | 170 | **117 (69%)** | 69 |
| `short-form` | 48 | 48 (100%) | 107 |

The `scenario` label is not doing its job — seven in ten "scenario" items are one-line tag questions.

Representative offenders (all under 30 chars):

```
mcq-3-047  Which control is this?           mcq-3-037  Which service model is this?
mcq-5-053  Which exercise is this?          mcq-5-044  Which risk response is this?
mcq-5-048  Which test type is this?         mcq-2-014  What vulnerability exists?
mcq-5-104  Which treatment is BEST?         mcq-4-057  What is this image called?
mcq-2-113  Which engagement is this?        mcq-1-044  Which mechanism is in use?
mcq-2-128  Which AI attack occurred?        mcq-2-110  Which artifacts are these?
```

**26 items** use the `Which <X> is this?` template outright — a flashcard shape, not an exam shape.

### 5.2 The scenario is rendered twice — **240 items**

Vocabulary overlap between `context` and `prompt` (excluding stopwords), median across the bank = **0.49**:

| Overlap | Items |
|---|---|
| ≥ 0.90 | **58** |
| ≥ 0.75 | 62 |
| ≥ 0.60 | **120** |
| ≥ 0.40 | 171 |
| < 0.20 | 123 |

Because `ExamFlow.svelte:1016` renders `context` above `prompt`, these 240 items show the learner the same paragraph twice. Worst case `mcq-4-001` at 0.92 overlap.

**Fix:** merge `context` into the stem and drop the separate field for MCQs (or blank the field). This is the single highest-leverage change in the whole report — it fixes 5.1 and 5.2 together.

### 5.3 Options written as prose — **4 items**

These put the justification inside the option text, so the rationale is visible before answering, and `mcq-3-028` literally says "correct" in two options.

- `mcq-3-028` — every option ends with a verdict: `"— matches business requirements"`, `"— exceeds business requirements"`, `"— correct metrics"`, `"— correct metrics"`.
- `mcq-3-034` — `"UPS for blips and surge protection; generator for extended outage. UPS batteries provide instant failover…"`
- `mcq-3-029` — `"Hot site — fully duplicated infrastructure with real-time replication. Meets all requirements but has highest CapEx."`
- `mcq-3-035` — option restates the whole calculation.

Compare CompTIA: options are `"Backups"`, `"Lessons learned"`, `"Unpreventive"`-length noun phrases.

### 5.4 Option counts off-model — **46 items**

Real SY0-701 single-answer items use four options. The bank has:
- **36 items with 6 options** (`mcq-1-003`, `mcq-2-002`, `mcq-2-003`, `mcq-2-005`…`mcq-2-008`, `mcq-3-011`, `mcq-3-014`, `mcq-3-021`, `mcq-4-005`, `mcq-4-013`…)
- **10 items with 5 options** (`mcq-1-010`, `mcq-1-021`, `mcq-2-009`, `mcq-3-031`, `mcq-5-005`, `mcq-5-011`, `mcq-5-017`, `mcq-5-031`, `mcq-5-037`, `mcq-2-071`)

Six options is acceptable only for multi-select. Single-choice items should be cut to four.

### 5.5 Leftover title fragments glued onto stems — **1 clear + 5 borderline**

- `mcq-5-007` — stem begins `"Organizational governance structures and security strategy approval."` (a heading, no verb) then the question. This is the same defect class the 2026-10-13 pass fixed in `mcq-4-041`.
- Borderline, same pattern of a fragment sentence before the ask: `mcq-1-007`, `mcq-1-019`, `mcq-2-004`, `mcq-2-021`, `mcq-3-151`.

### 5.6 `format` field is meaningless — 691 of 692 say `standard`

One item (`mcq-1-122`) says `scenario`. The field carries no information and is unused by the renderer. Either remove it or derive it from the stem shape.

---

## 6. P1 — Provenance: the Dion citation layer is fabricated

This is the finding most relevant to your instruction *"ensure we are hitting all the ones from the DION study guide PDF."*

The Dion guide has **226 top-level sections** (extracted and indexed). Every item carries `sourceRefs`. Here is the truth of those references:

| Citation state | Items | % |
|---|---|---|
| Cites a section that **exists** in the Dion guide | **39** | 4.8% |
| Cites a section that **does not exist** | **378** | 46.6% |
| **No** `study-guide` reference at all | **395** | 48.6% |

Of the 275 *distinct* section strings cited, **249 are not in the Dion guide**.

### What the fabrications look like

**(a) Placeholder "citations" — 70 items** cite a whole domain, not a section:
`"Domain 4 — Security Operations"` (25), `"Domain 1 - General Security Concepts"` (13), `"Domain 3 - Security Architecture"` (11), `"Domain 4 - Security Operations"` (11), `"Domain 5 - Security Program Management and Oversight"` (10), `"Domain 2 - Threats, Vulnerabilities, and Mitigations"` (9), plus several `"Domain 4 — Vulnerability Management"`-style variants.

**(b) Hallucinated book chapters — 19 items** cite numbered chapters that do not exist:
```
"Chapter 2: Wireless Network Hardening - WPA3, 802.1X, and WPS."      pbq-2-010
"Chapter 3: Symmetric Encryption and AES Key Sizes."                  pbq-3-006
"Chapter 3: Securing AI and Machine-Learning Systems."                pbq-3-008
"Chapter 4: Incident Handling and Reporting Workflow."                pbq-4-010
"Chapter 5: Vendor Risk Management and DPAs."                         pbq-5-007
"Chapter 2: Recognizing Brute-Force in Logs."                         pbq-2-015
"Chapter 4: Spotting Privilege Escalation in Logs."                   pbq-4-017
```
The Dion guide has **no numbered chapters** — it is a bullet-outline with 226 named sections.

**(c) Plausible-but-wrong section names — the rest.** Examples with the real Dion section that should be cited:

| Cited (does not exist) | Should be |
|---|---|
| `Zero Trust Architecture` | `Zero Trust` |
| `Non-repudiation` | `Non-repudiation` ✅ (one of the 26 that match) |
| `Change Management` | `Change Management` ✅ |
| `Security Control Types` | `Security Control Types` ✅ |
| `Vendor Due Diligence` | `Vendor Assessment` / `Vendor Selection and Monitoring` |
| `Disaster Recovery and Continuity` | `Continuity of Operations Plan` / `Resilient Site Considerations` |
| `Data Governance and Lifecycle Management` | `Governance` / `Data Ownership` |
| `Redundancy and Fault Tolerance` | `Data Redundancy` / `High Availability` |
| `Secure Protocols` | `Selecting Secure Protocols` |
| `Web Application Firewalls` | `Firewalls` / `Configuring Firewalls` |
| `Incident Response` | `Incident Response Process` |
| `Business Impact Analysis` | `Continuity of Operations Plan` |
| `Risk Management Calculations` | `Quantitative Risk Analysis` |

**(d) A competing course is cited as a study source.** `professor-messer` appears in **367 items**; `comptia` in 385; `cisa` in 9. So the bank's provenance is a mix of sources, only 39 of which point at Dion at all.

### Impact

`AUDIT.md` claims *"A learner who works the course… is prepared to pass"* and the coverage audit says coverage was verified by matching keywords against the corpus. That keyword match is real; the **citation trail is not**. You cannot currently answer "which Dion section does this question come from?" for 95% of the bank — which is exactly the question you asked me to answer.

### Fix

I have already computed the correct Dion section for **every** item (TF-IDF over the 226 section bodies; 684 of 812 scored ≥0.14 and none below 0.08). The corrected map is in `/tmp/sy0701/item-section-map.json` for this session; it should be committed as `web/src/lib/server/data/dion-section-map.json` and used to regenerate `sourceRefs`. Add a validator gate: **every `study-guide` section must exist in an indexed list of the 226 headings**, or the test fails.

---

## 7. P2 — Objective tagging

Running the official objective bullet-text as the reference, **95 items** are content-matched to an objective that is ≥1.6× more similar than the one they're tagged with. The clearest clusters:

**Crypto items tagged as Domain 3 deliverables (should be 1.4):**
`mcq-3-086`, `mcq-3-087` (OCSP/CRL), `mcq-3-124`, `mcq-3-130`, `mcq-3-131`, `pbq-3-006` (AES key size), `pbq-3-010` (algorithm selection), `pbq-3-011` (hash/HMAC/signature/KDF)

**Risk-metric items tagged as Domain 3 resilience (should be 5.2):**
`mcq-3-050`, `mcq-3-183`, `mcq-3-184` (RTO/RPO), `mcq-3-185`, `mcq-3-186` (MTTR/MTBF), `mcq-3-088`

**Third-party-risk items tagged 5.2 (should be 5.3):**
`pbq-5-007`, `pbq-5-009`, `pbq-5-011`

**Tool/attack items in the wrong domain:**
`pbq-4-003` (tool-to-function → should be 4.4, not 4.2), `pbq-4-014` (SQLi/XSS/buffer overflow definitions → should be 2.3, not 4.4), `pbq-2-003` (IoC selection → should be 2.4, not 2.2), `pbq-5-008` (risk vocabulary → should be 5.2, not 5.1), `pbq-1-011` (CIA triad → should be 1.2, not 1.1)

Full list of 95: `/tmp/sy0701/objective-fit.json`.

**Why it matters:** objective-scoped drills and the mastery matrix pull by objective. A learner drilling 1.4 for cryptography will never see the eight crypto items filed under 3.4.

---

## 8. P2 — Duplication & dead weight (REMOVE / MERGE)

### 8.1 Near-duplicate stem pairs — **42 pairs at ≥0.85 similarity**

Most are the deliberate "one item per term in the same template" family, which is defensible as a drill but bad as an exam bank. The ones that are genuinely the same test:

| Pair | Verdict |
|---|---|
| `mcq-4-033` / `mcq-4-076` | **MERGE** — both are order-of-volatility, objective 4.8, same answer sequence. (Flagged in the 2026-10-13 audit as M7; still present.) |
| `mcq-2-133` / `mcq-2-157` | **REMOVE one** — context similarity 0.98, both key `DNS poisoning`. |
| `mcq-2-032` / `mcq-2-038` | **MERGE** — both ask "sandbox it or submit it online?", both key the INetSim option. |
| `pbq-3-014` / `pbq-4-803` | **MERGE** — both are "insecure protocol → secure replacement" matching. |
| `pbq-1-009` / `pbq-1-010` / `pbq-1-011` | **MERGE to one** — three word-banks drilling the same four CIA terms. |
| `pbq-2-012` / `pbq-4-014` | **MERGE** — attack-definition word banks sharing 3 of 4 answers. |
| `pbq-5-004` / `pbq-5-016` | **MERGE** — both classify awareness activities into outcomes. |
| `pbq-3-013` (ports) / `mcq` port-recall family | **REMOVE** — the real exam does not test bare port memorisation as a PBQ. |

### 8.2 Files that are dead weight

`web/src/lib/server/domain1-questions.json`, `domain3-questions.json`, `domain4-questions.json`, `domain5-questions.json` — **156 items, imported by nothing** (grep across `src/` and `scripts/` returns zero hits). They are stale duplicates of live items with an older shape where `prompt` embeds the scenario and `context` repeats it verbatim. Deleting them removes a trap for anyone reading the repo.

---

## 9. P2 — PBQ format realism

The bank has 14 interaction kinds. CompTIA's own definition is that a PBQ is delivered **as a simulation or inside a virtual environment**, with multiple valid paths and partial credit.

**7 items are MCQs wearing a PBQ label** — these inflate the PBQ count and give a false sense of PBQ coverage:
`pbq-2-003`, `pbq-2-007`, `pbq-3-004`, `pbq-5-002`, `pbq-5-006`, `pbq-5-007`, `pbq-5-901` (kinds `single-choice` / `multiple-choice`)

**3 sliders are not an exam interaction** — the real exam has you drag items, fill blanks, configure a device, or click a hotspot. Dragging a slider to "3072" is not something SY0-701 asks:
`pbq-1-006` (RSA modulus bits), `pbq-3-006` (AES key length), `pbq-5-003` (availability %)

**2 hotspot items are answerable from the label, not the diagram** — the regions are literally labelled `"Perimeter firewall"` and `"DMZ server segment"`, so pointing at the correct one requires no topology understanding:
`pbq-4-008`, `pbq-4-802`

**2 sort items contain a bucket labelled as a distractor**, which breaks the fiction:
`pbq-5-004` (`"Technical control (not awareness - distractor)"`), `pbq-4-801` (`"Risk accepted (no action - distractor)"`)

**What's genuinely good and should be kept:** the `ordering` items (NIST IR lifecycle, PKI lifecycle, order of volatility, BEC kill chain) map directly onto real PBQ shapes, and `pbq-3-003` / `pbq-4-006` firewall-rule configuration is the single most-represented real PBQ per external analyses. Keep those and expand that family.

**Confirmed gap:** the audit listed `memory` as unreachable (P2). It is now reachable — 3 items exist (`pbq-1-901`, `pbq-2-901`, `pbq-4-901`) — but no real SY0-701 PBQ is a memory-matching game. Recommend deleting `MemoryBoard.svelte` and those 3 items.

---

## 10. P2 — Coverage & weighting

### 10.1 Domain weight vs exam weight

| Domain | Exam weight | Bank share (812) | Delta |
|---|---|---|---|
| 1 General Security Concepts | 12% | 14.8% | +2.8 |
| 2 Threats, Vulnerabilities, Mitigations | 22% | 23.0% | +1.0 |
| 3 Security Architecture | 18% | **23.2%** | **+5.2** |
| 4 Security Operations | 28% | **22.0%** | **−6.0** |
| 5 Security Program Mgmt | 20% | 17.0% | −3.0 |

Domain 4 is the heaviest exam domain and the lightest in the bank after Domain 5. This is the same M3 finding from the 2026-10-13 audit, still open.

### 10.2 Dion sections with no coverage at all — **8 real gaps (ADD)**

Cross-checking the 48 sections that received zero content-matched items against keyword presence anywhere in the bank leaves eight genuinely absent topics:

| Dion section | Note |
|---|---|
| `Bypassing Surveillance Systems` | Physical-security blind spots, camera coverage gaps |
| `Shellcode` | Payload mechanics — no item mentions it |
| `Stage 2: Downloader` | Malware kill-chain stage |
| `"Actions on Objectives" Phase` | Kill-chain terminology the Dion guide uses explicitly |
| `Vendor Selection and Monitoring` | Distinct from `Vendor Assessment`, which *is* covered |
| `Technical Implications of Changes` | Change-management technical impact |
| `Selecting Infrastructure Controls` | Dion's decision framework for choosing controls |
| `Single Pane of Glass` | SIEM/console consolidation concept |

The other 34 "uncovered" sections are covered incidentally — the content matcher just attributed their items to a stronger neighbouring section.

### 10.3 The rest of the Dion guide is well covered

196 of 226 sections (87%) have at least one item attributed. Coverage is not the problem; **citation** is.

---

## 11. Verdict counts — every item classified

Every one of the 812 items has exactly one verdict and one reason in **`web/review-2026-11/item-verdicts.csv`** (and `.json`). Nothing is left as "miscellaneous".

| Verdict | Count | % |
|---|---|---|
| **REWRITE** — new stem/scenario required | **400** | 49.3% |
| **REVISE** — targeted fix, item survives | **240** | 29.6% |
| **KEEP** — meets standard, no change | **152** | 18.7% |
| **REMOVE** — delete the item | **20** | 2.5% |

### What drives each bucket

| Count | Verdict | Reason |
|---|---|---|
| 380 | REWRITE | P1 bare interrogative — premise lives only in `context` |
| 152 | KEEP | meets standard |
| 85 | REVISE | P2 objective tag disagrees with the official objective text |
| 29 | REVISE | P2 near-duplicate stem family |
| 24 | REVISE | P0 matching identity-mapped (farmable) |
| 13 | REVISE | P0 config keys every field to option #1 (farmable) |
| 10 | REWRITE | **P0 answer printed in stem** |
| 9 | REVISE | P0 multi-select missing count instruction |
| ~60 | REVISE | P1 scenario restated in the stem (overlap ≥ 0.60) |
| 9 | REMOVE | P2 merge — sibling survives and absorbs the content |
| 7 | REVISE | P1 off-model option count (5 or 6) |
| 7 | REMOVE | P1 MCQ wearing a PBQ label |
| 4 | REVISE | P0 evidence artifact or context leaks the answer |
| 4 | REWRITE | **P0 key wrong or degenerate** |
| 4 | REWRITE | P1 options written as prose / self-evaluating |
| 3 | REMOVE | P1 slider is not an exam interaction |
| 3 | REMOVE | P1 memory game is not a real PBQ kind |
| 2 | REWRITE | **P0 stem says Select TWO but item is single-choice** |
| 2 | REVISE | P1 hotspot answerable from the label, not the diagram |
| 2 | REVISE | P1 bucket labelled "distractor" in the UI |
| 9 | REMOVE | P2 duplicate of a sibling item (3 pairs of 3, 3 pairs of 2) |
| 1 | REVISE | P1 leftover heading fragment glued onto the stem |

### The 20 removals, explicitly

Duplicates are **merged, never both deleted** — the survivor is marked REVISE and absorbs the sibling's content, so no concept leaves the bank.

| ID | Reason |
|---|---|
| `mcq-2-038` | Merge — `mcq-2-032` survives (sandbox-with-INetSim, same key) |
| `mcq-4-076` | Merge — `mcq-4-033` survives (order of volatility, same answer sequence) |
| `mcq-2-157` | Merge — `mcq-2-133` survives (DNS poisoning, context similarity 0.98) |
| `pbq-1-010`, `pbq-1-011` | Merge — `pbq-1-009` survives (CIA-triad word banks) |
| `pbq-4-014` | Merge — `pbq-2-012` survives (attack-definition word banks) |
| `pbq-3-014` | Merge — `pbq-4-803` survives (insecure→secure protocols, broader) |
| `pbq-5-016` | Merge — `pbq-5-004` survives (awareness-activity classification) |
| `pbq-2-003`, `pbq-2-007`, `pbq-3-004`, `pbq-5-002`, `pbq-5-006`, `pbq-5-007`, `pbq-5-901` | MCQ wearing a PBQ label — move to the MCQ bank or drop |
| `pbq-1-006`, `pbq-3-006`, `pbq-5-003` | Slider is not an exam interaction |
| `pbq-1-901`, `pbq-2-901`, `pbq-4-901` | Memory game is not a real PBQ kind |
| `pbq-3-013` | Ports memorisation PBQ is not an SY0-701 PBQ shape |

**ADD:** 8 missing Dion topics + ~40 Domain 4 items to close the 6pp weighting gap.

> A note on the 400 REWRITEs: this is not 400 bad questions. It is 380 correct questions asked in a shape the exam never uses. The content survives; the stem is rebuilt by merging `context` into `prompt` and adding an emphasis word. Most rewrites are mechanical, not intellectual.

---

## 12. The rewrite specification — how to phrase for SY0-701

This is the actionable answer to *"phrase our questions EXACTLY as one would expect for this exam type."*

### Rules

1. **One field.** The scenario goes in the stem. `context` becomes empty (or is used only in practice mode as a restatement hint).
2. **Length.** 180–420 chars. Below 150 the item is a flashcard; above 500 it's a reading test.
3. **Shape.** `[Scenario: actor + system + observed symptom or constraint.] Which of the following <BEST|MOST likely|should the analyst do FIRST|LEAST> <verb phrase>?`
4. **Emphasis word in every single-answer item.** CompTIA uses MOST / BEST / FIRST / NEXT / LEAST / MOST likely. Without one, a scenario has multiple defensible answers.
5. **Four options**, each a noun phrase ≤ 60 chars. No embedded justification. No option that evaluates itself.
6. **Multi-select:** exactly four or five options, and state the count — `(Select two.)` — matching `selectCount`.
7. **No answer token anywhere in stem or context.** Gate it.
8. **Distractors are plausible to a partial expert**, not random terms from other domains.
9. **Objective tag must match the objective bullet text**, verified by content match, not by keyword grep.

### Before / after

**Before** (`mcq-3-047`, 22 chars, premised entirely in an invisible-ish `context` field):
> **Q:** Which control is this?

**After:**
> **Q:** A hospital adds an electronic lock to its pharmacy door that requires a badge and PIN, and the door remains locked when the badge reader loses network connectivity. Which of the following control classifications BEST describes the lock?
> A. Detective, fail-open
> B. **Preventive, fail-secure** ✓
> C. Deterrent, fail-secure
> D. Compensating, fail-open

**Before** (`mcq-1-005`, broken multi-select):
> **Q:** The administrator also posts a warning banner… Which TWO control types are being used? (Select TWO.)

**After:**
> **Q:** A small business cannot afford a commercial SIEM, so the administrator configures a centralized syslog server that collects logs from all network devices and emails alerts on critical events. The administrator also posts a login banner stating that unauthorized access is prohibited and will be prosecuted. Which of the following control types are in use? (Select two.)
> A. **Detective (the syslog server and its alerts)** ✓
> B. Preventive (the syslog server and its alerts)
> C. **Deterrent (the warning banner)** ✓
> D. Directive (the warning banner)
> E. Corrective (both controls)

**Before** (`mcq-2-107`, answer leaked):
> **Q:** Which platform category is the team using when the subject is soar?

**After:**
> **Q:** A phishing report triggers an automated workflow that opens a ticket, extracts the sender and URLs, quarantines matching messages across all mailboxes, and notifies the analyst only if the sender reputation is unknown. Which of the following platform categories is the team using?
> A. SIEM
> B. **SOAR** ✓
> C. EDR
> D. XDR

---

## 13. Recommended execution order

| Phase | Work | Gate |
|---|---|---|
| **1** | Fix the 10 answer-leak stems, the 11 select-count items, the 4 wrong/degenerate keys. Strip `"when the subject is"`. | Add validator rules: `stem does not contain a keyed token`; `selectCount>1 ⟺ stem states the count`; `no degenerate X-and-X option`. |
| **2** | Shuffle PBQ option/target order for the 13 config + 24 matching items; de-annotate the 4 leaked artifacts. | New gate: config answers occupy ≥2 positions; matching mapping is not identity. |
| **3** | Regenerate `sourceRefs` from the computed Dion section map. Delete the 8 placeholder/chapter citation families. | New gate: every `study-guide` section ∈ the 226-heading index. |
| **4** | Merge `context` into `prompt` for all 692 MCQs (this mechanically fixes 489 bare interrogatives and 240 duplications). Enforce 180–420 chars, one emphasis word, 4 options. | New gate: stem ≥ 180 chars; exactly one emphasis word; 4 options for single-choice. |
| **5** | Fix the 95 objective tags; rebalance ~40 items into Domain 4. | Objective-fit test: content match must equal the tag within 1.2×. |
| **6** | Merge/remove the duplicate pairs; delete the 4 stale `domain*-questions.json` files. | — |
| **7** | Author the 8 missing Dion-section topics. | Coverage map reaches 226/226. |

Phases 1–3 are surgical and low-risk — roughly 40 items and one data file. Phase 4 is the large one and should be its own change, reviewed as a diff.

---

## 14. What I did not do

- Did not modify `question-bank.json`, `question-bank-ledger.{json,md}`, `AUDIT.md`, or any test.
- Did not apply any of the rewrites above.
- Did not touch the A+ banks (`aplus-1201-bank.json`, `aplus-1202-bank.json`).
- Did not rename the mislabelled Dion PDF — but you should: `CompTIA-Security-Plus-SY0-701-Study-Guide.pdf` is **Dion Training's** study notes, and filing it as a CompTIA product is what let the fabricated citations go unnoticed.

---

## 15. Sources

- [CompTIA Security+ practice questions (V7)](https://www.comptia.org/en-us/certifications/security/practice-questions) — official phrasing benchmark
- [CompTIA — Performance-Based Questions explained](https://www.comptia.org/en-us/resources/test-policies/exam-development/performance-based-questions-explained) — PBQ definition, simulation vs virtual, partial credit
- [CVSS v3.1 Specification Document](https://www.first.org/cvss/v3.1/specification-document) — Temporal/Remediation Level weights
- [NIST SP 800-57 Part 1 Rev 5](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-57pt1r5.pdf) — Table 2, security-strength equivalences
- [LearnZapp — How to Ace Security+ PBQs](https://www.learnzapp.com/blog/security-plus-pbq-tips) — observed SY0-701 PBQ distribution
- Local: `notes/04-Resources/CompTIA-Security-Plus-SY0-701-Exam-Objectives.pdf` (v5.0), `…Study-Guide.pdf` (Dion, 405 pp.)

## 16. Reproducible artefacts

Committed to **`web/review-2026-11/`** so every number above can be re-derived:

| File | Contents |
|---|---|
| `item-verdicts.csv` / `.json` | All 812 items with verdict + reason |
| `dion-sections.txt` | The 226 Dion top-level sections with line numbers |
| `item-section-map.json` | Each item → best-matching Dion section body (score + 2 alternates) |
| `objective-fit.json` | Each item → best-matching official objective, with fit scores |
| `final-lists.json` | Every ID list quoted in this report |
| `coverage.py` | Dion section-body TF-IDF coverage script |
| `tagcheck.py` | Objective-bullet tag validation script |

Re-run with `python3 web/review-2026-11/coverage.py` and `python3 web/review-2026-11/tagcheck.py` (both read the live bank and the extracted PDF text).
