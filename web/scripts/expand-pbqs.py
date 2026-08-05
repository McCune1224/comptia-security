#!/usr/bin/env python3
"""Expand PBQs (+20: 4 per domain, varied interactions)."""
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

# ================= D1 (+4) =================
NEW.append({
    "id": "pbq-1-005", "domain": 1, "objective": "1.1", "format": "pbq", "kind": "matching",
    "prompt": "Match each security control description to the control type it BEST represents. Each type is used once.",
    "context": "A security architect is documenting the organization's control inventory for an audit.",
    "premises": [
        {"id": "p1", "text": "Signage warning that the premises are monitored"},
        {"id": "p2", "text": "A firewall rule blocking inbound traffic on port 23"},
        {"id": "p3", "text": "A backup restore after a ransomware incident"},
        {"id": "p4", "text": "A quarterly audit log review"},
        {"id": "p5", "text": "A guard posted when the biometric reader is being repaired"}
    ],
    "targets": [
        {"id": "t1", "text": "Deterrent"},
        {"id": "t2", "text": "Preventive"},
        {"id": "t3", "text": "Corrective"},
        {"id": "t4", "text": "Detective"},
        {"id": "t5", "text": "Compensating"}
    ],
    "extraTargets": [
        {"id": "t6", "text": "Directive"},
        {"id": "t7", "text": "Managerial"}
    ],
    "correctMatches": {
        "p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"
    },
    "explanation": "Signs deter; firewall rules prevent; backups restore (corrective); log reviews detect; a temporary guard substitutes for a failed control (compensating).",
    "sourceRefs": R("1.1")
})

NEW.append({
    "id": "pbq-1-006", "domain": 1, "objective": "1.4", "format": "pbq", "kind": "numeric",
    "prompt": "A security engineer must select a key length that provides 128 bits of symmetric-equivalent strength. The organization's standard uses AES-256. If the engineer is evaluating an RSA key for the TLS handshake, which RSA modulus size (in bits) is the recommended minimum that provides at least 128-bit equivalent strength?",
    "context": "Enter a whole number of bits (e.g., 2048).",
    "unit": "bits",
    "correctValue": 3072,
    "tolerance": 0,
    "explanation": "Per NIST guidance, RSA-3072 provides approximately 128 bits of symmetric-equivalent security (RSA-2048 provides ~112 bits).",
    "sourceRefs": R("1.4", "NIST SP 800-57 key length recommendations")
})

NEW.append({
    "id": "pbq-1-007", "domain": 1, "objective": "1.2", "format": "pbq", "kind": "ordering",
    "prompt": "Arrange the steps of a Zero Trust access request in the correct order, from the user's request to the establishment of the session.",
    "context": "A user attempts to access an internal application through an identity-aware proxy in a Zero Trust architecture.",
    "items": [
        {"id": "i1", "text": "User submits an access request to the policy enforcement point"},
        {"id": "i2", "text": "The policy engine evaluates identity, device posture, and policy"},
        {"id": "i3", "text": "The policy administrator generates access credentials/tokens for the approved path"},
        {"id": "i4", "text": "The policy enforcement point establishes the session with the application"},
        {"id": "i5", "text": "Continuous monitoring re-evaluates trust and can terminate the session"}
    ],
    "correctOrder": ["i1", "i2", "i3", "i4", "i5"],
    "explanation": "The PEP receives the request, the policy engine (control plane) decides, the policy administrator provisions the path, the PEP enforces the session, and continuous verification re-evaluates trust (NIST SP 800-207).",
    "sourceRefs": R("1.2", "NIST SP 800-207 Zero Trust Architecture")
})

NEW.append({
    "id": "pbq-1-008", "domain": 1, "objective": "1.4", "format": "pbq", "kind": "multi-step",
    "prompt": "A company is designing a secure file transfer solution between two offices over the internet. Answer each step.",
    "context": "Requirements: confidentiality, integrity, authentication of both parties, and protection against replay.",
    "steps": [
        {
            "id": "s1", "domain": 1, "objective": "1.4", "format": "pbq", "kind": "single-choice",
            "prompt": "Which protocol suite should be used to protect the file transfer in transit?",
            "options": [
                {"id": "a", "text": "TLS 1.3", "rationale": "TLS 1.3 provides authenticated encryption, forward secrecy, and integrity."},
                {"id": "b", "text": "Telnet", "rationale": "Telnet is plaintext and provides no security."},
                {"id": "c", "text": "FTP alone", "rationale": "FTP transmits credentials and data in cleartext."},
                {"id": "d", "text": "SNMPv1", "rationale": "SNMP is for network management, not secure file transfer."}
            ],
            "correctOptionIds": ["a"], "selectCount": 1,
            "explanation": "TLS 1.3 (or SFTP/FTPS) provides confidentiality, integrity, and authentication for data in transit.",
            "sourceRefs": R("1.4")
        },
        {
            "id": "s2", "domain": 1, "objective": "1.4", "format": "pbq", "kind": "single-choice",
            "prompt": "To verify file integrity after transfer, which mechanism should be used?",
            "options": [
                {"id": "a", "text": "Compare a SHA-256 hash computed at both ends", "rationale": "Matching hashes prove the file was not modified in transit."},
                {"id": "b", "text": "Compare file sizes", "rationale": "File size can match while content differs."},
                {"id": "c", "text": "Check the modification timestamp", "rationale": "Timestamps can be spoofed and do not verify content."},
                {"id": "d", "text": "Use a checksum like CRC32", "rationale": "CRC32 is too weak to detect intentional tampering."}
            ],
            "correctOptionIds": ["a"], "selectCount": 1,
            "explanation": "A cryptographic hash (SHA-2/SHA-3) verifies integrity; CRC and size comparisons are insufficient against tampering.",
            "sourceRefs": R("1.4")
        },
        {
            "id": "s3", "domain": 1, "objective": "1.4", "format": "pbq", "kind": "single-choice",
            "prompt": "Which mechanism provides non-repudiation for the sender?",
            "options": [
                {"id": "a", "text": "Digitally sign the file with the sender's private key", "rationale": "A signature binds the sender to the content; only the sender's private key produces a verifiable signature."},
                {"id": "b", "text": "Encrypt the file with the receiver's public key", "rationale": "Encryption provides confidentiality, not proof of origin."},
                {"id": "c", "text": "Use a shared secret password", "rationale": "Shared secrets do not identify which party acted."},
                {"id": "d", "text": "Compress the file", "rationale": "Compression is not a security control."}
            ],
            "correctOptionIds": ["a"], "selectCount": 1,
            "explanation": "Digital signatures provide authenticity and non-repudiation: the signature verifies with the sender's public key, proving the sender signed it.",
            "sourceRefs": R("1.4")
        }
    ],
    "explanation": "TLS 1.3 protects in transit; hashing verifies integrity; digital signatures provide non-repudiation.",
    "sourceRefs": R("1.4")
})

# ================= D2 (+4) =================
NEW.append({
    "id": "pbq-2-008", "domain": 2, "objective": "2.3", "format": "pbq", "kind": "matching",
    "prompt": "Match each observed web attack pattern to the vulnerability it exploits. Each vulnerability is used once.",
    "context": "A penetration tester records the following observations during an assessment.",
    "premises": [
        {"id": "p1", "text": "Entering ' OR 1=1 -- in the login field returns all user records"},
        {"id": "p2", "text": "Submitting <script>alert(document.cookie)</script> in a comment field executes in other users' browsers"},
        {"id": "p3", "text": "Changing a URL parameter from /file=report1.pdf to /file=../../../etc/shadow returns system files"},
        {"id": "p4", "text": "A page sends requests to internal metadata endpoints when the 'url' parameter is set to http://169.254.169.254/"},
        {"id": "p5", "text": "A crafted serialized object sent to the API executes commands on the server"}
    ],
    "targets": [
        {"id": "t1", "text": "SQL injection"},
        {"id": "t2", "text": "Stored XSS"},
        {"id": "t3", "text": "Directory traversal"},
        {"id": "t4", "text": "Server-side request forgery (SSRF)"},
        {"id": "t5", "text": "Insecure deserialization"}
    ],
    "extraTargets": [
        {"id": "t6", "text": "CSRF"},
        {"id": "t7", "text": "Buffer overflow"}
    ],
    "correctMatches": {
        "p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"
    },
    "explanation": "SQL injection manipulates queries; stored XSS executes in other browsers; ../ sequences traverse directories; SSRF makes the server reach internal endpoints; crafted serialized objects cause insecure deserialization.",
    "sourceRefs": R("2.3", "OWASP Top 10 2021")
})

NEW.append({
    "id": "pbq-2-009", "domain": 2, "objective": "2.4", "format": "pbq", "kind": "evidence",
    "prompt": "Review the firewall log excerpt and select ALL lines that indicate the client's traffic should be considered suspicious. Select exactly 4 lines.",
    "context": "A SOC analyst reviews this firewall log for a single workstation (192.168.10.55).",
    "artifact": {
        "label": "firewall.log",
        "format": "log",
        "lines": [
            {"id": "l1", "text": "09:12:01 ALLOW tcp 192.168.10.55:49152 -> 10.0.0.4:445 (SMB)"},
            {"id": "l2", "text": "09:12:04 ALLOW tcp 192.168.10.55:49153 -> 203.0.113.9:4444 (unknown)"},
            {"id": "l3", "text": "09:12:05 ALLOW udp 192.168.10.55:5353 -> 224.0.0.251:5353 (mDNS)"},
            {"id": "l4", "text": "09:12:09 ALLOW tcp 192.168.10.55:49154 -> 198.51.100.77:3389 (RDP)"},
            {"id": "l5", "text": "09:12:11 ALLOW tcp 192.168.10.55:49155 -> 198.51.100.77:445 (SMB)"},
            {"id": "l6", "text": "09:12:15 ALLOW tcp 192.168.10.55:49156 -> 203.0.113.9:8080 (HTTP-ALT)"},
            {"id": "l7", "text": "09:12:18 ALLOW tcp 192.168.10.55:49157 -> 198.51.100.77:1433 (MSSQL)"},
            {"id": "l8", "text": "09:12:22 ALLOW tcp 192.168.10.55:49158 -> 203.0.113.9:53 (DNS over TCP)"}
        ]
    },
    "selectCount": 4,
    "correctLineIds": ["l2", "l4", "l5", "l7"],
    "explanation": "Suspicious: outbound to an unknown external IP on port 4444 (common RAT/C2 port), RDP and SMB to an external IP (lateral movement/scanning), and MSSQL to an external IP (database probing). mDNS is local multicast; SMB to 10.0.0.4 is an internal file server; HTTP-ALT and DNS could be benign but are less definitive — the four strongest indicators are l2, l4, l5, l7.",
    "sourceRefs": R("2.4", "MITRE ATT&CK T1071/T1021")
})

NEW.append({
    "id": "pbq-2-010", "domain": 2, "objective": "2.5", "format": "pbq", "kind": "configuration",
    "prompt": "Configure the web server hardening settings to satisfy the organization's security policy. Choose the BEST option for each setting.",
    "context": "Policy requirements: TLS 1.2+ only, no default pages, restrict admin access, and prevent directory listing.",
    "fields": [
        {
            "id": "f1", "label": "TLS minimum version",
            "options": [
                {"id": "o1", "text": "TLS 1.0"},
                {"id": "o2", "text": "TLS 1.1"},
                {"id": "o3", "text": "TLS 1.2"},
                {"id": "o4", "text": "SSL 3.0"}
            ]
        },
        {
            "id": "f2", "label": "Default page behavior",
            "options": [
                {"id": "o1", "text": "Remove default pages and return 404"},
                {"id": "o2", "text": "Keep the vendor welcome page"},
                {"id": "o3", "text": "Redirect default pages to the admin panel"},
                {"id": "o4", "text": "Serve a directory listing instead"}
            ]
        },
        {
            "id": "f3", "label": "Admin interface access",
            "options": [
                {"id": "o1", "text": "Allow from any IP"},
                {"id": "o2", "text": "Allow only from the management VPN range"},
                {"id": "o3", "text": "Allow from the internet with a complex password"},
                {"id": "o4", "text": "Disable authentication entirely"}
            ]
        },
        {
            "id": "f4", "label": "Directory browsing",
            "options": [
                {"id": "o1", "text": "Enabled for all directories"},
                {"id": "o2", "text": "Disabled (autoindex off)"},
                {"id": "o3", "text": "Enabled only for /images"},
                {"id": "o4", "text": "Enabled with a robots.txt notice"}
            ]
        }
    ],
    "correctValues": {"f1": "o3", "f2": "o1", "f3": "o2", "f4": "o2"},
    "explanation": "TLS 1.2+ (o3) meets the crypto policy; removing default pages (o1) prevents information disclosure; restricting admin to the VPN range (o2) limits exposure; disabling directory browsing (o2) prevents enumeration.",
    "sourceRefs": R("2.5")
})

NEW.append({
    "id": "pbq-2-011", "domain": 2, "objective": "2.2", "format": "pbq", "kind": "ordering",
    "prompt": "Arrange the steps of a typical business email compromise (BEC) attack in the order an attacker would perform them.",
    "context": "An attacker targets the finance department of a company that uses wire transfers.",
    "items": [
        {"id": "i1", "text": "Reconnaissance: research the company, executives, and vendors"},
        {"id": "i2", "text": "Impersonation: create a lookalike domain or spoof the CEO's address"},
        {"id": "i3", "text": "Pretext: send a convincing urgent invoice or wire-transfer request"},
        {"id": "i4", "text": "Fraud: victim transfers funds to the attacker-controlled account"},
        {"id": "i5", "text": "Obfuscation: launder or move funds to make recovery difficult"}
    ],
    "correctOrder": ["i1", "i2", "i3", "i4", "i5"],
    "explanation": "BEC follows: research the target, impersonate a trusted party (often with a lookalike domain), deliver a convincing pretext, collect the fraudulent transfer, then launder funds.",
    "sourceRefs": R("2.2")
})

# ================= D3 (+4) =================
NEW.append({
    "id": "pbq-3-006", "domain": 3, "objective": "3.4", "format": "pbq", "kind": "numeric",
    "prompt": "A database contains 500 GB of transaction data. The organization requires an RPO of 4 hours. Backups run every 4 hours as full copies. Each backup requires 2 hours to complete and is retained for 30 days. What is the minimum amount of storage (in GB) that must be reserved for backup retention, assuming no compression or deduplication and that the data volume is constant?",
    "context": "Enter a whole number of GB. RPO = 4h; backups every 4h; full copies; retained 30 days; 500 GB each.",
    "unit": "GB",
    "correctValue": 90000,
    "tolerance": 0,
    "explanation": "6 backups per day (24h/4h) × 30 days retention = 180 backups × 500 GB each = 90,000 GB of storage reserved.",
    "sourceRefs": R("3.4")
})

NEW.append({
    "id": "pbq-3-007", "domain": 3, "objective": "3.2", "format": "pbq", "kind": "matching",
    "prompt": "Match each architecture component to its security characteristic. Each characteristic is used once.",
    "context": "A security architect is documenting architecture decisions for an audit.",
    "premises": [
        {"id": "p1", "text": "Hypervisor"},
        {"id": "p2", "text": "Container runtime"},
        {"id": "p3", "text": "VLAN segmentation"},
        {"id": "p4", "text": "DMZ"},
        {"id": "p5", "text": "Air gap"}
    ],
    "targets": [
        {"id": "t1", "text": "Isolates VMs from each other and the host"},
        {"id": "t2", "text": "Shares the host kernel; isolation is process-level"},
        {"id": "t3", "text": "Limits east-west traffic between network zones"},
        {"id": "t4", "text": "Hosts services exposed to untrusted networks"},
        {"id": "t5", "text": "Physical or logical isolation from other networks"}
    ],
    "extraTargets": [
        {"id": "t6", "text": "Provides DNS resolution"},
        {"id": "t7", "text": "Encrypts data at rest"}
    ],
    "correctMatches": {
        "p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"
    },
    "explanation": "Hypervisors isolate VMs; containers share the kernel; VLANs segment traffic; the DMZ fronts untrusted exposure; an air gap removes connectivity.",
    "sourceRefs": R("3.2")
})

NEW.append({
    "id": "pbq-3-008", "domain": 3, "objective": "3.3", "format": "pbq", "kind": "multi-step",
    "prompt": "A company stores customer credit card data and must reduce PCI DSS scope. Answer each step.",
    "context": "The company wants to minimize the systems that store, process, or transmit cardholder data.",
    "steps": [
        {
            "id": "s1", "domain": 3, "objective": "3.3", "format": "pbq", "kind": "single-choice",
            "prompt": "Which technique removes card numbers from the application's database while preserving the ability to process refunds?",
            "options": [
                {"id": "a", "text": "Tokenization with a secured token vault", "rationale": "Tokens replace PANs; the vault holds the mapping separately, removing PANs from app scope."},
                {"id": "b", "text": "Hashing the card numbers", "rationale": "Hashing is one-way and cannot support refunds that require the original number."},
                {"id": "c", "text": "Masking the card numbers", "rationale": "Masking retains the full value in storage; scope is not reduced."},
                {"id": "d", "text": "Compressing the card numbers", "rationale": "Compression preserves the data; scope remains."}
            ],
            "correctOptionIds": ["a"], "selectCount": 1,
            "explanation": "Tokenization replaces the PAN with a token; the real value lives in a secured vault, so the application and database fall out of PCI DSS scope.",
            "sourceRefs": R("3.3")
        },
        {
            "id": "s2", "domain": 3, "objective": "3.3", "format": "pbq", "kind": "single-choice",
            "prompt": "Where should the token vault be placed to minimize scope?",
            "options": [
                {"id": "a", "text": "In a separate network segment with strict access controls", "rationale": "Isolating the vault limits the systems that store PANs to a small, controlled zone."},
                {"id": "b", "text": "On the same application server", "rationale": "Co-locating the vault with the app keeps PANs in scope on that server."},
                {"id": "c", "text": "On a public web server", "rationale": "Exposing the vault on the internet is a critical risk."},
                {"id": "d", "text": "In the DMZ with the load balancer", "rationale": "The DMZ is more exposed; the vault needs the highest protection."}
            ],
            "correctOptionIds": ["a"], "selectCount": 1,
            "explanation": "The vault must be isolated and tightly controlled so that only the tokenization service can reach it — minimizing the systems handling real PANs.",
            "sourceRefs": R("3.3")
        },
        {
            "id": "s3", "domain": 3, "objective": "3.3", "format": "pbq", "kind": "single-choice",
            "prompt": "Which control BEST protects the vault's key material?",
            "options": [
                {"id": "a", "text": "Store keys in an HSM with split custody", "rationale": "HSMs protect keys in hardware with access controls and split custody."},
                {"id": "b", "text": "Store keys in the application config file", "rationale": "Keys in config files are easily stolen."},
                {"id": "c", "text": "Embed keys in the source code", "rationale": "Keys in source code leak via repos and builds."},
                {"id": "d", "text": "Share keys with all administrators", "rationale": "Broad key access defeats least privilege."}
            ],
            "correctOptionIds": ["a"], "selectCount": 1,
            "explanation": "Hardware security modules provide tamper-resistant key storage; split custody (M-of-N) prevents any single person from accessing keys.",
            "sourceRefs": R("3.3")
        }
    ],
    "explanation": "Tokenization removes PANs from scope, the vault is isolated, and HSM-based key management protects the tokenization keys.",
    "sourceRefs": R("3.3")
})

NEW.append({
    "id": "pbq-3-009", "domain": 3, "objective": "3.1", "format": "pbq", "kind": "configuration",
    "prompt": "Configure the cloud storage bucket settings to meet the security requirements. Choose the BEST option for each setting.",
    "context": "Requirements: bucket must not be publicly readable, versioning enabled, server-side encryption at rest, and access logged.",
    "fields": [
        {
            "id": "f1", "label": "Public access",
            "options": [
                {"id": "o1", "text": "Block all public access"},
                {"id": "o2", "text": "Allow public read for everyone"},
                {"id": "o3", "text": "Allow public write for everyone"},
                {"id": "o4", "text": "Allow public read via signed URL only"}
            ]
        },
        {
            "id": "f2", "label": "Versioning",
            "options": [
                {"id": "o1", "text": "Disabled"},
                {"id": "o2", "text": "Enabled"},
                {"id": "o3", "text": "Suspended"},
                {"id": "o4", "text": "Enabled with lifecycle deletion after 1 day"}
            ]
        },
        {
            "id": "f3", "label": "Encryption at rest",
            "options": [
                {"id": "o1", "text": "Server-side encryption (SSE) with KMS-managed keys"},
                {"id": "o2", "text": "Client-side encryption with keys in the app config"},
                {"id": "o3", "text": "No encryption (default)"},
                {"id": "o4", "text": "Server-side encryption with a hard-coded key"}
            ]
        },
        {
            "id": "f4", "label": "Access logging",
            "options": [
                {"id": "o1", "text": "Disabled to save cost"},
                {"id": "o2", "text": "Enabled and sent to a separate logging bucket"},
                {"id": "o3", "text": "Enabled but logged to the same bucket"},
                {"id": "o4", "text": "Logged to the application's web server"}
            ]
        }
    ],
    "correctValues": {"f1": "o1", "f2": "o2", "f3": "o1", "f4": "o2"},
    "explanation": "Block public access; enable versioning for recovery; SSE-KMS for encryption at rest; log to a separate bucket to avoid log tampering within the same bucket.",
    "sourceRefs": R("3.1")
})

# ================= D4 (+4) =================
NEW.append({
    "id": "pbq-4-009", "domain": 4, "objective": "4.8", "format": "pbq", "kind": "ordering",
    "prompt": "Arrange the incident response phases in the order defined by NIST SP 800-61, from first to last.",
    "context": "An organization is building its incident response program.",
    "items": [
        {"id": "i1", "text": "Preparation"},
        {"id": "i2", "text": "Detection and Analysis"},
        {"id": "i3", "text": "Containment, Eradication, and Recovery"},
        {"id": "i4", "text": "Post-Incident Activity"}
    ],
    "correctOrder": ["i1", "i2", "i3", "i4"],
    "explanation": "NIST SP 800-61 defines four phases: Preparation, Detection & Analysis, Containment/Eradication/Recovery, and Post-Incident Activity.",
    "sourceRefs": R("4.8", "NIST SP 800-61")
})

NEW.append({
    "id": "pbq-4-010", "domain": 4, "objective": "4.9", "format": "pbq", "kind": "ordering",
    "prompt": "A forensic examiner must collect evidence from a compromised server. Arrange the following data sources in the correct order of volatility, from the MOST volatile to the LEAST volatile.",
    "context": "The server is still running. Collect evidence in the order that preserves the most volatile data first.",
    "items": [
        {"id": "i1", "text": "CPU registers and cache"},
        {"id": "i2", "text": "RAM / running processes"},
        {"id": "i3", "text": "Network connections and active sessions"},
        {"id": "i4", "text": "Temporary files on disk"},
        {"id": "i5", "text": "Hard drive contents"},
        {"id": "i6", "text": "Remote/archival logs"}
    ],
    "correctOrder": ["i1", "i2", "i3", "i4", "i5", "i6"],
    "explanation": "Order of volatility: registers/cache > RAM > network state > temporary files > disk > remote logs. Collect most volatile first before it disappears.",
    "sourceRefs": R("4.9")
})

NEW.append({
    "id": "pbq-4-011", "domain": 4, "objective": "4.6", "format": "pbq", "kind": "matching",
    "prompt": "Match each authentication/authorization technology to its primary purpose. Each purpose is used once.",
    "context": "An identity architect is selecting technologies for a new environment.",
    "premises": [
        {"id": "p1", "text": "SAML"},
        {"id": "p2", "text": "OAuth 2.0"},
        {"id": "p3", "text": "OpenID Connect (OIDC)"},
        {"id": "p4", "text": "Kerberos"},
        {"id": "p5", "text": "TACACS+"}
    ],
    "targets": [
        {"id": "t1", "text": "Browser-based SSO via XML security assertions"},
        {"id": "t2", "text": "Delegated authorization with scoped tokens"},
        {"id": "t3", "text": "Identity layer delivering an ID token (JWT) on top of OAuth"},
        {"id": "t4", "text": "Ticket-based authentication within a Windows domain"},
        {"id": "t5", "text": "Network device AAA with encrypted, separate authorization"}
    ],
    "extraTargets": [
        {"id": "t6", "text": "File integrity monitoring"},
        {"id": "t7", "text": "Email encryption"}
    ],
    "correctMatches": {
        "p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"
    },
    "explanation": "SAML = XML assertions for browser SSO; OAuth 2.0 = delegated authorization tokens; OIDC = identity on OAuth (ID tokens); Kerberos = ticket-based domain auth; TACACS+ = AAA for network devices.",
    "sourceRefs": R("4.6")
})

NEW.append({
    "id": "pbq-4-012", "domain": 4, "objective": "4.1", "format": "pbq", "kind": "configuration",
    "prompt": "Configure the wireless access point security settings. Choose the BEST option for each setting.",
    "context": "The WAP serves corporate laptops. Requirements: strong authentication, encrypted traffic, no open guest access, and enterprise-grade authentication.",
    "fields": [
        {
            "id": "f1", "label": "Security mode",
            "options": [
                {"id": "o1", "text": "WPA3-Enterprise with 802.1X"},
                {"id": "o2", "text": "WPA2-Personal (PSK)"},
                {"id": "o3", "text": "WEP"},
                {"id": "o4", "text": "Open"}
            ]
        },
        {
            "id": "f2", "label": "Authentication server",
            "options": [
                {"id": "o1", "text": "RADIUS server integrated with Active Directory"},
                {"id": "o2", "text": "Local WAP password database"},
                {"id": "o3", "text": "No authentication server"},
                {"id": "o4", "text": "Internet DNS server"}
            ]
        },
        {
            "id": "f3", "label": "Guest network",
            "options": [
                {"id": "o1", "text": "Disabled"},
                {"id": "o2", "text": "Enabled on the same SSID"},
                {"id": "o3", "text": "Enabled with no isolation"},
                {"id": "o4", "text": "Enabled sharing the corporate VLAN"}
            ]
        },
        {
            "id": "f4", "label": "WPS (Wi-Fi Protected Setup)",
            "options": [
                {"id": "o1", "text": "Disabled"},
                {"id": "o2", "text": "Enabled"},
                {"id": "o3", "text": "Enabled with PIN"},
                {"id": "o4", "text": "Enabled with push button"}
            ]
        }
    ],
    "correctValues": {"f1": "o1", "f2": "o1", "f3": "o1", "f4": "o1"},
    "explanation": "WPA3-Enterprise with 802.1X and RADIUS provides per-user authenticated encryption; guest network off and WPS disabled remove weak vectors.",
    "sourceRefs": R("4.3")
})

# ================= D5 (+4) =================
NEW.append({
    "id": "pbq-5-007", "domain": 5, "objective": "5.2", "format": "pbq", "kind": "numeric",
    "prompt": "An asset is valued at $250,000. The exposure factor for a specific threat is 40%, and the annualized rate of occurrence is 0.2. What is the annualized loss expectancy (ALE) in dollars?",
    "context": "Enter a whole number of dollars. SLE = AV × EF; ALE = SLE × ARO.",
    "unit": "dollars",
    "correctValue": 20000,
    "tolerance": 0,
    "explanation": "SLE = $250,000 × 0.40 = $100,000. ALE = $100,000 × 0.2 = $20,000/year.",
    "sourceRefs": R("5.2")
})

NEW.append({
    "id": "pbq-5-008", "domain": 5, "objective": "5.1", "format": "pbq", "kind": "matching",
    "prompt": "Match each governance document to its description. Each document type is used once.",
    "context": "A new security manager is organizing the documentation hierarchy.",
    "premises": [
        {"id": "p1", "text": "A mandatory, board-approved statement of intent about remote access security"},
        {"id": "p2", "text": "Specific mandatory technical requirements (e.g., AES-256, TLS 1.2 minimum)"},
        {"id": "p3", "text": "Step-by-step instructions for provisioning a new user account"},
        {"id": "p4", "text": "Recommended (but optional) practices for securing home offices"},
        {"id": "p5", "text": "A catalog of identified risks with likelihood, impact, and owners"}
    ],
    "targets": [
        {"id": "t1", "text": "Policy"},
        {"id": "t2", "text": "Standard"},
        {"id": "t3", "text": "Procedure"},
        {"id": "t4", "text": "Guideline"},
        {"id": "t5", "text": "Risk register"}
    ],
    "extraTargets": [
        {"id": "t6", "text": "SLA"},
        {"id": "t7", "text": "Penetration test report"}
    ],
    "correctMatches": {
        "p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"
    },
    "explanation": "Policy = high-level mandatory intent; standard = specific mandatory requirements; procedure = step-by-step instructions; guideline = recommended practices; risk register = catalog of risks.",
    "sourceRefs": R("5.1")
})

NEW.append({
    "id": "pbq-5-009", "domain": 5, "objective": "5.6", "format": "pbq", "kind": "ordering",
    "prompt": "Arrange the steps of a business impact analysis in the correct order.",
    "context": "A continuity planner is conducting a BIA for a retail company.",
    "items": [
        {"id": "i1", "text": "Identify critical business functions and their dependencies"},
        {"id": "i2", "text": "Determine maximum tolerable downtime (MTD) for each function"},
        {"id": "i3", "text": "Establish recovery time objectives (RTO) and recovery point objectives (RPO)"},
        {"id": "i4", "text": "Document the impact of disruptions in financial and operational terms"},
        {"id": "i5", "text": "Prioritize recovery order based on impact and dependencies"}
    ],
    "correctOrder": ["i1", "i2", "i4", "i3", "i5"],
    "explanation": "BIA flow: identify critical functions and dependencies, determine tolerable downtime, assess disruption impact, set RTO/RPO, then prioritize recovery order.",
    "sourceRefs": R("5.6")
})

NEW.append({
    "id": "pbq-5-010", "domain": 5, "objective": "5.4", "format": "pbq", "kind": "configuration",
    "prompt": "Configure the third-party vendor assessment settings. Choose the BEST option for each setting.",
    "context": "A company is onboarding a SaaS vendor that will process customer PII. Requirements: verify controls, ensure breach notification, and maintain the right to verify compliance.",
    "fields": [
        {
            "id": "f1", "label": "Initial due diligence",
            "options": [
                {"id": "o1", "text": "Review SOC 2 Type II report and security questionnaire"},
                {"id": "o2", "text": "Skip assessment to save time"},
                {"id": "o3", "text": "Trust the vendor's marketing claims"},
                {"id": "o4", "text": "Only review the pricing page"}
            ]
        },
        {
            "id": "f2", "label": "Contractual data protection",
            "options": [
                {"id": "o1", "text": "Include a data processing agreement (DPA) and NDA"},
                {"id": "o2", "text": "Verbally agree to protect data"},
                {"id": "o3", "text": "No contract needed"},
                {"id": "o4", "text": "Include only a pricing schedule"}
            ]
        },
        {
            "id": "f3", "label": "Breach notification",
            "options": [
                {"id": "o1", "text": "Contractual obligation to notify within a defined timeframe"},
                {"id": "o2", "text": "No notification requirement"},
                {"id": "o3", "text": "Notification at the vendor's discretion"},
                {"id": "o4", "text": "Notification only if media reports it"}
            ]
        },
        {
            "id": "f4", "label": "Ongoing verification",
            "options": [
                {"id": "o1", "text": "Right-to-audit clause and periodic reassessment"},
                {"id": "o2", "text": "One-time assessment, never rechecked"},
                {"id": "o3", "text": "Reassess only if the vendor requests it"},
                {"id": "o4", "text": "Annual price review instead"}
            ]
        }
    ],
    "correctValues": {"f1": "o1", "f2": "o1", "f3": "o1", "f4": "o1"},
    "explanation": "Vendor risk management: verify controls (SOC 2, questionnaire), contract data protection (DPA/NDA), require defined breach notification, and maintain right-to-audit with periodic reassessment.",
    "sourceRefs": R("5.3")
})

merge(load_bank(), new_pbqs=NEW)
