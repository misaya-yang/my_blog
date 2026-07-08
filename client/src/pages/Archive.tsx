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
import { trpc } from "@/lib/trpc";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildRouteMetadata } from "@shared/metadata";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Folder,
  GitBranch,
  Search as SearchIcon,
  Tags,
} from "lucide-react";
import { Link } from "wouter";

function formatDay(value: string | Date | null, locale: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(locale, {
    month: "short",
    day: "2-digit",
  });
}

function formatMonth(year: number, month: number, locale: string) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
  });
}

export type ArchivePostLike = {
  publishedAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

export type ArchiveGroupLike = {
  posts?: unknown[];
};

export function hasMeaningfulUpdate(post: ArchivePostLike) {
  if (!post.publishedAt || !post.updatedAt) return false;
  const published = new Date(post.publishedAt).toDateString();
  const updated = new Date(post.updatedAt).toDateString();
  return published !== updated;
}

export function getArchiveSummary(
  groups: ArchiveGroupLike[] | null | undefined
) {
  return {
    monthCount: groups?.length ?? 0,
    total:
      groups?.reduce(
        (sum, group) =>
          sum + (Array.isArray(group.posts) ? group.posts.length : 0),
        0
      ) ?? 0,
  };
}

export default function Archive() {
  const { language, t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  const locale = language === "zh" ? "zh-CN" : "en-US";
  const { data: groups, isLoading } = trpc.discovery.archive.useQuery();
  const archiveSummary = getArchiveSummary(groups);
  const total = archiveSummary.total;
  useSeo(
    buildRouteMetadata(siteUrl, {
      title: t("discovery.archiveTitle"),
      description: t("discovery.archiveSubtitle", { count: total }),
      path: "/archive",
      locale,
    })
  );

  return (
    <div className="space-page">
      <SpaceBackdrop subtle />
      <SiteHeader active="archive" />

      <main className="container archive-page relative z-10 px-4 py-10 sm:px-6 md:py-14">
        <section className="page-hero">
          <div className="signal-chip mb-6">
            <CalendarDays className="h-4 w-4" />
            {t("discovery.archiveKicker")}
          </div>
          <h1 className="page-title">{t("discovery.archiveTitle")}</h1>
          <p className="page-copy mt-5">
            {isLoading
              ? t("discovery.archiveLoading")
              : t("discovery.archiveSubtitle", { count: total })}
          </p>
        </section>

        {!isLoading && groups?.length ? (
          <div className="archive-summary-strip mt-8">
            <div className="archive-summary-item">
              <BookOpen className="h-4 w-4" />
              <span>{t("discovery.archiveSummaryNotesLabel")}</span>
              <strong>
                {t("discovery.archiveSummaryNotes", { count: total })}
              </strong>
            </div>
            <div className="archive-summary-item">
              <CalendarDays className="h-4 w-4" />
              <span>{t("discovery.archiveSummaryMonthsLabel")}</span>
              <strong>
                {t("discovery.archiveSummaryMonths", {
                  count: archiveSummary.monthCount,
                })}
              </strong>
            </div>
            <Link href="/search" className="archive-summary-action">
              <SearchIcon className="h-4 w-4" />
              <span>{t("discovery.archiveSummarySearch")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/applications" className="archive-summary-action">
              <GitBranch className="h-4 w-4" />
              <span>{t("discovery.archiveSummaryPaths")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}

        <Surface className="archive-timeline mt-10 hairline-list">
          {isLoading ? (
            <LoadingState
              title={t("common.loadingNotes")}
              description={t("common.loadingHint")}
            />
          ) : groups?.length ? (
            <div className="archive-timeline-groups grid gap-8">
              {groups.map((group: any) => (
                <section
                  key={group.key}
                  className="archive-month-group grid gap-3"
                >
                  <SectionHeader
                    className="archive-month-header"
                    title={formatMonth(group.year, group.month, locale)}
                    action={
                      <span className="text-sm text-slate-400">
                        {t("discovery.articlesCount", {
                          count: group.posts.length,
                        })}
                      </span>
                    }
                  />

                  <div className="archive-month-posts divide-y divide-sky-200/10">
                    {group.posts.map((post: any) => (
                      <article
                        key={post.id}
                        className="archive-post-row grid gap-3 py-4 md:grid-cols-[5.5rem_minmax(0,1fr)_auto]"
                      >
                        <time className="archive-post-date text-sm font-medium">
                          {formatDay(post.publishedAt, locale)}
                        </time>
                        <div className="min-w-0">
                          <Link
                            href={`/post/${post.slug}`}
                            className="archive-post-title line-clamp-2 text-base font-semibold leading-7"
                          >
                            {post.title}
                          </Link>
                          <div className="archive-post-taxonomy mt-2 flex flex-wrap items-center gap-2 text-xs">
                            {post.category && (
                              <Link
                                href={`/categories/${post.category.slug}`}
                                className="article-tag gap-1"
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
                        </div>
                        <div className="archive-post-meta flex flex-wrap items-center gap-3 text-xs md:justify-end">
                          <span className="inline-flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" />
                            {post.readingMinutes} {t("home.minRead")}
                          </span>
                          {hasMeaningfulUpdate(post) && (
                            <span>
                              {t("discovery.updated", {
                                date: formatDay(post.updatedAt, locale),
                              })}
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CalendarDays className="h-4 w-4" />}
              title={t("discovery.archiveEmpty")}
              action={
                <Button asChild variant="outline" className="glass-button">
                  <Link href="/">{t("nav.backToHome")}</Link>
                </Button>
              }
            />
          )}
        </Surface>
      </main>
    </div>
  );
}
