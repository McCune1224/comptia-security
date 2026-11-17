#!/usr/bin/env python3
"""Parse the official SY0-701 objectives PDF text into per-objective bullet text,
then score every bank item against every objective block to find mis-tags."""
import json, re, math, collections

OBJFILE = '/tmp/sy0701/objectives.txt'
BANK = '/home/mckusa/Documents/comptia-security/web/src/lib/server/data/question-bank.json'

raw = open(OBJFILE, encoding='utf-8').read()
lines = raw.split('\n')

# find objective anchors like "1.1   Compare and contrast..."
anchors = []
for i, ln in enumerate(lines):
    m = re.match(r'^\s*(\d\.\d)\s{2,}(.+)$', ln)
    if m:
        anchors.append((i, m.group(1), m.group(2).strip()))

print(f"anchors: {len(anchors)}")
blocks = {}
for idx, (i, num, title) in enumerate(anchors):
    end = anchors[idx + 1][0] if idx + 1 < len(anchors) else len(lines)
    body = '\n'.join(lines[i + 1:end])
    # strip running headers/footers
    body = re.sub(r'CompTIA Security\+ SY0-701 Certification Exam: Exam Objectives Version 5\.0', ' ', body)
    body = re.sub(r'Copyright © 2023 CompTIA, Inc\. All rights reserved\.', ' ', body)
    body = re.sub(r'\d\.0 \| [A-Za-z ,]+', ' ', body)
    blocks[num] = {'title': title, 'body': body}

missing = [f"{d}.{n}" for d in range(1, 6) for n in range(1, 7) if f"{d}.{n}" not in blocks]
print("missing objective anchors:", missing)
for k in sorted(blocks):
    print(f"  {k}: {blocks[k]['title']}  ({len(blocks[k]['body'])} chars)")

# ---------- build matcher ----------
STOP = set('a an the of to in for on with and or is are was were be been being as by from that this it its which '
           'what when where who how not no all any each other than then so such can may will would should could into '
           'over under about more most less least best first next using used use within without across after before '
           'during between both either neither one two three include includes including various types explain given '
           'scenario compare contrast apply summarize implement maintain describe importance purpose elements'.split())
W = re.compile(r"[A-Za-z][A-Za-z0-9+#\-\.]{1,}")


def toks(t):
    return [w for w in (x.strip('.-').lower() for x in W.findall(t)) if len(w) > 2 and w not in STOP]


sec_tf = {k: collections.Counter(toks(v['title'] + ' ' + v['title'] + ' ' + v['body'])) for k, v in blocks.items()}
df = collections.Counter()
for tf in sec_tf.values():
    for w in tf:
        df[w] += 1
N = len(sec_tf)
idf = {w: math.log((N + 1) / (c + 0.5)) for w, c in df.items()}
vec = {}
for k, tf in sec_tf.items():
    v = {w: (1 + math.log(c)) * idf[w] for w, c in tf.items()}
    n = math.sqrt(sum(x * x for x in v.values())) or 1
    vec[k] = {w: x / n for w, x in v.items()}
index = collections.defaultdict(list)
for k, v in vec.items():
    for w in v:
        index[w].append(k)


def rank(text):
    tf = collections.Counter(toks(text))
    v = {w: (1 + math.log(c)) * idf[w] for w, c in tf.items() if w in idf}
    n = math.sqrt(sum(x * x for x in v.values())) or 1
    v = {w: x / n for w, x in v.items()}
    s = collections.Counter()
    for w, x in v.items():
        for k in index[w]:
            s[k] += x * vec[k][w]
    return s


d = json.load(open(BANK))


def text_of(it):
    parts = [it.get('prompt', ''), it.get('context', ''), it.get('explanation', '')]
    for o in it.get('options') or []:
        parts.append(o.get('text', ''))
    for st in it.get('steps') or []:
        parts += [st.get('prompt', '')]
    for f in ('fields', 'premises', 'targets', 'items', 'buckets', 'lines', 'bank'):
        for x in it.get(f) or []:
            if isinstance(x, dict):
                parts += [str(x.get('text', '')), str(x.get('label', '')), str(x.get('word', ''))]
                for oo in x.get('options') or []:
                    parts.append(str(oo.get('text', '')))
            elif isinstance(x, str):
                parts.append(x)
    return ' '.join(p for p in parts if p)


rows = []
for kind in ('mcqs', 'pbqs'):
    for it in d[kind]:
        s = rank(text_of(it))
        if not s:
            continue
        best, bsc = s.most_common(1)[0]
        tagged = str(it.get('objective'))
        rows.append((it['id'], kind, tagged, best, round(bsc, 3), round(s.get(tagged, 0), 3),
                     [k for k, _ in s.most_common(3)]))

json.dump(rows, open('/tmp/sy0701/objective-fit.json', 'w'), indent=1)

agree = [r for r in rows if r[3] == r[2]]
print(f"\nitems: {len(rows)}  content-match agrees with tag: {len(agree)} ({len(agree)/len(rows)*100:.0f}%)")
strong_dis = [r for r in rows if r[3] != r[2] and r[4] >= 0.20 and r[4] > r[5] * 1.6]
print(f"strong disagreements (best match >=0.20 and >1.6x the tagged score): {len(strong_dis)}")
print("\n=== STRONG TAG DISAGREEMENTS (candidate mis-tags) ===")
for r in sorted(strong_dis, key=lambda x: -x[4]):
    print(f"  {r[0]:12} tagged {r[2]:5} -> content says {r[3]:5}  ({r[4]} vs {r[5]})")
