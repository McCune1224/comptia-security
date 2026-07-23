import { json } from '@sveltejs/kit';
import { QuizServiceError } from './quiz';

export async function readJson(request: Request): Promise<Record<string, unknown>> {
	try {
		const body = await request.json();
		if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('body must be an object');
		return body as Record<string, unknown>;
	} catch {
		throw new QuizServiceError('INVALID_REQUEST', 'Malformed JSON request body.');
	}
}

export function apiError(error: unknown) {
	if (error instanceof QuizServiceError) return json({ error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) } }, { status: error.code === 'SESSION_NOT_FOUND' ? 404 : error.code === 'INVALID_REQUEST' ? 400 : 409 });
	throw error;
}
