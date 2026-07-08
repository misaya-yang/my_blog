import { openBlogAgentWithPrompt } from "@/components/agent/routeContext";
import { trackAnalyticsEvent } from "@/lib/analytics";
import {
  SEARCH_RECOVERY_TOPICS,
  normalizeSearchText,
} from "@shared/search-aliases";

export const recoveryTopics = SEARCH_RECOVERY_TOPICS;
export type RecoveryTopic = (typeof recoveryTopics)[number];

export function getRecoveryTopics(query: string): RecoveryTopic[] {
  const normalized = normalizeSearchText(query);
  return recoveryTopics
    .map(topic => ({
      ...topic,
      score: topic.aliases.filter(alias =>
        normalized.includes(normalizeSearchText(alias))
      ).length,
    }))
    .sort((a, b) => b.score - a.score || a.query.localeCompare(b.query))
    .slice(0, 4);
}

export function buildSearchRecoveryAgentPrompt(
  query: string,
  language: "en" | "zh"
) {
  return language === "zh"
    ? `我搜索“${query}”没有找到直接结果。请基于公开笔记，帮我找最相关的文章、主题或阅读路径，并说明为什么相关。`
    : `I searched for "${query}" and found no direct results. Using the public notes only, find the most relevant articles, themes, or reading paths and explain why they are related.`;
}

export function openSearchRecoveryAgent(query: string, language: "en" | "zh") {
  trackAnalyticsEvent("search_recovery_ask_agent", { query });
  openBlogAgentWithPrompt(buildSearchRecoveryAgentPrompt(query, language));
}
