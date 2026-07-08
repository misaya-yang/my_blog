# Agent Recovery Surfaces Extraction Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`
Status: Passed

## Goal

Reduce `BlogAgentRoot.tsx` responsibility overload by extracting Agent notice, bootstrap unavailable, and message recovery UI into a dedicated component module without changing recovery behavior.

## Scope

In:

- Move `AgentNotice`, `AgentBootstrapUnavailable`, `AgentMessageRecovery`, and `getRecoveryMessageKey` out of `BlogAgentRoot.tsx`.
- Keep retry and visitor continuation callbacks owned by `BlogAgentRoot.tsx`.
- Add focused tests for warning/error notice, bootstrap retry state, retry recovery, anonymous quota visitor recovery, and no-state null rendering.
- Write a slice evidence report.

Out:

- No stream, quota, failure-state, retry-policy, auth, route, retrieval, or server changes.
- No copy changes.
- No deploy.

## Expected Files

- `client/src/components/agent/AgentRecoverySurfaces.tsx`
- `client/src/components/agent/AgentRecoverySurfaces.test.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `docs/product_optimization/reports/agent-recovery-surfaces-extraction-slice-2026-07-09/summary.md`

## Validation

Focused:

```bash
corepack pnpm test -- client/src/components/agent/AgentRecoverySurfaces.test.tsx client/src/components/agent/BlogAgentRoot.test.ts
```

Static:

```bash
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- `BlogAgentRoot.tsx` no longer defines notice, bootstrap unavailable, or message recovery UI.
- Retry recovery remains available for cancelled, failed, and timeout states with a recovery prompt.
- Anonymous quota-blocked recovery still offers visitor continuation.
- No-state messages render no recovery surface.

## Result

- Extracted notice, bootstrap unavailable, and message recovery UI into `client/src/components/agent/AgentRecoverySurfaces.tsx`.
- Added focused rendering and state-key tests in `client/src/components/agent/AgentRecoverySurfaces.test.tsx`.
- Reduced `BlogAgentRoot.tsx` by 134 inline recovery lines while keeping retry and visitor continuation callbacks in the root.
- Evidence report: `docs/product_optimization/reports/agent-recovery-surfaces-extraction-slice-2026-07-09/summary.md`.

## Verification

- `corepack pnpm test -- client/src/components/agent/AgentRecoverySurfaces.test.tsx client/src/components/agent/BlogAgentRoot.test.ts` passed: 54 files, 329 tests.
- `corepack pnpm check` passed.
- `corepack pnpm build` passed.
- `git diff --check` passed.
