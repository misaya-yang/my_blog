# Personal Research Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a distinctive personal deep-learning research blog with JWT auth, owner-only writing tools, updated EVQ-Cosh content, and tested global UI polish.

**Architecture:** Keep the existing Vite/React/tRPC/Express/Postgres stack. Extract auth into a server helper module with signed JWT cookies, improve frontend auth state through `auth.session`, keep Markdown as the post storage format, and restyle public/editor screens with a focused research-notebook visual system.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, shadcn/Radix primitives, tRPC, Express, jose, Drizzle/Postgres, Vitest.

---

## File Structure

- Create `server/auth.ts`: JWT signing, verification, cookie helpers, session resolution.
- Modify `server/routers.ts`: use auth helpers, add visitor login/session/logout endpoints.
- Modify `server/posts.test.ts` and `server/auth.logout.test.ts`: cover new auth behavior.
- Modify `client/src/_core/hooks/useAuth.ts`: consume unified session state.
- Modify `client/src/pages/Login.tsx`: two-tab admin/visitor login.
- Modify `client/src/pages/Editor.tsx`: research-writing studio UX.
- Modify `client/src/pages/Home.tsx`, `client/src/pages/PostDetail.tsx`, `client/src/pages/Manage.tsx`, `client/src/index.css`, `client/src/contexts/LanguageContext.tsx`: global visual system and copy.
- Modify `dfrope_blog_post.md` and `seed-blog.mjs`: replace DF-RoPE with EVQ-Cosh content and metadata.

## Tasks

### Task 1: Auth Tests

- [ ] Add tests showing anonymous sessions are unauthenticated, visitor login sets a JWT cookie and returns role `visitor`, admin login sets a signed JWT cookie, visitor users cannot create posts, and logout clears both cookies.
- [ ] Run `pnpm test server/posts.test.ts server/auth.logout.test.ts` and confirm the new tests fail because the endpoints/helpers do not exist yet.

### Task 2: JWT Auth Implementation

- [ ] Create `server/auth.ts` with `signAdminSession`, `verifyAdminSession`, `signVisitorSession`, `verifyVisitorSession`, `resolveBlogSession`, `buildSessionCookie`, and `buildClearedCookie`.
- [ ] Update `server/routers.ts` so `adminProcedure` uses `verifyAdminSession`, `posts.list` only includes unpublished posts for signed admin sessions, and `auth` exposes `session`, `visitorLogin`, `adminLogin`, `adminLogout`, and `logout`.
- [ ] Run the focused auth tests until they pass.

### Task 3: Frontend Auth UX

- [ ] Update `useAuth` to query `auth.session` and expose `role`, `displayName`, `isVisitor`, `loginState`, and `logout`.
- [ ] Replace the login card with owner and visitor modes. Owner mode asks for password. Visitor mode asks for a nickname and explains no email is required.
- [ ] Ensure write/manage routes check `isAdmin`, not only `isAuthenticated`.

### Task 4: EVQ-Cosh Article

- [ ] Rewrite `dfrope_blog_post.md` as an EVQ-Cosh research explainer grounded in `/Users/yang/projects/hybrid-rope/paper`.
- [ ] Update `seed-blog.mjs` title, slug, category/tags, and excerpt generation.
- [ ] Ensure claims preserve evidence tiers and caveats from `hybrid-rope/AGENTS.md`.

### Task 5: Research Editor

- [ ] Restyle `Editor.tsx` into a writing studio with a command rail, status strip, stronger preview, research snippets, and stable responsive layout.
- [ ] Add quick insert helpers for theorem, proposition, proof sketch, citation note, display math, and figure blocks.
- [ ] Keep persisted content as Markdown.

### Task 6: Public UI

- [ ] Restyle `Home.tsx` as a personal research index with author identity, current focus, article ledger, and compact controls.
- [ ] Restyle `PostDetail.tsx` with editorial article typography, sticky outline, better edit link, and calmer share controls.
- [ ] Tighten `Manage.tsx` table density and owner workflow.
- [ ] Update `index.css` tokens and prose styles with the new visual identity.

### Task 7: Verification and Deployment

- [ ] Run `pnpm check`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Start `pnpm dev` and verify `/`, `/login`, `/post/evq-cosh-frequency-allocation`, `/write`, and mobile `/`.
- [ ] If verification is green, deploy with the linked Vercel project and record the deployment URL in `docs/deployment.md`.
