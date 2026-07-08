import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

import { EmptyState, LoadingState, MetricTile } from "@/components/ResearchShell";
import { useLanguage } from "@/contexts/LanguageContext";

export type IndexStatus = {
  chunkCount: number;
  publicPostCount: number;
  indexedPublicPostCount: number;
  hiddenOrDraftExcludedCount: number;
  lastReindexAt: string | Date | null;
  latestReindexError: string | null;
  reindexCommand: string;
  publishCommand: string;
  stalePublicPostSlugs: string[];
  extraIndexedPostSlugs: string[];
  indexedPostSlugs: string[];
};

export function AgentIndexStatusPanel({
  loading,
  error,
  status,
}: {
  loading: boolean;
  error: boolean;
  status?: IndexStatus;
}) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <LoadingState
        title={t("agentOps.index.loading")}
        description={t("common.loadingHint")}
      />
    );
  }

  if (error || !status) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-4 w-4" />}
        title={t("agentOps.index.error")}
      />
    );
  }

  const isFresh =
    status.stalePublicPostSlugs.length === 0 &&
    status.extraIndexedPostSlugs.length === 0 &&
    !status.latestReindexError;
  const blockerClass = isFresh
    ? "border-cyan-300/20 bg-cyan-950/15"
    : "border-amber-300/25 bg-amber-950/20";

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <MetricTile
          label={t("agentOps.index.chunks")}
          value={String(status.chunkCount)}
        />
        <MetricTile
          label={t("agentOps.index.publicPosts")}
          value={String(status.publicPostCount)}
        />
        <MetricTile
          label={t("agentOps.index.coverage")}
          value={`${status.indexedPublicPostCount}/${status.publicPostCount}`}
        />
        <MetricTile
          label={t("agentOps.index.excluded")}
          value={String(status.hiddenOrDraftExcludedCount)}
        />
      </div>
      <div className={`rounded-lg border p-4 ${blockerClass}`}>
        <div className="flex items-start gap-3">
          {isFresh ? (
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
          )}
          <div className="min-w-0">
            <h2 className="font-semibold text-white">
              {isFresh
                ? t("agentOps.index.releaseReady")
                : t("agentOps.index.releaseBlocked")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {isFresh
                ? t("agentOps.index.releaseReadyDescription")
                : t("agentOps.index.releaseBlockedDescription")}
            </p>
            {!isFresh && (
              <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-400">
                <code className="rounded bg-slate-950/70 px-1.5 py-0.5 text-amber-100">
                  {status.reindexCommand}
                </code>
                <span>{t("agentOps.index.then")}</span>
                <code className="rounded bg-slate-950/70 px-1.5 py-0.5 text-amber-100">
                  pnpm content:verify
                </code>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-sky-200/15 bg-slate-950/45 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isFresh ? (
              <ShieldCheck className="h-4 w-4 text-cyan-200" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-200" />
            )}
            <h2 className="font-semibold text-white">
              {isFresh
                ? t("agentOps.index.fresh")
                : t("agentOps.index.needsReindex")}
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {t("agentOps.index.lastReindex")}:{" "}
            {formatDateTime(status.lastReindexAt)}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {t("agentOps.index.cliOnly")}{" "}
          <code className="rounded bg-slate-900 px-1.5 py-0.5 text-sky-100">
            {status.reindexCommand}
          </code>
          {" / "}
          <code className="rounded bg-slate-900 px-1.5 py-0.5 text-sky-100">
            {status.publishCommand}
          </code>
        </p>
        {(status.stalePublicPostSlugs.length > 0 ||
          status.extraIndexedPostSlugs.length > 0 ||
          status.latestReindexError) && (
          <div className="mt-3 space-y-2 text-xs leading-5 text-slate-400">
            {status.stalePublicPostSlugs.length > 0 && (
              <p>
                {t("agentOps.index.stale")}:{" "}
                {status.stalePublicPostSlugs.join(", ")}
              </p>
            )}
            {status.extraIndexedPostSlugs.length > 0 && (
              <p>
                {t("agentOps.index.extra")}:{" "}
                {status.extraIndexedPostSlugs.join(", ")}
              </p>
            )}
            {status.latestReindexError && (
              <p className="text-amber-200">
                {t("agentOps.index.latestError")}: {status.latestReindexError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}
