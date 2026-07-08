import { describe, expect, it } from "vitest";

import {
  getHtmlLanguage,
  isLanguage,
  resolveInitialLanguage,
} from "./LanguageContext";

describe("language runtime helpers", () => {
  it("accepts only supported language values", () => {
    expect(isLanguage("en")).toBe(true);
    expect(isLanguage("zh")).toBe(true);
    expect(isLanguage("ja")).toBe(false);
    expect(isLanguage(null)).toBe(false);
  });

  it("prefers valid stored language over browser fallback", () => {
    expect(
      resolveInitialLanguage({
        storedLanguage: "en",
        browserLanguage: "zh-CN",
      })
    ).toBe("en");
  });

  it("uses browser Chinese language when storage is empty or invalid", () => {
    expect(
      resolveInitialLanguage({
        storedLanguage: null,
        browserLanguage: "zh-CN",
      })
    ).toBe("zh");

    expect(
      resolveInitialLanguage({
        storedLanguage: "system",
        browserLanguage: "zh-Hant-TW",
      })
    ).toBe("zh");
  });

  it("falls back to English for unsupported browser languages", () => {
    expect(
      resolveInitialLanguage({
        storedLanguage: undefined,
        browserLanguage: "fr-FR",
      })
    ).toBe("en");
  });

  it("maps runtime language to document html lang values", () => {
    expect(getHtmlLanguage("en")).toBe("en");
    expect(getHtmlLanguage("zh")).toBe("zh-CN");
  });
});
