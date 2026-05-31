# Supabase + Vercel Deployment Guide

Last updated: 2026-05-31

This project is a Vite React frontend with an Express/tRPC backend. The production target is Vercel, and the database target is Supabase Postgres.

## Current Architecture

- Frontend: Vite builds static assets into `dist/public`.
- API: Express is exported from `api/index.ts` as a Vercel Node.js Function.
- Database: Drizzle ORM uses PostgreSQL via `postgres` and `drizzle-orm/postgres-js`.
- Migrations: Drizzle migration files live in `drizzle/`.
- Seed data: `seed-blog.mjs` creates/updates the owner, category, tags, and initial research posts.

Relevant files:

- `server/app.ts`: shared Express app used by local dev and Vercel.
- `server/_core/index.ts`: local server entrypoint for `pnpm dev` and `pnpm start`.
- `api/index.ts`: Vercel Function entrypoint.
- `vercel.json`: Vercel build, output, function, and rewrite config.
- `drizzle/schema.ts`: Supabase/Postgres Drizzle schema.
- `drizzle.config.ts`: Drizzle Kit config. Uses `MIGRATION_DATABASE_URL`, then `DIRECT_URL`, then `DATABASE_URL`.
- `.env.example`: full environment variable checklist.

## Supabase Setup

1. Open the Supabase project dashboard.
2. Go to `Connect` and copy the Postgres URI.
3. Use the Supabase shared/transaction pooler URI for runtime:

```bash
DATABASE_URL="postgresql://postgres.<project-ref>:<db-password>@<region>.pooler.supabase.com:6543/postgres"
```

4. Use a direct or session-pooler URI for migrations when possible:

```bash
MIGRATION_DATABASE_URL="postgresql://postgres.<project-ref>:<db-password>@<region>.pooler.supabase.com:5432/postgres"
```

The runtime connection in `server/db.ts` sets `prepare: false`, which matches Supabase pooler guidance for `postgres-js`.

## Local Database Commands

Create `.env.local` from `.env.example`, then fill in Supabase credentials.
The local server and Drizzle config load `.env` first and `.env.local` second, so project-specific local values can live in `.env.local`.

Generate migrations after schema edits:

```bash
pnpm db:generate
```

Apply migrations to Supabase:

```bash
pnpm db:migrate
```

Seed the initial blog content:

```bash
pnpm db:seed
```

For production, prefer `db:migrate` over `db:push` so schema changes are recorded in migration files.

## Vercel Environment Variables

Set these in Vercel Project Settings -> Environment Variables for Production and Preview:

```bash
DATABASE_URL
ADMIN_PASSWORD
JWT_SECRET
OWNER_OPEN_ID
OWNER_NAME
SITE_URL
VITE_SITE_URL
VITE_APP_ID
VITE_OAUTH_PORTAL_URL
OAUTH_SERVER_URL
```

Optional variables if the related features are used:

```bash
BUILT_IN_FORGE_API_URL
BUILT_IN_FORGE_API_KEY
BLOG_AGENT_MODEL
VITE_FRONTEND_FORGE_API_URL
VITE_FRONTEND_FORGE_API_KEY
VITE_ANALYTICS_ENDPOINT
VITE_ANALYTICS_WEBSITE_ID
```

Do not commit real values. `.env`, `.env.local`, and production-local env files are ignored by git.

## Vercel Deploy

The repository includes `vercel.json`. Known public/owner routes are routed to the Vercel function when server-rendered fallbacks or HTTP status handling are needed; static assets are served from `dist/public`.

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist/public",
  "functions": {
    "api/index.ts": {
      "maxDuration": 30,
      "includeFiles": "dist/public/index.html"
    }
  },
  "rewrites": [
    { "source": "/robots.txt", "destination": "/api/index" },
    { "source": "/sitemap.xml", "destination": "/api/index" },
    { "source": "/rss.xml", "destination": "/api/index" },
    { "source": "/api/:path*", "destination": "/api/index" },
    { "source": "/post/:slug", "destination": "/api/index" },
    { "source": "/", "destination": "/index.html" },
    { "source": "/algorithms", "destination": "/index.html" },
    { "source": "/applications", "destination": "/index.html" },
    { "source": "/archive", "destination": "/index.html" },
    { "source": "/search", "destination": "/index.html" },
    { "source": "/about", "destination": "/index.html" },
    { "source": "/login", "destination": "/index.html" },
    { "source": "/manage", "destination": "/index.html" },
    { "source": "/manage/agent", "destination": "/index.html" },
    { "source": "/write", "destination": "/index.html" },
    { "source": "/write/:slug", "destination": "/index.html" },
    { "source": "/tags/:slug", "destination": "/index.html" },
    { "source": "/categories/:slug", "destination": "/index.html" },
    { "source": "/404", "destination": "/index.html" },
    { "source": "/:path*", "destination": "/api/index" }
  ]
}
```

Deployment order:

1. Configure Supabase and Vercel environment variables.
2. Run `pnpm check`.
3. Run `pnpm test`.
4. Run `pnpm build`.
5. Run `pnpm audit:baseline:quick`.
6. Run `pnpm db:migrate`.
7. Run `pnpm db:seed` if this is a new database.
8. Deploy:

```bash
vercel --prod
```

If using the Vercel dashboard, import this repository, keep the build command as `pnpm build`, and keep the output directory as `dist/public`.

## CI and Preview Gates

`.github/workflows/release-gates.yml` runs on pull requests and main/codex branch pushes:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm audit:baseline:quick
```

For preview deployments, verify:

- `/` renders and has no framework overlay.
- one public `/post/:slug` returns indexable article HTML when database content is present.
- `/login` renders owner/visitor flows.
- an unknown route returns a 404/noindex response.
- `docs/harness_engine/reports/latest-baseline.json` contains the latest bundle budget snapshot.

## Migration and Rollback

Migration flow:

1. Generate migration files locally with `pnpm db:generate`.
2. Review SQL in `drizzle/*.sql`.
3. Apply to preview/staging first with `pnpm db:migrate`.
4. Run smoke checks against the preview URL.
5. Apply to production before promoting the deployment.

Rollback flow:

1. If the deployment is bad but the database is healthy, use Vercel's previous deployment rollback.
2. If a migration is bad, create a forward-only corrective migration; do not hand-edit Drizzle snapshots.
3. Restore database backups from Supabase only for destructive data incidents.
4. After rollback, rerun `pnpm audit:baseline:quick` against the restored deployment URL.

## Owner Content Verification

Before publishing a substantial content update:

- `/manage` content health has no accidental hidden/public mismatch.
- categories and tags can be edited without scripts.
- posts that should be public have `status=published` and `visibility=public`.
- important articles have excerpt, category, tags, and cover image where appropriate.
- version history exists before risky rewrites, and restore is tested on preview.
- feedback and subscriber data remain owner-only.

## Post-Deploy Checks

Current production domains:

- https://misaya.online
- https://www.misaya.online
- https://my-blog-jade-ten-50.vercel.app

Custom domain DNS is hosted in Aliyun/HiChina (`dns17.hichina.com`, `dns18.hichina.com`). Keep these records pointed at Vercel:

```text
@    A    76.76.21.21
www  A    76.76.21.21
```

The `yang.misaya.online` record is managed separately and is not part of the Vercel blog deployment.

Latest verified deployment after the liquid-glass UI, i18n, and routing release:

- Deployment URL: https://my-blog-bbeobzf33-zedpl28174-3992s-projects.vercel.app
- Vercel deployment id: `dpl_2UPDim2jHQSRivHhfFtTkiedZqeg`
- Verified production alias: https://misaya.online
- Verified secondary alias: https://www.misaya.online

Open the production URL and verify:

- `/` renders the blog frontend.
- `/projects` renders the site-owned 404 page rather than the Vercel platform 404.
- `/api/trpc/posts.list?batch=1&input=...` is reachable through the tRPC client from the UI.
- The IsoHC post appears publicly after `pnpm db:seed`.
- The EVQ-Cosh post remains a draft while related work may be under double-blind review.
- Admin login uses `ADMIN_PASSWORD`, not the fallback `admin123`.
- The Vercel deployment logs show no `Database not available` warnings.

## References

- Supabase Drizzle guide: https://supabase.com/docs/guides/database/drizzle
- Supabase connection strings: https://supabase.com/docs/guides/database/connecting-to-postgres
- Vercel Express guide: https://vercel.com/docs/frameworks/backend/express
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Vercel project configuration: https://vercel.com/docs/project-configuration/vercel-json
