# MNP-01 UI Anti-Slop Visual System Report

**Phase:** MNP-01 UI Anti-Slop Visual System

**Status:** passed for the implemented slice

**Date:** 2026-06-19

---

## Summary

Implemented the first anti-slop UI pass across the public home, track, search, article reader, and owner fallback surfaces. The change reduces space/glass/dashboard cues, improves mobile ordering for the latest note, compresses query search hierarchy, exposes article body earlier, and keeps owner routes dark-locked even when the public theme is light.

This is intentionally not a full CSS architecture cleanup. MNP-05 should still consolidate late override layers and duplicate selectors.

## Files Changed

| File | Purpose |
| --- | --- |
| `client/src/pages/Home.tsx` | Moves the featured/latest note into the home grid so CSS can place it before track panels on mobile. |
| `client/src/pages/Track.tsx` | Uses `SpaceBackdrop subtle` on track index pages. |
| `client/src/components/ResearchShell.tsx` | Locks owner auth-required fallback into `owner-dark-scope`. |
| `client/src/pages/Manage.tsx` | Locks owner loading state into `owner-dark-scope`. |
| `client/src/pages/ManageAgent.tsx` | Locks Agent admin loading state into `owner-dark-scope`. |
| `client/src/pages/Editor.tsx` | Locks editor loading state into `owner-dark-scope`. |
| `client/src/styles/owner-tools.css` | Adds a scoped MNP-01 calm pass for public backdrop opacity, home ordering, track stats/chips, query search compression, article reader hierarchy, and owner dark-lock surfaces. |

## Validation Evidence

| Gate | Command or Check | Result | Notes |
| --- | --- | --- | --- |
| Whitespace | `git diff --check` | passed | No whitespace or conflict-marker errors. |
| Typecheck | `pnpm check` | passed | `tsc --noEmit`. |
| Focused regression | `pnpm exec vitest run client/src/pages/Home.test.ts client/src/components/ResearchShell.test.tsx client/src/pages/searchRecovery.test.ts` | passed | 3 files, 10 tests. |
| Full regression | `pnpm test` | passed | 35 files, 218 tests. `server/seo.test.ts` logs missing OAuth env in stderr but tests pass. |
| Build | `pnpm build` | passed | Vite and server bundle completed. |
| Browser runtime | Chrome DevTools on `http://localhost:3001` | passed | Screenshots and script checks captured for public dark/light, reader mobile/desktop, search query, track index, and owner fallback. |

## Browser Checks

| Route | Viewport/theme | Result |
| --- | --- | --- |
| `/` | 1440x1100 light | No horizontal overflow; `home-featured-band` present; public light mode readable. |
| `/` | 390x844 dark | No horizontal overflow; latest note moved from top 1603px before fix to top 599px after grid ordering. |
| `/post/llm-rl-post-training-verifiable-rewards` | 1024x768 dark | First prose block top at 491px; Agent prompts hidden before body. |
| `/post/llm-rl-post-training-verifiable-rewards` | 390x844 dark | First prose block top at 644px; no horizontal overflow; Agent prompts hidden before body. |
| `/search?q=zzzz-no-hit-ui-audit` | 1440x1000 light | Query state hides signal chip; zero-result recovery top at 466px; no horizontal overflow. |
| `/algorithms` | 1024x768 dark | Stat row is flex, transparent, and shadowless; focus chips are neutral text tokens. |
| `/manage` unauthenticated | 1024x768 with light preference | `owner-dark-scope` present; owner background `oklch(0.052 0.012 252)`; `.space-backdrop` display is `none`; no horizontal overflow. |

## Screenshots

- `docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-01-screenshots/home-1440-light.png`
- `docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-01-screenshots/home-390-dark-after-grid-order.png`
- `docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-01-screenshots/post-1024-dark.png`
- `docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-01-screenshots/post-390-dark.png`
- `docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-01-screenshots/search-zero-1440-light.png`
- `docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-01-screenshots/algorithms-1024-dark.png`
- `docs/misaya_notes_product_upgrade_2026_06_19/reports/mnp-01-screenshots/manage-auth-1024-light-pref-after-owner-lock.png`

## Feature Oracle Updates

| Feature ID | Old Status | New Status | Evidence |
| --- | --- | --- | --- |
| MNP-F002 | failing | passing | This report, screenshots above, `pnpm check`, focused Vitest, `pnpm test`, `pnpm build`, and Chrome DevTools runtime checks. |

## Blockers and Deviations

- Owner authenticated screens were not logged into during this pass, so the strongest owner evidence is the unauthenticated fallback plus CSS/code boundary checks. Authenticated owner UI still needs deeper visual review in a later owner-specific pass.
- This pass intentionally uses a late CSS phase block in `owner-tools.css` to limit code churn. MNP-05 should consolidate repeated visual overrides and reduce selector weight.
- MNP-02 through MNP-05 remain open; this report does not claim article formatting, Agent reliability, content voice, or CSS architecture completion.

## Handoff Notes

MNP-02 can proceed. The next phase should focus on richer article-format fixtures, body ordering, CJK reading-time consistency, and Markdown/KaTeX/table/code rendering, without undoing the MNP-01 visual hierarchy decisions.
