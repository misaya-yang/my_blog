import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArticleCard,
  type ArticleCardPost,
  type ArticleTrack,
} from "@/components/ArticleCard";
import {
  SiteHeader,
  SpaceBackdrop,
  StatTile,
} from "@/components/ResearchShell";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPublicTrackSeries,
  trackConfigs,
  type TrackKind,
} from "@/lib/tracks";
import { trpc } from "@/lib/trpc";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildHomeJsonLd, buildRouteMetadata } from "@shared/metadata";
import {
  ArrowRight,
  BookOpen,
  Eye,
  FileText,
  Folder,
  GitBranch,
  Map,
  Search,
  Settings2,
  Tags,
  UserRound,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { FormEvent, useState } from "react";

const focusTagKeys = [
  "home.focusTag1",
  "home.focusTag2",
  "home.focusTag3",
  "home.focusTag4",
  "home.focusTag5",
  "home.focusTag6",
  "home.focusTag7",
  "home.focusTag8",
];

const portalTracks: TrackKind[] = ["algorithms", "applications"];

type HomeTag = {
  id?: string | number;
  name: string;
  slug?: string | null;
};

function sumPostViews(posts: ArticleCardPost[]): number {
  return posts.reduce((sum, post) => sum + (post.viewCount || 0), 0);
}

function filterVisibleTags(tags: HomeTag[]): HomeTag[] {
  return tags.filter(tag => tag.slug !== "evq-cosh" && tag.name !== "EVQ-Cosh");
}

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
        AI 算法与 <span className="home-title-accent">AI</span> 应用
      </>
    );
  }

  return (
    <>
      AI Algorithms and <span className="home-title-accent">AI</span>{" "}
      Applications
    </>
  );
}

export default function Home() {
  const { isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: posts, isLoading } = trpc.posts.list.useQuery({
    status: "published",
    limit: 20,
    orderBy: "featured",
  });

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: tags } = trpc.tags.list.useQuery();

  const publishedPosts = (posts?.posts ?? []) as ArticleCardPost[];
  const publicSeriesByTrack: Record<
    TrackKind,
    ReturnType<typeof getPublicTrackSeries>
  > = {
    algorithms: getPublicTrackSeries("algorithms", publishedPosts),
    applications: getPublicTrackSeries("applications", publishedPosts),
  };
  const activeSeries = portalTracks.flatMap(track =>
    publicSeriesByTrack[track].map(series => ({ track, series }))
  );
  const totalViews = sumPostViews(publishedPosts);
  const hasMeaningfulStats = Boolean(
    publishedPosts.length > 0 || (categories?.length || 0) > 0 || totalViews > 0
  );
  const recommendedStartPost = publishedPosts[0];

  useSeo(
    buildRouteMetadata(siteUrl, {
      title: t("home.title"),
      description: t("home.subtitle"),
      path: "/",
      locale: language === "zh" ? "zh-CN" : "en-US",
    }),
    buildHomeJsonLd(siteUrl)
  );

  const fallbackTags: HomeTag[] = focusTagKeys.map((key, index) => ({
    id: index,
    name: t(key),
  }));
  const fetchedTags = Array.isArray(tags) ? (tags as HomeTag[]) : [];
  const visibleTags = filterVisibleTags(
    fetchedTags.length > 0 ? fetchedTags : fallbackTags
  );

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
      <SpaceBackdrop />
      <SiteHeader active="home" />

      <main className="relative z-10">
        <section className="home-hero-shell container px-4 pb-8 pt-10 sm:px-6 md:pb-10 md:pt-14">
          <div className="home-hero-grid">
            <div className="home-editorial-hero">
              <div className="home-kicker" aria-label={t("home.kicker")}>
                {t("home.kicker")}
              </div>

              <h1 className="home-title max-w-5xl text-white">
                {renderHeroTitle(language)}
              </h1>
              <p className="home-subtitle mt-6 max-w-2xl text-slate-300">
                {t("home.subtitle")}
              </p>

              {recommendedStartPost && (
                <Link
                  href={`/post/${recommendedStartPost.slug}`}
                  className="home-start-card mt-5"
                >
                  <span className="series-card-track">
                    {t("home.startHere")}
                  </span>
                  <strong>{recommendedStartPost.title}</strong>
                  <span>{recommendedStartPost.excerpt}</span>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </Link>
              )}
            </div>

            <figure className="home-hero-visual" aria-hidden="true">
              <img
                src="/images/research-orbit-hero.jpg"
                alt=""
                loading="eager"
                decoding="async"
                width={1672}
                height={941}
              />
            </figure>
          </div>

          <div className="home-hero-lower">
            <div className="home-track-grid grid gap-4 md:grid-cols-2">
              {portalTracks.map(track => {
                const config = trackConfigs[track];
                const publicCount = countTrackPosts(publishedPosts, track);
                const pathCount = publicSeriesByTrack[track].length;
                const number = track === "algorithms" ? "01" : "02";
                const pathLabel = isLoading
                  ? t("home.pathsPending")
                  : t("home.pathCount", { count: pathCount });
                const publicNotesLabel = isLoading
                  ? t("home.notesPending")
                  : t("home.publicNotes", { count: publicCount });
                return (
                  <Link key={track} href={config.href}>
                    <article className="track-portal-card home-track-card group">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div className="home-track-number">{number}</div>
                        <div className="home-track-label">
                          {t(
                            track === "algorithms"
                              ? "home.algorithmsLabel"
                              : "home.applicationsLabel"
                          )}
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1" />
                      </div>
                      <h2 className="home-track-title">{t(config.titleKey)}</h2>
                      <p className="track-portal-copy mt-3 text-sm leading-6 text-slate-300/85">
                        {t(config.overviewKey)}
                      </p>
                      <div className="track-portal-cta flex flex-wrap items-center gap-2 text-xs font-medium text-slate-300/75">
                        <span className="inline-flex items-center gap-1.5">
                          <GitBranch className="h-3.5 w-3.5" />
                          {pathLabel}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          {publicNotesLabel}
                        </span>
                        <span className="ml-auto inline-flex items-center gap-1.5 text-slate-100">
                          {t("home.readMore")}
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>

            <form onSubmit={submitSearch} className="home-search-dock">
              <div className="home-search-dock-title">
                <BookOpen className="h-5 w-5" />
                <span>{t("home.activeSeries")}</span>
              </div>
              <Link href="#research-index" className="home-search-index">
                {t("home.researchIndexKicker")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <label className="sr-only" htmlFor="home-search-query">
                {t("home.searchPlaceholder")}
              </label>
              <div className="home-search-field">
                <Input
                  id="home-search-query"
                  type="search"
                  autoComplete="search"
                  placeholder={t("home.searchPlaceholder")}
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  onKeyDown={event => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    runSearch();
                  }}
                  className="h-11 border-0 bg-transparent px-0 text-base font-medium text-white shadow-none placeholder:text-slate-500 focus-visible:ring-0"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="home-search-submit"
                  aria-label={t("discovery.searchButton")}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div>
        </section>

        <section className="container grid gap-6 px-4 pb-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            {activeSeries.length > 0 && (
              <section className="research-map-strip max-w-5xl">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-white">
                    <Map className="h-5 w-5 text-slate-400" />
                    <h2 className="text-base font-semibold">
                      {t("home.activeSeries")}
                    </h2>
                  </div>
                  <Link
                    href="#research-index"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    {t("home.researchIndexKicker")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="research-series-grid">
                  {activeSeries.map(({ track, series }) => (
                    <Link
                      key={series.slug}
                      href={trackConfigs[track].href}
                      className="series-card"
                    >
                      <span className="series-card-track">
                        {t(
                          track === "algorithms"
                            ? "home.algorithmsLabel"
                            : "home.applicationsLabel"
                        )}
                      </span>
                      <h3>{t(series.titleKey)}</h3>
                      <p>{t(series.promiseKey)}</p>
                      <div className="series-card-concepts">
                        {series.conceptKeys.slice(0, 3).map(key => (
                          <span key={key}>{t(key)}</span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-6 flex max-w-3xl flex-wrap gap-2">
              <Link href="/search" className="article-tag">
                {t("nav.search")}
              </Link>
              <Link href="/archive" className="article-tag">
                {t("nav.archive")}
              </Link>
              <Link href="/categories/ai-algorithms" className="article-tag">
                {t("home.algorithmsLabel")}
              </Link>
              <Link href="/categories/ai-applications" className="article-tag">
                {t("home.applicationsLabel")}
              </Link>
            </div>

            <SubscriptionForm className="mt-6 max-w-3xl" surface="home" />

            {hasMeaningfulStats && (
              <div className="mt-9 grid max-w-3xl gap-3 sm:grid-cols-3">
                <StatTile
                  icon={<FileText className="h-5 w-5" />}
                  value={publishedPosts.length}
                  label={t("home.statArticles")}
                />
                <StatTile
                  icon={<Folder className="h-5 w-5" />}
                  value={categories?.length || 0}
                  label={t("home.statCategories")}
                />
                <StatTile
                  icon={<Eye className="h-5 w-5" />}
                  value={totalViews}
                  label={t("home.statViews")}
                />
              </div>
            )}
          </div>

          <aside className="grid gap-5 self-start lg:pt-1">
            <section className="glass-panel home-sidebar-panel p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-white">
                <UserRound className="h-5 w-5 text-slate-400" />
                <h2 className="text-lg font-semibold">
                  {t("home.aboutTitle")}
                </h2>
              </div>
              <p className="text-sm leading-7 text-slate-300">
                {t("home.aboutDescription")}
              </p>

              <div className="mt-7 flex items-center gap-2 text-white">
                <GitBranch className="h-5 w-5 text-slate-400" />
                <h3 className="text-sm font-semibold">
                  {t("home.researchDirection")}
                </h3>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {focusTagKeys.slice(0, 4).map(key => (
                  <span
                    key={key}
                    className="home-sidebar-chip rounded-lg border px-3 py-1.5 text-xs text-slate-200"
                  >
                    {t(key)}
                  </span>
                ))}
              </div>

              <div className="mt-7 flex items-center gap-2 text-white">
                <BookOpen className="h-5 w-5 text-slate-400" />
                <h3 className="text-sm font-semibold">
                  {t("home.recentFocus")}
                </h3>
              </div>
              <ul className="home-focus-list mt-4 space-y-3 text-[0.82rem] leading-6 text-slate-400">
                <li>{t("home.recentFocus1")}</li>
                <li>{t("home.recentFocus2")}</li>
              </ul>
            </section>

            <section className="glass-panel p-5">
              <div className="mb-4 flex items-center gap-2 text-white">
                <Tags className="h-5 w-5 text-slate-400" />
                <h2 className="text-base font-semibold">{t("home.hotTags")}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleTags.slice(0, 8).map(tag =>
                  tag.slug ? (
                    <Link
                      key={tag.id ?? tag.name}
                      href={`/tags/${tag.slug}`}
                      className="rounded-lg border border-slate-600/50 bg-slate-900/55 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500 hover:text-white"
                    >
                      {tag.name}
                    </Link>
                  ) : (
                    <span
                      key={tag.id ?? tag.name}
                      className="rounded-lg border border-slate-600/50 bg-slate-900/55 px-3 py-1.5 text-xs text-slate-300"
                    >
                      {tag.name}
                    </span>
                  )
                )}
              </div>
            </section>
          </aside>
        </section>

        <section
          id="research-index"
          className="container research-grid px-4 pb-16 sm:px-6"
        >
          <div className="glass-panel research-section-panel">
            <div className="section-heading-row">
              <h2 className="section-title">{t("home.latestArticles")}</h2>
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
              <div className="grid gap-4">
                {[1, 2].map(item => (
                  <div key={item} className="article-skeleton" />
                ))}
              </div>
            ) : posts?.posts?.length ? (
              <div className="grid gap-4">
                {publishedPosts.map((post: any, index: number) => (
                  <ArticleCard
                    key={post.id}
                    post={post}
                    index={index}
                    language={language}
                    t={t}
                    track={getArticleTrack(post)}
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
            <h2 className="section-title">{t("home.researchIndex")}</h2>
            <div className="research-index-list">
              <Link href="/algorithms" className="research-index-row">
                <span>{t("home.algorithmsLabel")}</span>
                <span className="text-slate-400">{t("home.indexModels")}</span>
              </Link>
              <Link href="/applications" className="research-index-row">
                <span>{t("home.applicationsLabel")}</span>
                <span className="text-slate-400">{t("home.indexSystems")}</span>
              </Link>
              <Link href="/tags/harness-engine" className="research-index-row">
                <span>{t("home.indexAgentHarness")}</span>
                <span className="text-slate-400">
                  {t("home.indexEvaluation")}
                </span>
              </Link>
            </div>
          </aside>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-slate-950/40">
        <div className="container flex flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>{t("common.copyright")}</p>
          <p>{t("home.footerTagline")}</p>
        </div>
      </footer>
    </div>
  );
}
