import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AgentQualityOverview } from "./AgentQualityOverview";
import type { IndexStatus } from "./AgentIndexStatusPanel";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: translate,
  }),
}));

describe("AgentQualityOverview", () => {
  it("prioritizes stale index and weak Agent run actions", () => {
    const html = renderToStaticMarkup(
      <AgentQualityOverview
        qualityLoading={false}
        qualityError={false}
        qualitySummary={{
          knowledgeStatus: {
            ...freshIndex(),
            stalePublicPostSlugs: ["agent-loop-observable"],
          },
          radar: {
            summary: {
              totalRuns: 4,
              uniqueQuestions: 2,
              noSourceRuns: 1,
              failedRuns: 1,
            },
            noSourceRuns: [
              {
                runId: "run-1",
                question: "Explain missing source",
                scopeType: "post",
                scopeValue: "agent-loop",
              },
            ],
            failedRuns: [
              {
                runId: "run-2",
                question: "Why did it fail?",
                scopeType: "track",
                scopeValue: "ai-applications",
              },
            ],
          },
          releaseBlocking: true,
          actionItems: [
            {
              id: "index_stale",
              severity: "high",
              title: "Agent knowledge index is stale",
              description: "The public article inventory and Agent knowledge index do not match.",
              target: "index",
              count: 1,
              details: ["agent-loop-observable"],
            },
            {
              id: "no_source_runs",
              severity: "medium",
              title: "Completed Agent runs without public sources",
              description: "Review whether content coverage needs work.",
              target: "content_radar",
              count: 1,
              details: ["run-1 · post:agent-loop"],
            },
            {
              id: "failed_runs",
              severity: "medium",
              title: "Failed Agent runs need trace review",
              description: "Inspect recent failed runs.",
              target: "traces",
              count: 1,
              details: ["run-2 · agent_generation_failed · track:ai-applications"],
            },
          ],
        }}
        searchMissLoading={false}
        searchMisses={{
          total: 3,
          uniqueQueries: 1,
          opportunities: [
            {
              query: "agent memory",
              count: 3,
              suggestedPrompt: "Consider a memory article.",
            },
          ],
        }}
      />
    );

    expect(html).toContain("Needs work");
    expect(html).toContain("Refresh Agent knowledge");
    expect(html).toContain("agent-loop-observable");
    expect(html).toContain("No-source Agent runs");
    expect(html).toContain("run-1");
    expect(html).not.toContain("Explain missing source");
    expect(html).toContain("Failed Agent runs");
    expect(html).toContain("agent_generation_failed");
    expect(html).not.toContain("Why did it fail?");
    expect(html).toContain("Search misses");
    expect(html).toContain("agent memory");
    expect(html).toContain("4 actions");
  });

  it("shows all-clear state when existing quality signals are clean", () => {
    const html = renderToStaticMarkup(
      <AgentQualityOverview
        qualityLoading={false}
        qualityError={false}
        qualitySummary={{
          knowledgeStatus: freshIndex(),
          radar: {
            summary: {
              totalRuns: 2,
              uniqueQuestions: 2,
              noSourceRuns: 0,
              failedRuns: 0,
            },
            noSourceRuns: [],
            failedRuns: [],
          },
          releaseBlocking: false,
          actionItems: [],
        }}
        searchMissLoading={false}
        searchMisses={{
          total: 0,
          uniqueQueries: 0,
          opportunities: [],
        }}
      />
    );

    expect(html).toContain("Fresh");
    expect(html).toContain("All clear");
    expect(html).toContain("0 actions");
    expect(html).not.toContain("Refresh Agent knowledge");
    expect(html).not.toContain("No-source Agent runs");
  });

  it("does not show all-clear while quality signals are still loading", () => {
    const html = renderToStaticMarkup(
      <AgentQualityOverview
        qualityLoading
        qualityError={false}
        qualitySummary={undefined}
        searchMissLoading
        searchMisses={undefined}
      />
    );

    expect(html).toContain("Loading Agent quality signals");
    expect(html).toContain("Loading");
    expect(html).not.toContain("All clear");
  });
});

function freshIndex(): IndexStatus {
  return {
    chunkCount: 142,
    publicPostCount: 9,
    indexedPublicPostCount: 9,
    hiddenOrDraftExcludedCount: 1,
    lastReindexAt: "2026-07-09T00:00:00.000Z",
    latestReindexError: null,
    reindexCommand: "pnpm ai:reindex",
    publishCommand: "pnpm content:publish",
    stalePublicPostSlugs: [],
    extraIndexedPostSlugs: [],
    indexedPostSlugs: ["agent-loop-observable"],
  };
}

function translate(key: string, values?: Record<string, string | number>) {
  return (
    (
      {
        "agentOps.overview.title": "Quality overview",
        "agentOps.overview.description": "First screen summary.",
        "agentOps.overview.knowledge": "Knowledge",
        "agentOps.overview.noSource": "No-source",
        "agentOps.overview.failed": "Failed",
        "agentOps.overview.searchMisses": "Search misses",
        "agentOps.overview.actions": "Action queue",
        "agentOps.overview.actionsDescription": "Prioritized owner work.",
        "agentOps.overview.actionCount": `${values?.count} actions`,
        "agentOps.overview.loadingBadge": "Loading",
        "agentOps.overview.loading": "Loading Agent quality signals",
        "agentOps.overview.allClear": "All clear",
        "agentOps.overview.allClearDescription": "No owner action now.",
        "common.loadingHint": "Please wait.",
        "agentOps.overview.actionIndexTitle": "Refresh Agent knowledge",
        "agentOps.overview.actionIndexDescription": "Index is stale.",
        "agentOps.overview.actionRadarErrorTitle": "Question radar unavailable",
        "agentOps.overview.actionRadarErrorDescription": "Check radar.",
        "agentOps.overview.actionSummaryErrorTitle": "Quality summary unavailable",
        "agentOps.overview.actionSummaryErrorDescription": "Check summary.",
        "agentOps.overview.actionNoSourceTitle": "No-source Agent runs",
        "agentOps.overview.actionNoSourceDescription": `${values?.count} no-source runs`,
        "agentOps.overview.actionFailedTitle": "Failed Agent runs",
        "agentOps.overview.actionFailedDescription": `${values?.count} failed runs`,
        "agentOps.overview.actionSearchMissTitle": "Search misses",
        "agentOps.overview.actionSearchMissDescription": `${values?.count} search misses`,
        "agentOps.overview.unavailable": "Unavailable",
        "agentOps.overview.fresh": "Fresh",
        "agentOps.overview.needsWork": "Needs work",
        "agentOps.index.title": "Index Status",
        "agentOps.ideas.title": "Content Radar",
        "agentOps.traces.title": "Recent Traces",
      } satisfies Record<string, string>
    )[key] ?? key
  );
}
