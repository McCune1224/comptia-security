<script lang="ts">
	import { onMount } from 'svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import { formatDate, relativeDue } from '$lib/utils';

	type AssignmentView = {
		assignment: {
			id: string;
			title: string;
			kind: string;
			points: number;
			count: number;
			mode: string;
			durationMinutes: number;
		};
		dueDateLabel: string;
		daysUntilDue: number;
		status: 'open' | 'due-soon' | 'overdue' | 'in-progress' | 'submitted';
		bestSubmission: { percentage: number } | null;
	};
	type LessonView = { id: string; title: string; completed: boolean };
	type ModuleView = {
		module: { id: string; week: number; title: string; description: string };
		lessons: LessonView[];
		assignments: AssignmentView[];
		lessonsCompleted: number;
		lessonsTotal: number;
		assignmentsSubmitted: number;
		assignmentsTotal: number;
	};

	let data = $state<{ modules: ModuleView[]; examDate: string; daysUntilExam: number } | null>(
		null
	);
	let error = $state('');
	let examDateInput = $state('');
	let savingExamDate = $state(false);
	let examDateSaved = $state(false);

	onMount(async () => {
		const response = await fetch('/api/course/syllabus');
		if (response.ok) {
			const payload = await response.json();
			data = payload;
			examDateInput = payload.examDate;
		} else error = 'Unable to load the syllabus.';
	});

	async function saveExamDate() {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(examDateInput)) return;
		savingExamDate = true;
		examDateSaved = false;
		const response = await fetch('/api/course/exam-date', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ examDate: examDateInput })
		});
		savingExamDate = false;
		if (response.ok) {
			examDateSaved = true;
			const refreshed = await fetch('/api/course/syllabus');
			if (refreshed.ok) data = await refreshed.json();
		}
	}

	function kindLabel(kind: string): string {
		return kind === 'quiz'
			? 'Quiz'
			: kind === 'scenario'
				? 'Scenario'
				: kind === 'pbq'
					? 'PBQ'
					: 'Full Exam';
	}
</script>

<div class="mx-auto max-w-5xl space-y-8">
	<div>
		<p class="eyebrow">Course schedule</p>
		<h1 class="h-display mt-1 text-3xl text-text-primary sm:text-4xl">Syllabus</h1>
		{#if data}
			<p class="mt-3 text-text-secondary">
				Exam date:
				<span class="font-bold text-text-primary">{formatDate(data.examDate)}</span>
				<span class="mx-2 text-text-subtle">·</span>
				{data.daysUntilExam < 0
					? `${-data.daysUntilExam} days ago`
					: `${data.daysUntilExam} days to go`}
			</p>
			<div class="mt-4 flex flex-wrap items-center gap-2">
				<label class="text-sm font-semibold text-text-muted" for="exam-date-input"
					>Change exam date</label
				>
				<input
					id="exam-date-input"
					type="date"
					class="h-11 rounded-md border border-border-strong bg-surface-800 px-3 text-sm text-text-primary"
					bind:value={examDateInput}
				/>
				<button
					class="btn btn-primary h-11 px-4 text-xs"
					type="button"
					disabled={savingExamDate || !/^\d{4}-\d{2}-\d{2}$/.test(examDateInput)}
					onclick={saveExamDate}
				>
					{savingExamDate ? 'Saving…' : 'Save'}
				</button>
				{#if examDateSaved}
					<span class="text-xs font-semibold text-success"
						>Schedule updated — all due dates recalculated.</span
					>
				{/if}
			</div>
		{/if}
	</div>

	{#if error}
		<section class="card p-6 text-danger">{error}</section>
	{:else if !data}
		<div class="grid min-h-64 place-items-center">
			<span class="h-10 w-10 animate-spin rounded-full border-4 border-surface-600 border-t-accent"
			></span>
		</div>
	{:else}
		<div class="space-y-6">
			{#each data.modules as module (module.module.id)}
				<section class="card overflow-hidden">
					<header class="border-b border-border bg-surface-900/60 p-5">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div class="flex items-center gap-3">
								<span
									class="num-display grid h-11 w-11 shrink-0 place-items-center rounded-md bg-accent/15 text-sm text-accent"
									>W{module.module.week}</span
								>
								<div>
									<h2 class="h-display text-xl text-text-primary">{module.module.title}</h2>
									<p class="mt-0.5 text-xs text-text-muted">
										{module.lessonsCompleted}/{module.lessonsTotal} lessons · {module.assignmentsSubmitted}/{module.assignmentsTotal}
										assignments submitted
									</p>
								</div>
							</div>
							<a href="/modules/{module.module.id}" class="btn btn-ghost h-11 px-4 text-xs"
								>Open module</a
							>
						</div>
						<div class="mt-4 h-2 overflow-hidden rounded-full bg-surface-600">
							<div
								class="animate-progress h-full rounded-full bg-accent"
								style="width: {module.assignmentsTotal
									? (module.assignmentsSubmitted / module.assignmentsTotal) * 100
									: 0}%"
							></div>
						</div>
					</header>
					<div class="divide-y divide-border">
						{#each module.lessons as lesson (lesson.id)}
							<a
								href="/modules/{module.module.id}"
								class="flex min-h-14 items-center gap-3 px-5 py-3 transition hover:bg-surface-700/40"
							>
								<span
									class="grid h-6 w-6 shrink-0 place-items-center rounded text-[11px] {lesson.completed
										? 'bg-success/15 text-success'
										: 'border border-border text-transparent'}"
								>
									<svg
										viewBox="0 0 24 24"
										class="h-3.5 w-3.5"
										fill="none"
										stroke="currentColor"
										stroke-width="3"><path d="m5 13 4 4L19 7" /></svg
									>
								</span>
								<span class="flex-1 text-sm text-text-secondary">{lesson.title}</span>
								<span class="text-xs text-text-subtle">Lesson</span>
							</a>
						{/each}
						{#each module.assignments as item (item.assignment.id)}
							<a
								href="/assignments/{item.assignment.id}"
								class="flex min-h-14 items-center gap-3 px-5 py-3 transition hover:bg-surface-700/40"
							>
								<span class="chip w-20 shrink-0 justify-center bg-surface-700 text-text-muted"
									>{kindLabel(item.assignment.kind)}</span
								>
								<span class="min-w-0 flex-1 truncate text-sm font-bold text-text-primary">
									{item.assignment.title}
								</span>
								<span class="hidden text-xs text-text-muted sm:block">
									{item.assignment.count} q · {item.assignment.durationMinutes} min
								</span>
								<span
									class="hidden text-xs font-semibold md:block {item.daysUntilDue < 0
										? 'text-danger'
										: 'text-text-muted'}"
								>
									{item.dueDateLabel}
								</span>
								<span class="hidden text-xs text-text-subtle lg:block">
									{relativeDue(item.daysUntilDue)}
								</span>
								{#if item.bestSubmission}
									<span
										class="num-display text-sm {item.bestSubmission.percentage >= 85
											? 'text-success'
											: 'text-warning'}">{item.bestSubmission.percentage}%</span
									>
								{:else}
									<StatusChip status={item.status} />
								{/if}
							</a>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{/if}
</div>
