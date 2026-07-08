import { canShowPublicBlogAgent } from "@shared/route-contract";
import type { AgentAnswerMode } from "./streamClient";
import {
  getCompanionPromptKeys,
  getCompanionWelcomeKeys,
  type AgentRouteContext,
} from "./routeContext";

type AgentSessionIdentity =
  | {
      role?: string;
      displayName?: string | null;
      visitorId?: string | null;
    }
  | null
  | undefined;

type Translate = (
  key: string,
  values?: Record<string, string | number>
) => string;

export function inferAnswerMode(
  message: string,
  routeContext?: AgentRouteContext
): AgentAnswerMode {
  const normalized = message.toLowerCase();
  if (/compare|对比|比较/.test(normalized)) return "compare";
  if (
    /path|checklist|next|first|read next|reading path|阅读路径|阅读清单|清单|下一篇|先读/.test(
      normalized
    )
  ) {
    return "reading_path";
  }
  if (
    /deep|implementation|implication|failure|assumption|source|detail|实现|启发|假设|失败|来源|细节/.test(
      normalized
    )
  ) {
    return "deep";
  }
  if (routeContext?.routeType === "post") return "deep";
  return "summary";
}

export function isBlogAgentHiddenRoute(path: string) {
  return !canShowPublicBlogAgent(path);
}

export function getAgentSessionKey(session: AgentSessionIdentity) {
  if (!session) return "loading";
  if (session.role === "admin") {
    return `admin:${session.displayName ?? "owner"}`;
  }
  if (session.role === "visitor") {
    return `visitor:${session.visitorId}`;
  }
  return "anonymous";
}

export function getContextFileKind(
  fileName: string
): "markdown_file" | "text_file" | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".md")) return "markdown_file";
  if (lower.endsWith(".txt")) return "text_file";
  return null;
}

export function getFallbackMimeType(kind: "markdown_file" | "text_file") {
  return kind === "markdown_file" ? "text/markdown" : "text/plain";
}

export function getFocusableElements(container: HTMLElement) {
  const selectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
    element =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.offsetParent !== null
  );
}

export function buildCompanionPrompts(
  routeContext: AgentRouteContext,
  t: Translate,
  serverPrompts?: string[]
) {
  const prompts = getCompanionPromptKeys(routeContext)
    .map(key => t(key))
    .filter(prompt => prompt && !prompt.startsWith("agent.prompts."));
  if (prompts.length > 0) return prompts.slice(0, 3);
  if (serverPrompts && serverPrompts.length > 0)
    return serverPrompts.slice(0, 3);
  return fallbackPrompts(t);
}

export function getCompanionWelcome(
  routeContext: AgentRouteContext,
  t: Translate
) {
  const keys = getCompanionWelcomeKeys(routeContext);
  return {
    title: t(keys.titleKey),
    body: t(keys.bodyKey),
  };
}

function fallbackPrompts(t: Translate) {
  return [
    t("agent.prompts.siteThemes"),
    t("agent.prompts.compareTracks"),
    t("agent.prompts.readingPath"),
  ];
}
