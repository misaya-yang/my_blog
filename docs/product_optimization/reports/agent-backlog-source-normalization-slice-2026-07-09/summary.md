# Agent Backlog Source Normalization Slice

Date: 2026-07-09
Branch: dev

## Summary

This slice canonicalizes Agent backlog source query values. New Agent backlog
draft links now use `source=agent_question`, while the editor still accepts old
`source=agent_radar` URLs and normalizes them before writing the safe scaffold
source label.

## Changed Files

- `client/src/pages/Manage.tsx`
  - Changed Agent idea draft links from `source=agent_radar` to
    `source=agent_question`.
- `client/src/pages/Editor.tsx`
  - Uses `normalizeBacklogSource()` before seeding backlog scaffold content.
- `client/src/pages/editorBacklogSource.ts`
  - Adds the tiny alias normalizer.
- `client/src/pages/editorBacklogSource.test.ts`
  - Covers canonical values, blank defaults, and legacy `agent_radar` alias.
- `docs/superpowers/plans/2026-07-09-agent-backlog-source-normalization-slice.md`
  - Tracks plan and verification.

## Privacy Boundary

This slice only changes a source label. It does not add new query fields, does
not pass feedback bodies or Agent context into URLs, and does not change editor
publish or storage behavior.

## Verification

- `corepack pnpm test -- client/src/pages/editorBacklogSource.test.ts client/src/pages/ManageAgent.test.tsx`
  - Result: passed; Vitest ran 67 files and 387 tests.
- `corepack pnpm check`
  - Result: passed.
- `corepack pnpm build`
  - Result: passed.
- `git diff --check`
  - Result: passed with no whitespace errors.
- Secret/contact scan over touched files
  - Result: no credential-like or direct-contact values found.

## Residual Risks

- There is still no dedicated Manage or Editor integration test for rendering
  the full backlog-to-editor flow; this slice covers the pure compatibility
  function and verifies the production build.
