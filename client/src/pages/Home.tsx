import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArticleCard,
  type ArticleCardPost,
  type ArticleTrack,
} from "@/components/ArticleCard";
import { SeriesProgress } from "@/components/SeriesProgress";
import {
  SiteHeader,
  SpaceBackdrop,
  StatTile,
} from "@/components/ResearchShell";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { openBlogAgentWithPrompt } from "@/components/agent/routeContext";
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
import { FormEvent, useEffect, useState } from "react";

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

type AtlasNode = {
  href: string;
  positionClass: string;
  key: string;
  label: string;
  meta: string;
};

type TrackCardNode = AtlasNode & {
  track: TrackKind;
  config: (typeof trackConfigs)[TrackKind];
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
  const [showSlowLoading, setShowSlowLoading] = useState(false);

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

  useEffect(() => {
    if (!isLoading) {
      setShowSlowLoading(false);
      return;
    }

    const timer = window.setTimeout(() => setShowSlowLoading(true), 1200);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

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
  const featuredPost = publishedPosts[0];
  const secondaryPosts = publishedPosts.slice(1, 4);
  const latestPosts = publishedPosts.slice(0, 6);
  const trackCards: TrackCardNode[] = portalTracks.map(track => {
    const config = trackConfigs[track];
    const publicCount = countTrackPosts(publishedPosts, track);
    const pathCount = publicSeriesByTrack[track].length;

    return {
      href: config.href,
      positionClass: "",
      key: track,
      track,
      config,
      label: t(
        track === "algorithms"
          ? "home.algorithmsLabel"
          : "home.applicationsLabel"
      ),
      meta: isLoading
        ? t("home.pathsPending")
        : `${t("home.pathCount", { count: pathCount })} / ${t(
            "home.publicNotes",
            { count: publicCount }
          )}`,
    };
  });
  const atlasNodes: AtlasNode[] = trackCards.map((node, index) => ({
    href: node.href,
    positionClass: `atlas-node-${index + 1}`,
    key: node.key,
    label: node.label,
    meta: node.meta,
  }));
  atlasNodes.push({
    href: "/tags/harness-engine",
    positionClass: "atlas-node-3",
    key: "harness",
    label: t("home.indexAgentHarness"),
    meta: t("home.indexEvaluation"),
  });

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
        <section className="atlas-hero container px-4 py-8 sm:px-6 lg:py-10">
          <div className="atlas-hero-grid">
            <div className="atlas-manifest motion-reveal">
              <div className="home-kicker" aria-label={t("home.kicker")}>
                {t("home.kicker")}
              </div>
              <h1 className="home-title text-white">
                {renderHeroTitle(language)}
              </h1>
              <p className="home-subtitle mt-5 text-slate-300">
                {t("home.subtitle")}
              </p>

              <form
                onSubmit={submitSearch}
                className="atlas-search home-search-dock"
              >
                <div className="home-search-dock-title">
                  <BookOpen className="h-5 w-5" />
                  <span>{t("home.activeSeries")}</span>
                </div>
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

              <nav
                className="atlas-hero-links"
                aria-label={t("home.researchIndex")}
              >
                <Link href="/algorithms">{t("home.algorithmsLabel")}</Link>
                <Link href="/applications">{t("home.applicationsLabel")}</Link>
                <button
                  type="button"
                  onClick={() =>
                    openBlogAgentWithPrompt(t("agent.prompts.siteThemes"))
                  }
                >
                  {t("home.askAssistant")}
                </button>
              </nav>
            </div>

            <section
              className="atlas-map-panel motion-reveal"
              aria-label={t("home.researchIndex")}
            >
              <div className="atlas-map-header">
                <div>
                  <span>{t("home.researchIndexKicker")}</span>
                  <h2>{t("home.researchIndex")}</h2>
                </div>
                <Map className="h-5 w-5" />
              </div>

              <div className="atlas-orbit" aria-hidden="true">
                <img
                  src="/images/research-orbit-hero.jpg"
                  alt=""
                  loading="eager"
                  decoding="async"
                  width={1672}
                  height={941}
                />
                <span className="atlas-orbit-line atlas-orbit-line-a" />
                <span className="atlas-orbit-line atlas-orbit-line-b" />
              </div>

              <div className="atlas-node-stack">
                {atlasNodes.map(node => (
                  <Link
                    key={node.key}
                    href={node.href}
                    className={`atlas-node ${node.positionClass}`}
                  >
                    <span>{node.label}</span>
                    <strong>{node.meta}</strong>
                  </Link>
                ))}
              </div>
            </section>

            <aside className="atlas-brief-panel motion-reveal">
              <div className="atlas-brief-head">
                <span>{t("home.latestArticles")}</span>
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
                <div className="grid gap-4" aria-busy="true">
                  <p className="article-loading-copy">
                    {showSlowLoading
                      ? t("home.loadingArticlesSlow")
                      : t("home.loadingArticles")}
                  </p>
                  <div className="article-skeleton">
                    <span />
                    <strong />
                    <em />
                    <i />
                  </div>
                </div>
              ) : featuredPost ? (
                <div className="atlas-featured-note article-card">
                  <Link href={`/post/${featuredPost.slug}`}>
                    <h2>{featuredPost.title}</h2>
                  </Link>
                  <p>{featuredPost.excerpt}</p>
                  <Link href={`/post/${featuredPost.slug}`}>
                    {t("home.readMore")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="article-empty-state">
                  <h3>{t("home.noArticles")}</h3>
                  <p>{t("home.noArticlesRecovery")}</p>
                </div>
              )}

              {secondaryPosts.length > 0 && (
                <div className="atlas-mini-list">
                  {secondaryPosts.map(post => (
                    <Link key={post.id} href={`/post/${post.slug}`}>
                      <span>
                        {post.category?.name ?? t("home.tagResearch")}
                      </span>
                      <strong>{post.title}</strong>
                    </Link>
                  ))}
                </div>
              )}

              {hasMeaningfulStats && (
                <div className="atlas-metric-row">
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
            </aside>
          </div>
        </section>

        <section
          id="research-index"
          className="container atlas-workbench px-4 pb-16 sm:px-6"
        >
          <section className="atlas-latest-panel">
            <div className="section-heading-row">
              <h2 className="section-title">{t("home.latestArticles")}</h2>
              <Link
                href="/archive"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
              >
                {t("nav.archive")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid gap-4" aria-busy="true">
                {[1, 2].map(item => (
                  <div key={item} className="article-skeleton">
                    <span />
                    <strong />
                    <em />
                    <i />
                  </div>
                ))}
              </div>
            ) : latestPosts.length ? (
              <div className="atlas-article-stack">
                {latestPosts.map((post: any, index: number) => (
                  <ArticleCard
                    key={post.id}
                    post={post}
                    index={index}
                    language={language}
                    t={t}
                    track={getArticleTrack(post)}
                    featured={index === 0}
                  />
                ))}
              </div>
            ) : (
              <div className="article-empty-state">
                <h3>{t("home.noArticles")}</h3>
                <p>{t("home.noArticlesRecovery")}</p>
                <div>
                  <Link href="/archive" className="article-tag">
                    {t("nav.archive")}
                  </Link>
                  <Link href="/search" className="article-tag">
                    {t("nav.search")}
                  </Link>
                </div>
              </div>
            )}
          </section>

          <section className="atlas-thread-panel">
            <div className="atlas-panel-title">
              <GitBranch className="h-5 w-5" />
              <h2>{t("home.activeSeries")}</h2>
            </div>

            <div className="atlas-track-tiles">
              {trackCards.map(node => (
                <Link
                  key={node.track}
                  href={node.config.href}
                  className="track-portal-card home-track-card group"
                >
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="home-track-label">{node.label}</div>
                    <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1" />
                  </div>
                  <h3 className="home-track-title">
                    {t(node.config.titleKey)}
                  </h3>
                  <p className="track-portal-copy mt-3 text-sm leading-6 text-slate-300/85">
                    {t(node.config.overviewKey)}
                  </p>
                  <div className="track-portal-cta flex flex-wrap items-center gap-2 text-xs font-medium text-slate-300/75">
                    <span className="inline-flex items-center gap-1.5">
                      <GitBranch className="h-3.5 w-3.5" />
                      {node.meta}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1.5 text-slate-100">
                      {t("home.readMore")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {activeSeries.length > 0 && (
              <div className="research-series-grid">
                {activeSeries.map(({ track, series }) => (
                  <SeriesProgress
                    key={series.slug}
                    variant="card"
                    label={t(
                      track === "algorithms"
                        ? "home.algorithmsLabel"
                        : "home.applicationsLabel"
                    )}
                    title={t(series.titleKey)}
                    promise={t(series.promiseKey)}
                    links={[
                      {
                        href: trackConfigs[track].href,
                        label: t("post.series.track"),
                        direction: "track",
                      },
                    ]}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="atlas-side-panel">
            <section className="atlas-profile-panel">
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

            <section className="atlas-tags-panel">
              <div className="mb-4 flex items-center gap-2 text-white">
                <Tags className="h-5 w-5 text-slate-400" />
                <h2 className="text-base font-semibold">{t("home.hotTags")}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleTags.slice(0, 10).map(tag =>
                  tag.slug ? (
                    <Link
                      key={tag.id ?? tag.name}
                      href={`/tags/${tag.slug}`}
                      className="home-sidebar-chip rounded-lg border px-3 py-1.5 text-xs text-slate-200"
                    >
                      {tag.name}
                    </Link>
                  ) : (
                    <span
                      key={tag.id ?? tag.name}
                      className="home-sidebar-chip rounded-lg border px-3 py-1.5 text-xs text-slate-200"
                    >
                      {tag.name}
                    </span>
                  )
                )}
              </div>
            </section>

            <SubscriptionForm
              className="home-subscription-card"
              surface="home"
            />
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
