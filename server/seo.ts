import { ENV } from "./_core/env.js";
import { getPublicDiscoveryPosts } from "./db.js";
import type { DiscoveryPost } from "./discovery.js";
import { joinUrl, normalizeSiteUrl, siteConfig } from "../shared/site.js";

export type SiteUrlRequest = {
  protocol?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type RouteRequest = SiteUrlRequest;
type RouteResponse = {
  status(code: number): RouteResponse;
  type(value: string): RouteResponse;
  send(body: string): void;
};
type RouteNext = (error?: unknown) => void;
type RouteHandler = (req: RouteRequest, res: RouteResponse, next: RouteNext) => void;
type RouteRegistrar = {
  get(path: string, handler: RouteHandler): void;
};

type SitemapEntry = {
  path: string;
  lastmod?: Date | string | null;
  priority?: string;
  changefreq?: string;
};

export function registerSeoRoutes(app: RouteRegistrar) {
  app.get("/robots.txt", (req, res) => {
    sendText(res, renderRobotsTxt(resolveSiteUrl(req)));
  });

  app.get("/sitemap.xml", asyncRoute(async (req, res) => {
    const posts = await getPublicDiscoveryPosts();
    sendXml(res, renderSitemapXml(resolveSiteUrl(req), posts));
  }));

  app.get("/rss.xml", asyncRoute(async (req, res) => {
    const posts = await getPublicDiscoveryPosts();
    res
      .status(200)
      .type("application/rss+xml; charset=utf-8")
      .send(renderRssXml(resolveSiteUrl(req), posts));
  }));
}

export function resolveSiteUrl(req?: SiteUrlRequest) {
  const configured = process.env.SITE_URL || process.env.VITE_SITE_URL;
  if (configured) return normalizeSiteUrl(configured);

  const headers = req?.headers ?? {};
  const host = headers.host ?? "localhost:3000";
  const proto = headers["x-forwarded-proto"]?.toString() || req?.protocol || "http";
  return `${proto}://${host}`;
}

export function renderRobotsTxt(baseUrl: string) {
  return [
    "User-agent: *",
    "Allow: /",
    ...siteConfig.disallowedRoutes.map((route) => `Disallow: ${route}`),
    `Sitemap: ${joinUrl(baseUrl, "/sitemap.xml")}`,
    "",
  ].join("\n");
}

export function renderSitemapXml(baseUrl: string, posts: DiscoveryPost[]) {
  const entries = buildSitemapEntries(posts);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) => {
      const lines = [
        "  <url>",
        `    <loc>${escapeXml(joinUrl(baseUrl, entry.path))}</loc>`,
      ];
      if (entry.lastmod) lines.push(`    <lastmod>${new Date(entry.lastmod).toISOString()}</lastmod>`);
      if (entry.changefreq) lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      if (entry.priority) lines.push(`    <priority>${entry.priority}</priority>`);
      lines.push("  </url>");
      return lines.join("\n");
    }),
    "</urlset>",
    "",
  ].join("\n");
}

export function renderRssXml(baseUrl: string, posts: DiscoveryPost[]) {
  const publicPosts = publicPostsOnly(posts).slice(0, 20);
  const latestUpdatedAt = publicPosts
    .map(post => post.updatedAt ?? post.publishedAt ?? post.createdAt)
    .map(value => new Date(value).getTime())
    .filter(value => Number.isFinite(value))
    .sort((a, b) => b - a)[0];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(siteConfig.feedTitle)}</title>`,
    `    <link>${escapeXml(joinUrl(baseUrl, "/"))}</link>`,
    `    <description>${escapeXml(siteConfig.feedDescription)}</description>`,
    `    <language>${siteConfig.defaultLocale}</language>`,
    latestUpdatedAt
      ? `    <lastBuildDate>${new Date(latestUpdatedAt).toUTCString()}</lastBuildDate>`
      : null,
    `    <atom:link href="${escapeXml(joinUrl(baseUrl, siteConfig.feedPath))}" rel="self" type="application/rss+xml" />`,
    ...publicPosts.map((post) => renderRssItem(baseUrl, post)),
    "  </channel>",
    "</rss>",
    "",
  ].filter(Boolean).join("\n");
}

export function buildSitemapEntries(posts: DiscoveryPost[]): SitemapEntry[] {
  const publicPosts = publicPostsOnly(posts);
  const tagSlugs = new Set<string>();
  const categorySlugs = new Set<string>();

  for (const post of publicPosts) {
    if (post.category?.slug) categorySlugs.add(post.category.slug);
    for (const tag of post.tags) tagSlugs.add(tag.slug);
  }

  return [
    ...siteConfig.publicStaticRoutes.map((path) => ({
      path,
      priority: path === "/" ? "1.0" : "0.7",
      changefreq: path === "/" ? "weekly" : "monthly",
    })),
    ...Array.from(categorySlugs).sort().map((slug) => ({
      path: `/categories/${slug}`,
      priority: "0.6",
      changefreq: "weekly",
    })),
    ...Array.from(tagSlugs).sort().map((slug) => ({
      path: `/tags/${slug}`,
      priority: "0.5",
      changefreq: "weekly",
    })),
    ...publicPosts.map((post) => ({
      path: `/post/${post.slug}`,
      lastmod: post.updatedAt ?? post.publishedAt,
      priority: "0.8",
      changefreq: "monthly",
    })),
  ];
}

function renderRssItem(baseUrl: string, post: DiscoveryPost) {
  const link = joinUrl(baseUrl, `/post/${post.slug}`);
  const categories = [
    post.category?.name,
    ...post.tags.map((tag) => tag.name),
  ].filter(Boolean) as string[];

  return [
    "    <item>",
    `      <title>${escapeXml(post.title)}</title>`,
    `      <link>${escapeXml(link)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
    `      <pubDate>${new Date(post.publishedAt ?? post.createdAt).toUTCString()}</pubDate>`,
    `      <atom:updated>${new Date(post.updatedAt ?? post.publishedAt ?? post.createdAt).toISOString()}</atom:updated>`,
    `      <description>${escapeXml(post.excerpt ?? "")}</description>`,
    `      <author>${escapeXml(`${siteConfig.authorEmail} (${siteConfig.authorName})`)}</author>`,
    ...categories.map((category) => `      <category>${escapeXml(category)}</category>`),
    "    </item>",
  ].join("\n");
}

function publicPostsOnly(posts: DiscoveryPost[]) {
  return posts
    .filter((post) => post.status === "published" && post.visibility === "public")
    .sort((a, b) => {
      const left = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const right = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return right - left;
    });
}

function sendText(res: RouteResponse, body: string) {
  res.status(200).type("text/plain; charset=utf-8").send(body);
}

function sendXml(res: RouteResponse, body: string) {
  res.status(200).type("application/xml; charset=utf-8").send(body);
}

function asyncRoute(handler: (req: RouteRequest, res: RouteResponse) => Promise<void>): RouteHandler {
  return (req, res, next) => {
    handler(req, res).catch((error: unknown) => next(error));
  };
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
