<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ExamFlow from '$lib/components/ExamFlow.svelte';
	import type { SessionType } from '$lib/types';
	let started = $derived(Boolean(page.url.searchParams.get('session')) || page.url.searchParams.get('start') === '1');
	let sessionType = $derived((page.url.searchParams.get('type') === 'full' ? 'full' : 'quiz') as SessionType);
	let count = $state(20); let domain = $state<number | undefined>(); let mode = $state<'practice' | 'exam'>('practice');
</script>
{#if started}<ExamFlow type={sessionType} {count} {domain} {mode} onDone={() => goto('/')} />
{:else}<div class="mx-auto max-w-md space-y-5 py-8"><h1 class="text-2xl font-bold text-white">Objective Quiz</h1><div class="glass space-y-4 rounded-2xl p-6"><label>Question count <select bind:value={count}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></label><label>Domain <select bind:value={domain}><option value={undefined}>All domains</option>{#each [1,2,3,4,5] as item}<option value={item}>Domain {item}</option>{/each}</select></label><button class="rounded bg-cyan-600 px-4 py-2" onclick={() => goto('/quiz?start=1')}>Start quiz</button></div></div>{/if}
