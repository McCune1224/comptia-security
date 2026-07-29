#!/usr/bin/env python3
import json
import os

QUESTIONS = []

def q(data):
    QUESTIONS.append(data)

# ─────────────────────────────────────────────────────────────
# DOMAIN 1 — General Security Concepts (4 questions)
# ─────────────────────────────────────────────────────────────

# D1-Q1: matching — Security control types
q({
    "id": "pbq-1-001",
    "domain": 1,
    "objective": "1.1",
    "format": "pbq",
    "prompt": "Drag each security control type on the left to its correct description on the right.",
    "kind": "matching",
    "explanation": "Preventive controls stop incidents before they occur (e.g., firewalls, door locks). Detective controls identify ongoing or past incidents (e.g., IDS, surveillance cameras). Corrective controls restore operations after an incident (e.g., backup restore, patching). Deterrent controls discourage potential attackers (e.g., warning signs, guard dogs). Compensating controls provide alternative protection when primary controls are not feasible.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 1.1"},
        {"source": "study-guide", "section": "Domain 1 — General Security Concepts"}
    ],
    "premises": [
        {"id": "p1", "text": "Preventive control", "rationale": "Matches 'Blocks unauthorized access before it occurs'"},
        {"id": "p2", "text": "Detective control", "rationale": "Matches 'Identifies and alerts on ongoing security events'"},
        {"id": "p3", "text": "Corrective control", "rationale": "Matches 'Restores systems after a security breach'"},
        {"id": "p4", "text": "Deterrent control", "rationale": "Matches 'Discourages potential attackers through visibility'"}
    ],
    "targets": [
        {"id": "t1", "text": "Blocks unauthorized access before it occurs", "rationale": "This describes a preventive control"},
        {"id": "t2", "text": "Identifies and alerts on ongoing security events", "rationale": "This describes a detective control"},
        {"id": "t3", "text": "Restores systems after a security breach", "rationale": "This describes a corrective control"},
        {"id": "t4", "text": "Discourages potential attackers through visibility", "rationale": "This describes a deterrent control"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4"}
})

# D1-Q2: matching — CIA triad principles
q({
    "id": "pbq-1-002",
    "domain": 1,
    "objective": "1.2",
    "format": "pbq",
    "prompt": "Match each security scenario to the CIA principle it primarily violates.",
    "kind": "matching",
    "explanation": "Confidentiality is breached when unauthorized disclosure occurs. Integrity is violated when data is improperly modified. Availability is lost when systems or data become inaccessible to authorized users. Non-repudiation provides proof of origin or receipt of data.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 1.2"},
        {"source": "study-guide", "section": "Domain 1 — General Security Concepts"}
    ],
    "premises": [
        {"id": "p1", "text": "An attacker exfiltrates customer credit card data", "rationale": "Exfiltration of data violates confidentiality"},
        {"id": "p2", "text": "A database administrator modifies salary records without authorization", "rationale": "Unauthorized modification violates integrity"},
        {"id": "p3", "text": "A DDoS attack renders the company web server unreachable", "rationale": "Denial of service violates availability"}
    ],
    "targets": [
        {"id": "t1", "text": "Confidentiality", "rationale": "Protects data from unauthorized disclosure"},
        {"id": "t2", "text": "Integrity", "rationale": "Ensures data has not been tampered with"},
        {"id": "t3", "text": "Availability", "rationale": "Ensures systems are accessible when needed"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3"}
})

# D1-Q3: ordering — Risk management process
q({
    "id": "pbq-1-003",
    "domain": 1,
    "objective": "1.5",
    "format": "pbq",
    "prompt": "Arrange the following steps in the correct order for performing a formal risk assessment according to NIST SP 800-30.",
    "kind": "ordering",
    "explanation": "The NIST SP 800-30 risk assessment process begins with identifying the system and threats, then determining likelihood and impact, computing risk, and finally recommending remediation. This follows the standard risk management framework.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 1.5"},
        {"source": "study-guide", "section": "Domain 1 — General Security Concepts"}
    ],
    "items": [
        {"id": "i1", "text": "Determine the likelihood of threat exploitation", "rationale": "Step 3 — assess the probability of each threat"},
        {"id": "i2", "text": "Identify threat sources and events", "rationale": "Step 2 — identify what threats exist"},
        {"id": "i3", "text": "Determine the impact of successful exploitation", "rationale": "Step 4 — assess the consequence of each threat"},
        {"id": "i4", "text": "System characterization and scope definition", "rationale": "Step 1 — define the boundaries of the assessment"},
        {"id": "i5", "text": "Determine risk and recommend remediation", "rationale": "Step 5 — compute risk = likelihood × impact and propose controls"}
    ],
    "correctOrder": ["i4", "i2", "i1", "i3", "i5"]
})

# D1-Q4: multiple-choice — Security control types (select two)
q({
    "id": "pbq-1-004",
    "domain": 1,
    "objective": "1.3",
    "format": "pbq",
    "prompt": "A security architect is designing a defense-in-depth strategy. Which TWO of the following are examples of technical controls that enforce access decisions at the network layer? (Choose TWO.)",
    "kind": "multiple-choice",
    "explanation": "A firewall ACL is a technical control that filters traffic at the network layer. NAC enforces access policies before devices connect to the network. An acceptable use policy is an administrative control, a security guard is a physical control, and a security awareness training program is an administrative control.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 1.3"},
        {"source": "study-guide", "section": "Domain 1 — General Security Concepts"}
    ],
    "options": [
        {"id": "a", "text": "Configuring an ACL on a firewall to deny inbound traffic on port 445", "rationale": "Correct — a firewall ACL is a technical control operating at the network layer"},
        {"id": "b", "text": "Implementing a Network Access Control (NAC) solution that checks device posture before granting VLAN access", "rationale": "Correct — NAC enforces network-layer access policies based on device compliance"},
        {"id": "c", "text": "Requiring all employees to sign an acceptable use policy (AUP)", "rationale": "Incorrect — an AUP is an administrative control, not a technical network-layer control"},
        {"id": "d", "text": "Installing a security guard at the data center entrance", "rationale": "Incorrect — a guard is a physical control"},
        {"id": "e", "text": "Conducting quarterly security awareness training", "rationale": "Incorrect — training is an administrative control"}
    ],
    "correctOptionIds": ["a", "b"],
    "selectCount": 2
})

# ─────────────────────────────────────────────────────────────
# DOMAIN 2 — Threats, Vulnerabilities & Mitigations (7 questions)
# ─────────────────────────────────────────────────────────────

# D2-Q1: ordering — Forensic acquisition process
q({
    "id": "pbq-2-001",
    "domain": 2,
    "objective": "2.4",
    "format": "pbq",
    "prompt": "Arrange the following steps in the correct order for conducting a forensic acquisition of a live Windows system during incident response.",
    "kind": "ordering",
    "explanation": "The order of volatility dictates that you capture the most volatile data first. Secure the scene, then capture network connections, then memory (RAM), then create a forensic disk image. Finally, hash the image to maintain integrity.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 2.4"},
        {"source": "study-guide", "section": "Domain 2 — Threats, Vulnerabilities & Mitigations"}
    ],
    "items": [
        {"id": "i1", "text": "Capture a memory dump using DumpIt or FTK Imager", "rationale": "Step 3 — capture RAM before powering down"},
        {"id": "i2", "text": "Record active network connections with netstat -an", "rationale": "Step 2 — network state information is volatile"},
        {"id": "i3", "text": "Create a forensic bit-for-bit image of the hard drive using dd or FTK Imager", "rationale": "Step 4 — capture persistent storage after volatile data"},
        {"id": "i4", "text": "Secure the scene and photograph the system and connections", "rationale": "Step 1 — document the state before touching anything"},
        {"id": "i5", "text": "Compute SHA-256 hash of the disk image and log the chain of custody", "rationale": "Step 5 — verify integrity after imaging"}
    ],
    "correctOrder": ["i4", "i2", "i1", "i3", "i5"]
})

# D2-Q2: ordering — Social engineering attack chain
q({
    "id": "pbq-2-002",
    "domain": 2,
    "objective": "2.1",
    "format": "pbq",
    "prompt": "Arrange the following phases of a spear-phishing campaign in the correct sequence an attacker would follow.",
    "kind": "ordering",
    "explanation": "A targeted phishing attack begins with reconnaissance to gather information about the victim, then crafting a convincing lure, delivering the payload, exploiting the victim, and finally exfiltrating data.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 2.1"},
        {"source": "study-guide", "section": "Domain 2 — Threats, Vulnerabilities & Mitigations"}
    ],
    "items": [
        {"id": "i1", "text": "Research the target using OSINT and social media to gather personal details", "rationale": "Step 1 — reconnaissance to craft a believable lure"},
        {"id": "i2", "text": "Deliver the phishing email containing a malicious attachment or link", "rationale": "Step 3 — send the weaponized email"},
        {"id": "i3", "text": "Craft a personalized email referencing known contacts or projects", "rationale": "Step 2 — use gathered intelligence to build trust"},
        {"id": "i4", "text": "Establish command-and-control and exfiltrate sensitive data", "rationale": "Step 5 — complete the objective after exploitation"},
        {"id": "i5", "text": "The victim opens the attachment, executing a remote access Trojan", "rationale": "Step 4 — exploitation of the human target"}
    ],
    "correctOrder": ["i1", "i3", "i2", "i5", "i4"]
})

# D2-Q3: matching — Attack type identification
q({
    "id": "pbq-2-003",
    "domain": 2,
    "objective": "2.3",
    "format": "pbq",
    "prompt": "Match each attack description to the correct attack type.",
    "kind": "matching",
    "explanation": "A pass-the-hash attack uses NTLM hash values to authenticate without the plaintext password. An SQL injection attack inserts malicious SQL queries into input fields. A cross-site scripting attack injects client-side scripts into web pages viewed by others. A DLL hijacking attack exploits the Windows DLL search order to load a malicious DLL.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 2.3"},
        {"source": "study-guide", "section": "Domain 2 — Threats, Vulnerabilities & Mitigations"}
    ],
    "premises": [
        {"id": "p1", "text": "An attacker uses a captured NTLM hash to authenticate to a remote server without knowing the plaintext password", "rationale": "This is the defining characteristic of pass-the-hash"},
        {"id": "p2", "text": "An attacker inputs ' OR 1=1 -- into a login form and gains unauthorized access to the database", "rationale": "SQL injection alters the logic of SQL queries"},
        {"id": "p3", "text": "An attacker places a malicious DLL in a directory where an application loads dependencies before the system path", "rationale": "DLL hijacking exploits the search order to load a rogue DLL"}
    ],
    "targets": [
        {"id": "t1", "text": "Pass-the-hash", "rationale": "Uses captured credential hashes for authentication"},
        {"id": "t2", "text": "SQL injection", "rationale": "Injects SQL commands via unsanitized input"},
        {"id": "t3", "text": "DLL hijacking", "rationale": "Loads a malicious DLL via search-order exploitation"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3"}
})

# D2-Q4: configuration — WAF rule to block SQLi
q({
    "id": "pbq-2-004",
    "domain": 2,
    "objective": "2.3",
    "format": "pbq",
    "prompt": "A web application firewall (WAF) needs a rule to block SQL injection attempts targeting the login form. Complete the rule configuration by selecting the correct values for each field.",
    "kind": "configuration",
    "explanation": "SQL injection typically targets input parameters in GET/POST requests. Blocking requests containing SQL keywords like UNION, SELECT, and ' OR in query strings or body parameters is an effective WAF rule. The action should be 'Block' and the location should match the URL parameter.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 2.3"},
        {"source": "study-guide", "section": "Domain 2 — Threats, Vulnerabilities & Mitigations"}
    ],
    "fields": [
        {"id": "action", "label": "Action", "options": [
            {"id": "block", "text": "Block"},
            {"id": "allow", "text": "Allow"},
            {"id": "log", "text": "Log Only"}
        ]},
        {"id": "location", "label": "Inspect Location", "options": [
            {"id": "args", "text": "Query/Form Arguments"},
            {"id": "headers", "text": "HTTP Headers"},
            {"id": "cookies", "text": "Cookies"}
        ]},
        {"id": "match", "label": "Match Pattern", "options": [
            {"id": "sqli", "text": "UNION|SELECT|' OR|--|DROP"},
            {"id": "xss", "text": "<script>|onerror=|javascript:"},
            {"id": "lfi", "text": "../|etc/passwd|php://"}
        ]}
    ],
    "correctValues": {"action": "block", "location": "args", "match": "sqli"}
})

# D2-Q5: multiple-choice — Malware indicators (select two)
q({
    "id": "pbq-2-005",
    "domain": 2,
    "objective": "2.2",
    "format": "pbq",
    "prompt": "A security analyst reviews the following alert from the EDR console on a Windows workstation. Which TWO findings most strongly indicate the presence of ransomware? (Choose TWO.)",
    "context": "Alert summary: Process 'svchost.exe' with PID 4821 spawned from an unusual parent process 'wscript.exe'. The process then enumerated files with extensions .docx, .xlsx, .pdf and .jpg. Within 30 seconds, the system logged hundreds of write operations to these files with new .encrypted extensions. A text file named RECOVER_FILES.txt appeared on the desktop.",
    "kind": "multiple-choice",
    "explanation": "Mass file renaming with a new extension and the presence of a ransom note are hallmark indicators of ransomware. Svchost.exe running from a script host is suspicious but not definitive as a standalone indicator. High CPU could be caused by many things. Registry modification and C2 beaconing are common across many malware types.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 2.2"},
        {"source": "study-guide", "section": "Domain 2 — Threats, Vulnerabilities & Mitigations"}
    ],
    "options": [
        {"id": "a", "text": "Files are being renamed with a .encrypted extension at high frequency", "rationale": "Correct — mass encryption and renaming of files is a signature ransomware behavior"},
        {"id": "b", "text": "A ransom note file (RECOVER_FILES.txt) was created on the desktop", "rationale": "Correct — ransom notes demanding payment for decryption are unique to ransomware"},
        {"id": "c", "text": "Svchost.exe was spawned from wscript.exe, an unusual parent process", "rationale": "Incorrect — suspicious but can occur with other malware or scripting abuse"},
        {"id": "d", "text": "The system CPU utilization spiked to 95% during the file operations", "rationale": "Incorrect — high CPU alone is not specific to ransomware"},
        {"id": "e", "text": "A registry run key was modified to maintain persistence", "rationale": "Incorrect — persistence mechanisms are common to many malware families, not specific to ransomware"}
    ],
    "correctOptionIds": ["a", "b"],
    "selectCount": 2
})

# D2-Q6: evidence — Identify indicators of compromise in a log
q({
    "id": "pbq-2-006",
    "domain": 2,
    "objective": "2.4",
    "format": "pbq",
    "prompt": "Review the following firewall log excerpt. Which entries indicate a possible port scan against the company's public-facing web server? Select all that apply.",
    "kind": "evidence",
    "explanation": "A port scan is characterized by connection attempts to multiple sequential or nearby ports from the same source IP in a short time window. Entries showing rapid connections from a single IP to different ports (like l2 through l6 in this sequence) are classic port scan indicators.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 2.4"},
        {"source": "study-guide", "section": "Domain 2 — Threats, Vulnerabilities & Mitigations"}
    ],
    "artifact": {
        "label": "Firewall connection log excerpt",
        "format": "log",
        "lines": [
            {"id": "l1", "text": "10.0.0.1:443 → 203.0.113.5:53421 — ESTABLISHED — https (legitimate user session)", "rationale": "Normal HTTPS traffic, not a scan"},
            {"id": "l2", "text": "198.51.100.7:50001 → 203.0.113.5:22 — SYN_SENT — timed out", "rationale": "SSH port probe from external IP"},
            {"id": "l3", "text": "198.51.100.7:50002 → 203.0.113.5:23 — SYN_SENT — timed out", "rationale": "Telnet port probe, sequential port scan pattern"},
            {"id": "l4", "text": "198.51.100.7:50003 → 203.0.113.5:25 — SYN_SENT — timed out", "rationale": "SMTP port probe, continuing sequential pattern"},
            {"id": "l5", "text": "198.51.100.7:50004 → 203.0.113.5:80 — SYN_SENT — timed out", "rationale": "HTTP port probe — part of scan sequence"},
            {"id": "l6", "text": "198.51.100.7:50005 → 203.0.113.5:443 — SYN_SENT — timed out", "rationale": "HTTPS port probe — completes the scan sequence"},
            {"id": "l7", "text": "10.0.0.1:445 → 203.0.113.10:48900 — ESTABLISHED — smb (internal file share)", "rationale": "Internal SMB traffic, not a scan"}
        ]
    },
    "selectCount": 5,
    "correctLineIds": ["l2", "l3", "l4", "l5", "l6"]
})

# D2-Q7: numeric — ALE calculation
q({
    "id": "pbq-2-007",
    "domain": 2,
    "objective": "2.5",
    "format": "pbq",
    "prompt": "A company uses the risk formula ALE = SLE × ARO. A server failure costs $15,000 in lost revenue per incident and occurs 4 times per year on average. What is the annualized loss expectancy (ALE) in dollars?",
    "kind": "numeric",
    "explanation": "SLE (Single Loss Expectancy) = $15,000. ARO (Annualized Rate of Occurrence) = 4. ALE = $15,000 × 4 = $60,000.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 2.5"},
        {"source": "study-guide", "section": "Domain 2 — Threats, Vulnerabilities & Mitigations"}
    ],
    "unit": "dollars",
    "correctValue": 60000,
    "tolerance": 0
})

# ─────────────────────────────────────────────────────────────
# DOMAIN 3 — Security Architecture (5 questions)
# ─────────────────────────────────────────────────────────────

# D3-Q1: matching — Secure protocol mapping
q({
    "id": "pbq-3-001",
    "domain": 3,
    "objective": "3.1",
    "format": "pbq",
    "prompt": "Match each insecure protocol on the left to its secure replacement on the right.",
    "kind": "matching",
    "explanation": "SFTP replaces FTP for secure file transfer. HTTPS replaces HTTP by adding TLS encryption. SSH replaces Telnet for secure remote administration. DNSSEC adds cryptographic signatures to DNS data to prevent spoofing.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 3.1"},
        {"source": "study-guide", "section": "Domain 3 — Security Architecture"}
    ],
    "premises": [
        {"id": "p1", "text": "FTP", "rationale": "FTP transmits credentials and data in cleartext"},
        {"id": "p2", "text": "HTTP", "rationale": "HTTP provides no encryption for web traffic"},
        {"id": "p3", "text": "Telnet", "rationale": "Telnet sends all session data including passwords unencrypted"},
        {"id": "p4", "text": "DNS (unsecured)", "rationale": "Standard DNS queries and responses are vulnerable to spoofing"}
    ],
    "targets": [
        {"id": "t1", "text": "SFTP", "rationale": "Encrypts file transfer sessions"},
        {"id": "t2", "text": "HTTPS", "rationale": "Encrypts web traffic with TLS"},
        {"id": "t3", "text": "SSH", "rationale": "Provides encrypted remote shell access"},
        {"id": "t4", "text": "DNSSEC", "rationale": "Adds cryptographic validation to DNS responses"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4"}
})

# D3-Q2: ordering — Certificate issuance process
q({
    "id": "pbq-3-002",
    "domain": 3,
    "objective": "3.4",
    "format": "pbq",
    "prompt": "Arrange the following steps in the correct order for issuing a TLS server certificate using a public CA.",
    "kind": "ordering",
    "explanation": "The certificate issuance process begins with generating a key pair and CSR, then submitting it to the CA. The CA validates domain ownership, issues the signed certificate, and the server installs it. Certificate pinning is an optional additional hardening step.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 3.4"},
        {"source": "study-guide", "section": "Domain 3 — Security Architecture"}
    ],
    "items": [
        {"id": "i1", "text": "Install the signed certificate on the web server and bind it to port 443", "rationale": "Step 4 — complete the installation"},
        {"id": "i2", "text": "Submit the CSR to a public Certificate Authority", "rationale": "Step 2 — request signing from a trusted CA"},
        {"id": "i3", "text": "Generate a private key and Certificate Signing Request (CSR) on the server", "rationale": "Step 1 — create the key pair and CSR"},
        {"id": "i4", "text": "The CA validates domain control via email, DNS, or HTTP challenge", "rationale": "Step 3 — CA verifies ownership before signing"},
        {"id": "i5", "text": "Configure HPKP or certificate pinning as an optional security measure", "rationale": "Step 5 — optional hardening after installation"}
    ],
    "correctOrder": ["i3", "i2", "i4", "i1", "i5"]
})

# D3-Q3: configuration — Firewall rule for DMZ
q({
    "id": "pbq-3-003",
    "domain": 3,
    "objective": "3.2",
    "format": "pbq",
    "prompt": "Complete the firewall rule to allow inbound HTTPS traffic from the internet to the DMZ web server (10.0.1.10) while blocking all other inbound traffic.",
    "kind": "configuration",
    "explanation": "The rule should allow TCP port 443 (HTTPS) inbound to the DMZ web server. The action is Allow for this traffic; the default implicit deny handles blocking everything else. Source should be Any (internet), destination the DMZ server IP.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 3.2"},
        {"source": "study-guide", "section": "Domain 3 — Security Architecture"}
    ],
    "fields": [
        {"id": "action", "label": "Action", "options": [
            {"id": "allow", "text": "Allow"},
            {"id": "deny", "text": "Deny"}
        ]},
        {"id": "protocol", "label": "Protocol", "options": [
            {"id": "tcp", "text": "TCP"},
            {"id": "udp", "text": "UDP"},
            {"id": "any", "text": "Any"}
        ]},
        {"id": "src", "label": "Source Zone", "options": [
            {"id": "wan", "text": "WAN (Internet)"},
            {"id": "lan", "text": "LAN (Internal)"},
            {"id": "dmz", "text": "DMZ"}
        ]},
        {"id": "dst", "label": "Destination", "options": [
            {"id": "web", "text": "10.0.1.10 (DMZ Web Server)"},
            {"id": "any_dmz", "text": "Any DMZ Host"},
            {"id": "lan_net", "text": "10.0.0.0/24 (LAN)"}
        ]},
        {"id": "port", "label": "Destination Port", "options": [
            {"id": "p443", "text": "443"},
            {"id": "p80", "text": "80"},
            {"id": "p8443", "text": "8443"}
        ]}
    ],
    "correctValues": {"action": "allow", "protocol": "tcp", "src": "wan", "dst": "web", "port": "p443"}
})

# D3-Q4: configuration — Data classification labels
q({
    "id": "pbq-3-004",
    "domain": 3,
    "objective": "3.6",
    "format": "pbq",
    "prompt": "A company is configuring a data loss prevention (DLP) system. Select the correct classification label, handling requirement, and encryption standard for each data type.",
    "kind": "configuration",
    "explanation": "PII like SSNs requires the highest protection: Restricted classification, strict access control, and AES-256 encryption. Financial records are Confidential with role-based access and AES-128. Marketing collateral is Public, needs no special handling, but encryption in transit is still recommended.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 3.6"},
        {"source": "study-guide", "section": "Domain 3 — Security Architecture"}
    ],
    "fields": [
        {"id": "class", "label": "Data Classification", "options": [
            {"id": "restricted", "text": "Restricted"},
            {"id": "confidential", "text": "Confidential"},
            {"id": "public", "text": "Public"}
        ]},
        {"id": "handling", "label": "Handling Requirement", "options": [
            {"id": "strict_ac", "text": "Strict access control + encryption at rest"},
            {"id": "role_ac", "text": "Role-based access + encryption for transmission"},
            {"id": "none", "text": "No special handling required"}
        ]},
        {"id": "encryption", "label": "Encryption Standard", "options": [
            {"id": "aes256", "text": "AES-256"},
            {"id": "aes128", "text": "AES-128"},
            {"id": "tls", "text": "TLS 1.3 only"}
        ]}
    ],
    "correctValues": {"class": "restricted", "handling": "strict_ac", "encryption": "aes256"}
})

# D3-Q5: multiple-choice — Cloud deployment models (select two)
q({
    "id": "pbq-3-005",
    "domain": 3,
    "objective": "3.5",
    "format": "pbq",
    "prompt": "A financial services company must migrate sensitive customer data to the cloud while meeting regulatory requirements that mandate the data remain on dedicated infrastructure not shared with other tenants. The company also needs a separate cloud environment for development and testing that uses the same management interface. Which TWO cloud deployment models satisfy these requirements? (Choose TWO.)",
    "kind": "multiple-choice",
    "explanation": "A private cloud provides dedicated, single-tenant infrastructure meeting the isolation requirement. A hybrid cloud connects private and public environments with unified management for dev/test. Public cloud is multi-tenant by nature. Community cloud is shared among organizations. Multi-cloud uses multiple providers but doesn't inherently isolate.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 3.5"},
        {"source": "study-guide", "section": "Domain 3 — Security Architecture"}
    ],
    "options": [
        {"id": "a", "text": "Private cloud — dedicated infrastructure for exclusive use by the organization", "rationale": "Correct — single-tenant infrastructure meets regulatory isolation requirements"},
        {"id": "b", "text": "Hybrid cloud — with a VPN connecting the private cloud to a public cloud dev/test environment", "rationale": "Correct — provides dedicated infrastructure with ability to extend to public cloud for dev/test"},
        {"id": "c", "text": "Public cloud — using a shared infrastructure pool", "rationale": "Incorrect — multi-tenant shared infrastructure does not meet dedicated infrastructure requirements"},
        {"id": "d", "text": "Community cloud — shared infrastructure for several organizations with similar requirements", "rationale": "Incorrect — still shared among multiple organizations, not dedicated"},
        {"id": "e", "text": "Multi-cloud — using two different public cloud providers", "rationale": "Incorrect — multi-cloud does not guarantee dedicated single-tenant infrastructure"}
    ],
    "correctOptionIds": ["a", "b"],
    "selectCount": 2
})

# ─────────────────────────────────────────────────────────────
# DOMAIN 4 — Security Operations (8 questions)
# ─────────────────────────────────────────────────────────────

# D4-Q1: matching — Incident response phases
q({
    "id": "pbq-4-001",
    "domain": 4,
    "objective": "4.1",
    "format": "pbq",
    "prompt": "Match each incident response phase to its primary activity.",
    "kind": "matching",
    "explanation": "Preparation involves training and equipping the IR team. Detection & Analysis identifies and validates the incident. Containment, Eradication & Recovery stops the spread and removes the threat. Post-Incident Activity focuses on lessons learned and documentation updates.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 4.1"},
        {"source": "study-guide", "section": "Domain 4 — Security Operations"}
    ],
    "premises": [
        {"id": "p1", "text": "Preparation", "rationale": "Phase 1 — build capability before an incident occurs"},
        {"id": "p2", "text": "Detection and Analysis", "rationale": "Phase 2 — identify and verify the incident"},
        {"id": "p3", "text": "Containment, Eradication, and Recovery", "rationale": "Phase 3 — stop and remediate"},
        {"id": "p4", "text": "Post-Incident Activity", "rationale": "Phase 4 — learn and improve"}
    ],
    "targets": [
        {"id": "t1", "text": "Develop IR playbooks, train staff, and deploy monitoring tools", "rationale": "Activities in the Preparation phase"},
        {"id": "t2", "text": "Review alerts, analyze indicators, and determine the scope of the incident", "rationale": "Activities in Detection & Analysis"},
        {"id": "t3", "text": "Isolate affected systems, remove malware, and restore from clean backups", "rationale": "Activities in Containment, Eradication & Recovery"},
        {"id": "t4", "text": "Conduct a lessons-learned meeting and update security policies", "rationale": "Activities in Post-Incident"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4"}
})

# D4-Q2: ordering — Vulnerability management lifecycle
q({
    "id": "pbq-4-002",
    "domain": 4,
    "objective": "4.2",
    "format": "pbq",
    "prompt": "Arrange the following steps in the correct order for a vulnerability management program lifecycle.",
    "kind": "ordering",
    "explanation": "The vulnerability management lifecycle begins with discovering and inventorying assets, then prioritizing them based on criticality. Next, assess the assets for vulnerabilities, remediate or mitigate findings, and finally verify that remediation was successful.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 4.2"},
        {"source": "study-guide", "section": "Domain 4 — Security Operations"}
    ],
    "items": [
        {"id": "i1", "text": "Remediate vulnerabilities through patching, configuration changes, or compensating controls", "rationale": "Step 4 — apply fixes"},
        {"id": "i2", "text": "Scan assets using authenticated vulnerability scanners (e.g., Nessus, OpenVAS)", "rationale": "Step 3 — detect vulnerabilities"},
        {"id": "i3", "text": "Discover and inventory all assets on the network", "rationale": "Step 1 — know what you have"},
        {"id": "i4", "text": "Verify remediation with a follow-up scan or manual validation", "rationale": "Step 5 — confirm fix"},
        {"id": "i5", "text": "Assign criticality ratings and prioritize assets based on business impact", "rationale": "Step 2 — prioritize before scanning"}
    ],
    "correctOrder": ["i3", "i5", "i2", "i1", "i4"]
})

# D4-Q3: configuration — SIEM correlation rule
q({
    "id": "pbq-4-003",
    "domain": 4,
    "objective": "4.3",
    "format": "pbq",
    "prompt": "Configure a SIEM correlation rule to detect a potential brute-force attack against the SSH service. Select the appropriate values for each field.",
    "kind": "configuration",
    "explanation": "Brute-force SSH attacks are characterized by repeated failed authentication attempts from the same source IP within a short time window. The correlation should trigger on Authentication Failure events for SSH, grouped by source IP, with a threshold of 10 failures within 60 seconds.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 4.3"},
        {"source": "study-guide", "section": "Domain 4 — Security Operations"}
    ],
    "fields": [
        {"id": "event_type", "label": "Event Type", "options": [
            {"id": "auth_fail", "text": "Authentication Failure"},
            {"id": "auth_success", "text": "Authentication Success"},
            {"id": "conn_closed", "text": "Connection Closed"}
        ]},
        {"id": "service", "label": "Targeted Service", "options": [
            {"id": "ssh", "text": "SSH (port 22)"},
            {"id": "rdp", "text": "RDP (port 3389)"},
            {"id": "smtp", "text": "SMTP (port 25)"}
        ]},
        {"id": "group_by", "label": "Group Events By", "options": [
            {"id": "src_ip", "text": "Source IP Address"},
            {"id": "dest_ip", "text": "Destination IP Address"},
            {"id": "username", "text": "Username"}
        ]},
        {"id": "threshold", "label": "Failure Threshold", "options": [
            {"id": "t10", "text": "10 failures in 60 seconds"},
            {"id": "t3", "text": "3 failures in 300 seconds"},
            {"id": "t50", "text": "50 failures in 30 seconds"}
        ]}
    ],
    "correctValues": {"event_type": "auth_fail", "service": "ssh", "group_by": "src_ip", "threshold": "t10"}
})

# D4-Q4: configuration — Data backup schedule
q({
    "id": "pbq-4-004",
    "domain": 4,
    "objective": "4.4",
    "format": "pbq",
    "prompt": "An organization needs a backup strategy that meets a 4-hour recovery time objective (RTO) and a 1-hour recovery point objective (RPO) for its critical database server. Select the correct backup configuration.",
    "kind": "configuration",
    "explanation": "To meet a 1-hour RPO, transaction log backups every 30 minutes ensure minimal data loss. To meet a 4-hour RTO, full daily backups with differential backups every 6 hours speed recovery because you only need the last full + last differential + logs. Offsite storage is essential for disaster recovery.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 4.4"},
        {"source": "study-guide", "section": "Domain 4 — Security Operations"}
    ],
    "fields": [
        {"id": "schedule", "label": "Backup Schedule", "options": [
            {"id": "full_daily", "text": "Full backup daily + differential every 6 hours + transaction log every 30 min"},
            {"id": "full_weekly", "text": "Full backup weekly + differential daily"},
            {"id": "full_monthly", "text": "Full backup monthly + no differential"}
        ]},
        {"id": "storage", "label": "Storage Location", "options": [
            {"id": "offsite_cloud", "text": "Offsite encrypted cloud storage (AES-256)"},
            {"id": "local_disk", "text": "Local disk on the same server"},
            {"id": "nas", "text": "Network-attached storage on the same LAN"}
        ]},
        {"id": "retention", "label": "Retention Policy", "options": [
            {"id": "gfs", "text": "Grandfather-Father-Son: 7 daily, 4 weekly, 12 monthly"},
            {"id": "simple", "text": "Keep last 30 days only"},
            {"id": "infinite", "text": "Retain all backups indefinitely"}
        ]}
    ],
    "correctValues": {"schedule": "full_daily", "storage": "offsite_cloud", "retention": "gfs"}
})

# D4-Q5: multiple-choice — Business continuity (select two)
q({
    "id": "pbq-4-005",
    "domain": 4,
    "objective": "4.4",
    "format": "pbq",
    "prompt": "A company is developing a business continuity plan (BCP) for its e-commerce platform. During the business impact analysis (BIA), which TWO metrics are MOST critical for determining recovery priorities? (Choose TWO.)",
    "kind": "multiple-choice",
    "explanation": "RTO (Recovery Time Objective) defines the maximum acceptable downtime before recovery must be complete. RPO (Recovery Point Objective) defines the maximum acceptable data loss measured in time. MTBF and MTTF are reliability metrics. SLE is a risk metric used in quantitative risk analysis.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 4.4"},
        {"source": "study-guide", "section": "Domain 4 — Security Operations"}
    ],
    "options": [
        {"id": "a", "text": "Recovery Time Objective (RTO) — the maximum acceptable downtime for a system", "rationale": "Correct — RTO directly drives recovery priority and resource allocation"},
        {"id": "b", "text": "Recovery Point Objective (RPO) — the maximum acceptable data loss measured in time", "rationale": "Correct — RPO determines backup frequency and data loss tolerance"},
        {"id": "c", "text": "Mean Time Between Failures (MTBF) — the average time between system failures", "rationale": "Incorrect — MTBF is a reliability metric, not a recovery priority metric"},
        {"id": "d", "text": "Mean Time to Failure (MTTF) — the expected time until the first failure", "rationale": "Incorrect — MTTF is used for non-repairable components"},
        {"id": "e", "text": "Single Loss Expectancy (SLE) — the monetary loss from a single incident", "rationale": "Incorrect — SLE is used in quantitative risk analysis, not BIA recovery prioritization"}
    ],
    "correctOptionIds": ["a", "b"],
    "selectCount": 2
})

# D4-Q6: evidence — Identify phishing indicators in email headers
q({
    "id": "pbq-4-006",
    "domain": 4,
    "objective": "4.1",
    "format": "pbq",
    "prompt": "Review the following email header excerpt from a suspicious email received by a company employee. Which lines contain indicators of a phishing or spoofing attempt? Select all that apply.",
    "kind": "evidence",
    "explanation": "A mismatch between the From domain and the actual sending server (SPF fail), a missing or failing DKIM signature, and an incorrect Reply-To address are all strong phishing indicators. A low spam score alone is not definitive, and a legitimate Message-ID format is not suspicious.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 4.1"},
        {"source": "study-guide", "section": "Domain 4 — Security Operations"}
    ],
    "artifact": {
        "label": "Email header (RFC 5322)",
        "format": "log",
        "lines": [
            {"id": "l1", "text": "From: \"IT Support\" <support@company-secure-update.com>", "rationale": "Suspicious — domain does not match the real company domain"},
            {"id": "l2", "text": "Reply-To: <attacker@malicious.net>", "rationale": "Suspicious — replies go to an attacker-controlled address"},
            {"id": "l3", "text": "Received-SPF: fail (mail.company-secure-update.com does not designate 192.0.2.50 as sender)", "rationale": "SPF failure indicates the sending server is not authorized"},
            {"id": "l4", "text": "DKIM-Signature: v=1; d=company-secure-update.com; s=selector1; bh=... (signature verification FAILED)", "rationale": "DKIM failure means the email may have been tampered with or spoofed"},
            {"id": "l5", "text": "X-Spam-Score: 2.3 (not considered spam by filter threshold of 5.0)", "rationale": "Not inherently suspicious — low spam score alone does not rule out phishing"},
            {"id": "l6", "text": "Message-ID: <20250213142311.7a3b9c8f@mail.company-secure-update.com>", "rationale": "Not suspicious — standard Message-ID format for the sending domain"}
        ]
    },
    "selectCount": 4,
    "correctLineIds": ["l1", "l2", "l3", "l4"]
})

# D4-Q7: evidence — Log analysis for lateral movement
q({
    "id": "pbq-4-007",
    "domain": 4,
    "objective": "4.1",
    "format": "pbq",
    "prompt": "A security analyst is investigating a potential breach. Review the following Windows Event Log excerpts and select the entries that indicate lateral movement using Pass-the-Hash or remote service exploitation. Select all that apply.",
    "kind": "evidence",
    "explanation": "Lateral movement via Pass-the-Hash is indicated by network logons (Logon Type 3) where the same account authenticates to multiple systems in rapid succession. Service control manager events (Event ID 7045) showing a service installed remotely also indicate lateral movement.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 4.1"},
        {"source": "study-guide", "section": "Domain 4 — Security Operations"}
    ],
    "artifact": {
        "label": "Windows Security Event Log",
        "format": "log",
        "lines": [
            {"id": "l1", "text": "Event ID 4624: Logon Type 3 — Account 'CORP\\jsmith' from WORKSTATION1 (192.168.1.10) to SERVER-DB (192.168.1.50) at 14:22:03", "rationale": "Network logon from workstation to database server — possible lateral movement"},
            {"id": "l2", "text": "Event ID 4624: Logon Type 3 — Account 'CORP\\jsmith' from WORKSTATION1 (192.168.1.10) to SERVER-APP (192.168.1.51) at 14:22:05", "rationale": "Same account connecting to another server seconds later — lateral movement indicator"},
            {"id": "l3", "text": "Event ID 4624: Logon Type 2 — Account 'CORP\\jsmith' logged on locally to WORKSTATION1 at 08:15:00", "rationale": "Normal interactive logon at start of day — not lateral movement"},
            {"id": "l4", "text": "Event ID 7045: Service 'RemoteUpdateSvc' installed on SERVER-APP by CORP\\jsmith with start type AUTO_START", "rationale": "Service installed remotely — common lateral movement technique (PsExec, SC) "},
            {"id": "l5", "text": "Event ID 4634: Account 'CORP\\jsmith' logged off from WORKSTATION1 at 17:01:00", "rationale": "Normal end-of-day logoff — not indicative of lateral movement"},
            {"id": "l6", "text": "Event ID 4688: Process 'cmd.exe' created with command: 'net use \\\\SERVER-DB\\IPC$ /user:Administrator' on WORKSTATION1", "rationale": "Use of net use to establish an IPC connection as administrator — potential lateral movement preparation"}
        ]
    },
    "selectCount": 4,
    "correctLineIds": ["l1", "l2", "l4", "l6"]
})

# D4-Q8: numeric — MTTR calculation
q({
    "id": "pbq-4-008",
    "domain": 4,
    "objective": "4.4",
    "format": "pbq",
    "prompt": "Over the past quarter, a help desk resolved 12 security incidents with the following total downtime: Incident A (2.5 hours), B (1.0 hour), C (3.5 hours), D (0.5 hours), E (4.0 hours), F (1.5 hours), G (2.0 hours), H (3.0 hours), I (1.0 hour), J (2.5 hours), K (0.5 hours), L (3.0 hours). What is the Mean Time to Repair (MTTR) in hours? Round to one decimal place.",
    "kind": "numeric",
    "explanation": "MTTR = Total repair time / Number of incidents. Total = 2.5+1.0+3.5+0.5+4.0+1.5+2.0+3.0+1.0+2.5+0.5+3.0 = 25.0 hours. 25.0 / 12 = 2.0833... Rounded to 2.1 hours.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 4.4"},
        {"source": "study-guide", "section": "Domain 4 — Security Operations"}
    ],
    "unit": "hours",
    "correctValue": 2.1,
    "tolerance": 0.05
})

# ─────────────────────────────────────────────────────────────
# DOMAIN 5 — Security Program Management & Oversight (6 questions)
# ─────────────────────────────────────────────────────────────

# D5-Q1: matching — Security framework mapping
q({
    "id": "pbq-5-001",
    "domain": 5,
    "objective": "5.1",
    "format": "pbq",
    "prompt": "Match each security framework or standard to its primary purpose.",
    "kind": "matching",
    "explanation": "NIST CSF provides a comprehensive risk-based framework for improving cybersecurity. ISO 27001 specifies requirements for an ISMS. PCI DSS is a specific standard for payment card data security. COBIT focuses on IT governance and management.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 5.1"},
        {"source": "study-guide", "section": "Domain 5 — Security Program Management & Oversight"}
    ],
    "premises": [
        {"id": "p1", "text": "NIST Cybersecurity Framework (CSF)", "rationale": "A risk-based framework for improving critical infrastructure cybersecurity"},
        {"id": "p2", "text": "ISO/IEC 27001", "rationale": "International standard for information security management systems"},
        {"id": "p3", "text": "PCI DSS", "rationale": "Security standard for organizations handling payment card data"}
    ],
    "targets": [
        {"id": "t1", "text": "Provides a policy framework for managing information security risks across an organization", "rationale": "This describes the purpose of ISO 27001"},
        {"id": "t2", "text": "Defines security controls for protecting cardholder data", "rationale": "This describes the purpose of PCI DSS"},
        {"id": "t3", "text": "Offers a risk-based approach to cybersecurity with five core functions: Identify, Protect, Detect, Respond, Recover", "rationale": "This describes the NIST CSF"}
    ],
    "correctMatches": {"p1": "t3", "p2": "t1", "p3": "t2"}
})

# D5-Q2: configuration — Access control model
q({
    "id": "pbq-5-002",
    "domain": 5,
    "objective": "5.2",
    "format": "pbq",
    "prompt": "A company is implementing an access control system for its document management platform. Select the correct access control model and configuration to enforce the principle of least privilege while allowing managers to temporarily delegate access to their direct reports during absences.",
    "kind": "configuration",
    "explanation": "Role-Based Access Control (RBAC) assigns permissions based on job roles, supporting least privilege. Combined with a time-limited delegation mechanism using Access Control Lists (ACLs), managers can grant temporary access. Discretionary Access Control (DAC) allows data owners to set permissions arbitrarily, which is too permissive. Mandatory Access Control (MAC) uses labels and is too inflexible for delegation.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 5.2"},
        {"source": "study-guide", "section": "Domain 5 — Security Program Management & Oversight"}
    ],
    "fields": [
        {"id": "model", "label": "Access Control Model", "options": [
            {"id": "rbac", "text": "Role-Based Access Control (RBAC)"},
            {"id": "dac", "text": "Discretionary Access Control (DAC)"},
            {"id": "mac", "text": "Mandatory Access Control (MAC)"}
        ]},
        {"id": "delegation", "label": "Delegation Mechanism", "options": [
            {"id": "acl", "text": "Time-limited ACL modification via manager self-service portal"},
            {"id": "sudo", "text": "Sudo rules granting full administrative access"},
            {"id": "public", "text": "Make all documents publicly accessible during absence"}
        ]},
        {"id": "authz", "label": "Authorization Enforcement", "options": [
            {"id": "pdp_pep", "text": "Policy Decision Point (PDP) with Policy Enforcement Point (PEP)"},
            {"id": "implicit", "text": "Implicit trust based on network location"},
            {"id": "self", "text": "Self-asserted claims without verification"}
        ]}
    ],
    "correctValues": {"model": "rbac", "delegation": "acl", "authz": "pdp_pep"}
})

# D5-Q3: multiple-choice — Third-party risk (select two)
q({
    "id": "pbq-5-003",
    "domain": 5,
    "objective": "5.3",
    "format": "pbq",
    "prompt": "A security manager is evaluating a third-party SaaS provider that will process customer PII. Which TWO activities are MOST important to perform before signing the contract? (Choose TWO.)",
    "kind": "multiple-choice",
    "explanation": "Reviewing the vendor's SOC 2 Type II report provides independent assurance of their security controls. A right-to-audit clause ensures the organization can verify compliance. The SLA for uptime is important for availability but not the top concern for PII protection. Reviewing marketing materials and checking social media are not meaningful security due diligence steps.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 5.3"},
        {"source": "study-guide", "section": "Domain 5 — Security Program Management & Oversight"}
    ],
    "options": [
        {"id": "a", "text": "Review the vendor's SOC 2 Type II audit report to assess control effectiveness", "rationale": "Correct — SOC 2 Type II provides independent verification of controls over a period of time"},
        {"id": "b", "text": "Negotiate a contractual right-to-audit clause in the service-level agreement", "rationale": "Correct — ensures the organization can verify compliance through its own audits"},
        {"id": "c", "text": "Review the vendor's marketing materials for security feature claims", "rationale": "Incorrect — marketing claims are not a substitute for independent audit evidence"},
        {"id": "d", "text": "Evaluate the vendor's SLA for uptime and performance guarantees", "rationale": "Incorrect — availability is important but secondary to security control verification for PII processing"},
        {"id": "e", "text": "Check the vendor's social media presence for customer complaints", "rationale": "Incorrect — social media is not a reliable source for security due diligence"}
    ],
    "correctOptionIds": ["a", "b"],
    "selectCount": 2
})

# D5-Q4: evidence — Policy violation analysis
q({
    "id": "pbq-5-004",
    "domain": 5,
    "objective": "5.4",
    "format": "pbq",
    "prompt": "An auditor reviews the following excerpts from a company's security policy alongside actual observed practices. Select all findings that represent a compliance gap (policy violation).",
    "kind": "evidence",
    "explanation": "A compliance gap exists when the observed practice does not match the stated policy. Passwords on sticky notes violate the clean desk policy and access control policy. Inherited firewall rules bypassing review violate change management. Encryption at rest being enabled means the policy is being followed for that item.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 5.4"},
        {"source": "study-guide", "section": "Domain 5 — Security Program Management & Oversight"}
    ],
    "artifact": {
        "label": "Policy vs. Practice comparison table",
        "format": "log",
        "lines": [
            {"id": "l1", "text": "Policy: 'All passwords must be stored in an approved enterprise password manager.' Practice: Employees keep passwords on sticky notes under keyboards.", "rationale": "Gap — sticky notes violate password storage and clean desk policies"},
            {"id": "l2", "text": "Policy: 'Data at rest must be encrypted using AES-256.' Practice: All database volumes use encrypted EBS volumes with AES-256.", "rationale": "Compliant — encryption at rest policy is being followed"},
            {"id": "l3", "text": "Policy: 'No personal mobile devices may be connected to the corporate network.' Practice: A vendor's laptop connected to a guest network port to print a document.", "rationale": "Not a gap — the guest network is isolated and the vendor is not an employee"},
            {"id": "l4", "text": "Policy: 'Firewall rule changes require approval via the change management system before deployment.' Practice: The network team has 12 firewall rules inherited from a previous administrator with no change ticket.", "rationale": "Gap — inherited rules bypassed the change management process"},
            {"id": "l5", "text": "Policy: 'Access to HR systems requires MFA.' Practice: HR managers access the payroll portal using only a username and password.", "rationale": "Gap — MFA is not being enforced for HR system access"},
            {"id": "l6", "text": "Policy: 'Security awareness training must be completed annually.' Practice: Training completion rate for the current year is 97%.", "rationale": "Compliant — nearly all employees have completed the required training"}
        ]
    },
    "selectCount": 3,
    "correctLineIds": ["l1", "l4", "l5"]
})

# D5-Q5: numeric — Security awareness ROI
q({
    "id": "pbq-5-005",
    "domain": 5,
    "objective": "5.5",
    "format": "pbq",
    "prompt": "A company spends $50,000 per year on a security awareness training program. Before the program, the average annual loss from phishing incidents was $200,000. After training, it dropped to $50,000. What is the annual return on investment (ROI) expressed as a percentage? Use the formula: ROI = ((Cost Savings − Program Cost) / Program Cost) × 100.",
    "kind": "numeric",
    "explanation": "Cost savings = $200,000 − $50,000 = $150,000. Net benefit = $150,000 − $50,000 = $100,000. ROI = ($100,000 / $50,000) × 100 = 200%.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 5.5"},
        {"source": "study-guide", "section": "Domain 5 — Security Program Management & Oversight"}
    ],
    "unit": "percent",
    "correctValue": 200,
    "tolerance": 0
})

# D5-Q6: numeric — Password entropy calculation
q({
    "id": "pbq-5-006",
    "domain": 5,
    "objective": "5.2",
    "format": "pbq",
    "prompt": "An organization requires passwords with at least 44 bits of entropy. A password policy mandates 8-character passwords from a character set of 72 possible characters (uppercase, lowercase, digits, and special characters). Use the formula E = log₂(R^L) where R is the character set size and L is the password length. What is the entropy in bits? Round to the nearest whole number.",
    "kind": "numeric",
    "explanation": "E = log₂(72^8) = 8 × log₂(72) = 8 × 6.1699... = 49.36 bits. Rounded to the nearest whole number: 49 bits.",
    "sourceRefs": [
        {"source": "exam-objectives", "section": "Objective 5.2"},
        {"source": "study-guide", "section": "Domain 5 — Security Program Management & Oversight"}
    ],
    "unit": "bits",
    "correctValue": 49,
    "tolerance": 1
})

# ─────────────────────────────────────────────────────────────
# Write output
# ─────────────────────────────────────────────────────────────
OUTPUT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "src", "lib", "server", "pbq-questions.json")

os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
with open(OUTPUT_PATH, "w") as f:
    json.dump(QUESTIONS, f, indent=2)

print(f"Wrote {len(QUESTIONS)} questions to {OUTPUT_PATH}")
