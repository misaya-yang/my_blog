# PO-06 Agent Quality Operations Report

## GLOBAL_GOAL_PROGRESS

PO-00 through PO-06 are complete. Next phase: PO-07.

## CURRENT_PHASE

PO-06 - Agent Quality Operations

## STATUS

complete

## CHANGED_FILES

- `client/src/pages/ManageAgent.tsx`
- `client/src/i18n/agentOps.ts`
- `scripts/ai/reindex-knowledge.ts`
- `server/agent.router.test.ts`
- `server/ai/conversations.ts`
- `server/ai/evals.ts`
- `server/ai/harness.ts`
- `server/ai/harness.test.ts`
- `server/ai/knowledge.ts`
- `server/ai/knowledge.test.ts`
- `server/ai/knowledgeDb.ts`
- `server/ai/router.ts`
- `server/ai/types.ts`
- `docs/product_optimization/reports/po-06-agent-quality-operations-report.md`
- `docs/product_optimization/reports/po-06-browser-checks.json`
- `docs/product_optimization/reports/po-06-browser-snapshots/*`
- `docs/product_optimization/reports/po-06-screenshots/*`

## VALIDATION_COMMANDS

- `pnpm check` - pass
- `pnpm exec vitest run server/ai/knowledge.test.ts server/ai/harness.test.ts server/ai/quota.test.ts server/agent.router.test.ts` - pass, 4 files / 34 tests
- `pnpm ai:reindex` - pass, 57 created / 57 deleted / 0 skipped; status 4/4 public posts indexed, 1 hidden/draft excluded
- `pnpm test` - pass, 24 files / 123 tests. Existing `OAUTH_SERVER_URL` warning appears in `server/seo.test.ts`.
- `pnpm build` - pass. Existing large chunk-size warning remains.

## BROWSER_CHECKS

Evidence:

- `docs/product_optimization/reports/po-06-browser-checks.json`
- `docs/product_optimization/reports/po-06-browser-snapshots/index-status.txt`
- `docs/product_optimization/reports/po-06-browser-snapshots/retrieval-debug.txt`
- `docs/product_optimization/reports/po-06-browser-snapshots/local-eval-after-fix.txt`
- `docs/product_optimization/reports/po-06-browser-snapshots/trace-review.txt`
- `docs/product_optimization/reports/po-06-browser-snapshots/public-article-agent-answer.txt`
- `docs/product_optimization/reports/po-06-screenshots/index-status.png`
- `docs/product_optimization/reports/po-06-screenshots/retrieval-debug.png`
- `docs/product_optimization/reports/po-06-screenshots/local-eval-after-fix.png`
- `docs/product_optimization/reports/po-06-screenshots/trace-review.png`
- `docs/product_optimization/reports/po-06-screenshots/public-article-agent-answer.png`

Routes and checks:

- `/manage/agent` index status: pass. UI shows 57 chunks, 4 public posts, 4/4 coverage, 1 hidden/draft excluded, and CLI rebuild commands.
- `/manage/agent` retrieval debug: pass. Query returns public source cards plus matched-term diagnostics.
- `/manage/agent` local eval: pass after retrieval tightening. Golden eval shows 8/8 pass, 0 review, and 2 refusal cases.
- `/manage/agent` trace review: pass. Recent runs show `supabase_keyword`, run status, latency, token counts, and retrieved chunk IDs.
- Public article companion answer: pass. On `/post/agent-loop-observable-tool-using-agents`, a suggested article prompt produced an answer with source cards linked to the public Agent Loop slug.

## ACCEPTANCE_GATES

- Index status inspectable: pass. Admin UI and `pnpm ai:reindex` both expose public coverage, excluded hidden/draft count, and rebuild command path.
- Golden questions include success/refusal cases: pass. `server/ai/evals.ts` defines 6 sourced cases and 2 refusal cases; browser eval shows 8/8.
- Retrieval failures actionable: pass. Debug output now includes diagnostics, missing terms, notes, and remediation suggestions.
- Public answers sourced or refuse: pass. Source-backed answers render public source cards; weak out-of-scope queries such as weather and hidden EVQ details return no retrieval sources in tests/evals.

## NOTES

- Browser eval initially exposed a real refusal-boundary issue: weak query terms could trigger metadata/site-overview matches. `server/ai/knowledge.ts` now filters low-signal query words and only applies metadata/site-overview boosts after an actual term match.
- The public article check was run with the Codex in-app Browser on `localhost:3000`, while admin checks used `127.0.0.1:3000`. Both target the same local dev server.

## RISKS_OR_BLOCKERS

- No blocker.
- Existing build chunk-size warning remains outside PO-06.
- Existing `OAUTH_SERVER_URL` warning in `server/seo.test.ts` remains outside PO-06.

## NEXT_PHASE

PO-07 - Feedback To Content Backlog
