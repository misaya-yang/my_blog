# Product Optimization Final Spec Package

Date: 2026-07-09
Status: Ready for owner review
Implementation status: Paused until owner approval
Branch: dev

## Design Read

Reading this as a personal AI systems research archive for technical readers and the author-owner, with a calm editorial research notebook language. The target is not a generic AI SaaS dashboard, marketing landing page, or decorative glass demo. The product should feel authored, source-grounded, readable, and operationally trustworthy.

Recommended dials:

- Design variance: 5/10. Use editorial rhythm and restrained asymmetry, not spectacle.
- Motion intensity: 3/10. Prefer state clarity and subtle transitions.
- Visual density: 4/10 on public reading surfaces, 6/10 on owner tools.

## Purpose

This file is the single owner-review entry point before the next implementation pass. It consolidates the existing product optimization specs, the completed implementation slices, and the remaining work into reviewable execution specs. After owner approval, implementation can proceed without per-slice confirmation, but each slice must stay bounded, tested, reported, and committed.

## Current Evidence

Current product evidence:

- `PRODUCT.md` defines the product as a calm, technical, precise personal AI systems research archive.
- `client/src/App.tsx` exposes public routes for home, tracks, archive, search, taxonomy, about, and post detail, plus owner routes for write/manage/manage-agent.
- `client/src/components/agent/BlogAgentRoot.tsx` has already been partially decomposed, but remains a 747-line orchestration component.
- `client/src/pages/PostDetail.tsx`, `client/src/pages/Manage.tsx`, and `client/src/pages/Editor.tsx` remain large aggregate files and should be split only along active feature boundaries.
- `client/src/styles/index.css`, `visual-refresh.css`, `public-components.css`, `liquid-materials.css`, `owner-tools.css`, and `agent-surfaces.css` are the active style ownership surface.
- `scripts/audit/content-quality.ts`, `scripts/audit/publish-freshness.ts`, `scripts/audit/ui-layout.ts`, and `scripts/release/check.ts` are the current release-quality hooks.
- `server/ai/*`, `server/engagement.router.ts`, and `server/readerSignals.ts` already provide the foundations for Agent, feedback, search miss, reader signal, and owner backlog work.
- `client/src/pages/Editor.tsx` currently seeds safe backlog intent into a lightweight heading scaffold. This package treats that as allowed safe scaffolding, not generated article prose.
- `client/src/pages/Manage.tsx` currently uses `source=agent_radar` for Agent idea draft links while `ReaderSignalKind` uses `agent_question`. Future work must normalize new links to `agent_question` while accepting `agent_radar` as a legacy alias.
- Current CSS debt baseline from read-only review: `!important` appears heavily in `liquid-materials.css`, `owner-tools.css`, `visual-refresh.css`, and `agent-surfaces.css`; future UI slices must not increase that count without a report-level waiver.

Completed slice evidence already exists under `docs/product_optimization/reports/`. The specs below should not ignore those slices; they should continue from them.

## Spec Inventory

Use these files as the module specs:

1. Product loop: `docs/superpowers/specs/2026-07-08-reading-writing-loop-optimization-design.md`
2. UI visual contract: `docs/superpowers/specs/2026-07-08-ui-visual-contract-design.md`
3. Discovery map: `docs/superpowers/specs/2026-07-08-discovery-research-map-design.md`
4. Article rendering: `docs/superpowers/specs/2026-07-08-article-reading-rendering-design.md`
5. Agent companion: `docs/superpowers/specs/2026-07-08-agent-reading-companion-design.md`
6. Reader signal cockpit: `docs/superpowers/specs/2026-07-08-reader-signal-owner-cockpit-design.md`
7. Content style system: `docs/superpowers/specs/2026-07-08-content-quality-style-system-design.md`
8. Engineering gates: `docs/superpowers/specs/2026-07-08-engineering-release-gates-design.md`
9. Search relevance: `docs/superpowers/specs/2026-07-09-search-relevance-alias-contract-design.md`
10. Reading continuity: `docs/superpowers/specs/2026-07-09-reading-continuity-route-state-design.md`
11. Archive density: `docs/superpowers/specs/2026-07-09-archive-taxonomy-density-filtering-design.md`
12. Agent quality ops: `docs/superpowers/specs/2026-07-09-agent-quality-operations-design.md`
13. Signal lifecycle: `docs/superpowers/specs/2026-07-09-reader-signal-normalization-lifecycle-contract-design.md`
14. Owner cockpit IA: `docs/superpowers/specs/2026-07-09-owner-cockpit-ia-contract-design.md`
15. Owner writing studio: `docs/superpowers/specs/2026-07-09-owner-writing-publish-studio-design.md`
16. Publish freshness bridge: `docs/superpowers/specs/2026-07-09-publish-freshness-signal-bridge-design.md`
17. Reader relationship: `docs/superpowers/specs/2026-07-09-reader-relationship-subscription-design.md`
18. Privacy and retention: `docs/superpowers/specs/2026-07-09-privacy-retention-signal-data-contract-design.md`
19. Public i18n: `docs/superpowers/specs/2026-07-09-public-i18n-bilingual-reading-contract-design.md`
20. Theme/language runtime: `docs/superpowers/specs/2026-07-09-theme-language-runtime-contract-design.md`
21. Route sync: `docs/superpowers/specs/2026-07-09-route-contract-sync-design.md`
22. Accessibility automation: `docs/superpowers/specs/2026-07-09-accessibility-automation-matrix-design.md`
23. Performance budget: `docs/superpowers/specs/2026-07-09-performance-budget-design.md`
24. CSS ownership: `docs/superpowers/specs/2026-07-09-css-ownership-style-debt-budget-design.md`
25. Test ownership: `docs/superpowers/specs/2026-07-09-test-matrix-ownership-design.md`
26. Release orchestration: `docs/superpowers/specs/2026-07-09-release-gate-orchestration-design.md`

The older review package `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md` remains valid. This file is the final review index and execution contract.

## Product Direction

The product should improve in one loop:

1. Public readers understand the research map quickly.
2. Article pages make dense technical reading comfortable.
3. The Agent helps in the current reading task, answers first, and exposes sources by intent.
4. Search misses, weak Agent runs, feedback, style issues, and freshness failures become owner tasks.
5. The owner edits, publishes, verifies content freshness, and refreshes Agent knowledge.

Success is not a prettier shell alone. Success is a visible loop from reader intent to better articles and better grounded answers.

## Non-Negotiable Constraints

- No public leak of hidden, draft, admin-only, private, pasted, credential, or contact data.
- No production credentials in docs, tests, commits, logs, screenshots, or URLs.
- No deployment, force push, schema migration, destructive data operation, or credential mutation without explicit owner approval.
- No new dependency unless the slice report explains why the existing stack is insufficient.
- No broad CSS rewrite or page rewrite in a single commit.
- No visual-only change without browser evidence for the affected route.
- No overall goal completion after a single slice.

## Execution Specs

### SPEC-UI: Public Visual System And Reading Calm

Goal: remove the remaining AI-template feel while preserving the existing route structure and research archive identity.

User-facing requirements:

- Home, track, search, archive, taxonomy, about, and article pages use a calm editorial hierarchy.
- The first viewport shows product identity and real research content, not oversized decorative chrome.
- Light and dark modes are both readable. Dark mode is low-glare; light mode is paper-like without washed-out text.
- Typography uses clear hierarchy and mixed Chinese/English resilience. Body copy must not feel like one flat font weight.
- Repeated cards are reduced where lists, ledgers, or grouped sections communicate better.
- Accent color is restrained and semantic. Avoid high-glow cyan/purple blocks, decorative AI gradients, and accidental one-note palettes.
- Do not add viewport-unit font sizing for readable text. Existing `clamp(...vw...)` type rules are debt and must be reported when touched.
- Markdown, code, table, callout, inline-code, code-copy, and button states must be readable from their own component defaults, not only because an outer page selector overrides them.
- Visual density must be measured for major UI slices: article body start Y, main content area share, glass/liquid large container count, decorative layer count, and page horizontal overflow.

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
- `client/src/styles/liquid-materials.css`

Acceptance:

- No horizontal page overflow at 390px, 768px, 1024px, and 1440px.
- Public article body remains visually dominant over rails and controls.
- Buttons and form labels meet WCAG AA contrast.
- Navigation stays one line on desktop.
- Mobile screens show meaningful content without excessive intro stacking.
- Screenshots cover light and dark for home, search zero-state, archive, and article.
- Screenshot/probe reports record computed font family, font size, line height, paragraph measure, and contrast for representative Chinese and English body text.
- Each UI slice reports whether `!important`, viewport font sizing, broad selectors, and hard-coded colors increased, decreased, or stayed flat.

### SPEC-READ: Article Reading, Markdown, And Continuity

Goal: make long AI technical articles easier to scan, cite, and continue.

User-facing requirements:

- Article title, excerpt, metadata, reading path, and body establish a clear reading order.
- Code, math, tables, blockquotes, callouts, figures, and captions are mobile-safe.
- Heading anchors, copy controls, code labels, and table overflow are discoverable without clutter.
- TOC, related articles, feedback, subscription, and Agent prompts support the reading task and recede when not needed.
- Returning from list/search/taxonomy to article and back should preserve reading intent where practical.
- Rails only appear when the prose column can still stay within the target measure of roughly 66 to 78 characters. If the rail compresses prose below that range, it collapses or moves below the body.
- Mobile article order is fixed: title/meta, compact entry, collapsed TOC, prose, handoff/related path, feedback, subscription.
- Archive, search, and taxonomy density must be route-specific: archive favors ledger rows, search favors result rows with recovery affordances, taxonomy favors compact cards or rows rather than full article cards when density is high.

Primary files:

- `client/src/pages/PostDetail.tsx`
- `client/src/components/MarkdownRenderer.tsx`
- `client/src/components/SeriesProgress.tsx`
- `client/src/components/ArticleFeedback.tsx`
- `client/src/i18n/post.ts`
- `seed-blog.mjs`

Acceptance:

- Markdown fixture tests cover long code, table, math, callout, heading anchor, and mixed Chinese/English paragraphs.
- The Markdown fixture matrix also covers long formula, repeated headings, figure caption, CJK/English long text, code-copy focus state, and editor preview rendering.
- At narrow viewport or 400% zoom, the page does not require two-dimensional scrolling except inside intentional code/table containers.
- Article feedback and subscription do not interrupt the first reading pass.
- Related content appears as continuation, not as generic cards.

### SPEC-AGENT: Reading Companion UX

Goal: keep Agent useful and grounded while making the answer readable before citations and traces.

User-facing requirements:

- Answer body is visible after final completion; final state must not auto-scroll to sources.
- Sources are collapsed by default with a compact summary and bounded expanded list.
- Elapsed time uses final stream elapsed value when available and persisted latency for history.
- Trust/scope explanation is compact by default and elevated only for private context or no-source risk.
- Desktop supports persistent drag/resize/preset behavior; mobile remains a stable sheet.
- Follow-up prompts are reading tasks, not generic chat suggestions.

Primary files:

- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/components/agent/AgentPanel.tsx`
- `client/src/components/agent/AgentFloatingFrame.tsx`
- `client/src/components/agent/AgentSourceCards.tsx`
- `client/src/components/agent/AgentReasoningTrace.tsx`
- `client/src/components/agent/AgentContextSurfaces.tsx`
- `client/src/components/agent/agentScrollPolicy.ts`
- `client/src/components/agent/agentElapsed.ts`
- `client/src/styles/agent-surfaces.css`
- `client/src/i18n/agent.ts`

Acceptance:

- Long answer plus five sources keeps answer and composer reachable.
- Expanded sources do not create page-level horizontal scroll.
- Drag, resize, preset, close/reopen, Escape, focus, and mobile behavior are tested or browser-checked.
- Stream final, history restore, failure, and no-source states are covered.

### SPEC-OPS: Agent Quality And Knowledge Operations

Goal: make Agent reliability operable from owner tools instead of raw traces alone.

Functional requirements:

- `/manage/agent` first answers: knowledge fresh, eval status, no-source risk, failed/refusal runs, and top action items.
- Evals distinguish retrieval, source coverage, grounded answer, scope discipline, refusal boundary, collapsed readability, and citation usability.
- Evals include `manual_review_required` where deterministic code cannot honestly decide a semantic claim; those cases must not be counted as pass.
- Weak runs become normalized reader signals without storing private pasted context.
- Reindex and publish freshness status are owner-visible and tied to release readiness.
- Raw traces remain available but secondary.
- Agent ops runbook states cover model not configured, stream timeout/abort, quota exhaustion, stale index, latest reindex error, unavailable report, and retrieval no-source cases.

Primary files:

- `client/src/pages/ManageAgent.tsx`
- `client/src/pages/manage-agent/AgentIndexStatusPanel.tsx`
- `client/src/i18n/agentOps.ts`
- `server/ai/evals.ts`
- `server/ai/harness.ts`
- `server/ai/router.ts`
- `server/ai/conversations.ts`
- `server/readerSignals.ts`
- `scripts/ai/reindex-knowledge.ts`

Acceptance:

- Owner can identify Agent quality risk in under one minute.
- `server/readerSignals.ts` has builders, stable IDs, redaction, severity, and suggested owner actions for all seven `ReaderSignalKind` values.
- Release checks include an Agent eval report or an explicit waiver. Blocking failures include hidden/draft source returned, expected source missing, repeated zero-source run, and unusable citation.
- Zero-source, failed, refusal, and repeated question runs can become backlog candidates.
- No hidden/draft/private content appears in public source cards or owner screenshots intended for reports.
- `ai:reindex --dry-run`, real reindex, publish freshness, and release check statuses are documented.

### SPEC-OWNER: Cockpit, Backlog, And Editor

Goal: connect real reader/Agent/content signals to owner writing work without turning `/manage` into an overloaded dashboard.

Functional requirements:

- `/manage` is the editorial cockpit: post list, backlog, content radar, feedback, subscriptions, and taxonomy tools have clear priority.
- `/manage/agent` is the Agent quality cockpit: index, evals, failed questions, retrieval diagnostics, advanced traces.
- `/write` is the writing/publish studio: content, preview, metadata, preflight, version restore, and publish result.
- Backlog links use safe intent query params and never pass private feedback bodies or contact data.
- Canonical backlog source values are `feedback`, `search_miss`, `agent_question`, `content_audit`, and `publish_freshness`. `agent_radar` is accepted only as a legacy alias and should normalize to `agent_question` in new code.
- Editor may seed a safe empty scaffold with headings such as source, reader question, claim, evidence, and caveats. It must not generate final article prose or insert private feedback/context bodies.
- Editor shows a compact preflight distinction between blockers and warnings.
- Knowledge refresh outcome is visible after create, update, publish, and restore.

Primary files:

- `client/src/pages/Manage.tsx`
- `client/src/pages/ManageAgent.tsx`
- `client/src/pages/Editor.tsx`
- `client/src/i18n/manage.ts`
- `client/src/i18n/editor.ts`
- `server/engagement.router.ts`
- `server/readerSignals.ts`
- `server/routers.ts`
- `scripts/audit/publish-freshness.ts`

Acceptance:

- Backlog rows clearly show priority, source, article/topic, evidence count, and action.
- `/write?idea=...&source=...&article=...` renders safe intent and, when useful, a safe scaffold without injecting private data into drafts.
- Publish preflight warnings are useful but do not block on subjective style warnings by default.
- Large owner files are simplified through extracted leaf components only when touched by the active slice.

### SPEC-CONTENT: Article Voice And Quality

Goal: reduce awkward AI-ish phrasing, vague claims, unsupported certainty, and overly subjective framing while preserving the author's technical voice.

Functional requirements:

- Content audit checks for AI-ish phrases, malformed Markdown, generic excerpts, unsupported certainty, vague technical claims, and subjective framing.
- Findings include file, line where possible, severity, concrete evidence, span when possible, reason, rewrite intent, and confidence.
- Style finding taxonomy includes `aiish_phrase`, `awkward_expression`, `subjective_overreach`, `translationese`, `vague_claim`, and `unsupported_certainty`.
- Each article receives a machine-readable rubric summary for Problem, Mechanism, Evidence, Limitation, and Implication, with each dimension marked `present`, `weak`, or `missing`.
- Style suggestions remain non-blocking until precision is reviewed.
- Public article copy should lead with the concrete technical problem, not filler such as "本文将" or generic map metaphors.
- English warnings and Chinese warnings are both concrete.
- Root docs, AGENTS docs, reports, and internal planning files must not be misclassified as article content.

Primary files:

- `scripts/audit/content-quality.ts`
- `scripts/audit/content-quality.test.ts`
- `seed-blog.mjs`
- `docs/superpowers/specs/2026-07-08-content-quality-style-system-design.md`
- article Markdown files referenced by `seed-blog.mjs`

Acceptance:

- Content audit report separates failures, warnings, and suggestions.
- Style checks do not produce noisy release blockers.
- At least one fixture covers Chinese subjective framing, English AI-ish phrase, unsupported certainty, and vague technical claim.
- At least one fixture covers awkward expression or translationese without turning every uncommon authorial phrase into a warning.
- Rubric output can identify weak evidence or missing limitation without failing the release by default.
- Findings can feed the owner backlog without exposing private reader data.

### SPEC-RELATIONSHIP: Feedback, Subscriptions, And Reader Signals

Goal: make reader relationship features honest, compact, and useful for owner improvement.

Functional requirements:

- Article feedback is form-first, privacy-aware, and not dominated by mailto or external contact assumptions.
- Feedback can optionally capture a structured reason taxonomy: `unclear_mechanism`, `needs_example`, `unsupported_claim`, `awkward_wording`, `missing_next_step`, or `other`.
- Subscription copy describes actual behavior and avoids overpromising.
- Search misses, feedback, subscriptions, Agent questions, audit findings, and freshness issues normalize into reader signals with status and severity.
- Signal lifecycle target is `new -> triaged -> planned -> in_revision -> resolved|ignored`. Read-model signals may default to `new`, but owner-facing state should not pretend local UI state is durable.
- Signals group repeated intent without storing direct contact details in public or URL-visible surfaces.
- Owner tools show what to do next, not just raw counts.

Primary files:

- `client/src/components/ArticleFeedback.tsx`
- `client/src/components/SubscriptionForm.tsx`
- `client/src/i18n/common.ts`
- `server/engagement.router.ts`
- `server/searchMisses.ts`
- `server/readerSignals.ts`

Acceptance:

- Feedback form states cover empty, submitting, success, validation error, and server error.
- Subscription states cover empty, duplicate, success, and failure.
- Signals redact direct contact data and preserve public article/topic context.
- Backlog items remain actionable without exposing private text in URLs.

### SPEC-GATES: Release, Accessibility, Performance, And CSS Ownership

Goal: prevent future visual, content, Agent, and release regressions from shipping unnoticed.

Functional requirements:

- `release:check` is the local orchestration entry point for code, content, build, freshness, and UI evidence.
- `release:check` or its reported waiver must include Agent answer-quality eval evidence before final release readiness is claimed.
- CSS ownership is explicit: base, public, visual, material, owner, and Agent layers do not fight through broad `!important` rules.
- Route contract sync verifies sitemap/RSS/public discovery do not expose hidden content.
- Theme/language runtime tests cover persisted state, system preference, and bilingual label fit.
- Performance budget covers bundle, long tasks where measurable, article render safety, and Agent frame interaction cost.

Primary files:

- `scripts/release/check.ts`
- `scripts/audit/ui-layout.ts`
- `scripts/audit/baseline.ts`
- `scripts/audit/publish-freshness.ts`
- `client/src/contexts/ThemeContext.tsx`
- `client/src/contexts/LanguageContext.tsx`
- `client/src/styles/*.css`
- `server/seo.ts`
- `server/discovery.ts`

Acceptance:

- Each UI slice records screenshots or browser audit JSON.
- Full release gate records commands, status, commit, dirty state, and waivers.
- Public route, RSS, sitemap, Agent source, and search visibility boundaries are checked.
- `git diff --check`, `corepack pnpm check`, `corepack pnpm test`, `corepack pnpm build`, and relevant audits are run before any "done" claim.

## Implementation Waves After Approval

### Wave 0: Freeze And Preflight

- Confirm branch `dev` and clean worktree.
- Confirm this file is the active execution contract.
- Create the first implementation plan under `docs/superpowers/plans/`.
- Do not deploy.

Gates:

```bash
git status --short --branch
git diff --check
```

### Wave 1: Public UI And Reading Calm

Use `SPEC-UI`, `SPEC-READ`, public i18n, theme runtime, CSS ownership, and accessibility specs.

Likely first slices:

1. Public shell density pass.
2. Search/archive/taxonomy scanability pass.
3. Article first-screen and Markdown safety pass.

Gates:

```bash
corepack pnpm test -- client/src/pages/Home.test.ts client/src/pages/Track.test.ts client/src/pages/Search.test.tsx client/src/pages/Archive.test.ts client/src/pages/PostDetail.test.ts client/src/components/MarkdownRenderer.test.tsx
corepack pnpm check
corepack pnpm audit:ui
corepack pnpm build
```

### Wave 2: Agent Companion Completion

Use `SPEC-AGENT`, privacy, theme runtime, CSS ownership, and accessibility specs.

Likely first slices:

1. Remaining `BlogAgentRoot` state/render extraction.
2. Long-answer source fixture and screenshot evidence.
3. Mobile sheet and desktop frame interaction QA.

Gates:

```bash
corepack pnpm test -- client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/sourceCards.test.ts client/src/components/agent/AgentPanel.test.tsx client/src/components/agent/AgentFloatingFrame.test.tsx
corepack pnpm check
corepack pnpm audit:ui
corepack pnpm build
```

### Wave 3: Agent Quality Operations

Use `SPEC-OPS`, signal lifecycle, privacy, and release orchestration specs.

Likely first slices:

1. Agent quality summary data contract.
2. ReaderSignal normalization for Agent gaps.
3. `/manage/agent` first-screen IA pass.

Gates:

```bash
corepack pnpm test -- server/readerSignals.test.ts server/agent.router.test.ts server/ai/harness.test.ts server/ai/streamRoute.test.ts client/src/pages/ManageAgent.test.tsx
corepack pnpm check
corepack pnpm build
```

### Wave 4: Owner Cockpit And Writing Studio

Use `SPEC-OWNER`, `SPEC-CONTENT`, publish freshness bridge, privacy, and reader signal specs.

Likely first slices:

1. Editor safe intent rendering and preflight helpers.
2. Manage backlog IA extraction.
3. Publish freshness and knowledge refresh evidence surface.

Gates:

```bash
corepack pnpm test -- server/engagement.router.test.ts server/readerSignals.test.ts scripts/audit/content-quality.test.ts scripts/audit/publish-freshness.test.ts
corepack pnpm content:audit
corepack pnpm check
corepack pnpm build
```

### Wave 5: Reader Relationship Loop

Use `SPEC-RELATIONSHIP`, `SPEC-OWNER`, and privacy specs.

Likely first slices:

1. Feedback and subscription state polish.
2. Signal grouping and redaction test expansion.
3. Backlog action clarity.

Gates:

```bash
corepack pnpm test -- server/engagement.router.test.ts client/src/components/ArticleFeedback.test.tsx client/src/pages/PostDetail.test.ts
corepack pnpm check
corepack pnpm audit:ui
corepack pnpm build
```

### Wave 6: Final Release Evidence

Use `SPEC-GATES` and the full spec inventory.

Gates:

```bash
corepack pnpm release:check
corepack pnpm check
corepack pnpm test
corepack pnpm content:audit
corepack pnpm content:verify
corepack pnpm build
AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui
```

No deploy occurs unless the owner explicitly requests it after reviewing evidence.

## Slice Rules

Each implementation slice must:

- Start from one spec and one plan file.
- Touch the smallest coherent file set.
- Avoid unrelated rewrites, renames, and formatting churn.
- Prefer extraction of leaf components/helpers over large in-place rewrites.
- Add or update focused tests before broad gates.
- Add a report under `docs/product_optimization/reports/<slice>-YYYY-MM-DD/summary.md`.
- Commit only after validation and report are complete.

## Required Evidence Per Slice

Every slice report must include:

- Changed files.
- User-visible behavior.
- Code-quality notes, including simplification or why no simplification was needed.
- Tests and command results.
- Browser screenshots or audit output for UI changes.
- Known risks.
- Follow-up work that remains out of scope.

## Stop Conditions

Stop and ask before:

- Deployment.
- Schema migration.
- Destructive data operation.
- Production credential or environment variable change.
- Force push, history rewrite, branch deletion not already covered by branch policy.
- New dependency.
- Public contract change that affects routes, APIs, DB schema, auth, quota, or model provider.

## Owner Review Checklist

- The product direction matches a personal AI research archive.
- UI requirements reduce glare, generic cards, cramped modules, and AI-gradient language.
- Reading requirements make dense technical articles easier to scan and continue.
- Agent requirements keep answers readable first and sources inspectable second.
- Owner requirements turn feedback, search misses, Agent gaps, audit findings, and freshness failures into writing work.
- Content requirements reduce awkward phrasing without blocking valid author voice.
- Release requirements are strict enough to prevent "looks changed but not verified" regressions.

## Approval Prompt

Use this exact prompt after owner review if approved:

```text
Implement the product optimization final spec package for /Users/yang/projects/ai-tech-blog from docs/superpowers/specs/2026-07-09-product-optimization-final-spec-package.md. Work on dev. Do not ask for per-slice confirmation. Execute the waves in order, keep each slice bounded, write evidence reports, run the listed gates, commit each slice, and stop only for deployment, schema migration, destructive data changes, credential changes, force push/history rewrite, new dependencies, or public contract changes.
```
