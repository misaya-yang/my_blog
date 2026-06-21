# FLG-02 Public Navigation And Home Plan

**Date:** 2026-06-21

**Feature:** FLG-F003

**Status:** Executed

## Plan

1. Observe public routes and shared component boundaries before editing.
2. Apply the FLG-01 material vocabulary through shared public components first: header, sheet, surface, article card, and subscription shell.
3. Add page-scoped public classes to Home, Track, Archive, Search, Taxonomy, About, Login, and NotFound without changing routes, API calls, auth, analytics, schema, SEO, or content contracts.
4. Keep `client/src/styles/liquid-materials.css` as a compact foundation; place page layout polish in `client/src/styles/visual-refresh.css`.
5. Validate desktop and mobile public routes with screenshots, header height checks, horizontal overflow checks, empty/no-hit states, reduced transparency, reduced motion, and keyboard focus.
6. Record command evidence, screenshot evidence, feature-oracle status, continuity notes, and FLG-03 handoff.

## Design Technique Mapping

- Liquid Glass approximation: use existing `liquid-*` classes, backdrop blur, layered borders, highlight gradients, and solid fallbacks.
- Component responsiveness: use container queries for cards and track panels where local width matters more than viewport width.
- Color refinement: keep `color-mix()` and neutral graphite/aqua/mint tokens to avoid the rejected purple-blue palette.
- Progressive rendering: prefer `contain: paint` on repeated public rows; avoid `content-visibility: auto` where it causes full-page screenshot blanks or delayed reader-visible content.
- Preference handling: preserve reduced motion and reduced transparency fallbacks from FLG-01.

## Acceptance Gates

- Public routes share the material language through shared components and page-scoped classes.
- Home first screen uses an asymmetric bento with a clear latest-note action and stable Start here actions.
- Search/archive/taxonomy states are clear on mobile and desktop.
- Screenshots cover all required public routes at 390x844, 768x1024, 1440x1000, and 1728x1117.
- `pnpm check`, `pnpm test`, `pnpm build`, and `AUDIT_BASE_URL=http://localhost:3001 pnpm audit:ui` pass.
