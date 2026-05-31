import { and, eq } from "drizzle-orm";
import { aiKnowledgeChunks } from "../../drizzle/schema.js";
import { getDb, getPostsCount, getPublicDiscoveryPosts } from "../db.js";
import {
  buildPublicKnowledgeChunks,
  searchPublicKnowledgeChunks,
  type KnowledgeChunkDraft,
  type KnowledgeSearchResult,
} from "./knowledge.js";
import type { AgentKnowledgeIndexStatusOutput } from "./types.js";

export type KnowledgeReindexResult = {
  created: number;
  deleted: number;
  skipped: number;
};

export async function reindexPublicKnowledgeChunks(): Promise<KnowledgeReindexResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const publicPosts = await getPublicDiscoveryPosts();
  const chunks = buildPublicKnowledgeChunks(publicPosts);

  return await db.transaction(async (tx) => {
    const deletedRows = await tx
      .delete(aiKnowledgeChunks)
      .returning({ id: aiKnowledgeChunks.id });

    if (chunks.length > 0) {
      await tx.insert(aiKnowledgeChunks).values(chunks.map(toInsertValue));
    }

    return {
      created: chunks.length,
      deleted: deletedRows.length,
      skipped: 0,
    };
  });
}

export async function searchPublicKnowledgeChunkSources(params: {
  query: string;
  limit?: number;
  scope?: {
    type: "site" | "post" | "category" | "tag" | "track";
    value?: string;
  };
}): Promise<KnowledgeSearchResult[]> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(aiKnowledgeChunks)
    .where(
      and(
        eq(aiKnowledgeChunks.statusSnapshot, "published"),
        eq(aiKnowledgeChunks.visibilitySnapshot, "public")
      )
    );

  return searchPublicKnowledgeChunks(rows.map(fromRow), params.query, {
    limit: params.limit,
    scope: params.scope,
  });
}

export async function getKnowledgeIndexStatus(): Promise<AgentKnowledgeIndexStatusOutput> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [publicPosts, totalPostCount, rows] = await Promise.all([
    getPublicDiscoveryPosts(),
    getPostsCount({}),
    db.select().from(aiKnowledgeChunks),
  ]);

  const publicPostSlugs = new Set(publicPosts.map((post) => post.slug));
  const publicRows = rows.filter(
    (row) =>
      row.statusSnapshot === "published" &&
      row.visibilitySnapshot === "public"
  );
  const indexedPostSlugs = Array.from(
    new Set(publicRows.map((row) => row.postSlug).filter((slug): slug is string => Boolean(slug)))
  ).sort();
  const indexedPostSlugSet = new Set(indexedPostSlugs);
  const lastReindexAt = rows.reduce<Date | null>((latest, row) => {
    const value = row.updatedAt ?? row.createdAt;
    if (!value) return latest;
    if (!latest || value > latest) return value;
    return latest;
  }, null);

  return {
    chunkCount: publicRows.length,
    publicPostCount: publicPosts.length,
    indexedPublicPostCount: indexedPostSlugs.filter((slug) => publicPostSlugs.has(slug)).length,
    hiddenOrDraftExcludedCount: Math.max(0, totalPostCount - publicPosts.length),
    lastReindexAt,
    latestReindexError: null,
    reindexCommand: "pnpm ai:reindex",
    publishCommand: "pnpm content:publish",
    stalePublicPostSlugs: publicPosts
      .map((post) => post.slug)
      .filter((slug) => !indexedPostSlugSet.has(slug))
      .sort(),
    extraIndexedPostSlugs: indexedPostSlugs
      .filter((slug) => !publicPostSlugs.has(slug))
      .sort(),
    indexedPostSlugs,
  };
}

function toInsertValue(chunk: KnowledgeChunkDraft): typeof aiKnowledgeChunks.$inferInsert {
  return {
    chunkType: chunk.chunkType,
    postId: chunk.postId,
    postSlug: chunk.postSlug,
    postTitle: chunk.postTitle,
    categorySlug: chunk.categorySlug,
    tagSlugs: chunk.tagSlugs,
    statusSnapshot: chunk.statusSnapshot,
    visibilitySnapshot: chunk.visibilitySnapshot,
    locale: chunk.locale,
    chunkIndex: chunk.chunkIndex,
    heading: chunk.heading,
    sectionPath: chunk.sectionPath,
    content: chunk.content,
    summary: chunk.summary,
    keywords: chunk.keywords,
    contentHash: chunk.contentHash,
    tokenEstimate: chunk.tokenEstimate,
    updatedAt: new Date(),
  };
}

function fromRow(row: typeof aiKnowledgeChunks.$inferSelect): KnowledgeChunkDraft {
  return {
    chunkType: row.chunkType,
    postId: row.postId,
    postSlug: row.postSlug,
    postTitle: row.postTitle,
    categorySlug: row.categorySlug,
    tagSlugs: row.tagSlugs,
    statusSnapshot: row.statusSnapshot,
    visibilitySnapshot: row.visibilitySnapshot,
    locale: row.locale,
    chunkIndex: row.chunkIndex,
    heading: row.heading,
    sectionPath: row.sectionPath,
    content: row.content,
    summary: row.summary,
    keywords: row.keywords,
    contentHash: row.contentHash,
    tokenEstimate: row.tokenEstimate,
  };
}
