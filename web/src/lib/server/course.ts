import type { CourseId, CourseMeta, Domain, ObjectiveId, SessionMode, SessionType } from '$lib/types';
import { objectivesByDomain } from './question-bank';
import {
	APLUS_1201_OBJECTIVES,
	APLUS_1201_WEIGHTS,
	APLUS_1202_OBJECTIVES,
	APLUS_1202_WEIGHTS
} from './aplus-meta';
import { APLUS_1201_COURSE, APLUS_1202_COURSE } from './aplus-courses';

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
	/** Exam objective ids covered by the lesson — drives the per-objective drill links. */
	objectiveIds?: ObjectiveId[];
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
			objectiveIds: ['1.1', '1.2', '1.3', '1.4'],
			title: 'Domain 1 — General Security Concepts',
			summary:
				'CIA triad, AAA, security control types, Zero Trust architecture, physical security, deception technology, change management, and cryptography basics.',
			content: `**Objectives covered:** 1.1–1.4 · **Exam weight:** Domain 1 total 12%

## 1.1 Compare and contrast various types of security controls.

Classify every control on **two axes**: category (how it is implemented) and type (what it does). The same control can be both a category and a type — a firewall is technical AND preventive.

| Category | What it is | Examples |
|---|---|---|
| Technical | Hardware or software mechanisms | Firewall, IPS, MFA, encryption, ACLs, EDR |
| Managerial | Policy, procedure, and risk decisions | Security policy, risk assessment, training plan, vendor due diligence |
| Operational | Day-to-day people and process | Guard rotations, patching runbooks, user awareness, incident response |
| Physical | Tangible barriers and devices | Fences, bollards, locks, CCTV, mantraps, biometric readers |

| Type | Purpose | Examples |
|---|---|---|
| Preventive | Stop the event before it happens | Firewall rule, door lock, allow-listing |
| Deterrent | Discourage the attempt | Warning signs, camera presence, policy |
| Detective | Find it after the fact | IDS, SIEM alert, audit log review, motion sensor |
| Corrective | Restore after an incident | Backups, patch rollback, spare equipment |
| Compensating | Alternative when the primary control cannot be used | Guards when biometric readers fail; IPS "virtual patch" for unpatchable legacy systems |
| Directive | Guide behavior | Policies, standards, procedures, posted rules |

**Decision rule:** managerial controls are policy and risk decisions; operational controls are hands-on execution; technical controls are mechanisms; physical controls are tangible. **Scenario:** an administrator blocks a known exploit pattern with an inline IPS rule because the vendor cannot patch the device — a compensating, technical control.

## 1.2 Summarize fundamental security concepts.

- **CIA triad** — Confidentiality: encryption, permissions, least privilege. Integrity: hashing, digital signatures, file integrity monitoring. Availability: redundancy, failover, patching, backups, DDoS protection.
- **Non-repudiation** — proof of origin and integrity; achieved with digital signatures plus audit logs; prevents "I didn't send that."
- **AAA** — Authentication (prove identity: passwords, biometrics, certificates, tokens), Authorization (what you may do: RBAC/ABAC/DAC/MAC), Accounting (audit trail of actions). People authenticate with credentials; systems authenticate with certificates, API keys, and service accounts.
- **Gap analysis** — compare current state against a desired baseline, regulation, or framework to identify missing controls. **Scenario:** a gap analysis against PCI DSS reveals the company has no file-integrity monitoring.
- **Zero trust** (NIST SP 800-207) — "never trust, always verify"; no implicit trust based on network location. It separates the **control plane** (policy engine and policy administrator decide access) from the **data plane** (the **policy enforcement point** allows or denies the session). Supporting ideas: adaptive identity, threat scope reduction, microsegmentation, ZTNA, and MFA everywhere.
- **Physical security** — preventive: **bollards**, fencing, **access control vestibule** (mantrap), locks, biometric readers; detective: **video surveillance** (CCTV), motion and contact **sensors**, tamper detection; deterrent: lighting, signs, a **security guard** presence; plus **access badge** readers and badge policies for entry control.
- **Deception technology** — **honeypot** (decoy system), **honeynet** (network of decoys), **honeyfile** (fake file that alerts when opened), **honeytoken** (fake credential or URL). Purpose: detect, analyze, and delay attackers rather than directly protect assets.

## 1.3 Explain the importance of change management processes and the impact to security.

Formal change management sequence: request → **approval process** (change advisory board) → **impact analysis** → test → implement in a scheduled **maintenance window** → document → **backout plan** → post-implementation review. Security impact: unauthorized changes are prevented, rollback is always planned, and **separation of duties** keeps requester, approver, and implementer distinct.

- **Stakeholders** from every affected team must sign off before the change.
- Maintain **allow lists** of approved changes and **deny lists** of prohibited ones.
- Plan for **downtime**, **service restart**, and **application restart** steps, and list the **dependencies** of each system.
- **Legacy applications** may not support rollback or automation, so they need extra testing.
- Use **version control** for configuration files and code so changes are traceable and reversible.
- Follow a documented **standard operating procedure** and keep **diagrams** of the target environment current so the impact analysis is accurate.
- **Scenario:** an emergency patch to stop an active exploit is still logged, reviewed, and rolled back through the backout plan if it breaks the application.

## 1.4 Explain the importance of using appropriate cryptographic solutions.

- **Symmetric vs asymmetric** — symmetric (AES, ChaCha20) uses one shared key; asymmetric uses a **public key** (shared) and **private key** (secret): RSA, ECC, Diffie-Hellman. Hybrid: TLS uses asymmetric for the handshake and symmetric session keys for bulk data.
- **Key management** — **key escrow** (a third party holds a copy of the key), key rotation, key length, a **key management system** (KMS) for centralized lifecycle, a **hardware security module** (HSM) for tamper-resistant key storage and crypto operations, a **trusted platform module** (TPM) for device identity and measured boot, and a **secure enclave** for isolated processing on a device.
- **Encryption coverage** — **full-disk**, **file-level**, **volume**, **database**, and **record**-level encryption; choose the level based on where the data rests and how it is used.
- **Hashing** — a one-way **hash** provides integrity (SHA-2/SHA-3; MD5 and SHA-1 are broken). **Salting** adds a random **salt** per password before hashing to defeat rainbow tables; **key stretching** with slow KDFs (bcrypt, scrypt, PBKDF2, Argon2) slows brute force.
- **Digital signatures** — the signer encrypts a hash of the message with their **private key**; verification uses the public key. Signatures provide integrity, authentication of the signer, and **non-repudiation** — not confidentiality.
- **Data protection techniques** — **steganography** hides data inside other data (images, audio); **tokenization** replaces a sensitive value with a token; **data masking** obscures data for display or testing.
- **Blockchain** — an **open public ledger** of hashed, chained records that is tamper-evident; it uses hashing and digital signatures for integrity and provenance.
- **PKI** — a **certificate authority** (CA) issues certificates and can revoke them via a **certificate revocation list** (CRL) or **OCSP**; a **self-signed** certificate is not issued by a CA; trust chains end at a **root of trust**; a **certificate signing request** (CSR) is sent to the CA to obtain a certificate; a **wildcard** certificate covers multiple subdomains.
- **Scenario:** an e-commerce site uses a wildcard TLS certificate issued by a public CA and checks OCSP on every handshake; its breached password database is protected by salted, stretched hashes.

## Sample questions

1. **Q:** A hospital cannot patch an MRI machine, so an inline IPS rule blocks the exploit pattern. What type of control is this? **A:** Compensating — an alternative protection used because the primary control (patching) is not possible.
2. **Q:** In a zero trust architecture, which component renders the grant/deny decision? **A:** The policy engine on the control plane; the policy enforcement point enforces that decision on the data plane.
3. **Q:** Which cryptographic technique provides non-repudiation but not confidentiality? **A:** Digital signature — the signer encrypts a hash of the message with their private key, proving origin and integrity without hiding the content.`,
			position: 1
		},
		{
			id: 'lesson-1-2',
			moduleId: 'week-1',
			objectiveIds: ['2.1', '2.2', '2.3', '2.4', '2.5'],
			title: 'Domain 2 — Threats, Vulnerabilities & Mitigations',
			summary:
				'Threat actors and attributes, threat vectors, malware, network/application/cryptographic/physical attacks, vulnerabilities, and mitigation techniques.',
			content: `**Objectives covered:** 2.1–2.5 · **Exam weight:** Domain 2 total 22%

## 2.1 Compare and contrast common threat actors and motivations.

| Actor | Motivation | Hallmarks |
|---|---|---|
| Nation-state / APT | Espionage, IP theft, geopolitical advantage | Custom malware, long dwell time, stealth, high resources |
| Hacktivist | Ideology, protest | Defacement, DDoS, data leaks, publicity |
| Organized crime | Financial gain | Ransomware, credential theft, carding, RaaS |
| Insider threat | Financial gain, revenge, espionage, or carelessness | Legitimate access abused; malicious vs accidental |
| Unskilled attacker | Notoriety, curiosity | Public tools, low skill, easily traced |
| Shadow IT | Not an actor — a condition | Unapproved technology deployed by staff |

**Attribute framework:** internal vs external, resources and funding, sophistication, and motivation. Compare goals: data exfiltration and espionage (nation-state, organized crime) vs disruption (hacktivist, disgruntled insider). APT attributes: no financial motive, custom tools, encrypted C2, multi-region infrastructure. RaaS (ransomware-as-a-service) is an organized-crime model. **Scenario:** a foreign group steals source code and stays silent for months — a nation-state actor with an espionage motivation.

## 2.2 Explain common threat vectors and attack surfaces.

- **Delivery vectors** — email, SMS, instant messaging, image-based and file-based attachments, voice call (vishing), removable device drops, wireless networks, bluetooth connections, open service ports, default credentials, supply chain compromise, and managed service providers (an MSP breach cascades to every client). Also web, cloud, social media, and physical surfaces.
- **Social engineering** — phishing (mass), spear phishing (targeted), whaling (executives), vishing (voice), smishing (SMS), business email compromise (BEC: impersonate an executive and request a wire transfer), pretexting (fabricated scenario), impersonation, watering hole (compromise a site the target group visits), typosquatting (lookalike domains), baiting, tailgating, and quid pro quo.
- **Information influence** — misinformation (false but not intended to deceive) vs disinformation (false and deliberately spread to deceive). **Scenario:** an attacker registers \`paypa1.com\` and emails a PDF that looks like an invoice — typosquatting combined with a file-based vector.

## 2.3 Explain various types of vulnerabilities.

- **Application** — buffer overflow (missing bounds checks in C/C++), race conditions such as time-of-check to time-of-use (TOCTOU), SQL injection (prevent with parameterized queries), cross-site scripting (XSS), integer overflow, IDOR, directory traversal, deserialization flaws, and zero-day (unknown to the vendor).
- **System** — operating system flaws, firmware vulnerabilities, end-of-life and legacy software with no patches, misconfiguration, default credentials, weak crypto, and unpatched CVEs.
- **Virtualization and cloud** — virtual machine escape (breaking out of the hypervisor), resource reuse (remnants of prior tenants), and cloud-specific misconfigurations such as exposed storage buckets and excessive IAM permissions.
- **Supply chain** — a software provider's build pipeline, dependencies, or signed updates are poisoned, so malicious libraries enter the product.
- **Cryptographic** — weak algorithms, short keys, protocol downgrade, and poor randomness. **Mobile** — side loading untrusted apps and jailbreaking remove the platform's security controls.
- **Scenario:** a legacy embedded device running end-of-life firmware is vulnerable to buffer overflow, and the vendor no longer issues patches.

## 2.4 Given a scenario, analyze indicators of malicious activity.

- **Malware indicators** — ransomware (encryption plus extortion; double extortion exfiltrates data before encrypting), trojan (disguised), worm (self-propagating), spyware (surveillance), keylogger (captures keystrokes), logic bomb (triggers on a condition), rootkit (hides in the kernel).
- **Physical and environmental** — RFID cloning of access badges, and environmental threats such as HVAC, fire, and water damage.
- **Network** — distributed denial-of-service (DDoS) floods, DNS poisoning and tunneling, on-path interception, credential replay (capture and resend), and downgrade attacks that force weaker protocols.
- **Credential and access** — privilege escalation, password spraying and brute force, account lockout (or its suspicious absence), impossible travel (logins from far-apart locations), and pass-the-hash.
- **Web and crypto** — directory traversal requests, request forgery, and cryptographic collision and birthday attacks on weak hashes.
- **Behavioral** — resource consumption spikes, out-of-cycle logging, and missing logs; pair these with unusual outbound traffic, anomalous database read volume, and geographic irregularities. **Scenario:** a finance user logs in from two continents within ten minutes, then the SIEM shows out-of-cycle logins and missing logs on a file server.

## 2.5 Explain the purpose of mitigation techniques used to secure the enterprise.

- **Network** — segmentation (including microsegmentation) and isolation limit lateral movement; access control list (ACL) rules and permissions enforce who reaches what; least privilege grants the minimum rights needed.
- **Host** — application allow list (only approved software runs), patching (including virtual patches when a fix is unavailable), encryption of data at rest and in transit, endpoint protection (EDR/XDR/antivirus), a host-based firewall, and host-based intrusion prevention (HIPS).
- **Hardening** — disabling ports and unused services, default password changes, secure configuration baselines, and removal of unneeded software.
- **Ongoing** — monitoring with SIEM and log review; decommissioning systems with secure data sanitization; configuration enforcement through baselines, group policy, and automation.
- **Scenario:** after a breach, the team segments the network, enables host-based firewalls, disables unused ports, and pushes a hardened baseline — then monitors for configuration drift.

## Sample questions

1. **Q:** An attacker tries three common passwords against 1,000 accounts to avoid lockout thresholds. Which technique? **A:** Password spraying — few passwords against many accounts; brute force is many passwords against one account.
2. **Q:** A vendor's signed update installer is replaced during the build. Which vector and vulnerability class does this combine? **A:** Supply chain vector via the software provider — the build pipeline and signed updates are trusted upstreams that can be poisoned.
3. **Q:** A user account shows logins from two continents within minutes, followed by out-of-cycle logins and missing logs on a server. What indicators? **A:** Impossible travel plus out-of-cycle logging and missing logs — signs of credential theft with log tampering.`,
			position: 2
		},
		{
			id: 'lesson-2-1',
			moduleId: 'week-2',
			objectiveIds: ['3.1', '3.2', '3.3', '3.4'],
			title: 'Domain 3 — Security Architecture',
			summary:
				'Cloud and on-premises architecture, segmentation, virtualization/containerization, IoT and ICS/SCADA, data protection, high availability and disaster recovery.',
			content: `**Objectives covered:** 3.1–3.4 · **Exam weight:** Domain 3 total 18% · **~16 questions**

## 3.1 Compare and contrast security implications of different architecture models.

Architecture choices set the attack surface, the shared-responsibility boundary, and how quickly you can patch, scale, and recover. Compare each model by what the organization controls versus what the provider manages.

- **Cloud deployment models** — public (shared provider infrastructure), private (single tenant), **hybrid** (on-premises and cloud linked by shared identity and networking), community (shared by several organizations with common interests), multi-cloud (services from multiple providers). Security implications: hybrid and multi-cloud widen identity and data-flow complexity, and each model shifts the provider/customer **shared responsibility** line — more customer control in IaaS, more provider control in SaaS.
- **Service models** — IaaS (compute/storage/network; customer secures the OS upward), PaaS (runtime and database managed; customer secures the application and data), SaaS (full application; customer secures usage and data classification).
- **Infrastructure as code** — **infrastructure as code (IaC)** with Terraform, CloudFormation, or Ansible treats configuration as versioned, reviewed, repeatable code. Security implications: a misconfiguration is reproduced at scale, secrets must never live in templates, and drift detection keeps deployed state equal to the reviewed code.
- **Serverless** — **serverless** functions run on demand with no server management (function-as-a-service). Security implications: ephemeral runtimes reduce the patching burden but enlarge dependency and identity exposure, so functions need least-privilege roles and strict input validation because the provider owns the runtime.
- **Microservices** — **microservices** are small, independently deployable services communicating over APIs. Security implications: a larger east-west surface that requires mutual TLS, API gateways, and per-service identity.
- **Virtualization** — **virtualization** uses a hypervisor (type 1 bare-metal vs type 2 hosted) to partition hardware into VMs. Security implications: hypervisor compromise or **VM escape** defeats every guest, and VM sprawl complicates inventory and patching.
- **Containerization** — **containerization** shares the host kernel, making containers lighter and faster than VMs. Security implications: container escape, image supply chain, insecure registries, and orchestration (Kubernetes) misconfiguration — scan and sign images.
- **IoT and OT** — **IoT** devices, **industrial control systems**, and **SCADA** systems run **embedded systems** and a **real-time operating system (RTOS)** to control physical processes (PLCs, sensors, HMIs). Security implications: long lifecycles with poor **patch availability** mean the **inability to patch** is common, so isolate them on **air-gapped** or heavily segmented OT networks and monitor with OT-aware sensors.
- **Software-defined networking** — **software-defined networking (SDN)** separates the control plane from the data plane for centralized policy. Security implications: the SDN controller is a high-value target — compromising it can redirect or disable the whole network.
- **Logical segmentation** — **logical segmentation** (VLANs, subnets, microsegmentation, zones) contains lateral movement; pair it with east-west inspection.
- **Architecture properties** — **high availability** (redundancy so failures do not break service), **resilience** (graceful degradation), **scalability** (adding capacity under load), and **ease of recovery** (how quickly a rebuilt component returns) are designed in, not bolted on.

::widget osi-explorer::

## 3.2 Given a scenario, apply security principles to secure enterprise infrastructure.

Apply security principles by deciding where devices sit, how zones are separated, what happens when a control fails, and which appliance or protocol matches the risk.

- **Device placement** — where a device sits determines what it can see and block: firewalls at the perimeter, WAFs in front of web servers, jump servers in the management zone, and monitoring sensors on network TAPs.
- **Security zones** — segment the network into trusted tiers (external, screened subnet/DMZ, internal, management, guest) with strict inter-zone rules to shrink the **attack surface**.
- **Failure modes** — **fail-open** lets traffic continue when a control fails (preserves availability, risks security — acceptable for out-of-band inspection); **fail-closed** denies traffic (preserves security, risks availability — required for NAC and most firewalls). Choose by asset criticality and control purpose.
- **Inline vs tap** — an **inline** device sits in the data path and can block (IPS, firewall, WAF); a **tap** (test access point) passively copies traffic for monitoring with zero impact, which suits IDS and analyzers.
- **Access and management** — a **jump server** (bastion host) is the single audited entry point to secure zones; a **proxy server** forwards client or server traffic, enabling filtering, caching, and TLS inspection.
- **Detection and prevention** — an **intrusion detection system (IDS)** monitors copied traffic and alerts; an **intrusion prevention system (IPS)** sits **inline** and actively blocks.
- **Traffic distribution** — a **load balancer** spreads requests across servers, performs health checks and TLS termination, and supports active-active or active-passive failover.
- **Switch defenses** — **port security** restricts which devices can attach to a port (MAC limiting, 802.1X), preventing rogue switchports and CAM-table attacks.
- **Firewall types** — a **web application firewall (WAF)** inspects HTTP/HTTPS payloads for application attacks; **unified threat management (UTM)** bundles firewall, IDS/IPS, antivirus, and web filtering in one appliance; a **next-generation firewall (NGFW)** adds application awareness, identity, and integrated IPS to stateful filtering.
- **Secure access** — a **virtual private network (VPN)** provides **remote access** by **tunneling** encrypted traffic across untrusted networks; **transport layer security (TLS)** protects web, mail, and VPN traffic, while **IPsec** (ESP/AH with IKE) is the classic site-to-site VPN protocol — choose IPsec or TLS VPNs, never PPTP.
- **WAN and edge** — **software-defined wide area network (SD-WAN)** centrally routes branch traffic over any transport; **secure access service edge (SASE)** merges SD-WAN with cloud-delivered security services (CASB, SWG, ZTNA).
- **Selection of effective controls** — **selection of effective controls** matches each control to a specific risk, layers controls (defense in depth), verifies the control actually blocks the threat, and documents compensating controls when the preferred control cannot be deployed.

::widget topology-spotlight::

## 3.3 Compare and contrast concepts and strategies to protect data.

Protecting data starts with classification, then applies the right technique to the right state and enforces access around it.

- **Data classifications** — **regulated** data (subject to PCI DSS, HIPAA, GDPR, SOX), **trade secret** (proprietary process or formula), **intellectual property** (patents, copyrights, designs), **financial information** (accounting and payment records), **sensitive** (needs protection by policy), and **confidential** (restricted access). Classification drives labeling, handling, and controls.
- **Data states** — **data at rest** (stored), **data in transit** (moving across a network), **data in use** (in memory during processing — the hardest to protect, needing secure enclaves or memory encryption).
- **Data sovereignty and geolocation** — **data sovereignty** requires data to remain subject to the laws of the country where it is stored; **geolocation** controls (geo-fencing, region pinning) enforce where data and services may reside.
- **Protection techniques** — compare and contrast:

| Technique | What it does | Best for |
|---|---|---|
| **encryption** | Reversible transformation with a key | Confidentiality at rest and in transit |
| **hashing** | One-way digest, not reversible | Integrity verification and password storage |
| **masking** | Show only part of a value (e.g., \`••••-1234\`) | Displaying data to support staff |
| **tokenization** | Replace a value with a random token; map stored safely | PCI DSS compliance for card data |
| **obfuscation** | Make data hard to read without a key | Code and light data protection |

- **Access control** — **segmentation** isolates sensitive data in separate zones or VPCs; **permission restrictions** (least privilege, ACLs, role-based access) limit who can read or modify it.
- **Data loss prevention (DLP)** — network, endpoint, storage, and cloud DLP inspect content for patterns (SSN, card numbers, PHI), keywords, and exact data matches, then block or alert on egress.
- **Data roles** — data owner (business accountability), data controller (decides purpose and means), data processor (processes on the controller's behalf), data custodian (technical stewardship), data steward (classification and quality governance).

## 3.4 Explain the importance of resilience and recovery in security architecture.

Resilience keeps service up through failure; recovery restores it within acceptable time and data-loss limits. Design both before an incident.

- **High availability** — **load balancing** (active-active vs active-passive), **clustering** (multiple nodes acting as one service), **failover** (automatic switch to a standby), and **geographic dispersion** (replicas in separate regions) keep service up through component failure.
- **Diversity** — **platform diversity** (different OS or vendor stacks) prevents a single vulnerability from taking down everything; **multi-cloud** spreads risk across providers at the cost of skill and tooling complexity.
- **Continuity of operations** — **continuity of operations (COOP)** documents plans that keep essential functions running through disruption; **capacity planning** ensures enough headroom (compute, bandwidth, power) for failover and growth.
- **Backups** — **backups** come in full, incremental (changes since any prior backup), differential (changes since the last full), and synthetic full forms; follow the **3-2-1** rule: three copies, on two media, one offsite. **Snapshots** capture point-in-time state; **replication** mirrors data synchronously or asynchronously; **journaling** (write-ahead logs) enables recovery to a precise point in time. Tie backup frequency to RPO and test restores regularly.
- **Power resilience** — an **uninterruptible power supply (UPS)** bridges short outages; **generators** sustain long outages; redundant power feeds remove single points of failure.
- **Testing** — **tabletop exercises** walk stakeholders through a scenario to validate plans; **parallel processing** and full DR drills prove systems actually recover.
- **DR sites** — **hot site** (mirrored, near-zero downtime), **warm site** (equipment ready, data staged), **cold site** (empty facility).
- **Metrics** — **recovery time objective (RTO)** (how fast to restore), **recovery point objective (RPO)** (maximum acceptable data loss), **mean time to repair (MTTR)** (how long to fix a failed component), **mean time between failures (MTBF)** (expected uptime between failures — higher is better).

## Sample questions

1. **Q:** A hospital keeps MRI scanners on a physically isolated network because the vendor ships no security patches. Which architecture control is in use, and what risk does it accept? **A:** An **air-gapped** network with **inability to patch** — it accepts that updates cannot be applied and relies on isolation instead.
2. **Q:** A compliance rule requires a control to deny traffic whenever it fails. Which failure mode, and what trade-off? **A:** **fail-closed** — traffic is blocked on failure, protecting security over availability.
3. **Q:** You must restore service within 2 hours and lose no more than 15 minutes of data. Which two metrics define this requirement? **A:** **recovery time objective** (RTO) of 2 hours and **recovery point objective** (RPO) of 15 minutes.`,
			position: 3
		},
		{
			id: 'lesson-2-2',
			moduleId: 'week-2',
			objectiveIds: ['4.1', '4.2', '4.3', '4.4', '4.5'],
			title: 'Domain 4 — Security Operations (Part I)',
			summary:
				'Secure baselines and hardening, endpoint security, mobile/wireless security, monitoring and logging, and vulnerability management.',
			content: `**Objectives covered:** 4.1–4.5 · **Exam weight:** Domain 4 total 28% (~25 questions), split across this lesson and lesson 3-1

## 4.1 Given a scenario, apply common security techniques to computing resources.

Apply a secure baseline, harden the resource, and layer mobile, wireless, application, and monitoring techniques according to the asset's role.

- **Secure baselines** — a **secure baseline** is the approved, hardened configuration for a device type, drawn from CIS benchmarks, DISA STIGs, or vendor guides; deploy it via golden images and enforce it with configuration management (Ansible, Puppet, Chef) to prevent drift.
- **Hardening** — **hardening** reduces the attack surface: disable unnecessary services and accounts, remove default credentials, apply patches, enforce least functionality, configure host firewalls, disable weak protocols (Telnet, SNMPv1), and enable exploit mitigations (ASLR, DEP).
- **Mobile management** — **mobile device management (MDM)** enrolls, configures, and wipes devices centrally; UEM adds all endpoint types; MAM manages apps. Deployment models: **bring your own device (BYOD)** (user-owned, less control), **corporate-owned, personally enabled (COPE)** (company device with personal use), and **choose your own device (CYOD)** (user picks from an approved catalog).
- **Wireless security** — **WPA3** (SAE handshake, resistant to offline dictionary attacks, forward secrecy) over WPA2; enterprise authentication with **RADIUS** and 802.1X/EAP; disable WPS; detect rogue APs and evil twins with WIDS/WIPS. Run **site surveys** and **heat maps** to place APs for coverage and to spot weak or leaking signals.
- **Cryptographic and authentication protocols** — **cryptographic protocols** (TLS for transport, IPsec for VPNs, AES for at-rest encryption) protect data; **authentication protocols** (EAP-TLS with mutual certificates, PEAP, Kerberos, 802.1X) verify identity — prefer certificate-based EAP-TLS over password-based methods.
- **Application techniques** — **input validation** (allow lists, parameterized queries) blocks injection; **secure cookies** set \`HttpOnly\`, \`Secure\`, and \`SameSite\` to protect sessions; **static code analysis** finds flaws before deployment; **code signing** signs a hash of the code with the developer's private key to prove integrity and authenticity (it does not provide confidentiality); **sandboxing** runs untrusted code or applications in an isolated environment.
- **Monitoring** — continuous **monitoring** of baselines, logs, and performance detects drift and anomalies early; apply it to every computing resource, not as an afterthought.

## 4.2 Explain the security implications of proper hardware, software, and data asset management.

Manage assets across their full lifecycle — acquisition through destruction — so every device and dataset is known, classified, and safely retired.

- **Lifecycle overview** — move assets through **acquisition**, **procurement**, **ownership**, **classification**, **asset tracking**, **inventory**, **sanitization**, **destruction**, **certification**, and **data retention**.
- **Acquisition vs procurement** — **acquisition** is how an asset is obtained (purchase, lease, cloud subscription); **procurement** is the organizational purchasing process — vet vendors, review supply-chain and licensing terms, and confirm support and warranty before signing.
- **Ownership** — define who owns the asset and its data: corporate vs personal devices (BYOD), cloud data ownership, and data controller/processor obligations.
- **Classification** — label assets and data by sensitivity (public, internal, confidential, restricted) so handling and controls match value.
- **Tracking and inventory** — **asset tracking** (barcode/RFID tags, CMDB records) and **inventory** (agents or scanners) establish what exists, where it lives, and who owns it; **enumeration** of assets uncovers shadow IT and forgotten devices that otherwise become attack paths.
- **Disposal** — **sanitization** removes data (degaussing, secure erase, cryptographic erase, overwriting); **destruction** physically destroys media (shredding, incineration, crushing); **certification** documents that sanitization or destruction met policy so media can be reused or retired safely.
- **Data retention** — **data retention** policies define how long records are kept (legal, regulatory, business requirements), where they are stored, and when and how they are disposed; retention must survive employee departures and vendor changes.

## 4.3 Explain various activities associated with vulnerability management.

Vulnerability management is a closed loop: discover, scan, validate, prioritize, remediate, rescan, and report.

- **Process** — discover assets → **vulnerability scan** → validate findings → **prioritize** → remediate (**patching** or compensating controls) → **rescanning** to verify → **audit** and **reporting** to stakeholders.
- **Application security** — **application security** combines **static analysis** (SAST, inspecting source without running it) and **dynamic analysis** (DAST, probing a running application); add software composition analysis for open-source dependencies.
- **Intelligence** — **threat feed** subscriptions, **open-source intelligence (OSINT)**, **information-sharing** groups (ISACs, CISA), and **dark web** monitoring surface emerging exploits and leaked credentials.
- **Penetration testing** — authorized **penetration testing** (black box, gray box, white box) under rules of engagement validates real exploitability; red team vs blue team vs purple team exercises improve detection.
- **Disclosure** — **responsible disclosure** coordinates with the vendor before public release; **bug bounty** programs pay researchers to find flaws.
- **Scan quality** — a **false positive** reports a vulnerability that does not exist; a **false negative** misses a real one — tune scanners and validate manually to minimize both.
- **Scoring and prioritization** — the **common vulnerability scoring system (CVSS)** rates severity from 0 to 10; **common vulnerability enumeration (CVE)** gives each issue a stable ID; prioritize by asset criticality × severity × exposure × threat intelligence (known-exploited lists first).
- **Remediation decisions** — patch, apply **compensating controls** (IPS virtual patch, WAF rule), accept risk with documented **exceptions** or **exemptions** (with an owner and expiry), or decommission — then **rescanning** and **verification** confirm the fix; **audit** and **reporting** close the loop.

## 4.4 Explain security alerting and monitoring concepts and tools.

Monitoring and alerting turn raw activity into actionable signal; tools collect it, correlate it, and store it.

- **Concepts** — **monitoring** collects activity; **log aggregation** centralizes logs from many sources; **alerting** notifies on rules; **scanning** (vulnerability, port) finds exposure; **reporting** summarizes for stakeholders; **archiving** preserves records for retention; **quarantine** isolates suspicious files or hosts; **alert tuning** reduces noise and alert fatigue.
- **Automation standards** — the **security content automation protocol (SCAP)** standardizes vulnerability and configuration checks against **benchmarks** (CIS, STIG); **agents** installed on hosts report state even when the host is off-network.
- **SIEM** — a **security information and event management (SIEM)** platform aggregates, correlates, and alerts on logs with dashboards; SOAR automates response playbooks on top of it. Baselining normal behavior enables anomaly detection and user behavior analytics.
- **Endpoint tools** — **antivirus** (signature, heuristic, behavioral) and **data loss prevention (DLP)** agents protect hosts; EDR adds behavioral detection and response.
- **Network tools** — the **simple network management protocol (SNMP)** polls and traps device health (use SNMPv3); **NetFlow** (IPFIX) records flow metadata for traffic analysis; **vulnerability scanners** (Nessus, Qualys, OpenVAS) continuously assess exposure; packet captures (pcap) inspect payloads when needed.
- **Log sources** — firewalls, IDS/IPS, proxies, web servers, DNS, email, authentication, OS (syslog/Event Log), applications, and cloud services; protect log integrity with hashing, timestamping, and read-only or immutable storage, and keep retention aligned with policy and compliance.

## 4.5 Given a scenario, modify enterprise capabilities to enhance security.

When a capability must change, adjust the network, web, email, OS, protocol, and endpoint controls together so the modification reduces rather than shifts risk.

- **Network segmentation** — place externally exposed services in **screened subnets** (DMZ) with strict **access lists** (ACLs) controlling what crosses zone boundaries; tighten firewall rule sets when services change and block everything not explicitly required.
- **Detection and prevention** — deploy an **intrusion detection system (IDS)** on taps for visibility and an **intrusion prevention system (IPS)** inline to block; keep **signatures** current and tuned, and add behavioral rules for unknown threats.
- **Web and DNS** — a **web filter** enforces **url scanning**, **content categorization**, and **reputation** ratings to block malicious or inappropriate sites; **DNS filtering** (sinkholes, DNS over HTTPS/TLS) blocks malware domains before connection.
- **Email** — authenticate mail with **sender policy framework (SPF)** (which senders may send), **DKIM** (signed message hashes), and **DMARC** (policy for unauthenticated mail: quarantine or reject) to stop spoofing; gateways filter spam and malicious attachments.
- **OS controls** — **group policy** centrally applies security settings to Windows fleets (password policy, software restriction, audit); **SELinux** enforces mandatory access control (MAC) on Linux by labeling processes and files and denying beyond-policy access.
- **Protocol and port selection** — choose the **transport method** by confidentiality and integrity needs; **protocol selection** and **port selection** are paired decisions:

| Secure choice | Port | Replaces | Port |
|---|---|---|---|
| SSH (secure shell) | 22 | Telnet | 23 |
| HTTPS (TLS) | 443 | HTTP | 80 |
| SFTP (over SSH) | 22 | FTP | 21 |
| SMTP over TLS (STARTTLS) | 587 | SMTP plaintext | 25 |
| DNS over TLS | 853 | DNS plaintext | 53 |
| IPsec VPN (IKE) | 500/4500 | PPTP VPN | 1723 |
| RDP with NLA | 3389 | RDP without NLA | 3389 |

Disable legacy ports (23 Telnet, 21 FTP, 80 HTTP, 25 plain SMTP) and block everything not needed.

::widget port-flip-cards::

- **Data and endpoint controls** — **file integrity monitoring (FIM)** hashes critical files and alerts on change; **data loss prevention (DLP)** blocks sensitive egress; **network access control (NAC)** checks posture (patch level, AV status) and assigns allow, quarantine, or remediation actions before admission.
- **Detection layers** — **endpoint detection and response (EDR)** monitors and contains host threats; **extended detection and response (XDR)** correlates EDR with network, email, cloud, and identity telemetry; **user behavior analytics (UBA)** baselines normal user activity and flags anomalies — integrate all of them into the SIEM for a single view.

## Sample questions

1. **Q:** You must stop spoofed mail from your domain by telling receivers to reject messages that fail authentication. Which mechanism, and what policy value? **A:** **DMARC** with a \`p=reject\` policy — receivers enforce the published policy for mail that fails SPF and DKIM.
2. **Q:** A security admin must confirm that sanitized drives can be reused. Which lifecycle activity documents that? **A:** **certification** — it records that sanitization met policy before reuse.
3. **Q:** Which tool family would you add to correlate endpoint alerts with network, email, and cloud telemetry in one view? **A:** **extended detection and response (XDR)** — it unifies EDR, network, cloud, and identity signals for correlated detection.`,
			position: 4
		},
		{
			id: 'lesson-3-1',
			moduleId: 'week-3',
			objectiveIds: ['4.6', '4.7', '4.8', '4.9'],
			title: 'Domain 4 — Security Operations (Part II)',
			summary:
				'Identity and access management, NAC, DLP, email and DNS security, incident response, and digital forensics.',
			content: `**Objectives covered:** 4.6–4.9 · **Exam weight:** Domain 4 total is 28% (~25 questions)

## 4.6 Given a scenario, implement and maintain identity and access management.

- **Identity lifecycle** — **provisioning** creates accounts and entitlements at onboarding; **de-provisioning** removes them on termination or role change (disable first, then delete; revoke tokens and certificates; recover laptops, badges, and **security keys**). Recertify accounts on a schedule so stale access never lingers.
- **Permission models** — compare before choosing:

| Model | Basis | Example |
|---|---|---|
| **Discretionary (DAC)** | owner sets permissions per object | share one folder with a teammate |
| **Role-based (RBAC)** | access derives from job role | every help-desk analyst gets the same ticket queue |
| **Rule-based** | conditions such as source, time, or action | block logins from foreign IPs |
| **Attribute-based (ABAC)** | any attribute (department, clearance, device) | managers see reports only on managed laptops |

Apply **time-of-day restrictions** (logins allowed only 6 a.m.–8 p.m.) and **least privilege** (only the access a task requires) to every assignment.
- **Identity proofing** — verify the person before issuing credentials: in-person or video registration, document checks, knowledge-based verification. Used at onboarding, password reset, and for high-risk roles.
- **Federation & SSO** — **federation** establishes trust between identity providers so credentials work across organizations; **single sign-on** (SSO) lets one login reach many applications. **LDAP** queries the directory for users, groups, and attributes; **OAuth** delegates authorization with scoped tokens; **SAML** (**security assertions markup language**) carries browser-based SSO assertions between the identity provider and service providers. **Attestation** — confirmation that a claim is true: device attestation proves hardware/OS state to NAC or MDM before access is granted.
- **Authentication factors** — **multifactor authentication** requires two of knowledge, possession, and inherence. **Biometrics** (fingerprint, iris, voice, face) trade false-accept against false-reject rates; **security keys** are phishing-resistant hardware (FIDO2/WebAuthn, passkeys); **password managers** generate and store unique credentials; **passwordless** sign-in (passkey, biometric, magic link) removes shared secrets entirely.
- **Privileged access management (PAM)** — vault admin credentials and rotate them (**password vaulting**), grant **just-in-time permissions** that expire when the task ends, and issue **ephemeral credentials** (short-lived tokens or session credentials) so a stolen secret dies quickly.

## 4.7 Explain the importance of automation and orchestration related to secure operations.

- **Automation** — scripts and tooling that run security tasks without manual steps; **orchestration** chains multiple automated tools into one workflow (SOAR playbooks). Use cases: **user provisioning** and **resource provisioning** (create accounts, spin up/down cloud resources, apply security groups), **guard rails** (automated checks that block non-compliant configurations before deploy), and **ticket creation** (alerts auto-open and enrich tickets with context).
- **Benefits** — **efficiency** (tasks finish in seconds, reaction time drops), **enforcing baselines** (standard configurations applied consistently), and a **workforce multiplier** (a small team handles a much larger workload), plus fewer human errors and repeatable CI/testing.
- **Cautions** — a failing script can become a **single point of failure** (one broken step halts the whole flow), unmaintained scripts accumulate **technical debt**, and every workflow needs **ongoing supportability** (owners, documentation, versioning, testing). Integrations run through **application programming interfaces** (APIs), so secure them with authentication, authorization, rate limits, and least-privilege credentials — and audit API logs for abuse.

## 4.8 Explain appropriate incident response activities.

- **IR process (NIST SP 800-61)** — **Preparation** (plan, playbooks, tools) → **Detection** (monitoring, alerts, triage) → **Containment** (isolate the host, preserve evidence) → **Eradication** (remove malware, patch the hole) → **Recovery** (restore from clean backups, validate) → **Lessons learned** (report, fix gaps). The classic six phases split the middle into Identification, Containment, Eradication, Recovery.
- **Training & testing** — a **tabletop exercise** walks the team through a scenario verbally; a **simulation** runs a technical drill (for example, a fake ransomware host). Both expose gaps in roles, communications, and tools before a real incident.
- **Analysis** — **root cause analysis** finds why the incident happened (not just what happened) so it cannot recur; **threat hunting** proactively searches for hidden compromise (dwell time, anomalies, indicators of compromise) instead of waiting for alerts.
- **Digital forensics** — preserve evidence for both remediation and legal use: **legal hold** freezes relevant data when litigation is expected; **chain of custody** documents who handled each item, when, and why; **acquisition** makes forensic images of disk or memory with write blockers; **preservation** keeps bit-for-bit copies and hashes them (SHA-256) for integrity; **e-discovery** collects and produces electronic evidence for court. Collect in order of volatility: registers/cache → RAM → network state → disk → remote logs.

## 4.9 Given a scenario, use data sources to support an investigation.

| Source | What it shows | Typical question |
|---|---|---|
| **Firewall logs** | allowed/blocked flows, policy hits | Which host talked to the C2 IP? |
| **Application logs** | app-level errors, auth events, transactions | Was the web app exploited? |
| **Endpoint logs** | process, file, and registry activity on devices | What did the malware execute? |
| **OS-specific security logs** | logon events, audit policy, account changes | Who logged in at 3 a.m.? |
| **IPS/IDS logs** | detection alerts, signatures, anomalies | Which exploit signature fired? |
| **Network logs** | flows, DNS, DHCP, NetFlow | How did the attacker move laterally? |

- **Corroborate across sources** — pair **firewall logs** (connection) with **endpoint logs** (process) and **network logs** (flow) to reconstruct an attack path; never conclude from a single log.
- **Supporting sources** — **vulnerability scans** show the patch and configuration gaps the attacker exploited; **automated reports** (scheduled compliance, status, or health reports) give baseline context; **dashboards** (SIEM/EDR visualizations) surface trends and anomalies; **packet captures** reveal full payloads and protocol details; **metadata** (file timestamps, email headers, document properties) establishes timing, origin, and authorship.

## Sample questions

1. **Q:** A terminated employee's badge still opens the server room. Which control is missing? **A:** De-provisioning — access must be removed the moment employment ends, covering both logical and physical credentials.
2. **Q:** During an investigation, a lawyer freezes an employee's mailbox and drives pending litigation. Which practice is this? **A:** Legal hold — it preserves potentially relevant electronic evidence so it is not destroyed.
3. **Q:** Which data source best shows the actual payload of a suspicious connection? **A:** Packet capture — it records full packet contents, unlike summaries in firewall or flow logs.`,
			position: 5
		},
		{
			id: 'lesson-3-2',
			moduleId: 'week-3',
			objectiveIds: ['5.1', '5.2', '5.3', '5.4', '5.5', '5.6'],
			title: 'Domain 5 — Security Program Management & Oversight',
			summary:
				'Governance and policy, risk management, third-party risk, compliance, audits and assessments, and security awareness.',
			content: `**Objectives covered:** 5.1–5.6 · **Exam weight:** Domain 5 total is 20% (~18 questions)

## 5.1 Summarize elements of effective security governance.

- **Document hierarchy** — **policies** (high-level mandatory intent, board-approved) → **standards** (specific mandatory requirements, e.g., NIST 800-53) → **procedures** (step-by-step how-to) → **guidelines** (recommended, not mandatory).
- **Policy types** — the **acceptable use policy** (AUP) defines allowed use of systems; **information security policies** set the program's direction (password, data classification, retention); **business continuity** and **disaster recovery** plans keep operations alive and restore IT; the **incident response** policy defines roles and reporting; **software development lifecycle** (SDLC) policies require security gates in development; **change management** policies control how changes are approved, tested, and rolled back.
- **Roles & responsibilities** — **owners** are accountable for the data and classification decisions; **controllers** decide the purpose and means of processing; **processors** handle data on the controller's behalf; **custodians** implement the technical controls; **stewards** manage day-to-day data quality and governance.
- **Governance structures** — **boards** set strategy and risk appetite; **committees** (security, privacy, change advisory) make operational decisions; governance may be **centralized** (one team decides) or **decentralized** (business units own their security) — choose by organization size and risk profile.
- **Monitoring and revision** — review policies on a fixed cycle (annually at minimum), after major incidents, and when regulations change; version and communicate every revision.
- **External considerations** — **regulatory** (laws and standards), **legal** (contracts, liability), and **industry** (sector-specific frameworks such as PCI DSS or HIPAA) requirements shape policy content and the review cadence.

## 5.2 Explain elements of the risk management process.

- **Risk identification** — catalog threats, vulnerabilities, and assets; record each in a **risk register** with likelihood, impact, owner, response, and status.
- **Risk assessment** — may be **ad hoc** (unplanned), **recurring** (scheduled), or **continuous** (driven by real-time monitoring).
- **Risk analysis** — **qualitative** ranks by scales (high/medium/low, likelihood × impact); **quantitative** uses numbers: **exposure factor** (EF, the percentage of asset value lost), **single loss expectancy** (SLE = asset value × EF), **annualized rate of occurrence** (ARO, times per year), and **annualized loss expectancy** (ALE = SLE × ARO). Example: $200,000 asset, EF 25%, ARO 2 → SLE $50,000, ALE $100,000/year.
- **Risk tolerance vs risk appetite** — **risk appetite** is how much risk the organization is willing to take overall; **risk tolerance** is the acceptable deviation for a specific objective. Set thresholds so decisions stay consistent.
- **Risk responses** — **transfer** (insurance, outsourcing), **accept** (documented residual risk), **exemption** (permanent relief from a control, senior-approved), **exception** (temporary relief with a due date), **avoid** (drop the activity), and **mitigate** (reduce likelihood or impact with controls).
- **Risk reporting** — regular summaries to management; **key risk indicators** (KRIs) flag when risk approaches tolerance (for example, the percentage of systems past the patch SLA).
- **Business impact analysis (BIA)** — identifies critical systems and sets targets: **recovery time objective** (RTO, maximum acceptable downtime), **recovery point objective** (RPO, maximum acceptable data loss), **mean time to repair** (MTTR), and **mean time between failures** (MTBF).

## 5.3 Explain the processes associated with third-party risk assessment and management.

- **Vendor assessment** — evaluate a vendor's security before contracting: evidence of internal audits, **independent assessments** (SOC 2, ISO certification), **supply chain analysis** (sub-tier suppliers, dependencies), and a **right-to-audit** clause that lets you inspect their controls.
- **Vendor selection** — **due diligence** reviews financial health, reputation, and security posture; watch for **conflict of interest** (for example, an evaluator with a stake in the vendor).
- **Agreement types** — match the document to the relationship:

| Document | Purpose |
|---|---|
| **Service-level agreement** (SLA) | uptime, response, and performance commitments |
| **Memorandum of agreement** (MOA) | formal collaboration with defined obligations |
| **Memorandum of understanding** (MOU) | intent to cooperate, less formal |
| **Master service agreement** (MSA) | umbrella terms for ongoing services |
| **Statement of work** (SOW) | scope and deliverables for a specific engagement |
| **Non-disclosure agreement** (NDA) | confidentiality of shared information |
| **Business partners agreement** (BPA) | terms for partner relationships |

- **Vendor monitoring** — reassess continuously, not only at onboarding: **questionnaires**, control evidence, and review of penetration test results; define **rules of engagement** (scope, authorization, timing) for any testing the vendor performs on your environment.

## 5.4 Summarize elements of effective security compliance.

- **Compliance reporting** — provide internal (management, board) and external (regulators, auditors, customers) evidence that controls meet requirements. Non-compliance brings **fines**, **sanctions**, loss of license, and **reputational damage** — so track obligations and deadlines.
- **Compliance monitoring** — exercise **due diligence** (and due care) in selecting and overseeing providers; collect **attestation** and acknowledgement that staff understand policies; automate evidence collection where possible.
- **Privacy** — **privacy** rules protect individuals' information: the **data subject** is the person whose data is processed; the **controller** decides purpose and means; the **processor** acts on the controller's behalf; the **right to be forgotten** lets subjects request erasure; **data inventory and retention** maps what data exists, where, and how long it is kept.
- **Key regulations** — **GDPR** (EU privacy, breach notification within 72 hours, right to be forgotten), **HIPAA** (US health data, PHI), **PCI DSS** (cardholder data), **SOX** (financial reporting controls), **FERPA** (education records), and **GLBA** (financial privacy). Know which apply to your organization's data types and locations.

## 5.5 Explain types and purposes of audits and assessments.

- **Audit types** — **internal** audits are run by the organization's own team; **external** audits are performed by an outside firm; **self-assessments** are lightweight internal reviews; **regulatory** audits verify compliance with specific laws; an **audit committee** (board-level) oversees the whole program; **independent third-party** assessments (SOC 2, ISO 27001 certification) add credibility for customers.
- **Attestation** — the auditor's formal statement of findings (for example, a SOC 2 Type II attestation) that others rely on.
- **Penetration testing** — authorized attacks that validate controls: **offensive** testing (red team) simulates attackers; **defensive** testing (blue team) validates detection and response; **integrated** (purple team) testing combines both for collaboration. Scope choices: **known environment** (white box, full knowledge) versus **unknown environment** (black box, no prior knowledge). Work begins with **reconnaissance** — **passive** (observing public information and OSINT, sending no traffic) or **active** (scanning and probing the target).

## 5.6 Given a scenario, implement security awareness practices.

- **Phishing** — run **phishing** campaigns (simulated emails) to measure click rates, train on recognizing attempts (urgency, spoofed domains, unexpected attachments), and define how to respond to reported messages (triage, block, notify).
- **Anomalous behavior** — teach users to recognize **anomalous behavior** (unexpected prompts, odd file names, unusual account activity); build **insider threat** awareness — risky, unexpected, or unintentional actions by people with legitimate access.
- **User guidance** — deliver **user guidance** through policies, handbooks, and onboarding; build **situational awareness** (tailgating, shoulder surfing, clean desk); cover **hybrid/remote work** (home networks, public Wi-Fi, VPN, screen privacy).
- **Habits** — **password management** (unique passwords, password managers, no reuse) and careful handling of **removable media** (unknown USB devices, malware via thumb drives).
- **Social engineering & OPSEC** — train against **social engineering** (pretexting, baiting, vishing) and protect **operational security** (do not reveal schedules, credentials, or internal details in public).
- **Reporting and monitoring** — establish clear reporting channels (help desk, security team, anonymous hotline) with a no-blame culture; **reporting and monitoring** of click rates, completion rates, and time-to-report feeds program development and recurring refresher training.

## Sample questions

1. **Q:** A finance app stores cardholder data. Which regulation most directly applies? **A:** PCI DSS — it governs the processing, storage, and transmission of cardholder data.
2. **Q:** Which risk response is a senior-approved permanent waiver from a required control? **A:** Exemption — it grants lasting relief, whereas an exception is temporary with a due date.
3. **Q:** A firm sends simulated emails to staff and tracks who clicks. Which practice is this? **A:** Phishing campaign — part of a security awareness program that measures and reduces susceptibility.`,
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
- [ ] Score at or above the app's practice-readiness target (83.3%) on at least one full exam → the readiness ring on the home page should read "Exam-ready"

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
- **Scoring** — the official exam requires a scaled score of **750** (of 900); CompTIA publishes no raw-score conversion, so treat 83.3% here as the app's practice-readiness target, not an official pass percentage. No penalty for guessing — never leave a question blank.
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
				'Final 90-question, 90-minute exam. Hit the app practice target (83.3%) or higher — the official exam requires a scaled 750 with no published raw-score conversion.',
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
	'secp-701': COURSE_DEFINITION,
	'aplus-1201': APLUS_1201_COURSE,
	'aplus-1202': APLUS_1202_COURSE
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
export const ACTIVE_COURSES: CourseId[] = ['secp-701', 'aplus-1201', 'aplus-1202'];

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
	/** App-defined practice-readiness target (percent of the exam scale) — NOT an official projection. */
	practiceTargetPercent: number;
	/** Official scaled passing score (750 for SY0-701). CompTIA publishes no raw-score conversion. */
	officialPassingScore: number;
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

	const practiceTargetPercent = Math.round((passingScore / scaleMax) * 1000) / 10;

	return {
		score,
		label,
		domainMastery,
		examAverage,
		examCount: completedFullExams.length,
		practiceTargetPercent,
		officialPassingScore: passingScore,
		ready: score >= (passingScore / scaleMax) * 100
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
