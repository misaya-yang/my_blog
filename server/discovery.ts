import type { Category, Post, Tag } from "../drizzle/schema";
import {
  expandSearchToken,
  getAliasGroupsForQuery,
  normalizeSearchText,
  tokenizeSearchQuery,
} from "../shared/search-aliases.js";
export { estimateReadingMinutes } from "../shared/reading-time.js";

export type DiscoveryPost = Post & {
  category: Category | null;
  tags: Tag[];
  readingMinutes: number;
  matchExcerpt?: string;
};

export type DiscoverySearchResult = {
  results: DiscoveryPost[];
  total: number;
};

export type ArchiveGroup = {
  key: string;
  year: number;
  month: number;
  posts: DiscoveryPost[];
};

type Pagination = {
  limit?: number;
  offset?: number;
};

export function searchDiscoveryPosts(
  posts: DiscoveryPost[],
  query: string,
  pagination: Pagination = {}
): DiscoverySearchResult {
  const searchPlan = buildSearchPlan(query);
  const publicPosts = sortByPublishedDesc(posts.filter(isPublicPost));
  const matches = searchPlan.normalizedQuery
    ? publicPosts.filter((post) => postMatchesSearch(post, searchPlan))
    : publicPosts;
  const offset = Math.max(0, pagination.offset ?? 0);
  const limit = Math.min(Math.max(1, pagination.limit ?? 10), 50);

  return {
    results: matches.slice(offset, offset + limit).map((post) => ({
      ...post,
      matchExcerpt: searchPlan.normalizedQuery
        ? buildMatchExcerpt(post, searchPlan)
        : post.excerpt ?? undefined,
    })),
    total: matches.length,
  };
}

export function filterPostsByTag(posts: DiscoveryPost[], slug: string): DiscoveryPost[] {
  return sortByPublishedDesc(
    posts.filter(
      (post) => isPublicPost(post) && post.tags.some((tag) => tag.slug === slug)
    )
  );
}

export function filterPostsByCategory(posts: DiscoveryPost[], slug: string): DiscoveryPost[] {
  return sortByPublishedDesc(
    posts.filter((post) => isPublicPost(post) && post.category?.slug === slug)
  );
}

export function groupArchivePosts(posts: DiscoveryPost[]): ArchiveGroup[] {
  const groups = new Map<string, ArchiveGroup>();

  for (const post of sortByPublishedDesc(posts.filter(isPublicPost))) {
    if (!post.publishedAt) continue;
    const date = new Date(post.publishedAt);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const group = groups.get(key) ?? { key, year, month, posts: [] };
    group.posts.push(post);
    groups.set(key, group);
  }

  return Array.from(groups.values());
}

export function getAdjacentPosts(
  current: DiscoveryPost,
  posts: DiscoveryPost[]
): {
  previous: DiscoveryPost | null;
  next: DiscoveryPost | null;
} {
  const publicPosts = sortByPublishedDesc(posts.filter(isPublicPost));
  const index = publicPosts.findIndex((post) => post.id === current.id);

  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: publicPosts[index + 1] ?? null,
    next: publicPosts[index - 1] ?? null,
  };
}

export function rankRelatedPosts(
  current: DiscoveryPost,
  posts: DiscoveryPost[],
  limit = 4
): DiscoveryPost[] {
  const currentTagSlugs = new Set(current.tags.map((tag) => tag.slug));

  return posts
    .filter((post) => isPublicPost(post) && post.id !== current.id)
    .map((post) => {
      const sharedTagCount = post.tags.filter((tag) => currentTagSlugs.has(tag.slug)).length;
      const sameCategory = Boolean(
        current.category?.slug && post.category?.slug === current.category.slug
      );

      return {
        post,
        sharedTagCount,
        sameCategory,
      };
    })
    .filter((candidate) => candidate.sharedTagCount > 0 || candidate.sameCategory)
    .sort((a, b) => {
      if (b.sharedTagCount !== a.sharedTagCount) {
        return b.sharedTagCount - a.sharedTagCount;
      }
      if (Number(b.sameCategory) !== Number(a.sameCategory)) {
        return Number(b.sameCategory) - Number(a.sameCategory);
      }
      const byDate = publishedTime(b.post) - publishedTime(a.post);
      if (byDate !== 0) return byDate;
      return a.post.slug.localeCompare(b.post.slug);
    })
    .slice(0, limit)
    .map((candidate) => candidate.post);
}

function isPublicPost(post: DiscoveryPost) {
  return post.status === "published" && post.visibility === "public";
}

function sortByPublishedDesc(posts: DiscoveryPost[]) {
  return [...posts].sort((a, b) => {
    const byDate = publishedTime(b) - publishedTime(a);
    if (byDate !== 0) return byDate;
    return a.slug.localeCompare(b.slug);
  });
}

function publishedTime(post: DiscoveryPost) {
  return post.publishedAt ? new Date(post.publishedAt).getTime() : 0;
}

function postMatchesSearch(post: DiscoveryPost, searchPlan: SearchPlan) {
  const corpus = searchCorpus(post);
  if (corpus.includes(searchPlan.normalizedQuery)) return true;
  return searchPlan.groups.every(group =>
    group.some(term => corpus.includes(term))
  );
}

function searchCorpus(post: DiscoveryPost) {
  return normalizeSearchText(
    [
      post.title,
      post.excerpt,
      post.content,
      post.category?.name,
      post.category?.slug,
      ...post.tags.flatMap((tag) => [tag.name, tag.slug]),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

type SearchPlan = {
  normalizedQuery: string;
  groups: string[][];
  excerptNeedles: string[];
};

function buildSearchPlan(query: string): SearchPlan {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return { normalizedQuery, groups: [], excerptNeedles: [] };
  }

  const queryTokens = tokenizeSearchQuery(normalizedQuery);
  const groups = queryTokens.map(token => expandSearchToken(token));
  const aliasGroups = getAliasGroupsForQuery(normalizedQuery, queryTokens);
  const allGroups = [...groups, ...aliasGroups].filter(group => group.length > 0);
  const excerptNeedles = Array.from(
    new Set([normalizedQuery, ...allGroups.flat()].filter(Boolean))
  ).sort((a, b) => b.length - a.length);

  return {
    normalizedQuery,
    groups: allGroups.length > 0 ? allGroups : [[normalizedQuery]],
    excerptNeedles,
  };
}

function buildMatchExcerpt(post: DiscoveryPost, searchPlan: SearchPlan) {
  const sources = [
    post.excerpt,
    post.title,
    post.content,
    post.category?.name,
    ...post.tags.flatMap((tag) => [tag.name, tag.slug]),
  ].filter(Boolean) as string[];
  const match = findExcerptMatch(sources, searchPlan.excerptNeedles);
  const source =
    match?.source ??
    post.excerpt ??
    post.content ??
    post.title;
  const normalizedSource = normalizeSearchText(source);
  const needle = match?.needle ?? searchPlan.normalizedQuery;
  const index = normalizedSource.indexOf(needle);

  if (index === -1) {
    return source.slice(0, 220);
  }

  const start = Math.max(0, index - 80);
  const end = Math.min(source.length, index + needle.length + 140);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < source.length ? "..." : "";
  return `${prefix}${source.slice(start, end)}${suffix}`;
}

function findExcerptMatch(sources: string[], needles: string[]) {
  for (const needle of needles) {
    const source = sources.find(value => normalizeSearchText(value).includes(needle));
    if (source) return { source, needle };
  }
  return null;
}
