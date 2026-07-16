import React from "react";
import {
  AlertTriangle,
  Lightbulb,
  Loader2,
  Route,
  ShieldCheck,
} from "lucide-react";

import { EmptyState, MetricTile, SectionHeader } from "@/components/ResearchShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import type { IndexStatus } from "./AgentIndexStatusPanel";

type RadarSummary = {
  totalRuns: number;
  uniqueQuestions: number;
  noSourceRuns: number;
  failedRuns: number;
};

type RadarRun = {
  runId: string;
  question?: string | null;
  scopeType?: string | null;
  scopeValue?: string | null;
};

type QuestionRadar = {
  summary: RadarSummary;
  noSourceRuns: RadarRun[];
  failedRuns: RadarRun[];
  suggestedIdeas?: Array<{
    ideaId: string;
    proposedTitle: string;
    supportCount: number;
  }>;
};

type SearchMisses = {
  total: number;
  uniqueQueries: number;
  opportunities: Array<{
    query: string;
    count: number;
    suggestedPrompt: string;
  }>;
};

type AgentQualitySummary = {
  knowledgeStatus: IndexStatus;
  radar: QuestionRadar;
  releaseBlocking: boolean;
  actionItems: QualityActionItem[];
};

type QualityActionItem = {
  id: "index_stale" | "index_error" | "no_source_runs" | "failed_runs";
  severity: "high" | "medium";
  title: string;
  description: string;
  target: "index" | "content_radar" | "traces";
  count?: number;
  details: string[];
};

type OverviewAction = {
  id: string;
  tone: "blocked" | "warning" | "info";
  title: string;
  description: string;
  target: string;
  targetTab: "index" | "traces" | "ideas";
  detail?: string;
};

export function AgentQualityOverview({
  qualityLoading,
  qualityError,
  qualitySummary,
  searchMisses,
  searchMissLoading,
  searchMissError,
  onNavigate,
}: {
  qualityLoading: boolean;
  qualityError: boolean;
  qualitySummary?: AgentQualitySummary;
  searchMisses?: SearchMisses;
  searchMissLoading?: boolean;
  searchMissError?: boolean;
  onNavigate?: (tab: "index" | "traces" | "ideas") => void;
}) {
  const { t } = useLanguage();
  const indexStatus = qualitySummary?.knowledgeStatus;
  const radar = qualitySummary?.radar;
  const indexFresh = isIndexFresh(indexStatus);
  const actions = buildOverviewActions({
    qualityError,
    actionItems: qualitySummary?.actionItems,
    searchMisses,
    searchMissError,
    t,
  });
  const noSourceCount = radar?.summary.noSourceRuns ?? 0;
  const failedCount = radar?.summary.failedRuns ?? 0;
  const searchMissCount = searchMisses?.uniqueQueries ?? 0;
  const overviewLoading = qualityLoading || Boolean(searchMissLoading);

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={<ShieldCheck className="h-4 w-4" />}
        title={t("agentOps.overview.title")}
        description={t("agentOps.overview.description")}
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricTile
          label={t("agentOps.overview.knowledge")}
          value={getIndexSummaryValue({
            loading: qualityLoading,
            error: qualityError,
            fresh: indexFresh,
            t,
          })}
        />
        <MetricTile
          label={t("agentOps.overview.noSource")}
          value={qualityLoading ? "..." : String(noSourceCount)}
        />
        <MetricTile
          label={t("agentOps.overview.failed")}
          value={qualityLoading ? "..." : String(failedCount)}
        />
        <MetricTile
          label={t("agentOps.overview.searchMisses")}
          value={
            searchMissLoading
              ? "..."
              : searchMissError
                ? t("agentOps.overview.unavailable")
                : String(searchMissCount)
          }
        />
      </div>

      <section className="rounded-lg border border-sky-200/15 bg-slate-950/45 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold text-white">
              {t("agentOps.overview.actions")}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
              {t("agentOps.overview.actionsDescription")}
            </p>
          </div>
          <Badge variant="outline" className="w-fit border-sky-200/20 text-sky-200">
            {overviewLoading
              ? t("agentOps.overview.loadingBadge")
              : t("agentOps.overview.actionCount", { count: actions.length })}
          </Badge>
        </div>

        {overviewLoading ? (
          <EmptyState
            icon={<Loader2 className="h-4 w-4 animate-spin" />}
            title={t("agentOps.overview.loading")}
            description={t("common.loadingHint")}
            className="mt-4"
          />
        ) : actions.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-4 w-4" />}
            title={t("agentOps.overview.allClear")}
            description={t("agentOps.overview.allClearDescription")}
            className="mt-4"
          />
        ) : (
          <div className="mt-4 grid gap-3">
            {actions.map(action => (
              <article
                key={action.id}
                className={`rounded-lg border p-3 ${getActionClass(action.tone)}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      {getActionIcon(action.tone)}
                      <h3 className="font-semibold text-white">
                        {action.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-6 text-slate-400">
                      {action.description}
                    </p>
                    {action.detail && (
                      <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                        {action.detail}
                      </p>
                    )}
                  </div>
                  {onNavigate ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit shrink-0"
                      onClick={() => onNavigate(action.targetTab)}
                    >
                      {action.target}
                    </Button>
                  ) : (
                    <Badge
                      variant="outline"
                      className="w-fit shrink-0 border-sky-200/20 text-sky-200"
                    >
                      {action.target}
                    </Badge>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function buildOverviewActions({
  qualityError,
  actionItems,
  searchMisses,
  searchMissError,
  t,
}: {
  qualityError: boolean;
  actionItems?: QualityActionItem[];
  searchMisses?: SearchMisses;
  searchMissError?: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const actions: OverviewAction[] = [];

  if (qualityError) {
    actions.push({
      id: "quality-error",
      tone: "warning",
      title: t("agentOps.overview.actionSummaryErrorTitle"),
      description: t("agentOps.overview.actionSummaryErrorDescription"),
      target: t("agentOps.ideas.title"),
      targetTab: "ideas",
    });
  }

  actions.push(...(actionItems ?? []).map(item => toOverviewAction(item, t)));

  if (searchMissError) {
    actions.push({
      id: "search-miss-error",
      tone: "warning",
      title: t("agentOps.overview.actionSearchMissErrorTitle"),
      description: t("agentOps.overview.actionSearchMissErrorDescription"),
      target: t("agentOps.ideas.title"),
      targetTab: "ideas",
    });
  }

  if ((searchMisses?.uniqueQueries ?? 0) > 0) {
    actions.push({
      id: "search-miss",
      tone: "info",
      title: t("agentOps.overview.actionSearchMissTitle"),
      description: t("agentOps.overview.actionSearchMissDescription", {
        count: searchMisses?.uniqueQueries ?? 0,
      }),
      detail: searchMisses?.opportunities
        .slice(0, 3)
        .map(item => item.query)
        .join(", "),
      target: t("agentOps.ideas.title"),
      targetTab: "ideas",
    });
  }

  return actions;
}

function toOverviewAction(
  item: QualityActionItem,
  t: (key: string, values?: Record<string, string | number>) => string
): OverviewAction {
  const count = item.count ?? item.details.length;
  if (item.id === "index_stale" || item.id === "index_error") {
    return {
      id: item.id,
      tone: "blocked",
      title: t("agentOps.overview.actionIndexTitle"),
      description: t("agentOps.overview.actionIndexDescription"),
      detail: item.details.slice(0, 3).join(", ") || undefined,
      target: t("agentOps.index.title"),
      targetTab: "index",
    };
  }

  if (item.id === "no_source_runs") {
    return {
      id: item.id,
      tone: item.severity === "high" ? "blocked" : "warning",
      title: t("agentOps.overview.actionNoSourceTitle"),
      description: t("agentOps.overview.actionNoSourceDescription", {
        count,
      }),
      detail: item.details.slice(0, 3).join(", ") || undefined,
      target: t("agentOps.ideas.title"),
      targetTab: "ideas",
    };
  }

  return {
    id: item.id,
    tone: item.severity === "high" ? "blocked" : "warning",
    title: t("agentOps.overview.actionFailedTitle"),
    description: t("agentOps.overview.actionFailedDescription", {
      count,
    }),
    detail: item.details.slice(0, 3).join(", ") || undefined,
    target: t("agentOps.traces.title"),
    targetTab: "traces",
  };
}

function isIndexFresh(status?: IndexStatus) {
  return Boolean(
    status &&
      status.stalePublicPostSlugs.length === 0 &&
      status.extraIndexedPostSlugs.length === 0 &&
      !status.latestReindexError
  );
}

function getIndexSummaryValue({
  loading,
  error,
  fresh,
  t,
}: {
  loading: boolean;
  error: boolean;
  fresh: boolean;
  t: (key: string) => string;
}) {
  if (loading) return "...";
  if (error) return t("agentOps.overview.unavailable");
  return fresh
    ? t("agentOps.overview.fresh")
    : t("agentOps.overview.needsWork");
}

function getActionClass(tone: OverviewAction["tone"]) {
  if (tone === "blocked") return "border-amber-300/25 bg-amber-950/20";
  if (tone === "warning") return "border-orange-300/20 bg-orange-950/15";
  return "border-sky-300/20 bg-sky-950/15";
}

function getActionIcon(tone: OverviewAction["tone"]) {
  if (tone === "blocked") {
    return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-200" />;
  }
  if (tone === "warning") {
    return <Route className="h-4 w-4 shrink-0 text-orange-200" />;
  }
  return <Lightbulb className="h-4 w-4 shrink-0 text-sky-200" />;
}
