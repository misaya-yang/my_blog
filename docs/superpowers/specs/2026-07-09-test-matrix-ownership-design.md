# Test Matrix Ownership Design

Date: 2026-07-09
Status: Proposed
Parent package: [2026-07-09-product-optimization-spec-review-package.md](./2026-07-09-product-optimization-spec-review-package.md)

## Summary

The project has many focused tests, but future agents need a stable mapping from changed files to required checks. This spec defines test ownership so slices run the right focused tests before the full release gates.

## Goals

- Map common touched paths to focused tests.
- Avoid under-testing high-risk changes.
- Avoid running only full tests without targeted regression coverage.
- Keep test references current and discoverable.
- Make validation evidence comparable across reports.

## Non-Goals

- No new test runner.
- No replacing full release gates.
- No generated test plan for every tiny docs change.

## Matrix

| Touched Area | Focused Checks |
| --- | --- |
| `client/src/components/agent/*` | `client/src/components/agent/BlogAgentRoot.test.ts`, `client/src/components/agent/sourceCards.test.ts`, `server/ai/streamRoute.test.ts` when stream contract changes |
| `server/ai/*` | `server/ai/harness.test.ts`, `server/ai/streamRoute.test.ts`, `server/agent.router.test.ts` |
| `server/readerSignals.ts` | `server/readerSignals.test.ts`, `server/engagement.router.test.ts` |
| `server/engagement.router.ts` | `server/engagement.router.test.ts`, `server/readerSignals.test.ts` |
| `server/discovery.ts`, `server/routers.ts` discovery routes | `server/discovery.test.ts`, `server/discovery.router.test.ts`, `client/src/pages/Search.test.tsx` |
| `client/src/pages/Search.tsx` | `client/src/pages/Search.test.tsx`, `client/src/pages/searchRecovery.test.ts` |
| `client/src/pages/Archive.tsx`, taxonomy | `client/src/pages/Archive.test.ts`, `server/discovery.router.test.ts` |
| `client/src/pages/PostDetail.tsx` | `client/src/pages/PostDetail.test.ts`, `client/src/components/MarkdownRenderer.test.tsx` |
| `client/src/components/MarkdownRenderer.tsx` | `client/src/components/MarkdownRenderer.test.tsx`, `scripts/audit/content-quality.test.ts` when content semantics change |
| `client/src/pages/Home.tsx`, `Track.tsx` | `client/src/pages/Home.test.ts`, `client/src/pages/Track.test.ts`, `client/src/components/ResearchShell.test.tsx` |
| `client/src/styles/*` | `corepack pnpm audit:ui`, `corepack pnpm check`, `corepack pnpm build` |
| `client/src/i18n/*`, contexts | relevant route/component tests plus browser zh/en screenshot when changed |
| `scripts/audit/content-quality.ts` | `scripts/audit/content-quality.test.ts`, `corepack pnpm content:audit` |
| `scripts/audit/publish-freshness.ts` | `scripts/audit/publish-freshness.test.ts`, `corepack pnpm content:verify` |
| `server/client-render.ts`, SEO/static output | `server/client-render.test.ts`, `server/seo.test.ts`, `server/static-index.test.ts` |
| `vercel.json`, build config | `server/vercel-config.test.ts`, `server/vite-config.test.ts`, `corepack pnpm build` |

## Report Contract

Every implementation report should list:

- Why selected focused tests match touched files.
- Full gates run or explicitly deferred.
- Any skipped check and reason.
- Whether UI audit used a local server and which URL.

## Acceptance Checklist

- Touched code has focused tests, not only full-suite claims.
- Matrix references existing scripts or test files.
- Reports explain skipped checks.
- Full release gates still run before merge or deployment.
