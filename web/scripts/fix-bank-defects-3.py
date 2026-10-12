#!/usr/bin/env python3
"""Batch 3 fixes: defects found in the full 692-MCQ + 105-PBQ read-through.

Run after fix-bank-defects.py, fix-bank-defects-2.py, and dedupe-definitions.py.
Idempotent: every edit is written only when the question still holds its
current (defective) shape, so re-running prints "0 change(s)".

Usage:
    python3 web/scripts/repair-question-bank.py     # preferred: run the whole pipeline
    python3 web/scripts/fix-bank-defects-3.py       # this step alone
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


    def set_field(qid, field, new):
        q = items.get(qid)
        if q is None:
            print(f"WARN: {qid} missing")
            return
        if q.get(field) != new:
            q[field] = new
            changed.append(f"{qid}:{field}")


    def set_option(qid, oid, text, rationale=None):
        q = items.get(qid)
        if q is None:
            print(f"WARN: {qid} missing")
            return
        for o in q.get("options", []):
            if o["id"] == oid:
                if o["text"] != text:
                    o["text"] = text
                    changed.append(f"{qid}:{oid}.text")
                if rationale is not None and o.get("rationale") != rationale:
                    o["rationale"] = rationale
                    changed.append(f"{qid}:{oid}.rationale")
                return


    def set_key(qid, correct):
        q = items.get(qid)
        if q is None:
            return
        if q.get("correctOptionIds") != correct:
            q["correctOptionIds"] = correct
            changed.append(f"{qid}:key")


    def retag(qid, objective, new_id=None):
        q = items.get(qid)
        if q is None:
            if new_id and new_id in items:
                return  # already migrated
            print(f"WARN: {qid} missing")
            return
        domain = int(objective[0])
        target = new_id or qid
        if q["objective"] == objective and q["domain"] == domain and q["id"] == target:
            return
        old = q["id"]
        q["objective"] = objective
        q["domain"] = domain
        if target != old:
            if target in items:
                raise SystemExit(f"{target}: id already taken")
            q["id"] = target
            items.pop(old, None)
            items[target] = q
            changed.append(f"{old}->{target} ({objective})")
        else:
            changed.append(f"{old}->{objective}")


    # ── 1. mcq-1-004: option label duplicated the control type ("Corrective and
    #      Corrective"), which reads as an error. Reword and clarify the rationale.
    set_option(
        "mcq-1-004", "c",
        "Corrective and corrective — both transaction-log rollback and backup recovery restore data",
        "Restoring from backup repairs the existing damage (corrective). Transaction-log rollback "
        "also repairs corruption by reverting to a known-good state (corrective). Both fix problems "
        "after they occur.",
    )
    set_field(
        "mcq-1-004", "explanation",
        "Restoring from backup is a corrective control because it repairs damage after it occurs. "
        "Transaction-log rollback is also corrective because it reverts the database to a consistent "
        "state after corruption. The scenario names two corrective controls applied to the same "
        "incident, which is why the pairing is corrective and corrective.",
    )

    # ── 2. mcq-1-028: the prompt was circular and the answer was arguably the IDS
    #      rather than the analyst's triage. Reframe to ask about the combined
    #      detection process.
    set_field(
        "mcq-1-028", "prompt",
        "An analyst reviews 40 IDS alerts overnight, confirms 3 are true positives, opens a ticket "
        "for each, investigates, and documents the outcome. Within the control framework, which "
        "control type do the IDS and the analyst's triage together represent?",
    )
    set_field(
        "mcq-1-028", "explanation",
        "Detective controls identify and document security events. The IDS is the technical detective "
        "control and the analyst's triage, ticketing, and documentation are the operational detective "
        "process that follows it. Prevention would stop the event, correction would restore a system, "
        "and deterrence would discourage the attacker; none of those describes reviewing alerts after "
        "the fact.",
    )

    # ── 4. mcq-3-002: prompt carried a stray "(Choose TWO.)" on a single-answer item.
    q = items.get("mcq-3-002")
    if q and "(Choose TWO.)" in q.get("prompt", ""):
        q["prompt"] = q["prompt"].replace(" (Choose TWO.)", "")
        changed.append("mcq-3-002:prompt")

    # ── 5. mcq-4-003: the stem stated the GPO was "Enforced" while the key relied
    #      on it not being enforced. Make the scenario consistent.
    q = items.get("mcq-4-003")
    if q and "still linked and enforced" in q.get("context", ""):
        q["context"] = q["context"].replace(
            "Group Policy confirms the GPO is still linked and enforced.",
            "Group Policy confirms the GPO is still linked and has the Enforced setting applied.",
        )
        changed.append("mcq-4-003:context")

    # ── 6. mcq-4-041: the printed log is documentary evidence, not demonstrative.
    q = items.get("mcq-4-041")
    if q and q["options"] and q["options"][0]["text"].startswith("Demonstrative"):
        set_option(
            "mcq-4-041", "a",
            "Documentary — testimonial — real: the log is a written record, the expert statement is "
            "testimonial, and the drive is the physical object",
            "A printed log is documentary evidence (a writing or record), expert testimony is "
            "testimonial evidence (a sworn statement), and the original hard drive is real evidence "
            "(a physical object).",
        )
        set_field(
            "mcq-4-041", "explanation",
            "Evidence is classified by form: real evidence is a physical object (the hard drive), "
            "documentary evidence is a writing or record (the printed log), demonstrative evidence "
            "illustrates testimony (a chart or diagram), and testimonial evidence is a sworn statement "
            "(the expert witness). The printed log is therefore documentary, not demonstrative.",
        )

    # ── 7. Objective retags for definition items that were tagged to objectives they
    #      do not test. Cross-domain moves also update `domain` and the id.
    retag("mcq-4-010", "4.4")                              # logon-event analysis
    for qid, nid in [("mcq-4-114", "mcq-3-183"), ("mcq-4-115", "mcq-3-184"),
                     ("mcq-4-116", "mcq-3-185"), ("mcq-4-117", "mcq-3-186")]:
        retag(qid, "3.4", nid)                             # RTO/RPO/MTTR/MTBF
    retag("mcq-4-121", "5.1", "mcq-5-130")                 # NIST CSF
    retag("mcq-4-122", "2.4", "mcq-2-175")                 # MITRE ATT&CK
    retag("mcq-4-123", "4.2")                              # retention policy
    retag("mcq-4-124", "3.4", "mcq-3-187")                 # immutable backup
    for qid in ["mcq-4-103", "mcq-4-104", "mcq-4-105", "mcq-4-106", "mcq-4-107"]:
        retag(qid, "4.4")                                  # monitoring/detection tools


    # ── 8. Explanation, rationale, context, and key alignment ──────────────────
    # Text fixes identified in the full read-through. Each value is asserted here
    # so the pipeline reproduces the committed bank exactly.
    TEXT_FIXES = {
        'mcq-1-004': {
            "options": {
                'b': {"text": 'Corrective and Detective', "rationale": 'Restoring from backup is corrective. Transaction logs used for rollback are also corrective, not detective — the logs repair the database rather than merely reporting that something changed.'},
            },
        },
        'mcq-1-055': {
            "explanation": 'Authorization is the process of granting or denying access to a resource based on an authenticated identity. Authentication proves identity; authorization decides what the proven identity may do; accounting records what was done.',
            "key": ['a'],
            "options": {
                'a': {"text": 'Authorization', "rationale": 'Authorization grants or denies access to a resource based on the authenticated identity. It follows authentication and decides what the proven identity may do.'},
                'b': {"text": 'Identification', "rationale": 'Identification is the act of claiming an identity before it is proven. Authorization happens after authentication and decides what the proven identity may access.'},
                'c': {"text": 'Accounting', "rationale": 'Accounting logs and tracks user activity for auditing. It does not grant or deny access.'},
                'd': {"text": 'Authentication', "rationale": "Authentication verifies that a claimed identity is genuine. It answers 'who are you', while authorization decides what you may access."},
            },
        },
        'mcq-1-090': {
            "explanation": 'Input validation rejects malformed or unexpected input at the trust boundary, which blocks injection and overflow classes such as SQL injection, XSS, and buffer overflow. It is a preventive application-layer control.',
        },
        'mcq-2-002': {
            "explanation": 'Watering-hole attacks, encrypted DNS tunnels, and patient, low-noise exfiltration of CAD designs point to a resourceful actor conducting industrial espionage: a nation-state APT is the strongest single answer, and a commercially motivated competitor-sponsored actor is the next most consistent. Organized crime is financially motivated but typically uses ransomware, insiders already hold access, hacktivists seek publicity, and Shadow IT is not an external actor.',
            "options": {
                'f': {"text": 'Competitor-sponsored', "rationale": 'A competitor benefits commercially from stolen design data, but Security+ groups commercial IP theft under nation-state or organized-crime actors. It is the second-best fit here and is keyed alongside nation-state.'},
            },
        },
        'mcq-2-012': {
            "explanation": '50,000 attempts against one account is brute force: many passwords tried against a single username. The username came from a breach but the password did not, so it is not credential stuffing (which replays known username/password pairs) or password spraying (few passwords across many accounts).',
        },
        'mcq-2-032': {
            "explanation": 'INetSim simulates internet services on an isolated network so the sample can attempt its full attack sequence — DNS resolution, C2 callbacks, encrypted communication — while all traffic stays contained. Removing the network adapter prevents C2 contact but also hides the network indicators the researcher needs to observe. A public sandbox may tip off the adversary and prevents local instrumentation.',
        },
        'mcq-3-002': {
            "explanation": 'Type 1 (bare-metal) hypervisors such as VMware ESXi or Hyper-V Server run directly on hardware with no host OS, giving maximum performance for server consolidation. Type 2 (hosted) hypervisors such as VMware Workstation or VirtualBox run as applications on an existing OS, which suits a developer workstation. Containers share the host kernel and cannot run guest kernels of different Linux distributions, and embedded hypervisors are firmware-based devices.',
        },
        'mcq-3-004': {
            "options": {
                'b': {"text": 'Lack of network segmentation between IT and OT', "rationale": 'The OT network is described as isolated, so lack of segmentation is not the issue; the failure was that the isolation was bypassed by a direct physical connection.'},
            },
        },
        'mcq-3-008': {
            "explanation": 'VMs virtualize hardware under a hypervisor, so each guest runs its own kernel and the isolation boundary is enforced in hardware (with EPT/SLAT). Containers share the host kernel and isolate at the process level using namespaces and cgroups, which makes breakout easier than VM escape because the shared kernel and its syscalls are a larger attack surface.',
        },
        'mcq-3-010': {
            "explanation": 'Traffic is allowed only in the direction the service requires: the less-trusted DMZ may initiate toward the trusted zone, but the trusted zone never initiates back toward the DMZ. This default-deny, one-way design prevents a compromised DMZ host from pivoting inward. Stateful inspection tracks sessions, egress filtering inspects outbound content, and defense in depth is a broader layering strategy — none is the directional rule described.',
        },
        'mcq-3-015': {
            "explanation": 'A honeypot is a decoy system that mimics real services to attract and observe attackers and provide early warning of reconnaissance. Placing it in the DMZ keeps it reachable from the internet while isolating it from production systems. An IDS is passive monitoring, a honeynet is a network of multiple honeypots, and honeytokens are fake data records inside real systems.',
        },
        'mcq-3-030': {
            "explanation": 'The 3-2-1 rule requires three copies of the data, on two different media types, with at least one copy offsite. The new design has local disk (copy 1), offsite tape (copy 2 on a second medium), and a geographic replica (copy 3). The original design failed the rule because the primary and its only backup sat in the same room on the same medium.',
        },
        'mcq-3-031': {
            "explanation": 'Daily incrementals capture only changes since the previous backup, so total storage stays small, while 15-minute transaction-log backups let the database be replayed to any moment within the day — point-in-time recovery. Differentials grow larger each day and only restore to the time of the backup, and nightly fulls waste storage and bandwidth.',
        },
        'mcq-3-060': {
            "explanation": "A write-ahead journal records each transaction's changes to durable storage before the commit, so after a crash the database replays committed work (redo) and rolls back incomplete work (undo) without restoring a backup. Replication keeps a current copy elsewhere, a snapshot restores a point-in-time copy and loses later commits, and ECC memory corrects transient RAM bit flips — none provides redo/undo crash recovery.",
        },
        'mcq-4-003': {
            "explanation": 'Group Policy normally reapplies at every refresh, so a reverted setting points to a competing configuration source writing the same values. Local Group Policy or direct registry edits on the host are the usual culprits; the fix is to restrict local GPO processing and confirm the domain GPO actually manages the TLS registry values. Windows Update, reboots, and antivirus do not override Group Policy security settings.',
            "context": 'After applying a Windows Server hardening baseline via GPO, six servers have reverted to weaker TLS settings three weeks later. Group Policy confirms the GPO is linked and has the Enforced setting applied.',
            "options": {
                'a': {"text": "A local administrator changed the TLS settings with the Local Group Policy Editor, and the servers' local policy takes precedence in this scenario", "rationale": 'Local Group Policy Objects are normally overridden by domain GPOs, but local settings can win when they are written directly to the local registry or when the domain GPO does not manage that specific value. Precedence must be verified and local GPO processing restricted.'},
            },
        },
        'mcq-4-019': {
            "explanation": 'Full automation is appropriate when the signal is high-confidence and the action is low-regret. Isolation of a host confirmed to be talking to known C2 infrastructure and quarantine of a file detected by multiple independent engines both meet that bar. Failed-login bursts, dark-web credential matches, generic parent-child process alerts, and disk-space warnings are each too ambiguous or too broad to act on without human review.',
        },
        'mcq-4-041': {
            "explanation": 'Evidence is classified by its form: real evidence is a physical object (the hard drive), documentary evidence is a writing or record (the printed log), demonstrative evidence illustrates testimony (a chart or diagram), and testimonial evidence is a sworn statement (the expert witness). The printed log is therefore documentary, not demonstrative.',
        },
        'mcq-4-052': {
            "explanation": 'False rejection rate (FRR) is the share of legitimate users who are wrongly refused; false acceptance rate (FAR) is the share of impostors wrongly admitted. Enrolling several fingerprints per user gives genuine users a fallback without loosening the match threshold, and tuning to the crossover error rate balances FAR against FRR instead of over-optimising one. Lowering the threshold would raise FAR, raising it would worsen FRR, and removing the biometric factor discards inherence entirely.',
        },
    }

    for _qid, _fix in TEXT_FIXES.items():
        _q = items.get(_qid)
        if _q is None:
            continue
        for _field in ("explanation", "context"):
            if _field in _fix and _q.get(_field) != _fix[_field]:
                _q[_field] = _fix[_field]
                changed.append(f"{_qid}:{_field}")
        if "key" in _fix and _q.get("correctOptionIds") != _fix["key"]:
            _q["correctOptionIds"] = _fix["key"]
            changed.append(f"{_qid}:key")
        for _oid, _ov in (_fix.get("options") or {}).items():
            for _o in _q.get("options", []):
                if _o["id"] != _oid:
                    continue
                if _o["text"] != _ov["text"]:
                    _o["text"] = _ov["text"]
                    changed.append(f"{_qid}:{_oid}.text")
                if _o.get("rationale") != _ov["rationale"]:
                    _o["rationale"] = _ov["rationale"]
                    changed.append(f"{_qid}:{_oid}.rationale")

    return changed


if __name__ == "__main__":
    _bank = json.loads(BANK.read_text())
    _changed = apply(_bank)
    BANK.write_text(json.dumps(_bank, indent=2, ensure_ascii=False) + "\n")
    print(f"OK: {len(_changed)} change(s)")
    for _c in _changed:
        print("  ", _c)
