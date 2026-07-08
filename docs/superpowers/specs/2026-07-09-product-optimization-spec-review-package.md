# Product Optimization Spec Review Package

Date: 2026-07-09
Status: Ready for owner review
Implementation status: Paused until owner approval
Scope: public UI, reading, Agent, owner cockpit, writing workflow, reader relationship, content quality, release gates

Latest owner-review entry:
[2026-07-09-product-optimization-final-spec-package.md](./2026-07-09-product-optimization-final-spec-package.md).

## How To Review

Read this file first. It is the current execution contract for the next product improvement program. The 2026-07-08 specs remain valid source modules, but this package updates the inventory after the completed 2026-07-09 implementation slices and adds the missing specs needed before more code work starts.

Recommended review order:

1. Parent product loop: [2026-07-08-reading-writing-loop-optimization-design.md](./2026-07-08-reading-writing-loop-optimization-design.md)
2. UI visual contract: [2026-07-08-ui-visual-contract-design.md](./2026-07-08-ui-visual-contract-design.md)
3. Discovery and research map: [2026-07-08-discovery-research-map-design.md](./2026-07-08-discovery-research-map-design.md)
4. Public i18n and bilingual reading: [2026-07-09-public-i18n-bilingual-reading-contract-design.md](./2026-07-09-public-i18n-bilingual-reading-contract-design.md)
5. Search relevance and aliases: [2026-07-09-search-relevance-alias-contract-design.md](./2026-07-09-search-relevance-alias-contract-design.md)
6. Reading continuity and route state: [2026-07-09-reading-continuity-route-state-design.md](./2026-07-09-reading-continuity-route-state-design.md)
7. Archive and taxonomy density: [2026-07-09-archive-taxonomy-density-filtering-design.md](./2026-07-09-archive-taxonomy-density-filtering-design.md)
8. Article reading and Markdown rendering: [2026-07-08-article-reading-rendering-design.md](./2026-07-08-article-reading-rendering-design.md)
9. Agent reading companion: [2026-07-08-agent-reading-companion-design.md](./2026-07-08-agent-reading-companion-design.md)
10. Agent quality operations: [2026-07-09-agent-quality-operations-design.md](./2026-07-09-agent-quality-operations-design.md)
11. Reader signal and owner cockpit: [2026-07-08-reader-signal-owner-cockpit-design.md](./2026-07-08-reader-signal-owner-cockpit-design.md)
12. ReaderSignal normalization and lifecycle: [2026-07-09-reader-signal-normalization-lifecycle-contract-design.md](./2026-07-09-reader-signal-normalization-lifecycle-contract-design.md)
13. Owner cockpit IA: [2026-07-09-owner-cockpit-ia-contract-design.md](./2026-07-09-owner-cockpit-ia-contract-design.md)
14. Owner writing and publish studio: [2026-07-09-owner-writing-publish-studio-design.md](./2026-07-09-owner-writing-publish-studio-design.md)
15. Publish freshness signal bridge: [2026-07-09-publish-freshness-signal-bridge-design.md](./2026-07-09-publish-freshness-signal-bridge-design.md)
16. Reader relationship and subscriptions: [2026-07-09-reader-relationship-subscription-design.md](./2026-07-09-reader-relationship-subscription-design.md)
17. Privacy and retention: [2026-07-09-privacy-retention-signal-data-contract-design.md](./2026-07-09-privacy-retention-signal-data-contract-design.md)
18. Content quality and writing style: [2026-07-08-content-quality-style-system-design.md](./2026-07-08-content-quality-style-system-design.md)
19. Performance, accessibility, and i18n gates: [2026-07-09-performance-accessibility-i18n-gates-design.md](./2026-07-09-performance-accessibility-i18n-gates-design.md)
20. Accessibility automation matrix: [2026-07-09-accessibility-automation-matrix-design.md](./2026-07-09-accessibility-automation-matrix-design.md)
21. Theme and language runtime: [2026-07-09-theme-language-runtime-contract-design.md](./2026-07-09-theme-language-runtime-contract-design.md)
22. Route contract sync: [2026-07-09-route-contract-sync-design.md](./2026-07-09-route-contract-sync-design.md)
23. Performance budget: [2026-07-09-performance-budget-design.md](./2026-07-09-performance-budget-design.md)
24. Design system component contract: [2026-07-09-design-system-component-contract-design.md](./2026-07-09-design-system-component-contract-design.md)
25. CSS ownership and style debt: [2026-07-09-css-ownership-style-debt-budget-design.md](./2026-07-09-css-ownership-style-debt-budget-design.md)
26. Test matrix ownership: [2026-07-09-test-matrix-ownership-design.md](./2026-07-09-test-matrix-ownership-design.md)
27. SEO and public distribution: [2026-07-09-seo-distribution-public-index-contract-design.md](./2026-07-09-seo-distribution-public-index-contract-design.md)
28. Production observability and runbook: [2026-07-09-production-observability-runbook-design.md](./2026-07-09-production-observability-runbook-design.md)
29. Admin auth and session boundary: [2026-07-09-admin-auth-session-boundary-design.md](./2026-07-09-admin-auth-session-boundary-design.md)
30. Data model and content operations: [2026-07-09-data-model-content-ops-contract-design.md](./2026-07-09-data-model-content-ops-contract-design.md)
31. Engineering release gates: [2026-07-08-engineering-release-gates-design.md](./2026-07-08-engineering-release-gates-design.md)
32. Release gate orchestration: [2026-07-09-release-gate-orchestration-design.md](./2026-07-09-release-gate-orchestration-design.md)
33. Completion crosswalk: [2026-07-09-product-optimization-spec-completion-crosswalk.md](./2026-07-09-product-optimization-spec-completion-crosswalk.md)

After approval, implementation can proceed without per-slice confirmation. Each slice must still be bounded, tested, reported, committed, and stopped before irreversible actions, schema migration, force push, credential handling, or deployment.

## Product Direction

The product should be:

> A personal AI systems research archive with a grounded reading assistant and a compact owner improvement cockpit.

This is not a generic AI SaaS redesign. The improvement loop is:

1. Readers understand the research map.
2. Readers can read dense technical articles without visual noise.
3. The Agent helps inside the reading task and stays source-grounded.
4. Weak searches, weak Agent answers, unclear writing, and stale publish state become owner tasks.
5. The owner can improve articles, republish, and verify that public discovery and Agent knowledge are fresh.

## Current Code Evidence

Observed current surfaces:

- Public routes in `client/src/App.tsx`: `/`, `/algorithms`, `/applications`, `/archive`, `/search`, `/tags/:slug`, `/categories/:slug`, `/about`, `/post/:slug`.
- Owner routes in `client/src/App.tsx`: `/write`, `/write/:slug`, `/manage`, `/manage/agent`.
- Global Agent: `client/src/components/agent/BlogAgentRoot.tsx`.
- Discovery and publish APIs: `server/routers.ts`, `server/discovery.ts`, `server/engagement.router.ts`.
- Agent APIs and persistence: `server/ai/router.ts`, `server/ai/conversations.ts`, `server/ai/harness.ts`, `server/ai/evals.ts`, `server/ai/streamRoute.ts`, `server/ai/knowledgeDb.ts`.
- Audit scripts: `scripts/audit/content-quality.ts`, `scripts/audit/publish-freshness.ts`, `scripts/audit/ui-layout.ts`, `scripts/audit/baseline.ts`.

Current branch state when this package was generated:

- Branch: `dev`.
- Already implemented slices include homepage research map, track reading paths, search/archive retrieval, article reading flow, Markdown rendering polish, content style audit foundations, Agent scroll policy, and Agent source summary extraction.
- Those slices are foundations, not the full optimization program.

## Spec Coverage

| Area | Status | Spec | Primary Decision |
| --- | --- | --- | --- |
| Visual design | Covered, partially implemented | UI visual contract | Calm editorial research notebook, no AI glow/dashboard styling. |
| Discovery | Covered, partially implemented | Discovery and research map | Home, tracks, search, archive, tags, and related content become a coherent map. |
| Search relevance | Newly added | Search relevance and aliases | Server search, client recovery, highlights, and search-miss signals share one concept model. |
| Bilingual UX | Newly added | Public i18n and bilingual reading | Runtime language, SEO language, Markdown-generated labels, and mobile label fit are explicit. |
| Route continuity | Newly added | Reading continuity and route state | List-to-article return, article deep links, completion links, and Agent route scope stay stable. |
| Archive/taxonomy | Newly added | Archive and taxonomy density | Archive and taxonomy become intentional retrieval surfaces with clear density and filter rules. |
| Article reading | Covered, partially implemented | Article reading and Markdown rendering | Publication-grade technical rendering, stable reading flow, mobile-safe primitives. |
| Agent companion | Covered, partially implemented | Agent reading companion | Answer first, sources collapsed, no final scroll jump, root split into smaller leaves. |
| Agent quality ops | Newly added | Agent quality operations | Make retrieval, evals, traces, citations, and reindex health operable by the owner. |
| Reader signals | Covered, next priority | Reader signal and owner cockpit | Normalize search misses, Agent gaps, feedback, audits, and freshness into backlog. |
| Signal lifecycle | Newly added | ReaderSignal normalization and lifecycle | Every signal kind has grouping, severity, status, redaction, and action semantics. |
| Owner IA | Newly added | Owner cockpit IA | `/manage`, `/manage/agent`, and `/write` have non-overlapping jobs. |
| Writing workflow | Newly added | Owner writing and publish studio | Connect backlog to drafts, preflight checks, metadata, versions, and knowledge refresh. |
| Publish bridge | Newly added | Publish freshness signal bridge | CLI freshness checks become owner-visible release readiness and signals. |
| Reader relationship | Newly added | Reader relationship and subscriptions | Make subscriptions and feedback honest, privacy-safe, and useful for backlog. |
| Privacy | Newly added | Privacy and retention | Private context, contact data, hidden content, screenshots, and reports have hard boundaries. |
| Content quality | Covered, partially implemented | Content quality and writing style | Detect vague claims, subjective filler, AI-ish phrasing, and structural issues. |
| Performance/a11y/i18n | Newly added | Performance, accessibility, and i18n gates | Prevent visual regressions across theme, language, zoom, keyboard, and route states. |
| Runtime contracts | Newly added | Theme/language, route sync, accessibility, performance, CSS, test matrix | Cross-cutting behavior is encoded as gates, not tribal knowledge. |
| System boundaries | Newly added | Design system, SEO distribution, observability, auth/session, data/content ops | Non-visual regressions are covered before implementation begins. |
| Engineering gates | Covered | Engineering release gates | Bounded commits, tests, reports, browser evidence, no broad rewrites. |
| Release orchestration | Newly added | Release gate orchestration | One local release contract records commands, failures, waivers, commit, and dirty state. |

## Execution Sequence After Approval

### Wave 0: Scope Freeze

Purpose: confirm that implementation starts from this package, not older partial plans.

Deliverables:

- Confirm `dev` branch and clean worktree.
- Add or update one plan under `docs/superpowers/plans/` for the first approved slice.
- Do not deploy.

Exit gates:

```bash
git status --short --branch
git diff --check
```

### Wave 1: Public UI And Discovery Completion

Specs:

- UI visual contract.
- Discovery and research map.
- Public i18n and bilingual reading.
- Search relevance and aliases.
- Archive and taxonomy density.
- Performance, accessibility, and i18n gates.
- Accessibility automation matrix.
- Theme and language runtime.
- CSS ownership and style debt.

Deliverables:

- Finish remaining public surface consistency across home, tracks, search, archive, taxonomy, about, and article entry.
- Remove remaining high-glare highlight patterns and accidental one-note palettes.
- Verify light and dark contrast with real screenshots.
- Keep all public text readable in Chinese and English.

Primary files:

- `client/src/pages/Home.tsx`
- `client/src/pages/Track.tsx`
- `client/src/pages/Search.tsx`
- `client/src/pages/Archive.tsx`
- `client/src/pages/TaxonomyPage.tsx`
- `client/src/pages/About.tsx`
- `client/src/components/ResearchShell.tsx`
- `client/src/components/ArticleCard.tsx`
- `client/src/styles/visual-refresh.css`
- `client/src/styles/public-components.css`
- `client/src/i18n/*`

Exit gates:

```bash
corepack pnpm test -- client/src/pages/Home.test.ts client/src/pages/Track.test.ts client/src/pages/Search.test.tsx client/src/pages/Archive.test.ts client/src/components/ResearchShell.test.tsx
corepack pnpm check
corepack pnpm audit:ui
corepack pnpm build
```

### Wave 2: Article Reading And Writing Quality

Specs:

- Article reading and Markdown rendering.
- Reading continuity and route state.
- Public i18n and bilingual reading.
- Content quality and writing style.
- Accessibility automation matrix.

Deliverables:

- Finish article entry hierarchy, article brief, continuation links, and rendering edge cases.
- Keep code, math, tables, figures, quotes, and callouts mobile-safe.
- Expand content audit where precision is high; keep style warnings non-blocking by default.

Primary files:

- `client/src/pages/PostDetail.tsx`
- `client/src/components/MarkdownRenderer.tsx`
- `client/src/components/SeriesProgress.tsx`
- `client/src/components/ArticleFeedback.tsx`
- `scripts/audit/content-quality.ts`
- `scripts/audit/content-quality.test.ts`
- `seed-blog.mjs`

Exit gates:

```bash
corepack pnpm test -- client/src/pages/PostDetail.test.ts client/src/components/MarkdownRenderer.test.tsx client/src/components/SeriesProgress.test.tsx scripts/audit/content-quality.test.ts
corepack pnpm content:audit
corepack pnpm check
corepack pnpm audit:ui
corepack pnpm build
```

### Wave 3: Agent Companion Completion

Specs:

- Agent reading companion.
- Privacy and retention.
- Performance, accessibility, and i18n gates.
- Accessibility automation matrix.
- Theme and language runtime.
- CSS ownership and style debt.

Deliverables:

- Extract remaining Agent leaf components without changing stream contracts.
- Add UI fixtures for long answer, many sources, no sources, private context, mobile sheet, and resize.
- Keep final answer visible after completion and sources collapsed by default.
- Preserve elapsed time semantics.

Primary files:

- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/components/agent/*`
- `client/src/styles/agent-surfaces.css`
- `client/src/i18n/agent.ts`

Exit gates:

```bash
corepack pnpm test -- client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/sourceCards.test.ts
corepack pnpm check
corepack pnpm audit:ui
corepack pnpm build
```

### Wave 4: Agent Quality Operations

Specs:

- Agent quality operations.
- Reader signal and owner cockpit.
- ReaderSignal normalization and lifecycle.
- Privacy and retention.

Deliverables:

- Add deterministic answer-quality dimensions around grounding, scope, refusal, citation usefulness, and collapsed readability.
- Normalize zero-source, failed, low-confidence, and refusal runs into owner-readable signals.
- Make `/manage/agent` first show quality state and next actions; keep raw traces/debug behind advanced sections.

Primary files:

- `server/ai/evals.ts`
- `server/ai/harness.ts`
- `server/ai/router.ts`
- `server/ai/conversations.ts`
- `server/readerSignals.ts`
- `client/src/pages/ManageAgent.tsx`
- `client/src/i18n/agentOps.ts`

Exit gates:

```bash
corepack pnpm test -- server/ai/harness.test.ts server/ai/streamRoute.test.ts server/agent.router.test.ts server/readerSignals.test.ts
corepack pnpm check
corepack pnpm build
```

### Wave 5: Owner Cockpit And Writing Studio

Specs:

- Reader signal and owner cockpit.
- ReaderSignal normalization and lifecycle.
- Owner cockpit IA.
- Owner writing and publish studio.
- Publish freshness signal bridge.
- Privacy and retention.
- Content quality and writing style.

Deliverables:

- Unify writing backlog across feedback, search misses, Agent questions, content audit, and publish freshness.
- Open editor from backlog with safe prefilled intent.
- Add publish preflight state and knowledge refresh outcome visibility.
- Keep this owner-only and avoid schema migration unless separately reviewed.

Primary files:

- `server/engagement.router.ts`
- `server/readerSignals.ts`
- `client/src/pages/Manage.tsx`
- `client/src/pages/ManageAgent.tsx`
- `client/src/pages/Editor.tsx`
- `scripts/audit/publish-freshness.ts`

Exit gates:

```bash
corepack pnpm test -- server/engagement.router.test.ts server/readerSignals.test.ts server/discovery.router.test.ts client/src/pages/PostDetail.test.ts
corepack pnpm content:audit
corepack pnpm check
corepack pnpm build
```

### Wave 6: Reader Relationship Loop

Specs:

- Reader relationship and subscriptions.
- Reader signal and owner cockpit.
- ReaderSignal normalization and lifecycle.
- Privacy and retention.

Deliverables:

- Make subscription and feedback UX honest about what is stored, what is optional, and what happens next.
- Keep feedback compact on article pages.
- Preserve rate limits and privacy redaction.
- Turn topic interests and repeated feedback into owner-readable signals.

Primary files:

- `client/src/components/SubscriptionForm.tsx`
- `client/src/components/ArticleFeedback.tsx`
- `client/src/pages/Manage.tsx`
- `server/engagement.router.ts`
- `client/src/i18n/common.ts`

Exit gates:

```bash
corepack pnpm test -- server/engagement.router.test.ts client/src/pages/PostDetail.test.ts
corepack pnpm check
corepack pnpm audit:ui
corepack pnpm build
```

### Wave 7: Final Release Readiness

Specs:

- Engineering release gates.
- Performance, accessibility, and i18n gates.
- Route contract sync.
- Theme and language runtime.
- Accessibility automation matrix.
- Performance budget.
- CSS ownership and style debt.
- Test matrix ownership.
- Release gate orchestration.

Deliverables:

- Full validation report.
- Browser screenshot evidence for public, article, Agent, and owner routes.
- Content freshness report.
- No deployment unless explicitly approved.

Exit gates:

```bash
corepack pnpm check
corepack pnpm test
corepack pnpm content:audit
corepack pnpm content:verify
corepack pnpm build
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui
```

## Non-Negotiable Guardrails

- Do not leak hidden, draft, private, or admin-only content to public routes, RSS, sitemap, search, or Agent sources.
- Do not print, commit, paste, or document credentials.
- Do not add dependencies without a written reason.
- Do not rewrite global CSS wholesale.
- Do not combine Agent stream-state rewrites with visual extraction in one commit.
- Do not make style warnings block publish until warning precision is reviewed.
- Do not deploy without explicit owner approval.
- Do not mark the overall product goal complete after a single slice.

## Evidence Requirements

Every implementation slice must add a report under `docs/product_optimization/reports/` with:

- Changed files.
- User-visible behavior.
- Screenshots or browser audit output when UI changed.
- Validation commands and results.
- Known risks or deferred work.

Minimum screenshot matrix for UI slices:

- Home desktop and mobile.
- Track desktop and mobile.
- Search result and zero-result states.
- Article desktop and mobile.
- Agent open with long answer and sources.
- Owner cockpit route.
- Light and dark mode for at least one public page and the Agent.

## Review Checklist

- The direction feels like a personal AI research archive, not generic AI SaaS.
- UI specs reduce glare, glow, cramped layout, and one-note palettes.
- Article specs preserve technical depth while improving scanning and rendering.
- Agent specs make answers readable first and sources verifiable second.
- Owner specs turn real reader/Agent signals into actionable writing work.
- Writing specs reduce awkward AI-ish wording without over-policing style.
- Subscription specs are honest about current product capability.
- Release specs are strict enough to prevent unverified visual changes.

## Approval Prompt

Use this after owner review if the package is approved:

```text
Implement the product optimization package for /Users/yang/projects/ai-tech-blog from docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md. Work on dev. Do not ask for per-slice confirmation. Execute the waves in order, keep each slice bounded, write evidence reports, run the listed gates, commit each slice, and stop only for irreversible actions, credential issues, schema migrations, force pushes, or deploys.
```
