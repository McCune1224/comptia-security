#!/usr/bin/env python3
"""Expand PBQ bank to close real-exam PBQ-type gaps (+15 PBQs → 88).

Closes the SY0-701 PBQ matrix (from exam research + PBQ-type audit):
- #1 firewall ACL rule ORDER (ordering) — 3.2
- #3 certificate type -> use case matching — 1.4
- #4 log analysis: SQLi web log + Windows Security event log (evidence) — 2.4
- #5 network topology review -> device-placement configuration — 3.2
- #7 crypto/hashing algorithm selection (configuration) — 1.4
- #8 vulnerability scan output interpretation (evidence) — 4.3
- #9 access control: NTFS least-privilege permissions (configuration) — 4.6
- #12 IAM: MFA/SSO federation configuration — 4.6
Plus zero/one-PBQ objectives: 4.7 automation/SOAR (matching), 4.9 investigation
data sources (matching), 5.5 sensitive-data handling (matching), 5.6 recovery
metrics (matching), 3.3 data protection techniques (matching), 4.5 email
security gateway (configuration).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import importlib
banklib = importlib.import_module("bank-lib")
load_bank = banklib.load_bank
merge = banklib.merge

R = lambda obj, sec=None: [
    {"source": "exam-objectives", "section": f"Objective {obj}"},
    {"source": "study-guide", "section": sec or "Exam Practice"},
]

NEW_PBQ = []

# ================= D1 · 1.4 crypto algorithm selection (configuration) =================
NEW_PBQ.append({
    "id": "pbq-1-013", "domain": 1, "objective": "1.4", "format": "pbq", "kind": "configuration",
    "prompt": "A security architect is selecting cryptographic algorithms for a new product line. For EACH requirement below, choose the MOST appropriate algorithm from the dropdown.",
    "context": "Match the algorithm to the security goal: confidentiality (encryption), integrity (hashing), authentication/non-repudiation (signatures), and key exchange.",
    "fields": [
        {"id": "f1", "label": "Bulk encryption of files at rest", "options": [
            {"id": "a", "text": "AES-256"}, {"id": "b", "text": "RSA-2048"}, {"id": "c", "text": "SHA-256"}, {"id": "d", "text": "DES"}]},
        {"id": "f2", "label": "VPN tunnel traffic needing confidentiality AND integrity (AEAD)", "options": [
            {"id": "a", "text": "AES-GCM"}, {"id": "b", "text": "AES-ECB"}, {"id": "c", "text": "RC4"}, {"id": "d", "text": "MD5"}]},
        {"id": "f3", "label": "Integrity check for a firmware download (no confidentiality)", "options": [
            {"id": "a", "text": "SHA-256"}, {"id": "b", "text": "RSA"}, {"id": "c", "text": "AES-CTR"}, {"id": "d", "text": "3DES"}]},
        {"id": "f4", "label": "Establishing a shared session key between two parties over the internet", "options": [
            {"id": "a", "text": "ECDH (Elliptic Curve Diffie-Hellman)"}, {"id": "b", "text": "SHA-1"}, {"id": "c", "text": "AES-CBC"}, {"id": "d", "text": "DES"}]},
        {"id": "f5", "label": "Digitally signing software releases for authenticity", "options": [
            {"id": "a", "text": "ECDSA"}, {"id": "b", "text": "MD5"}, {"id": "c", "text": "RC4"}, {"id": "d", "text": "CBC"}]}
    ],
    "correctValues": {"f1": "a", "f2": "a", "f3": "a", "f4": "a", "f5": "a"},
    "explanation": "AES-256 is the standard symmetric cipher for bulk data at rest. AES-GCM is an AEAD (authenticated encryption) mode — it provides confidentiality AND integrity in one operation, ideal for VPN tunnels. SHA-256 is a hash for integrity only. ECDH performs key exchange so two parties can derive a shared symmetric key without sending it. ECDSA provides digital signatures for authenticity and non-repudiation. RSA-2048 could sign but is far slower than ECDSA and is not a bulk cipher; DES/RC4/MD5/SHA-1/ECB/CBC-without-MAC are all cryptographically weak or misuse cases.",
    "sourceRefs": R("1.4", "Cryptography")
})

# ================= D1 · 1.4 certificate type -> use case (matching) =================
NEW_PBQ.append({
    "id": "pbq-1-014", "domain": 1, "objective": "1.4", "format": "pbq", "kind": "matching",
    "prompt": "A PKI administrator is issuing certificates for several use cases. Match EACH certificate purpose to the certificate type that should be issued.",
    "context": "Certificate types are selected by who/what the certificate authenticates and how it is used.",
    "premises": [
        {"id": "p1", "text": "Digitally sign a company's software installer so Windows trusts the publisher"},
        {"id": "p2", "text": "Encrypt traffic between browsers and the company's e-commerce website"},
        {"id": "p3", "text": "Sign and encrypt email between employees using S/MIME"},
        {"id": "p4", "text": "Validate a user's identity when they authenticate to the VPN"},
        {"id": "p5", "text": "Sign the certificates issued by the organization's internal CA"}
    ],
    "targets": [
        {"id": "t1", "text": "Code signing certificate"},
        {"id": "t2", "text": "TLS/SSL web server certificate"},
        {"id": "t3", "text": "S/MIME email certificate"},
        {"id": "t4", "text": "Client authentication certificate"},
        {"id": "t5", "text": "Root CA certificate"}
    ],
    "extraTargets": [
        {"id": "x1", "text": "Self-signed certificate"},
        {"id": "x2", "text": "Certificate transparency log"},
        {"id": "x3", "text": "Key escrow agent certificate"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "Code signing certificates authenticate the publisher of software so OS trust prompts disappear. TLS/SSL server certificates authenticate the server's identity to browsers. S/MIME certificates sign and encrypt email (they hold the user's email address). Client authentication certificates prove the holder's identity to a service such as a VPN. The root CA certificate is the trust anchor that signs all other certificates in the hierarchy. A self-signed certificate is not trusted by others and would fail for every public use case here.",
    "sourceRefs": R("1.4", "Public Key Infrastructure")
})

# ================= D2 · 2.4 SQL injection log analysis (evidence) =================
NEW_PBQ.append({
    "id": "pbq-2-016", "domain": 2, "objective": "2.4", "format": "pbq", "kind": "evidence",
    "prompt": "Review the Apache access log from a web application server. Select the TWO lines that BEST indicate SQL injection attempts against the application.",
    "context": "SQL injection shows up in web logs as unexpected characters in query strings: URL-encoded quotes (%27), OR conditions (%27%20OR), and UNION SELECT clauses.",
    "artifact": {
        "label": "/var/log/apache2/access.log — web-01",
        "format": "log",
        "lines": [
            {"id": "l1", "text": 'GET /products?id=101 HTTP/1.1" 200 (2.1 KB)'},
            {"id": "l2", "text": 'GET /products?id=101%27%20OR%20%271%27%3D%271 HTTP/1.1" 200 (4.8 KB)'},
            {"id": "l3", "text": 'GET /products?id=101%20UNION%20SELECT%20username,password%20FROM%20users HTTP/1.1" 200 (9.3 KB)'},
            {"id": "l4", "text": 'GET /login HTTP/1.1" 302 Found (0.9 KB)'},
            {"id": "l5", "text": 'GET /images/logo.png HTTP/1.1" 200 (1.1 KB)'},
            {"id": "l6", "text": 'POST /search HTTP/1.1" 200 (0.4 KB)'}
        ]
    },
    "selectCount": 2,
    "correctLineIds": ["l2", "l3"],
    "explanation": "Line l2 injects a URL-encoded OR condition (%27 = apostrophe, %20 = space, %3D = equals) that evaluates to true for every row — the classic ' OR '1'='1 probe that bypasses authentication or dumps all records. Line l3 uses UNION SELECT to exfiltrate username and password columns from the users table — the definitive SQLi signature. The other lines are normal GETs/POSTs; l1 differs from l2 only by the injected payload, which is why the payloads, not the request shape, are the indicator.",
    "sourceRefs": R("2.4", "Analyze Indicators of Malicious Activity")
})

# ================= D2 · 2.4 Windows Security event log (evidence) =================
NEW_PBQ.append({
    "id": "pbq-2-017", "domain": 2, "objective": "2.4", "format": "pbq", "kind": "evidence",
    "prompt": "Review the Windows Security event log from domain controller DC01. Select the line that BEST indicates a successful brute-force attack against an administrative account.",
    "context": "A brute force appears as a burst of failed logons (Event ID 4625) from one source followed by a successful logon (Event ID 4624) from the SAME source.",
    "artifact": {
        "label": "Security event log — DC01",
        "format": "log",
        "lines": [
            {"id": "l1", "text": "Event 4624 — Successful logon. Account: jsmith. Source IP: 10.0.0.50"},
            {"id": "l2", "text": "Event 4625 — Failed logon. Account: administrator. Source IP: 203.0.113.5"},
            {"id": "l3", "text": "Event 4625 — Failed logon. Account: administrator. Source IP: 203.0.113.5"},
            {"id": "l4", "text": "Event 4625 — Failed logon. Account: administrator. Source IP: 203.0.113.5"},
            {"id": "l5", "text": "Event 4624 — Successful logon. Account: administrator. Source IP: 203.0.113.5"},
            {"id": "l6", "text": "Event 4740 — Account locked out. Account: svc_backup. Source: DC02"}
        ]
    },
    "selectCount": 1,
    "correctLineIds": ["l5"],
    "explanation": "Lines l2–l4 show repeated failed logons for the administrator account from the external IP 203.0.113.5, and line l5 shows a successful logon for that SAME account from the SAME IP moments later — the attacker guessed the password. The success line is the proof the brute force succeeded and the account is compromised. l1 is a normal user logon, and l6 is a lockout of a different account (a side effect, not the compromise itself).",
    "sourceRefs": R("2.4", "Analyze Indicators of Malicious Activity")
})

# ================= D3 · 3.2 firewall ACL rule ORDER (ordering) =================
NEW_PBQ.append({
    "id": "pbq-3-015", "domain": 3, "objective": "3.2", "format": "pbq", "kind": "ordering",
    "prompt": "A firewall administrator is rebuilding the rule table on the perimeter firewall. Rules are evaluated top-down and the device has an implicit deny-all at the end. Place the rules in the order that satisfies the policy WITHOUT breaking it.",
    "context": "Rule order matters: stateful/established traffic must be allowed first so return traffic flows, specific permits must come before any broad permit, and the explicit deny-all belongs at the bottom.",
    "items": [
        {"id": "i1", "text": "Allow established/related connections (stateful inspection)"},
        {"id": "i2", "text": "Allow HTTPS (443) from internet to DMZ web server 172.16.1.10"},
        {"id": "i3", "text": "Allow DNS (53) from DMZ to internal DNS server 10.10.10.53"},
        {"id": "i4", "text": "Allow RDP (3389) from admin VLAN 10.10.20.0/24 to DMZ servers"},
        {"id": "i5", "text": "Deny SSH (22) from internet to DMZ"},
        {"id": "i6", "text": "Deny all other traffic (explicit default)"}
    ],
    "correctOrder": ["i1", "i2", "i3", "i4", "i5", "i6"],
    "explanation": "i1 must be first: stateful inspection allows return traffic for sessions the firewall already approved — placing it lower would break every outbound connection. The specific allows (i2, i3, i4) come next; they permit exactly the services the policy requires and no more. i5 denies SSH from the internet — it sits ABOVE the deny-all so the intent is explicit, but critically no broad allow appears above it (a rule like 'allow all web traffic' placed before i5 would make the SSH deny useless). i6 is the explicit default deny, last. If a broad permit ever lands above a specific deny, the deny is dead — that is the classic ACL ordering trap this question tests.",
    "sourceRefs": R("3.2", "Secure Enterprise Infrastructure")
})

# ================= D3 · 3.2 network device placement / segmentation (configuration) =================
NEW_PBQ.append({
    "id": "pbq-3-016", "domain": 3, "objective": "3.2", "format": "pbq", "kind": "configuration",
    "prompt": "The network diagram shows a flat design with no separation. The redesign adds four segments: DMZ, Internal (restricted), Internal (general), and Guest. For EACH device, choose the segment where it belongs so the architecture is secure.",
    "context": "Internet-facing services go in the DMZ; the database is reachable only from the application layer (restricted); administrators manage from a restricted segment; guest devices are isolated on their own VLAN.",
    "fields": [
        {"id": "f1", "label": "Public web server (must be reachable from the internet)", "options": [
            {"id": "a", "text": "DMZ"}, {"id": "b", "text": "Internal (restricted)"}, {"id": "c", "text": "Internal (general)"}, {"id": "d", "text": "Guest"}]},
        {"id": "f2", "label": "Customer database (must be reachable ONLY from the web server)", "options": [
            {"id": "a", "text": "DMZ"}, {"id": "b", "text": "Internal (restricted)"}, {"id": "c", "text": "Internal (general)"}, {"id": "d", "text": "Guest"}]},
        {"id": "f3", "label": "Administrator management workstation", "options": [
            {"id": "a", "text": "DMZ"}, {"id": "b", "text": "Internal (restricted)"}, {"id": "c", "text": "Internal (general)"}, {"id": "d", "text": "Guest"}]},
        {"id": "f4", "label": "Guest Wi-Fi controller", "options": [
            {"id": "a", "text": "DMZ"}, {"id": "b", "text": "Internal (restricted)"}, {"id": "c", "text": "Internal (general)"}, {"id": "d", "text": "Guest"}]},
        {"id": "f5", "label": "Email server (must accept mail from the internet)", "options": [
            {"id": "a", "text": "DMZ"}, {"id": "b", "text": "Internal (restricted)"}, {"id": "c", "text": "Internal (general)"}, {"id": "d", "text": "Guest"}]}
    ],
    "correctValues": {"f1": "a", "f2": "b", "f3": "b", "f4": "d", "f5": "a"},
    "explanation": "Web and email servers are internet-facing, so they belong in the DMZ — if they are compromised, the attacker lands in a segmented zone, not on the internal network. The customer database sits in the internal restricted segment with a firewall rule allowing traffic only from the web server (defense in depth: even a fully compromised web server cannot directly reach other internal resources). The admin workstation is also restricted so management traffic never crosses the general user network. Guest Wi-Fi goes on its own isolated VLAN with internet-only access — guests must never reach internal resources. This segmentation contains a breach and limits lateral movement.",
    "sourceRefs": R("3.2", "Network Segmentation")
})

# ================= D3 · 3.3 data protection techniques (matching) =================
NEW_PBQ.append({
    "id": "pbq-3-017", "domain": 3, "objective": "3.3", "format": "pbq", "kind": "matching",
    "prompt": "A data governance team is choosing techniques to protect sensitive data. Match EACH technique to the description that BEST defines it.",
    "context": "Data protection techniques differ by reversibility and purpose: tokenization and masking preserve usability, encryption protects confidentiality, hashing verifies integrity, and DLP controls movement.",
    "premises": [
        {"id": "p1", "text": "Replaces a sensitive value with a random token that maps back to the original through a secure vault"},
        {"id": "p2", "text": "Hides part of a value for display, such as 4111-****-****-1234, while keeping the format"},
        {"id": "p3", "text": "Transforms data with an algorithm and key so only authorized parties can read it"},
        {"id": "p4", "text": "Computes a fixed-length digest used to verify data has not changed"},
        {"id": "p5", "text": "Monitors and blocks sensitive data from leaving the network in email, uploads, or removable media"}
    ],
    "targets": [
        {"id": "t1", "text": "Tokenization"},
        {"id": "t2", "text": "Data masking"},
        {"id": "t3", "text": "Encryption"},
        {"id": "t4", "text": "Hashing"},
        {"id": "t5", "text": "Data loss prevention (DLP)"}
    ],
    "extraTargets": [
        {"id": "x1", "text": "RAID 5"},
        {"id": "x2", "text": "Snapshot"},
        {"id": "x3", "text": "Watermarking"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "Tokenization replaces a value with a random token held in a secure vault — the original can be retrieved, which keeps data usable (e.g. for analytics) while de-risking the stored values. Data masking hides characters for display only and is not reversible. Encryption protects confidentiality with a key. Hashing produces a fixed-length digest that detects changes (integrity). DLP sits at the egress points and prevents sensitive data from leaving the environment. RAID and snapshots are availability/resilience controls, not data-protection techniques.",
    "sourceRefs": R("3.3", "Protect Data")
})

# ================= D4 · 4.3 vulnerability scan interpretation (evidence) =================
NEW_PBQ.append({
    "id": "pbq-4-020", "domain": 4, "objective": "4.3", "format": "pbq", "kind": "evidence",
    "prompt": "Review the vulnerability scan findings from the quarterly assessment. Select the finding the team should remediate FIRST.",
    "context": "Prioritize by severity AND exposure: a critical CVSS score on an internet-facing system with a known exploit beats a medium finding on an internal host, regardless of count.",
    "artifact": {
        "label": "Nessus scan results — quarterly report (excerpt)",
        "format": "command-output",
        "lines": [
            {"id": "l1", "text": "Plugin 12345 — Apache 2.4.49 path traversal RCE (CVE-2021-41773) — CVSS 9.8 — Internet-facing web server"},
            {"id": "l2", "text": "Plugin 67890 — SMBv1 protocol enabled — CVSS 5.1 — Internal file server (no internet exposure)"},
            {"id": "l3", "text": "Plugin 11111 — TLS 1.0 enabled on internal application — CVSS 4.3 — Internal only"},
            {"id": "l4", "text": "Plugin 22222 — Default SNMP community string 'public' on network printer — CVSS 8.8 — Internal only"},
            {"id": "l5", "text": "Plugin 33333 — SSL certificate expired on staging server — CVSS 2.6 — Staging, no production data"},
            {"id": "l6", "text": "Plugin 44444 — OpenSSH 8.0 on jump host — CVSS 7.5 — Internet-facing"}
        ]
    },
    "selectCount": 1,
    "correctLineIds": ["l1"],
    "explanation": "The Apache path traversal RCE (CVE-2021-41773) is the highest priority: CVSS 9.8 (critical), it is internet-facing, and it is a remote code execution with an actively exploited public exploit — an attacker can take the host with a single request. l6 is also internet-facing but scores lower and has no known active exploitation chain. l4 has a high CVSS but is internal-only. The others are internal or non-production and lower severity. Remediation order follows risk = severity × exposure × exploitability: l1 first, then l6, l4, and the rest.",
    "sourceRefs": R("4.3", "Vulnerability Management")
})

# ================= D4 · 4.5 email security gateway (configuration) =================
NEW_PBQ.append({
    "id": "pbq-4-021", "domain": 4, "objective": "4.5", "format": "pbq", "kind": "configuration",
    "prompt": "A company is configuring its new email security gateway. For EACH setting, choose the value that provides the strongest SECURE configuration for the stated policy.",
    "context": "The organization's DMARC policy is p=quarantine. PHI must be encrypted in transit, and phishing protection must check links at delivery and at click time.",
    "fields": [
        {"id": "f1", "label": "Inbound mail that FAILS SPF, DKIM, and DMARC alignment", "options": [
            {"id": "a", "text": "Quarantine for review"}, {"id": "b", "text": "Deliver with warning banner"}, {"id": "c", "text": "Deliver normally"}, {"id": "d", "text": "Silently drop without logging"}]},
        {"id": "f2", "label": "Transport encryption for outbound mail containing PHI", "options": [
            {"id": "a", "text": "Forced TLS with MTA-STS and strict policy"}, {"id": "b", "text": "Opportunistic TLS only"}, {"id": "c", "text": "No encryption"}, {"id": "d", "text": "PGP for every message"}]},
        {"id": "f3", "label": "Anti-phishing URL protection for inbound mail links", "options": [
            {"id": "a", "text": "Scan at delivery AND recheck at click time"}, {"id": "b", "text": "Scan at delivery only"}, {"id": "c", "text": "Log links only, no blocking"}, {"id": "d", "text": "Disabled"}]},
        {"id": "f4", "label": "Mail from a known malicious sender domain", "options": [
            {"id": "a", "text": "Reject at the gateway"}, {"id": "b", "text": "Quarantine for review"}, {"id": "c", "text": "Deliver to spam folder"}, {"id": "d", "text": "Deliver normally"}]},
        {"id": "f5", "label": "Sender authentication checks applied to inbound mail", "options": [
            {"id": "a", "text": "Verify SPF, DKIM, and DMARC together"}, {"id": "b", "text": "SPF only"}, {"id": "c", "text": "DKIM only"}, {"id": "d", "text": "Disabled"}]}
    ],
    "correctValues": {"f1": "a", "f2": "a", "f3": "a", "f4": "a", "f5": "a"},
    "explanation": "With a p=quarantine DMARC policy, mail that fails authentication is quarantined for review — rejecting it would be stricter than policy, delivering it would violate it. PHI requires encryption in transit: forced TLS with MTA-STS prevents downgrade attacks (opportunistic TLS can silently fall back to plaintext). Click-time URL rechecking catches links that were clean at delivery but weaponized later — the classic phishing evasive trick. Known-bad sender domains are rejected outright at the gateway. SPF, DKIM, and DMARC are verified together because each covers a different forgery vector; checking one alone leaves gaps.",
    "sourceRefs": R("4.5", "Modify Enterprise Capabilities")
})

# ================= D4 · 4.6 NTFS least-privilege permissions (configuration) =================
NEW_PBQ.append({
    "id": "pbq-4-022", "domain": 4, "objective": "4.6", "format": "pbq", "kind": "configuration",
    "prompt": "Configure NTFS permissions on the shared drive for each group, applying LEAST PRIVILEGE. Choose the permission level for EACH group/folder pair.",
    "context": "Least privilege: give each group only the access its job requires — no more. Marketing works in its own folder, HR data is restricted to HR, everyone reads the public folder, and IT admins administer the drive.",
    "fields": [
        {"id": "f1", "label": "Marketing group on \\\\SRV01\\Shared\\Marketing", "options": [
            {"id": "a", "text": "Modify"}, {"id": "b", "text": "Read & execute"}, {"id": "c", "text": "Full control"}, {"id": "d", "text": "No access"}]},
        {"id": "f2", "label": "Marketing group on \\\\SRV01\\Shared\\HR", "options": [
            {"id": "a", "text": "Read & execute"}, {"id": "b", "text": "Modify"}, {"id": "c", "text": "Full control"}, {"id": "d", "text": "No access"}]},
        {"id": "f3", "label": "HR group on \\\\SRV01\\Shared\\HR", "options": [
            {"id": "a", "text": "Read & execute"}, {"id": "b", "text": "Modify"}, {"id": "c", "text": "Full control"}, {"id": "d", "text": "No access"}]},
        {"id": "f4", "label": "All employees group on \\\\SRV01\\Shared\\Public", "options": [
            {"id": "a", "text": "Read & execute"}, {"id": "b", "text": "Modify"}, {"id": "c", "text": "Full control"}, {"id": "d", "text": "No access"}]},
        {"id": "f5", "label": "IT administrators group on \\\\SRV01\\Shared\\HR", "options": [
            {"id": "a", "text": "Read & execute"}, {"id": "b", "text": "Modify"}, {"id": "c", "text": "Full control"}, {"id": "d", "text": "No access"}]}
    ],
    "correctValues": {"f1": "a", "f2": "d", "f3": "c", "f4": "a", "f5": "c"},
    "explanation": "Marketing gets Modify on its own folder (create/edit/delete work) but NO access to the HR folder — least privilege means no access where there is no business need. HR has Full control over its own folder so members can manage permissions for their team. Everyone can Read & execute the Public folder but nothing more, so no one can overwrite shared announcements. IT administrators get Full control for administration — a justified exception (and should be tracked as a privileged account). Granting Modify or Full control beyond the owning team would violate least privilege and expand the blast radius of any account compromise.",
    "sourceRefs": R("4.6", "Identity and Access Management")
})

# ================= D4 · 4.6 MFA / SSO / federation configuration =================
NEW_PBQ.append({
    "id": "pbq-4-023", "domain": 4, "objective": "4.6", "format": "pbq", "kind": "configuration",
    "prompt": "An identity team is configuring the company's identity provider. For EACH authentication setting, choose the option that provides the strongest SECURE configuration.",
    "context": "Admin accounts get MFA on every login, remote users use a second factor they possess, SaaS apps use SSO through the IdP, and the new acquisition is federated rather than synced.",
    "fields": [
        {"id": "f1", "label": "MFA policy for administrator accounts", "options": [
            {"id": "a", "text": "Require MFA on every login, no exceptions"}, {"id": "b", "text": "MFA only when signing in from a new device"}, {"id": "c", "text": "MFA optional"}, {"id": "d", "text": "No MFA"}]},
        {"id": "f2", "label": "Second factor for remote VPN users (something they possess)", "options": [
            {"id": "a", "text": "TOTP app or hardware security key"}, {"id": "b", "text": "Security question"}, {"id": "c", "text": "Second password"}, {"id": "d", "text": "Email link"}]},
        {"id": "f3", "label": "SSO for the productivity suite (email, docs, chat)", "options": [
            {"id": "a", "text": "SAML 2.0 SSO via the company IdP"}, {"id": "b", "text": "Separate credentials for every app"}, {"id": "c", "text": "Shared password vault"}, {"id": "d", "text": "No SSO"}]},
        {"id": "f4", "label": "Federation with the newly acquired company's Okta tenant", "options": [
            {"id": "a", "text": "SAML/OIDC federation trust between the two IdPs"}, {"id": "b", "text": "Synchronize password hashes one-way"}, {"id": "c", "text": "Domain-join the acquisition's systems"}, {"id": "d", "text": "No trust"}]},
        {"id": "f5", "label": "Passwordless option for enrolled, compliant devices", "options": [
            {"id": "a", "text": "FIDO2/Windows Hello security keys"}, {"id": "b", "text": "SMS one-time codes"}, {"id": "c", "text": "Shared passphrases"}, {"id": "d", "text": "Disabled"}]}
    ],
    "correctValues": {"f1": "a", "f2": "a", "f3": "a", "f4": "a", "f5": "a"},
    "explanation": "Admins are the highest-value target, so MFA is required on EVERY login — conditional MFA on new devices leaves a gap attackers can route around. A TOTP app or hardware security key is a genuine possession factor (phishing-resistant for FIDO2); security questions and second passwords are knowledge factors, and SMS/email are vulnerable to interception. SAML SSO centralizes authentication at the IdP so the suite inherits MFA and account lifecycle automatically. Federation (SAML/OIDC trust) gives the acquisition's users access through their own IdP WITHOUT syncing password hashes — hash sync would spread credential risk across both companies. FIDO2 keys are the phishing-resistant passwordless option; SMS codes are weak.",
    "sourceRefs": R("4.6", "Identity and Access Management")
})

# ================= D4 · 4.7 automation & orchestration (matching) =================
NEW_PBQ.append({
    "id": "pbq-4-019", "domain": 4, "objective": "4.7", "format": "pbq", "kind": "matching",
    "prompt": "A SecOps team is adopting automation. Match EACH automation/orchestration concept to the description that BEST defines it.",
    "context": "Automation ties tools together so routine response happens in seconds: SOAR platforms run playbooks that automate runbooks, orchestrated through API integrations.",
    "premises": [
        {"id": "p1", "text": "A platform that ingests alerts, executes playbooks, and takes automated response actions across security tools"},
        {"id": "p2", "text": "A predefined set of automated steps executed when a specific alert fires"},
        {"id": "p3", "text": "A documented, repeatable manual procedure that a playbook automates"},
        {"id": "p4", "text": "Coordinating multiple tools and scripts so they work together as a single workflow"},
        {"id": "p5", "text": "Programmatic interfaces that let tools query and act on each other's data"}
    ],
    "targets": [
        {"id": "t1", "text": "SOAR platform"},
        {"id": "t2", "text": "Playbook"},
        {"id": "t3", "text": "Runbook"},
        {"id": "t4", "text": "Orchestration"},
        {"id": "t5", "text": "API integration"}
    ],
    "extraTargets": [
        {"id": "x1", "text": "SIEM"},
        {"id": "x2", "text": "Network access control (NAC)"},
        {"id": "x3", "text": "Honeypot"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "A SOAR (security orchestration, automation, and response) platform is the hub: it ingests alerts, runs playbooks, and executes automated response across the toolset. A playbook is the automated step sequence triggered by an alert; a runbook is the manual procedure the playbook automates — a playbook without a runbook is just code with no documented intent. Orchestration is the coordination layer that makes many tools behave as one workflow, and API integration is how that coordination happens. A SIEM collects and correlates logs but does not execute response actions; NAC controls network admission; a honeypot is a decoy.",
    "sourceRefs": R("4.7", "Automation and Orchestration")
})

# ================= D4 · 4.9 investigation data sources (matching) =================
NEW_PBQ.append({
    "id": "pbq-4-024", "domain": 4, "objective": "4.9", "format": "pbq", "kind": "matching",
    "prompt": "An incident responder is investigating a suspected breach. For EACH question, choose the data source that would provide the BEST evidence.",
    "context": "Different questions need different telemetry: identity questions come from authentication logs, network questions from flow/capture data, endpoint questions from EDR, and delivery questions from the mail gateway.",
    "premises": [
        {"id": "p1", "text": "Which user account accessed the sensitive file \\\\SRV01\\HR\\salaries.xlsx on Friday?"},
        {"id": "p2", "text": "What IP addresses communicated with the internal database in the last 30 days?"},
        {"id": "p3", "text": "What commands did the attacker run on the compromised endpoint?"},
        {"id": "p4", "text": "Was the email containing the malicious link actually delivered to users?"},
        {"id": "p5", "text": "Which accounts authenticated to the VPN at the time of the breach?"}
    ],
    "targets": [
        {"id": "t1", "text": "File server audit logs"},
        {"id": "t2", "text": "NetFlow / network session logs"},
        {"id": "t3", "text": "EDR endpoint telemetry"},
        {"id": "t4", "text": "Email security gateway logs"},
        {"id": "t5", "text": "VPN / identity provider authentication logs"}
    ],
    "extraTargets": [
        {"id": "x1", "text": "On-prem CCTV footage"},
        {"id": "x2", "text": "HR personnel records"},
        {"id": "x3", "text": "Backup tape inventory"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "File access questions are answered by file server audit logs, which record exactly which account opened which file. Network communication questions come from NetFlow/session logs (metadata of every flow). What ran on a host comes from EDR telemetry — process, command line, and network behavior on the endpoint itself. Mail delivery questions are answered by the email gateway's logs (delivered, quarantined, rejected). Authentication questions come from the VPN/IdP authentication logs, which record account, timestamp, and source IP. CCTV, HR records, and backup inventories do not answer any of these questions — selecting the right data source is the first skill of a good investigation.",
    "sourceRefs": R("4.9", "Data Sources for Investigation")
})

# ================= D5 · 5.5 sensitive data handling (matching) =================
NEW_PBQ.append({
    "id": "pbq-5-015", "domain": 5, "objective": "5.5", "format": "pbq", "kind": "matching",
    "prompt": "A data steward is documenting how each type of data must be handled. Match EACH data type to the handling regime that applies to it.",
    "context": "Handling requirements follow the regulation or classification that applies to the data: PHI, cardholder data, PII, trade secrets, and public data each have different controls.",
    "premises": [
        {"id": "p1", "text": "Patient medical records stored by a healthcare clinic"},
        {"id": "p2", "text": "Credit card numbers processed by the e-commerce payment flow"},
        {"id": "p3", "text": "Employee records containing SSNs and home addresses"},
        {"id": "p4", "text": "Proprietary source code for the company's flagship product"},
        {"id": "p5", "text": "Public marketing materials published on the company website"}
    ],
    "targets": [
        {"id": "t1", "text": "HIPAA privacy and security controls"},
        {"id": "t2", "text": "PCI DSS scope reduction and encryption"},
        {"id": "t3", "text": "PII protections: least privilege, encryption, DLP"},
        {"id": "t4", "text": "Trade-secret protections: NDAs and information rights management"},
        {"id": "t5", "text": "No special controls — publish freely"}
    ],
    "extraTargets": [
        {"id": "x1", "text": "GLBA financial privacy rules"},
        {"id": "x2", "text": "GDPR right-to-erasure workflow"},
        {"id": "x3", "text": "FIPS 140-3 validation"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "Patient records are PHI, regulated by HIPAA. Cardholder data falls under PCI DSS — the standing guidance is to reduce scope (tokenize, segment) and encrypt what remains. Employee SSNs/addresses are PII needing least privilege, encryption, and DLP so they cannot walk out the door. Source code is intellectual property / a trade secret, protected by NDAs, classification, and information rights management that limits reading and copying. Public marketing material carries no special controls. GLBA covers financial institutions' customer data, GDPR the privacy rights of EU individuals, and FIPS 140-3 is a cryptographic module validation standard — all plausible-sounding but not the regime for these data types.",
    "sourceRefs": R("5.5", "Privacy and Sensitive Data")
})

# ================= D5 · 5.6 recovery metrics (matching) =================
NEW_PBQ.append({
    "id": "pbq-5-016", "domain": 5, "objective": "5.6", "format": "pbq", "kind": "matching",
    "prompt": "A business continuity planner is defining recovery targets. Match EACH recovery metric to the definition that BEST describes it.",
    "context": "The metrics describe how fast systems return and how much data may be lost: RTO/RPO are per-system targets, MTD is the total tolerable outage, and MTBF/MTTR describe observed reliability.",
    "premises": [
        {"id": "p1", "text": "The maximum acceptable time a system can be DOWN after an outage"},
        {"id": "p2", "text": "The maximum acceptable age of data that can be lost (drives backup frequency)"},
        {"id": "p3", "text": "The total time a business function can be unavailable before impact becomes unacceptable"},
        {"id": "p4", "text": "The average time between failures for a system"},
        {"id": "p5", "text": "The average time required to restore service after a failure"},
        {"id": "p6", "text": "A contractually agreed availability commitment, such as 99.9% uptime"}
    ],
    "targets": [
        {"id": "t1", "text": "Recovery time objective (RTO)"},
        {"id": "t2", "text": "Recovery point objective (RPO)"},
        {"id": "t3", "text": "Maximum tolerable downtime (MTD)"},
        {"id": "t4", "text": "Mean time between failures (MTBF)"},
        {"id": "t5", "text": "Mean time to repair (MTTR)"},
        {"id": "t6", "text": "Service-level agreement (SLA)"}
    ],
    "extraTargets": [
        {"id": "x1", "text": "Annualized loss expectancy (ALE)"},
        {"id": "x2", "text": "Exposure factor (EF)"},
        {"id": "x3", "text": "Single loss expectancy (SLE)"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5", "p6": "t6"},
    "explanation": "RTO is how long a system may stay down (recovery speed); RPO is how much data may be lost (backup frequency) — RPO=4 hours means backups no older than 4 hours. MTD is the business-level tolerance: the total outage the business can survive, which drives the RTOs of all dependent systems. MTBF measures reliability (time between failures), MTTR measures repairability (time to restore), and an SLA is the contractual availability/response commitment (99.9% = about 8.8 hours of allowed downtime per year). ALE, EF, and SLE are risk-quantification metrics (financial loss), not recovery targets.",
    "sourceRefs": R("5.6", "Disaster Recovery and Continuity")
})

bank = load_bank()
merge(bank, new_pbqs=NEW_PBQ)
