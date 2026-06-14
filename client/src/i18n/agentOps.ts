import type { TranslationDict } from "./types";

const agentOps: TranslationDict = {
  "agentOps.title": { en: "Agent Operations", zh: "Agent 运维" },
  "agentOps.subtitle": {
    en: "Check index freshness, retrieval misses, evals, traces, and reader questions from one console.",
    zh: "在一个控制台检查索引新鲜度、检索缺口、eval、trace 和读者问题。",
  },
  "agentOps.loginRequired": {
    en: "Admin login is required to inspect agent operations.",
    zh: "需要管理员登录后查看 Agent 运维。",
  },
  "agentOps.back": { en: "Back to content", zh: "返回内容管理" },
  "agentOps.index.title": { en: "Index Status", zh: "索引状态" },
  "agentOps.index.loading": {
    en: "Loading index status...",
    zh: "正在读取索引状态...",
  },
  "agentOps.index.error": {
    en: "Index status is unavailable. Check admin auth and database connectivity.",
    zh: "索引状态暂不可用，请检查管理员登录和数据库连接。",
  },
  "agentOps.index.chunks": { en: "Chunks", zh: "Chunk 数" },
  "agentOps.index.publicPosts": { en: "Public posts", zh: "公开文章" },
  "agentOps.index.coverage": { en: "Coverage", zh: "覆盖率" },
  "agentOps.index.excluded": { en: "Excluded", zh: "已排除" },
  "agentOps.index.fresh": {
    en: "Knowledge index is aligned",
    zh: "知识索引已对齐",
  },
  "agentOps.index.needsReindex": {
    en: "Knowledge index needs attention",
    zh: "知识索引需要处理",
  },
  "agentOps.index.lastReindex": { en: "Last indexed", zh: "最近索引" },
  "agentOps.index.cliOnly": {
    en: "Reindex remains a CLI-only operation for now:",
    zh: "当前重建索引仍通过 CLI 执行：",
  },
  "agentOps.index.stale": { en: "Missing public posts", zh: "缺失公开文章" },
  "agentOps.index.extra": { en: "Extra indexed posts", zh: "额外索引文章" },
  "agentOps.index.latestError": { en: "Latest error", zh: "最近错误" },
  "agentOps.debug.title": { en: "Retrieval Debugger", zh: "检索调试器" },
  "agentOps.debug.query": {
    en: "Question or retrieval query",
    zh: "问题或检索查询",
  },
  "agentOps.debug.run": { en: "Inspect retrieval", zh: "调试检索" },
  "agentOps.debug.empty": {
    en: "No retrieval result yet.",
    zh: "还没有检索结果。",
  },
  "agentOps.debug.diagnostics": { en: "Diagnostics", zh: "诊断" },
  "agentOps.debug.terms": { en: "Query terms", zh: "查询词" },
  "agentOps.debug.expandedTerms": { en: "Expanded terms", zh: "扩展词" },
  "agentOps.debug.currentPageContext": {
    en: "Current page context injected",
    zh: "已接入当前页面上下文",
  },
  "agentOps.debug.failureReason": { en: "Failure reason", zh: "失败原因" },
  "agentOps.debug.missingTerms": { en: "Missing terms", zh: "未命中词" },
  "agentOps.evals.title": { en: "Local Eval Runner", zh: "本地 Eval" },
  "agentOps.evals.questions": {
    en: "One question per line",
    zh: "每行一个问题",
  },
  "agentOps.evals.run": { en: "Run evals", zh: "运行 Eval" },
  "agentOps.evals.passed": { en: "Passed", zh: "通过" },
  "agentOps.evals.failed": { en: "Needs review", zh: "需检查" },
  "agentOps.evals.refusals": { en: "Refusal cases", zh: "拒答用例" },
  "agentOps.evals.expectedSourceAnswer": {
    en: "Source-backed",
    zh: "需来源支撑",
  },
  "agentOps.evals.expectedRefusal": { en: "Refusal", zh: "需拒答" },
  "agentOps.evals.expectedSources": { en: "Expected sources", zh: "期望来源" },
  "agentOps.evals.missingSources": { en: "Missing sources", zh: "缺失来源" },
  "agentOps.traces.title": { en: "Recent Traces", zh: "近期 Trace" },
  "agentOps.traces.refresh": { en: "Refresh traces", zh: "刷新 Trace" },
  "agentOps.traces.empty": {
    en: "No agent runs yet.",
    zh: "暂无 Agent 运行记录。",
  },
  "agentOps.traces.sources": { en: "Sources", zh: "来源" },
  "agentOps.ideas.title": { en: "Content Radar", zh: "内容雷达" },
  "agentOps.ideas.conversation": { en: "Conversation ID", zh: "会话 ID" },
  "agentOps.ideas.run": { en: "Extract ideas", zh: "提炼选题" },
  "agentOps.ideas.empty": {
    en: "Paste a conversation ID to extract ideas.",
    zh: "输入会话 ID 后提炼选题。",
  },
  "agentOps.radar.title": { en: "Agent Question Radar", zh: "Agent 问题雷达" },
  "agentOps.radar.description": {
    en: "Groups frequent, no-source, and failed Agent questions into owner-only writing candidates.",
    zh: "把高频、无来源和失败的 Agent 问题聚合成仅作者可见的写作候选。",
  },
  "agentOps.radar.loading": {
    en: "Loading question radar...",
    zh: "正在读取问题雷达...",
  },
  "agentOps.radar.error": {
    en: "Question radar is unavailable.",
    zh: "问题雷达暂不可用。",
  },
  "agentOps.radar.totalRuns": { en: "Runs", zh: "运行数" },
  "agentOps.radar.uniqueQuestions": { en: "Unique questions", zh: "不同问题" },
  "agentOps.radar.noSourceRuns": { en: "No-source", zh: "无来源" },
  "agentOps.radar.failedRuns": { en: "Failed", zh: "失败" },
  "agentOps.radar.questions": { en: "Question signals", zh: "问题信号" },
  "agentOps.radar.empty": {
    en: "No repeated or weak-answer questions yet.",
    zh: "暂无重复或弱回答问题。",
  },
  "agentOps.radar.supportCount": {
    en: "{count} signals",
    zh: "{count} 个信号",
  },
  "agentOps.radar.ideas": { en: "Candidate article ideas", zh: "候选文章选题" },
  "agentOps.radar.noIdeas": {
    en: "No candidate ideas yet.",
    zh: "暂无候选选题。",
  },
  "agentOps.radar.searchMisses": {
    en: "Search miss backlog",
    zh: "搜索缺口 backlog",
  },
  "agentOps.radar.searchMissesDescription": {
    en: "Zero-result public searches become owner-only writing or linking opportunities.",
    zh: "公开搜索的零结果会变成仅作者可见的写作或补链机会。",
  },
  "agentOps.radar.searchMissEmpty": {
    en: "No zero-result searches yet.",
    zh: "暂无零结果搜索。",
  },
  "agentOps.radar.searchMissCount": {
    en: "{count} misses",
    zh: "{count} 次未命中",
  },
  "agentOps.radar.searchMissUnique": {
    en: "{count} queries",
    zh: "{count} 个查询",
  },
  "agentOps.radar.failureSignals": {
    en: "Failure and no-source signals",
    zh: "失败与无来源信号",
  },
  "agentOps.radar.signalFrequent": { en: "Frequent", zh: "高频" },
  "agentOps.radar.signalNoSource": { en: "No source", zh: "无来源" },
  "agentOps.radar.signalFailed": { en: "Failed", zh: "失败" },
  "agentOps.radar.statusNew": { en: "New", zh: "新建" },
  "agentOps.radar.statusReviewed": { en: "Reviewed", zh: "已查看" },
  "agentOps.radar.statusPlanned": { en: "Planned", zh: "计划中" },
  "agentOps.radar.statusDismissed": { en: "Dismissed", zh: "已忽略" },
  "agentOps.sources": { en: "Sources", zh: "来源" },
  "agentOps.sourceCount": { en: "{count} sources", zh: "{count} 个来源" },
  "agentOps.status": { en: "Status", zh: "状态" },
  "agentOps.latency": { en: "Latency", zh: "延迟" },
  "agentOps.tokens": { en: "Tokens", zh: "Token" },
};

export default agentOps;
