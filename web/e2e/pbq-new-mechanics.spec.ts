import { expect, test } from '@playwright/test';
import { abandonSession, clearActiveSession, drawSessionMatching, sessionQuestions } from './session';

test.describe('new PBQ mechanics and drill modes', () => {
	test.afterEach(async ({ request }) => {
		// A failed assertion must not leave the single active-session slot occupied.
		await clearActiveSession(request).catch(() => {});
	});

	test.beforeEach(async ({ request }) => {
		await clearActiveSession(request);
	});

	test.afterEach(async ({ request }) => {
		await clearActiveSession(request);
	});

	test('rule-table and cli render, score, and keep a partial draft', async ({ page, request }) => {
		const { sessionId, questions } = await drawSessionMatching(
			request,
			{ type: 'pbq', count: 30 },
			(questions) =>
				questions.some((question) => question.kind === 'rule-table') &&
				questions.some((question) => question.kind === 'cli')
		);

		await page.goto(`/pbq?session=${sessionId}`);
		await page.waitForSelector('button[title^="Question "]');

		const ruleIndex = questions.findIndex((question) => question.kind === 'rule-table');
		await page
			.getByRole('button', { name: new RegExp(`^Question ${ruleIndex + 1}\\b`) })
			.first()
			.click();
		await expect(page.getByRole('table')).toBeVisible();
		const selects = page.locator('table select');
		const selectCount = await selects.count();
		expect(selectCount).toBeGreaterThanOrEqual(9);
		for (let index = 0; index < selectCount; index += 1) {
			const select = selects.nth(index);
			const values = await select.locator('option').evaluateAll((options) =>
				options.map((option) => (option as HTMLOptionElement).value).filter(Boolean)
			);
			// Leave the first cell blank to exercise partial-draft persistence.
			if (index === 0) continue;
			await select.selectOption(values[0]);
		}
		// Navigate away and back: the silent save must retain the partial table.
		await page.getByRole('button', { name: 'Next →' }).click();
		await page
			.getByRole('button', { name: new RegExp(`^Question ${ruleIndex + 1}\\b`) })
			.first()
			.click();
		await expect(page.locator('table select').nth(1)).not.toHaveValue('');
		const firstSelect = page.locator('table select').first();
		const firstValues = await firstSelect.locator('option').evaluateAll((options) =>
			options.map((option) => (option as HTMLOptionElement).value).filter(Boolean)
		);
		await firstSelect.selectOption(firstValues[0]);
		await expect(page.getByRole('button', { name: 'Check Answer' })).toBeEnabled();
		await page.getByRole('button', { name: 'Check Answer' }).click();
		await expect(page.getByText(/points/)).toBeVisible();

		const cliIndex = questions.findIndex((question) => question.kind === 'cli');
		await page
			.getByRole('button', { name: new RegExp(`^Question ${cliIndex + 1}\\b`) })
			.first()
			.click();
		await expect(page.locator('input[id^="cli-"]').first()).toBeVisible();
		const inputs = page.locator('input[id^="cli-"]');
		const inputCount = await inputs.count();
		// Leave the second task blank, navigate away, and come back: the partial draft must persist.
		await inputs.first().fill('draft-command');
		if (inputCount > 1) {
			const otherIndex = cliIndex === 0 ? 1 : 0;
			await page
				.getByRole('button', { name: new RegExp(`^Question ${otherIndex + 1}\\b`) })
				.first()
				.click();
			await page
				.getByRole('button', { name: new RegExp(`^Question ${cliIndex + 1}\\b`) })
				.first()
				.click();
			await expect(inputs.first()).toHaveValue('draft-command');
		}
		for (let index = 0; index < inputCount; index += 1) await inputs.nth(index).fill('draft-command');
		await page.getByRole('button', { name: 'Check Answer' }).click();
		await expect(page.getByText(/points/)).toBeVisible();

		await abandonSession(request, sessionId);
	});

	test('low-drain quick round starts, paginates, and resumes', async ({ page, request }) => {
		await page.goto('/quick?start=1&count=4');
		await expect(page.getByText('Q1 of 4')).toBeVisible();
		await Promise.all([
			page.waitForResponse(
				(response) =>
					response.url().includes('/api/quiz/session/') &&
					response.request().method() === 'PATCH'
			),
			page.getByRole('button', { name: 'Next →' }).click()
		]);
		await page.waitForTimeout(300);
		await expect(page.getByText('Q2 of 4')).toBeVisible();
		const sessionUrl = page.url();
		expect(sessionUrl).toContain('session=');
		await page.waitForTimeout(500);
		await page.reload();
		await expect(page.getByText('Q2 of 4')).toBeVisible();
		// Clean up the active session so later specs do not inherit it.
		const sessionId = new URL(sessionUrl).searchParams.get('session')!;
		await abandonSession(request, sessionId);
	});

	test('chunked 90-question exam shows a section break and resumes at the section', async ({
		page,
		request
	}) => {
		await page.goto('/quiz?start=1&type=full&mode=exam&sections=3');
		await expect(page.getByText('Q1 of 90')).toBeVisible();
		await Promise.all([
			page.waitForResponse(
				(response) =>
					response.url().includes('/api/quiz/session/') &&
					response.request().method() === 'PATCH'
			),
			page
				.getByRole('button', { name: /^Question 31\b/ })
				.first()
				.click()
		]);
		await expect(page.getByTestId('section-break')).toBeVisible();
		await page.getByRole('button', { name: /Begin section 2/ }).click();
		await expect(page.getByText('Q31 of 90')).toBeVisible();
		const sessionUrl = page.url();
		await page.waitForTimeout(300);
		await page.reload();
		// The boundary is restored from currentIndex and shows the break again.
		await expect(page.getByTestId('section-break')).toBeVisible();
		await page.getByRole('button', { name: /Begin section 2/ }).click();
		const sessionId = new URL(sessionUrl).searchParams.get('session')!;
		const questions = await sessionQuestions(request, sessionId);
		expect(questions).toHaveLength(90);
		await abandonSession(request, sessionId);
	});

	test('new PBQ mechanics render and stay operable at phone width', async ({ page, request }) => {
		const { sessionId, questions } = await drawSessionMatching(
			request,
			{ type: 'pbq', count: 30 },
			(questions) =>
				questions.some((question) => question.kind === 'rule-table') &&
				questions.some((question) => question.kind === 'cli')
		);
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto(`/pbq?session=${sessionId}`);
		await page.waitForSelector('button[title^="Question "]');

		const ruleIndex = questions.findIndex((question) => question.kind === 'rule-table');
		await page
			.getByRole('button', { name: new RegExp(`^Question ${ruleIndex + 1}\\b`) })
			.first()
			.click();
		await expect(page.getByRole('table')).toBeVisible();
		const firstSelect = page.locator('table select').first();
		await expect(firstSelect).toBeVisible();
		// Touch targets: the select and the reorder buttons must be at least 44px tall.
		expect((await firstSelect.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
		expect(
			(await page.getByRole('button', { name: /^Move rule .* up$/ }).first().boundingBox())?.height ?? 0
		).toBeGreaterThanOrEqual(44);

		const cliIndex = questions.findIndex((question) => question.kind === 'cli');
		await page
			.getByRole('button', { name: new RegExp(`^Question ${cliIndex + 1}\\b`) })
			.first()
			.click();
		const cliInput = page.locator('input[id^="cli-"]').first();
		await expect(cliInput).toBeVisible();
		expect((await cliInput.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
	});

});
