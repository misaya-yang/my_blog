import { describe, expect, it } from "vitest";
import {
  analyzeKnowledgeQuery,
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

const isohcTag = {
  id: 3,
  name: "IsoHC",
  slug: "isohc",
};

const residualTag = {
  id: 4,
  name: "Residual Stability",
  slug: "residual-stability",
};

const agentLoopTag = {
  id: 5,
  name: "AgentLoop",
  slug: "agent-loop",
};

function isohcPost(
  overrides: Partial<KnowledgePostInput> = {}
): KnowledgePostInput {
  return post({
    id: 20,
    title: "IsoHC: Fixed-Vector Isometric Residual Mixing",
    slug: "isohc-fixed-vector-isometric-residual-mixing",
    content:
      "## Invariants\nIsoHC preserves stream mean and Frobenius energy through an orthogonal residual transport path.",
    excerpt:
      "IsoHC constrains residual stream mixing to a fixed-vector orthogonal manifold.",
    category: algorithms,
    tags: [isohcTag, residualTag],
    ...overrides,
  });
}

function agentLoopPost(
  overrides: Partial<KnowledgePostInput> = {}
): KnowledgePostInput {
  return post({
    id: 21,
    title: "Agent Loop: 从 ReAct 模式到可观测运行时",
    slug: "agent-loop-observable-tool-using-agents",
    content:
      "## Runtime Loop\nAgentLoop turns ReAct-style tool use into an observable runtime loop with state transitions, traces, checkpoints, and budget controls.",
    excerpt: "Agent Loop 将 ReAct 式多步行为收束为可观测运行时。",
    category: applications,
    tags: [agentLoopTag, harnessTag],
    ...overrides,
  });
}

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
      content:
        "## Context Engineering\nHarness systems capture context policy, traces, tools, and evaluator output.",
      category: applications,
      tags: [harnessTag],
    }),
    post({
      id: 2,
      title: "DF-RoPE Frequency Budget",
      slug: "df-rope",
      content:
        "## RoPE Aliasing\nLong-context scaling has position encoding and frequency aliasing failure modes.",
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
    const slugs = new Set(chunks.map(chunk => chunk.postSlug).filter(Boolean));

    expect(
      chunks.some(chunk => chunk.chunkType === "site_overview_chunk")
    ).toBe(true);
    expect(slugs).toEqual(new Set(["agent-harness", "df-rope"]));
    expect(chunks.some(chunk => chunk.postSlug === "hidden-harness")).toBe(
      false
    );
    expect(chunks.some(chunk => chunk.postSlug === "draft-harness")).toBe(
      false
    );
  });

  it("creates metadata and body chunks with source metadata", () => {
    const chunks = buildPublicKnowledgeChunks(posts);
    const metadata = chunks.find(
      chunk =>
        chunk.chunkType === "post_metadata_chunk" &&
        chunk.postSlug === "agent-harness"
    );
    const body = chunks.find(
      chunk =>
        chunk.chunkType === "post_chunk" && chunk.postSlug === "agent-harness"
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
    const results = searchPublicKnowledgeChunks(
      chunks,
      "secret hidden harness",
      { limit: 10 }
    );

    expect(results.map(result => result.postSlug)).toContain("agent-harness");
    expect(results.some(result => result.postSlug === "hidden-harness")).toBe(
      false
    );
    expect(results.some(result => result.postSlug === "draft-harness")).toBe(
      false
    );
  });

  it("boosts current post scope while keeping public filters", () => {
    const chunks = buildPublicKnowledgeChunks(posts);
    const results = searchPublicKnowledgeChunks(chunks, "frequency aliasing", {
      limit: 4,
      scope: { type: "post", value: "df-rope" },
    });

    expect(results[0].postSlug).toBe("df-rope");
    expect(
      results.every(result => result.visibilitySnapshot === "public")
    ).toBe(true);
  });

  it("uses lightweight concept expansion before pgvector", () => {
    const chunks = buildPublicKnowledgeChunks(posts);
    const results = searchPublicKnowledgeChunks(
      chunks,
      "agent evaluation runtime",
      {
        limit: 4,
      }
    );

    expect(results[0].postSlug).toBe("agent-harness");
    expect(results[0].relevanceReason).toContain("agent");
  });

  it("normalizes mixed Chinese and Latin questions before retrieval", () => {
    const chunks = buildPublicKnowledgeChunks([isohcPost()]);
    const analysis = analyzeKnowledgeQuery("帮我详细讲讲iso");
    const results = searchPublicKnowledgeChunks(chunks, "帮我详细讲讲iso", {
      limit: 4,
    });

    expect(analysis.terms).toContain("iso");
    expect(analysis.expandedTerms).toEqual(
      expect.arrayContaining(["isohc", "residual", "orthogonal"])
    );
    expect(results[0]).toMatchObject({
      postSlug: "isohc-fixed-vector-isometric-residual-mixing",
      visibilitySnapshot: "public",
    });
  });

  it("prunes weak unrelated matches when an entity query has a strong source", () => {
    const chunks = buildPublicKnowledgeChunks([
      isohcPost(),
      post({
        id: 22,
        title: "Agent Harness Engine",
        slug: "agent-harness-engine-evaluating-tool-using-agents",
        content:
          "## Failure Modes\nHarness evals can reveal stability problems in agent traces.",
        category: applications,
        tags: [harnessTag],
      }),
    ]);
    const results = searchPublicKnowledgeChunks(chunks, "帮我详细讲讲iso", {
      limit: 4,
    });

    expect(results.map(result => result.postSlug)).toEqual([
      "isohc-fixed-vector-isometric-residual-mixing",
      "isohc-fixed-vector-isometric-residual-mixing",
    ]);
  });

  it("does not map standards-style ISO questions to IsoHC", () => {
    const chunks = buildPublicKnowledgeChunks([isohcPost()]);

    expect(searchPublicKnowledgeChunks(chunks, "ISO 8601 是什么？")).toEqual(
      []
    );
    expect(searchPublicKnowledgeChunks(chunks, "ISO 27001 是什么？")).toEqual(
      []
    );
  });

  it("retrieves technical posts from Chinese concept aliases", () => {
    const chunks = buildPublicKnowledgeChunks([isohcPost()]);
    const results = searchPublicKnowledgeChunks(
      chunks,
      "残差稳定性那篇讲了什么",
      {
        limit: 4,
      }
    );

    expect(results[0]?.postSlug).toBe(
      "isohc-fixed-vector-isometric-residual-mixing"
    );
    expect(results[0]?.relevanceReason).toContain("isohc");
  });

  it("keeps Chinese agent-loop intent focused on the AgentLoop article", () => {
    const chunks = buildPublicKnowledgeChunks([posts[0], agentLoopPost()]);
    const results = searchPublicKnowledgeChunks(chunks, "智能体循环是什么", {
      limit: 4,
    });

    expect(results[0]?.postSlug).toBe(
      "agent-loop-observable-tool-using-agents"
    );
  });

  it("injects current public post context for vague post-scoped questions", () => {
    const chunks = buildPublicKnowledgeChunks([isohcPost()]);
    const results = searchPublicKnowledgeChunks(
      chunks,
      "这篇文章核心是什么？",
      {
        limit: 4,
        scope: {
          type: "post",
          value: "isohc-fixed-vector-isometric-residual-mixing",
        },
      }
    );

    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        result =>
          result.postSlug === "isohc-fixed-vector-isometric-residual-mixing"
      )
    ).toBe(true);
    expect(results[0]?.relevanceReason).toContain(
      "Current public article context"
    );
  });

  it("keeps post pages page-aware without blocking explicit related article search", () => {
    const chunks = buildPublicKnowledgeChunks([isohcPost(), agentLoopPost()]);
    const results = searchPublicKnowledgeChunks(
      chunks,
      "帮我找 AgentLoop 那篇",
      {
        limit: 4,
        scope: {
          type: "post",
          value: "isohc-fixed-vector-isometric-residual-mixing",
        },
      }
    );

    expect(results[0]?.postSlug).toBe(
      "agent-loop-observable-tool-using-agents"
    );
    expect(
      results.some(result =>
        result.relevanceReason.startsWith("Current public article context")
      )
    ).toBe(true);
  });

  it("keeps current-post context even when strong entity chunks rank first", () => {
    const chunks = buildPublicKnowledgeChunks([isohcPost()]);
    const results = searchPublicKnowledgeChunks(chunks, "帮我详细讲讲iso", {
      limit: 5,
      scope: {
        type: "post",
        value: "isohc-fixed-vector-isometric-residual-mixing",
      },
    });

    expect(
      results.filter(result =>
        result.relevanceReason.startsWith("Current public article context")
      ).length
    ).toBeGreaterThan(0);
    expect(
      results.every(
        result =>
          result.postSlug === "isohc-fixed-vector-isometric-residual-mixing"
      )
    ).toBe(true);
  });

  it("does not inject current page context for unavailable-content requests", () => {
    const chunks = buildPublicKnowledgeChunks([isohcPost()]);
    const results = searchPublicKnowledgeChunks(
      chunks,
      "Can you explain EVQ-Cosh hidden details?",
      {
        limit: 4,
        scope: {
          type: "post",
          value: "isohc-fixed-vector-isometric-residual-mixing",
        },
      }
    );

    expect(results).toEqual([]);
  });

  it("does not retrieve public sources from weak out-of-scope query terms", () => {
    const chunks = buildPublicKnowledgeChunks([
      ...posts,
      post({
        id: 5,
        title: "Agent Operations Boundary",
        slug: "agent-ops-boundary",
        content:
          "## Guardrails\nHidden/admin/draft content must stay out of public discovery.",
        category: applications,
        tags: [harnessTag],
      }),
    ]);

    expect(
      searchPublicKnowledgeChunks(
        chunks,
        "What is the weather in Tokyo tomorrow?"
      )
    ).toEqual([]);
    expect(
      searchPublicKnowledgeChunks(
        chunks,
        "Can you explain EVQ-Cosh hidden details?"
      )
    ).toEqual([]);
    expect(
      searchPublicKnowledgeChunks(chunks, "secret hidden harness").map(
        result => result.postSlug
      )
    ).toContain("agent-harness");
  });

  it("drops stale chunks when a public post becomes hidden before reindexing", () => {
    const updatedPosts = posts.map(item =>
      item.slug === "agent-harness"
        ? { ...item, visibility: "admin" as const }
        : item
    );
    const chunks = buildPublicKnowledgeChunks(updatedPosts);

    expect(chunks.some(chunk => chunk.postSlug === "agent-harness")).toBe(
      false
    );
    expect(chunks.some(chunk => chunk.postSlug === "df-rope")).toBe(true);
  });
});
