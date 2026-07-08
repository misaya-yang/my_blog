import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { IndexStatusPanel } from "./ManageAgent";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string) =>
      (
        {
          "agentOps.index.chunks": "Chunks",
          "agentOps.index.publicPosts": "Public posts",
          "agentOps.index.coverage": "Coverage",
          "agentOps.index.excluded": "Excluded",
          "agentOps.index.fresh": "Knowledge index is aligned",
          "agentOps.index.needsReindex": "Knowledge index needs attention",
          "agentOps.index.releaseReady":
            "Release ready: Agent knowledge is fresh",
          "agentOps.index.releaseReadyDescription":
            "This state should not block review, merge, or deployment from the Agent knowledge side.",
          "agentOps.index.releaseBlocked":
            "Release blocker: refresh Agent knowledge before merge or deploy",
          "agentOps.index.releaseBlockedDescription":
            "The public article inventory and indexed Agent knowledge do not match.",
          "agentOps.index.then": "then",
          "agentOps.index.lastReindex": "Last indexed",
          "agentOps.index.cliOnly":
            "Reindex remains a CLI-only operation for now:",
          "agentOps.index.stale": "Missing public posts",
          "agentOps.index.extra": "Extra indexed posts",
          "agentOps.index.latestError": "Latest error",
        } satisfies Record<string, string>
      )[key] ?? key,
  }),
}));

describe("ManageAgent index status panel", () => {
  it("marks stale Agent knowledge as a release blocker with the verify sequence", () => {
    const html = renderToStaticMarkup(
      <IndexStatusPanel
        loading={false}
        error={false}
        status={{
          chunkCount: 142,
          publicPostCount: 8,
          indexedPublicPostCount: 8,
          hiddenOrDraftExcludedCount: 1,
          lastReindexAt: "2026-06-19T17:09:35.070Z",
          latestReindexError: null,
          reindexCommand: "pnpm ai:reindex",
          publishCommand: "pnpm content:publish",
          stalePublicPostSlugs: [
            "flow-matching-generative-transport",
            "isohc-fixed-vector-isometric-residual-mixing",
          ],
          extraIndexedPostSlugs: [],
          indexedPostSlugs: ["flow-matching-generative-transport"],
        }}
      />
    );

    expect(html).toContain(
      "Release blocker: refresh Agent knowledge before merge or deploy"
    );
    expect(html).toContain("pnpm ai:reindex");
    expect(html).toContain("pnpm content:verify");
    expect(html).toContain("flow-matching-generative-transport");
    expect(html).toContain("isohc-fixed-vector-isometric-residual-mixing");
  });

  it("does not show blocker language when Agent knowledge is fresh", () => {
    const html = renderToStaticMarkup(
      <IndexStatusPanel
        loading={false}
        error={false}
        status={{
          chunkCount: 142,
          publicPostCount: 8,
          indexedPublicPostCount: 8,
          hiddenOrDraftExcludedCount: 1,
          lastReindexAt: "2026-07-09T00:00:00.000Z",
          latestReindexError: null,
          reindexCommand: "pnpm ai:reindex",
          publishCommand: "pnpm content:publish",
          stalePublicPostSlugs: [],
          extraIndexedPostSlugs: [],
          indexedPostSlugs: ["flow-matching-generative-transport"],
        }}
      />
    );

    expect(html).toContain("Release ready: Agent knowledge is fresh");
    expect(html).not.toContain("Release blocker");
    expect(html).not.toContain("pnpm content:verify");
  });
});
