# Misaya Notes Product Upgrade Harness Continuity Ledger

**Created:** 2026-06-19

**Harness Folder:** `docs/misaya_notes_product_upgrade_2026_06_19`

---

## Purpose

This file preserves cross-phase continuity for long-running agents. Treat it as the bridge between product intent, code facts, execution evidence, and the next agent's starting point.

## Phase Continuity Chain

| Phase | Feature | Depends On | Unlocks | Handoff Boundary | Required Writeback |
| --- | --- | --- | --- | --- | --- |
| MNP-00 | MNP-F001 | none | MNP-01 | phase report plus handoff notes | source-packet and continuity-ledger code facts |
| MNP-01 | MNP-F002 | MNP-00 | MNP-02 | phase report plus handoff notes | source-packet and continuity-ledger code facts |
| MNP-02 | MNP-F003 | MNP-01 | MNP-03 | phase report plus handoff notes | source-packet and continuity-ledger code facts |
| MNP-03 | MNP-F004 | MNP-02 | MNP-04 | phase report plus handoff notes | source-packet and continuity-ledger code facts |
| MNP-04 | MNP-F005 | MNP-03 | MNP-05 | phase report plus handoff notes | source-packet and continuity-ledger code facts |
| MNP-05 | MNP-F006 | MNP-04 | MNP-06 | phase report plus handoff notes | source-packet and continuity-ledger code facts |
| MNP-06 | MNP-F007 | MNP-05 | none | phase report plus handoff notes | source-packet and continuity-ledger code facts |

## Interface Boundary Ledger

| Boundary | Current Fact | Source | Last Verified | Owner Phase |
| --- | --- | --- | --- | --- |
| Code entrypoints | Public reader files live in `client/src/pages/*`, shared shell/components in `client/src/components`, visual layers in `client/src/index.css` and `client/src/styles/*`, Agent client/server in `BlogAgentRoot.tsx` and `server/ai/*`, content in Markdown plus seed/public article files. | `source-packet.md` | 2026-06-19 | MNP-00 |
| UI/theme boundary | Preserve public dark/light switching and owner dark-lock while reducing visual noise. Do not remove existing routes or public theme APIs during MNP-01. | UI review synthesis | 2026-06-19 | MNP-01 |
| MNP-01 implementation boundary | `Home.tsx` now places the featured note inside the home grid so CSS can order it before track panels on mobile; `Track.tsx` uses `SpaceBackdrop subtle`; owner auth/loading fallbacks use `owner-dark-scope`; the scoped MNP-01 CSS pass lives at the end of `owner-tools.css`. | `reports/mnp-01-ui-anti-slop-visual-system-report.md` | 2026-06-19 | MNP-01 |
| MNP-02 reader-format boundary | Reading minutes now come from `shared/reading-time.ts` across discovery, article cards, post detail, and editor preview; `PostDetail.tsx` and server discovery use shared duplicate-title stripping; `MarkdownRenderer.tsx` assigns ids to h1-h6 headings and keeps language-less fenced code block-styled/copyable; light-mode reader panels must use public panel tokens, while dark reader styling is scoped to `.dark`. | `reports/mnp-02-reading-experience-and-format-rendering-report.md` | 2026-06-19 | MNP-02 |
| MNP-03 Agent reliability boundary | Source-card anchors use shared heading-derived ids via `shared/heading-anchors.ts`; server source cards may carry `anchorId`; client source cards prefer `anchorId`, URL-encode hash fragments, search h1-h6 article headings, and keep numeric `heading-N` fallback only for old/no-heading source ids. Owner diagnostics distinguish `agent_stream_timeout`, `agent_stream_aborted`, and `model_not_configured` fallback telemetry. | `reports/mnp-03-blog-agent-product-reliability-report.md` | 2026-06-20 | MNP-03 |
| Reading/Agent boundary | Source-card anchors, hidden-content guards, streaming failure paths, and CJK reading-time behavior are cross-phase contracts for MNP-02 and MNP-03. Preserve the MNP-03 `anchorId` contract during later content and simplification phases. | function review synthesis and MNP-03 report | 2026-06-20 | MNP-02/MNP-03 |
| Content boundary | Copy edits must not alter slugs, formulas, code listings, publication dates, visibility, or benchmark claims without refreshed evidence. | article review synthesis | 2026-06-19 | MNP-04 |
| Validation boundary | Use `pnpm check`, focused Vitest where possible, `pnpm test`, `pnpm build`, `pnpm content:audit`, harness validation, and route/browser smoke based on phase risk. | `package.json` and phase manifest | 2026-06-19 | MNP-00 |
| Handoff boundary | Do not unlock a dependent implementation phase until report evidence, oracle evidence, progress log, and this ledger are updated. | phase report | 2026-06-19 | MNP-00 |
| Release boundary | MNP-01 UI slice was pushed and deployed to `https://misaya.online`; release evidence is scoped to that slice and does not close MNP-02 through MNP-05. | `reports/mnp-06-release-evidence-and-production-verification-report.md` | 2026-06-19 | MNP-06 |

## Code Summary Writeback Rules

- After inspecting code, summarize discovered files, services, routes, schemas, tests, and runtime commands back into `source-packet.md`.
- Record cross-phase interface decisions here before handing off, especially API contracts, shared state, data shape, UI route assumptions, eval criteria, and rollback boundaries.
- If a phase changes a boundary another phase depends on, update that dependent phase's report handoff and the relevant oracle item notes.
- If a second agent cannot identify the next concrete action from this file, `progress-log.md`, and `agent-handoff.md`, stop and write a blocker instead of guessing.

## Current Continuity Status

- Active phase: MNP-04
- Active feature-oracle item: MNP-F005
- Current decision: MNP-03 passed with stable semantic Agent source anchors, persisted `anchorId` metadata, h1-h6 source lookup, timeout-vs-abort diagnostics, model fallback telemetry, tests, build, and Chrome runtime DOM evidence. Chrome screenshot capture timed out, so MNP-03 uses the saved DOM/runtime artifact plus test coverage.
- Next action: Execute MNP-04, focusing on concrete article summaries, labels, introductions, and conclusions while preserving slugs, formulas, dates, visibility, hidden/draft status, and the MNP-03 `anchorId` contract.
