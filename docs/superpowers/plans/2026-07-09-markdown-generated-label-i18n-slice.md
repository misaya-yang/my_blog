# Markdown Generated Label I18n Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-09-public-i18n-bilingual-reading-contract-design.md`
Status: Passed

## Goal

Localize MarkdownRenderer-generated UI labels so article and editor preview surfaces do not hard-code English for heading anchors, callout labels, code fallback labels, copy code, or table regions.

## Scope

In:

- Add Markdown-generated UI labels to the existing post i18n dictionary.
- Add a `language` prop to `MarkdownRenderer` and resolve defaults from i18n.
- Keep explicit `copyCodeLabel` and `tableLabel` overrides working.
- Pass language from `PostDetail` and `Editor`.
- Add focused renderer tests for Chinese labels.
- Write a slice evidence report.

Out:

- No article-body translation.
- No i18n framework migration.
- No CSS or layout change.
- No route or SEO change.
- No deploy.

## Expected Files

- `client/src/components/MarkdownRenderer.tsx`
- `client/src/components/MarkdownRenderer.test.tsx`
- `client/src/pages/PostDetail.tsx`
- `client/src/pages/Editor.tsx`
- `client/src/i18n/post.ts`
- `docs/product_optimization/reports/markdown-generated-label-i18n-slice-2026-07-09/summary.md`

## Validation

Focused:

```bash
corepack pnpm test -- client/src/components/MarkdownRenderer.test.tsx
```

Static:

```bash
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- Markdown heading anchors use localized accessible labels.
- Callout labels are localized for note, claim, caveat, implementation, and source.
- Code block fallback label is localized.
- Existing article page copy/table label overrides still work.
- Editor preview passes the selected language to the renderer.
