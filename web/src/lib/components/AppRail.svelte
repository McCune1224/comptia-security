<script lang="ts">
	import { onMount } from 'svelte';

	let {
		currentPath,
		pinned = $bindable(false),
		onopenpalette
	}: { currentPath: string; pinned?: boolean; onopenpalette?: () => void } = $props();

	let hovering = $state(false);
	const expanded = $derived(pinned || hovering);

	type Item = { href: string; label: string; match: string[]; icon: string; group: string };
	const items: Item[] = [
		{ href: '/', label: 'Home', match: ['/#'], icon: 'home', group: 'Study' },
		{
			href: '/syllabus',
			label: 'Course',
			match: ['/syllabus', '/modules', '/assignments'],
			icon: 'course',
			group: 'Study'
		},
		{
			href: '/practice',
			label: 'Practice',
			match: ['/practice', '/quiz', '/scenarios', '/pbq'],
			icon: 'practice',
			group: 'Drill'
		},
		{ href: '/review', label: 'Review', match: ['/review'], icon: 'review', group: 'Drill' },
		{
			href: '/progress',
			label: 'Progress',
			match: ['/progress', '/gradebook', '/mastery', '/history'],
			icon: 'progress',
			group: 'Track'
		},
		{ href: '/calendar', label: 'Calendar', match: ['/calendar'], icon: 'calendar', group: 'Track' }
	];

	const groups = ['Study', 'Drill', 'Track'];

	function isActive(item: Item): boolean {
		return item.match.some((prefix) =>
			prefix.endsWith('#') ? currentPath === prefix.slice(0, -1) : currentPath.startsWith(prefix)
		);
	}

	onMount(() => {
		pinned = localStorage.getItem('rail-pinned') === 'true';
	});

	function togglePin() {
		pinned = !pinned;
		localStorage.setItem('rail-pinned', String(pinned));
	}
</script>

<aside
	class="fixed inset-y-0 left-0 z-[60] hidden flex-col border-r border-border bg-surface-900 transition-[width] duration-200 ease-out lg:flex {expanded
		? 'w-[14.5rem]'
		: 'w-16'}"
	onmouseenter={() => (hovering = true)}
	onmouseleave={() => (hovering = false)}
>
	<a
		href="/"
		class="flex h-16 shrink-0 items-center gap-3 overflow-hidden px-4"
		aria-label="CompTIA Security+ home"
	>
		<span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-on-accent">
			<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M12 3 4 6.5v4.6c0 4.6 3.2 7.6 8 9.4 4.8-1.8 8-4.8 8-9.4V6.5L12 3Z" />
			</svg>
		</span>
		<span class="min-w-0 flex-col leading-tight {expanded ? 'flex' : 'hidden'}">
			<span class="h-display text-base text-text-primary">CompTIA</span>
			<span class="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted"
				>Security+</span
			>
		</span>
	</a>

	<nav
		class="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-2 py-2"
		aria-label="Main navigation"
	>
		{#each groups as group (group)}
			<p
				class="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-text-subtle {expanded
					? 'block'
					: 'hidden'}"
			>
				{group}
			</p>
			{#each items.filter((i) => i.group === group) as item (item.href)}
				{@const active = isActive(item)}
				<a
					href={item.href}
					class="group flex min-h-11 items-center gap-3 rounded-xl px-3 transition {active
						? 'bg-accent/12 text-accent'
						: 'text-text-secondary hover:bg-surface-700 hover:text-text-primary'}"
					aria-current={active ? 'page' : undefined}
					aria-label={item.label}
					title={expanded ? undefined : item.label}
				>
					<span class="grid h-6 w-6 shrink-0 place-items-center">
						{#if item.icon === 'home'}
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5"
								fill={active ? 'currentColor' : 'none'}
								stroke="currentColor"
								stroke-width="1.8"
								><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></svg
							>
						{:else if item.icon === 'course'}
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								><path
									d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15Z"
								/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /></svg
							>
						{:else if item.icon === 'practice'}
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								><path d="m3 7 9-4 9 4-9 4-9-4Z" /><path d="m3 12 9 4 9-4" /><path
									d="m3 17 9 4 9-4"
								/></svg
							>
						{:else if item.icon === 'review'}
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								><path
									d="M12 2c.5 4.5-2 6.5-3 9-.6 1.5 0 3 1.5 3.5 2.8-1 4.5-3.8 4.1-6.7 2 1.2 3.3 3.4 3.3 5.7A7.4 7.4 0 0 1 3 16.5c0-4.3 3.2-7.8 7.5-9.5C11 5.5 11.6 3.7 12 2Z"
								/></svg
							>
						{:else if item.icon === 'progress'}
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3" /></svg
							>
						{:else}
							<svg
								viewBox="0 0 24 24"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								><rect x="3" y="5" width="18" height="16" rx="2" /><path
									d="M8 3v4M16 3v4M3 10h18"
								/></svg
							>
						{/if}
					</span>
					<span class="min-w-0 truncate text-sm font-semibold {expanded ? 'block' : 'hidden'}"
						>{item.label}</span
					>
				</a>
			{/each}
		{/each}
	</nav>

	<div class="shrink-0 space-y-1 border-t border-border p-2">
		{#if onopenpalette}
			<button
				type="button"
				class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
				onclick={onopenpalette}
				aria-label="Search and jump"
				title={expanded ? undefined : 'Search'}
			>
				<span class="grid h-6 w-6 shrink-0 place-items-center">
					<svg
						viewBox="0 0 24 24"
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg
					>
				</span>
				<span
					class="flex-1 truncate text-left text-sm font-semibold {expanded ? 'block' : 'hidden'}"
				>
					Search
				</span>
				<kbd
					class="hidden rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold text-text-subtle {expanded
						? 'block'
						: '!hidden'}">⌘K</kbd
				>
			</button>
		{/if}
		<a
			href="/admin"
			class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 transition {currentPath.startsWith(
				'/admin'
			)
				? 'bg-accent/12 text-accent'
				: 'text-text-secondary hover:bg-surface-700 hover:text-text-primary'}"
			aria-current={currentPath.startsWith('/admin') ? 'page' : undefined}
			aria-label="Admin"
			title={expanded ? undefined : 'Admin'}
		>
			<span class="grid h-6 w-6 shrink-0 place-items-center">
				<svg
					viewBox="0 0 24 24"
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					><circle cx="12" cy="12" r="3" /><path
						d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
					/></svg
				>
			</span>
			<span class="truncate text-sm font-semibold {expanded ? 'block' : 'hidden'}">Admin</span>
		</a>
		<button
			type="button"
			class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
			onclick={togglePin}
			aria-pressed={pinned}
			aria-label={pinned ? 'Unpin navigation' : 'Pin navigation open'}
			title={expanded ? undefined : 'Pin navigation'}
		>
			<span class="grid h-6 w-6 shrink-0 place-items-center">
				<svg
					viewBox="0 0 24 24"
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"><path d="M9 4h6l-1 6 3 3v2H7v-2l3-3-1-6Z" /><path d="M12 15v5" /></svg
				>
			</span>
			<span class="truncate text-sm font-semibold {expanded ? 'block' : 'hidden'}"
				>{pinned ? 'Unpin' : 'Pin open'}</span
			>
		</button>
	</div>
</aside>
