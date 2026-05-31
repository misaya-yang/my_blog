import { ArticleCard, type ArticleCardPost } from "@/components/ArticleCard";
import {
  SiteHeader,
  SpaceBackdrop,
  StatTile,
} from "@/components/ResearchShell";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackConfigs, type TrackKind } from "@/lib/tracks";
import { trpc } from "@/lib/trpc";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildRouteMetadata } from "@shared/metadata";
import {
  ArrowLeft,
  Boxes,
  Eye,
  FileText,
  Folder,
  Network,
  Tags,
} from "lucide-react";
import { Link } from "wouter";

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

            <h1 className="display-title max-w-5xl text-5xl leading-[1.05] text-white md:text-7xl xl:text-8xl">
              {t(config.titleKey)}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              {t(config.subtitleKey)}
            </p>

            <div className="mt-5 grid max-w-4xl gap-3 sm:grid-cols-3">
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
