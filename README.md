# AI Tech Blog

Personal AI research blog for model mechanisms, long-context algorithms, agent systems, RAG, evaluation harnesses, and AI application engineering.

## Stack

- Vite + React + Wouter
- Express + tRPC
- Drizzle ORM + PostgreSQL
- Tailwind v4, Radix/shadcn primitives
- Markdown, KaTeX, syntax highlighting

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

The app can boot without `DATABASE_URL`, but article data, subscription capture, feedback, and owner content operations need Postgres.

## Environment

Required in production:

```bash
DATABASE_URL
ADMIN_PASSWORD
JWT_SECRET
OWNER_OPEN_ID
OWNER_NAME
SITE_URL
VITE_SITE_URL
```

Optional:

```bash
MIGRATION_DATABASE_URL
DIRECT_URL
VITE_ANALYTICS_ENDPOINT
VITE_ANALYTICS_WEBSITE_ID
```

Analytics is environment-gated; missing analytics variables must not break the public site.

## Commands

```bash
pnpm check
pnpm test
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm audit:baseline
pnpm audit:baseline:quick
```

## Content Workflow

1. Log in at `/login` as the owner.
2. Draft or edit articles at `/write` or `/write/:slug`.
3. Use Article Settings for excerpt, cover image, category, tags, series metadata, featured rank, pinned track, and version restore.
4. Use `/manage` for article status, visibility, content health, taxonomy management, reader feedback, and subscriber export.
5. Before release, run `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm audit:baseline:quick`.

## Release Gates

GitHub Actions workflow `.github/workflows/release-gates.yml` runs install, typecheck, tests, build, and Phase 00 audit smoke on pull requests and main/codex branch pushes.

See `docs/deployment.md` for deployment, migrations, rollback, and verification.
