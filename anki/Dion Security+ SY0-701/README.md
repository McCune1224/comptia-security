# Dion Training Security+ SY0-701 — Anki Decks

Flashcards rebuilt from the Dion Training "CompTIA Security+ (SY0-701) Study Guide"
(study notes PDF). Replaces the older V1/V2/V3 decks in `anki/AI Security+`.

## Files

| File | Contents | Approx. cards |
| ---- | -------- | ------------- |
| `01_Domain1_General_Security_Concepts.csv` | CIA/AAA, controls, zero trust, threat actors, social engineering, malware, physical security, data, crypto concepts | 150 |
| `02_Domain2_Risk_Governance_Compliance.csv` | Risk math, supply chain, governance, policies, change management, audits & pentests | 50 |
| `03_Domain3_Security_Architecture.csv` | HA/resilience, cloud, network, firewalls, IDS/IPS, appliances, secure protocols, wireless | 95 |
| `04_Domain4_Security_Operations.csv` | IAM, vulnerabilities, attacks, hardening, wireless auth, vuln management, monitoring, incident response, forensics, automation | 130 |
| `05_Domain5_Security_Program_Management.csv` | Awareness, insider threats, policies, security culture | 20 |
| `06_Ports_and_Protocols.csv` | Port ↔ protocol, both directions, plus port ranges | 66 |
| `07_Crypto_Algorithms.csv` | Algorithm key/block sizes and properties | 30 |
| `08_Acronyms.csv` | Acronym expansions (exam loves these) | 130 |

## Card design

- **Atomic recall** — front asks one specific fact; back is a one-line answer
  (no paragraph answers to re-read).
- **Enumeration cards** are explicit: "Name the N …" so they're easy to recognize.
- **No duplicate content** between decks: crypto *concepts* live in Domain 1,
  crypto *algorithm facts* in `07`, port *numbers* only in `06`.
- **Tags** are hierarchical: `secp701::d1::cia`, `secp701::ports`, `secp701::crypto`,
  `secp701::acronyms` — filter or suspend whole topics in Anki.

## Import into Anki

1. Anki → **Import File** (or `File > Import`).
2. Pick a CSV. Format: **Basic**, field mapping `Front` → Front, `Back` → Back,
   `Tags` → Tags (Anki detects headers automatically).
3. Import into a deck named e.g. `Dion Security+ SY0-701::01 Domain 1`.
4. Repeat per file (or merge all into one deck — tags keep topics separated).

## Differences vs the old decks

- Old decks used "What is X?" with long definition answers (recognition, not recall).
- New decks favor recall: port ↔ number, acronym ↔ expansion, "which control type",
  formulas (ALE = SLE × ARO), process phases (7-phase incident response).
- Facts are grounded in the Dion study guide (e.g. the guide's port table,
  algorithm table, and control/risk terminology).
