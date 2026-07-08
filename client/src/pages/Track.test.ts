import { describe, expect, it } from "vitest";

import type { TrackSeriesConfig } from "@/lib/tracks";

import { getTrackReadingPathStats, getTrackStartPostSlug } from "./Track";

const series: TrackSeriesConfig[] = [
  {
    slug: "agent-runtime-systems",
    titleKey: "series.agentRuntime.title",
    promiseKey: "series.agentRuntime.promise",
    postSlugs: ["agent-loop-observable-tool-using-agents", "goal-harness"],
    expectedNextKeys: ["series.agentRuntime.next1", "series.agentRuntime.next2"],
    conceptKeys: ["track.topic.agentSystems"],
  },
  {
    slug: "agentic-rag-infrastructure",
    titleKey: "series.agenticRag.title",
    promiseKey: "series.agenticRag.promise",
    postSlugs: ["rag-evidence-packet-context-compiler"],
    expectedNextKeys: ["series.agenticRag.next1"],
    conceptKeys: ["track.topic.ragRetrieval"],
  },
];

describe("track reading path helpers", () => {
  it("uses the first public path article as the start note", () => {
    expect(getTrackStartPostSlug(series)).toBe(
      "agent-loop-observable-tool-using-agents"
    );
    expect(getTrackStartPostSlug([])).toBeNull();
  });

  it("summarizes public reading paths and planned topics", () => {
    expect(getTrackReadingPathStats(series)).toEqual({
      pathCount: 2,
      articleCount: 3,
      plannedTopicCount: 3,
    });
  });
});
