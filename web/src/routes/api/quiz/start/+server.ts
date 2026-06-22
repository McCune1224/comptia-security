import { json } from '@sveltejs/kit';
import {
	startDefinitionQuiz,
	startScenarioQuiz,
	startPbqSession,
	startFullPracticeExam,
} from '$lib/server/quiz';

export async function POST({ request }) {
	const body = await request.json();
	const { type, count = 10, domain } = body;

	try {
		let result;
		switch (type) {
			case 'scenario':
				result = startScenarioQuiz(count);
				break;
			case 'pbq':
				result = startPbqSession(count);
				break;
			case 'full':
				result = startFullPracticeExam();
				break;
			default:
				result = startDefinitionQuiz(count, domain ? parseInt(domain, 10) : undefined);
		}

		return json(result);
	} catch (e) {
		return json({ error: (e as Error).message }, { status: 400 });
	}
}
