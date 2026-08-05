<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import { relativeDue } from '$lib/utils';

	let { params } = $props();

	type AssignmentView = {
		assignment: {
			id: string;
			moduleId: string;
			title: string;
			description: string;
			kind: string;
			points: number;
			count: number;
			domain: number | null;
			mode: string;
			durationMinutes: number;
		};
		dueDateLabel: string;
		daysUntilDue: number;
		status: 'open' | 'due-soon' | 'overdue' | 'in-progress' | 'submitted';
		bestSubmission: { percentage: number; completedAt: string; sessionId: string } | null;
		launch: { type: string; mode: string; count: number; domain?: number };
	};

	let view = $state<AssignmentView | null>(null);
	let error = $state('');

	async function load() {
		const response = await fetch(`/api/course/assignments/${params.id}`);
		if (response.ok) view = await response.json();
		else error = 'Assignment not found.';
	}

	onMount(load);

	function launch() {
		if (!view) return;
		const { launch } = view;
		const params = new URLSearchParams({
			start: '1',
			type: launch.type,
			mode: launch.mode,
			count: String(launch.count),
			assignment: view.assignment.id
		});
		if (launch.domain) params.set('domain', String(launch.domain));
		goto(`/quiz?${params}`);
	}

	function kindLabel(kind: string): string {
		return kind === 'quiz'
			? 'Objective Quiz'
			: kind === 'scenario'
				? 'Scenario Set'
				: kind === 'pbq'
					? 'PBQ Set'
					: 'Full Exam';
	}
</script>

<div class="mx-auto max-w-3xl space-y-6">
	{#if error}
		<section class="glass rounded-2xl p-6 text-danger">{error}</section>
	{:else if !view}
		<div class="grid min-h-64 place-items-center">
			<span class="h-10 w-10 animate-spin rounded-full border-4 border-surface-600 border-t-accent"
			></span>
		</div>
	{:else}
		<div>
			<a
				href="/modules/{view.assignment.moduleId}"
				class="text-sm font-medium text-accent hover:underline">← Back to module</a
			>
			<div class="mt-4 flex flex-wrap items-center gap-3">
				<span
					class="rounded-md bg-surface-800 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted"
					>{kindLabel(view.assignment.kind)}</span
				>
				<StatusChip status={view.status} />
			</div>
			<h1 class="mt-3 text-2xl font-bold text-text-primary sm:text-3xl">{view.assignment.title}</h1>
			<p class="mt-3 text-text-secondary">{view.assignment.description}</p>
		</div>

		<section class="glass grid gap-4 rounded-2xl p-5 sm:grid-cols-2 sm:p-6">
			<div class="flex items-center gap-3">
				<span class="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
					<svg
						viewBox="0 0 24 24"
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><rect x="3" y="5" width="18" height="16" rx="2" /><path
							d="M8 3v4M16 3v4M3 10h18"
						/></svg
					>
				</span>
				<div>
					<p class="text-xs text-text-muted">Due date</p>
					<p class="font-semibold {view.daysUntilDue < 0 ? 'text-danger' : 'text-text-primary'}">
						{view.dueDateLabel}
					</p>
					<p class="text-xs text-text-muted">{relativeDue(view.daysUntilDue)}</p>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<span
					class="grid h-10 w-10 place-items-center rounded-xl bg-accent-warm/10 text-accent-warm"
				>
					<svg
						viewBox="0 0 24 24"
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg
					>
				</span>
				<div>
					<p class="text-xs text-text-muted">Format</p>
					<p class="font-semibold text-text-primary">
						{view.assignment.count} questions · {view.assignment.durationMinutes} minutes
					</p>
					<p class="text-xs text-text-muted">
						{view.assignment.mode === 'exam' ? 'Timed exam conditions' : 'Practice with feedback'} · {view
							.assignment.points} pts
					</p>
				</div>
			</div>
		</section>

		{#if view.bestSubmission}
			<section class="glass rounded-2xl p-5 sm:p-6">
				<h2 class="text-lg font-bold text-text-primary">Best submission</h2>
				<div class="mt-4 flex items-center gap-6">
					<div
						class="grid h-20 w-20 place-items-center rounded-2xl text-lg font-extrabold {view
							.bestSubmission.percentage >= 85
							? 'bg-success/15 text-success'
							: view.bestSubmission.percentage >= 60
								? 'bg-accent-warm/15 text-accent-warm'
								: 'bg-danger/15 text-danger'}"
					>
						{view.bestSubmission.percentage}%
					</div>
					<div>
						<p class="text-sm text-text-secondary">
							Submitted {new Date(view.bestSubmission.completedAt).toLocaleString('en-US', {
								month: 'short',
								day: 'numeric'
							})}
						</p>
						<a
							href="/history/{view.bestSubmission.sessionId}"
							class="mt-2 inline-block text-sm font-medium text-accent hover:underline"
							>Review answers →</a
						>
					</div>
				</div>
			</section>
		{/if}

		<div class="flex flex-col gap-3 sm:flex-row">
			<button
				class="h-12 flex-1 rounded-xl bg-gradient-to-r from-accent to-info px-8 font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
				type="button"
				onclick={launch}
			>
				{view.status === 'submitted'
					? 'Retake assignment'
					: view.status === 'in-progress'
						? 'Resume attempt'
						: 'Start assignment'}
			</button>
			<a
				href="/quiz"
				class="grid h-12 place-items-center rounded-xl border border-border px-6 font-medium text-text-secondary transition hover:border-border-strong hover:text-text-primary"
				>Free practice</a
			>
		</div>
	{/if}
</div>
