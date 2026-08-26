#!/usr/bin/env python3
"""Fill empty `context` fields across the question bank.

For each item that currently has no context, move the scenario portion of the
prompt into `context` and leave the prompt as the question. Items whose prompt
is a pure question (definitional MCQs, matching/word-bank PBQs) get a short,
factual framing context instead. After this runs, every question carries a
context and no prompt refers to "the context".

Anchored on each item's current prompt so it edits only the intended items and
fails loudly if the bank has shifted.
"""
import json
import re
import sys
from pathlib import Path

BANK = Path(__file__).resolve().parent.parent / 'src/lib/server/data/question-bank.json'

# id -> (new_context, new_prompt)
FILLS = {
    'mcq-1-006': (
        'A security architect needs to select a control that both prevents unauthorized vehicle access to a facility loading dock and directs delivery vehicles to a specific inspection area.',
        'Which control type best fulfills both requirements simultaneously?',
    ),
    'mcq-1-010': (
        'A security engineer is designing a Zero Trust network architecture.',
        'Which TWO of the following are core components of the Zero Trust policy decision and enforcement framework as defined by NIST SP 800-207? (Select TWO.)',
    ),
    'mcq-1-012': (
        'An organization deploys a fake record in its customer database that appears to be a valid credit-card entry. The record contains unique markers detectable only by the organization.',
        'Which type of deception technology is this?',
    ),
    'mcq-1-015': (
        'Change management defines how system modifications are proposed, reviewed, approved, and reversed.',
        'Which of the following best describes the purpose of a standard operating procedure (SOP) in the change management process?',
    ),
    'mcq-1-017': (
        'An organization is drafting its change management policy.',
        'Which of the following elements should be included to ensure that failed changes can be reversed quickly and predictably?',
    ),
    'mcq-1-021': (
        'A security architect is designing a password storage system and wants to use a key-stretching algorithm that is resistant to both GPU-based parallel attacks and ASIC-based brute-force attacks.',
        'Which TWO of the following algorithms meet this requirement? (Select TWO.)',
    ),
    'mcq-1-023': (
        'A security engineer is configuring TLS for a web application that handles sensitive financial data. The engineer wants to ensure that even if the server’s long-term private key is compromised in the future, past session keys cannot be decrypted.',
        'Which cryptographic property should the engineer enable?',
    ),
    'mcq-1-024': (
        'An organization’s cryptographic inventory includes RSA-2048 for digital signatures, ECDHE for key exchange, and AES-256-GCM for bulk encryption. A security consultant warns that sufficiently large quantum computers will eventually break RSA and ECDHE.',
        'Which of the following describes the quantum-resistant alternatives the organization should evaluate?',
    ),
    'mcq-3-008': (
        'Both virtual machines and containers isolate workloads, but they do so at different layers of the stack.',
        'Which statement accurately describes the security differences between virtual machines and containers?',
    ),
    'mcq-3-013': (
        'A security administrator needs to allow a small number of approved administrators to SSH into a highly restricted PCI DSS network segment that has no direct internet connectivity. All administrative sessions must be logged and monitored.',
        'What device placement strategy satisfies these requirements?',
    ),
    'mcq-3-018': (
        'A security engineer configures a firewall rule allowing inbound HTTPS traffic. A stateless firewall and a stateful firewall process this rule differently.',
        'Which statement accurately describes the difference?',
    ),
    'mcq-3-025': (
        'A company needs to ensure that all internal application traffic between microservices is encrypted. The services communicate using REST APIs and run on Kubernetes pods that are frequently created and destroyed. Traditional TLS with static certificates is impractical because of the dynamic pod lifecycle.',
        'Which solution should the security architect choose?',
    ),
    'mcq-3-026': (
        'A company processes highly sensitive payroll data using an in-memory database. The security architect is concerned about cold boot attacks, DMA attacks via Thunderbolt ports, and the hypervisor reading guest memory.',
        'Which technology protects data while it is being actively processed in RAM?',
    ),
    'mcq-3-032': (
        'A database administrator configures a disk array with six physical disks. The system requires maximum read performance and fault tolerance — the array must survive two simultaneous disk failures without data loss.',
        'Which RAID configuration meets these requirements?',
    ),
    'mcq-3-035': (
        'A company experiences a ransomware attack that encrypts all servers. IT takes 6 hours to detect the attack, 4 hours to restore from clean backups, and 2 hours to validate data integrity and resume operations. The business can survive a maximum of 12 hours without the system.',
        'Which statement BEST interprets the MTD, MTTR, and RTO relationship?',
    ),
    'mcq-4-009': (
        'A Splunk correlation rule triggers an impossible-travel alert: a user authenticated from New York at 09:05 UTC and London at 09:35 UTC. The user is a remote employee who uses a company VPN.',
        'What is the MOST likely explanation?',
    ),
    'mcq-4-049': (
        "A penetration tester runs 'nmap -sS -sV -O -p 1-10000 10.0.0.1'. All 10,000 ports show as 'filtered' but the web application is accessible via a browser.",
        'Why did Nmap report all ports as filtered?',
    ),
    'mcq-2-058': (
        'A development team is remediating a stored XSS vulnerability in a web application.',
        'Which control is the MOST effective primary defense?',
    ),
    'pbq-1-003': (
        'An organization is setting up a new internal certificate authority to issue digital certificates for corporate web applications and internal wireless networks.',
        'Arrange the PKI certificate lifecycle steps in the correct order from initial key generation through certificate revocation or expiration.',
    ),
    'pbq-1-004': (
        'You are a security analyst hardening a production public-facing web server that handles customer transactions.',
        'Configure each TLS parameter to meet the organization’s security baseline, which requires TLS 1.2 or higher, AES-256 encryption, forward secrecy, and strong certificate validation.',
    ),
    'pbq-2-802': (
        'Attack recognition depends on mapping each technique to the indicator that defines it.',
        'Match each attack to its best description.',
    ),
    'pbq-4-803': (
        'Legacy protocols often transmit data in cleartext or with weak authentication and have modern, stronger replacements.',
        'Match each insecure protocol to its secure replacement.',
    ),
    'pbq-4-804': (
        'Federated identity lets a user authenticate once and be recognized across separate systems.',
        'Complete each statement about federated identity protocols.\n\n1. SAML transports identity assertions in ____ format.\n2. OIDC issues ____ tokens that clients present to APIs.\n3. The protocol most commonly used to federate with Microsoft services is ____.',
    ),
    'pbq-3-801': (
        'Zero trust replaces implicit network trust with per-request verification.',
        'Complete each statement about zero-trust principles.\n\n1. Zero trust verifies ____ every access request rather than trusting the network.\n2. Microsegmentation limits ____ movement inside the environment.\n3. Every identity is validated with strong ____ before access is granted.',
    ),
    'pbq-4-805': (
        'An administrator is enabling MFA for a VPN.',
        'Configure the policy with the most secure settings.',
    ),
    'pbq-4-806': (
        'A SOC is tuning a SIEM rule that detects credential-stuffing bursts.',
        'Configure the correlation rule.',
    ),
}


def anchor(text: str) -> str:
    t = text.lower()
    t = t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
    return re.sub(r'\s+', ' ', t).strip()


def main() -> int:
    bank = json.loads(BANK.read_text())
    by = {q['id']: q for q in bank['mcqs'] + bank['pbqs']}
    done = 0
    for qid, (ctx, prompt) in FILLS.items():
        assert qid in by, f'missing {qid}'
        q = by[qid]
        assert not (q.get('context') or '').strip(), f'{qid} already has context'
        # anchor: the current prompt must still contain (normalized) the question we
        # are keeping, so we only ever edit the item we expect. Normalizing quotes and
        # whitespace avoids false drift on curly vs straight apostrophes.
        a_cur = anchor(q['prompt'])
        a_new = anchor(prompt)
        assert a_new in a_cur or a_cur in a_new, \
            f'{qid} prompt drifted; aborting to avoid mis-edit'
        q['context'] = ctx
        q['prompt'] = prompt
        done += 1
        print(f'{qid}: context filled ({len(ctx)} chars)')
    json.dump(bank, open(BANK, 'w'), indent=2, ensure_ascii=False)
    open(BANK, 'a').write('\n')
    print(f'Filled {done} contexts.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
