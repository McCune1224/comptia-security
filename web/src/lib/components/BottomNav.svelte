<script lang="ts">
	let { currentPath }: { currentPath: string } = $props();

	const items = [
		{ href: '/', label: 'Home', match: ['/#'], icon: 'home' },
		{
			href: '/syllabus',
			label: 'Course',
			match: ['/syllabus', '/modules', '/assignments'],
			icon: 'course'
		},
		{
			href: '/practice',
			label: 'Practice',
			match: ['/practice', '/quiz', '/scenarios', '/pbq'],
			icon: 'practice'
		},
		{
			href: '/progress',
			label: 'Progress',
			match: ['/progress', '/gradebook', '/mastery', '/history'],
			icon: 'progress'
		},
		{ href: '/review', label: 'Review', match: ['/review'], icon: 'review' }
	];

	function isActive(item: { href: string; match: string[] }) {
		return item.match.some((prefix) =>
			prefix.endsWith('#') ? currentPath === prefix.slice(0, -1) : currentPath.startsWith(prefix)
		);
	}
</script>

<nav
	class="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface-800/95 pb-safe backdrop-blur-md xl:hidden"
	aria-label="Primary navigation"
>
	<div class="mx-auto grid max-w-md grid-cols-5">
		{#each items as item (item.href)}
			{@const active = isActive(item)}
			<a
				class="relative flex min-h-16 flex-col items-center justify-center gap-1 pb-1 pt-2 text-[11px] font-semibold transition {active
					? 'text-accent'
					: 'text-text-muted'}"
				href={item.href}
				aria-current={active ? 'page' : undefined}
			>
				{#if item.icon === 'practice'}
					<span
						class="-mt-6 grid h-14 w-14 place-items-center rounded-2xl border border-border bg-accent text-on-accent shadow-[var(--shadow-lift)]"
					>
						<svg
							viewBox="0 0 24 24"
							class="h-6 w-6"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							><path d="m3 7 9-4 9 4-9 4-9-4Z" /><path d="m3 12 9 4 9-4" /><path
								d="m3 17 9 4 9-4"
							/></svg
						>
					</span>
				{:else}
					<span
						class="grid h-9 w-14 place-items-center rounded transition {active
							? 'bg-accent/12'
							: 'bg-transparent'}"
					>
						{#if item.icon === 'home'}
							<svg
								viewBox="0 0 24 24"
								class="h-6 w-6"
								fill={active ? 'currentColor' : 'none'}
								stroke="currentColor"
								stroke-width="1.8"
								><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></svg
							>
						{:else if item.icon === 'course'}
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
						{:else if item.icon === 'progress'}
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
								><path
									d="M12 2c.5 4.5-2 6.5-3 9-.6 1.5 0 3 1.5 3.5 2.8-1 4.5-3.8 4.1-6.7 2 1.2 3.3 3.4 3.3 5.7A7.4 7.4 0 0 1 3 16.5c0-4.3 3.2-7.8 7.5-9.5C11 5.5 11.6 3.7 12 2Z"
								/></svg
							>
						{/if}
					</span>
				{/if}
				<span>{item.label}</span>
			</a>
		{/each}
	</div>
</nav>
