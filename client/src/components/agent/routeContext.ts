export type AgentRouteContext = ReturnType<typeof buildRouteContext>;

export type AgentScope =
  | { type: "site"; value?: string }
  | { type: "post"; value?: string }
  | { type: "category"; value?: string }
  | { type: "tag"; value?: string }
  | { type: "track"; value?: string };

export function buildRouteContext(path: string, locale: "en" | "zh") {
  const postSlug = matchPath(path, /^\/post\/([^/?#]+)/);
  const tagSlug = matchPath(path, /^\/tags\/([^/?#]+)/);
  const categorySlug = matchPath(path, /^\/categories\/([^/?#]+)/);

  if (postSlug) return { path, routeType: "post" as const, postSlug, locale };
  if (tagSlug) return { path, routeType: "tag" as const, tagSlug, locale };
  if (categorySlug) return { path, routeType: "category" as const, categorySlug, locale };
  if (path === "/algorithms") return { path, routeType: "track" as const, trackSlug: "ai-algorithms" as const, locale };
  if (path === "/applications") return { path, routeType: "track" as const, trackSlug: "ai-applications" as const, locale };
  if (path === "/archive") return { path, routeType: "archive" as const, locale };
  if (path === "/search") return { path, routeType: "search" as const, locale };
  if (path === "/") return { path, routeType: "home" as const, locale };
  return { path, routeType: "public" as const, locale };
}

export function inferClientScope(routeContext: AgentRouteContext): AgentScope {
  if (routeContext.postSlug) return { type: "post", value: routeContext.postSlug };
  if (routeContext.categorySlug) return { type: "category", value: routeContext.categorySlug };
  if (routeContext.tagSlug) return { type: "tag", value: routeContext.tagSlug };
  if (routeContext.trackSlug) return { type: "track", value: routeContext.trackSlug };
  return { type: "site" };
}

function matchPath(path: string, pattern: RegExp) {
  const value = pattern.exec(path)?.[1];
  return value ? decodeURIComponent(value) : undefined;
}
