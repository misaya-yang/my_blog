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
  GraduationCap,
  GitBranch,
  Mail,
  Map,
  Search,
  Settings2,
  Sparkles,
  Tags,
  UserRound,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

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

  function copyEmail() {
    navigator.clipboard.writeText("zedpl28174@gmail.com");
    toast.success(t("common.emailCopied"));
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  return (
    <div className="space-page">
      <SpaceBackdrop />
      <SiteHeader active="home" />

      <main className="relative z-10">
        <section className="container grid gap-10 px-4 pb-12 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <div className="signal-chip mb-9">
              <Sparkles className="h-4 w-4 text-sky-300" />
              <span>{t("home.chip1")}</span>
              <span className="text-slate-500">·</span>
              <span>{t("home.chip2")}</span>
              <span className="text-slate-500">·</span>
              <span>{t("home.chip3")}</span>
            </div>

            <h1 className="display-title max-w-5xl text-4xl leading-[1.06] text-white md:text-6xl xl:text-7xl">
              {t("home.title")}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              {t("home.subtitle")}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <div className="glass-panel author-pill flex items-center gap-3 px-3 py-2">
                <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-sky-300 to-blue-700 text-sm font-semibold text-white">
                  MY
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {t("home.authorName")}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t("home.authorRole")}
                  </p>
                </div>
              </div>
              <a
                href="https://scholar.google.com/citations?user=6X9HlDAAAAAJ"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel hero-icon-button"
                aria-label={t("home.googleScholar")}
                title={t("home.googleScholar")}
              >
                <GraduationCap className="h-5 w-5 text-sky-200" />
              </a>
              <button
                type="button"
                onClick={copyEmail}
                className="glass-panel hero-icon-button"
                aria-label={t("nav.email")}
                title="zedpl28174@gmail.com"
              >
                <Mail className="h-5 w-5 text-sky-200" />
              </button>
            </div>

            <div className="mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
              {portalTracks.map(track => {
                const config = trackConfigs[track];
                const publicCount = countTrackPosts(publishedPosts, track);
                const pathCount = publicSeriesByTrack[track].length;
                return (
                  <Link key={track} href={config.href}>
                    <article className="glass-panel track-portal-card group min-h-[12rem] p-5 transition hover:-translate-y-0.5 hover:border-sky-300/60 sm:p-6">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div className="signal-chip">
                          <Sparkles className="h-4 w-4" />
                          {t(
                            track === "algorithms"
                              ? "home.algorithmsLabel"
                              : "home.applicationsLabel"
                          )}
                        </div>
                        <ArrowRight className="h-5 w-5 text-sky-300 transition-transform group-hover:translate-x-1" />
                      </div>
                      <h2 className="display-title text-2xl leading-tight text-white">
                        {t(config.titleKey)}
                      </h2>
                      <p className="track-portal-copy mt-4 text-sm leading-7 text-slate-300">
                        {t(config.overviewKey)}
                      </p>
                      <div className="track-portal-cta flex flex-wrap items-center gap-2 text-xs font-semibold text-sky-200">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/15 px-2.5 py-1">
                          <GitBranch className="h-3.5 w-3.5" />
                          {t("home.pathCount", { count: pathCount })}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/15 px-2.5 py-1">
                          {t("home.publicNotes", { count: publicCount })}
                        </span>
                        <span className="ml-auto inline-flex items-center gap-1.5">
                          {t("home.readMore")}
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>

            {activeSeries.length > 0 && (
              <section className="research-map-strip mt-8 max-w-5xl">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-white">
                    <Map className="h-5 w-5 text-sky-300" />
                    <h2 className="text-base font-semibold">
                      {t("home.activeSeries")}
                    </h2>
                  </div>
                  <Link
                    href="#research-index"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-200 hover:text-white"
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

            <form
              onSubmit={submitSearch}
              className="glass-panel mt-9 flex max-w-3xl items-center gap-4 px-5 py-4"
            >
              <Search className="h-6 w-6 shrink-0 text-slate-400" />
              <label className="sr-only" htmlFor="home-search-query">
                {t("home.searchPlaceholder")}
              </label>
              <Input
                id="home-search-query"
                type="search"
                autoComplete="search"
                placeholder={t("home.searchPlaceholder")}
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                className="h-11 border-0 bg-transparent px-0 text-base font-medium text-white shadow-none placeholder:text-slate-500 focus-visible:ring-0"
              />
              <Button
                type="submit"
                size="sm"
                className="hidden bg-sky-400 text-slate-950 hover:bg-sky-300 sm:inline-flex"
              >
                {t("discovery.searchButton")}
              </Button>
            </form>

            <div className="mt-4 flex max-w-3xl flex-wrap gap-2">
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
                <UserRound className="h-5 w-5 text-sky-300" />
                <h2 className="text-lg font-semibold">
                  {t("home.aboutTitle")}
                </h2>
              </div>
              <p className="text-sm leading-7 text-slate-300">
                {t("home.aboutDescription")}
              </p>

              <div className="mt-7 flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5 text-cyan-300" />
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
                <BookOpen className="h-5 w-5 text-blue-300" />
                <h3 className="text-sm font-semibold">
                  {t("home.recentFocus")}
                </h3>
              </div>
              <ul className="mt-4 space-y-3 text-[0.82rem] leading-6 text-slate-400">
                <li>• {t("home.recentFocus1")}</li>
                <li>• {t("home.recentFocus2")}</li>
              </ul>
            </section>

            <section className="glass-panel p-5">
              <div className="mb-4 flex items-center gap-2 text-white">
                <Tags className="h-5 w-5 text-blue-300" />
                <h2 className="text-base font-semibold">{t("home.hotTags")}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleTags.slice(0, 8).map(tag =>
                  tag.slug ? (
                    <Link
                      key={tag.id ?? tag.name}
                      href={`/tags/${tag.slug}`}
                      className="rounded-lg border border-slate-600/50 bg-slate-900/55 px-3 py-1.5 text-xs text-slate-300 hover:border-sky-300/45 hover:text-white"
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
                <span className="text-sky-300">{t("home.indexModels")}</span>
              </Link>
              <Link href="/applications" className="research-index-row">
                <span>{t("home.applicationsLabel")}</span>
                <span className="text-sky-300">{t("home.indexSystems")}</span>
              </Link>
              <Link href="/tags/harness-engine" className="research-index-row">
                <span>{t("home.indexAgentHarness")}</span>
                <span className="text-sky-300">
                  {t("home.indexEvaluation")}
                </span>
              </Link>
            </div>
          </aside>
        </section>
      </main>

      <footer className="relative z-10 border-t border-sky-200/10 bg-slate-950/40">
        <div className="container flex flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>{t("common.copyright")}</p>
          <p>{t("home.footerTagline")}</p>
        </div>
      </footer>
    </div>
  );
}
