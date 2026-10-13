<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	type Entry = { label: string; hint: string; href: string; group: string };

	const sections: Entry[] = [
		{ label: 'Home', hint: 'Dashboard', href: '/', group: 'Go to' },
		{ label: 'Course', hint: 'Syllabus, modules, lessons', href: '/syllabus', group: 'Go to' },
		{ label: 'Practice', hint: 'Drills, scenarios, PBQs', href: '/practice', group: 'Go to' },
		{ label: 'Review', hint: "Today's 10, wall of shame", href: '/review', group: 'Go to' },
		{ label: 'Progress', hint: 'Grades, mastery, sessions', href: '/progress', group: 'Go to' },
		{ label: 'Calendar', hint: 'Deadlines', href: '/calendar', group: 'Go to' },
		{ label: 'Admin', hint: 'Exam date, backups', href: '/admin', group: 'Go to' }
	];

	let entries = $state<Entry[]>(sections);
	let query = $state('');
	let cursor = $state(0);
	let inputEl = $state<HTMLInputElement | null>(null);
	let loadedLessons = false;

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return entries;
		return entries.filter(
			(e) => e.label.toLowerCase().includes(q) || e.hint.toLowerCase().includes(q)
		);
	});

	async function loadLessons() {
		if (loadedLessons) return;
		loadedLessons = true;
		const response = await fetch('/api/course/overview');
		if (!response.ok) return;
		const data = (await response.json()) as {
			modules?: { module: { id: string; title: string; week: number } }[];
		};
		const extra: Entry[] = (data.modules ?? []).map((m) => ({
			label: `Week ${m.module.week}: ${m.module.title}`,
			hint: 'Module',
			href: `/modules/${m.module.id}`,
			group: 'Modules'
		}));
		entries = [...sections, ...extra];
	}

	$effect(() => {
		if (open) {
			loadedLessons = false;
			query = '';
			cursor = 0;
			void loadLessons();
			void tick().then(() => inputEl?.focus());
		}
	});

	function choose(entry: Entry) {
		open = false;
		void goto(entry.href);
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			open = false;
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			cursor = Math.min(cursor + 1, filtered.length - 1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			cursor = Math.max(cursor - 1, 0);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			const entry = filtered[cursor];
			if (entry) choose(entry);
		}
	}

	onMount(() => {
		function onGlobalKeydown(event: KeyboardEvent) {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				open = !open;
			}
		}
		window.addEventListener('keydown', onGlobalKeydown);
		return () => window.removeEventListener('keydown', onGlobalKeydown);
	});
</script>

{#if open}
	<div class="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
		<button
			type="button"
			class="absolute inset-0 bg-black/40 backdrop-blur-sm"
			aria-label="Close search"
			onclick={() => (open = false)}
		></button>
		<div
			class="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface-800 shadow-[var(--shadow-lift)]"
			role="dialog"
			aria-modal="true"
			aria-label="Search and jump"
		>
			<div class="flex items-center gap-3 border-b border-border px-4">
				<svg
					viewBox="0 0 24 24"
					class="h-5 w-5 shrink-0 text-text-subtle"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg
				>
				<input
					bind:this={inputEl}
					bind:value={query}
					onkeydown={onKeydown}
					oninput={() => (cursor = 0)}
					placeholder="Jump to a page or module…"
					class="min-h-14 flex-1 border-0 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-subtle"
					aria-label="Search"
				/>
			</div>
			<ul class="max-h-[46vh] overflow-y-auto p-2" role="listbox">
				{#each filtered as entry, index (entry.href)}
					<li>
						<button
							type="button"
							class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition {index ===
							cursor
								? 'bg-accent/12'
								: 'hover:bg-surface-700'}"
							role="option"
							aria-selected={index === cursor}
							onmouseenter={() => (cursor = index)}
							onclick={() => choose(entry)}
						>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-sm font-semibold text-text-primary"
									>{entry.label}</span
								>
								<span class="block truncate text-xs text-text-muted">{entry.hint}</span>
							</span>
							<span class="shrink-0 text-[10px] font-bold uppercase tracking-wide text-text-subtle">
								{entry.group}
							</span>
						</button>
					</li>
				{:else}
					<li class="px-3 py-6 text-center text-sm text-text-muted">Nothing matches that.</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}
