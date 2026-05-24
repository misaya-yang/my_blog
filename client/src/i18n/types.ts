export type Language = "en" | "zh";

export interface TranslationEntry {
  en: string;
  zh: string;
}

export type TranslationDict = Record<string, TranslationEntry>;

export type InterpolationVars = Record<string, string | number>;
