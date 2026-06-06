import type { TranslationDict } from "./types";

const home: TranslationDict = {
  // Hero section
  "home.title": {
    en: "AI Algorithms and Applications",
    zh: "AI 算法与 AI 应用",
  },
  "home.subtitle": {
    en: "Research notes on model mechanisms, long-context behavior, agent infrastructure, RAG, and evaluation.",
    zh: "记录模型机制、长上下文行为、Agent 基础设施、RAG 与评测工程。",
  },
  "home.chip1": { en: "working notes", zh: "working notes" },
  "home.chip2": { en: "model mechanisms", zh: "模型机制" },
  "home.chip3": { en: "system notes", zh: "系统笔记" },

  // Author card
  "home.authorName": { en: "Misaya Yang", zh: "Misaya Yang" },
  "home.authorRole": { en: "research notebook", zh: "研究笔记" },
  "home.googleScholar": { en: "Google Scholar", zh: "Google Scholar" },

  // Search
  "home.searchPlaceholder": {
    en: "Search articles, keywords, topics...",
    zh: "搜索文章、关键词、主题...",
  },
  "home.searchShortcut": { en: "⌘ K", zh: "⌘ K" },

  // Stats
  "home.statArticles": { en: "Articles", zh: "文章" },
  "home.statCategories": { en: "Categories", zh: "分类" },
  "home.statViews": { en: "Views", zh: "阅读量" },

  // Sidebar - About
  "home.aboutTitle": { en: "About Me", zh: "关于我" },
  "home.aboutDescription": {
    en: "Notes on model mechanisms, long-context behavior, retrieval boundaries, and the engineering details behind reliable agent systems.",
    zh: "记录模型机制、长上下文行为、检索边界，以及可靠智能体系统背后的工程细节。",
  },
  "home.researchDirection": { en: "Research Directions", zh: "研究方向" },
  "home.recentFocus": { en: "Recent Focus", zh: "近期关注" },
  "home.recentFocus1": {
    en: "Position encoding and extrapolation from a frequency-domain perspective",
    zh: "频域视角下的位置编码与外推能力",
  },
  "home.recentFocus2": {
    en: "Efficient training and inference optimization for large models",
    zh: "大模型高效训练与推理优化",
  },
  "home.recentFocus3": {
    en: "Research on interpretability and generalization",
    zh: "可解释性与泛化能力研究",
  },

  // Sidebar - Tags
  "home.hotTags": { en: "Hot Tags", zh: "热门标签" },
  "home.algorithmsLabel": { en: "AI Algorithms", zh: "AI 算法" },
  "home.applicationsLabel": { en: "AI Applications", zh: "AI 应用" },

  // Articles section
  "home.latestArticles": { en: "Latest notes", zh: "最新笔记" },
  "home.noArticles": { en: "No articles found", zh: "暂无文章" },
  "home.readMore": { en: "Read more", zh: "阅读全文" },
  "home.minRead": { en: "min read", zh: "分钟阅读" },
  "home.reads": { en: "reads", zh: "次阅读" },
  "home.tagLatest": { en: "Latest", zh: "最新" },
  "home.tagResearch": { en: "Research", zh: "研究" },
  "home.tagRoPE": { en: "RoPE", zh: "RoPE" },
  "home.tagResidualMixing": { en: "Residual Mixing", zh: "Residual Mixing" },

  // Research Index sidebar
  "home.researchIndex": { en: "Notebook index", zh: "笔记索引" },
  "home.researchIndexKicker": { en: "Index", zh: "索引" },
  "home.activeSeries": { en: "Reading threads", zh: "阅读线索" },
  "home.startHere": { en: "Start here", zh: "从这里开始" },
  "home.pathsPending": { en: "Paths loading", zh: "路径整理中" },
  "home.notesPending": { en: "Notes loading", zh: "文章整理中" },
  "home.pathCount": { en: "{count} paths", zh: "{count} 条路径" },
  "home.publicNotes": { en: "{count} public notes", zh: "{count} 篇公开笔记" },
  "home.indexModels": { en: "Models", zh: "模型" },
  "home.indexSystems": { en: "Systems", zh: "系统" },
  "home.indexAgentHarness": { en: "Agent Harness", zh: "Agent Harness" },
  "home.indexEvaluation": { en: "Evaluation", zh: "评测" },

  // Focus tags (static research topics)
  "home.focusTag1": { en: "Transformer Architecture", zh: "Transformer 架构" },
  "home.focusTag2": {
    en: "Large Language Model (LLM)",
    zh: "大语言模型 (LLM)",
  },
  "home.focusTag3": { en: "Position Encoding", zh: "位置编码" },
  "home.focusTag4": { en: "RoPE", zh: "RoPE" },
  "home.focusTag5": { en: "Long Sequence Modeling", zh: "长序列建模" },
  "home.focusTag6": { en: "Frequency Domain Analysis", zh: "频域分析" },
  "home.focusTag7": { en: "Attention Mechanism", zh: "注意力机制" },
  "home.focusTag8": { en: "Efficiency Optimization", zh: "效率优化" },

  // Footer
  "home.footerTagline": {
    en: "Misaya Yang · Transformer systems · Long-context mechanisms",
    zh: "Misaya Yang · Transformer systems · Long-context mechanisms",
  },

  // Archive placeholder
  "archive.soon": { en: "Archive feature coming soon", zh: "归档功能即将上线" },

  // Discovery routes
  "discovery.archiveKicker": { en: "Chronological index", zh: "时间索引" },
  "discovery.archiveTitle": { en: "Archive", zh: "文章归档" },
  "discovery.archiveSubtitle": {
    en: "{count} public notes grouped by month for quick scanning.",
    zh: "{count} 篇公开文章，按月份组织，便于快速回溯。",
  },
  "discovery.archiveEmpty": {
    en: "No public articles are archived yet.",
    zh: "暂无可归档的公开文章。",
  },
  "discovery.articlesCount": { en: "{count} articles", zh: "{count} 篇文章" },
  "discovery.updated": { en: "Updated {date}", zh: "更新于 {date}" },
  "discovery.searchKicker": { en: "Full-site search", zh: "全站搜索" },
  "discovery.searchTitle": {
    en: "Search the research index",
    zh: "搜索研究索引",
  },
  "discovery.searchSubtitle": {
    en: "Search public articles across titles, excerpts, body text, categories, and tags.",
    zh: "跨标题、摘要、正文、分类与标签搜索所有公开文章。",
  },
  "discovery.searchPlaceholder": {
    en: "agent, RoPE, context engineering...",
    zh: "agent、RoPE、context engineering...",
  },
  "discovery.searchButton": { en: "Search", zh: "搜索" },
  "discovery.resultsFor": {
    en: "{count} results for “{query}”",
    zh: "“{query}” 的 {count} 个结果",
  },
  "discovery.latestPublic": {
    en: "Latest public articles",
    zh: "最新公开文章",
  },
  "discovery.searchEmpty": {
    en: "No public articles match this search.",
    zh: "没有匹配的公开文章。",
  },
  "discovery.recoveryTitle": {
    en: "No direct match yet",
    zh: "还没有直接命中",
  },
  "discovery.recoveryBody": {
    en: "“{query}” did not match a public note. Try a nearby topic, ask the reading assistant to synthesize from public sources, or continue through a thread.",
    zh: "“{query}” 暂时没有匹配公开笔记。可以试试相近主题、让阅读助手基于公开内容综合查找，或从阅读线索继续。",
  },
  "discovery.recoveryAskAgent": {
    en: "Ask the reader",
    zh: "询问阅读助手",
  },
  "discovery.recoveryTopics": {
    en: "Nearby topics",
    zh: "相近主题",
  },
  "discovery.recoveryTopicQuery": {
    en: "Search for {query}",
    zh: "搜索 {query}",
  },
  "discovery.recoveryPaths": {
    en: "Research paths",
    zh: "研究路径",
  },
  "discovery.recoverySignal": {
    en: "This zero-result query is kept as an owner-only content signal, without email, IP, or visitor details.",
    zh: "这个无结果查询会作为仅作者可见的内容信号保存，不包含邮箱、IP 或访客身份。",
  },
  "discovery.tagKicker": { en: "Tag index", zh: "标签索引" },
  "discovery.categoryKicker": { en: "Category index", zh: "分类索引" },
  "discovery.siblingTags": { en: "Related tags", zh: "相关标签" },
  "discovery.noSiblingTags": {
    en: "No related tags yet.",
    zh: "暂无相关标签。",
  },
  "discovery.noPosts": {
    en: "No public articles in this index yet.",
    zh: "这个索引下暂无公开文章。",
  },
  "discovery.taxonomyNotFound": { en: "Index not found", zh: "索引未找到" },

  // About
  "about.kicker": { en: "Profile", zh: "个人介绍" },
  "about.title": { en: "Misaya Yang", zh: "Misaya Yang" },
  "about.subtitle": {
    en: "I write about the mechanics of AI systems: model architecture, long-context behavior, agent infrastructure, retrieval, evaluation, and the engineering constraints behind reliable software.",
    zh: "我记录 AI 系统的机制与工程：模型架构、长上下文行为、Agent 基础设施、检索、评测，以及可靠软件背后的工程约束。",
  },
  "about.focusTitle": { en: "Current focus", zh: "当前关注" },
  "about.focusBody": {
    en: "This blog is maintained as a working research notebook. The goal is to keep ideas precise enough to implement, inspect, and revisit later.",
    zh: "这个博客更像持续维护的研究笔记：每个想法都尽量写到可以实现、检查，并在之后重新审视的程度。",
  },
  "about.focus1": {
    en: "Long-context mechanisms and positional encoding",
    zh: "长上下文机制与位置编码",
  },
  "about.focus2": {
    en: "Agent protocols, harnesses, and observability",
    zh: "Agent 协议、Harness 与可观测性",
  },
  "about.focus3": {
    en: "RAG, context engineering, and retrieval boundaries",
    zh: "RAG、Context Engineering 与检索边界",
  },
  "about.focus4": {
    en: "Evaluation loops for production AI systems",
    zh: "生产级 AI 系统的评测循环",
  },
  "about.linksTitle": { en: "Links", zh: "链接" },
  "about.location": {
    en: "Shanghai / Remote research notes",
    zh: "上海 / 远程研究笔记",
  },
  // Track pages
  "track.articles": { en: "Technical Articles", zh: "技术文章" },
  "track.backHome": { en: "Back to index", zh: "返回索引" },
  "track.statTopics": { en: "Topics / Technical Map", zh: "专题 / 技术地图" },
  "track.topicNodes": { en: "Technical Nodes", zh: "技术节点" },
  "track.seriesTitle": { en: "Reading paths", zh: "阅读路径" },
  "track.nextPlanned": { en: "Next planned", zh: "后续计划" },
  "track.readingOrder": { en: "Reading order", zh: "阅读顺序" },
  "track.researchMap": { en: "Research map", zh: "研究地图" },
  "track.algorithms.mapNote": {
    en: "Follow the invariant: what quantity is preserved, what projection enforces it, and where the architecture pays for the constraint.",
    zh: "沿着不变量阅读：保留什么量、由哪个投影约束、架构在哪里为稳定性付出代价。",
  },
  "track.applications.mapNote": {
    en: "Follow the runtime boundary: what enters context, what becomes a trace, and how agent behavior is evaluated instead of narrated.",
    zh: "沿着运行时边界阅读：什么进入上下文、什么留下 trace，以及如何评测 Agent 行为而不是讲故事。",
  },
  "track.topicHint": {
    en: "Topics are represented as tags and article series.",
    zh: "专题通过标签和系列文章表达。",
  },
  "track.algorithms.chip1": { en: "Mechanisms", zh: "机制" },
  "track.algorithms.chip2": { en: "Scaling", zh: "扩展" },
  "track.algorithms.chip3": { en: "Reliability", zh: "可靠性" },
  "track.algorithms.title": { en: "AI Algorithms", zh: "AI 算法研究" },
  "track.algorithms.subtitle": {
    en: "Research notes on architecture, positional encoding, long-context behavior, and residual stability.",
    zh: "围绕模型架构、位置编码、长上下文行为与残差稳定性展开研究记录。",
  },
  "track.algorithms.overview": {
    en: "This track keeps the mathematical and architectural side of the blog: hypotheses, derivations, invariants, and implementation implications for deep learning systems.",
    zh: "这个技术区保留博客中偏数学和架构机制的一侧：假设、推导、不变量，以及它们对深度学习系统实现的影响。",
  },
  "track.algorithms.topicTitle": { en: "Algorithm Index", zh: "算法索引" },
  "track.applications.chip1": { en: "Agents", zh: "Agent" },
  "track.applications.chip2": { en: "Context", zh: "上下文" },
  "track.applications.chip3": { en: "Evaluation", zh: "评测" },
  "track.applications.title": {
    en: "AI Applications",
    zh: "AI 应用工程",
  },
  "track.applications.subtitle": {
    en: "Technical essays on agents, harness engines, RAG, context engineering, tool use, and evaluation loops.",
    zh: "记录 Agent、Harness Engine、RAG、Context Engineering、工具调用与评测循环。",
  },
  "track.applications.overview": {
    en: "This track is written as engineering analysis rather than product marketing: system boundaries, protocols, trade-offs, evaluation loops, and lessons from building AI application infrastructure.",
    zh: "这个技术区以工程分析而非产品宣传的方式书写：系统边界、协议、权衡、评测循环，以及构建应用系统基础设施时的经验。",
  },
  "track.applications.topicTitle": { en: "Application Index", zh: "应用索引" },
  "track.applications.focus1": { en: "Agent Systems", zh: "Agent 系统" },
  "track.applications.focus2": { en: "Harness Engine", zh: "Harness Engine" },
  "track.applications.focus3": { en: "RAG & Retrieval", zh: "RAG 与检索" },
  "track.applications.focus4": {
    en: "Context Engineering",
    zh: "Context Engineering",
  },
  "track.applications.focus5": { en: "Fine-tuning", zh: "微调" },
  "track.applications.focus6": { en: "Evaluation", zh: "评测" },
  "track.topic.positionEncoding": { en: "Position Encoding", zh: "位置编码" },
  "track.topic.rope": { en: "RoPE", zh: "RoPE" },
  "track.topic.isohc": { en: "IsoHC", zh: "IsoHC" },
  "track.topic.stability": { en: "Stability", zh: "稳定性" },
  "track.topic.longContext": { en: "Long Context", zh: "长上下文" },
  "track.topic.scaling": { en: "Scaling", zh: "扩展" },
  "track.topic.residualMixing": { en: "Residual Mixing", zh: "残差混合" },
  "track.topic.architecture": { en: "Architecture", zh: "架构" },
  "track.topic.gatedFfn": { en: "Gated FFN", zh: "门控 FFN" },
  "track.topic.swiglu": { en: "SwiGLU", zh: "SwiGLU" },
  "track.topic.channelMixing": { en: "Channel Mixing", zh: "通道混合" },
  "track.topic.agentSystems": { en: "Agent Systems", zh: "Agent 系统" },
  "track.topic.toolUse": { en: "Tool Use", zh: "工具调用" },
  "track.topic.harnessEngine": { en: "Harness Engine", zh: "Harness Engine" },
  "track.topic.evaluation": { en: "Evaluation", zh: "评测" },
  "track.topic.ragRetrieval": { en: "RAG & Retrieval", zh: "RAG 与检索" },
  "track.topic.grounding": { en: "Grounding", zh: "接地" },
  "track.topic.contextEngineering": {
    en: "Context Engineering",
    zh: "Context Engineering",
  },
  "track.topic.memory": { en: "Memory", zh: "记忆" },
  "track.topic.fineTuning": { en: "Fine-tuning", zh: "微调" },
  "track.topic.adaptation": { en: "Adaptation", zh: "适配" },
  "track.topic.observability": { en: "Observability", zh: "可观测性" },
  "track.topic.reliability": { en: "Reliability", zh: "可靠性" },
  "series.agentRuntime.title": {
    en: "Agent Runtime Systems",
    zh: "Agent Runtime Systems",
  },
  "series.agentRuntime.promise": {
    en: "From controlled evaluation to observable multi-step agent runtimes.",
    zh: "从受控评测走向可观测的多步 Agent 运行时。",
  },
  "series.agentRuntime.next1": { en: "Tool ABI", zh: "Tool ABI" },
  "series.agentRuntime.next2": { en: "Context Budget", zh: "Context Budget" },
  "series.agenticRag.title": {
    en: "Agentic RAG Infrastructure",
    zh: "Agentic RAG Infrastructure",
  },
  "series.agenticRag.promise": {
    en: "How retrieval becomes governed, citable context for agents.",
    zh: "检索如何变成可治理、可引用的 Agent 上下文。",
  },
  "series.agenticRag.next1": { en: "Hybrid Retrieval", zh: "Hybrid Retrieval" },
  "series.agenticRag.next2": { en: "Retrieval Eval", zh: "Retrieval Eval" },
  "series.longContext.title": {
    en: "Long Context and Position Encoding",
    zh: "Long Context and Position Encoding",
  },
  "series.longContext.promise": {
    en: "Mechanistic notes on RoPE, spectral allocation, and long-context behavior.",
    zh: "关于 RoPE、频谱分配和长上下文行为的机制笔记。",
  },
  "series.longContext.next1": {
    en: "RoPE spectral budget",
    zh: "RoPE spectral budget",
  },
  "series.longContext.next2": {
    en: "Extrapolation failures",
    zh: "Extrapolation failures",
  },
  "series.residualStability.title": {
    en: "Residual Stability",
    zh: "Residual Stability",
  },
  "series.residualStability.promise": {
    en: "Residual stream mixing, invariants, and stability constraints.",
    zh: "残差流混合、不变量和稳定性约束。",
  },
  "series.residualStability.next1": {
    en: "Residual diagnostics",
    zh: "Residual diagnostics",
  },
  "series.residualStability.next2": {
    en: "Orthogonal constraints",
    zh: "Orthogonal constraints",
  },
  "series.feedForward.title": {
    en: "Feed-Forward Mechanisms",
    zh: "前馈机制",
  },
  "series.feedForward.promise": {
    en: "From vanilla FFN to gated MLPs, channel mixing, and multiplicative feature control.",
    zh: "从普通 FFN 走到门控 MLP、通道混合和乘法特征控制。",
  },
  "series.feedForward.next1": {
    en: "Gated activation statistics",
    zh: "门控激活统计",
  },
  "series.feedForward.next2": {
    en: "FFN parameter budget",
    zh: "FFN 参数预算",
  },
};

export default home;
