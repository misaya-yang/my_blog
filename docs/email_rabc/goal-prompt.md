# Email Auth + RBAC Goal Prompt

Copy this into a new Codex session when ready to implement.

```text
You are working in /Users/yang/projects/ai-tech-blog.

Create and maintain one long-running GLOBAL GOAL:

Complete the Email Auth + RBAC roadmap in docs/email_rabc, phase by phase, from EMAIL-00 through EMAIL-07. The end state is a production-ready email OTP login system: Supabase Auth backed verification, custom SMTP readiness, owner email allowlist, durable user role mapping, hardened admin gates, reader email identity, engagement integration, and release/deliverability checks.

Start by reading only:
1. docs/email_rabc/README.md
2. docs/email_rabc/phase-manifest.md
3. docs/email_rabc/execution-guide.md

Then execute phases in dependency order:
EMAIL-00 -> EMAIL-01 -> EMAIL-02 -> EMAIL-03 -> EMAIL-04 -> EMAIL-05 -> EMAIL-06 -> EMAIL-07

For each phase:
- Open only the target phase file and its PRIMARY_CONTEXT.
- Use the phase GOAL_PROMPT as the current sub-goal.
- Stay inside LIKELY_EDIT_PATHS unless the phase clearly requires otherwise.
- Do not edit paths listed in DO_NOT_EDIT.
- Implement the smallest complete solution for that phase.
- Prefer test-first changes for behavior and security rules.
- Run VALIDATION_COMMANDS.
- Run BROWSER_CHECKS for UI/product phases.
- Check every ACCEPTANCE_GATES item.
- Write a phase completion report in docs/email_rabc/reports using docs/email_rabc/reports/phase-report-template.md.
- If validation fails, fix and retest before moving on.
- When a phase is complete, automatically continue to the next phase.

Global constraints:
- Prefer Supabase Auth email OTP plus a custom SMTP provider over custom-built OTP storage.
- Use OTP code entry as MVP. Do not add Magic Link callbacks unless a phase explicitly changes scope.
- Do not build password login, open admin registration, social OAuth, MFA, passkeys, or public profile pages in this roadmap.
- Do not expose admin/hidden/draft content to non-admin readers.
- OWNER_EMAILS is the authoritative admin allowlist.
- A verified email that is not in OWNER_EMAILS becomes a reader identity, never an admin.
- External provider configuration, DNS changes, production DB migrations, deploys, and pushes require phase authorization; otherwise document them as blockers or run non-writing validation.
- Do not print secrets, commit .env.local, or put service-role keys in browser code.
- Do not revert unrelated user changes.
- Do not claim completion without validation evidence.

Stop only if:
- Required external credentials, DNS access, provider setup, or production login test inboxes are missing.
- A high-risk DB migration/deploy/provider mutation/push is required but not authorized by the phase.
- The same blocker repeats after reasonable attempts to work around it.
- Acceptance gates cannot pass and no safe alternative validation exists.

After each phase, report:
- GLOBAL_GOAL_PROGRESS
- CURRENT_PHASE
- STATUS: complete or blocked
- CHANGED_FILES
- VALIDATION_COMMANDS and results
- BROWSER_CHECKS and results, if applicable
- ACCEPTANCE_GATES pass/fail evidence
- RISKS_OR_BLOCKERS
- NEXT_PHASE

Begin with EMAIL-00:
docs/email_rabc/phase-00-auth-baseline.md
```
