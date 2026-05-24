import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { ENV } from "./_core/env";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

const seededPost = {
  id: 1,
  title: "EVQ-Cosh: RoPE as a Finite Spectral Budget",
  slug: "evq-cosh-frequency-allocation",
  content: "Seeded post content",
  excerpt:
    "EVQ-Cosh treats RoPE inverse frequencies as a finite spectral allocation problem.",
  coverImage: null,
  status: "published" as const,
  categoryId: 1,
  authorId: 1,
  viewCount: 0,
  publishedAt: new Date("2026-01-01T00:00:00.000Z"),
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

vi.mock("./db", () => ({
  getPosts: vi.fn(async () => [seededPost]),
  getPostsCount: vi.fn(async () => 1),
  getPostBySlug: vi.fn(async (slug: string) =>
    slug === seededPost.slug ? seededPost : null
  ),
  incrementViewCount: vi.fn(async () => undefined),
  getCategories: vi.fn(async () => [
    {
      id: 1,
      name: "Deep Learning",
      slug: "deep-learning",
      description:
        "Deep learning, Transformers, position encoding, and residual stability research",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
  ]),
  getTags: vi.fn(async () => [
    {
      id: 1,
      name: "Transformer",
      slug: "transformer",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    },
  ]),
  createPost: vi.fn(async () => 2),
  getPostById: vi.fn(async (id: number) => ({
    ...seededPost,
    id,
    title: "Owner Draft",
    slug: "owner-draft",
    status: "draft",
  })),
  setPostTags: vi.fn(async () => undefined),
}));

// Create context for the blog owner
function createOwnerContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: ENV.ownerOpenId, // Use the actual owner's openId
    email: "owner@example.com",
    name: "Blog Owner",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

// Create context for a regular user (not the owner)
function createRegularUserContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user-id", // Different from owner
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

// Create anonymous context (not logged in)
function createAnonymousContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createCookieContext(cookie: string): { ctx: TrpcContext; setCookies: string[] } {
  const setCookies: string[] = [];
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {
        cookie,
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
  };

  return { ctx, setCookies };
}

function createCookieCaptureContext(): { ctx: TrpcContext; setCookies: string[] } {
  return createCookieContext("");
}

function getCookiePair(setCookie: string) {
  return setCookie.split(";")[0];
}

describe("posts router", () => {
  it("should list published posts for anonymous users", async () => {
    const { ctx } = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.posts.list({
      status: "published",
      limit: 10,
      offset: 0,
      orderBy: "createdAt",
    });

    expect(result).toHaveProperty('posts');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.posts)).toBe(true);
  });

  it("should get post by slug", async () => {
    const { ctx } = createOwnerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.posts.getBySlug("evq-cosh-frequency-allocation");

    expect(result).toBeDefined();
    expect(result?.title).toContain("EVQ-Cosh");
    expect(result?.status).toBe("published");
  });
});

describe("auth router", () => {
  it("should return false for isAdmin when no admin cookie", async () => {
    const { ctx } = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.isAdmin();

    expect(result).toBe(false);
  });

  it("should return false for isAdmin for regular user without cookie", async () => {
    const { ctx } = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.isAdmin();

    expect(result).toBe(false);
  });

  it("creates a visitor JWT session without granting admin privileges", async () => {
    const { ctx, setCookies } = createCookieCaptureContext();
    const caller = appRouter.createCaller(ctx);

    const login = await caller.auth.visitorLogin({ nickname: "Reader One" });

    expect(login).toMatchObject({
      success: true,
      session: {
        isAuthenticated: true,
        isAdmin: false,
        role: "visitor",
        displayName: "Reader One",
      },
    });
    expect(setCookies.some((cookie) => cookie.startsWith("visitor_session="))).toBe(true);

    const sessionCookie = getCookiePair(
      setCookies.find((cookie) => cookie.startsWith("visitor_session="))!
    );
    const { ctx: sessionCtx } = createCookieContext(sessionCookie);
    const sessionCaller = appRouter.createCaller(sessionCtx);

    await expect(
      sessionCaller.posts.create({
        title: "Visitor Draft",
        slug: "visitor-draft",
        content: "Nope",
        status: "draft",
        tagIds: [],
      })
    ).rejects.toThrow();

    expect(await sessionCaller.auth.isAdmin()).toBe(false);
    expect(await sessionCaller.auth.session()).toMatchObject({
      isAuthenticated: true,
      isAdmin: false,
      role: "visitor",
      displayName: "Reader One",
    });
  });

  it("creates a signed admin JWT session that unlocks owner-only procedures", async () => {
    const { ctx, setCookies } = createCookieCaptureContext();
    const caller = appRouter.createCaller(ctx);

    const login = await caller.auth.adminLogin({ password: process.env.ADMIN_PASSWORD || "admin123" });

    expect(login).toEqual({ success: true });
    expect(setCookies.some((cookie) => cookie.startsWith("admin_session="))).toBe(true);

    const adminCookie = getCookiePair(
      setCookies.find((cookie) => cookie.startsWith("admin_session="))!
    );
    const { ctx: adminCtx } = createCookieContext(adminCookie);
    const adminCaller = appRouter.createCaller(adminCtx);

    expect(await adminCaller.auth.isAdmin()).toBe(true);
    expect(await adminCaller.auth.session()).toMatchObject({
      isAuthenticated: true,
      isAdmin: true,
      role: "admin",
    });

    await expect(
      adminCaller.posts.create({
        title: "Owner Draft",
        slug: "owner-draft",
        content: "Draft content",
        status: "draft",
        tagIds: [],
      })
    ).resolves.toMatchObject({
      title: "Owner Draft",
      status: "draft",
    });
  });
});

describe("owner-only operations", () => {
  it("should reject post creation from non-owner users", async () => {
    const { ctx } = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.posts.create({
        title: "Test Post",
        slug: "test-post",
        content: "Test content",
        status: "draft",
        tagIds: [],
      })
    ).rejects.toThrow();
  });

  it("should reject category creation from non-owner users", async () => {
    const { ctx } = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.categories.create({
        name: "Test Category",
        slug: "test-category",
      })
    ).rejects.toThrow();
  });

  it("should reject tag creation from non-owner users", async () => {
    const { ctx } = createRegularUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.tags.create({
        name: "Test Tag",
        slug: "test-tag",
      })
    ).rejects.toThrow();
  });
});

describe("categories router", () => {
  it("should list all categories for anyone", async () => {
    const { ctx } = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.categories.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("slug");
  });
});

describe("tags router", () => {
  it("should list all tags for anyone", async () => {
    const { ctx } = createAnonymousContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tags.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("slug");
  });
});
