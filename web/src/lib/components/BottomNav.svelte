<script lang="ts">
	let { currentPath }: { currentPath: string } = $props();

	const items = [
		{ href: '/', label: 'Home', icon: 'home' },
		{ href: '/quiz', label: 'Quiz', icon: 'quiz' },
		{ href: '/scenarios', label: 'Scenarios', icon: 'scenarios' },
		{ href: '/progress', label: 'Progress', icon: 'progress' }
	];

	function isActive(path: string) {
		return path === '/' ? currentPath === '/' : currentPath.startsWith(path);
	}
</script>

<nav
	class="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface-900/85 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-xl md:hidden"
	aria-label="Primary navigation"
>
	<div class="mx-auto grid max-w-md grid-cols-4">
		{#each items as item}
			<a
				class="relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-medium transition {isActive(
					item.href
				)
					? 'text-accent'
					: 'text-text-muted'}"
				href={item.href}
				aria-current={isActive(item.href) ? 'page' : undefined}
			>
				{#if item.icon === 'home'}
					<svg
						viewBox="0 0 24 24"
						class="h-5 w-5"
						fill={isActive(item.href) ? 'currentColor' : 'none'}
						stroke="currentColor"
						stroke-width="1.8"
						><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></svg
					>
				{:else if item.icon === 'quiz'}
					<svg
						viewBox="0 0 24 24"
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						><rect x="5" y="3" width="14" height="18" rx="2" /><path
							d="M9 3h6v3H9zM9 11h6M9 15h4"
						/></svg
					>
				{:else if item.icon === 'scenarios'}
					<svg
						viewBox="0 0 24 24"
						class="h-5 w-5"
						fill={isActive(item.href) ? 'currentColor' : 'none'}
						stroke="currentColor"
						stroke-width="1.8"
						><path d="M20 11.5a7.5 7.5 0 0 1-11.6 6.3L4 19l1.2-3.6A7.5 7.5 0 1 1 20 11.5Z" /></svg
					>
				{:else}
					<svg
						viewBox="0 0 24 24"
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3" /></svg
					>
				{/if}
				<span>{item.label}</span>
				{#if isActive(item.href)}<span class="absolute bottom-0 h-0.5 w-8 rounded-full bg-accent"
					></span>{/if}
			</a>
		{/each}
	</div>
</nav>
