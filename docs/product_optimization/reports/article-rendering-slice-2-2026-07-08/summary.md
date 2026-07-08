# Article Rendering Slice 2 Evidence

Date: 2026-07-08
Branch: dev

## Scope

- Added visible heading anchor links for rendered article headings with stable IDs.
- Added GitHub-style article callouts for `[!NOTE]`, `[!CLAIM]`, `[!CAVEAT]`, `[!IMPLEMENTATION]`, and `[!SOURCE]` blockquotes.
- Added code block metadata labels for language and optional `title` or `filename` fence metadata.
- Preserved copy button behavior and existing inline code/table/math/image rendering.

## Commands

- PASS: `corepack pnpm test -- client/src/components/MarkdownRenderer.test.tsx`
- PASS: `corepack pnpm check`
- PASS: `corepack pnpm build`
- PASS: `AUDIT_BASE_URL=http://localhost:3000 corepack pnpm audit:ui`

## Remaining Work

- Figure caption treatment.
- Table caption treatment.
- PostDetail first-screen layout pass.
- Mobile progressive disclosure for TOC, related posts, feedback, and subscription modules.
