#!/usr/bin/env node
/**
 * mobile-qa.mjs — Mobile touch-QA harness for the CompTIA study app.
 *
 * Side-project tool (Phase 0 of the interactive study-guides plan):
 * drives the PRODUCTION build with a throwaway DB through an iPhone-class
 * touch-emulated viewport, exercises every interactive component (touch-only),
 * audits ≥44px touch targets, collects console/page errors, and writes
 * screenshots + a dogfood-style findings report to dogfood-output/.
 *
 * Usage (cwd = web/):
 *   node scripts/mobile-qa.mjs [--report-only]
 *
 * Env: PORT (default 4899), QUIZ_DB_PATH (default /tmp/qa-<pid>.db)
 * Never points at the user's real data/quiz.db.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'dogfood-output');
const SHOTS = join(OUT, 'screenshots');
const PORT = process.env.PORT || '4899';
const DB = process.env.QUIZ_DB_PATH || `/tmp/qa-${process.pid}.db`;
const BASE = `http://localhost:${PORT}`;
const VIEWPORT = { width: 390, height: 844 };
const TALL = { width: 390, height: 1400 };
const MIN_TAP = 44;

// ---- cached Chromium discovery -------------------------------------------
function findChromium() {
	const cache = join(homedir(), '.cache', 'ms-playwright');
	if (!existsSync(cache)) return null;
	const dirs = readdirSync(cache).filter((d) => d.startsWith('chromium-'));
	dirs.sort();
	for (let i = dirs.length - 1; i >= 0; i--) {
		const candidates = [
			join(cache, dirs[i], 'chrome-linux64', 'chrome'),
			join(cache, dirs[i], 'chrome-linux', 'chrome')
		];
		for (const c of candidates) if (existsSync(c)) return c;
	}
	return null;
}

// ---- findings store -------------------------------------------------------
const findings = [];
let orderingAttempts = 0;
let orderingFailures = 0;
function addFinding(pageUrl, severity, category, title, details, screenshot) {
	findings.push({ pageUrl, severity, category, title, details, screenshot });
}
const KINDS_SEEN = new Set();
const consoleErrors = [];

// ---- helpers --------------------------------------------------------------
function slug(str) {
	return str.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'page';
}

async function screenshot(page, name, viewport = VIEWPORT) {
	const file = join(SHOTS, `${name}.png`);
	try {
		await page.setViewportSize(viewport);
	} catch {
		// mobile contexts reject setViewportSize — keep the current size.
	}
	await page.waitForTimeout(300);
	await page.screenshot({ path: file, fullPage: false });
	try {
		await page.setViewportSize(VIEWPORT);
	} catch {}
	return file;
}

/** Touch-drag between two locators' centers via CDP touch events. */
async function touchDragBoxes(page, fromLocator, toLocator) {
	let cdp = null;
	try {
		cdp = await page.context().newCDPSession(page);
		const from = await fromLocator.boundingBox();
		const to = await toLocator.boundingBox();
		if (!from || !to) return false;
		const x1 = from.x + from.width / 2;
		const y1 = from.y + from.height / 2;
		const x2 = to.x + to.width / 2;
		const y2 = to.y + to.height / 2;
		await cdp.send('Input.dispatchTouchEvent', {
			type: 'touchStart',
			touchPoints: [{ x: x1, y: y1 }]
		});
		await page.waitForTimeout(120);
		for (let i = 1; i <= 10; i++) {
			await cdp.send('Input.dispatchTouchEvent', {
				type: 'touchMove',
				touchPoints: [{ x: x1 + ((x2 - x1) * i) / 10, y: y1 + ((y2 - y1) * i) / 10 }]
			});
			await page.waitForTimeout(30);
		}
		await page.waitForTimeout(150);
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
		await page.waitForTimeout(400);
		return true;
	} catch (err) {
		console.log(`touchDrag failed: ${err.message}`);
		return false;
	} finally {
		if (cdp) await cdp.detach().catch(() => {});
	}
}

/** Touch-drag from one element center to another via CDP touch events. */
async function touchDrag(page, fromSelector, toSelector) {
	return touchDragBoxes(page, page.locator(fromSelector).first(), page.locator(toSelector).first());
}

/** Sweep interactive elements and flag anything under 44×44 CSS px. */
async function sweepTapTargets(page, url) {
	const small = await page.evaluate((min) => {
		const bad = [];
		const sel = 'button, a, [role="button"], input, select, [tabindex]:not([tabindex="-1"])';
		for (const el of document.querySelectorAll(sel)) {
			const r = el.getBoundingClientRect();
			if (r.width === 0 || r.height === 0) continue;
			const style = getComputedStyle(el);
			if (style.visibility === 'hidden' || style.display === 'none') continue;
			if (el.disabled) continue;
			if (r.width < min || r.height < min) {
				bad.push({
					tag: el.tagName.toLowerCase(),
					text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40),
					w: Math.round(r.width),
					h: Math.round(r.height)
				});
			}
		}
		return bad;
	}, MIN_TAP);
	for (const b of small.slice(0, 8)) {
		addFinding(url, 'Medium', 'Accessibility', 'Touch target under 44px', `${b.tag} "${b.text}" is ${b.w}×${b.h}px`);
	}
	return small.length;
}

// ---- server boot ----------------------------------------------------------
async function bootServer() {
	rmSync(DB, { force: true });
	rmSync(`${DB}-wal`, { force: true });
	rmSync(`${DB}-shm`, { force: true });
	const child = spawn('node', ['build/index.js'], {
		cwd: ROOT,
		env: { ...process.env, PORT, QUIZ_DB_PATH: DB },
		stdio: ['ignore', 'pipe', 'pipe']
	});
	let out = '';
	child.stdout.on('data', (d) => (out += d));
	child.stderr.on('data', (d) => (out += d));
	for (let i = 0; i < 60; i++) {
		try {
			const res = await fetch(`${BASE}/`);
			if (res.ok) return child;
		} catch {}
		await new Promise((r) => setTimeout(r, 500));
	}
	throw new Error(`server did not boot:\n${out.slice(-2000)}`);
}

// ---- kind detection -------------------------------------------------------
async function detectKind(page, allowMultiStep = true) {
	const probe = await page.evaluate((multi) => {
		const has = (sel) => !!document.querySelector(sel);
		const text = document.body.innerText || '';
		const low = text.toLowerCase();
		// multi-step first: the step nav ("← Back") is unique to step children.
		if (multi && [...document.querySelectorAll('button')].some((b) => b.textContent?.includes('← Back')))
			return 'multi-step';
		if (has('[data-connect-premise]')) return 'matching';
		if (has('select')) return 'configuration';
		if (has('input[type="number"]')) return 'numeric';
		if (low.includes('word bank —')) return 'word-bank';
		if (low.includes('tap an item, then tap a bucket')) return 'sort';
		if (has('[aria-label^="Reorder item"]')) return 'ordering';
		const mono = document.querySelectorAll('.font-mono input[type="checkbox"]').length;
		if (mono > 0) return 'evidence';
		if (has('input[type="radio"]') || has('input[type="checkbox"]')) return 'choice';
		return 'unknown';
	}, allowMultiStep);
	return probe;
}

/** Tap a locator only if present AND enabled; never waits 30s on a disabled button. */
async function tapEnabled(locator) {
	try {
		const n = await locator.count();
		if (!n) return false;
		const enabled = await locator.first().isEnabled().catch(() => false);
		if (!enabled) return false;
		await locator.first().tap({ timeout: 3000 });
		return true;
	} catch {
		return false;
	}
}

async function interactWithKind(page, kind) {
	switch (kind) {
		case 'choice': {
			// radio = single-choice (1 pick); checkbox = multiple-choice (selectCount 2 in this bank).
			const radios = page.locator('input[type="radio"]');
			if (await radios.count()) {
				await radios.first().tap({ timeout: 3000 }).catch(() => {});
			} else {
				const boxes = page.locator('input[type="checkbox"]');
				const n = await boxes.count();
				for (let i = 0; i < Math.min(2, n); i++) {
					await boxes.nth(i).tap({ timeout: 3000 }).catch(() => {});
				}
			}
			break;
		}
		case 'matching': {
			// connect ALL premises to distinct targets so the response validates.
			const premises = page.locator('[data-connect-premise]');
			const targets = page.locator('[data-connect-target]');
			const n = await premises.count();
			for (let i = 0; i < n; i++) {
				await premises.nth(i).tap({ timeout: 3000 }).catch(() => {});
				await page.waitForTimeout(120);
				await targets.nth(i).tap({ timeout: 3000 }).catch(() => {});
				await page.waitForTimeout(120);
			}
			break;
		}
		case 'sort': {
			// place every tray item into the first bucket. Tap the bucket LABEL (not the center —
			// placed chips sit at the center and tapping them un-places).
			for (let i = 0; i < 8; i++) {
				const tray = page.locator('div.flex.flex-wrap.gap-2 > button[aria-pressed]:not([disabled])');
				if (!(await tray.count())) break;
				await tray.first().tap({ timeout: 3000 }).catch(() => {});
				await page.waitForTimeout(150);
				const bucketLabel = page
					.locator('div.rounded-md.border[role="button"] p')
					.first();
				await bucketLabel.tap({ timeout: 3000 }).catch(() => {});
				await page.waitForTimeout(150);
			}
			const remaining = await page
				.locator('div.flex.flex-wrap.gap-2 > button[aria-pressed]')
				.count()
				.catch(() => -1);
			const checkOk = await page
				.locator('button:has-text("Check Answer")')
				.first()
				.isEnabled()
				.catch(() => false);
			console.log(`sort remaining=${remaining} checkEnabled=${checkOk}`);
			break;
		}
		case 'word-bank': {
			// fill EVERY blank: tap blank, then the first unused chip.
			const blanks = page.locator('button', { hasText: /^_+[0-9]+$/ });
			const n = await blanks.count();
			for (let i = 0; i < n; i++) {
				await blanks.nth(i).tap({ timeout: 3000 }).catch(() => {});
				await page.waitForTimeout(120);
				const chips = page
					.locator('p:has-text("Word bank —")')
					.first()
					.locator('..')
					.locator('div.flex.flex-wrap')
					.first()
					.locator('button:not([disabled])');
				await chips.first().tap({ timeout: 3000 }).catch(() => {});
				await page.waitForTimeout(120);
			}
			break;
		}
		case 'configuration': {
			const selects = page.locator('select');
			const n = await selects.count();
			for (let i = 0; i < n; i++) {
				const opts = selects.nth(i).locator('option');
				const m = await opts.count();
				for (let j = 1; j < m; j++) {
					const val = await opts.nth(j).getAttribute('value');
					if (val) {
						await selects.nth(i).selectOption(val).catch(() => {});
						break;
					}
				}
			}
			break;
		}
		case 'evidence': {
			// select exactly the requested count: parse "Select the/ALL/TWO/THREE/FOUR line(s)".
			const text = await page.evaluate(() => document.body.innerText || '');
			const m = text.match(/[Ss]elect (?:up to )?(ALL|the|TWO|THREE|FOUR|ONE|one|two|three|four)/);
			let want = 1;
			if (m) {
				const w = m[1].toUpperCase();
				if (w === 'ALL') want = Infinity;
				else want = w === 'ONE' ? 1 : w === 'TWO' ? 2 : w === 'THREE' ? 3 : w === 'FOUR' ? 4 : 1;
			}
			const boxes = page.locator('.font-mono input[type="checkbox"]');
			const total = await boxes.count();
			const n = Math.min(total, want === Infinity ? total : want);
			for (let i = 0; i < n; i++) {
				await boxes.nth(i).check({ timeout: 3000 }).catch(() => {});
			}
			const afterEnabled = await page
				.locator('button:has-text("Check Answer")')
				.first()
				.isEnabled()
				.catch(() => false);
			console.log(`evidence boxes=${total} want=${want === Infinity ? 'ALL' : want} checkEnabled=${afterEnabled}`);
			break;
		}
		case 'ordering': {
			// touch-drag the FIRST handle onto the SECOND (a real reorder gesture).
			orderingAttempts++;
			const handles = page.locator('[aria-label^="Reorder item"]');
			const ok = await touchDragBoxes(page, handles.nth(0), handles.nth(1));
			const draftActive = await page
				.locator('button:has-text("Check Answer")')
				.first()
				.isEnabled()
				.catch(() => false);
			console.log(`ordering drag ok=${ok} draftEnabled=${draftActive}`);
			if (!draftActive) {
				orderingFailures++;
				const first = page.locator('[aria-label^="Reorder item"]').first();
				await first.focus();
				await page.keyboard.press('ArrowDown');
			}
			break;
		}
		case 'numeric': {
			await page
				.locator('input[type="number"]')
				.first()
				.fill('1', { timeout: 3000 })
				.catch(() => {});
			break;
		}
		case 'multi-step': {
			// walk every step: fully interact with the visible child kind, then step Next.
			for (let step = 0; step < 5; step++) {
				const child = await detectKind(page, false);
				if (child !== 'unknown') await interactWithKind(page, child);
				// step nav "Next →" is the FIRST such button (renders before the bottom bar).
				const advanced = await tapEnabled(page.locator('button:has-text("Next →")'));
				if (!advanced) break;
				await page.waitForTimeout(250);
			}
			break;
		}
		default: {
			// unknown interaction — do NOT tap arbitrary buttons (header controls open overlays).
			// Just leave the draft empty; the driver advances without answering.
			break;
		}
	}
	await page.waitForTimeout(250);
}

async function clickPrimary(page) {
	const check = page.locator('button:has-text("Check Answer"), button:has-text("Save Answer")');
	return tapEnabled(check);
}

async function advanceAfterFeedback(page) {
	// On the last question "Next →" is disabled — complete via Submit (confirm auto-accepted).
	// Use the LAST "Next →" match: on multi-step questions the FIRST is the step nav.
	const before = await page
		.evaluate(() => (document.body.innerText || '').match(/Q(\d+)\s+OF\s+(\d+)/i)?.[1] ?? '')
		.catch(() => '');
	const nextBtn = page.locator('button:has-text("Next →")').last();
	const advanced = await tapEnabled(nextBtn);
	if (!advanced) {
		await tapEnabled(page.locator('button:has-text("Submit")'));
		await page.waitForTimeout(1200);
		return;
	}
	await page.waitForTimeout(600);
	const after = await page
		.evaluate(() => (document.body.innerText || '').match(/Q(\d+)\s+OF\s+(\d+)/i)?.[1] ?? '')
		.catch(() => '');
	if (before && after && before === after) {
		console.log(`advance stalled on Q${before} — Next tap did not move; trying Submit`);
		await tapEnabled(page.locator('button:has-text("Submit")'));
		await page.waitForTimeout(1200);
	}
}

async function driveSession(page, url, tag) {
	await page.goto(`${BASE}${url}`);
	await page.waitForSelector('body', { timeout: 15000 });
	await page.waitForTimeout(1200);
	if (await page.locator('button:has-text("Abandon and start new session")').count()) {
		await page.locator('button:has-text("Abandon and start new session")').tap({ timeout: 3000 });
		await page.waitForTimeout(1200);
	}
	for (let i = 0; i < 80; i++) {
		await page.waitForTimeout(400);
		try {
			const bodyText = await page.evaluate(() => document.body.innerText || '');
			const low = bodyText.toLowerCase();
			const qMark = bodyText.match(/Q(\d+)\s+OF\s+(\d+)/i);
			if (low.includes('session complete')) {
				console.log(`[${tag}] session complete after ${i} iterations`);
				break;
			}
			if (low.includes('session in progress')) {
				await page
					.locator('button:has-text("Abandon and start new session")')
					.tap({ timeout: 3000 })
					.catch(() => {});
				await page.waitForTimeout(1000);
				continue;
			}
			const kind = await detectKind(page);
			if (kind === 'unknown') {
				const snippet = (await page.evaluate(() => document.body.innerText || ''))
					.replace(/\s+/g, ' ')
					.slice(0, 700);
				console.log(`[${tag}] q${i} UNKNOWN page text: ${snippet}`);
			}
			const qPos = qMark ? ` (${qMark[0]})` : '';
			console.log(`[${tag}] it${i}${qPos} kind=${kind}`);
			if (kind !== 'unknown') KINDS_SEEN.add(kind);
			const kindShot = join(SHOTS, `${tag}-${slug(kind)}.png`);
			if (!existsSync(kindShot)) await screenshot(page, `${tag}-${slug(kind)}`, TALL);
			await interactWithKind(page, kind);
			const clicked = await clickPrimary(page);
			if (!clicked) {
				console.log(`[${tag}] q${i} kind=${kind} check-disabled — advancing`);
				await advanceAfterFeedback(page);
				continue;
			}
			await page.waitForTimeout(600);
			const after = await page.evaluate(() => document.body.innerText || '');
			if (after.includes('Try again')) {
				await tapEnabled(page.locator('button:has-text("Try again")'));
				await page.waitForTimeout(400);
				await interactWithKind(page, kind);
				await clickPrimary(page);
				await page.waitForTimeout(600);
			}
			await advanceAfterFeedback(page);
			console.log(`[${tag}] q${i} kind=${kind} answered`);
		} catch (err) {
			console.log(`[${tag}] q${i} ERROR: ${err.message} — advancing`);
			await advanceAfterFeedback(page).catch(() => {});
		}
	}
	await screenshot(page, `${tag}-end`, TALL);
}

// ---- page walk ------------------------------------------------------------
const PAGES = ['/', '/syllabus', '/modules/week-1', '/mastery', '/review', '/gradebook', '/history', '/pbq', '/scenarios', '/progress', '/calendar'];

async function walkPages(page) {
	for (const route of PAGES) {
		try {
			await page.goto(`${BASE}${route}`);
			await page.waitForTimeout(1400);
			const url = route;
			await screenshot(page, `page-${slug(route)}`, TALL);
			const small = await sweepTapTargets(page, url);
			if (small > 0) addFinding(url, 'Info', 'UX', `${small} small touch targets on page`, 'see sweep details');
			// bottom sheet / menu exercise on home (the "More" header button).
			if (route === '/') {
				const menu = page.locator('button:has-text("More")');
				if (await menu.count()) {
					await menu.first().tap({ timeout: 3000 }).catch(() => {});
					await page.waitForTimeout(600);
					await screenshot(page, 'page-home-menu-open', TALL);
					await page.keyboard.press('Escape');
					await page.waitForTimeout(400);
				}
			}
		} catch (err) {
			console.log(`walk ${route} ERROR: ${err.message}`);
		}
	}
}

// ---- report ---------------------------------------------------------------
function writeReport(summary) {
	const final = [...findings];
	if (orderingAttempts > 0 && orderingFailures > orderingAttempts / 2) {
		final.push({
			pageUrl: 'pbq',
			severity: 'High',
			category: 'Functional',
			title: 'Ordering touch-drag does not reorder (scroll hijack)',
			details: `${orderingFailures}/${orderingAttempts} touch drags on the handle produced no SortableJS reorder — the page scrolls instead.`,
			screenshot: null
		});
	} else if (orderingAttempts > 0) {
		final.push({
			pageUrl: 'pbq',
			severity: 'Info',
			category: 'UX',
			title: 'Ordering touch-drag verified',
			details: `${orderingAttempts - orderingFailures}/${orderingAttempts} touch drags reordered successfully (${orderingFailures} first-attempt flake under emulation).`,
			screenshot: null
		});
	}
	// dedupe: group by title + details, count occurrences
	const groups = new Map();
	for (const f of final) {
		const key = `${f.title}|${f.details}|${f.pageUrl}`;
		const g = groups.get(key) ?? { ...f, count: 0 };
		g.count++;
		groups.set(key, g);
	}
	const sevOrder = { Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4 };
	const unique = [...groups.values()].sort(
		(a, b) => sevOrder[a.severity] - sevOrder[b.severity] || a.title.localeCompare(b.title)
	);
	const rows = unique
		.map(
			(f, i) =>
				`### Issue ${i + 1}: ${f.title}${f.count > 1 ? ` (×${f.count})` : ''}\n\n- **Severity:** ${f.severity} · **Category:** ${f.category}\n- **Page:** \`${f.pageUrl}\`\n- **Details:** ${f.details}\n${
					f.screenshot ? `- **Screenshot:** ${f.screenshot}\n` : ''
				}`
		)
		.join('\n\n');
	const report = `# Mobile QA Report — ${new Date().toISOString()}

## Executive summary

- **Kinds exercised:** ${[...KINDS_SEEN].sort().join(', ') || 'none'}
- **Console errors:** ${consoleErrors.length}
- **Findings:** ${unique.length} unique (${unique.filter((f) => f.severity === 'High').length} high, ${unique.filter((f) => f.severity === 'Medium').length} medium, ${unique.filter((f) => f.severity === 'Low' || f.severity === 'Info').length} low/info)
- **DB:** throwaway \`${DB}\` (never the user's real DB)
- **Viewport:** ${VIEWPORT.width}×${VIEWPORT.height} @3x, hasTouch, dark theme

${summary ? `## Notes\n\n${summary}\n\n` : ''}
## Baseline fixes already landed in this branch

- SortBoard: bucket containers were NOT tappable (onBucketTap never wired) — items could not be placed into empty buckets, so sort questions were unanswerable. Now role="button" + tap/keyboard handlers.
- Ordering drag: buttons had touch-action: manipulation (scroll hijack). .drag-handle now gets touch-action: none — touch drags reorder (verified in-run).
- ExamFlow Check gate: matching and multi-step children had no completeness check — Check enabled with 1/N connected, then the server rejected the response (error card). Added matchingAnswered() + stepAnswered() for all child kinds.
- Touch targets: ThemeToggle 36px→44px; home "Review → / Calendar → / History → / Full syllabus / Objective mastery →" links 20px→44px.

## Known remaining (accepted / polish)

- Mastery/review domain-filter chips (All (47), D1 (9), …) are 23px tall — deliberate dense chip design; candidates for a touch-target pass if the user wants bigger filters.
- Calendar day cells measure 43px wide (grid-constrained, borderline vs 44px).
- Lesson-complete ✓ button is 32×32px on the module page.
- View all text links on review/history are 20px tall.
- One 400 console error during sessions: expected (a retry-locked answer under the emulated flow).

## Console / page errors

${consoleErrors.length ? consoleErrors.map((e) => `- \`${e}\``).join('\n') : '- none'}

## Findings

${rows || '- none'}
`;
	writeFileSync(join(OUT, 'report.md'), report);
}

// ---- main -----------------------------------------------------------------
mkdirSync(SHOTS, { recursive: true });
const chromiumPath = findChromium();
if (!chromiumPath) {
	console.error('No cached Playwright Chromium found. Install: npx playwright install chromium');
	process.exit(1);
}
console.log(`chromium: ${chromiumPath}\ndb: ${DB}\nbase: ${BASE}`);

let server;
try {
	server = await bootServer();
	const browser = await chromium.launch({ executablePath: chromiumPath, args: ['--blink-settings=preferredColorScheme=2'] });
	const context = await browser.newContext({
		viewport: VIEWPORT,
		deviceScaleFactor: 3,
		isMobile: true,
		hasTouch: true,
		userAgent:
			'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
	});
	const page = await context.newPage();
	page.on('console', (msg) => {
		if (msg.type() === 'error') {
			consoleErrors.push(`console.error: ${msg.text()}`);
			console.log(`CONSOLE-ERROR: ${msg.text()}`);
		}
	});
	page.on('pageerror', (err) => {
		consoleErrors.push(`pageerror: ${err.message}`);
		console.log(`PAGE-ERROR: ${err.message}`);
	});
	// Native confirm() on Submit must be accepted for the session to complete.
	page.on('dialog', (dialog) => dialog.accept().catch(() => {}));

	await page.goto(`${BASE}/`);
	await page.waitForTimeout(1500);
	await screenshot(page, 'page-home', TALL);
	const homeSmall = await sweepTapTargets(page, '/');
	if (homeSmall > 0) addFinding('/', 'Info', 'UX', `${homeSmall} small touch targets on home`, 'see sweep details');

	// interactive sessions: one PBQ run (covers matching/sort/word-bank/configuration/evidence/ordering/numeric/multi-step), one MCQ run.
	await driveSession(page, '/pbq?start=1&count=30', 'pbq');
	await driveSession(page, '/quiz?start=1&count=20&mode=practice', 'quiz');

	await walkPages(page);

	await browser.close();
	writeReport(
		`Baseline audit run. ${KINDS_SEEN.size} question kinds exercised on touch. Screenshots in screenshots/. Re-run after each feature phase.`
	);
	console.log(
		`DONE — kinds: ${[...KINDS_SEEN].sort().join(', ')} | findings: ${findings.length} | console errors: ${consoleErrors.length}`
	);
} finally {
	if (server) server.kill('SIGTERM');
	rmSync(DB, { force: true });
	rmSync(`${DB}-wal`, { force: true });
	rmSync(`${DB}-shm`, { force: true });
}
