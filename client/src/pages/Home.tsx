import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArticleCard,
  type ArticleCardPost,
  type ArticleTrack,
} from "@/components/ArticleCard";
import { SiteHeader, SpaceBackdrop } from "@/components/ResearchShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPublicTrackSeries,
  trackConfigs,
  type TrackKind,
  type TrackSeriesConfig,
} from "@/lib/tracks";
import { trpc } from "@/lib/trpc";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildHomeJsonLd, buildRouteMetadata } from "@shared/metadata";
import { getContentSeriesBySlug } from "@shared/content-series";
import {
  ArrowRight,
  FileText,
  GitBranch,
  Route,
  Search,
  Settings2,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { FormEvent, useEffect, useMemo, useState } from "react";

const portalTracks: TrackKind[] = ["algorithms", "applications"];

type TrackPanelModel = {
  track: TrackKind;
  href: string;
  label: string;
  title: string;
  subtitle: string;
  meta: string;
  topicKeys: string[];
  pathTitle: string;
  pathSummary: string;
  actionLabel: string;
  posts: ArticleCardPost[];
};

type PublicSeriesByTrack = Record<TrackKind, TrackSeriesConfig[]>;

export type HomeResearchMapSummary = {
  trackCount: number;
  publicNoteCount: number;
  readingPathCount: number;
};

function getArticleTrack(post: ArticleCardPost): ArticleTrack {
  return post.category?.slug === "ai-applications"
    ? "applications"
    : "algorithms";
}

function countTrackPosts(posts: ArticleCardPost[], track: TrackKind) {
  const categorySlug = trackConfigs[track].categorySlug;
  return posts.filter(post => post.category?.slug === categorySlug).length;
}

function renderHeroTitle(language: "en" | "zh") {
  if (language === "zh") {
    return (
      <>
        <span className="home-title-line">
          AI 算法与 <span className="home-title-accent">AI</span> 应用
        </span>
      </>
    );
  }

  return (
    <>
      <span className="home-title-line">AI Algorithms</span>
      <span className="home-title-line">
        <span className="home-title-accent">AI</span> Applications
      </span>
    </>
  );
}

export function getPostPublishedTime(post: ArticleCardPost) {
  if (!post.publishedAt) return 0;
  const time = new Date(post.publishedAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function sortPostsNewestFirst(posts: ArticleCardPost[]) {
  return [...posts].sort((a, b) => {
    const timeDiff = getPostPublishedTime(b) - getPostPublishedTime(a);
    if (timeDiff !== 0) return timeDiff;
    return String(a.title ?? a.slug).localeCompare(String(b.title ?? b.slug));
  });
}

function getLatestSeriesPostTime(
  series: TrackSeriesConfig,
  postsBySlug: Map<string, ArticleCardPost>
) {
  return Math.max(
    0,
    ...series.postSlugs.map(slug => {
      const post = postsBySlug.get(slug);
      return post ? getPostPublishedTime(post) : 0;
    })
  );
}

export function getPrimarySeries(
  publicSeries: TrackSeriesConfig[],
  posts: ArticleCardPost[]
) {
  const postsBySlug = new Map(posts.map(post => [post.slug, post]));
  const sortedSeries = [...publicSeries].sort((a, b) => {
    const timeDiff =
      getLatestSeriesPostTime(b, postsBySlug) -
      getLatestSeriesPostTime(a, postsBySlug);
    if (timeDiff !== 0) return timeDiff;
    return a.slug.localeCompare(b.slug);
  });

  return sortedSeries[0] ?? null;
}

export function getRepresentativePosts(
  posts: ArticleCardPost[],
  track: TrackKind
) {
  const config = trackConfigs[track];
  const trackPosts = posts.filter(
    post => post.category?.slug === config.categorySlug
  );

  return sortPostsNewestFirst(trackPosts).slice(0, 2);
}

export function getTrackTopicKeys(track: TrackKind, limit = 3) {
  return trackConfigs[track].focusKeys.slice(0, limit);
}

export function getHomeResearchMapSummary(
  posts: ArticleCardPost[],
  publicSeriesByTrack: PublicSeriesByTrack
): HomeResearchMapSummary {
  return {
    trackCount: portalTracks.length,
    publicNoteCount: portalTracks.reduce(
      (total, track) => total + countTrackPosts(posts, track),
      0
    ),
    readingPathCount: portalTracks.reduce(
      (total, track) => total + publicSeriesByTrack[track].length,
      0
    ),
  };
}

function getPanelPathSummary(
  track: TrackKind,
  primarySeries: TrackSeriesConfig | null,
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  if (primarySeries) return t(primarySeries.promiseKey);
  if (track === "applications") return t("home.applicationsPathSummary");
  return t("home.algorithmsPathSummary");
}

function getPostSeriesLabel(
  post: ArticleCardPost,
  fallback: string,
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  const series = post.seriesSlug
    ? getContentSeriesBySlug(post.seriesSlug)
    : null;
  return series ? t(series.titleKey) : post.seriesTitle ?? fallback;
}

function FeaturedNote({
  post,
  isLoading,
  isError,
  showSlowLoading,
  t,
  isAdmin,
  onRetry,
}: {
  post?: ArticleCardPost;
  isLoading: boolean;
  isError: boolean;
  showSlowLoading: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isAdmin: boolean;
  onRetry: () => void;
}) {
  return (
    <section
      className="home-featured-note open-group"
      aria-label={t("home.latestNote")}
    >
      <div className="home-featured-note-head">
        <span>
          <FileText className="h-4 w-4" />
          {t("home.latestNote")}
        </span>
        {isAdmin && (
          <Link href="/manage">
            <Button
              variant="outline"
              size="icon"
              className="glass-button h-9 w-9"
              aria-label={t("nav.manageArticles")}
              title={t("nav.manageArticles")}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {isError ? (
        <div className="home-note-error" role="alert">
          <strong>{t("home.loadErrorTitle")}</strong>
          <p>{t("home.loadErrorBody")}</p>
          <button type="button" onClick={onRetry}>
            {t("common.retry")}
          </button>
        </div>
      ) : isLoading ? (
        <div className="home-note-skeleton" aria-busy="true">
          <p>
            {showSlowLoading
              ? t("home.loadingArticlesSlow")
              : t("home.loadingArticles")}
          </p>
          <span />
          <strong />
        </div>
      ) : post ? (
        <div className="home-featured-note-body">
          <Link href={`/post/${post.slug}`}>
            <h2>{post.title}</h2>
          </Link>
          <p>{post.excerpt}</p>
          <Link href={`/post/${post.slug}`} className="home-inline-action">
            {t("home.readMore")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="article-empty-state state-surface liquid-surface">
          <h3>{t("home.noArticles")}</h3>
          <p>{t("home.noArticlesRecovery")}</p>
        </div>
      )}
    </section>
  );
}

function TrackPanel({
  model,
  t,
}: {
  model: TrackPanelModel;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  return (
    <section
      className={`home-track-panel home-track-panel-${model.track} open-group`}
    >
      <div className="home-track-panel-head">
        <span>{model.label}</span>
        <strong>{model.meta}</strong>
      </div>

      <div className="home-track-panel-main">
        <div className="home-track-panel-copy">
          <Link href={model.href} className="home-track-title-link">
            <h2>{model.title}</h2>
          </Link>
          <p className="home-track-summary">{model.subtitle}</p>
          <Link href={model.href} className="home-track-action">
            {model.actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div
            className="home-track-topics"
            aria-label={t("home.trackTopicLabel")}
          >
            {model.topicKeys.map(key => (
              <span key={key}>{t(key)}</span>
            ))}
          </div>
        </div>

        <div className="home-track-panel-detail">
          <div className="home-track-path">
            <span>
              <GitBranch className="h-4 w-4" />
              {t("home.trackPathLabel")}
            </span>
            <strong>{model.pathTitle}</strong>
            <p>{model.pathSummary}</p>
          </div>

          <div className="home-track-post-list">
            {model.posts.length > 0 ? (
              model.posts.map(post => (
                <Link key={post.id} href={`/post/${post.slug}`}>
                  <span>{getPostSeriesLabel(post, model.label, t)}</span>
                  <strong>{post.title}</strong>
                </Link>
              ))
            ) : (
              <div className="home-track-empty state-surface liquid-surface">
                {t("home.emptyTrack")}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSlowLoading, setShowSlowLoading] = useState(false);

  const {
    data: posts,
    isLoading,
    isError,
    refetch: refetchPosts,
  } = trpc.posts.list.useQuery({
    status: "published",
    limit: 20,
    orderBy: "publishedAt",
  });

  const publishedPosts = useMemo(
    () => sortPostsNewestFirst((posts?.posts ?? []) as ArticleCardPost[]),
    [posts?.posts]
  );
  const publicSeriesByTrack = useMemo<
    Record<TrackKind, ReturnType<typeof getPublicTrackSeries>>
  >(
    () => ({
      algorithms: getPublicTrackSeries("algorithms", publishedPosts),
      applications: getPublicTrackSeries("applications", publishedPosts),
    }),
    [publishedPosts]
  );

  useEffect(() => {
    if (!isLoading) {
      setShowSlowLoading(false);
      return;
    }

    const timer = window.setTimeout(() => setShowSlowLoading(true), 1200);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  useSeo(
    buildRouteMetadata(siteUrl, {
      title: t("home.title"),
      description: t("home.subtitle"),
      path: "/",
      locale: language === "zh" ? "zh-CN" : "en-US",
    }),
    buildHomeJsonLd(siteUrl)
  );

  const trackPanels = useMemo<TrackPanelModel[]>(
    () =>
      portalTracks.map(track => {
        const config = trackConfigs[track];
        const publicSeries = publicSeriesByTrack[track];
        const primarySeries = getPrimarySeries(publicSeries, publishedPosts);
        const publicCount = countTrackPosts(publishedPosts, track);
        const pathCount = publicSeries.length;

        return {
          track,
          href: config.href,
          label: t(
            track === "algorithms"
              ? "home.algorithmsLabel"
              : "home.applicationsLabel"
          ),
          title: t(config.titleKey),
          subtitle: t(config.subtitleKey),
          topicKeys: getTrackTopicKeys(track),
          meta: isLoading || isError
            ? t(isError ? "home.dataUnavailable" : "home.pathsPending")
            : `${t("home.pathCount", { count: pathCount })} · ${t(
                "home.publicNotes",
                { count: publicCount }
              )}`,
          pathTitle: primarySeries
            ? t(primarySeries.titleKey)
            : track === "applications"
              ? t("home.applicationsPathTitle")
              : t("home.algorithmsPathTitle"),
          pathSummary: getPanelPathSummary(track, primarySeries, t),
          actionLabel:
            track === "applications"
              ? t("home.enterApplications")
              : t("home.enterAlgorithms"),
          posts: getRepresentativePosts(publishedPosts, track),
        };
      }),
    [isError, isLoading, publishedPosts, publicSeriesByTrack, t]
  );

  const mapSummary = useMemo(
    () => getHomeResearchMapSummary(publishedPosts, publicSeriesByTrack),
    [publishedPosts, publicSeriesByTrack]
  );
  const featuredPost = publishedPosts[0];
  const morePosts = publishedPosts.slice(1, 5);

  function runSearch() {
    const query = searchQuery.trim();
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    runSearch();
  }

  return (
    <div className="space-page">
      <SpaceBackdrop subtle />
      <SiteHeader active="home" />

      <main className="relative z-10">
        <section className="home-index-spread container px-4 py-8 sm:px-6 lg:py-10">
          <div className="home-index-grid">
            <section className="home-intro-rail open-group">
              <p className="home-index-kicker">{t("home.kicker")}</p>
              <h1 className="home-title text-white">
                {renderHeroTitle(language)}
              </h1>
              <p className="home-subtitle text-slate-300">
                {t("home.subtitle")}
              </p>

              <div className="home-intro-featured">
                <FeaturedNote
                  post={featuredPost}
                  isLoading={isLoading}
                  isError={isError}
                  showSlowLoading={showSlowLoading}
                  t={t}
                  isAdmin={isAdmin}
                  onRetry={() => void refetchPosts()}
                />
              </div>

              <dl
                className="home-map-summary"
                aria-label={t("home.mapSummaryLabel")}
              >
                <div>
                  <dt>
                    <Route className="h-4 w-4" aria-hidden="true" />
                    {t("home.mapTracks")}
                  </dt>
                  <dd>
                    {isLoading
                      ? t("home.pathsPending")
                      : t("home.trackCount", {
                          count: mapSummary.trackCount,
                        })}
                  </dd>
                </div>
                <div>
                  <dt>
                    <GitBranch className="h-4 w-4" aria-hidden="true" />
                    {t("home.mapPaths")}
                  </dt>
                  <dd>
                    {isLoading
                      ? t("home.pathsPending")
                      : t("home.pathCount", {
                          count: mapSummary.readingPathCount,
                        })}
                  </dd>
                </div>
                <div>
                  <dt>
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    {t("home.mapNotes")}
                  </dt>
                  <dd>
                    {isLoading
                      ? t("home.notesPending")
                      : t("home.publicNotes", {
                          count: mapSummary.publicNoteCount,
                        })}
                  </dd>
                </div>
              </dl>

              <form
                onSubmit={submitSearch}
                className="home-index-search home-search-dock glass-dock"
              >
                <label className="sr-only" htmlFor="home-search-query">
                  {t("home.searchPlaceholder")}
                </label>
                <div className="home-search-field">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  <Input
                    id="home-search-query"
                    type="search"
                    autoComplete="search"
                    placeholder={t("home.searchPlaceholder")}
                    value={searchQuery}
                    onChange={event => setSearchQuery(event.target.value)}
                    className="h-12 border-0 bg-transparent px-0 text-base font-medium text-white shadow-none placeholder:text-slate-500 focus-visible:ring-0"
                  />
                  <Button type="submit" className="home-search-submit">
                    {t("discovery.searchButton")}
                  </Button>
                </div>
              </form>
            </section>

            <section
              className="home-track-panel-grid"
              aria-label={t("home.researchIndex")}
            >
              {trackPanels.map(model => (
                <TrackPanel key={model.track} model={model} t={t} />
              ))}
            </section>
          </div>
        </section>

        <section
          id="research-index"
          className="home-more-notes open-group hairline-list container px-4 pb-16 sm:px-6"
        >
          <div className="home-more-notes-head">
            <div>
              <h2>{t("home.moreNotes")}</h2>
              <p>{t("home.moreNotesHint")}</p>
            </div>
            <Link href="/archive" className="home-inline-action">
              {t("home.allNotes")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isError ? (
            <div className="home-index-error" role="alert">
              <div>
                <h3>{t("home.loadErrorTitle")}</h3>
                <p>{t("home.loadErrorBody")}</p>
              </div>
              <button type="button" onClick={() => void refetchPosts()}>
                {t("common.retry")}
              </button>
            </div>
          ) : isLoading ? (
            <div className="home-more-note-skeletons" aria-busy="true">
              {[1, 2, 3, 4].map(item => (
                <div key={item} className="article-skeleton">
                  <span />
                  <strong />
                  <em />
                  <i />
                </div>
              ))}
            </div>
          ) : morePosts.length ? (
            <div className="home-more-note-grid">
              {morePosts.map((post, index) => (
                <ArticleCard
                  key={post.id}
                  post={post}
                  index={index + 1}
                  language={language}
                  t={t}
                  track={getArticleTrack(post)}
                />
              ))}
            </div>
          ) : (
            <div className="article-empty-state state-surface liquid-surface">
              <h3>{t("home.noArticles")}</h3>
              <p>{t("home.noArticlesRecovery")}</p>
              <div>
                <Link href="/archive" className="article-tag">
                  {t("nav.archive")}
                </Link>
                <Link href="/search" className="article-tag">
                  {t("nav.search")}
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-slate-950/35">
        <div className="container flex flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>{t("common.copyright")}</p>
          <p>{t("home.footerTagline")}</p>
        </div>
      </footer>
    </div>
  );
}
