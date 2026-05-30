import type { TranslationDict } from "./types";

const home: TranslationDict = {
  // Hero section
  "home.title": { en: "AI Algorithms & Application Systems", zh: "AI 算法与应用系统" },
  "home.subtitle": {
    en: "A technical notebook for model mechanisms and AI application engineering: Transformers, long-context algorithms, agent systems, RAG, context engines, evaluation harnesses, and the practical constraints behind reliable AI systems.",
    zh: "记录模型机制与 AI 应用工程：Transformer、长上下文算法、Agent 系统、RAG、Context Engine、评测 Harness，以及可靠 AI 系统背后的工程约束。",
  },
  "home.chip1": { en: "RoPE", zh: "RoPE" },
  "home.chip2": { en: "Long Context", zh: "长上下文" },
  "home.chip3": { en: "Agent Evaluation", zh: "Agent 评测" },

  // Author card
  "home.authorName": { en: "Misaya Yang", zh: "Misaya Yang" },
  "home.authorRole": { en: "AI systems research notes", zh: "AI 系统研究笔记" },
  "home.googleScholar": { en: "Google Scholar", zh: "Google Scholar" },

  // Search
  "home.searchPlaceholder": { en: "Search articles, keywords, topics...", zh: "搜索文章、关键词、主题..." },
  "home.searchShortcut": { en: "⌘ K", zh: "⌘ K" },

  // Stats
  "home.statArticles": { en: "Articles / Continuously Updated", zh: "文章 / 持续更新中" },
  "home.statCategories": { en: "Categories / Systematically Organized", zh: "分类 / 系统化整理" },
  "home.statViews": { en: "Views / Total Reads", zh: "阅读量 / 总计浏览次数" },

  // Sidebar - About
  "home.aboutTitle": { en: "About Me", zh: "关于我" },
  "home.aboutDescription": {
    en: "Passionate about deep learning and algorithm research, focusing on large model training and inference, position encoding mechanisms, long-sequence modeling, and the practical application of frontier AI technologies.",
    zh: "热衷于深度学习与算法研究，关注大模型的训练与推理、位置编码机制、长序列建模以及前沿 AI 技术的落地与应用。",
  },
  "home.researchDirection": { en: "Research Directions", zh: "研究方向" },
  "home.recentFocus": { en: "Recent Focus", zh: "近期关注" },
  "home.recentFocus1": { en: "Position encoding and extrapolation from a frequency-domain perspective", zh: "频域视角下的位置编码与外推能力" },
  "home.recentFocus2": { en: "Efficient training and inference optimization for large models", zh: "大模型高效训练与推理优化" },
  "home.recentFocus3": { en: "Research on interpretability and generalization", zh: "可解释性与泛化能力研究" },

  // Sidebar - Tags
  "home.hotTags": { en: "Hot Tags", zh: "热门标签" },
  "home.algorithmsLabel": { en: "AI Algorithms", zh: "AI 算法" },
  "home.applicationsLabel": { en: "AI Applications", zh: "AI 应用" },

  // Articles section
  "home.latestArticles": { en: "Latest Articles", zh: "最新文章" },
  "home.noArticles": { en: "No articles found", zh: "暂无文章" },
  "home.readMore": { en: "Read more", zh: "阅读全文" },
  "home.minRead": { en: "min read", zh: "分钟阅读" },
  "home.reads": { en: "reads", zh: "次阅读" },
  "home.tagLatest": { en: "Latest", zh: "最新" },
  "home.tagResearch": { en: "Research", zh: "研究" },
  "home.tagRoPE": { en: "RoPE", zh: "RoPE" },
  "home.tagResidualMixing": { en: "Residual Mixing", zh: "Residual Mixing" },

  // Research Index sidebar
  "home.researchIndex": { en: "Research Index", zh: "研究索引" },

  // Focus tags (static research topics)
  "home.focusTag1": { en: "Transformer Architecture", zh: "Transformer 架构" },
  "home.focusTag2": { en: "Large Language Model (LLM)", zh: "大语言模型 (LLM)" },
  "home.focusTag3": { en: "Position Encoding", zh: "位置编码" },
  "home.focusTag4": { en: "RoPE", zh: "RoPE" },
  "home.focusTag5": { en: "Long Sequence Modeling", zh: "长序列建模" },
  "home.focusTag6": { en: "Frequency Domain Analysis", zh: "频域分析" },
  "home.focusTag7": { en: "Attention Mechanism", zh: "注意力机制" },
  "home.focusTag8": { en: "Efficiency Optimization", zh: "效率优化" },

  // Footer
  "home.footerTagline": { en: "Misaya Yang · Transformer systems · Long-context mechanisms", zh: "Misaya Yang · Transformer systems · Long-context mechanisms" },

  // Archive placeholder
  "archive.soon": { en: "Archive feature coming soon", zh: "归档功能即将上线" },

  // Discovery routes
  "discovery.archiveKicker": { en: "Chronological index", zh: "时间索引" },
  "discovery.archiveTitle": { en: "Archive", zh: "文章归档" },
  "discovery.archiveSubtitle": {
    en: "{count} public notes grouped by month for quick scanning.",
    zh: "{count} 篇公开文章，按月份组织，便于快速回溯。",
  },
  "discovery.archiveEmpty": { en: "No public articles are archived yet.", zh: "暂无可归档的公开文章。" },
  "discovery.articlesCount": { en: "{count} articles", zh: "{count} 篇文章" },
  "discovery.updated": { en: "Updated {date}", zh: "更新于 {date}" },
  "discovery.searchKicker": { en: "Full-site search", zh: "全站搜索" },
  "discovery.searchTitle": { en: "Search the research index", zh: "搜索研究索引" },
  "discovery.searchSubtitle": {
    en: "Search public articles across titles, excerpts, body text, categories, and tags.",
    zh: "跨标题、摘要、正文、分类与标签搜索所有公开文章。",
  },
  "discovery.searchPlaceholder": { en: "agent, RoPE, context engineering...", zh: "agent、RoPE、context engineering..." },
  "discovery.searchButton": { en: "Search", zh: "搜索" },
  "discovery.resultsFor": { en: "{count} results for “{query}”", zh: "“{query}” 的 {count} 个结果" },
  "discovery.latestPublic": { en: "Latest public articles", zh: "最新公开文章" },
  "discovery.searchEmpty": { en: "No public articles match this search.", zh: "没有匹配的公开文章。" },
  "discovery.tagKicker": { en: "Tag index", zh: "标签索引" },
  "discovery.categoryKicker": { en: "Category index", zh: "分类索引" },
  "discovery.siblingTags": { en: "Related tags", zh: "相关标签" },
  "discovery.noSiblingTags": { en: "No related tags yet.", zh: "暂无相关标签。" },
  "discovery.noPosts": { en: "No public articles in this index yet.", zh: "这个索引下暂无公开文章。" },
  "discovery.taxonomyNotFound": { en: "Index not found", zh: "索引未找到" },

  // About / Projects
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
  "about.focus1": { en: "Long-context mechanisms and positional encoding", zh: "长上下文机制与位置编码" },
  "about.focus2": { en: "Agent protocols, harnesses, and observability", zh: "Agent 协议、Harness 与可观测性" },
  "about.focus3": { en: "RAG, context engineering, and retrieval boundaries", zh: "RAG、Context Engineering 与检索边界" },
  "about.focus4": { en: "Evaluation loops for production AI systems", zh: "生产级 AI 系统的评测循环" },
  "about.linksTitle": { en: "Links", zh: "链接" },
  "about.location": { en: "Shanghai / Remote research notes", zh: "上海 / 远程研究笔记" },
  "projects.kicker": { en: "Working threads", zh: "进行中的主题" },
  "projects.title": { en: "Projects", zh: "项目" },
  "projects.subtitle": {
    en: "A compact map of active research and engineering threads that connect articles into longer-running work.",
    zh: "这里整理持续推进的研究与工程主题，把单篇文章连接成更长期的工作线索。",
  },
  "projects.harness.title": { en: "Agent Harness Engine", zh: "Agent Harness Engine" },
  "projects.harness.body": {
    en: "Controlled task protocols, tool traces, and evaluation signals for tool-using agents.",
    zh: "围绕工具型 Agent 的任务协议、工具轨迹与评测信号进行控制与复现。",
  },
  "projects.context.title": { en: "Context Engineering", zh: "Context Engineering" },
  "projects.context.body": {
    en: "Research notes on memory, retrieval, prompt boundaries, and context policy in real AI software.",
    zh: "记录真实 AI 软件中的记忆、检索、提示边界与上下文策略。",
  },
  "projects.isohc.title": { en: "IsoHC / Residual Stability", zh: "IsoHC / 残差稳定性" },
  "projects.isohc.body": {
    en: "Architecture-side experiments around residual stream mixing, constraints, and stability.",
    zh: "围绕残差流混合、约束与稳定性的架构侧实验。",
  },

  // Track pages
  "track.articles": { en: "Technical Articles", zh: "技术文章" },
  "track.backHome": { en: "Back to Portal", zh: "返回总览" },
  "track.statTopics": { en: "Topics / Technical Map", zh: "专题 / 技术地图" },
  "track.topicHint": { en: "Topics are represented as tags and article series.", zh: "专题通过标签和系列文章表达。" },
  "track.algorithms.chip1": { en: "Mechanisms", zh: "机制" },
  "track.algorithms.chip2": { en: "Scaling", zh: "扩展" },
  "track.algorithms.chip3": { en: "Reliability", zh: "可靠性" },
  "track.algorithms.title": { en: "AI Algorithm Research", zh: "AI 算法研究" },
  "track.algorithms.subtitle": {
    en: "Research notes on model architecture, positional encoding, long-context behavior, residual stability, and the mechanisms that make modern AI systems efficient and reliable.",
    zh: "围绕模型架构、位置编码、长上下文行为、残差稳定性，以及现代 AI 系统高效可靠背后的机制展开研究记录。",
  },
  "track.algorithms.overview": {
    en: "This track keeps the mathematical and architectural side of the blog: hypotheses, derivations, invariants, and implementation implications for deep learning systems.",
    zh: "这个技术区保留博客中偏数学和架构机制的一侧：假设、推导、不变量，以及它们对深度学习系统实现的影响。",
  },
  "track.algorithms.topicTitle": { en: "Algorithm Index", zh: "算法索引" },
  "track.applications.chip1": { en: "Agents", zh: "Agent" },
  "track.applications.chip2": { en: "Context", zh: "上下文" },
  "track.applications.chip3": { en: "Evaluation", zh: "评测" },
  "track.applications.title": { en: "AI Application Engineering", zh: "AI 应用工程" },
  "track.applications.subtitle": {
    en: "Technical essays on agent systems, harness engines, RAG, context engineering, fine-tuning, tool use, and the failure modes that appear when AI capabilities become real software.",
    zh: "记录 Agent 系统、Harness Engine、RAG、Context Engineering、微调、工具调用，以及 AI 能力变成真实软件后出现的失败模式。",
  },
  "track.applications.overview": {
    en: "This track is written as engineering analysis rather than product marketing: system boundaries, protocols, trade-offs, evaluation loops, and lessons from building AI application infrastructure.",
    zh: "这个技术区以工程分析而非产品宣传的方式书写：系统边界、协议、权衡、评测循环，以及构建 AI 应用基础设施时的经验。",
  },
  "track.applications.topicTitle": { en: "Application Index", zh: "应用索引" },
  "track.applications.focus1": { en: "Agent Systems", zh: "Agent 系统" },
  "track.applications.focus2": { en: "Harness Engine", zh: "Harness Engine" },
  "track.applications.focus3": { en: "RAG & Retrieval", zh: "RAG 与检索" },
  "track.applications.focus4": { en: "Context Engineering", zh: "Context Engineering" },
  "track.applications.focus5": { en: "Fine-tuning", zh: "微调" },
  "track.applications.focus6": { en: "Evaluation", zh: "评测" },
};

export default home;
