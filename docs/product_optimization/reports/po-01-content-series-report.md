# PO-01 Content Source and Series System Report

**Generated:** 2026-05-31  
**Scope:** Content metadata organization only. Article technical substance was not edited.  

## Summary

PO-01 keeps `seed-blog.mjs` as the source of truth for article metadata and adds a bounded series system on top of the existing post curation fields:

- `seriesSlug`
- `seriesTitle`
- `seriesOrder`
- `featuredRank`
- `pinnedTrack`
- canonical `publishedAt`

No schema migration or frontmatter migration was introduced.

## Changed Files

| File | Change |
| --- | --- |
| `/Users/yang/projects/ai-tech-blog/seed-blog.mjs` | Added `seriesSeeds`, primary series derivation, canonical publish dates, featured ranks, pinned tracks, seed validation, and SQL upsert support for existing curation columns. |
| `/Users/yang/projects/ai-tech-blog/docs/product_optimization/reports/po-01-content-series-report.md` | Phase report and acceptance evidence. |

## Series Catalog

| Series | Track | Public ordered posts | Private/hidden associations | Expected next placeholders |
| --- | --- | --- | --- | --- |
| Agent Runtime Systems | applications | Agent Harness Engine -> Evidence Packet -> Agent Loop | none | Tool ABI; Context Budget |
| Agentic RAG Infrastructure | applications | Evidence Packet | none | Hybrid retrieval; Retrieval evals |
| Long Context and Position Encoding | algorithms | none yet | EVQ-Cosh hidden draft | RoPE spectral budget note; Long-context extrapolation failure modes |
| Residual Stability | algorithms | IsoHC | none | Residual mixing diagnostics; Orthogonal constraints |

The public catalog intentionally does not place hidden EVQ-Cosh into `orderedPostSlugs`.

## Public Post Metadata

| Post | Primary series | Series order | Featured rank | Pinned track | Canonical published date |
| --- | --- | --- | --- | --- | --- |
| Agent Loop | Agent Runtime Systems | 3 | 1 | applications | 2026-05-31T00:30:00.000Z |
| Evidence Packet | Agent Runtime Systems | 2 | 2 | applications | 2026-05-31T00:20:00.000Z |
| Agent Harness Engine | Agent Runtime Systems | 1 | 3 | applications | 2026-05-31T00:10:00.000Z |
| IsoHC | Residual Stability | 1 | 4 | algorithms | 2026-05-31T00:00:00.000Z |

Hidden draft:

| Post | Status | Visibility | Series association | Public ordered series |
| --- | --- | --- | --- | --- |
| EVQ-Cosh | draft | hidden | Long Context and Position Encoding | absent |

## Source Of Truth Policy

For this phase, `seed-blog.mjs` remains the source of truth for:

- seeded post status/visibility
- category
- tags
- excerpt
- canonical publish date
- primary display series
- featured ordering
- track pinning

Frontmatter migration is intentionally deferred. If introduced later, it should replace the relevant seed fields rather than create another competing metadata source.

## Publish Date Safety

Previously, seeding used `new Date()` for every published post, which could drift published timestamps on repeated seed runs.

PO-01 changes this to canonical `publishedAt` values stored in seed metadata and upserted into `posts.published_at`. Changing a publish date now requires editing the canonical seed value explicitly.

## Hidden Boundary

`validateContentSeeds()` now checks:

- duplicate post slugs
- required excerpts and tags
- public posts have valid canonical dates
- public posts have a primary series
- public `orderedPostSlugs` do not include non-public posts
- private series associations do not include public posts

This keeps hidden/draft content out of public series catalogs by construction.

## Validation

| Command | Result |
| --- | --- |
| `node --check seed-blog.mjs` | Pass |
| `pnpm check` | Pass |
| `pnpm exec vitest run server/discovery.test.ts server/discovery.router.test.ts` | Pass, 8 tests |

`pnpm db:seed` and `pnpm content:publish` were not run because they mutate the database and were not explicitly authorized for this phase.

## Acceptance Gates

| Gate | Status | Evidence |
| --- | --- | --- |
| Every public post has required metadata | Pass | Public posts now have category, tags, excerpt, canonical published date, primary series, series order, featured rank, and pinned track. |
| At least two visible series are expressible | Pass | Agent Runtime Systems and Residual Stability have public ordered posts; Agentic RAG Infrastructure also has a public first post. |
| Hidden/draft posts absent from public series/discovery/Agent surfaces | Pass by seed contract | EVQ-Cosh remains `draft`/`hidden` and is not in any public `orderedPostSlugs`. |
| Seed does not duplicate posts or drift dates | Pass by validation and canonical dates | Duplicate slug validation added; `new Date()` publish behavior removed from seeded public posts. |

## Follow-up For Later Phases

PO-02/PO-04 can render reading paths from post `seriesSlug`, `seriesTitle`, and `seriesOrder`.

The PO-00 route mismatch remains unresolved by design: this phase prepares metadata but does not run DB writes or change discovery queries.
