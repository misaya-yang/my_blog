# Search Alias Shared Model Slice

Date: 2026-07-09
Status: Passed
Spec: `docs/superpowers/specs/2026-07-09-search-relevance-alias-contract-design.md`
Plan: `docs/superpowers/plans/2026-07-09-search-alias-shared-model-slice.md`

## Summary

Implemented the first approved Wave 1 code slice from the 2026-07-09 product optimization package. Search concept aliases now live in one shared module and are consumed by both server discovery search and client search recovery. Search result highlighting is also alias-aware, so excerpts can highlight related public terms even when the reader searched with a Chinese alias.

## Changed Files

- `shared/search-aliases.ts`
- `shared/search-aliases.test.ts`
- `server/discovery.ts`
- `server/discovery.test.ts`
- `client/src/pages/searchRecovery.ts`
- `client/src/pages/searchRecovery.test.ts`
- `client/src/pages/Search.tsx`
- `client/src/pages/Search.test.tsx`
- `docs/superpowers/plans/2026-07-09-search-alias-shared-model-slice.md`

## User-Visible Behavior

- Search recovery topics now come from the same shared concept model as server search aliases.
- Mixed Chinese/English queries such as `偏好优化`, `强化学习 后训练`, and `证据包 retrieval` resolve through the shared alias model.
- Search result excerpts can highlight alias-expanded matches such as `Preference optimization`, `DPO`, and `RLHF` for a `偏好优化` query.
- Existing public-only discovery filtering remains unchanged.

## Verification

```bash
corepack pnpm test -- shared/search-aliases.test.ts server/discovery.test.ts client/src/pages/searchRecovery.test.ts client/src/pages/Search.test.tsx
```

Result: passed. Vitest executed the full configured suite: 46 test files, 289 tests passed.

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

- This slice does not yet add structured `PublicSearchMatch` metadata to API results. It only unifies alias data and improves excerpt highlighting.
- Alias expansion can highlight adjacent related terms such as `loop` or `runtime` for `agent`; this is intentional for discovery, but future match metadata should distinguish exact query matches from concept matches.
- No browser screenshots were captured because this slice changes deterministic search helpers and public behavior covered by unit tests, not layout or styling.
