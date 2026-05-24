import type { TranslationDict } from "./types";

const manage: TranslationDict = {
  // Auth guard
  "manage.pleaseLogin": { en: "Please log in first", zh: "请先登录" },
  "manage.loginRequired": { en: "You need to log in to manage articles", zh: "你需要登录后才能管理文章" },
  "manage.loginBtn": { en: "Log in", zh: "登录" },

  // Page header
  "manage.pageTitle": { en: "Article Dashboard", zh: "文章后台" },
  "manage.pageSubtitle": {
    en: "Quickly check drafts, publishing status, views, and research notes that need further refinement.",
    zh: "用来快速检查草稿、发布状态、阅读量和需要继续打磨的研究笔记。",
  },
  "manage.cmsLabel": { en: "Research CMS", zh: "Research CMS" },

  // Search & stats
  "manage.searchPlaceholder": { en: "Search articles...", zh: "搜索文章..." },
  "manage.articleCount": { en: "{count} articles", zh: "共 {count} 篇文章" },

  // Empty state
  "manage.noArticles": { en: "No articles", zh: "暂无文章" },
  "manage.noArticlesHint": { en: "Start writing your first article", zh: "开始撰写你的第一篇文章吧" },

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
  "manage.deleteDescription": { en: "This action cannot be undone. The article will be permanently deleted.", zh: "此操作不可撤销，文章将被永久删除。" },
  "manage.deleteCancel": { en: "Cancel", zh: "取消" },
  "manage.deleteConfirm": { en: "Delete", zh: "删除" },

  // Toast
  "manage.toast.deleted": { en: "Article deleted", zh: "文章已删除" },
  "manage.toast.deleteFailed": { en: "Delete failed", zh: "删除失败" },
  "manage.toast.statusUpdated": { en: "Status updated", zh: "状态已更新" },
  "manage.toast.updateFailed": { en: "Update failed", zh: "更新失败" },

  // Actions
  "manage.writeArticle": { en: "Write Article", zh: "撰写文章" },
  "manage.backLabel": { en: "Back to Research Index", zh: "返回研究索引" },
};

export default manage;
