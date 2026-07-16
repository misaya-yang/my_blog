import { ArticleCard, type ArticleCardPost } from "@/components/ArticleCard";
import {
  SiteHeader,
  SpaceBackdrop,
  EmptyState,
} from "@/components/ResearchShell";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPublicArticleTitle } from "@/lib/publicArticles";
import {
  getPublicTrackSeries,
  trackConfigs,
  type TrackKind,
  type TrackSeriesConfig,
} from "@/lib/tracks";
import { trpc } from "@/lib/trpc";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildRouteMetadata } from "@shared/metadata";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Folder,
  GitBranch,
  Network,
} from "lucide-react";
import { Link } from "wouter";

function resolvePostTitle(posts: ArticleCardPost[], slug: string) {
  return (
    posts.find(post => post.slug === slug)?.title ?? getPublicArticleTitle(slug)
  );
}

export type TrackReadingPathStats = {
  pathCount: number;
  articleCount: number;
  plannedTopicCount: number;
};

export function getTrackStartPostSlug(series: TrackSeriesConfig[]) {
  return series[0]?.postSlugs[0] ?? null;
}

export function getTrackReadingPathStats(
  series: TrackSeriesConfig[]
): TrackReadingPathStats {
  return {
    pathCount: series.length,
    articleCount: series.reduce(
      (total, item) => total + item.postSlugs.length,
      0
    ),
    plannedTopicCount: series.reduce(
      (total, item) => total + item.expectedNextKeys.length,
      0
    ),
  };
}

function TrackPage({ kind }: { kind: TrackKind }) {
  const { language, t } = useLanguage();
  const config = trackConfigs[kind];
  const siteUrl = getClientSiteUrl();

  const {
    data: posts,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.posts.list.useQuery({
    status: "published",
    categorySlug: config.categorySlug,
    limit: 20,
    orderBy: "publishedAt",
  });

  const hasLoadedPosts = !isLoading && Boolean(posts);
  const trackPosts = hasLoadedPosts
    ? ((posts?.posts ?? []) as ArticleCardPost[])
    : [];
  const publicSeries = getPublicTrackSeries(kind, trackPosts);
  const startPostSlug = getTrackStartPostSlug(publicSeries);
  const readingPathStats = getTrackReadingPathStats(publicSeries);

  useSeo(
    buildRouteMetadata(siteUrl, {
      title: t(config.titleKey),
      description: t(config.subtitleKey),
      path: config.href,
      locale: language === "zh" ? "zh-CN" : "en-US",
    })
  );

  return (
    <div className="space-page">
      <SpaceBackdrop subtle />
      <SiteHeader active={config.active} />

      <main className="relative z-10">
        <section className="container track-index-page px-4 pb-12 pt-14 sm:px-6 md:pt-[4.5rem]">
          <div className="page-hero track-index-hero min-w-0">
            <div className="signal-chip mb-6">
              <Network className="h-4 w-4" />
              {t(config.topicTitleKey)}
            </div>

            <h1 className="page-title track-page-title">
              {t(config.titleKey)}
            </h1>
            <p className="page-copy track-page-copy mt-5">
              {t(config.subtitleKey)}
            </p>

            <div className="track-context-strip mt-7">
              <div className="track-map-note">
                <Network className="h-5 w-5 text-sky-200" />
                <p>
                  {t(
                    kind === "algorithms"
                      ? "track.algorithms.mapNote"
                      : "track.applications.mapNote"
                  )}
                </p>
              </div>
              <div className="track-focus-chips">
                {config.focusKeys.slice(0, 4).map(key => (
                  <span key={key}>{t(key)}</span>
                ))}
              </div>
            </div>

            <nav
              className="track-orientation-strip"
              aria-label={t("track.orientationLabel")}
            >
              <Link
                href={
                  startPostSlug ? `/post/${startPostSlug}` : "#research-index"
                }
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                <span>{t("track.startHere")}</span>
                <strong>
                  {startPostSlug
                    ? resolvePostTitle(trackPosts, startPostSlug)
                    : t("track.articles")}
                </strong>
              </Link>
              <Link href="#track-reading-paths">
                <GitBranch className="h-4 w-4" aria-hidden="true" />
                <span>{t("track.corePaths")}</span>
                <strong>
                  {t("home.pathCount", {
                    count: readingPathStats.pathCount,
                  })}
                </strong>
              </Link>
              <Link href="#research-index">
                <Folder className="h-4 w-4" aria-hidden="true" />
                <span>{t("track.recentNotes")}</span>
                <strong>
                  {t("home.publicNotes", {
                    count: readingPathStats.articleCount,
                  })}
                </strong>
              </Link>
            </nav>

            {publicSeries.length > 0 && (
              <section
                id="track-reading-paths"
                className="track-path-section mt-7 max-w-5xl"
              >
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="section-title">{t("track.seriesTitle")}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                      {t("track.readingOrderHint")}
                    </p>
                  </div>
                  <Link
                    href="#research-index"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    {t("track.articles")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div
                  className={`track-series-grid grid gap-4 ${
                    publicSeries.length === 1 ? "track-series-grid-single" : ""
                  }`}
                >
                  {publicSeries.map(series => (
                    <section
                      key={series.slug}
                      className="track-series-card open-group"
                    >
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <span className="series-card-track">
                            {t("track.readingOrder")}
                          </span>
                          <h2>{t(series.titleKey)}</h2>
                        </div>
                        <GitBranch className="mt-1 h-5 w-5 shrink-0 text-sky-200" />
                      </div>
                      <p>{t(series.promiseKey)}</p>
                      <div className="series-card-concepts mt-4">
                        {series.conceptKeys.slice(0, 3).map(key => (
                          <span key={key}>{t(key)}</span>
                        ))}
                      </div>
                      {series.expectedNextKeys.length > 0 && (
                        <details className="series-card-next mt-4">
                          <summary>{t("track.nextPlanned")}</summary>
                          <div>
                            {series.expectedNextKeys.slice(0, 2).map(key => (
                              <em key={key}>{t(key)}</em>
                            ))}
                          </div>
                        </details>
                      )}
                      <div className="series-card-steps mt-5">
                        {series.postSlugs.map((slug, index) => (
                          <Link
                            key={slug}
                            href={`/post/${slug}`}
                            className="series-step"
                          >
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            <strong>
                              {resolvePostTitle(trackPosts, slug)}
                            </strong>
                            <ArrowRight className="h-4 w-4 text-slate-300" />
                          </Link>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </section>
            )}
          </div>
        </section>

        <section
          id="research-index"
          className="container research-grid track-index-layout px-4 pb-16 sm:px-6"
        >
          <div className="open-group research-section-panel track-article-ledger hairline-list">
            <div className="section-heading-row">
              <h2 className="section-title">{t("track.articles")}</h2>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="glass-button"
              >
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("track.backHome")}
                </Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2].map(item => (
                  <div key={item} className="article-skeleton" />
                ))}
              </div>
            ) : isError ? (
              <EmptyState
                icon={<FileText className="h-4 w-4" />}
                title={t("track.loadFailed")}
                description={error?.message || t("track.loadFailedHint")}
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
            ) : trackPosts.length > 0 ? (
              <div className="grid gap-4">
                {trackPosts.map((post, index) => (
                  <ArticleCard
                    key={post.id}
                    post={post}
                    index={index}
                    language={language}
                    t={t}
                    track={kind}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<FileText className="h-4 w-4" />}
                title={t("home.noArticles")}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export function AlgorithmsPage() {
  return <TrackPage kind="algorithms" />;
}

export function ApplicationsPage() {
  return <TrackPage kind="applications" />;
}
