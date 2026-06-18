# MNUI-03 Blog Agent And Trust Surface Report

**Status:** passed

**Feature oracle item:** MNUI-F004

**Generated:** 2026-06-18

## Plan Followed

1. Loaded MNUI-03 primary context, including MNUI-02 reader evidence, the design-system Agent reference, current Agent component, source-card helpers, route context, i18n, and Agent tests.
2. Preserved streaming protocol, backend retrieval/model behavior, quota behavior, private context lifecycle, auth behavior, and owner route boundaries.
3. Added public-note trust copy, tightened source-card visual hierarchy, made the Agent panel opaque enough to avoid background text bleed, and extracted route hiding into a tested helper.
4. Ran required Agent validation commands, build, route baseline, and browser screenshot checks.
5. Recorded golden-question coverage, live Agent evidence, source-boundary notes, rollback notes, and MNUI-04 handoff.

## Files Changed

| Path | Purpose |
| --- | --- |
| `client/src/components/agent/BlogAgentRoot.tsx` | Added tested hidden-route helper, Blog Agent trust boundary, stronger source-card hierarchy with source icon slot, and route-safe public companion copy. |
| `client/src/styles/agent-surfaces.css` | Aligned Agent launcher/panel/source surfaces with MNUI-01 tokens and made the panel fully opaque enough to prevent background text bleed. |
| `client/src/i18n/agent.ts` | Updated launcher/header copy to `Blog Agent` and added public-note/private-context trust boundary strings. |
| `client/src/components/agent/BlogAgentRoot.test.ts` | Added route-guard coverage for owner/auth hidden routes and public visible routes. |
| `client/src/components/agent/sourceCards.test.ts` | Added compact excerpt and conversation-local context href coverage. |
| `docs/misaya_notes_ui_optimization_2026_06_18/reports/screenshots/mnui-03/*` | Added post-change screenshot and metric evidence for public Agent and hidden owner/auth routes. |

## Validation Evidence

| Gate | Command Or Evidence | Result |
| --- | --- | --- |
| Typecheck | `pnpm check` | Passed with exit code 0. |
| Agent tests | `pnpm exec vitest run server/ai/harness.test.ts server/ai/model.test.ts server/agent.router.test.ts client/src/components/agent/BlogAgentRoot.test.ts client/src/components/agent/sourceCards.test.ts` | Passed; 5 files and 68 tests passed. |
| Production build | `pnpm build` | Passed after final Agent opacity tuning. |
| Public route baseline | `AUDIT_BASE_URL=http://localhost:3000 pnpm audit:baseline:quick -- --output=docs/misaya_notes_ui_optimization_2026_06_18/reports/mnui-03-baseline-quick.json` | Passed; 14 route checks, 0 skipped routes, 4 known baseline metadata/asset gaps. |
| Browser metrics | `reports/screenshots/mnui-03/screenshot-metrics.json` | Passed baseline checks: 9 screenshots, HTTP 200 for all routes, no horizontal overflow, no console/page errors, no sampled text overflow, public Agent visible on public routes and hidden on owner/auth routes. |

## Golden Question Coverage

| Question Type | Evidence | Result |
| --- | --- | --- |
| Current article abstraction | Browser submitted `Explain the core abstraction in this article.` on `/post/goal-harness-agent-phase-protocol`; final state had `stillStreaming=false`, public-scope copy, current article context, and 3 source cards. | Passed. |
| Next reading | `BlogAgentRoot.test.ts` covers route-specific prompt keys and `inferAnswerMode("What should I read next?") -> reading_path`; `server/ai/harness.test.ts` covers next-evaluation/read-next style questions. | Passed by automated tests. |
| Insufficient public corpus refusal | `server/ai/model.test.ts` covers `createNoPublicSourceAnswer` and Chinese refusal; `server/ai/harness.test.ts` covers no-source and unavailable-content refusals without source cards. | Passed by automated tests. |
| Current-page context | Browser final state recorded `Current article context connected`; `server/ai/harness.test.ts` covers vague post-scoped questions with `currentPageContextInjected: true`. | Passed. |
| Private context boundary | `sourceCards.test.ts` covers conversation-local context href fallback; `server/ai/harness.test.ts` covers pasted context as `sourceType: "user_context"` separate from public blog cards. | Passed by automated tests. |

## Browser Evidence

| Screenshot | Viewport | Route | Notes |
| --- | --- | --- | --- |
| `reports/screenshots/mnui-03/desktop-post-agent-initial.png` | 1440x900 | `/post/goal-harness-agent-phase-protocol` | Blog Agent opens with public-note trust boundary and current-post scope. |
| `reports/screenshots/mnui-03/desktop-post-agent-answer-state.png` | 1440x900 | `/post/goal-harness-agent-phase-protocol` | Live answer completed with 3 source cards, related questions, current article context, and public-scope copy. |
| `reports/screenshots/mnui-03/mobile-post-agent-open.png` | 390x844 | `/post/goal-harness-agent-phase-protocol` | Mobile panel stays within viewport, composer remains reachable, no horizontal overflow. |
| `reports/screenshots/mnui-03/desktop-home-agent-open.png` | 1440x900 | `/` | Public Agent visible with all-notes scope and route-aware prompts. |
| `reports/screenshots/mnui-03/desktop-archive-agent-open.png` | 1440x900 | `/archive` | Public Agent visible on discovery route with public-note trust copy. |
| `reports/screenshots/mnui-03/desktop-search-agent-open.png` | 1440x900 | `/search?q=agent` | Public Agent visible on search route with public-note trust copy. |
| `reports/screenshots/mnui-03/desktop-manage-agent-hidden.png` | 1440x900 | `/manage` | Launcher and panel absent. |
| `reports/screenshots/mnui-03/desktop-write-agent-hidden.png` | 1440x900 | `/write` | Launcher and panel absent. |
| `reports/screenshots/mnui-03/desktop-login-agent-hidden.png` | 1440x900 | `/login` | Launcher and panel absent. |

## Accessibility And Compliance Notes

- Launcher and panel retain keyboard-reachable close, history, context, textarea, and send/cancel controls.
- Mobile panel uses dialog semantics, focus handling, and a bounded viewport rectangle: 366px by 720px on a 390x844 viewport.
- Public Agent remains hidden on `/manage`, `/write`, and `/login`; the route predicate is covered by unit tests.
- Source cards remain capped to 3 visible cards, preserve public blog links, and keep user context separate from public source links.
- No secrets, auth headers, provider credentials, raw model reasoning, hidden/draft content, production data mutation, migration, dependency addition, deployment, or provider configuration change was introduced.

## Blockers And Waivers

- No user waiver was used.
- Authenticated owner tooling is intentionally deferred to MNUI-04.
- Live Agent browser evidence depends on local Agent runtime speed; final evidence did complete in this run and produced 3 source cards. Automated tests remain the stable regression gate for model refusal, source filtering, and private-context separation.

## Rollback Notes

- Revert `client/src/components/agent/BlogAgentRoot.tsx`, `client/src/styles/agent-surfaces.css`, `client/src/i18n/agent.ts`, and the two Agent test files if streaming UI, source-card linking, route guard, build, or mobile screenshots regress.
- No backend rollback is needed because this phase did not change Agent service, model, retrieval, schema, quota, auth, or stream protocol code.

## Handoff Decision

MNUI-03 passes. MNUI-04 is unlocked to align owner-only Manage, Write, Login, and Agent Ops states with the same calm dark system while preserving auth/data boundaries. MNUI-04 should reuse the tested public-Agent hidden-route helper behavior as a guard expectation.
