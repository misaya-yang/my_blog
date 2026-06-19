# MNP-03 Blog Agent Product Reliability Report

**Phase:** MNP-03 Blog Agent Product Reliability

**Status:** passed

**Date:** 2026-06-20

---

## Summary

Implemented the Agent reliability slice around source trust and recoverable failures. Source cards now carry stable heading-derived anchors from the server to the client, article pages generate matching semantic heading ids, and the old numeric `heading-N` fallback remains only for legacy/no-heading cards. Agent diagnostics now preserve model fallback error codes and distinguish stream timeouts from user aborts.

## Plan Followed

Plan file: `docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-03-blog-agent-product-reliability-plan.md`.

The implementation stayed inside the planned Agent/source-anchor scope, then extended server diagnostics where review found that degraded model fallback and stream timeout states were undercounted in owner-facing telemetry.

## Files Changed

| File | Why |
| --- | --- |
| `shared/heading-anchors.ts` | Added shared heading-anchor helpers used by article rendering and Agent source cards. |
| `shared/heading-anchors.test.ts` | Covered technical, CJK, duplicate, and empty-heading anchor behavior. |
| `client/src/pages/PostDetail.tsx` | Article TOC headings now use stable semantic ids instead of `heading-${index}`. |
| `client/src/components/agent/BlogAgentRoot.tsx` | Source-card hrefs prefer `anchorId`, encode hash fragments, search h1-h6, and keep numeric fallback for old source ids. |
| `client/src/components/agent/messageState.ts` | Persisted Agent source metadata now preserves `anchorId`. |
| `client/src/components/agent/types.ts` and `server/ai/types.ts` | Extended the source-card contract with optional `anchorId`. |
| `server/ai/model.ts` | Server source-card construction now emits heading-derived `anchorId`. |
| `server/ai/harness.ts` | Model fallback run records now keep `errorCode`; stream timeouts and aborts are normalized separately. |
| Agent and shared tests | Added source-anchor, timeout, model fallback radar, and context-limit regression coverage. |

## Validation Evidence

| Gate | Command or Check | Result | Notes |
| --- | --- | --- | --- |
| Baseline | `pnpm exec vitest run client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/sourceCards.test.ts server/ai/harness.test.ts server/ai/model.test.ts server/ai/knowledge.test.ts server/ai/contextSources.test.ts server/ai/quota.test.ts` | passed | 7 files, 93 tests before edits. |
| Focused regression | `pnpm exec vitest run shared/heading-anchors.test.ts client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/sourceCards.test.ts client/src/components/MarkdownRenderer.test.tsx server/ai/harness.test.ts server/ai/model.test.ts server/ai/knowledge.test.ts server/ai/contextSources.test.ts server/ai/quota.test.ts` | passed | 9 files, 104 tests after implementation. |
| Typecheck | `pnpm check` | passed | `tsc --noEmit`. |
| Full tests | `pnpm test` | passed | 38 files, 233 tests. |
| Production build | `pnpm build` | passed | Vite and server esbuild bundle completed. |
| Diff hygiene | `git diff --check` | passed | No whitespace or conflict-marker issues. |
| Harness validator | `python3 /Users/yang/.codex/skills/prd-phase-harness/scripts/validate_harness_prd.py docs/misaya_notes_product_upgrade_2026_06_19 --allow-placeholders` | passed | Harness validation passed. |
| Browser/runtime | Chrome DevTools on `http://localhost:3000/post/goal-harness-agent-phase-protocol?mnp03=1` | passed with caveat | DOM runtime evidence saved at `reports/mnp-03-screenshots/post-goal-harness-anchor-runtime.json`; screenshot capture timed out in DevTools. |
| Compliance | Repo-only validation; no secret files read; no production data mutation; no schema migration | passed | Deployment is handled separately under explicit user approval. |

## Feature Oracle Updates

| Feature ID | Old Status | New Status | Evidence |
| --- | --- | --- | --- |
| MNP-F004 | failing | passing | This report, stable source-card anchor tests, timeout/fallback diagnostics tests, full check/test/build, and local Chrome runtime anchor evidence. |

## Progress Log Update

`progress-log.md` now records MNP-03 as the completed generator/evaluator slice and names MNP-04 Article Voice and Quality System as the next phase.

## Screenshots, Logs, or Eval Tables

- Browser runtime artifact: `docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-03-screenshots/post-goal-harness-anchor-runtime.json`
- Screenshot caveat: `mcp__chrome_devtools.take_screenshot` timed out again, so the durable browser evidence for this phase is the saved DOM/runtime artifact plus test evidence.

## Blockers and Deviations

- Duplicate same-text headings still resolve to the article's deterministic heading ids; source cards do not yet carry duplicate occurrence indexes from retrieval. The shared article helper dedupes article ids, and source-card anchor fallback remains safe for no-heading cards.
- Owner final-answer quality scoring is still a future enhancement. This phase preserves and improves retrieval/source diagnostics but does not add a new LLM judge.
- No content seed, production database, or schema migration was touched.

## Handoff Notes

MNP-04 may proceed. The next agent should keep the new `anchorId` source-card contract intact and avoid changing slugs, technical claims, formulas, or publication metadata while improving article voice.
