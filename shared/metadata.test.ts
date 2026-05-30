import { describe, expect, it } from "vitest";
import {
  buildArticleJsonLd,
  buildArticleMetadata,
  buildHomeJsonLd,
} from "./metadata";

const publishedAt = new Date("2026-05-10T00:00:00.000Z");

const post = {
  id: 1,
  title: "Agent Harness Engine",
  slug: "agent-harness-engine",
  content: "Public content",
  excerpt: "A public harness article.",
  coverImage: "/cover.png",
  status: "published" as const,
  visibility: "public" as const,
  categoryId: 1,
  authorId: 1,
  viewCount: 0,
  publishedAt,
  createdAt: publishedAt,
  updatedAt: new Date("2026-05-12T00:00:00.000Z"),
  category: {
    id: 1,
    name: "AI Applications",
    slug: "ai-applications",
    description: "Applications",
    createdAt: publishedAt,
    updatedAt: publishedAt,
  },
  tags: [
    {
      id: 1,
      name: "Harness Engine",
      slug: "harness-engine",
      createdAt: publishedAt,
    },
  ],
  readingMinutes: 1,
};

describe("route metadata builders", () => {
  it("builds article metadata and BlogPosting JSON-LD from the loaded post", () => {
    const metadata = buildArticleMetadata("https://example.com", post);
    const jsonLd = buildArticleJsonLd("https://example.com", post);

    expect(metadata).toMatchObject({
      title: "Agent Harness Engine",
      description: "A public harness article.",
      canonicalUrl: "https://example.com/post/agent-harness-engine",
      type: "article",
    });
    expect(metadata?.tags).toEqual(["Harness Engine"]);
    expect(jsonLd).toMatchObject({
      "@type": "BlogPosting",
      headline: "Agent Harness Engine",
      datePublished: "2026-05-10T00:00:00.000Z",
      dateModified: "2026-05-12T00:00:00.000Z",
      keywords: ["Harness Engine"],
    });
  });

  it("does not emit article metadata for an unknown post", () => {
    expect(buildArticleMetadata("https://example.com", null)).toBeNull();
    expect(buildArticleJsonLd("https://example.com", null)).toBeNull();
  });

  it("builds WebSite, Person, and Blog JSON-LD for the home page", () => {
    const jsonLd = buildHomeJsonLd("https://example.com");

    expect(jsonLd.map((entry) => entry["@type"])).toEqual(["WebSite", "Person", "Blog"]);
  });
});
