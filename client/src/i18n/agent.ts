import type { TranslationDict } from "./types";

const agent: TranslationDict = {
  "agent.launcher.label": {
    en: "Blog Agent",
    zh: "博客助手",
  },
  "agent.launcher.tooltip": {
    en: "Ask about public notes and reading paths",
    zh: "询问公开笔记与阅读路径",
  },
  "agent.header.title": {
    en: "Blog Agent",
    zh: "博客助手",
  },
  "agent.header.subtitle": {
    en: "Grounded in public notes",
    zh: "基于公开笔记",
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
  "agent.history.owner.admin": {
    en: "owner",
    zh: "作者",
  },
  "agent.history.owner.visitor": {
    en: "visitor",
    zh: "访客",
  },
  "agent.history.owner.anonymous": {
    en: "anonymous",
    zh: "匿名",
  },
  "agent.scope.site": {
    en: "All notes",
    zh: "全站笔记",
  },
  "agent.scope.post": {
    en: "Current post",
    zh: "当前文章",
  },
  "agent.scope.postContextReady": {
    en: "Current article context connected",
    zh: "当前文章上下文已接入",
  },
  "agent.scope.postScope": {
    en: "Article scope",
    zh: "文章范围",
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
  "agent.trust.publicScope": {
    en: "Answers cite public notes in this {scope} scope.",
    zh: "回答会引用这个{scope}范围内的公开笔记。",
  },
  "agent.trust.contextPrivate": {
    en: "Private pasted or uploaded context stays conversation-local.",
    zh: "你粘贴或上传的私有上下文只用于当前会话。",
  },
  "agent.trust.contextAttached": {
    en: "Attached context is active, but public source cards stay separated.",
    zh: "已接入会话上下文，但公开来源卡片会保持分离。",
  },
  "agent.welcome.title": {
    en: "Ask from the notebook",
    zh: "从笔记里提问",
  },
  "agent.welcome.body": {
    en: "Use public notes to summarize topics, compare reading threads, and inspect sources.",
    zh: "可以解读公开笔记、比较阅读线索，并标出使用的来源。",
  },
  "agent.welcome.postTitle": {
    en: "Read this article with a companion",
    zh: "带着伴读理解这篇文章",
  },
  "agent.welcome.postBody": {
    en: "Ask for the core mechanism, prerequisites, implementation takeaways, or a checklist grounded in public posts.",
    zh: "可以询问核心机制、前置知识、实现要点，或生成基于公开文章的阅读清单。",
  },
  "agent.welcome.trackTitle": {
    en: "Explore this research track",
    zh: "探索这个研究方向",
  },
  "agent.welcome.trackBody": {
    en: "Ask which article to read first, how concepts connect, or how to move through the track as a reading path.",
    zh: "可以询问先读哪篇、概念如何连接，或让助手整理一条技术区阅读路径。",
  },
  "agent.welcome.discoveryTitle": {
    en: "Turn the index into a reading plan",
    zh: "把索引变成阅读计划",
  },
  "agent.welcome.discoveryBody": {
    en: "Use public search, archive, tags, and categories to narrow a topic and find the right next article.",
    zh: "基于公开搜索、归档、标签与分类缩小主题，找到下一篇该读的文章。",
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
  "agent.context.count": {
    en: "{count} attached",
    zh: "已挂载 {count} 个",
  },
  "agent.context.supported": {
    en: "Paste notes or attach .txt/.md files. Context is used only in this conversation.",
    zh: "可粘贴笔记或添加 .txt/.md 文件；上下文只用于当前会话。",
  },
  "agent.context.limit": {
    en: "Text is limited to 20k characters per attachment.",
    zh: "每次上下文最多 20k 字符。",
  },
  "agent.context.lifecycle": {
    en: "Attached context stays with this conversation; clearing is not available yet.",
    zh: "已挂载上下文会跟随当前会话；暂未提供单独清除入口。",
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
  "agent.prompts.postAbstraction": {
    en: "Explain the core mechanism in this article.",
    zh: "解释这篇文章里的核心机制。",
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
  "agent.prompts.siteThemes": {
    en: "What are the main technical themes on this blog?",
    zh: "这个博客的主要技术主题是什么？",
  },
  "agent.prompts.compareTracks": {
    en: "Compare the AI Algorithms and AI Applications threads.",
    zh: "比较 AI 算法和 AI 应用两条阅读线索。",
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
  "agent.trace.thinking": {
    en: "Thinking",
    zh: "思考中",
  },
  "agent.trace.done": {
    en: "Thought through",
    zh: "已思考",
  },
  "agent.trace.elapsed": {
    en: "({seconds}s)",
    zh: "（用时 {seconds} 秒）",
  },
  "agent.trace.waiting": {
    en: "Preparing the answer...",
    zh: "正在整理回答...",
  },
  "agent.trace.reasoning": {
    en: "Model reasoning",
    zh: "模型推理",
  },
  "agent.trace.currentPage": {
    en: "current page",
    zh: "当前页",
  },
  "agent.trace.stage.understanding": {
    en: "Read the question and route context",
    zh: "读取问题与页面上下文",
  },
  "agent.trace.stage.retrieval": {
    en: "Search public blog knowledge",
    zh: "检索公开博客知识",
  },
  "agent.trace.stage.sources": {
    en: "Selected {count} source(s) {current}",
    zh: "选取 {count} 个来源 {current}",
  },
  "agent.trace.stage.reasoning": {
    en: "Plan a source-grounded answer",
    zh: "组织有来源依据的回答",
  },
  "agent.trace.stage.answer": {
    en: "Stream answer",
    zh: "流式生成回答",
  },
  "agent.trace.stage.saving": {
    en: "Save answer and source cards",
    zh: "保存回答与来源卡片",
  },
  "agent.related.title": {
    en: "Related questions",
    zh: "相关问题",
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
    en: "Anonymous limit reached. Use a visitor identity to continue with 30 questions/day.",
    zh: "未登录额度已用完。使用游客身份可继续提问，每天 30 次。",
  },
  "agent.quota.blockedVisitor": {
    en: "Visitor limit reached. Please continue after the daily reset.",
    zh: "游客额度已用完，请在每日重置后继续。",
  },
  "agent.quota.lowDetail": {
    en: "You are almost out of daily questions. Visitor identity gives a larger daily allowance when anonymous quota is low.",
    zh: "今日提问额度快用完了；匿名额度不足时，可使用游客身份获得更高每日额度。",
  },
  "agent.quota.adminDetail": {
    en: "Admin sessions use the admin quota tier for maintenance and QA.",
    zh: "管理员会话使用独立额度层，用于维护和质量检查。",
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
  "agent.error.noPublicContext": {
    en: "Not enough public blog context was found for this question.",
    zh: "没有找到足够的公开博客上下文来回答这个问题。",
  },
  "agent.refusal.hidden": {
    en: "Answers are limited to public posts; hidden or admin-only material is not available.",
    zh: "回答范围仅限公开文章；隐藏或仅管理员可见的内容不可用于回答。",
  },
};

export default agent;
