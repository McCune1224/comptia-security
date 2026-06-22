import { json } from '@sveltejs/kit';
import { loadDefinitionCards, loadScenarioCards, loadPbqCards } from '$lib/server/cards';

export function GET({ url }) {
	const domain = url.searchParams.get('domain');
	const type = url.searchParams.get('type') || 'definition';

	let cards;
	switch (type) {
		case 'scenario':
			cards = loadScenarioCards();
			break;
		case 'pbq':
			cards = loadPbqCards();
			break;
		default:
			cards = loadDefinitionCards();
	}

	if (domain) {
		const d = parseInt(domain, 10);
		cards = cards.filter(c => c.domain === d);
	}

	return json({
		total: cards.length,
		cards: cards.map(c => ({ front: c.front, back: c.back, domain: c.domain, tags: c.tags })),
	});
}
