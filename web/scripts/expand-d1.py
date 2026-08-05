#!/usr/bin/env python3
"""Expand Domain 1 MCQs (+16: 1.1-1.4 each +4)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import importlib
banklib = importlib.import_module("bank-lib")
load_bank = banklib.load_bank
merge = banklib.merge
opt = banklib.opt


def q(id_, obj, kind, sel, prompt, context, options, correct, explanation, refs):
    return {
        "id": id_, "domain": 1, "objective": obj, "format": "scenario",
        "prompt": prompt, "context": context, "kind": kind, "options": options,
        "correctOptionIds": correct, "selectCount": sel,
        "explanation": explanation, "sourceRefs": refs,
    }


R = lambda obj, src="study-guide", sec=None: [
    {"source": "exam-objectives", "section": f"Objective {obj}"},
    {"source": src, "section": sec or f"Domain 1 - General Security Concepts"},
]

NEW = []

# ---- 1.1 Security controls (+4) ----
NEW.append(q("mcq-1-025", "1.1", "single-choice", 1,
    "An organization's board of directors approves a new remote-work security policy that mandates full-disk encryption on all laptops and prohibits the use of personal cloud storage for company data. The CISO then assigns the IT department to implement the technical controls and the HR department to enforce the policy during onboarding. How should the policy itself be classified?",
    "A board-approved policy mandates full-disk encryption and prohibits personal cloud storage. IT implements technical controls; HR enforces during onboarding.",
    [opt("a", "Technical control", "Technical controls are implemented with hardware/software (encryption, firewalls). The policy itself is not a technical mechanism."),
     opt("b", "Managerial control", "A board-approved security policy that sets direction, assigns responsibility, and mandates behavior is a managerial (administrative) control. It governs the program rather than enforcing a specific mechanism."),
     opt("c", "Operational control", "Operational controls are day-to-day execution tasks like patching and guard rotations. The policy itself is the governance layer above those tasks."),
     opt("d", "Physical control", "Physical controls are tangible barriers like locks and fences, not governance documents.")],
    ["b"],
    "Managerial controls include policies, standards, procedures, risk assessments, and governance decisions. The policy directs the organization; IT's encryption work is technical, and HR's enforcement is operational execution of that managerial directive.",
    R("1.1")))

NEW.append(q("mcq-1-026", "1.1", "single-choice", 1,
    "A company places prominent signs at its loading dock stating that all vehicles are subject to random inspection and that the area is monitored by CCTV. The signs alone, before any camera footage is reviewed, are BEST described as which type of security control?",
    "Loading dock signs state vehicles are subject to random inspection and the area is monitored by CCTV.",
    [opt("a", "Detective", "CCTV footage review is detective; the signs themselves do not detect anything."),
     opt("b", "Deterrent", "Warning signs discourage potential intruders by increasing the perceived risk of being caught. Their function is to deter, not to detect, prevent, or correct."),
     opt("c", "Preventive", "Preventive controls stop unauthorized access outright (locks, gates). Signs only discourage; they do not physically stop anyone."),
     opt("d", "Corrective", "Corrective controls restore the environment after an incident (backups, repairs). Signs do not restore anything.")],
    ["b"],
    "Deterrent controls are designed to discourage malicious activity by making the consequences or detection likelihood visible. Signs, lighting, and visible camera housings are classic deterrents — they influence behavior rather than block or detect.",
    R("1.1")))

NEW.append(q("mcq-1-027", "1.1", "single-choice", 1,
    "A manufacturing plant runs a 15-year-old programmable logic controller (PLC) that cannot receive security patches because the vendor no longer supports it. The plant cannot afford to replace it this year. To protect it, the security team places the PLC on a dedicated VLAN, restricts all inbound access to a single jump host, and adds an inline IPS rule that blocks the known exploit patterns. These measures are BEST classified as which control type?",
    "An unsupported PLC cannot be patched. The team segments it onto a dedicated VLAN, restricts access via a jump host, and adds IPS rules blocking known exploits.",
    [opt("a", "Preventive", "The measures do prevent exploitation, but the more precise classification is compensating, because they substitute for the primary control (patching) that cannot be applied."),
     opt("b", "Compensating", "When the ideal control (a vendor patch) is unavailable, alternative controls that achieve a similar protective effect — segmentation, access restriction, IPS virtual patching — are compensating controls."),
     opt("c", "Corrective", "Corrective controls act after an incident. These measures are applied proactively."),
     opt("d", "Managerial", "Managerial controls are governance documents and decisions. These are technical mechanisms.")],
    ["b"],
    "Compensating controls provide an alternative layer of protection when the preferred control is not feasible. Segmentation, jump-host restriction, and IPS virtual patching are the standard compensating approach for unpatched legacy systems.",
    R("1.1")))

NEW.append(q("mcq-1-028", "1.1", "single-choice", 1,
    "A security analyst reviews alerts and notices that the intrusion detection system generated 40 alerts overnight, of which 3 were confirmed true positives. The analyst opens a ticket for each alert, investigates, and documents the outcome. In this workflow, the analyst's review and documentation activity itself is BEST classified as which control type?",
    "An analyst reviews 40 IDS alerts, confirms 3 true positives, opens tickets, investigates, and documents outcomes.",
    [opt("a", "Detective", "The IDS is the detective control. The analyst's review confirms and documents what was detected — that is a detective/administrative follow-on, but the question asks about the review and documentation activity, which is a detective process."),
     opt("b", "Preventive", "Reviewing alerts after the fact does not stop attacks; prevention happens before exploitation."),
     opt("c", "Corrective", "Corrective controls restore systems after an incident. Ticket documentation is not restoration."),
     opt("d", "Deterrent", "Deterrents discourage attackers; alert review has no effect on attacker behavior.")],
    ["a"],
    "Detective controls identify and document security events. Log review, alert triage, and audit analysis are detective activities; they discover incidents that prevention missed. The IDS is the technical detective control and the analyst review is the operational detective process.",
    R("1.1")))

# ---- 1.2 Core concepts (+4) ----
NEW.append(q("mcq-1-029", "1.2", "single-choice", 1,
    "A company deploys an identity-aware proxy in front of its internal application. When a user requests access, the proxy evaluates the user's identity, device posture, and location against policy, and only then establishes a connection to the application server on the user's behalf. Which Zero Trust component does the proxy primarily act as?",
    "An identity-aware proxy evaluates identity, device posture, and location against policy before connecting users to an internal application.",
    [opt("a", "Policy Engine (PE)", "The PE renders the grant/deny decision, but it typically evaluates policy as a separate logical component, not the enforcement point that terminates user connections."),
     opt("b", "Policy Enforcement Point (PEP)", "The PEP is the component that allows, denies, or terminates the actual session at the data plane. An identity-aware proxy enforcing policy before establishing the connection is the classic PEP."),
     opt("c", "Policy Administrator (PA)", "The PA communicates the decision to the PEP and sets up the communication path; it does not enforce the session itself."),
     opt("d", "Data plane controller", "The data plane carries traffic; the controller function is part of the control plane decision process, not the enforcement device.")],
    ["b"],
    "In NIST SP 800-207, the Policy Enforcement Point is the system that permits or denies a session between a subject and a resource. Identity-aware proxies, gateways, and VPN concentrators act as PEPs: they enforce the control plane's decisions at the data plane.",
    R("1.2", "nist", "NIST SP 800-207 Zero Trust Architecture")))

NEW.append(q("mcq-1-030", "1.2", "single-choice", 1,
    "A bank customer claims they never authorized a $5,000 wire transfer. The bank's system shows the transfer was submitted with the customer's digital certificate, and the audit log records the exact time, originating IP, and session ID. Which security goal does the digital certificate primarily establish?",
    "A customer denies authorizing a wire transfer, but the transfer was signed with their digital certificate and the audit log captured time, IP, and session ID.",
    [opt("a", "Confidentiality", "Confidentiality protects data from unauthorized disclosure; the certificate here is not being used to encrypt the transfer record."),
     opt("b", "Availability", "Availability ensures systems and data are accessible when needed; it is not the issue in a disputed transaction."),
     opt("c", "Non-repudiation", "A digital signature binds the transaction to the certificate holder and cannot be plausibly denied afterward. Combined with audit logging, this establishes non-repudiation."),
     opt("d", "Integrity", "Integrity ensures data was not modified. The certificate does provide integrity, but the scenario is about proving who authorized the action, which is non-repudiation.")],
    ["c"],
    "Non-repudiation prevents a party from denying an action. Digital signatures provide proof of origin and integrity; audit logs add evidence of when and where. Together they make the customer's denial unsustainable.",
    R("1.2")))

NEW.append(q("mcq-1-031", "1.2", "single-choice", 1,
    "A hospital grants access to electronic health records based on the requesting user's job role (e.g., nurse, physician, pharmacist) and the patient's current admission status. Access is re-evaluated dynamically as roles and patient status change. Which authorization model does this BEST describe?",
    "Access to health records is granted by job role and patient admission status, re-evaluated dynamically as attributes change.",
    [opt("a", "Discretionary access control (DAC)", "DAC lets resource owners set permissions per object. The hospital model is driven by attributes, not owner discretion."),
     opt("b", "Role-based access control (RBAC)", "RBAC assigns permissions to roles, which fits the job-role component, but the model also uses patient admission status — an attribute — making ABAC the fuller answer."),
     opt("c", "Attribute-based access control (ABAC)", "ABAC evaluates policies against subject attributes (role), object attributes (patient status), and environmental attributes, with dynamic re-evaluation. This matches the scenario exactly."),
     opt("d", "Mandatory access control (MAC)", "MAC uses classification labels and clearances (e.g., Top Secret). Healthcare role/status access is not label-based.")],
    ["c"],
    "ABAC grants access based on attributes of the subject, object, and environment evaluated against policy — often dynamically. RBAC is a subset concept; the combination of role plus patient status plus dynamic re-evaluation is the ABAC signature.",
    R("1.2")))

NEW.append(q("mcq-1-032", "1.2", "single-choice", 1,
    "During a security assessment, an auditor finds that terminated employees' accounts remain active for an average of 6 days after termination, and that two former employees logged in after leaving. The auditor recommends automated deprovisioning tied to the HR system. Which security concept is the auditor primarily enforcing?",
    "An auditor finds terminated employees' accounts stay active ~6 days and two former employees logged in after leaving. Recommendation: automated deprovisioning tied to HR.",
    [opt("a", "Authentication", "Authentication verifies identity at login. The problem is that deactivated identities are still valid, not that verification is weak."),
     opt("b", "Accounting", "Accounting tracks user activity in logs. Logging exists; the gap is that unauthorized identities still have access."),
     opt("c", "Authorization", "Authorization determines what an identity may access. The former employees should have had all authorization revoked at termination; the gap is deprovisioning, but the deeper concept is identity lifecycle — the account should no longer exist. Authorization is the closest fit for 'former employees logged in'."),
     opt("d", "Availability", "Availability concerns uptime and resilience, unrelated to account lifecycle.")],
    ["c"],
    "The core issue is that terminated users retained authorization to access resources. Automated deprovisioning (identity lifecycle management) enforces authorization by revoking access at the moment employment ends, closing the window in which ex-employees can authenticate and use resources.",
    R("1.2")))

# ---- 1.3 Change management (+4) ----
NEW.append(q("mcq-1-033", "1.3", "single-choice", 1,
    "A network engineer proposes changing the company firewall rules to allow a new vendor connection. Per the change management policy, the request must be reviewed and approved by a group of stakeholders who assess risk, impact, and rollback before implementation during a scheduled maintenance window. Which body performs this approval?",
    "A firewall rule change must be reviewed by a group of stakeholders who assess risk, impact, and rollback before implementation in a maintenance window.",
    [opt("a", "Change Advisory Board (CAB)", "The CAB reviews proposed changes, assesses risk and impact, approves or rejects them, and schedules implementation — exactly the described workflow."),
     opt("b", "Incident response team", "The IR team responds to active incidents; it does not approve routine planned changes."),
     opt("c", "Configuration management database (CMDB) team", "The CMDB stores configuration items and relationships; it is a repository, not an approval body."),
     opt("d", "Vendor management office", "Vendor management handles contracts and supplier relationships, not firewall change approvals.")],
    ["a"],
    "The Change Advisory Board (CAB) is the governance body that reviews changes for risk, business impact, and rollback feasibility, then approves or denies them. Change windows, backout plans, and documentation are standard CAB requirements.",
    R("1.3")))

NEW.append(q("mcq-1-034", "1.3", "single-choice", 1,
    "An administrator applies a database security patch during the approved change window. Immediately afterward, the order-processing application begins returning errors because the patch changed a query optimization behavior the application relied on. What should the administrator do FIRST?",
    "A database security patch breaks the order-processing application during the change window.",
    [opt("a", "Restore the database from the last full backup taken before the change", "Restoring from backup is a recovery option, but the first action for a failed change with a documented backout is to execute the rollback plan, which typically reverses the change rather than reloading data."),
     opt("b", "Execute the documented rollback plan for the patch", "Change management requires a rollback/backout plan before implementation. When a change fails, the first step is executing that plan to return the system to its known-good state."),
     opt("c", "Apply the next available patch to fix the regression", "Applying another unvetted change compounds the risk and violates change management discipline."),
     opt("d", "Reboot the application server and retry", "Rebooting does not address the patch-induced behavior change and is unlikely to restore function.")],
    ["b"],
    "A rollback plan is a mandatory part of every change request. When a change causes unexpected failure, the change owner executes the documented backout procedure first, then reports the incident through the change management process for root-cause analysis.",
    R("1.3")))

NEW.append(q("mcq-1-035", "1.3", "single-choice", 1,
    "A development team wants to upgrade the web framework used by the company's customer portal. Before any production deployment, the team is required to implement and test the upgrade in an isolated environment that mirrors production and contains no real customer data. Which change management practice does this represent?",
    "A web framework upgrade must be implemented and tested in an isolated environment that mirrors production before deployment.",
    [opt("a", "Sandboxing", "Testing a change in an isolated, production-like environment before deployment is sandboxing — it contains risk and validates behavior without affecting production."),
     opt("b", "Rollback", "Rollback is the backout action after a failed deployment, not the pre-deployment test environment."),
     opt("c", "Version control", "Version control tracks code changes over time; it does not provide an isolated test environment."),
     opt("d", "Approval", "Approval is the CAB sign-off step; the described activity is the technical validation phase.")],
    ["a"],
    "Sandboxing changes in an isolated environment that mirrors production is a core change management practice: it validates the change, exposes incompatibilities, and prevents unplanned production impact. Production-like staging is the standard sandbox for infrastructure and application changes.",
    R("1.3")))

NEW.append(q("mcq-1-036", "1.3", "single-choice", 1,
    "In a company's change management process, the engineer who wrote the change request is explicitly prohibited from approving it, and the engineer who implements the change cannot be the same person who approves the post-implementation verification. Which principle does this enforce?",
    "The change requester cannot approve the change; the implementer cannot approve the post-implementation verification.",
    [opt("a", "Least privilege", "Least privilege grants the minimum access needed for a role. It is related but not the principle preventing a single person from controlling all change steps."),
     opt("b", "Separation of duties", "Separation of duties splits critical functions across multiple people so no single individual can both make and approve a change undetected — exactly what this policy enforces."),
     opt("c", "Defense in depth", "Defense in depth layers independent controls; it does not describe role separation."),
     opt("d", "Job rotation", "Job rotation periodically reassigns roles for fraud deterrence; the change policy is about concurrent role separation, not rotation.")],
    ["b"],
    "Separation of duties prevents fraud and error by requiring different individuals to perform request, approval, implementation, and verification steps. It is a foundational change management and internal control principle.",
    R("1.3")))

# ---- 1.4 Cryptography (+4) ----
NEW.append(q("mcq-1-037", "1.4", "single-choice", 1,
    "A security engineer needs to verify that a firmware image downloaded from a vendor's website has not been altered in transit and was genuinely produced by that vendor. Which cryptographic mechanism should be used?",
    "An engineer must verify a firmware image was not altered in transit and was genuinely produced by the vendor.",
    [opt("a", "Encrypt the image with a symmetric key shared with all customers", "Symmetric encryption provides confidentiality but cannot prove which party produced the data, and sharing one key with all customers would destroy confidentiality."),
     opt("b", "Verify the vendor's digital signature over the image's hash", "The vendor signs a hash of the image with their private key; anyone can verify with the public key. This proves both integrity (hash match) and authenticity/non-repudiation (valid signature)."),
     opt("c", "Compare the file size to the value published on the website", "File size is trivially spoofable and proves nothing about content integrity."),
     opt("d", "Store the image in a hash database for future reference", "Storing a hash only helps after the fact; it does not authenticate the download source.")],
    ["b"],
    "A digital signature over the image hash provides integrity (tamper detection via hash verification) and authenticity/non-repudiation (only the vendor's private key produces a valid signature). This is the standard firmware/software distribution integrity control.",
    R("1.4")))

NEW.append(q("mcq-1-038", "1.4", "single-choice", 1,
    "An attacker obtains the password hash database from a web application. The hashes were computed with SHA-256 and no salt. Within hours, the attacker matches most of the hashes by looking them up in a precomputed table of common passwords and their hashes. Which mitigation would have MOST effectively defeated this attack?",
    "An attacker matches unsalted SHA-256 password hashes against a precomputed table of common password hashes.",
    [opt("a", "Switching to SHA-512", "SHA-512 is still a fast hash without a work factor and remains vulnerable to precomputed tables and brute force."),
     opt("b", "Using a per-user random salt with a slow key derivation function", "A unique salt per user breaks precomputed tables (each hash must be computed per salt), and a slow KDF like bcrypt/scrypt/Argon2/PBKDF2 raises the cost of brute force dramatically."),
     opt("c", "Encrypting the hash database with AES-256", "Encryption protects the hashes at rest, but the password used to unlock the DB would be a single point of failure and does not fix the weak hash scheme."),
     opt("d", "Storing passwords in plaintext in a separate database", "Plaintext storage is strictly worse than any hashing scheme.")],
    ["b"],
    "Salting adds a random, per-user value before hashing, which defeats precomputed rainbow tables. A slow, adaptive KDF (bcrypt, scrypt, Argon2, PBKDF2) additionally raises the computational cost of offline guessing. This is the recommended password storage approach.",
    R("1.4", "owasp", "OWASP Top 10 A02 Cryptographic Failures")))

NEW.append(q("mcq-1-039", "1.4", "single-choice", 1,
    "A VPN gateway is configured to use ephemeral Diffie-Hellman key exchange, generating a fresh session key for every connection and discarding the key material when the session ends. What property does this configuration provide?",
    "A VPN uses ephemeral Diffie-Hellman, generating a fresh session key per connection and discarding key material after the session.",
    [opt("a", "Perfect forward secrecy", "With ephemeral keys, compromise of a long-term private key cannot be used to decrypt past recorded sessions, because each session's key material no longer exists. This is perfect forward secrecy."),
     opt("b", "Non-repudiation", "Non-repudiation proves the origin of data via signatures; ephemeral key exchange is about session confidentiality."),
     opt("c", "Availability", "Availability concerns uptime; the configuration affects cryptographic key lifetime, not service availability."),
     opt("d", "Key escrow", "Key escrow means a third party holds a copy of keys for recovery. Ephemeral keys are deliberately NOT recoverable.")],
    ["a"],
    "Perfect forward secrecy (PFS), provided by ephemeral Diffie-Hellman (DHE/ECDHE), ensures that a leaked long-term key cannot decrypt previously captured traffic because session keys are ephemeral and destroyed. PFS is a recommended VPN/TLS configuration.",
    R("1.4")))

NEW.append(q("mcq-1-040", "1.4", "single-choice", 1,
    "An organization stores sensitive documents in an encrypted file server. To recover data after a disaster, the organization's security officer must be able to decrypt the file server even if the original administrator's key is lost. A hardware security module (HSM) holds a copy of the master key under split custody. Which key management practice does this describe?",
    "An HSM holds a copy of the file server's master key under split custody so data can be decrypted if the administrator's key is lost.",
    [opt("a", "Key escrow", "Key escrow stores a copy of cryptographic keys with a trusted third party (or system) so they can be recovered when the primary key is lost — exactly the described arrangement."),
     opt("b", "Key rotation", "Key rotation replaces keys on a schedule; it does not preserve access when a key is lost."),
     opt("c", "Perfect forward secrecy", "PFS discards key material to protect past sessions; it is the opposite of recoverability."),
     opt("d", "Key stretching", "Key stretching (e.g., PBKDF2) strengthens weak passphrases; it is unrelated to recovery.")],
    ["a"],
    "Key escrow — holding key copies with a trusted party or secure module, often under split custody (e.g., M-of-N) — enables authorized recovery when primary keys are lost. HSMs are the standard platform for escrowed enterprise keys.",
    R("1.4")))

merge(load_bank(), new_mcqs=NEW)
