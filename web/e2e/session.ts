import type { APIRequestContext, Page } from '@playwright/test';

/**
 * Session helpers for the e2e specs.
 *
 * Two properties of the app force these:
 *
 * 1. One active session per scope. `POST /api/quiz/start` refuses with
 *    ACTIVE_SESSION_EXISTS while one exists, so a spec that leaves a session
 *    behind makes the *next* run fail on a resume screen. Every start here
 *    abandons whatever blocks it.
 * 2. Sessions are a random sample of the bank. A spec that needs a particular
 *    question shape (an ordering PBQ, a question carrying a practice summary)
 *    cannot assume it in one draw, so it redraws a bounded number of times and
 *    fails with the kinds it actually saw rather than silently skipping.
 */

export interface SessionQuestion {
	kind: string;
	steps?: { kind: string }[];
	practiceSummary?: { text: string };
	[key: string]: unknown;
}

/** Start a session, abandoning any active session that blocks it. */
export async function startSession(
	request: APIRequestContext,
	body: Record<string, unknown>
): Promise<{ sessionId: string }> {
	for (let attempt = 0; attempt < 8; attempt += 1) {
		const response = await request.post('/api/quiz/start', { data: body });
		const data = await response.json();
		if (response.ok()) return { sessionId: data.session.sessionId };
		const blocking = data?.error?.details?.session?.sessionId;
		if (data?.error?.code !== 'ACTIVE_SESSION_EXISTS' || !blocking)
			throw new Error(`Unable to start a session: ${JSON.stringify(data)}`);
		await abandonSession(request, blocking);
	}
	throw new Error('Unable to start a session: kept hitting an active one.');
}

export async function abandonSession(request: APIRequestContext, sessionId: string): Promise<void> {
	const response = await request.delete(`/api/quiz/session/${sessionId}`);
	if (!response.ok()) throw new Error(`Unable to abandon session ${sessionId}`);
}

/** Leave the scope with no active session so a spec never inherits one. */
export async function clearActiveSession(request: APIRequestContext): Promise<void> {
	const { sessionId } = await startSession(request, { type: 'quiz', count: 5 });
	await abandonSession(request, sessionId);
}

export async function sessionQuestions(
	request: APIRequestContext,
	sessionId: string
): Promise<SessionQuestion[]> {
	const response = await request.get(`/api/quiz/session/${sessionId}`);
	const data = await response.json();
	if (!response.ok()) throw new Error(`Unable to read the session: ${JSON.stringify(data)}`);
	return data.session.questions as SessionQuestion[];
}

/** Draw a session whose questions satisfy `match`, redrawing as needed. */
export async function drawSessionMatching(
	request: APIRequestContext,
	body: Record<string, unknown>,
	match: (questions: SessionQuestion[]) => boolean,
	attempts = 6
): Promise<{ sessionId: string; questions: SessionQuestion[] }> {
	const seen = new Set<string>();
	for (let attempt = 0; attempt < attempts; attempt += 1) {
		const { sessionId } = await startSession(request, body);
		const questions = await sessionQuestions(request, sessionId);
		if (match(questions)) return { sessionId, questions };
		questions.forEach((question) => seen.add(question.kind));
		await abandonSession(request, sessionId);
	}
	throw new Error(
		`No session matched the requirement after ${attempts} draws. Kinds seen: ${[...seen].sort().join(', ')}`
	);
}

/**
 * Open a session in the runner and move to a question.
 *
 * The runner hydrates asynchronously, and hydrate() resets the index to the
 * server's currentIndex, so a click sent while it loads is silently undone. The
 * question rail only exists once a session is hydrated, so waiting for it is the
 * guard: click after that and the move sticks. Callers then wait for the element
 * their question actually renders.
 */
export async function openSessionQuestion(page: Page, url: string, index: number): Promise<void> {
	await page.goto(url);
	await page.waitForSelector('button[title^="Question "]');
	if (index > 0) {
		await page
			.getByRole('button', { name: String(index + 1), exact: true })
			.first()
			.click();
	}
}
