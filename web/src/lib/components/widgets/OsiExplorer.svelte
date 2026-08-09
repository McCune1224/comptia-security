<script lang="ts">
	const layers = [
		{
			n: 7,
			name: 'Application',
			example: 'HTTP, HTTPS, DNS, SMTP, SSH, FTP — the interface applications use'
		},
		{
			n: 6,
			name: 'Presentation',
			example: 'Encryption, compression, encoding — how data is formatted for the wire'
		},
		{ n: 5, name: 'Session', example: 'Session setup, maintenance, teardown — RPC, NetBIOS' },
		{
			n: 4,
			name: 'Transport',
			example: 'TCP (reliable, segments) vs UDP (fast, datagrams) — ports live here'
		},
		{ n: 3, name: 'Network', example: 'IP addressing + routing — packets; routers work here' },
		{ n: 2, name: 'Data Link', example: 'MAC addressing — frames; switches work here' },
		{ n: 1, name: 'Physical', example: 'Cables, radio, bits on the wire — hubs and repeaters' }
	];
	let open = $state<number | null>(null);
</script>

<div class="space-y-2">
	<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
		OSI model — tap a layer
	</p>
	{#each layers as layer (layer.n)}
		<button
			type="button"
			class="w-full rounded-md border border-border bg-surface-700 px-3 py-2.5 text-left text-sm font-semibold text-text-primary transition {open ===
			layer.n
				? 'border-accent bg-accent/10'
				: ''}"
			aria-expanded={open === layer.n}
			aria-pressed={open === layer.n}
			onclick={() => (open = open === layer.n ? null : layer.n)}
		>
			<span class="num-display mr-2 inline-block w-6 text-right text-xs text-text-muted"
				>{layer.n}</span
			>{layer.name}
		</button>
		{#if open === layer.n}
			<p class="rounded-md bg-surface-800 px-3 py-2 text-sm leading-relaxed text-text-secondary">
				{layer.example}
			</p>
		{/if}
	{/each}
</div>
