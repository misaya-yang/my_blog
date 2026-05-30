import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  categories, 
  Category, 
  InsertCategory, 
  InsertPost, 
  InsertPostFeedback,
  InsertPostTag, 
  InsertPostVersion, 
  InsertSubscriber,
  InsertTag, 
  InsertUser,
  Post, 
  postFeedback,
  postTags, 
  postVersions, 
  posts, 
  Subscriber,
  subscribers,
  Tag,
  tags,
  users 
} from "../drizzle/schema.js";
import { ENV } from './_core/env.js';
import {
  estimateReadingMinutes,
  filterPostsByCategory,
  filterPostsByTag,
  getAdjacentPosts,
  groupArchivePosts,
  rankRelatedPosts,
  searchDiscoveryPosts,
  type DiscoveryPost,
} from "./discovery.js";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

type BlogDb = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type WriteDb = Pick<BlogDb, "delete" | "insert" | "update">;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      _client = postgres(ENV.databaseUrl, {
        max: 5,
        prepare: false,
      });
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _client = null;
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Posts ============
export async function createPost(post: InsertPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(posts).values(post).returning({ id: posts.id });
  return result[0].id;
}

export async function createPostWithTags(post: InsertPost, tagIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.transaction(async (tx) => {
    const postId = await insertPost(tx, post);
    await replacePostTags(tx, postId, tagIds);
    return postId;
  });
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return result[0] || null;
}

export async function getPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
  return result[0] || null;
}

export async function updatePost(id: number, post: Partial<InsertPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(posts).set(post).where(eq(posts.id, id));
}

export async function updatePostWithTags(
  id: number,
  post: Partial<InsertPost>,
  tagIds?: number[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.transaction(async (tx) => {
    await tx.update(posts).set(post).where(eq(posts.id, id));
    if (tagIds !== undefined) {
      await replacePostTags(tx, id, tagIds);
    }
  });
}

export async function deletePost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(posts).where(eq(posts.id, id));
}

export async function deletePostCascade(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.transaction(async (tx) => {
    await tx.delete(postTags).where(eq(postTags.postId, id));
    await tx.delete(postVersions).where(eq(postVersions.postId, id));
    await tx.delete(posts).where(eq(posts.id, id));
  });
}

export async function getPosts(params: {
  status?: "draft" | "published";
  visibility?: "hidden" | "admin" | "public";
  categorySlug?: string;
  categoryId?: number;
  authorId?: number;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: "createdAt" | "publishedAt" | "viewCount" | "featured";
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(posts);

  const conditions = [];
  if (params.status) conditions.push(eq(posts.status, params.status));
  if (params.visibility) conditions.push(eq(posts.visibility, params.visibility));
  if (params.categorySlug) {
    conditions.push(sql`${posts.categoryId} = (
      SELECT ${categories.id}
      FROM ${categories}
      WHERE ${categories.slug} = ${params.categorySlug}
      LIMIT 1
    )`);
  }
  if (params.categoryId) conditions.push(eq(posts.categoryId, params.categoryId));
  if (params.authorId) conditions.push(eq(posts.authorId, params.authorId));
  if (params.search) {
    conditions.push(
      or(
        like(posts.title, `%${params.search}%`),
        like(posts.content, `%${params.search}%`)
      )
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  // Order by
  if (params.orderBy === "featured") {
    query = query.orderBy(posts.featuredRank, desc(posts.publishedAt), posts.title) as typeof query;
  } else if (params.orderBy === "publishedAt") {
    query = query.orderBy(desc(posts.publishedAt)) as typeof query;
  } else if (params.orderBy === "viewCount") {
    query = query.orderBy(desc(posts.viewCount)) as typeof query;
  } else {
    query = query.orderBy(desc(posts.createdAt)) as typeof query;
  }

  if (params.limit) {
    query = query.limit(params.limit) as typeof query;
  }
  if (params.offset) {
    query = query.offset(params.offset) as typeof query;
  }

  return await attachPostTaxonomy(await query);
}

export async function incrementViewCount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(posts).set({ viewCount: sql`${posts.viewCount} + 1` }).where(eq(posts.id, id));
}

export async function getPostsCount(params: {
  status?: "draft" | "published";
  visibility?: "hidden" | "admin" | "public";
  categorySlug?: string;
  categoryId?: number;
  authorId?: number;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return 0;

  const conditions = [];
  if (params.status) conditions.push(eq(posts.status, params.status));
  if (params.visibility) conditions.push(eq(posts.visibility, params.visibility));
  if (params.categorySlug) {
    conditions.push(sql`${posts.categoryId} = (
      SELECT ${categories.id}
      FROM ${categories}
      WHERE ${categories.slug} = ${params.categorySlug}
      LIMIT 1
    )`);
  }
  if (params.categoryId) conditions.push(eq(posts.categoryId, params.categoryId));
  if (params.authorId) conditions.push(eq(posts.authorId, params.authorId));
  if (params.search) {
    conditions.push(
      or(
        like(posts.title, `%${params.search}%`),
        like(posts.content, `%${params.search}%`)
      )
    );
  }

  let query = db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(posts);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  const result = await query;
  return result[0]?.count || 0;
}

export async function getPublicDiscoveryPosts(): Promise<DiscoveryPost[]> {
  const db = await getDb();
  if (!db) return [];

  const publicPosts = await db
    .select()
    .from(posts)
    .where(and(eq(posts.status, "published"), eq(posts.visibility, "public")))
    .orderBy(desc(posts.publishedAt));

  return await attachPostTaxonomy(publicPosts);
}

export async function searchPublicPosts(params: {
  query: string;
  limit?: number;
  offset?: number;
}) {
  const publicPosts = await getPublicDiscoveryPosts();
  return searchDiscoveryPosts(publicPosts, params.query, {
    limit: params.limit,
    offset: params.offset,
  });
}

export async function getPublicTagPage(
  slug: string,
  pagination: { limit?: number; offset?: number } = {}
) {
  const tag = await getTagBySlug(slug);
  if (!tag) return null;

  const publicPosts = await getPublicDiscoveryPosts();
  const matchingPosts = filterPostsByTag(publicPosts, slug);
  const offset = Math.max(0, pagination.offset ?? 0);
  const limit = Math.min(Math.max(1, pagination.limit ?? 20), 50);

  return {
    tag,
    posts: matchingPosts.slice(offset, offset + limit),
    total: matchingPosts.length,
    siblingTags: collectSiblingTags(matchingPosts, slug),
  };
}

export async function getPublicCategoryPage(
  slug: string,
  pagination: { limit?: number; offset?: number } = {}
) {
  const category = await getCategoryBySlug(slug);
  if (!category) return null;

  const publicPosts = await getPublicDiscoveryPosts();
  const matchingPosts = filterPostsByCategory(publicPosts, slug);
  const offset = Math.max(0, pagination.offset ?? 0);
  const limit = Math.min(Math.max(1, pagination.limit ?? 20), 50);

  return {
    category,
    posts: matchingPosts.slice(offset, offset + limit),
    total: matchingPosts.length,
    siblingTags: collectSiblingTags(matchingPosts),
  };
}

export async function getPublicArchive() {
  const publicPosts = await getPublicDiscoveryPosts();
  return groupArchivePosts(publicPosts);
}

export async function getPublicPostContext(slug: string) {
  const publicPosts = await getPublicDiscoveryPosts();
  const current = publicPosts.find((post) => post.slug === slug);
  if (!current) return null;

  return {
    ...getAdjacentPosts(current, publicPosts),
    related: rankRelatedPosts(current, publicPosts, 4),
  };
}

// ============ Reader Engagement ============
export async function upsertSubscriber(
  input: Pick<InsertSubscriber, "email" | "preferredLanguage" | "interests" | "source">
): Promise<{ subscriber: Subscriber; created: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, input.email))
    .limit(1);

  if (existing[0]) {
    const result = await db
      .update(subscribers)
      .set({
        preferredLanguage: input.preferredLanguage ?? null,
        interests: input.interests ?? null,
        source: input.source ?? null,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(subscribers.email, input.email))
      .returning();
    return { subscriber: result[0], created: false };
  }

  const result = await db
    .insert(subscribers)
    .values({
      email: input.email,
      preferredLanguage: input.preferredLanguage ?? null,
      interests: input.interests ?? null,
      source: input.source ?? null,
    })
    .returning();
  return { subscriber: result[0], created: true };
}

export async function createPostFeedback(input: InsertPostFeedback) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(postFeedback).values(input).returning();
  return result[0];
}

export async function listPostFeedback(params: {
  postId?: number;
  status?: "new" | "reviewed" | "hidden";
  limit?: number;
} = {}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (params.postId) conditions.push(eq(postFeedback.postId, params.postId));
  if (params.status) conditions.push(eq(postFeedback.status, params.status));

  let query = db
    .select({
      id: postFeedback.id,
      postId: postFeedback.postId,
      postTitle: posts.title,
      postSlug: posts.slug,
      visitorId: postFeedback.visitorId,
      visitorName: postFeedback.visitorName,
      type: postFeedback.type,
      message: postFeedback.message,
      replyEmail: postFeedback.replyEmail,
      status: postFeedback.status,
      source: postFeedback.source,
      userAgent: postFeedback.userAgent,
      createdAt: postFeedback.createdAt,
      reviewedAt: postFeedback.reviewedAt,
    })
    .from(postFeedback)
    .leftJoin(posts, eq(postFeedback.postId, posts.id));

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return await query
    .orderBy(desc(postFeedback.createdAt))
    .limit(Math.min(Math.max(params.limit ?? 20, 1), 100));
}

export async function markPostFeedbackReviewed(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(postFeedback)
    .set({
      status: "reviewed",
      reviewedAt: new Date(),
    })
    .where(eq(postFeedback.id, id))
    .returning();
  return result[0] ?? null;
}

export async function listSubscribers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
}

// ============ Categories ============
export async function createCategory(category: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(category).returning({ id: categories.id });
  return result[0].id;
}

export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(categories).orderBy(categories.name);
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0] || null;
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0] || null;
}

export async function updateCategory(id: number, category: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set(category).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(categories).where(eq(categories.id, id));
}

// ============ Tags ============
export async function createTag(tag: InsertTag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tags).values(tag).returning({ id: tags.id });
  return result[0].id;
}

export async function getTags() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tags).orderBy(tags.name);
}

export async function getTagById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  return result[0] || null;
}

export async function getTagBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  return result[0] || null;
}

export async function deleteTag(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tags).where(eq(tags.id, id));
}

export async function updateTag(id: number, tag: Partial<InsertTag>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.update(tags).set(tag).where(eq(tags.id, id)).returning();
  return result[0] || null;
}

export async function getTagUsageCount(id: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(postTags)
    .where(eq(postTags.tagId, id));
  return result[0]?.count || 0;
}

// ============ Post Tags ============
export async function addTagToPost(postTag: InsertPostTag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(postTags).values(postTag);
}

export async function removeTagFromPost(postId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(postTags).where(and(eq(postTags.postId, postId), eq(postTags.tagId, tagId)));
}

export async function getPostTags(postId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ tag: tags })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId));
  return result.map((r) => r.tag);
}

export async function setPostTags(postId: number, tagIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await replacePostTags(db, postId, tagIds);
}

// ============ Post Versions ============
export async function createPostVersion(version: InsertPostVersion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(postVersions).values(version).returning({ id: postVersions.id });
  return result[0].id;
}

export async function getPostVersions(postId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(postVersions)
    .where(eq(postVersions.postId, postId))
    .orderBy(desc(postVersions.createdAt))
    .limit(limit);
}

export async function getPostVersionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(postVersions).where(eq(postVersions.id, id)).limit(1);
  return result[0] || null;
}

async function insertPost(db: WriteDb, post: InsertPost) {
  const result = await db.insert(posts).values(post).returning({ id: posts.id });
  return result[0].id;
}

async function replacePostTags(db: WriteDb, postId: number, tagIds: number[]) {
  await db.delete(postTags).where(eq(postTags.postId, postId));

  if (tagIds.length > 0) {
    await db.insert(postTags).values(tagIds.map((tagId) => ({ postId, tagId })));
  }
}

async function attachPostTaxonomy(postRows: Post[]): Promise<DiscoveryPost[]> {
  const db = await getDb();
  if (!db || postRows.length === 0) return [];

  const postIds = postRows.map((post) => post.id);
  const categoryIds = Array.from(
    new Set(
      postRows
        .map((post) => post.categoryId)
        .filter((categoryId): categoryId is number => typeof categoryId === "number")
    )
  );

  const [categoryRows, tagRows] = await Promise.all([
    categoryIds.length
      ? db.select().from(categories).where(inArray(categories.id, categoryIds))
      : Promise.resolve([]),
    db
      .select({ postId: postTags.postId, tag: tags })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(inArray(postTags.postId, postIds)),
  ]);

  const categoriesById = new Map(categoryRows.map((category) => [category.id, category]));
  const tagsByPostId = new Map<number, Tag[]>();

  for (const row of tagRows) {
    const postTagsForPost = tagsByPostId.get(row.postId) ?? [];
    postTagsForPost.push(row.tag);
    tagsByPostId.set(row.postId, postTagsForPost);
  }

  return postRows.map((post) => ({
    ...post,
    category: post.categoryId ? categoriesById.get(post.categoryId) ?? null : null,
    tags: tagsByPostId.get(post.id) ?? [],
    readingMinutes: estimateReadingMinutes(post.content),
  }));
}

function collectSiblingTags(posts: DiscoveryPost[], excludeSlug?: string) {
  const counts = new Map<string, { tag: Tag; count: number }>();

  for (const post of posts) {
    for (const tag of post.tags) {
      if (tag.slug === excludeSlug) continue;
      const entry = counts.get(tag.slug) ?? { tag, count: 0 };
      counts.set(tag.slug, { tag, count: entry.count + 1 });
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.tag.name.localeCompare(b.tag.name);
    })
    .map((entry) => entry.tag);
}
