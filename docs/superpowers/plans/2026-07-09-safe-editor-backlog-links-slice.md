# Safe Editor Backlog Links Slice

Date: 2026-07-09
Spec source: `docs/superpowers/specs/2026-07-09-product-optimization-spec-review-package.md`
Primary spec: `docs/superpowers/specs/2026-07-09-owner-writing-publish-studio-design.md`
Status: Passed

## Goal

Move owner writing backlog links closer to the editor intent contract by including safe `article` query params for public feedback items and keeping private feedback text out of URLs.

## Scope

In:

- Add a safe `buildEditorIntentHref` helper for writing backlog links.
- Include `article=<public-slug>` for feedback backlog items when available.
- Keep search-miss backlog links article-free.
- Extend engagement router tests for feedback and search-miss href contracts.
- Write a slice evidence report.

Out:

- No editor UI changes.
- No schema migration.
- No private feedback body or direct contact data in URLs.
- No deploy.

## Expected Files

- `server/engagement.router.ts`
- `server/engagement.router.test.ts`
- `docs/product_optimization/reports/safe-editor-backlog-links-slice-2026-07-09/summary.md`

## Validation

```bash
corepack pnpm test -- server/engagement.router.test.ts
corepack pnpm check
corepack pnpm build
git diff --check
```

## Acceptance

- Feedback backlog `draftHref` includes `source=feedback`.
- Feedback backlog `draftHref` includes the public `article` slug when available.
- Feedback backlog `draftHref` does not include reply email or private message text.
- Search miss backlog `draftHref` includes `source=search_miss` and does not include `article`.
