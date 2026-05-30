import { createServer, type Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app";
import { getPublicDiscoveryPosts } from "./db";

const publishedAt = new Date("2026-05-10T00:00:00.000Z");

const publicPost = {
  id: 1,
  title: "Agent Harness Engine",
  slug: "agent-harness-engine",
  content: "Public content",
  excerpt: "A public harness article.",
  coverImage: null,
  status: "published" as const,
  visibility: "public" as const,
  categoryId: 1,
  authorId: 1,
  viewCount: 0,
  publishedAt,
  createdAt: publishedAt,
  updatedAt: publishedAt,
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

const draftPost = {
  ...publicPost,
  id: 2,
  title: "Owner Draft",
  slug: "owner-draft",
  status: "draft" as const,
  visibility: "admin" as const,
};

vi.mock("./db", () => ({
  getPublicDiscoveryPosts: vi.fn(async () => [publicPost, draftPost]),
}));

async function startTestServer() {
  const server = createServer(createApp());
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind to a port");
  }
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

describe("SEO distribution endpoints", () => {
  let server: Server | null = null;
  let baseUrl = "";

  beforeEach(async () => {
    process.env.SITE_URL = "https://example.com";
    const started = await startTestServer();
    server = started.server;
    baseUrl = started.baseUrl;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()));
    });
    server = null;
    delete process.env.SITE_URL;
  });

  it("serves robots.txt with owner route disallows and sitemap location", async () => {
    const response = await fetch(`${baseUrl}/robots.txt`);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain("Sitemap: https://example.com/sitemap.xml");
    expect(text).toContain("Disallow: /write");
    expect(text).toContain("Disallow: /manage");
  });

  it("serves sitemap.xml with public routes while excluding non-public posts", async () => {
    const response = await fetch(`${baseUrl}/sitemap.xml`);
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/xml");
    expect(xml).toContain("<urlset");
    expect(xml).toContain("https://example.com/post/agent-harness-engine");
    expect(xml).toContain("https://example.com/tags/harness-engine");
    expect(xml).toContain("https://example.com/categories/ai-applications");
    expect(xml).not.toContain("owner-draft");
  });

  it("serves rss.xml with public posts while excluding non-public posts", async () => {
    const response = await fetch(`${baseUrl}/rss.xml`);
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/rss+xml");
    expect(xml).toContain("<rss");
    expect(xml).toContain("<title>Agent Harness Engine</title>");
    expect(xml).toContain("<category>Harness Engine</category>");
    expect(xml).not.toContain("Owner Draft");
  });

  it("keeps the server alive when sitemap data loading fails", async () => {
    vi.mocked(getPublicDiscoveryPosts).mockRejectedValueOnce(new Error("database unavailable"));

    const failed = await fetch(`${baseUrl}/sitemap.xml`);
    const robots = await fetch(`${baseUrl}/robots.txt`);

    expect(failed.status).toBe(500);
    expect(robots.status).toBe(200);
  });
});
