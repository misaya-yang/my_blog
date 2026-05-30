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
    id === publishedPost.id ? publishedPost : id === privatePost.id ? privatePost : null
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
  listSubscribers: vi.fn(async () => [subscriber]),
}));

function createContext(cookie = "", source = "203.0.113.10"): { ctx: TrpcContext; setCookies: string[] } {
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
  await caller.auth.adminLogin({ password: process.env.ADMIN_PASSWORD || "admin123" });
  const adminCookie = getCookiePair(
    setCookies.find((cookie) => cookie.startsWith("admin_session="))!
  );
  return routers.appRouter.createCaller(createContext(adminCookie, "203.0.113.100").ctx);
}

describe("engagement router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (routers as { __resetEngagementRateLimitsForTests?: () => void })
      .__resetEngagementRateLimitsForTests?.();
  });

  it("validates subscription email before storing intent", async () => {
    const caller = routers.appRouter.createCaller(createContext().ctx) as any;

    await expect(caller.engagement.subscribe({ email: "not-an-email" })).rejects.toThrow();

    expect(db.upsertSubscriber).not.toHaveBeenCalled();
  });

  it("returns deterministic duplicate subscription status", async () => {
    vi.mocked(db.upsertSubscriber).mockResolvedValueOnce({ subscriber, created: false });
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
    const caller = routers.appRouter.createCaller(createContext("", "203.0.113.11").ctx) as any;

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

  it("captures visitor identity when feedback comes from a visitor session", async () => {
    const { ctx, setCookies } = createContext("", "203.0.113.12");
    const loginCaller = routers.appRouter.createCaller(ctx);
    const login = await loginCaller.auth.visitorLogin({ nickname: "Reader One" });
    const visitorCookie = getCookiePair(
      setCookies.find((cookie) => cookie.startsWith("visitor_session="))!
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
      caller.engagement.feedback.create({ postId: privatePost.id, type: "useful" })
    ).rejects.toThrow("Post not found");
    await expect(
      caller.engagement.feedback.create({ postId: 999, type: "useful" })
    ).rejects.toThrow("Post not found");
  });

  it("keeps feedback and subscriber lists owner-only", async () => {
    const anonymousCaller = routers.appRouter.createCaller(createContext().ctx) as any;

    await expect(anonymousCaller.engagement.feedback.list({})).rejects.toThrow(
      "Admin authentication required"
    );
    await expect(anonymousCaller.engagement.subscribers.list()).rejects.toThrow(
      "Admin authentication required"
    );

    const adminCaller = (await createAdminCaller()) as any;

    await expect(adminCaller.engagement.feedback.list({ limit: 5 })).resolves.toEqual([feedback]);
    await expect(adminCaller.engagement.subscribers.list()).resolves.toEqual([subscriber]);
  });

  it("lets the owner mark feedback as reviewed", async () => {
    const adminCaller = (await createAdminCaller()) as any;

    const result = await adminCaller.engagement.feedback.markReviewed({ id: feedback.id });

    expect(result).toMatchObject({ success: true, feedback: { id: feedback.id, status: "reviewed" } });
    expect(db.markPostFeedbackReviewed).toHaveBeenCalledWith(feedback.id);
  });

  it("rate limits repeated subscription and feedback submissions by source", async () => {
    const caller = routers.appRouter.createCaller(createContext("", "203.0.113.88").ctx) as any;

    for (let attempt = 0; attempt < 4; attempt++) {
      await caller.engagement.subscribe({ email: `reader-${attempt}@example.com` });
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
