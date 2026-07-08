# Performance Budget Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

The app includes public article routes, owner tools, Tiptap editor, Agent UI, Markdown rendering, KaTeX/highlight libraries, and audit scripts. Performance should be protected with practical budgets and route-boundary checks, not vague "keep it fast" guidance.

## Goals

- Keep public initial routes from pulling owner/editor-heavy code.
- Track JS/CSS bundle sizes against baseline.
- Avoid expensive render loops in Agent and Markdown surfaces.
- Keep audit fixtures bounded.
- Make budget increases explicit in reports.

## Non-Goals

- No full Core Web Vitals lab system.
- No new bundle analyzer dependency unless justified.
- No premature micro-optimization.

## Current Files

- `client/src/App.tsx`
- `server/vite-config.test.ts`
- `scripts/audit/baseline.ts`
- `scripts/audit/phase05-performance-boundaries.test.ts`
- `package.json`
- `vite.config.ts`

## Budget Contract

Initial policy:

- Public initial JS/CSS gzip should not exceed current baseline by more than a documented threshold.
- Owner/editor chunks may be larger but must stay lazy-loaded.
- Adding a dependency requires explaining which route loads it.
- UI fixtures should be bounded and not included in public production routes.

The first implementation should record current baseline before enforcing strict numeric blockers.

## Route Boundary Contract

Owner/editor-only dependencies should remain outside public initial route bundles:

- Tiptap editor.
- Owner dashboards.
- Agent debug/eval heavy components where possible.

Public route code can include shared article rendering and Agent launcher, but should avoid eager owner operations code.

## Acceptance Checklist

- Build output is recorded in release reports.
- Bundle growth above threshold is explained or fixed.
- Owner/editor code remains lazy-loaded.
- No heavy dependency is added without route impact review.
- Performance tests remain focused and non-flaky.
