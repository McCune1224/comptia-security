<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import QuizFlow from '$lib/components/QuizFlow.svelte';

	let count = $state(10);
	let mode = $state<'practice' | 'exam'>('practice');
	let started = $state(false);

	$effect(() => {
		const params = $page.url.searchParams;
		count = parseInt(params.get('count') || '10', 10);
		mode = (params.get('mode') || 'practice') as 'practice' | 'exam';
		started = !!params.get('type');
	});

	function start() {
		goto(`/scenarios?type=scenario&count=${count}&mode=${mode}`, { replaceState: true });
	}
</script>

{#if started}
	<QuizFlow type="scenario" {mode} {count} onDone={() => goto('/')} />
{:else}
	<div class="max-w-md mx-auto space-y-8 py-8">
		<div class="text-center space-y-2">
			<div class="text-xs text-slate-500 mb-3 uppercase tracking-wide">Situational</div>
			<h1 class="text-2xl font-bold text-white">Scenario Practice</h1>
			<p class="text-sm text-slate-400">Work through real-world situations requiring analysis and judgment.</p>
		</div>

		<div class="glass rounded-2xl p-6 space-y-5">
			<div>
				<label for="sc-count" class="block text-sm font-medium text-slate-300 mb-2">Scenarios: <span class="text-purple-400 font-bold">{count}</span></label>
				<input id="sc-count" type="range" min="5" max="30" step="5" bind:value={count} class="w-full accent-purple-500" />
				<div class="flex justify-between text-xs text-slate-600 mt-1"><span>5</span><span>15</span><span>30</span></div>
			</div>

			<div>
				<div class="block text-sm font-medium text-slate-300 mb-2">Mode</div>
				<div class="grid grid-cols-2 gap-3">
					<button onclick={() => mode = 'practice'}
						class="p-3.5 rounded-xl border text-sm transition-all {mode === 'practice' ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-500'}">
						<div class="text-purple-400 font-semibold text-sm">Practice</div>
						<div class="text-xs text-slate-500 mt-0.5">Immediate feedback</div>
					</button>
					<button onclick={() => mode = 'exam'}
						class="p-3.5 rounded-xl border text-sm transition-all {mode === 'exam' ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-500'}">
						<div class="text-yellow-400 font-semibold text-sm">Exam</div>
						<div class="text-xs text-slate-500 mt-0.5">Score at end</div>
					</button>
				</div>
			</div>

			<button onclick={start}
				class="w-full py-3.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/20">
				Start Scenarios
			</button>
		</div>
	</div>
{/if}
