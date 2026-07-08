# Manage Agent Index Panel Extraction Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-08-engineering-release-gates-design.md`
Status: Passed

## Goal

Reduce `ManageAgent.tsx` responsibility density by moving the Agent knowledge index status panel into a focused component without changing owner UI behavior.

## Scope

In:

- Extract `AgentIndexStatusPanel` into `client/src/pages/manage-agent/AgentIndexStatusPanel.tsx`.
- Move the `IndexStatus` type and local date formatting with the extracted component.
- Keep `ManageAgent.tsx` responsible for page tabs, queries, and routing.
- Keep the existing release-blocker UI and static render tests.
- Write a slice evidence report.

Out:

- No owner route, query, server, reindex, publish, auth, or UI behavior changes.
- No broad ManageAgent refactor.

## Expected Files

- `client/src/pages/ManageAgent.tsx`
- `client/src/pages/ManageAgent.test.tsx`
- `client/src/pages/manage-agent/AgentIndexStatusPanel.tsx`
- `docs/product_optimization/reports/manage-agent-index-panel-extraction-slice-2026-07-09/summary.md`

## Validation

```bash
corepack pnpm test -- client/src/pages/ManageAgent.test.tsx
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- `ManageAgent.tsx` imports the extracted index panel.
- The stale and fresh index render tests continue to pass.
- No public or server contract changes are introduced.
