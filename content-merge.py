#!/usr/bin/env python3
"""Generate all remaining bank content in one shot."""
import json, sys

BANK_PATH = 'src/lib/server/data/question-bank.json'

with open(BANK_PATH) as f:
    bank = json.load(f)

mcqs_by_id = {q['id']: q for q in bank['mcqs']}
pbqs_by_id = {q['id']: q for q in bank['pbqs']}

is_bp_mcq = lambda q: 'making decision' in q['prompt'].lower()
is_bp_pbq = lambda q: any(p in (q.get('prompt','') + q.get('explanation','')).lower() for p in ['scenario reference', 'match each item to', 'calculate the ale', 'place the'])

need_mcq_ids = [q['id'] for q in bank['mcqs'] if is_bp_mcq(q)]
need_pbq_ids = [q['id'] for q in bank['pbqs'] if is_bp_pbq(q)]

if not need_mcq_ids and not need_pbq_ids:
    print("All content already written.")
    sys.exit(0)

print(f"Need to author: {len(need_mcq_ids)} MCQs, {len(need_pbq_ids)} PBQs")
sys.exit(1)  # Force follow-up
