# Agent Completion Readability Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice hardens the completed-answer state of the public Blog Agent. It keeps the answer body visually primary, makes follow-ups behave like reading tasks, and extends browser evidence for collapsed and expanded source layouts.

## Changes

- Added `agentFollowUpTasks.ts` to trim, dedupe, and cap follow-up tasks at three visible actions.
- Changed follow-up UI copy from generic related questions to `Continue reading` / `继续阅读`.
- Changed completed follow-ups from wrapped chips to compact task buttons. Desktop uses a two-column task grid; mobile stays one column.
- Gave assistant answers the available row width while keeping user messages narrower.
- Added `aria-controls` between the source toggle and expanded source list.
- Tightened source detail and follow-up overflow rules with semantic Agent CSS classes.
- Added server-side guidance and fallback normalization so omitted `relatedQuestions` become localized reading-task prompts.
- Extended `audit:ui` completed-answer fixture to verify collapsed sources, bounded expanded sources, no horizontal overflow, visible answer start, and reachable composer.

## Evidence

- Light mode screenshot: `docs/product_optimization/reports/agent-completion-readability-slice-2026-07-09/agent-completion-desktop-light.png`
- Dark mode screenshot: `docs/product_optimization/reports/agent-completion-readability-slice-2026-07-09/agent-completion-desktop-dark.png`
- UI audit JSON: `docs/product_optimization/reports/agent-completion-readability-slice-2026-07-09/ui-layout-checks.json`

Agent fixture checks passed on mobile and desktop:

- `noPanelHorizontalOverflow`
- `noMessageHorizontalOverflow`
- `answerStartsVisible`
- `sourcesCollapsedByDefault`
- `expandedSourcesBounded`
- `expandedSourcesNoHorizontalOverflow`
- `relatedTasksNoHorizontalOverflow`
- `sourceSummaryCompact`
- `composerReachable`

## Verification

```bash
corepack pnpm test -- client/src/components/agent/AgentRelatedQuestions.test.tsx client/src/components/agent/sourceCards.test.ts server/ai/model.test.ts
```

Passed. Vitest ran the full current suite: 63 files, 365 tests.

```bash
corepack pnpm test
```

Passed: 63 files, 365 tests.

```bash
corepack pnpm check
```

Passed.

```bash
corepack pnpm build
```

Passed.

```bash
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui -- --output=docs/product_optimization/reports/agent-completion-readability-slice-2026-07-09/ui-layout-checks.json
```

Passed after starting the local production server from the built `dist/index.js`.

```bash
git show HEAD:client/src/styles/agent-surfaces.css | rg -n "!important" | wc -l
rg -n "!important" client/src/styles/agent-surfaces.css | wc -l
```

Both counts are `45`, so this slice does not increase Agent CSS `!important` debt.

## Code Review Notes

- No new dependency.
- No route, DB schema, auth, quota, retrieval, model provider, or streaming event contract changed.
- `normalizeAgentAnswer(parsed, sourceCards)` remains compatible; the new third argument is optional.
- The CSS changes are scoped to Agent semantic classes and do not add broad selectors.
- The screenshots use deterministic fixture content so provider credentials are not required.

## Remaining Risk

- This slice validates layout with deterministic fixture content rather than a live provider response.
- It improves follow-up prompt shape and fallback language, but it does not evaluate model semantic quality or retrieval relevance.
- It does not complete broader Agent ops, owner cockpit, article quality, or product-loop specs.
