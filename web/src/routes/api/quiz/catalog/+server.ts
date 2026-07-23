import { json } from '@sveltejs/kit';
import { loadQuestionBank } from '$lib/server/question-bank';

export function GET() {
	const bank = loadQuestionBank();
	return json({ mcqTotal: bank.mcqs.length, mcqByDomain: { 1: bank.mcqs.filter((question) => question.domain === 1).length, 2: bank.mcqs.filter((question) => question.domain === 2).length, 3: bank.mcqs.filter((question) => question.domain === 3).length, 4: bank.mcqs.filter((question) => question.domain === 4).length, 5: bank.mcqs.filter((question) => question.domain === 5).length }, scenarioTotal: bank.mcqs.filter((question) => question.format === 'scenario').length, pbqTotal: bank.pbqs.length });
}
