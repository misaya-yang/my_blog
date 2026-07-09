import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { contentSeriesCatalog } from "../../shared/content-series.js";

export type ContentFindingSeverity = "suggestion" | "warning" | "failure";

export type ContentFindingCategory =
  | "structure"
  | "metadata"
  | "markdown"
  | "style"
  | "evidence"
  | "readability"
  | "linking";

export type ContentQualityIssue = {
  severity: ContentFindingSeverity;
  category: ContentFindingCategory;
  code: string;
  file: string;
  articleSlug?: string;
  line?: number;
  message: string;
  evidence?: string;
  suggestion?: string;
  reason?: string;
  confidence?: "low" | "medium" | "high";
  span?: {
    start: number;
    end: number;
  };
};

export type ContentRubricDimension =
  | "problem"
  | "mechanism"
  | "evidence"
  | "limitation"
  | "implication";

export type ContentRubricStatus = "present" | "weak" | "missing";

export type ArticleQualityRubric = {
  file: string;
  articleSlug?: string;
  title?: string;
  dimensions: Record<
    ContentRubricDimension,
    {
      status: ContentRubricStatus;
      reason: string;
      evidence?: string;
    }
  >;
  weak: ContentRubricDimension[];
  missing: ContentRubricDimension[];
};

export type ContentQualityReport = {
  generatedAt: string;
  summary: {
    markdownFiles: number;
    articleFiles: number;
    skippedMarkdownFiles: number;
    seedPosts: number;
    suggestions: number;
    warnings: number;
    failures: number;
    rubricArticles: number;
    rubricWeakDimensions: number;
    rubricMissingDimensions: number;
  };
  issues: ContentQualityIssue[];
  findings: ContentQualityIssue[];
  rubrics: ArticleQualityRubric[];
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

const AIISH_PHRASE_PATTERNS: Array<{
  phrase: string;
  pattern: RegExp;
}> = [
  { phrase: "in this article", pattern: /\bin this article\b/i },
  { phrase: "it is worth noting", pattern: /\bit is worth noting\b/i },
  { phrase: "deep dive", pattern: /\bdeep dive\b/i },
  { phrase: "game-changing", pattern: /\bgame[- ]changing\b/i },
  { phrase: "paradigm shift", pattern: /\bparadigm shift\b/i },
  { phrase: "revolutionary", pattern: /\brevolutionary\b/i },
];

const SUBJECTIVE_FRAMING_PATTERNS: Array<{
  phrase: string;
  pattern: RegExp;
}> = [
  { phrase: "我认为", pattern: /我认为/ },
  { phrase: "我们可以看到", pattern: /我们可以看到/ },
  { phrase: "显然", pattern: /显然/ },
  { phrase: "有趣的是", pattern: /有趣的是/ },
  { phrase: "I think", pattern: /\bI think\b/i },
  { phrase: "we can see", pattern: /\bwe can see\b/i },
  { phrase: "clearly", pattern: /\bclearly\b/i },
  { phrase: "interestingly", pattern: /\binterestingly\b/i },
];

const UNSUPPORTED_CERTAINTY_PATTERNS: Array<{
  phrase: string;
  pattern: RegExp;
}> = [
  { phrase: "无疑", pattern: /无疑/ },
  { phrase: "必然", pattern: /必然/ },
  { phrase: "永远", pattern: /永远/ },
  { phrase: "从不", pattern: /从不/ },
  { phrase: "always", pattern: /\balways\b/i },
  { phrase: "never", pattern: /\bnever\b/i },
  { phrase: "SOTA", pattern: /\bSOTA\b/ },
];

const VAGUE_TECHNICAL_CLAIM_PATTERNS: Array<{
  phrase: string;
  pattern: RegExp;
}> = [
  { phrase: "显著提升", pattern: /显著提升/ },
  { phrase: "更好检索", pattern: /更好[地的]?检索/ },
  { phrase: "更鲁棒", pattern: /更鲁棒/ },
  { phrase: "更强能力", pattern: /更强[^，。；;]*能力/ },
  { phrase: "improves efficiency", pattern: /\bimproves efficiency\b/i },
  { phrase: "significantly improves", pattern: /\bsignificantly improves\b/i },
  { phrase: "dramatically improves", pattern: /\bdramatically improves\b/i },
  { phrase: "better retrieval", pattern: /\bbetter retrieval\b/i },
  { phrase: "more robust", pattern: /\bmore robust\b/i },
  {
    phrase: "stronger agent capability",
    pattern: /\bstronger agent capabilit(?:y|ies)\b/i,
  },
];

const AWKWARD_EXPRESSION_PATTERNS: Array<{
  phrase: string;
  pattern: RegExp;
}> = [
  { phrase: "进行一个", pattern: /进行一个/ },
  { phrase: "做一个", pattern: /做一个[^，。；;]{0,12}(?:分析|说明|总结|介绍)/ },
  { phrase: "make a conclusion", pattern: /\bmake a conclusion\b/i },
  { phrase: "do an analysis", pattern: /\bdo an analysis\b/i },
];

const TRANSLATIONESE_PATTERNS: Array<{
  phrase: string;
  pattern: RegExp;
}> = [
  { phrase: "对...进行", pattern: /对[^，。；;]{1,24}进行(?:分析|优化|建模|评估)/ },
  { phrase: "under the situation", pattern: /\bunder the situation\b/i },
  { phrase: "make research", pattern: /\bmake (?:a )?research\b/i },
  { phrase: "do research on", pattern: /\bdo research on\b/i },
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

const GENERIC_TITLE_VOICE_PATTERNS: Array<{
  phrase: string;
  pattern: RegExp;
}> = [
  { phrase: "一文看懂", pattern: /一文看懂/ },
  { phrase: "一文读懂", pattern: /一文读懂/ },
  { phrase: "一文搞懂", pattern: /一文搞懂/ },
  { phrase: "全面解析", pattern: /全面解析/ },
  { phrase: "全面梳理", pattern: /全面梳理/ },
  { phrase: "终极指南", pattern: /终极指南/ },
  { phrase: "范式变革", pattern: /范式变革/ },
  { phrase: "革命性", pattern: /革命性/ },
  { phrase: "ultimate guide", pattern: /\bultimate guide\b/i },
  { phrase: "complete guide", pattern: /\bcomplete guide\b/i },
  { phrase: "comprehensive guide", pattern: /\bcomprehensive guide\b/i },
  { phrase: "deep dive", pattern: /\bdeep dive\b/i },
  { phrase: "game-changing", pattern: /\bgame[- ]changing\b/i },
  { phrase: "revolutionary", pattern: /\brevolutionary\b/i },
  { phrase: "paradigm shift", pattern: /\bparadigm shift\b/i },
];

const GENERIC_EXCERPT_VOICE_SUGGESTION_PATTERNS: Array<{
  phrase: string;
  pattern: RegExp;
}> = [
  { phrase: "一文看懂", pattern: /一文看懂/ },
  { phrase: "全面解析", pattern: /全面解析/ },
  { phrase: "终极指南", pattern: /终极指南/ },
  { phrase: "范式变革", pattern: /范式变革/ },
  { phrase: "革命性", pattern: /革命性/ },
  { phrase: "deep dive", pattern: /\bdeep dive\b/i },
  { phrase: "game-changing", pattern: /\bgame[- ]changing\b/i },
  { phrase: "revolutionary", pattern: /\brevolutionary\b/i },
  { phrase: "paradigm shift", pattern: /\bparadigm shift\b/i },
  { phrase: "significantly improves", pattern: /\bsignificantly improves\b/i },
  { phrase: "dramatically improves", pattern: /\bdramatically improves\b/i },
];

const LINK_PATTERN = /\[[^\]]+]\(([^)]+)\)/g;

const RUBRIC_RULES: Record<
  ContentRubricDimension,
  {
    label: string;
    patterns: RegExp[];
  }
> = {
  problem: {
    label: "problem",
    patterns: [
      /问题|挑战|痛点|失败|动机|目标/,
      /\b(?:problem|challenge|failure|motivation|why)\b/i,
    ],
  },
  mechanism: {
    label: "mechanism",
    patterns: [
      /机制|原理|方法|结构|流程|如何|实现/,
      /\b(?:mechanism|architecture|method|pipeline|how|implementation)\b/i,
    ],
  },
  evidence: {
    label: "evidence",
    patterns: [
      /证据|实验|评估|指标|结果|验证|依据/,
      /\b(?:evidence|evaluation|benchmark|metric|result|trace|test)\b/i,
    ],
  },
  limitation: {
    label: "limitation",
    patterns: [
      /限制|边界|风险|失败模式|代价|权衡|不足|例外/,
      /\b(?:limitation|boundary|risk|trade[- ]off|failure (?:mode|modes|boundary|boundaries)|caveat|cost)\b/i,
    ],
  },
  implication: {
    label: "implication",
    patterns: [
      /启示|结论|影响|意味着|因此|后续|适用/,
      /\b(?:takeaway|implication|therefore|means|future|useful when)\b/i,
    ],
  },
};

export async function runContentQualityAudit(
  projectRoot = process.cwd()
): Promise<ContentQualityReport> {
  const root = resolve(projectRoot);
  const seedPath = resolve(root, "seed-blog.mjs");
  const seedSource = await readFile(seedPath, "utf-8");
  const seedPosts = parseSeedPosts(seedSource);
  const { articleFiles, skippedMarkdownFiles } = await buildMarkdownAuditScope(
    root,
    seedPosts
  );
  const postsByContentPath = new Map(
    seedPosts
      .map(post => [normalizeRootMarkdownPath(post.contentPath), post] as const)
      .filter((entry): entry is [string, SeedPost] => Boolean(entry[0]))
  );
  const issues: ContentQualityIssue[] = [];
  const rubrics: ArticleQualityRubric[] = [];

  issues.push(...auditSeedPosts(root, seedPosts));
  issues.push(...auditSeries(seedPosts));

  for (const file of articleFiles) {
    if (!existsSync(resolve(root, file))) continue;
    const absolute = resolve(root, file);
    const markdown = await readFile(absolute, "utf-8");
    const post = postsByContentPath.get(file);
    issues.push(...auditMarkdownFile(root, file, markdown, post));
    rubrics.push(buildArticleQualityRubric(file, markdown, post));
  }

  const warnings = issues.filter(issue => issue.severity === "warning").length;
  const failures = issues.filter(issue => issue.severity === "failure").length;
  const suggestions = issues.filter(
    issue => issue.severity === "suggestion"
  ).length;
  const rubricWeakDimensions = rubrics.reduce(
    (total, rubric) => total + rubric.weak.length,
    0
  );
  const rubricMissingDimensions = rubrics.reduce(
    (total, rubric) => total + rubric.missing.length,
    0
  );

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      markdownFiles: articleFiles.length,
      articleFiles: articleFiles.length,
      skippedMarkdownFiles: skippedMarkdownFiles.length,
      seedPosts: seedPosts.length,
      suggestions,
      warnings,
      failures,
      rubricArticles: rubrics.length,
      rubricWeakDimensions,
      rubricMissingDimensions,
    },
    issues,
    findings: issues,
    rubrics,
  };
}

async function buildMarkdownAuditScope(root: string, seedPosts: SeedPost[]) {
  const seededFiles = new Set(
    seedPosts
      .map(post => normalizeRootMarkdownPath(post.contentPath))
      .filter((file): file is string => Boolean(file))
  );
  const rootMarkdownFiles = (await readdir(root)).filter(isAuditedMarkdownFile);
  const skippedMarkdownFiles = rootMarkdownFiles.filter(
    file => !seededFiles.has(file)
  );

  return {
    articleFiles: Array.from(seededFiles).sort(),
    skippedMarkdownFiles,
  };
}

function normalizeRootMarkdownPath(contentPath: string) {
  const trimmed = contentPath.trim().replace(/\\/g, "/");
  if (!trimmed.endsWith(".md")) return null;
  return trimmed.replace(/^\.\//, "");
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

    const isPublicPost = isPublicPublishedPost(post);

    if (!post.title.trim()) {
      issues.push(
        failure(
          "seed.missing_title",
          "seed-blog.mjs",
          `Missing title for ${post.slug}.`
        )
      );
    } else if (isPublicPost) {
      for (const { phrase, pattern } of GENERIC_TITLE_VOICE_PATTERNS) {
        if (!pattern.test(post.title)) continue;
        issues.push(
          suggestion(
            "seed.generic_title_voice",
            "style",
            "seed-blog.mjs",
            `Review generic title phrasing: ${phrase}. Slug: ${post.slug}`,
            undefined,
            post.title,
            "Use the specific mechanism, object, or failure boundary instead of generic guide or hype phrasing."
          )
        );
      }
    }
    if (!post.excerpt.trim()) {
      issues.push(
        failure(
          "seed.missing_excerpt",
          "seed-blog.mjs",
          `Missing excerpt for ${post.slug}.`
        )
      );
    } else if (isPublicPost) {
      for (const { pattern, message } of GENERIC_EXCERPT_PATTERNS) {
        if (!pattern.test(post.excerpt)) continue;
        issues.push(
          warning(
            "seed.generic_excerpt_voice",
            "metadata",
            "seed-blog.mjs",
            `${message} Slug: ${post.slug}`,
            undefined,
            post.excerpt
          )
        );
      }
      for (const {
        phrase,
        pattern,
      } of GENERIC_EXCERPT_VOICE_SUGGESTION_PATTERNS) {
        if (!pattern.test(post.excerpt)) continue;
        issues.push(
          suggestion(
            "seed.generic_excerpt_voice_suggestion",
            "style",
            "seed-blog.mjs",
            `Review generic excerpt phrasing: ${phrase}. Slug: ${post.slug}`,
            undefined,
            post.excerpt,
            "Lead with the concrete problem, mechanism, metric, or reader decision instead of generic guide or hype phrasing."
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

function isPublicPublishedPost(post: SeedPost) {
  return post.status === "published" && post.visibility === "public";
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
          "structure",
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
        "metadata",
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
        suggestion(
          "content.aiish_phrase",
          "style",
          file,
          `Review template-like phrase: ${phrase}`,
          index + 1,
          line.trim(),
          "Replace the filler phrase with the concrete mechanism, evidence, limitation, or implication."
        )
      );
    }

    for (const { phrase, pattern } of AIISH_PHRASE_PATTERNS) {
      if (!pattern.test(line)) continue;
      issues.push(
        suggestion(
          "content.aiish_phrase",
          "style",
          file,
          `Review template-like phrase: ${phrase}`,
          index + 1,
          line.trim(),
          "Replace the filler phrase with the concrete mechanism, evidence, limitation, or implication."
        )
      );
    }

    for (const { phrase, pattern } of SUBJECTIVE_FRAMING_PATTERNS) {
      if (!pattern.test(line)) continue;
      issues.push(
        suggestion(
          "content.subjective_framing",
          "style",
          file,
          `Review over-subjective framing: ${phrase}`,
          index + 1,
          line.trim(),
          "State the mechanism, evidence, or author position directly."
        )
      );
    }

    for (const { phrase, pattern } of UNSUPPORTED_CERTAINTY_PATTERNS) {
      if (!pattern.test(line)) continue;
      if (isScopedCertaintyContext(phrase, line)) continue;
      issues.push(
        suggestion(
          "content.unsupported_certainty",
          "evidence",
          file,
          `Review unsupported certainty: ${phrase}`,
          index + 1,
          line.trim(),
          "Add scope, evidence, or a caveat for the claim."
        )
      );
    }

    for (const { phrase, pattern } of VAGUE_TECHNICAL_CLAIM_PATTERNS) {
      if (!pattern.test(line)) continue;
      issues.push(
        suggestion(
          "content.vague_technical_claim",
          "readability",
          file,
          `Review vague technical claim: ${phrase}`,
          index + 1,
          line.trim(),
          "Name the affected task, metric, cost dimension, or failure mode."
        )
      );
    }

    for (const { phrase, pattern } of AWKWARD_EXPRESSION_PATTERNS) {
      const span = getPatternSpan(line, pattern);
      if (!span) continue;
      issues.push(
        suggestion(
          "content.awkward_expression",
          "style",
          file,
          `Review awkward expression: ${phrase}`,
          index + 1,
          line.trim(),
          "Use a direct verb and name the technical object being changed or analyzed.",
          {
            reason:
              "The phrasing is usually a filler construction that can hide the actual technical action.",
            confidence: "medium",
            span,
          }
        )
      );
    }

    for (const { phrase, pattern } of TRANSLATIONESE_PATTERNS) {
      const span = getPatternSpan(line, pattern);
      if (!span) continue;
      issues.push(
        suggestion(
          "content.translationese",
          "readability",
          file,
          `Review translationese phrasing: ${phrase}`,
          index + 1,
          line.trim(),
          "Rewrite the sentence in natural Chinese or English while preserving the technical claim.",
          {
            reason:
              "The phrase often reads like translated filler instead of authored technical prose.",
            confidence: "medium",
            span,
          }
        )
      );
    }

    for (const { code, pattern, message } of MALFORMED_MARKDOWN_PATTERNS) {
      if (!pattern.test(line)) continue;
      issues.push(
        warning(code, "markdown", file, message, index + 1, line.trim())
      );
    }

    if (hasUnbalancedBoldMarkers(line)) {
      issues.push(
        warning(
          "content.unbalanced_bold_marker",
          "markdown",
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
          "linking",
          file,
          `Relative link target does not exist: ${href}`
        )
      );
    }
  }

  return issues;
}

function buildArticleQualityRubric(
  file: string,
  markdown: string,
  post?: SeedPost
): ArticleQualityRubric {
  const lines = stripCodeFences(markdown).split(/\r?\n/);
  const title =
    lines
      .find(line => /^#\s+/.test(line))
      ?.replace(/^#\s+/, "")
      .trim() || post?.title;
  const dimensions = Object.fromEntries(
    (Object.keys(RUBRIC_RULES) as ContentRubricDimension[]).map(dimension => [
      dimension,
      scoreRubricDimension(lines, dimension),
    ])
  ) as ArticleQualityRubric["dimensions"];
  const weak = getRubricDimensionsByStatus(dimensions, "weak");
  const missing = getRubricDimensionsByStatus(dimensions, "missing");

  return {
    file,
    articleSlug: post?.slug,
    title,
    dimensions,
    weak,
    missing,
  };
}

function scoreRubricDimension(
  lines: string[],
  dimension: ContentRubricDimension
): ArticleQualityRubric["dimensions"][ContentRubricDimension] {
  const rule = RUBRIC_RULES[dimension];
  const matchingLines = lines
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => rule.patterns.some(pattern => pattern.test(line)));
  const headingMatch = matchingLines.find(line => /^#{1,4}\s+/.test(line));
  const evidence = stripMarkdownSyntax(headingMatch ?? matchingLines[0] ?? "");

  if (headingMatch || matchingLines.length >= 2) {
    return {
      status: "present",
      reason: `${rule.label} is explicit in a heading or repeated nearby prose.`,
      evidence,
    };
  }

  if (matchingLines.length === 1) {
    return {
      status: "weak",
      reason: `${rule.label} appears once but may need clearer support.`,
      evidence,
    };
  }

  return {
    status: "missing",
    reason: `${rule.label} signal was not found by deterministic audit heuristics.`,
  };
}

function getRubricDimensionsByStatus(
  dimensions: ArticleQualityRubric["dimensions"],
  status: ContentRubricStatus
) {
  return (Object.keys(dimensions) as ContentRubricDimension[]).filter(
    dimension => dimensions[dimension].status === status
  );
}

function stripCodeFences(markdown: string) {
  return markdown.replace(/```[\s\S]*?```/g, "");
}

function stripMarkdownSyntax(value: string) {
  return value
    .replace(/^#{1,6}\s+/, "")
    .replace(/[*_`[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

function getPatternSpan(line: string, pattern: RegExp) {
  const match = new RegExp(pattern.source, pattern.flags).exec(line);
  if (!match || typeof match.index !== "number") return undefined;
  return {
    start: match.index,
    end: match.index + match[0].length,
  };
}

function isTechnicalCaveatPhrase(phrase: string, line: string) {
  if (phrase !== "需要注意的是" && phrase !== "值得注意的是") return false;
  return /[$`]|\\[a-zA-Z]+/.test(line);
}

function isScopedCertaintyContext(phrase: string, line: string) {
  if (phrase !== "永远") return false;
  if (/不是说/.test(line)) return true;
  return (
    /永远不能/.test(line) &&
    /(hidden|admin|draft|public|source|权限|安全|private)/i.test(line)
  );
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
  category: ContentFindingCategory,
  file: string,
  message: string,
  line?: number,
  evidence?: string
): ContentQualityIssue {
  return { severity: "warning", category, code, file, line, message, evidence };
}

function failure(
  code: string,
  file: string,
  message: string,
  line?: number,
  evidence?: string
): ContentQualityIssue {
  return {
    severity: "failure",
    category: getFailureCategory(code),
    code,
    file,
    line,
    message,
    evidence,
  };
}

function getFailureCategory(code: string): ContentFindingCategory {
  if (code.startsWith("seed.") || code.startsWith("series.")) {
    return "metadata";
  }
  if (code.includes("link")) return "linking";
  if (code.includes("markdown")) return "markdown";
  return "structure";
}

function suggestion(
  code: string,
  category: ContentFindingCategory,
  file: string,
  message: string,
  line?: number,
  evidence?: string,
  rewriteIntent?: string,
  metadata: Pick<
    ContentQualityIssue,
    "reason" | "confidence" | "span"
  > = {}
): ContentQualityIssue {
  return {
    severity: "suggestion",
    category,
    code,
    file,
    line,
    message,
    evidence,
    suggestion: rewriteIntent,
    ...metadata,
  };
}

async function writeContentAuditReport(
  outputPath: string,
  report: ContentQualityReport
) {
  const absolutePath = resolve(process.cwd(), outputPath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${JSON.stringify(report, null, 2)}\n`);
}

function readOutputPath(args: string[]) {
  const outputArg = args.find(arg => arg.startsWith("--output="));
  if (outputArg) return outputArg.slice("--output=".length);

  const outputIndex = args.indexOf("--output");
  if (outputIndex >= 0) return args[outputIndex + 1];

  return undefined;
}

async function main() {
  const report = await runContentQualityAudit();
  const outputPath = readOutputPath(process.argv.slice(2));
  if (outputPath) {
    await writeContentAuditReport(outputPath, report);
  }
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.summary.failures > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
