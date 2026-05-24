import type { TranslationDict } from "./types";

const login: TranslationDict = {
  // Left panel
  "login.chip": { en: "Personal research identity", zh: "Personal research identity" },
  "login.title": { en: "Writing entrance for the author, reading identity for peers.", zh: "写作入口给作者，阅读身份留给同行。" },
  "login.subtitle": {
    en: "Admin mode is used for publishing and maintaining articles; visitor mode only creates a local JWT identity, temporarily not requiring email, and can naturally connect to comments, bookmarks, or subscriptions later.",
    zh: "管理员模式用于发布和维护文章；访客模式只创建一个本地 JWT 身份，暂时不接邮箱，后续可以自然接到评论、收藏或订阅。",
  },
  "login.visitorCardTitle": { en: "Visitor JWT", zh: "Visitor JWT" },
  "login.visitorCardDesc": { en: "Used to identify reading identity, not bound to email.", zh: "用于识别阅读身份，不绑定邮箱。" },
  "login.ownerCardTitle": { en: "Owner Console", zh: "Owner Console" },
  "login.ownerCardDesc": { en: "Publish, maintain, and manage research articles.", zh: "发布、维护和管理研究文章。" },

  // Tabs
  "login.tabVisitor": { en: "Visitor", zh: "访客" },
  "login.tabAdmin": { en: "Author", zh: "作者" },

  // Visitor form
  "login.visitorTitle": { en: "Visitor Login", zh: "访客登录" },
  "login.visitorDesc": {
    en: "Enter a nickname. No email will be sent, no third-party account created.",
    zh: "输入一个昵称即可。不会发送邮箱，不会创建第三方账号。",
  },
  "login.visitorPlaceholder": {
    en: "e.g., A student reading RoPE",
    zh: "例如：一位读 RoPE 的同学",
  },
  "login.visitorBtn": { en: "Enter as Visitor", zh: "以访客身份进入" },
  "login.visitorBtnLoading": { en: "Creating...", zh: "创建中..." },

  // Admin form
  "login.adminTitle": { en: "Author Console", zh: "作者后台" },
  "login.adminDesc": {
    en: "Only the blog owner can enter the writing, publishing, and management workflow.",
    zh: "仅博客所有者可进入写作、发布和管理流程。",
  },
  "login.adminPasswordPlaceholder": { en: "Admin password", zh: "管理员密码" },
  "login.adminBtn": { en: "Enter Writing Desk", zh: "进入写作台" },
  "login.adminBtnLoading": { en: "Verifying...", zh: "验证中..." },

  // Back label
  "login.backToHome": { en: "Back to Home", zh: "返回首页" },

  // Toast
  "login.toast.welcomeBack": { en: "Welcome back, Misaya", zh: "欢迎回来，Misaya" },
  "login.toast.adminFailed": { en: "Admin login failed", zh: "管理员登录失败" },
  "login.toast.visitorCreated": { en: "Visitor identity created", zh: "已创建访客身份" },
  "login.toast.visitorFailed": { en: "Visitor login failed", zh: "访客登录失败" },
};

export default login;
