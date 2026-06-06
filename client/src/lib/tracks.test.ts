import { describe, expect, it } from "vitest";

import { getPublicTrackSeries, type TrackSeriesPost } from "./tracks";

const publishedPosts: TrackSeriesPost[] = [
  {
    slug: "isohc-fixed-vector-isometric-residual-mixing",
    category: { slug: "ai-algorithms" },
    seriesSlug: "residual-stability",
  },
  {
    slug: "agent-harness-engine-evaluating-tool-using-agents",
    category: { slug: "ai-applications" },
    seriesSlug: "agent-runtime-systems",
  },
  {
    slug: "rag-evidence-packet-context-compiler",
    category: { slug: "ai-applications" },
    seriesSlug: "agent-runtime-systems",
  },
  {
    slug: "agent-loop-observable-tool-using-agents",
    category: { slug: "ai-applications" },
    seriesSlug: "agent-runtime-systems",
  },
  {
    slug: "goal-harness-agent-phase-protocol",
    category: { slug: "ai-applications" },
    seriesSlug: "agent-runtime-systems",
  },
];

describe("public track series", () => {
  it("hides planned-only series from public reading paths", () => {
    const algorithmsSeries = getPublicTrackSeries("algorithms", publishedPosts);

    expect(algorithmsSeries.map(series => series.slug)).toEqual([
      "residual-stability",
    ]);
  });

  it("assigns each public article to one reading path", () => {
    const applicationsSeries = getPublicTrackSeries(
      "applications",
      publishedPosts
    );
    const slugs = applicationsSeries.flatMap(series => series.postSlugs);

    expect(applicationsSeries.map(series => series.slug)).toEqual([
      "agent-runtime-systems",
    ]);
    expect(slugs).toEqual([
      "agent-harness-engine-evaluating-tool-using-agents",
      "rag-evidence-packet-context-compiler",
      "agent-loop-observable-tool-using-agents",
      "goal-harness-agent-phase-protocol",
    ]);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
