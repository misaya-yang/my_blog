# Article Reading And Markdown Rendering Design

Date: 2026-07-08
Status: Proposed
Parent spec: [Reading and writing loop optimization](./2026-07-08-reading-writing-loop-optimization-design.md)

## Summary

The article page should become the strongest surface in the product. Current Markdown support is solid for a baseline technical blog, but the next pass should make AI systems writing easier to scan, verify, and revisit.

This spec focuses on `PostDetail.tsx`, `MarkdownRenderer.tsx`, and adjacent reading components. It keeps persisted post content Markdown-first and avoids new dependencies.

## Goals

- Improve article first-screen hierarchy.
- Make technical Markdown rendering more publication-grade.
- Add structured callouts, anchors, captions, code labels, and safer overflow behavior.
- Improve mobile reading by collapsing secondary modules.
- Preserve current content, routes, and seed pipeline.
- Provide fixtures and tests so renderer changes do not regress.

## Non-Goals

- No editor rewrite in this spec.
- No database schema change.
- No migration away from Markdown.
- No custom MDX runtime.
- No new rendering dependency unless a later plan proves the current stack cannot support a required primitive.

## Current Components

Primary:

- `client/src/pages/PostDetail.tsx`
- `client/src/components/MarkdownRenderer.tsx`
- `client/src/components/MarkdownRenderer.test.tsx`
- `client/src/components/ResearchShell.tsx`
- `client/src/components/SeriesProgress.tsx`
- `client/src/components/ArticleFeedback.tsx`
- `client/src/components/SubscriptionForm.tsx`

Supporting:

- `client/src/i18n/post.ts`
- `client/src/lib/publicArticles.ts`
- `server/publicSeedPosts.ts`
- `seed-blog.mjs`
- `scripts/audit/content-quality.ts`

## Article Page Information Hierarchy

Priority order:

1. Article title.
2. One-sentence thesis or summary.
3. Reading metadata: date, track, time, series, language.
4. Article body.
5. In-reading support: TOC, Agent, prerequisites, next concept.
6. Feedback, related posts, subscription, footer.

Desktop layout:

- Main reading column centered or slightly left of center.
- TOC rail remains secondary and visually quiet.
- Agent launcher stays available but not dominant.
- Side modules should not create a boxed dashboard around the article.

Mobile layout:

- One column.
- TOC collapsed by default.
- Series progress compact.
- Agent opens as a sheet.
- Feedback and subscription appear after the reader has reached article completion or near the end.

## Markdown Primitive Contract

### Heading Anchors

Behavior:

- H2 and H3 headings receive stable IDs.
- Anchor control appears on hover and keyboard focus.
- Anchor copy should not shift layout.
- Link target accounts for sticky header offset.

Acceptance:

- Deep links land with the heading visible.
- Keyboard users can focus and copy the anchor.

### Callouts

Use GitHub-style blockquote labels so content remains valid Markdown:

```markdown
> [!NOTE]
> A useful clarification.

> [!CLAIM]
> A central claim that should be supported nearby.

> [!CAVEAT]
> A limitation or boundary condition.

> [!IMPLEMENTATION]
> A concrete engineering note.

> [!SOURCE]
> A source note or evidence pointer.
```

Renderer behavior:

- Recognize the first marker line.
- Render as a semantic callout with icon, title, and body.
- Preserve normal blockquote rendering for unrecognized blockquotes.
- Keep callouts readable in both light and dark modes.

Acceptance:

- Unknown blockquotes still render as normal quotes.
- Callout body supports inline code, links, and math.

### Code Blocks

Behavior:

- Show language label when a code fence language exists.
- Preserve copy button.
- Support optional filename metadata if already present in the fence info string.
- Use horizontal scrolling inside the code block only, never page-level scrolling.
- Avoid decorative fake terminal chrome unless the code is actually shell output.

Possible fence pattern:

````markdown
```ts title="server/ai/harness.ts"
const value = 1;
```
````

Acceptance:

- Existing code fences still render.
- Long lines scroll inside the block.
- Copy excludes the label and filename.

### Tables

Behavior:

- Tables live inside an overflow container.
- Table captions can be provided by a preceding paragraph pattern if needed later.
- Header cells remain legible in both themes.
- Table wrapper should not create a page-level horizontal scrollbar.

Acceptance:

- At 390px width, table overflow is contained.
- At 400 percent zoom, page-level reflow still works.

### Math

Behavior:

- Keep KaTeX rendering.
- Inline math should not break line height.
- Display math can scroll inside its own container when necessary.
- Math errors should fail visibly in development or tests, not silently corrupt layout.

Acceptance:

- Long display equations do not break page width.
- Math remains readable in dark mode.

### Figures And Captions

Markdown convention:

```markdown
![Alt text](image-url)
_Figure: Short caption._
```

Renderer behavior:

- Preserve alt text.
- Style a caption immediately following an image.
- Reserve image dimensions where possible when metadata exists.
- Do not overlay pills or decorative labels on images.

Acceptance:

- Captions are clearly tied to images.
- Missing alt text is flagged by content audit in a later phase.

## Reading Aids

### Article Brief

Add a compact brief above the body when metadata supports it:

- What problem this article answers.
- What concept it depends on.
- What the reader should take away.

This can initially be derived from existing excerpt and track metadata. Do not invent new article fields until implementation review approves it.

### Prerequisites

Use existing tags, series, or track metadata first.

Examples:

- "Useful before this: RoPE basics"
- "Next concept: evaluation harnesses"

Acceptance:

- No dead prerequisite links.
- Empty prerequisite state is omitted, not filled with generic copy.

### Reading Progress

Behavior:

- Subtle, not a large progress dashboard.
- Does not cover content.
- Respects reduced motion.

Acceptance:

- Progress indicator does not cause layout shift.
- It is hidden or simplified on very small screens if it harms reading.

## Content Fixtures

Add or identify one fixture article with:

- H2 and H3 headings.
- Long code block.
- Inline and display math.
- Wide table.
- Image and caption.
- At least three callout types.
- Internal anchor link.
- External source link.

The fixture can live in tests or seed content, depending on implementation constraints.

## Tests

Unit tests:

- `MarkdownRenderer` recognizes callout markers.
- Unknown blockquotes remain unchanged.
- Code labels render without changing copied text.
- Heading anchors produce stable IDs.
- Tables and math receive overflow containers.

Browser checks:

- Post page at 1440x900 light.
- Post page at 1024x768 dark.
- Post page at 390x844 light and dark.
- Long code and wide table do not create page-level horizontal overflow.

Commands:

```bash
corepack pnpm check
corepack pnpm test -- client/src/components/MarkdownRenderer.test.tsx
corepack pnpm audit:ui
corepack pnpm build
```

## Risks

Risk: renderer adds too much custom parsing.

Mitigation: use simple Markdown-compatible conventions and keep fallbacks for unknown syntax.

Risk: article page becomes more feature-heavy.

Mitigation: reading aids are omitted when data is absent and collapsed on mobile.

Risk: code block metadata parsing breaks existing fences.

Mitigation: treat metadata as optional and never alter the raw code payload.

## Acceptance Checklist

- Article body is visually dominant.
- Markdown primitives work in light and dark modes.
- Mobile post page has no page-level horizontal overflow.
- Existing articles render without content migration.
- Tests cover the new renderer behavior.
