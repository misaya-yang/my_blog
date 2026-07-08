# Accessibility Automation Matrix Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

Accessibility needs route-level evidence, not only good intentions. This spec defines the keyboard, focus, labeling, reduced-motion, dialog, and reflow checks expected for future UI slices.

## Goals

- Verify keyboard paths for main public and owner routes.
- Ensure icon-only controls have accessible names.
- Ensure dialogs/sheets manage focus correctly.
- Ensure 400% zoom or narrow reflow does not break content.
- Keep reduced-motion behavior stable.

## Non-Goals

- No claim of full WCAG certification.
- No mandatory axe/pa11y dependency in the first pass.
- No screen-reader transcript requirement.

## Current Files

- `scripts/audit/ui-layout.ts`
- `client/src/components/ResearchShell.tsx`
- `client/src/components/MarkdownRenderer.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/pages/Home.tsx`
- `client/src/pages/Search.tsx`
- `client/src/pages/PostDetail.tsx`
- `client/src/pages/Manage.tsx`
- `client/src/pages/ManageAgent.tsx`

## Matrix

Routes:

- Home.
- Track.
- Search result and zero-result.
- Article.
- Agent panel.
- Manage.
- Manage Agent.
- Editor when touched.

Checks:

- Landmark and single primary heading where applicable.
- Keyboard tab path reaches primary actions.
- Focus ring visible.
- Icon-only buttons have accessible names.
- `aria-current` on active navigation where applicable.
- `time` elements use `dateTime`.
- Escape closes Agent/dialogs and restores focus where expected.
- Mobile sheet traps focus.
- Reduced motion disables non-essential transitions.
- 320px or equivalent narrow reflow has no horizontal page scroll.

## Automation Strategy

Phase 1:

- Extend existing `audit:ui` with precise checks only.
- Use Playwright screenshots and DOM assertions.
- Keep manual notes where automation would be brittle.

Phase 2:

- Consider axe/pa11y only with a written dependency reason and tuned rules.

## Acceptance Checklist

- UI slices include relevant keyboard/focus evidence.
- Agent and dialogs have close/focus behavior checked.
- Icon-only controls are labeled.
- Reflow and reduced-motion states are not ignored.
- Reports distinguish automated checks from screenshot-only observations.
