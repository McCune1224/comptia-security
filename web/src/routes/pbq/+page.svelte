<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import PbqFlow from '$lib/components/PbqFlow.svelte';

	let count = $state(5);
	let started = $state(false);

	$effect(() => {
		const params = $page.url.searchParams;
		count = parseInt(params.get('count') || '5', 10);
		started = !!params.get('type');
	});

	function start() {
		goto(`/pbq?type=pbq&count=${count}`, { replaceState: true });
	}
</script>

{#if started}
	<PbqFlow {count} onDone={() => goto('/')} />
{:else}
	<div class="max-w-md mx-auto space-y-8 py-8">
		<div class="text-center space-y-2">
			<div class="text-xs text-slate-500 mb-3 uppercase tracking-wide">Drag &amp; Rank</div>
			<h1 class="text-2xl font-bold text-white">Performance-Based Questions</h1>
			<p class="text-sm text-slate-400">Drag and arrange steps in the correct order. These simulate the hands-on PBQs from the real CompTIA exam.</p>
		</div>

		<div class="glass rounded-2xl p-6 space-y-5">
			<div>
				<label for="pbq-count" class="block text-sm font-medium text-slate-300 mb-2">PBQs: <span class="text-orange-400 font-bold">{count}</span></label>
				<input id="pbq-count" type="range" min="1" max="10" step="1" bind:value={count} class="w-full accent-orange-500" />
				<div class="flex justify-between text-xs text-slate-600 mt-1"><span>1</span><span>5</span><span>10</span></div>
			</div>

			<button onclick={start}
				class="w-full py-3.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-white font-semibold transition-all hover:shadow-lg hover:shadow-orange-500/20">
				Start PBQs
			</button>
		</div>
	</div>
{/if}
