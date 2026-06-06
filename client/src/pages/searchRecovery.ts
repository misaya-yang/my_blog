import { openBlogAgentWithPrompt } from "@/components/agent/routeContext";
import { trackAnalyticsEvent } from "@/lib/analytics";

export const recoveryTopics = [
  {
    labelKey: "track.topic.agentSystems",
    query: "AgentLoop",
    href: "/search?q=AgentLoop",
    aliases: ["agent", "agentloop", "智能体", "loop", "runtime", "运行时"],
  },
  {
    labelKey: "track.topic.ragRetrieval",
    query: "Evidence Packet",
    href: "/search?q=Evidence%20Packet",
    aliases: ["rag", "retrieval", "检索", "证据", "evidence", "packet"],
  },
  {
    labelKey: "track.topic.harnessEngine",
    query: "Harness Engine",
    href: "/search?q=Harness%20Engine",
    aliases: ["harness", "eval", "评测", "trace", "tool", "工具"],
  },
  {
    labelKey: "track.topic.isohc",
    query: "IsoHC",
    href: "/search?q=IsoHC",
    aliases: ["iso", "isohc", "残差", "稳定性", "正交", "不变量"],
  },
  {
    labelKey: "track.topic.longContext",
    query: "Long Context",
    href: "/algorithms",
    aliases: ["long", "context", "上下文", "rope", "位置编码"],
  },
  {
    labelKey: "track.topic.contextEngineering",
    query: "Context Engineering",
    href: "/applications",
    aliases: ["context", "上下文", "rag", "agent", "evidence"],
  },
];

export type RecoveryTopic = (typeof recoveryTopics)[number];

export function getRecoveryTopics(query: string): RecoveryTopic[] {
  const normalized = query.toLowerCase();
  return recoveryTopics
    .map(topic => ({
      ...topic,
      score: topic.aliases.filter(alias =>
        normalized.includes(alias.toLowerCase())
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
