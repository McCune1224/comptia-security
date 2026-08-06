import type { CourseId, CourseMeta, Domain, SessionMode, SessionType } from '$lib/types';
import { objectivesByDomain } from './question-bank';
import { APLUS_1201_OBJECTIVES, APLUS_1201_WEIGHTS, APLUS_1202_OBJECTIVES, APLUS_1202_WEIGHTS } from './aplus-meta';

// ─────────────────────────────────────────────────────────────────────────────
// Course definition — Security+ SY0-701, structured like a college course.
// The schedule is anchored to the exam date (set in course settings): every
// assignment has a `dueOffsetDays` (negative = days before the exam), so moving
// the exam date reschedules the entire course.
// ─────────────────────────────────────────────────────────────────────────────

export type AssignmentKind = 'quiz' | 'scenario' | 'pbq' | 'full';
export type AssignmentCategory = 'quiz' | 'scenario-pbq' | 'full';
export type AssignmentStatus = 'open' | 'due-soon' | 'overdue' | 'in-progress' | 'submitted';

export interface CourseLesson {
	id: string;
	moduleId: string;
	title: string;
	summary: string;
	content: string;
	position: number;
}

export interface CourseAssignment {
	id: string;
	moduleId: string;
	title: string;
	description: string;
	kind: AssignmentKind;
	category: AssignmentCategory;
	points: number;
	count: number;
	domain: Domain | null;
	mode: SessionMode;
	durationMinutes: number;
	dueOffsetDays: number;
	position: number;
}

export interface CourseModule {
	id: string;
	week: number;
	title: string;
	description: string;
	position: number;
}

export interface CourseDefinition {
	title: string;
	code: string;
	examName: string;
	passingScore: number; // Security+ passing scaled score
	scaleMax: number; // 900
	gradeWeights: Record<AssignmentCategory, number>;
	modules: CourseModule[];
	lessons: CourseLesson[];
	assignments: CourseAssignment[];
}

export interface SubmissionRecord {
	assignmentId: string;
	sessionId: string;
	earned: number;
	percentage: number;
	completedAt: string;
}

// ── Seed data ────────────────────────────────────────────────────────────────

const D1 = 1 as Domain;
const D2 = 2 as Domain;
const D3 = 3 as Domain;
const D4 = 4 as Domain;
const D5 = 5 as Domain;

export const COURSE_DEFINITION: CourseDefinition = {
	title: 'CompTIA Security+ (SY0-701)',
	code: 'SEC+ 701',
	examName: 'SY0-701 Certification Exam',
	passingScore: 750,
	scaleMax: 900,
	gradeWeights: { quiz: 0.3, 'scenario-pbq': 0.2, full: 0.5 },
	modules: [
		{
			id: 'week-1',
			week: 1,
			title: 'Foundations & Threats',
			description:
				'Domains 1 & 2 — General Security Concepts, Threats, Vulnerabilities, and Mitigations (34% of exam).',
			position: 1
		},
		{
			id: 'week-2',
			week: 2,
			title: 'Architecture & Operations I',
			description:
				'Domains 3 & 4 — Security Architecture and the first half of Security Operations (46% of exam).',
			position: 2
		},
		{
			id: 'week-3',
			week: 3,
			title: 'Operations II & Program Management',
			description:
				'Domain 4 finish, Domain 5 — Security Program Management and Oversight (20% of exam), plus heavy practice.',
			position: 3
		},
		{
			id: 'week-4',
			week: 4,
			title: 'Final Review & Readiness',
			description:
				'Targeted review, full-length timed exams, and a final readiness check before test day.',
			position: 4
		}
	],
	lessons: [
		{
			id: 'lesson-1-1',
			moduleId: 'week-1',
			title: 'Domain 1 — General Security Concepts',
			summary:
				'CIA triad, AAA, security control types, Zero Trust architecture, physical security, deception technology, change management, and cryptography basics.',
			content: `**Objectives covered:** 1.1–1.4 · **Exam weight:** 12% · **~11 questions**

## 1.1 Security controls (categories × types)

Every exam scenario asks you to *classify a control*. Work through **two axes**: category (how it's implemented) and type (what it does).

| Category | What it is | Examples |
|---|---|---|
| Technical | Hardware/software mechanisms | Firewall, IPS, MFA, encryption, ACLs, EDR |
| Managerial | Policy, procedure, risk decisions | Security policy, risk assessment, training plan, vendor due diligence |
| Operational | People/process executed daily | Guard rotations, patching runbooks, user awareness, incident response |
| Physical | Tangible barriers | Fences, bollards, locks, CCTV, mantraps, biometric readers |

| Type | Purpose | Examples |
|---|---|---|
| Preventive | Stop it happening | Firewall rule, door lock, allow-listing |
| Deterrent | Discourage the attempt | Warning signs, camera presence, policy |
| Detective | Find it after the fact | IDS, SIEM alert, audit log review, motion sensor |
| Corrective | Restore after an incident | Backups, patch rollback, spare equipment |
| Compensating | Alternative when primary control can't be used | Guards when biometric readers fail; IPS "virtual patch" for unpatchable legacy systems |
| Directive | Guide behavior | Policies, standards, procedures, posted rules |

**Exam traps:** (1) "Managerial" ≠ "Operational" — policy/risk is managerial; hands-on execution is operational. (2) A control can be both a *type* and a *category* (e.g., a firewall is technical AND preventive). (3) Compensating controls are temporary/alternative, not the ideal.

## 1.2 Core security concepts

- **CIA triad** — Confidentiality: encryption, permissions, least privilege. Integrity: hashing, digital signatures, file integrity monitoring. Availability: redundancy, failover, patching, backups, DDoS protection.
- **Non-repudiation** — proof of origin/integrity; achieved with digital signatures + audit logs. Prevents "I didn't send that."
- **AAA** — Authentication (prove identity: passwords, biometrics, certificates, tokens), Authorization (what you may do: RBAC/ABAC), Accounting (audit trail of actions). *Authenticating people vs systems*: systems authenticate via certificates, API keys, machine accounts, service accounts.
- **Authorization models** — Discretionary (DAC: owner controls), Role-based (RBAC: by job function), Attribute-based (ABAC: by user/device/time/location attributes), Mandatory (MAC: labels + clearance, e.g., government).
- **Gap analysis** — compare current state vs desired/target state (baseline, regulation, framework) to find missing controls.

## 1.2 Zero Trust (NIST SP 800-207)

"Never trust, always verify" — no implicit trust based on network location. Built on **seven tenets**; exam-focus on:

- **Control plane vs data plane** — Control plane decides access (policy engine → policy administrator); data plane enforces it (policy enforcement point / PEP). Decision and enforcement are separated.
- **Policy Engine (PE) / Policy Administrator (PA) / Policy Enforcement Point (PEP)** — PE grants/denies; PA sets up the communication path (tokens, credentials); PEP allows/denies the session (e.g., identity-aware proxy, gateway).
- **Adaptive identity** — trust score based on risk: user, device health, behavior, location. **Threat scope reduction** — minimize how much of the network an attacker can reach (microsegmentation). **Policy-driven access control** — access decisions from policy, not network location.
- **Pillars/parts** — identity, device, network, application/workload, data; plus **implicit trust zones** eliminated.
- Related: **microsegmentation** (north-south vs east-west traffic controls), **SASE/ZTNA** (cloud-delivered zero-trust access), **MFA everywhere**.

## 1.2 Physical security

- **Preventive physical** — bollards, fencing, access control vestibule (mantrap), biometric readers, hardware locks, cable locks, safes.
- **Detective physical** — CCTV/video surveillance, motion sensors, contact sensors, pressure sensors, tamper detection.
- **Deterrent** — lighting, signs, guards. **Corrective** — backup power, spare hardware, fire suppression (water, gas/clean agent).
- **Types of sensors** — infrared, microwave, ultrasonic, pressure; each has pros/cons (e.g., pets vs motion).

## 1.2 Deception & disruption

- **Honeypot** — decoy system to attract attackers. **Honeynet** — network of decoys. **Honeyfile** — fake file (e.g., passwords.txt) that trips an alert when opened. **Honeytoken** — fake credential/data/URL that signals use. **Canary / canary token** — tripwire embedded in documents or systems. DNS sinkholes and spam traps are related deception.
- Purpose: detect, analyze, and delay attackers — not to protect real assets directly.

## 1.3 Change management

Formal process to manage changes safely: **request → review/approval (CAB) → impact/risk assessment → sandbox/test → implement in change window → document → rollback plan → post-implementation review**. Key security points: no unauthorized changes (shadow IT), rollback always planned, change windows, backout procedures, and **separation of duties** — requester ≠ approver ≠ implementer. (Dirty-pipe style unpatched changes, emergency changes still need documentation.)

## 1.4 Cryptography fundamentals

- **Symmetric** — one shared key: AES, ChaCha20, 3DES (legacy). Fast; problem is key distribution.
- **Asymmetric** — key pair: RSA, ECC, Diffie-Hellman. Solves key exchange; slow; used for encryption, signatures, key exchange.
- **Hybrid** — TLS: asymmetric for handshake/key exchange, symmetric (session keys) for bulk data.
- **Hashing** — one-way integrity: SHA-2/SHA-3; MD5 & SHA-1 broken (collisions). **Salting** — random per-password value added before hashing to defeat rainbow tables and identical-password detection. Use slow KDFs: bcrypt, scrypt, PBKDF2, Argon2.
- **Digital signatures** — hash + encrypt with *private* key; verifies integrity AND non-repudiation. **Key exchange** — Diffie-Hellman (ECDH); **perfect forward secrecy** = ephemeral keys (DHE/ECDHE) so past sessions stay secret if a long-term key leaks.
- **Key management** — key escrow, key rotation, key length, hardware security module (HSM), TPM, FIPS 140-2/3.

## Sample questions

1. **Q:** A hospital cannot patch an MRI machine and installs an inline IPS rule that blocks the exploit pattern. Control type? **A:** Compensating — alternative protection because the primary control (patch) isn't possible.
2. **Q:** In ZTA, which component renders a grant/deny decision? **A:** Policy Engine (control plane); the PEP enforces it on the data plane.
3. **Q:** Which control type is an audit log review? **A:** Detective (also technical/operational category depending on implementation).`,
			position: 1
		},
		{
			id: 'lesson-1-2',
			moduleId: 'week-1',
			title: 'Domain 2 — Threats, Vulnerabilities & Mitigations',
			summary:
				'Threat actors and attributes, threat vectors, malware, network/application/cryptographic/physical attacks, vulnerabilities, and mitigation techniques.',
			content: `**Objectives covered:** 2.1–2.5 · **Exam weight:** 22% · **~20 questions** — the single heaviest domain

## 2.1 Threat actors & motivations

| Actor | Motivation | Hallmarks |
|---|---|---|
| Nation-state / APT | Espionage, IP theft, geopolitical | Custom malware, long dwell time, stealth, high resources |
| Organized crime | Financial gain | Ransomware, credential theft, carding, RaaS |
| Hacktivist | Ideology, protest | Defacement, DDoS, data leaks, publicity |
| Insider | Varies (financial, revenge, espionage, careless) | Legitimate access abused; malicious vs accidental |
| Script kiddie | Notoriety, curiosity | Public tools, low skill, visible/traceable |
| Shadow IT | (not an actor — a vector/condition) | Unapproved tech deployed by staff |

**Attribute framework** — Internal vs external, resources/funding, sophistication, and motivation. **APT attributes**: no financial motive, custom tools, encrypted C2, multi-region infrastructure. **RaaS** (ransomware-as-a-service): developers rent malware to affiliates — organized crime model.

## 2.2 Threat vectors & social engineering

- **Vectors** — email, SMS, voice, web, removable media, supply chain, social media, cloud, physical. **Watering hole** — compromise a site the target group visits. **Supply chain** — compromise a vendor/upstream (build pipeline, dependencies, signed updates).
- **Phishing family** — phishing (mass), spear phishing (targeted), whaling (executives), vishing (voice), smishing (SMS), business email compromise (BEC — impersonate exec, request wire transfer).
- **Other SE** — pretexting (fabricated scenario), baiting (lure: USB drop), tailgating (follow through door without consent), piggybacking (with consent), quid pro quo (promise something in return), identity fraud, invoice scams, credential harvesting, **typosquatting** (lookalike domains) and **misinformation/disinformation**.
- **Malware taxonomy** — virus (needs host), worm (self-propagating), trojan (disguised), RAT (remote access), ransomware (encryption + extortion; double extortion = exfil + encrypt), spyware, keylogger, rootkit (hides in kernel), botnet, logic bomb, fileless malware (in-memory), **polymorphic/metamorphic** (changes signature), **spam/malvertising** (malicious ads).
- **Indicators** — unusual outbound connections, process masquerading (svch0st.exe), persistence in AppData/registry/startup, scheduled tasks, hidden processes.

## 2.3 Vulnerabilities (application & OS)

- **Injection** — SQLi (parameterized queries prevent), command injection, LDAP injection, XML injection. **XSS** — reflected, stored, DOM; CSRF (state-changing via authenticated session). **Buffer overflow** (C/C++, no bounds checking), **integer overflow**, **TOCTOU** race conditions, **IDOR** (direct object reference), **directory traversal** (../), **LFI/RFI**, **SSRF** (server makes requests to internal resources), **deserialization** attacks, **zero-day** (unknown to vendor).
- **OS/other vulns** — misconfigurations, default credentials, unsupported/legacy systems, unpatched known CVEs, weak crypto (MD5/SHA-1/SSLv3), improper error handling (info disclosure, user enumeration), open ports/services, shadow IT.
- **Cloud/supply chain/mobile** — exposed storage buckets, excessive IAM permissions, malicious dependencies, sideloading, jailbreaking, OTA updates.

## 2.3 Vulnerabilities (network, cryptographic, physical)

- **On-path / MITM** — ARP spoofing/poisoning, DNS poisoning (cache vs zone), rogue AP, evil twin, session hijacking, **replay attacks** (capture + resend; prevent with nonces/timestamps), **downgrade attacks** (force weaker protocol).
- **Cryptographic attacks** — brute force, dictionary, rainbow table (defeated by salting), birthday attack (hash collisions), collision, **downgrade**, key reuse.
- **Password attacks** — brute force (many tries, one account), password spraying (few passwords, many accounts — avoids lockout), credential stuffing (breached pairs), pass-the-hash (NTLM hash reuse from LSASS), Kerberoasting (offline crack of service tickets), golden ticket (KRBTGT hash → forge TGTs).
- **DoS/DDoS** — SYN flood (half-open TCP), UDP flood, ICMP/ping flood, smurf, amplification (DNS/NTP/SSDP reflection), botnet-driven.
- **Physical attacks** — RFID cloning, NFC relay, malicious USB (Rubber Ducky keystroke injection), BIOS attacks, side-channel (timing, power, EM), **evil maid**.
- **OWASP Top 10 (2021)** — A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection, A04 Insecure Design, A05 Security Misconfiguration, A06 Vulnerable & Outdated Components, A07 Identification & Authentication Failures, A08 Software & Data Integrity Failures, A09 Security Logging & Monitoring Failures, A10 SSRF.

## 2.4 Malicious activity / indicators

- **Indicators of compromise** — unusual outbound traffic, anomalies in privileged account use, geographical irregularities, login red flags, increases in database read volume, HTML response sizes, DDLs in logs, bundles of files in wrong places.
- **Attack kill chain (Lockheed Martin)** — Recon → Weaponization → Delivery → Exploitation → Installation → C2 → Actions on objectives. **MITRE ATT&CK** — tactical knowledge base: Reconnaissance, Resource Development, Initial Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Credential Access, Discovery, Lateral Movement, Collection, C2, Exfiltration, Impact.
- **Lateral movement techniques** — pass-the-hash, pass-the-ticket, PsExec/WinRM, RDP hopping. **Persistence** — registry run keys, scheduled tasks, services, startup folders, WMI subscriptions, bootkits.

## 2.5 Mitigations

- **Hardening** — patch management, disable unnecessary services/ports, remove default creds, secure config baselines, application allow-listing/deny-listing, least privilege, sandboxing, code signing, EDR/XDR, segmentation, MFA, **server-side validation** (never trust client), parameterized queries, input sanitization/encoding, output encoding, **secure coding**: memory-safe languages, bounds checking, fuzzing, SAST/DAST, DevSecOps.
- **For social engineering** — user awareness training, phishing simulations, email filtering (SPF/DKIM/DMARC), MFA, verify-change procedures, clean desk, badge policies, visitor management.

## Sample questions

1. **Q:** An attacker tries 3 common passwords against 1,000 accounts to avoid lockouts. Which attack? **A:** Password spraying.
2. **Q:** Which defense prevents SQLi most completely? **A:** Parameterized queries/prepared statements (server-side).
3. **Q:** Malware exfiltrates data before encrypting files for ransom. What model? **A:** Double extortion ransomware.`,
			position: 2
		},
		{
			id: 'lesson-2-1',
			moduleId: 'week-2',
			title: 'Domain 3 — Security Architecture',
			summary:
				'Cloud and on-premises architecture, segmentation, virtualization/containerization, IoT and ICS/SCADA, data protection, high availability and disaster recovery.',
			content: `**Objectives covered:** 3.1–3.4 · **Exam weight:** 18% · **~16 questions**

## 3.1 Architecture models

- **Cloud deployment models** — public, private, hybrid, community, multi-cloud. **Service models** — IaaS (compute/storage/network), PaaS (platform: runtime, DB), SaaS (full app). **Shared responsibility** — security *of* the cloud = provider; security *in* the cloud = customer (varies by model; more customer responsibility in IaaS, more provider responsibility in SaaS).
- **Other models** — on-premises, **serverless** (function-as-a-service, no server management, pay per execution), **microservices** (small independently deployable services), **infrastructure as code (IaC)** (Terraform/CloudFormation — treat config as versioned code), **VDI** (virtual desktops), **SDN** (software-defined networking — separates control plane from data plane), **SASE/SSE** (cloud security service edge).
- **Cloud-specific risks** — misconfigured storage buckets, excessive IAM permissions, shared tenancy isolation failures, API key leaks, shadow cloud, region/data residency, lack of visibility (shadow IT), **VM escape**.

## 3.2 Security implications of architecture

- **Segmentation** — VLANs, DMZ, subnetting, microsegmentation, air gaps. Purpose: contain east-west movement. **East-west** = server-to-server; **north-south** = in/out of the network.
- **Virtualization & containers** — hypervisor (type 1 bare-metal vs type 2 hosted), VMs, containers (share host kernel — lighter, faster), orchestration (Kubernetes), **VM escape attack**, container escape, image supply chain, insecure registries.
- **IoT / ICS / SCADA** — embedded systems, RTOS, PLCs, fieldbus, **air-gapped** industrial networks; challenges: unpatched, long lifecycles, limited compute, default creds; OT security = segmentation + OT-aware IDS + vendor patches.
- **Zero Trust architecture** — (see Domain 1.2) NIST SP 800-207: control/data plane separation, PEP, adaptive identity, microsegmentation, never trust/always verify. **ZTNA** = zero trust network access (identity-aware proxy).
- **Mobile & wireless architecture** — MDM/UEM, BYOD/COPE/CYOD, geofencing, Wi-Fi: WPA2/WPA3, enterprise auth (802.1X, RADIUS), captive portals, rogue AP/evil twin defenses (WIDS/WIPS).
- **Data considerations** — data classification, data sovereignty/residency, **data at rest / in transit / in use**, encryption, tokenization, masking, DLP, CASB (cloud access security broker — sits between users and cloud).

## 3.3 Data protection

- **Protection techniques** — encryption (at rest: AES; in transit: TLS/IPSec), **hashing** (integrity), **tokenization** (replace sensitive value with token — PCI DSS friendly), **masking** (show partial), **obfuscation**, **DLP** (content inspection, egress control), **geo-fencing**, **permissions/ACLs**, **data classification labels**.
- **DLP types** — network DLP (inspect traffic), endpoint DLP (local files/devices), storage DLP, cloud DLP. Triggers on patterns (SSN, credit card, PHI), keywords, exact data matching.
- **Data roles** — data owner (business accountability), data controller (decides purpose/means), data processor (processes on behalf of controller), data custodian (technical stewardship), data steward (quality/classification governance).

## 3.4 Resilience & recovery

- **High availability** — redundancy everywhere: power (UPS, generators), network (NIC teaming, redundant switches), storage (RAID, replication), compute (clusters), **failover**, **load balancing** (active-active vs active-passive), **geographic dispersal**.
- **Backup types** — **full** (all data), **incremental** (changes since last backup — any type; restore needs last full + all incrementals), **differential** (changes since last full; restore needs last full + last differential), **synthetic full**. **Snapshots**, **replication** (synchronous vs asynchronous), **3-2-1 rule** (3 copies, 2 media, 1 offsite).
- **DR metrics** — **RTO** (recovery time objective — how fast to restore), **RPO** (recovery point objective — max acceptable data loss). **DR sites** — hot (near-zero downtime, mirrored), warm (equipment ready, not running), cold (empty facility), mobile.
- **Backup frequency** — tie to RPO: tighter RPO → more frequent backups. **Backup testing** — restore drills; **offline/immutable backups** to defeat ransomware.
- **MTTR/MTBF** — mean time to repair / between failures.

## Sample questions

1. **Q:** You need near-zero RTO and can afford continuous replication. Which DR site? **A:** Hot site.
2. **Q:** Which backup strategy restores fastest with a single differential? **A:** Full weekly + differential daily (restore = last full + last differential).
3. **Q:** Who decides *why* data is processed (purpose)? **A:** Data controller.`,
			position: 3
		},
		{
			id: 'lesson-2-2',
			moduleId: 'week-2',
			title: 'Domain 4 — Security Operations (Part I)',
			summary:
				'Secure baselines and hardening, endpoint security, mobile/wireless security, monitoring and logging, and vulnerability management.',
			content: `**Objectives covered:** 4.1–4.5 · **Exam weight:** Domain 4 total is 28% (~25 questions), split across this lesson and lesson 3-1

## 4.1 Baselines & hardening

- **Secure baselines** — industry standards for secure config (CIS Benchmarks, vendor hardening guides, DISA STIGs). Apply to servers, workstations, network devices, cloud instances.
- **Hardening checklist** — update/disable unnecessary services, patch management, remove default accounts/creds, disable guest accounts, **least functionality**, secure config of auth (MFA), password policy, **endpoint protection**, **host firewall**, **registry/group policy hardening**, disable USB ports (if policy), secure SNMP (v3), disable Telnet/TFTP, SSH keys not passwords, disable weak ciphers.
- **Imaging & provisioning** — **golden image** (standardized, hardened), **baseline image**, **deployment** (PXE, MDT), **post-deployment hardening** script; avoid configuration drift via IaC/CMP (configuration management platform — Ansible/Puppet/Chef/Salt).
- **Other** — patch management cadence, **compensating controls** for legacy systems, secure cloud storage config (S3 buckets), **least privilege** for service accounts, **application allow-listing**.

## 4.2 Endpoint security

- **EDR/XDR** — endpoint detection and response (behavioral analysis, containment, rollback); XDR extends to network/email/cloud. **HIDS/HIPS** on hosts.
- **Protective tech** — antivirus/anti-malware (signature, heuristic, behavioral), **application allow-listing** (vs deny-listing), **secure boot** / UEFI, **TPM** (trusted platform module — hardware root of trust, stores keys, measured boot), **BitLocker** (uses TPM), **sandboxing**, **host firewall**, **patch management**, **file integrity monitoring** (Tripwire), **DLP endpoint agent**, **EMET/exploit mitigation** (ASLR, DEP, CFG).
- **Other** — **email security** (gateway, SPF/DKIM/DMARC), **web filtering** (URL category, proxy), **NAC** (network access control — posture check before connecting: antivirus up-to-date, patched, compliant).

## 4.3 Mobile & wireless

- **Mobile device management (MDM)** — enroll, configure, wipe; **UEM** (unified endpoint management). **Deployment models** — BYOD (user device), COPE (corporate-owned, personally enabled), CYOD (choose your own device), **corporate-owned**. **MAM** (app-level mgmt), containerization.
- **Mobile defenses** — screen locks, remote wipe/full wipe, geofencing, GPS, **jailbreaking/rooting detection**, storage segmentation, app allow-listing, TLS enforcement, disabling sideloading/OTG.
- **Wi-Fi security** — WPA2 (CCMP/AES), WPA3 (SAE, protects against offline dictionary attack, forward secrecy), **WPA2-Enterprise / 802.1X** (RADIUS, EAP), captive portals (guest), **WPS disabled**, rogue AP detection (WIDS/WIPS), evil twin defense, **MAC filtering** (weak — spoofable), **disabling SSID broadcast** (weak), **PAP/CHAP/PEAP/EAP-TLS** (EAP-TLS strongest — mutual certs).
- **Bluetooth** — bluejacking, bluesnarfing; disable when unused.

## 4.4 Monitoring & logging

- **Log sources** — firewall, IDS/IPS, proxy, web server, DNS, email, authentication (AD), OS logs (Windows Event Log, syslog), application, cloud (CloudTrail), **NetFlow/IPFIX** (flow data), **packet captures** (pcap).
- **SIEM** — centralized aggregation, correlation, alerting, dashboards, **SOAR** (automation/orchestration/response), **log management** (retention, WORM, immutability), **baselining** (learn normal), **trend analysis**, **user behavior analytics (UBA)**, **threat intelligence feeds** (OSINT, ISAC).
- **Syslog** — standard log protocol (UDP 514, TLS 6514); severity levels 0–7 (0 emergency … 7 debug); **log integrity** — hashing, timestamping, secure transport, read-only storage.
- **Metrics** — MTTR, MTTD (time to detect), false positive/negative, alert fatigue.

## 4.5 Vulnerability management

- **Process** — discover assets → **scan** → **validate** (confirm real) → **prioritize/rank** → **remediate** → **re-scan** → report. **NVD/CVE/CVSS** — CVSS base score (0–10, critical ≥9.0), exploitability, impact; prioritize by criticality of asset × severity × exposure × threat intel (KEV — known exploited vulnerabilities).
- **Scanning types** — authenticated vs unauthenticated, agent-based vs agentless, **external vs internal**, **continuous** (cloud), **passive vs active**; **SCAP** (standard config/assessment), **CVE feeds**, **benchmarks**.
- **Remediation options** — patch, **compensating control** (IPS virtual patch, WAF), **exception/risk acceptance** with documentation, decommission, segmentation.
- **Responsible disclosure** — vendor notified, coordinated public disclosure; **bug bounty** programs; **red team vs blue team vs purple team**; **penetration testing** (black box / white box / gray box) with **rules of engagement (ROE)**.

## Sample questions

1. **Q:** Which wireless protocol is resistant to offline dictionary attacks? **A:** WPA3 (SAE handshake).
2. **Q:** An endpoint must pass posture checks before network access. Which control? **A:** NAC.
3. **Q:** Which scan type has the most accurate results? **A:** Authenticated scan (has credentials, sees real config).`,
			position: 4
		},
		{
			id: 'lesson-3-1',
			moduleId: 'week-3',
			title: 'Domain 4 — Security Operations (Part II)',
			summary:
				'Identity and access management, NAC, DLP, email and DNS security, incident response, and digital forensics.',
			content: `**Objectives covered:** 4.6–4.9 · **Exam weight:** Domain 4 total is 28% (~25 questions)

## 4.6 Identity & access management (IAM)

- **Identity lifecycle** — provisioning, on/off-boarding, **least privilege**, **separation of duties**, **time-based/role-based access**, **account audits** (recertification), deprovisioning on termination (disable/delete, revoke tokens, recover assets).
- **Authentication methods** — knowledge (password/PIN), possession (smart card, token, phone), inherence (biometrics: fingerprint, retina, iris, voice, gait — **FAR/FRR** tradeoff, **EER**), location, behavior. **MFA** — two of three factors; **adaptive/auth step-up** — extra verification for risky actions.
- **Directory & federation** — LDAP/AD, **SSO** (one login, many apps), **SAML** (XML security assertions, browser SSO), **OAuth 2.0** (authorization/delegation, tokens, scopes), **OpenID Connect (OIDC)** (identity layer on OAuth 2.0, ID token JWT), **Federation** — trust between IdPs/SPs. **Kerberos** — tickets (TGT/ST), timestamps; weaknesses: golden ticket, pass-the-ticket, Kerberoasting.
- **PAM** — privileged access management: vault credentials, session recording, just-in-time (JIT) access, credential rotation. **Password manager**, **passwordless** (FIDO2/WebAuthn, passkeys), **account lockout vs password spraying** (lockout after N tries, but spraying avoids lockout).
- **AAA protocols** — RADIUS (UDP 1812/1813, combines auth+accounting), TACACS+ (TCP 49, encrypts all, separates authorization, Cisco), **Diameter** (successor to RADIUS), **Kerberos** (default in AD).

## 4.7 Automation & orchestration

- **SOAR** — security orchestration, automation, and response: playbooks/runbooks, ticket enrichment, automated containment (block IP, isolate host), case management. **SOAR ≠ SIEM** — SIEM detects/correlates; SOAR acts.
- **Automation benefits** — speed (MTTR down), consistency, freeing analysts, reduced errors; **risks** — automation of destructive actions, false positives causing outages, **supply chain** of scripts (secure the pipeline: code review, versioning, least privilege credentials).
- **Other automation** — **API-driven security** (firewall rules via API), **cloud security groups as code**, **GitOps**, **scheduled/triggered scans**, **webhooks**, **AI/ML** in security (UEBA, anomaly detection), **accounting for legacy systems** in automation (protocols lacking APIs — use adapters/bastions).

## 4.8 Incident response

- **IR phases (NIST SP 800-61)** — **Preparation** → **Detection & Analysis** → **Containment, Eradication & Recovery** → **Post-Incident Activity**. (Alternative 6-phase: Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned.)
- **Preparation** — IR plan/policy, **playbooks** (per incident type), **tabletop exercises**, training, tools, communication plan, **backups**.
- **Detection & analysis** — indicators of compromise, triage, **scope the incident**, **chain of custody**, evidence preservation, **correlation** (SIEM), **containment** — isolate host (disconnect from network vs power off — **preserve volatile evidence first**).
- **Containment** — short-term (disconnect) vs long-term (rebuild, failover). **Eradication** — remove malware, patch, clean. **Recovery** — restore from clean backups, validate, monitor. **Post-incident** — **lessons learned**, report, process improvement, **retention** of evidence, **root cause analysis**.
- **Key concepts** — **dwell time** (time from compromise to detection), **MTTD/MTTR**, **containment vs eradication**, **preservation of evidence (order of volatility!)**, **communication plan** (internal/external, PR, legal, law enforcement), **escalation**.

## 4.9 Digital forensics

- **Evidence handling** — **chain of custody** (who/when/where for every piece), **preservation** (bit-for-bit copies, write blockers), **acquisition** (forensic image, memory dump), **integrity** (hash: SHA-256), **legal hold**, **admissibility** (authenticity, reliability).
- **Order of volatility** — collect most volatile first: **registers/cache → RAM → process table/network state → temporary files → disk → remote logs → archival media**.
- **Forensic techniques** — **disk imaging** (dd, FTK, EnCase), **memory forensics** (Volatility), **file carving**, **timeline analysis** (MAC times), **log analysis**, **email/header analysis**, **mobile forensics** (NAND, SIM), **anti-forensics** (timestomping, wiping, steganography, encryption), **legal considerations** (warrant, jurisdiction, privacy).
- **Data acquisition types** — static (powered off) vs live (running system — capture memory), **sprint vs full** (triage vs deep dive).

## Sample questions

1. **Q:** What is the correct order of volatility for evidence collection? **A:** CPU cache/registers → RAM → network connections → disk → remote logs.
2. **Q:** Which technology automates incident response actions via playbooks? **A:** SOAR.
3. **Q:** You must capture memory from a live system. What type of acquisition? **A:** Live/volatile acquisition (memory dump first, before powering off).`,
			position: 5
		},
		{
			id: 'lesson-3-2',
			moduleId: 'week-3',
			title: 'Domain 5 — Security Program Management & Oversight',
			summary:
				'Governance and policy, risk management, third-party risk, compliance, audits and assessments, and security awareness.',
			content: `**Objectives covered:** 5.1–5.6 · **Exam weight:** 20% · **~18 questions**

## 5.1 Governance

- **Document hierarchy** — **Policy** (high-level intent, mandatory, board-approved) → **Standard** (specific mandatory requirements: e.g., NIST 800-53, ISO 27001) → **Procedure** (step-by-step how-to) → **Guideline** (recommended, not mandatory).
- **Roles** — **data owner** (accountable for data classification/use), **data controller** (decides purpose/means of processing), **data processor** (processes on behalf of controller), **data custodian** (implements technical controls), **data steward** (day-to-day data quality/governance), **sysadmin vs security admin separation**.
- **Policies to know** — acceptable use (AUP), password, change management, data retention, incident response, BYOD, remote access, business continuity, privacy, onboarding/offboarding.
- **Compliance frameworks** — NIST CSF 2.0 (six functions: **Govern, Identify, Protect, Detect, Respond, Recover** — GOVERN added in 2.0), NIST 800-53, ISO 27001/27002, CIS Controls, PCI DSS, HIPAA, GDPR, SOX, FISMA, FedRAMP.

## 5.2 Risk management

- **Risk formula** — Risk = **Threat × Vulnerability × Impact** (likelihood × impact). **Residual risk** = risk left after controls; **inherent risk** = before controls. **Risk appetite/tolerance**.
- **Quantitative** — **SLE** (single loss expectancy = AV × EF), **ARO** (annualized rate of occurrence), **ALE** = SLE × ARO. Example: asset $100k, EF 25% → SLE $25k; ARO 0.5 → ALE $12.5k/year.
- **Qualitative** — rankings/scales (high/medium/low, likelihood × impact matrix), subjective.
- **Risk responses** — **Avoid** (drop the activity), **Mitigate** (reduce likelihood/impact — controls), **Transfer** (insurance, outsourcing), **Accept** (documented residual risk, risk register). **Risk register** — catalog of risks (likelihood, impact, owner, response). **Risk matrix/heatmap** — likelihood vs impact.
- **Other** — **Business Impact Analysis (BIA)** — identify critical systems, **MTD** (max tolerable downtime), **RTO/RPO**, **risk assessment steps** (identify assets/threats → assess vulnerabilities → determine likelihood/impact → prioritize → recommend controls). **Supply chain risk** — vendor risk assessments, SLAs, right-to-audit, insurance, **NIST SP 800-161** (supply chain risk management).

## 5.3 Third-party risk

- **Vendor lifecycle** — due diligence → contract (SLA, NDA, **right to audit**, data protection terms) → onboarding → **continuous monitoring** (reassess) → offboarding. **SLA** — service levels (uptime, response times). **NDA** — confidentiality.
- **Supply chain** — vet suppliers, **third-party risk management (TPRM)**, **open-source dependency risk** (SBOM — software bill of materials), **M&A due diligence**, **penetration testing requirements for vendors**, **insurance/cyber liability**, **exit strategy**.
- **Contracts** — **SOW** (statement of work), **MOU/MOA**, **MSA**, **data processing agreement (DPA)**, **business associate agreement (BAA — HIPAA)**.

## 5.4 Compliance & assessments

- **Regulations** — **GDPR** (EU privacy: consent, right to be forgotten, breach notification ≤72h, DPO), **HIPAA** (US health: PHI, HITECH), **PCI DSS** (card data: 12 requirements, tokenization), **SOX** (financial reporting controls, auditor independence), **GLBA** (financial privacy), **FERPA** (education records), **CCPA/CPRA** (California consumer privacy). **Data residency/sovereignty** — where data may be stored.
- **Assessments** — **security audit** (internal/external, attestation), **vulnerability assessment**, **penetration test** (black/white/gray box, **rules of engagement**, authorized scope), **gap analysis**, **compliance scan/report**, **audit trail/reporting**, **SOX audit vs SOC 2** (SOC 2 = trust services criteria), **FedRAMP** (cloud for US gov), **right-to-audit clauses**.
- **Test types** — **black box** (no prior knowledge), **white box** (full knowledge/credentials), **gray box** (partial). **Red team** (adversarial), **blue team** (defenders), **purple team** (both, collaborative).

## 5.5 Security awareness

- **Training program** — onboarding, **annual/periodic refreshers**, **role-based training** (executives, developers, help desk), **phishing simulations** (measure click rates, follow-up training), **gamification** (badges, competitions), **campaigns** (posters, newsletters, videos).
- **Content** — phishing/social engineering, password hygiene, clean desk, tailgating, mobile security, data classification, incident reporting (who/when), insider threat awareness, **GDPR/privacy basics**.
- **Metrics** — phishing click rate, training completion rate, **time-to-report**, reduction in incidents. **Reporting channels** — help desk, security team, anonymous hotline; **no-blame culture** for reporting (encourage, don't punish).

## 5.6 Security policies & operations (audit, disaster recovery)

- **Business continuity vs disaster recovery** — BCP (keep business running), DRP (recover IT after disaster); **BIA**, **RTO/RPO**, **tabletop exercises**, **drills/failover tests**, **backup/restore testing**, **communication plan**, **alternate sites** (hot/warm/cold/mobile), **power** (UPS, generator), **supplier continuity**.
- **Audit processes** — **internal audit** (independent review), **external audit** (third-party attestation), **audit findings → corrective action plans (CAP)**, **management review**, **continuous improvement (PDCA)**.
- **Other** — **security KPIs/KRIs**, **board reporting**, **budgeting** for security, **insurance** (cyber liability), **benchmarking** vs peers, **lessons learned** loops.

## Sample questions

1. **Q:** Asset value $200,000, exposure factor 10%, ARO 2. What is ALE? **A:** SLE = $20,000; ALE = $40,000/year.
2. **Q:** Which risk response does purchasing cyber insurance represent? **A:** Transfer.
3. **Q:** Which framework has six functions including Govern? **A:** NIST CSF 2.0.`,
			position: 6
		},
		{
			id: 'lesson-4-1',
			moduleId: 'week-4',
			title: 'Exam Strategy & Objective Walkthrough',
			summary:
				'Readiness checklist, weak-topic targeting, PBQ strategy, and a line-by-line objectives review before test day.',
			content: `**Week 4 — the final sprint before test day**

## Readiness checklist (run this week)

- [ ] All six objective quizzes submitted (Domains 1–5 + weak-topic review)
- [ ] Both scenario/PBQ sets completed
- [ ] Full Practice Exam #1 and #2 taken under real conditions (90 Q, 90 min, no notes)
- [ ] Gradebook weak topics reviewed — redo targeted domain quizzes for anything < 80%
- [ ] Score **750/900 (83.3%) or higher** on at least one full exam → the readiness ring on the home page should read "Exam-ready"

## Objective walkthrough drill

For **every objective in the exam objectives PDF** (1.1 → 5.6), you should be able to:

1. Say the objective name from memory.
2. Explain every bullet under it in 1–2 sentences.
3. Give one concrete example (tool, control, attack, or scenario) for each bullet.

If you can't do all three, that objective goes on today's targeted review list. **Acronyms**: you must know the full names for the ~90 acronyms in the objectives (SIEM, SOAR, EDR/XDR, IAM, PAM, MFA, SSO, SAML, OAuth, OIDC, LDAP, TACACS+, RADIUS, IPSec, DNSSEC, SPF, DKIM, DMARC, DLP, NAC, CASB, MDM, UEM, TPM, HSM, FDE, RTO, RPO, MTD, BIA, ALE, SLE, ARO, CVE, CVSS, CIRT, CSIRT, IRP, BCP, DRP, SLA, NDA, GDPR, HIPAA, PCI DSS, SOX, PHI, PII, SBOM, KEV, SCAP, SASE, ZTNA, WPA3, EAP, PEAP, 802.1X, VLAN, DMZ, IPSec, TLS, AES, RSA, ECC, DH, SHA, KDF, PBKDF2, FAR, FRR, EER, COPE, BYOD, CYOD, VDI, IaC, CMP, SOAR, UEBA, WORM, SOW, MOU, DPA, BAA, CAP, KRIs, KPIs…).

## PBQ strategy

- **Do PBQs first or last** — they're the most time-consuming; many test-takers flag them and return after the multiple-choice.
- **Read the scenario twice** — PBQs often bury the key constraint (e.g., "least privilege," "most cost-effective," "must work during a network outage").
- **Ordering/matching PBQs** — look for the *anchor* (a step that can only go in one position, a term with only one sensible match) and build outward.
- **Configuration PBQs** — "best practice" is almost always: enable encryption, enable logging, use MFA/least privilege, disable default accounts, set secure protocols (TLS ≥ 1.2, SSH not Telnet, SNMPv3).
- **Command/ACL evidence PBQs** — read the *deny* lines first; know the difference between allow and permit ordering effects and what each log line implies.

## Exam-day rules of engagement

- **90 questions, 90 minutes** → about 1 minute per question. Flag hard ones and move on; budget the last 10 minutes for review.
- **Scoring** — 750/900 (83.3%) to pass. No penalty for guessing — never leave a question blank.
- **Multiple-select** — the prompt tells you exactly how many (e.g., "Which TWO…"). Match the count exactly.
- **Eliminate obviously wrong answers** first (wrong protocol, wrong control category, wrong risk term) — Security+ distractors are often *real terms used wrongly*.
- **"Best" / "MOST" / "FIRST"** questions — pick the answer that satisfies the stated constraint (cost, speed, security, availability), not just any correct-sounding control.
- **Scenario questions** — the answer is usually the *first thing you'd do* or the *root cause*, not a downstream step.

## Day before / day of

- **Rest** — no heavy study the day before; light review of your weakest 2–3 topics only (port numbers, risk formulas, acronyms).
- **Logistics** — confirm test center/online proctor, photo ID, arrive 30 minutes early, no smartwatch/notes.
- **Mindset** — you've already taken the course; this is refresh. Target 750+, expect ~10 flagged questions, and keep moving.`,
			position: 7
		}
	],
	assignments: [
		// Week 1 — Domains 1 & 2
		{
			id: 'a1-1',
			moduleId: 'week-1',
			title: 'Domain 1 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 1.1–1.4 (General Security Concepts).',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: D1,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -24,
			position: 1
		},
		{
			id: 'a1-2',
			moduleId: 'week-1',
			title: 'Domain 2 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 2.1–2.5 (Threats, Vulnerabilities, Mitigations).',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: D2,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -22,
			position: 2
		},
		{
			id: 'a1-3',
			moduleId: 'week-1',
			title: 'Week 1 Checkpoint Exam',
			description:
				'20-question timed mini-exam mixing Domains 1 & 2. Your first exam-conditions check-in.',
			kind: 'quiz',
			category: 'full',
			points: 20,
			count: 20,
			domain: null,
			mode: 'exam',
			durationMinutes: 20,
			dueOffsetDays: -20,
			position: 3
		},
		// Week 2 — Domains 3 & 4
		{
			id: 'a2-1',
			moduleId: 'week-2',
			title: 'Domain 3 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 3.1–3.4 (Security Architecture).',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: D3,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -17,
			position: 4
		},
		{
			id: 'a2-2',
			moduleId: 'week-2',
			title: 'Domain 4 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 4.1–4.5 (Security Operations I).',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: D4,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -15,
			position: 5
		},
		{
			id: 'a2-3',
			moduleId: 'week-2',
			title: 'PBQ Practice Set',
			description:
				'5 performance-based questions — hands-on ordering, matching, and configuration tasks.',
			kind: 'pbq',
			category: 'scenario-pbq',
			points: 5,
			count: 5,
			domain: null,
			mode: 'practice',
			durationMinutes: 30,
			dueOffsetDays: -14,
			position: 6
		},
		{
			id: 'a2-4',
			moduleId: 'week-2',
			title: 'Full Practice Exam #1',
			description:
				'90-question, 90-minute full-length exam with all five domains and 5 PBQs — exam conditions.',
			kind: 'full',
			category: 'full',
			points: 90,
			count: 90,
			domain: null,
			mode: 'exam',
			durationMinutes: 90,
			dueOffsetDays: -13,
			position: 7
		},
		// Week 3 — Domains 4-5 + heavy practice
		{
			id: 'a3-1',
			moduleId: 'week-3',
			title: 'Domain 5 Objective Quiz',
			description:
				'20 multiple-choice questions covering objectives 5.1–5.6 (Program Management & Oversight).',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: D5,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -9,
			position: 8
		},
		{
			id: 'a3-2',
			moduleId: 'week-3',
			title: 'Scenario Practice Set',
			description: '10 applied scenario-based questions testing real-world decision making.',
			kind: 'scenario',
			category: 'scenario-pbq',
			points: 10,
			count: 10,
			domain: null,
			mode: 'practice',
			durationMinutes: 20,
			dueOffsetDays: -8,
			position: 9
		},
		{
			id: 'a3-3',
			moduleId: 'week-3',
			title: 'Full Practice Exam #2',
			description:
				'Second 90-question, 90-minute full-length exam. Aim for 80%+ and note your weak domains.',
			kind: 'full',
			category: 'full',
			points: 90,
			count: 90,
			domain: null,
			mode: 'exam',
			durationMinutes: 90,
			dueOffsetDays: -6,
			position: 10
		},
		// Week 4 — Final review
		{
			id: 'a4-1',
			moduleId: 'week-4',
			title: 'Weak-Topic Targeted Review',
			description:
				'Mixed 20-question practice quiz to close out your weakest objectives before the final exam.',
			kind: 'quiz',
			category: 'quiz',
			points: 20,
			count: 20,
			domain: null,
			mode: 'practice',
			durationMinutes: 25,
			dueOffsetDays: -3,
			position: 11
		},
		{
			id: 'a4-2',
			moduleId: 'week-4',
			title: 'Full Practice Exam #3 (Final)',
			description:
				'Final 90-question, 90-minute exam. Target 750/900 scaled (83.3%) or higher — the real pass mark.',
			kind: 'full',
			category: 'full',
			points: 90,
			count: 90,
			domain: null,
			mode: 'exam',
			durationMinutes: 90,
			dueOffsetDays: -2,
			position: 12
		}
	]
};

// ── Course registry (multi-course) ───────────────────────────────────────────
// The app is single-course today; the registry is the seam the A+ worktree
// appends to ('aplus-1201' | 'aplus-1202') and the profiles worktree scopes by.

export const COURSES: Partial<Record<CourseId, CourseDefinition>> = {
	'secp-701': COURSE_DEFINITION
};

export const COURSE_META: Partial<Record<CourseId, CourseMeta>> = {
	'secp-701': {
		id: 'secp-701',
		title: COURSE_DEFINITION.title,
		code: COURSE_DEFINITION.code,
		examName: COURSE_DEFINITION.examName,
		passingScore: COURSE_DEFINITION.passingScore,
		scaleMax: COURSE_DEFINITION.scaleMax,
		domainWeights: { 1: 12, 2: 22, 3: 18, 4: 28, 5: 20 },
		domains: [1, 2, 3, 4, 5],
		objectives: objectivesByDomain
	},
	'aplus-1201': {
		id: 'aplus-1201',
		title: 'CompTIA A+ Core 1 (220-1201)',
		code: 'A+ 1201',
		examName: 'CompTIA A+ Core 1 (220-1201) Certification Exam',
		passingScore: 675,
		scaleMax: 900,
		domainWeights: APLUS_1201_WEIGHTS,
		domains: [1, 2, 3, 4, 5],
		objectives: APLUS_1201_OBJECTIVES
	},
	'aplus-1202': {
		id: 'aplus-1202',
		title: 'CompTIA A+ Core 2 (220-1202)',
		code: 'A+ 1202',
		examName: 'CompTIA A+ Core 2 (220-1202) Certification Exam',
		passingScore: 700,
		scaleMax: 900,
		domainWeights: APLUS_1202_WEIGHTS,
		domains: [1, 2, 3, 4],
		objectives: APLUS_1202_OBJECTIVES
	}
};

/** Courses available in the app. The A+ worktree appends the two A+ cores. */
export const ACTIVE_COURSES: CourseId[] = ['secp-701'];

// ── Scheduling helpers ───────────────────────────────────────────────────────

/** Returns the due date (local midnight) for an assignment given the exam date (YYYY-MM-DD). */
export function assignmentDueDate(assignment: CourseAssignment, examDate: string): Date {
	const due = new Date(`${examDate}T00:00:00`);
	due.setDate(due.getDate() + assignment.dueOffsetDays);
	return due;
}

export function formatDate(date: Date | string): string {
	let value: Date;
	if (typeof date === 'string') {
		// Treat YYYY-MM-DD as a local calendar date to avoid UTC timezone shifts.
		const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
		value = match
			? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
			: new Date(date);
	} else {
		value = date;
	}
	return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function daysUntil(date: Date): number {
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const target = new Date(date);
	target.setHours(0, 0, 0, 0);
	return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

export function assignmentStatus(
	assignment: CourseAssignment,
	examDate: string,
	submissions: SubmissionRecord[],
	activeAssignmentId: string | null
): AssignmentStatus {
	if (submissions.some((s) => s.assignmentId === assignment.id)) return 'submitted';
	if (activeAssignmentId === assignment.id) return 'in-progress';
	const due = assignmentDueDate(assignment, examDate);
	const days = daysUntil(due);
	if (days < 0) return 'overdue';
	if (days <= 2) return 'due-soon';
	return 'open';
}

// ── Gradebook ────────────────────────────────────────────────────────────────

export interface CategoryGrade {
	category: AssignmentCategory;
	label: string;
	weight: number;
	earned: number;
	possible: number;
	percentage: number | null; // null when nothing submitted in category
	submittedCount: number;
	totalCount: number;
}

export interface AssignmentGrade extends SubmissionRecord {
	assignment: CourseAssignment;
	dueDate: Date;
	status: AssignmentStatus;
}

export interface Gradebook {
	weightedPercentage: number | null;
	letterGrade: string;
	categories: CategoryGrade[];
	assignments: AssignmentGrade[];
	submittedAssignments: number;
	totalAssignments: number;
	pointsEarned: number;
	pointsPossible: number;
}

export function letterForPercentage(pct: number): string {
	if (pct >= 90) return 'A';
	if (pct >= 80) return 'B';
	if (pct >= 70) return 'C';
	if (pct >= 60) return 'D';
	return 'F';
}

export function computeGradebook(
	assignments: CourseAssignment[],
	submissions: SubmissionRecord[],
	examDate: string,
	activeAssignmentId: string | null,
	weights = COURSE_DEFINITION.gradeWeights
): Gradebook {
	const bestByAssignment = new Map<string, SubmissionRecord>();
	for (const submission of submissions) {
		const best = bestByAssignment.get(submission.assignmentId);
		if (!best || submission.percentage > best.percentage)
			bestByAssignment.set(submission.assignmentId, submission);
	}

	const categories: CategoryGrade[] = (
		['quiz', 'scenario-pbq', 'full'] as AssignmentCategory[]
	).map((category) => {
		const inCategory = assignments.filter((a) => a.category === category);
		const graded = inCategory.filter((a) => bestByAssignment.has(a.id));
		const earned = graded.reduce(
			(sum, a) => sum + ((bestByAssignment.get(a.id)?.percentage ?? 0) / 100) * a.points,
			0
		);
		const possible = graded.reduce((sum, a) => sum + a.points, 0);
		return {
			category,
			label:
				category === 'quiz'
					? 'Quizzes'
					: category === 'scenario-pbq'
						? 'Scenarios & PBQs'
						: 'Full Exams',
			weight: weights[category],
			earned,
			possible,
			percentage: possible ? Math.round((earned / possible) * 1000) / 10 : null,
			submittedCount: graded.length,
			totalCount: inCategory.length
		};
	});

	const gradedCategories = categories.filter((c) => c.percentage !== null);
	const weightUsed = gradedCategories.reduce((sum, c) => sum + c.weight, 0);
	const weightedPercentage =
		gradedCategories.length === 0
			? null
			: Math.round(
					(gradedCategories.reduce((sum, c) => sum + (c.percentage ?? 0) * c.weight, 0) /
						weightUsed) *
						10
				) / 10;

	const assignmentGrades: AssignmentGrade[] = assignments
		.map((assignment) => {
			const submission = bestByAssignment.get(assignment.id);
			return {
				...submission!,
				assignment,
				dueDate: assignmentDueDate(assignment, examDate),
				status: assignmentStatus(assignment, examDate, submissions, activeAssignmentId)
			};
		})
		.sort((a, b) => a.assignment.position - b.assignment.position);

	return {
		weightedPercentage,
		letterGrade: weightedPercentage === null ? '—' : letterForPercentage(weightedPercentage),
		categories,
		assignments: assignmentGrades,
		submittedAssignments: bestByAssignment.size,
		totalAssignments: assignments.length,
		pointsEarned: bestByAssignment.size
			? [...bestByAssignment.entries()].reduce(
					(sum, [assignmentId, submission]) =>
						sum +
						(submission.percentage / 100) *
							(assignments.find((a) => a.id === assignmentId)?.points ?? 0),
					0
				)
			: 0,
		pointsPossible: assignments.reduce((sum, a) => sum + a.points, 0)
	};
}

// ── Readiness meter ──────────────────────────────────────────────────────────

export interface Readiness {
	score: number; // 0–100
	label: string;
	domainMastery: number | null;
	examAverage: number | null;
	examCount: number;
	passingScale: number; // scaled score projection, 100–900
	ready: boolean;
}

/** Exam domain weightings mirror the real SY0-701 question mix. */
export const EXAM_DOMAIN_QUOTAS: Record<Domain, number> = { 1: 11, 2: 20, 3: 16, 4: 25, 5: 18 };

export function computeReadiness(
	domainProgress: Record<number, { percentage: number; possiblePoints: number }>,
	completedFullExams: { percentage: number }[],
	passingScore = COURSE_DEFINITION.passingScore,
	scaleMax = COURSE_DEFINITION.scaleMax,
	domains: number[] = [1, 2, 3, 4, 5],
	domainQuotas: Record<number, number> = EXAM_DOMAIN_QUOTAS
): Readiness {
	const domainsWithData = domains.filter((d) => domainProgress[d]?.possiblePoints > 0);
	const domainMastery =
		domainsWithData.length === 0
			? null
			: Math.round(
					(domainsWithData.reduce(
						(sum, d) => sum + domainProgress[d].percentage * domainQuotas[d],
						0
					) /
						domainsWithData.reduce((sum, d) => sum + domainQuotas[d], 0)) *
						10
				) / 10;

	const recentExams = completedFullExams.slice(-2);
	const examAverage = recentExams.length
		? Math.round(
				(recentExams.reduce((sum, e) => sum + e.percentage, 0) / recentExams.length) * 10
			) / 10
		: null;

	let score: number;
	if (domainMastery === null) {
		score = 0;
	} else if (examAverage === null) {
		score = domainMastery * 0.8;
	} else {
		score = Math.round((domainMastery * 0.5 + examAverage * 0.5) * 10) / 10;
	}

	const label =
		score >= 85
			? 'Exam-ready'
			: score >= 75
				? 'Prepared'
				: score >= 60
					? 'Building'
					: score >= 40
						? 'Getting started'
						: 'Not started';

	const scaled = Math.round(100 + (score / 100) * (scaleMax - 100));
	const passingPercent = (passingScore / scaleMax) * 100;

	return {
		score,
		label,
		domainMastery,
		examAverage,
		examCount: completedFullExams.length,
		passingScale: scaled,
		ready: score >= passingPercent
	};
}

// ── Exam date default ────────────────────────────────────────────────────────

export function defaultExamDate(now = new Date()): string {
	const date = new Date(now);
	// Default the exam to the last day of the current month (end-of-month target).
	const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

export function sessionLaunchFor(assignment: CourseAssignment): {
	type: SessionType;
	mode: SessionMode;
	count: number;
	domain?: number;
} {
	return {
		type:
			assignment.kind === 'full'
				? 'full'
				: assignment.kind === 'pbq'
					? 'pbq'
					: assignment.kind === 'scenario'
						? 'scenario'
						: 'quiz',
		mode: assignment.mode,
		count: assignment.count,
		...(assignment.domain ? { domain: assignment.domain } : {})
	};
}
