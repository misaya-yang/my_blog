# Agent Launcher Extraction Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`
Status: Passed

## Goal

Reduce `BlogAgentRoot.tsx` responsibility overload by extracting the Agent launcher button into a dedicated module without changing launcher accessibility or low-quota signaling.

## Scope

In:

- Move `AgentLauncher` out of `BlogAgentRoot.tsx`.
- Preserve the previous `BlogAgentRoot.tsx` export by re-exporting the new module.
- Add focused tests for open/closed icon state, ARIA attributes, label, tooltip, and low-quota dot.
- Write a slice evidence report.

Out:

- No open/close state changes.
- No launcher positioning or visual redesign.
- No quota, stream, route, auth, or server changes.
- No deploy.

## Expected Files

- `client/src/components/agent/AgentLauncher.tsx`
- `client/src/components/agent/AgentLauncher.test.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `docs/product_optimization/reports/agent-launcher-extraction-slice-2026-07-09/summary.md`

## Validation

Focused:

```bash
corepack pnpm test -- client/src/components/agent/AgentLauncher.test.tsx client/src/components/agent/BlogAgentRoot.test.ts
```

Static:

```bash
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- `BlogAgentRoot.tsx` no longer defines `AgentLauncher`.
- Launcher ARIA attributes remain intact.
- Closed state renders the book icon; open state renders the close icon.
- Low-quota dot remains rendered when `lowQuota` is true.

## Result

- Extracted launcher button into `client/src/components/agent/AgentLauncher.tsx`.
- Preserved the previous `BlogAgentRoot.tsx` export by re-exporting the new module.
- Added focused static rendering tests in `client/src/components/agent/AgentLauncher.test.tsx`.
- Reduced `BlogAgentRoot.tsx` by 42 inline launcher lines.
- Evidence report: `docs/product_optimization/reports/agent-launcher-extraction-slice-2026-07-09/summary.md`.

## Verification

- `corepack pnpm test -- client/src/components/agent/AgentLauncher.test.tsx client/src/components/agent/BlogAgentRoot.test.ts` passed: 57 files, 335 tests.
- `corepack pnpm check` passed.
- `corepack pnpm build` passed.
- `git diff --check` passed.
