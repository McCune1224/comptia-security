import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const VIEWPORTS = {
	desktop: { width: 1440, height: 900 },
	mobile: { width: 390, height: 844 }
} as const;

type Width = keyof typeof VIEWPORTS;
type Theme = 'light' | 'dark';

async function expectTerminologySetup(page: Page) {
	await expect(page.getByRole('heading', { name: /terminology bench/i })).toBeVisible();
	await expect(page.getByTestId('section-protocols')).toBeVisible();
	await expect(page.getByTestId('section-terminology')).toBeVisible();
	await expect(page.getByTestId('start-drill')).toBeVisible();
}

async function openTerminology(page: Page) {
	await page.goto('/terminology');
	await expect(
		page.locator('[data-testid="terminology-page"][data-hydrated="true"]')
	).toBeVisible();
}

async function configure(
	page: Page,
	section: 'protocols' | 'terminology',
	format: 'fill' | 'matching' | 'mixed'
) {
	await page.getByTestId(`section-${section}`).click();
	await page.getByTestId(`format-${format}`).click();
	await page.getByTestId('length-select').selectOption('6');
}

async function runFill(page: Page) {
	await configure(page, 'protocols', 'fill');
	await page.getByTestId('start-drill').click();

	const answers = new Map<string, string>();
	for (let item = 0; item < 6; item += 1) {
		const definition = (await page.getByTestId('definition').innerText()).trim();
		await page.getByTestId('answer-input').fill('definitely-not-the-answer');
		await page.getByTestId('check-answer').click();

		const feedback = page.getByTestId('feedback');
		await expect(feedback).toBeVisible();
		await expect(feedback).toContainText(/not quite/i);
		await expect(feedback).toContainText(/the answer is/i);

		const answer = await feedback.getAttribute('data-answer');
		expect(answer, `missing answer for: ${definition}`).toBeTruthy();
		answers.set(definition, answer!);

		await page.getByTestId('next-item').click();
	}

	expect(answers.size).toBe(6);
	await expect(page.getByTestId('result-score')).toContainText('0 of 6 correct');
	await expect(page.getByTestId('retry-missed')).toBeVisible();

	// Retry only the missed entries and answer each with a deliberately mangled
	// case/space/hyphen form. Normalization must still mark every answer correct.
	await page.getByTestId('retry-missed').click();
	for (let item = 0; item < 6; item += 1) {
		const definition = (await page.getByTestId('definition').innerText()).trim();
		const answer = answers.get(definition);
		expect(answer, `retry item not in missed map: ${definition}`).toBeTruthy();
		const mangled = [...answer!.toLowerCase()].join('-');
		await page.getByTestId('answer-input').fill(mangled);
		await page.getByTestId('check-answer').click();
		await expect(page.getByTestId('feedback')).toContainText('Correct.');
		await page.getByTestId('next-item').click();
	}

	await expect(page.getByTestId('result-score')).toContainText('6 of 6 correct');
	await expect(page.getByTestId('result-score')).toContainText('100%');

	// Nothing is persisted: a full reload returns to setup, not the result.
	await page.reload();
	await expect(
		page.locator('[data-testid="terminology-page"][data-hydrated="true"]')
	).toBeVisible();
	await expectTerminologySetup(page);
}

async function runMatching(page: Page) {
	await configure(page, 'terminology', 'matching');
	await page.getByTestId('ports-toggle').check();
	await expect(page.getByTestId('start-drill')).toBeEnabled();
	await page.getByTestId('start-drill').click();

	for (let board = 0; board < 2; board += 1) {
		await expect(page.getByTestId('matching-board')).toBeVisible();
		const premises = page.locator('[data-connect-premise]');
		const targets = page.locator('[data-connect-target]');
		await expect(premises).toHaveCount(3);
		await expect(targets).toHaveCount(3);

		for (let pair = 0; pair < 3; pair += 1) {
			await premises.nth(pair).click();
			await targets.nth(pair).click();
		}

		await page.getByTestId('submit-matches').click();
		await expect(page.getByTestId('feedback')).toContainText('of 3 pairs matched');

		// MatchConnect feedback is answer-aware: one deliberately wrong pairing
		// must paint a danger line, and the reversed middle pair a success line.
		const strokes = await page
			.locator('svg line')
			.evaluateAll((lines) => lines.map((line) => line.getAttribute('stroke')));
		expect(strokes).toContain('var(--color-danger)');
		expect(strokes).toContain('var(--color-success)');

		await page.getByTestId('next-item').click();
	}

	await expect(page.getByTestId('result-score')).toBeVisible();
	await expect(page.getByTestId('retry-missed')).toBeVisible();
	await page.getByTestId('retry-missed').click();
	await expect(page.getByTestId('matching-board')).toBeVisible();
	await page.getByRole('button', { name: 'End drill' }).click();
	await expectTerminologySetup(page);
}

test('terminology is reachable from the rail, the practice hub, and the command palette', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');
	const rail = page.getByRole('navigation', { name: 'Main navigation' });
	await expect(rail.getByRole('link', { name: 'Terminology', exact: true })).toBeVisible();

	await page.goto('/practice');
	const card = page.getByRole('link', { name: /Terminology/ }).first();
	await expect(card).toBeVisible();
	await expect(card).toHaveAttribute('href', '/terminology');

	await page.getByRole('button', { name: 'Search and jump' }).first().click();
	const input = page.getByPlaceholder('Jump to a page or module…');
	await input.fill('terminology');
	await page.getByRole('option', { name: /Terminology/ }).click();
	await expect(page).toHaveURL(/\/terminology$/);
	await expect(page.getByTestId('terminology-page')).toBeVisible();
});

test('mixed format includes a matching board followed by fill items', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await openTerminology(page);

	await configure(page, 'terminology', 'mixed');
	await page.getByTestId('start-drill').click();

	await expect(page.getByTestId('matching-board')).toBeVisible();
	const premises = page.locator('[data-connect-premise]');
	const targets = page.locator('[data-connect-target]');
	for (let pair = 0; pair < 3; pair += 1) {
		await premises.nth(pair).click();
		await targets.nth(pair).click();
	}
	await page.getByTestId('submit-matches').click();
	await page.getByTestId('next-item').click();

	await expect(page.getByTestId('answer-input')).toBeVisible();
	await expect(page.getByTestId('matching-board')).toHaveCount(0);
	await page.getByRole('button', { name: 'End drill' }).click();
	await expectTerminologySetup(page);
});

for (const width of Object.keys(VIEWPORTS) as Width[]) {
	for (const theme of ['light', 'dark'] as Theme[]) {
		test(`terminology drills: ${width}, ${theme}`, async ({ browser }) => {
			const context = await browser.newContext({
				colorScheme: theme,
				viewport: VIEWPORTS[width],
				initScript: `localStorage.setItem('theme', '${theme}');`
			});
			const page = await context.newPage();

			await page.goto('/terminology');
			await expect(
				page.locator('[data-testid="terminology-page"][data-hydrated="true"]')
			).toBeVisible();
			expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
			await expectTerminologySetup(page);

			await runFill(page);
			await openTerminology(page);
			await runMatching(page);

			// The two-column definition/target layout must not force sideways scrolling.
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - window.innerWidth
			);
			expect(overflow).toBeLessThanOrEqual(1);

			await context.close();
		});
	}
}
