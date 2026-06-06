# Research Product Coherence PR Plan

**Purpose:** Turn the post-PO review into a PR-sized delivery queue. The completed `docs/product_optimization` roadmap built the main product loop; this plan tightens the remaining seams between public content, reading paths, Agent trust, visual calm, and engineering reliability.

## Execution Rules

- Work one PR at a time.
- Keep each PR shippable, tested, and reversible.
- Prefer existing routes, schema, components, and audit scripts.
- Do not add pgvector, autonomous browsing, PDF ingestion, public `/agent` workspace, or author impersonation.
- Never expose hidden/admin/draft content in discovery, RSS, sitemap, track maps, Agent answers, or Agent source cards.
- Every PR must record validation commands and browser checks in the PR notes.

## PR Queue

| PR     | Name                                | Outcome                                                                                                                | Primary Paths                                                                                                 | Validation                                          |
| ------ | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| RPC-01 | Series and Track Source of Truth    | Seed content, track maps, and publish freshness use one series catalog.                                                | `shared/content-series.ts`, `seed-blog.mjs`, `client/src/lib/tracks.ts`, `scripts/audit/publish-freshness.ts` | `pnpm check`, focused vitest, `pnpm content:verify` |
| RPC-02 | Homepage First-Step IA              | First viewport guides readers to Algorithms, Applications, and one recommended start without competing modules.        | `client/src/pages/Home.tsx`, `client/src/i18n/home.ts`, `client/src/index.css`                                | `pnpm check`, browser `/` at desktop/mobile         |
| RPC-03 | Article Reading Entry               | Article headers become calmer: title, summary, series position, compact tags, article-aware Agent prompts.             | `client/src/pages/PostDetail.tsx`, `client/src/components/agent/*`, `client/src/index.css`                    | article browser checks, agent route-context tests   |
| RPC-04 | Search Recovery and Content Backlog | Zero-result search suggests related topics and can convert misses into owner-only writing opportunities.               | `server/discovery.ts`, `client/src/pages/Search.tsx`, `client/src/pages/ManageAgent.tsx`                      | discovery and engagement tests                      |
| RPC-05 | Agent Trust Contract                | Streaming and non-streaming Agent paths share citation/source expectations, freshness status, timeout/cancel behavior. | `server/ai/*`, `client/src/components/agent/*`                                                                | agent vitest suite, local golden questions          |
| RPC-06 | Visual Density Pass                 | Reduce repetitive glass/chip/glow usage while preserving the dark research identity.                                   | `client/src/index.css`, `ResearchShell`, `ArticleCard`, `SubscriptionForm`                                    | browser screenshots across required viewports       |
| RPC-07 | Engineering Split and Guardrails    | Split oversized routers/components and harden body limits/rate limit abstractions without behavior drift.              | `server/routers.ts`, `BlogAgentRoot.tsx`, `server/app.ts`                                                     | full test suite, build, regression browser pass     |

## Progress

- Completed in this branch: RPC-01, RPC-02, RPC-03, RPC-04, RPC-05, RPC-06, RPC-07.
- RPC-05 delivered: Agent stream/tRPC input boundaries now share one schema; `/api/agent/stream` has a request-size guard; stream UI supports cancel and a 45s timeout; stream/no-source paths have source-card persistence tests; page-aware retrieval understands Chinese technical phrasing and keeps deictic current-article questions scoped to the current post; streamed Markdown carries a hidden source marker contract that is stripped before display and used to select public source cards.
- RPC-06 delivered: global surface tokens, glass panels, chips, article cards, stat tiles, research index rows, subscription controls, and Agent floating surfaces were calmed without changing the dark research identity or route structure.
- RPC-07 delivered: auth and engagement routers moved out of the app router aggregator; request helpers, blog admin procedure, windowed rate limits, search-miss storage, Agent stream client, Agent message normalization, and Agent shared types now live in focused modules.
- Remaining external-auth evidence gap: `/manage/agent` owner UI browser regression still requires an authenticated owner session. Backend/admin behavior is covered by tests.

## Latest Completed PR: RPC-04

### Goal

Turn search misses into useful recovery paths for readers and owner-only writing opportunities for the author.

### Acceptance Gates

- Zero-result public search shows recovery actions instead of a dead-end empty state.
- Recovery actions include nearby topics, research paths, and an Ask Blog Agent action.
- Zero-result queries become owner-only content opportunities without email, IP, visitor identity, or hidden/admin/draft content.
- Content Radar surfaces search miss opportunities separately from Agent question radar.
- Tests cover search miss recording, admin-only access, aggregation, and privacy boundaries.

### Required Evidence

- Changed files listed in the final report.
- `pnpm check` result.
- Focused vitest result for discovery/engagement coverage.
- Browser check for `/search?q=<unlikely-query>` showing recovery actions.
- Browser check that the Ask Blog Agent action opens the Blog Agent with a query-aware prompt.

## Completed PR: RPC-05

### Goal

Make the Blog Agent contract consistent across streaming and non-streaming paths without changing the public Agent product surface.

### Completed Acceptance Gates

- tRPC and SSE message inputs share the same route context, scope, message, and answer mode schema.
- SSE rejects oversized route context fields instead of accepting unbounded prompt context.
- `/api/agent/stream` has a small request-size guard before the global JSON parser.
- Tests cover bounded route context and scope values.
- Public reasoning display is intentionally retained for the current DeepSeek-backed product direction, while deterministic trace stages remain visible in the collapsed reasoning panel.
- Stream UI has client-side cancellation and timeout behavior that restores the draft instead of leaving a stuck assistant message.
- Streamed source cards are persisted in `sourceJson` and match the final SSE output.
- Streamed no-source refusals bypass the model and persist empty source cards.
- SSE client disconnects propagate an abort signal into the model/provider path and are recorded as `agent_stream_aborted`.
- Current-article deictic questions such as “这页里面的固定向量到底起什么作用？” and “这篇文章后半部分有没有讲实现或者失败边界？” retrieve relevant current-post sections instead of only metadata/opening chunks.
- Explicit find/related-article questions from a post page, such as “帮我找 AgentLoop 那篇”, can still retrieve other public posts.
- Source cards preserve section-level `sourceId` entries instead of collapsing all evidence to one card per post.
- Streamed Markdown instructs the model to emit exactly one hidden `blog-agent-sources` marker with selected source IDs; the server strips that marker from the visible answer and filters cards to public retrieved sources only.

### Latest Validation Evidence

- `pnpm exec vitest run server/ai/knowledge.test.ts server/ai/model.test.ts server/ai/harness.test.ts` - pass, 3 files / 47 tests.
- `pnpm exec vitest run server/ai/harness.test.ts server/ai/model.test.ts server/_core/llm.test.ts server/agent.router.test.ts client/src/components/agent/BlogAgentRoot.test.ts` - pass, 5 files / 44 tests.
- `pnpm check` - pass.
- `pnpm test` - pass, 27 files / 159 tests.
- `pnpm build` - pass.
- `pnpm content:verify` - pass, 5 public posts / 70 chunks / 0 blockers.
- In-app Browser: `/post/isohc-fixed-vector-isometric-residual-mixing` loads without visual blocking in the first viewport.
- In-app Browser: opening the Blog Agent panel on `/post/isohc-fixed-vector-isometric-residual-mixing` shows “当前文章上下文已接入”.
- In-app Browser: `/search?q=unlikely-rpc-current-state-zzzz` shows zero-result recovery state.
- Local SSE regression: `帮我详细讲讲iso` returns `completed` with source slug `isohc-fixed-vector-isometric-residual-mixing`.
- Local SSE regression: `ISO 8601 是什么？` returns a `no_public_source` refusal with `sourceCount: 0`.
- Local SSE regression: `这页里面的固定向量到底起什么作用？` returns `completed` and cites `4. Fixed-Vector Orthogonal Decomposition`.
- Local SSE regression: `文中说的等距约束和双随机约束有什么区别？` returns `completed` and cites `2. From Mean Preservation to Isometry`.
- Local SSE regression: `这篇文章后半部分有没有讲实现或者失败边界？` returns `completed` with only IsoHC section-level source cards, including `7. Implementation Mapping`, `8. Precision and Engineering Considerations`, `10. Evidence Framing`, and `11. Core Takeaway`.
- Local SSE regression: streamed Markdown source marker is stripped from the final visible answer while preserving section-level public source cards.

### Remaining Acceptance Gates

- Add browser regression for conversation history reload once owner auth is available.
- Add a semantic claim-to-evidence audit if the product later needs stricter citation grading than source-ID selection.
- Keep source cards public-only across future citation-contract changes.

## Completed PR: RPC-06

### Goal

Reduce repetitive glow/glass/chip density while keeping the recognizable dark research product identity.

### Completed Acceptance Gates

- `--glass-*` and `--surface-*` tokens now use lower border alpha, lower highlight alpha, shorter shadows, and calmer blur/saturate settings.
- `.glass-panel`, `.glass-button`, `.signal-chip`, `.stat-tile`, `.article-card`, `.article-tag`, `.reading-surface`, `.toc-surface`, `.agent-liquid-*`, `.home-start-card`, `.series-card`, `.track-series-card`, `.research-index-row`, and subscription language controls use quieter borders/backgrounds.
- Cards remain 8px radius or lower and preserve existing page structure, route layout, and content hierarchy.
- Browser DOM check verified that homepage panels resolve to the updated `--surface-border`, reduced `box-shadow`, and `blur(12px) saturate(1.18)`.

### Validation Evidence

- `pnpm check` - pass.
- `pnpm test` - pass, 27 files / 159 tests.
- `pnpm build` - pass.
- Browser, single existing in-app tab: `/` shows track entries, article cards, Agent launcher, and updated panel styles.
- Browser, single existing in-app tab: `/applications` and `/algorithms` show track copy, series cards, and article cards.
- Browser, single existing in-app tab: `/post/agent-loop-observable-tool-using-agents` and `/post/isohc-fixed-vector-isometric-residual-mixing` load public article surfaces.
- Browser, single existing in-app tab: `/search?q=unlikely-rpc-current-state-zzzz` shows zero-result recovery state.

## Completed PR: RPC-07

### Goal

Split oversized router/component files and harden shared guardrails without changing public API paths.

### Completed Acceptance Gates

- `server/routers.ts` is now the app router aggregator plus blog CRUD/taxonomy routers; auth and engagement moved to focused modules.
- Blog admin cookie authorization is centralized in `server/blogAdminProcedure.ts`, separate from the app-level Manus/admin procedure.
- Request source/header helpers moved to `server/httpRequest.ts`.
- Admin login and engagement submission rate limits use the shared `server/rateLimit.ts` window helper while preserving existing limits and error messages.
- Zero-result search miss storage moved to `server/searchMisses.ts`, so discovery can record misses and owner-only Content Radar can read them without router state coupling.
- Agent stream client moved to `client/src/components/agent/streamClient.ts`.
- Agent persisted-message normalization moved to `client/src/components/agent/messageState.ts`.
- Agent shared UI/data types moved to `client/src/components/agent/types.ts`.
- `server/routers.ts` reduced from 1026 lines to 438 lines; `client/src/components/agent/BlogAgentRoot.tsx` reduced from 1641 lines to 1356 lines.

### Validation Evidence

- Focused regression: `pnpm exec vitest run server/engagement.router.test.ts server/posts.test.ts server/auth.logout.test.ts client/src/components/agent/BlogAgentRoot.test.ts client/src/lib/tracks.test.ts client/src/pages/searchRecovery.test.ts` - pass, 6 files / 45 tests.
- `pnpm check` - pass.
- `pnpm test` - pass, 27 files / 159 tests.
- `pnpm build` - pass.
- `pnpm content:verify` - pass, 5 public posts / 70 chunks / 0 blockers.
- Browser, single existing in-app tab: release-gate checks completed for `/`, `/applications`, `/algorithms`, one application article, one algorithm article, and `/search`.

## Release Gate

Before the full coherence sprint is considered complete, run:

```bash
pnpm check
pnpm test
pnpm build
pnpm content:verify
```

Then run browser checks with the Codex in-app Browser for:

- `/`
- `/applications`
- `/algorithms`
- one public application article
- one public algorithm article
- `/search`
- `/manage/agent` when owner auth is available

Latest release-gate status:

- `pnpm check` - pass.
- `pnpm test` - pass, 27 files / 159 tests.
- `pnpm build` - pass.
- `pnpm content:verify` - pass, 5 public posts / 70 chunks / 0 blockers.
- Browser, single existing in-app tab: `/`, `/applications`, `/algorithms`, `/post/agent-loop-observable-tool-using-agents`, `/post/isohc-fixed-vector-isometric-residual-mixing`, and `/search?q=unlikely-rpc-current-state-zzzz` passed DOM checks.
- `/manage/agent` owner UI browser check not run because no owner-authenticated Browser session was available in this run.
