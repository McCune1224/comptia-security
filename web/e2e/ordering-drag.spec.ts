import { expect, test } from '@playwright/test';
import {
	abandonSession,
	clickQuestion,
	drawSessionMatching,
	openSessionQuestion,
	type SessionQuestion
} from './session';

// Redrawing a random PBQ sample for a rare question shape can take several attempts.
test.describe.configure({ timeout: 120_000 });

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

/** Move to a question through the runner's rail, confirming the move took. */
async function moveToQuestion(page: import('@playwright/test').Page, index: number) {
	await clickQuestion(page, index);
	// The counter reads "Q14 of 30" (the uppercase look is CSS only). Waiting for it
	// proves the move landed; the target question may not be an ordering task, so do
	// not wait for a drag handle here.
	await expect(page.getByText(new RegExp(`^Q${index + 1} of \\d+$`))).toBeVisible();
}

/** The save fires when the runner leaves the question, so pick a different one. */
function awayFrom(index: number): number {
	return index === 0 ? 1 : 0;
}

test('ordering drag-and-drop persists the new order (top-level)', async ({ browser }) => {
	const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

	// Only a few of the 105 PBQs are ordering tasks and the draw is a random sample,
	// so ask for a session that actually contains one.
	const { sessionId, questions } = await drawSessionMatching(
		context.request,
		{ type: 'pbq', mode: 'practice', count: 30 },
		(sample) => sample.some((question: SessionQuestion) => question.kind === 'ordering')
	);
	const index = questions.findIndex((question) => question.kind === 'ordering');

	const page = await context.newPage();
	await openSessionQuestion(page, `/pbq?session=${sessionId}`, index);
	await page.waitForSelector('.drag-handle');

	const initial = await orderFromDom(page);
	expect(initial.length).toBeGreaterThan(1);

	// Drag the second item to the top.
	await dragHandle(page, 1, 0);
	const afterDrag = await orderFromDom(page);
	expect(afterDrag).not.toEqual(initial);

	// Navigate away to trigger the silent save, then read the stored response.
	await moveToQuestion(page, awayFrom(index));
	await page.waitForTimeout(400);
	const res = await context.request.get(`/api/quiz/session/${sessionId}`);
	const data = await res.json();
	const stored = data.session.responses[index];
	expect(stored).toBeTruthy();
	expect(stored.itemIds).toEqual(afterDrag);

	await abandonSession(context.request, sessionId);
	await context.close();
});

test('ordering drag-and-drop persists the new order (multi-step step 0)', async ({ browser }) => {
	const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

	let drawn: { sessionId: string; questions: SessionQuestion[] };
	try {
		drawn = await drawSessionMatching(
			context.request,
			{ type: 'pbq', mode: 'practice', count: 30 },
			(sample) =>
				sample.some(
					(question) => question.kind === 'multi-step' && question.steps?.[0]?.kind === 'ordering'
				),
			8
		);
	} catch (cause) {
		// No multi-step ordering PBQ in the seeded bank, so there is nothing to regress.
		// The kinds seen are reported so the skip stays diagnosable.
		test.skip(true, `No multi-step ordering PBQ available: ${(cause as Error).message}`);
		await context.close();
		return;
	}

	const { sessionId, questions } = drawn;
	const index = questions.findIndex(
		(question) => question.kind === 'multi-step' && question.steps?.[0]?.kind === 'ordering'
	);

	const page = await context.newPage();
	await openSessionQuestion(page, `/pbq?session=${sessionId}`, index);
	await page.waitForSelector('.drag-handle');

	const initial = await orderFromDom(page);
	expect(initial.length).toBeGreaterThan(1);

	await dragHandle(page, 1, 0);
	const afterDrag = await orderFromDom(page);
	expect(afterDrag).not.toEqual(initial);

	await moveToQuestion(page, awayFrom(index));
	await page.waitForTimeout(400);
	const res = await context.request.get(`/api/quiz/session/${sessionId}`);
	const data = await res.json();
	const stored = data.session.responses[index];
	expect(stored).toBeTruthy();
	expect(stored.stepResponses[0].itemIds).toEqual(afterDrag);

	await abandonSession(context.request, sessionId);
	await context.close();
});
