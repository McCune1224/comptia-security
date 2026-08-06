<script lang="ts">
	import { onMount } from 'svelte';
	import { tapPremise, tapTarget, removeEdge, isTargetUsed } from '$lib/match-connect';

	let {
		premises,
		targets,
		matches,
		disabled = false,
		feedbackMatches = null,
		onchange
	}: {
		premises: { id: string; text: string }[];
		targets: { id: string; text: string }[];
		matches: Record<string, string>;
		disabled?: boolean;
		feedbackMatches?: Record<string, string> | null;
		onchange: (matches: Record<string, string>) => void;
	} = $props();

	let selected = $state<string | null>(null);
	let container = $state<HTMLDivElement | null>(null);
	let viewBox = $state({ width: 0, height: 0 });
	let lines = $state<
		{
			premiseId: string;
			targetId: string;
			x1: number;
			y1: number;
			x2: number;
			y2: number;
			color: string;
		}[]
	>([]);

	function edgeColor(premiseId: string, targetId: string): string {
		if (feedbackMatches) {
			return feedbackMatches[premiseId] === targetId
				? 'var(--color-success)'
				: 'var(--color-danger)';
		}
		return 'var(--color-accent)';
	}

	function recomputeLines() {
		if (!container) return;
		const box = container.getBoundingClientRect();
		viewBox = { width: box.width, height: box.height };
		const premiseMap = new Map<string, HTMLElement>();
		container
			.querySelectorAll<HTMLElement>('[data-connect-premise]')
			.forEach((el) => premiseMap.set(el.dataset.connectPremise ?? '', el));
		const targetMap = new Map<string, HTMLElement>();
		container
			.querySelectorAll<HTMLElement>('[data-connect-target]')
			.forEach((el) => targetMap.set(el.dataset.connectTarget ?? '', el));
		const center = (el: HTMLElement) => {
			const r = el.getBoundingClientRect();
			return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
		};
		const next: typeof lines = [];
		for (const [premiseId, targetId] of Object.entries(matches)) {
			const a = premiseMap.get(premiseId);
			const b = targetMap.get(targetId);
			if (!a || !b) continue;
			const ca = center(a);
			const cb = center(b);
			next.push({
				premiseId,
				targetId,
				x1: ca.x,
				y1: ca.y,
				x2: cb.x,
				y2: cb.y,
				color: edgeColor(premiseId, targetId)
			});
		}
		lines = next;
	}

	$effect(() => {
		recomputeLines();
	});

	onMount(() => {
		recomputeLines();
		const observer = new ResizeObserver(() => recomputeLines());
		if (container) observer.observe(container);
		return () => observer.disconnect();
	});

	function onPremiseTap(premiseId: string) {
		if (disabled) return;
		const next = tapPremise({ selected, matches }, premiseId);
		selected = next.selected;
	}

	function onTargetTap(targetId: string) {
		if (disabled) return;
		// Tapping an already-connected target removes that edge.
		const owner = Object.entries(matches).find(([, t]) => t === targetId)?.[0] ?? null;
		if (owner !== null) {
			const next = removeEdge({ selected, matches }, owner);
			selected = next.selected;
			onchange(next.matches);
			return;
		}
		const next = tapTarget({ selected, matches }, targetId);
		selected = next.selected;
		if (next.matches !== matches) onchange(next.matches);
	}
</script>

<div class="space-y-2">
	<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
		Tap a term, then tap its match — tap a match to remove it
	</p>
	<div class="relative" bind:this={container}>
		<svg
			class="pointer-events-none absolute inset-0 h-full w-full"
			viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
			preserveAspectRatio="none"
			aria-hidden="true"
		>
			{#each lines as line (line.premiseId)}
				<line
					x1={line.x1}
					y1={line.y1}
					x2={line.x2}
					y2={line.y2}
					stroke={line.color}
					stroke-width="2.5"
					stroke-linecap="round"
				/>
			{/each}
		</svg>
		<div class="flex flex-col gap-5 sm:flex-row">
			<div class="flex-1 space-y-2.5">
				{#each premises as premise (premise.id)}
					<button
						type="button"
						data-connect-premise={premise.id}
						class="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-md border-2 px-4 text-left text-sm font-medium transition {disabled
							? 'cursor-default opacity-70'
							: selected === premise.id
								? 'border-accent bg-accent/10 text-text-primary'
								: 'border-border text-text-primary hover:border-border-strong'}"
						aria-pressed={selected === premise.id}
						disabled={disabled}
						onclick={() => onPremiseTap(premise.id)}
						onkeydown={(e) => {
							if (e.key === 'Escape') selected = null;
						}}
					>
						<span class="flex-1">{premise.text}</span>
						{#if matches[premise.id]}
							<span class="text-xs font-bold text-accent">✓</span>
						{/if}
					</button>
				{/each}
			</div>
			<div class="grid flex-1 grid-cols-2 content-start gap-2.5 sm:grid-cols-1">
				{#each targets as target (target.id)}
					{@const used = isTargetUsed({ selected, matches }, target.id)}
					<button
						type="button"
						data-connect-target={target.id}
						class="flex min-h-[44px] items-center justify-center gap-2 rounded-md border-2 px-3 text-center text-sm font-medium transition {disabled
							? 'cursor-default opacity-70'
							: used
								? 'cursor-pointer border-accent/60 bg-accent/15 text-accent'
								: selected
									? 'border-border text-text-primary hover:border-accent hover:text-accent'
									: 'border-border text-text-primary hover:border-border-strong'}"
						disabled={disabled}
						onclick={() => onTargetTap(target.id)}
						onkeydown={(e) => {
							if (e.key === 'Escape') selected = null;
						}}
					>
						{target.text}
					</button>
				{/each}
			</div>
		</div>
	</div>
</div>
