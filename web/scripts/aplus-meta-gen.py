#!/usr/bin/env python3
"""Generate web/src/lib/server/aplus-meta.ts from the extracted objectives JSONs."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "scripts/data"
OUT = ROOT / "src/lib/server/aplus-meta.ts"


def load(label):
    return json.load(open(DATA / f"aplus-objectives-{label}.json"))


def objectives_ts(label, meta):
    by_domain = meta["objectives"]
    lines = [f"export const APLUS_{label}_OBJECTIVES: Record<number, ObjectiveId[]> = {{"]
    for domain in sorted(map(int, by_domain)):
        ids = by_domain[str(domain)]
        lines.append(f"\t{domain}: [{', '.join(repr(i) for i in ids)}],")
    lines.append("};")
    return "\n".join(lines)


def titles_ts(label, meta):
    titles = meta["titles"]
    lines = [f"export const APLUS_{label}_OBJECTIVE_TITLES: Record<ObjectiveId, string> = {{"]
    for obj_id in sorted(titles, key=lambda k: (int(k.split('.')[0]), int(k.split('.')[1]))):
        lines.append(f"\t{obj_id!r}: {titles[obj_id]!r},")
    lines.append("};")
    return "\n".join(lines)


def weights_ts(label, meta):
    weights = meta["weights"]
    body = ", ".join(f"{k}: {v}" for k, v in sorted(weights.items()))
    return f"export const APLUS_{label}_WEIGHTS: Record<number, number> = {{ {body} }};"


def main():
    m1, m2 = load("1201"), load("1202")
    parts = [
        "// Auto-generated from web/scripts/data/aplus-objectives-*.json via",
        "// web/scripts/aplus-meta-gen.py — do not hand-edit. Objective ids/titles are",
        "// extracted from the official CompTIA objectives PDFs (repo root).",
        "import type { ObjectiveId } from '$lib/types';",
        "",
        objectives_ts("1201", m1),
        "",
        titles_ts("1201", m1),
        "",
        weights_ts("1201", m1),
        "",
        objectives_ts("1202", m2),
        "",
        titles_ts("1202", m2),
        "",
        weights_ts("1202", m2),
        "",
    ]
    OUT.write_text("\n".join(parts))
    print(f"wrote {OUT} ({len(m1['objectives'])} + {len(m2['objectives'])} objectives)")


if __name__ == "__main__":
    main()
