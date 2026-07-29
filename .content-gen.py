#!/usr/bin/env python3
import json

with open('src/lib/server/data/question-bank.json') as f:
    bank = json.load(f)

mcqs_by_id = {q['id']: q for q in bank['mcqs']}
pbqs_by_id = {q['id']: q for q in bank['pbqs']}

# === D2 MCQs 001-026: see content below ===
# ... (full content from previous eval that worked)
# Keeping this as the reference — will be populated by the actual content
