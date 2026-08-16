import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseSeedPosts } from "../scripts/audit/content-quality";
import { getPublicSeedArticleBySlug } from "./publicSeedPosts";

describe("public seed fallback posts", () => {
  it("carries primary series metadata from the shared content atlas", async () => {
    const article = await getPublicSeedArticleBySlug(
      "agent-loop-observable-tool-using-agents"
    );

    expect(article).toMatchObject({
      slug: "agent-loop-observable-tool-using-agents",
      seriesSlug: "agent-runtime-systems",
      seriesTitle: "Agent Runtime Systems",
      seriesOrder: 3,
      pinnedTrack: "applications",
    });
  });

  it("exposes the LLM RL article as a public algorithm seed post", async () => {
    const article = await getPublicSeedArticleBySlug(
      "llm-rl-post-training-verifiable-rewards"
    );

    expect(article).toMatchObject({
      title: "大模型强化学习：从 RLHF 到可验证奖励的后训练主线",
      slug: "llm-rl-post-training-verifiable-rewards",
      seriesSlug: "llm-post-training-rl",
      seriesTitle: "LLM Post-Training and RL",
      seriesOrder: 1,
      pinnedTrack: "algorithms",
      category: {
        slug: "ai-algorithms",
      },
    });
    expect(article?.content).toContain("## 三、当前技术路线");
    expect(article?.tags.map(tag => tag.slug)).toContain("rlhf");
  });

  it("exposes the long-horizon Agent article in the runtime series", async () => {
    const article = await getPublicSeedArticleBySlug(
      "long-horizon-agents-continuous-convergence"
    );

    expect(article).toMatchObject({
      title: "长程 Agent 为什么难：从单步能力到持续收敛",
      slug: "long-horizon-agents-continuous-convergence",
      seriesSlug: "agent-runtime-systems",
      seriesTitle: "Agent Runtime Systems",
      seriesOrder: 5,
      pinnedTrack: "applications",
      category: {
        slug: "ai-applications",
      },
    });
    expect(article?.content).toContain("## 10. 长程 Agent 的核心能力，是持续收敛");
    expect(article?.tags.map(tag => tag.slug)).toContain("long-horizon-agents");
  });

  it("keeps public fallback titles and excerpts in sync with seed-blog.mjs", async () => {
    const seedSource = await readFile("seed-blog.mjs", "utf-8");
    const publicSeedPosts = parseSeedPosts(seedSource).filter(
      post => post.status === "published" && post.visibility === "public"
    );

    expect(publicSeedPosts.length).toBeGreaterThan(0);

    for (const seedPost of publicSeedPosts) {
      const article = await getPublicSeedArticleBySlug(seedPost.slug);
      expect(article, seedPost.slug).toMatchObject({
        title: seedPost.title,
        excerpt: seedPost.excerpt,
      });
    }
  });
});
