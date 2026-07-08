# Personal AI Blog Reading And Writing Loop Optimization Design

Date: 2026-07-08
Status: Proposed
Primary track: Reading and writing feedback loop first

## Spec Package

This overview is the parent spec. The complete review package is split into focused child specs so implementation can start later without mixing unrelated concerns:

- [Product optimization spec review package](./2026-07-08-product-optimization-spec-review-package.md)
- [UI visual contract](./2026-07-08-ui-visual-contract-design.md)
- [Discovery and research map](./2026-07-08-discovery-research-map-design.md)
- [Article reading and Markdown rendering](./2026-07-08-article-reading-rendering-design.md)
- [Agent reading companion](./2026-07-08-agent-reading-companion-design.md)
- [Reader signal backlog and owner cockpit](./2026-07-08-reader-signal-owner-cockpit-design.md)
- [Content quality and writing style system](./2026-07-08-content-quality-style-system-design.md)
- [Engineering simplification and release gates](./2026-07-08-engineering-release-gates-design.md)

The intended review flow is: read the review package first, then inspect this parent spec and the child specs that match the highest-risk area. No new implementation wave should begin until this package is reviewed.

## Summary

This project should be treated as a personal AI research archive with a grounded reading assistant and an owner publishing cockpit, not as a generic SaaS dashboard or static portfolio. The next optimization pass should make the product better in one loop:

1. Readers land on the site and understand the author's research map quickly.
2. Articles are comfortable to read across desktop, mobile, light mode, and dark mode.
3. The Agent helps readers understand the current article without stealing reading space.
4. Search misses, Agent questions, feedback, and weak article passages become actionable author signals.
5. The author can review those signals, improve articles, republish, and refresh Agent knowledge.

The recommended plan is not a visual-only redesign. It is a product loop improvement where UI, reading UX, Agent trust, content quality, and owner workflow reinforce one another.

## Evidence Read

Local project evidence:

- `PRODUCT.md`: defines the product as a personal AI systems research archive and interactive knowledge product.
- `README.md`: shows the project includes blog publishing, search, public reading, admin tools, and AI assistant capabilities.
- `client/src/pages/Home.tsx`: current homepage has research tracks, search dock, latest note, and start-here entry points.
- `client/src/pages/PostDetail.tsx`: article page has a reader shell, article metadata, TOC, Agent prompts, feedback, subscription, and related content.
- `client/src/components/MarkdownRenderer.tsx`: supports GFM, math, code highlighting, copy buttons, and tables, but lacks richer editorial primitives.
- `client/src/components/agent/BlogAgentRoot.tsx`: Agent module already contains streaming, citations, source cards, frame state, quota, history, and context attachments, but it remains a large mixed-responsibility component.
- `server/ai/harness.ts`, `server/ai/evals.ts`, `server/ai/knowledge.ts`: retrieval and evaluation exist, but answer quality and citation quality are not yet treated as first-class release gates.
- `scripts/audit/content-quality.ts`: content audit exists, but currently treats root project Markdown such as `agent.md` like article content.
- `/Users/yang/Downloads/Misaya Notes Design System`: confirms the intended visual language is calm, technical, precise, editorial, and low-noise.

External product references:

- [ChatGPT Search](https://help.openai.com/en/articles/9237897-chatgpt-search): sources are available but should not dominate the answer surface.
- [Anthropic Claude citations](https://docs.anthropic.com/en/docs/build-with-claude/citations): citations should support verification with precise source passages.
- [Readwise Ghostreader](https://readwise.io/ghostreader): reading assistants work best when they stay inside the reading task rather than becoming a separate chat product.
- [WCAG Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html): reader surfaces should avoid two-dimensional scrolling at narrow widths and high zoom.
- [Material Design color roles](https://m3.material.io/styles/color/roles): light and dark themes should rely on semantic roles, not one-off color overrides.
- [Apple Human Interface Guidelines, Typography](https://developer.apple.com/design/human-interface-guidelines/typography): typography should establish hierarchy and legibility before decoration.
- [NN/g Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/): advanced details should be available without occupying default reading space.
- [NN/g Explainable AI](https://www.nngroup.com/articles/explainable-ai/): AI confidence and evidence need to be understandable, not merely present.

## Product Principles

1. Reading first. The article body is the main product surface. Navigation, Agent, citations, feedback, and subscriptions must support reading rather than compete with it.
2. Authored, not generated. The interface should feel like a serious research notebook by a real author. Avoid generic AI gradients, excessive glass, uniform cards, vague CTAs, and template-like copy.
3. Evidence available by default, expanded by intent. Citations, retrieval traces, related articles, and debug details should be easy to inspect, but collapsed until the reader asks.
4. Every reader signal should become an author task. Search misses, Agent questions, low-confidence answers, feedback, and content audit findings should flow into a reviewable backlog.
5. Style tokens before overrides. UI stability should come from semantic tokens and component ownership, not broad `!important` patches.
6. No new runtime dependency for the first pass. Use existing React, CSS, tRPC, lucide icons, and current scripts unless a later implementation phase proves a dependency is necessary.

## Goals

- Reduce visible AI-template feel across homepage, article page, search, Agent, and owner tools.
- Improve reading comfort, typography hierarchy, line length, spacing, and mobile density.
- Make Markdown rendering more publication-grade for technical AI writing.
- Make Agent answers easier to read first, verify second, and continue from third.
- Turn user questions and failed searches into durable improvement signals.
- Add answer-quality and content-quality release checks that can run before deployment.
- Simplify high-risk frontend areas without broad unrelated refactors.

## Non-Goals

- No model provider change.
- No database schema migration in the first planning pass.
- No redesign into a marketing landing page.
- No change to authentication, quota, billing, or production credential handling.
- No wholesale CSS rewrite before component-level ownership is mapped.
- No hiding citations entirely. Sources remain accessible, just not dominant.

## Current Diagnosis

### 1. Visual And Layout Diagnosis

The current UI has moved toward a dense control-panel feel. It has many framed surfaces, repeated cards, glass layers, and technical controls visible at once. This weakens the personal research identity.

Specific issues to address:

- Homepage first screen competes between hero identity, search dock, tracks, and latest notes.
- Article page has strong building blocks, but TOC, hero metadata, Agent prompts, feedback, and subscription can crowd the reading path.
- Mobile has too many stacked modules before and after the article body.
- Light and dark modes are functional, but the style ownership still depends on large CSS files and override ordering.
- CSS classes and visual intent are not always aligned. For example, reader components use `reading-surface solid-reading paper-reader-main`, while some liquid design rules target other naming systems.
- The design system asks for calm editorial precision, but several current screens still read like an AI product dashboard.

### 2. Reading And Markdown Diagnosis

The Markdown renderer already handles common technical writing needs, but technical articles would benefit from stronger editorial affordances.

Missing or weak areas:

- No first-class callout/admonition pattern for definitions, caveats, claims, or implementation notes.
- No visible heading anchor behavior for deep linking.
- Code blocks have copy but lack language labels, filename labels, and long-code scanning affordances.
- Tables and formulas need stricter overflow and caption treatment.
- Figures, captions, and source notes are not first-class.
- The reading page does not yet provide a lightweight reading path such as "what to read first", "related prerequisite", and "next concept".

### 3. Agent Diagnosis

The Agent has improved, but it should become a reading companion rather than a floating chat product.

Issues to address:

- `BlogAgentRoot.tsx` is too large and mixes frame behavior, streaming, quota, history, prompt suggestions, citations, context attachments, and rendering.
- Sources are now collapsed by default, but citation quality and answer quality are not yet evaluated as release criteria.
- Agent question history and failed answer patterns are not clearly turned into author tasks.
- Retrieval aliases and public search intent handling appear split across server modules, which can create inconsistent discovery behavior.
- The owner can inspect some Agent state, but not yet as a coherent "reader demand and content gaps" cockpit.

### 4. Author Workflow Diagnosis

Publishing already triggers Agent knowledge refresh, which is a strong foundation. The missing layer is a durable signal loop.

Gaps:

- Search miss data is not durable enough for long-term editorial planning.
- Agent idea status uses local UI state instead of a shared source of truth.
- Content audit is useful but too coarse. It catches some AI-ish language, malformed Markdown, and missing metadata, but does not yet provide a prioritized edit queue.
- Root project docs such as `agent.md` can be misclassified as article content.
- The author does not get a simple "what should I improve next" dashboard after publishing.

## Proposed Optimization Program

### Phase 1: Stabilize Editorial UI Foundation

Objective: make the product immediately feel less generic and easier to read without changing public contracts.

Tasks:

1. Create a visual ownership map for `visual-refresh.css`, `liquid-materials.css`, `public-components.css`, `owner-tools.css`, and `agent-surfaces.css`.
2. Define semantic UI tokens for the blog surface:
   - `--surface-page`
   - `--surface-reading`
   - `--surface-rail`
   - `--surface-muted`
   - `--text-primary`
   - `--text-secondary`
   - `--text-tertiary`
   - `--border-subtle`
   - `--accent-action`
   - `--accent-reading`
   - `--agent-surface`
   - `--agent-border`
3. Keep dark mode calm and low-glare. Keep light mode paper-like but not washed out.
4. Reduce homepage card density:
   - Make the research identity and current research tracks the first read.
   - Move secondary modules into lower-priority bands.
   - Avoid every module looking like an equal card.
5. Refine article page hierarchy:
   - Body column receives the strongest visual priority.
   - TOC and side rails should feel like tools, not competing panels.
   - Agent prompt chips should be contextual and less visually heavy.
6. Add UI audit checks for:
   - no horizontal overflow at 390px, 768px, 1024px, 1440px
   - article body visible above the fold on post pages
   - first meaningful post card visible on homepage without excessive scrolling
   - light and dark contrast snapshots

Acceptance criteria:

- `corepack pnpm audit:ui` remains green.
- A new UI evidence report includes desktop and mobile screenshots in light and dark modes.
- Homepage no longer reads as a dashboard of equal cards.
- Article page first screen makes the article, not the chrome, dominant.

### Phase 2: Upgrade Technical Reading Experience

Objective: make long AI technical articles easier to scan, cite, and revisit.

Tasks:

1. Extend `MarkdownRenderer.tsx` with editorial primitives:
   - callouts for `note`, `claim`, `caveat`, `implementation`, and `source`
   - visible heading anchors on hover and keyboard focus
   - code block language labels
   - optional filename labels when metadata exists
   - figure and caption treatment
   - table caption and overflow treatment
2. Add reading aids to `PostDetail.tsx`:
   - compact article brief
   - prerequisites if present in metadata
   - next concept or next article
   - reading progress that does not steal space
3. Make mobile progressive disclosure stricter:
   - TOC collapsed by default
   - related posts collapsed below reading completion
   - Agent opens as a reading companion sheet, not a dominant modal
4. Add content examples to seed posts so the renderer has real fixtures for code, math, tables, and callouts.

Acceptance criteria:

- Markdown fixtures render without horizontal scroll except inside intentional code/table containers.
- At 400% zoom or narrow viewport, readers can complete the article without two-dimensional page scrolling.
- Code, math, tables, and citations are visibly more legible than the current renderer.

### Phase 3: Make Agent A Reading Companion

Objective: keep Agent useful, grounded, and compact inside the reading task.

Tasks:

1. Split `BlogAgentRoot.tsx` by responsibility:
   - frame and placement
   - streaming state
   - message list
   - source summary
   - context attachments
   - quota and trust toolbar
   - history
2. Keep the current additive public contract. Do not change tRPC routes or database schema in this phase.
3. Refine answer-first layout:
   - answer body gets default space
   - sources remain collapsed
   - citations summarize count and top sources
   - detailed snippets expand inline only on intent
4. Add follow-up affordances:
   - "explain this paragraph"
   - "compare with previous section"
   - "show source passages"
   - "turn into reading notes"
5. Add answer-quality eval dimensions:
   - cites at least one relevant source when retrieval is used
   - does not invent unsupported claims
   - refuses or narrows when source confidence is low
   - answer remains readable without expanding sources
6. Add Agent UI regression fixtures:
   - long answer with five sources
   - no-source refusal
   - current article scope
   - pasted private context
   - mobile sheet
   - desktop drag and resize

Acceptance criteria:

- Agent final answer remains visible after streaming completes.
- Sources never create page-level horizontal overflow.
- Answer-quality eval runs in CI or pre-release script.
- `BlogAgentRoot.tsx` becomes smaller through extracted local components and hooks, without changing behavior.

### Phase 4: Persist Reader Demand Signals

Objective: convert reader behavior into an author-facing backlog.

Tasks:

1. Normalize reader signals into a single internal shape:

```ts
type ReaderSignal = {
  id: string;
  kind: "search_miss" | "agent_question" | "agent_low_confidence" | "article_feedback" | "content_audit";
  articleSlug?: string;
  query?: string;
  excerpt?: string;
  severity: "low" | "medium" | "high";
  status: "new" | "triaged" | "planned" | "resolved" | "ignored";
  createdAt: string;
};
```

2. First implementation can be additive and minimal:
   - server-side durable store if an existing table or JSON store pattern exists
   - otherwise keep an explicit design note that DB migration is a later phase
3. Feed these sources into the backlog:
   - search miss map
   - Agent conversations and low-confidence answers
   - content audit failures
   - article feedback
4. Group signals by article, topic, and research track.
5. Add owner actions:
   - mark planned
   - link to article editor
   - open related Agent debug view
   - mark resolved after publish

Acceptance criteria:

- Owner can answer "what should I improve next?" from one page.
- Search misses and Agent gaps are no longer isolated debug artifacts.
- Resolved signals can be traced to a post update or an explicit ignore decision.

### Phase 5: Build The Author Improvement Cockpit

Objective: make `/manage/agent` and related owner tools feel like a product-quality editorial cockpit.

Tasks:

1. Restructure owner dashboard around jobs, not implementation internals:
   - content gaps
   - weak answers
   - search misses
   - stale knowledge index
   - articles needing style pass
2. Add a release readiness panel:
   - UI audit status
   - content audit status
   - Agent eval status
   - knowledge index freshness
   - recent publish mutations
3. Add article-level improvement queue:
   - title
   - track
   - top reader question
   - audit findings
   - suggested next edit
4. Preserve current debug affordances, but move them behind an advanced/details section.

Acceptance criteria:

- Owner dashboard is understandable without knowing internal module names.
- Debug details are still reachable.
- The page visually matches the editorial product, not an admin template.

### Phase 6: Raise Article Quality

Objective: reduce awkward, over-subjective, and AI-ish writing while keeping the author's technical voice.

Tasks:

1. Expand `scripts/audit/content-quality.ts` into three layers:
   - structural checks: H1, metadata, series, links, malformed Markdown
   - style checks: AI-ish phrases, vague claims, excessive first-person framing, unsupported certainty
   - usefulness checks: missing example, missing implication, missing source, missing takeaway
2. Fix audit scope:
   - article content should be scanned from seed post sources or an explicit article directory
   - project policy docs such as `agent.md` should not fail article-content rules
3. Add machine-readable output:
   - JSON findings with file, line, severity, category, and suggested rewrite intent
4. Add a short style guide:
   - prefer concrete claims over grand framing
   - use first person only for clear author positioning
   - avoid "本文将", "值得注意的是", "深入探讨" style filler
   - every technical article should expose problem, mechanism, evidence, limitation, and implication
5. Add a small golden set of good and bad paragraphs for the audit script.

Acceptance criteria:

- `corepack pnpm content:audit` no longer fails on project policy docs.
- Findings are specific enough to turn into edits.
- The audit can distinguish fatal content issues from style recommendations.

### Phase 7: Simplify Code Ownership

Objective: lower regression risk before broader implementation.

Tasks:

1. Refactor only where the current product loop requires it.
2. Split large files by responsibility:
   - `BlogAgentRoot.tsx`
   - high-density style files with Agent or reader ownership
   - owner dashboard sections if they mix unrelated concerns
3. Add focused tests before changing streaming, scroll, citations, or content audit behavior.
4. Keep public contracts additive unless a later approved implementation plan says otherwise.
5. Avoid new dependencies. Use Pointer Events, CSS tokens, existing icons, existing tRPC patterns, and current scripts first.

Acceptance criteria:

- Smaller modules have clearer names and test coverage.
- No route, database, auth, or deployment contract changes in the first implementation slice.
- Release checks remain runnable locally.

## Recommended Execution Order

This section describes the product dependency logic. The concrete no-confirmation execution waves are defined in [the review package](./2026-07-08-product-optimization-spec-review-package.md).

### Slice 1: Audit Scope And Visual Contract

Why first: it removes current false failures and creates stable UI rules before visible redesign.

Deliverables:

- Fix content audit scope for `agent.md` and other project docs.
- Add or update UI token map for reader and Agent surfaces.
- Add screenshot evidence for homepage, post page, search, and Agent.
- Produce a visible before/after report.

Suggested checks:

```bash
corepack pnpm check
corepack pnpm content:audit
corepack pnpm audit:ui
```

### Slice 2: Article Page And Markdown Upgrade

Why second: the article is the main product surface.

Deliverables:

- Markdown callouts, code labels, heading anchors, figure captions.
- Cleaner article first screen and mobile progressive disclosure.
- Fixtures for code, math, table, callout, citation-heavy posts.

Suggested checks:

```bash
corepack pnpm check
corepack pnpm audit:ui
```

### Slice 3: Agent Companion Refinement

Why third: Agent should be tuned against the improved reading surface.

Deliverables:

- Split Agent component responsibilities.
- Add Agent UI fixtures and answer-quality eval checks.
- Improve source summary and follow-up flows.

Suggested checks:

```bash
corepack pnpm check
corepack pnpm test
corepack pnpm audit:ui
```

### Slice 4: Reader Signal Backlog

Why fourth: once reading and Agent are stable, signals can become durable author work.

Deliverables:

- ReaderSignal internal model.
- Owner queue grouping search misses, Agent gaps, feedback, and content findings.
- Release readiness panel.

Suggested checks:

```bash
corepack pnpm check
corepack pnpm test
corepack pnpm content:audit
```

### Slice 5: Content Quality And Publishing Loop

Why fifth: writing improvements become more valuable after signals are flowing.

Deliverables:

- Expanded content quality rules.
- Article quality report.
- Author style guide.
- Publish refresh evidence linking content edits to Agent knowledge refresh.

Suggested checks:

```bash
corepack pnpm content:audit
corepack pnpm check
corepack pnpm build
```

## Measurement

Reader-facing measurements:

- First article content appears earlier on post pages.
- No page-level horizontal overflow on mobile.
- Article body line length stays readable on desktop.
- Agent answer remains visible after completion.
- Sources are discoverable but not space-dominant.

Author-facing measurements:

- Search misses are reviewable after process restart.
- Agent low-confidence cases appear in an owner queue.
- Content audit produces actionable findings, not only pass/fail.
- Publish flow can show knowledge index freshness.

Engineering measurements:

- `BlogAgentRoot.tsx` line count decreases through extraction.
- CSS `!important` usage decreases in Agent and reader surfaces.
- Release checks cover UI, content, and Agent answer quality.
- No public route or DB schema break in first implementation slice.

## Risks And Mitigations

Risk: visual cleanup becomes a broad CSS rewrite.

Mitigation: start with ownership map and token contract. Change one surface at a time and keep screenshot evidence.

Risk: Agent refactor changes streaming behavior.

Mitigation: add tests around final elapsed time, scroll behavior, source collapse, and streaming completion before extraction.

Risk: reader signals require a database migration too early.

Mitigation: first define the signal shape and reuse existing persistence patterns if present. Defer schema migration until the data contract is approved.

Risk: content audit becomes annoying instead of useful.

Mitigation: separate fatal failures from style recommendations and include suggested rewrite intent.

Risk: homepage loses useful density.

Mitigation: keep research tracks and search prominent, but reduce equal-weight card treatment.

## Decision Needed Before Implementation

Approve this design direction and the review package. After approval, implementation can proceed wave by wave without asking for per-slice confirmation, as long as each wave stays inside the named scope and records evidence.

Implementation should begin with the next unstarted wave from [the review package](./2026-07-08-product-optimization-spec-review-package.md). Stop only for irreversible actions, credential issues, schema migrations, force pushes, or deploys.
