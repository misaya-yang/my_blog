Use the `prd-phase-harness` skill. Target phase: FLG-06 Final QA And Handoff. Target phase file: `docs/frontend_liquid_glass_optimization_2026_06_21/phase-06-final-qa-and-handoff.md`.

Harness status: verified and closed. Do not continue implementation unless the user opens a new scope.

Loading order:

1. Read `docs/frontend_liquid_glass_optimization_2026_06_21/README.md`.
2. Read `docs/frontend_liquid_glass_optimization_2026_06_21/phase-manifest.md`.
3. Read `loop-contract.json`, `loop-state.json`, `feature-oracle.json`, `progress-log.md`, `agent-handoff.md`, `continuity-ledger.md`, and `source-packet.md`.
4. Read `reports/flg-06-final-qa-and-handoff-report.md`.
5. Read the target phase file only if a review or repair task needs the original phase contract.

Work on one phase and one feature-oracle item only if reopened: FLG-06 and FLG-F007. Follow the loop cycle: observe, select, execute, verify, record, decide.

Edit boundaries: the harness is closed, so no edits are expected. If the user asks for a repair, stay inside `client/src/pages`, `client/src/components`, `client/src/styles`, and the harness runtime docs named in FLG-06. Preserve route, API, auth, analytics, schema, SEO, content, deployment state, and existing user/prior-agent worktree changes.

Validation: final evidence already passed `pnpm check`, `pnpm test`, `pnpm build`, `AUDIT_BASE_URL=http://localhost:3001 pnpm audit:ui`, and `AUDIT_BASE_URL=http://localhost:3001 pnpm audit:baseline:quick`. Rerun the relevant command only when a reopened task changes code or evidence.

Evidence and code-summary writeback: final evidence is in `reports/flg-06-final-qa-and-handoff-report.md`, `.cache/flg-06-qa/metrics.json`, `feature-oracle.json`, `progress-log.md`, `continuity-ledger.md`, and `source-packet.md`. If reopened, update the same files with any new facts before exit.

Carry-forward warnings: `data-solid-surfaces="true"` is the blur-disabled QA hook; route motion is reduced-motion gated; `content-visibility: auto` remains rejected for public rows and article bodies unless fresh screenshots prove it does not create blank content; owner/editor data and writing surfaces should stay mostly opaque.

Stop conditions: stop and document if a new task requires credentials, deployment, migration, production data access, destructive commands, server/schema changes, or edit paths outside the requested scope.
