<script lang="ts">
	import { page } from '$app/stores';
	import '../app.css';
	let { children } = $props();

	let currentPath = $derived($page.url.pathname);

	function isActive(path: string): boolean {
		if (path === '/') return currentPath === '/';
		return currentPath.startsWith(path);
	}
</script>

<div class="min-h-screen flex flex-col">
	<!-- Navbar -->
	<nav class="sticky top-0 z-50 border-b border-slate-800/80 bg-surface-900/80 backdrop-blur-md">
		<div class="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
			<a href="/" class="flex items-center gap-2.5 group">
				<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-accent flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-accent/20">
					S+
				</div>
				<span class="font-bold text-white tracking-tight group-hover:text-accent-strong transition">Security+ Lab</span>
			</a>

			<div class="flex items-center gap-1">
				<a href="/quiz" class="px-3.5 py-2 rounded-lg text-sm font-medium transition-all
					{isActive('/quiz') ? 'bg-accent/10 text-accent-strong' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}">
					Quiz
				</a>
				<a href="/scenarios" class="px-3.5 py-2 rounded-lg text-sm font-medium transition-all
					{isActive('/scenarios') ? 'bg-purple-accent/10 text-purple-accent' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}">
					Scenarios
				</a>
				<a href="/pbq" class="px-3.5 py-2 rounded-lg text-sm font-medium transition-all
					{isActive('/pbq') ? 'bg-orange-accent/10 text-orange-accent' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}">
					PBQs
				</a>
				<a href="/progress" class="px-3.5 py-2 rounded-lg text-sm font-medium transition-all
					{isActive('/progress') ? 'bg-accent/10 text-accent-strong' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}">
					Progress
				</a>
			</div>
		</div>
	</nav>

	<!-- Content -->
	<main class="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t border-slate-800/50 py-6 text-center text-xs text-slate-600">
		Security+ SY0-701 Practice Lab · {new Date().getFullYear()}
	</footer>
</div>
