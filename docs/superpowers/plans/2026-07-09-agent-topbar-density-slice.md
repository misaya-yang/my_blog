# Agent Topbar Density Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`
Status: Passed

## Goal

Reduce Agent topbar and conversation-context vertical footprint so the answer area gets priority after a question is asked.

## Scope

In:

- Keep trust boundary details collapsed by default, including when private context is attached.
- Surface attached context in the trust summary line using the existing localized context count.
- Add stable class hooks for topbar, scope pill, context dock, context toggle, and context editor.
- Tighten Agent final-layer CSS for topbar, trust boundary, quota badge, history button, and context dock density.
- Update focused tests for the new attached-context summary behavior.
- Write a slice evidence report.

Out:

- No streaming, scroll policy, source cards, quota calculation, context persistence, upload, retrieval, auth, route, or server changes.
- No new visual palette or typography system changes.
- No deploy.

## Expected Files

- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/components/agent/AgentContextSurfaces.tsx`
- `client/src/components/agent/AgentContextSurfaces.test.tsx`
- `client/src/styles/agent-surfaces.css`
- `docs/product_optimization/reports/agent-topbar-density-slice-2026-07-09/summary.md`

## Validation

Focused:

```bash
corepack pnpm test -- client/src/components/agent/AgentContextSurfaces.test.tsx client/src/components/agent/BlogAgentRoot.test.ts
```

Static:

```bash
corepack pnpm check
corepack pnpm build
git diff --check
```

UI:

```bash
corepack pnpm audit:ui
```

## Acceptance

- Attached context no longer opens trust detail by default.
- Attached context count is visible in the trust summary line.
- Topbar controls have tighter min-height and padding in the Agent final style layer.
- Context dock closed state uses a smaller vertical footprint.
- Tests and build pass.

## Result

- Added stable class hooks for Agent topbar, scope pill, context dock, context toggle, and context editor.
- Changed `AgentTrustBoundary` so attached context is visible in the summary line but details stay collapsed by default.
- Tightened final Agent CSS spacing for topbar controls, trust boundary, history button, quota badge, and context dock.
- Updated focused tests for attached context summary and collapsed default details.
- Evidence report: `docs/product_optimization/reports/agent-topbar-density-slice-2026-07-09/summary.md`.

## Verification

- `corepack pnpm test -- client/src/components/agent/AgentContextSurfaces.test.tsx client/src/components/agent/BlogAgentRoot.test.ts` passed: 53 files, 323 tests.
- `corepack pnpm check` passed.
- `corepack pnpm build` passed.
- `git diff --check` passed.
- `corepack pnpm audit:ui` passed after starting the production build on `http://localhost:3000`.
