import { expect, test } from '@playwright/test';

/**
 * Shell and navigation contracts for the Paper & Ink layout.
 *
 * These assert structure (routes, nav, breakpoints, design tokens) rather than
 * data, so they hold with or without a seeded database.
 */

test('desktop shell: top nav links, no bottom nav, serif + crisp radius tokens', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');
	const nav = page.getByRole('navigation', { name: 'Main navigation' });
	for (const label of ['Course', 'Practice', 'Progress', 'Review', 'Calendar']) {
		await expect(nav.getByRole('link', { name: label, exact: true })).toBeVisible();
	}
	await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeHidden();

	const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
	expect(bodyFont).toContain('Inter');

	// /practice renders its hero and cards without a database.
	await page.goto('/practice');
	const h1Font = await page
		.locator('h1')
		.first()
		.evaluate((el) => getComputedStyle(el).fontFamily);
	expect(h1Font).toContain('Fraunces');
	const cardRadius = await page
		.locator('.card')
		.first()
		.evaluate((el) => getComputedStyle(el).borderRadius);
	expect(cardRadius).toBe('4px');
});

test('mobile shell: bottom nav with raised practice button and 44px targets', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	const bottom = page.getByRole('navigation', { name: 'Primary navigation' });
	await expect(bottom).toBeVisible();
	for (const label of ['Home', 'Course', 'Practice', 'Progress', 'Review']) {
		await expect(bottom.getByRole('link', { name: label, exact: true })).toBeVisible();
	}
	await expect(
		page
			.getByRole('navigation', { name: 'Main navigation' })
			.getByRole('link', { name: 'Course', exact: true })
	).toBeHidden();

	// Every interactive element in the shell clears the 44px touch floor. Scoped
	// to the header and navs so the assertion does not depend on page data.
	const small = await page.evaluate(() => {
		const out: string[] = [];
		const scope = document.querySelectorAll('nav a, nav button, header a, header button');
		scope.forEach((el) => {
			const r = el.getBoundingClientRect();
			if (r.width === 0 || r.height === 0) return;
			if (r.height < 44)
				out.push(
					`${el.tagName}:${(el.textContent ?? '').trim().slice(0, 24)}=${Math.round(r.height)}`
				);
		});
		return out;
	});
	expect(small, small.join('\n')).toEqual([]);
});

test('practice hub renders; legacy analytics routes redirect into the progress tabs', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/practice');
	await expect(page.getByRole('link', { name: /Quiz/ }).first()).toBeVisible();
	await expect(page.getByRole('link', { name: /Wall of shame/ }).first()).toBeVisible();

	await page.goto('/progress?tab=mastery');
	await expect(page.getByRole('link', { name: 'Grades' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Sessions' })).toBeVisible();

	await page.goto('/gradebook');
	await expect(page).toHaveURL(/\/progress\?tab=grades/);
	await page.goto('/mastery');
	await expect(page).toHaveURL(/\/progress\?tab=mastery/);
	await page.goto('/history');
	await expect(page).toHaveURL(/\/progress\?tab=sessions/);
});

test('desktop rail collapses to icons and expands when pinned', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');
	const rail = page
		.locator('aside')
		.filter({ has: page.getByRole('navigation', { name: 'Main navigation' }) });
	await expect(rail).toBeVisible();
	expect(Math.round((await rail.boundingBox())!.width)).toBe(64);

	await page.getByRole('button', { name: 'Pin navigation open' }).click();
	await expect(page.getByRole('button', { name: 'Unpin navigation' })).toBeVisible();
	await expect.poll(async () => Math.round((await rail.boundingBox())!.width)).toBe(232);

	await page.getByRole('button', { name: 'Unpin navigation' }).click();
	await expect.poll(async () => Math.round((await rail.boundingBox())!.width)).toBe(64);
});

test('command palette opens from the header and keyboard, and navigates', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');
	await page.getByRole('button', { name: 'Search and jump' }).first().click();
	const dialog = page.getByRole('dialog', { name: 'Search and jump' });
	await expect(dialog).toBeVisible();

	await dialog.getByLabel('Search').fill('progress');
	await expect(dialog.getByRole('option', { name: /Progress/ }).first()).toBeVisible();
	await dialog
		.getByRole('option', { name: /Progress/ })
		.first()
		.click();
	await expect(page).toHaveURL(/\/progress/);

	// Cmd+K reopens it from anywhere.
	await page.keyboard.press('Meta+k');
	await expect(page.getByRole('dialog', { name: 'Search and jump' })).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog', { name: 'Search and jump' })).toBeHidden();
});

test('home is a bento grid on desktop and a single column on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');
	// Two panels share a row at desktop (side by side boxes).
	const boxes = await page.locator('main .card').first().boundingBox();
	const second = await page.locator('main .card').nth(1).boundingBox();
	expect(Math.abs(boxes!.y - second!.y)).toBeLessThan(4);

	await page.setViewportSize({ width: 390, height: 844 });
	await page.reload();
	const m1 = await page.locator('main .card').first().boundingBox();
	const m2 = await page.locator('main .card').nth(1).boundingBox();
	expect(m2!.y).toBeGreaterThan(m1!.y + m1!.height - 4);
});

test('course pages are two-pane on wide screens with a persistent rail', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });

	await page.goto('/syllabus');
	const examRail = page.locator('aside').filter({ hasText: 'Exam & schedule' });
	await expect(examRail).toBeVisible();
	const main = await page.locator('main .grid > div').first().boundingBox();
	const rail = await examRail.boundingBox();
	expect(rail!.x).toBeGreaterThan(main!.x + main!.width - 8);

	await page.goto('/modules/week-1');
	const moduleRail = page.locator('aside').filter({ hasText: 'In this module' });
	await expect(moduleRail).toBeVisible();

	// The rail outline opens the lesson in place.
	const lessons = moduleRail.locator('button');
	const count = await lessons.count();
	if (count > 0) {
		await lessons.first().click();
		await expect(page.locator('[id^="lesson-"] [class*="ruled"]').first()).toBeVisible();
	}

	// Below xl the rail is gone and the column is single.
	await page.setViewportSize({ width: 1024, height: 900 });
	await page.goto('/syllabus');
	await expect(page.locator('aside').filter({ hasText: 'Exam & schedule' })).toBeHidden();
});

test('hovering the rail overlays without reflowing, and the rail paints above the header', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');
	const rail = page
		.locator('aside')
		.filter({ has: page.getByRole('navigation', { name: 'Main navigation' }) });
	const header = page.locator('header').first();

	// Park the pointer away from the rail first: the default pointer position sits over it,
	// which expands it on load and makes any hover assertion racy.
	await page.mouse.move(700, 300);
	await expect.poll(async () => Math.round((await rail.boundingBox())!.width)).toBe(64);
	const collapsedHeader = await header.boundingBox();

	// Hovering expands the rail but must not move the page.
	await page.mouse.move(32, 400, { steps: 8 });
	await expect
		.poll(async () => Math.round((await rail.boundingBox())!.width), { timeout: 10_000 })
		.toBe(232);
	await page.waitForTimeout(400);

	const expandedRail = await rail.boundingBox();
	const hoveredHeader = await header.boundingBox();
	expect(Math.abs(hoveredHeader!.x - collapsedHeader!.x)).toBeLessThan(2);

	// The rail covers part of the header while open, and it must be the thing on top:
	// this is the bug where the sticky header used to paint over the expanded rail.
	const onTop = await page.evaluate(() => {
		const aside = document.querySelector('aside');
		const header = document.querySelector('header');
		const el = document.elementFromPoint(120, 30);
		return {
			inRail: Boolean(aside && el && aside.contains(el)),
			inHeader: Boolean(header && el && header.contains(el))
		};
	});
	expect(onTop, JSON.stringify(onTop)).toEqual({ inRail: true, inHeader: false });

	// Pinning is the deliberate path that does offset the content, so nothing overlaps.
	await page.mouse.move(700, 300);
	await page.getByRole('button', { name: 'Pin navigation open' }).click();
	await expect
		.poll(async () => Math.round((await rail.boundingBox())!.width), { timeout: 10_000 })
		.toBe(232);
	await page.waitForTimeout(400);
	const pinnedHeader = await header.boundingBox();
	const pinnedRail = await rail.boundingBox();
	expect(pinnedHeader!.x).toBeGreaterThanOrEqual(pinnedRail!.x + pinnedRail!.width - 1);
});

test('every rail page renders its context rail at xl and drops it below', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });

	// Discover a real assignment id from the syllabus.
	await page.goto('/syllabus');
	const assignmentHref = await page
		.locator('a[href^="/assignments/"]')
		.first()
		.getAttribute('href');

	const targets: [string, string][] = [
		['/syllabus', 'Exam & schedule'],
		['/modules/week-1', 'In this module'],
		[assignmentHref ?? '/', 'This assignment'],
		['/progress', 'Standing'],
		['/review', 'Recall'],
		['/calendar', 'Coming up'],
		['/admin', 'On this page'],
		['/quiz', 'Drills'],
		['/scenarios', 'Drills'],
		['/pbq', 'Drills']
	];

	for (const [path, title] of targets) {
		await page.goto(path);
		await expect(page.locator('aside').filter({ hasText: title })).toBeVisible();
	}

	// The shared launcher gives each drill one heading, a start button, and the rail.
	for (const path of ['/quiz', '/scenarios', '/pbq']) {
		await page.goto(path);
		await expect(page.locator('h1')).toHaveCount(1);
		await expect(page.getByRole('button', { name: /^Start/ })).toBeVisible();
		await expect(page.locator('aside').filter({ hasText: 'Drills' })).toBeVisible();
	}

	await page.setViewportSize({ width: 1024, height: 900 });
	await page.goto('/calendar');
	await expect(page.locator('aside').filter({ hasText: 'Coming up' })).toBeHidden();
});

test('review page keeps the Past sessions link to /history', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/review');
	const link = page.getByRole('link', { name: 'Past sessions' });
	if (await link.count()) await expect(link).toHaveAttribute('href', '/history');
});
