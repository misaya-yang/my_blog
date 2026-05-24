import common from "./common";
import nav from "./nav";
import home from "./home";
import post from "./post";
import editor from "./editor";
import manage from "./manage";
import login from "./login";
import notFound from "./notFound";
import components from "./components";
import showcase from "./showcase";
import type { TranslationDict, Language, InterpolationVars } from "./types";

export const translations: TranslationDict = {
  ...common,
  ...nav,
  ...home,
  ...post,
  ...editor,
  ...manage,
  ...login,
  ...notFound,
  ...components,
  ...showcase,
};

export type { Language, InterpolationVars, TranslationDict, TranslationEntry } from "./types";

// Helper to interpolate variables like "{count}" in translation strings
export function interpolate(template: string, vars?: InterpolationVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = vars[key];
    return value !== undefined ? String(value) : `{${key}}`;
  });
}
