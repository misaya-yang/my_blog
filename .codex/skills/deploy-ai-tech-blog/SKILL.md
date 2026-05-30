---
name: deploy-ai-tech-blog
description: Project-local release and deployment workflow for this ai-tech-blog repository. Use when the user asks to publish or deploy this project, deploy to Vercel, run preview or production release gates, apply Drizzle migrations to Supabase, seed or update the Supabase database, verify production after deploy, or handle Vercel/Supabase rollback for this repo.
---

# Deploy AI Tech Blog

## Overview

Use this skill only inside the `ai-tech-blog` project. It turns the project deployment guide into an executable release workflow for Vercel deploys and Supabase Postgres schema/content updates.

The canonical project guide is `docs/deployment.md`. Read it before changing release behavior, deploying, or running database commands. For the condensed command flow, read `references/release-workflow.md`.

## Guardrails

- Treat `vercel --prod`, `pnpm db:migrate`, `pnpm db:push`, and production `pnpm db:seed` as live operations. Confirm with the user before running them unless the user has explicitly requested that exact operation in the current turn.
- Prefer `pnpm db:migrate` over `pnpm db:push` for production. Do not use `db:push` on production unless the user explicitly overrides this.
- Never print, commit, or copy secret values from `.env`, `.env.local`, Vercel, or Supabase.
- Do not hand-edit Drizzle snapshots or migration journal files to fix production state. Create a forward-only corrective migration instead.
- Preserve unrelated worktree changes. Check `git status --short` before release operations and call out unrelated dirty files.

## Workflow

1. Confirm scope: verify the repo root has `package.json`, `vercel.json`, `drizzle.config.ts`, `drizzle/schema.ts`, and `docs/deployment.md`.
2. Read `docs/deployment.md` and `references/release-workflow.md`.
3. Inspect relevant changes: schema changes, new migration files in `drizzle/`, deployment config changes, env requirements, and content seed changes.
4. Run release gates before deploying: `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm audit:baseline:quick`.
5. For database changes, generate migrations when schema changed, review generated SQL, apply to preview/staging first when available, then apply to production only after confirmation.
6. Deploy with Vercel preview or production flow as requested.
7. Run post-deploy checks against the deployment URL and production domains. Update `docs/deployment.md` with the verified deployment URL only when the user wants the deployment recorded.

## Common Tasks

- **Preview deploy**: run release gates, ensure migrations are preview-safe, then use `vercel` and verify the preview URL.
- **Production publish**: run release gates, apply confirmed Supabase migrations, seed only when needed, run `vercel --prod`, then verify production.
- **Database migration/update**: use Drizzle migration files in `drizzle/`, confirm `MIGRATION_DATABASE_URL` or equivalent is configured, run `pnpm db:migrate`, and verify app routes using database content.
- **Rollback**: use Vercel rollback for bad deployments with healthy data. For bad migrations, create a forward-only corrective migration; restore Supabase backups only for destructive data incidents.
