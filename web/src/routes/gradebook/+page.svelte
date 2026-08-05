<script lang="ts">
	import { onMount } from 'svelte';
	import ProgressRing from '$lib/components/ProgressRing.svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import { formatDate } from '$lib/utils';

	type CategoryGrade = {
		category: string;
		label: string;
		weight: number;
		earned: number;
		possible: number;
		percentage: number | null;
		submittedCount: number;
		totalCount: number;
	};
	type AssignmentGrade = {
		assignment: { id: string; title: string; kind: string; points: number };
		percentage: number;
		dueDate: string;
		status: 'open' | 'due-soon' | 'overdue' | 'in-progress' | 'submitted';
	};
	type Gradebook = {
		weightedPercentage: number | null;
		letterGrade: string;
		categories: CategoryGrade[];
		assignments: AssignmentGrade[];
		submittedAssignments: number;
		totalAssignments: number;
	};
	type Readiness = { score: number; label: string; passingScale: number; ready: boolean };

	let data = $state<{ gradebook: Gradebook; readiness: Readiness } | null>(null);
	let error = $state('');

	onMount(async () => {
		const response = await fetch('/api/gradebook');
		if (response.ok) data = await response.json();
		else error = 'Unable to load the gradebook.';
	});

	function kindLabel(kind: string): string {
		return kind === 'quiz'
			? 'Quiz'
			: kind === 'scenario'
				? 'Scenario'
				: kind === 'pbq'
					? 'PBQ'
					: 'Full Exam';
	}

	function pctClass(pct: number | null): string {
		if (pct === null) return 'text-text-muted';
		if (pct >= 85) return 'text-success';
		if (pct >= 60) return 'text-accent-warm';
		return 'text-danger';
	}
</script>

<div class="mx-auto max-w-5xl space-y-8">
	<div>
		<p class="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Evaluation</p>
		<h1 class="mt-1 text-2xl font-bold text-text-primary sm:text-3xl">Gradebook</h1>
		<p class="mt-2 text-text-secondary">
			Weighted categories: quizzes 30% · scenarios &amp; PBQs 20% · full exams 50%. Retakes keep
			your best score.
		</p>
	</div>

	{#if error}
		<section class="glass rounded-2xl p-6 text-danger">{error}</section>
	{:else if !data}
		<div class="grid min-h-64 place-items-center">
			<span class="h-10 w-10 animate-spin rounded-full border-4 border-surface-600 border-t-accent"
			></span>
		</div>
	{:else}
		{@const { gradebook, readiness } = data}
		<section class="glass grid gap-6 rounded-2xl p-6 sm:grid-cols-3 sm:p-8">
			<div class="flex flex-col items-center justify-center text-center">
				<ProgressRing
					value={gradebook.weightedPercentage ?? 0}
					size={120}
					stroke={12}
					label="Course grade"
				/>
				<p class="mt-3 text-sm text-text-muted">
					{gradebook.submittedAssignments}/{gradebook.totalAssignments} assignments graded
				</p>
			</div>
			<div class="flex flex-col items-center justify-center text-center">
				<p class="text-6xl font-extrabold gradient-text">{gradebook.letterGrade}</p>
				<p class="mt-2 text-sm text-text-muted">
					{gradebook.weightedPercentage === null
						? 'No grades yet'
						: `${gradebook.weightedPercentage}% weighted`}
				</p>
			</div>
			<div class="flex flex-col items-center justify-center text-center">
				<ProgressRing value={readiness.score} size={120} stroke={12} label="Readiness" />
				<p class="mt-3 text-sm {readiness.ready ? 'text-success' : 'text-accent-warm'}">
					{readiness.label}
				</p>
				<p class="text-xs text-text-muted">Projected {readiness.passingScale}/900</p>
			</div>
		</section>

		{#if gradebook.categories.some((c) => c.percentage !== null)}
			<section class="glass rounded-2xl p-5 sm:p-6">
				<h2 class="mb-4 text-lg font-bold text-text-primary">Category breakdown</h2>
				<div class="space-y-4">
					{#each gradebook.categories as category (category.category)}
						<div>
							<div class="flex items-center justify-between text-sm">
								<span class="font-medium text-text-primary">
									{category.label}
									<span class="ml-2 text-xs text-text-muted"
										>{Math.round(category.weight * 100)}% weight</span
									>
								</span>
								<span class="font-semibold {pctClass(category.percentage)}">
									{category.percentage === null ? 'Not attempted' : `${category.percentage}%`}
									<span class="ml-1 text-xs font-normal text-text-muted"
										>({category.earned.toFixed(1)}/{category.possible} pts)</span
									>
								</span>
							</div>
							<div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-600">
								<div
									class="h-full rounded-full {category.percentage === null
										? 'bg-surface-600'
										: category.percentage >= 85
											? 'bg-success'
											: category.percentage >= 60
												? 'bg-yellow-500'
												: 'bg-danger'}"
									style="width: {category.percentage ?? 0}%"
								></div>
							</div>
							<p class="mt-1 text-xs text-text-muted">
								{category.submittedCount}/{category.totalCount} assignments submitted
							</p>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<section class="glass rounded-2xl p-5 sm:p-6">
			<h2 class="mb-4 text-lg font-bold text-text-primary">All assignments</h2>
			<div class="overflow-x-auto">
				<table class="w-full min-w-[560px] text-sm">
					<thead>
						<tr
							class="border-b border-border text-left text-xs uppercase tracking-wide text-text-muted"
						>
							<th class="pb-3 pr-4 font-semibold">Assignment</th>
							<th class="pb-3 pr-4 font-semibold">Due</th>
							<th class="pb-3 pr-4 font-semibold">Points</th>
							<th class="pb-3 pr-4 font-semibold">Score</th>
							<th class="pb-3 font-semibold">Status</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each gradebook.assignments as item (item.assignment.id)}
							<tr class="transition hover:bg-surface-700/30">
								<td class="py-3 pr-4">
									<a
										href="/assignments/{item.assignment.id}"
										class="font-medium text-text-primary hover:text-accent"
									>
										<span
											class="mr-2 rounded bg-surface-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-text-muted"
											>{kindLabel(item.assignment.kind)}</span
										>
										{item.assignment.title}
									</a>
								</td>
								<td class="py-3 pr-4 text-text-muted">{formatDate(item.dueDate)}</td>
								<td class="py-3 pr-4 text-text-muted">{item.assignment.points}</td>
								<td
									class="py-3 pr-4 font-semibold {pctClass(
										item.status === 'submitted' ? item.percentage : null
									)}"
								>
									{item.status === 'submitted' ? `${item.percentage}%` : '—'}
								</td>
								<td class="py-3"><StatusChip status={item.status} /></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}
</div>
