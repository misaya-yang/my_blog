# AI Tech Blog Release Workflow

## Source Files

- `docs/deployment.md`: canonical Vercel + Supabase deployment guide.
- `package.json`: release scripts.
- `drizzle.config.ts`: migration URL priority: `MIGRATION_DATABASE_URL`, then `DIRECT_URL`, then `DATABASE_URL`.
- `drizzle/schema.ts`: Drizzle schema.
- `drizzle/`: migration SQL and metadata.
- `vercel.json`: Vercel build, function, output, and rewrite config.
- `.env.example`: environment variable checklist.

## Commands

Release gates:

```bash
pnpm check
pnpm test
pnpm build
pnpm audit:baseline:quick
```

Drizzle database commands:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Vercel deploy commands:

```bash
vercel
vercel --prod
```

## Environment

Runtime should use the Supabase pooler `DATABASE_URL`.

Migrations should prefer `MIGRATION_DATABASE_URL` or `DIRECT_URL` when available. The project loads `.env` and then `.env.local`; keep real values local or in Vercel/Supabase dashboards, never in git.

Required Vercel variables from `docs/deployment.md`:

```text
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

Optional variables:

```text
BUILT_IN_FORGE_API_URL
BUILT_IN_FORGE_API_KEY
VITE_FRONTEND_FORGE_API_URL
VITE_FRONTEND_FORGE_API_KEY
VITE_ANALYTICS_ENDPOINT
VITE_ANALYTICS_WEBSITE_ID
```

## Production Publish Checklist

1. Run `git status --short` and identify unrelated local changes.
2. Read `docs/deployment.md` for current deployment notes.
3. If `drizzle/schema.ts` changed, run `pnpm db:generate`.
4. Review new `drizzle/*.sql` files for destructive operations and data assumptions.
5. Run release gates: `pnpm check`, `pnpm test`, `pnpm build`, `pnpm audit:baseline:quick`.
6. Confirm with the user before live migration.
7. Run `pnpm db:migrate`.
8. Run `pnpm db:seed` only for a new database, requested content refresh, or a documented release need.
9. Confirm with the user before production deploy if not already explicit.
10. Run `vercel --prod`.
11. Verify the returned deployment URL and production domains.

## Post-Deploy Checks

Production domains:

- `https://misaya.online`
- `https://www.misaya.online`
- `https://my-blog-jade-ten-50.vercel.app`

Check:

- `/` renders the blog frontend.
- `/post/:slug` returns indexable article HTML when database content is present.
- `/login` renders owner and visitor flows.
- unknown routes return 404/noindex behavior.
- the IsoHC post appears publicly after seeding.
- the EVQ-Cosh post remains draft if related work is still under double-blind review.
- Vercel logs do not show `Database not available`.

## Rollback

- Bad deployment, healthy database: use Vercel previous deployment rollback.
- Bad migration: create a forward-only corrective migration.
- Destructive data incident: restore from Supabase backups, then rerun the baseline audit against the restored deployment URL.
