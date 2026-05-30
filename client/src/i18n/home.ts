import type { TranslationDict } from "./types";

const home: TranslationDict = {
  // Hero section
  "home.title": { en: "AI Algorithms & Application Systems", zh: "AI 算法与应用系统" },
  "home.subtitle": {
    en: "A technical notebook for model mechanisms and AI application engineering: Transformers, long-context algorithms, agent systems, RAG, context engines, evaluation harnesses, and the practical constraints behind reliable AI systems.",
    zh: "记录模型机制与 AI 应用工程：Transformer、长上下文算法、Agent 系统、RAG、Context Engine、评测 Harness，以及可靠 AI 系统背后的工程约束。",
  },
  "home.chip1": { en: "Explore Frontiers", zh: "探索前沿" },
  "home.chip2": { en: "Understand Intelligence", zh: "理解智能" },
  "home.chip3": { en: "Drive Innovation", zh: "推动创新" },

  // Author card
  "home.authorName": { en: "Misaya Yang", zh: "Misaya Yang" },
  "home.authorRole": { en: "Researcher / Blogger", zh: "研究者 / 博客作者" },
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
