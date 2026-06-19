import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { contentSeriesCatalog } from "../../shared/content-series.js";

export type ContentQualityIssue = {
  severity: "warning" | "failure";
  code: string;
  file: string;
  line?: number;
  message: string;
  evidence?: string;
};

export type ContentQualityReport = {
  generatedAt: string;
  summary: {
    markdownFiles: number;
    seedPosts: number;
    warnings: number;
    failures: number;
  };
  issues: ContentQualityIssue[];
};

type SeedPost = {
  title: string;
  slug: string;
  contentPath: string;
  status: string;
  visibility: string;
  excerpt: string;
};

const AIISH_PHRASES = [
  "本文将",
  "在本文中",
  "可以看到",
  "可以发现",
  "不难发现",
  "值得注意的是",
  "需要注意的是",
  "综上所述",
  "总之",
  "我们可以",
  "我们将",
];

const MALFORMED_MARKDOWN_PATTERNS: Array<{
  code: string;
  pattern: RegExp;
  message: string;
}> = [
  {
    code: "content.malformed_bold_after_pronoun",
    pattern: /(?:我们|本文|这里|这个|这些)\*\*[\u4e00-\u9fa5A-Za-z0-9]/,
    message: "Review malformed bold marker attached to prose.",
  },
  {
    code: "content.ai_label_residue",
    pattern: /\b(?:AI-generated|AI generated|as an AI|由 AI 生成|AI生成)\b/i,
    message: "Review AI-generation residue in article copy.",
  },
];

const GENERIC_EXCERPT_PATTERNS: Array<{
  pattern: RegExp;
  message: string;
}> = [
  {
    pattern: /一篇面向|系统梳理/,
    message: "Seed excerpt should lead with the concrete technical problem.",
  },
  {
    pattern: /同一张[^，。]*地图|技术地图|研究地图/,
    message: "Seed excerpt should avoid vague map metaphors.",
  },
  {
    pattern: /看起来跑完了|看似正确/,
    message: "Seed excerpt should describe the observable failure directly.",
  },
];

const LINK_PATTERN = /\[[^\]]+]\(([^)]+)\)/g;

export async function runContentQualityAudit(
  projectRoot = process.cwd()
): Promise<ContentQualityReport> {
  const root = resolve(projectRoot);
  const seedPath = resolve(root, "seed-blog.mjs");
  const seedSource = await readFile(seedPath, "utf-8");
  const seedPosts = parseSeedPosts(seedSource);
  const markdownFiles = (await readdir(root)).filter(isAuditedMarkdownFile);
  const issues: ContentQualityIssue[] = [];

  issues.push(...auditSeedPosts(root, seedPosts));
  issues.push(...auditSeries(seedPosts));

  for (const file of markdownFiles) {
    const absolute = resolve(root, file);
    const markdown = await readFile(absolute, "utf-8");
    const post = seedPosts.find(item => item.contentPath === `./${file}`);
    issues.push(...auditMarkdownFile(root, file, markdown, post));
  }

  const warnings = issues.filter(issue => issue.severity === "warning").length;
  const failures = issues.filter(issue => issue.severity === "failure").length;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      markdownFiles: markdownFiles.length,
      seedPosts: seedPosts.length,
      warnings,
      failures,
    },
    issues,
  };
}

function isAuditedMarkdownFile(file: string) {
  if (!file.endsWith(".md")) return false;
  if (/^wpu-\d+-.*snapshot\.md$/i.test(file)) return false;
  return true;
}

export function parseSeedPosts(seedSource: string): SeedPost[] {
  const body = extractPostsArray(seedSource);
  return splitTopLevelObjects(body).map(block => ({
    title: readStringField(block, "title"),
    slug: readStringField(block, "slug"),
    contentPath: readStringField(block, "contentPath"),
    status: readStringField(block, "status"),
    visibility: readStringField(block, "visibility"),
    excerpt: readStringField(block, "excerpt"),
  }));
}

function auditSeedPosts(
  root: string,
  posts: SeedPost[]
): ContentQualityIssue[] {
  const issues: ContentQualityIssue[] = [];
  const seenSlugs = new Set<string>();
  const seenContentPaths = new Set<string>();

  for (const post of posts) {
    if (!post.slug) {
      issues.push(
        failure("seed.missing_slug", "seed-blog.mjs", "Missing post slug.")
      );
      continue;
    }
    if (seenSlugs.has(post.slug)) {
      issues.push(
        failure(
          "seed.duplicate_slug",
          "seed-blog.mjs",
          `Duplicate post slug: ${post.slug}`
        )
      );
    }
    seenSlugs.add(post.slug);

    if (!post.title.trim()) {
      issues.push(
        failure(
          "seed.missing_title",
          "seed-blog.mjs",
          `Missing title for ${post.slug}.`
        )
      );
    }
    if (!post.excerpt.trim()) {
      issues.push(
        failure(
          "seed.missing_excerpt",
          "seed-blog.mjs",
          `Missing excerpt for ${post.slug}.`
        )
      );
    } else if (post.status === "published" && post.visibility === "public") {
      for (const { pattern, message } of GENERIC_EXCERPT_PATTERNS) {
        if (!pattern.test(post.excerpt)) continue;
        issues.push(
          warning(
            "seed.generic_excerpt_voice",
            "seed-blog.mjs",
            `${message} Slug: ${post.slug}`,
            undefined,
            post.excerpt
          )
        );
      }
    }
    if (!post.contentPath.trim()) {
      issues.push(
        failure(
          "seed.missing_content_path",
          "seed-blog.mjs",
          `Missing contentPath for ${post.slug}.`
        )
      );
    } else if (!existsSync(resolve(root, post.contentPath))) {
      issues.push(
        failure(
          "seed.missing_content_file",
          "seed-blog.mjs",
          `Missing content file for ${post.slug}: ${post.contentPath}`
        )
      );
    }
    if (seenContentPaths.has(post.contentPath)) {
      issues.push(
        failure(
          "seed.duplicate_content_path",
          "seed-blog.mjs",
          `Multiple posts point to ${post.contentPath}.`
        )
      );
    }
    seenContentPaths.add(post.contentPath);
  }

  return issues;
}

function auditSeries(seedPosts: SeedPost[]): ContentQualityIssue[] {
  const issues: ContentQualityIssue[] = [];
  const postsBySlug = new Map(seedPosts.map(post => [post.slug, post]));

  for (const series of contentSeriesCatalog) {
    const seen = new Set<string>();
    for (const slug of series.orderedPostSlugs) {
      if (seen.has(slug)) {
        issues.push(
          failure(
            "series.duplicate_post",
            "shared/content-series.ts",
            `Series ${series.slug} repeats ${slug}.`
          )
        );
      }
      seen.add(slug);

      const post = postsBySlug.get(slug);
      if (!post) {
        issues.push(
          failure(
            "series.unknown_post",
            "shared/content-series.ts",
            `Series ${series.slug} references unknown post ${slug}.`
          )
        );
      } else if (post.status !== "published" || post.visibility !== "public") {
        issues.push(
          failure(
            "series.non_public_post",
            "shared/content-series.ts",
            `Public series ${series.slug} references non-public post ${slug}.`
          )
        );
      }
    }
  }

  return issues;
}

function auditMarkdownFile(
  root: string,
  file: string,
  markdown: string,
  post?: SeedPost
): ContentQualityIssue[] {
  const issues: ContentQualityIssue[] = [];
  const lines = markdown.split(/\r?\n/);
  const h1 = lines
    .find(line => /^#\s+/.test(line))
    ?.replace(/^#\s+/, "")
    .trim();

  if (!h1) {
    if (post) {
      issues.push(
        warning(
          "content.shell_title_only",
          file,
          `Markdown relies on the article shell title for ${post.slug}.`,
          undefined,
          `seed=${post.title}`
        )
      );
    } else {
      issues.push(
        failure(
          "content.missing_h1",
          file,
          "Markdown file is not tied to a seed post and has no H1 title."
        )
      );
    }
  }

  if (post && h1 && h1 !== post.title) {
    issues.push(
      warning(
        "content.title_mismatch",
        file,
        `Markdown H1 differs from seed title for ${post.slug}.`,
        undefined,
        `H1=${h1}; seed=${post.title}`
      )
    );
  }

  let inCodeFence = false;
  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      inCodeFence = !inCodeFence;
      return;
    }
    if (inCodeFence) return;

    for (const phrase of AIISH_PHRASES) {
      if (!line.includes(phrase)) continue;
      if (isTechnicalCaveatPhrase(phrase, line)) continue;
      issues.push(
        warning(
          "content.aiish_phrase",
          file,
          `Review template-like phrase: ${phrase}`,
          index + 1,
          line.trim()
        )
      );
    }

    for (const { code, pattern, message } of MALFORMED_MARKDOWN_PATTERNS) {
      if (!pattern.test(line)) continue;
      issues.push(warning(code, file, message, index + 1, line.trim()));
    }

    if (hasUnbalancedBoldMarkers(line)) {
      issues.push(
        warning(
          "content.unbalanced_bold_marker",
          file,
          "Review possible unbalanced bold marker.",
          index + 1,
          line.trim()
        )
      );
    }
  });

  for (const match of Array.from(markdown.matchAll(LINK_PATTERN))) {
    const href = match[1]?.trim() ?? "";
    if (!href || href.startsWith("#") || /^[a-z]+:/i.test(href)) continue;
    if (href.startsWith("/")) continue;

    const cleanHref = href.split("#")[0].split("?")[0];
    if (cleanHref && !existsSync(resolve(root, cleanHref))) {
      issues.push(
        warning(
          "content.relative_link_missing",
          file,
          `Relative link target does not exist: ${href}`
        )
      );
    }
  }

  return issues;
}

function isTechnicalCaveatPhrase(phrase: string, line: string) {
  if (phrase !== "需要注意的是" && phrase !== "值得注意的是") return false;
  return /[$`]|\\[a-zA-Z]+/.test(line);
}

function hasUnbalancedBoldMarkers(line: string) {
  const markerCount = line.match(/\*\*/g)?.length ?? 0;
  return markerCount % 2 === 1;
}

function extractPostsArray(seedSource: string) {
  const start = seedSource.indexOf("const posts = [");
  if (start < 0) throw new Error("Could not find posts array in seed-blog.mjs");
  const bodyStart = seedSource.indexOf("[", start);
  if (bodyStart < 0) throw new Error("Could not find posts array body.");

  let depth = 0;
  let inString: string | null = null;
  let escaped = false;
  for (let index = bodyStart; index < seedSource.length; index += 1) {
    const char = seedSource[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = char;
    } else if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) return seedSource.slice(bodyStart + 1, index);
    }
  }

  throw new Error("Could not parse posts array body.");
}

function splitTopLevelObjects(body: string) {
  const objects: string[] = [];
  let start = -1;
  let depth = 0;
  let inString: string | null = null;
  let escaped = false;

  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = char;
    } else if (char === "{") {
      if (depth === 0) start = index;
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        objects.push(body.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return objects;
}

function readStringField(block: string, field: string) {
  const match = new RegExp(`${field}:\\s*["']([\\s\\S]*?)["']`).exec(block);
  return match?.[1]?.trim() ?? "";
}

function warning(
  code: string,
  file: string,
  message: string,
  line?: number,
  evidence?: string
): ContentQualityIssue {
  return { severity: "warning", code, file, line, message, evidence };
}

function failure(
  code: string,
  file: string,
  message: string,
  line?: number,
  evidence?: string
): ContentQualityIssue {
  return { severity: "failure", code, file, line, message, evidence };
}

async function main() {
  const report = await runContentQualityAudit();
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.summary.failures > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
