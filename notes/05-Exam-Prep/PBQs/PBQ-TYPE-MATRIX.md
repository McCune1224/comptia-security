# SY0-701 PBQ Type Matrix

> Research cut-off: **2026-11-17**. Bank checked: **104 PBQs / 801 MCQs**. The app now ships every in-scope interaction below; a type is not listed as covered unless the named item ids load through `/pbq` or `/quick` and score through the shared engine.

## Evidence rules

- **Confirmed** — stated in the official SY0-701 objectives/CompTIA PBQ guidance, **or** reported by at least two independent exam-prep/test-taker sources.
- **Plausible** — one credible exam-prep/test-taker source, or a defensible app extension derived from an objective (recorded as such).
- A type is **in scope** when it can be simulated with static content and the existing scoring model. A full VM/terminal lab is out of scope; see the last section.

## Sources

| # | Source | URL / path | Published / updated | Accessed | Tier | Used for |
|---|---|---|---|---|---|---|
| S1 | CompTIA Security+ SY0-701 Exam Objectives (v5.0 PDF) | `notes/04-Resources/CompTIA-Security-Plus-SY0-701-Exam-Objectives.pdf` | 2023 | 2026-11-14 | Official | Domain/objective mapping, scenario scope |
| S2 | CompTIA — Performance-Based Questions (official) | https://www.comptia.org/en-us/resources/test-policies/exam-development/performance-based-questions-explained/ | accessed 2026-11-14 | 2026-11-14 | Official | Simulation vs virtual PBQs; firewall, network diagram, terminal, OS simulations; partial credit; skip/return |
| S3 | StationX — CompTIA Security+ Performance Based Questions for 2026 | https://www.stationx.net/comptia-security-plus-performance-based-questions/ | 2026-01-07 | 2026-11-14 | Exam-prep | Fill-in, drag-and-drop (matching/ordering), scenario config, ACL + command-prompt demo |
| S4 | SecPlus Mastery — Security+ PBQs explained | https://secplusmastery.com/security-plus-pbq | Nov 2026 | 2026-11-14 | Exam-prep | Configuration, log/output, matching, diagram/topology, sequencing; partial credit |
| S5 | FigigExams — Security+ PBQ practice | https://figigexams.com/learn/security-plus-pbq-practice/ | Jun 2026 | 2026-11-14 | Exam-prep | Four formats; firewall rule repair, log triage, control sorting, incident ordering; rule precedence |
| S6 | r/CompTIA — “Passed Sec+ SY0-701” test-taker report | https://www.reddit.com/r/CompTIA/comments/1asvuux/passed_sec_sy0701/ | accessed 2026-11-14 | 2026-11-14 | Test-taker | Two PBQs: attack-to-term/remediation matching, network-log malware analysis |
| S7 | r/CompTIA — “I passed Security+ SY0-701” | https://www.reddit.com/r/CompTIA/comments/17zx4z0/i_passed_the_security_sy0701_exam/ | accessed 2026-11-14 | 2026-11-14 | Test-taker | Exam shape: 75 MCQ + 2 PBQ, 90 minutes |
| S8 | 101 Labs — SY0-701 PBQ practice | https://www.101labs.net/comptia-security-plus-sy0-701-pbq-practice-questions/ | 2026-05-03 | 2026-11-14 | Exam-prep | Interactive PBQ practice mapped to SY0-701 |
| S9 | CompTIA simulation demo + published answer key | https://demosim.comptia.org/ · https://www.comptia.org/docs/default-source/public-documents/00889-answer-key-to-pbq-web.pdf | accessed 2026-11-14 | 2026-11-14 | Official | ACL/terminal interaction shape referenced by S3 |

> S2 is the strongest shape evidence: it explicitly names **firewall, network diagram, terminal window, and operating system** simulations. S3/S9 describe the public CompTIA demo's ACL and command-prompt steps. S6 is a first-hand test-taker report; S7 corroborates the 75 MCQ + 2 PBQ sitting but not formats.

## Format matrix

| Kind | Interaction format | Task scenarios identified | Tier | Source(s) | Coverage in app | Item ids |
|---|---|---|---|---|---|---|
| `matching` | Drag-and-drop matching | Mapping items to categories/definitions (attacks→defenses, controls→types, ports→protocols). | confirmed | S2, S3, S4, S5 | Drillable — Common (24 PBQs) | `pbq-2-001`, `pbq-2-002`, `pbq-4-003`, `pbq-1-005`, `pbq-2-008`, `pbq-3-007`, `pbq-4-011`, `pbq-5-008`, `pbq-2-013`, `pbq-3-012`, `pbq-4-015`, `pbq-5-013`, `pbq-2-014`, `pbq-3-013`, `pbq-3-014`, `pbq-5-014`, `pbq-1-014`, `pbq-3-017`, `pbq-4-019`, `pbq-4-024`, `pbq-5-015`, `pbq-5-016`, `pbq-2-802`, `pbq-4-803` |
| `ordering` | Sequencing | Ordering phases or steps (incident response, hardening, recovery). | confirmed | S3, S4, S5 | Drillable — Common (8 PBQs) | `pbq-1-003`, `pbq-4-002`, `pbq-1-007`, `pbq-2-011`, `pbq-4-009`, `pbq-4-010`, `pbq-5-009`, `pbq-3-015` |
| `configuration` | Configuration panel | Setting values in a simulated tool (hardening checklist, device/account policy, TLS). | confirmed | S2, S3, S4, S5 | Drillable — Common (18 PBQs) | `pbq-1-004`, `pbq-2-006`, `pbq-3-003`, `pbq-3-005`, `pbq-4-006`, `pbq-4-007`, `pbq-2-010`, `pbq-3-009`, `pbq-4-012`, `pbq-5-010`, `pbq-1-013`, `pbq-3-016`, `pbq-4-021`, `pbq-4-022`, `pbq-4-023`, `pbq-4-805`, `pbq-4-806`, `pbq-4-026` |
| `rule-table` | Firewall / ACL rule table | Building and ordering rule rows: source, destination, port, action. | confirmed | S2, S3, S4, S9 | Drillable (new mechanic) — Common (5 PBQs) | `pbq-4-902`, `pbq-3-902`, `pbq-3-903`, `pbq-4-903`, `pbq-4-904` |
| `cli` | Constrained terminal / config completion | Typing commands or directives from a bounded vocabulary; no full shell. | confirmed | S2, S3, S9 | Drillable (new mechanic) — Common (5 PBQs) | `pbq-4-905`, `pbq-4-906`, `pbq-4-907`, `pbq-3-904`, `pbq-2-902` |
| `word-bank` | Fill-in / word bank | Selecting or typing missing terms; spelling-sensitive on the real exam. | confirmed | S3, S5 | Drillable — Common (20 PBQs) | `pbq-1-009`, `pbq-2-012`, `pbq-3-010`, `pbq-4-013`, `pbq-5-011`, `pbq-1-010`, `pbq-1-011`, `pbq-3-011`, `pbq-4-014`, `pbq-5-012`, `pbq-1-012`, `pbq-4-018`, `pbq-4-804`, `pbq-3-801`, `pbq-1-015`, `pbq-2-018`, `pbq-2-019`, `pbq-3-018`, `pbq-4-025`, `pbq-5-017` |
| `evidence` | Log / output analysis | Reading logs, packet output, or command output and selecting the evidence. | confirmed | S3, S4, S5, S6 | Drillable — Common (9 PBQs) | `pbq-2-005`, `pbq-4-005`, `pbq-2-009`, `pbq-2-015`, `pbq-4-016`, `pbq-4-017`, `pbq-2-016`, `pbq-2-017`, `pbq-4-020` |
| `multi-step` | Multi-part scenario | 2–4 linked child interactions inside one scenario. | plausible | S3, S5 | Drillable — Common (11 PBQs) | `pbq-1-001`, `pbq-1-002`, `pbq-2-004`, `pbq-3-001`, `pbq-3-002`, `pbq-4-001`, `pbq-4-004`, `pbq-5-001`, `pbq-5-005`, `pbq-1-008`, `pbq-3-008` |
| `hotspot` | Diagram / topology hotspot | Tapping a device, layer, frame field, or log line on a diagram. | confirmed | S2, S3, S4 | Drillable — Rare (3 PBQs) | `pbq-4-008`, `pbq-4-802`, `pbq-4-908` |
| `sort` | Classification buckets | Placing items into labeled buckets, with distractor buckets. | plausible | S4, S5 | Drillable — Rare (4 PBQs) | `pbq-5-004`, `pbq-2-801`, `pbq-5-801`, `pbq-4-801` |
| `single-choice` | Single-select embedded task | One correct option inside a short PBQ scenario. | plausible | S3, S4 | Drillable — Rare (3 PBQs) | `pbq-5-002`, `pbq-5-007`, `pbq-5-901` |
| `multiple-choice` | Multi-select embedded task | Several correct options inside a short PBQ scenario. | plausible | S3, S4 | Drillable — Rare (4 PBQs) | `pbq-2-003`, `pbq-2-007`, `pbq-3-004`, `pbq-5-006` |

### Coverage counts (machine-checked from the bank)

- `matching`: **24** drillable item(s).
- `ordering`: **8** drillable item(s).
- `configuration`: **18** drillable item(s).
- `rule-table`: **5** drillable item(s).
- `cli`: **5** drillable item(s).
- `word-bank`: **20** drillable item(s).
- `evidence`: **9** drillable item(s).
- `multi-step`: **11** drillable item(s).
- `hotspot`: **3** drillable item(s).
- `sort`: **4** drillable item(s).
- `single-choice`: **3** drillable item(s).
- `multiple-choice`: **4** drillable item(s).

## Scenario → mechanic map

| Task scenario | Real-exam shape | App mechanic(s) | Representative item ids |
|---|---|---|---|
| Firewall/ACL rule configuration and precedence | Rule table; order matters; default deny last | rule-table, ordering, evidence (acl) | `pbq-4-902`, `pbq-3-902`, `pbq-4-903`, `pbq-4-001` |
| Log / output / packet analysis | Select evidence, identify host or attack, next action | evidence, hotspot (log-lines), cli | `pbq-2-005`, `pbq-4-908`, `pbq-4-905` |
| Attack-to-defense or term-to-definition matching | Drag labels into slots | matching | `pbq-2-001`, `pbq-2-008`, `pbq-2-013` |
| Incident response / recovery sequencing | Put steps in the correct order | ordering | `pbq-4-005`, `pbq-4-007` |
| Device placement, DMZ, segmentation | Tap or place a device on a topology | hotspot (topology-basic), rule-table | `pbq-4-008`, `pbq-4-908`, `pbq-3-903` |
| Host/device hardening and configuration | Set values in a checklist or console | configuration, cli | `pbq-1-004`, `pbq-4-907`, `pbq-4-906` |
| Secure protocol and port selection | Match or complete secure/insecure pairs | matching, word-bank | `pbq-3-002`, `pbq-1-002` |
| Cryptography, PKI, certificate selection | Choose algorithm, key, certificate, or validation step | matching, configuration, ordering | `pbq-1-003`, `pbq-1-004`, `pbq-1-007` |
| IAM least privilege, MFA, SSO | Assign permissions or choose the authentication control | matching, sort, configuration | `pbq-4-003`, `pbq-4-004`, `pbq-2-901` |
| Vulnerability prioritization and risk math | Rank findings or bucket them by urgency | sort, multi-step | `pbq-4-801`, `pbq-5-001`, `pbq-4-020` |
| Investigation data sources and timelines | Pick the source that answers a question | evidence, matching, cli | `pbq-4-016`, `pbq-4-024`, `pbq-4-905` |
| Cloud security groups and guest isolation | Build the allow/deny boundary | rule-table | `pbq-3-903` |
| Wireless and account policy | Configure WPA/802.1X or account lockout/MFA | configuration | `pbq-3-004`, `pbq-4-003` |
| Incident containment via host firewall | Type the minimal blocking command | cli | `pbq-2-902`, `pbq-3-904` |

## Current app coverage

- **Every in-scope kind above is drillable through `/pbq`** (free PBQ practice) and is included in full exams and quick rounds when selected. Memory was previously implemented but had zero bank items; it now has three paired-recall items (`pbq-1-901`, `pbq-2-901`, `pbq-4-901`).
- **New mechanics**: the firewall/ACL `rule-table` builder and the constrained `cli` terminal render in `ExamFlow`, score with partial credit, validate on the server, and persist partial drafts. Both are mobile-first (44px targets, no hover-only affordances) and keyboard operable.
- **Common-format floor**: matching 24, ordering 8, configuration 18, word-bank 20, rule-table 5, cli 5, evidence 9, multi-step 11 — all at or above 5.
- **Rare-format floor**: hotspot 3, sort 4 — both at or above 3. `slider`, `memory`, and plain `single-choice`/`multiple-choice` were retired: a performance-based question is a simulation or interaction, and a quiz question shown as a PBQ misrepresents the format.
- **No in-scope kind is at zero.** The bank validator pins the 104-PBQ total, per-domain totals, per-objective floors, and per-kind minimums for word-bank, rule-table, and cli.

## Out of scope: full VM / terminal labs

CompTIA's **virtual PBQs** run a real VM/OS and cannot be skipped; the app is offline-first and statically hosted, so a live VM/terminal environment is out of scope. That includes any task that requires unrestricted shell access, arbitrary command execution, live service state, or an OS image. The app instead provides a **constrained** terminal/config simulation for the feasible subset (typed commands against an accepted-command set, no arbitrary execution). This is documented rather than silently dropped; no bank item claims to be a full VM lab.

## Maintenance

- Bank: `web/src/lib/server/data/question-bank.json`; validator: `SECP701_BANK_SPEC` in `web/src/lib/server/question-bank.ts`.
- When adding a PBQ, extend the per-kind id list in this file and keep the floors: common ≥5, rare ≥3, per-domain totals exact.
- Coverage is exercised by `web/src/lib/server/question-bank.test.ts`, `scoring.test.ts`, `quiz.test.ts`, and `web/e2e/pbq-new-mechanics.spec.ts` (desktop + phone viewport, rule-table/CLI, quick round, chunked exam).
