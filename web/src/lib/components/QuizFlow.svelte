<script lang="ts">
	import type { Question, QuizResult } from '$lib/types';
	import { DOMAIN_NAMES, getPercentColor, getScoreLabel, toScaledScore } from '$lib/utils';

	interface Props {
		type: 'quiz' | 'scenario';
		mode: 'practice' | 'exam';
		count: number;
		domain?: number;
		onDone?: () => void;
	}

	let { type, mode, count, domain, onDone }: Props = $props();

	// ─── State ───
	let questions = $state<Question[]>([]);
	let sessionId = $state<string>('');
	let currentIndex = $state(0);
	let selected = $state<string | null>(null);
	let selectedMulti = $state<Set<string>>(new Set());
	let submitted = $state(false);
	let feedback = $state<{ correct: boolean; correctAnswer: string } | null>(null);
	let result = $state<QuizResult | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let answers = $state<{ questionIndex: number; selected: string; correct: boolean; flagged: boolean }[]>([]);
	let sidebarOpen = $state(false);
	let reviewMode = $state(false);
	let timerSeconds = $state(90 * 60);
	let timerRunning = $state(false);

	// ─── Derived ───
	let progress = $derived(questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0);
	let isComplete = $derived(result !== null);
	let currentQuestion = $derived(questions[currentIndex] || null);
	let isLastQuestion = $derived(currentIndex >= questions.length - 1);
	let isMulti = $derived(!!currentQuestion?.selectCount && currentQuestion.selectCount > 1);
	let SCENARIO = $derived(type === 'scenario');
	let timerDisplay = $derived(() => {
		const m = Math.floor(timerSeconds / 60);
		const s = timerSeconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	});
	let timerUrgent = $derived(timerSeconds < 300);
	let flaggedCount = $derived(answers.filter(a => a.flagged).length);
	let answeredCount = $derived(answers.length);

	// ─── Effects ───
	$effect(() => { startQuiz(); });

	// Timer effect — only in exam mode
	$effect(() => {
		if (!timerRunning || mode !== 'exam') return;
		const interval = setInterval(() => {
			if (timerSeconds > 0) {
				timerSeconds--;
			} else {
				clearInterval(interval);
				finishQuiz();
			}
		}, 1000);
		return () => clearInterval(interval);
	});

	// ─── Quiz lifecycle ───
	async function startQuiz() {
		loading = true; error = null;
		try {
			const body: Record<string, unknown> = { type, count };
			if (domain) body.domain = domain;
			const res = await fetch('/api/quiz/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
			if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to start quiz'); }
			const data = await res.json();
			sessionId = data.sessionId;
			questions = data.questions;
			if (mode === 'exam') timerRunning = true;
		} catch (e) { error = (e as Error).message; } finally { loading = false; }
	}

	async function submitAnswer(answer: string) {
		if (submitted || !sessionId) return;
		selected = answer; submitted = true;
		try {
			const res = await fetch('/api/quiz/answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, questionIndex: currentIndex, answer }) });
			if (!res.ok) throw new Error('Failed to submit answer');
			const data = await res.json();
			const existing = answers.find(a => a.questionIndex === currentIndex);
			const flagged = existing?.flagged || false;
			if (existing) {
				existing.selected = answer;
				existing.correct = data.correct;
			} else {
				answers.push({ questionIndex: currentIndex, selected: answer, correct: data.correct, flagged });
			}
			if (mode === 'practice') {
				feedback = { correct: data.correct, correctAnswer: data.correctAnswer };
			} else if (data.isComplete) {
				await finishQuiz();
			}
		} catch (e) { error = (e as Error).message; submitted = false; }
	}

	async function submitMultiAnswer() {
		if (submitted || !sessionId || !currentQuestion?.selectCount) return;
		const joined = [...selectedMulti].sort().join(', ');
		await submitAnswer(joined);
	}

	function toggleMultiOption(option: string) {
		if (submitted) return;
		const next = new Set(selectedMulti);
		if (next.has(option)) next.delete(option);
		else if (next.size < (currentQuestion?.selectCount || 99)) next.add(option);
		selectedMulti = next;
	}

	async function finishQuiz() {
		timerRunning = false;
		try {
			const res = await fetch('/api/quiz/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
			if (res.ok) result = await res.json();
		} catch (e) { error = (e as Error).message; }
	}

	function goToQuestion(index: number) {
		if (index === currentIndex) { sidebarOpen = false; return; }
		currentIndex = index;
		selected = null;
		selectedMulti = new Set();
		submitted = false;
		feedback = null;

		// Restore previous answer if exists
		const prev = answers.find(a => a.questionIndex === index);
		if (prev) {
			selected = prev.selected;
			submitted = true;
			const q = questions[index];
			if (q?.selectCount && q.selectCount > 1) {
				selectedMulti = new Set(prev.selected.split(',').map(s => s.trim()).filter(Boolean));
			}
		}
		sidebarOpen = false;
	}

	function nextQuestion() {
		if (reviewMode) { reviewMode = false; return; }
		if (isLastQuestion) { finishQuiz(); return; }
		currentIndex++; selected = null; selectedMulti = new Set(); submitted = false; feedback = null;

		const prev = answers.find(a => a.questionIndex === currentIndex);
		if (prev) {
			selected = prev.selected;
			submitted = true;
			const q = questions[currentIndex];
			if (q?.selectCount && q.selectCount > 1) {
				selectedMulti = new Set(prev.selected.split(',').map(s => s.trim()).filter(Boolean));
			}
		}
	}

	function toggleFlag(idx: number) {
		const existing = answers.find(a => a.questionIndex === idx);
		if (existing) { existing.flagged = !existing.flagged; }
		else { answers.push({ questionIndex: idx, selected: '', correct: false, flagged: true }); }
	}

	function getNavColor(idx: number): string {
		const a = answers.find(an => an.questionIndex === idx);
		if (a?.flagged) return 'border-orange-500 bg-orange-500/10 text-orange-400';
		if (a?.selected) return a.correct ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-red-500 bg-red-500/10 text-red-400';
		if (idx === currentIndex) return 'border-cyan-500 bg-cyan-500/10 text-cyan-400';
		return 'border-slate-600 bg-slate-800/40 text-slate-500';
	}

	let multiReady = $derived(currentQuestion?.selectCount ? selectedMulti.size === currentQuestion.selectCount : false);
</script>

{#if loading}
	<div class="flex flex-col items-center justify-center py-32 gap-4">
		<div class="w-12 h-12 border-3 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
		<p class="text-sm text-slate-500 animate-pulse-slow">Preparing your questions...</p>
	</div>
{:else if error}
	<div class="max-w-md mx-auto glass rounded-2xl p-8 text-center space-y-4">
		<div class="text-4xl font-bold text-red-400">!</div>
		<p class="text-red-400">{error}</p>
		<button onclick={startQuiz} class="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white text-sm font-medium transition">Retry</button>
	</div>
{:else if reviewMode}
	<!-- Post-Exam Review Screen -->
	<div class="max-w-2xl mx-auto space-y-6">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-bold text-white">Review Answers</h2>
			<button onclick={() => reviewMode = false} class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition">Back to Results</button>
		</div>
		{#each questions as q, i (i)}
			{@const a = answers.find(an => an.questionIndex === i)}
			<div class="glass rounded-xl p-5 space-y-3">
				<div class="flex items-start gap-2">
					<span class="text-xs font-mono px-2 py-0.5 rounded {a?.correct ? 'bg-green-500/10 text-green-400' : a?.selected ? 'bg-red-500/10 text-red-400' : 'bg-slate-700 text-slate-500'} shrink-0">{a?.correct ? 'OK' : a?.selected ? 'X' : '-'}</span>
					<p class="text-sm text-slate-300">{q.prompt}</p>
				</div>
				{#if q.selectCount && q.selectCount > 1}
					<div class="text-xs space-y-1 ml-8">
						<p class="text-slate-500">Your answer: <span class="text-slate-300">{a?.selected || 'none'}</span></p>
						<p class="text-slate-500">Correct: <span class="text-green-300">{q.correctAnswer.split('|').join(', ')}</span></p>
					</div>
				{:else}
					<div class="text-xs space-y-1 ml-8">
						<p class="text-slate-500">Your answer: <span class="text-slate-300">{a?.selected || 'none'}</span></p>
						{#if a?.selected && !a.correct}
							<p class="text-slate-500">Correct: <span class="text-green-300">{q.correctAnswer}</span></p>
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>
{:else if isComplete && result}
	<!-- Results Screen -->
	<div class="max-w-2xl mx-auto space-y-8">
		<div class="text-center space-y-3">
			<div class="text-lg font-bold text-white uppercase tracking-wide">{getScoreLabel(result.percentage)}</div>
			<h2 class="text-2xl font-bold text-white">{result.percentage >= 90 ? 'Excellent!' : result.percentage >= 75 ? 'Good Work!' : 'Keep Going!'}</h2>
			<div class="text-5xl font-extrabold {getPercentColor(result.percentage)}">{result.percentage}%</div>
			<div class="text-sm text-slate-400">
				<span class="font-mono text-slate-500">{result.score}/{result.total} correct</span>
				<span class="mx-2 text-slate-700">|</span>
				<span class="font-mono {result.scaledScore >= 750 ? 'text-green-400' : 'text-red-400'}">{result.scaledScore}/900</span>
				<span class="text-xs text-slate-600 ml-1">scaled</span>
			</div>
			{#if result.scaledScore >= 750}
				<div class="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 inline-block">PASS</div>
			{:else}
				<div class="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 inline-block">Needs Work</div>
			{/if}
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

		<div class="flex justify-center gap-3 flex-wrap">
			<button onclick={() => reviewMode = true} class="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm text-slate-300 transition border border-slate-600">Review Answers</button>
			<button onclick={() => onDone?.()} class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm text-slate-300 transition border border-slate-700">Dashboard</button>
			<button onclick={() => { startQuiz(); currentIndex = 0; result = null; answers = []; }} class="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-sm text-white font-medium transition">Try Again</button>
		</div>
	</div>
{:else if currentQuestion}
	<div class="flex gap-6">
		<!-- Question Navigator Sidebar -->
		<div class="hidden lg:block w-48 shrink-0">
			<div class="sticky top-24 space-y-3">
				{#if mode === 'exam'}
					<div class="glass rounded-xl p-3 text-center {timerUrgent ? 'border-red-500/30' : ''}">
						<div class="text-xs text-slate-500 mb-0.5">Time</div>
						<div class="text-lg font-mono font-bold {timerUrgent ? 'text-red-400' : 'text-cyan-400'}">{timerDisplay()}</div>
					</div>
				{/if}
				<div class="glass rounded-xl p-3 space-y-1.5">
					<div class="text-xs text-slate-500 mb-2">Questions</div>
					<div class="grid grid-cols-5 gap-1">
						{#each questions as _, i (i)}
							<button onclick={() => goToQuestion(i)}
								class="w-8 h-8 rounded-lg text-xs font-mono border transition-all {getNavColor(i)} hover:opacity-80"
							>{i + 1}</button>
						{/each}
					</div>
				</div>
				<div class="flex gap-2 text-xs text-slate-500">
					<span>✓ answered</span>
					<span class="text-orange-400">⚑ flagged</span>
				</div>
				{#if flaggedCount > 0}
					<button onclick={() => { const f = answers.find(a => a.flagged && a.questionIndex !== currentIndex); if (f) goToQuestion(f.questionIndex); }}
						class="w-full text-xs py-1.5 rounded-lg border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition">
						Review flagged ({flaggedCount})
					</button>
				{/if}
			</div>
		</div>

		<!-- Mobile nav toggle + timer bar -->
		<div class="lg:hidden fixed bottom-4 right-4 z-40 flex gap-2">
			<button onclick={() => sidebarOpen = !sidebarOpen} class="w-11 h-11 rounded-full bg-cyan-600 text-white text-lg shadow-lg flex items-center justify-center">
				{sidebarOpen ? '✕' : '☰'}
				{#if flaggedCount > 0}<span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-[10px] flex items-center justify-center">{flaggedCount}</span>{/if}
			</button>
		</div>

		{#if sidebarOpen}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="fixed inset-0 z-30 bg-black/60 lg:hidden" onclick={() => sidebarOpen = false} onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)} role="presentation"></div>
			<div class="fixed right-0 top-0 bottom-0 z-30 w-64 bg-surface-900 border-l border-slate-800 p-4 space-y-3 overflow-y-auto lg:hidden">
				{#if mode === 'exam'}
					<div class="glass rounded-xl p-3 text-center">
						<div class="text-2xl font-mono font-bold {timerUrgent ? 'text-red-400' : 'text-cyan-400'}">{timerDisplay()}</div>
						<div class="text-xs text-slate-500">remaining</div>
					</div>
				{/if}
				<div class="grid grid-cols-5 gap-1.5">
					{#each questions as _, i (i)}
						<button onclick={() => goToQuestion(i)}
							class="w-10 h-10 rounded-lg text-xs font-mono border transition-all {getNavColor(i)}">
							{i + 1}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Main Question Area -->
		<div class="flex-1 min-w-0 space-y-6">
			<!-- Progress Bar + Timer (mobile) -->
			<div class="flex items-center gap-3">
				<span class="text-xs font-mono text-slate-500 w-10 text-right">{currentIndex + 1}/{questions.length}</span>
				<div class="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
					<div class="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-500 ease-out" style="width: {progress}%"></div>
				</div>
				{#if mode === 'exam'}
					<span class="text-sm font-mono font-bold {timerUrgent ? 'text-red-400' : 'text-slate-400'} lg:hidden">{timerDisplay()}</span>
					<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">EXAM</span>
				{/if}
			</div>

			<!-- Question Card -->
			<div class="glass rounded-2xl p-6 md:p-8 space-y-5">
				<div class="flex items-start gap-3">
					<span class="{SCENARIO ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'} text-[10px] font-mono px-2 py-1 rounded-lg shrink-0 mt-0.5">
						D{currentQuestion.domain}{currentQuestion.selectCount && currentQuestion.selectCount > 1 ? ' · Pick ' + currentQuestion.selectCount : ''}
					</span>
					<h2 class="text-lg md:text-xl text-white leading-relaxed font-medium">{currentQuestion.prompt}</h2>
				</div>

				<!-- Single-select options (radio button style) -->
				{#if !isMulti}
					<div class="space-y-2.5">
						{#each currentQuestion.options as option, i (option)}
							{@const isSelected = selected === option}
							{@const isCorrectOption = feedback && option === feedback.correctAnswer}
							{@const isWrongSelection = feedback && isSelected && !feedback.correct}
							{@const btnClass = submitted && isCorrectOption
								? 'border-green-500 bg-green-500/10 text-green-300'
								: isWrongSelection
								? 'border-red-500 bg-red-500/10 text-red-300'
								: isSelected && !feedback
								? SCENARIO
									? 'border-purple-500/60 bg-purple-500/10 text-purple-400'
									: 'border-cyan-500/60 bg-cyan-500/10 text-cyan-400'
								: 'border-slate-700/50 bg-slate-800/40 text-slate-300 hover:border-slate-500 hover:bg-slate-800/70'}
							{@const badgeClass = submitted && isCorrectOption
								? 'bg-green-500/20 text-green-400'
								: isWrongSelection
								? 'bg-red-500/20 text-red-400'
								: isSelected && !feedback
								? SCENARIO ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'
								: 'bg-slate-700/50 text-slate-500 group-hover:bg-slate-600/50 transition'}
							<button
								onclick={() => submitAnswer(option)}
								disabled={submitted}
								class="w-full text-left px-5 py-3.5 rounded-xl border text-sm transition-all duration-200 group {btnClass} {submitted ? 'cursor-default' : 'cursor-pointer'}"
							>
								<div class="flex items-center gap-3">
									<span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono shrink-0 {badgeClass}">{String.fromCharCode(65 + i)}</span>
									<span class="flex-1">{option}</span>
									{#if submitted && isCorrectOption}<span class="text-green-400 font-bold">Correct</span>{:else if isWrongSelection}<span class="text-red-400">Wrong</span>{/if}
								</div>
							</button>
						{/each}
					</div>
				{:else}
					<!-- Multi-select options (checkbox style) -->
					<div class="space-y-2.5">
						<p class="text-xs text-slate-500">Select {currentQuestion.selectCount} answer{currentQuestion.selectCount! > 1 ? 's' : ''}:</p>
						{#each currentQuestion.options as option, i (option)}
							{@const isChecked = selectedMulti.has(option)}
							{@const isCorrectItem = feedback && currentQuestion.correctAnswer.split('|').map(s => s.trim()).includes(option)}
							{@const isWrongItem = feedback && isChecked && !isCorrectItem}
							<button
								onclick={() => toggleMultiOption(option)}
								disabled={submitted}
								class="w-full text-left px-5 py-3.5 rounded-xl border text-sm transition-all duration-200
									{submitted && isCorrectItem ? 'border-green-500 bg-green-500/10 text-green-300' :
									 isWrongItem ? 'border-red-500 bg-red-500/10 text-red-300' :
									 isChecked && !feedback ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-400' :
									 'border-slate-700/50 bg-slate-800/40 text-slate-300 hover:border-slate-500'}
									{submitted ? 'cursor-default' : 'cursor-pointer'}"
							>
								<div class="flex items-center gap-3">
									<span class="w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs shrink-0 transition
										{submitted && isCorrectItem ? 'border-green-500 bg-green-500/20 text-green-400' :
										 isWrongItem ? 'border-red-500 bg-red-500/20 text-red-400' :
										 isChecked && !feedback ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' :
										 'border-slate-600'}">
										{isChecked || (submitted && (isCorrectItem || isWrongItem)) ? '✓' : ''}
									</span>
									<span class="flex-1">{option}</span>
								</div>
							</button>
						{/each}
					</div>
				{/if}

				{#if feedback}
					<div class="mt-2 p-4 rounded-xl {feedback.correct ? 'bg-green-500/5 border border-green-500/20' : 'bg-red-500/5 border border-red-500/20'}">
						<div class="flex items-center gap-2 mb-1">
							<span class="text-lg font-bold">{feedback.correct ? 'Correct' : 'Incorrect'}</span>
							<span class="text-sm font-semibold {feedback.correct ? 'text-green-400' : 'text-red-400'}">{feedback.correct ? 'Correct!' : 'Incorrect'}</span>
						</div>
						{#if !feedback.correct}
							<p class="text-sm text-slate-400 mt-1">
								<span class="text-slate-500">Answer: </span>
								<span class="text-green-300">{isMulti ? feedback.correctAnswer.split('|').join(', ') : feedback.correctAnswer}</span>
							</p>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Action bar -->
			<div class="flex items-center justify-between">
				<button onclick={() => toggleFlag(currentIndex)}
					class="text-xs px-3 py-1.5 rounded-lg border transition {answers.find(a => a.questionIndex === currentIndex)?.flagged ? 'border-orange-500/30 bg-orange-500/10 text-orange-400' : 'border-slate-700 text-slate-600 hover:text-orange-400 hover:border-orange-500/30'}"
				>
					Flag {answers.find(a => a.questionIndex === currentIndex)?.flagged ? '(flagged)' : ''}
				</button>

				<div class="flex gap-2">
					{#if isMulti && !submitted}
						<button onclick={submitMultiAnswer} disabled={!multiReady}
							class="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed">
							Submit ({selectedMulti.size}/{currentQuestion.selectCount})
						</button>
					{/if}
					{#if (feedback || (mode === 'exam' && submitted)) && !isMulti}
						<button onclick={nextQuestion} class="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white text-sm font-medium transition flex items-center gap-2">
							{isLastQuestion ? 'See Results' : 'Next'}
							<span>→</span>
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
