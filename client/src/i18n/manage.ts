import type { TranslationDict } from "./types";

const manage: TranslationDict = {
  // Auth guard
  "manage.pleaseLogin": { en: "Please log in first", zh: "请先登录" },
  "manage.loginRequired": {
    en: "You need to log in to manage articles",
    zh: "你需要登录后才能管理文章",
  },
  "manage.loginBtn": { en: "Log in", zh: "登录" },

  // Page header
  "manage.pageTitle": { en: "Content Dashboard", zh: "内容管理" },
  "manage.pageSubtitle": {
    en: "Quickly check drafts, publishing status, views, and research notes that need further refinement.",
    zh: "用来快速检查草稿、发布状态、阅读量和需要继续打磨的研究笔记。",
  },
  "manage.cmsLabel": { en: "Content management", zh: "内容管理" },

  // Search & stats
  "manage.searchPlaceholder": { en: "Search articles...", zh: "搜索文章..." },
  "manage.categoryFilter": { en: "Filter by category", zh: "按分类筛选" },
  "manage.categoryAll": { en: "All technical areas", zh: "全部技术区" },
  "manage.articleCount": { en: "{count} articles", zh: "共 {count} 篇文章" },

  // Content health
  "manage.health.drafts": { en: "Drafts", zh: "草稿" },
  "manage.health.public": { en: "Public", zh: "公开" },
  "manage.health.ownerOnly": { en: "Admin-only", zh: "仅管理员" },
  "manage.health.hidden": { en: "Hidden", zh: "隐藏" },
  "manage.health.noExcerpt": { en: "No excerpt", zh: "缺摘要" },
  "manage.health.noCategory": { en: "No category", zh: "缺分类" },
  "manage.health.noTags": { en: "No tags", zh: "缺标签" },
  "manage.health.recent": { en: "Recent", zh: "近期更新" },
  "manage.health.more": {
    en: "More content checks",
    zh: "更多内容检查",
  },
  "manage.health.moreHint": {
    en: "Excerpt, taxonomy, and freshness",
    zh: "摘要、分类与新鲜度",
  },
  "manage.health.unavailable": {
    en: "Health summary unavailable",
    zh: "内容健康摘要暂不可用",
  },
  "manage.paginationLabel": {
    en: "Article list pagination",
    zh: "文章列表分页",
  },
  "manage.paginationStatus": {
    en: "Showing {start}-{end} of {total} articles",
    zh: "显示第 {start}-{end} 篇，共 {total} 篇",
  },
  "manage.paginationPrevious": { en: "Previous", zh: "上一页" },
  "manage.paginationNext": { en: "Next", zh: "下一页" },

  // Taxonomy management
  "manage.taxonomy.categoriesTitle": { en: "Categories", zh: "分类管理" },
  "manage.taxonomy.tagsTitle": { en: "Tags", zh: "标签管理" },
  "manage.taxonomy.name": { en: "Name", zh: "名称" },
  "manage.taxonomy.slug": { en: "Slug", zh: "Slug" },
  "manage.taxonomy.description": { en: "Description", zh: "描述" },
  "manage.taxonomy.deleteCategoryConfirm": {
    en: "Delete this category? Deletion is blocked while posts still use it.",
    zh: "确认删除这个分类吗？如果仍有文章使用它，系统会阻止删除。",
  },
  "manage.taxonomy.deleteTagConfirm": {
    en: "Delete this tag? Deletion is blocked while posts still use it.",
    zh: "确认删除这个标签吗？如果仍有文章使用它，系统会阻止删除。",
  },
  "manage.taxonomy.categoryCreated": {
    en: "Category created",
    zh: "分类已创建",
  },
  "manage.taxonomy.categoryUpdated": {
    en: "Category updated",
    zh: "分类已更新",
  },
  "manage.taxonomy.categoryDeleted": {
    en: "Category deleted",
    zh: "分类已删除",
  },
  "manage.taxonomy.tagCreated": { en: "Tag created", zh: "标签已创建" },
  "manage.taxonomy.tagUpdated": { en: "Tag updated", zh: "标签已更新" },
  "manage.taxonomy.tagDeleted": { en: "Tag deleted", zh: "标签已删除" },

  // Empty state
  "manage.noArticles": { en: "No articles", zh: "暂无文章" },
  "manage.noArticlesHint": {
    en: "Start writing your first article",
    zh: "开始撰写你的第一篇文章吧",
  },
  "manage.loadFailed": {
    en: "Could not load articles",
    zh: "文章列表加载失败",
  },
  "manage.loadFailedHint": {
    en: "Retry the request, then check the server logs if it fails again.",
    zh: "请先重试；如果仍失败，再检查服务日志。",
  },

  // Table headers
  "manage.table.title": { en: "Title", zh: "标题" },
  "manage.table.category": { en: "Category", zh: "分类" },
  "manage.table.status": { en: "Status", zh: "状态" },
  "manage.table.visibility": { en: "Visibility", zh: "权限" },
  "manage.table.views": { en: "Views", zh: "浏览量" },
  "manage.table.createdAt": { en: "Created At", zh: "创建时间" },
  "manage.table.actions": { en: "Actions", zh: "操作" },

  // Status badges
  "manage.status.published": { en: "Published", zh: "已发布" },
  "manage.status.draft": { en: "Draft", zh: "草稿" },
  "manage.visibility.hidden": { en: "Hidden", zh: "隐藏" },
  "manage.visibility.admin": { en: "Admin", zh: "Admin可见" },
  "manage.visibility.public": { en: "Public", zh: "全可见" },

  // Dropdown actions
  "manage.action.view": { en: "View", zh: "查看" },
  "manage.action.edit": { en: "Edit", zh: "编辑" },
  "manage.action.publish": { en: "Publish", zh: "发布" },
  "manage.action.unpublish": { en: "Unpublish", zh: "取消发布" },
  "manage.action.delete": { en: "Delete", zh: "删除" },

  // Delete dialog
  "manage.deleteTitle": { en: "Confirm Deletion", zh: "确认删除" },
  "manage.deleteDescription": {
    en: "This action cannot be undone. The article will be permanently deleted.",
    zh: "此操作不可撤销，文章将被永久删除。",
  },
  "manage.deleteCancel": { en: "Cancel", zh: "取消" },
  "manage.deleteConfirm": { en: "Delete", zh: "删除" },

  // Toast
  "manage.toast.deleted": { en: "Article deleted", zh: "文章已删除" },
  "manage.toast.deleteFailed": { en: "Delete failed", zh: "删除失败" },
  "manage.toast.statusUpdated": { en: "Status updated", zh: "状态已更新" },
  "manage.toast.updateFailed": { en: "Update failed", zh: "更新失败" },
  "manage.toast.knowledgeRefreshStale": {
    en: "Content changed, but Agent knowledge still needs refresh. Run pnpm ai:reindex before relying on assistant answers.",
    zh: "内容已更新，但 Agent 知识仍待刷新。依赖助手回答前请运行 pnpm ai:reindex。",
  },

  // Engagement workflow
  "manage.engagement.feedbackTitle": { en: "Reader Feedback", zh: "读者反馈" },
  "manage.engagement.feedbackDescription": {
    en: "Private feedback submitted from article pages.",
    zh: "读者在文章页提交的私密反馈。",
  },
  "manage.engagement.feedbackCount": { en: "{count} items", zh: "{count} 条" },
  "manage.engagement.useful": { en: "Useful", zh: "有帮助" },
  "manage.engagement.notUseful": { en: "Not useful", zh: "帮助不大" },
  "manage.engagement.statusNew": { en: "New", zh: "新反馈" },
  "manage.engagement.statusReviewed": { en: "Reviewed", zh: "已查看" },
  "manage.engagement.statusHidden": { en: "Hidden", zh: "已隐藏" },
  "manage.engagement.unknownPost": { en: "Unknown article", zh: "未知文章" },
  "manage.engagement.noMessage": {
    en: "No message attached.",
    zh: "没有补充说明。",
  },
  "manage.engagement.anonymous": { en: "Anonymous reader", zh: "匿名读者" },
  "manage.engagement.markReviewed": { en: "Mark reviewed", zh: "标记已查看" },
  "manage.engagement.markHidden": { en: "Hide", zh: "隐藏" },
  "manage.engagement.feedbackEmpty": {
    en: "No reader feedback yet.",
    zh: "暂无读者反馈。",
  },
  "manage.engagement.feedbackReviewed": {
    en: "Feedback reviewed",
    zh: "反馈已标记查看",
  },
  "manage.engagement.feedbackReviewFailed": {
    en: "Could not update feedback",
    zh: "反馈状态更新失败",
  },
  "manage.engagement.subscribersTitle": { en: "Subscribers", zh: "订阅者" },
  "manage.engagement.subscribersDescription": {
    en: "Stored subscription intent. Export this list when connecting an email provider.",
    zh: "已保存的订阅意向；接入邮件服务商时可导出这份列表。",
  },
  "manage.engagement.export": { en: "Export", zh: "导出" },
  "manage.engagement.subscribersEmpty": {
    en: "No subscribers yet.",
    zh: "暂无订阅者。",
  },
  "manage.engagement.radarTitle": { en: "Content Radar", zh: "内容雷达" },
  "manage.engagement.radarDescription": {
    en: "Private reader signals grouped into writing opportunities. This stays owner-only and does not create public comments or analytics pages.",
    zh: "把私密读者信号聚合成写作机会。这里只面向作者，不开放评论区或公开数据页。",
  },
  "manage.engagement.deliveryStored": {
    en: "Stored-only subscription",
    zh: "仅保存订阅意向",
  },
  "manage.engagement.deliveryDescription": {
    en: "No email delivery provider is connected yet. Export subscribers when you are ready to send updates, and keep RSS available.",
    zh: "当前尚未接入邮件发送服务。需要发送更新时先导出订阅列表，同时继续保留 RSS。",
  },
  "manage.ownerCockpit.title": {
    en: "Owner Cockpit",
    zh: "作者驾驶舱",
  },
  "manage.ownerCockpit.description": {
    en: "Release risk, writing backlog, and Agent gaps summarized before the longer operational lists.",
    zh: "在较长的运营列表前，先汇总发布风险、写作 backlog 和 Agent 缺口。",
  },
  "manage.ownerCockpit.statusClear": {
    en: "Clear",
    zh: "无阻塞",
  },
  "manage.ownerCockpit.statusNeedsReview": {
    en: "Needs review",
    zh: "需要查看",
  },
  "manage.ownerCockpit.partial": {
    en: "Some owner signals could not be loaded. Showing available data.",
    zh: "部分作者信号暂时无法加载，当前仅显示已获取的数据。",
  },
  "manage.ownerCockpit.releaseRisk": {
    en: "Release risk",
    zh: "发布风险",
  },
  "manage.ownerCockpit.highSignals": {
    en: "High signals",
    zh: "高风险信号",
  },
  "manage.ownerCockpit.backlogCount": {
    en: "Backlog",
    zh: "Backlog",
  },
  "manage.ownerCockpit.agentGaps": {
    en: "Agent gaps",
    zh: "Agent 缺口",
  },
  "manage.ownerCockpit.actionRelease": {
    en: "Review release readiness first",
    zh: "先查看发布就绪状态",
  },
  "manage.ownerCockpit.actionReleaseDescription": {
    en: "A freshness or public-index signal needs attention before treating the current content as publish-ready.",
    zh: "新鲜度或公开索引信号需要先处理，然后再把当前内容视为可发布状态。",
  },
  "manage.ownerCockpit.actionBacklog": {
    en: "Pick the top backlog item",
    zh: "处理最高优先级 backlog",
  },
  "manage.ownerCockpit.actionBacklogDescription": {
    en: "Reader feedback, search misses, or Agent questions are ready to become an edit, link, or new draft.",
    zh: "读者反馈、搜索缺口或 Agent 问题已经可以转成修改、补链或新草稿。",
  },
  "manage.ownerCockpit.actionAgent": {
    en: "Inspect Agent quality gaps",
    zh: "检查 Agent 质量缺口",
  },
  "manage.ownerCockpit.actionAgentDescription": {
    en: "No-source or failed Agent runs need review in the Agent operations cockpit.",
    zh: "无来源或失败的 Agent 运行需要到 Agent 运营页查看。",
  },
  "manage.ownerCockpit.actionClear": {
    en: "No urgent owner action",
    zh: "暂无紧急动作",
  },
  "manage.ownerCockpit.actionClearDescription": {
    en: "No release blocker, high-signal backlog, or Agent gap is currently visible in the owner summary.",
    zh: "作者摘要里暂未看到发布阻塞、高风险 backlog 或 Agent 缺口。",
  },
  "manage.ownerCockpit.newFeedback": {
    en: "{count} new feedback",
    zh: "{count} 条新反馈",
  },
  "manage.ownerCockpit.searchGaps": {
    en: "{count} search gaps",
    zh: "{count} 个搜索缺口",
  },
  "manage.engagement.radarNewFeedback": { en: "New feedback", zh: "新反馈" },
  "manage.engagement.radarNotUseful": {
    en: "Confusion signals",
    zh: "疑惑信号",
  },
  "manage.engagement.radarSubscribers": {
    en: "Active subscribers",
    zh: "有效订阅",
  },
  "manage.engagement.radarHidden": { en: "Hidden signals", zh: "已隐藏信号" },
  "manage.engagement.radarSearchMisses": {
    en: "Search gaps",
    zh: "搜索缺口",
  },
  "manage.engagement.backlogTitle": {
    en: "Writing Backlog",
    zh: "写作 Backlog",
  },
  "manage.engagement.backlogDescription": {
    en: "A single owner-only queue for reader feedback, zero-result searches, and Agent questions that should become edits, links, or new drafts.",
    zh: "把读者反馈、零结果搜索和 Agent 问题聚合成仅作者可见的队列，用来决定要修改、补链还是开新草稿。",
  },
  "manage.engagement.backlogOwnerOnly": {
    en: "Owner-only",
    zh: "仅作者可见",
  },
  "manage.engagement.backlogPrivacy": {
    en: "Contact data redacted",
    zh: "联系信息已脱敏",
  },
  "manage.engagement.backlogSignals": {
    en: "Backlog items",
    zh: "Backlog 项",
  },
  "manage.engagement.backlogAgentGaps": {
    en: "Agent gaps",
    zh: "Agent 缺口",
  },
  "manage.engagement.backlogEmpty": {
    en: "No writing signals yet.",
    zh: "暂无写作信号。",
  },
  "manage.engagement.backlogKindFeedback": {
    en: "Feedback",
    zh: "反馈",
  },
  "manage.engagement.backlogKindSearch": {
    en: "Search miss",
    zh: "搜索缺口",
  },
  "manage.engagement.backlogKindAgent": {
    en: "Agent question",
    zh: "Agent 问题",
  },
  "manage.engagement.backlogPriorityHigh": {
    en: "High",
    zh: "高优先级",
  },
  "manage.engagement.backlogPriorityNormal": {
    en: "Normal",
    zh: "普通",
  },
  "manage.engagement.backlogStatusNew": {
    en: "New",
    zh: "新建",
  },
  "manage.engagement.backlogStatusReviewed": {
    en: "Reviewed",
    zh: "已查看",
  },
  "manage.engagement.backlogStatusPlanned": {
    en: "Planned",
    zh: "计划中",
  },
  "manage.engagement.backlogStatusDismissed": {
    en: "Dismissed",
    zh: "已忽略",
  },
  "manage.engagement.backlogSignalCount": {
    en: "{count} signals",
    zh: "{count} 个信号",
  },
  "manage.engagement.backlogInspect": {
    en: "Inspect",
    zh: "查看",
  },
  "manage.engagement.backlogDraft": {
    en: "Open draft",
    zh: "开草稿",
  },
  "manage.engagement.backlogAgentSource": {
    en: "Agent question radar",
    zh: "Agent 问题雷达",
  },
  "manage.engagement.backlogFeedbackSource": {
    en: "Reader feedback",
    zh: "读者反馈",
  },
  "manage.engagement.backlogSearchSource": {
    en: "Zero-result search",
    zh: "无结果搜索",
  },
  "manage.engagement.backlogPartial": {
    en: "Some backlog signals could not be loaded. Showing the available data.",
    zh: "部分写作信号暂时无法加载，当前仅显示已获取的数据。",
  },
  "manage.engagement.backlogUnavailable": {
    en: "Writing backlog signals could not be loaded right now.",
    zh: "写作 backlog 信号暂时无法加载。",
  },
  "manage.engagement.backlogPersistenceNote": {
    en: "Feedback status is saved. Agent ideas are reviewed from the radar list and can be turned into drafts when useful.",
    zh: "反馈状态已保存。Agent 选题从雷达列表中查看，适合的条目可以直接转成草稿。",
  },
  "manage.engagement.opportunitiesTitle": {
    en: "Writing opportunities",
    zh: "写作机会",
  },
  "manage.engagement.opportunitiesEmpty": {
    en: "No article-level feedback signals yet.",
    zh: "还没有文章级反馈信号。",
  },
  "manage.engagement.latestSignal": { en: "Latest signal", zh: "最近信号" },
  "manage.engagement.subscriptionSummary": {
    en: "Subscription interest summary",
    zh: "订阅兴趣摘要",
  },
  "manage.engagement.languageBreakdown": {
    en: "Language: ZH {zh} · EN {en} · Unknown {unknown}",
    zh: "语言偏好：中文 {zh} · 英文 {en} · 未知 {unknown}",
  },
  "manage.engagement.noInterests": {
    en: "No topic interests yet.",
    zh: "暂无主题偏好。",
  },
  "manage.readerSignals.title": {
    en: "Normalized signals",
    zh: "规范化信号",
  },
  "manage.readerSignals.description": {
    en: "Safe owner-readable signals from feedback, search misses, Agent runs, audits, and freshness checks.",
    zh: "来自反馈、搜索缺口、Agent 运行、审查和新鲜度检查的作者安全信号。",
  },
  "manage.readerSignals.count": {
    en: "{count} signals",
    zh: "{count} 个信号",
  },
  "manage.readerSignals.signalCount": {
    en: "{count}x",
    zh: "{count} 次",
  },
  "manage.readerSignals.empty": {
    en: "No normalized reader signals yet.",
    zh: "暂无规范化读者信号。",
  },
  "manage.readerSignals.localStatus": {
    en: "Local status",
    zh: "本地状态",
  },
  "manage.readerSignals.localStatusNote": {
    en: "Browser-local only; not saved as durable review history.",
    zh: "仅保存在当前浏览器，不作为持久审查记录。",
  },
  "manage.readerSignals.status.new": {
    en: "New",
    zh: "新建",
  },
  "manage.readerSignals.status.triaged": {
    en: "Triaged",
    zh: "已分拣",
  },
  "manage.readerSignals.status.planned": {
    en: "Planned",
    zh: "已计划",
  },
  "manage.readerSignals.status.inRevision": {
    en: "In revision",
    zh: "修改中",
  },
  "manage.readerSignals.status.resolved": {
    en: "Resolved",
    zh: "已解决",
  },
  "manage.readerSignals.status.ignored": {
    en: "Ignored",
    zh: "已忽略",
  },
  "manage.readerSignals.kind.searchMiss": {
    en: "Search miss",
    zh: "搜索缺口",
  },
  "manage.readerSignals.kind.articleFeedback": {
    en: "Feedback",
    zh: "反馈",
  },
  "manage.readerSignals.kind.agentQuestion": {
    en: "Agent question",
    zh: "Agent 问题",
  },
  "manage.readerSignals.kind.agentLowConfidence": {
    en: "Low confidence",
    zh: "低置信",
  },
  "manage.readerSignals.kind.agentRefusal": {
    en: "Agent refusal",
    zh: "Agent 拒答",
  },
  "manage.readerSignals.kind.contentAudit": {
    en: "Content audit",
    zh: "内容审查",
  },
  "manage.readerSignals.kind.publishFreshness": {
    en: "Freshness",
    zh: "新鲜度",
  },
  "manage.readerSignals.severity.high": {
    en: "High",
    zh: "高",
  },
  "manage.readerSignals.severity.medium": {
    en: "Medium",
    zh: "中",
  },
  "manage.readerSignals.severity.low": {
    en: "Low",
    zh: "低",
  },

  // Actions
  "manage.writeArticle": { en: "Write Article", zh: "撰写文章" },
  "manage.backLabel": { en: "Back to Home", zh: "返回首页" },
};

export default manage;
