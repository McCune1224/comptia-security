#!/usr/bin/env python3
"""Fix a batch of validated defects in web/src/lib/server/data/question-bank.json.

Idempotent: each replacement is written only when the question still holds its
defective shape, so re-running is a no-op.

Spec constraint: BANK_SPEC.multiTotals fixes a multiple-choice floor per domain
(1:6, 2:11, 3:9, 4:13, 5:7). mcq-2-004 is a broken multi-select (option f is a
non-answer whose rationale contradicts the key), so demoting it to
single-choice must be offset by promoting one unambiguous Domain 2 multi-select.

Usage:
    python3 web/scripts/repair-question-bank.py   # preferred: run the whole pipeline
    python3 web/scripts/fix-bank-defects.py       # this step alone
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

    def require(qid):
        """Fetch a question this step depends on, or fail with a clear message."""
        q = items.get(qid)
        if q is None:
            raise SystemExit(f"required question missing from bank: {qid}")
        return q

    def set_choice(qid, options, correct, kind, select_count, explanation=None):
        q = items.get(qid)
        if q is None:
            print(f"WARN: unknown id {qid}")
            return
        ids = [o["id"] for o in options]
        if len(ids) != len(set(ids)):
            raise SystemExit(f"{qid}: duplicate option ids")
        if not all(c in ids for c in correct):
            raise SystemExit(f"{qid}: correct id not in options")
        if len(correct) != select_count:
            raise SystemExit(f"{qid}: correct count != selectCount")
        if q.get("options") == options and q.get("correctOptionIds") == correct and q.get("kind") == kind:
            return
        q["options"] = options
        q["correctOptionIds"] = correct
        q["kind"] = kind
        q["selectCount"] = select_count
        if explanation is not None:
            q["explanation"] = explanation
        changed.append(qid)


    # ── 1. mcq-2-004: the keyed pair includes a false option. Rebuild as a clean
    #    single-answer item. The Domain 2 multi floor is restored in step 7.
    set_choice(
        "mcq-2-004",
        [
            {
                "id": "a",
                "text": "Incident A is hacktivists; Incident B is organized crime",
                "rationale": "Defacement and leaks for political messaging are hacktivist tactics. Hospital ransomware demanding payment is organized crime seeking financial gain.",
            },
            {
                "id": "b",
                "text": "Incident A is nation-state; Incident B is insider threat",
                "rationale": "Nation-states operate covertly, not through protest defacements. Ransomware is not an insider threat technique.",
            },
            {
                "id": "c",
                "text": "Incident A is organized crime; Incident B is hacktivists",
                "rationale": "Organized crime does not deface embassies for political reasons. Hacktivists do not typically deploy ransomware.",
            },
            {
                "id": "d",
                "text": "Both incidents are likely from the same threat actor",
                "rationale": "The motivations and methods are completely different, so the two incidents are almost certainly unrelated attackers.",
            },
        ],
        ["a"],
        "single-choice",
        1,
        "Incident A (defacement, political leaks) is hacktivist. Incident B (ransomware demanding bitcoin) is organized crime. These are unrelated attackers with different motivations.",
    )

    # ── 2. mcq-1-005: the syslog server is simultaneously detective and
    #    compensating, so option (a) and the keyed (b) are both defensible with no
    #    MOST constraint. Rebuild as a single-answer item with a clean pairing.
    set_choice(
        "mcq-1-005",
        [
            {
                "id": "a",
                "text": "The syslog server with alerts is a detective control, and the warning banner is a deterrent control",
                "rationale": "Log aggregation with alerting finds suspicious activity after the fact (detective). A banner that threatens prosecution discourages intruders without blocking them (deterrent).",
            },
            {
                "id": "b",
                "text": "The syslog server is a preventive control, and the warning banner is a directive control",
                "rationale": "A syslog server does not block activity, so it is not preventive. A banner guides behavior, but its security purpose here is deterrence.",
            },
            {
                "id": "c",
                "text": "Both are detective controls",
                "rationale": "A warning banner does not detect anything; it discourages and guides. Only the syslog server with alerts is detective.",
            },
            {
                "id": "d",
                "text": "Both are corrective controls",
                "rationale": "Neither control restores a system after an incident. Corrective controls include backups and patch rollback.",
            },
        ],
        ["a"],
        "single-choice",
        1,
        "The syslog server collects logs and alerts on critical events, which is detective. The warning banner discourages unauthorized access by threatening prosecution, which is deterrent. The server also substitutes for an unaffordable SIEM, so a compensating role is present, but the unambiguous pairing is detective plus deterrent.",
    )

    # ── 3. mcq-3-006: PACS does not run on port 389 (LDAP). DICOM uses 104.
    q = require("mcq-3-006")
    for field in ("prompt", "context", "explanation", "hint"):
        if q.get(field) and "port 389" in q[field]:
            q[field] = q[field].replace("port 389", "port 104")
            changed.append(f"{q['id']}:{field}")

    # ── 4. mcq-1-011: the stem asks what would PREVENT while the key detects.
    q = require("mcq-1-011")
    if "which control would have prevented this?" in q.get("prompt", ""):
        q["prompt"] = q["prompt"].replace(
            "which control would have prevented this?",
            "which control would have detected the unauthorized change?",
        )
        changed.append("mcq-1-011:prompt")

    # ── 5. mcq-3-011: keyed options a and f are synonyms (stateless == packet
    #    filtering), so the keyed pair contains the same answer twice. Replace f.
    for o in require("mcq-3-011")["options"]:
        if o["id"] == "f" and "packet-filtering" in o["text"]:
            o["text"] = "Proxy firewall for requirement 1; NGFW for requirement 2"
            o["rationale"] = "A proxy firewall terminates and re-establishes connections (stateful, high overhead) and lacks the integrated IPS and VPN termination requirement 1 needs. An NGFW is overkill and adds latency to the isolated SCADA network in requirement 2."
            changed.append("mcq-3-011:f")

    # ── 6. mcq-3-019: the key labels PII as Internal while its own rationale says
    #    at least Confidential. Align the key and the explanation.
    for o in require("mcq-3-019")["options"]:
        if o["id"] == "b" and o["text"].startswith("Internal, Confidential"):
            o["text"] = "Confidential, Confidential, Restricted, Public, Internal"
            o["rationale"] = "Customer names/emails are PII and belong at Confidential. Encrypted backups are Confidential. Salaries with SSNs are Restricted, the highest sensitivity. Marketing brochures are Public. Internal VoIP metadata is Internal."
            changed.append("mcq-3-019:b")
    require("mcq-3-019")["explanation"] = (
        "Standard classification: Public (no access restrictions, intended for public consumption), "
        "Internal (business-use data that should not be public but is not highly sensitive), "
        "Confidential (sensitive data requiring protection, e.g., PII, financial records, backups), "
        "Restricted (highly sensitive data with severe impact if disclosed, e.g., SSNs, trade secrets). "
        "Customer names/emails are PII and belong at Confidential. SSNs are Restricted. Marketing "
        "materials are Public. Backups inherit the classification of their contents."
    )

    # ── 7. Promote mcq-2-009 to a two-answer multi-select. The scenario has two
    #    independent, unambiguous red flags, so it survives a "select two" key.
    q = require("mcq-2-009")
    if q and q.get("kind") == "single-choice" and q.get("domain") == 2:
        set_choice(
            "mcq-2-009",
            [
                {
                    "id": "a",
                    "text": "The caller spoofed an internal number to impersonate the IT help desk",
                    "rationale": "Vishing relies on voice-call impersonation. A spoofed internal number is a classic vishing indicator.",
                },
                {
                    "id": "b",
                    "text": "The caller used urgency and a threat of account lockout to force a fast decision",
                    "rationale": "Manufactured urgency and consequences are core social-engineering pressure tactics, and they are reported through a voice channel here.",
                },
                {
                    "id": "c",
                    "text": "The message arrived as an email attachment",
                    "rationale": "No email or attachment is involved. The contact happened over a phone call.",
                },
                {
                    "id": "d",
                    "text": "The caller used a lookalike domain to trick the user",
                    "rationale": "Typosquatting is a domain-based trick. This scenario involves a phone call, not a web address.",
                },
                {
                    "id": "e",
                    "text": "The employee was targeted through a compromised third-party website",
                    "rationale": "Nothing in the scenario involves a watering-hole or supply-chain compromise.",
                },
            ],
            ["a", "b"],
            "multiple-choice",
            2,
            "The attack is vishing: a voice call that impersonates IT and uses urgency plus a lockout threat to pressure the victim into acting quickly. No email, lookalike domain, or website compromise is involved.",
        )

    # ── 8. Restore the Domain 1 multiple-choice floor (spec 6) with a new item.
    #    mcq-1-005 was demoted to single-choice above, so Domain 1 now sits at 5.
    if "mcq-1-122" not in items:
        bank["mcqs"].append(
            {
                "id": "mcq-1-122",
                "domain": 1,
                "objective": "1.1",
                "format": "scenario",
                "kind": "multiple-choice",
                "style": "scenario",
                "prompt": "Which TWO control types describe the safeguards in this scenario? (Select TWO.)",
                "context": "A data center installs a vault door that requires two staff members to open it together, and mounts signage stating that all access is recorded and will be prosecuted. The door physically blocks entry; the signage changes nothing about the door mechanism.",
                "hint": "One safeguard physically stops the act; the other only discourages it.",
                "selectCount": 2,
                "options": [
                    {
                        "id": "a",
                        "text": "The vault door is a preventive control",
                        "rationale": "A physical barrier that blocks entry stops the act before it happens, which is preventive.",
                    },
                    {
                        "id": "b",
                        "text": "The signage is a deterrent control",
                        "rationale": "Signage discourages an attempt by warning of consequences without blocking anything, which is deterrent.",
                    },
                    {
                        "id": "c",
                        "text": "The vault door is a detective control",
                        "rationale": "Detective controls identify activity after the fact (IDS, log review). The door detects nothing.",
                    },
                    {
                        "id": "d",
                        "text": "The signage is a corrective control",
                        "rationale": "Corrective controls restore service after an incident (backups, patch rollback). Signage repairs nothing.",
                    },
                    {
                        "id": "e",
                        "text": "Both safeguards are compensating controls",
                        "rationale": "A compensating control substitutes for a control that cannot be used. Nothing here is a substitute.",
                    },
                    {
                        "id": "f",
                        "text": "Both safeguards are directive controls",
                        "rationale": "Directive controls guide behavior through policy. The door is a physical mechanism, not guidance.",
                    },
                ],
                "correctOptionIds": ["a", "b"],
                "explanation": "The door physically blocks entry, so it is preventive. The signage discourages an attempt by threatening consequences, so it is deterrent. Neither detects nor corrects anything.",
                "sourceRefs": [
                    {"source": "exam-objectives", "section": "1.1 Compare and contrast various types of security controls"},
                    {"source": "study-guide", "section": "Security Control Categories and Types"},
                ],
            }
        )
        changed.append("+mcq-1-122")

    # ── 9. pbq-3-008 step 1: premise p4 ("reconstruct its private training data")
    #    is paired with "Model extraction", but reconstructing training data is
    #    model inversion. Model extraction steals the model itself. Rewrite the
    #    premise to describe extraction and add a model-inversion distractor.
    step = require("pbq-3-008")["steps"][0]
    for p in step["premises"]:
        if p["id"] == "p4" and "reconstruct its private training data" in p["text"]:
            p["text"] = "An attacker repeatedly queries the model and uses the responses to build a functionally equivalent copy of it."
            changed.append("pbq-3-008:p4")
    if not any(t["id"] == "t6" for t in step["targets"]):
        step["targets"].append({"id": "t6", "text": "Model inversion"})
        changed.append("pbq-3-008:t6")
    for p in step["premises"]:
        if p["id"] == "p6" and "training data" in p["text"]:
            continue
    if not any(p["id"] == "p6" for p in step["premises"]):
        step["premises"].append(
            {
                "id": "p6",
                "text": "An attacker probes the model repeatedly and uses the answers to reconstruct it.",
            }
        )
        step["correctMatches"]["p6"] = "t6"
        changed.append("pbq-3-008:p6")
    if not any(e["id"] == "e2" for e in (step.get("extraTargets") or [])):
        step.setdefault("extraTargets", []).append(
            {"id": "e2", "text": "A model leak caused by storing API keys in a public repository"}
        )
        changed.append("pbq-3-008:e2")

    # ── 10. mcq-3-050 and mcq-4-141 are the same RTO/RPO item with different
    #    numbers. Replace the second with a distinct resilience question.
    set_choice(
        "mcq-4-141",
        [
            {
                "id": "a",
                "text": "The backup frequency must satisfy the RPO of 15 minutes",
                "rationale": "RPO is the maximum acceptable data loss, so backups or replication must run at least every 15 minutes to bound the loss.",
            },
            {
                "id": "b",
                "text": "The backup frequency must satisfy the RTO of 15 minutes",
                "rationale": "RTO concerns how fast service is restored, not how much data may be lost. It does not set backup frequency.",
            },
            {
                "id": "c",
                "text": "The MTBF of 1 hour sets how often backups run",
                "rationale": "MTBF is the expected time between failures, a reliability statistic. It does not schedule backups.",
            },
            {
                "id": "d",
                "text": "The MTTR of 15 minutes is the maximum data loss allowed",
                "rationale": "MTTR is the average time to repair a failed component, not an amount of data.",
            },
        ],
        ["a"],
        "single-choice",
        1,
        "A maximum loss of 15 minutes of data is the recovery point objective, so replication or backups must run at least every 15 minutes. The one-hour downtime tolerance is the recovery time objective and governs how fast the service must come back, not how often backups run.",
    )
    _p = (
        "A system can tolerate at most 1 hour of downtime and 15 minutes of data loss. "
        "Which statement correctly applies these metrics to the backup design?"
    )
    _c = "Max 1 hour downtime tolerated; max 15 minutes of data loss tolerated. The team is choosing a backup and replication schedule."
    _q = require("mcq-4-141")
    if _q.get("prompt") != _p or _q.get("context") != _c:
        _q["prompt"] = _p
        _q["context"] = _c
        changed.append("mcq-4-141:reframe")

    # ── 11. mcq-3-077 and mcq-3-126 both define TACACS+. Retarget the duplicate
    #    at a distinct protocol (RADIUS) so both items teach something new.
    q = items.get("mcq-3-126")
    if q and "TACACS+" in q.get("prompt", ""):
        q["prompt"] = (
            'Which security term is defined as: "A AAA protocol that combines authentication and '
            'authorization, encrypts only the password, and uses UDP ports 1812 and 1813."?'
        )
        for o in q["options"]:
            if o["id"] == "c":
                o["text"] = "RADIUS"
                o["rationale"] = "RADIUS combines authentication and authorization, encrypts only the password, and uses UDP 1812/1813."
        q["explanation"] = (
            "RADIUS: A AAA protocol that combines authentication and authorization, encrypts only the "
            "password, and uses UDP ports 1812 and 1813. TACACS+ encrypts the whole session over TCP 49."
        )
        changed.append("mcq-3-126:radius")

    return changed


if __name__ == "__main__":
    _bank = json.loads(BANK.read_text())
    _changed = apply(_bank)
    BANK.write_text(json.dumps(_bank, indent=2, ensure_ascii=False) + "\n")
    print(f"OK: {len(_changed)} change(s)")
    for _c in _changed:
        print("  ", _c)
