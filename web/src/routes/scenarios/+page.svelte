<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ExamFlow from '$lib/components/ExamFlow.svelte';
	import DrillLauncher from '$lib/components/DrillLauncher.svelte';

	let started = $derived(
		Boolean(page.url.searchParams.get('session')) || page.url.searchParams.get('start') === '1'
	);
	let count = $state(Number(page.url.searchParams.get('count')) || 10);
</script>

{#if started}
	<ExamFlow type="scenario" {count} onDone={() => goto('/')} />
{:else}
	<DrillLauncher
		eyebrow="Practice · Applied judgment"
		titleLead="Scenario"
		titleAccent="Quiz"
		lede="Apply concepts to realistic security decisions, prioritization, and troubleshooting."
		tone="secondary"
		note="Scenario sets pull whole situations rather than single facts. Read for the constraint in the question before the answer that sounds most complete."
	>
		{#snippet icon()}
			<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8"
				><path d="M20 11.5a7.5 7.5 0 0 1-11.6 6.3L4 19l1.2-3.6A7.5 7.5 0 1 1 20 11.5Z" /></svg
			>
		{/snippet}
		<label class="block text-sm font-semibold text-text-secondary"
			>Scenario count<select class="mt-1.5" bind:value={count}
				><option value={5}>5 scenarios</option><option value={10}>10 scenarios</option><option
					value={20}>20 scenarios</option
				><option value={30}>All 30 scenarios</option></select
			></label
		>
		<button
			class="btn btn-primary w-full sm:w-auto"
			onclick={() => goto(`/scenarios?start=1&count=${count}`)}>Start scenarios</button
		>
	</DrillLauncher>
{/if}
