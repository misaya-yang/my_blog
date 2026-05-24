import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type Language = "en" | "zh";

interface Translations {
  [key: string]: { en: string; zh: string };
}

const translations: Translations = {
  // Navigation
  "nav.home": { en: "Home", zh: "首页" },
  "nav.archive": { en: "Archive", zh: "归档" },
  "nav.write": { en: "Write", zh: "写作" },
  "nav.login": { en: "Login", zh: "登录" },
  "nav.admin": { en: "Admin", zh: "管理员" },
  "nav.user": { en: "User", zh: "用户" },
  "nav.back": { en: "Back", zh: "返回" },
  
  // Home page
  "home.title": { en: "Misaya Research Notes", zh: "Misaya 研究札记" },
  "home.subtitle": { 
    en: "Deep learning notes on Transformers, position encoding, and long-context mechanisms",
    zh: "关于 Transformer、位置编码与长上下文机制的深度学习研究记录"
  },
  "home.search": { en: "Search articles...", zh: "搜索文章..." },
  "home.articles": { en: "Articles", zh: "文章" },
  "home.categories": { en: "Categories", zh: "分类" },
  "home.views": { en: "Views", zh: "阅读量" },
  "home.noArticles": { en: "No articles found", zh: "暂无文章" },
  "home.readMore": { en: "Read more", zh: "阅读全文" },
  
  // Post detail
  "post.notFound": { en: "Post not found", zh: "文章未找到" },
  "post.backHome": { en: "Back to Home", zh: "返回首页" },
  "post.reads": { en: "reads", zh: "次阅读" },
  "post.toc": { en: "Table of Contents", zh: "目录" },
  "post.share": { en: "Share", zh: "分享" },
  "post.copyLink": { en: "Copy Link", zh: "复制链接" },
  "post.linkCopied": { en: "Link copied to clipboard", zh: "链接已复制到剪贴板" },
  "post.codeCopied": { en: "Code copied", zh: "代码已复制" },
  "post.edit": { en: "Edit", zh: "编辑" },
  "post.editSoon": { en: "Edit feature coming soon", zh: "编辑功能即将上线" },
  "post.unpublished": { en: "Unpublished", zh: "未发布" },
  
  // Footer
  "footer.copyright": { en: "© 2026 Misaya Research. All rights reserved.", zh: "© 2026 Misaya Research. 保留所有权利." },
  
  // Archive
  "archive.soon": { en: "Archive feature coming soon", zh: "归档功能即将上线" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("blog-language");
      if (saved === "en" || saved === "zh") return saved;
      // Auto-detect from browser
      const browserLang = navigator.language.toLowerCase();
      return browserLang.startsWith("zh") ? "zh" : "en";
    }
    return "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("blog-language", lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "zh" : "en");
  }, [language, setLanguage]);

  const t = useCallback(
    (key: string) => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[language];
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
