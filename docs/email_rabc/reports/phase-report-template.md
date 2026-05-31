# EMAIL-XX Phase Completion Report

**Date:** YYYY-MM-DD

**Phase:** EMAIL-XX - Phase Name

## GLOBAL_GOAL_PROGRESS

Example: `EMAIL-00 complete; next EMAIL-01`.

## CURRENT_PHASE

`EMAIL-XX`

## STATUS

`complete` or `blocked`

## CHANGED_FILES

- `/Users/yang/projects/ai-tech-blog/path/to/file`

## VALIDATION_COMMANDS

| Command | Result | Evidence |
| --- | --- | --- |
| `pnpm check` | pass/fail/not run | short output summary |

## BROWSER_CHECKS

| Route | Viewport | Result | Evidence |
| --- | --- | --- | --- |
| `/login` | desktop | pass/fail/not run | observed state |

## ACCEPTANCE_GATES

| Gate | Result | Evidence |
| --- | --- | --- |
| Gate text from phase file | pass/fail | concrete evidence |

## RISKS_OR_BLOCKERS

- None, or exact blocker and required user action.

## EXTERNAL_ACTIONS

List any action that was not performed because it requires authorization:

- Production DB migration
- DNS change
- Supabase Auth SMTP setting
- Real OTP send
- Deploy
- Push

## NEXT_PHASE

`EMAIL-XX` or `blocked until ...`
