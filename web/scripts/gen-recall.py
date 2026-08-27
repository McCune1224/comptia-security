#!/usr/bin/env python3
"""Generate self-contained recall + short-form Security+ MCQs from a curated fact base.

Reads scripts/data/secp-facts.json and appends valid MCQ definitions to the bank,
assigning collision-free per-domain ids. Recall items are single-choice definition
questions; short-form items are word-bank questions. All inherit the style dimension
the validator requires (recall / short-form).
"""
import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BANK = ROOT / "src/lib/server/data/question-bank.json"
FACTS = ROOT / "scripts/data/secp-facts.json"
FACTS_EXTRA = ROOT / "scripts/data/secp-facts-extra.json"

random.seed(701)

def norm(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def unique_prompt(base: str, existing) -> str:
    """Return a prompt guaranteed not in `existing`, using a counter suffix."""
    if norm(base) not in existing:
        return base
    i = 2
    while norm(f"{base} (variant {i})") in existing:
        i += 1
    return f"{base} (variant {i})"


def dedupe_facts(items, key="prompt"):
    """Drop facts whose identifying text already appeared earlier in the list."""
    seen = set()
    out = []
    for f in items:
        p = norm(f.get(key, ""))
        if p in seen:
            continue
        seen.add(p)
        out.append(f)
    return out

def main() -> None:
    bank = json.loads(BANK.read_text())
    facts = json.loads(FACTS.read_text())
    if FACTS_EXTRA.exists():
        extra = json.loads(FACTS_EXTRA.read_text())
        for key in ("recall", "shortform", "kw"):
            facts[key] = facts.get(key, []) + extra.get(key, [])
    recall = dedupe_facts(facts["recall"], key="t")
    shortform = dedupe_facts(facts["shortform"], key="p")
    facts["kw"] = dedupe_facts(facts.get("kw", []), key="stem")

    # Per-domain id counter, continuing past the largest existing number.
    maxnum = {}
    for q in bank["mcqs"]:
        m = re.match(r"^mcq-(\d)-(\d{3})$", q["id"])
        if m:
            d = int(m.group(1))
            maxnum[d] = max(maxnum.get(d, 0), int(m.group(2)))
    nextnum = {d: maxnum.get(d, 0) + 1 for d in range(1, 6)}

    def new_id(domain: int) -> str:
        nid = f"mcq-{domain}-{nextnum[domain]:03d}"
        nextnum[domain] += 1
        return nid

    existing_prompts = {norm(q["prompt"]) for q in bank["mcqs"]} | {
        norm(q["prompt"]) for q in bank["pbqs"]
    }

    all_terms = [f["t"] for f in recall]
    new_mcqs = []

    # ---- Recall (single-choice definition questions) ----
    for f in recall:
        dom, obj, term, definition = f["dom"], f["obj"], f["t"], f["d"]
        prompt = f'Which security term is defined as: "{definition}"?'
        if norm(prompt) in existing_prompts:
            continue
        candidates = [t for t in all_terms if t != term]
        random.shuffle(candidates)
        distractors = candidates[:3]
        options = [term] + distractors
        random.shuffle(options)
        opt_defs = []
        correct = None
        for i, text in enumerate(options):
            oid = chr(ord("a") + i)
            if text == term:
                correct = oid
                rationale = f"{term} is the term that matches this definition."
            else:
                rationale = f"{text} does not match the definition given."
            opt_defs.append({"id": oid, "text": text, "rationale": rationale})
        explanation = f"{term}: {definition}"
        if f.get("x"):
            explanation = f"{explanation} {f['x']}"
        new_mcqs.append(
            {
                "id": new_id(dom),
                "domain": dom,
                "objective": obj,
                "format": "standard",
                "style": "recall",
                "prompt": prompt,
                "kind": "single-choice",
                "options": opt_defs,
                "correctOptionIds": [correct],
                "selectCount": 1,
                "explanation": explanation,
                "hint": f"Consider the Security+ objective {obj} concept that fits this description.",
                "sourceRefs": [
                    {"source": "comptia", "section": obj},
                    {"source": "professor-messer", "section": f"SY0-701 {obj}"},
                ],
            }
        )
        existing_prompts.add(norm(prompt))

    # ---- Keyword (BEST/MOST/FIRST/LEAST) scenario questions ----
    for s in facts.get("kw", []):
        dom, obj = s["dom"], s["obj"]
        prompt = s["stem"]
        if norm(prompt) in existing_prompts:
            continue
        opts = s["options"]
        if len(opts) != 4:
            raise SystemExit(f"kw fact needs exactly 4 options: {prompt[:40]}")
        correct_idx = int(s["correct"])
        opt_defs = []
        for i, text in enumerate(opts):
            oid = chr(ord("a") + i)
            if i == correct_idx:
                rationale = f"Correct: {s['explanation']}"
            else:
                rationale = f"Incorrect: {text} addresses a different concern than the one the scenario asks about."
            opt_defs.append({"id": oid, "text": text, "rationale": rationale})
        new_mcqs.append(
            {
                "id": new_id(dom),
                "domain": dom,
                "objective": obj,
                "format": "standard",
                "style": "keyword",
                "prompt": prompt,
                "kind": "single-choice",
                "options": opt_defs,
                "correctOptionIds": [chr(ord("a") + correct_idx)],
                "selectCount": 1,
                "explanation": s["explanation"],
                "hint": s.get("hint")
                or "Identify the option that most directly satisfies the constraint stated in the scenario.",
                "sourceRefs": [
                    {"source": "comptia", "section": obj},
                    {"source": "professor-messer", "section": f"SY0-701 {obj}"},
                ],
            }
        )
        existing_prompts.add(norm(prompt))

    # ---- Short-form (word-bank questions) ----
    pool = []
    for s in shortform:
        pool += s["a"]
    pool = list(dict.fromkeys(pool))  # dedupe, keep order

    for s in shortform:
        dom, obj = s["dom"], s["obj"]
        blanks = s["b"]
        answers = s["a"]
        if len(blanks) != len(answers):
            raise SystemExit(f"shortform mismatch: {s}")
        # Distractors: plausible terms not in the correct set.
        correct_set = set(answers)
        distractors = [w for w in pool if w not in correct_set]
        random.shuffle(distractors)
        distractors = distractors[: max(2, len(blanks) + 1 - len(answers))]
        words = answers + distractors
        random.shuffle(words)
        blank_defs = [{"id": f"b{i+1}", "label": blanks[i]} for i in range(len(blanks))]
        bank_defs = [{"id": f"w{i+1}", "word": words[i]} for i in range(len(words))]
        correct_assign = {}
        for i, ans in enumerate(answers):
            wid = f"w{words.index(ans) + 1}"
            correct_assign[f"b{i+1}"] = wid
        prompt = s["p"]
        if norm(prompt) in existing_prompts:
            continue
        new_mcqs.append(
            {
                "id": new_id(dom),
                "domain": dom,
                "objective": obj,
                "format": "standard",
                "style": "short-form",
                "prompt": prompt,
                "kind": "word-bank",
                "blanks": blank_defs,
                "bank": bank_defs,
                "correctAssignments": correct_assign,
                "explanation": "Fill each blank with the term that correctly completes the statement.",
                "hint": f"Match each blank to the Security+ objective {obj} term that fits.",
                "sourceRefs": [
                    {"source": "comptia", "section": obj},
                    {"source": "professor-messer", "section": f"SY0-701 {obj}"},
                ],
            }
        )
        existing_prompts.add(norm(prompt))

    bank["mcqs"].extend(new_mcqs)
    BANK.write_text(json.dumps(bank, indent=2, ensure_ascii=False) + "\n")

    from collections import Counter
    styles = Counter(q["style"] for q in bank["mcqs"])
    kw_added = sum(1 for q in new_mcqs if q["style"] == "keyword")
    rec_added = sum(1 for q in new_mcqs if q["style"] == "recall")
    sf_added = sum(1 for q in new_mcqs if q["style"] == "short-form")
    print(f"Added {len(new_mcqs)} MCQs (recall {rec_added}, keyword {kw_added}, short-form {sf_added}).")
    print("New bank style totals:")
    for s, n in styles.most_common():
        print(f"  {s:12} {n}")
    print(f"  total       {len(bank['mcqs'])}")


if __name__ == "__main__":
    main()
