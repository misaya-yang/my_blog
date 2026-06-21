# FLG-05 Motion Performance Accessibility Plan

**Date:** 2026-06-21

**Feature:** FLG-F006

## Scope

Add progressive route/effect polish, rendering containment, focus visibility, and reduced-preference fallbacks across public, reader, Agent, owner, and editor surfaces. Preserve routes, APIs, auth, schemas, dependencies, and content.

## Inspected Facts

- `client/src/index.css` already has a global `prefers-reduced-motion` rule.
- `liquid-materials.css` already has `@supports` and `prefers-reduced-transparency` fallbacks for core material utilities.
- `public-components.css` already uses scroll-linked reading progress behind `@supports (animation-timeline: scroll(root))`.
- `visual-refresh.css` already uses container queries and `contain: paint`; FLG-02 rejected `content-visibility: auto` because screenshot QA showed blank delayed content.
- `owner-tools.css` now has FLG-04 owner-specific reduced motion/transparency handling at EOF.

## Implementation Plan

1. Add a small route effect controller in `App.tsx`:
   - Derive route kind from location.
   - Set root data attributes for route kind and view-transition support.
   - Trigger a short route entrance class only when `prefers-reduced-motion` is not reduce.
2. Add a compact global effects layer:
   - Route entrance animation for page shells, gated by root data attributes and reduced motion.
   - Stronger global overflow wrapping and stable container behavior for material surfaces.
   - Blur-disabled and reduced-transparency fallbacks for public, Agent, owner, and editor surfaces.
   - Focus-visible reinforcement for navigation, forms, editor controls, Agent controls, and owner controls.
3. Avoid risky rendering shortcuts:
   - Do not add `content-visibility: auto` to public rows or article bodies.
   - Keep existing `contain: paint` where screenshot-tested.
4. Verify:
   - Commands: `pnpm check`, `pnpm test`, `pnpm build`, `AUDIT_BASE_URL=http://localhost:3001 pnpm audit:baseline:quick`.
   - Additional audits: `AUDIT_BASE_URL=http://localhost:3001 pnpm audit:ui`.
   - Screenshots and metrics for `/`, `/post/goal-harness-agent-phase-protocol`, `/archive`, `/manage`, and `/write` in default, reduced motion, reduced transparency, and blur-disabled states.

## Acceptance Notes

- Effects are decorative only and must disappear under reduced motion.
- Surfaces remain readable with blur disabled or transparency reduced.
- No screenshot may show horizontal overflow or blank delayed content.
