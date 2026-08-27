import { json } from '@sveltejs/kit';
import { loadQuestionBank } from '$lib/server/question-bank';

export function GET() {
	const bank = loadQuestionBank();
	const styles = { recall: 0, scenario: 0, keyword: 0, 'short-form': 0 } as Record<string, number>;
	for (const question of bank.mcqs) {
		if (question.style && question.style in styles) styles[question.style] += 1;
	}
	return json({
		mcqTotal: bank.mcqs.length,
		mcqByDomain: {
			1: bank.mcqs.filter((question) => question.domain === 1).length,
			2: bank.mcqs.filter((question) => question.domain === 2).length,
			3: bank.mcqs.filter((question) => question.domain === 3).length,
			4: bank.mcqs.filter((question) => question.domain === 4).length,
			5: bank.mcqs.filter((question) => question.domain === 5).length
		},
		styleTotals: styles,
		pbqTotal: bank.pbqs.length
	});
}
