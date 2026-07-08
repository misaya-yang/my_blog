# Markdown Generated Label I18n Slice

Date: 2026-07-09
Status: Passed
Spec: `docs/superpowers/specs/2026-07-09-public-i18n-bilingual-reading-contract-design.md`
Plan: `docs/superpowers/plans/2026-07-09-markdown-generated-label-i18n-slice.md`

## Summary

Implemented the second approved Wave 1 code slice from the 2026-07-09 product optimization package. Markdown-generated UI labels now respect the selected language on article pages and in the editor preview. This removes hard-coded English from heading anchor labels, code fallback labels, callout labels, copy-code aria labels, and table region labels without translating article body content or changing Markdown rendering semantics.

## Changed Files

- `client/src/components/MarkdownRenderer.tsx`
- `client/src/components/MarkdownRenderer.test.tsx`
- `client/src/i18n/post.ts`
- `client/src/pages/PostDetail.tsx`
- `client/src/pages/Editor.tsx`
- `docs/superpowers/plans/2026-07-09-markdown-generated-label-i18n-slice.md`

## User-Visible Behavior

- Chinese UI mode now renders generated Markdown labels such as heading anchor aria text, callout labels, code labels, copy-code labels, and table-region labels in Chinese.
- English UI mode keeps existing English defaults.
- `PostDetail` and editor preview both pass the active language into `MarkdownRenderer`.
- Existing explicit `copyCodeLabel` and `tableLabel` overrides continue to work.

## Verification

```bash
corepack pnpm test -- client/src/components/MarkdownRenderer.test.tsx
```

Result: passed. Vitest executed the full configured suite: 46 test files, 290 tests passed.

```bash
corepack pnpm check
```

Result: passed.

```bash
corepack pnpm build
```

Result: passed.

```bash
git diff --check
```

Result: passed.

## Known Risks

- This slice localizes renderer-generated UI chrome only. It does not translate article body copy, code comments, filenames, or author-authored Markdown text.
- No browser screenshots were captured because this slice changes deterministic generated labels and accessibility text, not layout or styling.
