# UI Regression Follow-Up - 2026-07-08

## Scope

This follow-up addresses read-only review findings from the public visual contract slice. It does not start a new product wave. It only fixes regressions created by CSS ownership and import-order changes.

## Review Findings Addressed

- Global token collision: the public visual layer redefined the shared `--border-strong` token.
- Public convergence layer was not final because `visual-refresh.css` loaded before `owner-tools.css` and `liquid-materials.css`.
- Dark mode homepage search button had insufficient computed contrast.
- Mobile homepage internal width could be stretched by the decorative `home-index-spread::before` pseudo element.
- Article compact entry height grew after import-order changes.

## Changes

- Moved `visual-refresh.css` after `liquid-materials.css` in `client/src/main.tsx` so public convergence rules are the final public layer before Agent styles.
- Replaced the new public strong-border token with `--border-public-strong`, leaving the shared `--border-strong` contract untouched.
- Updated the late liquid search button rule to consume `--public-button-bg` and `--public-button-text`.
- Added homepage mobile overflow guards for `.home-track-panel-grid`, `.home-featured-band`, and `.home-index-spread`.
- Restored compact article entry behavior in the final public layer: 2-line clamp and `106.09375px` measured entry height at 390px.

## Verification

Commands run:

```bash
git diff --check
corepack pnpm check
corepack pnpm test -- client/src/pages/Home.test.ts client/src/components/ResearchShell.test.tsx client/src/components/MarkdownRenderer.test.tsx
corepack pnpm content:audit
corepack pnpm build
corepack pnpm audit:ui
```

Results:

- TypeScript check passed.
- Vitest passed: 41 files, 263 tests.
- Content audit passed: 9 article files, 0 warnings, 0 failures.
- Build passed.
- UI layout audit passed.

Targeted browser probe at `390x844` dark mode:

```json
{
  "buttonContrast": 9.351083344354251,
  "documentScrollWidth": 390,
  "documentClientWidth": 390,
  "spreadScrollWidth": 390,
  "spreadClientWidth": 390,
  "entryHeight": 106.09375,
  "entryLineClamp": "2",
  "proseMaxWidth": "620.065px"
}
```

## Notes

The first `corepack pnpm audit:ui` attempt failed because no local server was running at `localhost:3000`. After starting `corepack pnpm dev`, the audit passed.
