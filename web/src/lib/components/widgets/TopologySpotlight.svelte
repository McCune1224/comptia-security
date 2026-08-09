<script lang="ts">
	const devices = [
		{
			id: 'firewall',
			label: 'Firewall',
			note: 'Edge filter — allow/deny between zones (WAN, DMZ, LAN); stateful inspection, NAT'
		},
		{
			id: 'router',
			label: 'Router',
			note: 'Routes between networks; can enforce ACLs and segment traffic at layer 3'
		},
		{
			id: 'switch',
			label: 'Switch',
			note: 'Layer-2 forwarding; VLAN segmentation, port security, 802.1X'
		},
		{
			id: 'server',
			label: 'Server',
			note: 'Attack surface: patch management, least privilege, MFA on admin access'
		},
		{
			id: 'workstation',
			label: 'Workstation',
			note: 'Endpoint: EDR, application allow-listing, user awareness training'
		}
	];
	let open = $state<string | null>(null);
</script>

<div class="space-y-2">
	<p class="text-xs font-semibold uppercase tracking-wide text-text-muted">
		Small-office topology — tap a device
	</p>
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
		{#each devices as device (device.id)}
			<button
				type="button"
				class="rounded-md border border-border bg-surface-700 px-2 py-3 text-center text-xs font-semibold text-text-primary transition {open ===
				device.id
					? 'border-accent bg-accent/10'
					: ''}"
				aria-pressed={open === device.id}
				onclick={() => (open = open === device.id ? null : device.id)}
			>
				{device.label}
			</button>
		{/each}
	</div>
	{#if open}
		{@const device = devices.find((d) => d.id === open)!}
		<p class="rounded-md bg-surface-800 px-3 py-2 text-sm leading-relaxed text-text-secondary">
			{device.note}
		</p>
	{/if}
</div>
