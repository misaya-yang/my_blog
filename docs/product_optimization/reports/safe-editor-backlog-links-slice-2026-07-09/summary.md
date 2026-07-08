# Safe Editor Backlog Links Slice

Date: 2026-07-09
Branch: `dev`

## Scope

This slice updates owner writing backlog links so feedback-driven revision items carry the public article slug into the editor:

```text
/write?idea=<public-title>&source=feedback&article=<public-slug>
```

Search miss backlog links remain article-free:

```text
/write?idea=<query>&source=search_miss
```

## Files

- `server/engagement.router.ts`
- `server/engagement.router.test.ts`

## Code Review Notes

- `URLSearchParams` is used for encoding query params.
- Feedback links use public article title and slug only.
- Private feedback text, reply email, and contact details are not placed in URLs.
- Search miss links do not invent an article association.

## Verification

```bash
corepack pnpm test -- server/engagement.router.test.ts
```

Passed: 63 test files, 353 tests.

```bash
corepack pnpm check
```

Passed.

```bash
corepack pnpm build
```

Passed.

```bash
git diff --check
```

Passed.

## Remaining Risk

The editor still needs richer first-screen rendering of these intent params. This slice only makes the backlog links safer and more complete.
