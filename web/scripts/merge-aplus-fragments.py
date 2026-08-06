#!/usr/bin/env python3
"""Merge authored JSON fragments into an A+ bank (idempotent by question id).

Fragment files live in web/scripts/data/frags/ and look like:
    { "mcqs": [ {question...}, ... ], "pbqs": [ ... ] }
Questions in fragments must use the bank's ID scheme (a1-/a2-) and the same
shape as the merged bank. Missing keys default to empty.

Usage:
    python3 web/scripts/merge-aplus-fragments.py 1201
    python3 web/scripts/merge-aplus-fragments.py 1202
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import importlib

alib = importlib.import_module("aplus-lib")

FRAGS = Path(__file__).resolve().parent / "data/frags"


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    course = sys.argv[1]
    bank = alib.load_bank(course)
    existing = {q["id"] for q in bank["mcqs"]} | {q["id"] for q in bank["pbqs"]}
    added_mcqs = added_pbqs = skipped = 0
    for frag_path in sorted(FRAGS.glob(f"*{course}*.json")):
        frag = json.load(open(frag_path))
        for q in frag.get("mcqs", []):
            if q["id"] in existing:
                skipped += 1
                continue
            bank["mcqs"].append(q)
            existing.add(q["id"])
            added_mcqs += 1
        for q in frag.get("pbqs", []):
            if q["id"] in existing:
                skipped += 1
                continue
            bank["pbqs"].append(q)
            existing.add(q["id"])
            added_pbqs += 1
    alib.save_bank(bank, course)
    print(
        f"Merged {added_mcqs} MCQs + {added_pbqs} PBQs (skipped {skipped} existing). "
        f"Bank {course}: {len(bank['mcqs'])} MCQs, {len(bank['pbqs'])} PBQs."
    )


if __name__ == "__main__":
    main()
