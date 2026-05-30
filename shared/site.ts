export const siteConfig = {
  name: "AI Tech Blog",
  defaultTitle: "AI Tech Blog",
  titleTemplate: "%s · AI Tech Blog",
  defaultDescription:
    "Misaya Yang's research notebook on AI algorithms, long-context mechanisms, agent systems, RAG, and reliable AI application engineering.",
  authorName: "Misaya Yang",
  authorEmail: "zedpl28174@gmail.com",
  scholarUrl: "https://scholar.google.com/citations?user=6X9HlDAAAAAJ",
  defaultLocale: "zh-CN",
  alternateLocales: ["en-US", "zh-CN"],
  defaultOgImage: "/og-default.svg",
  favicon: "/favicon.svg",
  manifest: "/site.webmanifest",
  feedPath: "/rss.xml",
  feedTitle: "AI Tech Blog",
  feedDescription:
    "Research notes by Misaya Yang on deep learning systems and AI application engineering.",
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
