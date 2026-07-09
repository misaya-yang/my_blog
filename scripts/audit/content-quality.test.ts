import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { parseSeedPosts, runContentQualityAudit } from "./content-quality";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map(root => rm(root, { recursive: true, force: true }))
  );
});

async function createTempProject() {
  const root = await mkdtemp(join(tmpdir(), "content-quality-"));
  tempRoots.push(root);
  return root;
}

describe("content quality audit", () => {
  it("parses seeded post metadata without executing the seed script", () => {
    const posts = parseSeedPosts(`
      const posts = [
        {
          title:
            "Agent Harness Engine: Evaluating Tool-Using Agents Under Controlled Context",
          slug: "agent-harness-engine-evaluating-tool-using-agents",
          contentPath: "./agent_harness_engine_blog.md",
          status: "published",
          visibility: "public",
          excerpt:
            "Traceable agent evaluation.",
        },
      ];
    `);

    expect(posts).toEqual([
      {
        title:
          "Agent Harness Engine: Evaluating Tool-Using Agents Under Controlled Context",
        slug: "agent-harness-engine-evaluating-tool-using-agents",
        contentPath: "./agent_harness_engine_blog.md",
        status: "published",
        visibility: "public",
        excerpt: "Traceable agent evaluation.",
      },
    ]);
  });

  it("reports structural failures and style suggestions separately", async () => {
    const root = await createTempProject();
    await writeFile(
      join(root, "seed-blog.mjs"),
      `
      const posts = [
        {
          title: "Draft",
          slug: "draft-note",
          contentPath: "./draft.md",
          status: "draft",
          visibility: "hidden",
          excerpt: "Draft note.",
        },
        {
          title: "Broken",
          slug: "broken-note",
          contentPath: "./missing.md",
          status: "published",
          visibility: "public",
          excerpt: "",
        },
      ];
      `
    );
    await writeFile(
      join(root, "draft.md"),
      "# Draft\n\n本文将介绍一个方向，可以看到这里还很模板化。"
    );

    const report = await runContentQualityAudit(root);

    expect(report.summary.seedPosts).toBe(2);
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "failure",
          code: "seed.missing_excerpt",
        }),
        expect.objectContaining({
          severity: "failure",
          code: "seed.missing_content_file",
        }),
        expect.objectContaining({
          severity: "suggestion",
          code: "content.aiish_phrase",
          category: "style",
        }),
      ])
    );
    expect(report.summary.suggestions).toBe(2);
    expect(report.findings).toBe(report.issues);
  });

  it("flags subjective, certain, and vague technical claims as suggestions", async () => {
    const root = await createTempProject();
    await writeFile(
      join(root, "seed-blog.mjs"),
      `
      const posts = [
        {
          title: "Style",
          slug: "style-note",
          contentPath: "./style.md",
          status: "published",
          visibility: "public",
          excerpt: "Concrete style note.",
        },
      ];
      `
    );
    await writeFile(
      join(root, "style.md"),
      "# Style\n\n我认为这个方案会显著提升 Agent 能力，并且永远不会退化。"
    );

    const report = await runContentQualityAudit(root);

    expect(report.summary.suggestions).toBeGreaterThanOrEqual(3);
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "suggestion",
          category: "style",
          code: "content.subjective_framing",
          suggestion: expect.stringContaining("mechanism"),
        }),
        expect.objectContaining({
          severity: "suggestion",
          category: "evidence",
          code: "content.unsupported_certainty",
          suggestion: expect.stringContaining("scope"),
        }),
        expect.objectContaining({
          severity: "suggestion",
          category: "readability",
          code: "content.vague_technical_claim",
          suggestion: expect.stringContaining("metric"),
        }),
      ])
    );
  });

  it("adds article rubric summaries without turning weak dimensions into blockers", async () => {
    const root = await createTempProject();
    await writeFile(
      join(root, "seed-blog.mjs"),
      `
      const posts = [
        {
          title: "Rubric",
          slug: "rubric-note",
          contentPath: "./rubric.md",
          status: "published",
          visibility: "public",
          excerpt: "Concrete rubric note.",
        },
      ];
      `
    );
    await writeFile(
      join(root, "rubric.md"),
      [
        "# Rubric",
        "",
        "## Problem",
        "Readers lose context when route state is not restored.",
        "",
        "## Mechanism",
        "The router stores the source route and heading target.",
        "",
        "## Evidence",
        "A focused test covers restoration from search results.",
        "",
        "This means the next reading link remains useful.",
      ].join("\n")
    );

    const report = await runContentQualityAudit(root);
    const rubric = report.rubrics.find(item => item.file === "rubric.md");

    expect(report.summary.rubricArticles).toBe(1);
    expect(
      report.issues.filter(issue => issue.code.startsWith("rubric."))
    ).toEqual([]);
    expect(rubric).toEqual(
      expect.objectContaining({
        file: "rubric.md",
        articleSlug: "rubric-note",
        dimensions: expect.objectContaining({
          problem: expect.objectContaining({ status: "present" }),
          mechanism: expect.objectContaining({ status: "present" }),
          evidence: expect.objectContaining({ status: "present" }),
          implication: expect.objectContaining({ status: "weak" }),
          limitation: expect.objectContaining({ status: "missing" }),
        }),
        weak: ["implication"],
        missing: ["limitation"],
      })
    );
    expect(report.summary.rubricWeakDimensions).toBe(1);
    expect(report.summary.rubricMissingDimensions).toBe(1);
  });

  it("recognizes failure boundaries as limitation coverage", async () => {
    const root = await createTempProject();
    await writeFile(
      join(root, "seed-blog.mjs"),
      `
      const posts = [
        {
          title: "Gated Note",
          slug: "gated-note",
          contentPath: "./boundary.md",
          status: "published",
          visibility: "public",
          excerpt: "Concrete boundary note.",
        },
      ];
      `
    );
    await writeFile(
      join(root, "boundary.md"),
      [
        "# Gated Note",
        "",
        "## Problem",
        "The model comparison can fail when parameter budgets are not controlled.",
        "",
        "## Mechanism",
        "The gated branch multiplies a value projection by an input-conditioned gate.",
        "",
        "## Evidence",
        "The implementation test compares shape and budget assumptions.",
        "",
        "## Failure Boundaries",
        "The result does not claim every task improves or every optimizer stays stable.",
        "",
        "## Takeaway",
        "Therefore the article should frame the mechanism as conditional channel control.",
      ].join("\n")
    );

    const report = await runContentQualityAudit(root);
    const rubric = report.rubrics.find(item => item.file === "boundary.md");

    expect(rubric?.dimensions.limitation).toEqual(
      expect.objectContaining({
        status: "present",
        evidence: "Failure Boundaries",
      })
    );
    expect(rubric?.missing).not.toContain("limitation");
  });

  it("flags awkward expression and translationese as metadata-rich suggestions", async () => {
    const root = await createTempProject();
    await writeFile(
      join(root, "seed-blog.mjs"),
      `
      const posts = [
        {
          title: "Expression",
          slug: "expression-note",
          contentPath: "./expression.md",
          status: "published",
          visibility: "public",
          excerpt: "Concrete expression note.",
        },
      ];
      `
    );
    await writeFile(
      join(root, "expression.md"),
      [
        "# Expression",
        "",
        "这里需要进行一个分析，才能解释机制。",
        "",
        "作者对检索流程进行评估后再写结论。",
        "",
        "We should not make a conclusion before evidence is named.",
      ].join("\n")
    );

    const report = await runContentQualityAudit(root);

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "suggestion",
          category: "style",
          code: "content.awkward_expression",
          evidence: expect.stringContaining("进行一个分析"),
          reason: expect.stringContaining("filler construction"),
          confidence: "medium",
          span: expect.objectContaining({
            start: expect.any(Number),
            end: expect.any(Number),
          }),
        }),
        expect.objectContaining({
          severity: "suggestion",
          category: "style",
          code: "content.awkward_expression",
          evidence: expect.stringContaining("make a conclusion"),
          suggestion: expect.stringContaining("direct verb"),
        }),
        expect.objectContaining({
          severity: "suggestion",
          category: "readability",
          code: "content.translationese",
          evidence: expect.stringContaining("对检索流程进行评估"),
          reason: expect.stringContaining("translated filler"),
          confidence: "medium",
        }),
      ])
    );
  });

  it("flags English AI-ish and subjective phrasing as suggestions", async () => {
    const root = await createTempProject();
    await writeFile(
      join(root, "seed-blog.mjs"),
      `
      const posts = [
        {
          title: "English Voice",
          slug: "english-voice",
          contentPath: "./english.md",
          status: "published",
          visibility: "public",
          excerpt: "Concrete English voice note.",
        },
      ];
      `
    );
    await writeFile(
      join(root, "english.md"),
      [
        "# English Voice",
        "",
        "In this article, we take a deep dive into a paradigm shift.",
        "",
        "I think we can see that this clearly significantly improves retrieval.",
        "",
        "```ts",
        "const phrase = 'in this article clearly improves efficiency';",
        "```",
      ].join("\n")
    );

    const report = await runContentQualityAudit(root);

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "suggestion",
          category: "style",
          code: "content.aiish_phrase",
          evidence: expect.stringContaining("deep dive"),
        }),
        expect.objectContaining({
          severity: "suggestion",
          category: "style",
          code: "content.subjective_framing",
          evidence: expect.stringContaining("I think"),
        }),
        expect.objectContaining({
          severity: "suggestion",
          category: "readability",
          code: "content.vague_technical_claim",
          evidence: expect.stringContaining("significantly improves"),
        }),
      ])
    );
    expect(
      report.issues.filter(issue =>
        issue.evidence?.includes("const phrase =")
      )
    ).toEqual([]);
  });

  it("flags vague seed excerpts without inspecting article claims", async () => {
    const root = await createTempProject();
    await writeFile(
      join(root, "seed-blog.mjs"),
      `
      const posts = [
        {
          title: "Voice",
          slug: "voice-note",
          contentPath: "./voice.md",
          status: "published",
          visibility: "public",
          excerpt: "一篇面向后训练技术栈的系统梳理：把方法放进同一张技术地图。",
        },
      ];
      `
    );
    await writeFile(join(root, "voice.md"), "# Voice\n\nBody.");

    const report = await runContentQualityAudit(root);

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          code: "seed.generic_excerpt_voice",
          evidence: expect.stringContaining("系统梳理"),
        }),
        expect.objectContaining({
          severity: "warning",
          code: "seed.generic_excerpt_voice",
          evidence: expect.stringContaining("技术地图"),
        }),
      ])
    );
  });

  it("flags generic public seed titles and excerpts as voice suggestions", async () => {
    const root = await createTempProject();
    await writeFile(
      join(root, "seed-blog.mjs"),
      `
      const posts = [
        {
          title: "Agent RAG Ultimate Guide: 一文看懂范式变革",
          slug: "generic-title",
          contentPath: "./generic.md",
          status: "published",
          visibility: "public",
          excerpt: "A deep dive into a revolutionary paradigm shift that dramatically improves retrieval.",
        },
      ];
      `
    );
    await writeFile(join(root, "generic.md"), "# Agent RAG Ultimate Guide: 一文看懂范式变革\n\nBody.");

    const report = await runContentQualityAudit(root);

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "suggestion",
          category: "style",
          code: "seed.generic_title_voice",
          evidence: expect.stringContaining("Ultimate Guide"),
        }),
        expect.objectContaining({
          severity: "suggestion",
          category: "style",
          code: "seed.generic_excerpt_voice_suggestion",
          evidence: expect.stringContaining("deep dive"),
        }),
      ])
    );
  });

  it("keeps hidden draft seed titles and excerpts out of public voice suggestions", async () => {
    const root = await createTempProject();
    await writeFile(
      join(root, "seed-blog.mjs"),
      `
      const posts = [
        {
          title: "Agent RAG Ultimate Guide: 一文看懂范式变革",
          slug: "hidden-generic-title",
          contentPath: "./hidden.md",
          status: "draft",
          visibility: "hidden",
          excerpt: "A deep dive into a revolutionary paradigm shift.",
        },
      ];
      `
    );
    await writeFile(join(root, "hidden.md"), "# Agent RAG Ultimate Guide: 一文看懂范式变革\n\nBody.");

    const report = await runContentQualityAudit(root);

    expect(
      report.issues.filter(issue =>
        issue.code.startsWith("seed.generic_") &&
        issue.category === "style"
      )
    ).toEqual([]);
  });

  it("keeps hidden draft excerpts out of public voice warnings", async () => {
    const root = await createTempProject();
    await writeFile(
      join(root, "seed-blog.mjs"),
      `
      const posts = [
        {
          title: "Draft Voice",
          slug: "draft-voice",
          contentPath: "./draft-voice.md",
          status: "draft",
          visibility: "hidden",
          excerpt: "一篇面向内部实验的系统梳理：把草稿放进同一张技术地图。",
        },
      ];
      `
    );
    await writeFile(join(root, "draft-voice.md"), "# Draft Voice\n\nBody.");

    const report = await runContentQualityAudit(root);

    expect(
      report.issues.filter(issue => issue.code === "seed.generic_excerpt_voice")
    ).toEqual([]);
  });

  it("allows technical caveat phrases inside math-heavy derivation prose", async () => {
    const root = await createTempProject();
    await writeFile(
      join(root, "seed-blog.mjs"),
      `
      const posts = [
        {
          title: "Derivation",
          slug: "derivation",
          contentPath: "./derivation.md",
          status: "published",
          visibility: "public",
          excerpt: "Concrete derivation note.",
        },
      ];
      `
    );
    await writeFile(
      join(root, "derivation.md"),
      [
        "# Derivation",
        "",
        "需要注意的是，$Q^TQ=I$ 只约束残差子空间。",
        "",
        "这不是说网络整体永远不放大信号，而是说明 residual transport 不额外制造谱变化。",
        "",
        "- hidden/admin/draft 内容永远不能进 public source。",
      ].join("\n")
    );

    const report = await runContentQualityAudit(root);

    expect(
      report.issues.filter(issue => issue.code === "content.aiish_phrase")
    ).toEqual([]);
    expect(
      report.issues.filter(
        issue => issue.code === "content.unsupported_certainty"
      )
    ).toEqual([]);
  });

  it("flags malformed prose markers without flagging normal bold labels or code", async () => {
    const root = await createTempProject();
    await writeFile(
      join(root, "seed-blog.mjs"),
      `
      const posts = [
        {
          title: "Clean",
          slug: "clean-note",
          contentPath: "./clean.md",
          status: "published",
          visibility: "public",
          excerpt: "Clean note.",
        },
      ];
      `
    );
    await writeFile(
      join(root, "clean.md"),
      [
        "# Clean",
        "",
        "- **Metric:** normal label.",
        "",
        "```python",
        "return base ** (-phi)",
        "```",
        "",
        "我们**需要修复这个残留。",
        "",
        "This was AI-generated by a draft.",
        "",
        "This line has **broken emphasis.",
      ].join("\n")
    );

    const report = await runContentQualityAudit(root);

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "content.malformed_bold_after_pronoun",
        }),
        expect.objectContaining({
          code: "content.ai_label_residue",
        }),
        expect.objectContaining({
          code: "content.unbalanced_bold_marker",
        }),
      ])
    );
    expect(
      report.issues
        .filter(issue => issue.code === "content.unbalanced_bold_marker")
        .map(issue => issue.line)
    ).toEqual([9, 13]);
  });

  it("treats shell-provided seeded titles as warnings", async () => {
    const root = await createTempProject();
    await writeFile(
      join(root, "seed-blog.mjs"),
      `
      const posts = [
        {
          title: "Shell Titled",
          slug: "shell-titled",
          contentPath: "./shell.md",
          status: "published",
          visibility: "public",
          excerpt: "Uses shell title.",
        },
      ];
      `
    );
    await writeFile(join(root, "shell.md"), "Body starts without an H1.");

    const report = await runContentQualityAudit(root);

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          code: "content.shell_title_only",
          file: "shell.md",
        }),
      ])
    );
    expect(report.issues).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "failure",
          code: "content.missing_h1",
        }),
      ])
    );
  });

  it("skips root project markdown that is not tied to a seeded article", async () => {
    const root = await createTempProject();
    await writeFile(
      join(root, "seed-blog.mjs"),
      `
      const posts = [
        {
          title: "Seeded",
          slug: "seeded",
          contentPath: "./seeded.md",
          status: "published",
          visibility: "public",
          excerpt: "Seeded note.",
        },
      ];
      `
    );
    await writeFile(join(root, "seeded.md"), "# Seeded\n\nBody.");
    await writeFile(
      join(root, "agent.md"),
      "Branch policy without article H1."
    );

    const report = await runContentQualityAudit(root);

    expect(report.summary.markdownFiles).toBe(1);
    expect(report.summary.articleFiles).toBe(1);
    expect(report.summary.skippedMarkdownFiles).toBe(1);
    expect(report.issues).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "content.missing_h1",
          file: "agent.md",
        }),
      ])
    );
  });

  it("ignores phase evidence markdown snapshots in the project root", async () => {
    const root = await createTempProject();
    await writeFile(
      join(root, "seed-blog.mjs"),
      `
      const posts = [
        {
          title: "Seeded",
          slug: "seeded",
          contentPath: "./seeded.md",
          status: "published",
          visibility: "public",
          excerpt: "Seeded note.",
        },
      ];
      `
    );
    await writeFile(join(root, "seeded.md"), "# Seeded\n\nBody.");
    await writeFile(
      join(root, "wpu-01-home-mobile-snapshot.md"),
      "snapshot text"
    );

    const report = await runContentQualityAudit(root);

    expect(report.summary.markdownFiles).toBe(1);
    expect(report.issues.map(issue => issue.file)).not.toContain(
      "wpu-01-home-mobile-snapshot.md"
    );
  });
});
