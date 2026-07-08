# Product Optimization Spec Review Package

Date: 2026-07-08
Status: Ready for owner review
Scope: UI, discovery, reading, Agent, owner workflow, article quality, release gates

## How To Review

Read this file first. It is the index and execution contract for the full optimization package. The detailed specs are linked below and can be reviewed independently.

Recommended review order:

1. [Parent product loop spec](./2026-07-08-reading-writing-loop-optimization-design.md)
2. [UI visual contract](./2026-07-08-ui-visual-contract-design.md)
3. [Discovery and research map](./2026-07-08-discovery-research-map-design.md)
4. [Article reading and Markdown rendering](./2026-07-08-article-reading-rendering-design.md)
5. [Agent reading companion](./2026-07-08-agent-reading-companion-design.md)
6. [Reader signal backlog and owner cockpit](./2026-07-08-reader-signal-owner-cockpit-design.md)
7. [Content quality and writing style system](./2026-07-08-content-quality-style-system-design.md)
8. [Engineering simplification and release gates](./2026-07-08-engineering-release-gates-design.md)

The package is designed so implementation can proceed without asking for per-step confirmation after owner approval. Each slice must still leave evidence, tests, and a clear commit.

## Product Direction

The target product is:

> A personal AI systems research archive with a grounded reading assistant and an owner improvement cockpit.

The optimization is not a cosmetic redesign. It is a loop:

1. Readers understand the research map.
2. Readers can comfortably read dense technical articles.
3. Agent answers help within the reading task.
4. Weak searches, weak answers, and unclear writing become author tasks.
5. Owner tools turn those tasks into article improvements and publish freshness checks.

## Spec Coverage

| Area | Spec | Primary Decision | Implementation Risk |
| --- | --- | --- | --- |
| Visual design | UI visual contract | Calm editorial system, semantic tokens, no AI-glow dashboard look. | CSS ownership and override ordering |
| Discovery | Discovery and research map | Homepage and tracks become research paths, search recovers weak queries. | Public hidden-content boundaries |
| Reading | Article reading and Markdown rendering | Publication-grade technical rendering and reading aids. | Renderer regressions and mobile overflow |
| Agent | Agent reading companion | Answer first, sources inspectable, root component simplified. | Streaming and scroll regressions |
| Owner loop | Reader signal backlog and owner cockpit | Reader behavior becomes actionable author backlog. | Data privacy and premature schema changes |
| Writing | Content quality and writing style system | Audit AI-ish filler, subjective wording, vague claims, unsupported certainty. | Over-noisy style checks |
| Engineering | Engineering release gates | Bounded refactors, command matrix, screenshot evidence. | Large unreviewed rewrites |

## Current Branch Status

The current `dev` branch already contains foundation work from earlier slices:

- Content audit scope and reader signal foundations.
- Markdown renderer upgrades for anchors, callouts, and code labels.
- Agent helper extraction for elapsed time, frame state, and scroll policy.
- Public visual token and reader surface tuning.

These changes are implementation foundations, not the full optimization program. The remaining work should follow the specs in this review package.

## Decisions Needed From Owner Review

These are the only decisions that should block implementation after the package is reviewed:

1. Visual direction: approve the restrained editorial research notebook direction.
2. Discovery priority: approve making homepage and tracks research-map first, not marketing hero first.
3. Agent behavior: approve answer-first defaults with collapsed sources and advanced trace details.
4. Owner workflow: approve aggregating reader signals into owner-only improvement queues.
5. Writing style gate: approve style warnings that flag vague or overly subjective wording without blocking publish by default.
6. Release discipline: approve slice-by-slice commits with evidence reports and validation commands.

If these are approved, implementation should proceed through the execution sequence below without asking for step-by-step confirmation.

## Execution Sequence

### Wave 0: Freeze Scope And Evidence

Purpose: make sure later work is measured against a real baseline.

Deliverables:

- Confirm branch is `dev`.
- Capture current screenshots for home, track, search, article, Agent, owner tools.
- Record current command results.
- Create one report under `docs/product_optimization/reports/`.

Exit gates:

```bash
git status --short --branch
corepack pnpm check
corepack pnpm test
corepack pnpm build
corepack pnpm audit:ui
corepack pnpm content:audit
```

### Wave 1: Public Visual Contract

Purpose: remove the current AI-template feel without rewriting the app.

Specs:

- UI visual contract.
- Discovery and research map.

Deliverables:

- Semantic token layer for public surfaces.
- Lower-glare light and dark mode.
- Homepage and track first-viewport cleanup.
- Search highlight and recovery readability.
- No broad new `!important` styling.

Primary files:

- `client/src/index.css`
- `client/src/styles/visual-refresh.css`
- `client/src/styles/public-components.css`
- `client/src/styles/owner-tools.css`
- `client/src/pages/Home.tsx`
- `client/src/pages/Track.tsx`
- `client/src/pages/Search.tsx`
- `client/src/pages/Archive.tsx`
- `client/src/components/ResearchShell.tsx`
- `client/src/components/ArticleCard.tsx`

Exit gates:

```bash
corepack pnpm test -- client/src/pages/Home.test.ts client/src/components/ResearchShell.test.tsx client/src/lib/tracks.test.ts
corepack pnpm check
corepack pnpm audit:ui
corepack pnpm build
```

### Wave 2: Article Reading Surface

Purpose: make dense AI technical articles easier to read and navigate.

Specs:

- Article reading and Markdown rendering.
- Content quality and writing style system.

Deliverables:

- Stable heading anchors.
- Technical callouts.
- Code labels and long-code scan affordances.
- Table, math, figure, and caption overflow rules.
- Article brief, prerequisites, and continuation affordances.
- Content audit improvements for article-only scope and style warnings.

Primary files:

- `client/src/components/MarkdownRenderer.tsx`
- `client/src/pages/PostDetail.tsx`
- `client/src/styles/visual-refresh.css`
- `scripts/audit/content-quality.ts`
- `scripts/audit/content-quality.test.ts`
- Article fixtures or seed content where needed.

Exit gates:

```bash
corepack pnpm test -- client/src/components/MarkdownRenderer.test.tsx scripts/audit/content-quality.test.ts
corepack pnpm content:audit
corepack pnpm check
corepack pnpm audit:ui
corepack pnpm build
```

### Wave 3: Agent Reading Companion

Purpose: keep the Agent useful while reducing space, scroll, and component risk.

Specs:

- Agent reading companion.
- Engineering simplification and release gates.

Deliverables:

- Preserve final elapsed time semantics.
- Preserve answer-first scroll policy.
- Preserve collapsed source summary.
- Extract leaf UI components from `BlogAgentRoot.tsx`.
- Add answer-quality eval dimensions for citation usefulness, scope control, and concise answer structure.
- Add UI fixtures for long answer, many sources, no sources, mobile sheet, and private context.

Recommended lowest-risk first slice:

1. Extract `AgentSourceCards`, `AgentSourcePreviewChip`, `getVisibleSourceCards`, and source scroll/link helpers.
2. Extract `AgentReasoningTrace`, `traceStageLabel`, and elapsed display helpers.
3. Keep root streaming state, quota, identity, and submit handling in `BlogAgentRoot.tsx` until tests prove the leaf extraction is stable.

Primary files:

- `client/src/components/agent/BlogAgentRoot.tsx`
- `client/src/components/agent/AgentSourceCards.tsx`
- `client/src/components/agent/AgentReasoningTrace.tsx`
- `client/src/components/agent/agentElapsed.ts`
- `client/src/components/agent/agentFrameState.ts`
- `client/src/components/agent/agentScrollPolicy.ts`
- `client/src/components/agent/sourceCardLinks.ts`
- `client/src/styles/agent-surfaces.css`
- `server/ai/evals.ts`
- `server/ai/harness.ts`

Exit gates:

```bash
corepack pnpm test -- client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/sourceCards.test.ts server/ai/harness.test.ts server/ai/streamRoute.test.ts
corepack pnpm check
corepack pnpm audit:ui
corepack pnpm build
```

### Wave 4: Reader Signal And Owner Cockpit

Purpose: convert reader demand into author work.

Specs:

- Reader signal backlog and owner cockpit.
- Content quality and writing style system.

Deliverables:

- Internal `ReaderSignal` model.
- Aggregated signals from search misses, Agent questions, low-confidence answers, feedback, content audit, and publish freshness.
- Owner-only improvement queue.
- Release readiness panel.
- Privacy guardrails for private context and contact data.

Primary files:

- `server/readerSignals.ts`
- `server/engagement.router.ts`
- `server/searchMisses.ts`
- `server/ai/conversations.ts`
- `server/ai/evals.ts`
- `client/src/pages/ManageAgent.tsx`
- `client/src/pages/Manage.tsx`
- `client/src/components/ArticleFeedback.tsx`

Exit gates:

```bash
corepack pnpm test -- server/readerSignals.test.ts server/engagement.router.test.ts server/discovery.router.test.ts
corepack pnpm content:audit
corepack pnpm check
corepack pnpm build
```

### Wave 5: Publish Quality And Freshness

Purpose: make the article improvement loop operational.

Specs:

- Content quality and writing style system.
- Engineering simplification and release gates.
- Existing product optimization phases PO-06 through PO-08.

Deliverables:

- Article quality report.
- Style warning report with suggested rewrite intent.
- Publish freshness report.
- Agent knowledge freshness evidence after content changes.
- Final release checklist.

Exit gates:

```bash
corepack pnpm content:audit
corepack pnpm check
corepack pnpm test
corepack pnpm build
corepack pnpm audit:ui
```

## Non-Negotiable Guardrails

- Do not leak hidden, draft, private, or admin-only content to public routes, RSS, sitemap, search, or Agent sources.
- Do not print, commit, or document credentials.
- Do not add new dependencies without a written reason.
- Do not rewrite global CSS wholesale.
- Do not refactor Agent root streaming state and UI leaves in the same commit.
- Do not make style warnings block publish until warning precision is reviewed.
- Do not mark the overall product goal complete after one slice.

## Evidence Requirements

Every implementation slice must add a short report under `docs/product_optimization/reports/` with:

- Changed files.
- User-visible behavior.
- Screenshots or browser audit output when UI changed.
- Validation commands and results.
- Known risks or deferred work.

Screenshot minimum for UI slices:

- Home desktop and mobile.
- Article desktop and mobile.
- Search with results and zero results.
- Agent open with long answer and sources.
- Light and dark mode for at least one public page.

## Review Checklist

- The product direction feels like a personal AI research archive, not generic AI SaaS.
- The UI direction reduces glare, glow, and crowded surfaces.
- The discovery spec makes homepage, tracks, search, archive, tags, and categories coherent.
- The article spec improves technical rendering without inventing a new content format.
- The Agent spec preserves user-visible fixes and reduces component risk.
- The owner cockpit spec respects privacy and does not require premature schema migration.
- The content style spec flags real writing weaknesses without turning into vague taste policing.
- The engineering gates are strong enough to prevent "looks changed but not verified" releases.

## Ready-To-Start Prompt After Approval

Use this when implementation is approved:

```text
Implement the product optimization package for /Users/yang/projects/ai-tech-blog from docs/superpowers/specs/2026-07-08-product-optimization-spec-review-package.md. Work on dev. Do not ask for per-slice confirmation. Execute the waves in order, keep each slice bounded, write evidence reports, run the listed gates, commit each slice, and stop only for irreversible actions, credential issues, schema migrations, force pushes, or deploys.
```
