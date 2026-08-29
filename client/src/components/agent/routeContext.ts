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

export function buildRouteContext(
  path: string,
  locale: "en" | "zh",
  postTitle?: string
) {
  const postSlug = matchPath(path, /^\/post\/([^/?#]+)/);
  const tagSlug = matchPath(path, /^\/tags\/([^/?#]+)/);
  const categorySlug = matchPath(path, /^\/categories\/([^/?#]+)/);

  if (postSlug) {
    const normalizedTitle = postTitle?.trim().slice(0, 300);
    return {
      path,
      routeType: "post" as const,
      postSlug,
      locale,
      postTitle: normalizedTitle ? normalizedTitle : undefined,
    };
  }
  if (tagSlug) return { path, routeType: "tag" as const, tagSlug, locale };
  if (categorySlug)
    return { path, routeType: "category" as const, categorySlug, locale };
  if (path === "/algorithms")
    return {
      path,
      routeType: "track" as const,
      trackSlug: "ai-algorithms" as const,
      locale,
    };
  if (path === "/applications")
    return {
      path,
      routeType: "track" as const,
      trackSlug: "ai-applications" as const,
      locale,
    };
  if (path === "/archive")
    return { path, routeType: "archive" as const, locale };
  if (path === "/search") return { path, routeType: "search" as const, locale };
  if (path === "/") return { path, routeType: "home" as const, locale };
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
      "agent.prompts.postCoreWithTitle",
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
    "agent.prompts.algorithmsFirst",
    "agent.prompts.applicationsFirst",
    "agent.prompts.readingPath",
  ];
}

export function openBlogAgentWithPrompt(prompt?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<BlogAgentOpenDetail>(BLOG_AGENT_OPEN_EVENT, {
      detail: { prompt },
    })
  );
}

function matchPath(path: string, pattern: RegExp) {
  const value = pattern.exec(path)?.[1];
  return value ? decodeURIComponent(value) : undefined;
}
