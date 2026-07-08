# Agent Failure Helpers Extraction Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`
Status: Passed

## Goal

Reduce `BlogAgentRoot.tsx` responsibility overload by extracting Agent failure, quota-block, timeout, abort, and no-source state mapping into a pure helper module.

## Scope

In:

- Move `getQuotaBlockedNotice`, `getClientStreamFailure`, `getAgentFailureNotice`, `getAgentFailureState`, and `getCompletedMessageState` out of `BlogAgentRoot.tsx`.
- Add focused tests for quota copy selection, timeout/abort/send failures, server error code mapping, and no-source completed state.
- Keep stream handling and message updates in `BlogAgentRoot.tsx`.
- Write a slice evidence report.

Out:

- No failure copy changes.
- No stream parser, retry policy, message state type, source card, route, auth, or server changes.
- No deploy.

## Expected Files

- `client/src/components/agent/agentFailure.ts`
- `client/src/components/agent/agentFailure.test.ts`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `docs/product_optimization/reports/agent-failure-helpers-extraction-slice-2026-07-09/summary.md`

## Validation

Focused:

```bash
corepack pnpm test -- client/src/components/agent/agentFailure.test.ts client/src/components/agent/BlogAgentRoot.test.ts
```

Static:

```bash
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- `BlogAgentRoot.tsx` no longer defines failure mapping helpers.
- Abort maps to cancelled.
- Timeout maps to timeout.
- Unknown send errors map to failed.
- No-public-source completion maps to `no_source` only when source cards are empty and refusal reason is `no_public_source`.

## Result

- Extracted failure and completion state mapping into `client/src/components/agent/agentFailure.ts`.
- Added focused pure-function tests in `client/src/components/agent/agentFailure.test.ts`.
- Reduced `BlogAgentRoot.tsx` by 50 inline failure-helper lines and removed direct abort/timeout helper imports from the root.
- Evidence report: `docs/product_optimization/reports/agent-failure-helpers-extraction-slice-2026-07-09/summary.md`.

## Verification

- `corepack pnpm test -- client/src/components/agent/agentFailure.test.ts client/src/components/agent/BlogAgentRoot.test.ts` passed: 58 files, 339 tests.
- `corepack pnpm check` passed.
- `corepack pnpm build` passed.
- `git diff --check` passed.
