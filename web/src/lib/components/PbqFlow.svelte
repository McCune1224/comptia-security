<script lang="ts">
	import Sortable from 'sortablejs';
	import type { PbqQuestion, QuizResult } from '$lib/types';
	import { DOMAIN_NAMES, getPercentColor, getScoreLabel } from '$lib/utils';

	interface Props {
		count: number;
		onDone?: () => void;
	}

	let { count, onDone }: Props = $props();

	let questions = $state<PbqQuestion[]>([]);
	let sessionId = $state<string>('');
	let currentIndex = $state(0);
	let shuffledSteps = $state<string[]>([]);
	let submitted = $state(false);
	let feedback = $state<{ correct: boolean; correctSteps: string[] } | null>(null);
	let result = $state<QuizResult | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let sortableContainer = $state<HTMLElement | null>(null);
	let sortableInstance: Sortable | null = null;

	let progress = $derived(questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0);
	let isComplete = $derived(result !== null);
	let currentQuestion = $derived(questions[currentIndex] || null);
	let isLastQuestion = $derived(currentIndex >= questions.length - 1);

	function shuffle<T>(arr: T[]): T[] {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	$effect(() => { startSession(); });

	$effect(() => {
		if (sortableContainer && shuffledSteps.length > 0 && !submitted) {
			if (sortableInstance) sortableInstance.destroy();
			sortableInstance = new Sortable(sortableContainer, {
				animation: 150,
				ghostClass: 'opacity-30',
				chosenClass: 'ring-2 ring-orange-400',
				dragClass: 'opacity-50',
				onEnd: () => {
					if (!sortableContainer) return;
					const items = sortableContainer.querySelectorAll('[data-step]');
					const newOrder: string[] = [];
					items.forEach(el => {
						const step = el.getAttribute('data-step');
						if (step) newOrder.push(step);
					});
					shuffledSteps = newOrder;
				},
			});
		}
		return () => { sortableInstance?.destroy(); sortableInstance = null; };
	});

	async function startSession() {
		loading = true; error = null;
		try {
			const res = await fetch('/api/quiz/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'pbq', count }) });
			if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed'); }
			const data = await res.json();
			sessionId = data.sessionId;
			questions = data.questions;
			if (questions.length > 0) shuffledSteps = shuffle(questions[0].correctSteps);
		} catch (e) { error = (e as Error).message; } finally { loading = false; }
	}

	async function submitAnswer() {
		if (submitted || !sessionId) return;
		submitted = true;
		try {
			const res = await fetch('/api/quiz/pbq-answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, questionIndex: currentIndex, steps: shuffledSteps }) });
			if (!res.ok) throw new Error('Failed');
			const data = await res.json();
			feedback = { correct: data.correct, correctSteps: data.correctSteps };
			if (data.isComplete) await finishQuiz();
		} catch (e) { error = (e as Error).message; submitted = false; }
	}

	async function finishQuiz() {
		try {
			const res = await fetch('/api/quiz/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
			if (res.ok) result = await res.json();
		} catch (e) { error = (e as Error).message; }
	}

	function nextQuestion() {
		if (isLastQuestion) { finishQuiz(); return; }
		currentIndex++; submitted = false; feedback = null;
		sortableInstance?.destroy(); sortableInstance = null;
		if (questions[currentIndex]) shuffledSteps = shuffle(questions[currentIndex].correctSteps);
	}
</script>

{#if loading}
	<div class="flex flex-col items-center justify-center py-32 gap-4">
		<div class="w-12 h-12 border-3 border-orange-500/20 border-t-orange-400 rounded-full animate-spin"></div>
		<p class="text-sm text-slate-500 animate-pulse-slow">Loading PBQs...</p>
	</div>
{:else if error}
	<div class="max-w-md mx-auto glass rounded-2xl p-8 text-center space-y-4">
					<div class="text-4xl font-bold text-red-400">!</div>
		<p class="text-red-400">{error}</p>
		<button onclick={startSession} class="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-white text-sm font-medium transition">Retry</button>
	</div>
{:else if isComplete && result}
	<div class="max-w-lg mx-auto space-y-8">
		<div class="text-center space-y-3">
			<div class="text-lg font-bold text-white uppercase tracking-wide">{getScoreLabel(result.percentage)}</div>
			<h2 class="text-2xl font-bold text-white">PBQs Complete!</h2>
			<div class="text-5xl font-extrabold {getPercentColor(result.percentage)}">{result.percentage}%</div>
			<p class="text-slate-400">{result.score} of {result.total} correct</p>
			<div class="text-sm text-slate-400 mt-1">
				<span class="font-mono {result.scaledScore >= 750 ? 'text-green-400' : 'text-red-400'}">{result.scaledScore}/900</span>
				<span class="text-xs text-slate-600 ml-1">scaled</span>
				{#if result.scaledScore >= 750}
					<span class="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 ml-2">PASS</span>
				{:else}
					<span class="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 ml-2">Needs Work</span>
				{/if}
			</div>
		</div>
		<div class="glass rounded-2xl p-6 space-y-3">
			<h3 class="text-sm font-semibold text-slate-300 mb-3">Domain Breakdown</h3>
			{#each Object.entries(result.domainBreakdown) as [domain, b] (domain)}
				{@const d = parseInt(domain)}
				{@const pct = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0}
				<div class="flex items-center gap-3">
					<span class="text-xs text-slate-500 w-20 shrink-0">D{d}</span>
					<div class="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
						<div class="h-full rounded-full animate-progress {pct >= 85 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}" style="width: {pct}%"></div>
					</div>
					<span class="text-xs font-mono {getPercentColor(pct)} w-16 text-right">{b.correct}/{b.total}</span>
				</div>
			{/each}
		</div>
		<div class="flex justify-center gap-3">
			<button onclick={() => onDone?.()} class="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm text-slate-300 transition border border-slate-700">Dashboard</button>
			<button onclick={() => { startSession(); currentIndex = 0; result = null; }} class="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-sm text-white font-medium transition">Try Again</button>
		</div>
	</div>
{:else if currentQuestion}
	<div class="max-w-2xl mx-auto space-y-6">
		<div class="flex items-center gap-3">
			<span class="text-xs font-mono text-slate-500 w-10 text-right">{currentIndex + 1}/{questions.length}</span>
			<div class="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
				<div class="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500 ease-out" style="width: {progress}%"></div>
			</div>
		</div>

		<div class="glass rounded-2xl p-6 md:p-8 space-y-5">
			<div class="flex items-start gap-3">
				<span class="text-[10px] font-mono px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0 mt-0.5">PBQ · D{currentQuestion.domain}</span>
				<h2 class="text-lg md:text-xl text-white leading-relaxed font-medium">{currentQuestion.prompt}</h2>
			</div>

			<p class="text-xs text-slate-500 flex items-center gap-2">
				<span class="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse-slow"></span>
				Drag to reorder — arrange steps in the correct sequence
			</p>

			<div bind:this={sortableContainer} class="space-y-2">
				{#each shuffledSteps as step, i (step)}
					{@const isInPosition = feedback && i < feedback.correctSteps.length && step === feedback.correctSteps[i]}
					<div
						data-step={step}
						class="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200
							{feedback
								? (isInPosition
									? 'border-green-500 bg-green-500/10 text-green-300'
									: 'border-red-500 bg-red-500/10 text-red-300')
								: 'border-slate-700/50 bg-slate-800/40 text-slate-300'}
							{submitted ? 'cursor-default' : 'cursor-grab active:cursor-grabbing hover:border-slate-500'}"
					>
						<span class="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono shrink-0
							{feedback
								? (isInPosition ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')
								: 'bg-slate-700 text-slate-400'}">
							{i + 1}
						</span>
						<span class="flex-1 text-sm">{step}</span>
						{#if !submitted}
							<span class="text-slate-600 text-sm shrink-0">::</span>
						{:else if isInPosition}
							<span class="text-green-400 text-xs font-bold shrink-0">OK</span>
						{:else}
							<span class="text-red-400 text-xs font-bold shrink-0">X</span>
						{/if}
					</div>
				{/each}
			</div>

			{#if feedback}
				<div class="mt-2 p-4 rounded-xl {feedback.correct ? 'bg-green-500/5 border border-green-500/20' : 'bg-red-500/5 border border-red-500/20'}">
					<div class="flex items-center gap-2 mb-2">
						<span class="text-lg font-bold">{feedback.correct ? 'Correct' : 'Incorrect'}</span>
						<span class="text-sm font-semibold {feedback.correct ? 'text-green-400' : 'text-red-400'}">
							{feedback.correct ? 'Correct order!' : 'Incorrect order'}
						</span>
					</div>
					{#if !feedback.correct}
						<div class="space-y-1 mt-2">
							<p class="text-xs text-slate-500 mb-1">Correct sequence:</p>
							{#each feedback.correctSteps as step, i (step)}
								<div class="flex items-center gap-2 text-sm text-green-300">
									<span class="w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono bg-green-500/20 text-green-400 shrink-0">{i + 1}</span>
									{step}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<div class="flex justify-end">
			{#if !submitted}
				<button onclick={submitAnswer}
					class="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-orange-500/20"
				>Check Order</button>
			{:else}
				<button onclick={nextQuestion}
					class="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-orange-500/20 flex items-center gap-2"
				>
					{isLastQuestion ? 'See Results' : 'Next PBQ'}
					<span>→</span>
				</button>
			{/if}
		</div>
	</div>
{/if}
