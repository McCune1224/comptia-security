<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<aside class="hidden xl:block">
	<div class="sticky top-24">
		<p class="eyebrow">{title}</p>
		<div class="mt-3 space-y-3">
			{@render children()}
		</div>
	</div>
</aside>
