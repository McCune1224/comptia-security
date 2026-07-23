<script lang="ts">
	import { onMount } from 'svelte';
	let data = $state<{ progress: Record<number, { earnedPoints: number; possiblePoints: number; percentage: number }>; weakTopics: { objective: string; percentage: number; severity: string }[] } | null>(null);
	onMount(async () => { const response = await fetch('/api/progress'); if (response.ok) data = await response.json(); });
</script>
<div class="mx-auto max-w-4xl space-y-6"><h1 class="text-2xl font-bold text-white">Progress</h1>{#if data}<div class="grid gap-3 sm:grid-cols-5">{#each [1,2,3,4,5] as domain}<div class="glass rounded-xl p-4"><strong>Domain {domain}</strong><p>{data.progress[domain]?.earnedPoints ?? 0}/{data.progress[domain]?.possiblePoints ?? 0} points</p><p>{data.progress[domain]?.percentage ?? 0}%</p></div>{/each}</div><section class="glass rounded-xl p-5"><h2 class="text-lg font-semibold">Objectives to review</h2>{#if data.weakTopics.length}{#each data.weakTopics as topic}<p>{topic.objective}: {topic.percentage}% ({topic.severity})</p>{/each}{:else}<p>No objective has enough attempts for a weak-topic assessment.</p>{/if}</section>{:else}<p>Loading progress…</p>{/if}</div>
