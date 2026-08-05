#!/usr/bin/env python3
"""Expand Domain 2 MCQs (+16: 2.1+4, 2.2-2.5 +3 each)."""
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
        "id": id_, "domain": 2, "objective": obj, "format": "scenario",
        "prompt": prompt, "context": context, "kind": kind, "options": options,
        "correctOptionIds": correct, "selectCount": sel,
        "explanation": explanation, "sourceRefs": refs,
    }


R = lambda obj, src="study-guide", sec=None: [
    {"source": "exam-objectives", "section": f"Objective {obj}"},
    {"source": src, "section": sec or "Domain 2 - Threats, Vulnerabilities, and Mitigations"},
]

NEW = []

# ---- 2.1 Threat actors (+4) ----
NEW.append(q("mcq-2-045", "2.1", "single-choice", 1,
    "An energy company's SCADA network was breached. The attackers used a custom toolset that had never been seen in the wild, maintained access for 18 months, exfiltrated grid operational data, and never deployed ransomware or made a financial demand. Which threat actor profile is MOST consistent with these behaviors?",
    "Custom never-before-seen tools, 18-month dwell time, exfiltration of SCADA operational data, no financial demand.",
    [opt("a", "Organized crime", "Organized crime is financially motivated; the absence of ransom or payment demand contradicts this."),
     opt("b", "Nation-state APT", "Custom tooling, very long dwell time, targeted exfiltration of critical-infrastructure data, and zero financial motive are the signature of a state-sponsored advanced persistent threat."),
     opt("c", "Hacktivist", "Hacktivists seek publicity and ideological impact; this operation was covert with no messaging."),
     opt("d", "Insider", "No evidence of legitimate-credential abuse by an employee; the attack used external custom tools.")],
    ["b"],
    "Nation-state APTs are characterized by high resources, custom tooling, stealth, long dwell times, and espionage motives — all present here. The lack of financial motivation distinguishes them from organized crime.",
    R("2.1")))

NEW.append(q("mcq-2-046", "2.1", "single-choice", 1,
    "A threat intelligence report describes a group that primarily targets cryptocurrency exchanges, deploys banking trojans via phishing campaigns, uses ransomware-as-a-service affiliates, and launders proceeds through mixers. The group is believed to operate as a business with customer support and marketing. Which threat actor type does this describe?",
    "A group targets crypto exchanges, uses banking trojans, rents RaaS affiliates, and launders proceeds — operates like a business.",
    [opt("a", "Organized crime", "Financially motivated, professionalized cybercrime groups that run RaaS affiliate programs, banking trojans, and money laundering operate as organized crime enterprises."),
     opt("b", "Nation-state", "Nation-states pursue espionage or geopolitical goals, not profit via banking trojans and laundering."),
     opt("c", "Hacktivist", "Hacktivists are ideology-driven and seek publicity, not financial operation at business scale."),
     opt("d", "Script kiddie", "Script kiddies use prebuilt tools for notoriety; they do not run affiliate programs or laundering operations.")],
    ["a"],
    "Professional cybercrime organizations operate with business structures — marketing, customer support, affiliate programs (RaaS), and money laundering. Financial motivation at industrial scale is the defining attribute.",
    R("2.1")))

NEW.append(q("mcq-2-047", "2.1", "multiple-choice", 2,
    "A hospital discovers that a night-shift nurse accessed the records of 400 patients with no clinical relationship to their duties, then emailed summaries to a personal address. The nurse claims they were 'helping a friend' and received no payment. Which TWO threat actor attributes apply?",
    "A nurse accessed 400 unrelated patient records and emailed summaries to a personal address, claiming to help a friend, no payment received.",
    [opt("a", "Insider", "The actor is an authorized employee abusing legitimate access — the definition of an insider threat."),
     opt("b", "External attacker", "The actor holds valid internal credentials and access; this is not an external compromise."),
     opt("c", "Accidental", "The access was intentional and repeated (400 records, personal email); it is not an accident."),
     opt("d", "Malicious", "Deliberate, unauthorized access and exfiltration of PHI, even without payment, is malicious intent."),
     opt("e", "Hacktivist", "Hacktivists act for ideology with public messaging; no such motive is present."),
     opt("f", "Financially motivated", "No payment was received; the motive appears to be personal/curiosity-driven, not financial.")],
    ["a", "d"],
    "Insider threats include employees who intentionally abuse access — malicious insiders need not be financially motivated. Unauthorized access to 400 records plus exfiltration is deliberate malicious behavior, distinct from accidental exposure.",
    R("2.1")))

NEW.append(q("mcq-2-048", "2.1", "single-choice", 1,
    "A security analyst is documenting an incident in which a former employee's credentials were used to access the corporate VPN and copy files from a project share two weeks after the employee resigned. The HR system shows the account was never disabled. Which threat actor category BEST describes the use of these credentials?",
    "Former employee's credentials used 2 weeks after resignation; the account was never disabled.",
    [opt("a", "Insider threat", "The credentials belong to a former insider whose access was not revoked. While the current user may be anyone, the root cause is a failure to deprovision an insider's access — the incident class is insider/account-lifecycle related."),
     opt("b", "Hacktivist", "No ideological motive or public messaging is present."),
     opt("c", "Nation-state", "No evidence of state-sponsored tradecraft or espionage resources."),
     opt("d", "Script kiddie", "Script kiddies use public tools for notoriety; valid credential reuse is not their signature.")],
    ["a"],
    "When a former employee's still-valid account is used, the threat class is insider-related: an identity that should have been deprovisioned retains access. Automated deprovisioning tied to HR is the primary control.",
    R("2.1")))

# ---- 2.2 Threat vectors (+3) ----
NEW.append(q("mcq-2-049", "2.2", "single-choice", 1,
    "An attacker compromises the website of a professional association known to be visited by employees of defense contractors. The attacker injects JavaScript that exploits a browser vulnerability and installs a backdoor when visited. No emails are sent to victims. Which attack vector does this represent?",
    "An attacker compromises a website frequently visited by defense contractor employees; visiting the site triggers an exploit that installs a backdoor.",
    [opt("a", "Watering hole", "Compromising a site that the target population frequents and waiting for them to visit is the classic watering hole pattern — no direct targeting messages required."),
     opt("b", "Spear phishing", "Spear phishing delivers malicious content directly to the victim via email; no email is used here."),
     opt("c", "Supply chain", "A supply chain attack compromises a product or service the victim consumes, not merely a website they visit."),
     opt("d", "Vishing", "Vishing uses voice communication.")],
    ["a"],
    "Watering hole attacks poison a website the target group is known to visit, then wait for victims to arrive — stealthier than phishing because no malicious message is sent that could be filtered or inspected.",
    R("2.2")))

NEW.append(q("mcq-2-050", "2.2", "single-choice", 1,
    "A vendor's update server is breached, and the attacker injects malicious code into the installer of a widely used backup application. The compromised installer is signed with the vendor's legitimate code-signing certificate, so thousands of customers deploy it without warnings. Which threat vector is this?",
    "An attacker injects code into a vendor's installer and signs it with the vendor's valid certificate; thousands of customers install it.",
    [opt("a", "Supply chain", "Compromising a trusted vendor's build/update process and distributing signed malicious software to all customers is a software supply chain attack."),
     opt("b", "Watering hole", "The attack targets the distribution channel, not a website the victims visit."),
     opt("c", "Phishing", "No fraudulent message is sent; the malware arrives via a trusted update channel."),
     opt("d", "Trojan delivery", "While the installer behaves like a trojan, the vector classification that explains how it reached thousands of victims is the supply chain compromise.")],
    ["a"],
    "Supply chain attacks compromise software or hardware upstream of the victim — build pipelines, update servers, signed binaries, or third-party libraries. Valid code-signing certificates make the payload appear trustworthy, defeating signature-based defenses.",
    R("2.2")))

NEW.append(q("mcq-2-051", "2.2", "single-choice", 1,
    "An employee receives a voicemail claiming to be from the company's IT help desk stating that 'your account will be locked in 24 hours — call this number to verify your password.' The caller ID displays the company's real support number. Which social engineering technique is being used?",
    "A voicemail claiming to be IT support demands a password verification callback, with caller ID spoofed to the real support number.",
    [opt("a", "Vishing", "Voice-based phishing (vishing) uses phone calls or voicemail with urgency and spoofed caller ID to harvest credentials."),
     opt("b", "Smishing", "Smishing uses SMS text messages, not voice."),
     opt("c", "Phishing", "Phishing typically refers to email-based attacks; the voice delivery makes vishing the precise term."),
     opt("d", "Pretexting", "A false scenario is used, but the delivery channel (voice) and goal (credential harvest) make vishing the specific classification.")],
    ["a"],
    "Vishing (voice phishing) is social engineering over the phone, often with spoofed caller ID and urgency. Pretexting is the underlying manipulation, but vishing is the exam term for the voice-delivered variant.",
    R("2.2")))

# ---- 2.3 Vulnerabilities (+3) ----
NEW.append(q("mcq-2-052", "2.3", "single-choice", 1,
    "A web application allows users to upload profile photos. A tester uploads an image file whose filename contains ../../../etc/passwd and observes that the application stores files based on the client-supplied name without validation. Which vulnerability class is being tested?",
    "An application stores uploads using the client-supplied filename without validation; a tester uses a filename containing ../ sequences.",
    [opt("a", "Directory traversal", "Using ../ sequences in a filename to escape the intended storage directory and access or overwrite files elsewhere is directory/path traversal."),
     opt("b", "SQL injection", "No database query manipulation is involved."),
     opt("c", "Cross-site scripting", "XSS executes scripts in the browser; this attack targets the server file system."),
     opt("d", "Denial of service", "The test targets file access, not service availability.")],
    ["a"],
    "Directory traversal (path traversal) vulnerabilities arise when user input is used in file paths without validation. Attackers use ../ sequences to escape the intended directory. Sanitization, canonical path validation, and random server-side filenames are the defenses.",
    R("2.3")))

NEW.append(q("mcq-2-053", "2.3", "single-choice", 1,
    "During a code review, a developer finds that a payment application deserializes objects received over the network without validating the data source or type. An attacker could craft a serialized payload that instantiates arbitrary classes and executes code on the server. Which vulnerability is present?",
    "A payment app deserializes network-supplied objects without source/type validation; crafted payloads could execute arbitrary code.",
    [opt("a", "Insecure deserialization", "Trusting deserialized input without validation allows attackers to craft objects that trigger code execution or logic tampering — insecure deserialization."),
     opt("b", "Buffer overflow", "No memory overwrite occurs; the flaw is in object deserialization trust."),
     opt("c", "Cross-site request forgery", "CSRF forges authenticated browser requests; this attack sends crafted objects directly to the server."),
     opt("d", "Race condition", "No timing-based check/use gap is described.")],
    ["a"],
    "Insecure deserialization occurs when applications deserialize untrusted data without integrity/type validation, enabling code execution, injection, or logic bypass. Defenses include signed/encrypted payloads, allow-listing classes, and never deserializing untrusted input.",
    R("2.3", "owasp", "OWASP Top 10 A08 Software and Data Integrity Failures")))

NEW.append(q("mcq-2-054", "2.3", "multiple-choice", 2,
    "A security team reviews a legacy web application and finds: (1) passwords stored as unsalted SHA-1 hashes, (2) TLS 1.0 enabled for backward compatibility, and (3) session tokens generated with a weak seeded random number generator. Which TWO vulnerability categories apply?",
    "Legacy app findings: unsalted SHA-1 password storage, TLS 1.0 enabled, weak RNG session tokens.",
    [opt("a", "Weak cryptographic implementation", "SHA-1 without salt, TLS 1.0, and weak RNG are all cryptographic weaknesses — deprecated algorithms and insufficient randomness."),
     opt("b", "Improper certificate validation", "No certificate validation issue is described."),
     opt("c", "Broken authentication", "Predictable session tokens allow session hijacking — an authentication/session-management failure."),
     opt("d", "Server-side request forgery", "No server-initiated request manipulation is described."),
     opt("e", "Injection", "No injection vector is described."),
     opt("f", "Security misconfiguration", "While TLS 1.0 is a configuration choice, the dominant classification for the findings is cryptography and authentication failures; misconfiguration is not the best second answer here.")],
    ["a", "c"],
    "Cryptographic failures (A02) cover weak/legacy algorithms and insufficient randomness; broken authentication/session management (A07) covers predictable session tokens that enable hijacking. Both are OWASP Top 10 2021 categories.",
    R("2.3", "owasp", "OWASP Top 10 A02 Cryptographic Failures / A07 Identification and Authentication Failures")))

# ---- 2.4 Malicious activity (+3) ----
NEW.append(q("mcq-2-055", "2.4", "single-choice", 1,
    "A SOC analyst observes repeated authentication attempts against a domain controller using the same username with thousands of different passwords in a short window, followed by a successful login. Which attack technique is this?",
    "Repeated attempts against one username with thousands of different passwords, then success.",
    [opt("a", "Brute force", "Systematically trying many passwords against a single account is a brute-force attack."),
     opt("b", "Password spraying", "Spraying tries a few passwords against many accounts to avoid lockouts; this targets one account with many passwords."),
     opt("c", "Credential stuffing", "Stuffing replays breached username/password pairs; no breach list is indicated."),
     opt("d", "Dictionary attack", "A dictionary attack uses a curated wordlist; the scenario implies exhaustive iteration, and 'brute force' is the better general term when many combinations are tried.")],
    ["a"],
    "Brute-force attacks exhaustively try many password candidates against a single account. Password spraying is the inverse (few passwords, many accounts). Lockout policies and MFA are the primary defenses against brute force.",
    R("2.4")))

NEW.append(q("mcq-2-056", "2.4", "single-choice", 1,
    "An attacker with administrative access to a domain controller dumps the KRBTGT account's password hash, then forges Kerberos ticket-granting tickets that grant access to any resource for any user, including backdated tickets that never expire. Which attack is this?",
    "An attacker dumps the KRBTGT hash and forges TGTs granting any-user, never-expiring access to any resource.",
    [opt("a", "Golden ticket", "Forging TGTs with the KRBTGT hash gives domain-wide, persistent, hard-to-detect access — the golden ticket attack."),
     opt("b", "Pass-the-hash", "Pass-the-hash reuses NTLM hashes for authentication; it does not forge Kerberos tickets."),
     opt("c", "Kerberoasting", "Kerberoasting requests service tickets for offline cracking of service account passwords."),
     opt("d", "Silver ticket", "Silver tickets forge service-specific tickets using a service account hash, not the KRBTGT.")],
    ["a"],
    "The golden ticket attack forges Kerberos TGTs using the KRBTGT hash, granting persistent domain-wide access that is extremely hard to detect. Mitigations: protect the KRBTGT hash, monitor for anomalous ticket usage, and rotate the KRBTGT password twice on suspected compromise.",
    R("2.4", "mitre", "MITRE ATT&CK T1558.001 Golden Ticket")))

NEW.append(q("mcq-2-057", "2.4", "single-choice", 1,
    "Network monitoring shows a workstation sending large volumes of DNS queries for random subdomains of a domain the company does not control. The responses are much larger than the queries. The security team determines the workstation was compromised and is being used to reflect traffic at a third party. Which technique is being performed?",
    "A compromised workstation sends DNS queries for random subdomains; large responses are reflected at a third party.",
    [opt("a", "DNS amplification", "Small queries to open resolvers generate large responses directed at a victim via spoofed source addresses — DNS amplification, a reflection/amplification DDoS technique."),
     opt("b", "DNS tunneling", "DNS tunneling encodes data in DNS queries for covert C2; the scenario describes volumetric reflection."),
     opt("c", "Pharming", "Pharming redirects victims to fake sites via DNS manipulation; this is an attack origin, not a reflection."),
     opt("d", "Cache poisoning", "Cache poisoning injects false records into resolvers; no record forgery is described.")],
    ["a"],
    "DNS amplification abuses open resolvers: attackers send small queries with spoofed victim IPs, and resolvers return large responses, multiplying traffic at the victim. Preventing open recursion and rate-limiting DNS are mitigations.",
    R("2.4", "cisa", "CISA DDoS guidance")))

# ---- 2.5 Mitigations (+3) ----
NEW.append(q("mcq-2-058", "2.5", "single-choice", 1,
    "A development team is remediating a stored XSS vulnerability in a web application. Which control is the MOST effective primary defense?",
    "Remediating stored XSS in a web application — choose the most effective primary defense.",
    [opt("a", "Output encoding/escaping of user-controlled data in the rendering context", "Encoding user input in the correct output context (HTML, attribute, JS, CSS, URL) prevents the browser from interpreting it as code — the primary XSS defense."),
     opt("b", "Web application firewall (WAF) rules", "WAFs are compensating controls that can filter payloads but are bypassable; they do not fix the application flaw."),
     opt("c", "Client-side JavaScript input validation", "Client-side validation is bypassed trivially and offers no security; it is a UX feature only."),
     opt("d", "Content Security Policy only", "CSP is a valuable defense-in-depth layer but cannot be the primary fix for a stored XSS sink.")],
    ["a"],
    "Output encoding in the correct context is the primary defense against XSS: it neutralizes the injection at the sink. CSP, sanitization, and WAFs are compensating layers. Client-side validation provides no security.",
    R("2.5", "owasp", "OWASP Top 10 A03 Injection")))

NEW.append(q("mcq-2-059", "2.5", "single-choice", 1,
    "An organization wants to reduce the impact of a ransomware infection on its file servers. Which combination provides the strongest defense against encryption-based ransomware?",
    "Choose the strongest combination against encryption-based ransomware on file servers.",
    [opt("a", "Immutable/offline backups plus strict least-privilege access to the servers", "Offline or immutable backups survive encryption attempts, and least privilege limits the blast radius and lateral movement — the strongest pairing for ransomware resilience."),
     opt("b", "Antivirus signatures plus a perimeter firewall", "Signature AV misses novel ransomware, and the firewall does not protect against authenticated or phishing-delivered infection."),
     opt("c", "Frequent backups stored on the same file server", "Backups on the same host are encrypted by the ransomware too."),
     opt("d", "User education only", "Training reduces click rates but is not a technical guarantee against infection.")],
    ["a"],
    "Ransomware resilience requires recoverable data (offline/immutable backups, tested restores) and minimized blast radius (least privilege, segmentation). Signature AV and user education are helpful but insufficient alone.",
    R("2.5", "cisa", "CISA Ransomware Guidance")))

NEW.append(q("mcq-2-060", "2.5", "single-choice", 1,
    "A company discovers that employees routinely plug personal USB drives into corporate workstations, and a recent malware outbreak was traced to a USB drive found in the parking lot. Which mitigation addresses the root cause MOST directly?",
    "USB-borne malware outbreak traced to a drive found in the parking lot; employees routinely use personal USB drives.",
    [opt("a", "Disable USB storage and enforce device control via endpoint policy", "Technical enforcement of USB storage controls (device control, endpoint DLP) directly removes the vector that delivered the malware."),
     opt("b", "Add an awareness poster about phishing", "The vector was physical media, not phishing; education alone is insufficient without technical control."),
     opt("c", "Increase firewall logging", "Logging does not prevent USB-borne infection."),
     opt("d", "Implement an email gateway", "Email is not the delivery vector in this incident.")],
    ["a"],
    "USB drops are a physical baiting vector. Endpoint device control (blocking/allow-listing USB storage), combined with awareness training, addresses the root cause. Technical enforcement is the strongest direct mitigation.",
    R("2.5")))

merge(load_bank(), new_mcqs=NEW)
