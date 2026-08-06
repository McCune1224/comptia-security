# CompTIA A+ (V15) Course Creation — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.
>
> **Depends on:** Phase 0 (shared foundation) below + the profiles plan's Phase 0. Read `2026-08-05_profiles-multiuser-db-migration.md` §Phase 0 — the two plans share it; land it on `main` once, then fork worktrees.

**Goal:** Add the CompTIA A+ certification to the course app as **two new courses** — Core 1 (220-1201) and Core 2 (220-1202) — with the full Security+ feature set: structured weekly course, lessons/study guides, per-domain quizzes, performance-based questions, full-length timed exam simulations, domain questions, mastery matrix, daily review, and gradebook/readiness.

**Architecture:** Everything reuses the proven Security+ machinery. Each A+ core is a `CourseDefinition` registered in the shared course registry, backed by its own question bank JSON + validator constants + authoring scripts. Content is authored via the established Python merge-script pipeline (`bank-lib.py` pattern) with locked-count validation. **All questions are original** — external sources are used for topic maps, format reference, and fact-checking only (never copied verbatim; braindumps are off-limits per CompTIA policy).

**Tech Stack:** SvelteKit 5 (runes), better-sqlite3, Python authoring scripts, vitest. Existing patterns: `question-bank.ts` validator, `expand-*.py` merge scripts, `course.ts` definition, 4-file bank expansion process (see sveltekit-app-development skill §Content-bank expansion).

---

## Verified exam research (authoritative, Aug 2026)

### ⚠️ Version decision: target V15 (220-1201 / 220-1202) — the 1101/1102 series is DEAD

- **220-1101 / 220-1102 (V14) retired September 25, 2025** (English). Confirmed by CompTIA and multiple training vendors. Do NOT build content for it.
- **V15 launched March 25, 2025**; estimated retirement ~September 2028 (CompTIA "usually three years after launch"). ~2 years of runway from now. **Must pass both cores from the same version** ("no mixing allowed").

### Core 1 — 220-1201 (Exam Objectives doc Version 2.0)

- **90 questions max / 90 minutes. Passing score 675 on 100–900 scale.**
- Question types: single & multiple response MCQ, drag-and-drop, performance-based questions (PBQs).
- **Domains (27 objectives across 5 domains):**

| Domain | Weight | Objectives | Objective count |
|---|---|---|---|
| 1.0 Mobile Devices | 13% | 1.1–1.3 | 3 |
| 2.0 Networking | 23% | 2.1–2.8 | 8 |
| 3.0 Hardware | 25% | 3.1–3.8 | 8 |
| 4.0 Virtualization and Cloud Computing | 11% | 4.1–4.2 | 2 |
| 5.0 Hardware and Network Troubleshooting | 28% | 5.1–5.6 | 6 |

- Notable: the troubleshooting *methodology* (identify → theory → test → plan → verify → document) is **not tested** in V15 — it's a competency standard only. Don't author methodology questions as a separate objective.
- Objective 1.1 covers laptop hardware replacement (battery, keyboard, RAM, HDD/SSD, wireless cards, biometrics/NFC scanner, Wi-Fi antenna, camera, mic). Sample objective titles: 2.1 "Compare and contrast TCP/UDP ports, protocols, and their associated ports", 3.2 "Summarize basic cable types and connectors", 5.6 "Given a scenario, troubleshoot printers".

### Core 2 — 220-1202 (Objectives doc Version 4.0)

- **90 questions max / 90 minutes. Passing score 700 on 100–900 scale.**
- Question types: same mix.
- **Domains (30 objectives across 4 domains):**

| Domain | Weight | Objectives | Objective count |
|---|---|---|---|
| 1.0 Operating Systems | 28% | 1.1–1.11 | 11 |
| 2.0 Security | 28% | 2.1–2.11 | 11 |
| 3.0 Software Troubleshooting | 23% | 3.1–3.4 | 4 |
| 4.0 Operational Procedures | 21% | 4.1–4.8 | 8 |

- Windows scope: Windows 10 + 11 (up to end of Mainstream Support); objectives not version-pinned can include both. Sample objective titles: 1.4 "Given a scenario, use Microsoft Windows operating system features and tools" (Task Manager, msconfig, Disk Management, cleanmgr, dfrgui…), 2.6 "Given a scenario, implement procedures for basic SOHO malware removal" (the 9-step removal process — good ordering-PBQ material), 4.6 "Explain the importance of prohibited content/activity and privacy, licensing, and policy concepts" (AUP, PII, GDPR, EULA…), plus a scripting basics objective (PowerShell/cmd/batch) and a **basic AI concepts** objective (new in V15 — retrieval-augmented generation, hallucinations, deepfakes, LLM ethics).

### Readiness thresholds for the app

`computeReadiness` pass mark per course: Security+ 750/900 (83.3%), **A+ Core 1 675/900 (75%)**, **A+ Core 2 700/900 (77.8%)** — wire from `COURSE_META.passingScore`, not a constant.

---

## Content sources & ethics

### Authoring rule (non-negotiable)
**Every question, lesson, and explanation is ORIGINAL text.** External sources supply: (a) the authoritative topic skeleton (objectives PDFs), (b) per-objective topic maps (Messer's free video index, ExamCompass quiz topics), (c) format exemplars (how PBQs/quizzes are phrased on the real exam), (d) fact-checking (ports, connectors, commands, specs). Never copy question text from any vendor, never reproduce Messer's paid course notes PDF, never use braindump/leaked items (CompTIA revokes certs for it — and it's their IP).

### Source table

| Source | What we take | What we don't | Status |
|---|---|---|---|
| **CompTIA official exam objectives PDFs (220-1201 v2.0, 220-1202 v4.0)** | Domains, objective IDs/titles, weights, acronym list, exam specs — the authoritative skeleton | — | ✅ Downloaded to `/tmp/aplus-220-1201-objectives.pdf`, `/tmp/aplus-220-1202-objectives.pdf`; copy into repo root (convention: `CompTIA_A+_220-1201_Exam_Objectives.pdf` next to the SY0-701 PDFs) |
| **Professor Messer** (professormesser.com) | Free training-course **index pages** = per-objective video titles → topic map (what each objective covers, in what order); free study-group sample questions as **format reference** | Paid "Course Notes" PDF (57pp, don't reproduce); video transcripts; question text | 1201 index cached at `~/.hermes/cache/web/www.professormesser.com-6cdbbe0dad.md`; scrape 1202 index during implementation |
| **ExamCompass** (examcompass.com) | Free practice-test **topic index** (e.g. "TCP & UDP Ports Quiz", "Change Management Procedures Quiz", acronym quizzes) → topic cross-check + question-format patterns; official objectives PDFs hosted there | Question text | Index cached at `~/.hermes/cache/web/www.examcompass.com-08e290df23.md` |
| **Crucial Exams** (crucialexams.com) | Free 220-1201/1202 practice tests + 7 PBQs per core — format/topic reference | Question text | URL-known; fetch index at implementation |
| **Jason Dion / Mike Meyers / freeCodeCamp full A+ courses** | Free YouTube previews/full courses — topic coverage cross-check | Paid courseware text | URL-known |
| **r/CompTIA + test-taker reports** | Which PBQ formats/shapes actually appear (drag-drop, ordering, multi-select counts, partial credit behavior) | Specific items | Search at implementation |
| **Community Anki decks / Quizlet** | Topic prompts for card authoring (repo already has `anki/AI Security+/` CSVs as the pattern) | Card text verbatim | Author own cards |
| **CompTIA official sample questions** (comptia.org) | A handful of officially published sample items — legit format exemplars | — | 2–3 per core, cite as `comptia` SourceRef |

### PBQ formats on the real A+ (from vendor + test-taker reports)
Drag-and-drop matching (ports↔protocols, connectors↔uses, Windows tools↔functions), ordering (troubleshooting steps, SOHO malware-removal steps, printer maintenance sequence), multi-select "Which TWO", configuration dropdowns (Windows settings, security settings on SOHO routers), and short simulations. **All 12 existing kinds in the app already cover these** (matching, ordering, configuration, evidence, numeric, multi-step, fill-blank, word-bank) — no new question kind needed. PBQs award partial credit — the scoring engine already does this.

---

## Phase 0 — Shared foundation (land on `main` FIRST)

Identical to the profiles plan's Phase 0 (multi-course registry, generalized types, per-course domains/weights, registry-driven seeding). The A+ worktree assumes it exists. Do NOT start Phase 1 below until Phase 0 is on `main`.

---

## Phase 1 — Repo assets + research notes

### Task 1.1: Objectives PDFs into the repo

```bash
mkdir -p /home/mckusa/Documents/comptia-security  # root, next to SY0-701 PDFs
cp /tmp/aplus-220-1201-objectives.pdf /home/mckusa/Documents/comptia-security/"CompTIA_A+_220-1201_Exam_Objectives.pdf"
cp /tmp/aplus-220-1202-objectives.pdf /home/mckusa/Documents/comptia-security/"CompTIA_A+_220-1202_Exam_Objectives.pdf"
```
(The SY0-701 PDFs sit in the repo root as `CompTIA_Security_SY0-701_Exam_Objectives.pdf` — same convention.)

### Task 1.2: Extract the authoritative skeleton to code

**Files:** Create `web/scripts/aplus-objectives.py`; Create `web/src/lib/server/aplus-meta.ts` (or fold into `COURSE_META`)

- Parse both PDFs (pdftotext is available; two-column layout needs care — objective IDs appear as `X.Y` on their own line, titles on following lines; see extraction notes in `/tmp/aplus-1201.txt`, `/tmp/aplus-1202.txt`) → emit `COURSE_META['aplus-1201']` and `['aplus-1202']`: `domains`, `domainWeights`, `objectives: Record<domain, ObjectiveId[]>` (27 + 30 ids), plus the **acronym list** from each PDF's appendix (A+ has its own ~90-item acronym list — same as SY0-701's).
- Verify counts in the script output before touching TS (echo the per-domain objective counts; expect 3/8/8/2/6 and 11/11/4/8).

### Task 1.3: Research notes reference

**Files:** Create `web/scripts/aplus-exam-research.md` (repo copy) — mirror the verified facts from the header of this plan (exam specs, weights, thresholds, PBQ formats, version decision). The skill-side copy of `sy0-701-exam-research.md` is the pattern; keep the canonical research in the repo so worktrees can read it.

### Task 1.4: Commit

```bash
git add "CompTIA_A+_220-1201_Exam_Objectives.pdf" "CompTIA_A+_220-1202_Exam_Objectives.pdf" web/scripts/aplus-objectives.py web/scripts/aplus-exam-research.md web/src/lib/server/aplus-meta.ts
git commit -m "feat(aplus): official objectives assets + extracted 1201/1202 skeletons (27+30 objectives)"
```

---

## Phase 2 — Topic maps (the scraping pass)

### Task 2.1: Professor Messer index → topic map

**Files:** Create `web/scripts/scrape-aplus-topics.py`

- Fetch `https://www.professormesser.com/free-a-plus-training/220-1201/220-1201-video/220-1201-training-course/` and the 220-1202 equivalent (same URL shape). Parse the `### X.Y – Title` objective headers and `#### Video Title (MM:SS)` entries (already proven parseable — 1201 cache has 28 `###` sections and per-video titles).
- Output `web/scripts/data/aplus-topics-1201.json` / `aplus-topics-1202.json`: `{ objectiveId, title, topics: [video titles] }`.
- **Legal line:** video titles are public page structure (not the videos/notes themselves) — fine to scrape and cite. Never scrape his paid notes or video transcripts.

### Task 2.2: ExamCompass topic cross-check

- Scrape the free-practice index (cached: `~/.hermes/cache/web/www.examcompass.com-08e290df23.md`) → topic quiz titles per core → merge into the topic map as a coverage cross-check (if ExamCompass has a quiz on it and Messer covers it, it's exam-relevant).

### Task 2.3: Gap-check the topic map

For each objective: topic count ≥ 3 (Messer alone gives 63 videos over 27 objectives for Core 1, ~69 for Core 2 — plenty). Flag thin objectives (< 3 topics) as authoring attention areas. Save the gap report into the research notes.

---

## Phase 3 — Core 1 (220-1201) content authoring

*Repeat the Security+ 4-file process per course: data JSON → validator constants → bank test → types. All authoring via Python merge scripts.*

### Task 3.1: Bank scaffold + validator

**Files:** Create `web/src/lib/server/data/aplus-1201-bank.json` (empty `{mcqs: [], pbqs: []}`); Modify `web/src/lib/server/question-bank.ts`; Create `web/src/lib/server/bank-aplus-1201.ts`

- Generalize the validator: `validateQuestionBank(bank, courseId)` with per-course constants keyed by `courseId` (`mcqObjectiveTotals`, `pbqTotals`, id-prefix check `a1-`). Existing Security+ validation unchanged.
- Per-domain MCQ quota (baseline **150 MCQs**, proportional to weights): D1 Mobile 13% → **20**, D2 Networking 23% → **34**, D3 Hardware 25% → **38**, D4 Virtualization/Cloud 11% → **16**, D5 Troubleshooting 28% → **42**. (Security+ is 300; 150 per core is a credible v1 baseline, expandable later via merge scripts.)
- PBQ baseline: **20 per core**, ≥1 per domain, ≥1 fill of every PBQ kind that fits (matching, ordering, configuration, evidence, numeric, multi-step, fill-blank, word-bank).

### Task 3.2: Authoring scripts + MCQs

**Files:** Create `web/scripts/aplus-lib.py` (extend `bank-lib.py` pattern: `load_bank`, `merge`, `opt`, `q()`); Create `web/scripts/expand-aplus-1201-d1.py` … `d5.py`

- Author 150 original scenario-format MCQs (Security+ style: real terms as distractors, "Which TWO" multi-selects with 5–6 options + `selectCount: 2`, best/MOST/FIRST constraints). ID prefix `a1-`. Include `explanation` + `sourceRefs` (`{source: 'comptia', section: '2.1'}` or `{source: 'professor-messer', section: '220-1201 2.1 Ports and Protocols'}`).
- **Hardware-heavy content needs facts right:** connector/pin tables (USB-A/C, HDMI, DisplayPort, VGA, RJ-45, RJ-11, SATA, M.2, PCIe lanes, Molex, 4/8-pin EPS), port numbers (the A+ list: 21/22/23/25/53/67-68/80/110/143/389/443/445/3389…), RAM types/DDR speeds, storage (HDD vs SSD vs NVMe, RAID 0/1/5/10), printer types (laser/inkjet/impact/thermal + maintenance), display tech (LCD vs OLED, resolution/pixel density), power (PSU ratings, 80 Plus). Cross-check against the objectives PDF + topic map.

### Task 3.3: PBQs

**Files:** Create `web/scripts/expand-aplus-1201-pbqs.py`

- 20 PBQs. Strong candidates from the objectives:
  - **ordering:** laser printer maintenance/toner steps; troubleshooting methodology steps are NOT tested (skip); SOHO setup sequence; data destruction order (drive wipe → degauss → shred vs recycle).
  - **matching:** connector↔use (HDMI↔AV, RJ-45↔Ethernet, SATA↔storage…), port↔protocol (the A+ port list), Windows tool↔function (Task Manager↔performance, msconfig↔startup, Disk Management↔partitions), cloud model↔description (IaaS/PaaS/SaaS), virtualization term↔definition.
  - **configuration:** BIOS/UEFI settings (boot order, secure boot, TPM, XMP, virtualization), SOHO router security settings (WPA2/WPA3, SSID broadcast, firmware, admin password, port forwarding off).
  - **evidence:** interpret a `ping`/`tracert`/`ipconfig` output (which command output is this, what fault does it show — e.g., TTL expired = hop limit, 100% loss = no route), BSOD/error code → likely component.
  - **numeric:** memory/PSU math (e.g., required RAM given board spec, RAID capacity: 3×1TB RAID 5 = 2TB usable), display resolution math.
  - **multi-step:** printer troubleshooting walkthrough (paper jam → check rollers → replace → test), network drop (check link light → ping gateway → ping DNS → check cable).
  - **fill-blank/word-bank:** acronym drills from the 1201 acronym list (SOHO, NIC, IPS, PoE, RAID, M.2, NVMe, SSD, HDMI, LCD, OLED, PSU, UPS, DHCP, DNS, NAT, PAT, SSID, WPA, MAC, LED, AP, WAN, LAN, VPN…).

### Task 3.4: Validator constants + tests lockstep

**Files:** Modify `web/src/lib/server/question-bank.ts` (per-course constants); Create `web/src/lib/server/question-bank-aplus-1201.test.ts`

- Set `mcqObjectiveTotals` per objective (sum = 150), PBQ total = 20, unique-ID check, prefix check.
- Test hard-codes `toHaveLength(150)` / `toHaveLength(20)` + unique-ID total — same pattern as `question-bank.test.ts`.
- Run the merge scripts, then the count-check script output, THEN update TS constants (never the reverse).

### Task 3.5: Lessons/study guides

**Files:** Modify `web/src/lib/server/course.ts` (add `aplus-1201` to `COURSES` — modules/lessons/assignments)

- 4 weekly modules mirroring Security+ pacing (e.g., W1 Hardware & Mobile, W2 Networking & Virtualization, W3 Troubleshooting practice, W4 final review), 7 lessons, 12 assignments (per-domain quizzes 20Q, PBQ sets, scenario sets, 90-Q full exams with `mode: 'exam'`, `durationMinutes: 90`).
- Lesson content = dense reference (existing style): connector tables, port tables, command tables, troubleshooting decision trees, printer/display/mobile fault→cause→fix tables, "exam traps", 3 sample Qs per lesson. **Interaction > reading** (user preference): keep lessons skim-able, lean on the question bank for recall.
- Assignment IDs prefixed `a1-` (globally unique across courses). `dueOffsetDays` anchored to the Core 1 exam date.

### Task 3.6: Verify Core 1

```bash
cd web && npm run check && npm test && npm run build
# seeded course appears: GET /api/course/overview with cookie course_id=aplus-1201
```
Headless screenshot: syllabus, mastery grid (27 cells), one full exam flow.

---

## Phase 4 — Core 2 (220-1202) content authoring

Repeat Phase 3 with these deltas:

- **IDs prefixed `a2-`**; bank `aplus-1202-bank.json`; validator constants sum = **150 MCQs, 20 PBQs** across **4 domains** (OS 28% → 42, Security 28% → 42, SW Troubleshooting 23% → 34, Operational Procedures 21% → 32).
- **Domain count is 4, not 5** — `COURSE_META.domains = [1,2,3,4]`; gradebook/readiness/quiz-completion loops must use per-course domains (foundation Phase 0 handles this).
- Content emphasis: Windows 10/11 tools (Task Manager, msconfig, Disk Management, Device Manager, Event Viewer, cleanmgr, dfrgui, sfc, DISM, chkdsk, gpupdate, regedit), OS install/upgrade paths, macOS/Linux tools (Finder, Terminal, chmod, grep, apt), malware removal 9-step SOHO process (ordering PBQ!), security best practices (data destruction, password mgmt, MFA, backups), wireless security (WPA2/WPA3, 802.1X), operational procedures (documentation, change management, ticketing, safety/ESD, licensing/EULA/GDPR/PII, communication/professionalism, **scripting basics**, **basic AI concepts** — RAG, hallucinations, deepfakes).
- Acronym word-bank/fill-blank drills from the 1202 acronym list.

---

## Phase 5 — Integration + full verification

### Task 5.1: Course switcher completion

The course switcher (profiles worktree) lists `ACTIVE_COURSES` — this branch appends `'aplus-1201' | 'aplus-1202'` to it. If the profiles worktree hasn't landed yet, Phase 0's `ACTIVE_COURSES` already renders all three; verify each course's home/syllabus/mastery/gradebook/review pages render with correct data (exam dates independent, readiness thresholds 675/700).

### Task 5.2: Full verification pass

```bash
cd web && npm run check && npm test && npm run build
```
- `question-bank-aplus-1201.test.ts` + `-1202` pass with locked counts.
- Smoke via API on a throwaway DB (`QUIZ_DB_PATH=/tmp/smoke-aplus.db`): start/answer/complete a full 90-Q exam for each core; verify gradebook submission + readiness uses 675/700 thresholds.
- Headless screenshots (390×844 mobile + desktop) of: home (A+ Core 1 countdown), syllabus, mastery (27-cell / 30-cell grids), a PBQ (ordering), full-exam flow, review queue.
- Update `web/AGENTS.md` (course list, bank totals, version note).

### Task 5.3: Land the worktree

From PRIMARY worktree: merge, verify, push. If the profiles branch also landed: resolve any `seedCourse`/`ACTIVE_COURSES` conflict by keeping both.

---

## Risks & tradeoffs

| Risk | Mitigation |
|---|---|
| A+ content is 2× Security+ volume (2 cores) | Ship Core 1 first as a complete course (Phase 3 → verify), then Core 2; baseline 150/20 per core is expandable via the same merge-script pipeline (Security+ grew 280→300→315 the same way). |
| Hardware/OS facts drift or are wrong | Every fact-heavy table (ports, connectors, commands) cross-checked against the objectives PDFs + topic map; numeric PBQs double-checked (the 9000-vs-90000 class of slip is a known pitfall — see skill). |
| Merge conflict with profiles worktree | Phase 0 shared foundation on main first; this branch is additive (new files + registry append); resolve `ACTIVE_COURSES`/`seedCourse` manually if both land. |
| Copying vendor text by accident | Hard rule + review pass: every authored question must be unique text (grep distinctive phrases from source pages during review — see Task 2.2/2.3 audit step); braindumps never. |
| 90-Q full exams exhaust a 150-MCQ bank | Sessions draw by domain quota; with 150 MCQs + 20 PBQs per core, two distinct 90-Q exams are drawable (same as Security+ at 300). Flag low-coverage objectives from the gap report for early expansion. |

## Open questions for the user

1. A+ lesson content depth: same dense reference style as Security+ lessons, or slightly lighter (A+ is more hands-on; user preference is interaction > reading)? Plan default: same style, more tables/diagrams, fewer paragraphs.
2. Should the app show a combined "A+ progress" view (both cores) on the home page, or keep cores fully independent? Plan default: independent for v1.
3. Bank volume: start at 150 MCQs/core (ship sooner, expand later) or push for 200+/core before first release? Plan default: 150.
