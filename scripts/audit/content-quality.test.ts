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

  it("reports structural failures and style warnings separately", async () => {
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
          severity: "warning",
          code: "content.aiish_phrase",
        }),
      ])
    );
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
      "# Derivation\n\n需要注意的是，$Q^TQ=I$ 只约束残差子空间。"
    );

    const report = await runContentQualityAudit(root);

    expect(
      report.issues.filter(issue => issue.code === "content.aiish_phrase")
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

  it("distinguishes shell-provided titles from true missing H1 defects", async () => {
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
    await writeFile(join(root, "orphan.md"), "Orphan body starts without an H1.");

    const report = await runContentQualityAudit(root);

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "warning",
          code: "content.shell_title_only",
          file: "shell.md",
        }),
        expect.objectContaining({
          severity: "failure",
          code: "content.missing_h1",
          file: "orphan.md",
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
    await writeFile(join(root, "wpu-01-home-mobile-snapshot.md"), "snapshot text");

    const report = await runContentQualityAudit(root);

    expect(report.summary.markdownFiles).toBe(1);
    expect(report.issues.map(issue => issue.file)).not.toContain(
      "wpu-01-home-mobile-snapshot.md"
    );
  });
});
