# Paper & Ink — UI Design System (v2)

The app's visual language: **a beautifully typeset textbook**. Warm paper, ink typography,
one deep-green accent. Calm, reading-first, editorial. This document is the contract for
restyling pages. When in doubt, copy patterns from the reference implementations.

## Reference implementations (read these first)

- `src/routes/+layout.svelte` — the shell: rail, top strip, content offset
- `src/lib/components/AppRail.svelte` — desktop icon rail (collapses/expands)
- `src/lib/components/CommandPalette.svelte` — Cmd+K navigation
- `src/lib/components/ContextRail.svelte` — the sticky right rail used by content pages
- `src/routes/+page.svelte` — bento home grid
- `src/routes/syllabus/+page.svelte` — two-pane course layout with rail
- `src/routes/modules/[id]/+page.svelte` — two-pane module with in-place lesson outline
- `src/routes/practice/+page.svelte` — card grid hub
- `src/lib/components/DrillLauncher.svelte` — the shared drill launcher (quiz, scenarios, PBQs)
- `src/routes/calendar/+page.svelte`, `src/routes/admin/+page.svelte` — two-pane pages whose grid sits
  inside the `{:else}` branch (never let an `{#if}` straddle a layout element)

## Layout architecture ("tabbed workspace")

- **Desktop (lg+): a left `AppRail` is the primary navigation.** It is icon-only at 4rem and
  expands to 14.5rem **on hover, as an overlay**: hovering must never reflow the page, because a
  stray pointer over the rail would otherwise shift whatever the user is reading or aiming at
  (and the rail must paint above the sticky header, `z-[60]`, or the header clips it). Pinning
  (persisted in `localStorage['rail-pinned']`) is the deliberate path that offsets the content.
  The rail is the element carrying `nav[aria-label="Main navigation"]`; keep a link labelled
  exactly `Review` inside it (an e2e test asserts it).
- **A slim top strip** (64px, sticky) carries the section title (derived from the path),
  the command palette trigger, the course and profile switchers, the theme toggle, and the
  mobile menu trigger. It holds no primary nav.
- **Home is a bento grid**: `lg:grid-cols-2 xl:grid-cols-4` with row/column spans so the
  readiness hero leads and smaller panels (today, what's due, path, drills, recent) sit
  beside it. It collapses to a single column on phones.
- **Content pages are two-pane** at `xl`: a `max-w`-free main column plus a 20rem
  `ContextRail` (`hidden xl:block`, sticky at `top-24`). Use the rail for orientation and
  quick actions, never for primary content. Pages with a rail: syllabus, modules, assignments,
  progress, review, calendar, admin, and the three drill launchers.
- **The exam runner is deliberately single-column.** No rail, no cockpit during a timed exam.
- **Mobile keeps the bottom tab bar** (`BottomNav`) with the raised Practice button, plus a
  top app bar. Secondary links live in `MobileMenu`'s sheet.
- **Command palette** (Cmd+K or the header trigger) is navigation-only: sections plus course
  modules. Keep it keyboard-driven (`ArrowUp`/`ArrowDown`/`Enter`/`Escape`).

## Tokens (already live in `src/app.css` — do NOT edit app.css)

Token names are unchanged; values are the new palette. Use them via Tailwind utilities:

- Backgrounds: `bg-bg-base` (page), `bg-surface-900` (recessed band), `bg-surface-800`
  (card/panel white), `bg-surface-700`, `bg-surface-600` (tracks, wells)
- Text: `text-text-primary` (ink), `text-text-secondary`, `text-text-muted`, `text-text-subtle`
- Accent **forest green**: `text-accent`, `bg-accent`, `bg-accent/10` tints — for links, eyebrows,
  interactive highlights, and the raised Practice button ONLY
- Accent **brass**: `accent-secondary` — secondary data (bars, icons) when the green accent would imply action
- Status (semantics only, never decoration): `success`, `danger`, `info`, `warning`
- Primary action: `btn-primary` is ink-filled (light) / cream-filled (dark) via
  `--color-primary` / `--color-on-primary`. Do not hand-roll filled buttons.

Radius scale is deliberately crisp: `rounded`, `rounded-md`, `rounded-lg`, and `rounded-xl` all
resolve to 4px, `rounded-2xl` to 6px, `rounded-sm` to 2px. Cards are 4px via the `.card` class.
There are no pills and no large corner radii — 86 decorative `rounded-full` circles were squared
off to 4px, and only true circles keep it (status dots, spinners, radio marks, the profile swatch).

## Component classes (use, don't reinvent)

- `.card` — white panel, hairline border, whisper shadow. Radius built in.
- `.btn` + `.btn-primary` / `.btn-ghost` / `.btn-danger` — ≥44px, 4px radius, 600 weight.
- `.chip` — small uppercase square tag (3px). StatusChip already conforms.
- `.eyebrow` — 11px, 700, 0.16em tracking, uppercase, forest green. Every section header starts with one
  when it makes sense.
- `.h-display` — Fraunces serif headings. All page titles and section headings.
- `.serif-italic` — the editorial flourish: italic serif for accent words inside headlines
  (e.g. "The _drill room_") and quiet asides. Use sparingly — one per view.
- `.num-display` — Fraunces for big stat numerals.
- `.touch-target` — 44px hit area for inline text links.

## Patterns

- **Page header**: `.card` hero with `.eyebrow` (context) → `.h-display` title (often with a
  `.serif-italic` accent span) → short lede paragraph → buttons (`btn btn-primary` first).
- **Cards**: `class="card p-5 sm:p-6"`. Hover lift for clickable cards:
  `transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"`.
- **Icon chips**: `grid h-11 w-11 place-items-center rounded-full bg-accent/10 text-accent`
  (swap tint per semantic: `bg-info/10 text-info`, etc.). Round, not square.
- **List rows inside cards**: `rounded-xl border border-border bg-surface-900/50 p-4`
  with hover `hover:border-border-strong hover:bg-surface-700/50`.
- **Progress bars**: `h-1.5`/`h-2 rounded-full bg-surface-600` with `bg-accent` or
  `bg-accent-secondary` fill.
- **Links out of a section header**: `touch-target text-sm font-semibold text-accent hover:underline`
  with a trailing `→`.
- **Week/number badges**: `serif-italic grid h-11 w-11 place-items-center rounded-full
bg-accent/10 text-accent`.

## Rules (hard)

1. Mobile-first. Every interactive target ≥44px. Tables become stacked cards below `md:`
   (gradebook/history already do; keep that).
2. Keep every `aria-label`, role, heading level, link name, and `data-testid` that exists today.
   E2E asserts: theme switch labelled "Toggle light and dark theme"; on `/review` a link named
   "Past sessions" with href `/history`; quiz header timer matching `/^\d+:\d{2}$/`; a
   "Show practice context" checkbox on the quiz runner (practice mode only).
3. Both themes must work. Never hardcode a hex color; always theme tokens. No gradients, no
   glow/colored shadows — shadows come from `var(--shadow-card)` / `var(--shadow-lift)` only.
4. `{#each}` blocks stay keyed. No legacy Svelte syntax (`$:`, `export let`, `on:`, `<slot>`).
5. Do not edit: `src/app.css`, `src/routes/+layout.svelte`, `BottomNav.svelte`, `MobileMenu.svelte`,
   `ThemeToggle.svelte`, anything under `src/lib/server/`, or any `*.test.ts`.
6. Preserve ALL data logic, fetch calls, and behavior exactly. This is a reskin + layout-polish
   pass; the only functional changes are the ones your task brief lists explicitly.
7. Keep `{@html}` usage only where it already exists (trusted static lesson content).
