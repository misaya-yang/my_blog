import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("content integrity migration", () => {
  const migration = readFileSync("drizzle/0002_content_integrity.sql", "utf-8");
  const aiKnowledgeMigration = readFileSync("drizzle/0005_little_james_howlett.sql", "utf-8");
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
});
