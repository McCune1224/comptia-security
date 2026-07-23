<script lang="ts">
	import { goto } from '$app/navigation'; import { page } from '$app/state'; import ExamFlow from '$lib/components/ExamFlow.svelte';
	let started = $derived(Boolean(page.url.searchParams.get('session')) || page.url.searchParams.get('start') === '1'); let count = $state(10);
</script>
{#if started}<ExamFlow type="scenario" {count} onDone={() => goto('/')} />{:else}<div class="mx-auto max-w-md space-y-5 py-8"><h1 class="text-2xl font-bold text-white">Scenario Quiz</h1><div class="glass rounded-2xl p-6"><select bind:value={count}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={30}>30</option></select><button class="ml-3 rounded bg-purple-600 px-4 py-2" onclick={() => goto('/scenarios?start=1')}>Start scenarios</button></div></div>{/if}
