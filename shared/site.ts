export const siteConfig = {
  name: "Misaya Notes",
  defaultTitle: "Misaya Notes",
  titleTemplate: "%s · Misaya Notes",
  defaultDescription:
    "Misaya Yang's working notes on model mechanisms, long-context behavior, retrieval, agent systems, and reliable applied AI engineering.",
  authorName: "Misaya Yang",
  authorEmail: "zedpl28174@gmail.com",
  scholarUrl: "https://scholar.google.com/citations?user=6X9HlDAAAAAJ",
  defaultLocale: "zh-CN",
  alternateLocales: ["en-US", "zh-CN"],
  defaultOgImage: "/og-default.svg",
  favicon: "/favicon.svg",
  manifest: "/site.webmanifest",
  feedPath: "/rss.xml",
  feedTitle: "Misaya Notes",
  feedDescription:
    "Research notes by Misaya Yang on model mechanisms and applied AI systems.",
  publicStaticRoutes: ["/", "/algorithms", "/applications", "/archive", "/about", "/search"],
  disallowedRoutes: ["/write", "/manage", "/api/trpc/posts.create", "/api/trpc/posts.update"],
} as const;

export function applyTitleTemplate(title?: string | null) {
  if (!title || title === siteConfig.defaultTitle) return siteConfig.defaultTitle;
  return siteConfig.titleTemplate.replace("%s", title);
}

export function normalizeSiteUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function joinUrl(baseUrl: string, path = "/") {
  const normalizedBase = normalizeSiteUrl(baseUrl);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
