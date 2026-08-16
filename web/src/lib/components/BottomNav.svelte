<script lang="ts">
	let { currentPath }: { currentPath: string } = $props();

	const items = [
		{ href: '/', label: 'Home', icon: 'home' },
		{ href: '/syllabus', label: 'Syllabus', icon: 'syllabus' },
		{ href: '/quiz', label: 'Practice', icon: 'quiz' },
		{ href: '/gradebook', label: 'Grades', icon: 'grades' },
		{ href: '/calendar', label: 'Calendar', icon: 'calendar' }
	];

	function isActive(path: string) {
		return path === '/' ? currentPath === '/' : currentPath.startsWith(path);
	}
</script>

<nav
	class="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface-900/90 pb-safe backdrop-blur-xl xl:hidden"
	aria-label="Primary navigation"
>
	<div class="mx-auto grid max-w-md grid-cols-5">
		{#each items as item}
			<a
				class="relative flex min-h-16 flex-col items-center justify-center gap-1 pb-1 pt-2 text-[11px] font-bold transition {isActive(
					item.href
				)
					? 'bg-accent/10 text-accent'
					: 'text-text-muted'}"
				href={item.href}
				aria-current={isActive(item.href) ? 'page' : undefined}
			>
				{#if item.icon === 'home'}
					<svg
						viewBox="0 0 24 24"
						class="h-6 w-6"
						fill={isActive(item.href) ? 'currentColor' : 'none'}
						stroke="currentColor"
						stroke-width="1.8"
						><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></svg
					>
				{:else if item.icon === 'syllabus'}
					<svg
						viewBox="0 0 24 24"
						class="h-6 w-6"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						><path
							d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15Z"
						/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /></svg
					>
				{:else if item.icon === 'quiz'}
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
				{:else if item.icon === 'grades'}
					<svg
						viewBox="0 0 24 24"
						class="h-6 w-6"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3" /></svg
					>
				{:else}
					<svg
						viewBox="0 0 24 24"
						class="h-6 w-6"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						><rect x="3" y="5" width="18" height="16" rx="2" /><path
							d="M8 3v4M16 3v4M3 10h18"
						/></svg
					>
				{/if}
				<span>{item.label}</span>
				{#if isActive(item.href)}
					<span class="absolute bottom-0.5 h-1 w-6 rounded-sm bg-accent"></span>
				{/if}
			</a>
		{/each}
	</div>
</nav>
