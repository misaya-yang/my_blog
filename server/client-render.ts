import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  buildArticleJsonLd,
  buildArticleMetadata,
  buildRouteMetadata,
  type RouteMetadata,
  type SeoPost,
} from "../shared/metadata.js";
import superjson from "superjson";
import { hasMarkdownMath } from "../shared/markdown-math.js";
import { siteConfig } from "../shared/site.js";
import { loadPublicArticle } from "./publicArticle.js";
import {
  buildRoutePreloadTags,
  injectPreloadTags,
  loadViteManifest,
} from "./routePreload.js";
import { resolveSiteUrl, type SiteUrlRequest } from "./seo.js";

type ClientRequest = SiteUrlRequest & {
  method: string;
  path: string;
  originalUrl: string;
};
type ClientResponse = {
  status(code: number): ClientResponse;
  set(headers: Record<string, string>): ClientResponse;
  send(body: string): void;
};
type ClientNext = (error?: unknown) => void;
type ClientMiddleware = (
  req: ClientRequest,
  res: ClientResponse,
  next: ClientNext
) => void | Promise<void>;
type ClientRouteRegistrar = {
  use(handler: ClientMiddleware): void;
};

type ClientRoute =
  | { kind: "known" }
  | { kind: "article"; slug: string }
  | { kind: "unknown" };

type RenderClientShellOptions = {
  baseUrl: string;
  rawHtml: string;
  urlPath: string;
  loadArticle?: (slug: string) => Promise<SeoPost | null>;
  articleSnapshotTimeoutMs?: number;
  transformHtml?: (urlPath: string, html: string) => Promise<string>;
};

type RenderedClientShell = {
  status: 200 | 404;
  html: string;
  cacheControl: string;
  /** Lazy modules this page needs at once, announced as modulepreloads. */
  preloadModules: string[];
};

// Public pages are identical for every reader, so the edge can answer them
// without a function cold start. The stale window stays short so publishing
// or hiding a post is visible within minutes.
const PUBLIC_HTML_CACHE =
  "public, max-age=0, s-maxage=60, stale-while-revalidate=600";
const DEGRADED_HTML_CACHE = "public, max-age=0, s-maxage=10";
const PRIVATE_HTML_CACHE = "private, no-store";
type KnownRouteMetadata = {
  title?: string;
  description?: string;
  noindex?: boolean;
};

type ClientRenderMiddlewareOptions = {
  indexHtmlPath?: string;
  prepareHtml?: (html: string) => string;
  transformHtml?: (urlPath: string, html: string) => Promise<string>;
};

const staticClientRoutes = new Set<string>([
  ...siteConfig.publicStaticRoutes,
  "/login",
  "/manage",
  "/manage/agent",
  "/write",
  "/404",
]);

const slugSegment = "[^/?#]+";
// A slow database must not hold the page: past this, the shell goes out
// without the article and the client fetches it.
const DEFAULT_ARTICLE_SNAPSHOT_TIMEOUT_MS = 1500;
const PLAIN_RENDERER = "src/components/MarkdownRenderer.tsx";
const MATH_RENDERER = "src/components/MathMarkdownRenderer.tsx";
const dynamicKnownRoutePatterns = [
  new RegExp(`^/tags/${slugSegment}$`),
  new RegExp(`^/categories/${slugSegment}$`),
  new RegExp(`^/write/${slugSegment}$`),
];
const knownRouteMetadata: Record<string, KnownRouteMetadata> = {
  "/algorithms": {
    title: "AI Algorithms",
    description:
      "Research notes on model mechanisms, generative modeling, positional encoding, long-context behavior, and residual stability.",
  },
  "/applications": {
    title: "AI Applications",
    description:
      "Technical essays on agents, harness engines, RAG, context engineering, tool use, and evaluation loops.",
  },
  "/archive": {
    title: "Archive",
    description: "Browse Misaya Notes by month, category, and research signal.",
  },
  "/about": {
    title: "About",
    description:
      "About Misaya Yang and the research notes collected in Misaya Notes.",
  },
  "/search": {
    title: "Search",
    description: "Search the Misaya Notes research index.",
  },
  "/login": {
    title: "Login",
    description: "Sign in to read or manage Misaya Notes.",
    noindex: true,
  },
  "/404": {
    title: "404",
    description: "The requested page could not be found.",
    noindex: true,
  },
};

export function classifyClientRoute(urlPath: string): ClientRoute {
  const pathname = normalizePathname(urlPath);
  const articleMatch = pathname.match(new RegExp(`^/post/(${slugSegment})$`));
  if (articleMatch) {
    return { kind: "article", slug: decodeURIComponent(articleMatch[1]) };
  }

  if (
    staticClientRoutes.has(pathname) ||
    dynamicKnownRoutePatterns.some(pattern => pattern.test(pathname))
  ) {
    return { kind: "known" };
  }

  return { kind: "unknown" };
}

export async function renderClientShellHtml({
  baseUrl,
  rawHtml,
  urlPath,
  loadArticle = loadPublicArticleSnapshot,
  articleSnapshotTimeoutMs = DEFAULT_ARTICLE_SNAPSHOT_TIMEOUT_MS,
  transformHtml,
}: RenderClientShellOptions): Promise<RenderedClientShell> {
  const pathname = normalizePathname(urlPath);
  const route = classifyClientRoute(pathname);
  let status: 200 | 404 = 200;
  let html = rawHtml;
  const preloadModules: string[] = [];
  let cacheControl = isOwnerPath(pathname)
    ? PRIVATE_HTML_CACHE
    : PUBLIC_HTML_CACHE;

  if (route.kind === "unknown") {
    status = 404;
    html = injectRouteMetadata(
      html,
      buildRouteMetadata(baseUrl, {
        title: "404",
        description: "The requested page could not be found.",
        path: pathname,
        noindex: true,
      })
    );
  } else if (route.kind === "article") {
    const snapshot = await loadArticleSnapshot(
      route.slug,
      loadArticle,
      articleSnapshotTimeoutMs
    );

    if (snapshot.status === "unavailable") {
      cacheControl = DEGRADED_HTML_CACHE;
      html = injectRouteMetadata(
        html,
        buildRouteMetadata(baseUrl, {
          title: humanizeSlug(route.slug),
          description: siteConfig.defaultDescription,
          path: pathname,
        })
      );
    } else if (
      !snapshot.article ||
      snapshot.article.status !== "published" ||
      snapshot.article.visibility !== "public"
    ) {
      status = 404;
      html = injectRouteMetadata(
        html,
        buildRouteMetadata(baseUrl, {
          title: "404",
          description: "The requested article could not be found.",
          path: pathname,
          noindex: true,
        })
      );
    } else {
      const metadata = buildArticleMetadata(baseUrl, snapshot.article);
      if (metadata) {
        html = injectRouteMetadata(
          html,
          metadata,
          buildArticleJsonLd(baseUrl, snapshot.article)
        );
      }
      html = injectRootSnapshot(
        html,
        renderPublicArticleSnapshotMarkup(snapshot.article)
      );
      html = injectArticleData(html, route.slug, snapshot.article);
      preloadModules.push(
        hasMarkdownMath(snapshot.article.content || "")
          ? MATH_RENDERER
          : PLAIN_RENDERER
      );
    }
  } else {
    html = injectRouteMetadata(html, buildKnownRouteMetadata(baseUrl, urlPath));
  }

  const transformedHtml = transformHtml
    ? await transformHtml(urlPath, html)
    : html;
  if (status === 404 && cacheControl === PUBLIC_HTML_CACHE)
    cacheControl = DEGRADED_HTML_CACHE;
  return { status, html: transformedHtml, cacheControl, preloadModules };
}

function isOwnerPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/manage") ||
    pathname.startsWith("/write")
  );
}

function buildKnownRouteMetadata(baseUrl: string, urlPath: string) {
  const url = new URL(urlPath, "http://local");
  const pathname = normalizePathname(url.pathname);
  const canonicalPath =
    pathname === "/search" && url.search
      ? `${pathname}${url.search}`
      : pathname;
  const staticMetadata = knownRouteMetadata[pathname];

  if (staticMetadata) {
    return buildRouteMetadata(baseUrl, {
      ...staticMetadata,
      path: canonicalPath,
    });
  }

  if (pathname.startsWith("/manage") || pathname.startsWith("/write")) {
    return buildRouteMetadata(baseUrl, {
      title: "Owner tools",
      description: "Owner-only Misaya Notes operational tools.",
      path: canonicalPath,
      noindex: true,
    });
  }

  if (pathname.startsWith("/categories/")) {
    return buildRouteMetadata(baseUrl, {
      title: humanizeSlug(pathname.split("/").pop() ?? "category"),
      description: "Public category index for Misaya Notes.",
      path: canonicalPath,
    });
  }

  if (pathname.startsWith("/tags/")) {
    return buildRouteMetadata(baseUrl, {
      title: humanizeSlug(pathname.split("/").pop() ?? "tag"),
      description: "Public tag index for Misaya Notes.",
      path: canonicalPath,
    });
  }

  return buildRouteMetadata(baseUrl, { path: canonicalPath });
}

export function renderPublicArticleSnapshotMarkup(article: SeoPost) {
  const publishedAt = article.publishedAt
    ? new Date(article.publishedAt).toISOString()
    : "";
  const excerpt =
    article.excerpt ||
    trimToLength(markdownToPlainText(article.content || ""), 220);
  const bodyExcerpt = trimToLength(
    markdownToPlainText(article.content || ""),
    900
  );
  const tags = article.tags?.map(tag => tag.name).join(", ") || "";

  return [
    '<article class="public-render-snapshot" data-public-render-snapshot>',
    `  <p class="public-render-snapshot__eyebrow">${escapeHtml(article.category?.name || siteConfig.name)}</p>`,
    `  <h1>${escapeHtml(article.title)}</h1>`,
    '  <p class="public-render-snapshot__meta">',
    `    <span>${escapeHtml(siteConfig.authorName)}</span>`,
    publishedAt
      ? `    <time datetime="${escapeAttribute(publishedAt)}">${escapeHtml(publishedAt)}</time>`
      : "",
    "  </p>",
    `  <p class="public-render-snapshot__excerpt">${escapeHtml(excerpt)}</p>`,
    tags
      ? `  <p class="public-render-snapshot__tags">${escapeHtml(tags)}</p>`
      : "",
    `  <div class="public-render-snapshot__body">${escapeHtml(bodyExcerpt)}</div>`,
    "</article>",
  ]
    .filter(Boolean)
    .join("\n");
}

export function createClientRenderMiddleware(
  options: ClientRenderMiddlewareOptions = {}
) {
  const indexHtmlPath =
    options.indexHtmlPath ??
    path.resolve(import.meta.dirname, "..", "dist", "public", "index.html");

  return async (req: ClientRequest, res: ClientResponse, next: ClientNext) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (
      req.path.startsWith("/api/") ||
      shouldBypassClientRender(req.originalUrl)
    )
      return next();

    try {
      const rawHtml = options.prepareHtml
        ? options.prepareHtml(await readFile(indexHtmlPath, "utf-8"))
        : await readFile(indexHtmlPath, "utf-8");
      const rendered = await renderClientShellHtml({
        baseUrl: resolveSiteUrl(req),
        rawHtml,
        urlPath: req.originalUrl,
        transformHtml: options.transformHtml,
      });
      // Development serves source modules through Vite and has no manifest.
      const manifest = options.transformHtml
        ? null
        : await loadViteManifest(
            path.join(path.dirname(indexHtmlPath), ".vite", "manifest.json")
          );
      const html = injectPreloadTags(
        rendered.html,
        manifest
          ? buildRoutePreloadTags(
              manifest,
              normalizePathname(req.path),
              rendered.preloadModules
            )
          : ""
      );

      res
        .status(rendered.status)
        .set({
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": rendered.cacheControl,
        })
        .send(html);
    } catch (error) {
      next(error);
    }
  };
}

async function loadArticleSnapshot(
  slug: string,
  loadArticle: (slug: string) => Promise<SeoPost | null>,
  timeoutMs: number
): Promise<
  | { status: "resolved"; article: SeoPost | null }
  | { status: "unavailable"; reason: "timeout" | "error" }
> {
  if (!Number.isFinite(timeoutMs)) {
    try {
      return { status: "resolved", article: await loadArticle(slug) };
    } catch {
      return { status: "unavailable", reason: "error" };
    }
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = Math.max(1, timeoutMs);
  const articleLoad = loadArticle(slug)
    .then(article => ({ status: "resolved" as const, article }))
    .catch(() => ({
      status: "unavailable" as const,
      reason: "error" as const,
    }));

  try {
    return await Promise.race([
      articleLoad,
      new Promise<{ status: "unavailable"; reason: "timeout" }>(resolve => {
        timeoutId = setTimeout(
          () => resolve({ status: "unavailable", reason: "timeout" }),
          timeout
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function humanizeSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function registerClientRenderRoutes(
  app: ClientRouteRegistrar,
  options: ClientRenderMiddlewareOptions = {}
) {
  app.use(createClientRenderMiddleware(options));
}

export function shouldBypassClientRender(urlPath: string) {
  const pathname = normalizePathname(urlPath);
  if (pathname.startsWith("/src/")) return true;
  if (pathname.startsWith("/@")) return true;
  if (pathname.startsWith("/node_modules/")) return true;
  if (pathname.startsWith("/assets/")) return true;
  if (/\.[a-z0-9]+$/i.test(pathname)) return true;
  return false;
}

function loadPublicArticleSnapshot(slug: string): Promise<SeoPost | null> {
  return loadPublicArticle(slug);
}

/**
 * The article's data rides along in the page, so the client renders it at
 * once instead of asking the API for what the server has just read. Script
 * content cannot contain "<", so no markup inside the article can end it.
 */
function injectArticleData(html: string, slug: string, article: SeoPost) {
  const data = superjson.stringify(article).replace(/</g, "\\u003c");
  return injectBeforeBodyEnd(
    html,
    `<script id="article-data" type="application/json" data-slug="${escapeAttribute(slug)}">${data}</script>`
  );
}

function injectRouteMetadata(
  html: string,
  metadata: RouteMetadata,
  jsonLd?: unknown
) {
  let nextHtml = html;
  nextHtml = replaceTitle(nextHtml, metadata.fullTitle);
  nextHtml = upsertMeta(nextHtml, "name", "description", metadata.description);
  nextHtml = upsertMeta(
    nextHtml,
    "name",
    "robots",
    metadata.noindex ? "noindex,nofollow" : "index,follow"
  );
  nextHtml = upsertMeta(nextHtml, "property", "og:title", metadata.title);
  nextHtml = upsertMeta(
    nextHtml,
    "property",
    "og:description",
    metadata.description
  );
  nextHtml = upsertMeta(nextHtml, "property", "og:type", metadata.type);
  nextHtml = upsertMeta(nextHtml, "property", "og:url", metadata.canonicalUrl);
  nextHtml = upsertMeta(nextHtml, "property", "og:image", metadata.image);
  nextHtml = upsertMeta(nextHtml, "name", "twitter:title", metadata.title);
  nextHtml = upsertMeta(
    nextHtml,
    "name",
    "twitter:description",
    metadata.description
  );
  nextHtml = upsertMeta(nextHtml, "name", "twitter:image", metadata.image);
  nextHtml = upsertLink(nextHtml, "canonical", metadata.canonicalUrl);

  if (metadata.type === "article") {
    if (metadata.publishedAt)
      nextHtml = upsertMeta(
        nextHtml,
        "property",
        "article:published_time",
        metadata.publishedAt
      );
    if (metadata.updatedAt)
      nextHtml = upsertMeta(
        nextHtml,
        "property",
        "article:modified_time",
        metadata.updatedAt
      );
    if (metadata.category)
      nextHtml = upsertMeta(
        nextHtml,
        "property",
        "article:section",
        metadata.category
      );
  }

  if (jsonLd) {
    nextHtml = injectBeforeHeadEnd(
      nextHtml,
      `<script type="application/ld+json" data-server-rendered="true">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`
    );
  }

  return nextHtml;
}

function injectRootSnapshot(html: string, snapshotMarkup: string) {
  const rootPattern = /<div id="root"[^>]*>[\s\S]*?<\/div>/i;
  if (rootPattern.test(html)) {
    return html.replace(
      rootPattern,
      `<div id="root">\n${snapshotMarkup}\n</div>`
    );
  }
  return html.replace(
    "<body>",
    `<body>\n<div id="root">\n${snapshotMarkup}\n</div>`
  );
}

function replaceTitle(html: string, title: string) {
  const titleTag = `<title>${escapeHtml(title)}</title>`;
  if (/<title[^>]*>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, titleTag);
  }
  return injectBeforeHeadEnd(html, titleTag);
}

function upsertMeta(
  html: string,
  attributeName: "name" | "property",
  key: string,
  content: string
) {
  const tag = `<meta ${attributeName}="${escapeAttribute(key)}" content="${escapeAttribute(content)}" />`;
  const pattern = new RegExp(
    `<meta\\s+[^>]*${attributeName}=["']${escapeRegExp(key)}["'][^>]*>`,
    "i"
  );
  if (pattern.test(html)) return html.replace(pattern, tag);
  return injectBeforeHeadEnd(html, tag);
}

function upsertLink(html: string, rel: string, href: string) {
  const tag = `<link rel="${escapeAttribute(rel)}" href="${escapeAttribute(href)}" />`;
  const pattern = new RegExp(
    `<link\\s+[^>]*rel=["']${escapeRegExp(rel)}["'][^>]*>`,
    "i"
  );
  if (pattern.test(html)) return html.replace(pattern, tag);
  return injectBeforeHeadEnd(html, tag);
}

function injectBeforeBodyEnd(html: string, tag: string) {
  if (html.includes("</body>"))
    return html.replace("</body>", `  ${tag}\n  </body>`);
  return `${html}\n${tag}`;
}

function injectBeforeHeadEnd(html: string, tag: string) {
  if (html.includes("</head>"))
    return html.replace("</head>", `    ${tag}\n  </head>`);
  return `${tag}\n${html}`;
}

function normalizePathname(urlPath: string) {
  const pathname =
    new URL(urlPath, "http://local").pathname.replace(/\/+$/, "") || "/";
  return pathname;
}

function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~>$\\|=-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trimToLength(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}...`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
