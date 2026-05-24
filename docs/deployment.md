# Supabase + Vercel Deployment Guide

Last updated: 2026-05-24

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
VITE_APP_ID
VITE_OAUTH_PORTAL_URL
OAUTH_SERVER_URL
```

Optional variables if the related features are used:

```bash
BUILT_IN_FORGE_API_URL
BUILT_IN_FORGE_API_KEY
VITE_FRONTEND_FORGE_API_URL
VITE_FRONTEND_FORGE_API_KEY
VITE_ANALYTICS_ENDPOINT
VITE_ANALYTICS_WEBSITE_ID
```

Do not commit real values. `.env`, `.env.local`, and production-local env files are ignored by git.

## Vercel Deploy

The repository includes `vercel.json`:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist/public",
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/index" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Deployment order:

1. Configure Supabase and Vercel environment variables.
2. Run `pnpm check`.
3. Run `pnpm build`.
4. Run `pnpm db:migrate`.
5. Run `pnpm db:seed` if this is a new database.
6. Deploy:

```bash
vercel --prod
```

If using the Vercel dashboard, import this repository, keep the build command as `pnpm build`, and keep the output directory as `dist/public`.

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

Latest verified deployment after the space-style UI redesign and custom domain cutover:

- Deployment URL: https://my-blog-61cs31tcf-zedpl28174-3992s-projects.vercel.app
- Vercel deployment id: `dpl_HFotzLwkixChb67cNRBAf6Wy71na`

Open the production URL and verify:

- `/` renders the blog frontend.
- `/api/trpc/posts.list?batch=1&input=...` is reachable through the tRPC client from the UI.
- The EVQ-Cosh and IsoHC published posts appear after `pnpm db:seed`.
- Admin login uses `ADMIN_PASSWORD`, not the fallback `admin123`.
- The Vercel deployment logs show no `Database not available` warnings.

## References

- Supabase Drizzle guide: https://supabase.com/docs/guides/database/drizzle
- Supabase connection strings: https://supabase.com/docs/guides/database/connecting-to-postgres
- Vercel Express guide: https://vercel.com/docs/frameworks/backend/express
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Vercel project configuration: https://vercel.com/docs/project-configuration/vercel-json
