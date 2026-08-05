#!/usr/bin/env python3
"""Expand Domain 4 MCQs (+16: every objective -> 8)."""
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
        "id": id_, "domain": 4, "objective": obj, "format": "scenario",
        "prompt": prompt, "context": context, "kind": kind, "options": options,
        "correctOptionIds": correct, "selectCount": sel,
        "explanation": explanation, "sourceRefs": refs,
    }


R = lambda obj, src="study-guide", sec=None: [
    {"source": "exam-objectives", "section": f"Objective {obj}"},
    {"source": src, "section": sec or "Domain 4 - Security Operations"},
]

NEW = []

# ---- 4.1 Baselines/hardening (+2) ----
NEW.append(q("mcq-4-057", "4.1", "single-choice", 1,
    "An administrator is provisioning 200 identical Windows workstations. To ensure every system starts from the same hardened state, the team captures a standard image that includes security configurations, approved applications, and patch levels, then deploys it via the management tool. What is this image called?",
    "A standard image with security configs, approved apps, and patches deployed to 200 identical workstations.",
    [opt("a", "Golden image", "A golden image is the approved, hardened baseline used for consistent deployment of many systems."),
     opt("b", "Snapshot", "A snapshot captures a VM's state at a moment in time for rollback, not a deployment standard."),
     opt("c", "System image backup", "A system image backup is a recovery artifact, not a deployment baseline."),
     opt("d", "Container image", "Container images package applications for containers; workstations are not containers here.")],
    ["a"],
    "A golden image (baseline image) is the standard hardened configuration deployed to new systems, ensuring consistency, patch compliance, and secure defaults across the fleet.",
    R("4.1")))

NEW.append(q("mcq-4-058", "4.1", "multiple-choice", 2,
    "A security assessment of newly deployed Linux servers finds the Telnet service enabled, the SNMP community string set to 'public', and the root account permitted to log in over SSH with a password. Which TWO hardening actions address the findings?",
    "New Linux servers have Telnet enabled, SNMP community 'public', and root SSH password login permitted.",
    [opt("a", "Disable Telnet and use SSH with key-based authentication", "Telnet transmits plaintext and must be disabled; SSH with keys replaces it securely."),
     opt("b", "Configure SNMPv3 with strong authentication instead of community strings", "SNMPv3 uses authenticated users rather than plaintext community strings."),
     opt("c", "Enable SNMPv1 for compatibility", "SNMPv1 uses the same weak community-string model."),
     opt("d", "Allow root SSH login with passwords for convenience", "This is the insecure practice the audit flagged; it should be disabled."),
     opt("e", "Disable the SSH service entirely", "SSH is the secure management channel; disabling it breaks administration."),
     opt("f", "Configure a web-based console for management", "Web consoles are not a hardening fix for the flagged services.")],
    ["a", "b"],
    "Hardening includes disabling insecure protocols (Telnet), enforcing secure management (SSH keys), and using authenticated network management (SNMPv3). Root login over SSH with passwords should be disabled in favor of keys and privilege elevation.",
    R("4.1")))

# ---- 4.2 Endpoint security (+2) ----
NEW.append(q("mcq-4-059", "4.2", "single-choice", 1,
    "A security engineer needs endpoint protection that not only detects malware but also automatically isolates an infected host from the network, performs memory/process investigation, and can roll back malicious changes. Which solution category fits?",
    "Endpoint protection that detects, auto-isolates, investigates memory/processes, and rolls back malicious changes.",
    [opt("a", "EDR (Endpoint Detection and Response)", "EDR provides behavioral detection, automated containment (isolation), deep investigation, and rollback — exactly the described capabilities."),
     opt("b", "Signature-based antivirus", "Signature AV detects known malware but does not isolate, investigate, or roll back."),
     opt("c", "Web application firewall", "A WAF protects web applications, not endpoints."),
     opt("d", "Network access control", "NAC enforces admission policy; it lacks endpoint investigation and rollback.")],
    ["a"],
    "EDR/XDR continuously monitors endpoints, uses behavioral analytics, automates containment (host isolation), supports forensic investigation, and can roll back ransomware-style changes. XDR extends the same approach across network, email, and cloud.",
    R("4.2")))

NEW.append(q("mcq-4-060", "4.2", "single-choice", 1,
    "An organization wants to ensure that only approved applications can execute on employee workstations, blocking everything else including portable executables dropped by malware. Which endpoint control provides this?",
    "Only approved applications may execute; everything else (including dropped malware executables) is blocked.",
    [opt("a", "Application allow-listing", "Allow-listing permits only explicitly approved applications to run — blocking all unapproved executables by default."),
     opt("b", "Application deny-listing", "Deny-listing blocks known-bad applications but allows unknown malware through by default."),
     opt("c", "Host firewall", "A host firewall controls network traffic, not process execution."),
     opt("d", "Full-disk encryption", "Encryption protects data at rest; it does not control application execution.")],
    ["a"],
    "Application allow-listing (default-deny) is the strongest application control: only approved hashes/publishers/paths execute, so malware that relies on dropping executables is blocked. Deny-listing (default-allow) is weaker against unknown threats.",
    R("4.2")))

# ---- 4.3 Mobile & wireless (+2) ----
NEW.append(q("mcq-4-061", "4.3", "single-choice", 1,
    "A company issues smartphones to employees for both work and personal use. The devices are corporate-owned, enrolled in the management platform, and the company can wipe or restrict them, while employees may install personal apps in a separate container. Which deployment model is this?",
    "Corporate-owned phones used for work and personal purposes, MDM-enrolled, with a separate personal app container.",
    [opt("a", "COPE (Corporate-Owned, Personally Enabled)", "COPE = corporate-owned devices permitted for personal use, managed by the organization with containerization."),
     opt("b", "BYOD", "BYOD = employee-owned devices; here the company owns them."),
     opt("c", "CYOD", "CYOD lets employees choose from approved devices; ownership may vary but the described model is company-owned with personal use."),
     opt("d", "VDI", "VDI is virtual desktops, not a mobile ownership model.")],
    ["a"],
    "COPE (corporate-owned, personally enabled) gives the organization full management and wipe authority while allowing personal use, typically via app containerization — the balance of control and employee flexibility.",
    R("4.3")))

NEW.append(q("mcq-4-062", "4.3", "single-choice", 1,
    "A security consultant is asked to recommend a Wi-Fi authentication method that resists offline dictionary attacks and provides forward secrecy. Which protocol should be recommended?",
    "Wi-Fi authentication resistant to offline dictionary attacks with forward secrecy.",
    [opt("a", "WPA3 with SAE", "WPA3's SAE (Simultaneous Authentication of Equals) handshake resists offline dictionary attacks and provides forward secrecy — the correct recommendation."),
     opt("b", "WPA2 with PSK", "WPA2-PSK is vulnerable to offline dictionary attacks on the captured handshake."),
     opt("c", "WEP", "WEP is broken and must never be used."),
     opt("d", "WPA2 with TKIP", "TKIP is deprecated and also vulnerable; CCMP/AES is required.")],
    ["a"],
    "WPA3 replaces the WPA2-PSK four-way handshake with SAE, which uses a dragonfly key exchange — resistant to offline dictionary/brute-force attacks and providing forward secrecy. WPA2-PSK handshakes can be captured and cracked offline.",
    R("4.3")))

# ---- 4.4 Monitoring & logging (+2) ----
NEW.append(q("mcq-4-063", "4.4", "single-choice", 1,
    "A SOC receives syslog feeds from firewalls, servers, and authentication systems, correlates events to detect multi-stage attacks, and generates alerts based on rules. Which platform provides these capabilities?",
    "Aggregating syslog feeds, correlating events across sources, and alerting on multi-stage attacks.",
    [opt("a", "SIEM", "A SIEM centralizes logs, normalizes and correlates events, and produces alerts — the described platform."),
     opt("b", "EDR", "EDR monitors endpoints specifically, not multi-source log correlation."),
     opt("c", "SOAR", "SOAR automates response actions and orchestration; it typically consumes SIEM alerts rather than performing the correlation."),
     opt("d", "NAC", "NAC enforces admission control; it does not aggregate or correlate logs.")],
    ["a"],
    "A SIEM (Security Information and Event Management) aggregates and normalizes logs from diverse sources, correlates events (e.g., login + firewall + server activity) to detect multi-stage attacks, and alerts analysts.",
    R("4.4")))

NEW.append(q("mcq-4-064", "4.4", "single-choice", 1,
    "An organization requires that security logs be preserved so that even a compromised administrator cannot silently alter historical records. Which control BEST achieves this?",
    "Security logs must survive tampering by a compromised administrator.",
    [opt("a", "Forward logs to a centralized, append-only/WORM store with restricted access", "Centralizing logs on immutable (WORM) storage with separation of duties prevents a compromised admin from altering history."),
     opt("b", "Store logs locally on each server", "Local logs are the first thing attackers modify."),
     opt("c", "Allow admins to delete logs older than 30 days", "Deletion privileges defeat tamper resistance."),
     opt("d", "Compress logs to save space", "Compression does not protect integrity or prevent alteration.")],
    ["a"],
    "Log integrity requires centralized collection to tamper-evident storage (append-only/WORM), access separation, and hashing/timestamping. Attackers with local admin can modify or delete local logs; off-host immutable storage resists that.",
    R("4.4", "nist", "NIST SP 800-92 Log Management")))

# ---- 4.5 Vulnerability management (+2) ----
NEW.append(q("mcq-4-065", "4.5", "single-choice", 1,
    "A vulnerability scanner reports a critical-severity flaw (CVSS 9.8) in a customer-facing web application. The flaw is not yet known to be exploited in the wild, and the application is not internet-accessible — it is internal only. According to risk-based prioritization, how should the team proceed?",
    "CVSS 9.8 flaw in an internal-only web app with no known exploitation in the wild.",
    [opt("a", "Patch immediately regardless of context", "Severity alone does not dictate priority; context (exposure, exploitability) matters."),
     opt("b", "Prioritize based on exposure, exploitability, and business impact rather than CVSS alone", "Risk-based prioritization weighs CVSS with exposure (internal-only), known exploitation (none), and asset criticality."),
     opt("c", "Ignore the finding because there is no known exploit", "Ignoring is inappropriate; the vulnerability should still be remediated, just with context-aware priority."),
     opt("d", "Immediately take the application offline", "Taking the app offline is disproportionate for an internal app with no known exploitation.")],
    ["b"],
    "CVSS severity is only one input. Prioritization should incorporate exposure (internal vs internet-facing), known exploitation (e.g., CISA KEV catalog), compensating controls, and business criticality — an internal-only, unexploited flaw may rank below an exposed one.",
    R("4.5")))

NEW.append(q("mcq-4-066", "4.5", "single-choice", 1,
    "A security team must verify that a newly deployed web application is free of common vulnerabilities by simulating real attacker techniques within an agreed scope and time window, with explicit approval from management. Which activity is this?",
    "Simulating real attacker techniques against a web app within agreed scope/time with management approval.",
    [opt("a", "Penetration testing", "Authorized, scoped, time-boxed simulation of attacker techniques to validate security is penetration testing."),
     opt("b", "Vulnerability scanning", "Scanning identifies known vulnerabilities but does not attempt exploitation or validate impact."),
     opt("c", "Security audit", "An audit reviews controls and compliance; it does not actively attack the application."),
     opt("d", "Baselining", "Baselining establishes normal behavior; it is not an attack simulation.")],
    ["a"],
    "Penetration testing actively exploits vulnerabilities to validate real risk, operating under rules of engagement (scope, timing, authorization). Vulnerability scanning is passive detection; audits review process and control evidence.",
    R("4.5")))

# ---- 4.6 IAM (+2) ----
NEW.append(q("mcq-4-067", "4.6", "single-choice", 1,
    "A company wants employees to authenticate once and gain access to multiple SaaS applications without re-entering credentials, using the corporate identity provider as the source of truth. Which technology enables this?",
    "Authenticate once with the corporate IdP, then access multiple SaaS apps without re-authentication.",
    [opt("a", "Single sign-on (SSO) via federation", "SSO lets a user authenticate once to an identity provider and access multiple relying-party applications via federation (SAML/OIDC)."),
     opt("b", "Password manager autofill", "A password manager autofills stored passwords; it does not federate identity."),
     opt("c", "Kerberos tickets only", "Kerberos provides SSO within Windows domains, not to arbitrary SaaS applications."),
     opt("d", "MFA enrollment", "MFA strengthens the initial authentication but does not propagate it to other apps.")],
    ["a"],
    "SSO with federation (SAML 2.0 or OIDC) authenticates the user once at the identity provider and issues assertions/tokens that relying applications trust — no repeated credential entry, centralized identity management.",
    R("4.6")))

NEW.append(q("mcq-4-068", "4.6", "single-choice", 1,
    "An organization needs to manage privileged accounts: vaulting credentials, enforcing just-in-time elevation, recording admin sessions, and rotating passwords after use. Which solution category provides these capabilities?",
    "Vaulting privileged credentials, JIT elevation, session recording, password rotation.",
    [opt("a", "PAM (Privileged Access Management)", "PAM solutions vault privileged credentials, broker just-in-time access, record sessions, and rotate passwords — the full suite described."),
     opt("b", "CASB", "A CASB brokers cloud application access and policy; it is not a privileged credential vault."),
     opt("c", "FIM", "File integrity monitoring detects file changes; it does not manage privileged access."),
     opt("d", "NAC", "NAC enforces network admission, not privileged credential management.")],
    ["a"],
    "PAM centralizes privileged account control: credential vaulting, JIT/least-privilege elevation, session monitoring/recording, and automated rotation. It directly addresses the risk of standing admin credentials.",
    R("4.6")))

# ---- 4.7 Automation/orchestration (+2) ----
NEW.append(q("mcq-4-069", "4.7", "single-choice", 1,
    "A security team wants to reduce manual effort by having the SIEM automatically enrich alerts with threat intelligence, open a ticket, block a confirmed malicious IP at the firewall via API, and notify the on-call analyst — all following a predefined workflow. Which technology provides this?",
    "SIEM alerts auto-enriched, ticketed, firewall-blocked via API, and analysts notified per a predefined workflow.",
    [opt("a", "SOAR", "SOAR orchestrates security tools and automates response playbooks — enrichment, ticketing, API-driven blocking, and notification — exactly as described."),
     opt("b", "EDR", "EDR protects endpoints; it does not orchestrate multi-tool workflows."),
     opt("c", "NAC", "NAC controls network admission."),
     opt("d", "DLP", "DLP prevents data loss; it is not a workflow automation platform.")],
    ["a"],
    "SOAR (Security Orchestration, Automation, and Response) codifies response playbooks: it enriches alerts, triggers actions across tools (firewall APIs, ticketing), and coordinates human notification — reducing MTTR and manual toil.",
    R("4.7")))

NEW.append(q("mcq-4-070", "4.7", "single-choice", 1,
    "A security engineer is automating firewall rule changes via scripts that call the firewall vendor's API using a service account. Which practice is MOST important to prevent the automation itself from becoming a security risk?",
    "Automating firewall changes via API with a service account — identify the most important safeguard.",
    [opt("a", "Grant the service account least privilege and require code review/approval before changes execute", "Least privilege on the automation identity plus reviewed, versioned change pipelines prevent the automation from being abused or making unvetted changes."),
     opt("b", "Use the same credentials as the administrator account", "Reusing an admin identity defeats accountability and least privilege."),
     opt("c", "Run the automation without logging", "Without logging, misuse is undetectable."),
     opt("d", "Disable multi-factor on the service account", "Service accounts can't always use interactive MFA, but disabling protections is wrong; device-bound certificates or managed identities are better.")],
    ["a"],
    "Automation introduces its own risks: over-privileged service accounts and unvetted scripted changes. Least privilege, code review, approval gates, versioning, and full logging are the core safeguards for security automation.",
    R("4.7")))

# ---- 4.8 Incident response (+1) ----
NEW.append(q("mcq-4-071", "4.8", "single-choice", 1,
    "During incident response, the team identifies the malware, removes it from affected hosts, and applies the missing patch that the malware exploited. Which phase of the NIST incident response lifecycle is being performed?",
    "Identifying and removing malware, then applying the patch that was exploited.",
    [opt("a", "Eradication", "Eradication removes the threat from the environment — deleting malware and eliminating the root cause (patching the exploited vulnerability)."),
     opt("b", "Containment", "Containment isolates the incident to prevent spread (disconnection, segmentation); removal and patching go beyond containment."),
     opt("c", "Recovery", "Recovery restores systems to normal operation from clean backups and validates them."),
     opt("d", "Preparation", "Preparation builds the IR capability before an incident.")],
    ["a"],
    "NIST SP 800-61 phases: Preparation, Detection & Analysis, Containment/Eradication/Recovery, Post-Incident Activity. Eradication removes the adversary and its foothold — malware deletion plus vulnerability remediation (patching).",
    R("4.8", "nist", "NIST SP 800-61 Incident Handling Guide")))

# ---- 4.9 Forensics (+1) ----
NEW.append(q("mcq-4-072", "4.9", "single-choice", 1,
    "A forensic examiner must produce evidence that can be presented in court. The examiner documents every individual who handled the evidence, when, where, and what was done to it, and stores it in a locked, access-controlled facility. Which concept is being followed?",
    "Documenting every handler, time, place, and action for evidence, stored in a locked facility.",
    [opt("a", "Chain of custody", "Chain of custody is the documented, unbroken record of evidence handling from collection to presentation — who, when, where, and what was done."),
     opt("b", "Order of volatility", "Order of volatility determines collection sequence by data persistence; it is not the handling record."),
     opt("c", "Legal hold", "A legal hold preserves relevant data pending litigation."),
     opt("d", "Hashing", "Hashing verifies integrity but is only part of the custody documentation.")],
    ["a"],
    "Chain of custody documents the complete evidence handling history, preserving admissibility by proving the evidence was not altered or substituted. Every transfer is logged and secured; hashing provides integrity verification alongside.",
    R("4.9")))

merge(load_bank(), new_mcqs=NEW)
