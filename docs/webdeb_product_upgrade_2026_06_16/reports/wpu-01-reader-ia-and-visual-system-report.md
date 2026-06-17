# WPU-01 Reader IA And Visual System Report

**Phase:** WPU-01 Reader IA And Visual System

**Status:** passed

**Date:** 2026-06-16

---

## Summary

WPU-01 made the public reader surface easier to enter and safer to use on mobile. Home now has a clear first-read route after search. Article pages keep the reading guide, series position, article companion entry, and mobile TOC visible instead of hiding them behind broad compactness overrides.

## Plan Followed

Plan file: `docs/webdeb_product_upgrade_2026_06_16/reports/wpu-01-reader-ia-and-visual-system-plan.md`.

The implementation stayed inside WPU-01 boundaries: public React pages, home i18n copy, visual CSS, and harness evidence docs.

## Files Changed

| File | Why |
| --- | --- |
| `client/src/pages/Home.tsx` | Added `StartHerePath` so new readers can choose newest note, applications path, or algorithms path before the latest article card. |
| `client/src/i18n/home.ts` | Added bilingual labels for the first-read path. |
| `client/src/styles/visual-refresh.css` | Styled the first-read path and added a final mobile reader parity override for TOC and article entry visibility. |
| `docs/webdeb_product_upgrade_2026_06_16/**` | Recorded WPU-01 plan, report, oracle evidence, continuity, progress, handoff, and next-window state. |

## Validation Evidence

| Gate | Command or Check | Result | Notes |
| --- | --- | --- | --- |
| Typecheck | `pnpm check` | Passed | `tsc --noEmit` clean. |
| Tests | `pnpm test` | Passed | 31 files, 194 tests. Existing `OAUTH_SERVER_URL` warning in `server/seo.test.ts`. |
| Build | `pnpm build` | Passed | Vite and server esbuild completed. |
| UI audit | `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:ui` | Passed | Report written to `docs/product_optimization/reports/ui-layout-checks-latest.json`. |
| Browser | Playwright MCP screenshots | Passed | Required WPU-01 routes captured at desktop and mobile sizes. |
| Compliance | Code and screenshots | Passed | No route migration, no hidden content, no raw reasoning, no production mutation. |

## Browser Evidence

| Route | Viewport | Evidence |
| --- | --- | --- |
| `/` | 1440x900 | `wpu-01-home-desktop.png` |
| `/` | 390x844 | `wpu-01-home-mobile.png` |
| `/post/goal-harness-agent-phase-protocol` | 1440x900 | `wpu-01-post-desktop.png` |
| `/post/goal-harness-agent-phase-protocol` | 390x844 | `wpu-01-post-mobile-after.png` |
| `/algorithms` | 1280x800 | `wpu-01-algorithms-desktop.png` |
| `/algorithms` | 390x844 | `wpu-01-algorithms-mobile.png` |
| `/applications` | 1280x800 | `wpu-01-applications-desktop.png` |
| `/applications` | 390x844 | `wpu-01-applications-mobile.png` |
| `/search?q=zzzz-no-hit-ui-audit` | 390x844 | `wpu-01-search-zero-mobile.png` |

## Feature Oracle Updates

| Feature ID | Old Status | New Status | Evidence |
| --- | --- | --- | --- |
| WPU-F002 | failing | passing | This report, validation commands above, and `wpu-01-*.png` screenshots. |

## Progress Log Update

`progress-log.md` now records WPU-01 as passed and sets the next phase to WPU-02.

## Screenshots, Logs, Or Eval Tables

Screenshots were saved in the repo root by Playwright MCP. UI layout metrics were saved at `docs/product_optimization/reports/ui-layout-checks-latest.json`.

## Blockers And Deviations

No blockers. The phase intentionally edited `client/src/styles/visual-refresh.css`, which already had user work, because WPU-01 allowed CSS edits and mobile reader parity required overriding a late mobile rule that hid TOC and the article entry layer.

## Handoff Notes

WPU-02 may proceed. It should preserve the visible article companion entry and focus on Agent trust boundaries: no raw reasoning, no hidden content, source cards, answer modes, quota/cancel/history states, and mobile panel behavior.
