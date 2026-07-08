# Agent Answer Layout Audit Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice adds browser-level evidence for the Agent reading companion's completed-answer layout. The audit uses a deterministic DOM fixture inside the real production Agent panel so it can verify layout constraints without requiring provider credentials or a live model stream.

The fixture simulates:

- a long Chinese answer with English technical terms and one very long no-space token,
- a collapsed 5-source summary,
- two visible source title chips and a compact hidden-count chip,
- the real panel scroller and composer surfaces.

## Files

- `scripts/audit/ui-layout.ts`
- `docs/product_optimization/reports/ui-layout-checks-latest.json`

## Code Review Notes

- The change is additive to the existing `audit:ui` gate.
- No runtime component, route, API, DB, auth, retrieval, stream, quota, or model-provider behavior changed.
- The fixture validates CSS and DOM layout ownership for the previously reported issue: sources should not push the reader away from the answer after final response completion.
- The fixture is intentionally not a content-quality or retrieval-quality test.

## Verification

```bash
corepack pnpm check
```

Passed.

```bash
corepack pnpm test
```

Passed: 59 test files, 342 tests.

```bash
corepack pnpm build
```

Passed.

```bash
git diff --check
```

Passed.

```bash
PORT=3000 NODE_ENV=production node dist/index.js
corepack pnpm audit:ui
```

Passed. The generated `ui-layout-checks-latest.json` contains mobile and desktop `#agent-answer-fixture` results with all fixture checks true.

## Remaining Risk

The audit injects a deterministic completed-answer fixture. It does not exercise a real provider stream, but it covers the layout state that matters after the stream has completed.
