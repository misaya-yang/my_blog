# AI Reindex Dry Run Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice adds a safe preview mode:

```bash
corepack pnpm ai:reindex --dry-run
```

The dry run reads the current Agent knowledge index status and prints stale/extra indexed slugs without deleting or inserting `ai_knowledge_chunks`.

Normal `pnpm ai:reindex` remains unchanged and still performs the actual transactional rebuild.

## Files

- `scripts/ai/reindex-knowledge.ts`
- `scripts/ai/reindex-knowledge.test.ts`

## Code Review Notes

- Argument parsing is explicit; unknown args fail.
- Status formatting is tested separately from database access.
- Dry-run mode calls `getKnowledgeIndexStatus`, not `reindexPublicKnowledgeChunks`.
- This does not resolve the current release blocker; it makes the next mutating action safer to inspect.

## Verification

```bash
corepack pnpm test -- scripts/ai/reindex-knowledge.test.ts
```

Passed: 62 test files, 352 tests.

```bash
corepack pnpm check
```

Passed.

```bash
corepack pnpm ai:reindex --dry-run
```

Passed and printed:

```text
AI knowledge reindex dry run: no database writes performed
AI knowledge status: 8/8 public posts indexed, 1 hidden/draft excluded
AI knowledge attention: stale=[flow-matching-generative-transport, isohc-fixed-vector-isometric-residual-mixing], extra=[]
```

```bash
corepack pnpm build
```

Passed.

```bash
git diff --check
```

Passed.

## Remaining Risk

The real index remains stale until the owner explicitly runs `pnpm ai:reindex` and then `pnpm content:verify`.
