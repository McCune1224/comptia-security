// ponytail: shared domain names, progress helpers — single source across all components
export const DOMAIN_NAMES: Record<number, string> = {
	1: 'General Security Concepts',
	2: 'Threats, Vulnerabilities, Mitigations',
	3: 'Security Architecture',
	4: 'Security Operations',
	5: 'Security Program Management',
};

export function getPercentColor(pct: number): string {
	if (pct >= 85) return 'text-green-400';
	if (pct >= 60) return 'text-yellow-400';
	return 'text-red-400';
}

export function getBarColor(pct: number): string {
	if (pct >= 85) return 'bg-green-500';
	if (pct >= 60) return 'bg-yellow-500';
	return 'bg-red-500';
}

export function getScoreLabel(pct: number): string {
	if (pct >= 90) return 'Excellent';
	if (pct >= 75) return 'Good';
	if (pct >= 60) return 'Fair';
	return 'Needs Work';
}

/** CompTIA-style scaled score: 100-900 range, 750 = pass (~83%) */
export function toScaledScore(percentage: number): number {
	// CompTIA doesn't publish the exact mapping, but 750 pass roughly = ~83% raw
	// Linear map: 0% → 100, 100% → 900
	return Math.round(100 + (percentage / 100) * 800);
}

/** ponytail: detect multi-select count from prompt text like "Select 3 answers" */
export function detectSelectCount(prompt: string): number | undefined {
	const m = prompt.match(/select\s+(\d+)/i);
	if (m) return parseInt(m[1], 10);
	// "Select all that apply" — fallback: count from correct answer pipe splits
	return undefined;
}
