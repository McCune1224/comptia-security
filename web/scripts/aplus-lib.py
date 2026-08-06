#!/usr/bin/env python3
"""Shared helpers for the A+ bank expansion scripts (mirrors bank-lib.py).

Each core has its own bank file; expand scripts target one core:
    load_bank("1201") / merge(bank, "1201", new_mcqs=[...], new_pbqs=[...])
"""
import json
from pathlib import Path

BANK_DIR = Path(__file__).resolve().parent.parent / "src/lib/server/data"
BANKS = {
    "1201": BANK_DIR / "aplus-1201-bank.json",
    "1202": BANK_DIR / "aplus-1202-bank.json",
}


def opt(id_, text, rationale):
    return {"id": id_, "text": text, "rationale": rationale}


def load_bank(course):
    with open(BANKS[course]) as f:
        return json.load(f)


def save_bank(bank, course):
    with open(BANKS[course], "w") as f:
        json.dump(bank, f, indent=2, ensure_ascii=False)
        f.write("\n")


def merge(bank, course, new_mcqs=None, new_pbqs=None):
    existing = set(q["id"] for q in bank["mcqs"]) | set(q["id"] for q in bank["pbqs"])
    added = 0
    for q in (new_mcqs or []) + (new_pbqs or []):
        if q["id"] in existing:
            print(f"SKIP (exists): {q['id']}")
            continue
        target = bank["pbqs"] if q["format"] == "pbq" else bank["mcqs"]
        target.append(q)
        existing.add(q["id"])
        added += 1
    if added:
        save_bank(bank, course)
    print(f"Added {added} questions. Bank {course} now: {len(bank['mcqs'])} MCQs, {len(bank['pbqs'])} PBQs.")


def count_check(bank, course):
    """Print per-domain/per-objective counts for the validator's locked numbers."""
    from collections import Counter

    mcq_domains = Counter(q["domain"] for q in bank["mcqs"])
    mcq_objectives = Counter(q["objective"] for q in bank["mcqs"])
    multi = Counter(q["domain"] for q in bank["mcqs"] if q["kind"] == "multiple-choice")
    pbq_domains = Counter(q["domain"] for q in bank["pbqs"])
    print(f"=== {course} bank: {len(bank['mcqs'])} MCQs / {len(bank['pbqs'])} PBQs ===")
    for domain in sorted(mcq_domains):
        print(
            f"  D{domain}: {mcq_domains[domain]} MCQs (multi={multi[domain]}), {pbq_domains[domain]} PBQs"
        )
    print("  per-objective MCQs:", dict(sorted(mcq_objectives.items())))
    print("  PBQ kinds:", dict(sorted(Counter(q["kind"] for q in bank["pbqs"]).items())))
