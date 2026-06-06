# 2026-06-06 Final QA

## Scope

- Public UI: home, AI Algorithms, AI Applications, FFN article, search, login, Agent ops.
- Content: six public posts, including `gated-ffn-multiplicative-channel-control`.
- Agent/RAG: current-page grounding, IsoHC retrieval, streaming events, source cards, quota.
- Release risk: schema/deploy docs review, DB content publish, freshness gate.

## Evidence

- Screenshots:
  - `screenshots/20-home-final-local.jpg`
  - `screenshots/21-algorithms-final-local.jpg`
- HTTP/API:
  - `GET /post/gated-ffn-multiplicative-channel-control` returned `200`.
  - `posts.list` returned `6` public posts across `ai-applications` and `ai-algorithms`.
  - `posts.getBySlug(gated-ffn-multiplicative-channel-control)` returned the FFN post, `ai-algorithms`, 7 tags, formula-bearing content.
- Browser DOM:
  - Home desktop/mobile: no horizontal overflow, shows 6 articles, 2 categories, active reading lanes.
  - Algorithms desktop: no horizontal overflow, shows Residual Stability and feed-forward series.
  - Applications desktop: no horizontal overflow, resolves to 4 public posts and Agent Runtime Systems reading path.
  - FFN article desktop/mobile: title, entry layer, headings, KaTeX blocks, related links, and feedback section render.
  - Search `ffn`: returns one FFN article result.
  - Login: reader/admin copy is plain and non-theatrical.
  - Manage Agent: loads ops shell without public overflow.
- Agent/RAG:
  - Current article question `这篇文章核心是什么？` streamed `status`, `reasoning_delta`, `answer_delta`, `final`.
  - Current article answer cited only `Gated FFN: Transformer 里的乘法通道`.
  - Site question `帮我详细讲讲iso` retrieved `IsoHC: Fixed-Vector Isometric Residual Mixing`.
  - Anonymous quota observed as 10/day locally.

## Fixes From QA

- Republished content and reindexed knowledge so local data reflects 6 public posts and 90 public knowledge chunks.
- Removed a stale TODO-like phrase from the Goal Harness article.
- Renamed the feed-forward series copy to avoid generic "AI" language.
- Fixed track pages so slow post queries no longer show a misleading `0` articles / `0` views state before data resolves.

## Known Notes

- Local Supabase-backed reads are slow from this environment, so track pages may briefly show shell/loading content before the post query resolves.
- The in-app Browser screenshot command timed out on some heavier pages after the dev server restart; DOM and HTTP checks were used for those pages.
