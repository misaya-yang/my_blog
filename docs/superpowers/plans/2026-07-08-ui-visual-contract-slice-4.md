# UI Visual Contract Slice 4 Implementation Plan

Status: Completed

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a calmer public visual contract for the blog homepage and article reader without changing routes, data contracts, or component dependencies.

**Architecture:** Add semantic public and reader tokens at the global theme layer, then apply a final scoped convergence layer in `visual-refresh.css` so existing layout classes keep working. Use additive class names in `PostDetail.tsx` only where existing reader selectors already expect them.

**Tech Stack:** React, Vite, Tailwind CSS v4, CSS variables, existing `lucide-react` icons.

## Global Constraints

- No new dependency.
- No route, slug, SEO, auth, database, retrieval, or model-provider contract change.
- Keep edits scoped to public visual surfaces and documentation.
- Preserve existing component structure unless a class is required for a scoped style hook.
- Use CSS variables for light and dark mode parity.
- Avoid high-glow, high-purple, and generic AI glass visuals.
- Article body text must remain WCAG AA, with near-AAA target where feasible.
- No horizontal overflow on homepage or article reader.

---

### Task 1: Add Semantic Public Visual Tokens

**Files:**
- Modify: `client/src/index.css`

**Interfaces:**
- Consumes: existing `--bg`, `--fg`, `--surface-card`, `--border`, `--accent-bright`, and `.dark` theme tokens.
- Produces: `--surface-page`, `--surface-reading`, `--surface-rail`, `--surface-muted`, `--surface-overlay`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-link`, `--border-subtle`, `--border-strong`, `--accent-action`, `--accent-reading`, `--focus-ring`, plus public aliases.

- [x] **Step 1: Add light-mode tokens**

Add semantic variables inside `:root` after the existing base color tokens:

```css
  --surface-page: oklch(0.955 0.006 250);
  --surface-reading: oklch(0.982 0.004 250);
  --surface-rail: oklch(0.94 0.006 250 / 84%);
  --surface-muted: oklch(0.918 0.006 250 / 72%);
  --surface-overlay: oklch(0.97 0.004 250 / 94%);
  --text-primary: oklch(0.18 0.018 260);
  --text-secondary: oklch(0.38 0.016 252);
  --text-tertiary: oklch(0.54 0.014 250);
  --text-link: oklch(0.43 0.13 236);
  --border-subtle: oklch(0.8 0.01 250 / 58%);
  --border-strong: oklch(0.56 0.08 238 / 34%);
  --accent-action: oklch(0.48 0.12 236);
  --accent-reading: oklch(0.42 0.08 196);
  --focus-ring: oklch(0.5 0.11 220 / 38%);
```

- [x] **Step 2: Add dark-mode tokens**

Add the same token names inside `.dark`:

```css
  --surface-page: oklch(0.105 0.013 252);
  --surface-reading: oklch(0.13 0.014 250);
  --surface-rail: oklch(0.16 0.016 248 / 78%);
  --surface-muted: oklch(0.18 0.018 248 / 56%);
  --surface-overlay: oklch(0.095 0.012 252 / 94%);
  --text-primary: oklch(0.94 0.008 240);
  --text-secondary: oklch(0.76 0.014 238);
  --text-tertiary: oklch(0.62 0.014 238);
  --text-link: oklch(0.78 0.09 198);
  --border-subtle: oklch(0.85 0.035 238 / 13%);
  --border-strong: oklch(0.78 0.07 198 / 28%);
  --accent-action: oklch(0.74 0.09 198);
  --accent-reading: oklch(0.78 0.07 172);
  --focus-ring: oklch(0.76 0.08 198 / 42%);
```

- [x] **Step 3: Run diff check**

Run: `git diff -- client/src/index.css`

Expected: only additive tokens in `:root` and `.dark`.

### Task 2: Apply Scoped Public Visual Convergence

**Files:**
- Modify: `client/src/styles/visual-refresh.css`
- Modify: `client/src/styles/owner-tools.css`

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: final public-facing CSS layer for `.space-page`, `.site-header`, `.home-index-spread`, `.home-intro-rail`, `.home-track-panel`, `.home-featured-note`, `.paper-reader-main`, `.article-prose`, and related public controls.

- [x] **Step 1: Append final convergence layer**

Append a new `@layer components` block at the end of `visual-refresh.css` with comment `PVC-04 public visual contract`, then update the existing public token block in `owner-tools.css` because `owner-tools.css` is imported after `visual-refresh.css` and currently owns several public `!important` overrides.

- [x] **Step 2: Define public aliases**

Inside `.space-page:not(.owner-dark-scope)`, map public aliases to semantic tokens:

```css
--public-bg: var(--surface-page);
--public-bg-lower: color-mix(in oklch, var(--surface-page) 94%, black 6%);
--public-header-bg: var(--surface-overlay);
--public-sheet-bg: var(--surface-overlay);
--public-panel-bg: var(--surface-reading);
--public-inline-bg: var(--surface-muted);
--public-input-bg: var(--surface-overlay);
--public-text: var(--text-primary);
--public-muted: var(--text-secondary);
--public-faint: var(--text-tertiary);
--public-border: var(--border-subtle);
--public-border-strong: var(--border-strong);
--public-divider: var(--border-subtle);
--public-accent: var(--accent-action);
--public-accent-bright: var(--text-link);
--public-button-bg: var(--accent-action);
--public-button-text: oklch(0.985 0.004 250);
--public-radius: 0.72rem;
--public-panel-shadow: 0 1px 2px oklch(0.32 0.018 250 / 7%);
```

- [x] **Step 3: Calm homepage and reader surfaces**

Use existing class names to remove neon/glass emphasis, reduce crowding, and keep layout stable:

```css
.space-page:not(.owner-dark-scope) {
  background: linear-gradient(180deg, var(--surface-page), color-mix(in oklch, var(--surface-page) 94%, black 5%));
  color: var(--text-primary);
}

.space-page:not(.owner-dark-scope) :where(.space-grid, .space-stars, .planet-horizon) {
  opacity: 0.08;
}

.home-index-grid {
  gap: clamp(0.9rem, 1.7vw, 1.35rem);
}

.home-intro-rail,
.home-track-panel,
.home-featured-note,
.home-more-notes,
.paper-reader-main.reading-surface {
  border-color: var(--border-subtle) !important;
  background: var(--surface-reading) !important;
  color: var(--text-primary);
  box-shadow: var(--public-panel-shadow) !important;
}
```

- [x] **Step 4: Normalize article typography**

Add reader-specific typography rules:

```css
.paper-reader-main .article-prose {
  max-width: 74ch;
  color: var(--text-secondary);
  font-size: clamp(1.04rem, 0.98rem + 0.18vw, 1.14rem);
  line-height: 1.88;
}

.paper-reader-main .article-prose :where(p, li) {
  color: var(--text-secondary) !important;
}
```

- [x] **Step 5: Prevent horizontal overflow**

Add overflow guards for public reader and homepage containers:

```css
.home-index-spread,
.home-index-grid,
.home-track-panel,
.paper-reader-container,
.paper-reader-main,
.paper-reader-main .article-prose {
  min-width: 0;
}

.paper-reader-main .article-prose :where(pre, .technical-table-wrap) {
  max-width: 100%;
}
```

- [x] **Step 6: Run CSS diff check**

Run: `git diff -- client/src/styles/visual-refresh.css client/src/styles/owner-tools.css`

Expected: one final layer appended plus the existing public token override aligned to the same semantic tokens, no unrelated rewrites.

### Task 3: Connect Reader Contract Classes

**Files:**
- Modify: `client/src/pages/PostDetail.tsx`

**Interfaces:**
- Consumes: existing reader selectors in `visual-refresh.css`.
- Produces: additive class hooks `liquid-readable`, `liquid-panel`, and `liquid-surface` only where they already match existing selector intent.

- [x] **Step 1: Add reader main hook**

Change:

```tsx
<article className="reading-surface solid-reading paper-reader-main p-5 sm:p-8 lg:p-10">
```

To:

```tsx
<article className="reading-surface solid-reading liquid-readable paper-reader-main p-5 sm:p-8 lg:p-10">
```

- [x] **Step 2: Add rail and reader helper hooks**

Change the relevant `glass-dock` class strings:

```tsx
"paper-brief-card glass-dock sticky top-24"
"mobile-toc-shell glass-dock mb-7 rounded-lg p-4 lg:hidden"
"article-entry-layer glass-dock"
"article-agent-prompts glass-dock"
"article-secondary-actions glass-dock"
"toc-surface glass-dock sticky top-24 p-5"
```

To additive variants:

```tsx
"paper-brief-card glass-dock liquid-panel sticky top-24"
"mobile-toc-shell glass-dock liquid-panel mb-7 rounded-lg p-4 lg:hidden"
"article-entry-layer glass-dock liquid-panel"
"article-agent-prompts glass-dock liquid-surface"
"article-secondary-actions glass-dock liquid-surface"
"toc-surface glass-dock liquid-panel sticky top-24 p-5"
```

- [x] **Step 3: Run type-aware check**

Run: `corepack pnpm check`

Expected: no TypeScript or lint errors.

### Task 4: Verification And Evidence

**Files:**
- Create: `docs/product_optimization/reports/ui-visual-contract-slice-4-2026-07-08/summary.md`

**Interfaces:**
- Consumes: verification command output.
- Produces: a concise evidence report for user review.

- [x] **Step 1: Run targeted and full gates**

Run:

```bash
git diff --check
corepack pnpm check
corepack pnpm test -- client/src/pages/Home.test.ts client/src/components/MarkdownRenderer.test.tsx client/src/components/ResearchShell.test.tsx
corepack pnpm content:audit
corepack pnpm build
```

Expected: all commands pass. If the test script runs the full suite, record the actual total.

- [x] **Step 2: Run browser UI audit**

Start local server:

```bash
corepack pnpm dev
```

Then run:

```bash
corepack pnpm audit:ui
```

Expected: UI audit passes without horizontal overflow regressions. Stop the dev server after the audit.

- [x] **Step 3: Restore generated timestamp noise if needed**

If `docs/product_optimization/reports/ui-layout-checks-latest.json` only changes `generatedAt`, restore that line to the previous timestamp so the commit stays meaningful.

- [x] **Step 4: Write evidence report**

Record:

```markdown
# UI Visual Contract Slice 4 Evidence

Date: 2026-07-08
Branch: dev

## Scope

- Added semantic public and reader tokens.
- Added scoped public visual convergence layer.
- Connected existing reader hooks for article detail.

## Verification

- `git diff --check`: pass
- `corepack pnpm check`: pass
- `corepack pnpm test -- ...`: pass
- `corepack pnpm content:audit`: pass
- `corepack pnpm build`: pass
- `corepack pnpm audit:ui`: pass

## Review Notes

- No route, DB, auth, retrieval, model provider, or dependency changes.
- Public surfaces now inherit one calmer token contract in light and dark modes.
- Existing component structure is preserved.
```

- [x] **Step 5: Simplification pass**

Review only modified code for repeated selectors, unnecessary `!important`, and accidental overreach. Do not reformat unrelated CSS.

- [x] **Step 6: Commit**

Run:

```bash
git status --short
git add client/src/index.css client/src/styles/visual-refresh.css client/src/styles/owner-tools.css client/src/pages/PostDetail.tsx docs/superpowers/plans/2026-07-08-ui-visual-contract-slice-4.md docs/product_optimization/reports/ui-visual-contract-slice-4-2026-07-08/summary.md
git commit -m "feat: tune public visual contract"
```

Expected: commit created on `dev`.
