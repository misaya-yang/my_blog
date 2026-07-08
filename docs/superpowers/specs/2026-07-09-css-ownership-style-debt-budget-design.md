# CSS Ownership And Style Debt Budget Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

The UI has gone through several visual passes and now contains large CSS surfaces, theme tokens, Agent-specific styles, owner styles, and legacy liquid/glass rules. Without a style debt budget, every UI fix risks adding another broad override.

This spec defines CSS ownership and debt gates for future UI work.

## Goals

- Keep style ownership clear by surface.
- Prevent unexplained `!important` growth.
- Prevent one-off color and shadow drift.
- Keep Agent styles owned by Agent CSS.
- Make visual changes measurable in reports.

## Non-Goals

- No wholesale CSS rewrite.
- No CSS-in-JS migration.
- No token redesign from scratch.
- No automatic formatter pass over all CSS.

## Current Files

- `client/src/index.css`
- `client/src/styles/visual-refresh.css`
- `client/src/styles/public-components.css`
- `client/src/styles/owner-tools.css`
- `client/src/styles/agent-surfaces.css`
- `client/src/styles/liquid-materials.css`

## Ownership Rules

- Global tokens and base theme: `index.css`.
- Public page layout and article surfaces: `visual-refresh.css` and `public-components.css`.
- Owner/admin surfaces: `owner-tools.css`.
- Agent frame, panel, composer, sources, trust, trace: `agent-surfaces.css`.
- Legacy material effects: keep narrow; do not add Agent-specific broad overrides there.

## Debt Budget

For UI slices, report:

- CSS files changed.
- Approximate added/removed lines.
- New `!important` count.
- Current and changed `!important` count for touched CSS files.
- Viewport-unit font-size count, especially `clamp(...vw...)` for readable text.
- New hard-coded colors.
- New broad selectors.
- Screenshot evidence.

Default rules:

- No new `!important` without an explanation.
- No increase in `!important`, viewport-font rules, or broad selectors without a report-level waiver and removal plan.
- No new random hex colors when a token exists.
- No global selector for a local component problem.
- No nested cards or decorative card wrappers.

## Baseline Debt To Track

Read-only review found heavy existing `!important` use concentrated in:

- `client/src/styles/liquid-materials.css`
- `client/src/styles/owner-tools.css`
- `client/src/styles/visual-refresh.css`
- `client/src/styles/agent-surfaces.css`

Exact counts should be recalculated by the implementation slice before editing. The rule is burn-down or no-growth by default.

Viewport-font debt also exists in public/visual CSS. New readable text must avoid viewport-unit sizing, and touched existing rules should be converted to stable responsive steps or documented as display-only exceptions.

## Tests And Evidence

Run when CSS changes:

```bash
corepack pnpm check
corepack pnpm audit:ui
corepack pnpm build
```

Browser evidence should include changed routes in light/dark mode.

## Acceptance Checklist

- Style ownership is clear for every changed selector.
- New tokens are semantic and placed in the right layer.
- `!important` usage does not grow without justification.
- No page-level horizontal overflow or unreadable text is introduced.
- Reports include screenshot or audit evidence for visual changes.
