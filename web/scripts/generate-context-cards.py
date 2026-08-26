#!/usr/bin/env python3
"""Generate applied-context Anki cards from the question bank and merge into decks.

The bank's scenario questions already carry the applied reasoning the recall decks
lack. This derives one card per question (Front = prompt, Back = explanation) and
idempotently appends it to the matching deck file, skipping any Front that already
exists there. Because the Back is the bank's own explanation, a generated card can
never contradict the bank.

Targets:
  Dion 01..05 domain decks   -> tag secp701::dN::context
  V3 7_Scenario_Practice.csv -> tag N::Scenario   (MCQs)
  V3 8_PBQ_Practice.csv      -> tag PBQ::dN       (PBQs)

Re-run safely: existing fronts are never duplicated.
"""
import csv
import json
import os
import re
import sys
from pathlib import Path

# All derived context cards share one distinct tag so the generator can refresh
# (drop + re-append) them without touching the decks' hand-authored cards.
GEN_TAG_RE = re.compile(r'^secp701::d\d+::context$')


def refresh_target(path: Path) -> None:
    """Remove previously generated context cards from a deck, keeping the rest."""
    if not path.exists():
        return
    rows = read_rows(path)
    kept = [r for r in rows if not GEN_TAG_RE.match(r.get('Tags', ''))]
    with path.open('w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['Front', 'Back', 'Tags'])
        w.writeheader()
        for r in kept:
            w.writerow(r)

ROOT = Path(__file__).resolve().parent.parent.parent  # repo root
BANK = ROOT / 'web' / 'src/lib/server/data/question-bank.json'
DION = ROOT / 'anki' / 'Dion Security+ SY0-701'
V3 = ROOT / 'anki' / 'AI Security+' / 'V3'
V3_COMBINED = V3 / '_All_V3_Cards_Combined.csv'

DION_DOMAIN_FILES = {
    1: '01_Domain1_General_Security_Concepts.csv',
    2: '02_Domain2_Risk_Governance_Compliance.csv',
    3: '03_Domain3_Security_Architecture.csv',
    4: '04_Domain4_Security_Operations.csv',
    5: '05_Domain5_Security_Program_Management.csv',
}


def flatten(text: str) -> str:
    if not text:
        return ''
    return re.sub(r'\s+', ' ', text).strip()


def read_rows(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def existing_fronts(path: Path) -> set[str]:
    return {flatten(r.get('Front', '')) for r in read_rows(path) if r.get('Front')}


def append_rows(path: Path, rows: list[dict]) -> int:
    """Append rows whose Front is not already present. Returns count added."""
    path.parent.mkdir(parents=True, exist_ok=True)
    seen = existing_fronts(path)
    fresh = [r for r in rows if flatten(r['Front']) not in seen]
    if not fresh:
        return 0
    if os.environ.get('DRY_RUN'):
        print(f'    [dry-run] would add {len(fresh)} to {path.name}')
        return 0
    write_header = not path.exists() or path.stat().st_size == 0
    with path.open('a', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=['Front', 'Back', 'Tags'])
        if write_header:
            w.writeheader()
        for r in fresh:
            w.writerow(r)
    return len(fresh)


def main() -> int:
    bank = json.loads(BANK.read_text())
    dion_rows: dict[int, list[dict]] = {d: [] for d in DION_DOMAIN_FILES}
    v3_scenario: list[dict] = []
    v3_pbq: list[dict] = []

    for q in bank.get('mcqs', []):
        ctx = flatten(q.get('context', ''))
        prompt = flatten(q.get('prompt', ''))
        # Front must be self-contained: when the scenario lives in context (the
        # prompt is often just the question), prepend context so the card stands
        # alone in Anki.
        front = f'{ctx} {prompt}'.strip() if ctx else prompt
        back = flatten(q.get('explanation', ''))
        dom = q.get('domain')
        if not front or not back or dom not in DION_DOMAIN_FILES:
            continue
        dion_rows[dom].append({
            'Front': front,
            'Back': back,
            'Tags': f'secp701::d{dom}::context',
        })
        v3_scenario.append({
            'Front': front,
            'Back': back,
            'Tags': f'secp701::d{dom}::context',
        })

    for q in bank.get('pbqs', []):
        ctx = flatten(q.get('context', ''))
        prompt = flatten(q.get('prompt', ''))
        front = f'{ctx} {prompt}'.strip() if ctx else prompt
        back = flatten(q.get('explanation', ''))
        dom = q.get('domain')
        if not front or not back:
            continue
        v3_pbq.append({
            'Front': front,
            'Back': back,
            'Tags': f'secp701::d{dom}::context' if dom else 'secp701::context',
        })

    total = 0
    print('Dion domain decks:')
    for dom, fname in DION_DOMAIN_FILES.items():
        refresh_target(DION / fname)
        added = append_rows(DION / fname, dion_rows[dom])
        total += added
        print(f'  d{dom} {fname}: +{added}')
    print('V3 scenario practice:')
    refresh_target(V3 / '7_Scenario_Practice.csv')
    added = append_rows(V3 / '7_Scenario_Practice.csv', v3_scenario)
    total += added
    print(f'  7_Scenario_Practice.csv: +{added}')
    print('V3 PBQ practice:')
    refresh_target(V3 / '8_PBQ_Practice.csv')
    added = append_rows(V3 / '8_PBQ_Practice.csv', v3_pbq)
    total += added
    print(f'  8_PBQ_Practice.csv: +{added}')
    print('V3 combined deck (keep in sync with 7/8):')
    refresh_target(V3_COMBINED)
    added = append_rows(V3_COMBINED, v3_scenario + v3_pbq)
    total += added
    print(f'  _All_V3_Cards_Combined.csv: +{added}')

    print(f'Total cards added: {total}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
