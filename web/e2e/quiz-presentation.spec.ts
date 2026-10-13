import { expect, test } from '@playwright/test';
import {
	abandonSession,
	clearActiveSession,
	drawSessionMatching,
	openSessionQuestion
} from './session';

async function setScope(
	context: import('@playwright/test').BrowserContext,
	profileId: string,
	courseId: string
) {
	await context.addCookies([
		{ name: 'profile_id', value: profileId, domain: '127.0.0.1', path: '/' },
		{ name: 'course_id', value: courseId, domain: '127.0.0.1', path: '/' }
	]);
}

test('practice surfaces the summary toggle on a question that has one, and hides on demand', async ({
	browser
}) => {
	const context = await browser.newContext();
	await setScope(context, 'default', 'secp-701');

	// The toggle only renders for questions whose stored context is safe to show, and
	// only about a third of the bank carries one, so draw until the sample has one.
	const { sessionId, questions } = await drawSessionMatching(
		context.request,
		{ type: 'quiz', mode: 'practice', count: 20 },
		(sample) => sample.some((question) => question.practiceSummary)
	);
	const index = questions.findIndex((question) => question.practiceSummary);

	const page = await context.newPage();
	await openSessionQuestion(page, `/quiz?session=${sessionId}`, index);

	const toggle = page.getByRole('checkbox', { name: 'Show practice context' });
	await expect(toggle).toBeVisible();
	await expect(toggle).toBeChecked();
	await toggle.uncheck();
	await expect(toggle).not.toBeChecked();

	await abandonSession(context.request, sessionId);
	await context.close();
});

test('exam mode has no practice-summary control and renders its countdown', async ({ browser }) => {
	const context = await browser.newContext();
	await setScope(context, 'ash', 'aplus-1201');
	// Starting from a clean scope is what makes this spec repeatable: a leftover
	// session would show the resume screen instead of a fresh exam.
	await clearActiveSession(context.request);

	const page = await context.newPage();
	await page.goto('/quiz?start=1&count=5&mode=exam');
	await expect(page.getByText('Q1 of 5')).toBeVisible();
	await expect(page.getByRole('checkbox', { name: 'Show practice context' })).toHaveCount(0);
	await expect(page.locator('header').getByText(/^\d+:\d{2}$/)).toBeVisible({ timeout: 5_000 });

	await context.close();
});

test('desktop navigation exposes review and past-session history', async ({ browser }) => {
	const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
	await setScope(context, 'default', 'secp-701');
	const page = await context.newPage();

	await page.goto('/review');
	await expect(
		page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Review' })
	).toBeVisible();
	await expect(page.getByRole('link', { name: 'Past sessions' })).toHaveAttribute(
		'href',
		'/history'
	);

	await context.close();
});
