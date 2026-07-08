# Agent Context Surfaces Extraction Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`
Status: Passed

## Goal

Reduce `BlogAgentRoot.tsx` responsibility overload by extracting the Agent conversation context dock and trust boundary into a dedicated component module without changing context attachment behavior or trust copy.

## Scope

In:

- Move `AgentContextDock` and `AgentTrustBoundary` out of `BlogAgentRoot.tsx`.
- Keep `BlogAgentRoot.tsx` as the state, file-pick, and attach-action owner.
- Pass the already formatted scope label into the trust boundary.
- Add focused tests for collapsed context state, open context controls, active attached context state, and trust details.
- Write a slice evidence report.

Out:

- No context persistence, quota, upload parsing, or file input changes.
- No redesign of toolbar density yet.
- No route, stream, retrieval, auth, or server changes.
- No deploy.

## Expected Files

- `client/src/components/agent/AgentContextSurfaces.tsx`
- `client/src/components/agent/AgentContextSurfaces.test.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `docs/product_optimization/reports/agent-context-surfaces-extraction-slice-2026-07-09/summary.md`

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

## Acceptance

- `BlogAgentRoot.tsx` no longer defines `AgentContextDock` or `AgentTrustBoundary`.
- Collapsed context dock still shows the title and count.
- Open context dock still renders supported copy, textarea, file action, attach action, and lifecycle/limit hint.
- Attached context still marks trust boundary as expanded and attached.
- No context state, attach action, or file-pick ownership moves out of the root.

## Result

- Extracted context dock and trust boundary into `client/src/components/agent/AgentContextSurfaces.tsx`.
- Added focused rendering tests in `client/src/components/agent/AgentContextSurfaces.test.tsx`.
- Reduced `BlogAgentRoot.tsx` by 137 inline context/trust lines while keeping state, attach, and file-pick ownership in the root.
- Evidence report: `docs/product_optimization/reports/agent-context-surfaces-extraction-slice-2026-07-09/summary.md`.

## Verification

- `corepack pnpm test -- client/src/components/agent/AgentContextSurfaces.test.tsx client/src/components/agent/BlogAgentRoot.test.ts` passed: 53 files, 323 tests.
- `corepack pnpm check` passed.
- `corepack pnpm build` passed.
- `git diff --check` passed.
