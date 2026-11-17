#!/usr/bin/env python3
"""Map every bank item to its best-matching Dion study-guide section body."""
import json, re, math, collections, sys, os

BANK = '/home/mckusa/Documents/comptia-security/web/src/lib/server/data/question-bank.json'
DION = '/tmp/sy0701/dion-study-notes.txt'

# ---------- parse Dion into sections ----------
lines = open(DION, encoding='utf-8').read().split('\n')
starts = []
for i, ln in enumerate(lines):
    if ln.startswith('\u25cf') or ln.startswith('●'):
        starts.append(i)
starts.append(len(lines))
sections = []
for a, b in zip(starts, starts[1:]):
    title = re.sub(r'^[\u200b\s●]+', '', lines[a]).strip()
    body = '\n'.join(lines[a + 1:b])
    body = body.replace('\u200b', ' ')
    body = re.sub(r'CompTIA Security\+\s*\n?\(SY0-701\) \(Study Notes\)', ' ', body)
    body = re.sub(r'https?://\S+', ' ', body)
    body = re.sub(r'^\s*\d{1,3}\s*$', ' ', body, flags=re.M)
    sections.append({'title': title, 'body': body, 'line': a + 1})
# the first block before the first bullet belongs to Introduction
sections[0]['body'] = '\n'.join(lines[:starts[1]])

STOP = set("""a an the and or of to in for with on at by is are was were be been being this that these those
it its as from into than then there their they we you your our can could should would may might must will
which what who whom when where why how not no nor but if so such only own same very more most other some
also any both each few many only over under again further once here all about above below off out up down
between during before after while because both do does did doing have has had having i me my mine
use used using uses one two three four five six seven eight nine ten first second third
""".split())
WORD = re.compile(r"[A-Za-z][A-Za-z0-9+#\-\.]{1,}")


def toks(text):
    out = []
    for w in WORD.findall(text.lower()):
        w = w.strip('.-')
        if len(w) < 3 or w in STOP:
            continue
        out.append(w)
    return out


# ---------- build idf over section bodies ----------
sec_tf = []
df = collections.Counter()
for s in sections:
    tf = collections.Counter(toks(s['title'] + ' ' + s['title'] + ' ' + s['body']))
    sec_tf.append(tf)
    for w in tf:
        df[w] += 1
N = len(sections)
idf = {w: math.log((N + 1) / (c + 0.5)) for w, c in df.items()}
sec_vec = []
for tf in sec_tf:
    v = {w: (1 + math.log(c)) * idf[w] for w, c in tf.items()}
    n = math.sqrt(sum(x * x for x in v.values())) or 1
    sec_vec.append({w: x / n for w, x in v.items()})
sec_index = {w: [] for w in idf}
for i, v in enumerate(sec_vec):
    for w in v:
        sec_index[w].append(i)


def best_sections(text, k=3):
    tf = collections.Counter(toks(text))
    v = {w: (1 + math.log(c)) * idf[w] for w, c in tf.items() if w in idf}
    n = math.sqrt(sum(x * x for x in v.values())) or 1
    v = {w: x / n for w, x in v.items()}
    scores = collections.Counter()
    for w, x in v.items():
        for i in sec_index[w]:
            scores[i] += x * sec_vec[i][w]
    return [(sections[i]['title'], round(sc, 4)) for i, sc in scores.most_common(k)]


# ---------- load bank ----------
d = json.load(open(BANK))


def item_text(it):
    parts = [it.get('prompt', ''), it.get('context', ''), it.get('explanation', '')]
    for o in it.get('options') or []:
        parts.append(o.get('text', ''))
        parts.append(o.get('rationale', ''))
    for st in it.get('steps') or []:
        parts.append(st.get('prompt', ''))
        parts.append(st.get('explanation', ''))
        for o in st.get('options') or []:
            parts.append(o.get('text', ''))
    for f in ('items', 'targets', 'pairs', 'entries', 'tokens', 'rows', 'columns', 'lines'):
        for x in it.get(f) or []:
            if isinstance(x, dict):
                parts.extend(str(v) for v in x.values() if isinstance(v, str))
            elif isinstance(x, str):
                parts.append(x)
    return ' '.join(p for p in parts if p)


def cited_section(it):
    for r in it.get('sourceRefs') or []:
        if r.get('source') == 'study-guide':
            return (r.get('section') or '').strip()
    return ''


STOPWORDS_SECTION = None
results = []
for kind in ('mcqs', 'pbqs'):
    for it in d[kind]:
        b = best_sections(item_text(it), 3)
        results.append({
            'id': it['id'], 'domain': it.get('domain'), 'objective': it.get('objective'),
            'kind': it.get('kind'), 'bank': kind,
            'cited': cited_section(it),
            'top': b[0][0] if b else '', 'topScore': b[0][1] if b else 0,
            'alts': [t for t, _ in b[1:]],
        })

json.dump(results, open('/tmp/sy0701/item-section-map.json', 'w'), indent=1)


def norm(s):
    s = s.lower().replace('\u200b', ' ')
    s = re.sub(r'\(.*?\)', '', s)
    s = re.sub(r'[^a-z0-9]+', ' ', s).strip()
    return s


real = {norm(s['title']): s['title'] for s in sections}
agree = 0
cited_real = 0
weak_score = []
for r in results:
    c = norm(r['cited'])
    if c in real:
        cited_real += 1
        if c == norm(r['top']) or norm(r['top']) in r['cited'].lower() or r['cited'].lower() in r['top'].lower():
            agree += 1
    if r['topScore'] < 0.06:
        weak_score.append(r)

print(f"items: {len(results)}")
print(f"  cited a REAL Dion heading: {cited_real} ({cited_real/len(results)*100:.1f}%)")
print(f"  cited a real heading AND it matches best-content match: {agree}")
print(f"  low-confidence content match (<0.06): {len(weak_score)}")
print()
print("=== distribution of best-match score ===")
buckets = collections.Counter()
for r in results:
    s = r['topScore']
    b = '<.04' if s < .04 else '<.06' if s < .06 else '<.08' if s < .08 else '<.10' if s < .10 else '<.14' if s < .14 else '>=.14'
    buckets[b] += 1
for k in ['<.04', '<.06', '<.08', '<.10', '<.14', '>=.14']:
    print(f"  {k:6} {buckets[k]:4}")

print()
print("=== Dion sections with ZERO bank items attributed ===")
cov = collections.Counter(r['top'] for r in results)
zero = [s['title'] for s in sections if cov.get(s['title'], 0) == 0]
for t in zero:
    print('  -', t)
print(f"  ({len(zero)} of {len(sections)} sections uncovered)")

print()
print("=== thinnest covered sections (1-2 items) ===")
thin = sorted(((cov.get(s['title'], 0), s['title']) for s in sections if 0 < cov.get(s['title'], 0) <= 2))
for n, t in thin:
    print(f"  {n:2} {t}")
