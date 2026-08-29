import type { TranslationDict } from "./types";

const agent: TranslationDict = {
  "agent.launcher.label": {
    en: "Ask notes",
    zh: "问笔记",
  },
  "agent.launcher.tooltip": {
    en: "Ask about public notes and reading paths",
    zh: "询问公开笔记与阅读路径",
  },
  "agent.header.title": {
    en: "Notes Assistant",
    zh: "笔记助手",
  },
  "agent.header.subtitle": {
    en: "Misaya Notes",
    zh: "Misaya Notes",
  },
  "agent.header.close": {
    en: "Close assistant",
    zh: "关闭助手",
  },
  "agent.panel.resize": {
    en: "Resize assistant panel",
    zh: "调整助手面板大小",
  },
  "agent.panel.resizeHint": {
    en: "Drag or use arrow keys to resize. Double-click to restore the default size.",
    zh: "拖拽或使用方向键调整大小，双击恢复默认尺寸。",
  },
  "agent.thread.new": {
    en: "New thread",
    zh: "新对话",
  },
  "agent.context.currentReading": {
    en: "Currently reading",
    zh: "当前阅读",
  },
  "agent.context.siteWide": {
    en: "Searches all public notes",
    zh: "可检索全部公开笔记",
  },
  "agent.empty.postBody": {
    en: "Ask about this note directly, or have me search related public notes.",
    zh: "可以直接问这篇笔记，也可以让我查找相关公开笔记。",
  },
  "agent.empty.siteBody": {
    en: "Have me search, compare, and connect all public notes.",
    zh: "可以让我查找、比较、串联全部公开笔记。",
  },
  "agent.history.title": {
    en: "Recent conversations",
    zh: "最近对话",
  },
  "agent.history.button": {
    en: "History",
    zh: "历史",
  },
  "agent.history.empty": {
    en: "No saved conversations yet",
    zh: "暂无历史对话",
  },
  "agent.history.continue": {
    en: "Continue",
    zh: "继续",
  },
  "agent.history.noTime": {
    en: "No time",
    zh: "无时间",
  },
  "agent.input.placeholder": {
    en: "Ask about a note, section, or reading path...",
    zh: "询问笔记、小节或阅读路径...",
  },
  "agent.input.send": {
    en: "Send",
    zh: "发送",
  },
  "agent.input.cancel": {
    en: "Stop generating",
    zh: "停止生成",
  },
  "agent.input.retry": {
    en: "Retry",
    zh: "重试",
  },
  "agent.bootstrap.unavailable": {
    en: "Assistant unavailable",
    zh: "助手暂不可用",
  },
  "agent.bootstrap.retry": {
    en: "Reload assistant",
    zh: "重新加载助手",
  },
  "agent.prompts.postSummary": {
    en: "Summarize this article from a technical angle.",
    zh: "从技术角度总结这篇文章。",
  },
  "agent.prompts.postAbstraction": {
    en: "Explain the core mechanism in this article.",
    zh: "解释这篇文章里的核心机制。",
  },
  "agent.prompts.postCoreWithTitle": {
    en: "Explain the core mechanism in {title}.",
    zh: "解释《{title}》里的核心机制。",
  },
  "agent.prompts.postImplementation": {
    en: "What implementation takeaways matter here?",
    zh: "这篇文章里哪些实现要点最重要？",
  },
  "agent.prompts.postChecklist": {
    en: "Generate a reading checklist for this article.",
    zh: "为这篇文章生成阅读检查清单。",
  },
  "agent.prompts.postCompare": {
    en: "Compare this article with another public post.",
    zh: "把这篇文章和另一篇公开文章做对比。",
  },
  "agent.prompts.postAssumptions": {
    en: "What assumptions and failure modes matter here?",
    zh: "这里有哪些关键假设和失败模式？",
  },
  "agent.prompts.nextReading": {
    en: "What should I read next on this blog?",
    zh: "接下来应该读博客里的哪篇？",
  },
  "agent.prompts.readingPath": {
    en: "Suggest a source-grounded reading path.",
    zh: "推荐一条有来源依据的阅读路径。",
  },
  "agent.prompts.applicationsFirst": {
    en: "Which AI Applications note should I read first?",
    zh: "AI 应用方向应该先读哪篇？",
  },
  "agent.prompts.applicationsPath": {
    en: "Build a reading path for agent evaluation.",
    zh: "为 Agent 评测整理一条阅读路径。",
  },
  "agent.prompts.applicationsCompare": {
    en: "Compare Harness Engine, Evidence Packet, and Agent Loop.",
    zh: "比较 Harness Engine、Evidence Packet 和 Agent Loop。",
  },
  "agent.prompts.applicationsMap": {
    en: "Explain how the AI Applications notes connect.",
    zh: "说明 AI 应用笔记之间怎么连接。",
  },
  "agent.prompts.algorithmsFirst": {
    en: "Which AI Algorithms note should I read first?",
    zh: "AI 算法方向应该先读哪篇？",
  },
  "agent.prompts.algorithmsMap": {
    en: "Explain how the AI Algorithms notes connect.",
    zh: "说明 AI 算法笔记之间怎么连接。",
  },
  "agent.prompts.algorithmsCompare": {
    en: "Compare residual stability and long-context mechanisms.",
    zh: "比较残差稳定性和长上下文机制。",
  },
  "agent.prompts.algorithmsPrereq": {
    en: "What prerequisites do I need for the algorithm track?",
    zh: "阅读算法方向需要哪些前置知识？",
  },
  "agent.prompts.searchSynthesize": {
    en: "Synthesize these search results into a reading path.",
    zh: "把这些搜索结果整理成阅读路径。",
  },
  "agent.prompts.searchNarrow": {
    en: "Help me narrow this topic to the right public posts.",
    zh: "帮我把这个主题收敛到合适的公开文章。",
  },
  "agent.prompts.archiveRecent": {
    en: "What changed in the newest public articles?",
    zh: "最新公开文章主要更新了什么？",
  },
  "agent.prompts.archiveSeries": {
    en: "Group the archive into research series.",
    zh: "按研究系列整理归档文章。",
  },
  "agent.prompts.topicMap": {
    en: "Trace this topic across public posts.",
    zh: "沿着公开文章梳理这个主题。",
  },
  "agent.prompts.topicCompare": {
    en: "Compare the main ideas inside this topic.",
    zh: "比较这个主题下的主要观点。",
  },
  "agent.sources.title": {
    en: "Sources",
    zh: "来源",
  },
  "agent.sources.count": {
    en: "{count} shown",
    zh: "{count} 个",
  },
  "agent.sources.countDetailed": {
    en: "{shown}/{total} shown",
    zh: "已显示 {shown}/{total}",
  },
  "agent.sources.summary": {
    en: "{count} source(s)",
    zh: "{count} 个来源",
  },
  "agent.sources.view": {
    en: "View sources",
    zh: "查看来源",
  },
  "agent.sources.hide": {
    en: "Hide sources",
    zh: "收起来源",
  },
  "agent.sources.previewMore": {
    en: "+{count}",
    zh: "+{count}",
  },
  "agent.sources.details": {
    en: "Excerpt and match",
    zh: "摘录与匹配依据",
  },
  "agent.sources.showAll": {
    en: "Show {count} more",
    zh: "展开剩余 {count} 个",
  },
  "agent.sources.showLess": {
    en: "Show fewer",
    zh: "收起来源",
  },
  "agent.sources.open": {
    en: "Open source",
    zh: "打开来源",
  },
  "agent.sources.site": {
    en: "Site overview",
    zh: "全站概览",
  },
  "agent.sources.blog": {
    en: "Blog",
    zh: "博客",
  },
  "agent.sources.context": {
    en: "Context",
    zh: "上下文",
  },
  "agent.sources.currentPage": {
    en: "Current page",
    zh: "当前页",
  },
  "agent.sources.reason": {
    en: "Match basis",
    zh: "相关依据",
  },
  "agent.sources.section": {
    en: "Section",
    zh: "小节",
  },
  "agent.sources.category": {
    en: "Category",
    zh: "分类",
  },
  "agent.sources.tags": {
    en: "Tags",
    zh: "标签",
  },
  "agent.sources.slug": {
    en: "Slug",
    zh: "Slug",
  },
  "agent.trace.waiting": {
    en: "Preparing the answer...",
    zh: "正在整理回答...",
  },
  "agent.related.title": {
    en: "Related questions",
    zh: "相关问题",
  },
  "agent.quota.low": {
    en: "{remaining} left today",
    zh: "今日还可问 {remaining} 次",
  },
  "agent.quota.blockedAnonymous": {
    en: "Anonymous limit reached. Use a visitor identity to continue with 30 questions/day.",
    zh: "未登录额度已用完。使用游客身份可继续提问，每天 30 次。",
  },
  "agent.quota.blockedVisitor": {
    en: "Visitor limit reached. Please continue after the daily reset.",
    zh: "游客额度已用完，请在每日重置后继续。",
  },
  "agent.quota.continueAsVisitor": {
    en: "Continue as visitor",
    zh: "以游客身份继续",
  },
  "agent.quota.visitorReady": {
    en: "Visitor identity is ready. The preserved question is back in the composer.",
    zh: "游客身份已就绪，保留的问题已放回输入框。",
  },
  "agent.quota.visitorError": {
    en: "Visitor identity could not be started. Try again later.",
    zh: "暂时无法启用游客身份，请稍后再试。",
  },
  "agent.error.bootstrap": {
    en: "The assistant could not load its session. You can try opening it again.",
    zh: "助手暂时无法加载会话，可以稍后重新打开。",
  },
  "agent.error.send": {
    en: "The assistant could not finish this answer. Your draft is preserved.",
    zh: "助手未能完成回答，草稿已保留。",
  },
  "agent.error.modelNotConfigured": {
    en: "The model service is not configured in production. Your draft is preserved.",
    zh: "线上模型服务暂未配置，草稿已保留。",
  },
  "agent.error.cancelled": {
    en: "Generation stopped. Your draft is preserved.",
    zh: "已停止生成，草稿已保留。",
  },
  "agent.error.timeout": {
    en: "The answer took too long and stopped. Your draft is preserved.",
    zh: "回答耗时过长已停止，草稿已保留。",
  },
  "agent.error.history": {
    en: "This conversation could not be loaded.",
    zh: "无法加载这段对话。",
  },
  "agent.recovery.failed": {
    en: "The question is still visible here. Retry when the assistant is available, or edit the preserved draft below.",
    zh: "这个问题仍保留在对话里。助手恢复后可重试，也可以编辑下方保留的草稿。",
  },
  "agent.recovery.cancelled": {
    en: "Generation was stopped. The partial turn stays visible so you can retry or revise the question.",
    zh: "生成已停止；这轮对话会保留，可直接重试或修改问题。",
  },
  "agent.recovery.timeout": {
    en: "The run timed out. The question is preserved and can be retried.",
    zh: "这次运行超时；问题已保留，可重新尝试。",
  },
  "agent.recovery.quota": {
    en: "The quota boundary stopped this run before retrieval. The question remains available here.",
    zh: "本轮在检索前被额度限制拦截；问题仍保留在这里。",
  },
  "agent.recovery.noSource": {
    en: "This is a public-source boundary, not a hidden answer. Try a topic covered by the public notes or add more detail to the question.",
    zh: "这是公开来源边界，不是隐藏答案。可以改问公开笔记覆盖的主题，或在问题中补充更多细节。",
  },
};

export default agent;
