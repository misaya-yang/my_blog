# Agent Reading Companion Implementation

Date: 2026-06-28

## What Changed

- Final answer timing now uses the stream final `elapsedMs`; persisted assistant messages keep `sourceJson.latencyMs` for history restore without a DB migration.
- The message scroller no longer jumps to the bottom on every message update. New questions focus the assistant answer start, streaming follows only when the reader is already near the bottom, and final source cards do not pull the viewport down.
- Source cards default to a one-line summary with count, two title chips, and a `View sources` action. Expanded sources use an internal scroll list and put excerpts/match reasons behind per-source details.
- The desktop assistant is now a movable and resizable floating frame with compact, comfortable, and wide presets. State is local-only at `misaya:blog-agent-frame:v1`; mobile remains a bottom sheet.
- Scope, quota, history, and trust copy were compressed into the top toolbar. Mobile hides the redundant article-context chip and uses an icon-only history button.
- Agent visual ownership moved to `agent-surfaces.css`, loaded after `liquid-materials.css`. The old Agent-wide `!important` block was removed from `liquid-materials.css`.

## Evidence

- Desktop light screenshot: `docs/product_optimization/reports/agent-reading-companion-desktop-light.png`
- Mobile dark screenshot: `docs/product_optimization/reports/agent-reading-companion-mobile-dark.png`
- Agent fixture check JSON: `docs/product_optimization/reports/agent-reading-companion-checks-latest.json`
- General UI audit JSON: `docs/product_optimization/reports/ui-layout-checks-latest.json`

## Verification

- `CI=true corepack pnpm exec vitest run client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/sourceCards.test.ts server/ai/harness.test.ts server/ai/streamRoute.test.ts`
- `CI=true corepack pnpm check`
- `CI=true corepack pnpm test`
- `CI=true corepack pnpm build`
- `CI=true corepack pnpm audit:ui`
- `AUDIT_BASE_URL=http://localhost:3000 CI=true corepack pnpm audit:baseline:quick`
- Playwright local SSE fixture at `/post/goal-harness-agent-phase-protocol` checked desktop light and mobile dark: sources collapsed by default, no panel/page horizontal overflow, answer and composer visible after final, desktop drag and resize persisted.

## Release Review

- UI walk-through after simplification: desktop light and mobile dark screenshots show the answer first, source cards collapsed, composer reachable, and no visible horizontal overflow.
- Top toolbar was simplified again during review by removing the redundant article-context chip. The toolbar now stays at 75px in both checked desktop and mobile states.
- Code review found one readability issue in the frame preset label rendering; it was replaced with a small helper instead of nested ternaries.
- No schema, migration, seed, retrieval, auth, quota, route, or deployment-contract changes were introduced.
