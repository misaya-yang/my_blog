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
import {
  ArrowRight,
  FileText,
  GitBranch,
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
  pathTitle: string;
  pathSummary: string;
  actionLabel: string;
  posts: ArticleCardPost[];
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
        and <span className="home-title-accent">AI</span>
      </span>
      <span className="home-title-line">Applications</span>
    </>
  );
}

function getPrimarySeries(
  track: TrackKind,
  publicSeries: TrackSeriesConfig[]
) {
  if (track === "applications") {
    return (
      publicSeries.find(series => series.slug === "agent-runtime-systems") ??
      publicSeries[0] ??
      null
    );
  }

  return publicSeries[0] ?? null;
}

function getRepresentativePosts(
  posts: ArticleCardPost[],
  track: TrackKind,
  publicSeries: TrackSeriesConfig[]
) {
  const config = trackConfigs[track];
  const trackPosts = posts.filter(
    post => post.category?.slug === config.categorySlug
  );
  const postsBySlug = new Map(trackPosts.map(post => [post.slug, post]));
  const orderedSlugs = publicSeries.flatMap(series => series.postSlugs);
  const orderedPosts = orderedSlugs
    .map(slug => postsBySlug.get(slug))
    .filter((post): post is ArticleCardPost => Boolean(post));
  const orderedSet = new Set(orderedPosts.map(post => post.slug));
  const fallbackPosts = trackPosts.filter(post => !orderedSet.has(post.slug));

  return [...orderedPosts, ...fallbackPosts].slice(0, 2);
}

function FeaturedNote({
  post,
  isLoading,
  showSlowLoading,
  t,
  isAdmin,
}: {
  post?: ArticleCardPost;
  isLoading: boolean;
  showSlowLoading: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isAdmin: boolean;
}) {
  return (
    <section
      className="home-featured-note article-card"
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

      {isLoading ? (
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
        <div className="article-empty-state">
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
    <section className={`home-track-panel home-track-panel-${model.track}`}>
      <div className="home-track-panel-head">
        <span>{model.label}</span>
        <strong>{model.meta}</strong>
      </div>
      <Link href={model.href} className="home-track-title-link">
        <h2>{model.title}</h2>
      </Link>
      <p>{model.subtitle}</p>

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
              <span>{post.seriesTitle ?? model.label}</span>
              <strong>{post.title}</strong>
            </Link>
          ))
        ) : (
          <div className="home-track-empty">{t("home.emptyTrack")}</div>
        )}
      </div>

      <Link href={model.href} className="home-track-action">
        {model.actionLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
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

  const { data: posts, isLoading } = trpc.posts.list.useQuery({
    status: "published",
    limit: 20,
    orderBy: "featured",
  });

  const publishedPosts = (posts?.posts ?? []) as ArticleCardPost[];
  const publicSeriesByTrack: Record<
    TrackKind,
    ReturnType<typeof getPublicTrackSeries>
  > = {
    algorithms: getPublicTrackSeries("algorithms", publishedPosts),
    applications: getPublicTrackSeries("applications", publishedPosts),
  };

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
        const primarySeries = getPrimarySeries(track, publicSeries);
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
          meta: isLoading
            ? t("home.pathsPending")
            : `${t("home.pathCount", { count: pathCount })} · ${t(
                "home.publicNotes",
                { count: publicCount }
              )}`,
          pathTitle:
            track === "applications" && primarySeries
              ? t(primarySeries.titleKey)
              : t("home.algorithmsPathTitle"),
          pathSummary:
            track === "applications"
              ? t("home.applicationsPathSummary")
              : t("home.algorithmsPathSummary"),
          actionLabel:
            track === "applications"
              ? t("home.enterApplications")
              : t("home.enterAlgorithms"),
          posts: getRepresentativePosts(publishedPosts, track, publicSeries),
        };
      }),
    [isLoading, publishedPosts, publicSeriesByTrack, t]
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
            <section className="home-intro-rail">
              <p className="home-index-kicker">{t("home.kicker")}</p>
              <h1 className="home-title text-white">
                {renderHeroTitle(language)}
              </h1>
              <p className="home-subtitle text-slate-300">
                {t("home.subtitle")}
              </p>

              <form
                onSubmit={submitSearch}
                className="home-index-search home-search-dock"
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

              <FeaturedNote
                post={featuredPost}
                isLoading={isLoading}
                showSlowLoading={showSlowLoading}
                t={t}
                isAdmin={isAdmin}
              />
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
          className="home-more-notes container px-4 pb-16 sm:px-6"
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

          {isLoading ? (
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
            <div className="article-empty-state">
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
