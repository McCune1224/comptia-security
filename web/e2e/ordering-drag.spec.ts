import { expect, test } from '@playwright/test';

interface SessionQuestion {
	kind: string;
	steps?: { kind: string }[];
}

async function startPbq(context: import('@playwright/test').BrowserContext) {
	const page = await context.newPage();
	// Start via API; clear any prior active session in the default scope first.
	const start = async () =>
		context.request.post('/api/quiz/start', {
			data: { type: 'pbq', mode: 'practice', count: 30 }
		});
	let res = await start();
	let data = await res.json();
	if (data.error?.code === 'ACTIVE_SESSION_EXISTS') {
		const sid = data.error.details.session.sessionId;
		await context.request.delete(`/api/quiz/session/${sid}`);
		res = await start();
		data = await res.json();
	}
	const sessionId = data.session.sessionId;
	await page.goto(`/pbq?session=${sessionId}`);
	await page.waitForSelector('.drag-handle, .btn-primary');
	return { page, sessionId };
}

async function findOrderingIndex(
	context: import('@playwright/test').BrowserContext,
	sessionId: string
) {
	const res = await context.request.get(`/api/quiz/session/${sessionId}`);
	const data = await res.json();
	const questions: SessionQuestion[] = data.session.questions;
	// Prefer a top-level ordering question; fall back to a multi-step whose first step is ordering.
	const top = questions.findIndex((q) => q.kind === 'ordering');
	if (top >= 0) return { index: top, isSubStep: false };
	const sub = questions.findIndex(
		(q) => q.kind === 'multi-step' && q.steps?.[0]?.kind === 'ordering'
	);
	if (sub >= 0) return { index: sub, isSubStep: true };
	throw new Error('No ordering question found in seeded PBQ session');
}

async function orderFromDom(page: import('@playwright/test').Page): Promise<string[]> {
	return page.$$eval('[data-id]', (els) => els.map((e) => e.getAttribute('data-id') ?? ''));
}

async function dragHandle(page: import('@playwright/test').Page, from: number, to: number) {
	const handles = await page.$$('.drag-handle');
	const src = await handles[from].boundingBox();
	const dst = await handles[to].boundingBox();
	if (!src || !dst) throw new Error('Missing drag-handle bounding box');
	await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2);
	await page.mouse.down();
	await page.mouse.move(src.x + src.width / 2, src.y + src.height / 2 - 4, { steps: 2 });
	await page.mouse.move(dst.x + dst.width / 2, dst.y + dst.height / 2, { steps: 15 });
	await page.mouse.move(dst.x + dst.width / 2, dst.y + dst.height / 2, { steps: 4 });
	await page.mouse.up();
	await page.waitForTimeout(300);
}

test('ordering drag-and-drop persists the new order (top-level)', async ({ browser }) => {
	const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
	const { page, sessionId } = await startPbq(context);
	const { index, isSubStep } = await findOrderingIndex(context, sessionId);
	expect(isSubStep).toBe(false);

	await page
		.locator('button', { hasText: new RegExp(`^${index + 1}$`) })
		.first()
		.click();
	await page.waitForSelector('.drag-handle');
	const initial = await orderFromDom(page);
	expect(initial.length).toBeGreaterThan(1);

	// Drag the second item to the top.
	await dragHandle(page, 1, 0);
	const afterDrag = await orderFromDom(page);
	expect(afterDrag).not.toEqual(initial);

	// Navigate away to trigger the silent save, then read the stored response.
	await page
		.locator('button', { hasText: new RegExp('^1$') })
		.first()
		.click();
	await page.waitForTimeout(400);
	const res = await context.request.get(`/api/quiz/session/${sessionId}`);
	const data = await res.json();
	const stored = data.session.responses[index];
	expect(stored).toBeTruthy();
	expect(stored.itemIds).toEqual(afterDrag);

	await context.close();
});

test('ordering drag-and-drop persists the new order (multi-step step 0)', async ({ browser }) => {
	const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
	const { page, sessionId } = await startPbq(context);
	const { index, isSubStep } = await findOrderingIndex(context, sessionId);
	if (!isSubStep) {
		// Seeded bank for this scope has no multi-step ordering question; nothing to regress.
		test.skip(true, 'No multi-step ordering question in seeded PBQ session');
		await context.close();
		return;
	}

	await page
		.locator('button', { hasText: new RegExp(`^${index + 1}$`) })
		.first()
		.click();
	await page.waitForSelector('.drag-handle');
	const initial = await orderFromDom(page);
	await dragHandle(page, 1, 0);
	const afterDrag = await orderFromDom(page);
	expect(afterDrag).not.toEqual(initial);

	await page
		.locator('button', { hasText: new RegExp('^1$') })
		.first()
		.click();
	await page.waitForTimeout(400);
	const res = await context.request.get(`/api/quiz/session/${sessionId}`);
	const data = await res.json();
	const stored = data.session.responses[index];
	expect(stored).toBeTruthy();
	expect(stored.stepResponses[0].itemIds).toEqual(afterDrag);

	await context.close();
});
