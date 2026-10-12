#!/usr/bin/env python3
"""Second batch of validated fixes: objective retags, duplicate defs, context.

Continues web/scripts/fix-bank-defects.py. Idempotent by question id; re-running
prints "0 change(s)" when clean.

Usage:
    python3 web/scripts/repair-question-bank.py     # preferred: run the whole pipeline
    python3 web/scripts/fix-bank-defects-2.py       # this step alone
"""
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
BANK = REPO / "web" / "src" / "lib" / "server" / "data" / "question-bank.json"


def apply(bank):
    """Apply this step's fixes to `bank` in place.

    Returns a list of change labels. Idempotent: a second call on the same
    bank returns an empty list.
    """
    items = {q["id"]: q for q in bank["mcqs"] + bank["pbqs"]}
    changed = []


    def set_objective(qid, objective, new_id=None):
        """Retag a question. Cross-domain retags must also update `domain` and the
        id (the bank validator requires objective domain == domain and id prefix)."""
        q = items.get(qid)
        if q is None:
            if new_id and new_id in items:
                return  # already migrated by a previous run
            print(f"WARN: unknown id {qid}")
            return
        domain = int(objective[0])
        target_id = new_id or q["id"]
        if q["objective"] == objective and q["domain"] == domain and q["id"] == target_id:
            return
        old_id = q["id"]
        q["objective"] = objective
        if q["domain"] != domain:
            if target_id in items and target_id != old_id:
                raise SystemExit(f"{target_id}: id already taken")
            q["domain"] = domain
            q["id"] = target_id
            items.pop(old_id, None)
            items[target_id] = q
            changed.append(f"{old_id}->{target_id} ({objective})")
        else:
            changed.append(f"{old_id}->{objective}")


    # ── A. Objective retags (reviewer clusters, verified against the objectives) ──
    # Cryptography terms were tagged 1.2 (fundamental concepts), not 1.4 (crypto).
    for qid in ["mcq-1-065", "mcq-1-066", "mcq-1-067", "mcq-1-068", "mcq-1-069",
                "mcq-1-070", "mcq-1-078", "mcq-1-081", "mcq-1-082"]:
        set_objective(qid, "1.4")

    # Privacy and regulation terms were tagged 1.4 (crypto). GDPR/PII/PHI are 5.4.
    for qid, nid in [("mcq-1-075", "mcq-5-127"), ("mcq-1-076", "mcq-5-128"), ("mcq-1-077", "mcq-5-129")]:
        set_objective(qid, "5.4", nid)

    # Malware-type definitions were tagged 2.1 (threat actors). They are 2.4.
    for qid in ["mcq-2-072", "mcq-2-073", "mcq-2-074", "mcq-2-075", "mcq-2-076",
                "mcq-2-077", "mcq-2-078", "mcq-2-079", "mcq-2-080", "mcq-2-081"]:
        set_objective(qid, "2.4")

    # Incident-response phases were tagged 4.1 (computing resources). They are 4.8.
    for qid in ["mcq-4-093", "mcq-4-094", "mcq-4-095", "mcq-4-096", "mcq-4-097", "mcq-4-098"]:
        set_objective(qid, "4.8")

    # IAM models were tagged 4.4 (monitoring). They are 4.6.
    for qid in ["mcq-4-108", "mcq-4-109", "mcq-4-110", "mcq-4-111", "mcq-4-112"]:
        set_objective(qid, "4.6")

    # Jump server was tagged 4.4. It is a 3.2 network appliance.
    set_objective("mcq-4-113", "3.2", "mcq-3-179")

    # Backup types were tagged 4.6 (IAM). They are 3.4 (resilience/recovery).
    for qid, nid in [("mcq-4-118", "mcq-3-180"), ("mcq-4-119", "mcq-3-181"), ("mcq-4-120", "mcq-3-182")]:
        set_objective(qid, "3.4", nid)

    # Syslog is a monitoring tool (4.4); chain of custody, legal hold, and
    # e-discovery are forensics (4.8). Both groups were mislabeled 4.2.
    set_objective("mcq-4-099", "4.4")
    for qid in ["mcq-4-100", "mcq-4-101", "mcq-4-102"]:
        set_objective(qid, "4.8")

    # Risk-management terms were tagged 5.1 (governance). They are 5.2.
    for qid in ["mcq-5-060", "mcq-5-061", "mcq-5-062", "mcq-5-063", "mcq-5-064",
                "mcq-5-065", "mcq-5-066", "mcq-5-067", "mcq-5-068"]:
        set_objective(qid, "5.2")

    # Change management (5-084) is 1.3; due care (5-085) is 5.4.
    set_objective("mcq-5-084", "1.3", "mcq-1-123")
    set_objective("mcq-5-085", "5.4")

    # TACACS+ was pinned to 3.3; it is a network AAA protocol (3.2). mcq-3-126 was
    # later removed as a duplicate, so this is a no-op that stays for provenance.
    if "mcq-3-126" in items:
        set_objective("mcq-3-126", "3.2")

    # ── B. Remaining near-duplicate definition pairs ─────────────────────────────
    # Keep the richer definition, retarget the twin at a distinct term.
    def reterm(qid, prompt, answer, explanation, distractor_answer=None):
        q = items.get(qid)
        if q is None or q.get("kind") != "single-choice":
            return
        if "Which security term is defined as" not in q.get("prompt", ""):
            return
        if q["prompt"] == prompt:
            return
        q["prompt"] = prompt
        for o in q["options"]:
            if o["id"] in q["correctOptionIds"]:
                o["text"] = answer
                o["rationale"] = f"{answer} is the term that matches this definition."
        q["explanation"] = explanation
        changed.append(f"{qid}:reterm")


    # LDAP twin (mcq-3-117) -> SNMP (distinct protocol definition).
    reterm(
        "mcq-3-117",
        'Which security term is defined as: "A protocol for monitoring and managing network devices '
        'such as switches and routers, using UDP ports 161 and 162."?',
        "SNMP",
        "SNMP: a protocol for monitoring and managing network devices, using UDP 161 for polling and 162 for traps. LDAP queries directories on TCP 389.",
    )
    # RADIUS twin (mcq-3-125) -> Kerberos (distinct authentication protocol).
    reterm(
        "mcq-3-125",
        'Which security term is defined as: "A network authentication protocol that uses tickets, a key '
        'distribution center, and TCP/UDP port 88."?',
        "Kerberos",
        "Kerberos: ticket-based network authentication using a key distribution center on TCP/UDP port 88. RADIUS provides centralized AAA on UDP 1812/1813.",
    )
    # Kerberos twin (mcq-3-124) -> DNSSEC.
    reterm(
        "mcq-3-124",
        'Which security term is defined as: "A set of extensions that cryptographically sign DNS records '
        'to prevent spoofing, using port 53."?',
        "DNSSEC",
        "DNSSEC cryptographically signs DNS records to prevent spoofing and cache poisoning, and operates over port 53. Kerberos is ticket-based authentication on port 88.",
    )
    # IPsec twin (mcq-3-123) -> TLS.
    reterm(
        "mcq-3-123",
        'Which security term is defined as: "A protocol that protects application traffic in transit and '
        'uses TCP port 443 for HTTPS."?',
        "TLS",
        "TLS protects application traffic in transit and secures HTTPS on TCP 443. IPsec secures IP traffic with AH and ESP over ports 500/4500.",
    )
    # Syslog twin (mcq-3-122) -> NetFlow.
    reterm(
        "mcq-3-122",
        'Which security term is defined as: "A protocol that records IP flow metadata such as source, '
        'destination, and byte counts for traffic analysis."?',
        "NetFlow",
        "NetFlow records IP flow metadata for traffic analysis. Syslog sends system log messages on UDP 514.",
    )
    # Microsegmentation twin (mcq-1-084) -> VLAN (distinct segmentation term).
    reterm(
        "mcq-1-084",
        'Which security term is defined as: "A logical network segment created on a switch to separate '
        'traffic without separate physical hardware."?',
        "VLAN",
        "VLAN: a logical network segment on a switch that separates traffic without separate hardware. Microsegmentation applies granular per-workload policy, often in software.",
    )

    # ── C. mcq-1-003 duplicated context ──────────────────────────────────────────
    q = items.get("mcq-1-003")
    if q and q.get("context"):
        marker = "A financial institution deploys the following controls:"
        text = q["context"]
        if text.count(marker) == 2:
            q["context"] = text[text.rfind(marker):]
            changed.append("mcq-1-003:context")

    # ── D. mcq-5-117 and mcq-5-124 are the same CMMC/SOC 2/FedRAMP word-bank.
    #    Replace the duplicate with a distinct Domain 5 word-bank.
    q = items.get("mcq-5-124")
    if q and q.get("kind") == "word-bank" and "DoD supply-chain framework" in q.get("prompt", ""):
        q["prompt"] = (
            "The ____ grants a client the right to audit a vendor's controls, a ____ sets uptime and "
            "response commitments, and a ____ keeps shared information confidential."
        )
        q["blanks"] = [
            {"id": "b1", "label": "Audit clause"},
            {"id": "b2", "label": "Service commitment"},
            {"id": "b3", "label": "Confidentiality"},
        ]
        q["bank"] = [
            {"id": "w1", "word": "right-to-audit clause"},
            {"id": "w2", "word": "service-level agreement"},
            {"id": "w3", "word": "non-disclosure agreement"},
            {"id": "w4", "word": "memorandum of understanding"},
            {"id": "w5", "word": "statement of work"},
        ]
        q["correctAssignments"] = {"b1": "w1", "b2": "w2", "b3": "w3"}
        q["explanation"] = (
            "A right-to-audit clause lets the client inspect a vendor's controls. A service-level "
            "agreement sets uptime and response commitments. A non-disclosure agreement keeps shared "
            "information confidential."
        )
        changed.append("mcq-5-124:wordbank")



    # ── F. Duplicate definition items ───────────────────────────────────────────
    # Handled systematically by web/scripts/dedupe-definitions.py (run after this
    # script). See that file for the grouping rule.

    # ── E. Reviewer low-confidence PBQ items ─────────────────────────────────────

    # pbq-4-024: matching ransomware *encryption symptoms* to "Eradication & Recovery"
    # conflates detection with recovery. Retarget the premise at the recovery action.
    q = items.get("pbq-4-024")
    if q and q.get("kind") == "matching":
        for p in q.get("premises", []):
            if p["id"] == "p1" and ".crypt" in p["text"]:
                p["text"] = "Backups are restored and the encrypted server is rebuilt from a clean image."
                changed.append("pbq-4-024:p1")
        for t in q.get("targets", []):
            if t["id"] == "t1" and t["text"] != "Eradication & Recovery (restore from clean backup)":
                t["text"] = "Eradication & Recovery (restore from clean backup)"
                changed.append("pbq-4-024:t1")

    # pbq-3-003 field f3 ("Internal to Internet outbound") is keyed to a DNS-only
    # rule, which conflates general egress with DNS egress. Rewrite the field and
    # its options so the keyed answer is the correct general egress policy.
    q = items.get("pbq-3-003")
    if q and q.get("kind") == "configuration":
        for f in q.get("fields", []):
            if f["id"] == "f3" and "Internal to Internet" in f["label"]:
                f["label"] = "Internal to Internet outbound web access"
                for o in f["options"]:
                    if o["id"] == "a":
                        o["text"] = "Allow HTTP and HTTPS only (ports 80, 443)"
                    elif o["id"] == "d":
                        o["text"] = "Allow to specific trusted DNS resolvers only"
                if q["correctValues"].get("f3") != "a":
                    q["correctValues"]["f3"] = "a"
                    changed.append("pbq-3-003:f3")
                _expl = (
                    "Only HTTPS reaches the DMZ (port 443). The DMZ is blocked from the internal network "
                    "entirely. Internal egress allows only web protocols (HTTP/HTTPS), with DNS restricted to "
                    "trusted resolvers. DMZ administration comes only from bastion IPs on 443, and the catch-all "
                    "is implicit deny so anything unmatched is dropped."
                )
                if q.get("explanation") != _expl:
                    q["explanation"] = _expl
                    changed.append("pbq-3-003:explanation")

    # pbq-2-010 field f6: MAC allowlisting is keyed as "the most secure, standards-based
    # option", but standard wireless hardening treats MAC filtering as weak and not a
    # real control (addresses are spoofable). The correct answer is Disabled.
    q = items.get("pbq-2-010")
    if q and q.get("kind") == "configuration":
        for f in q.get("fields", []):
            if f["id"] == "f6" and f["label"] == "MAC address filtering":
                for o in f["options"]:
                    if o["id"] == "f6o1" and o["text"] != "Disabled (rely on 802.1X/EAP instead)":
                        o["text"] = "Disabled (rely on 802.1X/EAP instead)"
                if q["correctValues"].get("f6") != "f6o1":
                    q["correctValues"]["f6"] = "f6o1"
                    changed.append("pbq-2-010:f6")
                _expl = (
                    "WPA3-Enterprise with 802.1X/EAP and AES-CCMP gives per-user, certificate-based "
                    "authentication and strong encryption. WPS is disabled to remove a well-known weak point, "
                    "guests are isolated on a separate VLAN, and MAC filtering is left disabled because MAC "
                    "addresses are spoofable and add no real security beyond 802.1X."
                )
                if q.get("explanation") != _expl:
                    q["explanation"] = _expl
                    changed.append("pbq-2-010:explanation")

    return changed


if __name__ == "__main__":
    _bank = json.loads(BANK.read_text())
    _changed = apply(_bank)
    BANK.write_text(json.dumps(_bank, indent=2, ensure_ascii=False) + "\n")
    print(f"OK: {len(_changed)} change(s)")
    for _c in _changed:
        print("  ", _c)
