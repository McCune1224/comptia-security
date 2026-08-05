#!/usr/bin/env python3
"""Expand bank with real-exam-aligned content: +20 MCQs, +9 PBQs, normalize evidence artifacts.

Gaps closed (from SY0-701 research):
- Password attacks (2.4): only 1 MCQ existed; exam-heavy topic. +4 MCQs + matching PBQ.
- Ports/protocols (3.2): 7 MCQs, no port-matching PBQ (classic real-exam PBQ). +3 MCQs + 2 PBQs.
- PKI/crypto (1.4): 7 MCQs. +3 MCQs + fill-blank PBQ.
- Zero trust (1.2): 3 MCQs. +2 MCQs.
- Social engineering (2.2): +2 MCQs.
- Wireless (4.3): 3 MCQs. +3 MCQs.
- Incident response (4.8): +2 MCQs + evidence PBQ.
- Risk math (5.2): +1 MCQ + agreements matching PBQ.
- Acronym drill: +word-bank PBQ (official ~90-acronym list).
- DNS tunneling evidence PBQ (2.4).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import importlib
banklib = importlib.import_module("bank-lib")
load_bank = banklib.load_bank
merge = banklib.merge
opt = banklib.opt

R = lambda obj, sec=None: [
    {"source": "exam-objectives", "section": f"Objective {obj}"},
    {"source": "study-guide", "section": sec or "Exam Practice"},
]

NEW_MCQ = []
NEW_PBQ = []

# ================= D1 · 1.2 Zero Trust (+2: one multi) =================
NEW_MCQ.append({
    "id": "mcq-1-041", "domain": 1, "objective": "1.2", "format": "scenario", "kind": "multiple-choice", "selectCount": 2,
    "prompt": "A company is implementing a zero trust architecture based on NIST SP 800-207. The architect must separate the components that make access decisions from the components that enforce them. Which TWO components belong to the CONTROL plane?",
    "context": "NIST SP 800-207 splits zero trust into a control plane (decides access) and a data plane (enforces it).",
    "options": [
        opt("a", "Policy Engine (PE)", "The PE renders the grant/deny decision — control plane."),
        opt("b", "Policy Administrator (PA)", "The PA establishes the communication path for the decision — control plane."),
        opt("c", "Policy Enforcement Point (PEP)", "The PEP allows/denies the session on the data plane — enforcement, not decision."),
        opt("d", "Identity provider (IdP) user store", "The IdP supplies identity facts but is not the decision component of the control plane."),
        opt("e", "Log aggregation server", "Logs are data-plane telemetry, not a decision component."),
        opt("f", "Microsegmentation controller", "A network enforcement mechanism, not a decision component.")
    ],
    "correctOptionIds": ["a", "b"],
    "explanation": "The control plane decides access: the Policy Engine renders the grant/deny decision and the Policy Administrator sets up the communication path (tokens/credentials). The PEP is the data-plane enforcer that actually allows or denies the session.",
    "sourceRefs": R("1.2", "Zero Trust Architecture")
})

NEW_MCQ.append({
    "id": "mcq-1-042", "domain": 1, "objective": "1.2", "format": "scenario", "kind": "single-choice", "selectCount": 1,
    "prompt": "A company replaces its remote-access VPN with a cloud-delivered service that verifies device posture and user identity on every request, then grants access only to specific applications — never to the whole network. Which technology BEST describes this service?",
    "context": "The service is identity-aware, per-application, and continuously verifies trust instead of granting network-level access.",
    "options": [
        opt("a", "ZTNA (Zero Trust Network Access)", "ZTNA is the identity-aware proxy that grants per-application access after continuous verification."),
        opt("b", "NAC (Network Access Control)", "NAC checks posture before LAN access, but does not provide per-application cloud access."),
        opt("c", "SD-WAN", "SD-WAN optimizes WAN routing; it is not an identity-aware access control service."),
        opt("d", "VDI (Virtual Desktop Infrastructure)", "VDI centralizes desktops; it does not grant per-application access to internal apps.")
    ],
    "correctOptionIds": ["a"],
    "explanation": "ZTNA (zero trust network access) is an identity-aware proxy: it verifies user identity and device posture on every request and grants access to specific applications (or resources) rather than broad network access — the hallmark of the zero trust model.",
    "sourceRefs": R("1.2", "Zero Trust Architecture")
})

# ================= D1 · 1.4 PKI / cryptography (+3) =================
NEW_MCQ.append({
    "id": "mcq-1-043", "domain": 1, "objective": "1.4", "format": "scenario", "kind": "single-choice", "selectCount": 1,
    "prompt": "A user receives an email digitally signed by a colleague. Which key does the recipient use to verify the signature, and what does successful verification prove?",
    "context": "Digital signatures combine a hash of the message with the signer's private key.",
    "options": [
        opt("a", "The sender's public key; it proves integrity and non-repudiation", "Verifying with the sender's public key proves the content was not altered and only the sender's private key could have signed it."),
        opt("b", "The sender's private key; it proves confidentiality", "The private key is never shared; signatures are verified with the public key."),
        opt("c", "The recipient's public key; it proves authenticity of the recipient", "The recipient's keys are irrelevant to verifying the sender's signature."),
        opt("d", "The CA's private key; it proves the message is encrypted", "The CA's private key is used to sign certificates, not message signatures.")
    ],
    "correctOptionIds": ["a"],
    "explanation": "A digital signature is the hash of the message encrypted with the signer's PRIVATE key. Anyone can verify it with the signer's PUBLIC key: if the hash matches, the message is unchanged (integrity) and only the holder of that private key could have produced it (non-repudiation).",
    "sourceRefs": R("1.4", "Public Key Infrastructure")
})

NEW_MCQ.append({
    "id": "mcq-1-044", "domain": 1, "objective": "1.4", "format": "scenario", "kind": "single-choice", "selectCount": 1,
    "prompt": "An application must check whether a server certificate has been revoked. Instead of downloading the full revocation list from the CA, the application queries the CA's responder in real time with the certificate's serial number and receives a signed pass/fail response. Which mechanism is in use?",
    "context": "The CA operates a real-time responder service; no bulk list is downloaded.",
    "options": [
        opt("a", "OCSP (Online Certificate Status Protocol)", "OCSP queries a responder in real time for the status of a single certificate — the described mechanism."),
        opt("b", "CRL (Certificate Revocation List)", "A CRL is a published list downloaded in bulk, not a real-time per-certificate query."),
        opt("c", "CSR (Certificate Signing Request)", "A CSR is used to REQUEST a certificate, not check revocation."),
        opt("d", "RA (Registration Authority)", "An RA verifies identity for certificate issuance; it does not check revocation status.")
    ],
    "correctOptionIds": ["a"],
    "explanation": "OCSP (Online Certificate Status Protocol) provides real-time, per-certificate revocation status via a responder (often with stapling). CRL is the older bulk list; CSR requests issuance; RA verifies identity for issuance.",
    "sourceRefs": R("1.4", "Public Key Infrastructure")
})

NEW_MCQ.append({
    "id": "mcq-1-045", "domain": 1, "objective": "1.4", "format": "scenario", "kind": "single-choice", "selectCount": 1,
    "prompt": "A company must ensure that files encrypted by employees can be recovered if an employee leaves without disclosing their encryption key. Which control satisfies this requirement?",
    "context": "The concern is recoverability of encrypted data when the original key holder is gone.",
    "options": [
        opt("a", "Key escrow", "Key escrow stores a copy of keys with a trusted third party (or internally) for authorized recovery — exactly this requirement."),
        opt("b", "Key stretching", "Key stretching (e.g., PBKDF2) slows brute-force attacks; it does not recover lost keys."),
        opt("c", "Key rotation", "Rotation replaces keys on a schedule; it does not provide recovery of the old key holder's data."),
        opt("d", "Perfect forward secrecy", "PFS protects past sessions if a long-term key leaks; it does not enable recovery.")
    ],
    "correctOptionIds": ["a"],
    "explanation": "Key escrow retains a copy of encryption keys with a trusted party (or in a secure internal repository) so data can be recovered when the original key holder is unavailable — a common organizational recovery control.",
    "sourceRefs": R("1.4", "Cryptographic Solutions")
})

# ================= D2 · 2.2 Social engineering (+2) =================
NEW_MCQ.append({
    "id": "mcq-2-061", "domain": 2, "objective": "2.2", "format": "scenario", "kind": "single-choice", "selectCount": 1,
    "prompt": "A CFO receives an urgent email that appears to be from the CEO, asking to wire funds to a new vendor today. The sender's domain differs from the company's real domain by one character. Which attack is being described?",
    "context": "The email impersonates an executive and requests a fraudulent wire transfer; the sender domain is a lookalike.",
    "options": [
        opt("a", "Business email compromise (BEC)", "BEC impersonates an executive (or vendor) to authorize fraudulent transfers — combined with a lookalike domain."),
        opt("b", "Vishing", "Vishing is voice-based phishing; this is an email."),
        opt("c", "Smishing", "Smishing is SMS-based phishing; this is an email."),
        opt("d", "Watering hole attack", "A watering hole compromises a site the target visits; it does not email the victim.")
    ],
    "correctOptionIds": ["a"],
    "explanation": "BEC impersonates a trusted party (executive, vendor) to request a fraudulent payment or data transfer. The one-character-different lookalike domain (typosquatting) is a classic BEC enabler.",
    "sourceRefs": R("2.2", "Social Engineering")
})

NEW_MCQ.append({
    "id": "mcq-2-062", "domain": 2, "objective": "2.2", "format": "scenario", "kind": "single-choice", "selectCount": 1,
    "prompt": "An attacker calls the help desk claiming to be a new contractor whose laptop is broken and who must have a password reset today to meet a deadline. The attacker has researched the contractor's name and manager. Which social engineering technique is in use?",
    "context": "The attacker invents a believable story (with researched details) to get the help desk to perform an action.",
    "options": [
        opt("a", "Pretexting", "Pretexting uses a fabricated scenario (the pretext) with researched details to manipulate a target into acting."),
        opt("b", "Tailgating", "Tailgating is following someone through a controlled door without consent; not applicable to a phone call."),
        opt("c", "Quid pro quo", "Quid pro quo promises a benefit in exchange for information or action; no benefit is offered here."),
        opt("d", "Whaling", "Whaling targets executives; the victim here is the help desk, and the attacker impersonates a contractor.")
    ],
    "correctOptionIds": ["a"],
    "explanation": "Pretexting is a fabricated scenario designed to elicit information or action. The researched details (name, manager, urgency) make the pretext believable — the classic help-desk password-reset pretext.",
    "sourceRefs": R("2.2", "Social Engineering")
})

# ================= D2 · 2.4 Password attacks (+4: one multi) =================
NEW_MCQ.append({
    "id": "mcq-2-063", "domain": 2, "objective": "2.4", "format": "scenario", "kind": "single-choice", "selectCount": 1,
    "prompt": "An attacker obtains a list of 5,000 usernames and tries only three common passwords — 'Password123', 'Welcome1', and 'Company2024' — against EVERY account, specifically to avoid triggering account lockouts. Which attack is this?",
    "context": "Few passwords, many accounts, lockout avoidance.",
    "options": [
        opt("a", "Password spraying", "Password spraying tries a few common passwords against many accounts to stay under lockout thresholds — exactly this pattern."),
        opt("b", "Brute force", "Brute force tries many passwords against one account."),
        opt("c", "Credential stuffing", "Credential stuffing reuses breached username/password pairs."),
        opt("d", "Pass-the-hash", "Pass-the-hash reuses captured NTLM hashes; no passwords are guessed.")
    ],
    "correctOptionIds": ["a"],
    "explanation": "Password spraying: a small set of common passwords tested against many accounts to evade lockout policies. Brute force is many passwords against one account; credential stuffing reuses breach pairs; pass-the-hash uses captured hashes.",
    "sourceRefs": R("2.4", "Password Attacks")
})

NEW_MCQ.append({
    "id": "mcq-2-064", "domain": 2, "objective": "2.4", "format": "scenario", "kind": "single-choice", "selectCount": 1,
    "prompt": "An attacker obtains username/password pairs from a breach of a popular forum and automatically tests the same pairs against a bank's login portal, exploiting password reuse. Which attack is this?",
    "context": "Breached credentials are replayed against another service.",
    "options": [
        opt("a", "Credential stuffing", "Credential stuffing replays breached username/password pairs against other services — exactly this."),
        opt("b", "Password spraying", "Spraying tries a few common passwords against many accounts, not breach pairs."),
        opt("c", "Dictionary attack", "A dictionary attack guesses words from a wordlist, not reused breach pairs."),
        opt("d", "Rainbow table attack", "Rainbow tables precompute hash chains to crack hashes offline; they do not replay credential pairs.")
    ],
    "correctOptionIds": ["a"],
    "explanation": "Credential stuffing automates replay of breached username/password pairs against other services, exploiting password reuse. MFA and unique passwords are the main defenses.",
    "sourceRefs": R("2.4", "Password Attacks")
})

NEW_MCQ.append({
    "id": "mcq-2-065", "domain": 2, "objective": "2.4", "format": "scenario", "kind": "single-choice", "selectCount": 1,
    "prompt": "An attacker with local administrator rights on a Windows workstation extracts NTLM hashes from LSASS memory and uses them to authenticate to other systems on the network without ever knowing the plaintext passwords. Which attack is this?",
    "context": "Captured authentication hashes are replayed to other hosts; no password cracking occurs.",
    "options": [
        opt("a", "Pass-the-hash", "Pass-the-hash reuses captured NTLM hashes to authenticate to other systems — exactly this."),
        opt("b", "Kerberoasting", "Kerberoasting cracks service account tickets offline; it does not replay LSASS hashes."),
        opt("c", "Golden ticket", "A golden ticket forges TGTs with a stolen KRBTGT hash; this is about NTLM hash reuse."),
        opt("d", "Pass-the-ticket", "Pass-the-ticket reuses Kerberos tickets, not NTLM hashes from LSASS.")
    ],
    "correctOptionIds": ["a"],
    "explanation": "Pass-the-hash: an attacker extracts NTLM hashes (e.g., from LSASS) and uses them to authenticate to other systems without the plaintext password. Kerberoasting and golden/pass-the-ticket are Kerberos-based.",
    "sourceRefs": R("2.4", "Password Attacks")
})

NEW_MCQ.append({
    "id": "mcq-2-066", "domain": 2, "objective": "2.4", "format": "scenario", "kind": "multiple-choice", "selectCount": 2,
    "prompt": "A penetration tester is targeting an Active Directory environment. Which TWO attacks rely on obtaining or forging KERBEROS ticket material rather than cracking plaintext passwords?",
    "context": "Both attacks target the Kerberos protocol's ticket system in an AD domain.",
    "options": [
        opt("a", "Kerberoasting", "Kerberoasting requests TGS tickets for service accounts and cracks them offline — Kerberos ticket material."),
        opt("b", "Pass-the-ticket", "Pass-the-ticket reuses stolen Kerberos tickets (TGT/ST) to impersonate users — Kerberos ticket material."),
        opt("c", "Brute force", "Brute force guesses passwords directly; it does not use Kerberos tickets."),
        opt("d", "Credential stuffing", "Credential stuffing replays breached password pairs; no Kerberos tickets involved."),
        opt("e", "Rainbow table", "Rainbow tables crack hashes offline; they are not Kerberos-ticket-specific."),
        opt("f", "Keylogging", "Keylogging captures keystrokes; it is unrelated to Kerberos tickets.")
    ],
    "correctOptionIds": ["a", "b"],
    "explanation": "Kerberoasting obtains and offline-cracks service ticket material (TGS); pass-the-ticket reuses stolen Kerberos tickets. Brute force, stuffing, rainbow tables, and keylogging do not involve Kerberos ticket material.",
    "sourceRefs": R("2.4", "Password Attacks")
})

# ================= D3 · 3.2 Ports & protocols (+3: one multi) =================
NEW_MCQ.append({
    "id": "mcq-3-053", "domain": 3, "objective": "3.2", "format": "scenario", "kind": "single-choice", "selectCount": 1,
    "prompt": "A security administrator must allow applications to query the corporate directory service over an ENCRYPTED connection. Which port must be opened on the firewall?",
    "context": "The directory queries must use LDAP over TLS (LDAPS).",
    "options": [
        opt("a", "TCP 636", "636 is LDAPS — LDAP over TLS — the encrypted directory query port."),
        opt("b", "TCP 389", "389 is plaintext LDAP, not encrypted."),
        opt("c", "TCP 3268", "3268 is the Global Catalog (plaintext), not LDAPS."),
        opt("d", "TCP 443", "443 is HTTPS; not the LDAP-over-TLS port.")
    ],
    "correctOptionIds": ["a"],
    "explanation": "LDAPS (LDAP over TLS) uses TCP 636; plaintext LDAP uses 389; Global Catalog uses 3268/3269. The exam expects the secure-versus-insecure port distinction (LDAP 389 → LDAPS 636).",
    "sourceRefs": R("3.2", "Secure Protocols")
})

NEW_MCQ.append({
    "id": "mcq-3-054", "domain": 3, "objective": "3.2", "format": "scenario", "kind": "multiple-choice", "selectCount": 2,
    "prompt": "A company must replace insecure file-transfer methods with protocols that encrypt both credentials and data in transit. Which TWO protocols satisfy this requirement?",
    "context": "The organization currently uses FTP and TFTP and wants encrypted file transfer.",
    "options": [
        opt("a", "SFTP", "SFTP (SSH File Transfer Protocol) runs over SSH (TCP 22) and encrypts everything — secure."),
        opt("b", "FTPS", "FTPS is FTP over TLS/SSL — encrypts credentials and data — secure."),
        opt("c", "FTP", "Plain FTP transmits credentials and data in cleartext."),
        opt("d", "TFTP", "TFTP has no authentication or encryption at all."),
        opt("e", "HTTP", "HTTP is cleartext; not a file-transfer encryption protocol."),
        opt("f", "Telnet", "Telnet is an insecure remote shell, not file transfer.")
    ],
    "correctOptionIds": ["a", "b"],
    "explanation": "SFTP (SSH-based) and FTPS (FTP-over-TLS) both encrypt credentials and data. Plain FTP, TFTP, HTTP, and Telnet are cleartext and must be avoided.",
    "sourceRefs": R("3.2", "Secure Protocols")
})

NEW_MCQ.append({
    "id": "mcq-3-055", "domain": 3, "objective": "3.2", "format": "scenario", "kind": "single-choice", "selectCount": 1,
    "prompt": "A network engineer must replace Telnet for remote management of network devices. Which protocol and port is the correct secure replacement?",
    "context": "Telnet (TCP 23) sends everything, including passwords, in cleartext.",
    "options": [
        opt("a", "SSH on TCP 22", "SSH (TCP 22) encrypts the session — the standard Telnet replacement."),
        opt("b", "SFTP on TCP 22", "SFTP is for file transfer, not interactive device management."),
        opt("c", "HTTPS on TCP 443", "HTTPS is for web management interfaces, not CLI device access."),
        opt("d", "RDP on TCP 3389", "RDP is remote desktop; not the general-purpose CLI replacement for Telnet.")
    ],
    "correctOptionIds": ["a"],
    "explanation": "SSH on TCP 22 is the direct secure replacement for Telnet (TCP 23) for command-line device management: encrypted session, authenticated, and the exam's canonical insecure→secure pair.",
    "sourceRefs": R("3.2", "Secure Protocols")
})

# ================= D4 · 4.3 Wireless (+3) =================
NEW_MCQ.append({
    "id": "mcq-4-073", "domain": 4, "objective": "4.3", "format": "scenario", "kind": "single-choice", "selectCount": 1,
    "prompt": "A security team must select a Wi-Fi security standard that resists offline dictionary attacks against the pre-shared key. Which standard provides this protection natively?",
    "context": "The requirement is resistance to offline PSK cracking; the current network uses WPA2 with a shared passphrase.",
    "options": [
        opt("a", "WPA3", "WPA3's SAE (Simultaneous Authentication of Equals) handshake prevents offline dictionary attacks — exactly this requirement."),
        opt("b", "WPA2", "WPA2's PSK handshake (4-way handshake) IS vulnerable to offline dictionary cracking."),
        opt("c", "WEP", "WEP is broken and easily cracked; no protection."),
        opt("d", "WPS", "WPS is a configuration feature (and itself attackable via PIN brute force), not a security standard.")
    ],
    "correctOptionIds": ["a"],
    "explanation": "WPA3 uses SAE, which performs an offline dictionary-attack-resistant handshake. WPA2-PSK capture allows offline cracking of the passphrase; WEP is fully broken; WPS PIN brute force is a separate weakness.",
    "sourceRefs": R("4.3", "Wireless Security")
})

NEW_MCQ.append({
    "id": "mcq-4-074", "domain": 4, "objective": "4.3", "format": "scenario", "kind": "single-choice", "selectCount": 1,
    "prompt": "An attacker places a device in a coffee shop that broadcasts the SAME SSID as the corporate WPA2 network and uses a signal jammer to force nearby employees' laptops to disconnect and reconnect to the attacker's access point, capturing the handshake. Which attack is this?",
    "context": "A fake access point impersonates a legitimate one to harvest handshakes/credentials.",
    "options": [
        opt("a", "Evil twin", "An evil twin is a rogue AP impersonating a legitimate SSID — combined with deauth to force reconnection — exactly this."),
        opt("b", "Bluejacking", "Bluejacking sends unsolicited Bluetooth messages; unrelated."),
        opt("c", "Wardriving", "Wardriving is scanning for open networks while driving; it does not impersonate an SSID."),
        opt("d", "Jamming", "Jamming (DoS) forces disconnections but is the enabler here; the attack is the impersonation itself.")
    ],
    "correctOptionIds": ["a"],
    "explanation": "An evil twin is a rogue access point that impersonates a legitimate SSID; attackers often add deauthentication jamming to force clients to reconnect to the fake AP and reveal handshakes or credentials.",
    "sourceRefs": R("4.3", "Wireless Security")
})

NEW_MCQ.append({
    "id": "mcq-4-075", "domain": 4, "objective": "4.3", "format": "scenario", "kind": "single-choice", "selectCount": 1,
    "prompt": "An organization must deploy enterprise Wi-Fi authentication with MUTUAL certificate-based authentication between the client and the RADIUS server, and no shared passwords. Which EAP method satisfies this requirement?",
    "context": "Both the client and the server present certificates; nothing is shared beyond the certs.",
    "options": [
        opt("a", "EAP-TLS", "EAP-TLS uses certificates on BOTH client and server for mutual authentication — exactly this requirement."),
        opt("b", "PEAP", "PEAP authenticates the server with a cert but the client with a password/MSCHAPv2 tunnel."),
        opt("c", "EAP-MSCHAPv2", "Uses passwords inside the TLS tunnel; no client certificate."),
        opt("d", "LEAP", "LEAP is an older Cisco method vulnerable to dictionary attacks; no mutual certs.")
    ],
    "correctOptionIds": ["a"],
    "explanation": "EAP-TLS provides mutual certificate-based authentication (client AND server certs) — the strongest 802.1X EAP method. PEAP/MSCHAPv2 use password-based client auth; LEAP is deprecated/weak.",
    "sourceRefs": R("4.3", "Wireless Security")
})

# ================= D4 · 4.8 Incident response (+2: one multi) =================
NEW_MCQ.append({
    "id": "mcq-4-076", "domain": 4, "objective": "4.8", "format": "scenario", "kind": "single-choice", "selectCount": 1,
    "prompt": "An incident responder must collect evidence from a live Windows server. Which order of volatility is correct (MOST volatile first)?",
    "context": "Volatile data is lost when the system is powered off or the session ends.",
    "options": [
        opt("a", "RAM → network connections → disk → remote logs", "Correct order of volatility: memory first, then network state, then disk, then remote/archival logs."),
        opt("b", "Disk → RAM → network connections → remote logs", "Disk is persistent and should be captured AFTER volatile memory and network state."),
        opt("c", "Remote logs → disk → network connections → RAM", "This is reversed: remote logs are the LEAST volatile."),
        opt("d", "Network connections → disk → RAM → remote logs", "RAM is the most volatile and must be captured before network state and disk.")
    ],
    "correctOptionIds": ["a"],
    "explanation": "Order of volatility: registers/cache → RAM → process/network state → temp files → disk → remote logs → archival media. Memory and network state vanish on power-off; remote logs persist elsewhere.",
    "sourceRefs": R("4.8", "Incident Response")
})

NEW_MCQ.append({
    "id": "mcq-4-077", "domain": 4, "objective": "4.8", "format": "scenario", "kind": "multiple-choice", "selectCount": 2,
    "prompt": "During an active ransomware incident, the response team must CONTAIN the spread while preserving evidence. Which TWO actions are containment-phase actions?",
    "context": "The goal is to stop lateral movement and further damage without destroying evidence.",
    "options": [
        opt("a", "Isolate the affected host from the network", "Disconnecting/quarantining the host stops lateral movement — a core containment action."),
        opt("b", "Block the attacker's C2 infrastructure at the firewall", "Blocking C2 traffic at the perimeter contains the attacker's control channel — containment."),
        opt("c", "Restore systems from backup", "Restoration is part of RECOVERY, which comes after containment and eradication."),
        opt("d", "Conduct lessons learned", "Lessons learned is a post-incident activity, not containment."),
        opt("e", "Notify law enforcement", "Notification is a communication-plan action, not a containment action."),
        opt("f", "Update the incident response plan", "Plan updates are post-incident improvement, not containment.")
    ],
    "correctOptionIds": ["a", "b"],
    "explanation": "Containment stops the incident from spreading: isolating affected hosts and blocking C2 infrastructure are classic containment actions. Restoration = recovery; lessons learned and plan updates = post-incident; notification = communications.",
    "sourceRefs": R("4.8", "Incident Response")
})

# ================= D5 · 5.2 Risk math (+1) =================
NEW_MCQ.append({
    "id": "mcq-5-057", "domain": 5, "objective": "5.2", "format": "scenario", "kind": "single-choice", "selectCount": 1,
    "prompt": "A server is valued at $80,000. A risk assessment determines the exposure factor for a specific threat is 50%, and the threat is expected to occur once every two years. What is the annualized loss expectancy (ALE)?",
    "context": "ALE = SLE × ARO, where SLE = asset value × exposure factor.",
    "options": [
        opt("a", "$20,000", "SLE = $80,000 × 0.5 = $40,000; ARO = 0.5/year; ALE = $40,000 × 0.5 = $20,000/year."),
        opt("b", "$40,000", "$40,000 is the SLE, not the ALE (ARO is 0.5, not 1)."),
        opt("c", "$10,000", "This would be SLE × ARO/2 — the ARO is already 0.5, not 0.25."),
        opt("d", "$80,000", "This is the full asset value, not the annualized loss.")
    ],
    "correctOptionIds": ["a"],
    "explanation": "SLE = AV × EF = $80,000 × 0.5 = $40,000. Once every two years → ARO = 0.5. ALE = SLE × ARO = $40,000 × 0.5 = $20,000 per year.",
    "sourceRefs": R("5.2", "Risk Analysis")
})

# ================= PBQs =================
# --- D1 · 1.4 PKI fill-blank ---
NEW_PBQ.append({
    "id": "pbq-1-012", "domain": 1, "objective": "1.4", "format": "pbq", "kind": "fill-blank",
    "prompt": "Complete each statement about public key infrastructure (PKI) by typing the missing term.\n\n1. The trusted entity that issues and revokes digital certificates is called a certificate ____ (CA).\n\n2. The message containing a public key and identity information sent to a CA is a certificate signing ____ (CSR).\n\n3. The real-time protocol used to check a certificate's revocation status is ____.\n\n4. A published list of revoked certificates is the certificate ____ list (CRL).",
    "context": "Type your answer in each blank. Spelling must be exact (case-insensitive).",
    "blanks": [
        {"id": "b1", "label": "1. CA full word", "placeholder": "e.g., authority", "acceptedAnswers": ["authority", "authorities"]},
        {"id": "b2", "label": "2. CSR full word", "placeholder": "e.g., request", "acceptedAnswers": ["request", "requests"]},
        {"id": "b3", "label": "3. Real-time status protocol", "placeholder": "e.g., OCSP", "acceptedAnswers": ["ocsp", "online certificate status protocol"]},
        {"id": "b4", "label": "4. CRL full word", "placeholder": "e.g., revocation", "acceptedAnswers": ["revocation"]}
    ],
    "explanation": "CA = certificate authority (issues/revokes certs); CSR = certificate signing request (public key + identity to the CA); OCSP provides real-time revocation status; CRL = certificate revocation list.",
    "sourceRefs": R("1.4", "Public Key Infrastructure")
})

# --- D2 · 2.4 Password attack matching ---
NEW_PBQ.append({
    "id": "pbq-2-014", "domain": 2, "objective": "2.4", "format": "pbq", "kind": "matching",
    "prompt": "Match each password attack to its description. Each attack is used once; three extra attacks are provided as distractors.",
    "context": "An analyst is classifying techniques observed in a penetration test report.",
    "premises": [
        {"id": "p1", "text": "Tries a small set of common passwords against MANY accounts to stay below lockout thresholds"},
        {"id": "p2", "text": "Reuses username/password pairs from a prior breach against other services"},
        {"id": "p3", "text": "Uses captured NTLM hashes to authenticate to remote systems without knowing the plaintext"},
        {"id": "p4", "text": "Requests service tickets and cracks them offline to obtain service account passwords"},
        {"id": "p5", "text": "Forges TGTs using a stolen KRBTGT hash to impersonate any account"}
    ],
    "targets": [
        {"id": "t1", "text": "Password spraying"},
        {"id": "t2", "text": "Credential stuffing"},
        {"id": "t3", "text": "Pass-the-hash"},
        {"id": "t4", "text": "Kerberoasting"},
        {"id": "t5", "text": "Golden ticket"}
    ],
    "extraTargets": [
        {"id": "x1", "text": "Brute force"},
        {"id": "x2", "text": "Dictionary attack"},
        {"id": "x3", "text": "Rainbow table"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "Spraying = few passwords, many accounts. Stuffing = breach pairs replayed. Pass-the-hash = NTLM hash reuse. Kerberoasting = offline crack of service tickets. Golden ticket = forged TGTs from a stolen KRBTGT hash.",
    "sourceRefs": R("2.4", "Password Attacks")
})

# --- D2 · 2.4 DNS tunneling evidence ---
NEW_PBQ.append({
    "id": "pbq-2-015", "domain": 2, "objective": "2.4", "format": "pbq", "kind": "evidence",
    "prompt": "Review the DNS query log from an internal DNS server. Select the line that BEST indicates DNS tunneling (data exfiltration).",
    "context": "DNS tunneling encodes stolen data in subdomain labels or TXT records; normal clients resolve ordinary A/MX records.",
    "artifact": {
        "label": "DNS query log — internal resolver",
        "format": "log",
        "lines": [
            {"id": "l1", "text": "10:00:01 A query example.com -> 192.0.2.10 (response)"},
            {"id": "l2", "text": "10:00:02 TXT query update.example.com (3 KB response)"},
            {"id": "l3", "text": "10:00:03 A query api.example.com -> 198.51.100.20 (response)"},
            {"id": "l4", "text": "10:00:04 TXT query 7f3a9c…e21b.payload.example.com (628-char label)"},
            {"id": "l5", "text": "10:00:05 A query mail.example.com -> 192.0.2.25 (response)"},
            {"id": "l6", "text": "10:00:06 MX query example.com (response)"}
        ]
    },
    "selectCount": 1,
    "correctLineIds": ["l4"],
    "explanation": "A 628-character subdomain label with random-looking hex in a TXT query is the classic DNS-tunneling signature: data encoded in the label and exfiltrated to the attacker's authoritative server. Ordinary A/MX lookups (l1, l3, l5, l6) are normal; l2 is unusual but a single large TXT to a known update host is far weaker an indicator than the exfil-shaped label.",
    "sourceRefs": R("2.4", "Indicators of Malicious Activity")
})

# --- D3 · 3.2 Port matching (classic real-exam PBQ) ---
NEW_PBQ.append({
    "id": "pbq-3-013", "domain": 3, "objective": "3.2", "format": "pbq", "kind": "matching",
    "prompt": "A network administrator is documenting firewall rules. Match each protocol to its DEFAULT port number. Each port is used once; three extra ports are provided as distractors.",
    "context": "The exam expects the secure/insecure default port pairs (SSH 22, HTTPS 443, LDAPS 636, SNMP 161, RDP 3389).",
    "premises": [
        {"id": "p1", "text": "SSH (secure shell)"},
        {"id": "p2", "text": "HTTPS"},
        {"id": "p3", "text": "LDAPS (LDAP over TLS)"},
        {"id": "p4", "text": "SNMP"},
        {"id": "p5", "text": "RDP"}
    ],
    "targets": [
        {"id": "t1", "text": "22"},
        {"id": "t2", "text": "443"},
        {"id": "t3", "text": "636"},
        {"id": "t4", "text": "161"},
        {"id": "t5", "text": "3389"}
    ],
    "extraTargets": [
        {"id": "x1", "text": "21"},
        {"id": "x2", "text": "23"},
        {"id": "x3", "text": "25"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "SSH = TCP 22, HTTPS = TCP 443, LDAPS = TCP 636, SNMP = UDP 161, RDP = TCP 3389. Distractors: 21 (FTP), 23 (Telnet), 25 (SMTP).",
    "sourceRefs": R("3.2", "Secure Protocols")
})

# --- D3 · 3.2 Insecure -> secure protocol replacement matching ---
NEW_PBQ.append({
    "id": "pbq-3-014", "domain": 3, "objective": "3.2", "format": "pbq", "kind": "matching",
    "prompt": "A hardening project must replace each insecure protocol with its secure alternative. Match each legacy protocol to its correct secure replacement. Each replacement is used once; three extra options are distractors.",
    "context": "Standard secure/insecure pairs from the exam: Telnet→SSH, FTP→SFTP, HTTP→HTTPS, LDAP→LDAPS, SNMPv2c→SNMPv3.",
    "premises": [
        {"id": "p1", "text": "Telnet (remote CLI)"},
        {"id": "p2", "text": "FTP (file transfer)"},
        {"id": "p3", "text": "HTTP (web)"},
        {"id": "p4", "text": "LDAP (directory queries)"},
        {"id": "p5", "text": "SNMPv2c (network monitoring)"}
    ],
    "targets": [
        {"id": "t1", "text": "SSH"},
        {"id": "t2", "text": "SFTP"},
        {"id": "t3", "text": "HTTPS"},
        {"id": "t4", "text": "LDAPS"},
        {"id": "t5", "text": "SNMPv3"}
    ],
    "extraTargets": [
        {"id": "x1", "text": "RDP"},
        {"id": "x2", "text": "TFTP"},
        {"id": "x3", "text": "SMTP"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "Telnet→SSH (encrypted CLI), FTP→SFTP (encrypted file transfer), HTTP→HTTPS (encrypted web), LDAP→LDAPS (encrypted directory), SNMPv2c→SNMPv3 (authenticated/encrypted monitoring).",
    "sourceRefs": R("3.2", "Secure Protocols")
})

# --- D4 · 4.8 SSH brute-force evidence ---
NEW_PBQ.append({
    "id": "pbq-4-016", "domain": 4, "objective": "4.8", "format": "pbq", "kind": "evidence",
    "prompt": "Review the SSH authentication log from a Linux jump host. Select the line that BEST indicates the attacker's brute-force attempt SUCCEEDED.",
    "context": "Rapid sequential failed logins from one external IP, followed by a successful login from the same IP.",
    "artifact": {
        "label": "/var/log/auth.log — jump host",
        "format": "log",
        "lines": [
            {"id": "l1", "text": "Mar 12 08:01:03 sshd[221]: Failed password for admin from 198.51.100.23 port 51234 ssh2"},
            {"id": "l2", "text": "Mar 12 08:01:05 sshd[224]: Failed password for admin from 198.51.100.23 port 51240 ssh2"},
            {"id": "l3", "text": "Mar 12 08:01:07 sshd[227]: Failed password for admin from 198.51.100.23 port 51247 ssh2"},
            {"id": "l4", "text": "Mar 12 08:01:09 sshd[230]: Failed password for admin from 198.51.100.23 port 51255 ssh2"},
            {"id": "l5", "text": "Mar 12 08:01:11 sshd[233]: Accepted password for admin from 198.51.100.23 port 51261 ssh2"},
            {"id": "l6", "text": "Mar 12 08:15:32 sshd[410]: Accepted password for jsmith from 10.0.4.15 port 39102 ssh2"}
        ]
    },
    "selectCount": 1,
    "correctLineIds": ["l5"],
    "explanation": "l5 shows a successful login from the SAME external IP (198.51.100.23) immediately after four rapid failures — the brute-force attempt succeeded. l6 is a normal user login from an internal IP (10.0.4.15) and is not part of the attack.",
    "sourceRefs": R("4.8", "Detection & Analysis")
})

# --- D4 · 4.4 Firewall log port scan evidence ---
NEW_PBQ.append({
    "id": "pbq-4-017", "domain": 4, "objective": "4.4", "format": "pbq", "kind": "evidence",
    "prompt": "Review the firewall log from a perimeter firewall. Select the line that BEST indicates an external host BEGINNING a port scan of the DMZ server.",
    "context": "A port scan shows many different destination ports probed by the same source within a second or two.",
    "artifact": {
        "label": "Firewall log — perimeter FW-01",
        "format": "log",
        "lines": [
            {"id": "l1", "text": "08:00:01 ALLOW tcp 192.168.1.20:5000 -> 192.168.1.10:443 SYN"},
            {"id": "l2", "text": "08:00:02 ALLOW tcp 192.168.1.20:5001 -> 192.168.1.10:443 SYN"},
            {"id": "l3", "text": "08:00:05 ALLOW tcp 203.0.113.99:31337 -> 192.168.1.10:22 SYN"},
            {"id": "l4", "text": "08:00:05 ALLOW tcp 203.0.113.99:31338 -> 192.168.1.10:80 SYN"},
            {"id": "l5", "text": "08:00:05 ALLOW tcp 203.0.113.99:31339 -> 192.168.1.10:443 SYN"},
            {"id": "l6", "text": "08:00:05 ALLOW tcp 203.0.113.99:31340 -> 192.168.1.10:3389 SYN"}
        ]
    },
    "selectCount": 1,
    "correctLineIds": ["l3"],
    "explanation": "l3 is the first SYN from the external scanner (203.0.113.99) probing a port on the DMZ server; it is immediately followed by probes to 80, 443, and 3389 from consecutive source ports in the same second — the signature of a port scan. l1/l2 are an internal client (192.168.1.20) making normal repeat connections to 443.",
    "sourceRefs": R("4.4", "Monitoring & Logging")
})

# --- D4 · 4.x Acronym word-bank (official list) ---
NEW_PBQ.append({
    "id": "pbq-4-018", "domain": 4, "objective": "4.4", "format": "pbq", "kind": "word-bank",
    "prompt": "Complete each statement about security operations tools by placing the correct acronym in each blank. Each acronym is used once; five extra acronyms are distractors.\n\n1. The ____ aggregates and correlates log data from across the enterprise for detection and alerting.\n\n2. ____ automates incident response actions through playbooks and orchestration.\n\n3. ____ monitors and responds to threats on individual endpoints using behavioral analysis.\n\n4. ____ enforces device compliance and posture before allowing network access.\n\n5. ____ prevents sensitive data from leaving the organization.",
    "context": "Click a word chip, then click the blank to assign it. Each word is used once.",
    "blanks": [
        {"id": "b1", "label": "1. Centralized log correlation"},
        {"id": "b2", "label": "2. Automated response"},
        {"id": "b3", "label": "3. Endpoint behavioral detection"},
        {"id": "b4", "label": "4. Posture enforcement"},
        {"id": "b5", "label": "5. Data egress control"}
    ],
    "bank": [
        {"id": "w1", "word": "SIEM"},
        {"id": "w2", "word": "SOAR"},
        {"id": "w3", "word": "EDR"},
        {"id": "w4", "word": "NAC"},
        {"id": "w5", "word": "DLP"},
        {"id": "w6", "word": "CASB"},
        {"id": "w7", "word": "MDM"},
        {"id": "w8", "word": "WAF"},
        {"id": "w9", "word": "HSM"},
        {"id": "w10", "word": "TPM"}
    ],
    "correctAssignments": {"b1": "w1", "b2": "w2", "b3": "w3", "b4": "w4", "b5": "w5"},
    "explanation": "SIEM = Security Information and Event Management (log correlation). SOAR = Security Orchestration, Automation, and Response (playbook automation). EDR = Endpoint Detection and Response (behavioral endpoint monitoring). NAC = Network Access Control (posture). DLP = Data Loss Prevention (egress control).",
    "sourceRefs": R("4.4", "Monitoring & Logging")
})

# --- D5 · 5.3 Agreements matching ---
NEW_PBQ.append({
    "id": "pbq-5-014", "domain": 5, "objective": "5.3", "format": "pbq", "kind": "matching",
    "prompt": "A procurement team is negotiating with a new cloud vendor. Match each agreement/document to its purpose. Each agreement is used once; three extra agreements are distractors.",
    "context": "The exam distinguishes MOU, NDA, SLA, BAA, and DPA by purpose.",
    "premises": [
        {"id": "p1", "text": "States intent to cooperate between parties; generally non-binding"},
        {"id": "p2", "text": "Prohibits disclosure of confidential information shared during the engagement"},
        {"id": "p3", "text": "Defines measurable service levels such as uptime and response times"},
        {"id": "p4", "text": "HIPAA-required contract between a covered entity and a business associate handling PHI"},
        {"id": "p5", "text": "Governs how a processor may handle personal data on behalf of a controller (GDPR)"}
    ],
    "targets": [
        {"id": "t1", "text": "MOU (Memorandum of Understanding)"},
        {"id": "t2", "text": "NDA (Non-disclosure Agreement)"},
        {"id": "t3", "text": "SLA (Service Level Agreement)"},
        {"id": "t4", "text": "BAA (Business Associate Agreement)"},
        {"id": "t5", "text": "DPA (Data Processing Agreement)"}
    ],
    "extraTargets": [
        {"id": "x1", "text": "SOW (Statement of Work)"},
        {"id": "x2", "text": "MSA (Master Service Agreement)"},
        {"id": "x3", "text": "MOA (Memorandum of Agreement)"}
    ],
    "correctMatches": {"p1": "t1", "p2": "t2", "p3": "t3", "p4": "t4", "p5": "t5"},
    "explanation": "MOU = non-binding intent to cooperate; NDA = confidentiality; SLA = measurable service levels; BAA = HIPAA PHI handling; DPA = GDPR data-processing terms. SOW/MSA/MOA are distractors.",
    "sourceRefs": R("5.3", "Third-party Risk")
})

# ================= Normalize legacy evidence artifacts to label/format =================
def normalize_artifact(a):
    if "label" in a and "format" in a:
        return a
    mapping = {
        "packet-capture": "log",
        "netflow": "log",
        "event-log": "log",
        "command-output": "command-output",
    }
    fmt = mapping.get(a.get("type", ""), "log")
    label = a.get("content", "") or "Log artifact"
    return {"label": label, "format": fmt, "lines": a["lines"]}

if __name__ == "__main__":
    bank = load_bank()
    # normalize evidence artifacts (standalone + multi-step children)
    for q in bank["pbqs"]:
        if q["kind"] == "evidence":
            q["artifact"] = normalize_artifact(q["artifact"])
        if q["kind"] == "multi-step":
            for s in q.get("steps", []):
                if s["kind"] == "evidence":
                    s["artifact"] = normalize_artifact(s["artifact"])
    merge(bank, new_mcqs=NEW_MCQ, new_pbqs=NEW_PBQ)

    # count check
    from collections import Counter
    mc = Counter(q["objective"] for q in bank["mcqs"])
    print("\n--- per-objective MCQ counts ---")
    for obj in ["1.1","1.2","1.3","1.4","2.1","2.2","2.3","2.4","2.5","3.1","3.2","3.3","3.4",
                "4.1","4.2","4.3","4.4","4.5","4.6","4.7","4.8","4.9","5.1","5.2","5.3","5.4","5.5","5.6"]:
        print(f"  {obj}: {mc.get(obj,0)}")
    dom = Counter(q["domain"] for q in bank["mcqs"])
    print("domain totals:", dict(sorted(dom.items())))
    multi = Counter((q["domain"], q["kind"]) for q in bank["mcqs"])
    print("multi per domain:", {d: multi.get((d,'multiple-choice'),0) for d in range(1,6)})
    print("PBQs:", len(bank["pbqs"]), "MCQs:", len(bank["mcqs"]))
    print("evidence artifacts normalized:", sum(1 for q in bank['pbqs'] if q['kind']=='evidence' and 'label' in q['artifact']))
