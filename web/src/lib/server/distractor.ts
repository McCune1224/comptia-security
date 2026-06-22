import type { Card } from '$lib/types';

const STOPWORDS = new Set([
	'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
	'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
	'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
	'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
	'into', 'through', 'during', 'before', 'after', 'above', 'below',
	'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
	'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
	'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
	'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
	'and', 'but', 'or', 'if', 'while', 'that', 'this', 'these', 'those',
	'it', 'its', 'which', 'who', 'whom', 'what', 'about', 'up', 'down',
	'also', 'used', 'use', 'using', 'via', 'per',
]);

/** Split text into lowercase tokens, removing non-alphanumeric chars and stopwords */
function tokenize(text: string): Set<string> {
	const words = text.toLowerCase().split(/[\s,;:.!?()-]+/);
	return new Set(words.filter(w => w.length > 2 && !STOPWORDS.has(w)));
}

/** Jaccard similarity between two sets */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
	const intersection = new Set([...a].filter(x => b.has(x)));
	const union = new Set([...a, ...b]);
	return union.size === 0 ? 0 : intersection.size / union.size;
}

/** Pick N distractors for a given correct answer from a pool of cards using token matching */
export function pickDistractors(
	correctCard: Card,
	pool: Card[],
	count = 3
): string[] {
	const correctTokens = tokenize(correctCard.back);

	// Score all other cards in the same domain by token similarity
	const scored = pool
		.filter(c => c.front !== correctCard.front && c.back !== correctCard.back)
		.map(c => ({
			back: c.back,
			similarity: jaccardSimilarity(correctTokens, tokenize(c.back)),
		}))
		.sort((a, b) => b.similarity - a.similarity);

	// Take the top N most similar answers as distractors
	const distractors = scored
		.slice(0, count)
		.map(d => d.back);

	// If we don't have enough, fill from other domains
	if (distractors.length < count) {
		const otherCards = pool.filter(c =>
			c.domain !== correctCard.domain &&
			!distractors.includes(c.back) &&
			c.back !== correctCard.back
		);
		const shuffled = otherCards.sort(() => Math.random() - 0.5);
		while (distractors.length < count && shuffled.length > 0) {
			const c = shuffled.pop()!;
			if (!distractors.includes(c.back)) {
				distractors.push(c.back);
			}
		}
	}

	return distractors;
}
