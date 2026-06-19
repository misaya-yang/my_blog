# MNP-02 Reading Experience and Format Rendering Report

**Phase:** MNP-02 Reading Experience and Format Rendering

**Status:** passed

**Date:** 2026-06-19

---

## Summary

Implemented the reader-format slice for MNP-F003. The work adds shared CJK/English reading-time logic, unifies duplicate-title stripping between article detail and discovery surfaces, expands Markdown renderer coverage for rich article fixtures, fixes h4-h6 anchor parity for the table of contents, treats language-less fenced code as block code, and repairs a light-mode reader contrast regression introduced by the prior late CSS override.

## Plan Followed

Plan file: `docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-02-reading-experience-and-format-rendering-plan.md`.

The implementation followed the planned order: repair oracle alignment, inspect reader paths, add shared reading-time logic, add rich Markdown fixture coverage, check mobile reader order, verify, and write harness evidence.

## Files Changed

| File | Purpose |
| --- | --- |
| `shared/reading-time.ts` | Adds shared readable-unit counting, reading-minute estimation, article-aware duplicate-title stripping, and article reading-minute estimation. |
| `shared/reading-time.test.ts` | Covers CJK/English mixed content, empty content, Markdown normalization, and duplicate title stripping. |
| `client/src/components/ArticleCard.tsx` | Replaces local reading-time fallback with the shared helper. |
| `client/src/pages/PostDetail.tsx` | Uses shared duplicate-title stripping and article-aware reading-time estimation. |
| `client/src/pages/Editor.tsx` | Uses shared readable-unit and reading-time helpers for owner preview consistency. |
| `server/db.ts` | Uses article-aware shared reading-time estimation when attaching public taxonomy/discovery data. |
| `server/discovery.ts` | Preserves the exported reading-time helper while removing duplicated implementation. |
| `client/src/components/MarkdownRenderer.tsx` | Adds h4-h6 heading IDs for TOC parity and keeps language-less fenced code block-styled/copyable. |
| `client/src/components/MarkdownRenderer.test.tsx` | Adds rich Markdown fixture coverage for GFM table, KaTeX, highlighted code, language-less code, images, links, copy affordance, and heading IDs. |
| `client/src/styles/owner-tools.css` | Scopes the dark reader-panel override to dark mode and restores light-mode reader panel/text contrast through existing public tokens. |
| Harness runtime docs | Records MNP-02 evidence and next MNP-03 handoff. |

## Validation Evidence

| Gate | Command or Check | Result | Notes |
| --- | --- | --- | --- |
| Whitespace | `git diff --check` | passed | Re-run after CSS change. |
| Typecheck | `pnpm check` | passed | Re-run after all code/CSS changes. |
| Focused regression | `pnpm exec vitest run shared/reading-time.test.ts client/src/components/MarkdownRenderer.test.tsx server/discovery.test.ts` | passed | 3 files, 13 tests. |
| Full regression | `pnpm test` | passed | 37 files, 223 tests. `server/seo.test.ts` logs the existing missing OAuth env warning but passes. |
| Build | `pnpm build` | passed | Re-run after CSS change; Vite and server bundle completed. |
| Browser runtime | Chrome DevTools on `http://localhost:3002/post/goal-harness-agent-phase-protocol` | passed with screenshot caveat | 390 dark, 768 dark, 1024 dark, and 1024 light DOM/CSS checks passed; `Page.captureScreenshot` timed out twice, so durable visual evidence is an a11y snapshot plus measured runtime values. |
| Compliance | Repo-local checks only | passed | No secrets read or printed, no production data mutation, no deployment. |

## Browser Checks

| Route | Viewport/theme | Result |
| --- | --- | --- |
| `/post/goal-harness-agent-phase-protocol` | 390x844 dark | No horizontal overflow; first paragraph top 683px; mobile TOC display `block` and closed; Agent prompts display `none`; first table wrapper `overflow-x: auto`, `role=region`, `tabIndex=0`; reading time 14 minutes; no article headings missing IDs. |
| `/post/goal-harness-agent-phase-protocol` | 768x1024 dark | No horizontal overflow; first paragraph top 545px; mobile TOC display `block`; Agent prompts display `none`; table wrappers `overflow-x: auto`; reading time 14 minutes; no article headings missing IDs. |
| `/post/goal-harness-agent-phase-protocol` | 1024x768 dark | No horizontal overflow; desktop TOC display `block`; first paragraph top 491px; reader background is dark and title/body colors are light readable tokens; no article headings missing IDs. |
| `/post/goal-harness-agent-phase-protocol` | 1024x768 light | No horizontal overflow; desktop TOC display `block`; first paragraph top 491px; reader background is light public panel token and title/body colors are light-mode readable tokens; no article headings missing IDs. |

## Feature Oracle Updates

| Feature ID | Old Status | New Status | Evidence |
| --- | --- | --- | --- |
| MNP-F003 | failing | passing | This report, `shared/reading-time.test.ts`, `client/src/components/MarkdownRenderer.test.tsx`, focused Vitest, `pnpm check`, `pnpm test`, `pnpm build`, and Chrome DevTools runtime checks. |

## Progress Log Update

Appended an MNP-02 progress-log entry documenting the shared reading-time helper, rich Markdown fixture, TOC/code rendering fixes, light-mode reader contrast fix, validation commands, and MNP-03 handoff.

## Screenshots, Logs, or Eval Tables

- `docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-02-screenshots/post-goal-harness-390-dark-a11y-snapshot.txt`

`mcp__chrome_devtools.take_screenshot` timed out for both PNG and JPEG viewport captures on the long article page. The report therefore uses the a11y snapshot plus DevTools `evaluate_script` DOM/CSS metrics as durable browser evidence.

## Blockers and Deviations

- Browser screenshot capture timed out twice. This is a tooling limitation, not a route failure; runtime DOM/CSS checks and a11y snapshot were captured instead.
- No production deployment was performed in MNP-02. The release phase remains the place to deploy selected slices unless the user explicitly asks for another deploy.
- Agent reliability/source-card behavior remains out of scope and is intentionally left for MNP-03.

## Handoff Notes

MNP-03 is unlocked. The next agent should focus on Blog Agent source-card anchors, no-source fallback, partial stream failure, cancel/timeout/low-quota states, and owner eval diagnostics without revisiting reader-format work unless a regression is discovered.
