<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import type { QuizResult, QuestionReview } from '$lib/types';

	let result = $state<QuizResult | null>(null);
	let error = $state('');
	let filter = $state<'all' | 'correct' | 'incorrect' | 'flagged'>('all');

	let flaggedIndexes = $derived(result?.flaggedQuestionIndexes ?? []);

	let filtered = $derived(
		result
			? result.review.filter((r, i) =>
					filter === 'all'
						? true
						: filter === 'correct'
							? r.feedback.fullyCorrect
							: filter === 'incorrect'
								? !r.feedback.fullyCorrect
								: flaggedIndexes.includes(i)
				)
			: []
	);

	onMount(async () => {
		const sessionId = page.params.sessionId;
		if (!sessionId) { error = 'No session ID provided.'; return; }
		const response = await fetch(`/api/quiz/session/${sessionId}`);
		if (!response.ok) { error = 'Session not found.'; return; }
		const data = await response.json();
		if (data.status !== 'completed' || !data.result) { error = 'Session is not completed.'; return; }
		result = data.result;
	});

	function typeLabel(type: string): string {
		const labels: Record<string, string> = { quiz: 'Objective Quiz', scenario: 'Scenario Quiz', pbq: 'PBQ Practice', full: 'Practice Exam' };
		return labels[type] ?? type;
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function scoreColor(pct: number): string {
		if (pct >= 85) return 'text-green-400';
		if (pct >= 60) return 'text-yellow-400';
		return 'text-red-400';
	}

	function correctResponseText(review: QuestionReview): string {
		const cr = review.feedback.correctResponse;
		const q = review.question;
		switch (cr.kind) {
			case 'choice': {
				const texts: string[] = [];
				if (q.kind === 'single-choice' || q.kind === 'multiple-choice') {
					for (const oid of cr.optionIds) {
						const opt = q.options.find((o) => o.id === oid);
						if (opt) texts.push(opt.text);
					}
				}
				return texts.join(', ');
			}
			case 'ordering': return 'See correct order below.';
			case 'matching': return 'See correct matches below.';
			case 'evidence': return 'See correct selections below.';
			case 'configuration': return 'See correct settings below.';
			case 'numeric': return `${cr.value}`;
			case 'multi-step': return 'See step breakdown below.';
		}
	}

	function userResponsePreview(review: QuestionReview): string {
		if (!review.response) return 'Not answered';
		const q = review.question;
		switch (review.response.kind) {
			case 'choice': {
				const texts: string[] = [];
				if (q.kind === 'single-choice' || q.kind === 'multiple-choice') {
					for (const oid of review.response.optionIds) {
						const opt = q.options.find((o) => o.id === oid);
						if (opt) texts.push(opt.text);
					}
				}
				return texts.join(', ') || '(selected options)';
			}
			case 'ordering': return 'Ordered: ' + review.response.itemIds.join(' → ');
			case 'matching': return Object.values(review.response.matches).join(', ');
			case 'evidence': return review.response.lineIds.join(', ');
			case 'configuration': return Object.values(review.response.values).join(', ');
			case 'numeric': return `${review.response.value}`;
			case 'multi-step': return `${review.response.stepResponses.length} step(s)`;
		}
	}
</script>

<div class="mx-auto max-w-5xl space-y-6">
	<nav class="flex items-center gap-2 text-sm text-text-secondary">
		<a class="hover:text-accent transition" href="/history">← Back to history</a>
	</nav>

	{#if error}
		<div class="rounded-xl border border-danger/40 bg-danger/10 p-4 text-danger text-center">{error}</div>
	{:else if !result}
		<div class="grid min-h-64 place-items-center">
			<div class="text-center">
				<span class="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-surface-600 border-t-accent"></span>
				<p class="mt-4 text-text-secondary">Loading session…</p>
			</div>
		</div>
	{:else}
		<header class="glass rounded-2xl p-6 sm:p-8">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div>
					<p class="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Session review</p>
					<h1 class="mt-1 text-2xl font-bold text-text-primary sm:text-3xl">{typeLabel(result.type)}</h1>
					<p class="mt-1 text-sm text-text-secondary">{formatDate(result.completedAt)}</p>
				</div>
				<div class="text-right">
					<p class="text-4xl font-extrabold {scoreColor(result.percentage)}">{result.percentage}%</p>
					<p class="text-xs text-text-muted mt-1">
						{result.earnedPoints.toFixed(2)}/{result.possiblePoints} points
					</p>
				</div>
			</div>

			{#if Object.keys(result.domainBreakdown).length}
				<div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
					{#each Object.entries(result.domainBreakdown) as [domain, score]}
						<div class="rounded-xl bg-surface-700/60 p-3">
							<p class="text-xs text-text-muted">Domain {domain}</p>
							<p class="mt-1 text-base font-semibold text-text-primary">
								{score.earnedPoints.toFixed(1)}/{score.possiblePoints}
							</p>
							<div class="mt-1 h-1 overflow-hidden rounded-full bg-surface-600">
								<div
									class="h-full rounded-full {scoreColor(score.possiblePoints ? Math.round(score.earnedPoints / score.possiblePoints * 100) : 0)}"
									style="width: {score.possiblePoints ? Math.round(score.earnedPoints / score.possiblePoints * 100) : 0}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<p class="mt-4 text-sm text-text-muted">
				{result.fullyCorrect} of {result.totalQuestions} fully correct
				{result.flaggedQuestionIndexes?.length ? ` · ${result.flaggedQuestionIndexes.length} flagged` : ''}
			</p>
		</header>

		<div class="flex items-center gap-2">
			<button
				class="rounded-lg px-3 py-1.5 text-sm font-medium transition {filter === 'all' ? 'bg-accent text-white' : 'bg-surface-700 text-text-secondary hover:text-text-primary'}"
				type="button"
				onclick={() => filter = 'all'}>All ({result.review.length})</button
			>
			<button
				class="rounded-lg px-3 py-1.5 text-sm font-medium transition {filter === 'correct' ? 'bg-success text-white' : 'bg-surface-700 text-text-secondary hover:text-text-primary'}"
				type="button"
				onclick={() => filter = 'correct'}>Correct ({result.review.filter(r => r.feedback.fullyCorrect).length})</button
			>
			<button
				class="rounded-lg px-3 py-1.5 text-sm font-medium transition {filter === 'incorrect' ? 'bg-danger text-white' : 'bg-surface-700 text-text-secondary hover:text-text-primary'}"
				type="button"
				onclick={() => filter = 'incorrect'}>Incorrect ({result.review.filter(r => !r.feedback.fullyCorrect).length})</button
			>
			<button
				class="rounded-lg px-3 py-1.5 text-sm font-medium transition {filter === 'flagged' ? 'bg-accent-warm text-white' : 'bg-surface-700 text-text-secondary hover:text-text-primary'}"
				type="button"
				onclick={() => filter = 'flagged'}>Flagged ({result.flaggedQuestionIndexes.length})</button>
		</div>

		<div class="space-y-4">
			{#each filtered as review, i}
				{@const q = review.question}
				<div
					class="glass rounded-2xl p-5 border-l-4 {review.feedback.fullyCorrect
						? 'border-l-success'
						: review.feedback.earnedPoints > 0
							? 'border-l-accent-warm'
							: 'border-l-danger'}"
				>
					<div class="mb-3 flex flex-wrap items-center gap-2">
						<span class="rounded-full bg-surface-700 px-2.5 py-1 text-xs font-semibold text-text-primary">
							Q{i + 1}
						</span>
						<span class="rounded-full bg-info/10 px-2.5 py-1 text-xs font-medium text-info">
							Domain {q.domain}
						</span>
						<span class="rounded-full bg-surface-700 px-2.5 py-1 text-xs text-text-muted">
							{q.kind.replace('-', ' ')}
						</span>
						<span class="ml-auto text-sm font-semibold {review.feedback.fullyCorrect ? 'text-success' : 'text-danger'}">
							{review.feedback.earnedPoints}/{review.feedback.possiblePoints}
						</span>
					</div>

					{#if q.context}
						<div class="mb-3 rounded-xl border border-info/20 bg-info/5 p-3 text-sm leading-relaxed text-text-secondary">
							{q.context}
						</div>
					{/if}

					<p class="mb-4 text-base font-semibold leading-relaxed text-text-primary">{q.prompt}</p>

					{#if q.kind === 'single-choice' || q.kind === 'multiple-choice'}
						<div class="space-y-2">
							{#each q.options as option}
								{@const isCorrect = review.feedback.correctResponse.kind === 'choice' && review.feedback.correctResponse.optionIds.includes(option.id)}
								{@const isSelected = review.response?.kind === 'choice' && review.response.optionIds.includes(option.id)}
								<div
									class="rounded-xl border-2 p-3 text-sm {isCorrect
										? 'border-success bg-success/10'
										: isSelected
											? 'border-danger bg-danger/10'
											: 'border-border'}"
								>
									<div class="flex items-center gap-2">
										{#if isCorrect}
											<svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0 text-success" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m5 12 4 4L19 6"/></svg>
										{:else if isSelected}
											<svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0 text-danger" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 6 12 12M18 6 6 18"/></svg>
										{/if}
										<span class="text-text-primary">{option.text}</span>
									</div>
								</div>
							{/each}
						</div>
					{:else if q.kind === 'ordering'}
						<div class="space-y-2">
							<p class="text-xs font-semibold text-text-muted uppercase tracking-wide">Your order</p>
							{#if review.response?.kind === 'ordering'}
								<div class="flex flex-wrap gap-2">
									{#each review.response.itemIds as id, idx}
										<span class="rounded-lg bg-surface-700 px-2.5 py-1 text-sm text-text-primary">
											{idx + 1}. {q.items.find(i => i.id === id)?.text ?? id}
										</span>
									{/each}
								</div>
							{:else}
								<p class="text-sm italic text-text-muted">Not answered</p>
							{/if}
							<p class="mt-2 text-xs font-semibold text-text-muted uppercase tracking-wide">Correct order</p>
							<div class="flex flex-wrap gap-2">
								{#each q.items as item, idx}
									<span class="rounded-lg bg-success/10 px-2.5 py-1 text-sm text-text-primary">
										{idx + 1}. {item.text}
									</span>
								{/each}
							</div>
						</div>
					{:else if q.kind === 'matching'}
						<div class="space-y-2">
							<p class="text-xs font-semibold text-text-muted uppercase tracking-wide">Your matches</p>
							{#each q.premises as premise}
								{@const userMatch = review.response?.kind === 'matching' ? review.response.matches[premise.id] : ''}
								{@const correctMatch = review.feedback.correctResponse.kind === 'matching' ? review.feedback.correctResponse.matches[premise.id] : ''}
								{@const isMatchCorrect = userMatch === correctMatch}
								<div class="rounded-xl bg-surface-700/60 p-3 text-sm {!isMatchCorrect && userMatch ? 'border border-danger/30' : ''}">
									<div class="flex items-center gap-2">
										<span class="flex-1 text-text-primary">{premise.text}</span>
										<span class="text-text-muted">→</span>
										<span class="font-medium {isMatchCorrect ? 'text-success' : 'text-danger'}">{q.targets.find(t => t.id === (userMatch || correctMatch))?.text ?? '—'}</span>
										{#if !isMatchCorrect && correctMatch}
											<span class="text-xs text-text-muted">(correct: {q.targets.find(t => t.id === correctMatch)?.text})</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{:else if q.kind === 'numeric'}
						<div class="flex items-center gap-3 text-sm">
							<span class="text-text-muted">Your answer:</span>
							<span class="font-semibold text-text-primary">{review.response?.kind === 'numeric' ? review.response.value : '—'}</span>
							<span class="text-text-muted">({q.unit})</span>
							<span class="text-text-muted">· Correct:</span>
							<span class="font-semibold text-success">{review.feedback.correctResponse.kind === 'numeric' ? review.feedback.correctResponse.value : '—'}</span>
						</div>
					{:else if q.kind === 'evidence'}
						<div class="space-y-2">
							<p class="text-xs font-semibold text-text-muted uppercase tracking-wide">Log lines</p>
							<div class="space-y-1 font-mono text-sm">
								{#each q.artifact.lines as line}
									{@const isCorrect = review.feedback.correctResponse.kind === 'evidence' && review.feedback.correctResponse.lineIds.includes(line.id)}
									{@const isSelected = review.response?.kind === 'evidence' && review.response.lineIds.includes(line.id)}
									<div
										class="rounded-lg p-2 {isCorrect
											? 'bg-success/10 text-success'
											: isSelected
												? 'bg-danger/10 text-danger'
												: 'text-text-secondary'}"
									>
										{isCorrect ? '✓ ' : isSelected ? '✗ ' : '  '}{line.text}
									</div>
								{/each}
							</div>
						</div>
					{:else if q.kind === 'configuration'}
						<div class="space-y-2">
							<p class="text-xs font-semibold text-text-muted uppercase tracking-wide">Configuration</p>
							{#each q.fields as field}
								{@const userValue = review.response?.kind === 'configuration' ? review.response.values[field.id] : ''}
								{@const correctVal = review.feedback.correctResponse.kind === 'configuration' ? review.feedback.correctResponse.values[field.id] : ''}
								{@const isConfigCorrect = userValue === correctVal}
								<div class="rounded-xl bg-surface-700/60 p-3 text-sm">
									<div class="flex items-center gap-2">
										<span class="flex-1 text-text-secondary">{field.label}</span>
										<span class="font-medium {isConfigCorrect ? 'text-success' : 'text-danger'}">
											{field.options.find(o => o.id === (userValue || correctVal))?.text ?? '—'}
										</span>
										{#if !isConfigCorrect && correctVal}
											<span class="text-xs text-text-muted">(correct: {field.options.find(o => o.id === correctVal)?.text})</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{:else if q.kind === 'multi-step'}
						<div class="space-y-3">
							<p class="text-xs font-semibold text-text-muted uppercase tracking-wide">Multi-step responses</p>
							{#each q.steps as step, si}
								{@const stepFeedback = review.feedback.stepFeedback?.[si]}
								<div class="rounded-xl bg-surface-700/60 p-3 text-sm">
									<p class="mb-1 font-medium text-text-primary">Step {si + 1}: {step.prompt}</p>
									{#if stepFeedback}
										<p class="text-xs {stepFeedback.fullyCorrect ? 'text-success' : 'text-danger'}">
											{stepFeedback.earnedPoints}/{stepFeedback.possiblePoints} points
										</p>
									{/if}
								</div>
							{/each}
						</div>
					{/if}

					<div class="mt-4 rounded-xl border-l-4 p-3 text-sm {review.feedback.fullyCorrect ? 'border-l-success bg-success/10' : 'border-l-accent-warm bg-accent-warm/10'}">
						<strong class="text-text-primary">
							{review.feedback.fullyCorrect ? 'Correct' : 'Answer review'}
						</strong>
						<p class="mt-1 leading-relaxed text-text-secondary">{review.feedback.explanation}</p>
						{#if review.feedback.sourceRefs?.length}
							<div class="mt-2 flex flex-wrap gap-2">
								{#each review.feedback.sourceRefs as ref}
									<span class="rounded-full bg-surface-800 px-2 py-0.5 text-xs text-text-muted">
										{ref.source}: {ref.section}
									</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		{#if filtered.length === 0}
			<div class="glass rounded-2xl p-8 text-center">
				<p class="text-text-secondary">No questions match the selected filter.</p>
			</div>
		{/if}
	{/if}
</div>
