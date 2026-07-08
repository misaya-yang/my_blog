# Agent Related Questions Extraction Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice extracted related question chips out of `BlogAgentRoot.tsx` into `AgentRelatedQuestions.tsx`.

The change is intentionally behavior-preserving:

- Related question title copy is unchanged.
- Only the first three related questions render.
- Disabled state still reaches every rendered button.
- Prompt click ownership remains in `BlogAgentRoot.tsx`.

## Files

- `client/src/components/agent/AgentRelatedQuestions.tsx`
- `client/src/components/agent/AgentRelatedQuestions.test.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`

## Verification

```bash
corepack pnpm test -- client/src/components/agent/AgentRelatedQuestions.test.tsx client/src/components/agent/BlogAgentRoot.test.ts
```

Passed: 55 test files, 331 tests.

```bash
corepack pnpm check
```

Passed.

```bash
corepack pnpm build
```

Passed.

```bash
git diff --check
```

Passed.

## Remaining Risk

This is a structural extraction slice. It does not change related-question generation quality or ranking.
