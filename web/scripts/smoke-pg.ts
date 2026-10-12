// Phase runner for the PostgreSQL live smoke test. Run under tsx:
//   npx tsx scripts/smoke-pg.ts phase1   # start, answer, complete — prints session id
//   npx tsx scripts/smoke-pg.ts phase2 <sessionId> [percentage]
//                                      # after a full server restart: verify persistence
//
// Drives the real HTTP API on SMOKE_BASE (default http://localhost:4599) against
// the database resolved from the server's DATABASE_URL.
import { loadQuestionBank, correctResponse } from '../src/lib/server/question-bank';

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:4599';
const COOKIE = 'profile_id=default; course_id=secp-701';

async function api(path: string, init: RequestInit = {}): Promise<{ status: number; body: any }> {
	const response = await fetch(`${BASE}${path}`, {
		...init,
		headers: { cookie: COOKIE, 'content-type': 'application/json', ...(init.headers ?? {}) }
	});
	const text = await response.text();
	let body: unknown;
	try {
		body = JSON.parse(text);
	} catch {
		body = text;
	}
	return { status: response.status, body };
}

function fail(step: string, payload: unknown): never {
	console.error(`SMOKE FAIL at ${step}: ${JSON.stringify(payload)}`);
	process.exit(1);
}

async function phase1(): Promise<void> {
	const bank = loadQuestionBank();
	const byId = new Map([...bank.mcqs, ...bank.pbqs].map((q) => [q.id, q] as const));

	const start = await api('/api/quiz/start', {
		method: 'POST',
		body: JSON.stringify({ type: 'quiz', count: 5 })
	});
	if (start.status !== 200) fail('start', start);
	const sessionView = (
		start.body as { session: { sessionId: string; questions: { id: string }[] } }
	).session;
	const sessionId = sessionView.sessionId;
	const questions = sessionView.questions;
	console.log(`started session ${sessionId} with ${questions.length} questions`);

	for (let index = 0; index < questions.length; index++) {
		const definition = byId.get(questions[index].id);
		if (!definition) fail(`lookup ${questions[index].id}`, { index });
		const response = correctResponse(definition);
		const saved = await api('/api/quiz/answer', {
			method: 'PUT',
			body: JSON.stringify({ sessionId, questionIndex: index, response, check: true })
		});
		if (saved.status !== 200) fail(`answer ${index}`, saved);
	}

	const done = await api('/api/quiz/complete', {
		method: 'POST',
		body: JSON.stringify({ sessionId })
	});
	if (done.status !== 200) fail('complete', done);
	const result = done.body as { percentage: number; earnedPoints: number; totalQuestions: number };
	console.log(
		`completed: ${result.totalQuestions} questions, earned ${result.earnedPoints} points, ${result.percentage}%`
	);

	// Same-process read-back.
	const view = await api(`/api/quiz/session/${sessionId}`);
	if (view.status !== 200 || (view.body as { status?: string }).status !== 'completed')
		fail('session view (pre-restart)', view);
	console.log('phase1 OK');
	console.log(`SMOKE_SESSION=${sessionId}`);
	console.log(`SMOKE_PERCENTAGE=${result.percentage}`);
}

async function phase2(sessionId: string, expectedPercentage?: number): Promise<void> {
	// The result must have survived a full server restart (fresh process, cold pool).
	const view = await api(`/api/quiz/session/${sessionId}`);
	if (view.status !== 200) fail('session view (post-restart)', view);
	const body = view.body as { status?: string; result?: { percentage: number } | null };
	if (body.status !== 'completed' || !body.result)
		fail('completed result not persisted', { status: body.status, hasResult: !!body.result });
	if (
		expectedPercentage !== undefined &&
		String(body.result.percentage) !== String(expectedPercentage)
	)
		fail('percentage mismatch after restart', {
			expected: expectedPercentage,
			actual: body.result.percentage
		});

	const history = await api('/api/history');
	const sessions = (history.body as { sessions: { id: string }[] }).sessions;
	if (!sessions.some((s) => s.id === sessionId)) fail('session missing from history', history.body);

	// Migrated profiles remain intact alongside the new session.
	const scope = await api('/api/scope');
	const profiles = (scope.body as { profiles: { id: string; name: string }[] }).profiles;
	const profileIds = profiles.map((p) => p.id).sort();
	if (JSON.stringify(profileIds) !== JSON.stringify(['ash', 'default']))
		fail('migrated profiles', profiles);

	// Migrated exam date intact.
	const overview = await api('/api/course/overview');
	const exam = (overview.body as { examDate?: string }).examDate;
	if (exam !== '2026-09-30') fail('migrated exam date', overview.body);

	console.log('phase2 OK: result, history, migrated profiles, and exam date all persisted');
}

const [, , command, arg1, arg2] = process.argv;
if (command === 'phase1') await phase1();
else if (command === 'phase2' && arg1) await phase2(arg1, arg2 ? Number(arg2) : undefined);
else {
	console.error('usage: npx tsx scripts/smoke-pg.ts phase1 | phase2 <sessionId> [percentage]');
	process.exit(2);
}
