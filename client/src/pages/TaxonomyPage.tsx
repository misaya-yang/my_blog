import { ArticleCard } from "@/components/ArticleCard";
import {
  EmptyState,
  LoadingState,
  SectionHeader,
  SiteHeader,
  SpaceBackdrop,
  Surface,
} from "@/components/ResearchShell";
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
  const matchingTrack =
    kind === "category"
      ? Object.values(trackConfigs).find(
          track => track.categorySlug === taxonomy?.slug
        )
      : undefined;
  useSeo(
    buildRouteMetadata(siteUrl, {
      title: taxonomy?.name ?? slug,
      description:
        taxonomy?.description ??
        (kind === "tag"
          ? t("discovery.tagKicker")
          : t("discovery.categoryKicker")),
      path: `/${kind === "tag" ? "tags" : "categories"}/${slug}`,
      locale: language === "zh" ? "zh-CN" : "en-US",
      noindex: !taxonomy && !query.isLoading,
    })
  );

  return (
    <div className="space-page">
      <SpaceBackdrop subtle />
      <SiteHeader
        active={
          kind === "category" && slug === "ai-applications"
            ? "applications"
            : kind === "category" && slug === "ai-algorithms"
              ? "algorithms"
              : undefined
        }
      />

      <main className="container relative z-10 px-4 py-10 sm:px-6 md:py-14">
        {query.isLoading ? (
          <LoadingState
            title={t("common.loadingNotes")}
            description={t("common.loadingHint")}
          />
        ) : taxonomy ? (
          <div className="taxonomy-layout">
            <section className="taxonomy-hero page-hero">
                <div className="signal-chip mb-6">
                  {kind === "tag" ? (
                    <Hash className="h-4 w-4" />
                  ) : (
                    <Folder className="h-4 w-4" />
                  )}
                  {kind === "tag"
                    ? t("discovery.tagKicker")
                    : t("discovery.categoryKicker")}
                </div>
                <h1 className="page-title">{taxonomy.name}</h1>
                {taxonomy.description && (
                  <p className="page-copy mt-5">{taxonomy.description}</p>
                )}
                <p className="mt-5 text-sm text-muted-foreground">
                  {t("discovery.articlesCount", { count: data.total })}
                </p>
              </section>

              <Surface as="aside" className="taxonomy-side-panel" variant="floating">
                <SectionHeader
                  icon={<Tags className="h-4 w-4" />}
                  title={t("discovery.siblingTags")}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {data.siblingTags?.length ? (
                    data.siblingTags.slice(0, 16).map((tag: any) => (
                      <Link
                        key={tag.slug}
                        href={`/tags/${tag.slug}`}
                        className="article-tag px-3 py-1.5"
                      >
                        {tag.name}
                      </Link>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t("discovery.noSiblingTags")}
                    </span>
                  )}
                </div>

                {matchingTrack && (
                  <div className="mt-7">
                    <SectionHeader
                      icon={<Network className="h-4 w-4" />}
                      title={t(matchingTrack.topicTitleKey)}
                    />
                    <div className="mt-4 grid gap-2">
                      {matchingTrack.topics.map(topic => (
                        <div
                          key={topic.labelKey}
                          className="research-index-row min-h-[3.5rem] px-4 py-3 text-sm"
                        >
                          <span>{t(topic.labelKey)}</span>
                          <span className="text-primary">
                            {t(topic.metaKey)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Surface>

            <Surface className="taxonomy-notes-surface hairline-list">
              <SectionHeader
                title={t("track.articles")}
                action={
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="glass-button"
                  >
                    <Link href="/archive">{t("nav.archive")}</Link>
                  </Button>
                }
              />

              {data.posts?.length ? (
                <div className="mt-5 grid gap-4">
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
                <EmptyState
                  icon={<Folder className="h-4 w-4" />}
                  title={t("discovery.noPosts")}
                />
              )}
            </Surface>
          </div>
        ) : (
          <EmptyState
            icon={<Folder className="h-4 w-4" />}
            title={t("discovery.taxonomyNotFound")}
            action={
              <Button asChild variant="outline" className="glass-button">
                <Link href="/archive">{t("nav.archive")}</Link>
              </Button>
            }
          />
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
