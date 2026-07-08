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
import { getSearchHighlightNeedles } from "@shared/search-aliases";
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

export type HighlightedTextPart = {
  text: string;
  highlighted: boolean;
};

export function getHighlightedTextParts(
  text: string,
  query: string
): HighlightedTextPart[] {
  const needles = getSearchHighlightNeedles(query);
  if (needles.length === 0) return [{ text, highlighted: false }];

  const lowerText = text.toLowerCase();
  const parts: HighlightedTextPart[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const match = findNextHighlightMatch(lowerText, needles, cursor);
    if (!match) {
      parts.push({ text: text.slice(cursor), highlighted: false });
      break;
    }

    if (match.index > cursor) {
      parts.push({ text: text.slice(cursor, match.index), highlighted: false });
    }

    parts.push({
      text: text.slice(match.index, match.index + match.needle.length),
      highlighted: true,
    });
    cursor = match.index + match.needle.length;
  }

  return parts.filter(part => part.text.length > 0);
}

function findNextHighlightMatch(
  lowerText: string,
  needles: string[],
  startIndex: number
) {
  let nextMatch: { index: number; needle: string } | null = null;

  for (const needle of needles) {
    const index = lowerText.indexOf(needle, startIndex);
    if (index === -1) continue;
    if (
      !nextMatch ||
      index < nextMatch.index ||
      (index === nextMatch.index && needle.length > nextMatch.needle.length)
    ) {
      nextMatch = { index, needle };
    }
  }

  return nextMatch;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  return (
    <>
      {getHighlightedTextParts(text, query).map((part, index) =>
        part.highlighted ? (
          <mark key={`${part.text}-${index}`} className="search-highlight">
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        )
      )}
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
  const [showSlowSearchRecovery, setShowSlowSearchRecovery] = useState(false);
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
    if (!query || !isLoading) {
      setShowSlowSearchRecovery(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowSlowSearchRecovery(true);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [isLoading, query]);

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
    <div
      className={
        query
          ? "space-page search-page search-page-has-query"
          : "space-page search-page"
      }
    >
      <SpaceBackdrop subtle />
      <SiteHeader active="search" />

      <main className="container relative z-10 px-4 py-10 sm:px-6 md:py-14">
        <section className={query ? "page-hero search-query-hero" : "page-hero"}>
          <div className={query ? "signal-chip mb-3" : "signal-chip mb-6"}>
            <SearchIcon className="h-4 w-4" />
            {t("discovery.searchKicker")}
          </div>
          <h1 className="page-title">{t("discovery.searchTitle")}</h1>
          <p className={query ? "page-copy mt-2" : "page-copy mt-5"}>
            {t("discovery.searchSubtitle")}
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className={
            query
              ? "home-search-dock search-query-dock glass-dock mt-4 max-w-3xl"
              : "home-search-dock glass-dock mt-9 max-w-4xl"
          }
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
              className="search-query-input h-11 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
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

        <Surface
          className={query ? "mt-4 hairline-list" : "mt-8 hairline-list"}
          density={query ? "compact" : "normal"}
        >
          <SectionHeader
            title={
              isLoading && query
                ? t("discovery.searchingFor", { query })
                : query
                  ? t("discovery.resultsFor", {
                      query,
                      count: data?.total ?? 0,
                    })
                  : t("discovery.latestPublic")
            }
            action={
              <Link href="/archive" className="nav-ink">
                {t("nav.archive")}
              </Link>
            }
          />

          {!query && !isError && <SearchStartPanel topics={suggestedTopics} />}

          {isLoading ? (
            query && showSlowSearchRecovery ? (
              <SearchRecoveryPanel
                query={query}
                topics={suggestedTopics}
                onAskAgent={askAgent}
              />
            ) : (
              <LoadingState
                title={t("common.loadingNotes")}
                description={t("common.loadingHint")}
                className="mt-5"
              />
            )
          ) : isError ? (
            query ? (
              <div>
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
                <SearchRecoveryPanel
                  query={query}
                  topics={suggestedTopics}
                  onAskAgent={askAgent}
                />
              </div>
            ) : (
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
            )
          ) : data?.results?.length ? (
            <div className="mt-5 divide-y divide-sky-200/10">
              {data.results.map((post: any) => (
                <article key={post.id} className="search-result-row py-5">
                  <Link
                    href={`/post/${post.slug}`}
                    className="search-result-title text-xl font-semibold leading-8"
                  >
                    {post.title}
                  </Link>
                  <p className="search-result-excerpt mt-2 max-w-4xl text-sm leading-7">
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
                  <div className="search-result-meta mt-3 flex flex-wrap items-center gap-2 text-xs">
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
                        className="article-tag gap-1.5"
                      >
                        <Folder className="h-3.5 w-3.5" />
                        {post.category.name}
                      </Link>
                    )}
                    {post.tags?.slice(0, 4).map((tag: any) => (
                      <Link
                        key={tag.slug}
                        href={`/tags/${tag.slug}`}
                        className="article-tag gap-1"
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

function SearchStartPanel({ topics }: { topics: RecoveryTopic[] }) {
  const { t } = useLanguage();

  return (
    <div className="search-start-panel mt-5">
      <div className="search-start-copy">
        <h3>{t("discovery.searchStartTitle")}</h3>
        <p>{t("discovery.searchStartBody")}</p>
      </div>

      <div className="search-start-block">
        <span className="search-start-label">
          {t("discovery.searchStartTopics")}
        </span>
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
              <GitBranch className="search-topic-icon h-4 w-4" />
              <span>{t(topic.labelKey)}</span>
              <ArrowRight className="search-topic-icon h-4 w-4" />
            </Link>
          ))}
        </div>
      </div>

      <div className="search-start-block">
        <span className="search-start-label">
          {t("discovery.searchStartPaths")}
        </span>
        <div className="search-start-paths">
          <Link href="/applications" className="search-start-link">
            <Map className="h-4 w-4" />
            <span>{t("home.applicationsLabel")}</span>
          </Link>
          <Link href="/algorithms" className="search-start-link">
            <Map className="h-4 w-4" />
            <span>{t("home.algorithmsLabel")}</span>
          </Link>
          <Link href="/archive" className="search-start-link">
            <Calendar className="h-4 w-4" />
            <span>{t("nav.archive")}</span>
          </Link>
        </div>
      </div>
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
          <h3 className="search-recovery-heading mb-3 text-sm font-semibold">
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
                <GitBranch className="search-topic-icon h-4 w-4" />
                <span>{t(topic.labelKey)}</span>
                <ArrowRight className="search-topic-icon h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>

        <aside className="search-recovery-paths">
          <h3 className="search-recovery-heading flex items-center gap-2 text-sm font-semibold">
            <Map className="search-topic-icon h-4 w-4" />
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
