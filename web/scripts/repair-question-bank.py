#!/usr/bin/env python3
"""Single entrypoint for the question-bank repair pipeline.

Runs every repair step in order against one in-memory copy of the bank and
writes the result exactly once, so a failure partway through leaves
question-bank.json untouched. Every step is idempotent, so running this on an
already-repaired bank reports zero changes and rewrites the same bytes.

Steps, in order:
  1. fix-bank-defects       structural and keying fixes
  2. fix-bank-defects-2     objective retags, duplicate definitions, context
  3. dedupe-definitions     remove duplicate "defined as" items
  4. fix-bank-defects-3     full read-through text fixes and retags

Usage:
    python3 web/scripts/repair-question-bank.py            # apply
    python3 web/scripts/repair-question-bank.py --check    # report only
"""
import importlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BANK = HERE.parent / "src" / "lib" / "server" / "data" / "question-bank.json"

STEPS = [
    "fix-bank-defects",
    "fix-bank-defects-2",
    "dedupe-definitions",
    "fix-bank-defects-3",
]


def main(argv):
    check_only = "--check" in argv[1:]
    sys.path.insert(0, str(HERE))

    bank = json.loads(BANK.read_text())
    total = 0
    for name in STEPS:
        step = importlib.import_module(name)
        changes = step.apply(bank)
        total += len(changes)
        print(f"{name}: {len(changes)} change(s)")
        for label in changes:
            print("   ", label)

    if check_only:
        print(f"check only: {total} change(s) pending; bank not written")
        return 1 if total else 0

    BANK.write_text(json.dumps(bank, indent=2, ensure_ascii=False) + "\n")
    print(f"pipeline complete: {total} change(s); wrote {BANK.name} once")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
