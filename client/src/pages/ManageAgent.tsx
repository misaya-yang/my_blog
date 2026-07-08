import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Database,
  FileSearch,
  Lightbulb,
  Loader2,
  Play,
  RefreshCw,
  Route,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AuthRequiredState,
  EmptyState,
  LoadingState,
  MetricTile,
  SectionHeader,
  SiteHeader,
  SpaceBackdrop,
} from "@/components/ResearchShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildRouteMetadata } from "@shared/metadata";
import {
  AgentIndexStatusPanel,
  type IndexStatus,
} from "./manage-agent/AgentIndexStatusPanel";
import { AgentQualityOverview } from "./manage-agent/AgentQualityOverview";

type AgentSourceListItem = {
  sourceId: string;
  postTitle: string;
  postSlug: string;
  excerpt: string;
  relevanceReason: string;
};

type RetrievalDiagnostics = {
  status: "ready" | "no_sources";
  terms: string[];
  expandedTerms?: string[];
  aliasExpansions?: Array<{ term: string; expansions: string[] }>;
  missingTerms: string[];
  currentPageContextInjected?: boolean;
  failureReason?: "retrieval_failure" | "wrong_source" | "refusal_boundary";
  notes: string[];
  suggestions: string[];
};

type EvalSummaryData = {
  total: number;
  passed: number;
  failed: number;
  successCases: number;
  refusalCases: number;
  runAt: string | Date;
  retrievalStrategy: string;
  modelProvider: string;
};

type IdeaStatus = "new" | "reviewed" | "planned" | "dismissed";

const IDEA_STATUS_STORAGE_KEY = "ai-tech-blog:agent-radar-idea-statuses";

const defaultEvalQuestions = [
  "What problem does IsoHC solve?",
  "What exact invariants does IsoHC preserve?",
  "帮我详细讲讲iso",
  "残差稳定性那篇讲了什么",
  "ISO 8601 是什么？",
  "How does Agent Harness differ from a normal chatbot?",
  "What is the role of an Evidence Packet in agentic RAG?",
  "How does AgentLoop turn ReAct into an observable runtime?",
  "帮我找 AgentLoop 那篇",
  "Build me a reading path for agent systems and evaluation.",
  "Can you explain EVQ-Cosh hidden details?",
  "What is the weather in Tokyo tomorrow?",
].join("\n");

export default function ManageAgent() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  const [debugQuery, setDebugQuery] = useState(
    "harness engine context boundary"
  );
  const [evalQuestions, setEvalQuestions] = useState(defaultEvalQuestions);
  const [conversationId, setConversationId] = useState("");
  const [ideaStatuses, setIdeaStatuses] = useState<Record<string, IdeaStatus>>(
    {}
  );

  useSeo(
    buildRouteMetadata(siteUrl, {
      title: t("agentOps.title"),
      description: t("agentOps.subtitle"),
      path: "/manage/agent",
      noindex: true,
    })
  );

  const routeContext = useMemo(
    () => ({ path: "/", routeType: "home" as const }),
    []
  );

  const indexStatus = trpc.agent.adminKnowledgeStatus.useQuery(undefined, {
    enabled: isAdmin,
    retry: false,
  });
  const qualitySummary = trpc.agent.adminQualitySummary.useQuery(
    { limit: 50 },
    { enabled: isAdmin, retry: false }
  );
  const debug = trpc.agent.adminDebugRetrieval.useQuery(
    { query: debugQuery, routeContext },
    { enabled: false, retry: false }
  );
  const evals = trpc.agent.adminRunEvals.useMutation();
  const runs = trpc.agent.adminListRuns.useQuery(
    { limit: 12 },
    { enabled: isAdmin, retry: false }
  );
  const questionRadar = trpc.agent.adminQuestionRadar.useQuery(
    { limit: 50 },
    { enabled: isAdmin, retry: false }
  );
  const contentRadar = trpc.engagement.contentRadar.summary.useQuery(
    undefined,
    { enabled: isAdmin, retry: false }
  );
  const ideas = trpc.agent.adminExtractArticleIdeas.useQuery(
    {
      conversationId: conversationId || "00000000-0000-4000-8000-000000000000",
    },
    { enabled: false, retry: false }
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(IDEA_STATUS_STORAGE_KEY);
      if (stored) setIdeaStatuses(JSON.parse(stored));
    } catch {
      setIdeaStatuses({});
    }
  }, []);

  const updateIdeaStatus = (ideaId: string, status: IdeaStatus) => {
    setIdeaStatuses(current => {
      const next = { ...current, [ideaId]: status };
      window.localStorage.setItem(
        IDEA_STATUS_STORAGE_KEY,
        JSON.stringify(next)
      );
      return next;
    });
  };

  if (authLoading) {
    return (
      <div className="space-page owner-dark-scope grid min-h-screen place-items-center px-4">
        <SpaceBackdrop subtle />
        <LoadingState
          title={t("common.loadingNotes")}
          description={t("common.loadingHint")}
          className="relative z-10 w-full max-w-md"
        />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <AuthRequiredState
        icon={<Bot className="h-4 w-4" />}
        title={t("agentOps.title")}
        description={t("agentOps.loginRequired")}
        loginLabel={t("manage.loginBtn")}
        homeLabel={t("nav.home")}
        backLabel={t("agentOps.back")}
      />
    );
  }

  const evalItems = evals.data?.items ?? [];

  return (
    <div className="space-page owner-dark-scope">
      <SpaceBackdrop subtle />
      <SiteHeader
        active="agent"
        backHref="/manage"
        backLabel={t("agentOps.back")}
        compact
      />

      <main className="agent-console-page container relative z-10 px-4 py-8 sm:px-6">
        <div className="agent-console-hero mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="signal-chip mb-5">
              <Bot className="h-4 w-4" />
              {t("agentOps.title")}
            </div>
            <h1 className="display-title text-4xl leading-tight text-white">
              {t("agentOps.title")}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {t("agentOps.subtitle")}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-sky-200/20 bg-slate-950/50 text-sky-100"
          >
            <Link href="/manage">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("agentOps.back")}
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="overview" className="agent-console-tabs">
          <TabsList className="agent-console-tab-list glass-dock w-full">
            <TabsTrigger value="overview">
              <ShieldCheck className="mr-2 h-4 w-4" />
              {t("agentOps.overview.tab")}
            </TabsTrigger>
            <TabsTrigger value="index">
              <Database className="mr-2 h-4 w-4" />
              {t("agentOps.index.title")}
            </TabsTrigger>
            <TabsTrigger value="debug">
              <FileSearch className="mr-2 h-4 w-4" />
              {t("agentOps.debug.title")}
            </TabsTrigger>
            <TabsTrigger value="evals">
              <Play className="mr-2 h-4 w-4" />
              {t("agentOps.evals.title")}
            </TabsTrigger>
            <TabsTrigger value="traces">
              <Route className="mr-2 h-4 w-4" />
              {t("agentOps.traces.title")}
            </TabsTrigger>
            <TabsTrigger value="ideas">
              <Lightbulb className="mr-2 h-4 w-4" />
              {t("agentOps.ideas.title")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="research-surface agent-console-panel">
            <AgentQualityOverview
              qualityLoading={qualitySummary.isLoading}
              qualityError={qualitySummary.isError}
              qualitySummary={qualitySummary.data}
              searchMissLoading={contentRadar.isLoading}
              searchMisses={contentRadar.data?.searchMisses}
            />
          </TabsContent>

          <TabsContent value="index" className="research-surface agent-console-panel">
            <AgentIndexStatusPanel
              loading={indexStatus.isLoading}
              error={indexStatus.isError}
              status={indexStatus.data}
            />
          </TabsContent>

          <TabsContent value="debug" className="research-surface agent-console-panel">
            <SectionHeader
              icon={<FileSearch className="h-4 w-4" />}
              title={t("agentOps.debug.title")}
            />
            <div className="mt-5 flex flex-col gap-3 lg:flex-row">
              <Input
                value={debugQuery}
                onChange={event => setDebugQuery(event.target.value)}
                placeholder={t("agentOps.debug.query")}
                className="border-sky-200/15 bg-slate-950/50 text-white"
              />
              <Button
                onClick={() => debug.refetch()}
                disabled={!debugQuery.trim() || debug.isFetching}
              >
                {debug.isFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSearch className="mr-2 h-4 w-4" />
                )}
                {t("agentOps.debug.run")}
              </Button>
            </div>
            <SourceList
              sources={debug.data?.sources ?? []}
              empty={t("agentOps.debug.empty")}
            />
            {debug.data?.diagnostics && (
              <DiagnosticsPanel diagnostics={debug.data.diagnostics} />
            )}
          </TabsContent>

          <TabsContent value="evals" className="research-surface agent-console-panel">
            <SectionHeader
              icon={<Play className="h-4 w-4" />}
              title={t("agentOps.evals.title")}
            />
            <Textarea
              value={evalQuestions}
              onChange={event => setEvalQuestions(event.target.value)}
              placeholder={t("agentOps.evals.questions")}
              className="mt-5 min-h-32 border-sky-200/15 bg-slate-950/50 text-white"
            />
            <Button
              className="mt-3"
              onClick={() =>
                evals.mutate({
                  routeContext,
                  questions: splitQuestions(evalQuestions),
                })
              }
              disabled={evals.isPending}
            >
              {evals.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {t("agentOps.evals.run")}
            </Button>
            {evals.data?.summary && (
              <EvalSummary summary={evals.data.summary} />
            )}
            <div className="mt-5 grid gap-2">
              {evalItems.map(item => (
                <div
                  key={item.question}
                  className="rounded-lg border border-sky-200/15 bg-slate-950/45 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">{item.question}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.category} ·{" "}
                        {getExpectedLabel(item.expectedBehavior, t)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={getEvalBadgeClass(item.passed)}
                    >
                      {getEvalStatusLabel(item.passed, t)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {t("agentOps.sourceCount", { count: item.sourceCount })} ·{" "}
                    {item.topSourceTitle || "-"}
                  </p>
                  {item.expectedSourceSlugs.length > 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                      {t("agentOps.evals.expectedSources")}:{" "}
                      {item.expectedSourceSlugs.join(", ")}
                    </p>
                  )}
                  {item.missingSourceSlugs.length > 0 && (
                    <p className="mt-1 text-xs text-amber-200">
                      {t("agentOps.evals.missingSources")}:{" "}
                      {item.missingSourceSlugs.join(", ")}
                    </p>
                  )}
                  {item.notes.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-400">
                      {item.notes.slice(0, 3).map(note => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="traces" className="research-surface agent-console-panel">
            <SectionHeader
              icon={<Route className="h-4 w-4" />}
              title={t("agentOps.traces.title")}
              action={
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-button"
                  onClick={() => runs.refetch()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t("agentOps.traces.refresh")}
                </Button>
              }
            />
            <div className="mt-5 grid gap-2">
              {(runs.data ?? []).length === 0 && (
                <EmptyState
                  icon={<Route className="h-4 w-4" />}
                  title={t("agentOps.traces.empty")}
                />
              )}
              {(runs.data ?? []).map(run => (
                <div
                  key={run.id}
                  className="grid gap-2 rounded-lg border border-sky-200/15 bg-slate-950/45 p-3 text-sm md:grid-cols-[1.4fr_.6fr_.6fr_.6fr]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-sky-100">
                      {run.id}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatScope(run.scopeType, run.scopeValue)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {run.retrievalStrategy || "supabase_keyword"}
                    </p>
                    {(run.retrievedChunkIds?.length ?? 0) > 0 && (
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                        {t("agentOps.traces.sources")}:{" "}
                        {run.retrievedChunkIds?.join(", ")}
                      </p>
                    )}
                  </div>
                  <Metric
                    label={t("agentOps.status")}
                    value={run.status ?? "-"}
                  />
                  <Metric
                    label={t("agentOps.latency")}
                    value={formatLatency(run.latencyMs)}
                  />
                  <Metric
                    label={t("agentOps.tokens")}
                    value={`${run.inputTokens ?? 0}/${run.outputTokens ?? 0}`}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ideas" className="research-surface agent-console-panel">
            <QuestionRadarPanel
              loading={questionRadar.isLoading}
              error={questionRadar.isError}
              radar={questionRadar.data}
              searchMisses={contentRadar.data?.searchMisses}
              searchMissLoading={contentRadar.isLoading}
              ideaStatuses={ideaStatuses}
              onIdeaStatus={updateIdeaStatus}
              onRefresh={() => questionRadar.refetch()}
            />
            <div className="mt-6 flex flex-col gap-3 border-t border-sky-200/10 pt-5 lg:flex-row">
              <Input
                value={conversationId}
                onChange={event => setConversationId(event.target.value)}
                placeholder={t("agentOps.ideas.conversation")}
                className="border-sky-200/15 bg-slate-950/50 font-mono text-white"
              />
              <Button
                onClick={() => ideas.refetch()}
                disabled={!conversationId.trim() || ideas.isFetching}
              >
                {ideas.isFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lightbulb className="mr-2 h-4 w-4" />
                )}
                {t("agentOps.ideas.run")}
              </Button>
            </div>
            <div className="mt-5 grid gap-3">
              {(ideas.data?.ideas ?? []).length === 0 && (
                <p className="text-sm text-slate-500">
                  {t("agentOps.ideas.empty")}
                </p>
              )}
              {(ideas.data?.ideas ?? []).map(idea => (
                <div
                  key={idea.proposedTitle}
                  className="rounded-lg border border-sky-200/15 bg-slate-950/45 p-4"
                >
                  <div className="mb-2 flex items-center gap-2 text-sky-200">
                    <ScrollText className="h-4 w-4" />
                    <h3 className="font-semibold text-white">
                      {idea.proposedTitle}
                    </h3>
                  </div>
                  <p className="text-sm leading-6 text-slate-400">
                    {idea.rationale}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {idea.seedQuestions.map(question => (
                      <Badge
                        key={question}
                        variant="outline"
                        className="border-sky-200/20 text-slate-300"
                      >
                        {question}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function QuestionRadarPanel({
  loading,
  error,
  radar,
  searchMisses,
  searchMissLoading,
  ideaStatuses,
  onIdeaStatus,
  onRefresh,
}: {
  loading: boolean;
  error: boolean;
  radar?: any;
  searchMisses?: {
    total: number;
    uniqueQueries: number;
    opportunities: Array<{
      query: string;
      count: number;
      firstSeenAt: string | Date;
      lastSeenAt: string | Date;
      suggestedPrompt: string;
    }>;
  };
  searchMissLoading?: boolean;
  ideaStatuses: Record<string, IdeaStatus>;
  onIdeaStatus: (ideaId: string, status: IdeaStatus) => void;
  onRefresh: () => void;
}) {
  const { t } = useLanguage();
  const questions = radar?.frequentQuestions ?? [];
  const ideas = radar?.suggestedIdeas ?? [];
  const noSourceRuns = radar?.noSourceRuns ?? [];
  const failedRuns = radar?.failedRuns ?? [];
  const searchMissOpportunities = searchMisses?.opportunities ?? [];

  if (loading) {
    return (
      <LoadingState
        title={t("agentOps.radar.loading")}
        description={t("common.loadingHint")}
      />
    );
  }

  if (error || !radar) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-4 w-4" />}
        title={t("agentOps.radar.error")}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {t("agentOps.radar.title")}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            {t("agentOps.radar.description")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("agentOps.traces.refresh")}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          label={t("agentOps.radar.totalRuns")}
          value={String(radar.summary.totalRuns)}
        />
        <MetricCard
          label={t("agentOps.radar.uniqueQuestions")}
          value={String(radar.summary.uniqueQuestions)}
        />
        <MetricCard
          label={t("agentOps.radar.noSourceRuns")}
          value={String(radar.summary.noSourceRuns)}
        />
        <MetricCard
          label={t("agentOps.radar.failedRuns")}
          value={String(radar.summary.failedRuns)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">
            {t("agentOps.radar.questions")}
          </h3>
          {questions.length === 0 ? (
            <EmptyState
              icon={<FileSearch className="h-4 w-4" />}
              title={t("agentOps.radar.empty")}
            />
          ) : (
            questions.map((item: any) => (
              <article
                key={item.question}
                className="rounded-lg border border-sky-200/15 bg-slate-950/45 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium leading-6 text-white">
                      {item.question}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatScope(item.scopeType, item.scopeValue)} ·{" "}
                      {t("agentOps.radar.supportCount", { count: item.count })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.signalTypes.map((signal: string) => (
                      <Badge
                        key={signal}
                        variant="outline"
                        className="border-cyan-200/20 text-cyan-100"
                      >
                        {getRadarSignalLabel(signal, t)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">
            {t("agentOps.radar.ideas")}
          </h3>
          {ideas.length === 0 ? (
            <EmptyState
              icon={<Lightbulb className="h-4 w-4" />}
              title={t("agentOps.radar.noIdeas")}
            />
          ) : (
            ideas.map((idea: any) => {
              const status = ideaStatuses[idea.ideaId] ?? idea.status ?? "new";
              return (
                <article
                  key={idea.ideaId}
                  className="rounded-lg border border-sky-200/15 bg-slate-950/45 p-4"
                >
                  <div className="mb-2 flex items-start gap-2">
                    <Lightbulb className="mt-1 h-4 w-4 shrink-0 text-sky-300" />
                    <div className="min-w-0">
                      <h4 className="font-semibold leading-6 text-white">
                        {idea.proposedTitle}
                      </h4>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {idea.rationale}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(
                      [
                        "new",
                        "reviewed",
                        "planned",
                        "dismissed",
                      ] as IdeaStatus[]
                    ).map(option => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={status === option}
                        onClick={() => onIdeaStatus(idea.ideaId, option)}
                        className={`h-8 rounded-md border px-2.5 text-xs font-medium transition ${getIdeaStatusClass(status === option)}`}
                      >
                        {getIdeaStatusLabel(option, t)}
                      </button>
                    ))}
                  </div>
                </article>
              );
            })
          )}

          <div className="rounded-lg border border-sky-200/15 bg-slate-950/35 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {t("agentOps.radar.searchMisses")}
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {t("agentOps.radar.searchMissesDescription")}
                </p>
              </div>
              {searchMisses && (
                <Badge
                  variant="outline"
                  className="shrink-0 border-sky-200/20 text-sky-200"
                >
                  {t("agentOps.radar.searchMissUnique", {
                    count: searchMisses.uniqueQueries,
                  })}
                </Badge>
              )}
            </div>
            {searchMissLoading ? (
              <p className="text-sm text-slate-500">
                {t("agentOps.radar.loading")}
              </p>
            ) : searchMissOpportunities.length === 0 ? (
              <p className="text-sm text-slate-500">
                {t("agentOps.radar.searchMissEmpty")}
              </p>
            ) : (
              <div className="grid gap-2">
                {searchMissOpportunities.map(item => (
                  <article
                    key={item.query}
                    className="rounded-md border border-sky-200/10 bg-black/20 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium leading-5 text-white">
                        {item.query}
                      </p>
                      <span className="shrink-0 text-xs text-cyan-200">
                        {t("agentOps.radar.searchMissCount", {
                          count: item.count,
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {item.suggestedPrompt}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {(noSourceRuns.length > 0 || failedRuns.length > 0) && (
        <div className="rounded-lg border border-amber-300/20 bg-amber-950/15 p-4">
          <h3 className="text-sm font-semibold text-amber-100">
            {t("agentOps.radar.failureSignals")}
          </h3>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {[...noSourceRuns, ...failedRuns].slice(0, 6).map((run: any) => (
              <p
                key={run.runId}
                className="rounded-md bg-slate-950/45 p-2 text-xs leading-5 text-slate-400"
              >
                {run.question || run.runId} ·{" "}
                {formatScope(run.scopeType, run.scopeValue)}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DiagnosticsPanel({
  diagnostics,
}: {
  diagnostics: RetrievalDiagnostics;
}) {
  const { t } = useLanguage();
  const tone =
    diagnostics.status === "ready"
      ? "border-cyan-300/20 bg-cyan-950/15"
      : "border-amber-300/20 bg-amber-950/15";

  return (
    <div className={`mt-4 rounded-lg border p-4 ${tone}`}>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
        {diagnostics.status === "ready" ? (
          <ShieldCheck className="h-4 w-4 text-cyan-200" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-200" />
        )}
        {t("agentOps.debug.diagnostics")}
      </div>
      <p className="text-xs leading-5 text-slate-400">
        {t("agentOps.debug.terms")}: {diagnostics.terms.join(", ") || "-"}
      </p>
      {diagnostics.expandedTerms &&
        diagnostics.expandedTerms.length > diagnostics.terms.length && (
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {t("agentOps.debug.expandedTerms")}:{" "}
            {diagnostics.expandedTerms.join(", ")}
          </p>
        )}
      {diagnostics.currentPageContextInjected && (
        <p className="mt-1 text-xs leading-5 text-cyan-200">
          {t("agentOps.debug.currentPageContext")}
        </p>
      )}
      {diagnostics.failureReason && (
        <p className="mt-1 text-xs leading-5 text-amber-200">
          {t("agentOps.debug.failureReason")}: {diagnostics.failureReason}
        </p>
      )}
      {diagnostics.missingTerms.length > 0 && (
        <p className="mt-1 text-xs leading-5 text-amber-200">
          {t("agentOps.debug.missingTerms")}:{" "}
          {diagnostics.missingTerms.join(", ")}
        </p>
      )}
      <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-400">
        {[...diagnostics.notes, ...diagnostics.suggestions].map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function EvalSummary({ summary }: { summary: EvalSummaryData }) {
  const { t } = useLanguage();

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-4">
      <MetricCard
        label={t("agentOps.evals.passed")}
        value={`${summary.passed}/${summary.total}`}
      />
      <MetricCard
        label={t("agentOps.evals.failed")}
        value={String(summary.failed)}
      />
      <MetricCard
        label={t("agentOps.evals.refusals")}
        value={String(summary.refusalCases)}
      />
      <MetricCard
        label={summary.retrievalStrategy}
        value={formatDateTime(summary.runAt)}
      />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return <MetricTile value={value} label={label} />;
}

function SourceList({
  sources,
  empty,
}: {
  sources: AgentSourceListItem[];
  empty: string;
}) {
  const { t } = useLanguage();
  if (sources.length === 0)
    return (
      <EmptyState
        icon={<FileSearch className="h-4 w-4" />}
        title={empty}
        className="mt-5"
      />
    );

  return (
    <div className="mt-5 grid gap-3 md:grid-cols-2">
      {sources.map(source => (
        <a
          key={source.sourceId}
          href={getSourceHref(source.postSlug)}
          className="rounded-lg border border-sky-200/15 bg-slate-950/45 p-4 transition hover:border-sky-300/40 hover:bg-sky-400/10"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="line-clamp-1 font-semibold text-white">
              {source.postTitle}
            </h3>
            <Badge variant="outline" className="border-sky-200/20 text-sky-200">
              {t("agentOps.sources")}
            </Badge>
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-slate-400">
            {source.excerpt}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {source.relevanceReason}
          </p>
        </a>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.72rem] font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-slate-200">{value}</p>
    </div>
  );
}

function splitQuestions(value: string) {
  return value
    .split("\n")
    .map(item => item.trim())
    .filter(Boolean);
}

function getEvalBadgeClass(passed: boolean) {
  return passed
    ? "border-cyan-300/30 text-cyan-200"
    : "border-amber-300/30 text-amber-200";
}

function getEvalStatusLabel(passed: boolean, t: (key: string) => string) {
  return passed ? t("agentOps.evals.passed") : t("agentOps.evals.failed");
}

function getExpectedLabel(
  expected: "sources" | "refusal",
  t: (key: string) => string
) {
  return expected === "refusal"
    ? t("agentOps.evals.expectedRefusal")
    : t("agentOps.evals.expectedSourceAnswer");
}

function getRadarSignalLabel(signal: string, t: (key: string) => string) {
  if (signal === "no_source") return t("agentOps.radar.signalNoSource");
  if (signal === "failed") return t("agentOps.radar.signalFailed");
  return t("agentOps.radar.signalFrequent");
}

function getIdeaStatusLabel(status: IdeaStatus, t: (key: string) => string) {
  if (status === "reviewed") return t("agentOps.radar.statusReviewed");
  if (status === "planned") return t("agentOps.radar.statusPlanned");
  if (status === "dismissed") return t("agentOps.radar.statusDismissed");
  return t("agentOps.radar.statusNew");
}

function getIdeaStatusClass(active: boolean) {
  return active
    ? "border-sky-300/50 bg-sky-400/15 text-sky-100"
    : "border-sky-200/10 bg-slate-950/35 text-slate-400 hover:border-sky-300/35 hover:text-white";
}

function formatScope(scopeType?: string | null, scopeValue?: string | null) {
  const type = scopeType || "-";
  return scopeValue ? `${type}:${scopeValue}` : type;
}

function formatLatency(latencyMs?: number | null) {
  return typeof latencyMs === "number" ? `${latencyMs}ms` : "-";
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getSourceHref(postSlug: string) {
  return postSlug ? `/post/${postSlug}` : "#";
}
