<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { DOMAIN_NAMES, getBarColor } from '$lib/utils';

	type Progress = Record<
		number,
		{ attempted: number; earnedPoints: number; possiblePoints: number; percentage: number }
	>;

	const modes = [
		{
			type: 'quiz' as const,
			title: 'Objective Quiz',
			description: '20 focused multiple-choice questions',
			accent: 'border-accent',
			icon: 'quiz'
		},
		{
			type: 'scenario' as const,
			title: 'Scenario Quiz',
			description: '10 applied security scenarios',
			accent: 'border-accent-secondary',
			icon: 'scenario'
		},
		{
			type: 'pbq' as const,
			title: 'PBQ Practice',
			description: 'Hands-on performance-based questions',
			accent: 'border-orange-500',
			icon: 'pbq'
		},
		{
			type: 'full' as const,
			title: 'Practice Exam',
			description: '90 questions · 90 minutes',
			accent: 'border-accent-warm',
			icon: 'exam'
		}
	];
	const domainColors = [
		'bg-accent',
		'bg-accent-secondary',
		'bg-info',
		'bg-success',
		'bg-accent-warm'
	];

	let progress = $state<Progress>({});
	let active = $state<{
		sessionId: string;
		type: string;
		answeredCount: number;
		totalQuestions: number;
		deadlineAt?: string;
	} | null>(null);

	onMount(async () => {
		const response = await fetch('/api/progress');
		if (response.ok) {
			const data = await response.json();
			progress = data.progress;
			active = data.activeSession;
		}
	});

	async function abandon() {
		if (!active) return;
		await fetch(`/api/quiz/session/${active.sessionId}`, { method: 'DELETE' });
		active = null;
	}

	function open(type: 'quiz' | 'scenario' | 'pbq' | 'full') {
		goto(
			type === 'full'
				? '/quiz?start=1&type=full&mode=exam'
				: `/${type === 'quiz' ? 'quiz' : type === 'scenario' ? 'scenarios' : 'pbq'}?start=1`
		);
	}
</script>

<div class="space-y-8">
	<section class="py-8 text-center sm:py-12">
		<svg
			viewBox="0 0 48 48"
			class="mx-auto mb-4 h-12 w-12 text-accent"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			><path d="M24 4 40 10v11c0 10.3-6.8 18.5-16 23C14.8 39.5 8 31.3 8 21V10l16-6Z" /><path
				d="m17 24 4.5 4.5L31 19"
			/></svg
		>
		<h1 class="gradient-text text-3xl font-extrabold sm:text-4xl lg:text-5xl">
			Security+ Practice Lab
		</h1>
		<p class="mx-auto mt-3 max-w-2xl text-base text-text-secondary sm:text-lg">
			Objective-aligned MCQs, realistic scenarios, and performance-based questions for focused
			study.
		</p>
	</section>

	{#if active}
		<section
			class="glass flex flex-col gap-4 rounded-2xl border-l-4 border-l-accent-warm p-5 sm:flex-row sm:items-center sm:justify-between"
		>
			<div class="flex items-start gap-3">
				<span class="mt-1.5 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-success"></span>
				<div>
					<strong class="text-text-primary">Active {active.type} session</strong>
					<p class="mt-1 text-sm text-text-muted">
						{active.answeredCount}/{active.totalQuestions} answered
					</p>
				</div>
			</div>
			<div class="flex gap-2">
				<button
					class="min-h-11 rounded-xl bg-accent px-4 font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
					onclick={() => goto(`/quiz?session=${active?.sessionId}`)}>Resume</button
				>
				<button
					class="min-h-11 rounded-xl border border-border px-4 font-medium text-text-secondary transition hover:border-border-strong hover:text-text-primary"
					onclick={abandon}>Abandon</button
				>
			</div>
		</section>
	{/if}

	<section class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each modes as mode}
			<button
				class="glass min-h-[72px] rounded-2xl border-l-4 {mode.accent} p-5 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
				onclick={() => open(mode.type)}
			>
				<div class="flex items-start gap-3">
					<div
						class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-700 text-accent"
					>
						{#if mode.icon === 'quiz'}<svg
								viewBox="0 0 24 24"
								class="h-6 w-6"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								><rect x="5" y="3" width="14" height="18" rx="2" /><path
									d="M9 3h6v3H9zM9 11h6M9 15h4"
								/></svg
							>
						{:else if mode.icon === 'scenario'}<svg
								viewBox="0 0 24 24"
								class="h-6 w-6 text-accent-secondary"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								><path
									d="M20 11.5a7.5 7.5 0 0 1-11.6 6.3L4 19l1.2-3.6A7.5 7.5 0 1 1 20 11.5Z"
								/></svg
							>
						{:else if mode.icon === 'pbq'}<svg
								viewBox="0 0 24 24"
								class="h-6 w-6 text-orange-500"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								><path
									d="M8 5.5 10.5 3l2.5 2.5L15.5 3 18 5.5 15.5 8 18 10.5 15.5 13 18 15.5 15.5 18 13 15.5 10.5 18 8 15.5 5.5 18 3 15.5 5.5 13 3 10.5 5.5 8 3 5.5 5.5 3 8 5.5Z"
								/></svg
							>
						{:else}<svg
								viewBox="0 0 24 24"
								class="h-6 w-6 text-accent-warm"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								><path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="8" /></svg
							>{/if}
					</div>
					<div>
						<div class="flex items-center gap-2">
							<h2 class="font-semibold text-text-primary">{mode.title}</h2>
							<span class="text-text-subtle">→</span>
						</div>
						<p class="mt-1 text-sm text-text-muted">{mode.description}</p>
					</div>
				</div>
			</button>
		{/each}
	</section>

	<section>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-bold text-text-primary">Domain progress</h2>
			<div class="flex items-center gap-4">
				<a class="text-sm font-medium text-accent hover:underline" href="/history">History</a>
				<a class="text-sm font-medium text-accent hover:underline" href="/progress">View details</a>
			</div>
		</div>
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
			{#each [1, 2, 3, 4, 5] as domain}
				{@const entry = progress[domain]}
				{@const percentage = entry?.percentage ?? 0}
				<div class="glass rounded-2xl p-4">
					<div class="flex items-start gap-2">
						<span class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full {domainColors[domain - 1]}"></span>
						<p class="min-h-10 text-xs font-medium leading-5 text-text-secondary">
							{DOMAIN_NAMES[domain]}
						</p>
					</div>
					<p class="mt-3 text-3xl font-bold text-text-primary">{percentage}%</p>
					<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-600">
						<div
							class="animate-progress h-full rounded-full {getBarColor(percentage)}"
							style={`width: ${percentage}%`}
						></div>
					</div>
					<p class="mt-2 text-xs text-text-muted">
						{entry?.earnedPoints ?? 0}/{entry?.possiblePoints ?? 0} points
					</p>
				</div>
			{/each}
		</div>
	</section>
</div>
