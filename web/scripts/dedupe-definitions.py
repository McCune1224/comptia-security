#!/usr/bin/env python3
"""Deduplicate the "Which security term is defined as" item family.

The bank carries a large family of thin definition items. Duplicates exist
because the same core term (Kerberos, SNMP, VLAN, RADIUS, TACACS+, Syslog,
DNSSEC, TLS, IPsec, LDAP, microsegmentation) was authored more than once.

Rule (systematic, not per-pair):
  1. Group every definition item by its keyed answer text. An item whose key
     does not resolve to one of its own options is skipped and never grouped,
     so a malformed item cannot be silently deleted.
  2. Within a group, keep the item the coverage manifest references; among
     those, keep the longest prompt; break any remaining tie by lowest id
     number. The manifest reference is the primary criterion.
  3. Delete the rest.
  4. Refuse to drop any question the coverage manifest still references.

Idempotent: re-running prints the same final state and zero removals.

Usage:
    python3 web/scripts/dedupe-definitions.py     # apply standalone
    python3 web/scripts/repair-question-bank.py   # preferred: run the pipeline
"""
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
BANK = REPO / "web" / "src" / "lib" / "server" / "data" / "question-bank.json"
COVERAGE = REPO / "web" / "src" / "lib" / "server" / "data" / "security-objective-coverage.json"


def _manifest_refs():
    coverage = json.loads(COVERAGE.read_text())
    refs = set()
    for objective in coverage["objectives"]:
        for topic in objective["topics"]:
            refs |= set(topic["questionIds"])
    return refs


def _is_definition(q):
    return (
        q.get("kind") == "single-choice"
        and q.get("prompt", "").startswith("Which security term is defined as")
        and q.get("correctOptionIds")
    )


def _keyed_term(q):
    """Return the keyed option's text, or None when the key resolves to no option."""
    for option in q.get("options", []):
        if option["id"] in q["correctOptionIds"]:
            return option["text"]
    return None


def apply(bank):
    """Remove duplicate definition items from `bank` in place.

    Returns a list of change labels, empty when there is nothing to drop.
    """
    refs = _manifest_refs()

    groups = {}
    for q in bank["mcqs"]:
        if not _is_definition(q):
            continue
        term = _keyed_term(q)
        if term is None:
            print(f"SKIP (unresolved key): {q['id']}")
            continue
        groups.setdefault(term, []).append(q)

    drop = set()
    for term, items in groups.items():
        if len(items) < 2:
            continue
        ranked = sorted(
            items,
            key=lambda q: (
                q["id"] in refs,               # manifest-referenced first
                len(q["prompt"]),              # then the richest prompt
                -int(q["id"].split("-")[-1]),  # then the lowest id number
            ),
            reverse=True,
        )
        for q in ranked[1:]:
            if q["id"] in refs:
                print(f"KEEP (manifest): {q['id']} for {term}")
                continue
            drop.add(q["id"])

    if not drop:
        return []

    bank["mcqs"] = [q for q in bank["mcqs"] if q["id"] not in drop]
    return [f"-{qid}" for qid in sorted(drop)]


if __name__ == "__main__":
    _bank = json.loads(BANK.read_text())
    _changed = apply(_bank)
    if _changed:
        BANK.write_text(json.dumps(_bank, indent=2, ensure_ascii=False) + "\n")
        print(f"dropped {len(_changed)} duplicate definition item(s):")
        for _c in _changed:
            print("  ", _c[1:])
    else:
        print("0 duplicate definition item(s); bank unchanged")
