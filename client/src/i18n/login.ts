import type { TranslationDict } from "./types";

const login: TranslationDict = {
  "login.seoTitle": { en: "Owner access", zh: "作者入口" },
  "login.panelTitle": { en: "Owner sign in", zh: "作者登录" },

  // Left panel
  "login.chip": { en: "Owner workspace", zh: "作者工作台" },
  "login.title": {
    en: "Owner access for publishing and maintenance.",
    zh: "发布与维护的作者入口。",
  },
  "login.subtitle": {
    en: "Public notes stay open. This page only protects writing, taxonomy, feedback, and agent operations.",
    zh: "公开笔记无需登录即可阅读；这里仅保护写作、分类、反馈和 Agent 运维。",
  },
  "login.readerOpenTitle": {
    en: "Reading stays open",
    zh: "阅读保持开放",
  },
  "login.readerOpenDesc": {
    en: "No account or nickname is required to read, search, or open a track.",
    zh: "阅读、搜索、进入研究路径都不需要账号或昵称。",
  },
  "login.ownerCardTitle": { en: "Protected tools", zh: "受保护工具" },
  "login.ownerCardDesc": { en: "Manage posts, taxonomy, feedback, and subscribers.", zh: "管理文章、分类、反馈和订阅。" },

  // Admin form
  "login.adminTitle": { en: "Admin password", zh: "管理员密码" },
  "login.adminDesc": {
    en: "Use the production owner password to enter the publishing workspace.",
    zh: "使用生产作者密码进入发布工作台。",
  },
  "login.adminPasswordPlaceholder": { en: "Admin password", zh: "管理员密码" },
  "login.adminBtn": { en: "Sign in", zh: "登录" },
  "login.adminBtnLoading": { en: "Verifying...", zh: "验证中..." },

  // Back label
  "login.backToHome": { en: "Back to Home", zh: "返回首页" },

  // Toast
  "login.toast.welcomeBack": { en: "Welcome back, Misaya", zh: "欢迎回来，Misaya" },
  "login.toast.adminFailed": { en: "Admin login failed", zh: "管理员登录失败" },
};

export default login;
