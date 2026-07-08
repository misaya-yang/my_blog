# Blog Optimization Slice 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the current content audit release gate and add the first normalized reader-signal foundation required by the approved blog optimization specs.

**Architecture:** Keep the first slice additive and low-risk. `scripts/audit/content-quality.ts` remains the source of content audit truth, but it stops treating root project Markdown as article content. A new `server/readerSignals.ts` module converts existing audit and search-miss data into a shared internal signal shape without adding a database migration.

**Tech Stack:** TypeScript, Vitest, Node `fs/promises`, existing pnpm scripts, existing server module patterns.

## Global Constraints

- No new runtime dependency.
- No database schema migration.
- No route, tRPC, auth, quota, model-provider, or deployment contract break.
- Preserve existing public post and seed-blog behavior.
- Do not persist private Agent pasted context.
- Keep this slice on `dev`.
- Use `corepack pnpm` commands.
- Keep generated reports out of commits unless they are intentional evidence docs.

---

## File Structure

- Modify: `scripts/audit/content-quality.ts`
  - Owns article content audit and report generation.
  - Adds skipped non-article Markdown accounting while keeping existing `markdownFiles` compatibility.
- Modify: `scripts/audit/content-quality.test.ts`
  - Proves root project docs such as `agent.md` are skipped from article checks.
  - Proves seed post Markdown is still audited.
- Create: `server/readerSignals.ts`
  - Owns internal `ReaderSignal` types and pure normalization helpers.
- Create: `server/readerSignals.test.ts`
  - Proves audit findings and search misses normalize into safe reader signals.
- Modify: `server/engagement.router.ts`
  - Adds owner-only `readerSignals` output to `engagement.contentRadar.summary`.
- Modify: `server/engagement.router.test.ts`
  - Proves normalized search-miss signals are exposed without direct contact leakage.
- Create: `docs/product_optimization/reports/blog-optimization-slice-1-2026-07-08/summary.md`
  - Records commands run and remaining known issues after implementation.

## Task 1: Fix Content Audit Article Scope

**Files:**
- Modify: `scripts/audit/content-quality.ts`
- Modify: `scripts/audit/content-quality.test.ts`

**Interfaces:**
- Consumes: `parseSeedPosts(seedSource: string): SeedPost[]`
- Produces: `runContentQualityAudit(projectRoot?: string): Promise<ContentQualityReport>`
- Produces summary fields: `markdownFiles`, `articleFiles`, `skippedMarkdownFiles`, `seedPosts`, `warnings`, `failures`

- [ ] **Step 1: Write failing tests for skipped root docs**

Add a test that creates `agent.md` without H1 and expects no `content.missing_h1` failure:

```ts
it("skips root project markdown that is not tied to a seeded article", async () => {
  const root = await createTempProject();
  await writeFile(
    join(root, "seed-blog.mjs"),
    `
    const posts = [
      {
        title: "Seeded",
        slug: "seeded",
        contentPath: "./seeded.md",
        status: "published",
        visibility: "public",
        excerpt: "Seeded note.",
      },
    ];
    `
  );
  await writeFile(join(root, "seeded.md"), "# Seeded\\n\\nBody.");
  await writeFile(join(root, "agent.md"), "Branch policy without article H1.");

  const report = await runContentQualityAudit(root);

  expect(report.summary.markdownFiles).toBe(1);
  expect(report.summary.articleFiles).toBe(1);
  expect(report.summary.skippedMarkdownFiles).toBe(1);
  expect(report.issues).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: "content.missing_h1",
        file: "agent.md",
      }),
    ])
  );
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
corepack pnpm test -- scripts/audit/content-quality.test.ts
```

Expected before implementation: FAIL because `summary.articleFiles` or `summary.skippedMarkdownFiles` is missing, or because `agent.md` is audited.

- [ ] **Step 3: Implement seed-linked Markdown discovery**

Add a helper that audits only Markdown files referenced by seed posts and counts other root Markdown files as skipped:

```ts
async function buildMarkdownAuditScope(root: string, seedPosts: SeedPost[]) {
  const seededFiles = new Set(
    seedPosts
      .map(post => normalizeRootMarkdownPath(post.contentPath))
      .filter((file): file is string => Boolean(file))
  );
  const rootMarkdownFiles = await readdir(root);
  const skippedMarkdownFiles = rootMarkdownFiles
    .filter(isAuditedMarkdownFile)
    .filter(file => !seededFiles.has(file));
  return {
    articleFiles: Array.from(seededFiles).sort(),
    skippedMarkdownFiles,
  };
}
```

Implement it with `async`, then use `articleFiles` for the audit loop.

- [ ] **Step 4: Preserve existing summary compatibility**

Return `markdownFiles` as the audited article file count and add the new explicit fields:

```ts
summary: {
  markdownFiles: articleFiles.length,
  articleFiles: articleFiles.length,
  skippedMarkdownFiles: skippedMarkdownFiles.length,
  seedPosts: seedPosts.length,
  warnings,
  failures,
}
```

- [ ] **Step 5: Run focused and real audit**

Run:

```bash
corepack pnpm test -- scripts/audit/content-quality.test.ts
corepack pnpm content:audit
```

Expected: both PASS. `content:audit` should no longer fail on `agent.md`.

## Task 2: Add Reader Signal Normalization Foundation

**Files:**
- Create: `server/readerSignals.ts`
- Create: `server/readerSignals.test.ts`

**Interfaces:**
- Produces: `type ReaderSignal`
- Produces: `buildSearchMissSignal(input): ReaderSignal`
- Produces: `buildContentAuditSignal(input): ReaderSignal`
- Produces: `buildSearchMissSignals(inputs): ReaderSignal[]`
- Consumes in `server/engagement.router.ts`: existing `listSearchMissOpportunities()` output.

- [ ] **Step 1: Write tests for signal normalization**

Create `server/readerSignals.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildContentAuditSignal,
  buildSearchMissSignal,
} from "./readerSignals";

describe("reader signal normalization", () => {
  it("builds stable search miss signals with redacted evidence", () => {
    const signal = buildSearchMissSignal({
      query: "Email me at user@example.com about AgentLoop",
      normalizedQuery: "email me at [redacted-email] about agentloop",
      count: 3,
      firstSeenAt: new Date("2026-07-08T01:00:00Z"),
      lastSeenAt: new Date("2026-07-08T02:00:00Z"),
      suggestedPrompt:
        "Write or connect a public note that answers: Email me at user@example.com about AgentLoop",
    });

    expect(signal).toMatchObject({
      id: "search_miss:email me at [redacted-email] about agentloop",
      kind: "search_miss",
      status: "new",
      severity: "high",
      query: "Email me at [redacted-email] about AgentLoop",
      count: 3,
    });
    expect(signal.excerpt).toContain("[redacted-email]");
    expect(signal.excerpt).not.toContain("user@example.com");
  });

  it("maps content audit failures to high severity article signals", () => {
    const signal = buildContentAuditSignal({
      severity: "failure",
      code: "content.missing_h1",
      file: "post.md",
      articleSlug: "post",
      line: 1,
      message: "Missing title.",
      evidence: "# Broken",
    });

    expect(signal).toMatchObject({
      id: "content_audit:post:content.missing_h1:1",
      kind: "content_audit",
      status: "new",
      severity: "high",
      articleSlug: "post",
      sourceRef: "post.md:1",
    });
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
corepack pnpm test -- server/readerSignals.test.ts
```

Expected before implementation: FAIL because `server/readerSignals.ts` does not exist.

- [ ] **Step 3: Implement pure signal helpers**

Create `server/readerSignals.ts`:

```ts
export type ReaderSignalKind =
  | "search_miss"
  | "agent_question"
  | "agent_low_confidence"
  | "agent_refusal"
  | "article_feedback"
  | "content_audit"
  | "publish_freshness";

export type ReaderSignalStatus =
  | "new"
  | "triaged"
  | "planned"
  | "resolved"
  | "ignored";

export type ReaderSignal = {
  id: string;
  kind: ReaderSignalKind;
  status: ReaderSignalStatus;
  severity: "low" | "medium" | "high";
  articleSlug?: string;
  trackSlug?: string;
  query?: string;
  excerpt?: string;
  sourceRef?: string;
  count?: number;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt?: string;
  notes?: string;
};
```

Add `buildSearchMissSignal`, `buildContentAuditSignal`, and a local redaction helper.

- [ ] **Step 4: Run focused tests**

Run:

```bash
corepack pnpm test -- server/readerSignals.test.ts
```

Expected: PASS.

- [ ] **Step 5: Expose search-miss reader signals in owner content radar**

In `server/engagement.router.ts`, import and use `buildSearchMissSignals`:

```ts
import { buildSearchMissSignals } from "./readerSignals.js";

const searchMissSignals = buildSearchMissSignals(searchMissBacklog);

return {
  searchMisses: {
    total: searchMissOpportunities.reduce((sum, item) => sum + item.count, 0),
    uniqueQueries: searchMissOpportunities.length,
    opportunities: searchMissBacklog,
  },
  readerSignals: {
    total: searchMissSignals.length,
    items: searchMissSignals,
  },
  writingBacklog: buildWritingBacklog(feedbackOpportunities, searchMissBacklog),
};
```

Add an assertion to `server/engagement.router.test.ts` that `summary.readerSignals.items[0]` is a `search_miss` signal and does not contain `reader@example.com`.

## Task 3: Record Slice Evidence

**Files:**
- Create: `docs/product_optimization/reports/blog-optimization-slice-1-2026-07-08/summary.md`

**Interfaces:**
- Produces a human-readable implementation evidence report.

- [ ] **Step 1: Create summary with concrete command results**

Write:

```md
# Blog Optimization Slice 1 Evidence

Date: 2026-07-08
Branch: dev

## Scope

- Fixed content audit article scope.
- Added reader signal normalization foundation.

## Commands

- `corepack pnpm test -- scripts/audit/content-quality.test.ts`
- `corepack pnpm test -- server/readerSignals.test.ts`
- `corepack pnpm content:audit`
- `corepack pnpm check`

## Remaining Work

- UI visual contract implementation.
- Article renderer upgrades.
- Agent component extraction.
- Owner cockpit integration.
```

- [ ] **Step 2: Update command status after running final checks**

Replace each command line with pass or fail status based on actual command output.

## Task 4: Final Validation And Commit

**Files:**
- Modified and created files from Tasks 1 to 3.

- [ ] **Step 1: Run final gates**

Run:

```bash
git diff --check
corepack pnpm test -- scripts/audit/content-quality.test.ts server/readerSignals.test.ts
corepack pnpm content:audit
corepack pnpm check
```

Expected: all PASS.

- [ ] **Step 2: Inspect diff scope**

Run:

```bash
git status --short
git diff --stat
```

Expected: only the plan, content audit files, reader signal files, and evidence report changed.

- [ ] **Step 3: Commit**

Run:

```bash
git add docs/superpowers/plans/2026-07-08-blog-optimization-slice-1.md scripts/audit/content-quality.ts scripts/audit/content-quality.test.ts server/readerSignals.ts server/readerSignals.test.ts docs/product_optimization/reports/blog-optimization-slice-1-2026-07-08/summary.md
git commit -m "feat: add blog optimization gate foundations"
```

Expected: commit succeeds on `dev`.

## Self-Review

- Spec coverage: covers approved Slice 1 gate blocker, content audit scope, initial reader-signal foundation, and release evidence.
- Out of scope for this plan: visual redesign, Markdown renderer upgrade, Agent extraction, and owner cockpit UI. Those require later plans because they are independent subsystems with their own test cycles.
- Placeholder scan: this plan contains no empty sections or deferred implementation labels.
- Type consistency: `ReaderSignal`, `buildSearchMissSignal`, and `buildContentAuditSignal` are defined before any later task consumes them.
