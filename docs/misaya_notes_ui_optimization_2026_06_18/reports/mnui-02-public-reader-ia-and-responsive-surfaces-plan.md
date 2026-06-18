# MNUI-02 Public Reader IA And Responsive Surfaces Plan

**Status:** in progress

## Scope

Apply the MNUI-01 token foundation to public reader pages only. Preserve public URLs, SEO metadata behavior, public/private content filtering, existing article data, and the Blog Agent backend.

## Requirement Mapping

| Gate | Implementation | Validation |
| --- | --- | --- |
| Two-track home entry | Keep newest note, Applications path, and Algorithms path in the first viewport; add `research-orbit-hero.jpg` as an unframed background signal. | Desktop/mobile Home screenshots; `pnpm audit:baseline:quick` |
| Shell and asset coherence | Use existing `client/public/images/research-orbit-hero.jpg` and article thumbnails already present in `client/public/images/article-thumbs`. | Screenshot metrics; asset path check |
| Dense scan surfaces | Normalize Archive and Search tags to `article-tag` so they inherit shared Tag styling and stable pill dimensions. | Reader Vitest; Archive/Search screenshots |
| Reading-first article page | Preserve current Post detail reading hierarchy, entry layer, TOC, mobile fallback, and article typography. | Desktop/mobile Post screenshots |
| Content boundary | Do not alter tRPC filters, post status filters, schemas, seed data, or Agent backend behavior. | `pnpm content:audit`; route baseline |

## Edit Boundary

Expected changed files:

- `client/src/styles/visual-refresh.css`
- `client/src/pages/Archive.tsx`
- `client/src/pages/Search.tsx`
- MNUI-02 report and runtime docs

## Completion Rule

MNUI-02 is complete only when reader validation commands pass, required route screenshots exist, no overflow/console issues are found in screenshot metrics, public content boundaries remain unchanged, and MNUI-F003 has evidence.
