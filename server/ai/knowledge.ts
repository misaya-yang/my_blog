import { createHash } from "node:crypto";

export type KnowledgeChunkType = "post_chunk" | "post_metadata_chunk" | "site_overview_chunk";
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
};

const DEFAULT_LOCALE = "en";
const MAX_CHUNK_CHARS = 1800;

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
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const scope = options.scope;
  const results = chunks
    .filter((chunk) => chunk.statusSnapshot === "published" && chunk.visibilitySnapshot === "public")
    .filter((chunk) => matchesScope(chunk, scope))
    .map((chunk) => {
      const score = scoreChunk(chunk, terms, scope);
      return {
        ...chunk,
        sourceId: buildSourceId(chunk),
        score,
        excerpt: buildExcerpt(chunk.content, terms),
        relevanceReason: buildRelevanceReason(chunk, terms),
      };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score || a.chunkIndex - b.chunkIndex);

  return diversifyByPost(results).slice(0, options.limit ?? 8);
}

function buildSiteOverviewChunk(
  publicPosts: KnowledgePostInput[],
  locale: string
): KnowledgeChunkDraft | null {
  if (publicPosts.length === 0) return null;

  const categories = unique(
    publicPosts
      .map((post) => post.category?.slug)
      .filter((slug): slug is string => Boolean(slug))
  );
  const tags = unique(publicPosts.flatMap((post) => (post.tags ?? []).map((tag) => tag.slug)));
  const lines = [
    "Public blog knowledge map.",
    `Tracks and categories: ${categories.join(", ") || "uncategorized"}.`,
    `Tags: ${tags.join(", ") || "none"}.`,
    "Public posts:",
    ...publicPosts.map((post) => {
      const tagText = (post.tags ?? []).map((tag) => tag.slug).join(", ");
      return `- ${post.title} (${post.slug}) [${post.category?.slug ?? "uncategorized"}] ${tagText}`;
    }),
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
    keywords: unique(["blog", "map", "overview", ...categories, ...tags]),
  });
}

function buildMetadataChunk(post: KnowledgePostInput, locale: string): KnowledgeChunkDraft {
  const tagSlugs = (post.tags ?? []).map((tag) => tag.slug);
  const content = [
    `Title: ${post.title}`,
    `Slug: ${post.slug}`,
    `Category: ${post.category?.slug ?? "uncategorized"}`,
    tagSlugs.length > 0 ? `Tags: ${tagSlugs.join(", ")}` : "Tags: none",
    post.excerpt ? `Excerpt: ${post.excerpt}` : null,
  ].filter(Boolean).join("\n");

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
      ...(post.tags ?? []).flatMap((tag) => [tag.slug, tag.name]),
    ]),
  });
}

function buildPostBodyChunks(post: KnowledgePostInput, locale: string): KnowledgeChunkDraft[] {
  const sections = splitMarkdownSections(post.content);
  const tagSlugs = (post.tags ?? []).map((tag) => tag.slug);
  const chunks: KnowledgeChunkDraft[] = [];
  let chunkIndex = 1;

  for (const section of sections) {
    for (const content of splitLongText(section.content, MAX_CHUNK_CHARS)) {
      const trimmed = content.trim();
      if (!trimmed) continue;
      chunks.push(makeChunk({
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
      }));
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

  return chunks.flatMap((chunk) => {
    if (chunk.length <= maxChars) return [chunk];
    const parts: string[] = [];
    for (let index = 0; index < chunk.length; index += maxChars) {
      parts.push(chunk.slice(index, index + maxChars));
    }
    return parts;
  });
}

function scoreChunk(chunk: KnowledgeChunkDraft, terms: string[], scope: SearchOptions["scope"]) {
  const title = chunk.postTitle?.toLowerCase() ?? "";
  const heading = chunk.heading?.toLowerCase() ?? "";
  const taxonomy = [chunk.categorySlug, ...chunk.tagSlugs, ...chunk.keywords].join(" ").toLowerCase();
  const body = `${chunk.content} ${chunk.summary ?? ""}`.toLowerCase();
  let score = 0;

  for (const term of terms) {
    if (title.includes(term)) score += 20;
    if (taxonomy.includes(term)) score += 16;
    if (heading.includes(term)) score += 12;
    if (body.includes(term)) score += 4;
  }

  if (chunk.chunkType === "post_metadata_chunk") score += 2;
  if (chunk.chunkType === "site_overview_chunk") score += 1;
  if (scope?.type === "post" && chunk.postSlug === scope.value) score += 30;

  return score;
}

function matchesScope(chunk: KnowledgeChunkDraft, scope: SearchOptions["scope"]) {
  if (!scope || scope.type === "site") return true;
  if (scope.type === "post") return chunk.postSlug === scope.value || chunk.chunkType === "site_overview_chunk";
  if (scope.type === "category" || scope.type === "track") {
    return chunk.categorySlug === scope.value || chunk.chunkType === "site_overview_chunk";
  }
  if (scope.type === "tag") return chunk.tagSlugs.includes(scope.value ?? "") || chunk.chunkType === "site_overview_chunk";
  return true;
}

function diversifyByPost(results: KnowledgeSearchResult[]) {
  const counts = new Map<string, number>();
  return results.filter((result) => {
    const key = result.postSlug ?? "site";
    const count = counts.get(key) ?? 0;
    if (key !== "site" && count >= 2) return false;
    counts.set(key, count + 1);
    return true;
  });
}

function buildSourceId(chunk: KnowledgeChunkDraft) {
  return chunk.postSlug
    ? `${chunk.postSlug}:${chunk.chunkIndex}`
    : `${chunk.chunkType}:${chunk.chunkIndex}`;
}

function buildExcerpt(content: string, terms: string[]) {
  const normalized = content.replace(/\s+/g, " ").trim();
  const lower = normalized.toLowerCase();
  const firstIndex = terms
    .map((term) => lower.indexOf(term))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, firstIndex - 80);
  return normalized.slice(start, start + 260);
}

function buildRelevanceReason(chunk: KnowledgeChunkDraft, terms: string[]) {
  const matched = terms.filter((term) =>
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

function tokenize(input: string) {
  return unique(
    input
      .toLowerCase()
      .split(/[^a-z0-9\u4e00-\u9fff-]+/i)
      .map((term) => term.trim())
      .filter((term) => term.length >= 2)
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
