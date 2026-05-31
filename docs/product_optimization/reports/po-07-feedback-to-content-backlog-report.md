# PO-07 Feedback To Content Backlog Report

## GLOBAL_GOAL_PROGRESS

PO-00 through PO-07 are complete. Next phase: PO-08.

## CURRENT_PHASE

PO-07 - Feedback To Content Backlog

## STATUS

complete

## CHANGED_FILES

- `client/src/components/ArticleFeedback.tsx`
- `client/src/components/SubscriptionForm.tsx`
- `client/src/i18n/agentOps.ts`
- `client/src/i18n/common.ts`
- `client/src/i18n/manage.ts`
- `client/src/pages/Manage.tsx`
- `client/src/pages/ManageAgent.tsx`
- `server/agent.router.test.ts`
- `server/ai/conversations.ts`
- `server/ai/harness.ts`
- `server/ai/harness.test.ts`
- `server/ai/router.ts`
- `server/ai/types.ts`
- `server/db.ts`
- `server/engagement.router.test.ts`
- `server/routers.ts`
- `docs/product_optimization/reports/po-07-feedback-to-content-backlog-report.md`
- `docs/product_optimization/reports/po-07-browser-checks.json`
- `docs/product_optimization/reports/po-07-browser-snapshots/*`
- `docs/product_optimization/reports/po-07-screenshots/*`

## VALIDATION_COMMANDS

- `pnpm check` - pass
- `pnpm exec vitest run server/engagement.router.test.ts server/agent.router.test.ts` - pass, 2 files / 15 tests
- `pnpm exec vitest run server/ai/harness.test.ts` - pass, 1 file / 18 tests

## BROWSER_CHECKS

Evidence:

- `docs/product_optimization/reports/po-07-browser-checks.json`
- `docs/product_optimization/reports/po-07-browser-snapshots/article-feedback-submit.txt`
- `docs/product_optimization/reports/po-07-browser-snapshots/owner-feedback-review.txt`
- `docs/product_optimization/reports/po-07-browser-snapshots/subscriber-export-status.txt`
- `docs/product_optimization/reports/po-07-browser-snapshots/manage-agent-content-radar.txt`
- `docs/product_optimization/reports/po-07-screenshots/article-feedback-submit.png`
- `docs/product_optimization/reports/po-07-screenshots/owner-feedback-review.png`
- `docs/product_optimization/reports/po-07-screenshots/subscriber-export-status.png`
- `docs/product_optimization/reports/po-07-screenshots/manage-agent-content-radar.png`

Routes and checks:

- `/post/agent-loop-observable-tool-using-agents` article feedback submit: pass. Private feedback accepted and confirmed with the thank-you state.
- `/manage` owner feedback review: pass. Content Radar shows article-level opportunity signals; submitted feedback was marked reviewed and then hidden from active backlog state.
- `/manage` subscriber export/status: pass. Subscriber panel exposes export affordance, disabled while there are no subscribers, and states that email delivery is not connected yet.
- `/manage/agent` content radar state: pass. Agent Question Radar shows run counts, grouped question signals, and local owner-side idea triage state.

All browser checks were run with the Codex in-app Browser only.

## ACCEPTANCE_GATES

- Owner can identify writing opportunities: pass. `/manage` now has Content Radar from article feedback/subscription signals; `/manage/agent` has Agent Question Radar from recent runs.
- Signals linked to article/track context: pass. Article feedback opportunities include post title/slug context; Agent question signals include scope labels such as `track:ai-applications`.
- Private data stays private: pass. New radar APIs are admin-only, summaries do not include raw subscriber emails, and public surfaces are unchanged.
- Subscription delivery state honest: pass. Public and admin copy both state that subscription intent is stored only and email sending is not connected yet; RSS remains available.

## NOTES

- Feedback status triage now supports `new`, `reviewed`, and `hidden` without a migration.
- Agent question radar reads recent traces and groups sanitized question text into private writing candidates.
- Idea triage in `/manage/agent` is intentionally localStorage-backed for PO-07 to avoid unapproved database writes or migrations.

## RISKS_OR_BLOCKERS

- No blocker.
- Subscriber export is present but disabled in the checked local dataset because there are no saved subscribers.
- Idea status is local owner state, not yet shared across devices.

## NEXT_PHASE

PO-08 - Publish And Knowledge Freshness Gates
