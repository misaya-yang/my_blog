# Agent Floating Frame Extraction Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`
Status: Passed

## Goal

Reduce `BlogAgentRoot.tsx` responsibility overload by extracting the desktop/mobile Agent floating frame container into a dedicated module without changing drag, resize, preset, or persistence behavior.

## Scope

In:

- Move `AgentFloatingFrame` and `AgentFrameControls` out of `BlogAgentRoot.tsx`.
- Keep frame state helpers in `agentFrameState.ts`.
- Preserve mobile sheet wrapper and desktop fixed frame behavior.
- Add focused render-contract tests for mobile and desktop frame controls.
- Write a slice evidence report.

Out:

- No frame state math changes.
- No drag/resize algorithm changes.
- No panel header controls redesign.
- No stream, source, context, quota, route, auth, or server changes.
- No deploy.

## Expected Files

- `client/src/components/agent/AgentFloatingFrame.tsx`
- `client/src/components/agent/AgentFloatingFrame.test.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `docs/product_optimization/reports/agent-floating-frame-extraction-slice-2026-07-09/summary.md`

## Validation

Focused:

```bash
corepack pnpm test -- client/src/components/agent/AgentFloatingFrame.test.tsx client/src/components/agent/BlogAgentRoot.test.ts
```

Static:

```bash
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- `BlogAgentRoot.tsx` no longer defines `AgentFloatingFrame` or `AgentFrameControls`.
- Mobile frame passes non-floating controls and no resize handle.
- Desktop frame passes floating controls, active preset, drag props, and resize handle.
- Storage key, presets, clamp behavior, drag, resize, and reset algorithms are unchanged.

## Result

- Extracted `AgentFloatingFrame` and `AgentFrameControls` into `client/src/components/agent/AgentFloatingFrame.tsx`.
- Preserved the previous `BlogAgentRoot.tsx` export for `AgentFloatingFrame` by re-exporting the new module.
- Added focused render-contract tests in `client/src/components/agent/AgentFloatingFrame.test.tsx`.
- Reduced `BlogAgentRoot.tsx` by 187 inline frame-container lines.
- Evidence report: `docs/product_optimization/reports/agent-floating-frame-extraction-slice-2026-07-09/summary.md`.

## Verification

- `corepack pnpm test -- client/src/components/agent/AgentFloatingFrame.test.tsx client/src/components/agent/BlogAgentRoot.test.ts` passed: 56 files, 333 tests.
- `corepack pnpm check` passed.
- `corepack pnpm build` passed.
- `git diff --check` passed.
