import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ArticleCard, type ArticleCardPost } from "@/components/ArticleCard";
import { SiteHeader } from "@/components/ResearchShell";
import { Reveal } from "@/components/Reveal";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  trackConfigs,
  type TrackKind,
  type TrackSeriesConfig,
} from "@/lib/tracks";
import { trpc } from "@/lib/trpc";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildHomeJsonLd, buildRouteMetadata } from "@shared/metadata";
import { langAttr } from "@/lib/contentLang";

export function getPostPublishedTime(post: ArticleCardPost) {
  if (!post.publishedAt) return 0;
  const time = new Date(post.publishedAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function sortPostsNewestFirst(posts: ArticleCardPost[]) {
  return [...posts].sort((a, b) => {
    const timeDiff = getPostPublishedTime(b) - getPostPublishedTime(a);
    if (timeDiff !== 0) return timeDiff;
    return String(a.title ?? a.slug).localeCompare(String(b.title ?? b.slug));
  });
}

function getLatestSeriesPostTime(
  series: TrackSeriesConfig,
  postsBySlug: Map<string, ArticleCardPost>
) {
  return Math.max(
    0,
    ...series.postSlugs.map(slug => {
      const post = postsBySlug.get(slug);
      return post ? getPostPublishedTime(post) : 0;
    })
  );
}

export function getPrimarySeries(
  publicSeries: TrackSeriesConfig[],
  posts: ArticleCardPost[]
) {
  const postsBySlug = new Map(posts.map(post => [post.slug, post]));
  const sortedSeries = [...publicSeries].sort((a, b) => {
    const timeDiff =
      getLatestSeriesPostTime(b, postsBySlug) -
      getLatestSeriesPostTime(a, postsBySlug);
    if (timeDiff !== 0) return timeDiff;
    return a.slug.localeCompare(b.slug);
  });

  return sortedSeries[0] ?? null;
}

export function getRepresentativePosts(
  posts: ArticleCardPost[],
  track: TrackKind
) {
  const config = trackConfigs[track];
  const trackPosts = posts.filter(
    post => post.category?.slug === config.categorySlug
  );

  return sortPostsNewestFirst(trackPosts).slice(0, 2);
}

export default function Home() {
  const { language, t } = useLanguage();
  const zh = language === "zh";
  const siteUrl = getClientSiteUrl();
  const { data, isLoading, isError, refetch } = trpc.posts.list.useQuery(
    {
      status: "published",
      summaryOnly: true,
      limit: 20,
      orderBy: "publishedAt",
    },
    { staleTime: 60_000, refetchOnWindowFocus: false }
  );
  const posts = useMemo(
    () => sortPostsNewestFirst((data?.posts ?? []) as ArticleCardPost[]),
    [data?.posts]
  );
  const [selectedNote, setSelectedNote] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const featuredPosts = posts.slice(0, 6);
  const featured =
    featuredPosts[
      Math.min(selectedNote, Math.max(0, featuredPosts.length - 1))
    ];
  const outline =
    featured?.outline ??
    featured?.content
      ?.match(/^##\s+.+$/gm)
      ?.slice(0, 3)
      .map(heading => heading.replace(/^##\s+/, "")) ??
    [];
  useSeo(
    buildRouteMetadata(siteUrl, {
      title: t("home.title"),
      description: t("home.subtitle"),
      path: "/",
      locale: zh ? "zh-CN" : "en-US",
    }),
    buildHomeJsonLd(siteUrl)
  );

  return (
    <div className="space-page observatory-home">
      <SiteHeader active="home" />
      <main>
        <div className="observatory-hero-scroll">
          <section
            className="observatory-hero observatory-container"
            aria-labelledby="hero-title"
          >
            <div className="observatory-hero-copy">
              <h1 id="hero-title" lang="en">
                Misaya Notes
              </h1>
              <p>
                {zh
                  ? "模型机制、长上下文与智能体工程。记录推导、实验，以及真正运行过的系统。"
                  : "Model mechanics, long context, and agents. Derivations, experiments, and systems put to the test."}
              </p>
              <div className="observatory-actions">
                <a className="observatory-primary" href="#featured">
                  {zh ? "阅读笔记" : "Read the notes"}
                  <ArrowRight size={18} />
                </a>
                <Link className="observatory-text-link" href="/about">
                  {zh ? "关于我" : "About me"}
                  <ArrowUpRight size={17} />
                </Link>
              </div>
            </div>
            <div
              className="rose-anchor rose-anchor--home"
              data-rose-anchor
              data-rose-follow="0.8"
            />
            <div className="observatory-hero-foot">
              <span>{zh ? "研究与实践" : "Research & practice"}</span>
              <a href="#featured">
                {zh ? "向下探索" : "Scroll to explore"}
                <ArrowRight size={14} />
              </a>
            </div>
          </section>
        </div>

        <div className="observatory-container observatory-content">
          <Reveal>
            <section
              id="featured"
              className="observatory-featured"
              aria-labelledby="recent-notes-title"
            >
              <div className="observatory-featured-heading">
                <h2 id="recent-notes-title">
                  {zh ? "近期笔记" : "Recent notes"}
                </h2>
                <Link className="observatory-text-link" href="/archive">
                  {t("home.allNotes")}
                  <ArrowUpRight size={17} />
                </Link>
              </div>
              {isLoading ? (
                <div className="observatory-loading" role="status">
                  {t("home.loadingArticles")}
                </div>
              ) : featured ? (
                <>
                  <div
                    className="observatory-paper-picker"
                    aria-label={
                      zh ? "切换文章预览" : "Choose an article preview"
                    }
                  >
                    <p className="observatory-label">
                      {zh ? "选择文章" : "Choose a note"}
                    </p>
                    {featuredPosts.map((post, index) => (
                      <div className="observatory-paper-choice" key={post.slug}>
                        <button
                          type="button"
                          aria-pressed={featured.slug === post.slug}
                          aria-controls="recent-note-preview"
                          onFocus={() => setSelectedNote(index)}
                          onClick={() => {
                            setSelectedNote(index);
                            if (matchMedia("(max-width: 899px)").matches) {
                              requestAnimationFrame(() =>
                                previewRef.current?.scrollIntoView({
                                  block: "start",
                                  behavior: matchMedia(
                                    "(prefers-reduced-motion: reduce)"
                                  ).matches
                                    ? "auto"
                                    : "smooth",
                                })
                              );
                            }
                          }}
                        >
                          <span className="observatory-paper-number">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span {...langAttr(post.title)}>{post.title}</span>
                        </button>
                        <Link
                          className="observatory-paper-open"
                          href={`/post/${post.slug}`}
                          aria-label={`${zh ? "阅读文章" : "Read article"}: ${post.title}`}
                        >
                          <ArrowUpRight size={16} aria-hidden="true" />
                        </Link>
                      </div>
                    ))}
                  </div>
                  <div
                    id="recent-note-preview"
                    className="observatory-paper-preview"
                    ref={previewRef}
                  >
                    <div className="observatory-paper-meta">
                      <span>
                        {featured.category?.name ||
                          (zh ? "研究笔记" : "Research note")}
                      </span>
                      {featured.publishedAt && (
                        <time
                          dateTime={new Date(
                            featured.publishedAt
                          ).toISOString()}
                        >
                          {new Date(featured.publishedAt).toLocaleDateString(
                            zh ? "zh-CN" : "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              timeZone: "UTC",
                            }
                          )}
                        </time>
                      )}
                    </div>
                    <Link href={`/post/${featured.slug}`}>
                      <h3 {...langAttr(featured.title)}>{featured.title}</h3>
                    </Link>
                    <p
                      className="observatory-paper-excerpt"
                      {...langAttr(featured.excerpt)}
                    >
                      {featured.excerpt}
                    </p>
                    {outline.length > 0 && (
                      <ul className="observatory-paper-outline">
                        {outline.map(heading => (
                          <li key={heading} {...langAttr(heading)}>
                            {heading}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link
                      className="observatory-text-link"
                      href={`/post/${featured.slug}`}
                    >
                      {t("home.readMore")}
                      <ArrowUpRight size={18} />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="observatory-loading">
                  <p>
                    {isError
                      ? t("home.noArticlesRecovery")
                      : t("home.noArticles")}
                  </p>
                  {isError && (
                    <button
                      className="observatory-text-link"
                      onClick={() => void refetch()}
                    >
                      {zh ? "重新加载" : "Try again"}
                    </button>
                  )}
                </div>
              )}
            </section>
          </Reveal>

          <Reveal>
            <section
              className="observatory-directions"
              aria-labelledby="directions-title"
            >
              <h2 id="directions-title" className="observatory-label">
                {zh ? "研究方向" : "Research directions"}
              </h2>
              <div className="observatory-direction-grid">
                {(["algorithms", "applications"] as const).map(kind => (
                  <Link
                    key={kind}
                    href={trackConfigs[kind].href}
                    className="observatory-direction"
                  >
                    <div>
                      <h3>{t(trackConfigs[kind].titleKey)}</h3>
                      <p>
                        {kind === "algorithms"
                          ? zh
                            ? "深入模型机制、生成建模与长上下文。"
                            : "Inside model mechanics, generative modeling, and long context."
                          : zh
                            ? "构建能持续执行、验证与改进的智能系统。"
                            : "Building agents and systems that execute, verify, and improve."}
                      </p>
                    </div>
                    <ArrowUpRight size={24} />
                  </Link>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section
              id="research-index"
              className="observatory-notes"
              aria-labelledby="notes-title"
            >
              <div className="observatory-section-heading">
                <h2 id="notes-title">{t("home.moreNotes")}</h2>
                <Link className="observatory-text-link" href="/archive">
                  {t("home.allNotes")}
                  <ArrowRight size={17} />
                </Link>
              </div>
              {posts.slice(6, 12).map((post, index) => (
                <ArticleCard
                  key={post.id}
                  showVisual={false}
                  post={post}
                  index={index + 1}
                  language={language}
                  t={t}
                  track={
                    post.category?.slug === "ai-applications"
                      ? "applications"
                      : "algorithms"
                  }
                />
              ))}
            </section>
          </Reveal>

          <section className="observatory-about">
            <p>{t("home.footerTagline")}</p>
            <Link href="/about" className="observatory-text-link">
              {zh ? "认识 Misaya" : "Meet Misaya"}
              <ArrowUpRight size={18} />
            </Link>
          </section>
        </div>
      </main>
      <footer className="observatory-footer observatory-container">
        <p>{t("common.copyright")}</p>
        <Link href="/about">
          Misaya Yang <ArrowUpRight size={13} />
        </Link>
      </footer>
    </div>
  );
}
