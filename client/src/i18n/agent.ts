import type { TranslationDict } from "./types";

const agent: TranslationDict = {
  "agent.launcher.label": {
    en: "Blog Agent",
    zh: "AI 助手",
  },
  "agent.launcher.tooltip": {
    en: "Ask AI about public posts and reading paths",
    zh: "基于公开文章、标签与阅读路径提问",
  },
  "agent.header.title": {
    en: "Blog Agent",
    zh: "博客 Agent",
  },
  "agent.header.subtitle": {
    en: "Grounded in public posts",
    zh: "基于公开文章回答",
  },
  "agent.header.close": {
    en: "Close assistant",
    zh: "关闭助手",
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
  "agent.scope.site": {
    en: "Site-wide",
    zh: "全站",
  },
  "agent.scope.post": {
    en: "Current post",
    zh: "当前文章",
  },
  "agent.scope.category": {
    en: "Category",
    zh: "分类",
  },
  "agent.scope.tag": {
    en: "Tag",
    zh: "标签",
  },
  "agent.scope.track": {
    en: "Track",
    zh: "技术区",
  },
  "agent.welcome.title": {
    en: "Ask about the public knowledge map",
    zh: "询问公开知识地图",
  },
  "agent.welcome.body": {
    en: "I can summarize articles, compare tracks, and suggest source-grounded reading paths.",
    zh: "可以解读文章、比较技术区，并给出带来源的阅读路径。",
  },
  "agent.input.placeholder": {
    en: "Ask about an article, tag, or reading path...",
    zh: "询问文章、标签或阅读路径...",
  },
  "agent.input.send": {
    en: "Send",
    zh: "发送",
  },
  "agent.input.retry": {
    en: "Retry",
    zh: "重试",
  },
  "agent.context.title": {
    en: "Conversation context",
    zh: "会话上下文",
  },
  "agent.context.toggle": {
    en: "Attach conversation context",
    zh: "添加会话上下文",
  },
  "agent.context.placeholder": {
    en: "Paste short notes, article fragments, or question context...",
    zh: "粘贴短笔记、文章片段或问题上下文...",
  },
  "agent.context.attach": {
    en: "Attach",
    zh: "添加",
  },
  "agent.context.file": {
    en: ".txt / .md",
    zh: ".txt / .md",
  },
  "agent.context.active": {
    en: "Attached",
    zh: "已挂载",
  },
  "agent.context.attached": {
    en: "Context attached to this conversation.",
    zh: "上下文已挂载到当前会话。",
  },
  "agent.context.blocked": {
    en: "Context upload limit reached for today.",
    zh: "今日上下文上传额度已用完。",
  },
  "agent.context.error": {
    en: "The context source could not be attached.",
    zh: "上下文未能添加。",
  },
  "agent.context.unsupported": {
    en: "Only .txt and .md files are supported for now.",
    zh: "目前只支持 .txt 和 .md 文件。",
  },
  "agent.prompts.postSummary": {
    en: "Summarize this article from a technical angle.",
    zh: "从技术角度总结这篇文章。",
  },
  "agent.prompts.postAssumptions": {
    en: "What assumptions and failure modes matter here?",
    zh: "这里有哪些关键假设和失败模式？",
  },
  "agent.prompts.nextReading": {
    en: "What should I read next on this blog?",
    zh: "接下来应该读博客里的哪篇？",
  },
  "agent.prompts.siteThemes": {
    en: "What are the main technical themes on this blog?",
    zh: "这个博客的主要技术主题是什么？",
  },
  "agent.prompts.compareTracks": {
    en: "Compare AI Algorithms and AI Applications.",
    zh: "比较 AI 算法和 AI 应用两个技术区。",
  },
  "agent.prompts.readingPath": {
    en: "Suggest a source-grounded reading path.",
    zh: "推荐一条有来源依据的阅读路径。",
  },
  "agent.sources.title": {
    en: "Sources",
    zh: "来源",
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
  "agent.quota.remaining": {
    en: "{remaining} of {limit} left today",
    zh: "今日剩余 {remaining}/{limit}",
  },
  "agent.quota.low": {
    en: "{remaining} left today",
    zh: "今日还可问 {remaining} 次",
  },
  "agent.quota.blockedAnonymous": {
    en: "Anonymous limit reached. Use a visitor identity to continue with 6 questions/day.",
    zh: "未登录额度已用完。使用游客身份可继续提问，每天 6 次。",
  },
  "agent.quota.blockedVisitor": {
    en: "Visitor limit reached. Please continue after the daily reset.",
    zh: "游客额度已用完，请在每日重置后继续。",
  },
  "agent.error.bootstrap": {
    en: "The assistant could not load its session. You can try opening it again.",
    zh: "助手暂时无法加载会话，可以稍后重新打开。",
  },
  "agent.error.send": {
    en: "The assistant could not finish this answer. Your draft is preserved.",
    zh: "助手未能完成回答，草稿已保留。",
  },
  "agent.error.history": {
    en: "This conversation could not be loaded.",
    zh: "无法加载这段对话。",
  },
  "agent.error.noPublicContext": {
    en: "I could not find enough public blog context for this question.",
    zh: "没有找到足够的公开博客上下文来回答这个问题。",
  },
  "agent.refusal.hidden": {
    en: "I can only answer from public posts and cannot discuss hidden or admin-only material.",
    zh: "我只能基于公开文章回答，不能讨论隐藏或仅管理员可见的内容。",
  },
};

export default agent;
