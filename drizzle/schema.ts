import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const postStatus = pgEnum("post_status", ["draft", "published"]);
export const postVisibility = pgEnum("post_visibility", ["hidden", "admin", "public"]);
export const subscriptionStatus = pgEnum("subscription_status", ["active", "unsubscribed"]);
export const feedbackType = pgEnum("feedback_type", ["useful", "not_useful"]);
export const feedbackStatus = pgEnum("feedback_status", ["new", "reviewed", "hidden"]);
export const aiKnowledgeChunkType = pgEnum("ai_knowledge_chunk_type", [
  "post_chunk",
  "post_metadata_chunk",
  "site_overview_chunk",
]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRole("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Categories table
 */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("categories_slug_idx").on(table.slug),
]);

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Tags table
 */
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("tags_slug_idx").on(table.slug),
]);

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

/**
 * Blog posts table
 */
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  coverImage: varchar("cover_image", { length: 512 }),
  status: postStatus("status").default("draft").notNull(),
  visibility: postVisibility("visibility").default("admin").notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  seriesSlug: varchar("series_slug", { length: 120 }),
  seriesTitle: varchar("series_title", { length: 255 }),
  seriesOrder: integer("series_order"),
  featuredRank: integer("featured_rank"),
  pinnedTrack: varchar("pinned_track", { length: 50 }),
  viewCount: integer("view_count").default(0).notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("posts_status_visibility_published_at_idx").on(table.status, table.visibility, table.publishedAt),
  index("posts_category_id_idx").on(table.categoryId),
  index("posts_featured_rank_published_at_idx").on(table.featuredRank, table.publishedAt),
  index("posts_series_slug_order_idx").on(table.seriesSlug, table.seriesOrder),
  index("posts_pinned_track_idx").on(table.pinnedTrack),
]);

export const postsStatusVisibilityPublishedAtIdx = "posts_status_visibility_published_at_idx";

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * Post-Tag relationship table (many-to-many)
 */
export const postTags = pgTable("post_tags", {
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.postId, table.tagId] }),
  index("post_tags_post_id_idx").on(table.postId),
  index("post_tags_tag_id_idx").on(table.tagId),
]);

export type PostTag = typeof postTags.$inferSelect;
export type InsertPostTag = typeof postTags.$inferInsert;

/**
 * Post versions table for draft auto-save and version history
 */
export const postVersions = pgTable("post_versions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("post_versions_post_id_idx").on(table.postId),
]);

export type PostVersion = typeof postVersions.$inferSelect;
export type InsertPostVersion = typeof postVersions.$inferInsert;

/**
 * Reader subscription intents. This keeps newsletter/provider integration replaceable.
 */
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  preferredLanguage: varchar("preferred_language", { length: 12 }),
  interests: text("interests"),
  source: varchar("source", { length: 255 }),
  status: subscriptionStatus("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("subscribers_status_created_at_idx").on(table.status, table.createdAt),
]);

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = typeof subscribers.$inferInsert;

/**
 * Private article feedback for owner review. Public pages never list this table.
 */
export const postFeedback = pgTable("post_feedback", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  visitorId: varchar("visitor_id", { length: 64 }),
  visitorName: varchar("visitor_name", { length: 80 }),
  type: feedbackType("type").notNull(),
  message: text("message"),
  replyEmail: varchar("reply_email", { length: 320 }),
  status: feedbackStatus("status").default("new").notNull(),
  source: varchar("source", { length: 255 }),
  userAgent: varchar("user_agent", { length: 512 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
}, (table) => [
  index("post_feedback_post_status_created_at_idx").on(table.postId, table.status, table.createdAt),
  index("post_feedback_status_created_at_idx").on(table.status, table.createdAt),
]);

export type PostFeedback = typeof postFeedback.$inferSelect;
export type InsertPostFeedback = typeof postFeedback.$inferInsert;

/**
 * Supabase-backed public blog knowledge chunks for the right-bottom assistant.
 * Public retrieval must filter by the status/visibility snapshots, not by prompt.
 */
export const aiKnowledgeChunks = pgTable("ai_knowledge_chunks", {
  id: serial("id").primaryKey(),
  chunkType: aiKnowledgeChunkType("chunk_type").notNull(),
  postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }),
  postSlug: varchar("post_slug", { length: 255 }),
  postTitle: varchar("post_title", { length: 255 }),
  categorySlug: varchar("category_slug", { length: 100 }),
  tagSlugs: jsonb("tag_slugs").$type<string[]>().notNull(),
  statusSnapshot: postStatus("status_snapshot").notNull(),
  visibilitySnapshot: postVisibility("visibility_snapshot").notNull(),
  locale: varchar("locale", { length: 12 }).default("en").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  heading: varchar("heading", { length: 255 }),
  sectionPath: text("section_path"),
  content: text("content").notNull(),
  summary: text("summary"),
  keywords: jsonb("keywords").$type<string[]>().notNull(),
  contentHash: varchar("content_hash", { length: 64 }).notNull(),
  tokenEstimate: integer("token_estimate").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("ai_knowledge_chunks_post_chunk_idx").on(table.postId, table.chunkIndex),
  index("ai_knowledge_chunks_post_id_idx").on(table.postId),
  index("ai_knowledge_chunks_post_slug_idx").on(table.postSlug),
  index("ai_knowledge_chunks_visibility_idx").on(table.statusSnapshot, table.visibilitySnapshot),
  index("ai_knowledge_chunks_chunk_type_idx").on(table.chunkType),
]);

export type AiKnowledgeChunk = typeof aiKnowledgeChunks.$inferSelect;
export type InsertAiKnowledgeChunk = typeof aiKnowledgeChunks.$inferInsert;
