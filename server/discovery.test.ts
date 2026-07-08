import { describe, expect, it } from "vitest";
import {
  filterPostsByCategory,
  filterPostsByTag,
  getAdjacentPosts,
  groupArchivePosts,
  rankRelatedPosts,
  searchDiscoveryPosts,
  type DiscoveryPost,
} from "./discovery";

const baseDate = "2026-01-01T00:00:00.000Z";

function post(overrides: Partial<DiscoveryPost>): DiscoveryPost {
  return {
    id: overrides.id ?? 1,
    title: overrides.title ?? "Untitled",
    slug: overrides.slug ?? `post-${overrides.id ?? 1}`,
    content: overrides.content ?? "Body",
    excerpt: overrides.excerpt ?? "Excerpt",
    coverImage: null,
    status: overrides.status ?? "published",
    visibility: overrides.visibility ?? "public",
    categoryId: overrides.categoryId ?? overrides.category?.id ?? null,
    authorId: 1,
    viewCount: 0,
    publishedAt: overrides.publishedAt ?? new Date(baseDate),
    createdAt: overrides.createdAt ?? new Date(baseDate),
    updatedAt: overrides.updatedAt ?? new Date(baseDate),
    category: overrides.category ?? null,
    tags: overrides.tags ?? [],
    readingMinutes: overrides.readingMinutes ?? 1,
    matchExcerpt: overrides.matchExcerpt,
  };
}

const algorithms = {
  id: 1,
  name: "AI Algorithms",
  slug: "ai-algorithms",
  description: "Model mechanisms",
  createdAt: new Date(baseDate),
  updatedAt: new Date(baseDate),
};

const applications = {
  id: 2,
  name: "AI Applications",
  slug: "ai-applications",
  description: "Agent systems",
  createdAt: new Date(baseDate),
  updatedAt: new Date(baseDate),
};

const harnessTag = {
  id: 1,
  name: "Harness Engine",
  slug: "harness-engine",
  createdAt: new Date(baseDate),
};

const contextTag = {
  id: 2,
  name: "Context Engineering",
  slug: "context-engineering",
  createdAt: new Date(baseDate),
};

const ropeTag = {
  id: 3,
  name: "RoPE",
  slug: "rope",
  createdAt: new Date(baseDate),
};

const rlhfTag = {
  id: 4,
  name: "RLHF",
  slug: "rlhf",
  createdAt: new Date(baseDate),
};

describe("reader discovery logic", () => {
  const posts: DiscoveryPost[] = [
    post({
      id: 1,
      title: "Agent Harness Engine",
      slug: "agent-harness",
      category: applications,
      tags: [harnessTag, contextTag],
      publishedAt: new Date("2026-05-10T00:00:00.000Z"),
    }),
    post({
      id: 2,
      title: "Retrieval Latency Notes",
      slug: "retrieval-latency",
      content: "This note covers agent routing and cache latency.",
      category: applications,
      tags: [contextTag],
      publishedAt: new Date("2026-05-02T00:00:00.000Z"),
    }),
    post({
      id: 3,
      title: "RoPE Frequency Budget",
      slug: "rope-frequency",
      category: algorithms,
      tags: [ropeTag],
      publishedAt: new Date("2026-04-12T00:00:00.000Z"),
      updatedAt: new Date("2026-04-20T00:00:00.000Z"),
    }),
    post({
      id: 6,
      title: "LLM Post-Training RL",
      slug: "llm-rl",
      content: "RLHF, DPO, RLVR, GRPO, verifier, and agent RL.",
      category: algorithms,
      tags: [rlhfTag],
      publishedAt: new Date("2026-06-17T00:00:00.000Z"),
    }),
    post({
      id: 4,
      title: "Secret Harness Draft",
      slug: "secret-harness-draft",
      content: "draft should not leak into search",
      status: "draft",
      visibility: "admin",
      category: applications,
      tags: [harnessTag],
    }),
    post({
      id: 5,
      title: "Hidden Harness Note",
      slug: "hidden-harness-note",
      content: "hidden should not leak into search",
      status: "published",
      visibility: "hidden",
      category: applications,
      tags: [harnessTag],
    }),
  ];

  it("searches all public posts by title, content, category, and tag without leaking drafts or hidden posts", () => {
    expect(searchDiscoveryPosts(posts, "harness", { limit: 10, offset: 0 }).results.map((item) => item.slug)).toEqual([
      "agent-harness",
    ]);
    expect(searchDiscoveryPosts(posts, "cache latency", { limit: 10, offset: 0 }).results.map((item) => item.slug)).toEqual([
      "retrieval-latency",
    ]);
    expect(searchDiscoveryPosts(posts, "AI Applications", { limit: 10, offset: 0 }).total).toBe(2);
    expect(searchDiscoveryPosts(posts, "context-engineering", { limit: 10, offset: 0 }).total).toBe(2);
    expect(searchDiscoveryPosts(posts, "secret", { limit: 10, offset: 0 }).total).toBe(0);
  });

  it("matches discovery aliases and mixed Chinese-English intent without leaking hidden posts", () => {
    expect(
      searchDiscoveryPosts(posts, "智能体", {
        limit: 10,
        offset: 0,
      }).results.map(item => item.slug)
    ).toEqual(["agent-harness", "retrieval-latency"]);
    expect(
      searchDiscoveryPosts(posts, "位置编码", { limit: 10, offset: 0 }).results.map(
        item => item.slug
      )
    ).toEqual(["rope-frequency"]);
    expect(
      searchDiscoveryPosts(posts, "强化学习 后训练", {
        limit: 10,
        offset: 0,
      }).results.map(item => item.slug)
    ).toEqual(["llm-rl"]);
    expect(
      searchDiscoveryPosts(posts, "偏好优化", {
        limit: 10,
        offset: 0,
      }).results.map(item => item.slug)
    ).toEqual(["llm-rl"]);
    expect(
      searchDiscoveryPosts(posts, "hidden 智能体", { limit: 10, offset: 0 }).results.map(
        item => item.slug
      )
    ).not.toContain("hidden-harness-note");
  });

  it("does not expand latin aliases from arbitrary substrings", () => {
    const isoPost = post({
      id: 9,
      title: "IsoHC Residual Mixing",
      slug: "isohc-residual-mixing",
      category: algorithms,
      content: "Fixed-vector isometric residual stability.",
      publishedAt: new Date("2026-04-18T00:00:00.000Z"),
    });

    expect(
      searchDiscoveryPosts([...posts, isoPost], "iso", {
        limit: 10,
        offset: 0,
      }).results.map(item => item.slug)
    ).toEqual(["isohc-residual-mixing"]);
    expect(
      searchDiscoveryPosts([...posts, isoPost], "isolation", {
        limit: 10,
        offset: 0,
      }).results.map(item => item.slug)
    ).not.toContain("isohc-residual-mixing");
  });

  it("paginates after filtering the complete public corpus", () => {
    const result = searchDiscoveryPosts(posts, "agent", { limit: 1, offset: 1 });

    expect(result.total).toBe(3);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].slug).toBe("agent-harness");
  });

  it("filters tag and category pages to public matching posts only", () => {
    expect(filterPostsByTag(posts, "harness-engine").map((item) => item.slug)).toEqual([
      "agent-harness",
    ]);
    expect(filterPostsByCategory(posts, "ai-applications").map((item) => item.slug)).toEqual([
      "agent-harness",
      "retrieval-latency",
    ]);
  });

  it("groups archive rows by published month in scan-friendly order", () => {
    const groups = groupArchivePosts(posts);

    expect(groups.map((group) => group.key)).toEqual(["2026-06", "2026-05", "2026-04"]);
    expect(groups[0].posts.map((item) => item.slug)).toEqual(["llm-rl"]);
    expect(groups[1].posts.map((item) => item.slug)).toEqual(["agent-harness", "retrieval-latency"]);
    expect(groups[2].posts[0]).toMatchObject({
      slug: "rope-frequency",
      updatedAt: new Date("2026-04-20T00:00:00.000Z"),
    });
  });

  it("returns previous and next public posts around the current publish date", () => {
    const adjacent = getAdjacentPosts(posts[1], posts);

    expect(adjacent.next?.slug).toBe("agent-harness");
    expect(adjacent.previous?.slug).toBe("rope-frequency");
  });

  it("ranks related posts by shared tags, category match, and recent publish date", () => {
    const current = post({
      id: 10,
      title: "Current Harness Note",
      slug: "current-harness-note",
      category: applications,
      tags: [harnessTag, contextTag],
      publishedAt: new Date("2026-05-20T00:00:00.000Z"),
    });
    const candidates = [
      ...posts,
      post({
        id: 7,
        title: "Same Category Only",
        slug: "same-category-only",
        category: applications,
        tags: [],
        publishedAt: new Date("2026-05-18T00:00:00.000Z"),
      }),
      post({
        id: 8,
        title: "Shared Tag Elsewhere",
        slug: "shared-tag-elsewhere",
        category: algorithms,
        tags: [contextTag],
        publishedAt: new Date("2026-05-19T00:00:00.000Z"),
      }),
    ];

    expect(rankRelatedPosts(current, candidates, 4).map((item) => item.slug)).toEqual([
      "agent-harness",
      "retrieval-latency",
      "shared-tag-elsewhere",
      "same-category-only",
    ]);
  });
});
