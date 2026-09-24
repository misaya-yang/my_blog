import { beforeEach, describe, expect, it, vi } from "vitest";

const post = {
  id: 7,
  slug: "kept",
  title: "Kept",
  content: "Body",
  status: "published",
  visibility: "public",
  category: null,
  tags: [],
};

vi.mock("./db.js", () => ({
  getPostWithRelationsBySlug: vi.fn(),
}));
vi.mock("./publicSeedPosts.js", () => ({
  getPublicSeedArticleBySlug: vi.fn(async () => null),
}));
vi.mock("./_core/env.js", () => ({ ENV: { isProduction: true } }));

import * as db from "./db.js";
import { invalidatePublicArticles, loadPublicArticle } from "./publicArticle";

const read = vi.mocked(db.getPostWithRelationsBySlug);

describe("public article cache", () => {
  beforeEach(() => {
    invalidatePublicArticles();
    read.mockReset();
  });

  it("reads once for concurrent and repeated requests within a minute", async () => {
    read.mockResolvedValue(post as never);
    const [a, b] = await Promise.all([
      loadPublicArticle("kept"),
      loadPublicArticle("kept"),
    ]);
    expect(await loadPublicArticle("kept")).toBe(a);
    expect(b).toBe(a);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("reads again after a post mutation invalidates it", async () => {
    read.mockResolvedValue(post as never);
    await loadPublicArticle("kept");
    invalidatePublicArticles();
    await loadPublicArticle("kept");
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("does not keep a failed read", async () => {
    read.mockRejectedValueOnce(new Error("timeout"));
    await expect(loadPublicArticle("kept")).rejects.toThrow("timeout");
    read.mockResolvedValue(post as never);
    await expect(loadPublicArticle("kept")).resolves.toMatchObject({ id: 7 });
  });

  it("never hands out drafts or owner-only posts", async () => {
    read.mockResolvedValue({ ...post, status: "draft" } as never);
    expect(await loadPublicArticle("kept")).toBeNull();
    invalidatePublicArticles();
    read.mockResolvedValue({ ...post, visibility: "admin" } as never);
    expect(await loadPublicArticle("kept")).toBeNull();
  });
});
