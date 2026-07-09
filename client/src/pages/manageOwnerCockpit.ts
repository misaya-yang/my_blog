import type { ManageReaderSignal } from "./manageReaderSignals";

export type OwnerCockpitNextAction =
  | "release_risk"
  | "backlog"
  | "agent_gap"
  | "clear";

type OwnerCockpitRadarSummary = {
  writingBacklog?: unknown[];
  feedback?: { newCount?: number };
  searchMisses?: { uniqueQueries?: number };
  readerSignals?: {
    total?: number;
    items?: ManageReaderSignal[];
  };
};

type OwnerCockpitAgentRadarSummary = {
  summary?: {
    noSourceRuns?: number;
    failedRuns?: number;
  };
  suggestedIdeas?: unknown[];
};

export function getOwnerCockpitSummary(
  radar?: OwnerCockpitRadarSummary,
  agentRadar?: OwnerCockpitAgentRadarSummary
) {
  const readerSignals = radar?.readerSignals?.items ?? [];
  const publishFreshnessRisks = readerSignals.filter(
    signal =>
      signal.kind === "publish_freshness" &&
      (signal.severity === "high" || signal.severity === "medium")
  );
  const highSignalCount = readerSignals.filter(
    signal => signal.severity === "high"
  ).length;
  const backlogCount =
    (radar?.writingBacklog?.length ?? 0) +
    (agentRadar?.suggestedIdeas?.length ?? 0);
  const agentGapCount =
    (agentRadar?.summary?.noSourceRuns ?? 0) +
    (agentRadar?.summary?.failedRuns ?? 0);
  const nextAction = getOwnerCockpitNextAction({
    releaseRiskCount: publishFreshnessRisks.length,
    backlogCount,
    agentGapCount,
  });

  return {
    nextAction,
    releaseRiskCount: publishFreshnessRisks.length,
    highSignalCount,
    backlogCount,
    agentGapCount,
    newFeedbackCount: radar?.feedback?.newCount ?? 0,
    searchGapCount: radar?.searchMisses?.uniqueQueries ?? 0,
    topSignal:
      publishFreshnessRisks[0] ??
      readerSignals.find(signal => signal.severity === "high") ??
      readerSignals[0] ??
      null,
  };
}

function getOwnerCockpitNextAction(input: {
  releaseRiskCount: number;
  backlogCount: number;
  agentGapCount: number;
}): OwnerCockpitNextAction {
  if (input.releaseRiskCount > 0) return "release_risk";
  if (input.backlogCount > 0) return "backlog";
  if (input.agentGapCount > 0) return "agent_gap";
  return "clear";
}
