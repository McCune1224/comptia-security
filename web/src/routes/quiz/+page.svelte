<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ExamFlow from '$lib/components/ExamFlow.svelte';
	import type { SessionType } from '$lib/types';
	import { DOMAIN_NAMES, OBJECTIVES_BY_DOMAIN } from '$lib/utils';

	let started = $derived(
		Boolean(page.url.searchParams.get('session')) ||
			page.url.searchParams.get('start') === '1' ||
			page.url.searchParams.get('review') !== null
	);
	let reviewSource = $derived(
		(page.url.searchParams.get('review') as 'daily' | 'wall' | null) ?? undefined
	);
	let sessionType = $derived(
		(page.url.searchParams.get('type') === 'full' ? 'full' : 'quiz') as SessionType
	);
	let count = $state(Number(page.url.searchParams.get('count')) || 20);
	let domain = $state<number | undefined>(
		page.url.searchParams.get('domain') ? Number(page.url.searchParams.get('domain')) : undefined
	);
	let objective = $state<string | undefined>(
		page.url.searchParams.get('objective') ?? undefined
	);
	let mode = $state<'practice' | 'exam'>(
		(page.url.searchParams.get('mode') as 'practice' | 'exam') || 'practice'
	);
	let assignmentId = $state<string | undefined>(
		page.url.searchParams.get('assignment') ?? undefined
	);

	function onDone() {
		goto(assignmentId ? `/assignments/${assignmentId}` : '/');
	}
</script>

{#if started}
	<ExamFlow
		type={reviewSource ? 'review' : sessionType}
		count={reviewSource ? 10 : count}
		domain={reviewSource ? undefined : domain}
		objective={reviewSource ? undefined : objective}
		mode={reviewSource ? 'practice' : mode}
		{assignmentId}
		{reviewSource}
		onDone={() => {
			if (reviewSource) {
				goto('/review');
				return;
			}
			onDone();
			return;
		}}
	/>
{:else}
	<div class="mx-auto max-w-lg space-y-6 py-4 sm:py-8">
		<div>
			<div class="mb-3 grid h-12 w-12 place-items-center rounded-md bg-accent/15 text-accent">
				<svg
					viewBox="0 0 24 24"
					class="h-6 w-6"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					><rect x="5" y="3" width="14" height="18" rx="2" /><path
						d="M9 3h6v3H9zM9 11h6M9 15h4"
					/></svg
				>
			</div>
			<h1 class="h-display text-3xl text-text-primary">Free Practice Quiz</h1>
			<p class="mt-2 leading-relaxed text-text-secondary">
				Build confidence across Security+ objectives with focused, adaptive practice. Free practice
				sessions don't count toward your course grade.
			</p>
		</div>
		<div class="card space-y-5 p-6 sm:p-8">
			<label class="block text-sm font-bold text-text-secondary"
				>Question count<select class="mt-1.5" bind:value={count}
					><option value={5}>5 questions</option><option value={10}>10 questions</option><option
						value={20}>20 questions</option
					><option value={50}>50 questions</option></select
				></label
			>
			<label class="block text-sm font-bold text-text-secondary"
				>Domain<select class="mt-1.5" bind:value={domain}
					><option value={undefined}>All domains</option>{#each [1, 2, 3, 4, 5] as item}<option
							value={item}>{DOMAIN_NAMES[item]}</option
						>{/each}</select
				></label
			>
			{#if domain}
				<label class="block text-sm font-bold text-text-secondary"
					>Objective<select
						class="mt-1.5"
						bind:value={objective}
						onchange={() => {
							if (objective) count = 5;
							else count = 20;
						}}
						><option value={undefined}>All objectives</option
						>{#each OBJECTIVES_BY_DOMAIN[domain] as item}<option value={item}>{item}</option
						>{/each}</select
					></label
				>
			{/if}
			<fieldset>
				<legend class="mb-1.5 block text-sm font-bold text-text-secondary">Session mode</legend>
				<div class="grid grid-cols-2 rounded-md bg-surface-700 p-1">
					<button
						class="min-h-11 rounded px-3 text-sm font-bold transition {mode === 'practice'
							? 'bg-surface-800 text-text-primary'
							: 'text-text-muted'}"
						type="button"
						onclick={() => (mode = 'practice')}>Practice</button
					><button
						class="min-h-11 rounded px-3 text-sm font-bold transition {mode === 'exam'
							? 'bg-surface-800 text-text-primary'
							: 'text-text-muted'}"
						type="button"
						onclick={() => (mode = 'exam')}>Exam</button
					>
				</div>
			</fieldset>
			<button
				class="btn btn-primary w-full sm:w-auto"
				onclick={() =>
					goto(
						`/quiz?start=1&count=${count}&domain=${domain ?? ''}&objective=${objective ?? ''}&mode=${mode}`
					)}
				>Start quiz</button
			>
		</div>
	</div>
{/if}
