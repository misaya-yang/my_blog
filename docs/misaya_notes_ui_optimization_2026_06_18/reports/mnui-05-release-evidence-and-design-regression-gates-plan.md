# MNUI-05 Release Evidence And Design Regression Gates Plan

**Status:** in progress

## Scope

Create a local release evidence packet for the Misaya Notes UI optimization. This phase verifies the accumulated UI work, records design-source coverage for the full downloaded package, and makes a local release decision without deploying, mutating production data, changing DNS/provider settings, running migrations, or adding dependencies.

## Requirement Mapping

| Gate | Evidence To Collect | Validation |
| --- | --- | --- |
| Complete local release evidence | Command summaries, screenshot index, accessibility/privacy checklist, rollback notes, release decision. | `pnpm check`; `pnpm test`; `pnpm build`; reports under `reports/release-evidence/` |
| Repeatable regression gates | Capture fresh audit outputs for content, publish freshness, UI layout, and route baseline. | `pnpm content:audit`; `pnpm content:verify`; `pnpm audit:ui`; `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick` |
| Browser/runtime coverage | Index existing phase screenshots and capture final release screenshots if needed. | Browser metrics and `reports/release-evidence/` screenshot metrics |
| Agent evidence | Use automated Agent test evidence; run live four-row table only if runtime credentials are confirmed without reading secrets. | `pnpm test`; live table marked blocked if credentials are unavailable/unconfirmed |
| Design-source coverage | Prove manifest, adherence policy, tokens, guidelines, components, UI kit, assets, reference screenshots, bundle, metadata, and font/network policy were considered. | Coverage table in MNUI-05 report |
| No unapproved production action | Keep deploy, migration, database mutation, DNS/provider changes, dependency additions, and destructive git operations out of scope. | Report compliance notes |

## Edit Boundary

Expected changed files:

- `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-05-release-evidence-and-design-regression-gates-report.md`
- `docs/misaya_notes_ui_optimization_2026_06_18/reports/release-evidence/`
- `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md`
- `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md`
- `docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md`
- `docs/misaya_notes_ui_optimization_2026_06_18/agent-handoff.md`
- `docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json`
- `docs/misaya_notes_ui_optimization_2026_06_18/loop-state.json`

No product code changes are planned unless a release-blocking audit failure requires a phase-scoped fix.

## Completion Rule

MNUI-05 is complete only when required local validation commands have pass/blocker evidence, design-source coverage is recorded, the live Agent evidence decision is explicit, MNUI-F006 has evidence, runtime files are updated, the harness validator passes, and the final report clearly states the release decision and remaining risks.
