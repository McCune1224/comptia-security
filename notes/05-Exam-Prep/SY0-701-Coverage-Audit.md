# SY0-701 Coverage Audit

> Purpose: verify that a learner who works the course from start to finish is prepared to pass
> CompTIA Security+ SY0-701, and record the gaps that were closed to make that true.
>
> Audited: 2026-10-12 · Bank: 692 MCQs + 105 PBQs · Objectives version 5.0

## Verdict

**Yes, with one condition.** The course now teaches every bullet in the official SY0-701 objectives
and drills each objective with scored, scenario-style questions. A learner who completes the four
modules, the six objective quizzes, both scenario/PBQ sets, the three 90-question full-length exams
and the 20-question Week-1 checkpoint, and who clears the review queue to the app's 83.3% readiness
target, is prepared to pass.

The condition is consistency: the material is only as good as the learner's use of it. Read every
lesson, finish every assignment, and work the daily review until weak objectives recover. Skipping
the drills and reading the lessons alone is not enough.

## What "the material" is

| Surface | Where | Role |
| --- | --- | --- |
| Course + lessons | `web/` (SvelteKit app), 7 lessons across 4 modules | Teaches every objective bullet |
| Question banks | `question-bank.json`, 692 MCQ + 105 PBQ | Scored practice for all 28 objectives |
| Full exams | 3 × 90-question timed exams + 1 × 20-question Week-1 checkpoint; full exams are PBQs first (SY0-701 weighting) | Exam simulation and readiness |
| Spaced repetition | Daily review, mastery matrix, Wall of Shame | Retention and weak-topic recovery |
| Flashcards | `anki/` (Dion decks, `AI Security+/V3`, ports, crypto, acronyms) | Cram layer |
| Study vault | `notes/` | Planning, cram plan, trackers, mock-exam log |

The app is the source of truth for teaching content. The vault is a planning and cram companion,
not a second copy of the lessons.

## How coverage was checked

1. Extracted the official exam objectives (28 objectives, all sub-bullets) from
   `notes/04-Resources/CompTIA-Security-Plus-SY0-701-Exam-Objectives.pdf`.
2. Built a keyword set from every objective bullet and matched it against the full corpus: lesson
   text, question prompts, options, rationales, explanations, Anki decks, and vault notes.
3. Ran the app's own coverage test (`web/src/lib/server/security-content.test.ts`), which requires
   each mapped lesson to contain its declared terms and each mapped question to agree on objective.
4. Checked bank integrity: unique ids, no duplicate prompts, valid correct-answer sets, select
   counts, matching/ordering/evidence/config integrity.
5. Ran `npm test`, `npm run check`, and `npm run build`.

## Question coverage by objective

Each objective has both lesson coverage and scored practice. Counts are bank items after the
full read-through and the third batch of tag corrections.

| Objective | Title | MCQ | PBQ |
| --- | --- | --- | --- |
| 1.1 | Security controls | 41 | 3 |
| 1.2 | Fundamental security concepts | 21 | 2 |
| 1.3 | Change management | 18 | 2 |
| 1.4 | Cryptographic solutions | 24 | 8 |
| 2.1 | Threat actors and motivations | 13 | 2 |
| 2.2 | Threat vectors and attack surfaces | 33 | 3 |
| 2.3 | Types of vulnerabilities | 51 | 2 |
| 2.4 | Indicators of malicious activity | 44 | 10 |
| 2.5 | Mitigation techniques | 23 | 4 |
| 3.1 | Architecture models | 48 | 3 |
| 3.2 | Secure enterprise infrastructure | 27 | 9 |
| 3.3 | Protecting data | 35 | 2 |
| 3.4 | Resilience and recovery | 56 | 5 |
| 4.1 | Securing computing resources | 17 | 2 |
| 4.2 | Asset management | 12 | 2 |
| 4.3 | Vulnerability management | 20 | 2 |
| 4.4 | Alerting and monitoring | 23 | 4 |
| 4.5 | Modifying enterprise capabilities | 12 | 4 |
| 4.6 | Identity and access management | 20 | 6 |
| 4.7 | Automation and orchestration | 8 | 2 |
| 4.8 | Incident response | 20 | 4 |
| 4.9 | Investigation data sources | 7 | 6 |
| 5.1 | Security governance | 14 | 2 |
| 5.2 | Risk management | 32 | 7 |
| 5.3 | Third-party risk | 25 | 3 |
| 5.4 | Security compliance | 20 | 2 |
| 5.5 | Audits and assessments | 14 | 2 |
| 5.6 | Security awareness | 14 | 2 |

692 MCQs and 105 PBQs total. Domain MCQ counts 104/164/166/139/119. Every objective clears the
bank spec's floor.

## Gaps found and closed

The first pass found objective sub-bullets that appeared only in question explanations, or nowhere
at all. All were added to the lesson text and locked in with the coverage manifest.

- **Domain 1** — Zero Trust control-plane detail (policy-driven access control, policy
  administrator, implicit trust zones, subject/system); sensor types (infrared, pressure,
  microwave, ultrasonic); change ownership, test results, restricted activities; partition and
  transport encryption, key exchange, key length, algorithm, third-party CA.
- **Domain 2** — actor motivations (blackmail, war, ethical, revenge, philosophical); client-based
  versus agentless software, wired vectors, brand impersonation, vendors and suppliers; memory
  injection, malicious update, hardware/service/software providers; virus, bloatware, amplified and
  reflected DDoS, malicious code, injection, replay; concurrent sessions, blocked content, resource
  inaccessibility, published/documented activity; removal of unnecessary software.
- **Domain 3** — responsibility matrix, third-party vendors, on-premises; cost, responsiveness,
  ease of deployment, risk transference, power, compute, centralized vs decentralized; active vs
  passive device attribute, Layer 4 vs Layer 7 firewalls; legal information, human/non-human
  readable data, critical/private labels, geographic restrictions; simulation, failover, capacity
  planning across people, technology, and infrastructure.
- **Domain 4** — baseline establish/deploy/maintain, hardening targets including switches and
  routers, cellular and Bluetooth connection methods; package monitoring, proprietary/third-party
  feeds, system/process audit, insurance, environmental variables, industry impact, risk tolerance,
  vulnerability classification; agentless scanning; agent-based and centralized-proxy web filters,
  block rules, email gateway; mandatory access control, somewhere-you-are factor, hard and soft
  tokens, interoperability, password length/complexity/reuse/expiration/age; automation security
  groups, escalation, enabling/disabling services, employee retention, reaction time, complexity,
  cost; forensics reporting.
- **Domain 5** — standards and procedure examples, onboarding/offboarding, playbooks, government
  entities, geographic scope of external requirements; one-time assessments, probability and
  likelihood, risk threshold, risk owner, expansionary/conservative/neutral appetite; work order;
  contractual impacts, internal and external monitoring, privacy at local/regional/national/global
  scope; examinations, physical and partially known penetration tests; removable media and cables,
  initial and recurring training, program development and execution.

Coverage is now enforced: `security-objective-coverage.json` maps every objective to its lesson and
questions, and the test suite fails if a mapped lesson stops containing its terms.

## Bank defects fixed

A multi-model review of 208 MCQs and all 105 PBQ keys found concrete defects. All were fixed in a
repair pass (`fix-bank-defects.py`, idempotent, keyed by question id; since deleted, kept in git
history) and locked with regression tests in `question-bank.test.ts`:

- **mcq-2-004** — a select-TWO item keyed an option whose own rationale called it false. Rebuilt as
  a single-answer item.
- **mcq-1-005** — the syslog server is both detective and compensating, so two options were equally
  defensible under a select-TWO key. Rebuilt as a single-answer item.
- **mcq-3-011** — the keyed pair contained synonyms (stateless and packet-filtering), giving the
  same answer twice. Option replaced with a genuinely wrong pairing.
- **mcq-3-006** — stated PACS runs on port 389 (LDAP). Corrected to DICOM port 104.
- **mcq-1-011** — stem asked what would prevent while the key detected. Reframed to detect.
- **mcq-3-019** — key labeled PII as Internal while its own rationale said at least Confidential.
  Key and explanation aligned to Confidential.
- **pbq-3-008** — labeled reconstructing training data "model extraction" (it is model inversion).
  Premise and targets corrected.
- **mcq-3-050 / mcq-4-141** and **mcq-3-077 / mcq-3-126** and **mcq-3-096 / mcq-1-084** — duplicate
  items. One of each pair was retargeted so both teach something distinct.
- Domain-floor replacements: two new multiple-choice items (`mcq-1-122`, and `mcq-2-009` promoted)
  keep the select-TWO floors intact after the two rebuilds above.

Bank spec totals stay satisfied: 692 MCQs and 105 PBQs, with the per-domain floors
48/71/62/92/59, the multi-select floors 6/11/9/13/7, and the style floors intact.

## Second pass: objective tags and the remaining duplicates

The first pass fixed wrong answers and facts. A second pass fixed the taxonomy, because objective
tags drive the mastery matrix and every per-objective drill.

**Objective tags realigned (~55 items).** The bank had clusters of items tagged to the wrong
objective, so a learner drilling "1.2" was answering cryptography questions.

| Cluster | Was | Now | Count |
| --- | --- | --- | --- |
| Crypto terms (hashing, PKI, salting, CA, CSR) | 1.2 | 1.4 | 9 |
| Privacy and regulation (GDPR, PII, PHI) | 1.4 | 5.4 | 3 |
| Malware-type definitions | 2.1 | 2.4 | 10 |
| Incident-response phases | 4.1 | 4.8 | 6 |
| IAM models (RBAC, ABAC, MAC, DAC, PAM) | 4.4 | 4.6 | 5 |
| Jump server | 4.4 | 3.2 | 1 |
| Backup types (full, incremental, differential) | 4.6 | 3.4 | 3 |
| Syslog | 4.2 | 4.4 | 1 |
| Chain of custody, legal hold, e-discovery | 4.2 | 4.8 | 3 |
| Risk-management terms (SLE, ALE, ARO, responses) | 5.1 | 5.2 | 9 |
| Change management | 5.5 | 1.3 | 1 |
| Due care | 5.5 | 5.4 | 1 |
| TACACS+ | 3.3 | 3.2 | 1 |

Cross-domain retags also moved the item's `domain` and id (the validator requires objective domain
to match domain, and the id prefix to match the domain).

**Duplicate definition items removed.** The bank had a family of thin "Which security term is
defined as" items with the same keyed term, so a learner met the same definition two or three times.
Retagging the twins just produced new collisions, so a one-shot rule (`dedupe-definitions.py`,
since deleted) removed the duplicate: group by keyed term, keep the richest prompt, refuse to drop anything the
coverage manifest still references. Five duplicates were removed.

**Low-confidence PBQ items corrected.**
- `pbq-4-024` matched ransomware *symptoms* to "Eradication & Recovery". The premise now describes
  the recovery action, not the detection.
- `pbq-3-003` keyed a general "Internal to Internet" egress rule to a DNS-only policy. The field now
  asks about web egress, with the web-protocol rule keyed.
- `pbq-2-010` keyed MAC allowlisting as the most secure wireless option. Standard hardening treats
  MAC filtering as spoofable and not a control, so the key is now "Disabled", with 802.1X doing the
  work.

**Bank generator repaired.** `expand-security-objective-audit.py` cleared each replaced question
before writing the fragment, so any field the fragment omitted was destroyed. The replace path now
preserves omitted fields. Re-running it no longer strips `style` from 44 items.

**Regression tests added.** `question-bank.test.ts` now pins the retagged clusters and fails if any
definition term regains a duplicate keyed answer.


## Third pass: full read-through of every item

The third pass read all 692 MCQs and all 105 PBQs (including every multi-step child), not a sample.
It found and fixed a distinct class of defects that sampling had missed.

**Content and keying fixes.**

- `mcq-1-055` — the key had been displaced onto the "Identification" distractor and the correct
  answer ("Authorization") was missing from the options entirely. Rebuilt the item with the key
  restored and clean distractors.
- `mcq-1-004` — the keyed option was labelled "Corrective and Corrective", which reads as a
  transcription error. Reworded the option and explained why two corrective controls is the correct
  pairing.
- `mcq-1-028` — circular prompt ("the analyst's review ... is classified as ... review"). Reframed.
- `mcq-3-002` — single-answer item still carried a stray "(Choose TWO.)". Removed.
- `mcq-4-003` — the stem asserted the GPO was "Enforced" while the key depended on it not being
  enforced. Made the scenario internally consistent and corrected the rationale.
- `mcq-4-041` — the printed log was keyed as *demonstrative* evidence. It is *documentary*.

**Explanation and rationale corrections** (no answer change, but the reasoning a learner studies):
`mcq-1-090`, `mcq-2-002`, `mcq-2-012`, `mcq-2-032`, `mcq-3-008`, `mcq-3-010`, `mcq-3-015`,
`mcq-3-030`, `mcq-3-031`, `mcq-3-060`, `mcq-4-019`, `mcq-4-052`.

**Objective retags (13 items).** Detection-tool definitions were tagged to vulnerability management
(4.3) and asset management (4.2); resilience metrics and immutable backup were scattered across
4.5/4.9, NIST CSF sat under 4.7, and MITRE ATT&CK under 4.7. All realigned:

| Item | Was | Now |
| --- | --- | --- |
| mcq-4-010 logon-event analysis | 4.2 | 4.4 |
| mcq-4-103 to mcq-4-107 (DLP, NAC, UEBA, NIDS, NIPS) | 4.3 | 4.4 |
| mcq-4-114 to mcq-4-117 (RTO, RPO, MTTR, MTBF) | 4.5 | 3.4 |
| mcq-4-124 immutable backup | 4.9 | 3.4 |
| mcq-4-123 retention policy | 4.8 | 4.2 |
| mcq-4-121 NIST CSF | 4.7 | 5.1 |
| mcq-4-122 MITRE ATT&CK | 4.7 | 2.4 |

**How the fixes were applied.** The four-step pipeline (`fix-bank-defects.py`,
`fix-bank-defects-2.py`, `dedupe-definitions.py`, `fix-bank-defects-3.py`) was idempotent: it
replayed from HEAD to reproduce the committed bank byte for byte. The scripts were deleted once the
repair passes finished; git history keeps them.

**What did not change.** No item was found with a factually wrong answer outside the cases listed
above. Ports, formulas (SLE, ALE, ARO, availability), protocol mappings, control classifications,
and evidence-handling rules were all verified against the objective text.

## Limits and residual risks

- **Lesson text is a dense summary, not a textbook.** It covers every objective bullet, but depth
  comes from the question explanations. Do the drills.
- **Bank is practice, not the real exam.** CompTIA rotates items; treat a 90%+ bank score as
  necessary, not sufficient. An unreviewed minority of items may still carry a debatable distractor.
- **Bank generators can still change the bank shape.** `expand-security-objective-audit.py` no
  longer destroys `style` (the replace path preserves omitted fields), but running it rewrites
  `format` from `scenario`/`standard` to the fragment's value on ~90 MCQs. `format` is only read as
  a `pbq` versus not-`pbq` check, so this is cosmetic, but it makes the git diff noisy. Run
  `git status` after any generator and treat the committed JSON as the source of truth. The one-shot bank
  writers were deleted after the repair passes, so nothing rewrites the bank by hand anymore — the
  validator and `npm test` are the guard now.
- **No generator drift guard.** Nothing in CI prevents a stale generator from being run by hand.
  Add a check that diffs the bank after a dry run of the authoring pipeline.
- **No hands-on lab.** SY0-701 is knowledge-heavy, but the objective set includes skills (config,
  log reading, PBQs) that the app simulates. Consider a small lab for the PBQ-style tasks.
- **External depth is optional and listed in [[Objectives]]** (Professor Messer, Pearson Cert
  Guide, free practice tests). Use them only for topics where the bank keeps you below target.

## How to re-verify

```bash
cd web
npm test        # run `npm test`: coverage enforcement, bank-defect guards, retag and
                # duplicate-definition guards, and batch-3 read-through guards
npm run check   # svelte-check: 0 errors
npm run build   # production build
cd ..
```

The one-shot repair scripts that produced these fixes (`repair-question-bank.py` and its four
`fix-bank-defects` / `dedupe-definitions` steps) were deleted once the repair passes completed;
git history keeps them. Every invariant they enforced is now asserted by the bank validator and
`npm test`, so the three commands above are the standing check.

## Related

- [[Objectives|Cram Plan]]
- [[Exam Checklist]]
- [[SY0-701 Exam Overview]]
- [[Mock-Exams]]
- [[PBQ-Practice-Guide]]
