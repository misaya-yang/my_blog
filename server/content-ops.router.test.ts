import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

const now = new Date("2026-05-30T00:00:00.000Z");

const currentPost = {
  id: 7,
  title: "Current title",
  slug: "current-title",
  content: "Current content",
  excerpt: "Current excerpt",
  coverImage: null,
  status: "draft" as const,
  visibility: "admin" as const,
  categoryId: 1,
  authorId: 1,
  viewCount: 0,
  publishedAt: null,
  createdAt: now,
  updatedAt: now,
  seriesSlug: null,
  seriesTitle: null,
  seriesOrder: null,
  featuredRank: null,
  pinnedTrack: null,
};

const previousVersion = {
  id: 12,
  postId: currentPost.id,
  title: "Previous title",
  content: "Previous content",
  createdAt: new Date("2026-05-29T00:00:00.000Z"),
};

vi.mock("./db", () => ({
  getTagBySlug: vi.fn(async (slug: string) =>
    slug === "duplicate-tag"
      ? { id: 99, name: "Duplicate", slug, createdAt: now }
      : slug === "same-tag"
        ? { id: 3, name: "Same", slug, createdAt: now }
        : null
  ),
  updateTag: vi.fn(async (id: number, input: { name?: string; slug?: string }) => ({
    id,
    name: input.name ?? "Updated Tag",
    slug: input.slug ?? "updated-tag",
    createdAt: now,
  })),
  getPostsCount: vi.fn(async (params: { categoryId?: number }) =>
    params.categoryId === 1 ? 2 : 0
  ),
  deleteCategory: vi.fn(async () => undefined),
  getTagUsageCount: vi.fn(async (id: number) => (id === 4 ? 3 : 0)),
  deleteTag: vi.fn(async () => undefined),
  getPostById: vi.fn(async (id: number) => (id === currentPost.id ? currentPost : null)),
  getPostVersionById: vi.fn(async (id: number) => (id === previousVersion.id ? previousVersion : null)),
  createPostVersion: vi.fn(async () => 13),
  updatePost: vi.fn(async () => undefined),
}));

function createContext(cookie = ""): { ctx: TrpcContext; setCookies: string[] } {
  const setCookies: string[] = [];
  return {
    setCookies,
    ctx: {
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
    },
  };
}

function getCookiePair(setCookie: string) {
  return setCookie.split(";")[0];
}

async function createAdminCaller() {
  const { ctx, setCookies } = createContext();
  const caller = appRouter.createCaller(ctx);
  await caller.auth.adminLogin({ password: process.env.ADMIN_PASSWORD || "admin123" });
  const adminCookie = getCookiePair(
    setCookies.find((cookie) => cookie.startsWith("admin_session="))!
  );
  return appRouter.createCaller(createContext(adminCookie).ctx);
}

describe("content ops router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a tag when the target slug is unique", async () => {
    const caller = await createAdminCaller();

    await expect(
      caller.tags.update({ id: 3, name: "Agent Harness", slug: "agent-harness" })
    ).resolves.toMatchObject({
      id: 3,
      name: "Agent Harness",
      slug: "agent-harness",
    });

    expect(db.updateTag).toHaveBeenCalledWith(3, {
      name: "Agent Harness",
      slug: "agent-harness",
    });
  });

  it("rejects tag updates that would collide with another slug", async () => {
    const caller = await createAdminCaller();

    await expect(
      caller.tags.update({ id: 3, name: "Duplicate", slug: "duplicate-tag" })
    ).rejects.toThrow("Tag slug already exists");

    expect(db.updateTag).not.toHaveBeenCalled();
  });

  it("blocks category deletion when posts still use the category", async () => {
    const caller = await createAdminCaller();

    await expect(caller.categories.delete(1)).rejects.toThrow("Category still has posts");
    expect(db.deleteCategory).not.toHaveBeenCalled();
  });

  it("blocks tag deletion when posts still use the tag", async () => {
    const caller = await createAdminCaller();

    await expect(caller.tags.delete(4)).rejects.toThrow("Tag still has posts");
    expect(db.deleteTag).not.toHaveBeenCalled();
  });

  it("restores a version and saves the current content first", async () => {
    const caller = await createAdminCaller();

    const result = await caller.posts.restoreVersion({
      postId: currentPost.id,
      versionId: previousVersion.id,
      saveCurrent: true,
    });

    expect(result).toEqual({ success: true });
    expect(db.createPostVersion).toHaveBeenCalledWith({
      postId: currentPost.id,
      title: currentPost.title,
      content: currentPost.content,
    });
    expect(db.updatePost).toHaveBeenCalledWith(currentPost.id, {
      title: previousVersion.title,
      content: previousVersion.content,
    });
  });

  it("keeps content ops procedures owner-only", async () => {
    const caller = appRouter.createCaller(createContext().ctx);

    await expect(
      caller.tags.update({ id: 3, name: "Agent Harness", slug: "agent-harness" })
    ).rejects.toThrow("Admin authentication required");
    await expect(
      caller.posts.restoreVersion({ postId: currentPost.id, versionId: previousVersion.id })
    ).rejects.toThrow("Admin authentication required");
  });
});
