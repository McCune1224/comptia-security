<script lang="ts">
	import { getBarColor } from '$lib/utils';

	let {
		value,
		size = 96,
		stroke = 10,
		label
	}: { value: number; size?: number; stroke?: number; label?: string } = $props();

	const radius = $derived((size - stroke) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const clamped = $derived(Math.min(100, Math.max(0, value)));
</script>

<div class="relative inline-grid place-items-center" style={`width: ${size}px; height: ${size}px`}>
	<svg width={size} height={size} class="-rotate-90">
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke="var(--color-surface-700)"
			stroke-width={stroke}
		/>
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke="currentColor"
			stroke-width={stroke}
			stroke-linecap="round"
			stroke-dasharray={circumference}
			stroke-dashoffset={circumference * (1 - clamped / 100)}
			class="text-accent transition-all duration-700"
		/>
	</svg>
	<div class="absolute inset-0 grid place-items-center">
		{#if label}
			<div class="text-center">
				<div class="text-2xl font-extrabold text-text-primary">{Math.round(clamped)}%</div>
				<div class="text-xs text-text-muted">{label}</div>
			</div>
		{:else}
			<span class="text-xl font-extrabold text-text-primary">{Math.round(clamped)}%</span>
		{/if}
	</div>
</div>
