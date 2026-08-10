const base = 'http://127.0.0.1:4899';
const alexCookie = 'profile_id=default; course_id=secp-701';
const ashCookie = 'profile_id=ash; course_id=aplus-1201';

async function request(cookie, path, init = {}) {
	const response = await fetch(`${base}${path}`, {
		...init,
		headers: { cookie, 'content-type': 'application/json', ...(init.headers ?? {}) }
	});
	const text = await response.text();
	let body;
	try { body = JSON.parse(text); } catch { body = text; }
	return { status: response.status, body };
}

const [alexStart, ashStart] = await Promise.all([
	request(alexCookie, '/api/quiz/start', { method: 'POST', body: JSON.stringify({ type: 'quiz', count: 5 }) }),
	request(ashCookie, '/api/quiz/start', { method: 'POST', body: JSON.stringify({ type: 'quiz', count: 5 }) })
]);
if (alexStart.status !== 200 || ashStart.status !== 200) throw new Error(JSON.stringify({ alexStart, ashStart }));
const alexId = alexStart.body.session.sessionId;
const ashId = ashStart.body.session.sessionId;

const [alexComplete, ashComplete] = await Promise.all([
	request(alexCookie, '/api/quiz/complete', { method: 'POST', body: JSON.stringify({ sessionId: alexId }) }),
	request(ashCookie, '/api/quiz/complete', { method: 'POST', body: JSON.stringify({ sessionId: ashId }) })
]);
if (alexComplete.status !== 200 || ashComplete.status !== 200) throw new Error(JSON.stringify({ alexComplete, ashComplete }));

const [alexHistory, ashHistory, alexCross, ashCross] = await Promise.all([
	request(alexCookie, '/api/history'),
	request(ashCookie, '/api/history'),
	request(alexCookie, `/api/quiz/session/${ashId}`),
	request(ashCookie, `/api/quiz/session/${alexId}`)
]);

const result = {
	alexSession: alexId,
	ashSession: ashId,
	alexHistoryCount: alexHistory.body.sessions.length,
	ashHistoryCount: ashHistory.body.sessions.length,
	alexReadingAshStatus: alexCross.status,
	ashReadingAlexStatus: ashCross.status
};
if (alexCross.status !== 404 || ashCross.status !== 404) throw new Error(JSON.stringify(result));
console.log(JSON.stringify(result));
