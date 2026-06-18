# Continuity Ledger - Misaya Notes UI Optimization Harness

**Created:** 2026-06-18

**Docs Path:** `docs/misaya_notes_ui_optimization_2026_06_18`

## Phase Chain

| Phase | Feature | Depends On | Unlocks | Boundary To Preserve | Required Handoff |
| --- | --- | --- | --- | --- | --- |
| MNUI-00 | MNUI-F001 | none | MNUI-01 | A named baseline of design facts, code entrypoints, visual risk inventory, and validation commands that all later phases must cite. | Baseline report, screenshot inventory, updated source packet, updated continuity ledger, progress-log entry, and next generator target MNUI-01. |
| MNUI-01 | MNUI-F002 | MNUI-00 | MNUI-02 | A stable token and primitive layer for later public page, Agent, and owner-tool phases. | Token decisions, primitive changes, browser evidence, and unresolved page-level visual debt recorded for MNUI-02. |
| MNUI-02 | MNUI-F003 | MNUI-01 | MNUI-03 | Public reader behavior and visual states that MNUI-03 Agent companion must attach to without obscuring content. | Reader route screenshots, public-content boundary facts, and route-context implications for the Blog Agent phase. |
| MNUI-03 | MNUI-F004 | MNUI-02 | MNUI-04 | A source-backed public companion that MNUI-04 owner tools can manage without exposing private or draft content. | Agent trust-surface screenshots, golden question table, source-boundary notes, and any owner-tool needs for MNUI-04. |
| MNUI-04 | MNUI-F005 | MNUI-03 | MNUI-05 | Owner UI polish that does not weaken auth boundaries and leaves release gates ready for MNUI-05. | Owner state evidence, auth boundary summary, data-mutation notes, and remaining release blockers for MNUI-05. |
| MNUI-05 | MNUI-F006 | MNUI-04 | none | A verified local release packet that can be followed by a separate deploy request without hidden context. | Final release report, evidence index, oracle status summary, and explicit deploy/no-deploy recommendation. |

## Interface Decisions

- Keep route slugs and public URL structure stable unless a future report records an explicit SEO migration approval.
- Keep the existing React/Vite/Tailwind/shadcn/lucide stack; no dependency addition belongs to this plan.
- Keep the design system dark-cobalt identity but preserve light theme variables where the code already exposes them.
- Keep Blog Agent public scope tied to published notes and current route context; hidden/draft/admin content remains outside public sources.
- Keep owner surfaces visually aligned but operationally distinct from public reader pages.
- Treat the design package as fully inventoried source material: manifest, adherence policy, tokens, guidelines, components, demos, UI kit, assets, and screenshots must be referenced by at least one phase report.
- Treat `_ds_bundle.js` as compiled demo support, not a source of product requirements.
- Treat `.DS_Store` and `.thumbnail` as filesystem metadata, not design evidence.
- Treat the design package's Google font import as a prototype/default fallback; production font loading must be explicitly decided and recorded.

## Code Summary Writeback Ledger

Phase runners must append discovered facts here:

- Files inspected and changed.
- Component, CSS, route, Agent, auth, or content-boundary contracts preserved.
- Validation commands run and result status.
- Browser screenshot paths and viewport notes.
- Downstream impacts for the next phase.

### MNUI-00 Baseline Design Audit - 2026-06-18

- Status: passed.
- Files inspected: harness runtime files; `source-packet.md`; `continuity-ledger.md`; `phase-00-baseline-design-audit.md`; package scripts; `client/src/index.css`; `client/src/styles/visual-refresh.css`; `client/src/components/ResearchShell.tsx`; `client/src/pages/Home.tsx`; `client/src/pages/PostDetail.tsx`; `client/src/components/agent/BlogAgentRoot.tsx`; downloaded design-system manifest, adherence policy, root guide, skill entry, tokens, guidelines, components, UI kit files, assets, and screenshots.
- Product code changed: none.
- Evidence files: `reports/mnui-00-baseline-design-audit-report.md`, `reports/mnui-00-baseline-quick.json`, `reports/mnui-00-ui-layout-checks.json`, and `reports/screenshots/mnui-00/screenshot-metrics.json`.
- Validation: `pnpm check` passed; `pnpm test` passed with 33 files and 207 tests plus known `OAUTH_SERVER_URL` warning; `pnpm audit:ui` passed; `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick` passed with 14 route checks and 0 route failures.
- Browser evidence: 11 desktop/mobile screenshots captured; metrics found no horizontal overflow, no console/page errors, no sampled text overflow candidates, and visible keyboard focus after tabbing.
- Interface boundaries preserved: public route slugs, owner auth guard, Blog Agent hidden-route guard, local font-chain policy pending MNUI-01, no dependency addition, no production data mutation, and no deployment.
- MNUI-01 unlock facts: design-source coverage is complete enough for token/component work; current UI already has a dark cobalt foundation but lacks explicit component contract mapping, final font/network policy, and page-level asset alignment.

### MNUI-01 Design Tokens And Shared Primitives - 2026-06-18

- Status: passed.
- Files changed: `client/src/index.css`, `client/src/styles/visual-refresh.css`, `client/src/styles/public-components.css`, `client/src/components/ResearchShell.tsx`, `client/src/components/ui/button.tsx`, `client/src/components/ui/card.tsx`, `client/src/components/ui/input.tsx`, `client/src/components/ui/textarea.tsx`, `client/src/components/ui/badge.tsx`, `client/src/components/ui/avatar.tsx`, and MNUI-01 report/runtime docs.
- Boundary expansion: `client/src/styles/public-components.css` was edited because it owns the base `.brand-mark` size; this keeps the additive BrandMark `size` prop stable across CSS layers.
- Component contracts preserved: existing Button, Card, Badge, Input, Textarea, Avatar, and ResearchShell exports remain; additions are additive only (`Button` glass variant, `Badge` accent variant, `Input` icon props, `BrandMark` size/withWordmark props).
- Font/network contract: production keeps local/system font chains only; no Google font import or new network dependency was introduced.
- Validation: `pnpm check` passed; targeted UI Vitest passed with 3 files and 9 tests; `pnpm build` passed; `pnpm audit:ui` passed with MNUI-01 output JSON.
- Browser evidence: `reports/screenshots/mnui-01/` contains desktop/mobile Home, Archive, Search, and reduced-motion screenshots plus metrics showing no overflow, no console/page errors, no sampled text overflow, and reduced-motion support.
- MNUI-02 unlock facts: token and primitive foundation is stable enough for page-level reader IA and responsive surface work; page-level assets/thumbnails/reader hierarchy remain intentionally deferred.

### MNUI-02 Public Reader IA And Responsive Surfaces - 2026-06-18

- Status: passed.
- Files changed: `client/src/styles/visual-refresh.css`, `client/src/pages/Archive.tsx`, `client/src/pages/Search.tsx`, and MNUI-02 report/runtime docs.
- Reader contracts preserved: public route slugs, article data model, content freshness behavior, published-content filtering, SEO metadata behavior, PostDetail reader hierarchy, Track routes, and Blog Agent backend behavior remain unchanged.
- Design-system mapping: Home uses the local `research-orbit-hero.jpg` asset as an unframed notebook background signal; Archive and Search use shared `article-tag` pills for compact metadata scanning; Track and Post evidence remained stable without code changes.
- Validation: `pnpm check` passed; reader Vitest passed with 4 files and 12 tests; `pnpm content:audit` passed with 0 failures and known shell-title warnings; `pnpm build` passed; route baseline passed with MNUI-02 output JSON.
- Browser evidence: `reports/screenshots/mnui-02/` contains desktop/mobile Home, Search, Post plus desktop Archive, Algorithms, and Applications screenshots. Metrics show HTTP 200 for all routes, no horizontal overflow, no console/page errors, no sampled text overflow, and no explicit unpublished UI signals.
- MNUI-03 unlock facts: public reader surfaces now have stable desktop and mobile attachment evidence for Blog Agent launcher, route-aware prompt, source-card, and mobile panel checks.

### MNUI-03 Blog Agent And Trust Surface - 2026-06-18

- Status: passed.
- Files changed: `client/src/components/agent/BlogAgentRoot.tsx`, `client/src/styles/agent-surfaces.css`, `client/src/i18n/agent.ts`, `client/src/components/agent/BlogAgentRoot.test.ts`, `client/src/components/agent/sourceCards.test.ts`, and MNUI-03 report/runtime docs.
- Agent contracts preserved: stream API, model/retrieval behavior, quota behavior, private context lifecycle, source-card link semantics, auth behavior, owner route access, schemas, dependencies, and provider configuration remain unchanged.
- Design-system mapping: launcher/header now use `Blog Agent`; panel includes public-note trust copy; source cards have a stronger cited-source hierarchy; panel is opaque enough to avoid background text bleed while retaining dark cobalt glass borders.
- Validation: `pnpm check` passed; Agent Vitest passed with 5 files and 68 tests; `pnpm build` passed; route baseline passed with MNUI-03 output JSON.
- Browser evidence: `reports/screenshots/mnui-03/` contains desktop/mobile public Agent screenshots, a live answer state with 3 source cards, and owner/auth hidden-route screenshots. Metrics show no overflow, no console/page errors, and correct public/owner visibility.
- MNUI-04 unlock facts: owner UI work can proceed with tested public Agent hidden-route behavior and a clear separation between public companion UI and owner Agent Ops diagnostics.

### MNUI-04 Owner Tools And System States - 2026-06-18

- Status: passed.
- Files changed: `client/src/styles/owner-tools.css` and MNUI-04 report/runtime docs.
- Owner contracts preserved: auth/session behavior, server procedures, tRPC admin routes, schema, seed data, public article content, public navigation, public Blog Agent route guard, dependencies, and deployment configuration remain unchanged.
- Design-system mapping: owner panels/guards/login cards map to `core.card.html`; owner buttons map to `Button.jsx`; owner state labels preserve existing badge contracts; owner inputs/textareas/comboboxes map to `forms.card.html`, `Input.jsx`, and `Textarea.jsx`; owner density follows `_ref/manage-desktop.png`.
- Validation: `pnpm check` passed; owner-adjacent Vitest passed with 3 files and 6 tests; `pnpm build` passed; route baseline passed with MNUI-04 output JSON, 14 checked routes, 0 failed routes, 0 skipped routes, and 4 known baseline warnings.
- Browser evidence: `reports/screenshots/mnui-04/` contains desktop/mobile `/manage`, `/write`, `/manage/agent`, and `/login` guard/login screenshots. Metrics show HTTP 200, no horizontal overflow, no console issues, no sampled text overflow, visible focus outline, and public Agent hidden on owner/auth routes.
- Auth limitation: local session was unauthenticated, so authenticated owner internals were not visually captured. Guard/login evidence is valid for MNUI-04; MNUI-05 must carry this limitation into its release decision.
- MNUI-05 unlock facts: available owner guard/login states are stable enough for final local release evidence; deployment, migration, production mutation, provider work, and destructive git operations remain approval-gated.

### MNUI-05 Release Evidence And Design Regression Gates - 2026-06-18

- Status: passed.
- Files changed: `scripts/audit/ui-layout.ts` and MNUI-05 report/runtime docs plus generated release-evidence artifacts.
- Audit contract update: `pnpm audit:ui` now recognizes `Blog Agent` as the current launcher accessible name while keeping `阅读助手` and `Reader` as compatible labels.
- Product contracts preserved: no user-facing React component, auth/session behavior, server route, schema, seed data, public content, provider config, dependency list, database operation, deployment target, or DNS/provider setting changed in MNUI-05.
- Final validation: `pnpm check` passed; `pnpm test` passed with 33 files and 210 tests plus the known OAuth warning; `pnpm build` passed; `pnpm content:audit` passed with 0 failures; `pnpm content:verify` passed with 8 public posts, 142 chunks, and 0 blockers; `pnpm audit:ui` passed; final route baseline passed with 14 route checks, 0 failures, 0 skipped routes, 4 known baseline warnings, and largest JS gzip 130157 bytes.
- Browser evidence: `reports/release-evidence/screenshots/` contains 32 final screenshots and metrics for Home, Archive, Search zero state, Post, Login, Manage guard, Agent Ops guard, and Blog Agent open on post across 1440x900, 1280x800, 768x1024, and 390x844. Metrics show HTTP 200, 0 console issues, 0 failed network requests, 0 document/body horizontal overflows, and no public Agent launcher on owner/login guard routes.
- Design-source coverage: final report covers all 79 downloaded design-package files and records local-font-only network policy, asset-source policy, unexecuted compiled bundle handling, and metadata-ignore handling.
- Release decision: ready for code review/local handoff; not deployed. Production deploy requires explicit approval and target verification. Live Agent four-row evaluation and authenticated owner internals remain follow-up evidence items requiring approved credentials/admin session.

### Post-Review Risk Resolution And Deploy Readiness - 2026-06-18

- Status: passed final local post-review gates; deployment pending commit, push, Vercel deploy, and public verification.
- Files changed: `server/client-render.ts`, `server/client-render.test.ts`, `scripts/audit/baseline.ts`, `scripts/audit/baseline.test.ts`, `client/src/styles/owner-tools.css`, `dfrope_blog_post.md`, `gated_ffn_blog.md`, `isohc_blog.md`, plus post-review report/evidence docs.
- Risk resolution facts: known SPA routes now receive canonical/OG metadata before hydration; owner/write/login routes stay noindex; generated robots/sitemap/RSS routes no longer require duplicate static files when HTTP checks are healthy; route checks run sequentially to avoid local RSS timeout flakes; content audit shell-title warnings are fixed with matching H1s; owner `.glass-button` styles are scoped to owner/login/editor/AgentOps/auth-guard containers.
- Validation facts: targeted post-review Vitest passed; final `pnpm check` passed; final `pnpm test` passed with 33 files and 213 tests; final `pnpm build` passed; final `pnpm content:audit` passed with 0 warnings and 0 failures; final `pnpm content:verify` passed with 8 public posts, 1 non-public post excluded, 142 Agent chunks, and 0 blockers; final `pnpm audit:ui` passed; final route baseline passed with 14 checked routes, 0 route failures, and 0 known gaps; strict harness validation passed with quality score 100.
- Browser evidence: `reports/release-evidence/post-review-screenshots/` contains 32 screenshots across Home, Archive, Search zero state, Post, Login, Manage guard, Agent Ops guard, and Blog Agent-open post states. Metrics show 0 non-200 responses, 0 console issues, 0 failed network requests, 0 horizontal overflow, and 0 public Agent launchers on owner/login guard routes.
- Remaining limitations: live four-row Agent model evaluation needs approved model credentials; authenticated owner internals need an admin session. These are evidence limitations, not blockers for deploying the public UI/static/metadata risk fixes.

## Dependency Unlock Rules

- MNUI-01 unlocks only after MNUI-00 records baseline facts, screenshot inventory or blocker notes, and validation commands.
- MNUI-02 unlocks only after token and primitive changes pass typecheck/build/browser foundation checks and the component contract matrix covers all registered primitives.
- MNUI-03 unlocks only after public reader screenshots prove Agent attachment points are stable and shell/data/icon/asset facts are accounted for.
- MNUI-04 unlocks only after Agent source-boundary, source-card, and route-guard evidence exists.
- MNUI-05 unlocks only after owner route evidence or authenticated-state blockers are documented.
- Production deploy is unlocked only for the current user-requested release after final local gates, commit, push, Vercel production deploy, and public target verification.

## Open Questions For Phase Runners

- Whether local auth state is available for owner-route screenshots.
- Whether live Agent provider credentials are configured; if absent, use tests and blocker notes for live eval.
- Whether existing user diffs touch the same files; preserve them and document conflicts before editing.
