import type { Category, Post, Tag } from "../drizzle/schema";
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

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function postMatchesSearch(post: DiscoveryPost, searchPlan: SearchPlan) {
  const corpus = searchCorpus(post);
  if (corpus.includes(searchPlan.normalizedQuery)) return true;
  return searchPlan.groups.every(group =>
    group.some(term => corpus.includes(term))
  );
}

function searchCorpus(post: DiscoveryPost) {
  return normalize(
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

const DISCOVERY_ALIASES: Record<string, string[]> = {
  agent: ["agent", "agents", "智能体", "agentloop", "loop", "runtime", "运行时"],
  agents: ["agent", "agents", "智能体", "agentloop", "loop", "runtime", "运行时"],
  智能体: [
    "agent systems",
    "agent harness",
    "agentloop",
    "agent routing",
    "loop",
    "runtime",
    "运行时",
  ],
  循环: ["agentloop", "loop", "runtime", "运行时"],
  rag: ["rag", "retrieval", "检索", "证据", "evidence", "packet", "证据包"],
  retrieval: ["rag", "retrieval", "检索", "evidence", "packet"],
  检索: ["rag", "retrieval", "evidence", "packet"],
  证据: ["rag", "evidence", "packet", "证据包"],
  harness: ["harness", "evaluation", "评测", "trace", "tool", "工具"],
  eval: ["harness", "evaluation", "评测", "trace"],
  iso: ["isohc", "residual", "残差", "稳定性", "正交", "invariant", "不变量"],
  isohc: ["iso", "residual", "残差", "稳定性", "正交", "invariant", "不变量"],
  残差: ["isohc", "residual", "stability", "稳定性"],
  rope: ["rope", "position", "位置编码", "long context", "长上下文"],
  位置编码: ["rope", "position", "position encoding", "long context", "长上下文"],
  context: ["context", "上下文", "long context", "context engineering"],
  上下文: ["context", "context engineering", "long context"],
  ffn: ["ffn", "gated ffn", "swiglu", "geglu", "门控", "通道", "mlp"],
  swiglu: ["ffn", "gated ffn", "swiglu", "门控"],
  门控: ["ffn", "gated ffn", "swiglu", "通道"],
  flow: ["flow matching", "diffusion", "生成", "扩散", "transport", "运输"],
  diffusion: ["flow matching", "diffusion", "生成", "扩散", "transport"],
  生成: ["flow matching", "diffusion", "generative", "transport", "运输"],
  扩散: ["flow matching", "diffusion", "generative"],
  rlhf: ["rlhf", "reinforcement learning", "强化学习", "post-training", "后训练"],
  rlvr: ["rlvr", "verifiable rewards", "可验证奖励", "强化学习", "后训练"],
  dpo: ["dpo", "preference optimization", "偏好优化", "rlhf"],
  grpo: ["grpo", "reinforcement learning", "强化学习", "rlvr"],
  强化学习: ["rlhf", "reinforcement learning", "rlvr", "grpo", "后训练"],
  后训练: ["post-training", "rlhf", "dpo", "rlvr", "偏好优化"],
  偏好优化: ["preference optimization", "dpo", "rlhf"],
};

function buildSearchPlan(query: string): SearchPlan {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return { normalizedQuery, groups: [], excerptNeedles: [] };
  }

  const groups = tokenizeSearchQuery(normalizedQuery).map(token =>
    expandSearchToken(token)
  );
  const queryTokens = tokenizeSearchQuery(normalizedQuery);
  const aliasGroups = Object.entries(DISCOVERY_ALIASES)
    .filter(([alias]) => queryContainsAlias(normalizedQuery, queryTokens, alias))
    .map(([, expansions]) => expansions.map(normalize).filter(Boolean));
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

function tokenizeSearchQuery(normalizedQuery: string) {
  if (!/\s/.test(normalizedQuery)) return [normalizedQuery];
  return normalizedQuery
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length >= 2 && !["ai", "the", "and"].includes(token));
}

function queryContainsAlias(
  normalizedQuery: string,
  queryTokens: string[],
  alias: string
) {
  const normalizedAlias = normalize(alias);
  if (!normalizedAlias) return false;
  if (/^[a-z0-9-]+$/.test(normalizedAlias)) {
    return queryTokens.includes(normalizedAlias);
  }
  return normalizedQuery.includes(normalizedAlias);
}

function expandSearchToken(token: string) {
  return Array.from(new Set([token, ...(DISCOVERY_ALIASES[token] ?? [])].map(normalize).filter(Boolean)));
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
  const normalizedSource = normalize(source);
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
    const source = sources.find(value => normalize(value).includes(needle));
    if (source) return { source, needle };
  }
  return null;
}
