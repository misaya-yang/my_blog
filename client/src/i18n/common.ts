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
  "common.loading": { en: "Loading...", zh: "加载中..." },
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
  "engagement.subscribe.title": { en: "Follow updates", zh: "订阅更新" },
  "engagement.subscribe.articleTitle": {
    en: "Get future notes",
    zh: "接收后续笔记",
  },
  "engagement.subscribe.description": {
    en: "Leave an email to get occasional article updates. RSS stays available if you prefer a reader.",
    zh: "留下邮箱接收不定期文章更新；如果你更喜欢阅读器，也可以直接使用 RSS。",
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
  "engagement.subscribe.loading": { en: "Saving...", zh: "保存中..." },
  "engagement.subscribe.button": { en: "Subscribe", zh: "订阅" },
  "engagement.subscribe.toastCreated": {
    en: "Subscription saved",
    zh: "订阅已保存",
  },
  "engagement.subscribe.toastExisting": {
    en: "Subscription updated",
    zh: "订阅已更新",
  },
  "engagement.subscribe.error": { en: "Subscription failed", zh: "订阅失败" },
  "engagement.subscribe.rateLimited": {
    en: "Too many attempts. Please try again later.",
    zh: "提交过于频繁，请稍后再试。",
  },
  "engagement.subscribe.successCreated": {
    en: "Saved. Updates will be sent when email delivery is connected.",
    zh: "已保存。邮件发送接入后会用于更新通知。",
  },
  "engagement.subscribe.successExisting": {
    en: "Already on the list. Preferences were refreshed.",
    zh: "你已在列表中，偏好已刷新。",
  },
  "engagement.subscribe.privacy": {
    en: "Only email and optional topics are stored.",
    zh: "仅保存邮箱和可选主题偏好。",
  },
  "engagement.feedback.title": {
    en: "Was this useful?",
    zh: "这篇文章有帮助吗？",
  },
  "engagement.feedback.description": {
    en: "Send a private note about what worked or what was missing.",
    zh: "提交一条私密反馈，说明哪里有帮助或哪里还需要补充。",
  },
  "engagement.feedback.visitorIdentity": {
    en: "Submitting as {name}",
    zh: "将以 {name} 提交",
  },
  "engagement.feedback.anonymousIdentity": {
    en: "You can submit anonymously.",
    zh: "你可以匿名提交。",
  },
  "engagement.feedback.contact": { en: "Email", zh: "发邮件" },
  "engagement.feedback.useful": { en: "Useful", zh: "有帮助" },
  "engagement.feedback.notUseful": { en: "Not useful", zh: "帮助不大" },
  "engagement.feedback.messagePlaceholder": {
    en: "Optional note: what was clear or missing?",
    zh: "可选补充：哪里清楚，哪里还缺？",
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
  "engagement.feedback.loading": { en: "Sending...", zh: "发送中..." },
  "engagement.feedback.submit": { en: "Send feedback", zh: "发送反馈" },

  // Footer
  "common.copyright": {
    en: "© 2026 AI Tech Blog. All rights reserved.",
    zh: "© 2026 AI Tech Blog. 保留所有权利.",
  },
};

export default common;
