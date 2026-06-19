# MNP-05 Code Simplification And CSS Architecture Plan

**Date:** 2026-06-20

## Scope

Complete a small, verifiable simplification slice for MNP-F006 without changing public behavior:

- Collapse duplicated public theme token declarations in `client/src/styles/owner-tools.css` where `.space-page` repeats the same values already defined on `:root` and `.dark`.
- Extract Agent source-card link, anchor, fallback, and excerpt formatting helpers out of `client/src/components/agent/BlogAgentRoot.tsx` into a pure module while preserving the existing exports used by tests.
- Record the code facts, validation, and remaining architecture constraints back into the harness.

## Guardrails

- Preserve MNP-02 reading contracts: heading anchors, reading-time handling, markdown title stripping, and reader light/dark readability.
- Preserve MNP-03 Agent contracts: explicit `anchorId` wins, heading anchors are encoded in URLs, and numeric chunk fallback remains available.
- Preserve MNP-04 copy/content contracts and avoid content publishing changes unless validation requires it.
- Do not mutate production data or touch secrets.

## Validation

- Focused: `pnpm vitest run client/src/components/agent/sourceCards.test.ts client/src/components/agent/BlogAgentRoot.test.ts`
- Required repo gates: `pnpm check`, `pnpm test`, `pnpm build`
- Runtime/browser smoke for CSS-affecting public surfaces if the build passes.
