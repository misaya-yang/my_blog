import { ArticleCard, type ArticleCardPost } from "@/components/ArticleCard";
import {
  SiteHeader,
  SpaceBackdrop,
  StatTile,
} from "@/components/ResearchShell";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getPublicTrackSeries,
  trackConfigs,
  type TrackKind,
} from "@/lib/tracks";
import { trpc } from "@/lib/trpc";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildRouteMetadata } from "@shared/metadata";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Eye,
  FileText,
  Folder,
  GitBranch,
  Network,
  Tags,
} from "lucide-react";
import { Link } from "wouter";

const fallbackPostTitles: Record<string, string> = {
  "agent-harness-engine-evaluating-tool-using-agents":
    "Agent Harness Engine: Evaluating Tool-Using Agents Under Controlled Context",
  "rag-evidence-packet-context-compiler":
    "Evidence Packet: Agentic RAG 的上下文编译接口",
  "agent-loop-observable-tool-using-agents":
    "Agent Loop: 从 ReAct 模式到可观测运行时",
  "isohc-fixed-vector-isometric-residual-mixing":
    "IsoHC: Fixed-Vector Isometric Residual Mixing",
};

function resolvePostTitle(posts: ArticleCardPost[], slug: string) {
  return (
    posts.find(post => post.slug === slug)?.title ??
    fallbackPostTitles[slug] ??
    slug
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

  const trackPosts = (posts?.posts ?? []) as ArticleCardPost[];
  const publicSeries = getPublicTrackSeries(kind, trackPosts);
  const totalViews = trackPosts.reduce(
    (sum, post) => sum + (post.viewCount || 0),
    0
  );

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
      <SpaceBackdrop />
      <SiteHeader active={config.active} />

      <main className="relative z-10">
        <section className="container grid gap-10 px-4 pb-12 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <p className="technical-label mb-6">{t(config.topicTitleKey)}</p>

            <h1 className="display-title max-w-5xl text-4xl leading-[1.06] text-white md:text-6xl xl:text-7xl">
              {t(config.titleKey)}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              {t(config.subtitleKey)}
            </p>

            <div className="track-map-note mt-7 max-w-4xl">
              <Network className="h-5 w-5 text-sky-300" />
              <p>
                {t(
                  kind === "algorithms"
                    ? "track.algorithms.mapNote"
                    : "track.applications.mapNote"
                )}
              </p>
            </div>

            {publicSeries.length > 0 && (
              <div className="mt-6 grid max-w-5xl gap-4 md:grid-cols-2">
                {publicSeries.map(series => (
                  <section key={series.slug} className="track-series-card">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <span className="series-card-track">
                          {t("track.seriesTitle")}
                        </span>
                        <h2>{t(series.titleKey)}</h2>
                      </div>
                      <GitBranch className="mt-1 h-5 w-5 shrink-0 text-sky-300" />
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
                          <strong>{resolvePostTitle(trackPosts, slug)}</strong>
                          <ArrowRight className="h-4 w-4 text-sky-300" />
                        </Link>
                      ))}
                    </div>
                    <div className="mt-4 border-t border-sky-200/10 pt-4">
                      <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                        {t("track.nextPlanned")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {series.expectedNextKeys.map(key => (
                          <span key={key} className="article-tag">
                            {t(key)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            )}

            <div className="mt-6 grid max-w-4xl gap-3 sm:grid-cols-3">
              <StatTile
                icon={<FileText className="h-5 w-5" />}
                value={trackPosts.length}
                label={t("home.statArticles")}
              />
              <StatTile
                icon={<Folder className="h-5 w-5" />}
                value={config.topics.length}
                label={t("track.statTopics")}
              />
              <StatTile
                icon={<Eye className="h-5 w-5" />}
                value={totalViews}
                label={t("home.statViews")}
              />
            </div>
          </div>

          <aside className="glass-panel p-5">
            <div className="flex items-center gap-2 text-white">
              <Network className="h-5 w-5 text-sky-300" />
              <h2 className="text-base font-semibold">
                {t(config.topicTitleKey)}
              </h2>
            </div>
            <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-300">
              {t(config.overviewKey)}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {config.focusKeys.slice(0, 4).map(key => (
                <span
                  key={key}
                  className="rounded-lg border border-sky-200/15 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-200"
                >
                  {t(key)}
                </span>
              ))}
            </div>
          </aside>
        </section>

        <section
          id="research-index"
          className="container research-grid px-4 pb-16 sm:px-6"
        >
          <div className="glass-panel research-section-panel">
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
              <div className="py-16 text-center text-sm text-slate-400">
                {t("home.noArticles")}
              </div>
            )}
          </div>

          <aside className="glass-panel research-index-panel">
            <div className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-sky-300" />
              <h2 className="section-title">{t("track.topicNodes")}</h2>
            </div>
            <div className="research-index-list">
              {config.topics.map(topic => (
                <div key={topic.labelKey} className="research-index-row">
                  <span>{t(topic.labelKey)}</span>
                  <span className="text-sky-300">{t(topic.metaKey)}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Tags className="h-4 w-4 text-blue-300" />
              <span className="text-xs text-slate-400">
                {t("track.topicHint")}
              </span>
            </div>
          </aside>
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
