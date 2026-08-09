<script lang="ts">
	let prefix = $state(24);

	const hosts = $derived(prefix >= 31 ? (prefix === 31 ? 2 : 1) : Math.pow(2, 32 - prefix) - 2);
	const mask = $derived.by(() => {
		const bits = '1'.repeat(prefix).padEnd(32, '0');
		return [0, 8, 16, 24].map((offset) => parseInt(bits.slice(offset, offset + 8), 2)).join('.');
	});
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<span class="text-xs font-semibold uppercase tracking-wide text-text-muted">CIDR prefix</span>
		<span class="num-display text-lg text-text-primary">/{prefix}</span>
	</div>
	<input
		type="range"
		min="8"
		max="30"
		step="1"
		bind:value={prefix}
		class="h-8 w-full"
		style="accent-color: var(--color-accent)"
		aria-label="CIDR prefix slider"
	/>
	<div class="grid grid-cols-2 gap-2 text-sm">
		<div class="rounded-md bg-surface-700/60 p-3">
			<p class="text-xs text-text-muted">Subnet mask</p>
			<p class="num-display mt-0.5 text-text-primary">{mask}</p>
		</div>
		<div class="rounded-md bg-surface-700/60 p-3">
			<p class="text-xs text-text-muted">Usable hosts</p>
			<p class="num-display mt-0.5 text-text-primary">{hosts.toLocaleString()}</p>
		</div>
	</div>
</div>
