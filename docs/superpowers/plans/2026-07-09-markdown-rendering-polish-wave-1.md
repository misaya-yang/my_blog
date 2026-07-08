# Markdown Rendering Polish Wave 1 Plan

Date: 2026-07-09
Status: In progress
Spec source: `docs/superpowers/specs/2026-07-08-article-reading-rendering-design.md`

## Scope

Improve article Markdown rendering primitives without changing article content, routes, server APIs, or dependencies.

## Goals

- Add figure and caption recognition for the existing Markdown convention: image paragraph followed by emphasized `Figure:` or `图：` text.
- Give code blocks stable semantic wrapper classes for metadata, pre content, and copy controls.
- Keep code copy behavior unchanged: copied text excludes labels and filenames.
- Keep tables and math constrained to internal overflow, never page-level horizontal scroll.
- Add tests for figure/caption rendering and code block classes.

## Non-Goals

- No MDX runtime.
- No editor rewrite.
- No migration of existing article Markdown.
- No new dependency.
- No server or database changes.

## Intended Files

- `client/src/components/MarkdownRenderer.tsx`
- `client/src/components/MarkdownRenderer.test.tsx`
- `client/src/styles/visual-refresh.css`
- `docs/product_optimization/reports/markdown-rendering-polish-wave-1-2026-07-09/summary.md`

## Implementation Steps

1. Add paragraph detection helpers for image-only paragraphs and figure captions.
2. Render image-only paragraphs as `figure.article-figure`.
3. Render emphasized caption paragraphs as `p.article-figure-caption`.
4. Add semantic classes to code block shell, pre, metadata, and copy button.
5. Add tests for figure, caption, code metadata, copy exclusion, and table wrapper retention.
6. Add final-layer CSS for figure/caption and code block polish in light/dark/mobile.
7. Capture browser evidence on an article route and run focused/full gates.

## Verification Commands

```bash
corepack pnpm test -- client/src/components/MarkdownRenderer.test.tsx
corepack pnpm check
corepack pnpm content:audit
corepack pnpm build
corepack pnpm audit:ui
```

## Risks

- Paragraph detection can over-classify italic text. Only treat captions starting with `Figure:` or `图：` as captions.
- Figure wrapping can alter image spacing. Keep the wrapper unframed and close to existing image styling.
- Code block CSS can become decorative. Keep it textual and metadata-first, without fake terminal chrome.
