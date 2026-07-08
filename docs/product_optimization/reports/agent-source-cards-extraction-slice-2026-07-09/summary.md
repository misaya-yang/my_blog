# Agent Source Cards Extraction Slice

Date: 2026-07-09
Status: Passed
Spec: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`
Plan: `docs/superpowers/plans/2026-07-09-agent-source-cards-extraction-slice.md`

## Summary

Extracted the Agent source summary/cards UI from `BlogAgentRoot.tsx` into `AgentSourceCards.tsx` without changing retrieval, citation, stream, source ranking, or persistence behavior. The extracted component owns collapsed source chips, expanded source rows, source detail disclosure, current-page badges, and same-page source link interception.

## Changed Files

- `client/src/components/agent/AgentSourceCards.tsx`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/components/agent/sourceCards.test.ts`
- `docs/superpowers/plans/2026-07-09-agent-source-cards-extraction-slice.md`

## User-Visible Behavior

- No intended visual or behavior change.
- Sources remain collapsed by default.
- Expanded sources still render row-style cards with details behind nested disclosure.
- Same-page source links still scroll to the matching article heading instead of navigating away.
- Source-card helpers now have focused tests for section labels, current-path detection, and scroll-vs-navigate action.

## Verification

```bash
corepack pnpm test -- client/src/components/agent/sourceCards.test.ts client/src/components/agent/BlogAgentRoot.test.ts
```

Result: passed. Vitest executed the full configured suite: 50 test files, 312 tests passed.

```bash
corepack pnpm check
```

Result: passed.

```bash
corepack pnpm build
```

Result: passed.

```bash
git diff --check
```

Result: passed.

## Known Risks

- This slice is an extraction only. It does not further redesign source cards, change max-height behavior, or add browser screenshot evidence.
- `BlogAgentRoot.tsx` still owns launcher, frame, panel, composer, context dock, history panel, quota, and recovery UI. Those remain candidates for follow-up extraction.
