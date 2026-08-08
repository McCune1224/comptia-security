<script lang="ts">
	let {
		min,
		max,
		step,
		unit,
		value,
		disabled = false,
		feedbackValue = null,
		tolerance = 0,
		onchange
	}: {
		min: number;
		max: number;
		step: number;
		unit: string;
		value: number;
		disabled?: boolean;
		/** After feedback: the correct value, for success/danger coloring + target readout. */
		feedbackValue?: number | null;
		/** Acceptance band used for feedback coloring (matches server scoring). */
		tolerance?: number;
		onchange: (value: number) => void;
	} = $props();

	const pct = $derived(((value - min) / (max - min)) * 100);
	const within = $derived(feedbackValue !== null && Math.abs(value - feedbackValue) <= tolerance);

	let trackEl = $state<HTMLDivElement | null>(null);
	let dragging = $state(false);

	function setFromClientX(clientX: number) {
		if (!trackEl) return;
		const rect = trackEl.getBoundingClientRect();
		const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
		const raw = min + ratio * (max - min);
		const snapped = Math.round((raw - min) / step) * step + min;
		onchange(Math.min(max, Math.max(min, snapped)));
	}

	function onKeydown(event: KeyboardEvent) {
		if (disabled) return;
		if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
			event.preventDefault();
			onchange(Math.min(max, value + step));
		} else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
			event.preventDefault();
			onchange(Math.max(min, value - step));
		}
	}
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<span class="text-xs font-semibold uppercase tracking-wide text-text-muted">{unit}</span>
		<span
			class="num-display text-lg {feedbackValue !== null
				? within
					? 'text-success'
					: 'text-danger'
				: 'text-text-primary'}">{Math.round(value * 100) / 100}{unit}</span
		>
	</div>
	<div
		class="relative h-11 touch-pan-y select-none"
		bind:this={trackEl}
		role="slider"
		tabindex={disabled ? -1 : 0}
		aria-valuemin={min}
		aria-valuemax={max}
		aria-valuenow={value}
		aria-label={unit}
		onpointerdown={(event) => {
			if (disabled) return;
			dragging = true;
			trackEl?.setPointerCapture(event.pointerId);
			setFromClientX(event.clientX);
		}}
		onpointermove={(event) => {
			if (dragging && !disabled) setFromClientX(event.clientX);
		}}
		onpointerup={() => (dragging = false)}
		onpointercancel={() => (dragging = false)}
		onkeydown={onKeydown}
	>
		<div class="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-sm bg-surface-700"></div>
		<div
			class="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-sm {feedbackValue !== null && !within
				? 'bg-danger'
				: 'bg-accent'}"
			style:width="{pct}%"
		></div>
		<div
			class="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 {feedbackValue !==
			null
				? within
					? 'border-success bg-success'
					: 'border-danger bg-danger'
				: 'border-accent bg-accent'}"
			style:left="{pct}%"
		></div>
	</div>
	{#if feedbackValue !== null}
		<p class="text-xs font-semibold text-success">Target: {feedbackValue}{unit}</p>
	{:else if !disabled}
		<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
			Drag or tap the track — page scroll still works
		</p>
	{/if}
</div>
