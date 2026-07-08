# Agent Source Summary Slice Report

Date: 2026-07-09

## What Changed

- Added `agentSourceSummary.ts` as the owner for source-summary pure rules.
- Moved collapsed source limit and visible-source selection out of `BlogAgentRoot.tsx`.
- Added `getHiddenSourceCount` for the `+N` collapsed chip.
- Added `getSourcePreviewTitle` for section / heading / article / fallback title selection.
- Updated source card tests to import summary rules from their owning module.

## Behavior Preserved

- Collapsed sources still show the first two chips.
- Expanded sources still show all rows.
- Hidden count still reflects sources beyond the collapsed preview.
- Source link handling, current-page badges, and source scrolling are unchanged.

## Files Changed

- `client/src/components/agent/agentSourceSummary.ts`
- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/components/agent/sourceCards.test.ts`
- `docs/superpowers/plans/2026-07-09-agent-source-summary-slice.md`

## Verification

Completed:

```bash
corepack pnpm test -- client/src/components/agent/sourceCards.test.ts client/src/components/agent/BlogAgentRoot.test.ts
corepack pnpm check
corepack pnpm content:audit
corepack pnpm build
corepack pnpm audit:ui
```

Notes:

- The focused test command ran the full current Vitest suite: 45 files, 279 tests passed.
- `content:audit` passed with 0 failures, 0 warnings, and 1 existing non-blocking suggestion in `gated_ffn_blog.md:353`.
- `audit:ui` passed after starting the local dev server.
- This slice is behavior-preserving and has no intended visual change; no screenshots were captured.
