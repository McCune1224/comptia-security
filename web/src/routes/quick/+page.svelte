<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ExamFlow from '$lib/components/ExamFlow.svelte';
	import DrillLauncher from '$lib/components/DrillLauncher.svelte';

	let started = $derived(
		Boolean(page.url.searchParams.get('session')) || page.url.searchParams.get('start') === '1'
	);
	let count = $state(Number(page.url.searchParams.get('count')) || 8);
</script>

{#if started}
	<ExamFlow type="quick" {count} onDone={() => goto('/practice')} />
{:else}
	<DrillLauncher
		eyebrow="Practice · Low drain"
		titleLead="Quick"
		titleAccent="Round"
		lede="A short, interleaved round of performance tasks and multiple-choice questions. No timer, no grade — just enough to keep the streak alive."
		tone="accent"
		note="Rounds are deliberately small. Pick the size that fits the time you have, finish it, and stop. The point is showing up, not grinding."
	>
		{#snippet icon()}
			<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8"
				><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></svg
			>
		{/snippet}
		<label class="block text-sm font-semibold text-text-secondary"
			>Round size<select class="mt-1.5" bind:value={count}
				><option value={4}>4 questions</option><option value={6}>6 questions</option><option value={8}
					>8 questions</option
				><option value={10}>10 questions</option><option value={12}>12 questions</option><option
					value={15}>15 questions</option
				></select
			></label
		>
		<p class="text-xs leading-relaxed text-text-muted">
			Each round mixes roughly one performance task for every two multiple-choice questions, spread
			through the set rather than stacked at the start.
		</p>
		<button
			class="btn btn-primary w-full sm:w-auto"
			onclick={() => goto(`/quick?start=1&count=${count}`)}>Start a quick round</button
		>
	</DrillLauncher>
{/if}
