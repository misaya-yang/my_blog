import {
  EmptyState,
  LoadingState,
  SectionHeader,
  SiteHeader,
  SpaceBackdrop,
  Surface,
} from "@/components/ResearchShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { buildRouteMetadata } from "@shared/metadata";
import {
  getRecoveryTopics,
  openSearchRecoveryAgent,
  type RecoveryTopic,
} from "./searchRecovery";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Folder,
  GitBranch,
  Map,
  Search as SearchIcon,
  Tags,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";

function formatDate(value: string | Date | null, locale: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return <>{text}</>;
  const index = text.toLowerCase().indexOf(normalized);
  if (index === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-slate-100/12 px-1 text-slate-100">
        {text.slice(index, index + normalized.length)}
      </mark>
      {text.slice(index + normalized.length)}
    </>
  );
}

export default function Search() {
  const { language, t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  const locale = language === "zh" ? "zh-CN" : "en-US";
  const [, navigate] = useLocation();
  const search = useSearch();
  const query = useMemo(
    () => new URLSearchParams(search).get("q")?.trim() ?? "",
    [search]
  );
  const [input, setInput] = useState(query);
  const {
    data,
    isLoading,
    isError,
    error: searchError,
    refetch,
  } = trpc.discovery.search.useQuery({
    query,
    limit: 20,
    offset: 0,
  });
  const suggestedTopics = useMemo(() => getRecoveryTopics(query), [query]);
  useSeo(
    buildRouteMetadata(siteUrl, {
      title: query
        ? t("discovery.resultsFor", { query, count: data?.total ?? 0 })
        : t("discovery.searchTitle"),
      description: t("discovery.searchSubtitle"),
      path: query ? `/search?q=${encodeURIComponent(query)}` : "/search",
      locale,
    })
  );

  useEffect(() => {
    setInput(query);
  }, [query]);

  useEffect(() => {
    if (!isLoading && !isError && query && data?.total === 0) {
      trackAnalyticsEvent("search_zero_results", { query });
    }
  }, [data?.total, isError, isLoading, query]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next = input.trim();
    navigate(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  };

  const askAgent = () => {
    if (!query) return;
    openSearchRecoveryAgent(query, language);
  };

  return (
    <div className="space-page">
      <SpaceBackdrop subtle />
      <SiteHeader active="search" />

      <main className="container relative z-10 px-4 py-10 sm:px-6 md:py-14">
        <section className="page-hero">
          <div className="signal-chip mb-6">
            <SearchIcon className="h-4 w-4" />
            {t("discovery.searchKicker")}
          </div>
          <h1 className="page-title">{t("discovery.searchTitle")}</h1>
          <p className="page-copy mt-5">{t("discovery.searchSubtitle")}</p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="home-search-dock mt-9 max-w-4xl"
        >
          <div className="home-search-dock-title">
            <SearchIcon className="h-5 w-5" />
            <span>{t("discovery.searchButton")}</span>
          </div>
          <label className="sr-only" htmlFor="search-page-query">
            {t("discovery.searchPlaceholder")}
          </label>
          <div className="home-search-field md:col-span-2">
            <Input
              id="search-page-query"
              type="search"
              autoComplete="search"
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder={t("discovery.searchPlaceholder")}
              className="h-11 border-0 bg-transparent px-0 text-base text-white shadow-none placeholder:text-slate-500 focus-visible:ring-0"
            />
            <Button
              type="submit"
              size="icon"
              className="home-search-submit"
              aria-label={t("discovery.searchButton")}
            >
              <SearchIcon className="h-5 w-5" />
            </Button>
          </div>
        </form>

        <Surface className="mt-8">
          <SectionHeader
            title={
              isLoading && query
                ? t("discovery.searchingFor", { query })
                : query
                ? t("discovery.resultsFor", { query, count: data?.total ?? 0 })
                : t("discovery.latestPublic")
            }
            action={
              <Link href="/archive" className="nav-ink">
                {t("nav.archive")}
              </Link>
            }
          />

          {isLoading ? (
            <LoadingState
              title={t("common.loadingNotes")}
              description={t("common.loadingHint")}
              className="mt-5"
            />
          ) : isError ? (
            <EmptyState
              icon={<SearchIcon className="h-4 w-4" />}
              title={t("discovery.searchFailed")}
              description={
                searchError?.message || t("discovery.searchFailedHint")
              }
              className="mt-5"
              action={
                <Button
                  type="button"
                  variant="outline"
                  className="glass-button"
                  onClick={() => void refetch()}
                >
                  {t("common.retry")}
                </Button>
              }
            />
          ) : data?.results?.length ? (
            <div className="mt-5 divide-y divide-sky-200/10">
              {data.results.map((post: any) => (
                <article key={post.id} className="py-5">
                  <Link
                    href={`/post/${post.slug}`}
                    className="text-xl font-semibold leading-8 text-white hover:text-slate-200"
                  >
                    {post.title}
                  </Link>
                  <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-300">
                    <HighlightedText
                      text={
                        post.matchExcerpt ||
                        post.excerpt ||
                        post.content?.slice(0, 220) ||
                        ""
                      }
                      query={query}
                    />
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(post.publishedAt, locale)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      {post.readingMinutes} {t("home.minRead")}
                    </span>
                    {post.category && (
                      <Link
                        href={`/categories/${post.category.slug}`}
                        className="inline-flex items-center gap-1.5 hover:text-slate-200"
                      >
                        <Folder className="h-3.5 w-3.5" />
                        {post.category.name}
                      </Link>
                    )}
                    {post.tags?.slice(0, 4).map((tag: any) => (
                      <Link
                        key={tag.slug}
                        href={`/tags/${tag.slug}`}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 hover:border-slate-500 hover:text-slate-200"
                      >
                        <Tags className="h-3 w-3" />
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : query ? (
            <SearchRecoveryPanel
              query={query}
              topics={suggestedTopics}
              onAskAgent={askAgent}
            />
          ) : (
            <EmptyState
              icon={<SearchIcon className="h-4 w-4" />}
              title={t("discovery.searchEmpty")}
              className="mt-5"
            />
          )}
        </Surface>
      </main>
    </div>
  );
}

function SearchRecoveryPanel({
  query,
  topics,
  onAskAgent,
}: {
  query: string;
  topics: RecoveryTopic[];
  onAskAgent: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="search-recovery">
      <div className="search-recovery-primary">
        <div className="max-w-2xl">
          <h3>{t("discovery.recoveryTitle")}</h3>
          <p>{t("discovery.recoveryBody", { query })}</p>
          <p className="search-recovery-scope">
            {t("discovery.recoveryAssistantScope")}
          </p>
        </div>
        <div className="search-recovery-actions">
          <Button
            type="button"
            onClick={onAskAgent}
            className="search-recovery-agent-button"
          >
            <BookOpen className="h-4 w-4" />
            {t("discovery.recoveryAskAgent")}
          </Button>
          <Link href="/search" className="search-recovery-clear">
            <X className="h-4 w-4" />
            {t("discovery.clearSearch")}
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">
            {t("discovery.recoveryTopics")}
          </h3>
          <div className="search-topic-grid">
            {topics.map(topic => (
              <Link
                key={topic.query}
                href={topic.href}
                className="search-topic-chip"
                aria-label={t("discovery.recoveryTopicQuery", {
                  query: topic.query,
                })}
              >
                <GitBranch className="h-4 w-4 text-slate-400" />
                <span>{t(topic.labelKey)}</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>

        <aside className="search-recovery-paths">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Map className="h-4 w-4 text-slate-400" />
            {t("discovery.recoveryPaths")}
          </h3>
          <div className="mt-3 grid gap-2">
            <Link href="/applications" className="article-tag">
              {t("home.applicationsLabel")}
            </Link>
            <Link href="/algorithms" className="article-tag">
              {t("home.algorithmsLabel")}
            </Link>
            <Link href="/archive" className="article-tag">
              {t("nav.archive")}
            </Link>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            {t("discovery.recoverySignal")}
          </p>
        </aside>
      </div>
    </div>
  );
}
