# Markdown Rendering Polish Wave 1 Report

Date: 2026-07-09

## What Changed

- Added strict figure/caption handling in `MarkdownRenderer`.
- Image-only paragraphs render as `figure.article-figure`.
- Image plus emphasized `Figure:` / `Fig.` / `图：` text renders as `figure` with `figcaption.article-figure-caption`.
- Emphasized caption-only paragraphs render as `p.article-figure-caption`.
- Added semantic code block classes: `code-block-shell`, `code-block-pre`, `code-block-meta`, and `code-copy-button`.
- Fixed light-mode article table contrast by binding table header/cell colors to final reader tokens.

## Files Changed

- `client/src/components/MarkdownRenderer.tsx`
- `client/src/components/MarkdownRenderer.test.tsx`
- `client/src/styles/visual-refresh.css`
- `docs/superpowers/plans/2026-07-09-markdown-rendering-polish-wave-1.md`

## Browser Evidence

Screenshots are saved in this folder:

- `goal-harness-desktop-light-code.png`
- `goal-harness-desktop-light-table.png`
- `gated-ffn-mobile-dark-math.png`
- `gated-ffn-mobile-dark-table.png`

Probe output: `playwright-probes.json`

Probe summary:

- `/post/goal-harness-agent-phase-protocol` at 1440x900 light: `overflowX: 0`, 10 code blocks, 3 tables.
- `/post/gated-ffn-multiplicative-channel-control` at 390x844 dark: `overflowX: 0`, 11 code blocks, 2 tables, 22 display math blocks.
- Wide tables and long display math overflow inside their own containers, not the page.
- Light table text computed to dark semantic tokens after the contrast fix.

## Verification

Completed:

```bash
corepack pnpm test -- client/src/components/MarkdownRenderer.test.tsx
corepack pnpm check
corepack pnpm content:audit
corepack pnpm build
corepack pnpm audit:ui
```

Notes:

- The focused test command ran the full current Vitest suite: 45 files, 276 tests passed.
- `content:audit` passed with 0 failures, 0 warnings, and 1 existing non-blocking suggestion in `gated_ffn_blog.md:353`.
- `audit:ui` passed and refreshed `docs/product_optimization/reports/ui-layout-checks-latest.json`.
