<script lang="ts">
	import { onMount } from 'svelte';

	type Course = { id: string; title: string; shortTitle: string };

	let { courses, activeCourseId, onswitch }: {
		courses: Course[];
		activeCourseId: string;
		onswitch: (id: string) => void;
	} = $props();

	let open = $state(false);
	let wrapper = $state<HTMLDivElement | null>(null);

	const activeCourse = $derived(courses.find((c) => c.id === activeCourseId) ?? courses[0]);

	function close() {
		open = false;
	}

	function handleWindowPointerDown(event: PointerEvent) {
		if (open && wrapper && !wrapper.contains(event.target as Node)) close();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) close();
	}
	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

<svelte:window onpointerdown={handleWindowPointerDown} />

<div class="relative" bind:this={wrapper}>
	<button
		class="flex h-11 items-center gap-1.5 rounded-md border border-border bg-surface-800 px-2.5 transition hover:border-border-strong hover:bg-surface-700 md:h-10"
		type="button"
		aria-haspopup="menu"
		aria-expanded={open}
		aria-label="Switch course"
		onclick={() => (open = !open)}
	>
		<svg
			viewBox="0 0 24 24"
			class="h-4 w-4 shrink-0 text-accent"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></svg
		>
		<span
			class="hidden sm:inline max-w-28 truncate text-sm font-semibold text-text-primary"
			>{activeCourse?.shortTitle ?? 'Course'}</span
		>
		<svg
			viewBox="0 0 24 24"
			class="h-4 w-4 shrink-0 text-text-subtle transition-transform duration-200 {open
				? 'rotate-180'
				: ''}"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			><path d="m6 9 6 6 6-6" /></svg
		>
	</button>

	{#if open}
		<div
			class="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(18rem,calc(100vw-1rem))] rounded-md border border-border bg-surface-900 p-2 shadow-2xl"
			role="menu"
			aria-label="Course"
		>
			<div class="px-2 py-1.5">
				<span class="eyebrow">Course</span>
			</div>
			<div class="space-y-1">
				{#each courses as course (course.id)}
					<button
						class="flex min-h-12 w-full items-center gap-3 rounded-md border border-border bg-surface-800/60 px-3 text-left transition hover:border-border-strong hover:bg-surface-700"
						type="button"
						role="menuitem"
						onclick={() => {
							close();
							onswitch(course.id);
						}}
					>
						<span class="min-w-0 flex-1">
							<span class="block font-bold text-text-primary">{course.shortTitle}</span>
							<span class="block truncate text-xs text-text-muted">{course.title}</span>
						</span>
						{#if course.id === activeCourseId}
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5 shrink-0 text-accent"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								><path d="m4 12.5 5 5L20 6.5" /></svg
							>
						{/if}
					</button>
				{/each}
			</div>
			<p class="mt-2 px-2 text-center text-xs text-text-muted">
				Exam date, syllabus, grades and review queue are per course.
			</p>
		</div>
	{/if}
</div>
