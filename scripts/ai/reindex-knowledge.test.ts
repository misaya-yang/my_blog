import { describe, expect, it } from "vitest";

import {
  formatKnowledgeStatusLines,
  parseReindexKnowledgeArgs,
} from "./reindex-knowledge";
import type { AgentKnowledgeIndexStatusOutput } from "../../server/ai/types";

describe("AI knowledge reindex CLI helpers", () => {
  it("parses dry-run mode explicitly", () => {
    expect(parseReindexKnowledgeArgs(["--dry-run"])).toEqual({
      dryRun: true,
    });
    expect(parseReindexKnowledgeArgs([])).toEqual({ dryRun: false });
  });

  it("rejects unknown arguments", () => {
    expect(() => parseReindexKnowledgeArgs(["--publish"])).toThrow(
      "Unknown ai:reindex argument: --publish"
    );
  });

  it("formats stale and latest-error status without mutating state", () => {
    const lines = formatKnowledgeStatusLines({
      chunkCount: 142,
      publicPostCount: 8,
      indexedPublicPostCount: 8,
      hiddenOrDraftExcludedCount: 1,
      lastReindexAt: new Date("2026-06-19T17:09:35.070Z"),
      latestReindexError: "previous failure",
      reindexCommand: "pnpm ai:reindex",
      publishCommand: "pnpm content:publish",
      stalePublicPostSlugs: [
        "flow-matching-generative-transport",
        "isohc-fixed-vector-isometric-residual-mixing",
      ],
      extraIndexedPostSlugs: [],
      indexedPostSlugs: ["flow-matching-generative-transport"],
    } satisfies AgentKnowledgeIndexStatusOutput);

    expect(lines).toEqual([
      "AI knowledge status: 8/8 public posts indexed, 1 hidden/draft excluded",
      "AI knowledge attention: stale=[flow-matching-generative-transport, isohc-fixed-vector-isometric-residual-mixing], extra=[]",
      "AI knowledge latest error: previous failure",
    ]);
  });
});
