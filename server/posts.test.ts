import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { ENV } from "./_core/env";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

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

    const result = await caller.posts.getBySlug("dynamic-frequency-rope");

    expect(result).toBeDefined();
    expect(result?.title).toContain("Dynamic Frequency RoPE");
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
