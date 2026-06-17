import { describe, expect, it } from "vitest";

import { checkTrackCoverage } from "./publish-freshness";

function publicPost(input: {
  slug: string;
  categorySlug: "ai-algorithms" | "ai-applications";
  seriesSlug: string;
  pinnedTrack: "algorithms" | "applications";
}) {
  return {
    slug: input.slug,
    status: "published",
    visibility: "public",
    pinnedTrack: input.pinnedTrack,
    seriesSlug: input.seriesSlug,
    category: { slug: input.categorySlug },
  };
}

describe("publish freshness track coverage", () => {
  it("covers every public post in the shared track series catalog", () => {
    const publicPosts = [
      publicPost({
        slug: "isohc-fixed-vector-isometric-residual-mixing",
        categorySlug: "ai-algorithms",
        seriesSlug: "residual-stability",
        pinnedTrack: "algorithms",
      }),
      publicPost({
        slug: "gated-ffn-multiplicative-channel-control",
        categorySlug: "ai-algorithms",
        seriesSlug: "feed-forward-mechanisms",
        pinnedTrack: "algorithms",
      }),
      publicPost({
        slug: "flow-matching-generative-transport",
        categorySlug: "ai-algorithms",
        seriesSlug: "generative-modeling",
        pinnedTrack: "algorithms",
      }),
      publicPost({
        slug: "llm-rl-post-training-verifiable-rewards",
        categorySlug: "ai-algorithms",
        seriesSlug: "llm-post-training-rl",
        pinnedTrack: "algorithms",
      }),
      publicPost({
        slug: "agent-harness-engine-evaluating-tool-using-agents",
        categorySlug: "ai-applications",
        seriesSlug: "agent-runtime-systems",
        pinnedTrack: "applications",
      }),
      publicPost({
        slug: "rag-evidence-packet-context-compiler",
        categorySlug: "ai-applications",
        seriesSlug: "agent-runtime-systems",
        pinnedTrack: "applications",
      }),
      publicPost({
        slug: "agent-loop-observable-tool-using-agents",
        categorySlug: "ai-applications",
        seriesSlug: "agent-runtime-systems",
        pinnedTrack: "applications",
      }),
      publicPost({
        slug: "goal-harness-agent-phase-protocol",
        categorySlug: "ai-applications",
        seriesSlug: "agent-runtime-systems",
        pinnedTrack: "applications",
      }),
    ];
    const allPosts = [
      ...publicPosts,
      {
        slug: "evq-cosh-frequency-allocation",
        status: "draft",
        visibility: "hidden",
      },
    ];

    const result = checkTrackCoverage(publicPosts as never, allPosts as never);

    expect(result.ok).toBe(true);
    expect(result.publicTrackSlugs.applications).toContain(
      "goal-harness-agent-phase-protocol"
    );
    expect(result.configuredNonPublicSlugs).toEqual([]);
  });

  it("blocks when a public post is missing from its track path", () => {
    const result = checkTrackCoverage(
      [
        publicPost({
          slug: "unmapped-public-post",
          categorySlug: "ai-applications",
          seriesSlug: "agent-runtime-systems",
          pinnedTrack: "applications",
        }),
      ] as never,
      [
        {
          slug: "unmapped-public-post",
          status: "published",
          visibility: "public",
        },
        {
          slug: "evq-cosh-frequency-allocation",
          status: "draft",
          visibility: "hidden",
        },
      ] as never
    );

    expect(result.ok).toBe(false);
    expect(result.missingPublicSlugs).toEqual([
      "applications:unmapped-public-post",
    ]);
  });
});
