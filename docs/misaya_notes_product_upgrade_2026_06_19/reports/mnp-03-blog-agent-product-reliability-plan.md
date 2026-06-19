# MNP-03 Blog Agent Product Reliability Plan

**Phase:** MNP-03 Blog Agent Product Reliability

**Feature Oracle:** MNP-F004

**Date:** 2026-06-20

---

## Scope

Execute one bounded MNP-03 slice focused on grounded-source trust and recoverable Agent states. The first implementation target is stable source-card section navigation because the current client still falls back from `sourceId` chunk indexes to `heading-N` anchors.

## Baseline

| Check | Result |
| --- | --- |
| `pnpm exec vitest run client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/sourceCards.test.ts server/ai/harness.test.ts server/ai/model.test.ts server/ai/knowledge.test.ts server/ai/contextSources.test.ts server/ai/quota.test.ts` | passed, 7 files and 93 tests |

## Work Plan

| Requirement | Likely Files | Validation |
| --- | --- | --- |
| Replace inferred source-card anchors with stable heading-derived anchors while preserving a numeric fallback for old/no-heading cards. | `shared/heading-anchors.ts`, `client/src/pages/PostDetail.tsx`, `client/src/components/agent/BlogAgentRoot.tsx` | focused Agent/source-card tests plus Markdown renderer tests |
| Ensure source-card lookup can target h1-h6 article headings, matching MNP-02 renderer behavior. | `client/src/components/agent/BlogAgentRoot.tsx` | focused source-card tests |
| Preserve cancel, timeout, no-source, model fallback, quota, upload-quota, hidden/draft guard, and owner eval behavior. | no broad changes planned; tests verify existing behavior | focused Agent server/client tests |
| Write durable MNP-03 evidence and code facts for the next phase. | harness runtime docs | `git diff --check`, JSON parse, phase report |

## Non-Goals

- No production data mutation.
- No credential lookup.
- No deployment in this phase unless separately requested.
- No owner UI visual redesign beyond source-card reliability and readable state evidence.

## Acceptance Evidence Target

- Focused Vitest shows source-card anchors, stream failure states, no-source refusals, quota, upload context limits, hidden/draft exclusion, and owner eval diagnostics remain covered.
- `pnpm check`, `pnpm test`, and `pnpm build` pass or blockers are documented in the phase report.
- `feature-oracle.json`, `source-packet.md`, `continuity-ledger.md`, `progress-log.md`, `agent-handoff.md`, and `next-window-prompt.md` are updated.
