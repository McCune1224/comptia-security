#!/usr/bin/env python3
"""Expand PBQs with interactive kinds: fill-blank, word-bank, mix-and-match matching (+14)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import importlib
banklib = importlib.import_module("bank-lib")
load_bank = banklib.load_bank
merge = banklib.merge

R = lambda obj, sec=None: [
    {"source": "exam-objectives", "section": f"Objective {obj}"},
    {"source": "study-guide", "section": sec or "Performance-Based Questions"},
]

NEW = []

# ================= FILL-BLANK (+5) =================
NEW.append({
    "id": "pbq-1-009", "domain": 1, "objective": "1.4", "format": "pbq", "kind": "fill-blank",
    "prompt": "Complete each statement about cryptography by typing the missing term.\n\n1. The cipher that uses the same key to encrypt and decrypt is called ____ encryption.\n\n2. A ____ is a one-way mathematical function used to verify data integrity.\n\n3. The protocol that provides confidentiality, integrity, and authentication for web traffic is ____.\n\n4. Adding a random value to each password before hashing is called ____.",
    "context": "Type your answer in each blank. Spelling must be exact (case-insensitive).",
    "blanks": [
        {"id": "b1", "label": "1. Symmetric/Asymmetric?", "placeholder": "e.g., symmetric", "acceptedAnswers": ["symmetric", "symmetrical", "secret key"]},
        {"id": "b2", "label": "2. Integrity function", "placeholder": "e.g., hash", "acceptedAnswers": ["hash", "hash function", "hash algorithm", "cryptographic hash", "digest"]},
        {"id": "b3", "label": "3. Web security protocol", "placeholder": "e.g., TLS", "acceptedAnswers": ["tls", "ssl/tls", "transport layer security", "https"]},
        {"id": "b4", "label": "4. Random value added to passwords", "placeholder": "e.g., salt", "acceptedAnswers": ["salt", "salting", "a salt", "random salt"]}
    ],
    "explanation": "Symmetric crypto uses one shared key; hashes provide one-way integrity; TLS secures web traffic; salting defeats rainbow tables and identical-password detection.",
    "sourceRefs": R("1.4")
})

NEW.append({
    "id": "pbq-2-012", "domain": 2, "objective": "2.4", "format": "pbq", "kind": "fill-blank",
    "prompt": "Complete each statement about common attacks by typing the missing term.\n\n1. An attack that tries a few common passwords against many accounts to avoid lockouts is called password ____.\n\n2. Reusing a captured login session to impersonate a user is called session ____.\n\n3. Forcing a client to use an older, weaker protocol version is a ____ attack.\n\n4. An attack that replays a previously captured authentication exchange is called a ____ attack.",
    "context": "Type your answer in each blank. Spelling must be exact (case-insensitive).",
    "blanks": [
        {"id": "b1", "label": "1. Many accounts, few passwords", "placeholder": "e.g., spraying", "acceptedAnswers": ["spraying", "password spraying"]},
        {"id": "b2", "label": "2. Stealing an active session", "placeholder": "e.g., hijacking", "acceptedAnswers": ["hijacking", "session hijacking", "hijack"]},
        {"id": "b3", "label": "3. Weaker protocol version", "placeholder": "e.g., downgrade", "acceptedAnswers": ["downgrade", "downgrade attack", "protocol downgrade", "version rollback"]},
        {"id": "b4", "label": "4. Replayed authentication", "placeholder": "e.g., replay", "acceptedAnswers": ["replay", "replay attack"]}
    ],
    "explanation": "Password spraying stays below lockout thresholds; session hijacking steals cookies/tokens; downgrade attacks force weak protocols (e.g., SSLv3/POODLE); replay attacks resend captured exchanges — blocked by nonces and timestamps.",
    "sourceRefs": R("2.4")
})

NEW.append({
    "id": "pbq-3-010", "domain": 3, "objective": "3.4", "format": "pbq", "kind": "fill-blank",
    "prompt": "Complete each statement about backups and disaster recovery by typing the missing term.\n\n1. The maximum acceptable amount of data loss, measured in time, is the recovery ____ objective (RPO).\n\n2. A backup that copies all changes since the last full backup is called a ____ backup.\n\n3. The maximum acceptable downtime before systems must be restored is the recovery ____ objective (RTO).\n\n4. A disaster recovery site that is fully equipped and continuously replicated, able to take over in minutes, is called a ____ site.",
    "context": "Type your answer in each blank. Spelling must be exact (case-insensitive).",
    "blanks": [
        {"id": "b1", "label": "1. RPO full word", "placeholder": "e.g., point", "acceptedAnswers": ["point"]},
        {"id": "b2", "label": "2. Since last full", "placeholder": "e.g., differential", "acceptedAnswers": ["differential"]},
        {"id": "b3", "label": "3. RTO full word", "placeholder": "e.g., time", "acceptedAnswers": ["time"]},
        {"id": "b4", "label": "4. Fastest failover site", "placeholder": "e.g., hot", "acceptedAnswers": ["hot", "hot site"]}
    ],
    "explanation": "RPO = max data loss (drives backup frequency); RTO = max downtime (drives recovery strategy). Differentials capture changes since the last full; hot sites are continuously replicated for near-zero downtime.",
    "sourceRefs": R("3.4")
})

NEW.append({
    "id": "pbq-4-013", "domain": 4, "objective": "4.6", "format": "pbq", "kind": "fill-blank",
    "prompt": "Complete each statement about identity and access management by typing the missing term.\n\n1. Proving who you are is called ____; determining what you may do is called ____.\n\n2. The AAA model's third 'A' — recording what users did — is ____.\n\n3. A system that lets users authenticate once and access many applications is called single ____-on (SSO).\n\n4. The protocol family that exchanges XML security assertions between an identity provider and a service provider is ____.",
    "context": "Type your answer in each blank. Spelling must be exact (case-insensitive).",
    "blanks": [
        {"id": "b1", "label": "1a. Proving identity", "placeholder": "e.g., authentication", "acceptedAnswers": ["authentication", "authn"]},
        {"id": "b2", "label": "1b. What you may do", "placeholder": "e.g., authorization", "acceptedAnswers": ["authorization", "authz"]},
        {"id": "b3", "label": "2. Third A of AAA", "placeholder": "e.g., accounting", "acceptedAnswers": ["accounting", "auditing", "audit"]},
        {"id": "b4", "label": "3. SSO full word", "placeholder": "e.g., sign", "acceptedAnswers": ["sign", "sign-on", "signon"]},
        {"id": "b5", "label": "4. XML assertions", "placeholder": "e.g., SAML", "acceptedAnswers": ["saml", "security assertion markup language"]}
    ],
    "explanation": "Authentication proves identity; authorization grants permissions; accounting logs activity (AAA). SSO means one sign-on; SAML (Security Assertion Markup Language) carries XML assertions between IdP and SP.",
    "sourceRefs": R("4.6")
})

NEW.append({
    "id": "pbq-5-011", "domain": 5, "objective": "5.2", "format": "pbq", "kind": "fill-blank",
    "prompt": "Complete each statement about risk management by typing the missing term.\n\n1. The expected monetary loss from a single occurrence of a risk is the single loss ____ (SLE).\n\n2. The number of times a risk is expected to occur each year is the annualized rate of ____ (ARO).\n\n3. SLE multiplied by ARO gives the annualized loss ____ (ALE).\n\n4. The risk that remains after controls are applied is called ____ risk.",
    "context": "Type your answer in each blank. Spelling must be exact (case-insensitive).",
    "blanks": [
        {"id": "b1", "label": "1. SLE full word", "placeholder": "e.g., expectancy", "acceptedAnswers": ["expectancy", "exposure"]},
        {"id": "b2", "label": "2. ARO full word", "placeholder": "e.g., occurrence", "acceptedAnswers": ["occurrence", "occurrence (aro)"]},
        {"id": "b3", "label": "3. ALE full word", "placeholder": "e.g., expectancy", "acceptedAnswers": ["expectancy"]},
        {"id": "b4", "label": "4. Risk after controls", "placeholder": "e.g., residual", "acceptedAnswers": ["residual", "residual risk"]}
    ],
    "explanation": "SLE = AV × EF; ARO = expected occurrences per year; ALE = SLE × ARO. Residual risk remains after controls; inherent risk exists before them.",
    "sourceRefs": R("5.2")
})

# ================= WORD BANK (+5) =================
NEW.append({
    "id": "pbq-1-010", "domain": 1, "objective": "1.2", "format": "pbq", "kind": "word-bank",
    "prompt": "Complete the CIA triad and related concepts by placing the correct word in each blank. Each word is used once.\n\n1. ____ ensures data is not disclosed to unauthorized parties.\n\n2. ____ ensures data has not been altered.\n\n3. ____ ensures systems are accessible when needed.\n\n4. ____ prevents a party from denying an action they performed.",
    "context": "Click a word, then click the blank where it belongs. Three extra words are distractors.",
    "blanks": [
        {"id": "b1", "label": "1. No unauthorized disclosure"},
        {"id": "b2", "label": "2. Not altered"},
        {"id": "b3", "label": "3. Accessible when needed"},
        {"id": "b4", "label": "4. Can't deny an action"}
    ],
    "bank": [
        {"id": "w1", "word": "Confidentiality"},
        {"id": "w2", "word": "Integrity"},
        {"id": "w3", "word": "Availability"},
        {"id": "w4", "word": "Non-repudiation"},
        {"id": "w5", "word": "Authentication"},
        {"id": "w6", "word": "Authorization"},
        {"id": "w7", "word": "Accounting"}
    ],
    "correctAssignments": {"b1": "w1", "b2": "w2", "b3": "w3", "b4": "w4"},
    "explanation": "CIA = Confidentiality, Integrity, Availability. Non-repudiation (digital signatures + logs) prevents denial of actions. Authentication/Authorization/Accounting are the AAA model.",
    "sourceRefs": R("1.2")
})

NEW.append({
    "id": "pbq-1-011", "domain": 1, "objective": "1.1", "format": "pbq", "kind": "word-bank",
    "prompt": "Classify each security control by placing the correct control type in each blank. Each type is used once.\n\n1. A firewall rule blocking inbound Telnet is a ____ control.\n\n2. A backup restore after ransomware is a ____ control.\n\n3. An IDS alert on suspicious traffic is a ____ control.\n\n4. Warning signage at the loading dock is a ____ control.",
    "context": "Click a word, then click the blank where it belongs. Two extra words are distractors.",
    "blanks": [
        {"id": "b1", "label": "1. Firewall rule"},
        {"id": "b2", "label": "2. Backup restore"},
        {"id": "b3", "label": "3. IDS alert"},
        {"id": "b4", "label": "4. Warning signage"}
    ],
    "bank": [
        {"id": "w1", "word": "Preventive"},
        {"id": "w2", "word": "Corrective"},
        {"id": "w3", "word": "Detective"},
        {"id": "w4", "word": "Deterrent"},
        {"id": "w5", "word": "Compensating"},
        {"id": "w6", "word": "Directive"}
    ],
    "correctAssignments": {"b1": "w1", "b2": "w2", "b3": "w3", "b4": "w4"},
    "explanation": "Firewall rules prevent; restores correct; IDS alerts detect; signage deters. Compensating substitutes for an unavailable primary control; directive guides behavior (policy).",
    "sourceRefs": R("1.1")
})

NEW.append({
    "id": "pbq-3-011", "domain": 3, "objective": "3.4", "format": "pbq", "kind": "word-bank",
    "prompt": "Complete each statement about backup strategies by placing the correct word in each blank. Each word is used once.\n\n1. A ____ backup copies all data every time it runs.\n\n2. A ____ backup copies changes since the last full backup (restore needs only the latest one).\n\n3. A ____ backup copies changes since the last backup of any type (restore needs every one since the last full).\n\n4. The 3-2-1 rule requires ____ copies of data.",
    "context": "Click a word, then click the blank where it belongs. Two extra words are distractors.",
    "blanks": [
        {"id": "b1", "label": "1. Copies everything"},
        {"id": "b2", "label": "2. Since last full, restore = latest only"},
        {"id": "b3", "label": "3. Since any last backup, restore = all"},
        {"id": "b4", "label": "4. 3-2-1 rule count"}
    ],
    "bank": [
        {"id": "w1", "word": "Full"},
        {"id": "w2", "word": "Differential"},
        {"id": "w3", "word": "Incremental"},
        {"id": "w4", "word": "Three"},
        {"id": "w5", "word": "Synthetic"},
        {"id": "w6", "word": "Five"}
    ],
    "correctAssignments": {"b1": "w1", "b2": "w2", "b3": "w3", "b4": "w4"},
    "explanation": "Full = everything; differential = since last full (restore = full + latest differential); incremental = since any last backup (restore = full + all incrementals). 3-2-1 = three copies, two media, one offsite.",
    "sourceRefs": R("3.4")
})

NEW.append({
    "id": "pbq-4-014", "domain": 4, "objective": "4.4", "format": "pbq", "kind": "word-bank",
    "prompt": "Complete each statement about monitoring and email/DNS security by placing the correct term in each blank. Each term is used once.\n\n1. ____ authenticates the sending mail server's IP via DNS TXT records.\n\n2. ____ cryptographically signs email with the sender's domain key.\n\n3. ____ tells receivers how to handle mail that fails SPF/DKIM checks.\n\n4. A ____ aggregates and correlates logs from many sources to detect attacks.",
    "context": "Click a term, then click the blank where it belongs. Two extra terms are distractors.",
    "blanks": [
        {"id": "b1", "label": "1. Sender IP authentication"},
        {"id": "b2", "label": "2. Domain-signed email"},
        {"id": "b3", "label": "3. Handling policy for failed checks"},
        {"id": "b4", "label": "4. Log aggregation platform"}
    ],
    "bank": [
        {"id": "w1", "word": "SPF"},
        {"id": "w2", "word": "DKIM"},
        {"id": "w3", "word": "DMARC"},
        {"id": "w4", "word": "SIEM"},
        {"id": "w5", "word": "DNSSEC"},
        {"id": "w6", "word": "SOAR"}
    ],
    "correctAssignments": {"b1": "w1", "b2": "w2", "b3": "w3", "b4": "w4"},
    "explanation": "SPF authorizes sender IPs; DKIM signs mail cryptographically; DMARC defines handling for failed checks (quarantine/reject). SIEM aggregates and correlates logs; SOAR automates response; DNSSEC protects DNS records.",
    "sourceRefs": R("4.4")
})

NEW.append({
    "id": "pbq-5-012", "domain": 5, "objective": "5.1", "format": "pbq", "kind": "word-bank",
    "prompt": "Complete each statement about governance roles by placing the correct role in each blank. Each role is used once.\n\n1. The ____ is accountable for the data and decides its classification.\n\n2. The ____ decides the purpose and means of processing personal data.\n\n3. The ____ processes data on behalf of the controller.\n\n4. The ____ implements the technical safeguards that protect the data.",
    "context": "Click a role, then click the blank where it belongs. Two extra roles are distractors.",
    "blanks": [
        {"id": "b1", "label": "1. Accountable for classification"},
        {"id": "b2", "label": "2. Decides purpose/means"},
        {"id": "b3", "label": "3. Processes on behalf"},
        {"id": "b4", "label": "4. Implements technical controls"}
    ],
    "bank": [
        {"id": "w1", "word": "Data owner"},
        {"id": "w2", "word": "Data controller"},
        {"id": "w3", "word": "Data processor"},
        {"id": "w4", "word": "Data custodian"},
        {"id": "w5", "word": "Data steward"},
        {"id": "w6", "word": "Data subject"}
    ],
    "correctAssignments": {"b1": "w1", "b2": "w2", "b3": "w3", "b4": "w4"},
    "explanation": "Owner = accountability/classification; controller = purpose/means (legal basis); processor = handles data on instructions; custodian = technical safeguards. Steward manages data quality; subject is the person the data is about.",
    "sourceRefs": R("5.1")
})

# ================= MIX-AND-MATCH matching (+4, extraTargets distractors) =================
NEW.append({
    "id": "pbq-2-013", "domain": 2, "objective": "2.3", "format": "pbq", "kind": "matching",
    "prompt": "Mix and match: connect each vulnerability to the BEST defense. Each defense is used once; three extra defenses are distractors.",
    "context": "A developer is building a remediation plan for a web application.",
    "premises": [
        {"id": "p1", "text": "SQL injection in a search field"},
        {"id": "p2", "text": "Stored XSS in a comment form"},
        {"id": "p3", "text": "Weak password hashing (unsalted MD5)"},
        {"id": "p4", "text": "Session tokens predictable"},
        {"id": "p5", "text": "Directory traversal in file downloads"}
    ],
    "targets": [
        {"id": "t1", "text": "Parameterized queries"},
        {"id": "t2", "text": "Output encoding in the rendering context"},
        {"id": "t3", "text": "Slow salted KDF (bcrypt/Argon2)"},
        {"id": "t4", "text": "Cryptographically secure random token generation"},
        {"id": "t5", "text": "Canonical path validation (reject ../)"}
    ],
    "extraTargets": [
        {"id": "t6", "text": "Content Security Policy"},
        {"id": "t7", "text": "WAF rules only"},
        {"id": "t8", "text": "Client-side JavaScript validation"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "Parameterized queries stop SQLi; output encoding neutralizes XSS; salted slow KDFs protect passwords; secure randomness makes tokens unpredictable; canonical path validation blocks traversal. CSP is defense-in-depth for XSS but not the primary fix.",
    "sourceRefs": R("2.3", "OWASP Top 10 2021")
})

NEW.append({
    "id": "pbq-3-012", "domain": 3, "objective": "3.2", "format": "pbq", "kind": "matching",
    "prompt": "Mix and match: connect each architecture decision to its security purpose. Each purpose is used once; three extra purposes are distractors.",
    "context": "A security architect is documenting the rationale for design decisions.",
    "premises": [
        {"id": "p1", "text": "Place internet-facing web servers in a DMZ"},
        {"id": "p2", "text": "Separate the EHR database onto its own VLAN"},
        {"id": "p3", "text": "Run containers as non-root with read-only rootfs"},
        {"id": "p4", "text": "Keep the SCADA network physically isolated"},
        {"id": "p5", "text": "Use an identity-aware proxy in front of internal apps"}
    ],
    "targets": [
        {"id": "t1", "text": "Contains exposure of untrusted-facing services"},
        {"id": "t2", "text": "Limits east-west movement if a server is compromised"},
        {"id": "t3", "text": "Reduces the impact of a container escape"},
        {"id": "t4", "text": "Removes the attack surface of legacy ICS devices"},
        {"id": "t5", "text": "Enforces per-user, per-app Zero Trust access"}
    ],
    "extraTargets": [
        {"id": "t6", "text": "Provides load balancing"},
        {"id": "t7", "text": "Accelerates DNS resolution"},
        {"id": "t8", "text": "Encrypts backups"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "DMZs contain exposure; VLAN segmentation limits east-west spread; least-privilege containers limit escape impact; air gaps remove ICS attack surface; identity-aware proxies implement ZTNA per application.",
    "sourceRefs": R("3.2", "NIST SP 800-207 Zero Trust Architecture")
})

NEW.append({
    "id": "pbq-4-015", "domain": 4, "objective": "4.8", "format": "pbq", "kind": "matching",
    "prompt": "Mix and match: connect each incident response activity to the phase it belongs to. Each phase is used once; three extra phases are distractors.",
    "context": "An analyst is mapping the team's actions to NIST SP 800-61 phases.",
    "premises": [
        {"id": "p1", "text": "Writing playbooks and running tabletop exercises"},
        {"id": "p2", "text": "Isolating an infected host from the network"},
        {"id": "p3", "text": "Removing malware and patching the exploited vulnerability"},
        {"id": "p4", "text": "Restoring systems from clean backups and monitoring them"},
        {"id": "p5", "text": "Holding a lessons-learned review and updating the plan"}
    ],
    "targets": [
        {"id": "t1", "text": "Preparation"},
        {"id": "t2", "text": "Containment"},
        {"id": "t3", "text": "Eradication"},
        {"id": "t4", "text": "Recovery"},
        {"id": "t5", "text": "Post-incident activity"}
    ],
    "extraTargets": [
        {"id": "t6", "text": "Detection"},
        {"id": "t7", "text": "Weaponization"},
        {"id": "t8", "text": "Delivery"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "Preparation = playbooks/tabletops; containment = isolation; eradication = removal + root-cause fix; recovery = restore + validate; post-incident = lessons learned. Detection/Analysis sits between preparation and containment.",
    "sourceRefs": R("4.8", "NIST SP 800-61 Incident Handling Guide")
})

NEW.append({
    "id": "pbq-5-013", "domain": 5, "objective": "5.2", "format": "pbq", "kind": "matching",
    "prompt": "Mix and match: connect each risk management action to the risk response it represents. Each response is used once; three extra responses are distractors.",
    "context": "A risk manager is documenting how each identified risk will be handled.",
    "premises": [
        {"id": "p1", "text": "Discontinuing a high-risk business service"},
        {"id": "p2", "text": "Installing EDR and patching cadence to reduce ransomware impact"},
        {"id": "p3", "text": "Purchasing cyber liability insurance"},
        {"id": "p4", "text": "Documenting residual risk on a legacy system and continuing to operate"},
        {"id": "p5", "text": "Requiring a vendor to sign an SLA with right-to-audit"}
    ],
    "targets": [
        {"id": "t1", "text": "Avoid"},
        {"id": "t2", "text": "Mitigate"},
        {"id": "t3", "text": "Transfer"},
        {"id": "t4", "text": "Accept"},
        {"id": "t5", "text": "Transfer (third-party)"}
    ],
    "extraTargets": [
        {"id": "t6", "text": "Deter"},
        {"id": "t7", "text": "Detect"},
        {"id": "t8", "text": "Compensate"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "Avoid = stop the activity; mitigate = reduce likelihood/impact with controls; transfer = shift risk (insurance or a contracted third party with SLA/audit rights); accept = document and tolerate residual risk.",
    "sourceRefs": R("5.2")
})

merge(load_bank(), new_pbqs=NEW)
