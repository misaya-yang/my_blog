import type { TranslationDict } from "./types";

const notFound: TranslationDict = {
  "notFound.title": { en: "404", zh: "404" },
  "notFound.heading": { en: "Page Not Found", zh: "页面未找到" },
  "notFound.description": {
    en: "Sorry, the page you are looking for doesn't exist.\nIt may have been moved or deleted.",
    zh: "抱歉，你访问的页面不存在。\n该页面可能已被移动或删除。",
  },
  "notFound.goHome": { en: "Go Home", zh: "返回首页" },
};

export default notFound;
