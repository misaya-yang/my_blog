# Article Rendering Slice 2 Implementation Plan

Status: Completed

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing Markdown renderer with visible heading anchors, article callouts, and code block metadata without changing persisted post content.

**Architecture:** Keep all runtime behavior inside `client/src/components/MarkdownRenderer.tsx`. Use Markdown-compatible conventions, existing `react-markdown`, existing heading data from `PostDetail.tsx`, and existing tests. Do not add MDX or a new parser.

**Tech Stack:** React 19, react-markdown, rehype-highlight, rehype-katex, remark-gfm, remark-math, Vitest server-side render tests, existing Tailwind class usage.

## Global Constraints

- No new dependency.
- No post schema or content migration.
- No route, tRPC, auth, Agent, quota, or database contract change.
- Existing Markdown must continue to render.
- Page-level horizontal scrolling remains forbidden.
- Article body remains the dominant reading surface.

---

## File Structure

- Modify: `client/src/components/MarkdownRenderer.tsx`
  - Adds callout blockquote rendering.
  - Adds visible heading anchor links for headings with ids.
  - Adds code language and optional filename labels.
- Modify: `client/src/components/MarkdownRenderer.test.tsx`
  - Adds server-rendered assertions for callouts, heading anchors, code labels, filename labels, and copy behavior.
- Modify: `docs/product_optimization/reports/blog-optimization-slice-1-2026-07-08/summary.md`
  - No change for Slice 2. Keep Slice 2 evidence in a new folder.
- Create: `docs/product_optimization/reports/article-rendering-slice-2-2026-07-08/summary.md`
  - Records commands and remaining work.

## Task 1: Add Renderer Tests First

**Files:**
- Modify: `client/src/components/MarkdownRenderer.test.tsx`

**Interfaces:**
- Consumes: `<MarkdownRenderer content headings copiedCode copyCodeLabel onCopyCode />`
- Produces: static markup containing `article-callout`, `heading-anchor-link`, `code-block-meta`, and unchanged copied code payload.

- [x] **Step 1: Extend the rich fixture**

Add callout and titled code samples:

````md
> [!CLAIM]
> The answer should stay readable before sources expand.

```ts title="server/ai/harness.ts"
const verifier = (reward: number) => reward > 0;
```
````

- [x] **Step 2: Add assertions**

Assert:

```ts
expect(html).toContain("article-callout");
expect(html).toContain('data-callout-type="claim"');
expect(html).toContain("Claim");
expect(html).toContain('class="heading-anchor-link"');
expect(html).toContain('href="#method"');
expect(html).toContain("code-block-meta");
expect(html).toContain("ts");
expect(html).toContain("server/ai/harness.ts");
expect(html).toContain('aria-label="Copy code"');
```

- [x] **Step 3: Run test to verify failure**

Run:

```bash
corepack pnpm test -- client/src/components/MarkdownRenderer.test.tsx
```

Expected before implementation: FAIL because the new class names and metadata labels do not exist.

## Task 2: Implement Heading Anchor Links

**Files:**
- Modify: `client/src/components/MarkdownRenderer.tsx`

**Interfaces:**
- Consumes: `headings: Array<{ id: string; text: string; level: number }>`
- Produces: headings with `id` and optional `<a className="heading-anchor-link" href="#id">#</a>`

- [x] **Step 1: Update heading component**

Render anchor links only when an id exists:

```tsx
const id = resolveHeadingId(text);
return (
  <Tag id={id} className={`${className} group scroll-mt-24`} {...props}>
    {children}
    {id ? (
      <a
        href={`#${id}`}
        aria-label={`Link to ${text}`}
        className="heading-anchor-link not-prose ml-2 text-sm opacity-0 transition-opacity group-hover:opacity-70 focus:opacity-100"
      >
        #
      </a>
    ) : null}
  </Tag>
);
```

- [x] **Step 2: Run renderer test**

Run:

```bash
corepack pnpm test -- client/src/components/MarkdownRenderer.test.tsx
```

Expected: heading anchor assertions pass after implementation.

## Task 3: Implement Callout Blockquotes

**Files:**
- Modify: `client/src/components/MarkdownRenderer.tsx`

**Interfaces:**
- Consumes Markdown blockquote markers `[!NOTE]`, `[!CLAIM]`, `[!CAVEAT]`, `[!IMPLEMENTATION]`, `[!SOURCE]`
- Produces semantic callout markup while preserving normal blockquotes for unrecognized markers.

- [x] **Step 1: Add callout helpers**

Add:

```ts
type CalloutType = "note" | "claim" | "caveat" | "implementation" | "source";
const CALLOUT_LABELS: Record<CalloutType, string> = {
  note: "Note",
  claim: "Claim",
  caveat: "Caveat",
  implementation: "Implementation",
  source: "Source",
};
```

Add recursive text extraction and marker stripping helpers.

- [x] **Step 2: Render callout blockquote component**

Add `blockquote` component:

```tsx
blockquote: ({ node: _node, children, ...props }: any) => {
  const callout = extractCallout(children);
  if (!callout) return <blockquote {...props}>{children}</blockquote>;
  return (
    <aside className="article-callout" data-callout-type={callout.type}>
      <div className="article-callout-label">{CALLOUT_LABELS[callout.type]}</div>
      <div className="article-callout-body">{callout.children}</div>
    </aside>
  );
}
```

- [x] **Step 3: Run renderer test**

Run:

```bash
corepack pnpm test -- client/src/components/MarkdownRenderer.test.tsx
```

Expected: callout assertions pass and existing footnotes still render.

## Task 4: Implement Code Block Metadata

**Files:**
- Modify: `client/src/components/MarkdownRenderer.tsx`

**Interfaces:**
- Consumes code block `className` and optional node metadata.
- Produces visible language and filename label without changing copied code text.

- [x] **Step 1: Parse code metadata in `code` component**

Add `data-language` and `data-filename` attributes to block code elements:

```tsx
const meta = parseCodeMeta(className, node);
return (
  <code
    className={className}
    data-language={meta.language}
    data-filename={meta.filename}
    {...props}
  >
    {children}
  </code>
);
```

- [x] **Step 2: Render metadata in `pre` component**

Read the attributes from the child code element:

```tsx
{meta.language || meta.filename ? (
  <div className="code-block-meta">
    {meta.filename ? <span>{meta.filename}</span> : null}
    {meta.language ? <span>{meta.language}</span> : null}
  </div>
) : null}
```

- [x] **Step 3: Run renderer test**

Run:

```bash
corepack pnpm test -- client/src/components/MarkdownRenderer.test.tsx
```

Expected: code metadata assertions pass.

## Task 5: Evidence, Validation, Commit

**Files:**
- Create: `docs/product_optimization/reports/article-rendering-slice-2-2026-07-08/summary.md`

- [x] **Step 1: Run final checks**

Run:

```bash
git diff --check
corepack pnpm test -- client/src/components/MarkdownRenderer.test.tsx
corepack pnpm check
corepack pnpm build
```

Expected: all PASS.

- [x] **Step 2: Write evidence summary**

Record the passed commands and remaining renderer work.

- [x] **Step 3: Commit**

Run:

```bash
git add docs/superpowers/plans/2026-07-08-article-rendering-slice-2.md client/src/components/MarkdownRenderer.tsx client/src/components/MarkdownRenderer.test.tsx docs/product_optimization/reports/article-rendering-slice-2-2026-07-08/summary.md
git commit -m "feat: improve article markdown rendering"
```

Expected: commit succeeds on `dev`.

## Self-Review

- Spec coverage: covers visible heading anchors, callout markers, code language labels, filename labels, copy behavior, and evidence.
- Out of scope for this plan: figure captions, table captions, PostDetail layout changes, and mobile progressive disclosure.
- Placeholder scan: no empty implementation sections.
- Type consistency: callout and code metadata helpers are local to `MarkdownRenderer.tsx`.
