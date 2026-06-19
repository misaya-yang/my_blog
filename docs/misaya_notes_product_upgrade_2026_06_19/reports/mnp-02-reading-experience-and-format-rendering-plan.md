# MNP-02 Reading Experience and Format Rendering Plan

**Date:** 2026-06-19

**Scope:** MNP-F003 only.

## Working Assumption

MNP-01 already established the calmer public reader hierarchy. This phase should preserve that visual direction while making reader-format behavior testable and consistent.

## Implementation Steps

1. Repair phase evidence alignment before implementation so MNP-F003 remains failing until real reader evidence exists and MNP-F007 keeps the prior release evidence.
2. Replace duplicated client/server reading-time estimates with one shared CJK-aware helper used by article cards, article detail, editor preview, and discovery.
3. Add a rich Markdown renderer fixture covering GFM tables, KaTeX, fenced code with copy affordance, images, links, and heading IDs.
4. Inspect mobile reader order and make only targeted changes if code/CSS evidence shows body, TOC, or Agent prompts are getting in the reader's way.
5. Verify with focused tests, full checks, browser inspection on reader viewports, and write updated harness evidence before handoff.

## Validation Targets

- `pnpm check`
- Focused Vitest for reading-time and Markdown renderer tests
- `pnpm test`
- `pnpm build`
- Browser checks for the article detail route at mobile, tablet, and desktop viewports

## Out of Scope

- Agent reliability behavior, source-card anchoring, and admin evals: MNP-03.
- Article copy rewrites: MNP-04.
- Broad CSS consolidation: MNP-05.
