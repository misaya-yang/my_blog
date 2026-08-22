import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  useMemo,
} from "react";
import { translations, interpolate } from "@/i18n";
import type { Language, InterpolationVars } from "@/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, vars?: InterpolationVars) => string;
  isZh: boolean;
  isEn: boolean;
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

  // Single source of truth for <html lang>. Screen-reader voice selection,
  // line breaking, quotation forms and the CJK typographic rules in
  // notebook.css all key off this, so it has to follow the UI language on
  // every route rather than only on the pages that pass a locale to useSeo.
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "zh" : "en");
  }, [language, setLanguage]);

  const t = useCallback(
    (key: string, vars?: InterpolationVars) => {
      const entry = translations[key];
      if (!entry) return key;
      return interpolate(entry[language], vars);
    },
    [language]
  );

  const isZh = useMemo(() => language === "zh", [language]);
  const isEn = useMemo(() => language === "en", [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isZh, isEn }}>
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
