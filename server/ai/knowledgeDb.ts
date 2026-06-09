import { and, eq, sql } from "drizzle-orm";
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

type IndexedKnowledgeChunkSnapshot = Pick<
  typeof aiKnowledgeChunks.$inferSelect,
  "postSlug" | "chunkIndex" | "chunkType" | "contentHash"
>;

let latestReindexError: string | null = null;

export async function reindexPublicKnowledgeChunks(): Promise<KnowledgeReindexResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const publicPosts = await getPublicDiscoveryPosts();
  const chunks = buildPublicKnowledgeChunks(publicPosts);

  const result = await db.transaction(async tx => {
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
  latestReindexError = null;
  return result;
}

export function recordKnowledgeReindexFailure(error: unknown) {
  latestReindexError =
    error instanceof Error ? error.message : "Unknown reindex failure";
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
  const preferredSourceIds = await selectFullTextPreferredSourceIds(
    params.query
  );

  return searchPublicKnowledgeChunks(rows.map(fromRow), params.query, {
    limit: params.limit,
    scope: params.scope,
    preferredSourceIds,
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

  const publicPostSlugs = new Set(publicPosts.map(post => post.slug));
  const publicRows = rows.filter(
    row =>
      row.statusSnapshot === "published" && row.visibilitySnapshot === "public"
  );
  const expectedChunks = buildPublicKnowledgeChunks(publicPosts);
  const stalePublicPostSlugs = getStalePublicPostSlugs({
    expectedChunks,
    publicRows,
    publicPostSlugs,
  });
  const indexedPostSlugs = Array.from(
    new Set(
      publicRows
        .map(row => row.postSlug)
        .filter((slug): slug is string => Boolean(slug))
    )
  ).sort();
  const lastReindexAt = rows.reduce<Date | null>((latest, row) => {
    const value = row.updatedAt ?? row.createdAt;
    if (!value) return latest;
    if (!latest || value > latest) return value;
    return latest;
  }, null);

  return {
    chunkCount: publicRows.length,
    publicPostCount: publicPosts.length,
    indexedPublicPostCount: indexedPostSlugs.filter(slug =>
      publicPostSlugs.has(slug)
    ).length,
    hiddenOrDraftExcludedCount: Math.max(
      0,
      totalPostCount - publicPosts.length
    ),
    lastReindexAt,
    latestReindexError,
    reindexCommand: "pnpm ai:reindex",
    publishCommand: "pnpm content:publish",
    stalePublicPostSlugs,
    extraIndexedPostSlugs: indexedPostSlugs
      .filter(slug => !publicPostSlugs.has(slug))
      .sort(),
    indexedPostSlugs,
  };
}

export function getStalePublicPostSlugs(input: {
  expectedChunks: KnowledgeChunkDraft[];
  publicRows: IndexedKnowledgeChunkSnapshot[];
  publicPostSlugs: Set<string>;
}): string[] {
  const expectedHashBySourceId = new Map(
    input.expectedChunks.map(chunk => [
      buildChunkSourceId(chunk),
      chunk.contentHash,
    ])
  );
  const indexedHashBySourceId = new Map(
    input.publicRows.map(row => [buildRowSourceId(row), row.contentHash])
  );
  const staleSlugs = new Set<string>();

  for (const chunk of input.expectedChunks) {
    if (!chunk.postSlug) continue;
    const indexedHash = indexedHashBySourceId.get(buildChunkSourceId(chunk));

    if (indexedHash !== chunk.contentHash) {
      staleSlugs.add(chunk.postSlug);
    }
  }

  for (const row of input.publicRows) {
    if (!row.postSlug || !input.publicPostSlugs.has(row.postSlug)) continue;
    if (!expectedHashBySourceId.has(buildRowSourceId(row))) {
      staleSlugs.add(row.postSlug);
    }
  }

  return Array.from(staleSlugs).sort();
}

function buildChunkSourceId(chunk: KnowledgeChunkDraft) {
  return chunk.postSlug
    ? `${chunk.postSlug}:${chunk.chunkIndex}`
    : `${chunk.chunkType}:${chunk.chunkIndex}`;
}

function buildRowSourceId(row: IndexedKnowledgeChunkSnapshot) {
  return row.postSlug
    ? `${row.postSlug}:${row.chunkIndex}`
    : `${row.chunkType}:${row.chunkIndex}`;
}

function toInsertValue(
  chunk: KnowledgeChunkDraft
): typeof aiKnowledgeChunks.$inferInsert {
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

function fromRow(
  row: typeof aiKnowledgeChunks.$inferSelect
): KnowledgeChunkDraft {
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

async function selectFullTextPreferredSourceIds(query: string) {
  if (!/[a-z0-9]{2,}/i.test(query)) return new Set<string>();

  try {
    const db = await getDb();
    if (!db) return new Set<string>();
    const document = sql`to_tsvector('english', coalesce(${aiKnowledgeChunks.content}, '') || ' ' || coalesce(${aiKnowledgeChunks.summary}, '') || ' ' || coalesce(${aiKnowledgeChunks.postTitle}, ''))`;
    const tsQuery = sql`websearch_to_tsquery('english', ${query})`;
    const rows = await db
      .select({
        chunkType: aiKnowledgeChunks.chunkType,
        postSlug: aiKnowledgeChunks.postSlug,
        chunkIndex: aiKnowledgeChunks.chunkIndex,
      })
      .from(aiKnowledgeChunks)
      .where(
        and(
          eq(aiKnowledgeChunks.statusSnapshot, "published"),
          eq(aiKnowledgeChunks.visibilitySnapshot, "public"),
          sql`${document} @@ ${tsQuery}`
        )
      )
      .orderBy(sql`ts_rank_cd(${document}, ${tsQuery}) desc`)
      .limit(32);

    return new Set(
      rows.map(row =>
        row.postSlug
          ? `${row.postSlug}:${row.chunkIndex}`
          : `${row.chunkType}:${row.chunkIndex}`
      )
    );
  } catch {
    return new Set<string>();
  }
}
