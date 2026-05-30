# Phase 06 Engagement and Feedback Report

Date: 2026-05-30

## Scope Shipped

- Added database-backed subscription intent capture with email normalization, duplicate refresh behavior, preferred language, optional interests, and exportable subscriber records.
- Added private article feedback with useful / not useful signal, optional message, optional reply email, visitor JWT identity capture, source and user-agent capture, review status, and owner-only moderation.
- Added tRPC `engagement` procedures for subscribe, feedback create/list/review, and subscriber list, with source-based rate limiting.
- Added home and article footer subscription surfaces with RSS link and concise privacy copy.
- Added article footer feedback module with loading, success, error, and rate-limited UI states.
- Added `/manage` engagement panel for recent feedback review and subscriber CSV export.
- Deferred public comments and bookmarks/read-later; feedback and subscription now provide the smallest useful return loop.

## Data Model

| Table | Purpose | Privacy note |
| --- | --- | --- |
| `subscribers` | Stores email subscription intent until an email provider is connected. | Stores only email, optional language, optional interests, source, and status. |
| `post_feedback` | Stores private reader feedback for owner review. | Public pages never list feedback; owner-only route required for reads. |

Migration generated: `drizzle/0003_motionless_lila_cheney.sql`.

## Verification

- `pnpm check` passed.
- `pnpm test` passed with escalation for local listen permissions: 12 files, 60 tests.
- `pnpm build` passed. The existing large lazy Markdown/app vendor warning remains, but Phase 05 first-route split is intact.
- TDD red state was observed first: `server/engagement.router.test.ts` initially failed because `engagement.*` procedures did not exist.
- Browser QA covered:
  - Home subscription/RSS surface renders on desktop and mobile.
  - Subscription email input blocks invalid email through native validation.
  - Visitor login creates a visitor identity and redirects back home.
  - Owner login reaches `/manage`.
  - `/manage` renders feedback and subscriber empty states without a framework overlay.

## Browser Coverage Boundary

The local dev server has no `DATABASE_URL`, so article pages and populated engagement records cannot be exercised end-to-end in Browser. The article feedback success path, visitor-id capture, owner listing, mark-reviewed behavior, duplicate subscription behavior, and rate limiting are covered by router tests with mocked DB fixtures.

## Remaining Risk

- No real email provider is connected yet; export is the integration bridge.
- Comments and bookmarks remain intentionally deferred.
- Source-based in-memory rate limiting resets on server restart; this is adequate for the lightweight first version but can move to durable storage if abuse appears.
