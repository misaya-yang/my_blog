import { describe, expect, it } from "vitest";

import { getOwnerCockpitSummary } from "./manageOwnerCockpit";

describe("owner cockpit summary", () => {
  it("prioritizes publish freshness risks before backlog work", () => {
    const summary = getOwnerCockpitSummary(
      {
        writingBacklog: [{ id: "feedback-1" }],
        feedback: { newCount: 1 },
        searchMisses: { uniqueQueries: 2 },
        readerSignals: {
          items: [
            {
              id: "search_miss:agent-memory",
              kind: "search_miss",
              status: "new",
              severity: "high",
              query: "agent memory",
            },
            {
              id: "publish_freshness:missing_sitemap:post",
              kind: "publish_freshness",
              status: "new",
              severity: "high",
              articleSlug: "post",
            },
          ],
        },
      },
      { suggestedIdeas: [{ id: "agent-idea" }] }
    );

    expect(summary).toMatchObject({
      nextAction: "release_risk",
      releaseRiskCount: 1,
      highSignalCount: 2,
      backlogCount: 2,
      newFeedbackCount: 1,
      searchGapCount: 2,
    });
    expect(summary.topSignal?.kind).toBe("publish_freshness");
  });

  it("falls through to backlog, agent gaps, then clear", () => {
    expect(
      getOwnerCockpitSummary({ writingBacklog: [{ id: "feedback" }] })
        .nextAction
    ).toBe("backlog");
    expect(
      getOwnerCockpitSummary(undefined, {
        summary: { noSourceRuns: 2, failedRuns: 1 },
      }).nextAction
    ).toBe("agent_gap");
    expect(getOwnerCockpitSummary().nextAction).toBe("clear");
  });
});
