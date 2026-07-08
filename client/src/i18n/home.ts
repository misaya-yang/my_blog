import type { TranslationDict } from "./types";

const home: TranslationDict = {
  // Hero section
  "home.title": {
    en: "AI Algorithms and Applications",
    zh: "AI 算法与 AI 应用",
  },
  "home.subtitle": {
    en: "Research notes on model mechanisms, generative modeling, long-context behavior, agent infrastructure, RAG, and evaluation.",
    zh: "记录模型机制、生成建模、长上下文行为、Agent 基础设施、RAG 与评测工程。",
  },
  "home.kicker": {
    en: "Two-track research notebook",
    zh: "双轨研究笔记",
  },
  "home.chip1": { en: "working notes", zh: "工作笔记" },
  "home.chip2": { en: "model mechanisms", zh: "模型机制" },
  "home.chip3": { en: "system notes", zh: "系统笔记" },

  // Author card
  "home.authorName": { en: "Misaya Yang", zh: "Misaya Yang" },
  "home.authorRole": { en: "research notebook", zh: "研究笔记" },
  "home.googleScholar": { en: "Google Scholar", zh: "Google Scholar" },

  // Search
  "home.searchPlaceholder": {
    en: "Search notes...",
    zh: "搜索笔记...",
  },
  "home.searchShortcut": { en: "⌘ K", zh: "⌘ K" },
  "home.askAssistant": { en: "Ask assistant", zh: "询问助手" },

  // Stats
  "home.statArticles": { en: "Articles", zh: "文章" },
  "home.statCategories": { en: "Categories", zh: "分类" },
  "home.statViews": { en: "Views", zh: "阅读量" },

  // Sidebar - About
  "home.aboutTitle": { en: "About", zh: "关于本站" },
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
  "home.latestNote": { en: "Latest note", zh: "最新一篇" },
  "home.noArticles": { en: "No articles found", zh: "暂无文章" },
  "home.noArticlesRecovery": {
    en: "Use archive, search, or the reading assistant to continue through public notes.",
    zh: "可以从归档、搜索或阅读助手继续找公开笔记。",
  },
  "home.loadingArticles": {
    en: "Loading public notes...",
    zh: "正在加载公开笔记...",
  },
  "home.loadingArticlesSlow": {
    en: "Still loading public notes. The article index will appear here.",
    zh: "公开笔记仍在加载中，文章索引会出现在这里。",
  },
  "home.readMore": { en: "Read more", zh: "阅读全文" },
  "home.minRead": { en: "min read", zh: "分钟阅读" },
  "home.reads": { en: "reads", zh: "次阅读" },
  "home.tagLatest": { en: "Latest", zh: "最新" },
  "home.tagResearch": { en: "Research", zh: "研究" },
  "home.tagRoPE": { en: "RoPE", zh: "RoPE" },
  "home.tagResidualMixing": { en: "Residual Mixing", zh: "残差混合" },

  // Research Index sidebar
  "home.researchIndex": { en: "Notebook index", zh: "笔记索引" },
  "home.researchIndexKicker": { en: "Index", zh: "索引" },
  "home.activeSeries": { en: "Reading threads", zh: "阅读线索" },
  "home.trackPathLabel": { en: "Reading path", zh: "阅读路径" },
  "home.mapSummaryLabel": {
    en: "Notebook structure summary",
    zh: "笔记结构概览",
  },
  "home.mapTracks": { en: "Tracks", zh: "方向" },
  "home.mapPaths": { en: "Paths", zh: "路径" },
  "home.mapNotes": { en: "Notes", zh: "笔记" },
  "home.trackCount": { en: "{count} tracks", zh: "{count} 个方向" },
  "home.trackTopicLabel": { en: "Track concepts", zh: "方向概念" },
  "home.algorithmsPathTitle": {
    en: "Residual, feed-forward, long-context",
    zh: "残差、前馈、长上下文",
  },
  "home.applicationsPathTitle": {
    en: "Agents, retrieval, evaluation",
    zh: "Agent、检索、评测",
  },
  "home.algorithmsPathSummary": {
    en: "Mechanism notes that start from model internals and end at implementation constraints.",
    zh: "从模型内部机制出发，落到实现约束和架构取舍。",
  },
  "home.applicationsPathSummary": {
    en: "Agent runtime notes ordered from controlled evaluation to observable production loops.",
    zh: "从受控评测读到可观测的生产级 Agent 运行循环。",
  },
  "home.enterAlgorithms": { en: "Enter AI Algorithms", zh: "进入 AI 算法" },
  "home.enterApplications": {
    en: "Enter AI Applications",
    zh: "进入 AI 应用",
  },
  "home.emptyTrack": {
    en: "Public notes for this track are still being organized.",
    zh: "这个方向的公开笔记仍在整理。",
  },
  "home.moreNotes": { en: "More notes", zh: "更多笔记" },
  "home.moreNotesHint": {
    en: "A compact scan of recent public writing. The full list lives in the archive.",
    zh: "这里保留少量近期公开文章，完整列表在归档中。",
  },
  "home.allNotes": { en: "Open archive", zh: "打开归档" },
  "home.startHere": { en: "Start here", zh: "从这里开始" },
  "home.startHereHint": {
    en: "Read the newest note, or enter a track if you already know the question.",
    zh: "先读最新一篇，或按问题直接进入一条研究路径。",
  },
  "home.startLatest": { en: "Newest note", zh: "最新文章" },
  "home.startAlgorithms": { en: "Algorithms path", zh: "算法路径" },
  "home.startApplications": { en: "Applications path", zh: "应用路径" },
  "home.pathsPending": { en: "Paths loading", zh: "路径整理中" },
  "home.notesPending": { en: "Notes loading", zh: "文章整理中" },
  "home.pathCount": { en: "{count} paths", zh: "{count} 条路径" },
  "home.publicNotes": { en: "{count} public notes", zh: "{count} 篇公开笔记" },
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
  "home.focusTag9": { en: "Generative Modeling", zh: "生成建模" },

  // Footer
  "home.footerTagline": {
    en: "Misaya Yang. Transformer systems and long-context mechanisms.",
    zh: "Misaya Yang。Transformer 系统与长上下文机制。",
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
  "discovery.archiveLoading": {
    en: "Loading public notes grouped by month.",
    zh: "正在按月份读取公开文章。",
  },
  "discovery.archiveEmpty": {
    en: "No public articles are archived yet.",
    zh: "暂无可归档的公开文章。",
  },
  "discovery.archiveSummaryNotesLabel": {
    en: "Public notes",
    zh: "公开笔记",
  },
  "discovery.archiveSummaryNotes": {
    en: "{count} notes",
    zh: "{count} 篇",
  },
  "discovery.archiveSummaryMonthsLabel": {
    en: "Time span",
    zh: "时间跨度",
  },
  "discovery.archiveSummaryMonths": {
    en: "{count} months",
    zh: "{count} 个月份",
  },
  "discovery.archiveSummarySearch": {
    en: "Search archive",
    zh: "搜索归档",
  },
  "discovery.archiveSummaryPaths": {
    en: "Reading paths",
    zh: "阅读路径",
  },
  "discovery.articlesCount": { en: "{count} articles", zh: "{count} 篇文章" },
  "discovery.moreTags": { en: "+{count}", zh: "+{count}" },
  "discovery.taxonomyResultRange": {
    en: "Showing {start}-{end} of {total}",
    zh: "正在显示 {start}-{end} / {total}",
  },
  "discovery.taxonomyPageStatus": {
    en: "Page {page} of {totalPages}",
    zh: "第 {page} / {totalPages} 页",
  },
  "discovery.taxonomyPageSizeHint": {
    en: "{count} articles per page",
    zh: "每页 {count} 篇",
  },
  "discovery.taxonomyPageEmpty": {
    en: "No public articles on this page.",
    zh: "这一页暂无公开文章。",
  },
  "discovery.updated": { en: "Updated {date}", zh: "更新于 {date}" },
  "discovery.searchKicker": { en: "Full-site search", zh: "全站搜索" },
  "discovery.searchTitle": {
    en: "Search public notes",
    zh: "搜索公开笔记",
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
  "discovery.searchingFor": {
    en: "Searching for “{query}”",
    zh: "正在搜索“{query}”",
  },
  "discovery.latestPublic": {
    en: "Latest public articles",
    zh: "最新公开文章",
  },
  "discovery.searchEmpty": {
    en: "No public articles match this search.",
    zh: "没有匹配的公开文章。",
  },
  "discovery.searchFailed": {
    en: "Search is unavailable",
    zh: "搜索暂时不可用",
  },
  "discovery.searchFailedHint": {
    en: "The request failed. Retry, or browse the archive while it recovers.",
    zh: "请求没有成功。可以重试，或先浏览归档。",
  },
  "discovery.searchStartTitle": {
    en: "Start with a nearby thread",
    zh: "从相近线索开始",
  },
  "discovery.searchStartBody": {
    en: "Use topic cues, reading paths, or the archive before typing a precise query.",
    zh: "在输入精确问题前，可以先从主题线索、阅读路径或归档进入。",
  },
  "discovery.searchStartTopics": {
    en: "Nearby topics",
    zh: "相近主题",
  },
  "discovery.searchStartPaths": {
    en: "Reading paths",
    zh: "阅读路径",
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
  "discovery.recoveryAssistantScope": {
    en: "The assistant searches public articles, tags, categories, and the current search.",
    zh: "助手会基于公开文章、标签、分类和当前搜索词检索。",
  },
  "discovery.clearSearch": {
    en: "Clear search",
    zh: "清空搜索",
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
    en: "Reading paths",
    zh: "阅读路径",
  },
  "discovery.recoverySignal": {
    en: "This no-result search is saved as an author-only topic cue, without email, IP, or visitor details.",
    zh: "这次无结果搜索只会作为作者可见的选题线索保存，不包含邮箱、IP 或访客身份。",
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
  "about.kicker": { en: "Author note", zh: "作者札记" },
  "about.title": { en: "Misaya Yang", zh: "Misaya Yang" },
  "about.subtitle": {
    en: "Notes on the mechanics of AI systems: model architecture, long-context behavior, agent infrastructure, retrieval, evaluation, and the engineering constraints behind reliable software.",
    zh: "记录 AI 系统的机制与工程：模型架构、长上下文行为、Agent 基础设施、检索、评测，以及可靠软件背后的工程约束。",
  },
  "about.focusTitle": { en: "Current focus", zh: "当前关注" },
  "about.focusBody": {
    en: "Research notes on AI system mechanics, engineering constraints, and evaluation loops, written for implementation and later review.",
    zh: "记录 AI 系统机制、工程边界与评测循环，重点放在可实现和可复查的细节。",
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
    zh: "RAG、上下文工程与检索边界",
  },
  "about.focus4": {
    en: "Evaluation loops for production AI systems",
    zh: "生产级 AI 系统的评测循环",
  },
  "about.linksTitle": { en: "Links", zh: "链接" },
  "about.location": {
    en: "Shanghai, remote research notes",
    zh: "上海，远程研究笔记",
  },
  // Track pages
  "track.articles": { en: "All notes", zh: "全部笔记" },
  "track.backHome": { en: "Back to index", zh: "返回索引" },
  "track.statTopics": { en: "Topics", zh: "专题" },
  "track.seriesTitle": { en: "Reading paths", zh: "阅读路径" },
  "track.nextPlanned": { en: "Next planned", zh: "后续计划" },
  "track.readingOrder": { en: "Path", zh: "路径" },
  "track.orientationLabel": {
    en: "Track reading orientation",
    zh: "方向阅读入口",
  },
  "track.startHere": { en: "Start here", zh: "从这里开始" },
  "track.corePaths": { en: "Core paths", zh: "核心路径" },
  "track.recentNotes": { en: "Recent notes", zh: "近期笔记" },
  "track.readingOrderHint": {
    en: "Start with the path, then use the note index below for lookup.",
    zh: "先读路径，再用下方笔记索引查找细节。",
  },
  "track.researchMap": { en: "Topic index", zh: "主题索引" },
  "track.algorithms.mapNote": {
    en: "Read by mechanism: what is being modeled, what constrains it, and what it costs to implement.",
    zh: "按机制阅读：它建模什么、受什么约束、实现代价在哪里。",
  },
  "track.applications.mapNote": {
    en: "Read by runtime: context boundaries, traces, and evaluation loops.",
    zh: "按运行时阅读：上下文边界、调用轨迹和评测循环。",
  },
  "track.algorithms.chip1": { en: "Mechanisms", zh: "机制" },
  "track.algorithms.chip2": { en: "Scaling", zh: "扩展" },
  "track.algorithms.chip3": { en: "Reliability", zh: "可靠性" },
  "track.algorithms.title": { en: "AI Algorithms", zh: "AI 算法研究" },
  "track.algorithms.subtitle": {
    en: "Research notes on architecture, generative modeling, positional encoding, long-context behavior, and residual stability.",
    zh: "围绕模型架构、生成建模、位置编码、长上下文行为与残差稳定性展开研究记录。",
  },
  "track.algorithms.overview": {
    en: "This track keeps the mathematical and architectural side of the blog: hypotheses, derivations, generative objectives, invariants, and implementation implications for deep learning systems.",
    zh: "这个方向整理偏数学和架构机制的笔记：假设、推导、生成目标、不变量，以及它们如何影响深度学习系统实现。",
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
    zh: "记录 Agent 系统、Harness Engine、RAG、上下文工程、工具调用与评测循环。",
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
    zh: "上下文工程",
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
  "track.topic.generativeModeling": {
    en: "Generative Modeling",
    zh: "生成建模",
  },
  "track.topic.flowMatching": { en: "Flow Matching", zh: "Flow Matching" },
  "track.topic.diffusionModels": {
    en: "Diffusion Models",
    zh: "扩散模型",
  },
  "track.topic.rlhf": { en: "RLHF", zh: "RLHF" },
  "track.topic.preferenceOptimization": {
    en: "Preference Optimization",
    zh: "偏好优化",
  },
  "track.topic.verifiableRewards": {
    en: "Verifiable Rewards",
    zh: "可验证奖励",
  },
  "track.topic.agentSystems": { en: "Agent Systems", zh: "Agent 系统" },
  "track.topic.toolUse": { en: "Tool Use", zh: "工具调用" },
  "track.topic.harnessEngine": { en: "Harness Engine", zh: "Harness Engine" },
  "track.topic.evaluation": { en: "Evaluation", zh: "评测" },
  "track.topic.ragRetrieval": { en: "RAG & Retrieval", zh: "RAG 与检索" },
  "track.topic.grounding": { en: "Grounding", zh: "来源约束" },
  "track.topic.contextEngineering": {
    en: "Context Engineering",
    zh: "上下文工程",
  },
  "track.topic.memory": { en: "Memory", zh: "记忆" },
  "track.topic.fineTuning": { en: "Fine-tuning", zh: "微调" },
  "track.topic.adaptation": { en: "Adaptation", zh: "适配" },
  "track.topic.observability": { en: "Observability", zh: "可观测性" },
  "track.topic.reliability": { en: "Reliability", zh: "可靠性" },
  "series.agentRuntime.title": {
    en: "Agent Runtime Systems",
    zh: "Agent 运行时系统",
  },
  "series.agentRuntime.promise": {
    en: "From controlled evaluation to observable multi-step agent runtimes.",
    zh: "从受控评测走向可观测的多步 Agent 运行时。",
  },
  "series.agentRuntime.next1": { en: "Tool ABI", zh: "Tool ABI" },
  "series.agentRuntime.next2": { en: "Context Budget", zh: "上下文预算" },
  "series.agenticRag.title": {
    en: "Agentic RAG Infrastructure",
    zh: "Agentic RAG 基础设施",
  },
  "series.agenticRag.promise": {
    en: "How retrieval becomes governed, citable context for agents.",
    zh: "检索如何变成可治理、可引用的 Agent 上下文。",
  },
  "series.agenticRag.next1": { en: "Hybrid Retrieval", zh: "混合检索" },
  "series.agenticRag.next2": { en: "Retrieval Eval", zh: "检索评测" },
  "series.longContext.title": {
    en: "Long Context and Position Encoding",
    zh: "长上下文与位置编码",
  },
  "series.longContext.promise": {
    en: "Mechanistic notes on RoPE, spectral allocation, and long-context behavior.",
    zh: "关于 RoPE、频谱分配和长上下文行为的机制笔记。",
  },
  "series.longContext.next1": {
    en: "RoPE spectral budget",
    zh: "RoPE 频谱预算",
  },
  "series.longContext.next2": {
    en: "Extrapolation failures",
    zh: "外推失败模式",
  },
  "series.residualStability.title": {
    en: "Residual Stability",
    zh: "残差稳定性",
  },
  "series.residualStability.promise": {
    en: "Residual stream mixing, invariants, and stability constraints.",
    zh: "残差流混合、不变量和稳定性约束。",
  },
  "series.residualStability.next1": {
    en: "Residual diagnostics",
    zh: "残差诊断",
  },
  "series.residualStability.next2": {
    en: "Orthogonal constraints",
    zh: "正交约束",
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
  "series.generativeModeling.title": {
    en: "Generative Modeling",
    zh: "生成建模",
  },
  "series.generativeModeling.promise": {
    en: "Diffusion, flow matching, transport maps, and efficient samplers.",
    zh: "从扩散、Flow Matching、运输映射到高效采样器。",
  },
  "series.generativeModeling.next1": {
    en: "Flow model solvers",
    zh: "Flow 模型采样器",
  },
  "series.generativeModeling.next2": {
    en: "Conditional transport",
    zh: "条件运输",
  },
  "series.llmPostTrainingRl.title": {
    en: "LLM Post-Training and RL",
    zh: "大模型后训练与强化学习",
  },
  "series.llmPostTrainingRl.promise": {
    en: "RLHF, preference optimization, verifiable rewards, and agent RL after pretraining.",
    zh: "从 RLHF、偏好优化、可验证奖励到 Agent RL 的后训练路线图。",
  },
  "series.llmPostTrainingRl.next1": {
    en: "RLVR reward design",
    zh: "RLVR 奖励设计",
  },
  "series.llmPostTrainingRl.next2": {
    en: "Beyond DPO",
    zh: "DPO 之后",
  },
};

export default home;
