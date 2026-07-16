import type { TranslationDict } from "./types";

const editor: TranslationDict = {
  // Auth guard
  "editor.authRequired": { en: "Admin login required", zh: "需要管理员登录" },
  "editor.authDescription": {
    en: "Sign in with the admin password to create or edit posts.",
    zh: "使用管理员密码登录后可创建或编辑文章。",
  },
  "editor.goToLogin": { en: "Go to login", zh: "去登录" },

  // Toolbar tooltips
  "editor.toolbar.heading1": { en: "Heading 1", zh: "一级标题" },
  "editor.toolbar.heading2": { en: "Heading 2", zh: "二级标题" },
  "editor.toolbar.heading3": { en: "Heading 3", zh: "三级标题" },
  "editor.toolbar.bold": { en: "Bold", zh: "粗体" },
  "editor.toolbar.italic": { en: "Italic", zh: "斜体" },
  "editor.toolbar.strikethrough": { en: "Strikethrough", zh: "删除线" },
  "editor.toolbar.inlineCode": { en: "Inline code", zh: "行内代码" },
  "editor.toolbar.bulletList": { en: "Bullet list", zh: "无序列表" },
  "editor.toolbar.orderedList": { en: "Ordered list", zh: "有序列表" },
  "editor.toolbar.quote": { en: "Quote", zh: "引用" },
  "editor.toolbar.divider": { en: "Divider", zh: "分隔线" },
  "editor.toolbar.link": { en: "Insert link", zh: "插入链接" },
  "editor.toolbar.image": { en: "Insert image", zh: "插入图片" },
  "editor.toolbar.codeBlock": { en: "Code block", zh: "代码块" },
  "editor.toolbar.inlineMath": { en: "Inline math", zh: "行内公式" },
  "editor.toolbar.mathBlock": { en: "Math block", zh: "公式块" },

  // Toolbar shortcuts (template text, not translated)
  "editor.shortcut.ctrl1": { en: "Ctrl+1", zh: "Ctrl+1" },
  "editor.shortcut.ctrl2": { en: "Ctrl+2", zh: "Ctrl+2" },
  "editor.shortcut.ctrl3": { en: "Ctrl+3", zh: "Ctrl+3" },
  "editor.shortcut.ctrlB": { en: "Ctrl+B", zh: "Ctrl+B" },
  "editor.shortcut.ctrlI": { en: "Ctrl+I", zh: "Ctrl+I" },
  "editor.shortcut.ctrlK": { en: "Ctrl+K", zh: "Ctrl+K" },
  "editor.shortcut.ctrlE": { en: "Ctrl+E", zh: "Ctrl+E" },
  "editor.shortcut.ctrlShiftP": { en: "Ctrl+Shift+P", zh: "Ctrl+Shift+P" },
  "editor.shortcut.esc": { en: "Esc", zh: "Esc" },

  // Header bar
  "editor.back": { en: "Back", zh: "返回" },
  "editor.newPost": { en: "New article", zh: "新建文章" },
  "editor.editPost": { en: "Edit article", zh: "编辑文章" },
  "editor.savedAt": { en: "Saved at", zh: "已保存于" },
  "editor.saving": { en: "Saving...", zh: "保存中..." },
  "editor.wordCount": { en: "words", zh: "字" },
  "editor.readingTime": { en: "min", zh: "分钟" },
  "editor.equationCount": { en: "equations", zh: "公式" },
  "editor.codeBlockCount": { en: "code blocks", zh: "代码块" },
  "editor.togglePreviewHide": { en: "Hide preview", zh: "隐藏预览" },
  "editor.togglePreviewShow": { en: "Show preview", zh: "显示预览" },
  "editor.exitFullscreen": { en: "Exit fullscreen", zh: "退出全屏" },
  "editor.enterFullscreen": { en: "Fullscreen", zh: "全屏模式" },
  "editor.backToContent": { en: "Back to content", zh: "返回内容管理" },
  "editor.load.notFoundTitle": {
    en: "Article draft not found",
    zh: "未找到文章草稿",
  },
  "editor.load.notFoundDescription": {
    en: 'No editable article matches "{slug}". It may have been renamed or removed.',
    zh: "没有与“{slug}”匹配的可编辑文章，可能已重命名或删除。",
  },
  "editor.load.errorTitle": {
    en: "Could not load this article",
    zh: "无法加载这篇文章",
  },
  "editor.load.errorDescription": {
    en: "The editor could not retrieve the latest article state. Retry before making changes.",
    zh: "编辑器无法获取文章的最新状态，请重试后再进行修改。",
  },

  // Title input
  "editor.titlePlaceholder": {
    en: "Enter article title...",
    zh: "输入文章标题...",
  },

  // Content placeholder
  "editor.contentPlaceholder": {
    en: "Start writing your article...\n\nSupports Markdown syntax:\n- # Heading 1\n- ## Heading 2\n- **Bold** and *Italic*\n- `Inline code` and ```Code blocks```\n- $Inline math$ and $$Math blocks$$\n- [Link](url) and ![Image](url)\n- > Quote\n- - List",
    zh: "开始撰写你的文章...\n\n支持 Markdown 语法：\n- # 一级标题\n- ## 二级标题\n- **粗体** 和 *斜体*\n- `行内代码` 和 ```代码块```\n- $行内公式$ 和 $$公式块$$\n- [链接](url) 和 ![图片](url)\n- > 引用\n- - 列表",
  },

  // Preview placeholder
  "editor.previewPlaceholder": {
    en: "Preview will appear here after you start writing...",
    zh: "开始撰写后，预览将显示在这里...",
  },

  // Research snippets sidebar
  "editor.snippetsTitle": { en: "Research Snippets", zh: "研究片段" },
  "editor.snippetsDescription": {
    en: "Quickly insert paper-style structures to keep claims and evidence clearly bounded.",
    zh: "快速插入论文式结构，保持主张和证据边界清楚。",
  },
  "editor.snippet.claim": { en: "Claim", zh: "主张" },
  "editor.snippet.claimHint": {
    en: "Claim / evidence / caveat",
    zh: "Claim / evidence / caveat",
  },
  "editor.snippet.theorem": { en: "Theorem", zh: "定理" },
  "editor.snippet.theoremHint": { en: "Theorem block", zh: "Theorem block" },
  "editor.snippet.proposition": { en: "Proposition", zh: "命题" },
  "editor.snippet.propositionHint": {
    en: "Proposition block",
    zh: "Proposition block",
  },
  "editor.snippet.experiment": { en: "Experiment", zh: "实验" },
  "editor.snippet.experimentHint": {
    en: "Setup / metric / result",
    zh: "Setup / metric / result",
  },
  "editor.snippet.formula": { en: "Formula", zh: "公式" },
  "editor.snippet.formulaHint": { en: "Display math", zh: "Display math" },
  "editor.snippet.figure": { en: "Figure", zh: "图注" },
  "editor.snippet.figureHint": { en: "Figure note", zh: "Figure note" },

  // Stats sidebar
  "editor.statEquations": { en: "Equations", zh: "公式" },
  "editor.statCodeBlocks": { en: "Code blocks", zh: "代码块" },
  "editor.statReadingTime": { en: "Reading", zh: "阅读" },

  // Settings sheet
  "editor.settingsTitle": { en: "Article Settings", zh: "文章设置" },
  "editor.settingsDescription": {
    en: "Configure category, tags, and other article properties",
    zh: "设置文章的分类、标签和其他属性",
  },
  "editor.excerptLabel": { en: "Excerpt", zh: "文章摘要" },
  "editor.excerptPlaceholder": {
    en: "Enter article excerpt, leave blank to auto-extract first 200 characters",
    zh: "输入文章摘要，留空将自动截取正文前200字",
  },
  "editor.coverImageLabel": { en: "Cover Image", zh: "封面图片" },
  "editor.coverImagePlaceholder": { en: "Enter image URL", zh: "输入图片URL" },
  "editor.coverPreview": { en: "Cover preview", zh: "封面预览" },
  "editor.categoryLabel": { en: "Category", zh: "分类" },
  "editor.categoryPlaceholder": { en: "Select category", zh: "选择分类" },
  "editor.tagsLabel": { en: "Tags", zh: "标签" },
  "editor.curationTitle": { en: "Series and curation", zh: "系列与精选" },
  "editor.seriesSlugPlaceholder": { en: "Series slug", zh: "系列 slug" },
  "editor.seriesTitlePlaceholder": { en: "Series title", zh: "系列标题" },
  "editor.seriesOrderPlaceholder": { en: "Series order", zh: "系列顺序" },
  "editor.featuredRankPlaceholder": { en: "Featured rank", zh: "首页精选排序" },
  "editor.pinnedTrackPlaceholder": { en: "Pinned track", zh: "置顶技术区" },
  "editor.pinnedTrackNone": { en: "No track pin", zh: "不置顶" },
  "editor.preflight.title": { en: "Preflight", zh: "发布检查" },
  "editor.preflight.ready": { en: "Ready", zh: "可发布" },
  "editor.preflight.readyDescription": {
    en: "No blockers or warnings are currently detected.",
    zh: "当前没有检测到阻断项或提醒项。",
  },
  "editor.preflight.blocked": {
    en: "Resolve publish blockers before publishing.",
    zh: "发布前请先处理阻断项。",
  },
  "editor.preflight.blockers": { en: "Blockers", zh: "阻断项" },
  "editor.preflight.warnings": { en: "Warnings", zh: "提醒项" },
  "editor.preflight.blockerCount": {
    en: "{count} blockers",
    zh: "{count} 个阻断",
  },
  "editor.preflight.warningCount": {
    en: "{count} warnings",
    zh: "{count} 个提醒",
  },
  "editor.preflight.ariaLabel": {
    en: "Publish preflight: {blockers} blockers and {warnings} warnings.",
    zh: "发布检查：{blockers} 个阻断项，{warnings} 个提醒项。",
  },
  "editor.preflight.issue.missing_title": {
    en: "Add a title before publishing.",
    zh: "发布前需要填写标题。",
  },
  "editor.preflight.issue.missing_content": {
    en: "Add article content before publishing.",
    zh: "发布前需要填写正文。",
  },
  "editor.preflight.issue.invalid_series_order": {
    en: "Series order must be a positive number.",
    zh: "系列顺序必须是正数。",
  },
  "editor.preflight.issue.invalid_featured_rank": {
    en: "Featured rank must be a positive number.",
    zh: "首页精选排序必须是正数。",
  },
  "editor.preflight.issue.missing_excerpt": {
    en: "Add an excerpt for public discovery and feeds.",
    zh: "建议补充摘要，方便公开发现和订阅源展示。",
  },
  "editor.preflight.issue.missing_category": {
    en: "Choose a category for public placement.",
    zh: "建议选择分类，明确公开归档位置。",
  },
  "editor.preflight.issue.missing_tags": {
    en: "Add at least one tag for search and taxonomy.",
    zh: "建议至少添加一个标签，帮助搜索和分类页聚合。",
  },
  "editor.preflight.issue.short_content": {
    en: "The article body is very short; verify it is intentional.",
    zh: "正文偏短，请确认这是有意为之。",
  },
  "editor.preflight.issue.series_without_order": {
    en: "Add a series order or clear the series slug.",
    zh: "请补充系列顺序，或清空系列 slug。",
  },
  "editor.preflight.issue.track_without_taxonomy": {
    en: "Pinned track works best with category and tag placement.",
    zh: "置顶技术区建议同时配置分类和标签。",
  },
  "editor.versionHistoryTitle": { en: "Version history", zh: "版本历史" },
  "editor.versionHistoryEmpty": {
    en: "No saved versions yet.",
    zh: "暂无已保存版本。",
  },
  "editor.versionRestore": { en: "Restore", zh: "恢复" },
  "editor.versionRestoreConfirm": {
    en: "Restore this version? The current content will be saved as a new version first.",
    zh: "确认恢复这个版本吗？当前内容会先保存为一个新版本。",
  },
  "editor.backlogSeed.source": {
    en: "Backlog source",
    zh: "Backlog 来源",
  },
  "editor.backlogSeed.readerQuestion": {
    en: "Reader question or missing path",
    zh: "读者问题或缺失路径",
  },
  "editor.backlogSeed.claim": {
    en: "Claim to make precise",
    zh: "需要精确化的主张",
  },
  "editor.backlogSeed.evidence": {
    en: "Evidence and implementation notes",
    zh: "证据与实现笔记",
  },
  "editor.backlogSeed.caveats": {
    en: "Caveats and follow-ups",
    zh: "限制与后续问题",
  },

  // Link dialog
  "editor.linkDialogTitle": { en: "Insert Link", zh: "插入链接" },
  "editor.linkDialogDescription": {
    en: "Enter link address and display text",
    zh: "输入链接地址和显示文本",
  },
  "editor.linkTextLabel": { en: "Link text", zh: "链接文本" },
  "editor.linkTextPlaceholder": { en: "Display text", zh: "显示的文本" },
  "editor.linkUrlLabel": { en: "Link address", zh: "链接地址" },
  "editor.linkUrlPlaceholder": {
    en: "https://example.com",
    zh: "https://example.com",
  },
  "editor.linkInsert": { en: "Insert", zh: "插入" },

  // Image dialog
  "editor.imageDialogTitle": { en: "Insert Image", zh: "插入图片" },
  "editor.imageDialogDescription": {
    en: "Enter image address",
    zh: "输入图片地址",
  },
  "editor.imageUrlLabel": { en: "Image address", zh: "图片地址" },
  "editor.imageUrlPlaceholder": {
    en: "https://example.com/image.jpg",
    zh: "https://example.com/image.jpg",
  },
  "editor.imageAltLabel": { en: "Alt text", zh: "替代文本" },
  "editor.imageAltPlaceholder": { en: "Image description", zh: "图片描述" },
  "editor.imagePreview": { en: "Preview", zh: "预览" },
  "editor.imageInsert": { en: "Insert", zh: "插入" },

  // Buttons
  "editor.saveDraft": { en: "Save Draft", zh: "保存草稿" },
  "editor.saveChanges": { en: "Save Changes", zh: "保存修改" },
  "editor.publish": { en: "Publish", zh: "发布" },

  // Toast
  "editor.toast.titleRequired": {
    en: "Please enter article title",
    zh: "请输入文章标题",
  },
  "editor.toast.contentRequired": {
    en: "Please enter article content",
    zh: "请输入文章内容",
  },
  "editor.toast.draftSaved": { en: "Draft saved", zh: "草稿已保存" },
  "editor.toast.saveFailed": {
    en: "Save failed, please try again",
    zh: "保存失败，请重试",
  },
  "editor.toast.published": { en: "Article published!", zh: "文章已发布！" },
  "editor.toast.publishFailed": {
    en: "Publish failed, please try again",
    zh: "发布失败，请重试",
  },
  "editor.toast.versionRestored": { en: "Version restored", zh: "版本已恢复" },
  "editor.toast.versionRestoreFailed": {
    en: "Version restore failed",
    zh: "版本恢复失败",
  },
  "editor.toast.knowledgeRefreshStale": {
    en: "Article saved, but Agent knowledge still needs refresh. Run pnpm ai:reindex before relying on assistant answers.",
    zh: "文章已保存，但 Agent 知识仍待刷新。依赖助手回答前请运行 pnpm ai:reindex。",
  },

  // Misc
  "editor.readingTimeApprox": { en: "~ {time} min", zh: "约 {time} 分钟" },
  "editor.codeBlockPlaceholder": {
    en: "// Enter code here",
    zh: "// 在此输入代码",
  },

  // Inline placeholders (inserted into editor content)
  "editor.placeholder.heading": { en: "Heading", zh: "标题" },
  "editor.placeholder.bold": { en: "Bold text", zh: "粗体文本" },
  "editor.placeholder.italic": { en: "Italic text", zh: "斜体文本" },
  "editor.placeholder.strikethrough": {
    en: "Strikethrough text",
    zh: "删除文本",
  },
  "editor.placeholder.code": { en: "Code", zh: "代码" },
  "editor.placeholder.listItem": { en: "List item", zh: "列表项" },
  "editor.placeholder.quote": { en: "Quoted content", zh: "引用内容" },
};

export default editor;
