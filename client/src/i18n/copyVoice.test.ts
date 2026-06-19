import { describe, expect, it } from "vitest";
import { translations } from "./index";

const FORBIDDEN_UI_COPY_PATTERNS = [
  /Reader map/i,
  /Implementation mapping/i,
  /Evidence or evaluation surface/i,
  /\bresearch map\b/i,
  /\btopic map\b/i,
  /\bcurrent query\b/i,
  /技术地图/,
  /研究地图/,
  /阅读地图/,
  /核心抽象/,
  /实现映射/,
  /评测面/,
  /^接地$/,
] as const;

describe("visible UI copy voice", () => {
  it("keeps reader-facing translations free of stale internal wording", () => {
    const violations = Object.entries(translations).flatMap(([key, entry]) =>
      (["en", "zh"] as const).flatMap(language => {
        const value = entry[language];
        return FORBIDDEN_UI_COPY_PATTERNS.filter(pattern =>
          pattern.test(value)
        ).map(pattern => ({
          key,
          language,
          pattern: String(pattern),
          value,
        }));
      })
    );

    expect(violations).toEqual([]);
  });
});
