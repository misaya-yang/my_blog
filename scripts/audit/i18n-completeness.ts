import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type {
  TranslationDict,
  TranslationEntry,
} from "../../client/src/i18n/types";

const DEFAULT_OUTPUT =
  "docs/product_optimization/reports/i18n-completeness-latest.json";

export type I18nCompletenessStatus = "passed" | "failed";
export type I18nIssueCode =
  | "missing_language"
  | "empty_value"
  | "placeholder_mismatch";

export type I18nCompletenessIssue = {
  key: string;
  code: I18nIssueCode;
  language?: "en" | "zh";
  evidence: string;
  expected?: string[];
  actual?: string[];
};

export type I18nCompletenessOptions = {
  projectRoot: string;
  outputPath: string | null;
};

export type I18nCompletenessReport = {
  generatedAt: string;
  status: I18nCompletenessStatus;
  totals: {
    keyCount: number;
    issueCount: number;
    placeholderIssueCount: number;
  };
  issues: I18nCompletenessIssue[];
  outputPath: string | null;
};

export function parseI18nCompletenessArgs(
  argv: string[],
  cwd = process.cwd()
): I18nCompletenessOptions {
  const options: I18nCompletenessOptions = {
    projectRoot: cwd,
    outputPath: DEFAULT_OUTPUT,
  };

  for (const arg of argv) {
    if (arg === "--") {
      continue;
    } else if (arg === "--no-output") {
      options.outputPath = null;
    } else if (arg.startsWith("--output=")) {
      options.outputPath = arg.slice("--output=".length).trim() || null;
    } else {
      throw new Error(`Unknown audit:i18n argument: ${arg}`);
    }
  }

  return options;
}

export async function runI18nCompletenessAudit(
  options: I18nCompletenessOptions,
  now = () => new Date()
): Promise<I18nCompletenessReport> {
  const translations = await loadTranslations(options.projectRoot);
  const issues = analyzeTranslations(translations);

  return {
    generatedAt: now().toISOString(),
    status: issues.length > 0 ? "failed" : "passed",
    totals: {
      keyCount: Object.keys(translations).length,
      issueCount: issues.length,
      placeholderIssueCount: issues.filter(
        issue => issue.code === "placeholder_mismatch"
      ).length,
    },
    issues,
    outputPath: options.outputPath,
  };
}

export function analyzeTranslations(
  translations: Record<string, Partial<TranslationEntry>>
): I18nCompletenessIssue[] {
  const issues: I18nCompletenessIssue[] = [];

  for (const [key, entry] of Object.entries(translations).sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    for (const language of ["en", "zh"] as const) {
      const value = entry[language];
      if (typeof value !== "string") {
        issues.push({
          key,
          code: "missing_language",
          language,
          evidence: `${key} is missing ${language}.`,
        });
        continue;
      }
      if (!value.trim()) {
        issues.push({
          key,
          code: "empty_value",
          language,
          evidence: `${key}.${language} is empty.`,
        });
      }
    }

    if (typeof entry.en !== "string" || typeof entry.zh !== "string") {
      continue;
    }

    const englishPlaceholders = getTranslationPlaceholders(entry.en);
    const chinesePlaceholders = getTranslationPlaceholders(entry.zh);
    if (!sameStringSet(englishPlaceholders, chinesePlaceholders)) {
      issues.push({
        key,
        code: "placeholder_mismatch",
        evidence: `${key} uses different interpolation placeholders between en and zh.`,
        expected: englishPlaceholders,
        actual: chinesePlaceholders,
      });
    }
  }

  return issues;
}

export function getTranslationPlaceholders(value: string) {
  return Array.from(value.matchAll(/\{([A-Za-z_]\w*)\}/g))
    .map(match => match[1])
    .filter(
      (placeholder, index, values) => values.indexOf(placeholder) === index
    )
    .sort();
}

export function formatI18nCompletenessLines(report: I18nCompletenessReport) {
  return [
    `I18n completeness status: ${report.status}`,
    `I18n keys checked: ${report.totals.keyCount}`,
    `I18n issues: ${report.totals.issueCount} total, ${report.totals.placeholderIssueCount} placeholder mismatches`,
    ...(report.outputPath
      ? [`I18n completeness report: ${report.outputPath}`]
      : []),
  ];
}

async function loadTranslations(projectRoot: string): Promise<TranslationDict> {
  const modulePath = resolve(projectRoot, "client/src/i18n/index.ts");
  const moduleUrl = `${pathToFileURL(modulePath).href}?t=${Date.now()}`;
  const module = (await import(moduleUrl)) as { translations: TranslationDict };
  return module.translations;
}

function sameStringSet(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

async function writeReportIfNeeded(
  report: I18nCompletenessReport,
  projectRoot: string
) {
  if (!report.outputPath) return;
  const absoluteOutputPath = resolve(projectRoot, report.outputPath);
  await mkdir(dirname(absoluteOutputPath), { recursive: true });
  await writeFile(
    absoluteOutputPath,
    `${JSON.stringify(report, null, 2)}\n`
  );
}

async function main() {
  const options = parseI18nCompletenessArgs(process.argv.slice(2));
  const report = await runI18nCompletenessAudit(options);
  await writeReportIfNeeded(report, options.projectRoot);

  for (const line of formatI18nCompletenessLines(report)) {
    console.log(line);
  }

  if (report.status === "failed") {
    console.error(
      report.issues
        .slice(0, 8)
        .map(issue => `${issue.code}: ${issue.evidence}`)
        .join("\n")
    );
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  void main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
