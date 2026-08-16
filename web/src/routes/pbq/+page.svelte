<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import ExamFlow from '$lib/components/ExamFlow.svelte';

	let started = $derived(
		Boolean(page.url.searchParams.get('session')) || page.url.searchParams.get('start') === '1'
	);
	let count = $state(Number(page.url.searchParams.get('count')) || 5);
	let pbqTotal = $state(30);

	onMount(async () => {
		const response = await fetch('/api/quiz/catalog');
		if (response.ok) pbqTotal = (await response.json()).pbqTotal;
	});
</script>

{#if started}
	<ExamFlow type="pbq" {count} onDone={() => goto('/')} />
{:else}
	<div class="mx-auto max-w-lg space-y-6 py-4 sm:py-8">
		<div>
			<div
				class="mb-3 grid h-12 w-12 place-items-center rounded-md bg-warning/15 text-warning"
			>
				<svg
					viewBox="0 0 24 24"
					class="h-6 w-6"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					><path
						d="M8 5.5 10.5 3l2.5 2.5L15.5 3 18 5.5 15.5 8 18 10.5 15.5 13 18 15.5 15.5 18 13 15.5 10.5 18 8 15.5 5.5 18 3 15.5 5.5 13 3 10.5 5.5 8 3 5.5 5.5 3 8 5.5Z"
					/></svg
				>
			</div>
			<h1 class="h-display text-3xl text-text-primary">Performance-based Questions</h1>
			<p class="mt-2 leading-relaxed text-text-secondary">
				Practice hands-on items that ask you to configure, match, order, and investigate.
			</p>
		</div>
		<div class="card space-y-5 p-6 sm:p-8">
			<label class="block text-sm font-bold text-text-secondary"
				>PBQ count<select class="mt-1.5" bind:value={count}
					><option value={1}>1 PBQ</option><option value={3}>3 PBQs</option><option value={5}
						>5 PBQs</option
					><option value={10}>10 PBQs</option><option value={pbqTotal}>All {pbqTotal} PBQs</option></select
				></label
			>
			<button
				class="btn btn-primary w-full sm:w-auto"
				onclick={() => goto(`/pbq?start=1&count=${count}`)}>Start PBQs</button
			>
		</div>
	</div>
{/if}
