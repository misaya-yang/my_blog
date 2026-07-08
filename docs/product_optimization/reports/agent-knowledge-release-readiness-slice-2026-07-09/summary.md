# Agent Knowledge Release Readiness Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice makes the current Agent knowledge freshness blocker visible in the owner UI. `/manage/agent` already exposed stale slugs and CLI commands; it now explicitly labels stale Agent knowledge as a release blocker and shows the safe remediation order:

```bash
pnpm ai:reindex
pnpm content:verify
```

No reindex, publish, deploy, schema, API, retrieval, or model behavior changed.

## Files

- `client/src/pages/ManageAgent.tsx`
- `client/src/pages/ManageAgent.test.tsx`
- `client/src/i18n/agentOps.ts`

## Code Review Notes

- `IndexStatusPanel` is exported for focused static render testing.
- The fresh state treats `latestReindexError` as blocking, not only stale/extra slugs.
- The owner-facing copy avoids implying automatic repair; it says reindex remains an explicit local operation.
- Bilingual strings were added for the new release-ready and release-blocked states.

## Verification

```bash
corepack pnpm test -- client/src/pages/ManageAgent.test.tsx
```

Passed: 61 test files, 349 tests.

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

This is visibility and guidance only. The actual blocker remains until `pnpm ai:reindex` and `pnpm content:verify` pass.
