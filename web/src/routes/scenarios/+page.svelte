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
	<div class="mx-auto max-w-lg space-y-6 px-4 py-8">
		<div>
			<div
				class="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-accent-secondary/10 text-accent-secondary"
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
			<h1 class="text-2xl font-bold text-text-primary sm:text-3xl">Scenario Quiz</h1>
			<p class="mt-2 text-sm text-text-secondary">
				Apply concepts to realistic security decisions, prioritization, and troubleshooting.
			</p>
		</div>
		<div class="glass space-y-5 rounded-2xl p-6 sm:p-8">
			<label class="block text-sm font-medium text-text-secondary"
				>Scenario count<select class="mt-1.5" bind:value={count}
					><option value={5}>5 scenarios</option><option value={10}>10 scenarios</option><option
						value={20}>20 scenarios</option
					><option value={30}>All 30 scenarios</option></select
				></label
			>
			<button
				class="h-12 w-full rounded-xl bg-gradient-to-r from-accent-secondary to-info px-8 font-semibold text-white transition hover:brightness-110 active:scale-[0.98] sm:w-auto"
				onclick={() => goto(`/scenarios?start=1&count=${count}`)}>Start scenarios</button
			>
		</div>
	</div>
{/if}
