# MNUI-02 Public Reader IA And Responsive Surfaces Report

**Status:** passed

**Feature oracle item:** MNUI-F003

**Generated:** 2026-06-18

## Plan Followed

1. Loaded MNUI-02 primary context, including MNUI-01 token evidence, UI kit shell/data/icon facts, reader screenshots, public pages, and current reader CSS.
2. Kept the implementation inside public reader surfaces: Home visual system, Archive/Search scan tags, and shared visual CSS.
3. Preserved public route slugs, SEO metadata behavior, content filters, post data, Blog Agent backend behavior, and all schema/server boundaries.
4. Ran the required reader validation commands and refreshed local browser evidence for Home, Archive, Search, Track, and Post routes.
5. Recorded public-content boundary notes, design asset usage, compliance notes, rollback notes, and MNUI-03 handoff.

## Files Changed

| Path | Purpose |
| --- | --- |
| `client/src/styles/visual-refresh.css` | Added the `research-orbit-hero.jpg` visual signal to the Home notebook surface as an unframed background layer, then tuned opacity so the asset reads without covering text. |
| `client/src/pages/Archive.tsx` | Normalized archive category and tag links to shared `article-tag` styling for compact scan density. |
| `client/src/pages/Search.tsx` | Normalized search result category and tag links to shared `article-tag` styling, including no-hit recovery surfaces. |
| `docs/misaya_notes_ui_optimization_2026_06_18/reports/screenshots/mnui-02/*` | Added post-change screenshot and metric evidence for public reader routes. |

## Validation Evidence

| Gate | Command Or Evidence | Result |
| --- | --- | --- |
| Typecheck | `pnpm check` | Passed with exit code 0. |
| Reader tests | `pnpm exec vitest run client/src/pages/Home.test.ts client/src/pages/searchRecovery.test.ts client/src/lib/tracks.test.ts client/src/components/SeriesProgress.test.ts` | Passed; 4 files and 12 tests passed. |
| Content audit | `pnpm content:audit` | Passed with 0 failures; retained 3 known `content.shell_title_only` warnings for existing posts. |
| Production build | `pnpm build` | Passed after the final Home hero asset tuning. |
| Public route baseline | `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick -- --output=docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-02-baseline-quick.json` | Passed; 14 route checks, 0 skipped routes, 4 known baseline metadata/asset gaps. |
| Browser metrics | `reports/screenshots/mnui-02/screenshot-metrics.json` | Passed baseline checks: 9 screenshots, HTTP 200 for all routes, no horizontal overflow, no console/page errors, no sampled text overflow, no explicit unpublished UI signals. |

## Reader Surface Mapping

| Surface | Design-system Fact Used | Product Result |
| --- | --- | --- |
| Home | UI kit home uses an editorial notebook hero, search dock, track portals, latest note, compact note scan, hero imagery, and article thumbnail usage. | Home keeps newest-note, Applications, and Algorithms paths in the first viewport and now carries the `research-orbit-hero.jpg` asset as a subtle unframed background signal. |
| Archive | Design reference favors chronological density, compact metadata, and taxonomy pills. | Archive category and tag links now inherit `article-tag` pill styling while preserving month grouping and links. |
| Search | Design reference uses a clear search field, no-hit recovery, and compact result metadata. | Search result category and tag links now inherit `article-tag` styling; no-hit recovery remains visible on desktop and mobile. |
| Track pages | UI kit sample corpus has two reader tracks and thumbnail-backed note cards. | Algorithms and Applications routes retained track-panel layout, article thumbnails, and no-overflow behavior. |
| Post detail | Reader model requires entry facts, serif reading rhythm, code/table readability, sticky TOC on desktop, and mobile fallback. | Post detail remained unchanged by this phase and passed desktop/mobile screenshots with TOC/mobile fallback metrics. |

## Browser Evidence

| Screenshot | Viewport | Route | Notes |
| --- | --- | --- | --- |
| `reports/screenshots/mnui-02/desktop-home.png` | 1440x900 | `/` | Home shows first-viewport reader choices, search dock, track portals, latest note, article thumbnails, and hero asset rule. |
| `reports/screenshots/mnui-02/mobile-home.png` | 390x844 | `/` | Home stacks without horizontal overflow; hero asset rule is present and content remains readable. |
| `reports/screenshots/mnui-02/desktop-archive.png` | 1440x900 | `/archive` | Archive renders compact month groups, metadata, and shared tag pills. |
| `reports/screenshots/mnui-02/desktop-search-zero.png` | 1440x900 | `/search?q=zzzz-no-hit-ui-audit` | No-hit recovery is visible; input and recovery controls render without overflow. |
| `reports/screenshots/mnui-02/mobile-search-zero.png` | 390x844 | `/search?q=zzzz-no-hit-ui-audit` | Mobile no-hit recovery stacks without horizontal overflow. |
| `reports/screenshots/mnui-02/desktop-algorithms.png` | 1440x900 | `/algorithms` | Track portal, article thumbnails, and reading path remain visible without overflow. |
| `reports/screenshots/mnui-02/desktop-applications.png` | 1440x900 | `/applications` | Track portal, article thumbnails, and compact note scan remain visible without overflow. |
| `reports/screenshots/mnui-02/desktop-post.png` | 1440x900 | `/post/goal-harness-agent-phase-protocol` | Article entry layer and desktop TOC remain stable. |
| `reports/screenshots/mnui-02/mobile-post.png` | 390x844 | `/post/goal-harness-agent-phase-protocol` | Article page retains mobile reading flow with no horizontal overflow. |

## Accessibility And Compliance Notes

- Keyboard focus remained visible in screenshot metrics: active element outline style was `solid` with 2px width across captured routes.
- No public route screenshot exposed explicit unpublished UI, draft controls, auth material, private Agent context, or owner-only metadata.
- The sampled post body includes an article-content string about a hidden/draft dataset state; this was verified as article text, not a leaked UI control or public list signal.
- No dependency, remote font, schema, seed, content-filter, server, auth, production data, deployment, or provider configuration change was introduced.
- The design-system compiled demo bundle was not executed.

## Rollback Notes

- Revert `client/src/styles/visual-refresh.css`, `client/src/pages/Archive.tsx`, and `client/src/pages/Search.tsx` if public reader routing, build output, or mobile screenshots regress.
- The Home hero asset layer is CSS-only and uses an existing local public asset, so rollback does not require content or data changes.
- Runtime/docs evidence can be regenerated by rerunning MNUI-02 after MNUI-01 remains passing.

## Handoff Decision

MNUI-02 passes. MNUI-03 is unlocked to attach the Blog Agent to the stabilized public reader surfaces. The next phase should preserve the public reader routes and use the MNUI-02 screenshots as attachment evidence for launcher placement, route-aware prompts, source cards, and mobile panel behavior.
