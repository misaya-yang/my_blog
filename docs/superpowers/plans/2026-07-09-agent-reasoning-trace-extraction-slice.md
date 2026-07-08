# Agent Reasoning Trace Extraction Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`
Status: Passed

## Goal

Reduce `BlogAgentRoot.tsx` responsibility overload by extracting the reasoning trace UI into a dedicated `AgentReasoningTrace` component without changing streaming, scroll, source, or persistence behavior.

## Scope

In:

- Move the trace details component and its local formatting helpers out of `BlogAgentRoot.tsx`.
- Keep elapsed-time semantics unchanged through the existing `agentElapsed.ts` helpers.
- Add focused component-level render tests for streaming, final elapsed, source-count stage, and non-assistant messages.
- Write a slice evidence report.

Out:

- No visual redesign.
- No stream protocol, tRPC, DB, quota, prompt, or provider change.
- No source-card extraction in this slice.
- No deploy.

## Expected Files

- `client/src/components/agent/AgentReasoningTrace.tsx`
- `client/src/components/agent/AgentReasoningTrace.test.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `docs/product_optimization/reports/agent-reasoning-trace-extraction-slice-2026-07-09/summary.md`

## Validation

Focused:

```bash
corepack pnpm test -- client/src/components/agent/AgentReasoningTrace.test.tsx client/src/components/agent/BlogAgentRoot.test.ts
```

Static:

```bash
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- `BlogAgentRoot.tsx` no longer defines `AgentReasoningTrace`.
- Trace UI still renders streaming state open with spinner.
- Final elapsed display still prefers `finalElapsedMs`.
- Source trace stage still includes source count.
- User-role messages render no trace.
