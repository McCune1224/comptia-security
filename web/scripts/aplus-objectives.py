#!/usr/bin/env python3
"""Extract the authoritative A+ V15 objective skeleton from the official
objectives PDFs — objective ids + titles per domain, domain weights, and the
acronym lists. Reads pdftotext -layout output (two-column layout preserved).

Usage:
    pdftotext -layout aplus-220-1201-objectives.pdf /tmp/aplus-1201-layout.txt
    pdftotext -layout aplus-220-1202-objectives.pdf /tmp/aplus-1202-layout.txt
    python3 web/scripts/aplus-objectives.py /tmp/aplus-1201-layout.txt /tmp/aplus-1202-layout.txt

Outputs:
    web/scripts/data/aplus-objectives-1201.json
    web/scripts/data/aplus-objectives-1202.json
"""
import json
import re
import sys
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent / "data"

DOMAIN_HEADER = re.compile(r"^\s*([1-5])\.0\s+([A-Za-z].*?)\s+(\d+)%\s*$")
OBJECTIVE = re.compile(r"^\s*([1-5])\.(\d{1,2})\s{2,}([A-Z].*)$")
BULLET = re.compile(r"^\s*[•−◦ը-]\s*")
ACRONYM_ROW = re.compile(r"^([A-Za-z0-9+./-]{1,24})\s{2,}(.+)$")
FOOTER = re.compile(r"^CompTIA A\+", re.I)


def parse(path: Path):
    lines = path.read_text().splitlines()
    domains: dict[int, str] = {}
    weights: dict[int, int] = {}
    objectives: dict[str, dict] = {}
    acronyms: dict[str, str] = {}
    current: dict | None = None
    in_acronyms = False

    for raw in lines:
        line = raw.rstrip()
        if not line.strip():
            continue
        if FOOTER.match(line.strip()) or line.strip().startswith("Copyright"):
            current = None
            in_acronyms = False
            continue
        if line.strip().startswith("ACRONYM") and "DEFINITION" in line:
            in_acronyms = True
            continue
        m = DOMAIN_HEADER.match(line)
        if m:
            domains[int(m.group(1))] = m.group(2).strip()
            weights[int(m.group(1))] = int(m.group(3))
            current = None
            in_acronyms = False
            continue
        if in_acronyms:
            m = ACRONYM_ROW.match(line)
            if m and len(m.group(2).strip()) > 6:
                acronyms[m.group(1).strip()] = m.group(2).strip()
            continue
        m = OBJECTIVE.match(line)
        if m:
            obj_id = f"{m.group(1)}.{m.group(2)}"
            objectives[obj_id] = {
                "domain": int(m.group(1)),
                "id": obj_id,
                "title": m.group(3).strip(),
            }
            current = objectives[obj_id]
            continue
        if current is not None:
            # Titles wrap at most once; a wrapped line is indented and starts lowercase.
            stripped = line.strip()
            if (
                not BULLET.match(line)
                and re.match(r"^([a-z]|\([A-Z])", stripped)
                and current.get("_wrapped") is None
            ):
                current["title"] += " " + stripped
                current["_wrapped"] = True
                continue
            # Anything else (bullet, numbered step, other column) ends the title.
            current = None

    by_domain: dict[int, list[str]] = {}
    titles: dict[str, str] = {}
    for obj_id, info in sorted(objectives.items(), key=lambda kv: (kv[1]["domain"], kv[0])):
        by_domain.setdefault(info["domain"], []).append(obj_id)
        title = re.sub(r"[\t ]+\.$", "", info["title"]).strip()
        titles[obj_id] = title
    return {"domains": domains, "weights": weights, "objectives": by_domain, "titles": titles, "acronyms": acronyms}


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for label, path_str in (("1201", sys.argv[1]), ("1202", sys.argv[2])):
        skeleton = parse(Path(path_str))
        out = OUT_DIR / f"aplus-objectives-{label}.json"
        out.write_text(json.dumps(skeleton, indent=2) + "\n")
        per_domain = {str(k): len(v) for k, v in skeleton["objectives"].items()}
        total = sum(len(v) for v in skeleton["objectives"].values())
        print(f"{label}: domains={per_domain} total={total} acronyms={len(skeleton['acronyms'])}")
        for obj_id, title in skeleton["titles"].items():
            print(f"  {obj_id}: {title}")


if __name__ == "__main__":
    main()
