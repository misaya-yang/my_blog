import { describe, expect, it } from "vitest";

import type { ArticleCardPost } from "@/components/ArticleCard";
import { getPublicTrackSeries } from "@/lib/tracks";

import {
  getPrimarySeries,
  getRepresentativePosts,
  sortPostsNewestFirst,
} from "./Home";

function post(overrides: Partial<ArticleCardPost>): ArticleCardPost {
  return {
    id: overrides.slug ?? "post",
    slug: overrides.slug ?? "post",
    title: overrides.title ?? overrides.slug ?? "Post",
    excerpt: "",
    publishedAt: overrides.publishedAt ?? "2026-05-01T00:00:00.000Z",
    category: overrides.category,
    seriesSlug: overrides.seriesSlug,
    seriesTitle: overrides.seriesTitle,
  };
}

const posts: ArticleCardPost[] = [
  post({
    slug: "isohc-fixed-vector-isometric-residual-mixing",
    title: "IsoHC: Fixed-Vector Isometric Residual Mixing",
    publishedAt: "2026-05-31T00:10:00.000Z",
    category: { slug: "ai-algorithms" },
    seriesSlug: "residual-stability",
  }),
  post({
    slug: "gated-ffn-multiplicative-channel-control",
    title: "Gated FFN",
    publishedAt: "2026-05-31T00:20:00.000Z",
    category: { slug: "ai-algorithms" },
    seriesSlug: "feed-forward-mechanisms",
  }),
  post({
    slug: "flow-matching-generative-transport",
    title: "Flow Matching",
    publishedAt: "2026-06-16T00:00:00.000Z",
    category: { slug: "ai-algorithms" },
    seriesSlug: "generative-modeling",
  }),
  post({
    slug: "llm-rl-post-training-verifiable-rewards",
    title: "大模型强化学习",
    publishedAt: "2026-06-17T00:00:00.000Z",
    category: { slug: "ai-algorithms" },
    seriesSlug: "llm-post-training-rl",
  }),
  post({
    slug: "goal-harness-agent-phase-protocol",
    title: "Goal Harness",
    publishedAt: "2026-06-16T12:00:00.000Z",
    category: { slug: "ai-applications" },
    seriesSlug: "agent-runtime-systems",
  }),
];

describe("home page article selection", () => {
  it("uses published time for the latest note", () => {
    expect(sortPostsNewestFirst(posts)[0].slug).toBe(
      "llm-rl-post-training-verifiable-rewards"
    );
  });

  it("uses the newest public posts for the algorithm path preview", () => {
    const publicSeries = getPublicTrackSeries("algorithms", posts);

    expect(publicSeries.length).toBeGreaterThan(0);
    expect(
      getRepresentativePosts(posts, "algorithms").map(item => item.slug)
    ).toEqual([
      "llm-rl-post-training-verifiable-rewards",
      "flow-matching-generative-transport",
    ]);
  });

  it("keeps newer unseriesed public posts visible in the track preview", () => {
    const experimentalPost = post({
      slug: "new-public-algorithm-note",
      title: "New Public Algorithm Note",
      publishedAt: "2026-06-18T00:00:00.000Z",
      category: { slug: "ai-algorithms" },
      seriesSlug: null,
    });

    expect(
      getRepresentativePosts([...posts, experimentalPost], "algorithms").map(
        item => item.slug
      )
    ).toEqual([
      "new-public-algorithm-note",
      "llm-rl-post-training-verifiable-rewards",
    ]);
  });

  it("promotes the newest algorithm series as the primary path", () => {
    const publicSeries = getPublicTrackSeries("algorithms", posts);

    expect(getPrimarySeries(publicSeries, posts)?.slug).toBe(
      "llm-post-training-rl"
    );
  });
});
