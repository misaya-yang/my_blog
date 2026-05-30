import type { TranslationDict } from "./types";

const agentOps: TranslationDict = {
  "agentOps.title": { en: "Agent Operations", zh: "Agent 运维" },
  "agentOps.subtitle": {
    en: "Inspect retrieval, traces, evals, and article ideas without giving the model write access.",
    zh: "调试检索、查看 trace、运行 eval，并从对话提炼文章选题；不授予模型写入权限。",
  },
  "agentOps.loginRequired": {
    en: "Admin login is required to inspect agent operations.",
    zh: "需要管理员登录后查看 Agent 运维。",
  },
  "agentOps.back": { en: "Back to content", zh: "返回内容管理" },
  "agentOps.debug.title": { en: "Retrieval Debugger", zh: "检索调试器" },
  "agentOps.debug.query": { en: "Question or retrieval query", zh: "问题或检索查询" },
  "agentOps.debug.run": { en: "Inspect retrieval", zh: "调试检索" },
  "agentOps.debug.empty": { en: "No retrieval result yet.", zh: "还没有检索结果。" },
  "agentOps.evals.title": { en: "Local Eval Runner", zh: "本地 Eval" },
  "agentOps.evals.questions": {
    en: "One question per line",
    zh: "每行一个问题",
  },
  "agentOps.evals.run": { en: "Run evals", zh: "运行 Eval" },
  "agentOps.evals.passed": { en: "Passed", zh: "通过" },
  "agentOps.evals.failed": { en: "Needs review", zh: "需检查" },
  "agentOps.traces.title": { en: "Recent Traces", zh: "近期 Trace" },
  "agentOps.traces.refresh": { en: "Refresh traces", zh: "刷新 Trace" },
  "agentOps.traces.empty": { en: "No agent runs yet.", zh: "暂无 Agent 运行记录。" },
  "agentOps.ideas.title": { en: "Article Idea Extraction", zh: "文章选题提炼" },
  "agentOps.ideas.conversation": { en: "Conversation ID", zh: "会话 ID" },
  "agentOps.ideas.run": { en: "Extract ideas", zh: "提炼选题" },
  "agentOps.ideas.empty": { en: "Paste a conversation ID to extract ideas.", zh: "输入会话 ID 后提炼选题。" },
  "agentOps.sources": { en: "Sources", zh: "来源" },
  "agentOps.sourceCount": { en: "{count} sources", zh: "{count} 个来源" },
  "agentOps.status": { en: "Status", zh: "状态" },
  "agentOps.latency": { en: "Latency", zh: "延迟" },
  "agentOps.tokens": { en: "Tokens", zh: "Token" },
};

export default agentOps;
