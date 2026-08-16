#!/usr/bin/env python3
"""Expand and repair the Security+ SY0-701 bank (idempotent by question id).

Follows the bank-lib.py merge pattern: every question is keyed by id, and
re-running the script never duplicates content. Fragment files live in
web/scripts/data/security-frags/ and use this shape:

    {
      "mcqs": [ {full question definition}, ... ],   # appended when new
      "pbqs": [ {full question definition}, ... ],   # appended when new
      "hints": { "mcq-1-001": "answer-neutral hint text", ... },
      "sourceRefs": { "mcq-1-001": [ {"source": "...", "section": "..."} ] },
      "retags": { "mcq-2-013": "2.3" },
      "replace": { "mcq-1-024": { ...full replacement question... } }
    }

- "mcqs"/"pbqs": added only when the id is not already in the bank.
- "hints": sets the authored `hint` field (overwrites, idempotent).
- "sourceRefs": replaces the `sourceRefs` array (idempotent).
- "retags": corrects the `objective` field (idempotent; the locked objective
  totals must be restored by pairing every retag with a rebalance rewrite).
- "replace": swaps the full question definition (idempotent by id).

Usage:
    python3 web/scripts/expand-security-objective-audit.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import importlib

alib = importlib.import_module("bank-lib")
load_bank, save_bank = alib.load_bank, alib.save_bank

FRAGS = Path(__file__).resolve().parent / "data" / "security-frags"


def main():
    bank = load_bank()
    existing = {q["id"] for q in bank["mcqs"]} | {q["id"] for q in bank["pbqs"]}
    added_mcqs = added_pbqs = 0
    hints = refs = retags = replaces = 0
    for frag_path in sorted(FRAGS.glob("*.json")):
        frag = json.load(open(frag_path))
        for q in frag.get("mcqs", []):
            if q["id"] in existing:
                continue
            bank["mcqs"].append(q)
            existing.add(q["id"])
            added_mcqs += 1
        for q in frag.get("pbqs", []):
            if q["id"] in existing:
                continue
            bank["pbqs"].append(q)
            existing.add(q["id"])
            added_pbqs += 1
        for qid, hint in (frag.get("hints") or {}).items():
            if ":" in qid:
                parent_id, step_id = qid.split(":", 1)
                parent = next((q for q in bank["mcqs"] + bank["pbqs"] if q["id"] == parent_id), None)
                if parent is None or parent.get("kind") != "multi-step":
                    print(f"WARN: child hint for unknown parent {parent_id}")
                    continue
                step = next((s for s in parent["steps"] if s.get("id") == step_id), None)
                if step is None:
                    print(f"WARN: child hint for unknown step {qid}")
                    continue
                step["hint"] = hint
                hints += 1
                continue
            target = next((q for q in bank["mcqs"] + bank["pbqs"] if q["id"] == qid), None)
            if target is None:
                print(f"WARN: hint for unknown id {qid}")
                continue
            target["hint"] = hint
            hints += 1
        for qid, source_refs in (frag.get("sourceRefs") or {}).items():
            target = next((q for q in bank["mcqs"] + bank["pbqs"] if q["id"] == qid), None)
            if target is None:
                print(f"WARN: sourceRefs for unknown id {qid}")
                continue
            target["sourceRefs"] = source_refs
            refs += 1
        for qid, objective in (frag.get("retags") or {}).items():
            target = next((q for q in bank["mcqs"] + bank["pbqs"] if q["id"] == qid), None)
            if target is None:
                print(f"WARN: retag for unknown id {qid}")
                continue
            target["objective"] = objective
            retags += 1
        for qid, replacement in (frag.get("replace") or {}).items():
            target = next((q for q in bank["mcqs"] + bank["pbqs"] if q["id"] == qid), None)
            if target is None:
                print(f"WARN: replace for unknown id {qid}")
                continue
            target.clear()
            target.update(replacement)
            replaces += 1
    if added_mcqs or added_pbqs or hints or refs or retags or replaces:
        save_bank(bank)
    print(
        f"Merged {added_mcqs} MCQs + {added_pbqs} PBQs; applied {hints} hints, "
        f"{refs} sourceRef sets, {retags} retags, {replaces} replacements. "
        f"Bank now: {len(bank['mcqs'])} MCQs, {len(bank['pbqs'])} PBQs."
    )


if __name__ == "__main__":
    main()
