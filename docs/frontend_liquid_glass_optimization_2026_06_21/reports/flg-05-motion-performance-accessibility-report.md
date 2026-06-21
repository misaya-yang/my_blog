# FLG-05 Motion Performance Accessibility Report

**Date:** 2026-06-21

**Feature:** FLG-F006

**Status:** Passing

## Summary

FLG-05 added a compact, progressive effects layer across public, reader, Agent, owner, and editor surfaces. The implementation keeps motion decorative, makes fallback states testable, and avoids risky rendering shortcuts that previously produced blank screenshots.

## Files Changed

- `client/src/App.tsx`: added `RouteEffectController`, route-kind derivation, and root data attributes for route kind, view-transition support, and route entrance motion.
- `client/src/styles/liquid-materials.css`: added a small FLG-05 effects layer for route entrance, overflow wrapping, safe content visibility, focus-visible reinforcement, solid-surface fallback, reduced-transparency fallback, and reduced-motion suppression.
- `docs/frontend_liquid_glass_optimization_2026_06_21/reports/flg-05-motion-performance-accessibility-plan.md`: recorded the plan-first path.

## Implementation Notes

- Route effects are gated by root data attributes and `prefers-reduced-motion`.
- `data-solid-surfaces="true"` provides a deterministic browser QA hook for blur-disabled fallback checks.
- Reduced transparency and solid fallback states remove backdrop blur, shadows, and glass tinting from public, reader, Agent, owner, and editor material surfaces.
- The effects layer uses `overflow-wrap`, `min-width: 0`, and existing `contain: paint`; it does not add `content-visibility: auto`.
- Owner/editor data tables, textareas, preview panes, and article prose remain opaque or near-opaque.

## Command Evidence

```bash
pnpm check
```

Result: passed.

```bash
pnpm test
```

Result: passed. Vitest reported 40 passed test files and 254 passed tests.

```bash
pnpm build
```

Result: passed. Vite and the server bundle completed.

```bash
AUDIT_BASE_URL=http://localhost:3001 pnpm audit:ui
```

Result: passed. Report path: `docs/product_optimization/reports/ui-layout-checks-latest.json`.

```bash
AUDIT_BASE_URL=http://localhost:3001 pnpm audit:baseline:quick
```

Result: passed. Output reported 14 route checks, 0 skipped routes, 0 known gaps, and 0 command failures.

## Browser Evidence

Screenshots and metrics captured under `.cache/flg-05-qa/`.

Coverage:

- Routes: `/`, `/post/goal-harness-agent-phase-protocol`, `/archive`, `/manage`, and `/write`.
- Viewports: `390x844` and `1440x1000`.
- States: default, reduced motion, reduced transparency, and solid surfaces.
- Total screenshots: 40.
- Automated failures: 0.

Measured checks:

- Maximum horizontal overflow delta: 0px.
- Reduced-motion route animation names: all `none`.
- Reduced-transparency blur disabled: true.
- Solid-surface blur disabled: true.
- Focus-visible outline detected in every captured state.
- Route kind root attributes matched expected values for home, reader, public, owner, and editor routes.

Representative screenshots:

- `.cache/flg-05-qa/390x844-solid-reader.png`
- `.cache/flg-05-qa/1440x1000-solid-manage.png`
- `.cache/flg-05-qa/390x844-reduced-motion-write.png`
- `.cache/flg-05-qa/metrics.json`

## Deviations and Fixes

- Initial solid-surface checks found residual blur on reader related links and owner/editor headers. The fallback selector specificity was increased and fallback transition duration was reduced to `0.01ms`; the 40-state matrix then passed.
- The first `/write` mobile metric undercounted content because `innerText` does not include textarea values. The QA metric was corrected to include input and textarea values; screenshots already showed the editor content.

## Acceptance Gates

- Reduced motion disables nonessential movement: passed.
- Reduced transparency and unsupported blur produce solid readable surfaces: passed.
- Container behavior avoids text overflow and layout shift: passed.
- Long lists and article sections avoid risky delayed rendering: passed.
- Feature oracle FLG-F006 updated: passed.

## Handoff

FLG-06 can perform final full-site QA. Carry forward the FLG-05 test hooks and constraints: `data-solid-surfaces="true"` is the blur-disabled check, route motion must remain preference-gated, and `content-visibility: auto` should not be added to public rows or article bodies without fresh visual proof.
