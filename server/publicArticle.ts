import * as db from "./db.js";
import { ENV } from "./_core/env.js";
import { getPublicSeedArticleBySlug } from "./publicSeedPosts.js";

type PublicArticle = NonNullable<
  Awaited<ReturnType<typeof db.getPostWithRelationsBySlug>>
>;

const TTL_MS = 60_000;
const MAX_ENTRIES = 200;
const cache = new Map<
  string,
  { expires: number; value: Promise<PublicArticle | null> }
>();

async function readPublicArticle(slug: string) {
  if (!ENV.isProduction) {
    const seed = await getPublicSeedArticleBySlug(slug);
    if (seed) return seed as PublicArticle;
  }
  const article = await db.getPostWithRelationsBySlug(slug);
  if (!article)
    return (await getPublicSeedArticleBySlug(slug)) as PublicArticle | null;
  if (article.status !== "published" || article.visibility !== "public")
    return null;
  return article;
}

/**
 * A published, public article with its category and tags, read in one
 * database round trip and kept for a minute. The HTML render and the API
 * share it, and concurrent requests share one read, so an article costs the
 * database one query per minute per instance rather than several per visit.
 * Failed reads are not kept.
 */
export function loadPublicArticle(slug: string): Promise<PublicArticle | null> {
  const now = Date.now();
  const hit = cache.get(slug);
  if (hit && hit.expires > now) return hit.value;
  const value = readPublicArticle(slug);
  cache.delete(slug);
  cache.set(slug, { expires: now + TTL_MS, value });
  value.catch(() => {
    if (cache.get(slug)?.value === value) cache.delete(slug);
  });
  if (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return value;
}

/** Publishing, editing or removing a post makes every kept copy stale. */
export function invalidatePublicArticles() {
  cache.clear();
}
