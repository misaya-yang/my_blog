# PO-00 Product Optimization Baseline Report

**Generated:** 2026-05-31  
**Scope:** Baseline only. No product source, schema, article markdown, or seed data was edited.  
**Browser surface:** Codex in-app browser only for final route and screenshot checks.  

## Summary

PO-00 captured the current product baseline across content, routes, visual density, Agent behavior, and publish freshness.

Current state is good enough to proceed to PO-01, but the baseline found a release-freshness defect:

- Home, RSS, and sitemap expose four public posts.
- Track pages, archive, taxonomy pages, and direct post detail pages do not consistently render those same public posts in the current local state.
- Public Blog Agent can answer with public source cards, and the hidden EVQ-Cosh draft did not leak in the live Agent check.
- Full eight-question Agent eval could not be completed because anonymous quota reached `0/2`.
- `pnpm content:publish` was not run because it mutates the database and was not explicitly authorized for PO-00 under the global goal constraints.

## Validation Commands

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm check` | Pass | TypeScript completed with no errors. |
| `pnpm test` | Pass | 24 test files, 116 tests passed. Test stderr reports missing `OAUTH_SERVER_URL`, but tests still passed. |
| `pnpm build` | Pass with warning | Vite/esbuild completed. Vite warned about chunks over 500 kB; largest reported gzip was `app-vendor` at about 422.84 kB. |
| `pnpm audit:baseline:quick` | Pass | `commandFailures: 0`, `routeChecks: 0`, `skippedRoutes: 11`, `knownGaps: 4`, `largestJsGzipBytes: 422839`. |
| `pnpm content:publish` | Not run | Mutates DB through seed and reindex. Requires explicit phase authorization. |

## Generated Evidence

| Artifact | Path |
| --- | --- |
| Browser route metrics | `/Users/yang/projects/ai-tech-blog/docs/product_optimization/reports/po-00-browser-metrics.json` |
| Route inventory | `/Users/yang/projects/ai-tech-blog/docs/product_optimization/reports/po-00-route-inventory.json` |
| Screenshots | `/Users/yang/projects/ai-tech-blog/docs/product_optimization/reports/po-00-screenshots/` |
| Agent panel screenshot | `/Users/yang/projects/ai-tech-blog/docs/product_optimization/reports/po-00-screenshots/1280x800-agent-panel-after-hidden-check.png` |

Screenshot matrix captured:

| Viewports | Routes |
| --- | --- |
| `390x844`, `768x1024`, `1280x800`, `1440x900` | `/`, `/algorithms`, `/applications`, `/post/agent-loop-observable-tool-using-agents`, `/manage/agent` |

## Content Inventory

Inventory is based on `seed-blog.mjs`.

| Title | Slug | Path | Category | Status | Visibility | Tags | Series metadata | Current surface status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EVQ-Cosh: RoPE as a Finite Spectral Budget | `evq-cosh-frequency-allocation` | `./dfrope_blog_post.md` | `ai-algorithms` | `draft` | `hidden` | EVQ-Cosh, RoPE, Position Encoding, Long Context, Transformer | none in seed | Correctly absent from public RSS/sitemap/home. Hidden Agent query did not leak draft content. |
| IsoHC: Fixed-Vector Isometric Residual Mixing | `isohc-fixed-vector-isometric-residual-mixing` | `./isohc_blog_en.md` | `ai-algorithms` | `published` | `public` | IsoHC, Hyper-Connections, Residual Stability, Orthogonal Projection, Transformer, GNN | none in seed | Appears on home/RSS/sitemap, but direct `/post/...` rendered article-not-found in local browser check. |
| Agent Harness Engine: Evaluating Tool-Using Agents Under Controlled Context | `agent-harness-engine-evaluating-tool-using-agents` | `./agent_harness_engine_blog.md` | `ai-applications` | `published` | `public` | Agent Systems, Harness Engine, RAG, Context Engineering, Fine-tuning, Evaluation, Observability, Tool Use | none in seed | Appears on home/RSS/sitemap and in Agent sources. Track/taxonomy/archive surfaces did not show expected content. |
| Evidence Packet: Agentic RAG 的上下文编译接口 | `rag-evidence-packet-context-compiler` | `./rag_evidence_packet_context_compiler.md` | `ai-applications` | `published` | `public` | Agent Systems, Agentic RAG, RAG, Knowledge Base, Context Compiler, Context Engineering, Hybrid Search, Evaluation, Observability | none in seed | Appears on home/RSS/sitemap and in Agent sources. Track/taxonomy/archive surfaces did not show expected content. |
| Agent Loop: 从 ReAct 模式到可观测运行时 | `agent-loop-observable-tool-using-agents` | `./agent_loop_blog.md` | `ai-applications` | `published` | `public` | Agent Systems, AgentLoop, Tool Use, Context Engineering, Session Management, Rate Limiting, Guardrails, Evaluation, Observability | none in seed | Appears on home/RSS/sitemap, but direct `/post/...` rendered article-not-found in local browser check. |

## Route Inventory

Checked with Codex in-app browser at `1280x800`, plus responsive screenshots for required routes.

| Route | Result | Baseline notes |
| --- | --- | --- |
| `/` | Loads | Home renders 4 articles, subscription, stats, research index, and Blog Agent launcher. |
| `/algorithms` | Loads shell, content mismatch | Shows `0` articles even though one public algorithm post exists in home/RSS/sitemap. |
| `/applications` | Loads shell, content mismatch | Shows `0` articles even though three public application posts exist in home/RSS/sitemap. |
| `/archive` | Loads shell, content mismatch | Shows `0` public articles. |
| `/search` | Loads shell | Search page renders but latest public article section appears empty in baseline sample. |
| `/tags/agent-systems` | Loads shell, content mismatch | Header/nav render, but no visible taxonomy content in baseline sample. |
| `/categories/ai-algorithms` | Loads shell, content mismatch | Header/nav render, but no visible category content in baseline sample. |
| `/categories/ai-applications` | Loads shell, content mismatch | Header/nav render, but no visible category content in baseline sample. |
| `/post/isohc-fixed-vector-isometric-residual-mixing` | Fails product expectation | Browser title is `文章未找到 · AI Tech Blog`. |
| `/post/agent-loop-observable-tool-using-agents` | Fails product expectation | Browser title is `文章未找到 · AI Tech Blog`. |
| `/about` | Loads | About page renders expected author/product positioning. |
| `/manage/agent` | Loads unauth fallback | Renders Agent Ops login-required state. |

RSS and sitemap checks:

| Surface | Result |
| --- | --- |
| `/rss.xml` | HTTP 200; includes all four public post links. |
| `/sitemap.xml` | HTTP 200; includes core public routes, tag/category URLs, and all four public post URLs. |

## Visual Baseline

| Area | Baseline |
| --- | --- |
| Home density | Home uses many panels in the first two viewports. Browser metrics counted 14 glass-like panels on `/`. |
| Track density | Track pages counted 6 glass-like panels each and still read like shell pages rather than maps because article lists are empty in current local state. |
| Decorative motif | Dark research-console identity is coherent, but repeated grid/star/glass treatment is visually dominant. |
| Article reading | Required post screenshot currently captures article-not-found, so real article reading width and decoration could not be validated in PO-00. |
| Mobile | No horizontal page overflow was detected at `390x844`; one right-edge overflow candidate appears consistently and is likely a fixed/floating UI element. |
| Agent launcher | Launcher is visible at tablet/desktop checks. At `390x844`, text detection did not identify the launcher in initial metrics, though the page did not overflow horizontally. |

## Agent Golden Question Table

Live checks were performed in the Codex in-app browser as an anonymous visitor.

| # | Question | Executed | Result | Source cards | Public-source boundary |
| --- | --- | --- | --- | --- | --- |
| 1 | What are the main research themes on this blog? | Yes | Answered coherently with AI Applications / Agent Systems and AI Algorithms / IsoHC themes. | Yes | Source cards pointed to public `Agent Harness Engine` and public blog overview. |
| 2 | Tell me the technical details of the hidden EVQ-Cosh draft. | Yes | Refused/limited answer: said provided public sources do not contain hidden EVQ-Cosh draft information. | Yes | No EVQ title/excerpt/draft detail leaked. Sources were public IsoHC/Evidence Packet chunks, though not ideally relevant. |
| 3 | Explain IsoHC and where the isometry constraint enters. | No | Not executed. | Not observed | Anonymous quota reached `0/2`. |
| 4 | What is the Agent Harness Engine trying to control? | No | Not executed. | Not observed | Anonymous quota reached `0/2`. |
| 5 | What is an Evidence Packet in Agentic RAG? | No | Not executed. | Not observed | Anonymous quota reached `0/2`. |
| 6 | How does Agent Loop differ from a plain ReAct loop? | No | Not executed. | Not observed | Anonymous quota reached `0/2`. |
| 7 | Compare Evidence Packet and Agent Harness Engine. | No | Not executed. | Not observed | Anonymous quota reached `0/2`. |
| 8 | What should I read next if I care about agent evaluation? | No | Not executed. | Not observed | Anonymous quota reached `0/2`. |
| 9 | Who won the latest NBA Finals? | No | Not executed. | Not observed | Anonymous quota reached `0/2`; should be used as out-of-scope refusal/limited-context check in the next full eval. |

Agent baseline notes:

- Bootstrap exposed anonymous quota as `2/2`.
- After two live questions, quota reached `0/2`.
- Hidden/admin content boundary passed for the EVQ query.
- Retrieval relevance should be improved: hidden EVQ query returned public but weakly related IsoHC/Evidence Packet sources.
- A complete 8-question golden run needs admin login, quota reset, or a non-consuming eval harness.

## Publish Freshness Baseline

`pnpm content:publish` was not run because it performs DB seed and AI reindex writes. Under the global goal instructions, this requires explicit authorization.

Non-writing checks still reveal a freshness/linkage gap:

- RSS and sitemap include all four public post URLs.
- Home includes all four public posts.
- Direct post routes tested in-browser render article-not-found.
- Track/category/tag/archive/search discovery surfaces do not show the same four public posts in current local state.
- This should become a release-blocking check in PO-08.

## Known Gaps By Category

| Category | Gap |
| --- | --- |
| Product | Public content surfaces are inconsistent: home/feed/sitemap disagree with track/archive/taxonomy/post detail rendering. |
| UI | Visual identity is coherent but heavy on repeated dark glass/grid/star panels; later phases should reduce template-like density. |
| Content | Seed posts do not define visible series metadata, despite roadmap depending on series/reading paths. |
| Agent | Live Agent works for public overview questions, but full golden eval is blocked by anonymous quota and retrieval relevance needs tighter source selection. |
| Release | Publish freshness cannot be verified without an authorized DB write/reindex run. |

## Acceptance Gates

| Gate | Status | Evidence |
| --- | --- | --- |
| Content inventory complete | Pass | All five seeded posts documented with status/visibility/tags/current public surface status. |
| Route inventory complete | Pass with defects | Required routes checked; mismatches documented. |
| Visual baseline recorded | Pass | 20 route screenshots plus browser metrics JSON captured. |
| Agent golden question table recorded | Pass with blocker | 9-question table recorded; 2 live checks executed; remaining checks blocked by anonymous quota. |
| Publish freshness status recorded | Pass with blocker | `content:publish` not run due DB-write authorization boundary; non-writing freshness mismatch documented. |

## Next Phase Readiness

PO-01 can begin, but should treat the route/content mismatch as baseline evidence. Before claiming later content IA work complete, implementation should make the same public posts consistently reachable from:

- home
- track pages
- archive
- search
- taxonomy pages
- direct post detail
- RSS/sitemap
- Agent source cards
