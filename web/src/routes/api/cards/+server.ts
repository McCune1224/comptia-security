import { json } from '@sveltejs/kit';
import { loadDefinitionCards } from '$lib/server/cards';

export function GET({ url }: { url: URL }) {
	const value = url.searchParams.get('domain');
	if (value !== null && !/^[1-5]$/.test(value)) return json({ error: { code: 'INVALID_REQUEST', message: 'domain must be 1 through 5.' } }, { status: 400 });
	const cards = loadDefinitionCards().filter((card) => value === null || card.domain === Number(value));
	return json({ total: cards.length, cards: cards.map((card) => ({ front: card.front, back: card.back, domain: card.domain, tags: card.tags })) });
}
