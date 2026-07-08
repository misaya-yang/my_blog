# Agent Answer Layout Audit Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`
Status: Passed

## Goal

Add a repeatable browser-level audit for the Agent reading companion's most important failure mode: a completed long answer with sources should keep the answer readable, keep sources collapsed by default, avoid horizontal overflow, and keep the composer reachable.

## Scope

In:

- Extend `scripts/audit/ui-layout.ts` with a deterministic Agent answer fixture.
- Run the fixture on mobile `390x844` and desktop `1440x900`.
- Verify long answer text, a 5-source collapsed summary, source chips, and the composer in production-built UI.
- Update the latest UI layout audit JSON after running the gate.
- Write a slice evidence report.

Out:

- No runtime product behavior changes.
- No real model/provider streaming dependency.
- No new dependency.
- No deploy.

## Expected Files

- `scripts/audit/ui-layout.ts`
- `docs/product_optimization/reports/ui-layout-checks-latest.json`
- `docs/product_optimization/reports/agent-answer-layout-audit-slice-2026-07-09/summary.md`

## Validation

Static and unit gates:

```bash
corepack pnpm check
corepack pnpm test
corepack pnpm build
git diff --check
```

Production UI audit:

```bash
PORT=3000 NODE_ENV=production node dist/index.js
corepack pnpm audit:ui
```

## Acceptance

- The audit includes `#agent-answer-fixture` results for mobile and desktop.
- The fixture passes these checks:
  - `fixtureMounted`
  - `noPanelHorizontalOverflow`
  - `noMessageHorizontalOverflow`
  - `answerStartsVisible`
  - `sourcesCollapsedByDefault`
  - `sourceSummaryCompact`
  - `composerReachable`
- The JSON report remains machine-readable and fails the command if any check fails.

## Result

- Added a deterministic completed-answer fixture to `scripts/audit/ui-layout.ts`.
- Added mobile `390x844` and desktop `1440x900` Agent answer layout checks.
- Updated `docs/product_optimization/reports/ui-layout-checks-latest.json` with the new fixture results.
- Evidence report: `docs/product_optimization/reports/agent-answer-layout-audit-slice-2026-07-09/summary.md`.

## Verification

- `corepack pnpm check` passed.
- `corepack pnpm test` passed: 59 files, 342 tests.
- `corepack pnpm build` passed.
- `git diff --check` passed.
- `PORT=3000 NODE_ENV=production node dist/index.js` started the local production server.
- `corepack pnpm audit:ui` passed and recorded two `#agent-answer-fixture` results.
