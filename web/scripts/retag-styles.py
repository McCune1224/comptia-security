#!/usr/bin/env python3
"""Re-tag the Security+ MCQ bank with a practice-style dimension.

Before this script the validator forced every MCQ to format 'scenario', so 100% of
the bank required a paragraph `context`. CompTIA's real exam is a mix of
self-contained definition questions, BEST/MOST/FIRST decision questions, short-form
items, and paragraph scenarios. This script:

  * sets format 'standard' on every MCQ (format now only separates pbq from mcq),
  * tags BEST/MOST/FIRST/LEAST/GREATEST prompts as 'keyword',
  * keeps the longest-context remaining MCQs as 'scenario' (paragraph),
  * folds the shorter contexts into the prompt and tags them 'recall' so the
    question is self-contained (no "read the context" dependency).

The number of scenario items is held near TARGET_SCENARIO so paragraph questions
become a minority of the bank rather than 100%.
"""
import json
import re
from pathlib import Path

BANK = Path(__file__).resolve().parent.parent / "src/lib/server/data/question-bank.json"
TARGET_SCENARIO = 108  # ~25% of the ~432-item bank after ~100 new questions are added

KEYWORD = re.compile(r"\b(BEST|MOST|FIRST|NEXT|LEAST|GREATEST)\b", re.I)


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def main() -> None:
    bank = json.loads(BANK.read_text())
    mcqs = bank["mcqs"]
    for q in mcqs:
        q["format"] = "standard"

    keyword = [q for q in mcqs if KEYWORD.search(q["prompt"])]
    nonkeyword = [q for q in mcqs if not KEYWORD.search(q["prompt"])]

    # Keep the longest-context non-keyword MCQs as scenario; fold the rest.
    nonkeyword.sort(key=lambda q: len(q.get("context") or ""), reverse=True)
    scenario_keep = nonkeyword[:TARGET_SCENARIO]
    fold = nonkeyword[TARGET_SCENARIO:]

    seen = {normalize(q["prompt"]) for q in mcqs}
    folded_count = 0
    for q in fold:
        ctx = (q.get("context") or "").strip()
        prompt = q["prompt"].strip()
        merged = f"{ctx} {prompt}" if ctx else prompt
        merged = re.sub(r"\s+", " ", merged).strip()
        # Guard prompt uniqueness after folding.
        base = normalize(merged)
        suffix = 2
        while base in seen:
            merged = f"{merged} (Given the scenario above.)"
            base = normalize(merged)
            suffix += 1
        q["prompt"] = merged
        q["context"] = None
        q["style"] = "recall"
        seen.add(base)
        folded_count += 1

    for q in scenario_keep:
        q["style"] = "scenario"

    for q in keyword:
        q["style"] = "keyword"

    # Sanity: every MCQ must now carry a style.
    missing = [q["id"] for q in mcqs if not q.get("style")]
    assert not missing, f"MCQs missing style: {missing[:5]}"

    bank["mcqs"] = mcqs
    BANK.write_text(json.dumps(bank, indent=2, ensure_ascii=False) + "\n")

    from collections import Counter
    styles = Counter(q["style"] for q in mcqs)
    print("Retag complete:")
    for s, n in styles.most_common():
        print(f"  {s:12} {n}")
    print(f"  total       {len(mcqs)}")
    print(f"  folded      {folded_count}")
    print(f"  keyword     {len(keyword)}")
    print(f"  scenario    {len(scenario_keep)}")


if __name__ == "__main__":
    main()
