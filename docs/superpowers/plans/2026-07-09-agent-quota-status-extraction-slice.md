# Agent Quota Status Extraction Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`
Status: Passed

## Goal

Reduce `BlogAgentRoot.tsx` responsibility overload by extracting Agent quota badge, quota callout, and quota callout policy into a dedicated component module without changing quota behavior or copy.

## Scope

In:

- Move `AgentQuotaBadge`, `AgentQuotaCallout`, and `shouldShowQuotaCallout` out of `BlogAgentRoot.tsx`.
- Reuse the existing `QuotaInfo` type.
- Add focused tests for normal remaining quota, low quota, admin callout, and non-callout quota states.
- Write a slice evidence report.

Out:

- No quota limits or tier semantics changes.
- No stream, bootstrap, reservation, auth, tRPC, or server changes.
- No visual redesign of the Agent toolbar.
- No deploy.

## Expected Files

- `client/src/components/agent/AgentQuotaStatus.tsx`
- `client/src/components/agent/AgentQuotaStatus.test.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `docs/product_optimization/reports/agent-quota-status-extraction-slice-2026-07-09/summary.md`

## Validation

Focused:

```bash
corepack pnpm test -- client/src/components/agent/AgentQuotaStatus.test.tsx client/src/components/agent/BlogAgentRoot.test.ts
```

Static:

```bash
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- `BlogAgentRoot.tsx` no longer defines quota badge, callout, or callout policy helpers.
- Remaining quota uses `agent.quota.remaining`.
- Low quota uses `agent.quota.low`.
- Admin quota still shows the admin detail callout.
- Regular non-low visitor quota does not show a callout.

## Result

- Extracted quota badge, quota callout, and callout policy into `client/src/components/agent/AgentQuotaStatus.tsx`.
- Added focused rendering and policy tests in `client/src/components/agent/AgentQuotaStatus.test.tsx`.
- Reduced `BlogAgentRoot.tsx` by 42 inline quota lines while keeping the same toolbar behavior.
- Evidence report: `docs/product_optimization/reports/agent-quota-status-extraction-slice-2026-07-09/summary.md`.

## Verification

- `corepack pnpm test -- client/src/components/agent/AgentQuotaStatus.test.tsx client/src/components/agent/BlogAgentRoot.test.ts` passed: 52 files, 319 tests.
- `corepack pnpm check` passed.
- `corepack pnpm build` passed.
- `git diff --check` passed.
