import type { TranslationDict } from "./types";

const common: TranslationDict = {
  // Buttons
  "common.save": { en: "Save", zh: "保存" },
  "common.cancel": { en: "Cancel", zh: "取消" },
  "common.delete": { en: "Delete", zh: "删除" },
  "common.edit": { en: "Edit", zh: "编辑" },
  "common.confirm": { en: "Confirm", zh: "确认" },
  "common.back": { en: "Back", zh: "返回" },
  "common.search": { en: "Search", zh: "搜索" },
  "common.submit": { en: "Submit", zh: "提交" },
  "common.create": { en: "Create", zh: "创建" },
  "common.close": { en: "Close", zh: "关闭" },
  "common.copy": { en: "Copy", zh: "复制" },
  "common.copied": { en: "Copied", zh: "已复制" },
  "common.retry": { en: "Retry", zh: "重试" },
  "common.loading": { en: "Loading...", zh: "加载中..." },
  "common.loadingNotes": {
    en: "Loading notes",
    zh: "正在加载笔记",
  },
  "common.loadingHint": {
    en: "Fetching the latest notes. Search stays available.",
    zh: "正在读取最新笔记；搜索仍可使用。",
  },
  "common.saving": { en: "Saving...", zh: "保存中..." },
  "common.publishing": { en: "Publishing...", zh: "发布中..." },
  "common.login": { en: "Login", zh: "登录" },
  "common.logout": { en: "Logout", zh: "退出" },

  // Status
  "common.success": { en: "Success", zh: "成功" },
  "common.error": { en: "Error", zh: "错误" },
  "common.warning": { en: "Warning", zh: "警告" },
  "common.info": { en: "Info", zh: "提示" },

  // Common labels
  "common.title": { en: "Title", zh: "标题" },
  "common.content": { en: "Content", zh: "内容" },
  "common.description": { en: "Description", zh: "描述" },
  "common.category": { en: "Category", zh: "分类" },
  "common.tags": { en: "Tags", zh: "标签" },
  "common.status": { en: "Status", zh: "状态" },
  "common.views": { en: "Views", zh: "浏览量" },
  "common.createdAt": { en: "Created At", zh: "创建时间" },
  "common.updatedAt": { en: "Updated At", zh: "更新时间" },
  "common.actions": { en: "Actions", zh: "操作" },
  "common.published": { en: "Published", zh: "已发布" },
  "common.draft": { en: "Draft", zh: "草稿" },
  "common.unpublished": { en: "Unpublished", zh: "未发布" },
  "common.uncategorized": { en: "Uncategorized", zh: "未分类" },

  // Email
  "common.emailCopied": { en: "Email copied", zh: "邮箱已复制" },
  "common.clipboardUnavailable": {
    en: "Clipboard permission is unavailable. Please copy manually.",
    zh: "浏览器暂时无法写入剪贴板，请手动复制。",
  },

  // Error boundary
  "common.errorBoundary.title": {
    en: "An unexpected error occurred.",
    zh: "页面出现异常。",
  },
  "common.errorBoundary.description": {
    en: "The page could not recover cleanly. Reload to try again, or return to the home page.",
    zh: "页面未能自动恢复。请刷新后重试，或返回首页。",
  },
  "common.errorBoundary.reload": { en: "Reload Page", zh: "刷新页面" },

  // Shared UI primitives
  "common.ui.carousel": { en: "carousel", zh: "轮播" },
  "common.ui.slide": { en: "slide", zh: "幻灯片" },
  "common.ui.previousSlide": { en: "Previous slide", zh: "上一张幻灯片" },
  "common.ui.nextSlide": { en: "Next slide", zh: "下一张幻灯片" },
  "common.ui.pagination": { en: "pagination", zh: "分页" },
  "common.ui.previousPage": { en: "Previous", zh: "上一页" },
  "common.ui.nextPage": { en: "Next", zh: "下一页" },
  "common.ui.goToPreviousPage": { en: "Go to previous page", zh: "前往上一页" },
  "common.ui.goToNextPage": { en: "Go to next page", zh: "前往下一页" },
  "common.ui.morePages": { en: "More pages", zh: "更多页面" },
  "common.ui.breadcrumb": { en: "breadcrumb", zh: "面包屑" },
  "common.ui.more": { en: "More", zh: "更多" },
  "common.ui.sidebar": { en: "Sidebar", zh: "侧边栏" },
  "common.ui.mobileSidebarDescription": {
    en: "Displays the mobile sidebar.",
    zh: "显示移动端侧边栏。",
  },
  "common.ui.toggleSidebar": { en: "Toggle Sidebar", zh: "切换侧边栏" },
  "common.ui.loading": { en: "Loading", zh: "加载中" },

  // Engagement
  "engagement.subscribe.title": {
    en: "Save reading preferences",
    zh: "保存阅读偏好",
  },
  "engagement.subscribe.articleTitle": {
    en: "Save interest in future notes",
    zh: "保存后续阅读兴趣",
  },
  "engagement.subscribe.description": {
    en: "Leave an email for future notes. Topics and language are optional.",
    zh: "留下邮箱即可；主题和语言偏好可选。",
  },
  "engagement.subscribe.rss": { en: "RSS", zh: "RSS" },
  "engagement.subscribe.emailPlaceholder": {
    en: "you@example.com",
    zh: "you@example.com",
  },
  "engagement.subscribe.interestsPlaceholder": {
    en: "Optional topics: RoPE, agents, RAG...",
    zh: "可选主题：RoPE、Agent、RAG...",
  },
  "engagement.subscribe.languageLabel": {
    en: "Email language",
    zh: "接收语言",
  },
  "engagement.subscribe.detailsToggle": {
    en: "Add topics and language",
    zh: "补充主题和语言",
  },
  "engagement.subscribe.detailsHide": {
    en: "Hide topics and language",
    zh: "收起主题和语言",
  },
  "engagement.subscribe.loading": { en: "Saving...", zh: "保存中..." },
  "engagement.subscribe.button": { en: "Save preference", zh: "保存偏好" },
  "engagement.subscribe.toastCreated": {
    en: "Reading preference saved",
    zh: "阅读偏好已保存",
  },
  "engagement.subscribe.toastExisting": {
    en: "Reading preference updated",
    zh: "阅读偏好已更新",
  },
  "engagement.subscribe.error": {
    en: "Preference could not be saved",
    zh: "偏好保存失败",
  },
  "engagement.subscribe.rateLimited": {
    en: "Too many attempts. Please try again later.",
    zh: "提交过于频繁，请稍后再试。",
  },
  "engagement.subscribe.successCreated": {
    en: "Saved as a reading signal. Use RSS for updates until email delivery is connected.",
    zh: "已保存为阅读意向。邮件发送接入前，请使用 RSS 获取更新。",
  },
  "engagement.subscribe.successExisting": {
    en: "Already saved. Preferences were refreshed.",
    zh: "偏好已存在，并已刷新。",
  },
  "engagement.subscribe.privacy": {
    en: "Only email and optional topics are stored. No delivery provider is connected yet.",
    zh: "仅保存邮箱和可选主题偏好；当前尚未接入邮件发送服务。",
  },
  "engagement.feedback.title": {
    en: "Was this useful?",
    zh: "这篇文章有帮助吗？",
  },
  "engagement.feedback.ariaLabel": {
    en: "Private feedback for {title}",
    zh: "{title} 的私密反馈",
  },
  "engagement.feedback.description": {
    en: "A quick signal is enough. Add context only when it helps revise the article.",
    zh: "点一下就够了；只有在需要帮助修订文章时再补充说明。",
  },
  "engagement.feedback.visitorIdentity": {
    en: "Submitting as {name}",
    zh: "将以 {name} 提交",
  },
  "engagement.feedback.anonymousIdentity": {
    en: "You can submit anonymously.",
    zh: "你可以匿名提交。",
  },
  "engagement.feedback.privateNote": {
    en: "Stored privately for the owner backlog.",
    zh: "仅作为作者后台的私密改进线索保存。",
  },
  "engagement.feedback.optionalReply": {
    en: "Reply email is optional.",
    zh: "回复邮箱完全可选。",
  },
  "engagement.feedback.afterSubmit": {
    en: "Useful for revisions, examples, and follow-up notes.",
    zh: "用于后续修订、补充例子和规划新文章。",
  },
  "engagement.feedback.trustSummary": {
    en: "Private, optional, and used only for article improvements.",
    zh: "私密、可选，只用于改进文章。",
  },
  "engagement.feedback.useful": { en: "Useful", zh: "有帮助" },
  "engagement.feedback.notUseful": { en: "Not useful", zh: "帮助不大" },
  "engagement.feedback.detailsToggle": {
    en: "Add a private note",
    zh: "补充私密说明",
  },
  "engagement.feedback.detailsHide": {
    en: "Hide private note",
    zh: "收起补充说明",
  },
  "engagement.feedback.messagePlaceholder": {
    en: "Optional note: what was clear or missing?",
    zh: "可选补充：哪里清楚，哪里还缺？",
  },
  "engagement.feedback.reasonLabel": {
    en: "What should I improve?",
    zh: "主要想改进什么？",
  },
  "engagement.feedback.reasonHint": {
    en: "Choose one reason if it helps route this into the right revision.",
    zh: "如果方便，选择一个原因，方便作者判断该如何修订。",
  },
  "engagement.feedback.reason.unclear_mechanism": {
    en: "Mechanism unclear",
    zh: "机制不清楚",
  },
  "engagement.feedback.reason.needs_example": {
    en: "Needs example",
    zh: "需要例子",
  },
  "engagement.feedback.reason.unsupported_claim": {
    en: "Needs evidence",
    zh: "缺少依据",
  },
  "engagement.feedback.reason.awkward_wording": {
    en: "Wording awkward",
    zh: "措辞别扭",
  },
  "engagement.feedback.reason.missing_next_step": {
    en: "Missing next step",
    zh: "缺少后续路径",
  },
  "engagement.feedback.reason.other": {
    en: "Other",
    zh: "其他",
  },
  "engagement.feedback.namePlaceholder": {
    en: "Optional nickname",
    zh: "可选昵称",
  },
  "engagement.feedback.emailPlaceholder": {
    en: "Optional reply email",
    zh: "可选回复邮箱",
  },
  "engagement.feedback.toastSuccess": { en: "Feedback sent", zh: "反馈已发送" },
  "engagement.feedback.error": { en: "Feedback failed", zh: "反馈提交失败" },
  "engagement.feedback.rateLimited": {
    en: "Too many attempts. Please try again later.",
    zh: "提交过于频繁，请稍后再试。",
  },
  "engagement.feedback.success": {
    en: "Thanks. Feedback has been saved.",
    zh: "谢谢，反馈已保存。",
  },
  "engagement.feedback.privacy": {
    en: "Reply email is optional and only used when follow-up is needed.",
    zh: "回复邮箱完全可选，仅在需要跟进时使用。",
  },
  "engagement.feedback.quickHint": {
    en: "Choose one signal. Details are optional.",
    zh: "选择一个反馈即可提交；补充说明可选。",
  },
  "engagement.feedback.loading": { en: "Sending...", zh: "发送中..." },
  "engagement.feedback.submit": { en: "Send feedback", zh: "发送反馈" },

  // Footer
  "common.copyright": {
    en: "© 2026 Misaya Notes. All rights reserved.",
    zh: "© 2026 Misaya Notes. 保留所有权利.",
  },
};

export default common;
