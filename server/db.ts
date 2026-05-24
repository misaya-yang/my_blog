import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  categories, 
  Category, 
  InsertCategory, 
  InsertPost, 
  InsertPostTag, 
  InsertPostVersion, 
  InsertTag, 
  InsertUser,
  Post, 
  postTags, 
  postVersions, 
  posts, 
  Tag,
  tags,
  users 
} from "../drizzle/schema.js";
import { ENV } from './_core/env.js';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

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

export async function deletePost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(posts).where(eq(posts.id, id));
}

export async function getPosts(params: {
  status?: "draft" | "published";
  categoryId?: number;
  authorId?: number;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: "createdAt" | "publishedAt" | "viewCount";
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(posts);

  const conditions = [];
  if (params.status) conditions.push(eq(posts.status, params.status));
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
  if (params.orderBy === "publishedAt") {
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

  return await query;
}

export async function incrementViewCount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(posts).set({ viewCount: sql`${posts.viewCount} + 1` }).where(eq(posts.id, id));
}

export async function getPostsCount(params: {
  status?: "draft" | "published";
  categoryId?: number;
  authorId?: number;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return 0;

  const conditions = [];
  if (params.status) conditions.push(eq(posts.status, params.status));
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

export async function deleteTag(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tags).where(eq(tags.id, id));
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
  
  // Remove all existing tags
  await db.delete(postTags).where(eq(postTags.postId, postId));
  
  // Add new tags
  if (tagIds.length > 0) {
    await db.insert(postTags).values(tagIds.map((tagId) => ({ postId, tagId })));
  }
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
