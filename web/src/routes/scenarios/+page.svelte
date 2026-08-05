<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ExamFlow from '$lib/components/ExamFlow.svelte';

	let started = $derived(
		Boolean(page.url.searchParams.get('session')) || page.url.searchParams.get('start') === '1'
	);
	let count = $state(Number(page.url.searchParams.get('count')) || 10);
</script>

{#if started}
	<ExamFlow type="scenario" {count} onDone={() => goto('/')} />
{:else}
	<div class="mx-auto max-w-lg space-y-6 py-4 sm:py-8">
		<div>
			<div
				class="mb-3 grid h-12 w-12 place-items-center rounded-md bg-accent-secondary/15 text-accent-secondary"
			>
				<svg
					viewBox="0 0 24 24"
					class="h-6 w-6"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					><path d="M20 11.5a7.5 7.5 0 0 1-11.6 6.3L4 19l1.2-3.6A7.5 7.5 0 1 1 20 11.5Z" /></svg
				>
			</div>
			<h1 class="h-display text-3xl text-text-primary">Scenario Quiz</h1>
			<p class="mt-2 leading-relaxed text-text-secondary">
				Apply concepts to realistic security decisions, prioritization, and troubleshooting.
			</p>
		</div>
		<div class="card space-y-5 p-6 sm:p-8">
			<label class="block text-sm font-bold text-text-secondary"
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
		</div>
	</div>
{/if}
