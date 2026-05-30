import { describe, expect, it } from "vitest";
import { getContentHealthSummary, sortCuratedPosts } from "./content-ops";

const basePost = {
  id: 1,
  title: "Base",
  slug: "base",
  content: "Content",
  excerpt: "Excerpt",
  coverImage: "https://example.com/cover.png",
  status: "published" as const,
  visibility: "public" as const,
  categoryId: 1,
  authorId: 1,
  viewCount: 0,
  publishedAt: new Date("2026-05-01T00:00:00.000Z"),
  createdAt: new Date("2026-05-01T00:00:00.000Z"),
  updatedAt: new Date("2026-05-01T00:00:00.000Z"),
  tags: [{ id: 1, name: "Agent", slug: "agent" }],
  featuredRank: null,
  seriesSlug: null,
  seriesTitle: null,
  seriesOrder: null,
  pinnedTrack: null,
};

describe("content ops helpers", () => {
  it("sorts featured posts deterministically by rank, date, then title", () => {
    const posts = [
      {
        ...basePost,
        id: 1,
        title: "B",
        featuredRank: 2,
        publishedAt: new Date("2026-05-01T00:00:00.000Z"),
      },
      {
        ...basePost,
        id: 2,
        title: "A",
        featuredRank: 1,
        publishedAt: new Date("2026-05-02T00:00:00.000Z"),
      },
      {
        ...basePost,
        id: 3,
        title: "C",
        featuredRank: 1,
        publishedAt: new Date("2026-05-02T00:00:00.000Z"),
      },
      {
        ...basePost,
        id: 4,
        title: "Unfeatured",
        featuredRank: null,
        publishedAt: new Date("2026-05-30T00:00:00.000Z"),
      },
    ];

    expect(sortCuratedPosts(posts).map((post) => post.id)).toEqual([2, 3, 1, 4]);
  });

  it("summarizes content health by status, visibility, taxonomy, SEO, and recency", () => {
    const posts = [
      basePost,
      {
        ...basePost,
        id: 2,
        status: "draft" as const,
        visibility: "admin" as const,
        excerpt: "",
        categoryId: null,
        tags: [],
        updatedAt: new Date("2026-05-30T00:00:00.000Z"),
      },
      {
        ...basePost,
        id: 3,
        status: "published" as const,
        visibility: "hidden" as const,
        coverImage: "",
        updatedAt: new Date("2026-05-29T00:00:00.000Z"),
      },
    ];

    expect(
      getContentHealthSummary(posts, new Date("2026-05-30T00:00:00.000Z"))
    ).toMatchObject({
      total: 3,
      drafts: 1,
      publishedPublic: 1,
      ownerOnlyPreviews: 1,
      hidden: 1,
      missingExcerpt: 1,
      missingCategory: 1,
      missingTags: 1,
      missingSeoFields: 2,
      updatedRecently: 2,
    });
  });
});
