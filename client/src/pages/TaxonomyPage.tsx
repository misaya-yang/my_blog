import { ArticleCard } from "@/components/ArticleCard";
import { SiteHeader, SpaceBackdrop } from "@/components/ResearchShell";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackConfigs } from "@/lib/tracks";
import { trpc } from "@/lib/trpc";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildRouteMetadata } from "@shared/metadata";
import { Folder, Hash, Network, Tags } from "lucide-react";
import { Link, useParams } from "wouter";

type TaxonomyKind = "tag" | "category";

function TaxonomyPage({ kind }: { kind: TaxonomyKind }) {
  const { slug = "" } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  const tagQuery = trpc.discovery.tag.useQuery(
    { slug, limit: 50, offset: 0 },
    { enabled: kind === "tag" && Boolean(slug), retry: false }
  );
  const categoryQuery = trpc.discovery.category.useQuery(
    { slug, limit: 50, offset: 0 },
    { enabled: kind === "category" && Boolean(slug), retry: false }
  );
  const query = kind === "tag" ? tagQuery : categoryQuery;
  const data: any = query.data;
  const taxonomy = kind === "tag" ? data?.tag : data?.category;
  const matchingTrack = kind === "category"
    ? Object.values(trackConfigs).find((track) => track.categorySlug === taxonomy?.slug)
    : undefined;
  useSeo(
    buildRouteMetadata(siteUrl, {
      title: taxonomy?.name ?? slug,
      description:
        taxonomy?.description ??
        (kind === "tag" ? t("discovery.tagKicker") : t("discovery.categoryKicker")),
      path: `/${kind === "tag" ? "tags" : "categories"}/${slug}`,
      locale: language === "zh" ? "zh-CN" : "en-US",
      noindex: !taxonomy && !query.isLoading,
    })
  );

  return (
    <div className="space-page">
      <SpaceBackdrop subtle />
      <SiteHeader active={kind === "category" && slug === "ai-applications" ? "applications" : kind === "category" && slug === "ai-algorithms" ? "algorithms" : undefined} />

      <main className="container relative z-10 px-4 py-10 sm:px-6 md:py-14">
        {query.isLoading ? (
          <div className="glass-panel p-8">
            <div className="article-skeleton h-28" />
          </div>
        ) : taxonomy ? (
          <>
            <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <div className="signal-chip mb-6">
                  {kind === "tag" ? <Hash className="h-4 w-4 text-sky-300" /> : <Folder className="h-4 w-4 text-sky-300" />}
                  {kind === "tag" ? t("discovery.tagKicker") : t("discovery.categoryKicker")}
                </div>
                <h1 className="font-serif text-4xl font-semibold leading-tight text-white md:text-6xl">
                  {taxonomy.name}
                </h1>
                {taxonomy.description && (
                  <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
                    {taxonomy.description}
                  </p>
                )}
                <p className="mt-5 text-sm text-slate-400">
                  {t("discovery.articlesCount", { count: data.total })}
                </p>
              </div>

              <aside className="glass-panel p-5">
                <div className="flex items-center gap-2 text-white">
                  <Tags className="h-5 w-5 text-sky-300" />
                  <h2 className="text-base font-semibold">{t("discovery.siblingTags")}</h2>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {data.siblingTags?.length ? (
                    data.siblingTags.slice(0, 16).map((tag: any) => (
                      <Link
                        key={tag.slug}
                        href={`/tags/${tag.slug}`}
                        className="rounded-lg border border-sky-200/15 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-200 hover:border-sky-300/45 hover:text-white"
                      >
                        {tag.name}
                      </Link>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">{t("discovery.noSiblingTags")}</span>
                  )}
                </div>

                {matchingTrack && (
                  <div className="mt-7">
                    <div className="flex items-center gap-2 text-white">
                      <Network className="h-5 w-5 text-blue-300" />
                      <h2 className="text-base font-semibold">{t(matchingTrack.topicTitleKey)}</h2>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {matchingTrack.topics.map((topic) => (
                        <div key={topic.labelKey} className="research-index-row min-h-[3.5rem] px-4 py-3 text-sm">
                          <span>{t(topic.labelKey)}</span>
                          <span className="text-sky-300">{t(topic.metaKey)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </section>

            <section className="glass-panel mt-9 p-4 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="section-title">{t("track.articles")}</h2>
                <Button asChild variant="outline" size="sm" className="glass-button">
                  <Link href="/archive">{t("nav.archive")}</Link>
                </Button>
              </div>

              {data.posts?.length ? (
                <div className="grid gap-4">
                  {data.posts.map((post: any, index: number) => (
                    <ArticleCard
                      key={post.id}
                      post={post}
                      index={index}
                      language={language}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-14 text-center text-sm text-slate-400">
                  {t("discovery.noPosts")}
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="glass-panel p-8 text-center">
            <h1 className="text-2xl font-semibold text-white">{t("discovery.taxonomyNotFound")}</h1>
            <Button asChild variant="outline" className="glass-button mt-5">
              <Link href="/archive">{t("nav.archive")}</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export function TagPage() {
  return <TaxonomyPage kind="tag" />;
}

export function CategoryPage() {
  return <TaxonomyPage kind="category" />;
}
