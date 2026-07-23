import { describe, expect, it } from 'vitest';
import { loadDefinitionCards } from './cards';

describe('definition card ingestion', () => {
	it('loads complete RFC 4180 definition records', () => {
		const cards = loadDefinitionCards();
		expect(cards.length).toBeGreaterThan(100);
		expect(cards.every((card) => card.domain >= 1 && card.domain <= 5 && card.front && card.back)).toBe(true);
	});
});
