# MNP-00 Current Product Contract And Evidence Audit Report

**Status:** passed for planning baseline

**Date:** 2026-06-19

## Summary

MNP-00 replaced the starter harness language with a current-product contract for Misaya Notes. The repo, local design system, prior harnesses, and four parallel read-only review lanes now feed a single phase plan covering UI taste, reading/Agent functionality, article voice, code simplification, and release evidence.

This report does not claim that product UI or Agent changes are implemented. It only unlocks MNP-01 as the next executable phase.

## Sources Reviewed

| Source | Evidence Captured | Result |
| --- | --- | --- |
| `package.json` | scripts and stack | React/Vite/Express/tRPC/Drizzle with `pnpm check`, `pnpm test`, `pnpm build`, and content scripts. |
| `client/src/pages/*` and `client/src/components/*` | public route/component boundaries | Home, track, archive, search, post detail, about, login, owner and Agent surfaces identified. |
| `client/src/styles/*` and `client/src/index.css` | visual-system risk | Late CSS layers, heavy visual refresh file, owner overrides, and theme token duplication are downstream risks. |
| `/Users/yang/Downloads/Misaya Notes Design System` | design-system facts | Tokens, typography roles, references, assets, and lack of font binaries recorded. |
| Prior docs under `docs/product_optimization`, `docs/webdeb_product_upgrade_2026_06_16`, and `docs/misaya_notes_ui_optimization_2026_06_18` | historical evidence | Useful regression material, but not accepted as proof that current UI quality is sufficient. |
| Parallel review lanes | product findings | UI, function/Agent, article voice, and code simplification priorities synthesized into phase gates. |

## Key Findings

1. Visual quality remains the highest-risk user-facing problem. The direction should be quiet research publication plus dense admin tooling, not more space-grid/glass effects.
2. Functional trust depends on stable Agent source anchors, renderer regression fixtures, CJK-aware reading-time consistency, search pagination/explainability, and clearer stream failure recovery.
3. Article quality should be improved through metadata, UI labels, intros, and conclusions first. Avoid changing technical claims without refreshed evidence.
4. Code simplification should start with tests and small extractions around theme tokens, PostDetail pure logic, heading anchors, Search recovery, and Agent controller state.
5. Release claims must be backed by command output, screenshots, production smoke, and rollback notes.

## Updated Files

- `README.md`: current system shape, deployment assumption, verification commands, and phase outcomes.
- `source-packet.md`: repo facts, design-system facts, functional/Agent facts, article-voice facts, risk tags, and approval notes.
- `phase-manifest.md`: concrete phase goals, validation matrix, and risk matrix.
- `feature-oracle.json`: observable feature-oracle cases and MNP-F001 marked passing with evidence.
- `loop-state.json`, `progress-log.md`, `agent-handoff.md`, `continuity-ledger.md`, and `next-window-prompt.md`: next phase moved to MNP-01.

## Validation

| Gate | Evidence | Status |
| --- | --- | --- |
| Harness structure | `validate_harness_prd.py` should pass after this report is committed to the runtime files. | pending command run |
| Project typecheck/test/build | Use `pnpm check`, `pnpm test`, and `pnpm build` before commit. | pending command run |
| Content audit | Use `pnpm content:audit` before release if content files change; for this phase it is a release sanity check. | pending command run |
| Secrets | No secrets, tokens, or connection strings are included. | passed by inspection |

## Next Phase

Proceed to MNP-01. The first implementation slice should remove AI-template visual signals where they most damage trust: home first viewport density, article first viewport, search zero-state recovery hierarchy, track page dashboard cards, and owner glass/space styling. MNP-F002 must remain failing until screenshots and command evidence exist.
