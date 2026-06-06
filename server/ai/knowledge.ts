import { createHash } from "node:crypto";

export type KnowledgeChunkType =
  | "post_chunk"
  | "post_metadata_chunk"
  | "site_overview_chunk";
export type KnowledgePostStatus = "draft" | "published";
export type KnowledgePostVisibility = "hidden" | "admin" | "public";

export type KnowledgeTaxonomy = {
  id?: number;
  name: string;
  slug: string;
};

export type KnowledgePostInput = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  status: KnowledgePostStatus;
  visibility: KnowledgePostVisibility;
  category?: KnowledgeTaxonomy | null;
  tags?: KnowledgeTaxonomy[];
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export type KnowledgeChunkDraft = {
  chunkType: KnowledgeChunkType;
  postId: number | null;
  postSlug: string | null;
  postTitle: string | null;
  categorySlug: string | null;
  tagSlugs: string[];
  statusSnapshot: KnowledgePostStatus;
  visibilitySnapshot: KnowledgePostVisibility;
  locale: string;
  chunkIndex: number;
  heading: string | null;
  sectionPath: string | null;
  content: string;
  summary: string | null;
  keywords: string[];
  contentHash: string;
  tokenEstimate: number;
};

export type KnowledgeSearchResult = KnowledgeChunkDraft & {
  sourceId: string;
  score: number;
  excerpt: string;
  relevanceReason: string;
};

export type KnowledgeQueryAnalysis = {
  normalizedQuery: string;
  terms: string[];
  expandedTerms: string[];
  aliasExpansions: Array<{
    term: string;
    expansions: string[];
  }>;
  blockedAliases: string[];
  isIsoStandardQuery: boolean;
};

type BuildOptions = {
  locale?: string;
  includeSiteOverview?: boolean;
};

type SearchOptions = {
  limit?: number;
  scope?: {
    type: "site" | "post" | "category" | "tag" | "track";
    value?: string;
  };
  preferredSourceIds?: Set<string>;
};

const DEFAULT_LOCALE = "en";
const MAX_CHUNK_CHARS = 1800;
const CURRENT_POST_CONTEXT_LIMIT = 3;
const DEFAULT_POST_RESULT_LIMIT = 2;
const CURRENT_POST_RESULT_LIMIT = 5;
const PUBLIC_INVENTORY_CJK_TERMS = [
  "公开文章",
  "公开笔记",
  "都有哪些",
  "有哪些",
  "哪几篇",
  "几篇",
  "文章目录",
  "文章列表",
  "博客目录",
  "站内文章",
  "文章",
  "笔记",
  "目录",
  "列表",
];
const PUBLIC_INVENTORY_TERMS = [
  "blog",
  "map",
  "overview",
  "public",
  "available",
  "all",
  "show",
  "list",
  "post",
  "posts",
  "article",
  "articles",
  "note",
  "notes",
  "catalog",
  "index",
  "目录",
  "列表",
  "文章",
  "笔记",
  "公开文章",
  "公开笔记",
];
const KNOWN_CJK_QUERY_TERMS = [
  ...PUBLIC_INVENTORY_CJK_TERMS,
  "核心抽象",
  "核心主张",
  "长上下文",
  "位置编码",
  "阅读路径",
  "核心",
  "抽象",
  "主张",
  "固定向量",
  "等距",
  "双随机",
  "约束",
  "均值",
  "能量",
  "投影",
  "梯度",
  "门控",
  "门控ffn",
  "普通ffn",
  "前馈",
  "通道",
  "通道混合",
  "乘法",
  "激活函数",
  "精度",
  "实现",
  "后半部分",
  "后半",
  "失败",
  "边界",
  "章节",
  "部分",
  "残差",
  "稳定性",
  "不变量",
  "正交",
  "智能体",
  "检索",
  "证据包",
  "证据",
  "循环",
  "运行时",
  "评测",
  "工具",
  "上下文",
];
const ISO_STANDARD_PATTERN = /\biso(?:\/iec)?[\s-]*\d{2,}\b/i;
const PUBLIC_INVENTORY_QUERY_PATTERN =
  /\b(?:available|all|list|show|catalog|index|map|what)\s+(?:public\s+)?(?:posts?|articles?|notes?)\b|\b(?:posts?|articles?|notes?)\s+(?:available|list|catalog|index|map)\b|都有哪些|有哪些|哪几篇|几篇|文章目录|文章列表|博客目录|站内文章|公开文章|公开笔记|所有文章|全部文章|目录|列表/i;
const CLEARLY_EXTERNAL_QUERY_PATTERN =
  /\b(weather|stock|price|flight|recipe)\b|天气|明天|股票|航班|菜谱/i;
const UNAVAILABLE_CONTENT_QUERY_PATTERN =
  /\b(hidden|admin-only|draft|private|unpublished|secret)\b|隐藏|草稿|管理员|未公开|私有|秘密/i;
const QUERY_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "can",
  "could",
  "detail",
  "details",
  "does",
  "explain",
  "for",
  "from",
  "has",
  "have",
  "hidden",
  "how",
  "in",
  "into",
  "is",
  "it",
  "me",
  "of",
  "on",
  "or",
  "please",
  "should",
  "that",
  "the",
  "this",
  "to",
  "tomorrow",
  "what",
  "when",
  "where",
  "why",
  "with",
  "you",
]);

export function analyzeKnowledgeQuery(query: string): KnowledgeQueryAnalysis {
  const normalizedQuery = normalizeKnowledgeQuery(query);
  const isIsoStandardQuery = ISO_STANDARD_PATTERN.test(normalizedQuery);
  const terms = tokenize(normalizedQuery, { suppressIso: isIsoStandardQuery });
  const { expandedTerms, aliasExpansions, blockedAliases } = expandQueryTerms(
    terms,
    {
      isIsoStandardQuery,
    }
  );

  return {
    normalizedQuery,
    terms,
    expandedTerms,
    aliasExpansions,
    blockedAliases,
    isIsoStandardQuery,
  };
}

export function isPublicKnowledgePost(post: KnowledgePostInput) {
  return post.status === "published" && post.visibility === "public";
}

export function buildPublicKnowledgeChunks(
  posts: KnowledgePostInput[],
  options: BuildOptions = {}
): KnowledgeChunkDraft[] {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const publicPosts = posts.filter(isPublicKnowledgePost);
  const chunks: KnowledgeChunkDraft[] = [];

  if (options.includeSiteOverview ?? true) {
    const overview = buildSiteOverviewChunk(publicPosts, locale);
    if (overview) chunks.push(overview);
  }

  for (const post of publicPosts) {
    chunks.push(buildMetadataChunk(post, locale));
    chunks.push(...buildPostBodyChunks(post, locale));
  }

  return chunks;
}

export function searchPublicKnowledgeChunks(
  chunks: KnowledgeChunkDraft[],
  query: string,
  options: SearchOptions = {}
): KnowledgeSearchResult[] {
  const analysis = analyzeKnowledgeQuery(query);
  const terms = analysis.expandedTerms;
  const scope = options.scope;
  const restrictToCurrentPost = shouldRestrictToCurrentPost(
    query,
    analysis,
    scope
  );
  const currentPostContext = buildCurrentPostContextResults(
    chunks,
    query,
    analysis,
    scope
  );
  const siteOverviewContext = buildSiteOverviewContextResults(
    chunks,
    query,
    analysis,
    scope
  );

  if (
    terms.length === 0 &&
    currentPostContext.length === 0 &&
    siteOverviewContext.length === 0
  ) {
    return [];
  }
  if (
    siteOverviewContext.length > 0 &&
    shouldUseOnlySiteOverviewForInventory(analysis)
  ) {
    return siteOverviewContext.slice(0, options.limit ?? 8);
  }

  const results = chunks
    .filter(
      chunk =>
        chunk.statusSnapshot === "published" &&
        chunk.visibilitySnapshot === "public"
    )
    .filter(chunk => matchesScope(chunk, scope, restrictToCurrentPost))
    .filter(
      chunk =>
        !restrictToCurrentPost || chunk.chunkType !== "post_metadata_chunk"
    )
    .map(chunk => {
      const score = scoreChunk(chunk, terms, scope, options.preferredSourceIds);
      const result = {
        ...chunk,
        sourceId: buildSourceId(chunk),
        score,
        excerpt: buildExcerpt(chunk.content, terms),
        relevanceReason: buildRelevanceReason(chunk, terms),
      };
      return markCurrentPostResult(result, scope);
    })
    .filter(chunk => chunk.score > 0)
    .sort((a, b) => b.score - a.score || a.chunkIndex - b.chunkIndex);

  return diversifyByPost(
    pruneLowConfidenceResults(
      mergeResults([...siteOverviewContext, ...currentPostContext, ...results])
    )
  ).slice(0, options.limit ?? 8);
}

function buildSiteOverviewChunk(
  publicPosts: KnowledgePostInput[],
  locale: string
): KnowledgeChunkDraft | null {
  if (publicPosts.length === 0) return null;

  const categories = unique(
    publicPosts
      .map(post => post.category?.slug)
      .filter((slug): slug is string => Boolean(slug))
  );
  const tags = unique(
    publicPosts.flatMap(post => (post.tags ?? []).map(tag => tag.slug))
  );
  const lines = [
    "Public blog knowledge map.",
    `Tracks and categories: ${categories.join(", ") || "uncategorized"}.`,
    "Public posts:",
    "公开文章目录:",
    ...publicPosts.map(post => {
      return `- ${post.title} (${post.slug}) [${post.category?.slug ?? "uncategorized"}]`;
    }),
    `Tags: ${tags.join(", ") || "none"}.`,
  ];

  return makeChunk({
    chunkType: "site_overview_chunk",
    postId: null,
    postSlug: null,
    postTitle: null,
    categorySlug: null,
    tagSlugs: tags,
    statusSnapshot: "published",
    visibilitySnapshot: "public",
    locale,
    chunkIndex: 0,
    heading: "Public blog map",
    sectionPath: "site",
    content: lines.join("\n"),
    summary: "A compact map of public blog categories, tags, and posts.",
    keywords: unique([...PUBLIC_INVENTORY_TERMS, ...categories, ...tags]),
  });
}

function buildMetadataChunk(
  post: KnowledgePostInput,
  locale: string
): KnowledgeChunkDraft {
  const tagSlugs = (post.tags ?? []).map(tag => tag.slug);
  const content = [
    `Title: ${post.title}`,
    `Slug: ${post.slug}`,
    `Category: ${post.category?.slug ?? "uncategorized"}`,
    tagSlugs.length > 0 ? `Tags: ${tagSlugs.join(", ")}` : "Tags: none",
    post.excerpt ? `Excerpt: ${post.excerpt}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return makeChunk({
    chunkType: "post_metadata_chunk",
    postId: post.id,
    postSlug: post.slug,
    postTitle: post.title,
    categorySlug: post.category?.slug ?? null,
    tagSlugs,
    statusSnapshot: post.status,
    visibilitySnapshot: post.visibility,
    locale,
    chunkIndex: 0,
    heading: "Metadata",
    sectionPath: "metadata",
    content,
    summary: post.excerpt ?? null,
    keywords: unique([
      ...tokenize(post.title),
      post.slug,
      post.category?.slug ?? "",
      ...(post.tags ?? []).flatMap(tag => [tag.slug, tag.name]),
    ]),
  });
}

function buildPostBodyChunks(
  post: KnowledgePostInput,
  locale: string
): KnowledgeChunkDraft[] {
  const sections = splitMarkdownSections(post.content);
  const tagSlugs = (post.tags ?? []).map(tag => tag.slug);
  const chunks: KnowledgeChunkDraft[] = [];
  let chunkIndex = 1;

  for (const section of sections) {
    for (const content of splitLongText(section.content, MAX_CHUNK_CHARS)) {
      const trimmed = content.trim();
      if (!trimmed) continue;
      chunks.push(
        makeChunk({
          chunkType: "post_chunk",
          postId: post.id,
          postSlug: post.slug,
          postTitle: post.title,
          categorySlug: post.category?.slug ?? null,
          tagSlugs,
          statusSnapshot: post.status,
          visibilitySnapshot: post.visibility,
          locale,
          chunkIndex,
          heading: section.heading,
          sectionPath: section.heading,
          content: trimmed,
          summary: buildSummary(trimmed),
          keywords: unique([
            ...tokenize(post.title),
            ...(section.heading ? tokenize(section.heading) : []),
            post.category?.slug ?? "",
            ...tagSlugs,
          ]),
        })
      );
      chunkIndex += 1;
    }
  }

  return chunks;
}

function makeChunk(
  input: Omit<KnowledgeChunkDraft, "contentHash" | "tokenEstimate">
): KnowledgeChunkDraft {
  return {
    ...input,
    contentHash: hashContent(input.content),
    tokenEstimate: estimateTokens(input.content),
  };
}

function splitMarkdownSections(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const sections: Array<{ heading: string | null; content: string }> = [];
  let heading: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    const content = buffer.join("\n").trim();
    if (content) sections.push({ heading, content });
    buffer = [];
  };

  for (const line of lines) {
    const match = /^(#{1,4})\s+(.+)$/.exec(line.trim());
    if (match) {
      flush();
      heading = match[2].trim();
      buffer.push(line);
    } else {
      buffer.push(line);
    }
  }
  flush();

  if (sections.length === 0 && markdown.trim()) {
    sections.push({ heading: null, content: markdown.trim() });
  }

  return sections;
}

function splitLongText(text: string, maxChars: number) {
  if (text.length <= maxChars) return [text];

  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length > maxChars && current) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);

  return chunks.flatMap(chunk => {
    if (chunk.length <= maxChars) return [chunk];
    const parts: string[] = [];
    for (let index = 0; index < chunk.length; index += maxChars) {
      parts.push(chunk.slice(index, index + maxChars));
    }
    return parts;
  });
}

function scoreChunk(
  chunk: KnowledgeChunkDraft,
  terms: string[],
  scope: SearchOptions["scope"],
  preferredSourceIds?: Set<string>
) {
  const title = chunk.postTitle?.toLowerCase() ?? "";
  const heading = chunk.heading?.toLowerCase() ?? "";
  const taxonomy = [chunk.categorySlug, ...chunk.tagSlugs, ...chunk.keywords]
    .join(" ")
    .toLowerCase();
  const body = `${chunk.content} ${chunk.summary ?? ""}`.toLowerCase();
  let score = 0;

  for (const term of terms) {
    if (title.includes(term)) score += 20;
    if (taxonomy.includes(term)) score += 16;
    if (heading.includes(term)) score += 12;
    if (body.includes(term)) score += 4;
  }

  if (score > 0 && chunk.chunkType === "post_metadata_chunk") score += 2;
  if (score > 0 && chunk.chunkType === "site_overview_chunk") score += 1;
  if (score > 0 && scope?.type === "post" && chunk.postSlug === scope.value)
    score += 30;
  if (preferredSourceIds?.has(buildSourceId(chunk))) score += 8;

  return score;
}

function matchesScope(
  chunk: KnowledgeChunkDraft,
  scope: SearchOptions["scope"],
  restrictToCurrentPost = false
) {
  if (!scope || scope.type === "site") return true;
  if (scope.type === "post") {
    return restrictToCurrentPost ? chunk.postSlug === scope.value : true;
  }
  if (scope.type === "category" || scope.type === "track") {
    return (
      chunk.categorySlug === scope.value ||
      chunk.chunkType === "site_overview_chunk"
    );
  }
  if (scope.type === "tag")
    return (
      chunk.tagSlugs.includes(scope.value ?? "") ||
      chunk.chunkType === "site_overview_chunk"
    );
  return true;
}

function diversifyByPost(results: KnowledgeSearchResult[]) {
  const counts = new Map<string, number>();
  return results.filter(result => {
    const key = result.postSlug ?? "site";
    const count = counts.get(key) ?? 0;
    const perPostLimit = result.relevanceReason.startsWith(
      "Current public article context"
    )
      ? CURRENT_POST_RESULT_LIMIT
      : DEFAULT_POST_RESULT_LIMIT;
    if (key !== "site" && count >= perPostLimit) return false;
    counts.set(key, count + 1);
    return true;
  });
}

function mergeResults(results: KnowledgeSearchResult[]) {
  const bySourceId = new Map<string, KnowledgeSearchResult>();
  for (const result of results) {
    const existing = bySourceId.get(result.sourceId);
    if (
      existing?.relevanceReason.startsWith("Public blog inventory") &&
      result.sourceId === existing.sourceId
    ) {
      continue;
    }
    if (!existing || result.score > existing.score) {
      bySourceId.set(result.sourceId, result);
    }
  }
  return Array.from(bySourceId.values()).sort(
    (a, b) => b.score - a.score || a.chunkIndex - b.chunkIndex
  );
}

function pruneLowConfidenceResults(results: KnowledgeSearchResult[]) {
  const topScore = results[0]?.score ?? 0;
  if (topScore < 40) return results;

  const minimumScore = Math.max(12, topScore * 0.35);
  const pruned = results.filter(
    result =>
      result.score >= minimumScore ||
      result.relevanceReason.startsWith("Current public article context")
  );
  if (
    pruned.some(result =>
      result.relevanceReason.startsWith("Public blog inventory")
    )
  ) {
    return pruned;
  }
  return pruned.some(result => result.postSlug)
    ? pruned.filter(result => result.postSlug)
    : pruned;
}

function buildSiteOverviewContextResults(
  chunks: KnowledgeChunkDraft[],
  query: string,
  analysis: KnowledgeQueryAnalysis,
  scope: SearchOptions["scope"]
): KnowledgeSearchResult[] {
  if (!shouldInjectSiteOverviewContext(query, analysis, scope)) return [];

  const excerptTerms = unique([
    ...analysis.expandedTerms,
    ...PUBLIC_INVENTORY_TERMS,
  ]);
  return chunks
    .filter(
      chunk =>
        chunk.statusSnapshot === "published" &&
        chunk.visibilitySnapshot === "public" &&
        chunk.chunkType === "site_overview_chunk"
    )
    .filter(chunk => matchesScope(chunk, scope, false))
    .slice(0, 1)
    .map(chunk => ({
      ...chunk,
      sourceId: buildSourceId(chunk),
      score: 46,
      excerpt: buildInventoryExcerpt(chunk.content, excerptTerms),
      relevanceReason:
        "Public blog inventory. Matched public article list intent.",
    }));
}

function shouldUseOnlySiteOverviewForInventory(
  analysis: KnowledgeQueryAnalysis
) {
  const inventoryTerms = new Set([
    ...PUBLIC_INVENTORY_TERMS,
    ...PUBLIC_INVENTORY_CJK_TERMS,
  ]);
  return analysis.terms.every(term => inventoryTerms.has(term));
}

function buildInventoryExcerpt(content: string, fallbackTerms: string[]) {
  const compactList = buildCompactPublicPostList(content);
  if (compactList) return compactList;

  const marker = /Public posts:|公开文章目录:/i.exec(content);
  const focused = marker ? content.slice(marker.index) : content;
  const normalized = focused.replace(/\s+/g, " ").trim();
  if (normalized) return normalized.slice(0, 900);
  return buildExcerpt(content, fallbackTerms);
}

function buildCompactPublicPostList(content: string) {
  const lines = content.split(/\r?\n/);
  const startIndex = lines.findIndex(line =>
    /Public posts:|公开文章目录:/i.test(line)
  );
  if (startIndex < 0) return null;

  const postLines: string[] = [];
  for (const line of lines.slice(startIndex + 1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^Tags:/i.test(trimmed)) break;
    if (/^公开文章目录:/i.test(trimmed)) continue;
    if (!trimmed.startsWith("-")) {
      if (postLines.length > 0) break;
      continue;
    }

    const compact = /^-\s+(.+?\([^)]+\)\s+\[[^\]]+\])/.exec(trimmed);
    postLines.push(compact ? `- ${compact[1]}` : trimmed);
  }

  if (postLines.length === 0) return null;
  return ["Public posts:", ...postLines].join("\n");
}

function buildCurrentPostContextResults(
  chunks: KnowledgeChunkDraft[],
  query: string,
  analysis: KnowledgeQueryAnalysis,
  scope: SearchOptions["scope"]
): KnowledgeSearchResult[] {
  if (!shouldInjectCurrentPostContext(query, analysis, scope)) return [];

  return chunks
    .filter(
      chunk =>
        chunk.statusSnapshot === "published" &&
        chunk.visibilitySnapshot === "public" &&
        chunk.chunkType !== "post_metadata_chunk"
    )
    .filter(chunk => chunk.postSlug === scope?.value)
    .sort(
      (a, b) =>
        currentPostContextRank(a, analysis.expandedTerms) -
        currentPostContextRank(b, analysis.expandedTerms)
    )
    .slice(0, CURRENT_POST_CONTEXT_LIMIT)
    .map((chunk, index) => ({
      ...chunk,
      sourceId: buildSourceId(chunk),
      score: 34 - index,
      excerpt: buildExcerpt(chunk.content, analysis.expandedTerms),
      relevanceReason: appendCurrentPostReason(
        "Metadata and opening sections are included."
      ),
    }));
}

function currentPostContextRank(chunk: KnowledgeChunkDraft, terms: string[]) {
  const score = scoreChunk(chunk, terms, {
    type: "post",
    value: chunk.postSlug ?? "",
  });
  return -score * 100 + chunk.chunkIndex;
}

function shouldInjectCurrentPostContext(
  query: string,
  analysis: KnowledgeQueryAnalysis,
  scope: SearchOptions["scope"]
) {
  if (scope?.type !== "post" || !scope.value) return false;
  if (analysis.isIsoStandardQuery) return false;
  if (CLEARLY_EXTERNAL_QUERY_PATTERN.test(query)) return false;
  if (UNAVAILABLE_CONTENT_QUERY_PATTERN.test(query)) return false;
  return true;
}

function shouldRestrictToCurrentPost(
  query: string,
  analysis: KnowledgeQueryAnalysis,
  scope: SearchOptions["scope"]
) {
  if (scope?.type !== "post" || !scope.value) return false;
  if (analysis.isIsoStandardQuery) return false;
  if (CLEARLY_EXTERNAL_QUERY_PATTERN.test(query)) return false;
  if (UNAVAILABLE_CONTENT_QUERY_PATTERN.test(query)) return false;
  if (
    /\b(find|related|compare|recommend|next)\b|找|哪篇|相关文章|比较|对比|推荐|下一篇|阅读路径/i.test(
      query
    )
  ) {
    return false;
  }
  return /这篇|本文|这里|这页|页面|文中|上面|前面|后半|当前|this article|this page|here/i.test(
    query
  );
}

function shouldInjectSiteOverviewContext(
  query: string,
  analysis: KnowledgeQueryAnalysis,
  scope: SearchOptions["scope"]
) {
  if (analysis.isIsoStandardQuery) return false;
  if (CLEARLY_EXTERNAL_QUERY_PATTERN.test(query)) return false;
  if (UNAVAILABLE_CONTENT_QUERY_PATTERN.test(query)) return false;
  if (
    scope?.type === "post" &&
    shouldRestrictToCurrentPost(query, analysis, scope)
  ) {
    return false;
  }
  return PUBLIC_INVENTORY_QUERY_PATTERN.test(analysis.normalizedQuery);
}

function markCurrentPostResult(
  result: KnowledgeSearchResult,
  scope: SearchOptions["scope"]
): KnowledgeSearchResult {
  if (scope?.type !== "post" || result.postSlug !== scope.value) return result;
  return {
    ...result,
    relevanceReason: appendCurrentPostReason(result.relevanceReason),
  };
}

function appendCurrentPostReason(reason: string) {
  return reason.startsWith("Current public article context")
    ? reason
    : `Current public article context. ${reason}`;
}

function buildSourceId(chunk: KnowledgeChunkDraft) {
  return chunk.postSlug
    ? `${chunk.postSlug}:${chunk.chunkIndex}`
    : `${chunk.chunkType}:${chunk.chunkIndex}`;
}

function buildExcerpt(content: string, terms: string[]) {
  const normalized = content.replace(/\s+/g, " ").trim();
  const lower = normalized.toLowerCase();
  const firstIndex =
    terms
      .map(term => lower.indexOf(term))
      .filter(index => index >= 0)
      .sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, firstIndex - 80);
  return normalized.slice(start, start + 260);
}

function buildRelevanceReason(chunk: KnowledgeChunkDraft, terms: string[]) {
  const matched = terms.filter(term =>
    `${chunk.postTitle ?? ""} ${chunk.heading ?? ""} ${chunk.categorySlug ?? ""} ${chunk.tagSlugs.join(" ")} ${chunk.content}`
      .toLowerCase()
      .includes(term)
  );
  return matched.length > 0
    ? `Matched: ${matched.slice(0, 4).join(", ")}`
    : "Matched public blog context";
}

function buildSummary(content: string) {
  return content.replace(/\s+/g, " ").trim().slice(0, 240);
}

function hashContent(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function estimateTokens(content: string) {
  return Math.ceil(content.trim().length / 4);
}

function normalizeKnowledgeQuery(input: string) {
  return input
    .normalize("NFKC")
    .replace(/([\u4e00-\u9fff])([a-z0-9])/gi, "$1 $2")
    .replace(/([a-z0-9])([\u4e00-\u9fff])/gi, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenize(input: string, options: { suppressIso?: boolean } = {}) {
  const normalized = normalizeKnowledgeQuery(input);
  const asciiTerms = normalized.match(/[a-z0-9][a-z0-9-]*/gi) ?? [];
  const cjkTerms = KNOWN_CJK_QUERY_TERMS.filter(term =>
    normalized.includes(term)
  );

  return unique(
    [...asciiTerms, ...cjkTerms]
      .map(term => term.trim())
      .filter(term => term.length >= 2)
      .filter(term => !(options.suppressIso && term === "iso"))
      .filter(term => !QUERY_STOPWORDS.has(term))
  );
}

function expandQueryTerms(
  terms: string[],
  options: { isIsoStandardQuery?: boolean } = {}
) {
  const aliases: Record<string, string[]> = {
    agent: ["harness", "tool", "trace", "evaluator", "context", "loop"],
    agents: ["harness", "tool", "trace", "evaluator", "context", "loop"],
    agentloop: ["agent", "loop", "runtime", "trace"],
    iso: ["isohc", "residual", "stability", "orthogonal", "isometric"],
    react: ["agent", "loop", "tool", "observation"],
    rag: ["evidence", "packet", "retrieval", "context"],
    retrieval: ["evidence", "source", "context"],
    long: ["context", "rope", "position", "sequence"],
    isohc: ["residual", "stability", "orthogonal", "isometric", "invariants"],
    rope: ["position", "frequency", "long", "context"],
    ffn: [
      "feed-forward",
      "feedforward",
      "gated",
      "swiglu",
      "geglu",
      "glu",
      "mlp",
      "channel",
      "mixing",
    ],
    "feed-forward": ["ffn", "feedforward", "gated", "mlp", "transformer"],
    feedforward: ["ffn", "feed-forward", "gated", "mlp", "transformer"],
    swiglu: ["gated", "ffn", "glu", "mlp", "silu", "swish"],
    geglu: ["gated", "ffn", "glu", "mlp", "gelu"],
    glu: ["gated", "ffn", "swiglu", "geglu", "gate"],
    mlp: ["ffn", "feed-forward", "gated", "channel", "mixing"],
    残差: ["residual", "mixing", "stability", "isohc"],
    稳定性: ["stability", "residual", "isohc"],
    不变量: ["invariant", "invariants", "mean", "energy", "isohc"],
    正交: ["orthogonal", "isometric", "isohc"],
    智能体: ["agent", "agents"],
    检索: ["retrieval", "rag", "evidence", "source", "context"],
    证据包: ["evidence", "packet", "rag", "context"],
    证据: ["evidence", "packet", "rag", "source"],
    循环: ["loop", "agentloop", "runtime"],
    运行时: ["runtime", "agentloop", "trace", "state"],
    评测: ["evaluation", "evaluator", "harness", "trace"],
    工具: ["tool", "tools", "tool-use", "harness"],
    上下文: ["context", "context-engineering", "rag"],
    公开文章: PUBLIC_INVENTORY_TERMS,
    公开笔记: PUBLIC_INVENTORY_TERMS,
    都有哪些: PUBLIC_INVENTORY_TERMS,
    有哪些: PUBLIC_INVENTORY_TERMS,
    哪几篇: PUBLIC_INVENTORY_TERMS,
    几篇: PUBLIC_INVENTORY_TERMS,
    文章目录: PUBLIC_INVENTORY_TERMS,
    文章列表: PUBLIC_INVENTORY_TERMS,
    博客目录: PUBLIC_INVENTORY_TERMS,
    站内文章: PUBLIC_INVENTORY_TERMS,
    目录: PUBLIC_INVENTORY_TERMS,
    列表: PUBLIC_INVENTORY_TERMS,
    posts: PUBLIC_INVENTORY_TERMS,
    post: PUBLIC_INVENTORY_TERMS,
    articles: PUBLIC_INVENTORY_TERMS,
    article: PUBLIC_INVENTORY_TERMS,
    notes: PUBLIC_INVENTORY_TERMS,
    note: PUBLIC_INVENTORY_TERMS,
    catalog: PUBLIC_INVENTORY_TERMS,
    index: PUBLIC_INVENTORY_TERMS,
    核心抽象: [
      "core",
      "abstraction",
      "constraint",
      "invariant",
      "invariants",
      "isometry",
      "orthogonal",
      "mechanism",
    ],
    核心主张: [
      "core",
      "claim",
      "constraint",
      "invariant",
      "isometry",
      "mechanism",
    ],
    核心: ["core", "claim", "constraint", "invariant", "mechanism"],
    抽象: ["abstraction", "constraint", "invariant", "isometry", "mechanism"],
    主张: ["claim", "takeaway", "constraint", "evidence", "framing"],
    长上下文: ["long", "context", "rope", "position"],
    位置编码: ["position", "encoding", "rope"],
    阅读路径: ["reading", "path", "map", "overview"],
    固定向量: [
      "fixed-vector",
      "fixed",
      "vector",
      "e0",
      "mean",
      "direction",
      "complement",
      "orthogonal",
    ],
    等距: ["isometry", "isometric", "orthogonal", "energy", "isohc"],
    双随机: ["doubly", "stochastic", "mean", "non-expansive", "diffusive"],
    约束: ["constraint", "constrained", "orthogonal", "stochastic"],
    均值: ["mean", "average", "stream", "direction"],
    能量: ["energy", "frobenius", "norm", "isometry"],
    投影: ["projection", "polar", "retraction", "orthogonal"],
    梯度: ["gradient", "backpropagation", "backward", "energy"],
    门控: ["gated", "gate", "ffn", "swiglu", "geglu", "glu"],
    门控ffn: ["gated", "ffn", "swiglu", "geglu", "glu", "mlp"],
    普通ffn: ["vanilla", "ffn", "feed-forward", "mlp", "gated"],
    前馈: ["feed-forward", "feedforward", "ffn", "mlp"],
    通道: ["channel", "mixing", "ffn", "mlp"],
    通道混合: ["channel", "mixing", "ffn", "mlp"],
    乘法: ["multiplicative", "multiply", "gated", "ffn", "swiglu"],
    激活函数: ["activation", "gelu", "silu", "swish", "swiglu", "geglu"],
    精度: ["precision", "dtype", "diagnostic", "engineering"],
    实现: ["implementation", "mapping", "repository", "projection", "module"],
    后半部分: [
      "implementation",
      "precision",
      "evidence",
      "framing",
      "takeaway",
    ],
    后半: ["implementation", "precision", "evidence", "framing", "takeaway"],
    失败: ["failure", "boundary", "evidence", "limitations", "framing"],
    边界: ["boundary", "limits", "evidence", "framing"],
    章节: ["heading", "section", "overview"],
    部分: ["section", "heading", "overview"],
  };
  const aliasExpansions: KnowledgeQueryAnalysis["aliasExpansions"] = [];
  const blockedAliases: string[] = [];
  const expandedTerms = unique(
    terms.flatMap(term => {
      if (term === "iso" && options.isIsoStandardQuery) {
        blockedAliases.push("iso");
        return [term];
      }
      const expansions = aliases[term] ?? [];
      if (expansions.length > 0) aliasExpansions.push({ term, expansions });
      return [term, ...expansions];
    })
  );

  return { expandedTerms, aliasExpansions, blockedAliases };
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
