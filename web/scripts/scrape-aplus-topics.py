#!/usr/bin/env python3
"""Build the per-objective topic map for the A+ V15 courses from Professor
Messer's FREE training-course index pages (public page structure: objective
headers + video titles). Legal line: video titles are public page structure,
NOT the videos, transcripts, or his paid course notes — never scrape those.

Usage (markdown cache or raw HTML both work):
    python3 web/scripts/scrape-aplus-topics.py 1201 <index-file-or-url>
    python3 web/scripts/scrape-aplus-topics.py 1202 <index-file-or-url>

Outputs:
    web/scripts/data/aplus-topics-1201.json
    web/scripts/data/aplus-topics-1202.json
"""
import json
import re
import sys
import urllib.request
from html import unescape
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent / "data"

# 1201: https://www.professormesser.com/free-a-plus-training/220-1201/220-1201-video/220-1201-training-course/
# 1202: https://www.professormesser.com/free-a-plus-training/220-1202/220-1202-video/220-1202-training-course/


def fetch(path_or_url: str) -> str:
    if path_or_url.startswith(("http://", "https://")):
        with urllib.request.urlopen(path_or_url, timeout=30) as response:
            return response.read().decode("utf-8", errors="replace")
    return Path(path_or_url).read_text(errors="replace")


def strip_tags(html: str) -> str:
    return unescape(re.sub(r"<[^>]+>", "", html)).strip()


def parse(raw: str):
    entries: list[tuple[int, str]] = []  # (heading level, text)
    for m in re.finditer(r"<(h3|h4)[^>]*>(.*?)</\1>", raw, re.S | re.I):
        entries.append((3 if m.group(1) == "h3" else 4, strip_tags(m.group(2)).strip()))
    if not entries:
        for m in re.finditer(r"^(#{3,4})\s+(.+)$", raw, re.M):
            entries.append((3 if m.group(1) == "###" else 4, m.group(2).strip()))

    sections: dict[str, dict] = {}
    current = None
    for level, text in entries:
        text = re.sub(r"\s+", " ", text).strip()
        if level == 3:
            match = re.match(r"^([1-5])\.(\d{1,2})\s*[–—-]\s*(.+)$", text)
            if match:
                obj_id = f"{match.group(1)}.{match.group(2)}"
                current = obj_id
                sections[obj_id] = {"title": match.group(3).strip(), "topics": []}
            else:
                current = None
        elif level == 4 and current:
            title = re.sub(r"^\[([^\]]+)\]\([^)]*\)$", r"\1", text).strip()
            title = re.sub(r"\s*\(\d{1,2}:\d{2}\)\s*$", "", title).strip()
            if title:
                sections[current]["topics"].append(title)
    return sections


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    label, source = sys.argv[1], sys.argv[2]
    sections = parse(fetch(source))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"aplus-topics-{label}.json"
    out.write_text(json.dumps(sections, indent=2) + "\n")
    total = sum(len(s["topics"]) for s in sections.values())
    print(f"{label}: {len(sections)} objectives, {total} video topics")
    thin = {k: v for k, v in sections.items() if len(v["topics"]) < 3}
    print(f"thin (<3 topics — authoring attention areas): {list(thin) or 'none'}")


if __name__ == "__main__":
    main()
