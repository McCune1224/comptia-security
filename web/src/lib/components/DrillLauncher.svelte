<script lang="ts">
	import type { Snippet } from 'svelte';
	import ContextRail from './ContextRail.svelte';

	let {
		eyebrow,
		titleLead,
		titleAccent,
		lede,
		tone = 'accent',
		icon,
		note,
		children
	}: {
		eyebrow: string;
		titleLead: string;
		titleAccent: string;
		lede: string;
		tone?: 'accent' | 'secondary' | 'warning';
		icon: Snippet;
		note?: string;
		children: Snippet;
	} = $props();

	const toneClass = $derived(
		{
			accent: 'bg-accent/10 text-accent',
			secondary: 'bg-accent-secondary/10 text-accent-secondary',
			warning: 'bg-warning/10 text-warning'
		}[tone]
	);

	const drills = [
		{ href: '/quiz', label: 'Quiz', hint: 'Multiple choice' },
		{ href: '/scenarios', label: 'Scenarios', hint: 'Applied judgment' },
		{ href: '/pbq', label: 'PBQs', hint: 'Hands-on tasks' },
		{ href: '/review', label: 'Daily review', hint: 'Spaced cards' }
	];
</script>

<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8">
	<div class="space-y-5">
		<header class="card p-6 sm:p-7">
			<div class="grid h-11 w-11 place-items-center rounded {toneClass}">{@render icon()}</div>
			<p class="eyebrow mt-4">{eyebrow}</p>
			<h1 class="h-display mt-2 text-3xl text-text-primary">
				{titleLead} <span class="serif-italic text-accent">{titleAccent}</span>
			</h1>
			<p class="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">{lede}</p>
		</header>
		<section class="card space-y-5 p-6 sm:p-8">
			{@render children()}
		</section>
	</div>

	<ContextRail title="Drills">
		<nav class="card p-5" aria-label="Other drills">
			<div class="space-y-1">
				{#each drills as drill (drill.href)}
					<a
						href={drill.href}
						class="flex min-h-11 items-center justify-between rounded px-2 text-sm text-text-secondary transition hover:bg-surface-700 hover:text-text-primary"
					>
						<span>{drill.label}</span>
						<span class="text-xs text-text-subtle">{drill.hint}</span>
					</a>
				{/each}
			</div>
		</nav>
		{#if note}
			<div class="card p-5">
				<p class="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Tip</p>
				<p class="mt-2 text-sm leading-relaxed text-text-secondary">{note}</p>
			</div>
		{/if}
	</ContextRail>
</div>
