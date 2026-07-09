import { describe, expect, it } from "vitest";

import {
  analyzeTranslations,
  formatI18nCompletenessLines,
  getTranslationPlaceholders,
  parseI18nCompletenessArgs,
  runI18nCompletenessAudit,
} from "./i18n-completeness";

describe("i18n completeness audit", () => {
  it("parses output options", () => {
    expect(
      parseI18nCompletenessArgs(["--", "--output=.cache/i18n.json"], "/repo")
    ).toMatchObject({
      projectRoot: "/repo",
      outputPath: ".cache/i18n.json",
    });
    expect(parseI18nCompletenessArgs(["--no-output"], "/repo")).toMatchObject({
      outputPath: null,
    });
    expect(() => parseI18nCompletenessArgs(["--bad"], "/repo")).toThrow(
      "Unknown audit:i18n argument"
    );
  });

  it("extracts unique interpolation placeholders in stable order", () => {
    expect(getTranslationPlaceholders("{title}: {count} / {title}")).toEqual([
      "count",
      "title",
    ]);
  });

  it("flags missing languages, empty values, and placeholder mismatches", () => {
    const issues = analyzeTranslations({
      "empty.en": { en: "", zh: "中文" },
      "missing.zh": { en: "Only English" },
      "placeholder.bad": {
        en: "Read {count} notes for {title}",
        zh: "阅读 {count} 篇笔记",
      },
      "valid.key": { en: "Hello {name}", zh: "你好 {name}" },
    });

    expect(issues).toEqual([
      expect.objectContaining({
        key: "empty.en",
        code: "empty_value",
        language: "en",
      }),
      expect.objectContaining({
        key: "missing.zh",
        code: "missing_language",
        language: "zh",
      }),
      expect.objectContaining({
        key: "placeholder.bad",
        code: "placeholder_mismatch",
        expected: ["count", "title"],
        actual: ["count"],
      }),
    ]);
  });

  it("passes the registered translation dictionary", async () => {
    const report = await runI18nCompletenessAudit(
      {
        projectRoot: process.cwd(),
        outputPath: null,
      },
      () => new Date("2026-07-09T00:00:00.000Z")
    );

    expect(report.status).toBe("passed");
    expect(report.totals.keyCount).toBeGreaterThan(0);
    expect(report.issues).toEqual([]);
    expect(formatI18nCompletenessLines(report)[0]).toBe(
      "I18n completeness status: passed"
    );
  });
});
