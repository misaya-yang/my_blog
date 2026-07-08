# Performance, Accessibility, And I18n Gates Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

The product has two themes, two languages, lazy routes, dense Markdown articles, a floating Agent, owner dashboards, and custom audit scripts. UI polish is not complete unless it survives theme switching, narrow viewports, zoom, keyboard navigation, long Chinese/English text, and owner-only routes.

This spec defines cross-cutting gates that every UI or product slice must respect.

## Goals

- Prevent light/dark contrast regressions.
- Prevent text overflow and horizontal scrolling.
- Keep keyboard access reliable for public pages, Agent, editor, and owner screens.
- Keep route bundles and loading states reasonable.
- Keep Chinese and English copy complete enough for changed surfaces.
- Make screenshots and audit artifacts part of the implementation contract.

## Non-Goals

- No new accessibility dependency unless separately justified.
- No full Lighthouse automation requirement in the first pass.
- No complete design-system rewrite.
- No complete i18n framework migration.
- No performance budget that blocks every small content change.

## Current Files

Client:

- `client/src/App.tsx`
- `client/src/contexts/ThemeContext.tsx`
- `client/src/contexts/LanguageContext.tsx`
- `client/src/styles/*.css`
- `client/src/i18n/*`
- `client/src/components/ResearchShell.tsx`
- `client/src/components/agent/*`
- `client/src/pages/*`

Scripts:

- `scripts/audit/ui-layout.ts`
- `scripts/audit/baseline.ts`
- `scripts/audit/content-quality.ts`

Tests:

- `client/src/components/ResearchShell.test.tsx`
- `client/src/components/MarkdownRenderer.test.tsx`
- `client/src/components/agent/BlogAgentRoot.test.ts`
- route/page tests under `client/src/pages/`

## Theme Gate

Every changed public or Agent surface must be checked in light and dark mode.

Rules:

- Body text must be readable without relying on glow, blur, or transparency.
- Large highlighted panels must not wash out text.
- Accent colors should identify action or state, not dominate the screen.
- Avoid single-hue palettes that make everything look like the same blue/purple/teal surface.
- Theme tokens should be semantic, for example `--surface`, `--surface-muted`, `--text-primary`, `--agent-*`, not random one-off colors.

Acceptance:

- No pale text on pale glass in light mode.
- No low-contrast grey text on dark surfaces.
- Focus states remain visible in both themes.

## Reflow And Overflow Gate

Changed surfaces must be safe at:

- 1440x900 desktop.
- 768x1024 tablet.
- 390x844 mobile.
- Narrow panel states such as Agent min width.
- Browser zoom or equivalent narrow reflow pressure.

Rules:

- No page-level horizontal scroll.
- Long titles use `min-width: 0`, wrapping, or intentional truncation.
- Code/table/math overflow is contained inside the relevant block, not the page.
- Buttons must not clip labels.
- Cards must not resize unpredictably when dynamic labels or badges change.

## Keyboard And Focus Gate

Required behavior:

- Visible focus ring for buttons, links, inputs, tabs, toggles, and Agent controls.
- Escape closes Agent panel when focus is inside it.
- Mobile Agent sheet traps focus while open.
- Desktop Agent drag/resize controls must have keyboard-accessible alternatives or reset/preset controls.
- Editor toolbar buttons have accessible labels.
- Tabs and dialogs follow Radix/shadcn patterns already used in the repo.

## Motion Gate

Rules:

- Respect `prefers-reduced-motion`.
- Route transitions must not hide content or delay reading.
- Agent streaming should avoid layout jumping.
- Loading states should be calm and not use distracting shimmer/glow as the main visual identity.

## I18n Gate

Changed visible strings should be represented in the existing i18n files unless the surrounding file is already hard-coded and a narrow exception is justified.

Rules:

- Chinese and English strings should be meaning-equivalent, not literal filler.
- Avoid AI-marketing cliches in both languages.
- Long Chinese labels and long English words must fit controls.
- Owner-only technical labels can be concise but must still be understandable.

Suggested checks:

- Search changed files for hard-coded user-facing strings.
- Compare affected `client/src/i18n/*` keys in both languages.
- Browser-check the changed surface in Chinese and English when text density changed.

## Performance Gate

First-pass performance checks should use existing tooling:

- `corepack pnpm build` for bundle and compile failures.
- route-level lazy loading already in `client/src/App.tsx`.
- browser screenshots/audits for loading and route states.

Rules:

- Do not add heavy client dependencies for small UI changes.
- Keep markdown and Agent fixture data bounded.
- Avoid repeated expensive calculations inside render loops.
- Keep owner-only debug data off public default route paths.

## Screenshot Matrix

Minimum matrix for UI slices:

- Home: desktop light, mobile dark.
- Track: desktop light, mobile dark.
- Search: result desktop, zero-result mobile.
- Article: desktop and mobile.
- Agent: long answer with sources, desktop and mobile.
- Owner: `/manage` or `/manage/agent` when touched.

Store evidence under:

```text
docs/product_optimization/reports/<slice-name>-<date>/
```

## Implementation Slices

1. Add missing targeted tests only where a specific regression was fixed.
2. Extend `scripts/audit/ui-layout.ts` only when an automated check can be precise.
3. Add i18n completeness checks for changed owner/public surfaces when useful.
4. Keep screenshot capture in slice reports, not in source directories.
5. Run full gates before any merge to `main`.

## Tests And Gates

Focused gates depend on touched files. Full release gates:

```bash
corepack pnpm check
corepack pnpm test
corepack pnpm content:audit
corepack pnpm content:verify
corepack pnpm build
corepack pnpm audit:ui
```

Browser checks should set `AUDIT_BASE_URL` when using a local server:

```bash
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui
```

## Acceptance Checklist

- Changed UI is readable in light and dark mode.
- No changed route has page-level horizontal overflow.
- Keyboard focus is visible and useful.
- Reduced motion is respected.
- New visible copy is covered in Chinese and English where applicable.
- Build, typecheck, tests, and UI audit are reported honestly.
