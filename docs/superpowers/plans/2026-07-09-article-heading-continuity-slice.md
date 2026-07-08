# Article Heading Continuity Slice

Date: 2026-07-09
Status: Completed
Spec source: `docs/superpowers/specs/2026-07-09-reading-continuity-route-state-design.md`
Gate source: `docs/superpowers/specs/2026-07-09-performance-accessibility-i18n-gates-design.md`

## Goal

Make article heading deep links safer and less disruptive by validating hash targets before scroll and respecting `prefers-reduced-motion` for TOC/hash navigation.

## Scope

In:

- Add pure helpers for article hash decoding, target validation, and scroll behavior selection.
- Use the helpers in `PostDetail.tsx` hash and TOC scroll paths.
- Add focused unit tests.
- Run local checks and write an evidence report.

Out:

- No route additions or removals.
- No API, DB, auth, Agent, content, or styling contract changes.
- No new dependency.
- No deployment.

## Tasks

- [x] Add helper tests for valid hash targets, unknown anchors, malformed hashes, and reduced-motion behavior.
- [x] Implement helper functions in `PostDetail.tsx`.
- [x] Wire hash scroll and TOC click scroll through the helpers.
- [x] Run focused tests.
- [x] Run `corepack pnpm check`.
- [x] Run `corepack pnpm build`.
- [x] Run `git diff --check`.
- [x] Write the slice report.
- [x] Commit with `feat: improve article heading continuity`.

## Verification Commands

```bash
corepack pnpm test -- client/src/pages/PostDetail.test.ts client/src/components/MarkdownRenderer.test.tsx
corepack pnpm check
corepack pnpm build
git diff --check
```

## Risk Notes

- Browser history hash behavior stays the same for explicit TOC clicks.
- Missing or malformed hashes now no-op rather than attempting a scroll.
- Reduced-motion users receive instant heading jumps instead of smooth animation.
