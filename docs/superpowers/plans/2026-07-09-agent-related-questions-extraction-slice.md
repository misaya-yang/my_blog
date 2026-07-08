# Agent Related Questions Extraction Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`
Status: Passed

## Goal

Reduce `BlogAgentRoot.tsx` responsibility overload by extracting related question chips into a dedicated component module without changing prompt behavior.

## Scope

In:

- Move `AgentRelatedQuestions` out of `BlogAgentRoot.tsx`.
- Preserve the existing three-question display limit.
- Add focused tests for title rendering, three-question limit, and disabled chip state.
- Write a slice evidence report.

Out:

- No related-question generation changes.
- No answer mode, stream, retrieval, source, route, auth, or server changes.
- No visual redesign.
- No deploy.

## Expected Files

- `client/src/components/agent/AgentRelatedQuestions.tsx`
- `client/src/components/agent/AgentRelatedQuestions.test.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `docs/product_optimization/reports/agent-related-questions-extraction-slice-2026-07-09/summary.md`

## Validation

Focused:

```bash
corepack pnpm test -- client/src/components/agent/AgentRelatedQuestions.test.tsx client/src/components/agent/BlogAgentRoot.test.ts
```

Static:

```bash
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- `BlogAgentRoot.tsx` no longer defines `AgentRelatedQuestions`.
- Only the first three related questions render.
- Disabled state still reaches each related question button.

## Result

- Extracted related question chips into `client/src/components/agent/AgentRelatedQuestions.tsx`.
- Added focused rendering tests in `client/src/components/agent/AgentRelatedQuestions.test.tsx`.
- Reduced `BlogAgentRoot.tsx` by 33 inline related-question lines.
- Evidence report: `docs/product_optimization/reports/agent-related-questions-extraction-slice-2026-07-09/summary.md`.

## Verification

- `corepack pnpm test -- client/src/components/agent/AgentRelatedQuestions.test.tsx client/src/components/agent/BlogAgentRoot.test.ts` passed: 55 files, 331 tests.
- `corepack pnpm check` passed.
- `corepack pnpm build` passed.
- `git diff --check` passed.
