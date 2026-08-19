# A+ (CompTIA) — Real Exam Research Notes (V15, verified Aug 2026)

Repo copy of the canonical research for the A+ V15 course work. Condensed from the
official CompTIA objectives PDFs (220-1201 v2.0, 220-1202 v4.0 — both in the repo
root), Professor Messer / ExamCompass / Crucial Exams indexes, and test-taker
reports. Use to author exam-aligned A+ bank content — never to reproduce leaked
items or vendor question text (CompTIA IP / braindump policy).

## Version decision: target V15 (220-1201 / 220-1202) ONLY

- **220-1101 / 220-1102 (V14) retired September 25, 2025** (English). Dead — do not build for it.
- **V15 launched March 25, 2025**; estimated retirement ~September 2028. Must pass both cores
  from the SAME version ("no mixing allowed").

## Core 1 — 220-1201 (Objectives doc Version 2.0)

- **Max 90 questions / 90 minutes. Passing score 675 on 100–900 scale.**
- Types: single + multiple response MCQ, drag-and-drop, performance-based questions (PBQs).
- **Domains (27 objectives across 5 domains):**

| Domain                                   | Weight | Objectives | Objective count |
| ---------------------------------------- | ------ | ---------- | --------------- |
| 1.0 Mobile Devices                       | 13%    | 1.1–1.3    | 3               |
| 2.0 Networking                           | 23%    | 2.1–2.8    | 8               |
| 3.0 Hardware                             | 25%    | 3.1–3.8    | 8               |
| 4.0 Virtualization and Cloud Computing   | 11%    | 4.1–4.2    | 2               |
| 5.0 Hardware and Network Troubleshooting | 28%    | 5.1–5.6    | 6               |

- **The troubleshooting methodology (identify → theory → test → plan → verify → document) is
  NOT tested in V15** — competency standard only. Don't author methodology questions.
- 5.2 is "Given a scenario, troubleshoot drive and RAID issues" (NOT a separate "storage"
  objective — storage symptoms like S.M.A.R.T./IOPS fold into 5.2).

## Core 2 — 220-1202 (Objectives doc Version 4.0)

- **Max 90 questions / 90 minutes. Passing score 700 on 100–900 scale.**
- **Domains (36 objectives across 4 domains — NOTE: the older plan's "30 objectives"
  count is stale; v4.0 of the doc has 4.1–4.10 in Domain 4):**

| Domain                       | Weight | Objectives | Objective count |
| ---------------------------- | ------ | ---------- | --------------- |
| 1.0 Operating Systems        | 28%    | 1.1–1.11   | 11              |
| 2.0 Security                 | 28%    | 2.1–2.11   | 11              |
| 3.0 Software Troubleshooting | 23%    | 3.1–3.4    | 4               |
| 4.0 Operational Procedures   | 21%    | 4.1–4.10   | 10              |

- Windows scope: Windows 10 + 11 (up to end of Mainstream Support).
- Notable objectives: 2.6 SOHO malware removal 9-step process (ordering-PBQ material),
  4.8 scripting basics (PowerShell/cmd/batch), 4.9 remote access technologies,
  4.10 **basic AI concepts** (new in V15: RAG, hallucinations, deepfakes, LLM ethics).
- 3.2 and 3.3 are both mobile-OS objectives (application issues; application SECURITY
  issues) — easy to confuse; keep them distinct in the bank.

## App integration facts

- Readiness thresholds: Core 1 675/900 (75%), Core 2 700/900 (77.8%) — wire from
  COURSE_META.passingScore, not the Security+ 750 constant.
- Both A+ cores are separate `CourseDefinition`s in the course registry ('aplus-1201',
  'aplus-1202') — each has its own exam date, syllabus, gradebook, mastery grid.
- A+ objective ids include two-digit suffixes (1.10, 1.11, 2.10, 2.11) — quiz objective
  validation regex must be `/^[1-5]\.[1-9]\d?$/` (done in multi-course foundation).
- Core 2 has FOUR domains — gradebook/readiness/quiz-completion loops must use
  per-course domain lists (foundation: ExamConfig + computeReadiness domains param).

## Authoring quotas (baseline v1)

- **Core 1 bank: 150 MCQs + 20 PBQs.** MCQ per-domain: D1 20, D2 34, D3 38, D4 16, D5 42.
- **Core 2 bank: 150 MCQs + 20 PBQs.** MCQ per-domain: D1 42, D2 42, D3 34, D4 32.
- IDs: `a1-<domain>-<nnn>` MCQs / `a1-pbq-<domain>-<nnn>` PBQs for Core 1; `a2-…` for Core 2.
- 90-Q full exam quotas: Core 1 (5 domains) 12/21/22/10/25; Core 2 (4 domains) 25/25/21/19.

## Legit free sources (topic maps + format reference only — author ORIGINAL questions)

1. **Official objectives PDFs** (repo root) — domains, objective titles, acronym list
   (~168 for Core 1, ~201 for Core 2 — two-column acronym:definition pairs), exam specs.
2. **Professor Messer** (professormesser.com) — free training-course INDEX pages list every
   objective with per-video titles → topic map. His course notes PDF is PAID — never scrape/
   reproduce it. Videos free to watch.
3. **ExamCompass** (examcompass.com) — free practice tests organized by exam topic (e.g.
   "TCP & UDP Ports Quiz", "Change Management Procedures Quiz") + acronym quizzes. Topic
   cross-check + format patterns.
4. **Crucial Exams** (crucialexams.com) — free 220-1201/1202 practice tests (1000 Q + 7 PBQs
   per core claimed) — format/topic reference.
5. **r/CompTIA test-taker reports** — PBQ shapes that actually appear (drag-drop matching,
   ordering, multi-select, configuration dropdowns, partial credit).

## A+ PBQ shapes (map cleanly onto the app's 12 existing kinds)

- Drag-and-drop matching: connector↔use, port↔protocol, Windows tool↔function, cloud
  model↔description, virtualization term↔definition.
- Ordering: SOHO malware removal steps (2.6 — 9 steps), laser printer maintenance, data
  destruction order.
- Configuration: BIOS/UEFI settings, SOHO router security settings, Windows settings.
- Evidence: interpret ping/tracert/ipconfig output, BSOD/error code → likely component.
- Numeric: RAID capacity math, RAM/PSU specs. Fill-blank/word-bank: acronym drills.

## Topic maps (Phase 2 output)

- `web/scripts/data/aplus-topics-1201.json` — 27 objectives, 62 Messer video topics.
- `web/scripts/data/aplus-topics-1202.json` — 36 objectives, 74 Messer video topics.
- Gap report: every objective has ≥1 dedicated video (Messer's videos are long-form and
  cover the full objective, e.g. Troubleshooting Hardware 25:15), and ExamCompass runs a
  topic quiz for every objective on both cores — full coverage, no thin objectives.
- ExamCompass cross-check quiz titles per core confirm topic relevance (see cached index):
  Core 1 covers mobile servicing/connection/accessories, ports, wireless, services, config,
  hardware, IP addressing, connection/network types, tools, displays, cabling/connectors,
  RAM, storage, motherboard, BIOS, CPU, PSU, MFDs, printers, virtualization, cloud, and all
  six troubleshooting topics. Core 2 covers OS types, filesystems, boot, install methods,
  Windows editions/features/tools/settings/networking, macOS, Linux, physical/logical
  security, Windows security, NTFS/share permissions, AD, wireless security, malware,
  social engineering, malware removal, workstation/mobile/network security, data
  destruction, browser security, all four troubleshooting topics, ticketing, asset mgmt,
  change mgmt, backup/recovery, safety, environmental, incident response, licensing,
  regulated data, communication, scripting, remote access, and AI basics.
