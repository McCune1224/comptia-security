#!/usr/bin/env python3
"""Shared helpers for bank expansion scripts (mirrors replace-domain2.py pattern)."""
import json
import sys
from pathlib import Path

BANK_PATH = Path(__file__).resolve().parent.parent / "src/lib/server/data/question-bank.json"


def opt(id_, text, rationale):
    return {"id": id_, "text": text, "rationale": rationale}


def load_bank():
    with open(BANK_PATH) as f:
        return json.load(f)


def save_bank(bank):
    with open(BANK_PATH, "w") as f:
        json.dump(bank, f, indent=2, ensure_ascii=False)
        f.write("\n")


def merge(bank, new_mcqs=None, new_pbqs=None):
    existing = set(q["id"] for q in bank["mcqs"]) | set(q["id"] for q in bank["pbqs"])
    added = 0
    for q in (new_mcqs or []) + (new_pbqs or []):
        if q["id"] in existing:
            print(f"SKIP (exists): {q['id']}")
            continue
        target = bank["pbqs"] if q["id"].startswith("pbq-") else bank["mcqs"]
        target.append(q)
        existing.add(q["id"])
        added += 1
    if added:
        save_bank(bank)
    print(f"Added {added} questions. Bank now: {len(bank['mcqs'])} MCQs, {len(bank['pbqs'])} PBQs.")
