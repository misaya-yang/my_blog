# Engineering Simplification And Release Gates Design

Date: 2026-07-08
Status: Proposed
Parent spec: [Reading and writing loop optimization](./2026-07-08-reading-writing-loop-optimization-design.md)

## Summary

The product has accumulated useful features, but some implementation areas are now too large or too style-order-dependent. Before broad feature work, the next implementation should simplify ownership boundaries and strengthen release gates so visual, content, Agent, and publish regressions are caught locally.

This spec defines refactor limits, test gates, and release evidence requirements.

## Goals

- Reduce risk in large Agent and style files.
- Keep refactors tied to the reading and writing loop.
- Add or preserve release gates for UI, content, Agent quality, typecheck, tests, build, and publish freshness.
- Avoid unrelated renames or broad formatting.
- Make deployment readiness visible before production release.

## Non-Goals

- No force-push or history rewrite.
- No branch policy change beyond following existing `main` and `dev` rules.
- No production deploy during spec generation.
- No schema migration without its own plan.
- No dependency additions for cleanup alone.

## Current Risk Areas

Large mixed-responsibility files:

- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/pages/ManageAgent.tsx`
- `client/src/styles/visual-refresh.css`
- `client/src/styles/liquid-materials.css`
- `client/src/styles/owner-tools.css`

Release-sensitive scripts:

- `scripts/audit/ui-layout.ts`
- `scripts/audit/content-quality.ts`
- `scripts/audit/publish-freshness.ts`
- `scripts/ai/reindex-knowledge.ts`

Server areas:

- `server/ai/harness.ts`
- `server/ai/evals.ts`
- `server/ai/streamRoute.ts`
- `server/ai/knowledge.ts`
- `server/discovery.ts`
- `server/searchMisses.ts`

## Refactor Rules

1. Extract before changing behavior.
2. Move pure helpers first.
3. Add tests before modifying scroll, streaming, source cards, content audit scope, or publish freshness.
4. Keep public interfaces additive.
5. Do not rename routes, slugs, tRPC procedure names, DB columns, or public metadata without a separate approved plan.
6. Do not reformat unrelated files.
7. Avoid broad CSS selector rewrites without screenshot evidence.

## Module Boundary Targets

### Agent

Move pure logic into testable modules:

- `agentFrameState.ts`
- `agentScrollPolicy.ts`
- `agentElapsed.ts`
- `agentSourceSummary.ts`

Keep UI components small:

- launcher
- frame
- panel
- message list
- composer
- source summary
- trace
- context dock
- history

### UI Styles

Create a style ownership map before edits.

Target:

- tokens and base in `index.css`
- public reader composition in `visual-refresh.css`
- public reusable components in `public-components.css`
- Agent final layer in `agent-surfaces.css`
- owner tools in `owner-tools.css`
- liquid effects only where materially justified in `liquid-materials.css`

### Owner Tools

Split owner views by job:

- release readiness
- content signals
- Agent evals
- knowledge index
- advanced debug

Avoid splitting only for file-count aesthetics. Split when it makes testing or comprehension better.

## Release Gate Matrix

Required before opening an implementation PR or asking for review:

```bash
corepack pnpm check
corepack pnpm test
corepack pnpm content:audit
corepack pnpm audit:ui
corepack pnpm build
```

For content publish or knowledge changes:

```bash
corepack pnpm content:verify
corepack pnpm ai:reindex
```

For production deployment:

```bash
corepack pnpm content:publish
corepack pnpm build
```

Deployment uses the project-local deployment process, not generic deploy advice.

## Known Current Gate State

As of this spec package:

- `corepack pnpm check` passes.
- `corepack pnpm audit:ui` passed in the prior run.
- `corepack pnpm content:audit` fails because `agent.md` is treated as article Markdown and lacks an H1.

This means Slice 1 should fix audit scope before claiming all gates pass.

## Evidence Requirements

Each implementation slice should leave a short report:

```text
docs/product_optimization/reports/<slice-name>-<date>/
  summary.md
  commands.txt
  screenshots/
  json/
```

Minimum summary fields:

- scope changed
- files changed
- risks addressed
- commands run
- commands not run and why
- screenshots captured
- known remaining issues

## Branch And Commit Rules

Follow repo policy:

- Long-lived branches: `main` and `dev`.
- Normal work happens on `dev`.
- Merge `dev` to `main` after user review.
- For very complex work, use `dev_MMDD`, merge after validation, then delete.

Commit rules:

- Keep commits scoped by slice.
- Commit docs, tests, and implementation together only when they describe the same behavior.
- Do not commit generated timestamp churn unless it is part of a report.
- Do not print or commit secrets.

## Regression Test Focus

High-risk behavior to test directly:

- Agent final elapsed time.
- Agent final scroll position.
- Source summary collapsed default.
- Source list overflow.
- Frame clamp and persistence.
- Markdown callout parsing.
- Heading anchor stability.
- Content audit scope.
- Search miss normalization.
- Reader signal privacy.
- Publish freshness and knowledge index status.

## Browser QA Matrix

Routes:

- `/`
- `/post/goal-harness-agent-phase-protocol`
- `/search`
- `/archive`
- `/manage/agent`

Viewports:

- 1440x900
- 1024x768
- 390x844

Themes:

- light
- dark

Interactions:

- open and close Agent.
- ask long Agent question with sources.
- expand sources.
- drag and resize Agent on desktop.
- use mobile Agent sheet.
- search with a miss.
- inspect article code, table, and math.
- open owner Agent dashboard.

## Simplification Acceptance

A refactor is successful only if:

- tests pass,
- behavior is unchanged or intentionally covered by the spec,
- file ownership is clearer,
- public contracts are stable,
- screenshot evidence shows no visual regression,
- the diff does not mix unrelated cleanup.

## Implementation Slices

1. Fix current gate blocker: content audit scope.
2. Add UI and style ownership map.
3. Extract Agent pure helpers with tests.
4. Extract Agent UI subcomponents without behavior change.
5. Add reader signal normalizers with tests.
6. Add release evidence report template.
7. Run full gate matrix and record results.

## Acceptance Checklist

- Full local gate matrix can pass after Slice 1.
- Large files begin shrinking through focused extraction.
- Release evidence is repeatable.
- No schema or route break.
- Branch policy is followed.
