#!/usr/bin/env python3
"""Validate hints and context across the Security+ question bank.

Re-run whenever the bank changes. Emits a per-domain issue report and a JSON
findings file. The harness is the artifact a reviewer reruns; it does not edit
the bank.

Checks (deterministic, no LLM):
  HINT_LEAK          hint names a run of >=3 tokens from a correct option
  CONTEXT_LEAK       context names a run of >=3 tokens from a correct option
  EMPTY_CONTEXT      question has no context (or empty string)
  CONTEXT_INTERNAL_DUP  a sentence repeats inside one question's context
  DUP_CONTEXT        two questions share an identical normalized context
  NEAR_DUP_CONTEXT   two questions share >=0.9 token Jaccard context
  DUP_PROMPT         two questions share an identical normalized prompt
  BAD_CORRECT_REFS   correctOptionIds empty or point at missing options
  EMPTY_HINT         hint missing or empty
  CONTEXT_REPEATS_PROMPT  context is just the prompt rephrased (>=0.7 token overlap)
  PROMPT_THIN        prompt is a short meta-instruction ('read the following',
                    'based on the context') with no real question of its own
  PROMPT_REFERS_TO_CONTEXT  prompt hand-waves to a context block ('based on the
                    context', 'the scenario above') or is a bare explanation stem
                    ('what is the most likely explanation') with no subject of its own
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

BANK = Path(__file__).resolve().parent.parent / 'src/lib/server/data/question-bank.json'
REPORT = Path(__file__).resolve().parent / 'data' / 'bank-validation-report.json'


def norm(text: str) -> str:
    if not text:
        return ''
    t = text.lower()
    t = re.sub(r'[^a-z0-9\s]', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def tokens(text: str) -> list[str]:
    return [t for t in re.findall(r'[a-z0-9]+', norm(text)) if len(t) >= 3]


def runs_match(haystack_norm: str, option_text: str) -> bool:
    """True only if the option's full wording appears verbatim in the haystack.

    High-precision leakage signal: a hint or context that contains the entire
    correct option (modulo case/punctuation) gives the answer away. Partial
    phrase overlaps do not count, which keeps false positives near zero. Bare
    numeric fragments are naturally excluded because the whole value must match.
    """
    nopt = norm(option_text)
    if not nopt:
        return False
    return nopt in haystack_norm


def is_ui_context(text: str) -> bool:
    """A context that is mechanism/UI instruction, not a scenario.

    Word-bank and similar PBQs share identical instruction text across items;
    that is expected and must not count as a duplicate scenario.
    """
    n = norm(text)
    if len(n.split()) > 30:
        return False
    ui = ('click', 'chip', 'blank', 'word bank', 'drag', 'select', 'match')
    return any(k in n for k in ui)


def correct_texts(q: dict) -> list[str]:
    opts = {o['id']: o.get('text', '') for o in q.get('options', [])}
    return [opts[c] for c in q.get('correctOptionIds', []) if c in opts]


def sentences(text: str) -> list[str]:
    return [s for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]


def main() -> int:
    bank = json.loads(BANK.read_text())
    findings: list[dict] = []

    def add(qid, domain, kind, code, detail):
        findings.append({'id': qid, 'domain': domain, 'kind': kind, 'code': code, 'detail': detail})

    items = []
    for q in bank.get('mcqs', []):
        items.append(q)
    for q in bank.get('pbqs', []):
        items.append(q)

    by_ctx: dict[str, list[str]] = defaultdict(list)
    by_prompt: dict[str, list[str]] = defaultdict(list)
    ctx_tokens: dict[str, set[str]] = {}
    ctx_ui: dict[str, bool] = {}

    for q in items:
        qid = q.get('id', '?')
        domain = q.get('domain')
        kind = q.get('kind')
        hint = q.get('hint')
        context = q.get('context')
        prompt = q.get('prompt', '')

        if not hint or not str(hint).strip():
            add(qid, domain, kind, 'EMPTY_HINT', 'hint missing or empty')

        if not context or not str(context).strip():
            add(qid, domain, kind, 'EMPTY_CONTEXT', 'question has no context')
        else:
            # internal duplicate sentence
            seen = set()
            for s in sentences(context):
                ns = norm(s)
                if len(ns.split()) >= 5 and ns in seen:
                    add(qid, domain, kind, 'CONTEXT_INTERNAL_DUP', f'repeated sentence: "{s[:80]}"')
                seen.add(ns)
            # cross / near dup bookkeeping
            nctx = norm(context)
            ui = is_ui_context(context)
            ctx_ui[qid] = ui
            if not ui:
                by_ctx[nctx].append(qid)
            ctx_tokens[qid] = set(tokens(context))

        if kind in ('single-choice', 'multiple-choice'):
            ctexts = correct_texts(q)
            if not ctexts:
                add(qid, domain, kind, 'BAD_CORRECT_REFS', 'correctOptionIds empty or dangling')
            else:
                if hint:
                    leaked = [ct for ct in ctexts if runs_match(norm(hint), ct)]
                    if leaked:
                        add(qid, domain, kind, 'HINT_LEAK', f'hint names correct option: {leaked[0][:80]}')
                if context:
                    leaked = [ct for ct in ctexts if runs_match(norm(context), ct)]
                    if leaked:
                        add(qid, domain, kind, 'CONTEXT_LEAK', f'context names correct option: {leaked[0][:80]}')
        else:
            # PBQ kinds with options (rare) still get a ref check
            if q.get('options'):
                ctexts = correct_texts(q)
                if not ctexts:
                    add(qid, domain, kind, 'BAD_CORRECT_REFS', 'correctOptionIds empty or dangling')

        if prompt:
            by_prompt[norm(prompt)].append(qid)
            # context that just restates the prompt (redundant scenario)
            if context:
                ptoks = set(tokens(prompt))
                ctoks = set(tokens(context))
                if ptoks and ctoks:
                    jac = len(ptoks & ctoks) / len(ptoks | ctoks)
                    if jac >= 0.6:
                        add(qid, domain, kind, 'CONTEXT_REPEATS_PROMPT',
                            f'context overlaps prompt ~{jac:.2f} (adds little beyond the prompt)')
            # thin meta prompt: asks you to read/summarize rather than test
            meta = ('read the following', 'refer to the', 'based on the context',
                    'based on the scenario', 'summarized', 'the following information',
                    'according to the', 'review the following', 'examine the following')
            if any(m in norm(prompt) for m in meta):
                add(qid, domain, kind, 'PROMPT_THIN', f'meta prompt, may not test its own scenario')
            # prompt must not refer to a context block, nor be a bare explanation
            # stem that only makes sense next to one (the 'referring to the context'
            # smell): it should name its own subject.
            refers = ('based on the context', 'based on the scenario', 'refer to the context',
                      'refer to the scenario', 'the context above', 'the scenario above',
                      'context above', 'scenario above', 'as described above',
                      'as described in the context', 'according to the context',
                      'given the context', 'provided context', 'the context provided',
                      'in the context above', 'based on the information provided',
                      'based on the above', 'the above scenario')
            stems = ('what is the most likely explanation', 'what is the explanation',
                     'what is the most likely cause', 'what is the best explanation',
                     'explain the scenario', 'explain what happened')
            pn = norm(prompt)
            if any(r in pn for r in refers) or any(s in pn for s in stems):
                add(qid, domain, kind, 'PROMPT_REFERS_TO_CONTEXT',
                    'prompt refers to a context block instead of asking its own question')

    # cross-question duplicate contexts
    for nctx, ids in by_ctx.items():
        if len(ids) > 1:
            for qid in ids:
                add(qid, None, None, 'DUP_CONTEXT', f'shared context with: {", ".join(i for i in ids if i != qid)}')

    # near-duplicate contexts (O(n^2), fine at this scale)
    ids = list(ctx_tokens)
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            if ctx_ui.get(ids[i]) or ctx_ui.get(ids[j]):
                continue
            a, b = ctx_tokens[ids[i]], ctx_tokens[ids[j]]
            if not a or not b:
                continue
            union = len(a | b)
            if union == 0:
                continue
            jac = len(a & b) / union
            if jac >= 0.9 and ids[i] not in {f['id'] for f in findings if f['code'] == 'DUP_CONTEXT'}:
                add(ids[i], None, None, 'NEAR_DUP_CONTEXT', f'~{jac:.2f} context overlap with {ids[j]}')
                add(ids[j], None, None, 'NEAR_DUP_CONTEXT', f'~{jac:.2f} context overlap with {ids[i]}')

    # duplicate prompts
    for nprompt, ids in by_prompt.items():
        if len(ids) > 1:
            for qid in ids:
                add(qid, None, None, 'DUP_PROMPT', f'shared prompt with: {", ".join(i for i in ids if i != qid)}')

    # resolve domain/kind for cross-question findings (filled from the item map)
    meta = {q.get('id'): (q.get('domain'), q.get('kind')) for q in items}
    for f in findings:
        if f['domain'] is None or f['kind'] is None:
            d, k = meta.get(f['id'], (None, None))
            f['domain'] = d
            f['kind'] = k

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(findings, indent=2))

    # summary
    by_code = defaultdict(int)
    by_domain = defaultdict(int)
    for f in findings:
        by_code[f['code']] += 1
        if f['domain'] is not None:
            by_domain[f['domain']] += 1

    print(f'Checked {len(items)} questions ('
          f'{len(bank.get("mcqs", []))} MCQs + {len(bank.get("pbqs", []))} PBQs).')
    print(f'Total findings: {len(findings)}')
    print('By code:')
    for code, n in sorted(by_code.items(), key=lambda x: -x[1]):
        print(f'  {code:22} {n}')
    if by_domain:
        print('By domain (where known):')
        for d in sorted(by_domain):
            print(f'  domain {d}: {by_domain[d]}')
    print(f'Report: {REPORT}')

    return 0


if __name__ == '__main__':
    sys.exit(main())
