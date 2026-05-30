import type { TranslationDict } from "./types";

const login: TranslationDict = {
  // Left panel
  "login.chip": { en: "Account access", zh: "账号入口" },
  "login.title": { en: "Sign in to read or manage articles.", zh: "登录后继续阅读或管理文章。" },
  "login.subtitle": {
    en: "Readers can use a nickname for lightweight article feedback. The admin password unlocks publishing and management tools.",
    zh: "读者可用昵称提交文章反馈；管理员密码用于进入发布和管理工具。",
  },
  "login.visitorCardTitle": { en: "Reader mode", zh: "读者模式" },
  "login.visitorCardDesc": { en: "Use a nickname for feedback. Email is optional.", zh: "使用昵称提交反馈；邮箱可选。" },
  "login.ownerCardTitle": { en: "Admin access", zh: "管理员入口" },
  "login.ownerCardDesc": { en: "Manage posts, taxonomy, feedback, and subscribers.", zh: "管理文章、分类、反馈和订阅。" },

  // Tabs
  "login.tabVisitor": { en: "Reader", zh: "读者" },
  "login.tabAdmin": { en: "Admin", zh: "管理员" },

  // Visitor form
  "login.visitorTitle": { en: "Reader login", zh: "读者登录" },
  "login.visitorDesc": {
    en: "Enter a nickname to keep feedback attached to one local session.",
    zh: "输入昵称后，后续反馈会关联到当前浏览器会话。",
  },
  "login.visitorPlaceholder": {
    en: "e.g., RoPE reader",
    zh: "例如：RoPE 读者",
  },
  "login.visitorBtn": { en: "Continue", zh: "继续" },
  "login.visitorBtnLoading": { en: "Creating...", zh: "创建中..." },

  // Admin form
  "login.adminTitle": { en: "Admin login", zh: "管理员登录" },
  "login.adminDesc": {
    en: "Use the admin password to publish, edit, and manage content.",
    zh: "使用管理员密码进入发布、编辑和管理功能。",
  },
  "login.adminPasswordPlaceholder": { en: "Admin password", zh: "管理员密码" },
  "login.adminBtn": { en: "Sign in", zh: "登录" },
  "login.adminBtnLoading": { en: "Verifying...", zh: "验证中..." },

  // Back label
  "login.backToHome": { en: "Back to Home", zh: "返回首页" },

  // Toast
  "login.toast.welcomeBack": { en: "Welcome back, Misaya", zh: "欢迎回来，Misaya" },
  "login.toast.adminFailed": { en: "Admin login failed", zh: "管理员登录失败" },
  "login.toast.visitorCreated": { en: "Signed in", zh: "已登录" },
  "login.toast.visitorFailed": { en: "Login failed", zh: "登录失败" },
};

export default login;
