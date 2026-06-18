# Phase Report - MNUI-05 Release Evidence And Design Regression Gates

**Status:** passed

**Date:** 2026-06-18

**Feature Oracle Item:** MNUI-F006

## Summary

MNUI-05 produced the final local release evidence packet for the Misaya Notes UI optimization. Local typecheck, full tests, production build, content audit, publish freshness, UI layout audit, route baseline, and 32 final browser screenshots passed. No production deployment, production database mutation, migration, DNS/provider change, dependency addition, or destructive git action was performed. Production release remains a separate approval step, and live Agent four-row evaluation remains blocked until runtime model credentials are explicitly configured/approved for use.

## Plan Used

Plan: `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-05-release-evidence-and-design-regression-gates-plan.md`.

The executed plan collected final command evidence, fixed one stale audit selector for the renamed Blog Agent launcher, generated release screenshot evidence, audited full design-source coverage, recorded accessibility/privacy/rollback notes, and updated harness runtime state.

## Files Changed

| File | Change | Reason |
| --- | --- | --- |
| `scripts/audit/ui-layout.ts` | Expanded the Agent launcher audit selector from `/阅读助手|Reader/i` to `/Blog Agent|阅读助手|Reader/i`. | MNUI-03 intentionally renamed the launcher to Blog Agent; the release audit needed to follow the current accessible name while staying backward compatible. |
| `docs/misaya_notes_ui_optimization_2026_06_18/reports/release-evidence/mnui-05-ui-layout-checks.json` | Added UI layout audit output. | Repeatable release evidence for mobile/desktop Home, Post, Search recovery, and Agent dialog focus behavior. |
| `docs/misaya_notes_ui_optimization_2026_06_18/reports/release-evidence/mnui-05-baseline-quick.json` | Added final route/bundle baseline output. | Repeatable local route evidence after the final build. |
| `docs/misaya_notes_ui_optimization_2026_06_18/reports/release-evidence/screenshots/` | Added 32 screenshots plus `screenshot-metrics.json`. | Final browser evidence across 4 viewports and 8 scenarios. |
| `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-05-release-evidence-and-design-regression-gates-plan.md` | Added plan-first record. | Required phase planning evidence. |
| `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-05-release-evidence-and-design-regression-gates-report.md` | Added this completion report. | Required phase completion evidence. |
| Harness runtime docs | Updated after this report. | Mark MNUI-F006 complete and close the phase chain. |

No user-facing React component, server route, auth/session code, schema, seed data, public content, dependency list, provider config, or deployment target changed in MNUI-05.

## Validation Evidence

| Gate | Command Or Check | Result | Evidence Path Or Notes |
| --- | --- | --- | --- |
| Static/typecheck | `pnpm check` | passed | Reran after the audit-script fix; TypeScript completed with exit code 0. |
| Full tests | `pnpm test` | passed | Reran after the audit-script fix; 33 files and 210 tests passed. Known warning: `OAUTH_SERVER_URL` is not configured in `server/seo.test.ts`. |
| Production build | `pnpm build` | passed | Reran after the audit-script fix; Vite and server esbuild completed with exit code 0. Largest JS gzip in final baseline: 130157 bytes. |
| Content audit | `pnpm content:audit` | passed | 14 markdown files, 9 seed posts, 3 warnings, 0 failures. Warnings are existing `content.shell_title_only` notices for `dfrope_blog_post.md`, `gated_ffn_blog.md`, and `isohc_blog.md`. |
| Publish freshness | `pnpm content:verify` | passed | `docs/product_optimization/reports/po-08-publish-freshness-latest.json`: 8 public posts, 142 chunks, 0 blockers. |
| UI audit | `pnpm audit:ui -- --output=docs/misaya_notes_ui_optimization_2026_06_18/reports/release-evidence/mnui-05-ui-layout-checks.json` | passed | 6 measured UI scenarios; all checks passed after the launcher selector was updated. |
| Route baseline | `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick -- --output=docs/misaya_notes_ui_optimization_2026_06_18/reports/release-evidence/mnui-05-baseline-quick.json` | passed | 14 route checks, 0 failures, 0 skipped routes, 4 known baseline warnings: missing robots, sitemap, RSS, and canonical URLs. |
| Harness validator | `python3 /Users/yang/.codex/skills/prd-phase-harness/scripts/validate_harness_prd.py docs/misaya_notes_ui_optimization_2026_06_18 --strict --quality-score` | passed | Harness validation passed with quality score 100 after MNUI-05 report and runtime updates. |

## Release Screenshot Index

Final screenshot directory: `docs/misaya_notes_ui_optimization_2026_06_18/reports/release-evidence/screenshots/`.

| Scenario | Route | Viewports | Result |
| --- | --- | --- | --- |
| Home | `/` | 1440x900, 1280x800, 768x1024, 390x844 | passed |
| Archive | `/archive` | 1440x900, 1280x800, 768x1024, 390x844 | passed |
| Search zero state | `/search?q=zzzz-no-hit-ui-audit` | 1440x900, 1280x800, 768x1024, 390x844 | passed |
| Post detail | `/post/goal-harness-agent-phase-protocol` | 1440x900, 1280x800, 768x1024, 390x844 | passed |
| Login | `/login` | 1440x900, 1280x800, 768x1024, 390x844 | passed |
| Manage guard | `/manage` | 1440x900, 1280x800, 768x1024, 390x844 | passed |
| Agent Ops guard | `/manage/agent` | 1440x900, 1280x800, 768x1024, 390x844 | passed |
| Blog Agent open on post | `/post/goal-harness-agent-phase-protocol` | 1440x900, 1280x800, 768x1024, 390x844 | passed |

Screenshot metrics summary: 32 screenshots, all HTTP 200, 0 console issues, 0 failed network requests, 0 document/body horizontal overflows, and 0 public Agent launchers visible on owner/login guard routes. The raw text-overflow heuristic produced non-blocking candidates mostly from nav line-height, tall containers, and intentional/clamped metadata; sampled screenshots did not show a release-blocking clipped-text issue.

## Agent Evidence

| Golden Row | Live Result | Automated Evidence | Decision |
| --- | --- | --- | --- |
| Article abstraction | blocked: runtime model credentials were not confirmed in the shell environment and secrets were not inspected. | `pnpm test` passed `server/ai/harness.test.ts`, `server/ai/model.test.ts`, `server/agent.router.test.ts`, `client/src/components/agent/BlogAgentRoot.test.ts`, and `client/src/components/agent/sourceCards.test.ts`. MNUI-03 also captured a live answer state with 3 source cards. | acceptable for local evidence; production live golden table remains blocked. |
| Next reading suggestion | blocked for live model table. | Agent harness tests cover reading-path intent and source-grounded answer routing. | acceptable with blocker. |
| Insufficient public corpus refusal | blocked for live model table. | Agent harness/model tests cover no-source refusal and unavailable-content paths without calling the model. | acceptable with blocker. |
| Current-page context | blocked for live model table. | Client and harness tests cover current-page context injection, route-aware opening, source-card filtering, and conversation-local pasted context separation. | acceptable with blocker. |

Live four-row Agent release evidence should be run only after model credentials are explicitly configured/approved. No `.env` file was opened and no secret values were printed.

## Design-Source Coverage Audit

| Design Source Group | Files Covered | How It Was Absorbed | Release Decision |
| --- | ---: | --- | --- |
| Manifest/root policy | 5 | `_ds_manifest.json`, `_adherence.oxlintrc.json`, root `SKILL.md`, `readme.md`, and `styles.css` were inventoried; manifest component/card/token coverage drove phase scope. | covered |
| Tokens | 4 | Color, typography, spacing, and font tokens informed MNUI-01 global aliases and final local-font policy. | covered |
| Guidelines | 13 | Brand, color, spacing, elevation, radius, and type cards were used to shape the dark cobalt, compact, low-glow, non-AI-looking UI language. | covered |
| Core/form components | 23 | Button, Badge, BrandMark, Card, SectionTitle, SignalChip, Tag, Avatar, Input, Textarea, and demo cards were mapped across MNUI-01 primitives, MNUI-03 Agent states, and MNUI-04 owner controls. | covered |
| UI kit | 8 | Misaya Notes shell/data/icons/screens/post/agent examples informed public IA, article/track grouping, and Blog Agent layout. | covered |
| Assets | 9 | Existing repo-local image assets mirror the design package article thumbs and hero image; no new remote or unlicensed asset source was introduced. | covered |
| Reference screenshots | 14 | Home, archive, search, post, Agent, mobile, type, kit, and manage screenshots were compared against phase screenshots and used to guide intentional deviations. | covered |
| Compiled bundle | 1 | `_ds_bundle.js` was treated as compiled demo support and not executed. | covered as untrusted non-source |
| Filesystem metadata | 2 | `.DS_Store` and `.thumbnail` were inventoried and ignored as design evidence. | covered as ignored metadata |

## Font, Network, Asset, And Copyright Notes

- Production font policy remains local/system font chains only for Misaya UI/Display/Reading. The design package `tokens/fonts.css` includes a Google Fonts fallback import, but no such import was introduced into product CSS.
- The final build includes local bundled KaTeX fonts already used by the app; no new remote font request was added by this UI optimization.
- Visual assets used by the optimized UI are repo-local files under `client/public/images/`: 6 article thumbnails and `research-orbit-hero.jpg`.
- No new external image asset, icon package, font package, or dependency was added.

## Accessibility Checklist

| Area | Evidence | Result |
| --- | --- | --- |
| Focus and keyboard | UI audit verifies Blog Agent dialog role/name/modal state, focus enters the panel, Escape closes it, and focus returns to launcher. Screenshot metrics captured visible focus outline after tabbing. | passed |
| Mobile layout | 390x844 and 768x1024 screenshots cover public, owner guard/login, and Agent-open states with no document/body horizontal overflow. | passed |
| Reduced motion | MNUI-01 screenshot evidence and final baseline `hasReducedMotionRule=true` preserve the reduced-motion rule. | passed |
| Form and action visibility | Login/guard screenshots show actions and inputs in stable dark surfaces; owner authenticated forms remain credential-blocked. | passed with limitation |
| Contrast | Visual review of sampled screenshots found no release-blocking contrast issue; no automated WCAG contrast audit was run in this phase. | manual evidence only |

## Privacy And Content-Boundary Checklist

- Public/owner route separation is preserved: final screenshots show no public Blog Agent launcher on `/login`, `/manage`, or `/manage/agent`.
- Owner routes were captured in unauthenticated guard state only; no admin table, draft body, token, session identifier, or private metadata appears in screenshots.
- `pnpm content:verify` reports 8 public posts, 1 non-public post excluded, sitemap/RSS/archive coverage OK, 142 Agent chunks, and no non-public indexed slugs.
- No secret values were printed; `.env*` files were not opened.
- No seed, publish, migration, production database mutation, deployment, DNS/provider change, or destructive git command was run.

## Known Gaps And Blockers

- Production deployment is not performed and remains explicitly approval-gated.
- Live Agent four-row model evaluation is blocked because runtime model credentials were not confirmed and secrets were not inspected. Automated Agent tests passed.
- Authenticated Manage, Editor, and Agent Ops internal layouts were not visually captured because the local session was unauthenticated. Guard/login states were captured and verified.
- Baseline SEO/static known gaps remain: missing `robots.txt`, `sitemap.xml`, `rss.xml`, and missing canonical URLs on checked HTML routes. These predate MNUI-05 and are not introduced by the UI optimization.
- `content:audit` has 3 non-failing shell-title-only warnings on existing markdown files.

## Feature Oracle Update

| Feature | Old Status | New Status | Evidence |
| --- | --- | --- | --- |
| MNUI-F006 | failing | passing | This report; `reports/release-evidence/mnui-05-ui-layout-checks.json`; `reports/release-evidence/mnui-05-baseline-quick.json`; `reports/release-evidence/screenshots/screenshot-metrics.json`; `docs/product_optimization/reports/po-08-publish-freshness-latest.json`. |

## Rollback Notes

If a later UI regression appears, revert phase-scoped visual changes before touching auth/server/data code. The only MNUI-05 code change is the audit selector in `scripts/audit/ui-layout.ts`; it can be reverted independently, but doing so would make `pnpm audit:ui` look for the old launcher name again. If a later approved deployment fails, use the documented Vercel rollback path in `docs/deployment.md`; do not force-push or rewrite history.

## Release Decision

Local release evidence for the UI optimization is complete and passing. The correct decision is: ready for code review/local handoff, not deployed. Production release requires a separate explicit user approval, plus optional live Agent golden-table evidence if model credentials are configured for that release check.

## Next Phase Handoff

There is no dependent implementation phase. A future deploy worker should start from this report, rerun the release gates against the target environment, run the live Agent golden table only with approved credentials, verify authenticated owner internals with an admin session, and verify the public production URL after deployment approval.
