<script lang="ts">
	import { onMount, tick } from 'svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import LessonContent from '$lib/components/LessonContent.svelte';
	import ContextRail from '$lib/components/ContextRail.svelte';
	import { relativeDue } from '$lib/utils';

	let { params } = $props();

	type LessonView = {
		id: string;
		title: string;
		summary: string;
		content: string;
		objectiveIds?: string[];
		completed: boolean;
	};
	type AssignmentView = {
		assignment: {
			id: string;
			title: string;
			kind: string;
			points: number;
			description: string;
			count: number;
			durationMinutes: number;
		};
		dueDateLabel: string;
		daysUntilDue: number;
		status: 'open' | 'due-soon' | 'overdue' | 'in-progress' | 'submitted';
		bestSubmission: { percentage: number } | null;
	};
	type ModuleView = {
		module: { id: string; week: number; title: string; description: string };
		lessons: LessonView[];
		assignments: AssignmentView[];
		lessonsCompleted: number;
		lessonsTotal: number;
	};

	let moduleView = $state<ModuleView | null>(null);
	let error = $state('');
	let openLesson = $state<string | null>(null);

	async function load() {
		const response = await fetch(`/api/course/modules/${params.id}`);
		if (response.ok) moduleView = await response.json();
		else error = 'Module not found.';
	}

	onMount(load);

	async function toggleLesson(lesson: LessonView) {
		const completed = !lesson.completed;
		lesson.completed = completed;
		if (moduleView) {
			moduleView.lessonsCompleted = moduleView.lessons.filter((l) => l.completed).length;
		}
		await fetch(`/api/course/lessons/${lesson.id}`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ completed })
		});
	}

	async function jumpToLesson(lessonId: string) {
		openLesson = lessonId;
		await tick();
		document
			.getElementById(`lesson-${lessonId}`)
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

{#if error}
	<section class="card p-6 text-danger">{error}</section>
{:else if !moduleView}
	<div class="grid min-h-64 place-items-center">
		<span class="h-10 w-10 animate-spin rounded-full border-4 border-surface-600 border-t-accent"
		></span>
	</div>
{:else}
	<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8">
		<div class="space-y-5">
			<a href="/syllabus" class="touch-target text-sm font-semibold text-accent hover:underline"
				>← Syllabus</a
			>
			<section class="card p-6 sm:p-7">
				<p class="eyebrow">Week {moduleView.module.week}</p>
				<h1 class="h-display mt-2 text-3xl text-text-primary sm:text-4xl">
					{moduleView.module.title}
				</h1>
				<p class="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
					{moduleView.module.description}
				</p>
				<div class="mt-6 flex items-center gap-3">
					<div class="h-1.5 flex-1 overflow-hidden rounded bg-surface-600">
						<div
							class="animate-progress h-full rounded bg-accent"
							style="width: {moduleView.lessonsTotal
								? (moduleView.lessonsCompleted / moduleView.lessonsTotal) * 100
								: 0}%"
						></div>
					</div>
					<span class="shrink-0 text-sm font-bold text-text-secondary"
						>{moduleView.lessonsCompleted}/{moduleView.lessonsTotal} lessons</span
					>
				</div>
				<div class="mt-6 flex flex-wrap gap-3">
					<a class="btn btn-primary" href="/quiz?start=1&type=quiz&count=10">Mixed practice</a>
					<a class="btn btn-ghost" href="/pbq">PBQ drills</a>
				</div>
			</section>

			{#if moduleView.lessons.length}
				<section class="card p-5 sm:p-6">
					<h2 class="h-display text-xl text-text-primary">Lessons</h2>
					<p class="mb-4 mt-1 text-xs text-text-muted">
						Skim-only — the real work happens in the drills and assignments.
					</p>
					<div class="space-y-3">
						{#each moduleView.lessons as lesson (lesson.id)}
							<div
								class="scroll-mt-24 overflow-hidden rounded-xl border border-border bg-surface-900/50"
								id="lesson-{lesson.id}"
							>
								<div
									class="flex min-h-16 w-full cursor-pointer items-center gap-3 p-4 text-left transition hover:bg-surface-700/40"
									role="button"
									tabindex="0"
									onclick={() => (openLesson = openLesson === lesson.id ? null : lesson.id)}
									onkeydown={(event) => {
										if (event.key === 'Enter' || event.key === ' ') {
											event.preventDefault();
											openLesson = openLesson === lesson.id ? null : lesson.id;
										}
									}}
								>
									<button
										class="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded text-xs {lesson.completed
											? 'bg-success/10 text-success'
											: 'border border-border bg-surface-800 text-text-subtle'}"
										type="button"
										role="checkbox"
										aria-checked={lesson.completed}
										aria-label={lesson.completed
											? `Mark ${lesson.title} as not read`
											: `Mark ${lesson.title} as read`}
										onclick={(event) => {
											event.stopPropagation();
											toggleLesson(lesson);
										}}
									>
										{#if lesson.completed}
											<svg
												viewBox="0 0 24 24"
												class="h-4 w-4"
												fill="none"
												stroke="currentColor"
												stroke-width="3"><path d="m5 13 4 4L19 7" /></svg
											>
										{:else}<svg
												viewBox="0 0 24 24"
												class="h-4 w-4 text-text-subtle"
												fill="none"
												stroke="currentColor"
												stroke-width="3"><path d="m5 13 4 4L19 7" /></svg
											>{/if}
									</button>
									<span class="flex-1 font-bold text-text-primary">{lesson.title}</span>
									<span class="hidden text-xs text-text-muted sm:block"
										>{lesson.completed ? 'Completed' : 'Mark as read'}</span
									>
									<svg
										viewBox="0 0 24 24"
										class="h-5 w-5 shrink-0 text-text-subtle transition-transform {openLesson ===
										lesson.id
											? 'rotate-180'
											: ''}"
										fill="none"
										stroke="currentColor"
										stroke-width="2"><path d="m6 9 6 6 6-6" /></svg
									>
								</div>
								{#if openLesson === lesson.id}
									<div class="ruled bg-surface-800 px-4 py-4 sm:px-5">
										<p
											class="mb-4 rounded-xl bg-surface-900/60 p-4 text-sm leading-relaxed text-text-muted"
										>
											{lesson.summary}
										</p>

										{#if lesson.objectiveIds?.length}
											<div class="mb-4 flex flex-wrap gap-2">
												{#each lesson.objectiveIds as objectiveId (objectiveId)}
													<a
														class="btn btn-ghost h-11 px-4 text-sm"
														href="/quiz?start=1&type=quiz&objective={objectiveId}&count=5"
														>Drill {objectiveId}</a
													>
												{/each}
											</div>
										{/if}

										<LessonContent body={lesson.content} />
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</section>
			{/if}

			{#if moduleView.assignments.length}
				<section class="card p-5 sm:p-6">
					<h2 class="h-display mb-4 text-xl text-text-primary">Assignments</h2>
					<div class="space-y-2.5">
						{#each moduleView.assignments as item (item.assignment.id)}
							<a
								href="/assignments/{item.assignment.id}"
								class="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-900/50 p-4 transition hover:border-border-strong hover:bg-surface-700/50"
							>
								<div class="min-w-0">
									<div class="flex flex-wrap items-center gap-2">
										<span class="chip bg-surface-700 text-text-muted"
											>{kindLabel(item.assignment.kind)}</span
										>
										<p class="truncate font-bold text-text-primary">{item.assignment.title}</p>
									</div>
									<p class="mt-1 text-xs text-text-muted">
										{item.assignment.count} questions · {item.assignment.durationMinutes} min ·
										{item.assignment.points} pts · {item.dueDateLabel}
									</p>
								</div>
								<div class="flex shrink-0 items-center gap-3">
									{#if item.bestSubmission}
										<span
											class="num-display text-sm {item.bestSubmission.percentage >= 85
												? 'text-success'
												: 'text-warning'}">{item.bestSubmission.percentage}%</span
										>
									{:else}
										<span class="hidden text-xs text-text-muted sm:block"
											>{relativeDue(item.daysUntilDue)}</span
										>
										<StatusChip status={item.status} />
									{/if}
								</div>
							</a>
						{/each}
					</div>
				</section>
			{/if}
		</div>

		<ContextRail title="In this module">
			<div class="card p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Lessons</p>
				<div class="mt-3 space-y-1">
					{#each moduleView.lessons as lesson (lesson.id)}
						<button
							type="button"
							class="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 text-left text-sm text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
							onclick={() => jumpToLesson(lesson.id)}
						>
							<span
								class="grid h-5 w-5 shrink-0 place-items-center rounded {lesson.completed
									? 'bg-success/15 text-success'
									: 'border border-border text-transparent'}"
							>
								<svg
									viewBox="0 0 24 24"
									class="h-3 w-3"
									fill="none"
									stroke="currentColor"
									stroke-width="3"><path d="m5 13 4 4L19 7" /></svg
								>
							</span>
							<span class="min-w-0 flex-1 truncate">{lesson.title}</span>
						</button>
					{/each}
				</div>
			</div>
			{#if moduleView.assignments.length}
				<div class="card p-5">
					<p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
						Assignments
					</p>
					<div class="mt-3 space-y-2.5">
						{#each moduleView.assignments as item (item.assignment.id)}
							<a
								href="/assignments/{item.assignment.id}"
								class="block rounded-xl border border-border bg-surface-900/50 p-3 transition hover:border-border-strong hover:bg-surface-700/50"
							>
								<p class="text-sm font-semibold text-text-primary">{item.assignment.title}</p>
								<div class="mt-1.5 flex items-center justify-between gap-2">
									<span class="text-xs text-text-muted">{item.dueDateLabel}</span>
									{#if item.bestSubmission}
										<span
											class="num-display text-xs {item.bestSubmission.percentage >= 85
												? 'text-success'
												: 'text-warning'}">{item.bestSubmission.percentage}%</span
										>
									{:else}
										<StatusChip status={item.status} />
									{/if}
								</div>
							</a>
						{/each}
					</div>
				</div>
			{/if}
			<div class="card p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
					Quick actions
				</p>
				<div class="mt-3 flex flex-col gap-2">
					<a class="btn btn-primary w-full" href="/quiz?start=1&type=quiz&count=10"
						>Mixed practice</a
					>
					<a class="btn btn-ghost w-full" href="/progress?tab=mastery">Mastery grid</a>
				</div>
			</div>
		</ContextRail>
	</div>
{/if}
