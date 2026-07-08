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
import React from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Folder,
  Hash,
  Network,
  Tags,
} from "lucide-react";
import { Link, useParams, useSearch } from "wouter";

export type TaxonomyKind = "tag" | "category";

export const TAXONOMY_PAGE_SIZE = 24;

export function parseTaxonomyPage(search: string) {
  const rawPage = new URLSearchParams(search).get("page");
  const page = Number(rawPage);
  if (!Number.isInteger(page) || page < 1) return 1;
  return page;
}

export function getTaxonomyOffset(page: number, pageSize = TAXONOMY_PAGE_SIZE) {
  return (Math.max(1, Math.floor(page)) - 1) * pageSize;
}

export function getTaxonomyPageInfo(
  total: number,
  page: number,
  pageSize = TAXONOMY_PAGE_SIZE
) {
  const safeTotal = Math.max(0, total);
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));
  const offset = getTaxonomyOffset(safePage, safePageSize);
  const hasVisibleRows = safeTotal > 0 && offset < safeTotal;
  const start = hasVisibleRows ? offset + 1 : 0;
  const end = hasVisibleRows ? Math.min(safeTotal, offset + safePageSize) : 0;

  return {
    page: safePage,
    pageSize: safePageSize,
    total: safeTotal,
    totalPages,
    offset,
    start,
    end,
    hasPrevious: safePage > 1,
    hasNext: safePage < totalPages,
    previousPage: Math.min(Math.max(1, safePage - 1), totalPages),
    nextPage: Math.min(safePage + 1, totalPages),
  };
}

export function buildTaxonomyPageHref(
  kind: TaxonomyKind,
  slug: string,
  page: number
) {
  const base = `/${kind === "tag" ? "tags" : "categories"}/${slug}`;
  return page <= 1 ? base : `${base}?page=${page}`;
}

type TaxonomyTag = {
  id?: string | number;
  name: string;
  slug: string;
};

export type TaxonomyPost = {
  id: string | number;
  slug: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  publishedAt?: string | Date | null;
  readingMinutes?: number | null;
  category?: { name?: string | null; slug?: string | null } | null;
  tags?: TaxonomyTag[] | null;
};

const TAXONOMY_VISIBLE_TAG_LIMIT = 3;

export function getVisibleTaxonomyTags(
  tags: TaxonomyTag[] | null | undefined,
  limit = TAXONOMY_VISIBLE_TAG_LIMIT
) {
  return Array.isArray(tags) ? tags.slice(0, Math.max(0, limit)) : [];
}

export function getHiddenTaxonomyTagCount(
  tags: TaxonomyTag[] | null | undefined,
  limit = TAXONOMY_VISIBLE_TAG_LIMIT
) {
  if (!Array.isArray(tags)) return 0;
  return Math.max(0, tags.length - Math.max(0, limit));
}

export function getTaxonomyPostExcerpt(post: TaxonomyPost) {
  if (post.excerpt?.trim()) return post.excerpt.trim();
  const content =
    post.content
      ?.replace(/[#*$\\`]/g, "")
      .replace(/\s+/g, " ")
      .trim() ?? "";
  return content ? `${content.slice(0, 180)}...` : "";
}

function formatTaxonomyDate(
  value: string | Date | null | undefined,
  locale: string,
  fallback: string
) {
  if (!value) return fallback;
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function TaxonomyPage({ kind }: { kind: TaxonomyKind }) {
  const { slug = "" } = useParams<{ slug: string }>();
  const search = useSearch();
  const { language, t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  const page = parseTaxonomyPage(search);
  const offset = getTaxonomyOffset(page);
  const tagQuery = trpc.discovery.tag.useQuery(
    { slug, limit: TAXONOMY_PAGE_SIZE, offset },
    { enabled: kind === "tag" && Boolean(slug), retry: false }
  );
  const categoryQuery = trpc.discovery.category.useQuery(
    { slug, limit: TAXONOMY_PAGE_SIZE, offset },
    { enabled: kind === "category" && Boolean(slug), retry: false }
  );
  const query = kind === "tag" ? tagQuery : categoryQuery;
  const data: any = query.data;
  const taxonomy = kind === "tag" ? data?.tag : data?.category;
  const pageInfo = getTaxonomyPageInfo(data?.total ?? 0, page);
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
      path: buildTaxonomyPageHref(kind, slug, page),
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
              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                <span>
                  {t("discovery.articlesCount", { count: data.total })}
                </span>
                <span aria-hidden="true">/</span>
                <span>
                  {t("discovery.taxonomyResultRange", {
                    start: pageInfo.start,
                    end: pageInfo.end,
                    total: pageInfo.total,
                  })}
                </span>
              </div>
            </section>

            <Surface
              as="aside"
              className="taxonomy-side-panel"
              variant="floating"
            >
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
                  <span className="text-sm text-slate-400">
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
                        <span className="text-sky-300">{t(topic.metaKey)}</span>
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

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {t("discovery.taxonomyPageStatus", {
                    page: pageInfo.page,
                    totalPages: pageInfo.totalPages,
                  })}
                </span>
                <span aria-hidden="true">/</span>
                <span>
                  {t("discovery.taxonomyPageSizeHint", {
                    count: pageInfo.pageSize,
                  })}
                </span>
              </div>

              {data.posts?.length ? (
                <div className="mt-5 grid gap-4">
                  {data.posts.map((post: TaxonomyPost) => (
                    <TaxonomyArticleRow
                      key={post.id}
                      post={post}
                      language={language}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Folder className="h-4 w-4" />}
                  title={
                    pageInfo.page > pageInfo.totalPages
                      ? t("discovery.taxonomyPageEmpty")
                      : t("discovery.noPosts")
                  }
                />
              )}

              {(pageInfo.totalPages > 1 || pageInfo.page > 1) && (
                <TaxonomyPager kind={kind} slug={slug} pageInfo={pageInfo} />
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

export function TaxonomyArticleRow({
  post,
  language,
  t,
}: {
  post: TaxonomyPost;
  language: "en" | "zh";
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const locale = language === "zh" ? "zh-CN" : "en-US";
  const visibleTags = getVisibleTaxonomyTags(post.tags);
  const hiddenTagCount = getHiddenTaxonomyTagCount(post.tags);
  const excerpt = getTaxonomyPostExcerpt(post);

  return (
    <article className="taxonomy-article-row">
      <div className="taxonomy-article-main min-w-0">
        <div className="taxonomy-article-meta">
          <time
            dateTime={
              post.publishedAt
                ? new Date(post.publishedAt).toISOString()
                : undefined
            }
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {formatTaxonomyDate(post.publishedAt, locale, t("common.draft"))}
          </time>
          <span>
            <BookOpen className="h-3.5 w-3.5" />
            {post.readingMinutes ?? 0} {t("home.minRead")}
          </span>
        </div>
        <Link href={`/post/${post.slug}`} className="taxonomy-article-title">
          {post.title}
        </Link>
        {excerpt && <p className="taxonomy-article-excerpt">{excerpt}</p>}
        <div className="taxonomy-article-tags">
          {post.category?.slug ? (
            <Link
              href={`/categories/${post.category.slug}`}
              className="article-tag"
            >
              <Folder className="h-3.5 w-3.5" />
              {post.category.name}
            </Link>
          ) : null}
          {visibleTags.map(tag => (
            <Link
              key={tag.slug}
              href={`/tags/${tag.slug}`}
              className="article-tag"
            >
              <Tags className="h-3 w-3" />
              {tag.name}
            </Link>
          ))}
          {hiddenTagCount > 0 && (
            <span className="article-tag article-tag-muted">
              {t("discovery.moreTags", { count: hiddenTagCount })}
            </span>
          )}
        </div>
      </div>
      <Link href={`/post/${post.slug}`} className="taxonomy-article-action">
        <span>{t("home.readMore")}</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function TaxonomyPager({
  kind,
  slug,
  pageInfo,
}: {
  kind: TaxonomyKind;
  slug: string;
  pageInfo: ReturnType<typeof getTaxonomyPageInfo>;
}) {
  const { t } = useLanguage();

  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-sky-200/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t("discovery.taxonomyPageStatus", {
          page: pageInfo.page,
          totalPages: pageInfo.totalPages,
        })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {pageInfo.hasPrevious ? (
          <Button asChild variant="outline" size="sm" className="glass-button">
            <Link
              href={buildTaxonomyPageHref(kind, slug, pageInfo.previousPage)}
            >
              <ChevronLeft className="h-4 w-4" />
              {t("common.ui.previousPage")}
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="glass-button" disabled>
            <ChevronLeft className="h-4 w-4" />
            {t("common.ui.previousPage")}
          </Button>
        )}
        {pageInfo.hasNext ? (
          <Button asChild variant="outline" size="sm" className="glass-button">
            <Link href={buildTaxonomyPageHref(kind, slug, pageInfo.nextPage)}>
              {t("common.ui.nextPage")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="glass-button" disabled>
            {t("common.ui.nextPage")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function TagPage() {
  return <TaxonomyPage kind="tag" />;
}

export function CategoryPage() {
  return <TaxonomyPage kind="category" />;
}
