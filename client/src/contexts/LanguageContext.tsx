import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
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

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);
export const LANGUAGE_STORAGE_KEY = "blog-language";

export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "zh";
}

export function resolveInitialLanguage({
  storedLanguage,
  browserLanguage,
  defaultLanguage = "en",
}: {
  storedLanguage?: string | null;
  browserLanguage?: string | null;
  defaultLanguage?: Language;
}): Language {
  if (isLanguage(storedLanguage)) return storedLanguage;
  return browserLanguage?.toLowerCase().startsWith("zh")
    ? "zh"
    : defaultLanguage;
}

export function getHtmlLanguage(language: Language) {
  return language === "zh" ? "zh-CN" : "en";
}

function readStoredLanguage() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredLanguage(language: Language) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage can be unavailable in private or embedded browsing contexts.
  }
}

function readBrowserLanguage() {
  if (typeof navigator === "undefined") return null;
  return navigator.language;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return resolveInitialLanguage({
      storedLanguage: readStoredLanguage(),
      browserLanguage: readBrowserLanguage(),
    });
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    writeStoredLanguage(lang);
  }, []);

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

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = getHtmlLanguage(language);
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, toggleLanguage, t, isZh, isEn }}
    >
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
