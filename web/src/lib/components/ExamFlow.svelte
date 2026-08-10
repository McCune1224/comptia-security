<script lang="ts">
	import { onMount, tick } from 'svelte';
	import Sortable from 'sortablejs';
	import MatchConnect from '$lib/components/MatchConnect.svelte';
	import SortBoard from '$lib/components/SortBoard.svelte';
	import Hotspot from '$lib/components/Hotspot.svelte';
	import MemoryBoard from '$lib/components/MemoryBoard.svelte';
	import SliderInput from '$lib/components/SliderInput.svelte';
	import type {
		ActiveSessionSummary,
		PublicQuestion,
		QuestionFeedback,
		QuestionResponse,
		QuizResult,
		SessionType,
		SessionView
	} from '$lib/types';

	let {
		type,
		mode = 'practice',
		count,
		domain,
		objective,
		assignmentId,
		reviewSource,
		onDone
	}: {
		type: SessionType;
		mode?: 'practice' | 'exam';
		count?: number;
		domain?: number;
		objective?: string;
		assignmentId?: string;
		reviewSource?: 'daily' | 'wall';
		onDone?: () => void;
	} = $props();
	let session = $state<SessionView | null>(null);
	let result = $state<QuizResult | null>(null);
	let index = $state(0);
	let subStep = $state(0);
	let draft = $state<QuestionResponse | null>(null);
	let feedback = $state<QuestionFeedback | null>(null);
	let saving = $state(false);
	let error = $state('');
	let timer = $state('');
	let activeConflict = $state<ActiveSessionSummary | null>(null);
	let question = $derived(session?.questions[index]);
	const MAX_PRACTICE_RETRIES = 2;
	let streak = $state(0);
	let sessionScore = $state(0);
	let showPracticeSummary = $state(true);
	const scoreByIndex = new Map<number, number>();
	let retriesLeft = $derived(
		session ? Math.max(0, MAX_PRACTICE_RETRIES - (session.retries[index] ?? 0)) : 0
	);

	function formatTimer(deadline: string | undefined) {
		if (!deadline) return '';
		const seconds = Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000));
		return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
	}

	function isLowTime() {
		const [minutes = 99] = timer.split(':').map(Number);
		return minutes < 5;
	}

	function getSubResponse(): QuestionResponse | null {
		if (draft?.kind !== 'multi-step') return null;
		return draft.stepResponses[subStep] ?? null;
	}

	function updateSubResponse(response: QuestionResponse) {
		const steps = question?.kind === 'multi-step' ? question.steps.length : 0;
		const prev = draft?.kind === 'multi-step' ? draft.stepResponses : [];
		const stepResponses = new Array<QuestionResponse | null>(steps);
		for (let i = 0; i < steps; i++) stepResponses[i] = prev[i] ?? null;
		stepResponses[subStep] = response;
		draft = { kind: 'multi-step', stepResponses } as QuestionResponse;
	}

	function stepFeedbackMatches(): Record<string, string> | null {
		const stepFeedback = feedback?.stepFeedback?.[subStep];
		if (!stepFeedback || stepFeedback.correctResponse.kind !== 'matching') return null;
		return stepFeedback.correctResponse.matches;
	}

	function sortAnswered(): boolean {
		if (question?.kind !== 'sort') return true;
		const response = draft?.kind === 'sort' ? draft : null;
		if (!response) return false;
		return question.items.every((item) => (response.assignments[item.id] ?? '').length > 0);
	}

	function matchingAnswered(): boolean {
		if (question?.kind !== 'matching') return true;
		const response = draft?.kind === 'matching' ? draft : null;
		if (!response) return false;
		return question.premises.every((premise) => !!response.matches[premise.id]);
	}

	function hotspotAnswered(): boolean {
		if (question?.kind !== 'hotspot') return true;
		const response = draft?.kind === 'hotspot' ? draft : null;
		if (!response) return false;
		return response.regionIds.length > 0;
	}

	function memoryAnswered(): boolean {
		if (question?.kind !== 'memory') return true;
		const response = draft?.kind === 'memory' ? draft : null;
		if (!response) return false;
		return response.matchedPairIds.length === question.pairs.length;
	}

	function sliderAnswered(): boolean {
		if (question?.kind !== 'slider') return true;
		const response = draft?.kind === 'slider' ? draft : null;
		if (!response) return false;
		return Number.isFinite(response.value);
	}

	/** Uncommitted display start for a slider (mid-range, snapped to step) — draft stays null until touched. */
	function sliderDefault(question: PublicQuestion): number {
		if (question.kind !== 'slider') return 0;
		const mid = (question.min + question.max) / 2;
		return Math.min(
			question.max,
			Math.max(
				question.min,
				Math.round((mid - question.min) / question.step) * question.step + question.min
			)
		);
	}

	/** True when a multi-step child's response is complete enough to validate server-side. */
	function stepAnswered(step: PublicQuestion, response: QuestionResponse | null): boolean {
		if (!response) return false;
		switch (step.kind) {
			case 'fill-blank':
				return (
					response.kind === 'fill-blank' &&
					step.blanks.every((blank) => (response.values[blank.id] ?? '').trim().length > 0)
				);
			case 'word-bank':
				return (
					response.kind === 'word-bank' &&
					step.blanks.every((blank) => !!response.assignments[blank.id])
				);
			case 'matching':
				return (
					response.kind === 'matching' &&
					step.premises.every((premise) => !!response.matches[premise.id])
				);
			case 'sort':
				return (
					response.kind === 'sort' && step.items.every((item) => !!response.assignments[item.id])
				);
			case 'configuration':
				return (
					response.kind === 'configuration' &&
					step.fields.every((field) => !!response.values[field.id])
				);
			case 'evidence':
				return response.kind === 'evidence' && response.lineIds.length === step.selectCount;
			case 'single-choice':
			case 'multiple-choice':
				return response.kind === 'choice' && response.optionIds.length === step.selectCount;
			case 'ordering':
				return response.kind === 'ordering' && response.itemIds.length === step.items.length;
			case 'numeric':
				return response.kind === 'numeric' && Number.isFinite(response.value);
			case 'hotspot':
				return response.kind === 'hotspot' && response.regionIds.length > 0;
			case 'memory':
				return response.kind === 'memory' && response.matchedPairIds.length === step.pairs.length;
			case 'slider':
				return response.kind === 'slider' && Number.isFinite(response.value);
		}
		return true;
	}

	function stepSortAssignments(): Record<string, string> | null {
		const stepFeedback = feedback?.stepFeedback?.[subStep];
		if (!stepFeedback || stepFeedback.correctResponse.kind !== 'sort') return null;
		return stepFeedback.correctResponse.assignments;
	}

	function stepHotspotCorrectIds(): string[] | null {
		const stepFeedback = feedback?.stepFeedback?.[subStep];
		if (!stepFeedback || stepFeedback.correctResponse.kind !== 'hotspot') return null;
		return stepFeedback.correctResponse.regionIds;
	}

	function stepMemoryCorrectIds(): string[] | null {
		const stepFeedback = feedback?.stepFeedback?.[subStep];
		if (!stepFeedback || stepFeedback.correctResponse.kind !== 'memory') return null;
		return stepFeedback.correctResponse.matchedPairIds;
	}

	function stepSliderFeedbackValue(): number | null {
		const stepFeedback = feedback?.stepFeedback?.[subStep];
		if (!stepFeedback || stepFeedback.correctResponse.kind !== 'slider') return null;
		return stepFeedback.correctResponse.value;
	}

	function moveSubStep(dir: number) {
		if (question?.kind !== 'multi-step') return;
		subStep = Math.min(Math.max(subStep + dir, 0), question.steps.length - 1);
	}

	function allSubStepsAnswered(): boolean {
		if (question?.kind !== 'multi-step') return true;
		if (draft?.kind !== 'multi-step') return false;
		for (let i = 0; i < question.steps.length; i++) {
			if (!stepAnswered(question.steps[i], draft.stepResponses[i])) return false;
		}
		return true;
	}

	/** True when the current question's blanks (fill-blank / word-bank) are all answered. */
	function blanksAnswered(): boolean {
		if (!question) return true;
		if (question.kind === 'fill-blank') {
			const response = draft?.kind === 'fill-blank' ? draft : null;
			if (!response) return false;
			return question.blanks.every((blank) => (response.values[blank.id] ?? '').trim().length > 0);
		}
		if (question.kind === 'word-bank') {
			const response = draft?.kind === 'word-bank' ? draft : null;
			if (!response) return false;
			return question.blanks.every((blank) => !!response.assignments[blank.id]);
		}
		return true;
	}

	function hydrate(value: SessionView) {
		session = value;
		index = value.currentIndex;
		subStep = 0;
		draft = value.responses[index] ?? null;
		feedback = null;
	}

	async function load() {
		try {
			const existing = new URLSearchParams(location.search).get('session');
			if (existing) {
				const response = await fetch(`/api/quiz/session/${existing}`);
				const data = await response.json();
				if (!response.ok) throw new Error(data.error?.message ?? 'Unable to load session');
				if (data.status === 'completed') result = data.result;
				else hydrate(data.session);
				return;
			}

			const response = await fetch('/api/quiz/start', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					type,
					mode,
					count,
					domain,
					objective,
					...(assignmentId ? { assignmentId } : {}),
					...(reviewSource ? { reviewSource } : {})
				})
			});
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

	/** Practice-mode hint revealed per question index (client view; server enforces the 25% cost). */
	let hintUsed = $state<Record<number, boolean>>({});

	async function save() {
		if (!session || !draft) return;
		saving = true;
		error = '';
		try {
			const replacingResponse = Boolean(session.responses[index]);
			const response = await fetch('/api/quiz/answer', {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					sessionId: session.sessionId,
					questionIndex: index,
					response: draft,
					hintUsed: hintUsed[index] ?? false
				})
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error?.message ?? 'Unable to save response');
			feedback = data.feedback ?? null;
			if (data.feedback) {
				const previous = scoreByIndex.get(index) ?? 0;
				sessionScore += data.feedback.earnedPoints - previous;
				scoreByIndex.set(index, data.feedback.earnedPoints);
				if (data.feedback.fullyCorrect) streak += 1;
				else streak = 0;
			}
			if (replacingResponse) session.retries[index] = (session.retries[index] ?? 0) + 1;
			session.responses[index] = draft;
			session.answeredCount = Object.keys(session.responses).length;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Unable to save response';
		} finally {
			saving = false;
		}
	}

	async function move(next: number) {
		if (!session) return;
		index = Math.min(Math.max(next, 0), session.questions.length - 1);
		subStep = 0;
		draft = session.responses[index] ?? null;
		feedback = null;
		await fetch(`/api/quiz/session/${session.sessionId}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ currentIndex: index })
		});
	}

	async function complete() {
		if (
			!session ||
			!confirm(
				`Submit now? ${session.totalQuestions - session.answeredCount} questions are unanswered.`
			)
		)
			return;
		const response = await fetch('/api/quiz/complete', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ sessionId: session.sessionId })
		});
		const data = await response.json();
		if (response.ok) result = data;
		else error = data.error?.message ?? 'Unable to complete session';
	}

	function retryQuestion() {
		draft = null;
		feedback = null;
	}

	function choose(optionId: string, multi: boolean) {
		const ids = draft?.kind === 'choice' ? draft.optionIds : [];
		draft = {
			kind: 'choice',
			optionIds: multi
				? ids.includes(optionId)
					? ids.filter((id) => id !== optionId)
					: [...ids, optionId]
				: [optionId]
		};
	}

	let orderingEl = $state<HTMLDivElement | null>(null);
	let subOrderingEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (question?.kind !== 'ordering' || !orderingEl) return;
		const ids =
			draft?.kind === 'ordering' ? [...draft.itemIds] : question.items.map((item) => item.id);
		const instance = new Sortable(orderingEl, {
			animation: 150,
			handle: '.drag-handle',
			onEnd: (evt) => {
				const reorder = [
					...(draft?.kind === 'ordering' ? draft.itemIds : question.items.map((item) => item.id))
				];
				if (evt.oldIndex === undefined || evt.newIndex === undefined) return;
				const [moved] = reorder.splice(evt.oldIndex, 1);
				reorder.splice(evt.newIndex, 0, moved);
				draft = { kind: 'ordering', itemIds: reorder };
			}
		});
		return () => instance.destroy();
	});

	$effect(() => {
		if (question?.kind !== 'multi-step') return;
		const step = question.steps[subStep];
		if (step?.kind !== 'ordering' || !subOrderingEl) return;
		const subDraft = getSubResponse();
		const ids = subDraft?.kind === 'ordering' ? [...subDraft.itemIds] : step.items.map((i) => i.id);
		const instance = new Sortable(subOrderingEl, {
			animation: 150,
			handle: '.drag-handle',
			onEnd: (evt) => {
				const current = getSubResponse();
				const reorder =
					current?.kind === 'ordering' ? [...current.itemIds] : step.items.map((i) => i.id);
				if (evt.oldIndex === undefined || evt.newIndex === undefined) return;
				const [moved] = reorder.splice(evt.oldIndex, 1);
				reorder.splice(evt.newIndex, 0, moved);
				updateSubResponse({ kind: 'ordering', itemIds: reorder });
			}
		});
		return () => instance.destroy();
	});

	function updateConfiguration(fieldId: string, value: string) {
		const values = draft?.kind === 'configuration' ? { ...draft.values } : {};
		values[fieldId] = value;
		draft = { kind: 'configuration', values };
	}

	function updateFillBlank(blankId: string, value: string) {
		const values = draft?.kind === 'fill-blank' ? { ...draft.values } : {};
		values[blankId] = value;
		draft = { kind: 'fill-blank', values };
	}

	/** word-bank: assign a word to the selected blank, or the first empty blank. */
	function assignWord(wordId: string) {
		if (!question || question.kind !== 'word-bank') return;
		const assignments = draft?.kind === 'word-bank' ? { ...draft.assignments } : {};
		const used = new Set(Object.values(assignments));
		if (used.has(wordId)) return;
		const selected = wordBankSelected;
		const blankId =
			selected && !assignments[selected]
				? selected
				: question.blanks.find((blank) => !assignments[blank.id])?.id;
		if (!blankId) return;
		assignments[blankId] = wordId;
		wordBankSelected = null;
		draft = { kind: 'word-bank', assignments };
	}

	function clearBlank(blankId: string) {
		if (draft?.kind !== 'word-bank') return;
		const assignments = { ...draft.assignments };
		delete assignments[blankId];
		draft = { kind: 'word-bank', assignments };
	}

	function updateSubFillBlank(blankId: string, value: string) {
		const values =
			getSubResponse()?.kind === 'fill-blank'
				? { ...(getSubResponse() as { kind: 'fill-blank'; values: Record<string, string> }).values }
				: {};
		values[blankId] = value;
		updateSubResponse({ kind: 'fill-blank', values });
	}

	function assignSubWord(wordId: string) {
		const step = question?.kind === 'multi-step' ? question.steps[subStep] : null;
		if (!step || step.kind !== 'word-bank') return;
		const current = getSubResponse();
		const assignments = current?.kind === 'word-bank' ? { ...current.assignments } : {};
		const used = new Set(Object.values(assignments));
		if (used.has(wordId)) return;
		const blankId = step.blanks.find((blank) => !assignments[blank.id])?.id;
		if (!blankId) return;
		assignments[blankId] = wordId;
		updateSubResponse({ kind: 'word-bank', assignments });
	}

	function clearSubBlank(blankId: string) {
		const current = getSubResponse();
		if (current?.kind !== 'word-bank') return;
		const assignments = { ...current.assignments };
		delete assignments[blankId];
		updateSubResponse({ kind: 'word-bank', assignments });
	}

	/** Split a prompt on ____ placeholders so blanks can be embedded inline. */
	function promptSegments(prompt: string) {
		return prompt.split('____');
	}

	/** Which blank a word-bank word is assigned to ('' = unused). */
	function wordBankAssignment(blankId: string): string {
		if (draft?.kind !== 'word-bank') return '';
		return draft.assignments[blankId] ?? '';
	}

	let wordBankSelected = $state<string | null>(null);

	function toggleEvidence(lineId: string) {
		const ids = draft?.kind === 'evidence' ? draft.lineIds : [];
		draft = {
			kind: 'evidence',
			lineIds: ids.includes(lineId) ? ids.filter((id) => id !== lineId) : [...ids, lineId]
		};
	}

	function choiceFeedbackClass(optionId: string) {
		if (!feedback || feedback.correctResponse.kind !== 'choice') return '';
		return feedback.correctResponse.optionIds.includes(optionId)
			? 'border-success bg-success/10'
			: draft?.kind === 'choice' && draft.optionIds.includes(optionId)
				? 'border-danger bg-danger/10'
				: 'border-border opacity-70';
	}

	function choiceFeedbackIcon(optionId: string) {
		return feedback?.correctResponse.kind === 'choice' &&
			feedback.correctResponse.optionIds.includes(optionId)
			? 'correct'
			: draft?.kind === 'choice' && draft.optionIds.includes(optionId)
				? 'incorrect'
				: '';
	}

	async function toggleFlag() {
		if (!session) return;
		const value = !session.flaggedQuestionIndexes.includes(index);
		const response = await fetch(`/api/quiz/session/${session.sessionId}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ flag: { questionIndex: index, value } })
		});
		if (response.ok) {
			session.flaggedQuestionIndexes = value
				? [...session.flaggedQuestionIndexes, index]
				: session.flaggedQuestionIndexes.filter((item) => item !== index);
		}
	}

	function resumeRoute(active: ActiveSessionSummary) {
		return active.type === 'pbq'
			? `/pbq?session=${active.sessionId}`
			: active.type === 'scenario'
				? `/scenarios?session=${active.sessionId}`
				: `/quiz?session=${active.sessionId}`;
	}

	async function abandonAndStart() {
		if (!activeConflict) return;
		const response = await fetch(`/api/quiz/session/${activeConflict.sessionId}`, {
			method: 'DELETE'
		});
		if (!response.ok) {
			error = 'Unable to abandon the active session.';
			return;
		}
		activeConflict = null;
		await load();
	}

	onMount(() => {
		load();
		const interval = setInterval(() => {
			timer = formatTimer(session?.deadlineAt);
			if (session?.deadlineAt && timer === '0:00') complete();
		}, 1000);
		return () => clearInterval(interval);
	});
</script>

{#if error}
	<div
		class="mb-4 flex items-center justify-between gap-3 rounded-md border border-danger/40 bg-danger/10 p-4 text-danger"
	>
		<span>{error}</span><button class="font-bold underline" type="button" onclick={load}
			>Retry</button
		>
	</div>
{/if}

{#if activeConflict}
	<div class="card mx-auto max-w-lg space-y-4 border-t-4 border-t-accent-warm p-6">
		<div>
			<p class="text-sm font-bold text-accent-warm">Session in progress</p>
			<h1 class="h-display mt-1 text-xl text-text-primary">An active session already exists</h1>
		</div>
		<p class="text-text-secondary">
			{activeConflict.type} · {activeConflict.answeredCount}/{activeConflict.totalQuestions} answered
		</p>
		<div class="flex flex-col gap-3 sm:flex-row">
			<a class="btn btn-primary" href={resumeRoute(activeConflict)}>Resume</a>
			<button class="btn btn-ghost" type="button" onclick={abandonAndStart}
				>Abandon and start new session</button
			>
		</div>
	</div>
{:else if result}
	<div class="card mx-auto max-w-3xl space-y-6 p-6 text-center sm:p-10">
		<p class="eyebrow">Session complete</p>
		<div class="relative mx-auto grid h-48 w-48 place-items-center">
			<svg viewBox="0 0 42 42" class="h-full w-full -rotate-90"
				><circle
					cx="21"
					cy="21"
					r="15.9155"
					fill="none"
					stroke="var(--color-surface-600)"
					stroke-width="3"
				/><circle
					cx="21"
					cy="21"
					r="15.9155"
					fill="none"
					stroke="var(--color-accent)"
					stroke-width="3"
					pathLength="100"
					stroke-dasharray={`${result.percentage} 100`}
					stroke-linecap="round"
				/></svg
			>
			<div class="absolute">
				<p class="gradient-text num-display text-4xl">{result.percentage}%</p>
				<p class="text-xs text-text-muted">overall score</p>
			</div>
		</div>
		<div>
			<h1 class="h-display text-2xl text-text-primary">Practice performance</h1>
			<p class="mt-2 text-text-secondary">
				{result.earnedPoints.toFixed(2)} / {result.possiblePoints} points · {result.fullyCorrect} fully
				correct of {result.totalQuestions}{result.durationSeconds !== undefined ? ` · ${Math.floor(result.durationSeconds / 60)}:${String(result.durationSeconds % 60).padStart(2, '0')}` : ''}
			</p>
		</div>
		{#if Object.keys(result.domainBreakdown).length}
			<div class="grid grid-cols-2 gap-3 text-left sm:grid-cols-5">
				{#each Object.entries(result.domainBreakdown) as [domain, score]}<div
						class="rounded-md border border-border bg-surface-800/60 p-3"
					>
						<p class="text-xs text-text-muted">Domain {domain}</p>
						<p class="num-display mt-1 text-lg text-text-primary">
							{score.earnedPoints.toFixed(1)}/{score.possiblePoints}
						</p>
					</div>{/each}
			</div>
		{/if}
		<div class="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
			<a class="btn btn-primary" href="/history/{result.sessionId}">Review Answers</a>
			<button class="btn btn-ghost" type="button" onclick={onDone}
				>{assignmentId ? 'Back to assignment' : 'Return to dashboard'}</button
			>
		</div>
	</div>
{:else if session && question}
	<div class="mx-auto max-w-4xl space-y-5">
		<header class="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
			<div class="flex flex-wrap items-center gap-2">
				<span class="chip bg-surface-700 text-text-primary"
					>Q{index + 1} of {session.totalQuestions}</span
				><span class="chip bg-info/10 text-info">Domain {question.domain}</span><span
					class="chip bg-surface-700 text-text-muted">{question.kind.replace('-', ' ')}</span
				>
			</div>
			{#if session.mode === 'practice' && streak > 1}
				<span
					class="chip flex items-center gap-1.5 bg-surface-700 text-accent-warm"
					title="Answer streak"
				>
					<svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor"
						><path
							d="M12 2c.5 4.5-2 6.5-3 9-.6 1.5 0 3 1.5 3.5.9.3 1.8 0 2.3-.7.3 1.2.3 2.5-.3 3.7 2.8-1 4.5-3.8 4.1-6.7 2 1.2 3.3 3.4 3.3 5.7 0 3.9-3.4 7-7.4 6.9C6.6 23.5 3 20.4 3 16.5c0-4.3 3.2-7.8 7.5-9.5C11 5.5 11.6 3.7 12 2Z"
						/></svg
					>
					{streak}
				</span>
			{/if}
			{#if session.mode === 'practice' && sessionScore > 0}
				<span class="chip bg-surface-700 text-text-secondary">{Math.round(sessionScore)} pts</span>
			{/if}
			{#if timer}<span
					class="chip flex items-center gap-1.5 bg-surface-700 font-mono font-semibold {isLowTime()
						? 'text-danger'
						: 'text-text-secondary'}"
					><svg
						viewBox="0 0 24 24"
						class="h-4 w-4"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg
					>{timer}</span
				>{/if}
		</header>

		{#if session && (session.mode === 'exam' || session.mode === 'practice')}
			{@const showGrid = session.mode === 'exam' || session.mode === 'practice'}
			{#if showGrid}
				<div class="mb-4 flex flex-wrap gap-2">
					{#each Array.from({ length: session.totalQuestions }) as _, qi}
						{@const isAnswered = session.responses[qi] !== undefined}
						{@const isFlagged = session.flaggedQuestionIndexes.includes(qi)}
						{@const isCurrent = qi === index}
						<button
							class="grid h-10 w-10 place-items-center rounded-md text-sm font-bold transition {isCurrent
								? 'ring-2 ring-accent ring-offset-1 ring-offset-surface-800'
								: ''} {isAnswered
								? 'bg-accent text-white'
								: 'border border-border text-text-secondary hover:border-border-strong'} {isFlagged
								? 'ring-1 ring-accent-warm'
								: ''}"
							type="button"
							title="Question {qi + 1}{isFlagged ? ' (flagged)' : ''}{isAnswered
								? ' (answered)'
								: ''}"
							onclick={() => move(qi)}
						>
							{qi + 1}
						</button>
					{/each}
				</div>
			{/if}
		{/if}
		<div class="card p-5 sm:p-8">
			{#if session.mode === 'practice' && question.practiceSummary}
				<div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-accent/20 bg-accent/5 p-3">
					<label class="flex min-h-11 items-center gap-2 text-sm font-semibold text-text-secondary">
						<input type="checkbox" bind:checked={showPracticeSummary} />
						Show practice context
					</label>
					{#if showPracticeSummary}<span class="text-sm leading-relaxed text-text-primary">{question.practiceSummary.text}</span>{/if}
				</div>
			{/if}
			{#if question.context}<div
					class="mb-5 rounded-md border border-info/20 bg-info/5 p-4 text-sm leading-relaxed text-text-secondary"
				>
					{question.context}
				</div>{/if}
			<h1 class="h-display mb-6 text-xl leading-relaxed text-text-primary sm:text-2xl">
				{question.prompt}
			</h1>

			{#if question.kind === 'single-choice' || question.kind === 'multiple-choice'}
				<div class="space-y-3">
					{#each question.options as option (option.id)}<label
							class="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-md border-2 p-4 transition-all duration-150 {feedback
								? choiceFeedbackClass(option.id)
								: draft?.kind === 'choice' && draft.optionIds.includes(option.id)
									? 'border-accent bg-accent/10'
									: 'border-border hover:border-border-strong'}"
							><input
								type={question.kind === 'multiple-choice' ? 'checkbox' : 'radio'}
								checked={draft?.kind === 'choice' && draft.optionIds.includes(option.id)}
								onchange={() => choose(option.id, question.kind === 'multiple-choice')}
								disabled={!!feedback}
							/><span class="flex-1 text-text-primary">{option.text}</span
							>{#if choiceFeedbackIcon(option.id) === 'correct'}<svg
									viewBox="0 0 24 24"
									class="h-5 w-5 text-success"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"><path d="m5 12 4 4L19 6" /></svg
								>{:else if choiceFeedbackIcon(option.id) === 'incorrect'}<svg
									viewBox="0 0 24 24"
									class="h-5 w-5 text-danger"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"><path d="m6 6 12 12M18 6 6 18" /></svg
								>{/if}</label
						>{/each}
				</div>
			{:else if question.kind === 'ordering'}
				<div bind:this={orderingEl} class="space-y-3">
					{#each draft?.kind === 'ordering' ? draft.itemIds : question.items.map((item) => item.id) as id, itemIndex}
						<div class="glass flex items-center gap-3 rounded-md p-3" data-id={id}>
							<button
								class="drag-handle cursor-grab active:cursor-grabbing flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
								type="button"
								aria-label="Reorder item. Press arrow keys to move."
								onkeydown={(e) => {
									if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
										e.preventDefault();
										const ids = [
											...(draft?.kind === 'ordering'
												? draft.itemIds
												: question.items.map((item) => item.id))
										];
										const dir = e.key === 'ArrowUp' ? -1 : 1;
										const target = itemIndex + dir;
										if (target < 0 || target >= ids.length) return;
										[ids[itemIndex], ids[target]] = [ids[target], ids[itemIndex]];
										draft = { kind: 'ordering', itemIds: ids };
									}
								}}
							>
								<svg
									viewBox="0 0 24 24"
									class="h-5 w-5 shrink-0 text-text-subtle"
									fill="currentColor"
									><circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" /><circle
										cx="9"
										cy="12"
										r="1.5"
									/><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="18" r="1.5" /><circle
										cx="15"
										cy="18"
										r="1.5"
									/></svg
								></button
							>
							<span class="flex-1 text-text-primary"
								>{question.items.find((item) => item.id === id)?.text}</span
							>
						</div>{/each}
				</div>
			{:else if question.kind === 'matching'}
				<MatchConnect
					premises={question.premises}
					targets={[...question.targets, ...(question.extraTargets ?? [])]}
					matches={draft?.kind === 'matching' ? draft.matches : {}}
					feedbackMatches={feedback?.correctResponse.kind === 'matching'
						? feedback.correctResponse.matches
						: null}
					disabled={!!feedback}
					onchange={(m) => (draft = { kind: 'matching', matches: m })}
				/>
			{:else if question.kind === 'numeric'}
				<div class="space-y-3">
					<div class="flex items-center gap-2">
						<span class="chip bg-surface-700 text-text-muted">Legacy question</span>
						<span class="text-xs text-text-muted">
							Typed numeric was retired — your stored answer is shown below.
						</span>
					</div>
					<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
						<input
							class="w-full sm:max-w-xs"
							type="number"
							value={draft?.kind === 'numeric' ? draft.value : ''}
							disabled
							readonly
						/><span class="text-text-secondary">{question.unit}</span>
					</div>
				</div>
			{:else if question.kind === 'evidence'}
				<div class="space-y-2 font-mono text-sm">
					{#each question.artifact.lines as line}<label
							class="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-surface-900/60 p-3 transition {draft?.kind ===
								'evidence' && draft.lineIds.includes(line.id)
								? 'border-accent bg-accent/10'
								: 'hover:border-border-strong'}"
							><input
								type="checkbox"
								checked={draft?.kind === 'evidence' && draft.lineIds.includes(line.id)}
								onchange={() => toggleEvidence(line.id)}
							/><span class="leading-relaxed text-text-secondary">{line.text}</span></label
						>{/each}
				</div>
			{:else if question.kind === 'configuration'}
				<div class="space-y-3">
					{#each question.fields as field}<label
							class="flex flex-col gap-2 rounded-md bg-surface-700/60 p-4 text-sm font-medium text-text-secondary sm:flex-row sm:items-center"
							><span class="flex-1">{field.label}</span><select
								class="sm:w-56"
								value={draft?.kind === 'configuration' ? draft.values[field.id] : ''}
								onchange={(event) => updateConfiguration(field.id, event.currentTarget.value)}
								><option value="">Select setting</option>{#each field.options as option}<option
										value={option.id}>{option.text}</option
									>{/each}</select
							></label
						>{/each}
				</div>
			{:else if question.kind === 'fill-blank'}
				{@const segments = promptSegments(question.prompt)}
				<div class="space-y-5">
					<p class="text-base leading-relaxed text-text-primary">
						{#each segments as segment, si}
							{segment}
							{#if si < segments.length - 1}
								{@const blank = question.blanks[si]}
								<input
									class="mx-1 inline-block w-36 border-b-2 border-dashed border-accent bg-transparent px-1 py-0.5 text-center font-semibold text-accent outline-none transition focus:border-solid focus:bg-accent/5 sm:w-44"
									type="text"
									placeholder={blank.placeholder}
									aria-label={blank.label}
									value={draft?.kind === 'fill-blank' ? (draft.values[blank.id] ?? '') : ''}
									disabled={!!feedback}
									oninput={(event) => updateFillBlank(blank.id, event.currentTarget.value)}
								/>
							{/if}
						{/each}
					</p>
					<div class="flex flex-wrap gap-2 text-xs text-text-muted">
						{#each question.blanks as blank}
							<span class="rounded-md bg-surface-700 px-2.5 py-1">
								{blank.label}: {blank.placeholder}
							</span>
						{/each}
					</div>
				</div>
			{:else if question.kind === 'word-bank'}
				{@const segments = promptSegments(question.prompt)}
				{@const usedIds = new Set(
					draft?.kind === 'word-bank' ? Object.values(draft.assignments) : []
				)}
				<div class="space-y-5">
					<p class="text-base leading-relaxed text-text-primary">
						{#each segments as segment, si}
							{segment}
							{#if si < segments.length - 1}
								{@const blank = question.blanks[si]}
								{@const assignedId =
									draft?.kind === 'word-bank' ? (draft.assignments[blank.id] ?? '') : ''}
								{@const assignedWord = question.bank.find((word) => word.id === assignedId)}
								<button
									type="button"
									class="mx-1 inline-flex min-w-28 items-center justify-center rounded-lg border-2 px-2 py-0.5 font-semibold transition {assignedWord
										? 'border-accent bg-accent/15 text-accent'
										: wordBankSelected === blank.id
											? 'border-accent-warm bg-accent-warm/10 text-accent-warm'
											: 'border-dashed border-border-strong text-text-muted hover:border-accent'} {feedback
										? 'cursor-default'
										: 'cursor-pointer'}"
									onclick={() => {
										if (feedback) return;
										if (assignedWord) clearBlank(blank.id);
										else wordBankSelected = wordBankSelected === blank.id ? null : blank.id;
									}}
								>
									{assignedWord ? assignedWord.word : `____${si + 1}`}
								</button>
							{/if}
						{/each}
					</p>
					<div>
						<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
							Word bank — click a word, then click a blank (or click a filled blank to clear)
						</p>
						<div class="flex flex-wrap gap-2">
							{#each question.bank as word}
								{@const isUsed = usedIds.has(word.id)}
								<button
									type="button"
									class="rounded-md border px-3.5 py-1.5 text-sm font-medium transition {isUsed
										? 'cursor-not-allowed border-border opacity-40 line-through'
										: feedback
											? 'cursor-default border-border opacity-70'
											: 'border-border-strong bg-surface-700 text-text-primary hover:border-accent hover:text-accent'}"
									disabled={isUsed || !!feedback}
									onclick={() => assignWord(word.id)}
								>
									{word.word}
								</button>
							{/each}
						</div>
					</div>
				</div>
			{:else if question.kind === 'sort'}
				<SortBoard
					items={question.items}
					buckets={question.buckets}
					assignments={draft?.kind === 'sort' ? draft.assignments : {}}
					feedbackAssignments={feedback?.correctResponse.kind === 'sort'
						? feedback.correctResponse.assignments
						: null}
					disabled={!!feedback}
					onchange={(a) => (draft = { kind: 'sort', assignments: a })}
				/>
			{:else if question.kind === 'hotspot'}
				<div class="space-y-3">
					<p class="mb-2 font-medium text-text-primary">{question.prompt}</p>
					<Hotspot
						template={question.template}
						regions={question.regions}
						selectedIds={draft?.kind === 'hotspot' ? draft.regionIds : []}
						feedbackCorrectIds={feedback?.correctResponse.kind === 'hotspot'
							? feedback.correctResponse.regionIds
							: null}
						disabled={!!feedback}
						onchange={(regionIds) => (draft = { kind: 'hotspot', regionIds })}
					/>
				</div>
			{:else if question.kind === 'memory'}
				<div class="space-y-3">
					<p class="mb-2 font-medium text-text-primary">{question.prompt}</p>
					<MemoryBoard
						pairs={question.pairs}
						matchedIds={draft?.kind === 'memory' ? draft.matchedPairIds : []}
						feedbackCorrectIds={feedback?.correctResponse.kind === 'memory'
							? feedback.correctResponse.matchedPairIds
							: null}
						disabled={!!feedback}
						onchange={(matchedPairIds) => (draft = { kind: 'memory', matchedPairIds })}
					/>
				</div>
			{:else if question.kind === 'slider'}
				<div class="space-y-3">
					<p class="mb-2 font-medium text-text-primary">{question.prompt}</p>
					<SliderInput
						min={question.min}
						max={question.max}
						step={question.step}
						unit={question.unit}
						value={draft?.kind === 'slider' ? draft.value : sliderDefault(question)}
						feedbackValue={feedback?.correctResponse.kind === 'slider'
							? feedback.correctResponse.value
							: null}
						tolerance={question.tolerance}
						disabled={!!feedback}
						onchange={(value) => (draft = { kind: 'slider', value })}
					/>
				</div>
			{:else if question.kind === 'multi-step'}
				{@const step = question.steps[subStep]}
				{@const subDraft = getSubResponse()}
				<div class="space-y-4">
					<div
						class="rounded-md border border-info/20 bg-info/5 p-4 text-sm leading-relaxed text-text-secondary"
					>
						{question.context}
					</div>
					<div class="flex items-center gap-2 text-sm">
						<span class="rounded-md bg-surface-700 px-3 py-1.5 font-semibold text-text-primary">
							Step {subStep + 1} of {question.steps.length}
						</span>
						<span class="rounded-md bg-surface-700 px-3 py-1.5 text-text-muted">
							{step.kind.replace('-', ' ')}
						</span>
					</div>

					{#if step.kind === 'single-choice' || step.kind === 'multiple-choice'}
						<div class="space-y-3">
							<p class="mb-2 font-medium text-text-primary">{step.prompt}</p>
							{#each step.options as option (option.id)}
								<label
									class="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-md border-2 p-4 transition-all duration-150 {subDraft?.kind ===
										'choice' && subDraft.optionIds.includes(option.id)
										? 'border-accent bg-accent/10'
										: 'border-border hover:border-border-strong'}"
								>
									<input
										type={step.kind === 'multiple-choice' ? 'checkbox' : 'radio'}
										checked={subDraft?.kind === 'choice' && subDraft.optionIds.includes(option.id)}
										onchange={() => {
											const ids = subDraft?.kind === 'choice' ? [...subDraft.optionIds] : [];
											const next =
												step.kind === 'multiple-choice'
													? ids.includes(option.id)
														? ids.filter((i) => i !== option.id)
														: [...ids, option.id]
													: [option.id];
											updateSubResponse({ kind: 'choice', optionIds: next });
										}}
									/>
									<span class="flex-1 text-text-primary">{option.text}</span>
								</label>
							{/each}
						</div>
					{:else if step.kind === 'ordering'}
						<p class="mb-2 font-medium text-text-primary">{step.prompt}</p>
						<div bind:this={subOrderingEl} class="space-y-3">
							{#each subDraft?.kind === 'ordering' ? subDraft.itemIds : step.items.map((i) => i.id) as id, itemIndex}
								<div class="glass flex items-center gap-3 rounded-md p-3" data-id={id}>
									<button
										class="drag-handle cursor-grab active:cursor-grabbing flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
										type="button"
										aria-label="Reorder item. Press arrow keys to move."
										onkeydown={(e) => {
											if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
												e.preventDefault();
												const current = getSubResponse();
												const ids =
													current?.kind === 'ordering'
														? [...current.itemIds]
														: step.items.map((i) => i.id);
												const dir = e.key === 'ArrowUp' ? -1 : 1;
												const target = itemIndex + dir;
												if (target < 0 || target >= ids.length) return;
												[ids[itemIndex], ids[target]] = [ids[target], ids[itemIndex]];
												updateSubResponse({ kind: 'ordering', itemIds: ids });
											}
										}}
									>
										<svg
											viewBox="0 0 24 24"
											class="h-5 w-5 shrink-0 text-text-subtle"
											fill="currentColor"
										>
											<circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
											<circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
											<circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
										</svg>
									</button>
									<span class="flex-1 text-text-primary"
										>{step.items.find((i) => i.id === id)?.text}</span
									>
								</div>
							{/each}
						</div>
					{:else if step.kind === 'matching'}
						<p class="mb-2 font-medium text-text-primary">{step.prompt}</p>
						<MatchConnect
							premises={step.premises}
							targets={[...step.targets, ...(step.extraTargets ?? [])]}
							matches={subDraft?.kind === 'matching' ? subDraft.matches : {}}
							feedbackMatches={stepFeedbackMatches()}
							disabled={!!feedback}
							onchange={(m) => updateSubResponse({ kind: 'matching', matches: m })}
						/>
					{:else if step.kind === 'numeric'}
						<div class="space-y-2">
							<p class="font-medium text-text-primary">{step.prompt}</p>
							<div class="flex items-center gap-2">
								<span class="chip bg-surface-700 text-text-muted">Legacy question</span>
								<input
									class="w-full sm:max-w-xs"
									type="number"
									value={subDraft?.kind === 'numeric' ? subDraft.value : ''}
									disabled
									readonly
								/><span class="text-text-secondary">{step.unit}</span>
							</div>
						</div>
					{:else if step.kind === 'evidence'}
						<div class="space-y-2 font-mono text-sm">
							<p class="mb-2 font-medium text-text-primary">{step.prompt}</p>
							{#each step.artifact.lines as line}
								<label
									class="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-surface-900/60 p-3 transition {subDraft?.kind ===
										'evidence' && subDraft.lineIds.includes(line.id)
										? 'border-accent bg-accent/10'
										: 'hover:border-border-strong'}"
								>
									<input
										type="checkbox"
										checked={subDraft?.kind === 'evidence' && subDraft.lineIds.includes(line.id)}
										onchange={() => {
											const ids = subDraft?.kind === 'evidence' ? [...subDraft.lineIds] : [];
											const next = ids.includes(line.id)
												? ids.filter((i) => i !== line.id)
												: [...ids, line.id];
											updateSubResponse({ kind: 'evidence', lineIds: next });
										}}
									/>
									<span class="leading-relaxed text-text-secondary">{line.text}</span>
								</label>
							{/each}
						</div>
					{:else if step.kind === 'configuration'}
						<div class="space-y-3">
							<p class="mb-2 font-medium text-text-primary">{step.prompt}</p>
							{#each step.fields as field}
								<label
									class="flex flex-col gap-2 rounded-md bg-surface-700/60 p-4 text-sm font-medium text-text-secondary sm:flex-row sm:items-center"
								>
									<span class="flex-1">{field.label}</span>
									<select
										class="sm:w-56"
										value={subDraft?.kind === 'configuration' ? subDraft.values[field.id] : ''}
										onchange={(e) => {
											const values = {
												...(subDraft?.kind === 'configuration' ? subDraft.values : {})
											};
											values[field.id] = e.currentTarget.value;
											updateSubResponse({ kind: 'configuration', values });
										}}
									>
										<option value="">Select setting</option>
										{#each field.options as option}
											<option value={option.id}>{option.text}</option>
										{/each}
									</select>
								</label>
							{/each}
						</div>
					{:else if step.kind === 'fill-blank'}
						{@const stepSegments = promptSegments(step.prompt)}
						<div class="space-y-4">
							<p class="mb-2 font-medium text-text-primary">
								{#each stepSegments as segment, si}
									{segment}
									{#if si < stepSegments.length - 1}
										{@const blank = step.blanks[si]}
										<input
											class="mx-1 inline-block w-36 border-b-2 border-dashed border-accent bg-transparent px-1 py-0.5 text-center font-semibold text-accent outline-none transition focus:border-solid focus:bg-accent/5 sm:w-44"
											type="text"
											placeholder={blank.placeholder}
											aria-label={blank.label}
											value={subDraft?.kind === 'fill-blank'
												? (subDraft.values[blank.id] ?? '')
												: ''}
											oninput={(e) => updateSubFillBlank(blank.id, e.currentTarget.value)}
										/>
									{/if}
								{/each}
							</p>
						</div>
					{:else if step.kind === 'word-bank'}
						{@const stepSegments = promptSegments(step.prompt)}
						{@const stepUsed = new Set(
							subDraft?.kind === 'word-bank' ? Object.values(subDraft.assignments) : []
						)}
						<div class="space-y-4">
							<p class="mb-2 font-medium text-text-primary">
								{#each stepSegments as segment, si}
									{segment}
									{#if si < stepSegments.length - 1}
										{@const blank = step.blanks[si]}
										{@const assignedId =
											subDraft?.kind === 'word-bank' ? (subDraft.assignments[blank.id] ?? '') : ''}
										{@const assignedWord = step.bank.find((word) => word.id === assignedId)}
										<span
											class="mx-1 inline-flex min-w-28 items-center justify-center rounded-lg border-2 px-2 py-0.5 font-semibold {assignedWord
												? 'border-accent bg-accent/15 text-accent'
												: 'border-dashed border-border-strong text-text-muted'}"
										>
											{assignedWord ? assignedWord.word : `____${si + 1}`}
										</span>
									{/if}
								{/each}
							</p>
							<div class="flex flex-wrap gap-2">
								{#each step.bank as word}
									<button
										type="button"
										class="rounded-md border px-3.5 py-1.5 text-sm font-medium transition {stepUsed.has(
											word.id
										)
											? 'cursor-not-allowed border-border opacity-40 line-through'
											: 'border-border-strong bg-surface-700 text-text-primary hover:border-accent hover:text-accent'}"
										disabled={stepUsed.has(word.id)}
										onclick={() => assignSubWord(word.id)}
									>
										{word.word}
									</button>
								{/each}
							</div>
						</div>
					{:else if step.kind === 'sort'}
						<p class="mb-2 font-medium text-text-primary">{step.prompt}</p>
						<SortBoard
							items={step.items}
							buckets={step.buckets}
							assignments={subDraft?.kind === 'sort' ? subDraft.assignments : {}}
							feedbackAssignments={stepSortAssignments()}
							disabled={!!feedback}
							onchange={(a) => updateSubResponse({ kind: 'sort', assignments: a })}
						/>
					{:else if step.kind === 'hotspot'}
						<p class="mb-2 font-medium text-text-primary">{step.prompt}</p>
						<Hotspot
							template={step.template}
							regions={step.regions}
							selectedIds={subDraft?.kind === 'hotspot' ? subDraft.regionIds : []}
							feedbackCorrectIds={stepHotspotCorrectIds()}
							disabled={!!feedback}
							onchange={(regionIds) => updateSubResponse({ kind: 'hotspot', regionIds })}
						/>
					{:else if step.kind === 'memory'}
						<p class="mb-2 font-medium text-text-primary">{step.prompt}</p>
						<MemoryBoard
							pairs={step.pairs}
							matchedIds={subDraft?.kind === 'memory' ? subDraft.matchedPairIds : []}
							feedbackCorrectIds={stepMemoryCorrectIds()}
							disabled={!!feedback}
							onchange={(matchedPairIds) => updateSubResponse({ kind: 'memory', matchedPairIds })}
						/>
					{:else if step.kind === 'slider'}
						<p class="mb-2 font-medium text-text-primary">{step.prompt}</p>
						<SliderInput
							min={step.min}
							max={step.max}
							step={step.step}
							unit={step.unit}
							value={subDraft?.kind === 'slider' ? subDraft.value : sliderDefault(step)}
							feedbackValue={stepSliderFeedbackValue()}
							tolerance={step.tolerance}
							disabled={!!feedback}
							onchange={(value) => updateSubResponse({ kind: 'slider', value })}
						/>
					{/if}

					<div class="flex gap-2">
						<button
							class="btn btn-ghost h-11 px-4 text-sm"
							type="button"
							onclick={() => moveSubStep(-1)}
							disabled={subStep === 0}>← Back</button
						>
						<button
							class="btn btn-ghost h-11 px-4 text-sm"
							type="button"
							onclick={() => moveSubStep(1)}
							disabled={subStep === question.steps.length - 1}>Next →</button
						>
					</div>
				</div>
			{/if}

			<div class="mt-6 flex flex-wrap gap-2 sm:gap-3">
				<button
					class="btn btn-ghost h-11 px-4"
					type="button"
					onclick={() => move(index - 1)}
					disabled={index === 0}>← Previous</button
				>
				<button
					class="btn btn-primary h-11 flex-1 px-4 sm:flex-none"
					type="button"
					onclick={save}
					disabled={!draft ||
						saving ||
						!!feedback ||
						!allSubStepsAnswered() ||
						!blanksAnswered() ||
						!sortAnswered() ||
						!matchingAnswered() ||
						!hotspotAnswered() ||
						!memoryAnswered() ||
						!sliderAnswered()}
					>{saving
						? 'Saving…'
						: session.mode === 'practice'
							? 'Check Answer'
							: 'Save Answer'}</button
				>
				<button
					class="btn btn-ghost h-11 px-4"
					type="button"
					onclick={() => move(index + 1)}
					disabled={index === session.totalQuestions - 1}>Next →</button
				>
				{#if session.mode === 'exam'}<button
						class="btn h-11 border px-4 {session.flaggedQuestionIndexes.includes(index)
							? 'border-accent-warm bg-accent-warm/10 text-accent-warm'
							: 'border-border-strong text-text-secondary hover:text-text-primary'}"
						type="button"
						onclick={toggleFlag}
						>⌑ {session.flaggedQuestionIndexes.includes(index) ? 'Flagged' : 'Flag'}</button
					>{/if}
				<button class="btn btn-danger ml-auto h-11 px-4" type="button" onclick={complete}
					>Submit</button
				>
			</div>

			{#if feedback}
				<div
					class="mt-5 translate-y-0 rounded-md border-l-4 p-4 opacity-100 transition-all duration-200 {feedback.fullyCorrect
						? 'border-l-success bg-success/10'
						: feedback.earnedPoints > 0
							? 'border-l-accent-warm bg-accent-warm/10'
							: 'border-l-danger bg-danger/10'}"
				>
					<div class="flex items-center justify-between gap-3">
						<strong class="h-display text-text-primary"
							>{feedback.fullyCorrect ? 'Correct' : 'Answer review'}</strong
						><span class="chip bg-surface-800 text-text-primary"
							>{feedback.earnedPoints}/{feedback.possiblePoints} points{session.mode === 'practice' && (session.retries[index] ?? 0) > 0 ? ' · retry-adjusted' : ''}</span
						>
					</div>
					<p class="mt-2 leading-relaxed text-text-secondary">{feedback.explanation}</p>

					{#if session.mode === 'practice' && !feedback.fullyCorrect && retriesLeft > 0}
						<div class="mt-3 flex flex-wrap gap-2">
							<button class="btn btn-ghost h-11 px-4 text-sm" type="button" onclick={retryQuestion}
								>Try again — {retriesLeft === 2 ? '60' : '30'}%</button
							>
						</div>
					{/if}
					{#if session.mode === 'practice' && !feedback.fullyCorrect && question?.hint}
						<div class="mt-3">
							{#if hintUsed[index]}
								<p
									class="rounded-md bg-surface-700/60 p-3 text-sm leading-relaxed text-text-secondary"
								>
									{question.hint}
								</p>
							{:else}
								<button
									class="btn btn-ghost h-11 px-4 text-sm"
									type="button"
									onclick={() => (hintUsed[index] = true)}>Hint — 25% off the next attempt</button
								>
							{/if}
						</div>
					{/if}
					{#if session.mode === 'practice' && question.objective}
						<div class="mt-3">
							<a
								class="text-sm font-bold text-accent hover:underline"
								href="/quiz?start=1&type=quiz&objective={question.objective}&count=5"
								>More like this →</a
							>
						</div>
					{/if}

					{#if feedback.optionRationales && (question?.kind === 'single-choice' || question?.kind === 'multiple-choice')}
						<div class="mt-3 space-y-2">
							<p class="text-xs font-bold uppercase tracking-wide text-text-muted">
								Option rationales
							</p>
							{#each question.options as option}
								{@const rationale = feedback.optionRationales?.[option.id]}
								{@const isCorrect =
									feedback.correctResponse.kind === 'choice' &&
									feedback.correctResponse.optionIds.includes(option.id)}
								{@const isSelected =
									draft?.kind === 'choice' && draft.optionIds.includes(option.id)}
								<div
									class="rounded-md bg-surface-700/60 p-2.5 text-sm {isCorrect
										? 'border-l-2 border-l-success'
										: isSelected
											? 'border-l-2 border-l-danger'
											: ''}"
								>
									<div class="flex items-center gap-2">
										<span class="font-bold text-text-primary">{option.text}</span>
										{#if isCorrect}<span class="text-xs text-success">(correct)</span>{/if}
										{#if isSelected && !isCorrect}<span class="text-xs text-danger"
												>(your answer)</span
											>{/if}
									</div>
									{#if rationale}<p class="mt-0.5 text-xs text-text-muted">{rationale}</p>{/if}
								</div>
							{/each}
						</div>
					{/if}

					{#if feedback.sourceRefs?.length}
						<div class="mt-3 flex flex-wrap gap-2">
							{#each feedback.sourceRefs as ref}
								<span class="chip bg-surface-800 text-xs text-text-muted">
									{ref.source}: {ref.section}
								</span>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="grid min-h-64 place-items-center text-center">
		<div>
			<span
				class="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-surface-600 border-t-accent"
			></span>
			<p class="mt-4 text-text-secondary">Preparing your session…</p>
		</div>
	</div>
{/if}
