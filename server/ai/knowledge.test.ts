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

const gatedFfnTag = {
  id: 6,
  name: "Gated FFN",
  slug: "gated-ffn",
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

function gatedFfnPost(
  overrides: Partial<KnowledgePostInput> = {}
): KnowledgePostInput {
  return post({
    id: 22,
    title: "Gated FFN: Transformer 里的乘法通道",
    slug: "gated-ffn-multiplicative-channel-control",
    content:
      "## 往数学底层看：输入依赖的对角算子\nGated FFN uses SwiGLU and channel-wise multiplication: Wd diag(phi(Wg x)) Wu x. It compares vanilla FFN with GLU, GEGLU, and SwiGLU.",
    excerpt:
      "从普通 FFN 推到 GLU、GEGLU 和 SwiGLU：门控 FFN 如何把逐 token MLP 变成输入依赖的通道控制器。",
    category: algorithms,
    tags: [gatedFfnTag],
    ...overrides,
  });
}

function detailedIsohcPost(): KnowledgePostInput {
  return isohcPost({
    content: [
      "IsoHC constrains residual stream mixing to preserve mean and energy.",
      "",
      "## 2. From Mean Preservation to Isometry",
      "Doubly stochastic matrices preserve the global stream mean, but mean preservation alone does not guarantee that the mean-zero residual component keeps its energy. IsoHC strengthens the constraint by requiring residual transport to be both mean-preserving and orthogonal.",
      "",
      "## 4. Fixed-Vector Orthogonal Decomposition",
      "The constraint separates the fixed mean direction from its orthogonal complement. Define e0 as the all-ones vector divided by sqrt(n). The implementation keeps e0 fixed and applies an orthogonal transform on the mean-zero complement.",
      "",
      "## 7. Implementation Mapping",
      "The repository separates fixed-vector orthogonal projection utilities, residual stream mixing layers, Transformer integration, language-model mixing ablations, and GNN variants.",
      "",
      "## 10. Evidence Framing",
      "The public conclusion should be framed carefully: IsoHC is a stability mechanism, not a standalone claim of universal task superiority. Broader downstream claims require larger standardized evaluation.",
    ].join("\n"),
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

  it("does not treat fenced code comments as markdown section headings", () => {
    const chunks = buildPublicKnowledgeChunks([
      post({
        id: 30,
        title: "Flow Matching Shape Notes",
        slug: "flow-matching-shape-notes",
        content: [
          "## Runtime Shape",
          "The implementation keeps tensor shape notes with the section.",
          "",
          "```python",
          "# x: [batch, token, hidden]",
          "# cond: optional conditioning vector",
          "velocity = model(x, cond)",
          "```",
          "",
          "## Evidence Boundary",
          "The conclusion stays scoped to the measured path.",
        ].join("\n"),
      }),
    ]);
    const postChunks = chunks.filter(
      chunk => chunk.postSlug === "flow-matching-shape-notes"
    );

    expect(postChunks.map(chunk => chunk.heading)).toEqual(
      expect.arrayContaining(["Metadata", "Runtime Shape", "Evidence Boundary"])
    );
    expect(postChunks.map(chunk => chunk.heading)).not.toEqual(
      expect.arrayContaining([
        "x: [batch, token, hidden]",
        "cond: optional conditioning vector",
      ])
    );
    expect(
      postChunks.some(chunk => chunk.content.includes("# x: [batch, token, hidden]"))
    ).toBe(true);
  });

  it("answers Chinese public article inventory questions from the site overview", () => {
    const chunks = buildPublicKnowledgeChunks(posts);
    const analysis = analyzeKnowledgeQuery("都有哪几篇文章啊");
    const results = searchPublicKnowledgeChunks(chunks, "都有哪几篇文章啊", {
      limit: 4,
    });

    expect(analysis.terms).toEqual(expect.arrayContaining(["哪几篇", "文章"]));
    expect(results[0]).toMatchObject({
      chunkType: "site_overview_chunk",
      postSlug: null,
      visibilitySnapshot: "public",
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.relevanceReason).toContain("Public blog inventory");
    expect(results[0]?.excerpt).toContain("Public posts");
    expect(results[0]?.excerpt).toContain("Agent Harness Engine");
    expect(results[0]?.excerpt).toContain("DF-RoPE Frequency Budget");
    expect(results[0]?.content).toContain("Agent Harness Engine");
    expect(results[0]?.content).toContain("DF-RoPE Frequency Budget");
    expect(results[0]?.content).not.toContain("Hidden Harness Note");
    expect(results[0]?.content).not.toContain("Draft Harness Note");
  });

  it("treats colloquial 那几篇 inventory phrasing as a public article list intent", () => {
    const chunks = buildPublicKnowledgeChunks(posts);
    const results = searchPublicKnowledgeChunks(chunks, "都有那几篇文章啊", {
      limit: 4,
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      chunkType: "site_overview_chunk",
      postSlug: null,
    });
    expect(results[0]?.excerpt).toContain("Agent Harness Engine");
    expect(results[0]?.excerpt).not.toContain("Hidden Harness Note");
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

  it("retrieves gated FFN posts from Chinese and SwiGLU aliases", () => {
    const chunks = buildPublicKnowledgeChunks([isohcPost(), gatedFfnPost()]);

    const chineseResults = searchPublicKnowledgeChunks(
      chunks,
      "门控 FFN 和普通 FFN 有什么区别？",
      { limit: 4 }
    );
    const swigluResults = searchPublicKnowledgeChunks(
      chunks,
      "SwiGLU 为什么常用于 Transformer FFN？",
      { limit: 4 }
    );

    expect(chineseResults[0]?.postSlug).toBe(
      "gated-ffn-multiplicative-channel-control"
    );
    expect(swigluResults[0]?.postSlug).toBe(
      "gated-ffn-multiplicative-channel-control"
    );
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

  it("uses body sections instead of metadata for current-page core abstraction questions", () => {
    const chunks = buildPublicKnowledgeChunks([detailedIsohcPost()]);
    const analysis = analyzeKnowledgeQuery("解释这篇文章里的核心抽象。");
    const results = searchPublicKnowledgeChunks(
      chunks,
      "解释这篇文章里的核心抽象。",
      {
        limit: 6,
        scope: {
          type: "post",
          value: "isohc-fixed-vector-isometric-residual-mixing",
        },
      }
    );

    expect(analysis.terms).toEqual(
      expect.arrayContaining(["核心抽象", "核心", "抽象"])
    );
    expect(results.some(result => result.heading === "Metadata")).toBe(false);
    expect(results.map(result => result.heading)).toEqual(
      expect.arrayContaining([
        "2. From Mean Preservation to Isometry",
        "4. Fixed-Vector Orthogonal Decomposition",
      ])
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

  it("retrieves current-page fixed-vector sections from Chinese reader phrasing", () => {
    const chunks = buildPublicKnowledgeChunks([detailedIsohcPost()]);
    const analysis =
      analyzeKnowledgeQuery("这页里面的固定向量到底起什么作用？");
    const results = searchPublicKnowledgeChunks(
      chunks,
      "这页里面的固定向量到底起什么作用？",
      {
        limit: 6,
        scope: {
          type: "post",
          value: "isohc-fixed-vector-isometric-residual-mixing",
        },
      }
    );

    expect(analysis.terms).toContain("固定向量");
    expect(analysis.expandedTerms).toEqual(
      expect.arrayContaining(["fixed-vector", "mean", "complement"])
    );
    expect(results.map(result => result.heading)).toContain(
      "4. Fixed-Vector Orthogonal Decomposition"
    );
  });

  it("retrieves the isometry versus doubly stochastic comparison from Chinese phrasing", () => {
    const chunks = buildPublicKnowledgeChunks([detailedIsohcPost()]);
    const results = searchPublicKnowledgeChunks(
      chunks,
      "文中说的等距约束和双随机约束有什么区别？",
      {
        limit: 6,
        scope: {
          type: "post",
          value: "isohc-fixed-vector-isometric-residual-mixing",
        },
      }
    );

    expect(results[0]?.heading).toBe("2. From Mean Preservation to Isometry");
    expect(results[0]?.excerpt).toContain("Doubly stochastic");
  });

  it("retrieves later implementation and evidence framing sections from page-aware structural questions", () => {
    const chunks = buildPublicKnowledgeChunks([detailedIsohcPost()]);
    const results = searchPublicKnowledgeChunks(
      chunks,
      "这篇文章后半部分有没有讲实现或者失败边界？",
      {
        limit: 8,
        scope: {
          type: "post",
          value: "isohc-fixed-vector-isometric-residual-mixing",
        },
      }
    );

    expect(results.map(result => result.heading)).toEqual(
      expect.arrayContaining([
        "7. Implementation Mapping",
        "10. Evidence Framing",
      ])
    );
  });

  it("keeps current-article deictic questions from drifting into unrelated implementation posts", () => {
    const chunks = buildPublicKnowledgeChunks([
      detailedIsohcPost(),
      post({
        id: 30,
        title: "Evidence Packet: Agentic RAG 的上下文编译接口",
        slug: "rag-evidence-packet-context-compiler",
        content:
          "## 7. Reference Architecture Mapping\nEvidence Packet maps retrieval, reranking, and context assembly into an implementation boundary.",
        category: applications,
        tags: [harnessTag],
      }),
    ]);
    const results = searchPublicKnowledgeChunks(
      chunks,
      "这篇文章后半部分有没有讲实现或者失败边界？",
      {
        limit: 8,
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
