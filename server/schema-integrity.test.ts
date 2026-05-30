import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("content integrity migration", () => {
  const migration = readFileSync("drizzle/0002_content_integrity.sql", "utf-8");
  const aiKnowledgeMigration = readFileSync("drizzle/0005_little_james_howlett.sql", "utf-8");
  const aiAgentMigration = readFileSync("drizzle/0006_puzzling_stingray.sql", "utf-8");
  const aiContextMigration = readFileSync("drizzle/0007_shocking_blackheart.sql", "utf-8");
  const schema = readFileSync("drizzle/schema.ts", "utf-8");

  it("adds foreign keys for post ownership, categories, tags, and versions", () => {
    expect(migration).toContain("posts_author_id_users_id_fk");
    expect(migration).toContain("posts_category_id_categories_id_fk");
    expect(migration).toContain("post_tags_post_id_posts_id_fk");
    expect(migration).toContain("post_tags_tag_id_tags_id_fk");
    expect(migration).toContain("post_versions_post_id_posts_id_fk");
  });

  it("adds query indexes needed by public listing and tag/category joins", () => {
    expect(migration).toContain("posts_status_visibility_published_at_idx");
    expect(migration).toContain("posts_category_id_idx");
    expect(migration).toContain("post_tags_post_id_idx");
    expect(migration).toContain("post_tags_tag_id_idx");
    expect(migration).toContain("categories_slug_idx");
    expect(migration).toContain("tags_slug_idx");
  });

  it("keeps Drizzle schema aligned with the migration constraints", () => {
    expect(schema).toContain("references(() => users.id");
    expect(schema).toContain("references(() => categories.id");
    expect(schema).toContain("references(() => posts.id");
    expect(schema).toContain("references(() => tags.id");
    expect(schema).toContain("postsStatusVisibilityPublishedAtIdx");
  });

  it("adds a Supabase-backed public AI knowledge chunk index", () => {
    expect(aiKnowledgeMigration).toContain("CREATE TABLE \"ai_knowledge_chunks\"");
    expect(aiKnowledgeMigration).toContain("ai_knowledge_chunks_post_id_posts_id_fk");
    expect(aiKnowledgeMigration).toContain("ai_knowledge_chunks_visibility_idx");
    expect(aiKnowledgeMigration).toContain("ai_knowledge_chunks_content_fts_idx");
    expect(schema).toContain("export const aiKnowledgeChunks");
    expect(schema).toContain("statusSnapshot");
    expect(schema).toContain("visibilitySnapshot");
  });

  it("adds durable AI agent conversation, quota, and run tables", () => {
    expect(aiAgentMigration).toContain("CREATE TABLE \"ai_conversations\"");
    expect(aiAgentMigration).toContain("CREATE TABLE \"ai_messages\"");
    expect(aiAgentMigration).toContain("CREATE TABLE \"ai_usage_buckets\"");
    expect(aiAgentMigration).toContain("CREATE TABLE \"ai_agent_runs\"");
    expect(aiAgentMigration).toContain("ai_usage_buckets_identity_window_idx");
    expect(aiAgentMigration).toContain("ai_messages_conversation_id_ai_conversations_id_fk");
    expect(aiAgentMigration).toContain("ai_agent_runs_user_message_id_ai_messages_id_fk");
    expect(schema).toContain("export const aiConversations");
    expect(schema).toContain("export const aiUsageBuckets");
    expect(schema).toContain("aiUsageActionType");
  });

  it("adds conversation-local AI context sources with retention metadata", () => {
    expect(aiContextMigration).toContain("CREATE TABLE \"ai_context_sources\"");
    expect(aiContextMigration).toContain("ai_context_sources_conversation_id_ai_conversations_id_fk");
    expect(aiContextMigration).toContain("ai_context_sources_expires_at_idx");
    expect(schema).toContain("export const aiContextSources");
    expect(schema).toContain("aiContextSourceKind");
    expect(schema).toContain("expiresAt");
  });
});
