<script lang="ts">
	import { onMount } from 'svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import ExamDateEditor from '$lib/components/ExamDateEditor.svelte';
	import ContextRail from '$lib/components/ContextRail.svelte';
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
		overridden: boolean;
		derivedDueDateLabel: string;
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

	async function load() {
		const response = await fetch('/api/course/syllabus');
		if (response.ok) data = await response.json();
		else error = 'Unable to load the syllabus.';
	}

	onMount(load);

	function kindLabel(kind: string): string {
		return kind === 'quiz'
			? 'Quiz'
			: kind === 'scenario'
				? 'Scenario'
				: kind === 'pbq'
					? 'PBQ'
					: 'Full Exam';
	}

	const totals = $derived.by(() => {
		const modules = data?.modules ?? [];
		return {
			lessonsDone: modules.reduce((sum, m) => sum + m.lessonsCompleted, 0),
			lessonsTotal: modules.reduce((sum, m) => sum + m.lessonsTotal, 0),
			assignmentsDone: modules.reduce((sum, m) => sum + m.assignmentsSubmitted, 0),
			assignmentsTotal: modules.reduce((sum, m) => sum + m.assignmentsTotal, 0)
		};
	});
</script>

{#if error}
	<section class="card p-6 text-danger">{error}</section>
{:else if !data}
	<div class="grid min-h-64 place-items-center">
		<span class="h-10 w-10 animate-spin rounded-full border-4 border-surface-600 border-t-accent"
		></span>
	</div>
{:else}
	<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8">
		<div class="space-y-5">
			<header class="card p-6 sm:p-7">
				<p class="eyebrow">Course schedule</p>
				<h1 class="h-display mt-2 text-3xl text-text-primary sm:text-4xl">The path to exam day</h1>
				<p class="mt-3 text-sm leading-relaxed text-text-secondary">
					Four modules, {totals.lessonsTotal} lessons, and {totals.assignmentsTotal} graded assignments,
					all back-scheduled from
					<span class="font-semibold text-text-primary">{formatDate(data.examDate)}</span>.
				</p>
				<div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
					<div class="rounded-xl border border-border bg-surface-900/50 p-3.5">
						<p class="num-display text-2xl text-text-primary">
							{totals.lessonsDone}/{totals.lessonsTotal}
						</p>
						<p class="mt-0.5 text-xs text-text-muted">Lessons read</p>
					</div>
					<div class="rounded-xl border border-border bg-surface-900/50 p-3.5">
						<p class="num-display text-2xl text-text-primary">
							{totals.assignmentsDone}/{totals.assignmentsTotal}
						</p>
						<p class="mt-0.5 text-xs text-text-muted">Assignments in</p>
					</div>
					<div class="rounded-xl border border-border bg-surface-900/50 p-3.5">
						<p
							class="num-display text-2xl {data.daysUntilExam < 7
								? 'text-accent'
								: 'text-text-primary'}"
						>
							{data.daysUntilExam < 0 ? 0 : data.daysUntilExam}
						</p>
						<p class="mt-0.5 text-xs text-text-muted">Days to exam</p>
					</div>
				</div>
			</header>

			{#each data.modules as module (module.module.id)}
				<section class="card overflow-hidden" id="week-{module.module.week}">
					<header class="border-b border-border p-5 sm:p-6">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div class="flex items-center gap-3.5">
								<span
									class="serif-italic grid h-11 w-11 shrink-0 place-items-center rounded bg-accent/10 text-sm text-accent"
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
							<a href="/modules/{module.module.id}" class="btn btn-ghost">Open module</a>
						</div>
						<div class="mt-4 h-2 overflow-hidden rounded bg-surface-600">
							<div
								class="animate-progress h-full rounded bg-accent"
								style="width: {module.assignmentsTotal
									? (module.assignmentsSubmitted / module.assignmentsTotal) * 100
									: 0}%"
							></div>
						</div>
					</header>
					<div class="space-y-2 p-4 sm:p-5">
						{#each module.lessons as lesson (lesson.id)}
							<a
								href="/modules/{module.module.id}"
								class="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-surface-900/50 p-4 transition hover:border-border-strong hover:bg-surface-700/50"
							>
								<span
									class="grid h-6 w-6 shrink-0 place-items-center rounded text-[11px] {lesson.completed
										? 'bg-success/10 text-success'
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
								class="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-surface-900/50 p-4 transition hover:border-border-strong hover:bg-surface-700/50"
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
									{#if item.overridden}
										<span
											class="chip ml-1 bg-accent/10 text-accent"
											title="Pinned by a due-date override (schedule would give {item.derivedDueDateLabel})"
											>pinned</span
										>
									{/if}
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

		<ContextRail title="Exam & schedule">
			<div class="card p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Exam date</p>
				<p class="h-display mt-1.5 text-2xl text-text-primary">{formatDate(data.examDate)}</p>
				<p class="mt-1 text-sm text-text-secondary">
					{data.daysUntilExam < 0
						? `${-data.daysUntilExam} days ago`
						: `${data.daysUntilExam} days to go`}
				</p>
				<div class="mt-4">
					<ExamDateEditor examDate={data.examDate} onsaved={load} />
				</div>
			</div>
			<nav class="card p-5" aria-label="Jump to module">
				<p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Modules</p>
				<div class="mt-3 space-y-1">
					{#each data.modules as module (module.module.id)}
						<a
							href="#week-{module.module.week}"
							class="flex min-h-11 items-center gap-2.5 rounded-lg px-2 text-sm text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
						>
							<span class="serif-italic text-accent">W{module.module.week}</span>
							<span class="min-w-0 flex-1 truncate">{module.module.title}</span>
							<span class="text-xs text-text-subtle"
								>{module.assignmentsSubmitted}/{module.assignmentsTotal}</span
							>
						</a>
					{/each}
				</div>
			</nav>
			<div class="card p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Progress</p>
				<div class="mt-3 space-y-3">
					<div>
						<div class="flex justify-between text-xs">
							<span class="text-text-muted">Lessons</span>
							<span class="font-bold text-text-secondary"
								>{totals.lessonsDone}/{totals.lessonsTotal}</span
							>
						</div>
						<div class="mt-1 h-1.5 overflow-hidden rounded bg-surface-600">
							<div
								class="h-full rounded bg-accent-secondary"
								style="width: {totals.lessonsTotal
									? (totals.lessonsDone / totals.lessonsTotal) * 100
									: 0}%"
							></div>
						</div>
					</div>
					<div>
						<div class="flex justify-between text-xs">
							<span class="text-text-muted">Assignments</span>
							<span class="font-bold text-text-secondary"
								>{totals.assignmentsDone}/{totals.assignmentsTotal}</span
							>
						</div>
						<div class="mt-1 h-1.5 overflow-hidden rounded bg-surface-600">
							<div
								class="h-full rounded bg-accent"
								style="width: {totals.assignmentsTotal
									? (totals.assignmentsDone / totals.assignmentsTotal) * 100
									: 0}%"
							></div>
						</div>
					</div>
				</div>
			</div>
		</ContextRail>
	</div>
{/if}
