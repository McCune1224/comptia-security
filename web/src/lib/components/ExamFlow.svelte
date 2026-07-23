<script lang="ts">
	import { onMount } from 'svelte';
	import type { ActiveSessionSummary, QuestionFeedback, QuestionResponse, QuizResult, SessionType, SessionView } from '$lib/types';
	let { type, mode = 'practice', count, domain, onDone }: { type: SessionType; mode?: 'practice' | 'exam'; count?: number; domain?: number; onDone?: () => void } = $props();
	let session = $state<SessionView | null>(null);
	let result = $state<QuizResult | null>(null);
	let index = $state(0);
	let draft = $state<QuestionResponse | null>(null);
	let feedback = $state<QuestionFeedback | null>(null);
	let saving = $state(false);
	let error = $state('');
	let timer = $state('');
	let activeConflict = $state<ActiveSessionSummary | null>(null);
	let question = $derived(session?.questions[index]);

	function formatTimer(deadline: string | undefined) { if (!deadline) return ''; const seconds = Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000)); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
	function hydrate(value: SessionView) { session = value; index = value.currentIndex; draft = value.responses[index] ?? null; feedback = null; }
	async function load() {
		try {
			const existing = new URLSearchParams(location.search).get('session');
			if (existing) {
				const response = await fetch(`/api/quiz/session/${existing}`);
				const data = await response.json();
				if (data.status === 'completed') result = data.result;
				else hydrate(data.session);
				return;
			}
			const response = await fetch('/api/quiz/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type, mode, count, domain }) });
			const data = await response.json();
			if (!response.ok) {
				if (data.error?.code === 'ACTIVE_SESSION_EXISTS' && data.error.details?.session) {
					activeConflict = data.error.details.session;
					return;
				}
				throw new Error(data.error?.message ?? 'Unable to start session');
			}
			hydrate(data.session);
			history.replaceState({}, '', `${location.pathname}?session=${data.session.sessionId}`);
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Unable to load session';
		}
	}
	async function save() { if (!session || !draft) return; saving = true; error = ''; try { const response = await fetch('/api/quiz/answer', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: session.sessionId, questionIndex: index, response: draft }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? 'Unable to save response'); feedback = data.feedback ?? null; session.responses[index] = draft; session.answeredCount = Object.keys(session.responses).length; } catch (cause) { error = cause instanceof Error ? cause.message : 'Unable to save response'; } finally { saving = false; } }
	async function move(next: number) { if (!session) return; index = Math.min(Math.max(next, 0), session.questions.length - 1); draft = session.responses[index] ?? null; feedback = null; await fetch(`/api/quiz/session/${session.sessionId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ currentIndex: index }) }); }
	async function complete() { if (!session || !confirm(`Submit now? ${session.totalQuestions - session.answeredCount} questions are unanswered.`)) return; const response = await fetch('/api/quiz/complete', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: session.sessionId }) }); const data = await response.json(); if (response.ok) result = data; else error = data.error?.message ?? 'Unable to complete session'; }
	function choose(optionId: string, multi: boolean) { const ids = draft?.kind === 'choice' ? draft.optionIds : []; draft = { kind: 'choice', optionIds: multi ? (ids.includes(optionId) ? ids.filter((id) => id !== optionId) : [...ids, optionId]) : [optionId] }; }
	async function toggleFlag() { if (!session) return; const value = !session.flaggedQuestionIndexes.includes(index); const response = await fetch(`/api/quiz/session/${session.sessionId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ flag: { questionIndex: index, value } }) }); if (response.ok) session.flaggedQuestionIndexes = value ? [...session.flaggedQuestionIndexes, index] : session.flaggedQuestionIndexes.filter((item) => item !== index); }
	function resumeRoute(active: ActiveSessionSummary) { return active.type === 'pbq' ? `/pbq?session=${active.sessionId}` : active.type === 'scenario' ? `/scenarios?session=${active.sessionId}` : `/quiz?session=${active.sessionId}`; }
	async function abandonAndStart() { if (!activeConflict) return; const response = await fetch(`/api/quiz/session/${activeConflict.sessionId}`, { method: 'DELETE' }); if (!response.ok) { error = 'Unable to abandon the active session.'; return; } activeConflict = null; await load(); }
	onMount(() => { load(); const interval = setInterval(() => { timer = formatTimer(session?.deadlineAt); if (session?.deadlineAt && timer === '0:00') complete(); }, 1000); return () => clearInterval(interval); });
</script>

{#if error}<div class="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-red-200">{error} <button class="underline" onclick={load}>Retry</button></div>{/if}
{#if activeConflict}
	<div class="glass mx-auto max-w-lg space-y-4 rounded-2xl p-6 text-slate-200">
		<h1 class="text-xl font-bold text-white">An active session already exists</h1>
		<p>{activeConflict.type} · {activeConflict.answeredCount}/{activeConflict.totalQuestions} answered</p>
		<div class="flex gap-3">
			<a class="rounded bg-cyan-600 px-4 py-2" href={resumeRoute(activeConflict)}>Resume</a>
			<button class="rounded bg-slate-700 px-4 py-2" onclick={abandonAndStart}>Abandon and start PBQs</button>
		</div>
	</div>
{:else}
{#if result}
	<div class="glass mx-auto max-w-3xl space-y-5 rounded-2xl p-6 text-slate-200"><h1 class="text-2xl font-bold text-white">Practice performance</h1><p class="text-4xl font-bold text-cyan-400">{result.earnedPoints.toFixed(2)} / {result.possiblePoints} · {result.percentage}%</p><p>{result.fullyCorrect} fully correct of {result.totalQuestions}</p><button class="rounded-xl bg-cyan-600 px-4 py-2" onclick={onDone}>Return to dashboard</button></div>
{:else if session && question}
	<div class="mx-auto max-w-4xl space-y-5"><div class="flex justify-between text-sm text-slate-400"><span>{index + 1}/{session.totalQuestions} · Domain {question.domain} · {question.kind}</span><span>{timer}</span></div><div class="glass rounded-2xl p-6"><h1 class="mb-5 text-xl font-semibold text-white">{question.prompt}</h1>
		{#if question.kind === 'single-choice' || question.kind === 'multiple-choice'}
			<div class="space-y-2">{#each question.options as option (option.id)}<label class="block cursor-pointer rounded-lg border border-slate-700 p-3"><input type={question.kind === 'multiple-choice' ? 'checkbox' : 'radio'} checked={draft?.kind === 'choice' && draft.optionIds.includes(option.id)} onchange={() => choose(option.id, question.kind === 'multiple-choice')} disabled={!!feedback} /> <span class="ml-2">{option.text}</span></label>{/each}</div>
		{:else if question.kind === 'ordering'}
			<div class="space-y-2">{#each (draft?.kind === 'ordering' ? draft.itemIds : question.items.map((item) => item.id)) as id, itemIndex}<div class="flex gap-2 rounded border border-slate-700 p-2"><span>{question.items.find((item) => item.id === id)?.text}</span><button onclick={() => { const ids = [...(draft?.kind === 'ordering' ? draft.itemIds : question.items.map((item) => item.id))]; if (itemIndex) [ids[itemIndex - 1], ids[itemIndex]] = [ids[itemIndex], ids[itemIndex - 1]]; draft = { kind: 'ordering', itemIds: ids }; }}>Move Up</button></div>{/each}</div>
		{:else if question.kind === 'matching'}<div class="space-y-3">{#each question.premises as premise}<label class="flex items-center justify-between gap-3"><span>{premise.text}</span><select class="rounded bg-slate-800 p-2" value={draft?.kind === 'matching' ? draft.matches[premise.id] : ''} onchange={(event) => { const matches = draft?.kind === 'matching' ? { ...draft.matches } : {}; matches[premise.id] = event.currentTarget.value; draft = { kind: 'matching', matches }; }}><option value="">Select target</option>{#each question.targets as target}<option value={target.id} disabled={draft?.kind === 'matching' && Object.entries(draft.matches).some(([key, value]) => key !== premise.id && value === target.id)}>{target.text}</option>{/each}</select></label>{/each}</div>
		{:else if question.kind === 'numeric'}<input class="rounded bg-slate-800 p-3" type="number" oninput={(event) => draft = { kind: 'numeric', value: Number(event.currentTarget.value) }} /> <span>{question.unit}</span>
		{:else if question.kind === 'evidence'}<div class="space-y-2 font-mono text-sm">{#each question.artifact.lines as line}<label class="block rounded border border-slate-700 p-2"><input type="checkbox" checked={draft?.kind === 'evidence' && draft.lineIds.includes(line.id)} onchange={() => { const ids = draft?.kind === 'evidence' ? draft.lineIds : []; draft = { kind: 'evidence', lineIds: ids.includes(line.id) ? ids.filter((id) => id !== line.id) : [...ids, line.id] }; }} /> {line.text}</label>{/each}</div>
		{:else if question.kind === 'configuration'}<div class="space-y-3">{#each question.fields as field}<label class="flex items-center justify-between"><span>{field.label}</span><select class="rounded bg-slate-800 p-2" onchange={(event) => { const values = draft?.kind === 'configuration' ? { ...draft.values } : {}; values[field.id] = event.currentTarget.value; draft = { kind: 'configuration', values }; }}><option value="">Select setting</option>{#each field.options as option}<option value={option.id}>{option.text}</option>{/each}</select></label>{/each}</div>{/if}
		<div class="mt-6 flex gap-3"><button class="rounded bg-slate-700 px-4 py-2" onclick={() => move(index - 1)} disabled={index === 0}>Previous</button><button class="rounded bg-cyan-600 px-4 py-2" onclick={save} disabled={!draft || saving || !!feedback}>{session.mode === 'practice' ? 'Check Answer' : 'Save Answer'}</button><button class="rounded bg-slate-700 px-4 py-2" onclick={() => move(index + 1)} disabled={index === session.totalQuestions - 1}>Next</button>{#if session.mode === 'exam'}<button class="rounded bg-slate-700 px-4 py-2" onclick={toggleFlag}>{session.flaggedQuestionIndexes.includes(index) ? 'Unmark review' : 'Mark for review'}</button>{/if}<button class="ml-auto rounded bg-yellow-600 px-4 py-2" onclick={complete}>Submit</button></div>
		{#if feedback}<div class="mt-4 rounded border border-cyan-500/40 p-3"><strong>{feedback.earnedPoints}/{feedback.possiblePoints}</strong> — {feedback.explanation}</div>{/if}
	</div></div>
{:else}<p class="p-8 text-center text-slate-400">Loading session…</p>{/if}
{/if}
