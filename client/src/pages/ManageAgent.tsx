import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Bot, FileSearch, Lightbulb, Loader2, Play, RefreshCw, Route, ScrollText } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { SiteHeader, SpaceBackdrop } from "@/components/ResearchShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildRouteMetadata } from "@shared/metadata";

type AgentSourceListItem = {
  sourceId: string;
  postTitle: string;
  postSlug: string;
  excerpt: string;
  relevanceReason: string;
};

const defaultEvalQuestions = [
  "What is a harness engine?",
  "How should context engines preserve source boundaries?",
  "What failure modes matter for tool-using agents?",
].join("\n");

export default function ManageAgent() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  const [debugQuery, setDebugQuery] = useState("harness engine context boundary");
  const [evalQuestions, setEvalQuestions] = useState(defaultEvalQuestions);
  const [conversationId, setConversationId] = useState("");

  useSeo(
    buildRouteMetadata(siteUrl, {
      title: t("agentOps.title"),
      description: t("agentOps.subtitle"),
      path: "/manage/agent",
      noindex: true,
    })
  );

  const routeContext = useMemo(
    () => ({ path: "/applications", routeType: "track" as const, trackSlug: "ai-applications" as const }),
    []
  );

  const debug = trpc.agent.adminDebugRetrieval.useQuery(
    { query: debugQuery, routeContext },
    { enabled: false, retry: false }
  );
  const evals = trpc.agent.adminRunEvals.useMutation();
  const runs = trpc.agent.adminListRuns.useQuery({ limit: 12 }, { enabled: isAdmin, retry: false });
  const ideas = trpc.agent.adminExtractArticleIdeas.useQuery(
    { conversationId: conversationId || "00000000-0000-4000-8000-000000000000" },
    { enabled: false, retry: false }
  );

  if (authLoading) {
    return (
      <div className="space-page grid place-items-center">
        <SpaceBackdrop subtle />
        <Loader2 className="relative z-10 h-8 w-8 animate-spin text-sky-300" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-page grid place-items-center">
        <SpaceBackdrop subtle />
        <div className="glass-panel relative z-10 max-w-md p-8 text-center">
          <Bot className="mx-auto mb-4 h-8 w-8 text-sky-300" />
          <h1 className="text-2xl font-semibold text-white">{t("agentOps.title")}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">{t("agentOps.loginRequired")}</p>
          <Button asChild className="mt-5 bg-blue-500 text-white hover:bg-blue-400">
            <Link href="/login">{t("manage.loginBtn")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const evalItems = evals.data?.items ?? [];

  return (
    <div className="space-page">
      <SpaceBackdrop subtle />
      <SiteHeader active="write" backHref="/manage" backLabel={t("agentOps.back")} compact />

      <main className="container relative z-10 px-4 py-8 sm:px-6">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="signal-chip mb-5">
              <Bot className="h-4 w-4" />
              {t("agentOps.title")}
            </div>
            <h1 className="font-serif text-4xl font-semibold text-white">{t("agentOps.title")}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">{t("agentOps.subtitle")}</p>
          </div>
          <Button asChild variant="outline" className="border-sky-200/20 bg-slate-950/50 text-sky-100">
            <Link href="/manage">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("agentOps.back")}
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="debug" className="space-y-5">
          <TabsList className="grid w-full grid-cols-4 border border-sky-200/15 bg-slate-950/60 lg:w-[720px]">
            <TabsTrigger value="debug"><FileSearch className="mr-2 h-4 w-4" />{t("agentOps.debug.title")}</TabsTrigger>
            <TabsTrigger value="evals"><Play className="mr-2 h-4 w-4" />{t("agentOps.evals.title")}</TabsTrigger>
            <TabsTrigger value="traces"><Route className="mr-2 h-4 w-4" />{t("agentOps.traces.title")}</TabsTrigger>
            <TabsTrigger value="ideas"><Lightbulb className="mr-2 h-4 w-4" />{t("agentOps.ideas.title")}</TabsTrigger>
          </TabsList>

          <TabsContent value="debug" className="glass-panel p-5">
            <div className="flex flex-col gap-3 lg:flex-row">
              <Input
                value={debugQuery}
                onChange={(event) => setDebugQuery(event.target.value)}
                placeholder={t("agentOps.debug.query")}
                className="border-sky-200/15 bg-slate-950/50 text-white"
              />
            <Button onClick={() => debug.refetch()} disabled={!debugQuery.trim() || debug.isFetching}>
                {debug.isFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSearch className="mr-2 h-4 w-4" />
                )}
                {t("agentOps.debug.run")}
              </Button>
            </div>
            <SourceList sources={debug.data?.sources ?? []} empty={t("agentOps.debug.empty")} />
          </TabsContent>

          <TabsContent value="evals" className="glass-panel p-5">
            <Textarea
              value={evalQuestions}
              onChange={(event) => setEvalQuestions(event.target.value)}
              placeholder={t("agentOps.evals.questions")}
              className="min-h-32 border-sky-200/15 bg-slate-950/50 text-white"
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
              {evals.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              {t("agentOps.evals.run")}
            </Button>
            <div className="mt-5 grid gap-2">
              {evalItems.map((item) => (
                <div key={item.question} className="rounded-lg border border-sky-200/15 bg-slate-950/45 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white">{item.question}</p>
                    <Badge variant="outline" className={getEvalBadgeClass(item.passed)}>
                      {getEvalStatusLabel(item.passed, t)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{t("agentOps.sourceCount", { count: item.sourceCount })} · {item.topSourceTitle || "-"}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="traces" className="glass-panel p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">{t("agentOps.traces.title")}</h2>
              <Button variant="outline" size="sm" onClick={() => runs.refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("agentOps.traces.refresh")}
              </Button>
            </div>
            <div className="grid gap-2">
              {(runs.data ?? []).length === 0 && <p className="text-sm text-slate-500">{t("agentOps.traces.empty")}</p>}
              {(runs.data ?? []).map((run) => (
                <div key={run.id} className="grid gap-2 rounded-lg border border-sky-200/15 bg-slate-950/45 p-3 text-sm md:grid-cols-[1.4fr_.6fr_.6fr_.6fr]">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-sky-100">{run.id}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatScope(run.scopeType, run.scopeValue)}</p>
                  </div>
                  <Metric label={t("agentOps.status")} value={run.status ?? "-"} />
                  <Metric label={t("agentOps.latency")} value={formatLatency(run.latencyMs)} />
                  <Metric label={t("agentOps.tokens")} value={`${run.inputTokens ?? 0}/${run.outputTokens ?? 0}`} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ideas" className="glass-panel p-5">
            <div className="flex flex-col gap-3 lg:flex-row">
              <Input
                value={conversationId}
                onChange={(event) => setConversationId(event.target.value)}
                placeholder={t("agentOps.ideas.conversation")}
                className="border-sky-200/15 bg-slate-950/50 font-mono text-white"
              />
              <Button onClick={() => ideas.refetch()} disabled={!conversationId.trim() || ideas.isFetching}>
                {ideas.isFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lightbulb className="mr-2 h-4 w-4" />
                )}
                {t("agentOps.ideas.run")}
              </Button>
            </div>
            <div className="mt-5 grid gap-3">
              {(ideas.data?.ideas ?? []).length === 0 && <p className="text-sm text-slate-500">{t("agentOps.ideas.empty")}</p>}
              {(ideas.data?.ideas ?? []).map((idea) => (
                <div key={idea.proposedTitle} className="rounded-lg border border-sky-200/15 bg-slate-950/45 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sky-200">
                    <ScrollText className="h-4 w-4" />
                    <h3 className="font-semibold text-white">{idea.proposedTitle}</h3>
                  </div>
                  <p className="text-sm leading-6 text-slate-400">{idea.rationale}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {idea.seedQuestions.map((question) => (
                      <Badge key={question} variant="outline" className="border-sky-200/20 text-slate-300">
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

function SourceList({ sources, empty }: { sources: AgentSourceListItem[]; empty: string }) {
  const { t } = useLanguage();
  if (sources.length === 0) return <p className="mt-5 text-sm text-slate-500">{empty}</p>;

  return (
    <div className="mt-5 grid gap-3 md:grid-cols-2">
      {sources.map((source) => (
        <a key={source.sourceId} href={getSourceHref(source.postSlug)} className="rounded-lg border border-sky-200/15 bg-slate-950/45 p-4 transition hover:border-sky-300/40 hover:bg-sky-400/10">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="line-clamp-1 font-semibold text-white">{source.postTitle}</h3>
            <Badge variant="outline" className="border-sky-200/20 text-sky-200">{t("agentOps.sources")}</Badge>
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-slate-400">{source.excerpt}</p>
          <p className="mt-2 text-xs text-slate-500">{source.relevanceReason}</p>
        </a>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-slate-200">{value}</p>
    </div>
  );
}

function splitQuestions(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getEvalBadgeClass(passed: boolean) {
  return passed ? "border-cyan-300/30 text-cyan-200" : "border-amber-300/30 text-amber-200";
}

function getEvalStatusLabel(passed: boolean, t: (key: string) => string) {
  return passed ? t("agentOps.evals.passed") : t("agentOps.evals.failed");
}

function formatScope(scopeType?: string | null, scopeValue?: string | null) {
  const type = scopeType || "-";
  return scopeValue ? `${type}:${scopeValue}` : type;
}

function formatLatency(latencyMs?: number | null) {
  return typeof latencyMs === "number" ? `${latencyMs}ms` : "-";
}

function getSourceHref(postSlug: string) {
  return postSlug ? `/post/${postSlug}` : "#";
}
