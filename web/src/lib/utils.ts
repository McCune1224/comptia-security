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

