# Agent Panel Extraction Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`
Status: Passed

## Goal

Reduce `BlogAgentRoot.tsx` responsibility overload by extracting the main Agent panel shell into a dedicated module without changing panel layout, input behavior, message rendering, or callback ownership.

## Scope

In:

- Move `AgentPanel`, `scopeLabel`, and the lazy `AgentMarkdown` loading boundary out of `BlogAgentRoot.tsx`.
- Keep `BlogAgentRoot.tsx` as the owner of stream state, route context, history state, context attachment state, and callbacks.
- Preserve the previous `BlogAgentRoot.tsx` export by re-exporting `AgentPanel` from the new module.
- Add focused static rendering tests for desktop role, mobile dialog role, welcome prompt state, and history-open rendering.
- Write a slice evidence report.

Out:

- No message rendering redesign.
- No stream, scroll, source, context, quota, route, auth, or server behavior changes.
- No panel prop renaming outside the new module boundary.
- No deploy.

## Expected Files

- `client/src/components/agent/AgentPanel.tsx`
- `client/src/components/agent/AgentPanel.test.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `docs/product_optimization/reports/agent-panel-extraction-slice-2026-07-09/summary.md`

## Validation

Focused:

```bash
corepack pnpm test -- client/src/components/agent/AgentPanel.test.tsx client/src/components/agent/BlogAgentRoot.test.ts
```

Static:

```bash
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- `BlogAgentRoot.tsx` no longer defines `AgentPanel`.
- Desktop panel still uses `role="complementary"`.
- Mobile panel still uses modal dialog semantics.
- Empty conversation still renders welcome title, body, and suggested prompts.
- History-open state still renders the extracted history panel.

## Result

- Extracted the main panel shell into `client/src/components/agent/AgentPanel.tsx`.
- Preserved the previous `BlogAgentRoot.tsx` export by re-exporting `AgentPanel` from the new module.
- Added focused static rendering tests in `client/src/components/agent/AgentPanel.test.tsx`.
- Reduced `BlogAgentRoot.tsx` from 1240 lines to 747 lines in this slice.
- Evidence report: `docs/product_optimization/reports/agent-panel-extraction-slice-2026-07-09/summary.md`.

## Verification

- `corepack pnpm test -- client/src/components/agent/AgentPanel.test.tsx client/src/components/agent/BlogAgentRoot.test.ts` passed: 59 files, 342 tests.
- `corepack pnpm test` passed: 59 files, 342 tests.
- `corepack pnpm check` passed.
- `corepack pnpm build` passed.
- `git diff --check` passed.
