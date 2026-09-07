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
} from "@/lib/tracks";
import { trpc } from "@/lib/trpc";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildRouteMetadata } from "@shared/metadata";
import { ArrowLeft, ArrowRight, FileText, GitBranch } from "lucide-react";
import { Link } from "wouter";

function resolvePostTitle(posts: ArticleCardPost[], slug: string) {
  return (
    posts.find(post => post.slug === slug)?.title ?? getPublicArticleTitle(slug)
  );
}

function TrackPage({ kind }: { kind: TrackKind }) {
  const { language, t } = useLanguage();
  const config = trackConfigs[kind];
  const siteUrl = getClientSiteUrl();

  const { data: posts, isLoading } = trpc.posts.list.useQuery({
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
            <h1 className="page-title track-page-title">
              {t(config.titleKey)}
            </h1>
            <p className="page-copy track-page-copy mt-5">
              {t(config.subtitleKey)}
            </p>

            <div className="track-focus-chips">
              {config.focusKeys.slice(0, 4).map(key => (
                <span key={key}>{t(key)}</span>
              ))}
            </div>

            {publicSeries.length > 0 && (
              <details className="track-path-section">
                <summary>
                  {t("track.seriesTitle")} · {publicSeries.length}
                </summary>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="section-title">{t("track.seriesTitle")}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {t("track.readingOrderHint")}
                    </p>
                  </div>
                  <Link
                    href="#research-index"
                    className="inline-flex min-h-7 items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
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
                        <GitBranch className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      </div>
                      <p>{t(series.promiseKey)}</p>
                      <div className="series-card-concepts mt-4">
                        {series.conceptKeys.map(key => (
                          <span key={key}>{t(key)}</span>
                        ))}
                      </div>
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
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </details>
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
