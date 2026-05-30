# Phase 01 - Content Integrity Harness PRD

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:test-driven-development` for each bug fix and `superpowers:verification-before-completion` before claiming completion.

**Goal:** Prevent post metadata corruption, make publish visibility semantics reliable, and harden the database write path.

**Architecture:** Keep the existing tRPC + Drizzle/Postgres stack, but introduce typed post DTOs, relation-aware post reads, transaction-backed writes, and explicit tests around edit, publish, tags, and visibility behavior.

**Tech Stack:** tRPC, Drizzle ORM, Postgres, Vitest, TypeScript.

---

## Task Spec

Fix the concrete reliability issues found in the audit:

1. Editing an existing post must not clear tags.
2. Publishing from the management page must make the post publicly visible unless the owner explicitly chooses another visibility.
3. Post/category/tag/version data must not accumulate orphan records.
4. Multi-step post writes must be atomic.
5. Admin authentication must have a minimal public-surface hardening path.

## Problem Boundary

In scope:

- `posts.getBySlug` or a new relation-aware procedure returning category and tags.
- Editor load/save semantics for tags.
- Manage publish/unpublish semantics.
- Drizzle schema relation constraints and indexes.
- Transaction helpers for create/update/delete/tag writes.
- Tests for all fixed behavior.

Out of scope:

- New public tag pages, archive pages, or search UI. Those belong to Phase 02.
- Full comment, bookmark, or visitor features. Those belong to Phase 06.
- Full OAuth rewrite. This phase only removes ambiguity and hardens existing auth enough for owner publishing safety.

## Context Policy

Before editing, inspect:

- `drizzle/schema.ts`
- `drizzle/0000_brainy_sleeper.sql`
- `drizzle/0001_free_kang.sql`
- `drizzle/relations.ts`
- `server/db.ts`
- `server/routers.ts`
- `server/posts.test.ts`
- `server/auth.logout.test.ts`
- `server/auth.ts`
- `server/_core/trpc.ts`
- `server/_core/systemRouter.ts`
- `client/src/pages/Editor.tsx`
- `client/src/pages/Manage.tsx`
- `client/src/components/ArticleCard.tsx`
- `shared/types.ts`

Do not change visual design in this phase except where a small UI state label is required to make visibility behavior understandable.

## Product Requirements

### R1 Relation-Aware Post DTO

Define a public/admin post DTO used by frontend screens.

The DTO should include:

- post id, title, slug, content, excerpt, cover image
- status
- visibility
- category object or nullable category
- tags array
- view count
- created, updated, published timestamps

Article cards should not infer topic labels from slug strings. They should prefer real category and tag data.

### R2 Editing Must Preserve Tags

When editing an existing article:

- loading `/write/:slug` must hydrate `selectedTags` from server data
- saving without changing tags must preserve existing tags
- save logic must distinguish "tags not loaded yet" from "owner intentionally removed all tags"

Acceptance example:

- Given post A has tags `RoPE` and `Long Context`
- When owner opens `/write/post-a` and changes only the title
- Then post A still has `RoPE` and `Long Context`

### R3 Publish and Visibility Semantics

Make publish behavior explicit:

- `draft + admin` means private draft.
- `published + public` means public post.
- `published + admin` means published preview visible only to owner.
- `hidden` means not listed publicly and not directly readable publicly.

Manage page quick publish should use:

- draft to published: set `status = published`, `visibility = public`, and `publishedAt` if missing.
- published to draft: set `status = draft`, `visibility = admin`, and clear `publishedAt` unless product chooses to preserve historical date.

The UI must make any non-public published state visible to the owner.

### R4 Transactional Writes

Create/update/delete flows must run atomically:

- create post + set tags
- update post + set tags
- delete post + delete post tags + delete versions
- save version when attached to an existing post

If a tag operation fails, the post update must not partially persist.

### R5 Referential Integrity

Add database-level constraints or migration-safe equivalent for:

- `posts.authorId -> users.id`
- `posts.categoryId -> categories.id` with a clear on-delete policy
- `post_tags.postId -> posts.id`
- `post_tags.tagId -> tags.id`
- `post_versions.postId -> posts.id`

Add indexes for:

- `posts.slug`
- `posts.status, posts.visibility, posts.publishedAt`
- `posts.categoryId`
- `post_tags.postId`
- `post_tags.tagId`
- `categories.slug`
- `tags.slug`

### R6 Admin Auth Surface

Add minimum hardening:

- rate limit admin password attempts by IP or cookie-safe key
- consistent unauthorized error messages
- no stack trace or sensitive auth details in client-visible errors
- document the two admin concepts currently present: blog password admin and OAuth/system admin

The final state should either unify admin procedure usage or document exactly which procedure type is used for blog owner actions.

## Execution Capture

Required tests:

- `posts.getBySlug` returns tags and category.
- Editing title preserves existing tags.
- Editing and intentionally clearing all tags clears tags.
- Manage quick publish makes a draft public.
- Manage quick unpublish makes a public post private draft.
- Public list excludes non-public posts.
- Public direct read excludes hidden/admin posts.
- Delete post removes post tags and versions.
- Failed tag write rolls back post update.
- Admin login rate limit triggers after configured failed attempts.

## Evaluator Protocol

Phase 01 is complete when:

- The concrete tag-loss and publish-visibility bugs are covered by failing-first tests and passing implementation.
- No frontend screen depends on `any` for the main post shape when typed DTOs are available.
- `pnpm check`, `pnpm test`, and `pnpm build` pass.
- The public home and track pages still list only public posts.
- The owner can edit, save, publish, unpublish, and delete without orphaning tags or versions.

## Acceptance Criteria

- Existing post tags survive a metadata-only save.
- Management publish creates a publicly visible post.
- Database relations protect tag and version integrity.
- Multi-step writes are transactional.
- Auth failures are rate-limited and do not leak sensitive details.
- Release notes mention any migration required for existing data cleanup.

## Risks

- Adding foreign keys to an existing production database can fail if orphan rows already exist. Include a pre-migration cleanup query or migration guard.
- Visibility semantics can surprise the owner if hidden/admin/published combinations already exist. Include a one-time management UI badge or migration note.
- Tests that mock `server/db.ts` may not catch transaction behavior. Add at least one integration-style database abstraction test or clearly separate unit and database tests.
