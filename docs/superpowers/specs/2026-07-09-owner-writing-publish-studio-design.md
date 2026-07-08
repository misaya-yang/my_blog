# Owner Writing And Publish Studio Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

The product already has an editor, article metadata, versions, publish mutations, knowledge refresh after post changes, content audit scripts, feedback, search misses, and Agent radar ideas. The next step is to connect these into an owner workflow: choose a real reader signal, draft or revise an article, pass preflight checks, publish, and verify Agent knowledge freshness.

This spec focuses on the owner-only writing and publishing experience. It does not redesign the public reader surface.

## Goals

- Turn backlog items into draft or revision intent.
- Make article metadata and research path placement visible while writing.
- Add a practical publish preflight checklist.
- Show knowledge refresh outcome after save or publish.
- Keep version restore, preview, and markdown tools predictable.
- Reduce owner UI clutter without hiding important operational state.

## Non-Goals

- No CMS migration.
- No rich collaborative editing.
- No external email automation.
- No AI ghostwriting feature in the first pass.
- No schema migration unless separately reviewed.
- No destructive bulk article operations.

## Current Files

Client:

- `client/src/pages/Editor.tsx`
- `client/src/pages/Manage.tsx`
- `client/src/pages/ManageAgent.tsx`
- `client/src/components/MarkdownRenderer.tsx`
- `client/src/i18n/editor.ts`
- `client/src/i18n/manage.ts`

Server:

- `server/routers.ts`
- `server/engagement.router.ts`
- `server/readerSignals.ts`
- `server/db.ts`
- `server/ai/knowledgeDb.ts`

Scripts:

- `scripts/audit/content-quality.ts`
- `scripts/audit/publish-freshness.ts`
- `scripts/ai/reindex-knowledge.ts`

## Workflow Contract

Target workflow:

1. Owner opens `/manage` or `/manage/agent`.
2. Owner sees backlog from feedback, search misses, Agent gaps, content audit, and freshness checks.
3. Owner opens an article revision or new draft from a backlog item.
4. Editor pre-populates safe intent fields from the backlog item, not raw private data.
5. Owner writes or revises content with live preview and metadata checklist.
6. Owner checks publish readiness.
7. Publish/save triggers current knowledge refresh behavior.
8. Owner sees whether Agent knowledge is fresh or needs manual reindex.

## Backlog To Draft Contract

Supported input query params:

- `idea`: short public topic or article title.
- `source`: `feedback`, `search_miss`, `agent_question`, `content_audit`, or `publish_freshness`.
- `article`: optional existing article slug.
- `track`: optional `algorithms` or `applications`.

Rules:

- `agent_radar` is accepted as a legacy alias for `agent_question` while existing links are migrated.
- Do not pass private feedback message bodies through query params.
- Redact direct contact data before display.
- Do not generate final article prose. A safe empty scaffold is allowed with headings such as source, reader question, claim, evidence, and caveats.
- Prefill intent, title suggestion, scaffold headings, or editor note only.
- If `article` is present, prefer opening the existing article for revision when possible.

## Editor IA

The editor should prioritize:

1. Title, slug, status, visibility.
2. Content editor and preview.
3. Article placement:
   - Category.
   - Tags.
   - Series slug/title/order.
   - Pinned track.
   - Featured rank.
4. Publish readiness:
   - Visibility is public only when intended.
   - Excerpt exists.
   - Track/series placement is coherent.
   - Content audit has no blocking failures.
   - Knowledge refresh result after save/publish.
5. Version history and restore.

Avoid making metadata a long disconnected sidebar that the owner forgets to review.

## Publish Preflight

First-pass preflight can be client/server local state plus existing script evidence, not a new CI system.

Checks:

- Title exists.
- Slug exists and is stable.
- Excerpt exists for public posts.
- Public posts have category and at least one tag.
- Series order is numeric when series slug exists.
- Pinned track is consistent with category or tags when obvious.
- Visibility is not accidentally `public`.
- Content has enough body text.
- Last save/publish knowledge refresh status is shown.

Blocking vs warning:

- Blocking: missing title, slug, body, invalid status/visibility, failed mutation.
- Warning: missing excerpt, missing category/tag, style warnings, stale knowledge refresh, missing series metadata.

Do not block publish on subjective style warnings by default.

## Manage Page Contract

`/manage` should be the owner dashboard for editorial work:

- Post list remains available.
- Writing backlog becomes a first-class panel.
- Backlog items link to editor with safe query params.
- Content radar and subscription summary remain compact.
- Category/tag editing stays available but visually secondary to active writing work.

Rows should be scan-friendly:

- Priority.
- Source.
- Article/topic.
- Evidence count.
- Suggested action.
- Open editor.

## Knowledge Refresh UX

Existing post mutations return `knowledgeRefresh` state. The owner UI should show:

- Fresh: post saved and Agent index refreshed.
- Stale: post saved but Agent knowledge refresh failed.
- Unknown: no refresh result available.

When stale:

- Show the command `corepack pnpm ai:reindex` only on owner/admin surfaces.
- Do not expose internal command text publicly.
- Link to `/manage/agent` index health when useful.

## Content Quality Integration

The editor should eventually surface content audit output, but the first implementation can keep this as a report link or owner dashboard item.

Rules:

- Do not run expensive audit scripts on every keystroke.
- Do not block typing with style checks.
- Keep Chinese and English warning copy concrete.
- Prefer article-specific findings over global noise.

## Implementation Slices

1. Normalize backlog links and safe editor query params.
2. Normalize `agent_radar` links to `agent_question` while preserving legacy compatibility.
3. Add editor preflight helpers and unit tests.
4. Show knowledge refresh status consistently after create, update, publish, and restore.
5. Make `/manage` backlog rows clearer and connected to editor actions.
6. Add publish readiness evidence to final release report.

## Tests

Focused:

```bash
corepack pnpm test -- server/engagement.router.test.ts server/readerSignals.test.ts client/src/pages/PostDetail.test.ts
```

General:

```bash
corepack pnpm content:audit
corepack pnpm check
corepack pnpm build
```

Browser evidence:

- `/manage` backlog with at least one feedback/search/Agent item.
- `/write?idea=rlhf-reading-path&source=agent_question` prefilled intent.
- Save draft shows knowledge refresh result.
- Publish warning states are readable in light and dark modes.

## Acceptance Checklist

- Owner can move from backlog item to editor without copying text manually.
- Private feedback/context is not inserted into URLs or drafts.
- Editor scaffolding is safe intent structure, not generated finished prose.
- Publish preflight distinguishes blockers from warnings.
- Knowledge refresh outcome is visible after post mutation.
- Editor remains usable on desktop and mobile.
