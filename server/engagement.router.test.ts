import { beforeEach, describe, expect, it, vi } from "vitest";
import * as routers from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

const publishedPost = {
  id: 1,
  title: "Agent Harness Engine",
  slug: "agent-harness-engine",
  content: "Public article content",
  excerpt: "Public excerpt",
  coverImage: null,
  status: "published" as const,
  visibility: "public" as const,
  categoryId: 1,
  authorId: 1,
  viewCount: 0,
  publishedAt: new Date("2026-05-10T00:00:00.000Z"),
  createdAt: new Date("2026-05-10T00:00:00.000Z"),
  updatedAt: new Date("2026-05-10T00:00:00.000Z"),
};

const privatePost = {
  ...publishedPost,
  id: 2,
  slug: "private-draft",
  status: "draft" as const,
  visibility: "admin" as const,
  publishedAt: null,
};

const subscriber = {
  id: 1,
  email: "reader@example.com",
  preferredLanguage: "zh",
  interests: "RoPE, agents",
  source: "203.0.113.10",
  status: "active" as const,
  createdAt: new Date("2026-05-20T00:00:00.000Z"),
  updatedAt: new Date("2026-05-20T00:00:00.000Z"),
};

const feedback = {
  id: 11,
  postId: publishedPost.id,
  postTitle: publishedPost.title,
  postSlug: publishedPost.slug,
  visitorId: null,
  visitorName: "Anonymous reader",
  type: "useful" as const,
  message: "Clear and helpful.",
  replyEmail: null,
  status: "new" as const,
  source: "203.0.113.11",
  userAgent: "vitest",
  createdAt: new Date("2026-05-20T00:00:00.000Z"),
  reviewedAt: null,
};

vi.mock("./db", () => ({
  getPostById: vi.fn(async (id: number) =>
    id === publishedPost.id
      ? publishedPost
      : id === privatePost.id
        ? privatePost
        : null
  ),
  upsertSubscriber: vi.fn(async () => ({ subscriber, created: true })),
  createPostFeedback: vi.fn(async () => feedback),
  listPostFeedback: vi.fn(async () => [feedback]),
  markPostFeedbackReviewed: vi.fn(async (id: number) => ({
    ...feedback,
    id,
    status: "reviewed",
    reviewedAt: new Date("2026-05-21T00:00:00.000Z"),
  })),
  updatePostFeedbackStatus: vi.fn(
    async (id: number, status: "new" | "reviewed" | "hidden") => ({
      ...feedback,
      id,
      status,
      reviewedAt:
        status === "new" ? null : new Date("2026-05-21T00:00:00.000Z"),
    })
  ),
  listSubscribers: vi.fn(async () => [subscriber]),
  searchPublicPosts: vi.fn(async () => ({ results: [], total: 0 })),
}));

function createContext(
  cookie = "",
  source = "203.0.113.10"
): { ctx: TrpcContext; setCookies: string[] } {
  const setCookies: string[] = [];
  return {
    setCookies,
    ctx: {
      user: null,
      req: {
        protocol: "https",
        headers: {
          cookie,
          "user-agent": "vitest",
          "x-forwarded-for": source,
          "x-forwarded-proto": "https",
        },
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
        setHeader: (name: string, value: string | string[]) => {
          if (name.toLowerCase() === "set-cookie") {
            setCookies.push(...(Array.isArray(value) ? value : [value]));
          }
        },
      } as unknown as TrpcContext["res"],
    },
  };
}

function getCookiePair(setCookie: string) {
  return setCookie.split(";")[0];
}

async function createAdminCaller() {
  const { ctx, setCookies } = createContext("", "203.0.113.100");
  const caller = routers.appRouter.createCaller(ctx);
  await caller.auth.adminLogin({
    password: process.env.ADMIN_PASSWORD || "admin123",
  });
  const adminCookie = getCookiePair(
    setCookies.find(cookie => cookie.startsWith("admin_session="))!
  );
  return routers.appRouter.createCaller(
    createContext(adminCookie, "203.0.113.100").ctx
  );
}

describe("engagement router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (
      routers as { __resetEngagementRateLimitsForTests?: () => void }
    ).__resetEngagementRateLimitsForTests?.();
  });

  it("validates subscription email before storing intent", async () => {
    const caller = routers.appRouter.createCaller(createContext().ctx) as any;

    await expect(
      caller.engagement.subscribe({ email: "not-an-email" })
    ).rejects.toThrow();

    expect(db.upsertSubscriber).not.toHaveBeenCalled();
  });

  it("returns deterministic duplicate subscription status", async () => {
    vi.mocked(db.upsertSubscriber).mockResolvedValueOnce({
      subscriber,
      created: false,
    });
    const caller = routers.appRouter.createCaller(createContext().ctx) as any;

    const result = await caller.engagement.subscribe({
      email: "Reader@Example.com ",
      preferredLanguage: "zh",
      interests: " RoPE, agents ",
    });

    expect(result).toEqual({ success: true, status: "existing" });
    expect(db.upsertSubscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "reader@example.com",
        preferredLanguage: "zh",
        interests: "RoPE, agents",
        source: "203.0.113.10",
      })
    );
  });

  it("allows anonymous readers to submit feedback on public posts", async () => {
    const caller = routers.appRouter.createCaller(
      createContext("", "203.0.113.11").ctx
    ) as any;

    const result = await caller.engagement.feedback.create({
      postId: publishedPost.id,
      type: "useful",
      message: " Clear and helpful. ",
    });

    expect(result).toEqual({ success: true, status: "new" });
    expect(db.createPostFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: publishedPost.id,
        visitorId: null,
        visitorName: null,
        type: "useful",
        message: "Clear and helpful.",
        source: "203.0.113.11",
        userAgent: "vitest",
      })
    );
  });

  it("stores optional structured feedback reason in the private message", async () => {
    const caller = routers.appRouter.createCaller(
      createContext("", "203.0.113.13").ctx
    ) as any;

    await caller.engagement.feedback.create({
      postId: publishedPost.id,
      type: "not_useful",
      reason: "needs_example",
      message: "Show a shorter implementation path.",
    });

    expect(db.createPostFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: publishedPost.id,
        type: "not_useful",
        message:
          "Feedback reason: needs_example\n\nShow a shorter implementation path.",
      })
    );
  });

  it("rejects unknown feedback reason values", async () => {
    const caller = routers.appRouter.createCaller(
      createContext("", "203.0.113.14").ctx
    ) as any;

    await expect(
      caller.engagement.feedback.create({
        postId: publishedPost.id,
        type: "not_useful",
        reason: "marketing_followup",
      })
    ).rejects.toThrow();

    expect(db.createPostFeedback).not.toHaveBeenCalled();
  });

  it("captures visitor identity when feedback comes from a visitor session", async () => {
    const { ctx, setCookies } = createContext("", "203.0.113.12");
    const loginCaller = routers.appRouter.createCaller(ctx);
    const login = await loginCaller.auth.visitorLogin({
      nickname: "Reader One",
    });
    const visitorCookie = getCookiePair(
      setCookies.find(cookie => cookie.startsWith("visitor_session="))!
    );
    const caller = routers.appRouter.createCaller(
      createContext(visitorCookie, "203.0.113.12").ctx
    ) as any;

    await caller.engagement.feedback.create({
      postId: publishedPost.id,
      type: "not_useful",
      message: "Need more implementation detail.",
    });

    expect(db.createPostFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        visitorId: login.session.visitorId,
        visitorName: "Reader One",
        type: "not_useful",
      })
    );
  });

  it("rejects feedback for private or missing posts", async () => {
    const caller = routers.appRouter.createCaller(createContext().ctx) as any;

    await expect(
      caller.engagement.feedback.create({
        postId: privatePost.id,
        type: "useful",
      })
    ).rejects.toThrow("Post not found");
    await expect(
      caller.engagement.feedback.create({ postId: 999, type: "useful" })
    ).rejects.toThrow("Post not found");
  });

  it("keeps feedback and subscriber lists owner-only", async () => {
    const anonymousCaller = routers.appRouter.createCaller(
      createContext().ctx
    ) as any;

    await expect(anonymousCaller.engagement.feedback.list({})).rejects.toThrow(
      "Admin authentication required"
    );
    await expect(anonymousCaller.engagement.subscribers.list()).rejects.toThrow(
      "Admin authentication required"
    );

    const adminCaller = (await createAdminCaller()) as any;

    await expect(
      adminCaller.engagement.feedback.list({ limit: 5 })
    ).resolves.toEqual([feedback]);
    await expect(adminCaller.engagement.subscribers.list()).resolves.toEqual([
      subscriber,
    ]);
  });

  it("lets the owner mark feedback as reviewed", async () => {
    const adminCaller = (await createAdminCaller()) as any;

    const result = await adminCaller.engagement.feedback.markReviewed({
      id: feedback.id,
    });

    expect(result).toMatchObject({
      success: true,
      feedback: { id: feedback.id, status: "reviewed" },
    });
    expect(db.markPostFeedbackReviewed).toHaveBeenCalledWith(feedback.id);
  });

  it("lets the owner triage feedback status including hidden", async () => {
    const adminCaller = (await createAdminCaller()) as any;

    const result = await adminCaller.engagement.feedback.updateStatus({
      id: feedback.id,
      status: "hidden",
    });

    expect(result).toMatchObject({
      success: true,
      feedback: { id: feedback.id, status: "hidden" },
    });
    expect(db.updatePostFeedbackStatus).toHaveBeenCalledWith(
      feedback.id,
      "hidden"
    );
  });

  it("summarizes private engagement signals without exposing emails", async () => {
    vi.mocked(db.listPostFeedback).mockResolvedValueOnce([
      feedback,
      {
        ...feedback,
        id: 12,
        type: "not_useful",
        message: "Need implementation examples. Email me at followup@example.com.",
        replyEmail: "followup@example.com",
      },
    ]);
    vi.mocked(db.listSubscribers).mockResolvedValueOnce([
      subscriber,
      {
        ...subscriber,
        id: 2,
        email: "builder@example.com",
        preferredLanguage: "en",
        interests: "agents, retrieval eval",
      },
    ]);
    const adminCaller = (await createAdminCaller()) as any;

    const summary = await adminCaller.engagement.contentRadar.summary();

    expect(summary.feedback.opportunities[0]).toMatchObject({
      postSlug: publishedPost.slug,
      total: 2,
      notUseful: 1,
      messageCount: 2,
    });
    expect(summary.writingBacklog[0]).toMatchObject({
      kind: "feedback",
      title: publishedPost.title,
      priority: "high",
      status: "new",
    });
    expect(summary.writingBacklog[0].draftHref).toContain(
      `article=${publishedPost.slug}`
    );
    expect(summary.writingBacklog[0].draftHref).toContain("source=feedback");
    expect(summary.readerSignals).toMatchObject({
      total: 1,
      items: [
        expect.objectContaining({
          id: "article_feedback:agent-harness-engine:not_useful",
          kind: "article_feedback",
          severity: "high",
          articleSlug: publishedPost.slug,
          count: 2,
        }),
      ],
    });
    expect(summary.subscriptions).toMatchObject({
      total: 2,
      activeCount: 2,
      languageBreakdown: { zh: 1, en: 1, unknown: 0 },
      delivery: {
        connected: false,
        status: "stored_only",
        exportAvailable: true,
      },
    });
    expect(
      summary.subscriptions.topInterests.map((item: any) => item.phrase)
    ).toContain("agents");
    expect(JSON.stringify(summary)).not.toContain("reader@example.com");
    expect(JSON.stringify(summary)).not.toContain("followup@example.com");
    expect(summary.writingBacklog[0].draftHref).not.toContain("followup");
    expect(JSON.stringify(summary)).toContain("[redacted-email]");
  });

  it("turns zero-result searches into owner-only content opportunities", async () => {
    vi.mocked(db.searchPublicPosts).mockResolvedValue({
      results: [],
      total: 0,
    } as any);
    const query = "uncovered agent memory pattern from reader@example.com";
    const anonymousCaller = routers.appRouter.createCaller(
      createContext("", "203.0.113.120").ctx
    ) as any;

    await anonymousCaller.discovery.search({ query, limit: 20, offset: 0 });
    await anonymousCaller.discovery.search({ query: `  ${query}  ` });
    await expect(
      anonymousCaller.engagement.contentRadar.summary()
    ).rejects.toThrow("Admin authentication required");

    const adminCaller = (await createAdminCaller()) as any;
    const summary = await adminCaller.engagement.contentRadar.summary();

    expect(summary.searchMisses).toMatchObject({
      total: 2,
      uniqueQueries: 1,
      opportunities: [
        expect.objectContaining({
          query: "uncovered agent memory pattern from [redacted-email]",
          normalizedQuery:
            "uncovered agent memory pattern from [redacted-email]",
          count: 2,
        }),
      ],
    });
    expect(summary.searchMisses.opportunities[0].suggestedPrompt).toContain(
      "uncovered agent memory pattern"
    );
    expect(summary.writingBacklog[0]).toMatchObject({
      kind: "search_miss",
      priority: "high",
      status: "new",
    });
    expect(summary.readerSignals.total).toBe(2);
    expect(summary.readerSignals.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "search_miss:uncovered agent memory pattern from [redacted-email]",
          kind: "search_miss",
          severity: "high",
          query: "uncovered agent memory pattern from [redacted-email]",
          count: 2,
        }),
      ])
    );
    expect(summary.writingBacklog[0].draftHref).toContain("/write?idea=");
    expect(summary.writingBacklog[0].draftHref).toContain(
      "source=search_miss"
    );
    expect(summary.writingBacklog[0].draftHref).not.toContain("article=");
    expect(JSON.stringify(summary.searchMisses)).not.toContain("203.0.113.120");
    expect(JSON.stringify(summary.searchMisses)).not.toContain(
      "reader@example.com"
    );
    expect(JSON.stringify(summary.readerSignals)).not.toContain(
      "reader@example.com"
    );
  });

  it("rate limits repeated subscription and feedback submissions by source", async () => {
    const caller = routers.appRouter.createCaller(
      createContext("", "203.0.113.88").ctx
    ) as any;

    for (let attempt = 0; attempt < 4; attempt++) {
      await caller.engagement.subscribe({
        email: `reader-${attempt}@example.com`,
      });
    }
    await expect(
      caller.engagement.subscribe({ email: "reader-limited@example.com" })
    ).rejects.toThrow("Too many engagement submissions");

    const feedbackCaller = routers.appRouter.createCaller(
      createContext("", "203.0.113.89").ctx
    ) as any;
    for (let attempt = 0; attempt < 4; attempt++) {
      await feedbackCaller.engagement.feedback.create({
        postId: publishedPost.id,
        type: "useful",
        message: `Feedback ${attempt}`,
      });
    }
    await expect(
      feedbackCaller.engagement.feedback.create({
        postId: publishedPost.id,
        type: "useful",
        message: "Feedback limited",
      })
    ).rejects.toThrow("Too many engagement submissions");
  });
});
