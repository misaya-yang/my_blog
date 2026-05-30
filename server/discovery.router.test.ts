import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

const publishedAt = new Date("2026-05-10T00:00:00.000Z");

const category = {
  id: 2,
  name: "AI Applications",
  slug: "ai-applications",
  description: "Agent systems",
  createdAt: publishedAt,
  updatedAt: publishedAt,
};

const tag = {
  id: 1,
  name: "Harness Engine",
  slug: "harness-engine",
  createdAt: publishedAt,
};

const discoveryPost = {
  id: 1,
  title: "Agent Harness Engine",
  slug: "agent-harness-engine-evaluating-tool-using-agents",
  content: "Agent context and evaluation harnesses",
  excerpt: "A harness engine makes tool-using agents observable.",
  coverImage: null,
  status: "published" as const,
  visibility: "public" as const,
  categoryId: category.id,
  authorId: 1,
  viewCount: 0,
  publishedAt,
  createdAt: publishedAt,
  updatedAt: publishedAt,
  category,
  tags: [tag],
  readingMinutes: 1,
};

vi.mock("./db", () => ({
  searchPublicPosts: vi.fn(async () => ({ results: [discoveryPost], total: 1 })),
  getPublicTagPage: vi.fn(async () => ({
    tag,
    posts: [discoveryPost],
    total: 1,
    siblingTags: [],
  })),
  getPublicCategoryPage: vi.fn(async () => ({
    category,
    posts: [discoveryPost],
    total: 1,
    siblingTags: [tag],
  })),
  getPublicArchive: vi.fn(async () => [
    {
      key: "2026-05",
      year: 2026,
      month: 5,
      posts: [discoveryPost],
    },
  ]),
  getPublicPostContext: vi.fn(async () => ({
    previous: null,
    next: null,
    related: [discoveryPost],
  })),
}));

function createAnonymousContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("discovery router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("searches public posts with normalized pagination input", async () => {
    const caller = appRouter.createCaller(createAnonymousContext());

    const result = await caller.discovery.search({
      query: " agent ",
      limit: 100,
      offset: -1,
    });

    expect(result.total).toBe(1);
    expect(db.searchPublicPosts).toHaveBeenCalledWith({
      query: "agent",
      limit: 50,
      offset: 0,
    });
  });

  it("returns tag, category, archive, and post context discovery payloads", async () => {
    const caller = appRouter.createCaller(createAnonymousContext());

    await expect(caller.discovery.tag({ slug: "harness-engine" })).resolves.toMatchObject({
      tag: { slug: "harness-engine" },
      total: 1,
    });
    await expect(caller.discovery.category({ slug: "ai-applications" })).resolves.toMatchObject({
      category: { slug: "ai-applications" },
      total: 1,
    });
    await expect(caller.discovery.archive()).resolves.toHaveLength(1);
    await expect(
      caller.discovery.postContext({
        slug: "agent-harness-engine-evaluating-tool-using-agents",
      })
    ).resolves.toMatchObject({
      related: [{ slug: "agent-harness-engine-evaluating-tool-using-agents" }],
    });
  });
});
