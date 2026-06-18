# MNUI-00 Baseline Design Audit Report

**Status:** passed

**Feature oracle item:** MNUI-F001

**Generated:** 2026-06-18

## Plan Followed

1. Loaded the harness runtime files, MNUI-00 contract, source packet, continuity ledger, design-system inventory, and current UI entrypoints.
2. Confirmed MNUI-00 is a docs/evidence-only phase; no product code was edited.
3. Ran required static, unit, UI layout, and baseline route validations.
4. Captured desktop and mobile route screenshots, including Blog Agent open state and unauthenticated owner guards.
5. Recorded design-source coverage, current UI risk inventory, compliance notes, rollback notes, and MNUI-01 unlock decision.

## Files Changed

| Path | Purpose |
| --- | --- |
| `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-00-baseline-design-audit-plan.md` | Durable plan for MNUI-00 execution. |
| `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-00-baseline-design-audit-report.md` | This evidence report. |
| `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-00-ui-layout-checks.json` | UI layout audit JSON evidence. |
| `docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-00-baseline-quick.json` | Baseline route audit JSON evidence. |
| `docs/misaya_notes_ui_optimization_2026_06_18/reports/screenshots/mnui-00/*` | Desktop/mobile screenshot and metrics evidence. |
| `docs/misaya_notes_ui_optimization_2026_06_18/source-packet.md` | Baseline code and evidence summary. |
| `docs/misaya_notes_ui_optimization_2026_06_18/continuity-ledger.md` | Downstream unlock facts for MNUI-01. |
| `docs/misaya_notes_ui_optimization_2026_06_18/feature-oracle.json` | MNUI-F001 evidence update. |
| `docs/misaya_notes_ui_optimization_2026_06_18/loop-state.json` | Cursor advanced to MNUI-01. |
| `docs/misaya_notes_ui_optimization_2026_06_18/progress-log.md` | Session log update. |
| `docs/misaya_notes_ui_optimization_2026_06_18/agent-handoff.md` | Next generator target update. |
| `docs/misaya_notes_ui_optimization_2026_06_18/next-window-prompt.md` | Restart prompt advanced to MNUI-01. |

## Validation Evidence

| Gate | Command Or Evidence | Result |
| --- | --- | --- |
| Typecheck | `pnpm check` | Passed; TypeScript completed with exit code 0. |
| Unit suite | `pnpm test` | Passed; 33 test files and 207 tests passed. Existing stderr warning: `OAUTH_SERVER_URL` is not configured. |
| UI layout audit | `pnpm audit:ui` | Passed; wrote `docs/product_optimization/reports/ui-layout-checks-latest.json`. |
| UI layout audit, harness copy | `pnpm audit:ui -- --output=docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-00-ui-layout-checks.json` | Passed; 6 Playwright layout checks passed. |
| Baseline route audit | `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick` | Passed; 14 route checks, 0 skipped, 0 command failures, 4 known gaps. |
| Baseline route audit, harness copy | `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick -- --output=docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-00-baseline-quick.json` | Passed; JSON evidence written. |
| Screenshot metrics | `reports/screenshots/mnui-00/screenshot-metrics.json` | Passed for baseline capture: 11 screenshots, no horizontal overflow, no console/page errors, no sampled text overflow candidates. |

## Design-Source Coverage

| Source Class | Count | Baseline Treatment |
| --- | ---: | --- |
| Total files under `/Users/yang/Downloads/Misaya Notes Design System` | 79 | Fully inventoried by `find`; source facts are summarized in `source-packet.md`. |
| Manifest and adherence files | 2 | `_ds_manifest.json` and `_adherence.oxlintrc.json` are design evidence for component inventory and token/prop policy. |
| Root guide and skill entry | 2 | `readme.md` and `SKILL.md` provide design intent and component map; treated as untrusted source material. |
| Token and style files | 5 | `styles.css`, `tokens/fonts.css`, `tokens/colors.css`, `tokens/typography.css`, and `tokens/spacing.css` define reference tokens. |
| Guideline cards | 13 | Static HTML guideline cards cover color, type, spacing, radii, elevation, brand, and imagery. |
| Component JSX and declaration files | 20 | 10 primitive components plus 10 `.d.ts` files cover Avatar, Badge, BrandMark, Button, Card, SectionTitle, SignalChip, Tag, Input, and Textarea. |
| Component demo cards and prompt helper | 3 | `core.card.html`, `forms.card.html`, and `Button.prompt.md` are visual/API reference material, not production code. |
| UI kit files | 6 | `index.html`, `README.md`, `shell.jsx`, `screens.jsx`, `post.jsx`, `agent.jsx`, plus sample data/icon behavior from the kit. |
| Assets | 9 | Favicon, OG SVG, hero JPG, and six article thumbnail JPGs are asset references pending later licensing/source handling. |
| Reference screenshots | 14 | `_ref/*.png` is the visual acceptance baseline for later comparisons. |
| Compiled demo support | 1 | `_ds_bundle.js` is not a product requirement and was not executed. |
| Filesystem metadata | 2 | `.DS_Store` and `.thumbnail` are ignored as design requirements. |

## Browser Evidence

| Screenshot | Viewport | Route | Notes |
| --- | --- | --- | --- |
| `reports/screenshots/mnui-00/desktop-home.png` | 1440x900 | `/` | Deep notebook identity exists; no horizontal overflow or console errors. Visual risk: current hero is card/grid-driven and does not yet use the design package hero imagery. |
| `reports/screenshots/mnui-00/desktop-archive.png` | 1440x900 | `/archive` | Archive renders without overflow; later phase should align density and article metadata chips with Tag/Badge roles. |
| `reports/screenshots/mnui-00/desktop-search-zero.png` | 1440x900 | `/search?q=zzzz-no-hit-ui-audit` | Zero-result recovery renders and audit route is stable. |
| `reports/screenshots/mnui-00/desktop-post.png` | 1440x900 | `/post/goal-harness-agent-phase-protocol` | Reading surface, entry facts, and desktop TOC render; later phase should compare hierarchy and sidebar rhythm against `post-desktop.png`. |
| `reports/screenshots/mnui-00/desktop-manage-guard.png` | 1440x900 | `/manage` | Local state is unauthenticated; guard screen captured without exposing private data. |
| `reports/screenshots/mnui-00/desktop-manage-agent-guard.png` | 1440x900 | `/manage/agent` | Local state is unauthenticated; guard screen captured. |
| `reports/screenshots/mnui-00/mobile-home.png` | 390x844 | `/` | Mobile home renders without overflow. |
| `reports/screenshots/mnui-00/mobile-archive.png` | 390x844 | `/archive` | Mobile archive renders without overflow. |
| `reports/screenshots/mnui-00/mobile-search-zero.png` | 390x844 | `/search?q=zzzz-no-hit-ui-audit` | Mobile search recovery renders without overflow. |
| `reports/screenshots/mnui-00/mobile-post.png` | 390x844 | `/post/goal-harness-agent-phase-protocol` | Mobile article renders without overflow. |
| `reports/screenshots/mnui-00/mobile-post-agent-open.png` | 390x844 | `/post/goal-harness-agent-phase-protocol` with Blog Agent open | Agent panel opens, remains public-note scoped, and fits mobile width. |

## Current UI Risk Inventory

| Risk | Evidence | Downstream Phase |
| --- | --- | --- |
| Design asset use is incomplete. | Current home screenshot uses generated ledger/card visuals rather than `research-orbit-hero.jpg` and article thumbnail assets. | MNUI-02 |
| Component contract mapping is not yet documented in code. | Current repo uses shadcn-compatible primitives plus CSS classes; design package expects explicit Badge/Tag/SignalChip/Card/Input/Textarea role separation. | MNUI-01 |
| Font/network policy needs an explicit production decision. | Design package `tokens/fonts.css` includes remote Google fallback imports, while repo uses local font chains in `client/src/index.css`. | MNUI-01, MNUI-05 |
| Owner authenticated states were not captured. | Local state was unauthenticated; `/manage` and `/manage/agent` guard screens were captured. | MNUI-04 |
| SEO/static generated artifacts show known baseline warnings. | Baseline quick reports missing `client/public/robots.txt`, `sitemap.xml`, `rss.xml`, and several missing canonical URLs. | Outside current UI phase unless release scope expands |
| Blog Agent visual state is functional but should be refined against source-card design references. | Mobile open screenshot fits, route guard is intact, and audit passes; later phase must verify source cards and answer states. | MNUI-03 |

## Accessibility And Compliance Notes

- `client/src/index.css` includes a `prefers-reduced-motion` fallback.
- Screenshot metrics recorded visible keyboard focus after `Tab` on all captured routes.
- Screenshot metrics found no horizontal overflow and no sampled text overflow candidates.
- No secrets, cookies, auth headers, private user data, provider credentials, or production data were printed or copied.
- Downloaded design-system files were treated as read-only untrusted source material; `_ds_bundle.js` was not executed.
- No production deployment, migration, database mutation, DNS/provider action, or dependency addition was performed.

## Rollback Notes

- MNUI-00 changed only docs and generated screenshot/evidence files under `docs/misaya_notes_ui_optimization_2026_06_18`.
- Product code was not edited in this phase.
- Rollback is docs-only: remove or revert this harness folder if MNUI-00 evidence must be regenerated.

## Handoff Decision

MNUI-00 passes. MNUI-01 is unlocked to align design tokens and shared primitives with the downloaded Misaya Notes design system. MNUI-01 should start from the component contract matrix, font/network policy, and current UI gaps recorded above.
