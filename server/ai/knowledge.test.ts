import { describe, expect, it } from "vitest";
import {
  buildPublicKnowledgeChunks,
  searchPublicKnowledgeChunks,
  type KnowledgePostInput,
} from "./knowledge";

const baseDate = new Date("2026-05-30T00:00:00.000Z");

const applications = {
  id: 1,
  name: "AI Applications",
  slug: "ai-applications",
};

const algorithms = {
  id: 2,
  name: "AI Algorithms",
  slug: "ai-algorithms",
};

const harnessTag = {
  id: 1,
  name: "Harness Engine",
  slug: "harness-engine",
};

const ropeTag = {
  id: 2,
  name: "RoPE",
  slug: "rope",
};

function post(overrides: Partial<KnowledgePostInput>): KnowledgePostInput {
  return {
    id: overrides.id ?? 1,
    title: overrides.title ?? "Untitled",
    slug: overrides.slug ?? `post-${overrides.id ?? 1}`,
    content: overrides.content ?? "## Overview\nPublic body",
    excerpt: overrides.excerpt ?? "Public excerpt",
    status: overrides.status ?? "published",
    visibility: overrides.visibility ?? "public",
    category: overrides.category ?? applications,
    tags: overrides.tags ?? [harnessTag],
    publishedAt: overrides.publishedAt ?? baseDate,
    updatedAt: overrides.updatedAt ?? baseDate,
  };
}

describe("AI public knowledge chunks", () => {
  const posts = [
    post({
      id: 1,
      title: "Agent Harness Engine",
      slug: "agent-harness",
      content: "## Context Engineering\nHarness systems capture context policy, traces, tools, and evaluator output.",
      category: applications,
      tags: [harnessTag],
    }),
    post({
      id: 2,
      title: "DF-RoPE Frequency Budget",
      slug: "df-rope",
      content: "## RoPE Aliasing\nLong-context scaling has position encoding and frequency aliasing failure modes.",
      category: algorithms,
      tags: [ropeTag],
    }),
    post({
      id: 3,
      title: "Hidden Harness Note",
      slug: "hidden-harness",
      content: "secret hidden harness details",
      status: "published",
      visibility: "hidden",
      category: applications,
      tags: [harnessTag],
    }),
    post({
      id: 4,
      title: "Draft Harness Note",
      slug: "draft-harness",
      content: "draft harness details",
      status: "draft",
      visibility: "admin",
      category: applications,
      tags: [harnessTag],
    }),
  ];

  it("indexes only published public posts plus a public site overview", () => {
    const chunks = buildPublicKnowledgeChunks(posts);
    const slugs = new Set(chunks.map((chunk) => chunk.postSlug).filter(Boolean));

    expect(chunks.some((chunk) => chunk.chunkType === "site_overview_chunk")).toBe(true);
    expect(slugs).toEqual(new Set(["agent-harness", "df-rope"]));
    expect(chunks.some((chunk) => chunk.postSlug === "hidden-harness")).toBe(false);
    expect(chunks.some((chunk) => chunk.postSlug === "draft-harness")).toBe(false);
  });

  it("creates metadata and body chunks with source metadata", () => {
    const chunks = buildPublicKnowledgeChunks(posts);
    const metadata = chunks.find(
      (chunk) => chunk.chunkType === "post_metadata_chunk" && chunk.postSlug === "agent-harness"
    );
    const body = chunks.find(
      (chunk) => chunk.chunkType === "post_chunk" && chunk.postSlug === "agent-harness"
    );

    expect(metadata).toMatchObject({
      postTitle: "Agent Harness Engine",
      categorySlug: "ai-applications",
      tagSlugs: ["harness-engine"],
      statusSnapshot: "published",
      visibilitySnapshot: "public",
      chunkIndex: 0,
    });
    expect(body).toMatchObject({
      heading: "Context Engineering",
      chunkIndex: 1,
    });
    expect(body?.contentHash).toHaveLength(64);
    expect(body?.tokenEstimate).toBeGreaterThan(0);
  });

  it("searches public chunks without returning hidden or draft sources", () => {
    const chunks = buildPublicKnowledgeChunks(posts);
    const results = searchPublicKnowledgeChunks(chunks, "secret hidden harness", { limit: 10 });

    expect(results.map((result) => result.postSlug)).toContain("agent-harness");
    expect(results.some((result) => result.postSlug === "hidden-harness")).toBe(false);
    expect(results.some((result) => result.postSlug === "draft-harness")).toBe(false);
  });

  it("boosts current post scope while keeping public filters", () => {
    const chunks = buildPublicKnowledgeChunks(posts);
    const results = searchPublicKnowledgeChunks(chunks, "frequency aliasing", {
      limit: 4,
      scope: { type: "post", value: "df-rope" },
    });

    expect(results[0].postSlug).toBe("df-rope");
    expect(results.every((result) => result.visibilitySnapshot === "public")).toBe(true);
  });

  it("drops stale chunks when a public post becomes hidden before reindexing", () => {
    const updatedPosts = posts.map((item) =>
      item.slug === "agent-harness" ? { ...item, visibility: "admin" as const } : item
    );
    const chunks = buildPublicKnowledgeChunks(updatedPosts);

    expect(chunks.some((chunk) => chunk.postSlug === "agent-harness")).toBe(false);
    expect(chunks.some((chunk) => chunk.postSlug === "df-rope")).toBe(true);
  });
});
