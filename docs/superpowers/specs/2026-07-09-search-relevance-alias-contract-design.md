# Search Relevance And Alias Contract Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

Search is a core discovery surface for the research archive. Today, concept aliasing and recovery behavior are spread across server discovery, client search recovery, and Agent prompts. This spec makes query normalization, concept aliases, result explanation, zero-result recovery, and search-miss signals behave as one system.

## Goals

- Use one source of truth for concept aliases where practical.
- Keep search result matching and client recovery suggestions semantically aligned.
- Explain why a result matched without exposing private or hidden content.
- Support Chinese, English, acronyms, and mixed technical queries.
- Preserve search miss redaction and owner signal generation.

## Non-Goals

- No external search service.
- No vector database migration.
- No hidden/draft/admin search exposure.
- No full ranking ML model.

## Current Files

- `server/discovery.ts`
- `server/routers.ts`
- `server/searchMisses.ts`
- `server/readerSignals.ts`
- `client/src/pages/Search.tsx`
- `client/src/pages/searchRecovery.ts`
- `client/src/pages/searchRecovery.test.ts`
- `client/src/lib/tracks.ts`
- `shared/content-series.ts`

## Alias Contract

Alias groups should represent concepts, not UI copy.

Examples:

- `rlhf`: RLHF, preference optimization, DPO, 偏好优化.
- `agent`: Agent loop, harness, evaluation, 工具调用.
- `rope`: RoPE, rotary embedding, 旋转位置编码.

Rules:

- Server search and client recovery should use the same concept groups or a generated derivative.
- Aliases should be case-insensitive.
- Acronyms and Chinese terms should be first-class, not afterthoughts.
- Alias changes require tests for both search and zero-result recovery.

## Result Explanation Contract

When feasible, public search results should expose safe match metadata:

```ts
type PublicSearchMatch = {
  field: "title" | "excerpt" | "tag" | "category" | "series" | "concept";
  term: string;
  aliasOf?: string;
};
```

Rules:

- Match metadata must come only from public post fields.
- Do not expose hidden/draft/admin fields.
- Do not return private Agent or feedback text.
- Highlighting should handle multiple matches and alias matches.

## Ranking Contract

First-pass deterministic ranking:

1. Exact title match.
2. Series or concept alias match.
3. Tag/category match.
4. Excerpt/body match.
5. Recency and featured rank as tie-breakers.

The ranking should remain explainable. Do not add a black-box score unless it is surfaced in debug-only owner output.

## Zero-Result Recovery

Zero-result state should:

- Show the normalized query.
- Suggest related concepts or tracks when aliases imply a topic.
- Link to relevant track or archive views.
- Record a redacted search miss.
- Avoid pretending results exist.

## Reader Signal Contract

Search misses should normalize into `search_miss` reader signals:

- Redact contact data.
- Group repeated normalized queries.
- Attach likely track when safe.
- Increase severity when count increases.
- Preserve latest timestamp.

## Implementation Slices

1. Extract shared concept alias groups.
2. Wire server discovery and client recovery to the shared groups.
3. Add safe match metadata and improved highlight behavior.
4. Expand search miss signal tests.
5. Add screenshot evidence for result, alias result, and zero-result states.

## Tests

Focused:

```bash
corepack pnpm test -- server/discovery.test.ts server/discovery.router.test.ts client/src/pages/Search.test.tsx client/src/pages/searchRecovery.test.ts server/readerSignals.test.ts
```

General:

```bash
corepack pnpm check
corepack pnpm build
```

## Acceptance Checklist

- Alias behavior is consistent between server search and client recovery.
- Mixed Chinese/English technical queries have deterministic tests.
- Search result highlighting supports alias and multiple matches.
- Zero-result search produces safe reader signals.
- Hidden/draft/admin content never appears in public search metadata.
