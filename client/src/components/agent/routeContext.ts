import { classifyProductRoute } from "@shared/route-contract";

export type AgentRouteContext = ReturnType<typeof buildRouteContext>;
export const BLOG_AGENT_OPEN_EVENT = "blog-agent:open";

export type BlogAgentOpenDetail = {
  prompt?: string;
};

export type AgentScope =
  | { type: "site"; value?: string }
  | { type: "post"; value?: string }
  | { type: "category"; value?: string }
  | { type: "tag"; value?: string }
  | { type: "track"; value?: string };

export function buildRouteContext(path: string, locale: "en" | "zh") {
  const route = classifyProductRoute(path);
  const pathname = route.pathname;

  if (route.kind === "reader" && route.slug)
    return { path, routeType: "post" as const, postSlug: route.slug, locale };
  if (pathname.startsWith("/tags/") && route.slug)
    return { path, routeType: "tag" as const, tagSlug: route.slug, locale };
  if (pathname.startsWith("/categories/") && route.slug)
    return {
      path,
      routeType: "category" as const,
      categorySlug: route.slug,
      locale,
    };
  if (pathname === "/algorithms")
    return {
      path,
      routeType: "track" as const,
      trackSlug: "ai-algorithms" as const,
      locale,
    };
  if (pathname === "/applications")
    return {
      path,
      routeType: "track" as const,
      trackSlug: "ai-applications" as const,
      locale,
    };
  if (pathname === "/archive")
    return { path, routeType: "archive" as const, locale };
  if (pathname === "/search")
    return { path, routeType: "search" as const, locale };
  if (pathname === "/") return { path, routeType: "home" as const, locale };
  if (route.kind === "owner")
    return { path, routeType: "owner" as const, locale };
  if (route.kind === "editor")
    return { path, routeType: "editor" as const, locale };
  if (route.kind === "system")
    return { path, routeType: "system" as const, locale };
  return { path, routeType: "public" as const, locale };
}

export function inferClientScope(routeContext: AgentRouteContext): AgentScope {
  if (routeContext.postSlug)
    return { type: "post", value: routeContext.postSlug };
  if (routeContext.categorySlug)
    return { type: "category", value: routeContext.categorySlug };
  if (routeContext.tagSlug) return { type: "tag", value: routeContext.tagSlug };
  if (routeContext.trackSlug)
    return { type: "track", value: routeContext.trackSlug };
  return { type: "site" };
}

export function getCompanionPromptKeys(routeContext: AgentRouteContext) {
  if (routeContext.routeType === "post") {
    return [
      "agent.prompts.postAbstraction",
      "agent.prompts.postImplementation",
      "agent.prompts.nextReading",
    ];
  }

  if (
    routeContext.routeType === "track" &&
    routeContext.trackSlug === "ai-applications"
  ) {
    return [
      "agent.prompts.applicationsFirst",
      "agent.prompts.applicationsPath",
      "agent.prompts.applicationsCompare",
    ];
  }

  if (
    routeContext.routeType === "track" &&
    routeContext.trackSlug === "ai-algorithms"
  ) {
    return [
      "agent.prompts.algorithmsFirst",
      "agent.prompts.algorithmsMap",
      "agent.prompts.algorithmsCompare",
    ];
  }

  if (routeContext.routeType === "search") {
    return [
      "agent.prompts.searchSynthesize",
      "agent.prompts.searchNarrow",
      "agent.prompts.readingPath",
    ];
  }

  if (routeContext.routeType === "archive") {
    return [
      "agent.prompts.archiveRecent",
      "agent.prompts.archiveSeries",
      "agent.prompts.readingPath",
    ];
  }

  if (
    routeContext.routeType === "category" ||
    routeContext.routeType === "tag"
  ) {
    return [
      "agent.prompts.topicMap",
      "agent.prompts.topicCompare",
      "agent.prompts.nextReading",
    ];
  }

  return [
    "agent.prompts.siteThemes",
    "agent.prompts.compareTracks",
    "agent.prompts.readingPath",
  ];
}

export function getCompanionWelcomeKeys(routeContext: AgentRouteContext) {
  if (routeContext.routeType === "post") {
    return {
      titleKey: "agent.welcome.postTitle",
      bodyKey: "agent.welcome.postBody",
    };
  }

  if (routeContext.routeType === "track") {
    return {
      titleKey: "agent.welcome.trackTitle",
      bodyKey: "agent.welcome.trackBody",
    };
  }

  if (
    routeContext.routeType === "search" ||
    routeContext.routeType === "archive"
  ) {
    return {
      titleKey: "agent.welcome.discoveryTitle",
      bodyKey: "agent.welcome.discoveryBody",
    };
  }

  return {
    titleKey: "agent.welcome.title",
    bodyKey: "agent.welcome.body",
  };
}

export function openBlogAgentWithPrompt(prompt?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<BlogAgentOpenDetail>(BLOG_AGENT_OPEN_EVENT, {
      detail: { prompt },
    })
  );
}
