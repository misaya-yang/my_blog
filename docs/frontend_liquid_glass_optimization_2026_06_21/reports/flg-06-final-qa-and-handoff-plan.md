# FLG-06 Final QA And Handoff Plan

**Date:** 2026-06-21

**Feature:** FLG-F007

## Scope

Close the sitewide Liquid Glass redesign with objective evidence. Preserve routes, APIs, auth, analytics, schema, SEO, content, deployment state, and all user/prior-agent worktree changes.

## Plan

1. Run the full command suite:
   - `pnpm check`
   - `pnpm test`
   - `pnpm build`
   - `AUDIT_BASE_URL=http://localhost:3001 pnpm audit:ui`
   - `AUDIT_BASE_URL=http://localhost:3001 pnpm audit:baseline:quick`
2. Capture the full route matrix:
   - Routes: `/`, `/algorithms`, `/applications`, `/archive`, `/search?q=zzzz-no-hit-ui-audit`, `/tags/agent-systems`, `/categories/ai-applications`, `/about`, `/post/goal-harness-agent-phase-protocol`, `/login`, `/404`, `/manage`, `/manage/agent`, `/write`.
   - Viewports: `390x844`, `768x1024`, `1440x1000`, `1728x1117`.
3. Capture required extra states:
   - Agent launcher open state.
   - Light mode.
   - Reduced motion.
   - Reduced transparency.
   - Solid-surface fallback using `data-solid-surfaces="true"`.
4. Measure and reject regressions:
   - No horizontal overflow.
   - Header height at or below 72px on non-editor routes.
   - Focus-visible outline is present.
   - Solid fallback and reduced transparency remove sampled blur.
   - Screenshots contain meaningful text and do not show blank delayed content.
5. Record final closure:
   - Write FLG-06 report.
   - Update FLG-F007 evidence.
   - Append final progress.
   - Update source packet, continuity ledger, handoff, loop state, and next-window prompt.

## Boundary Notes

- Owner and editor screenshots may use local Playwright tRPC fixtures because no admin session is available; this remains frontend-only visual evidence and does not mutate data.
- If final QA finds a blocking frontend defect, fix it only inside FLG-06 allowed frontend/style paths and rerun the failing evidence.
