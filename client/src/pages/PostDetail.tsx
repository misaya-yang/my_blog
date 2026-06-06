import { useAuth } from "@/_core/hooks/useAuth";
import { ArticleFeedback } from "@/components/ArticleFeedback";
import {
  ResearchWaveVisual,
  SiteHeader,
  SpaceBackdrop,
} from "@/components/ResearchShell";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { openBlogAgentWithPrompt } from "@/components/agent/routeContext";
import { Button } from "@/components/ui/button";
import { getPublicArticleTitle } from "@/lib/publicArticles";
import { trackConfigs } from "@/lib/tracks";
import { trpc } from "@/lib/trpc";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import {
  buildArticleJsonLd,
  buildArticleMetadata,
  buildRouteMetadata,
} from "@shared/metadata";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Eye,
  User,
  Edit,
  Copy,
  Folder,
  Mail,
  GraduationCap,
  Tags,
  Twitter,
  Linkedin,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { lazy, Suspense, useEffect, useState, useCallback } from "react";

import { toast } from "sonner";

const MarkdownRenderer = lazy(() => import("@/components/MarkdownRenderer"));

function postVisualVariant(slug?: string) {
  if (
    slug?.includes("agent") ||
    slug?.includes("harness") ||
    slug?.includes("rag")
  ) {
    return "matrix";
  }
  return slug?.includes("isohc") ? "orbit" : "wave";
}

type Translate = (
  key: string,
  vars?: Record<string, string | number>
) => string;

type ArticleTag = {
  slug: string;
  name: string;
};

type ArticleCategory = {
  slug: string;
  name: string;
};

type ArticlePostModel = {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt?: string | null;
  seriesSlug?: string | null;
  seriesTitle?: string | null;
  seriesOrder?: number | null;
  category?: ArticleCategory | null;
  tags?: ArticleTag[];
};

type PostLink = {
  slug: string;
  title: string;
};

type PostContextModel = {
  previous?: PostLink | null;
  next?: PostLink | null;
  related?: PostLink[] | null;
};

type ArticleHeading = {
  id: string;
  text: string;
  level: number;
};

type ArticleEntryItem = {
  key: string;
  label: string;
  value: string;
  muted?: boolean;
};

type SeriesContext = {
  title: string;
  promise: string;
  positionLabel: string;
  previous?: PostLink;
  next?: PostLink;
  first?: PostLink;
  isFirst: boolean;
};

const articleAgentPromptKeys = [
  "agent.prompts.postAbstraction",
  "agent.prompts.postImplementation",
  "agent.prompts.nextReading",
];

function buildArticleEntryItems(
  post: ArticlePostModel,
  headings: ArticleHeading[],
  t: Translate
): ArticleEntryItem[] {
  const excerpt = cleanText(post.excerpt ?? "");
  const boundary = extractSectionPreview(post.content, [
    "problem boundary",
    "design boundary",
    "motivation",
  ]);
  const abstraction = buildMainAbstraction(post, headings);
  const background = buildRequiredBackground(post.tags ?? []);
  const implementation = buildImplementationMapping(post.content, headings, t);
  const limitations = extractSectionPreview(post.content, [
    "limits and boundaries",
    "boundaries",
    "evidence framing",
    "failure modes",
  ]);

  return [
    excerpt
      ? {
          key: "core",
          label: t("post.entry.coreClaim"),
          value: truncateText(excerpt, 280),
        }
      : null,
    background
      ? {
          key: "background",
          label: t("post.entry.background"),
          value: background,
        }
      : null,
    boundary
      ? {
          key: "boundary",
          label: t("post.entry.problemBoundary"),
          value: boundary,
        }
      : null,
    abstraction
      ? {
          key: "abstraction",
          label: t("post.entry.mainAbstraction"),
          value: abstraction,
        }
      : null,
    implementation
      ? {
          key: "implementation",
          label: t("post.entry.implementation"),
          value: implementation,
        }
      : null,
    limitations
      ? {
          key: "limitations",
          label: t("post.entry.limitations"),
          value: limitations,
        }
      : {
          key: "limitations",
          label: t("post.entry.limitations"),
          value: t("post.entry.limitationsFallback"),
          muted: true,
        },
  ].filter(Boolean) as ArticleEntryItem[];
}

function buildSeriesContext(
  post: ArticlePostModel,
  postContext: PostContextModel | undefined,
  t: Translate
): SeriesContext | null {
  const candidates = Object.values(trackConfigs).flatMap(track =>
    track.series.filter(series => series.postSlugs.includes(post.slug))
  );
  const match =
    candidates.find(series => series.slug === post.seriesSlug) ?? candidates[0];

  if (!match) return null;

  const seriesSlugs = match.postSlugs;
  const currentIndex = seriesSlugs.indexOf(post.slug);
  if (currentIndex < 0) return null;

  const toPostLink = (slug: string): PostLink => ({
    slug,
    title: resolvePostTitle(slug, post, postContext),
  });

  return {
    title: t(match.titleKey),
    promise: t(match.promiseKey),
    positionLabel: t("post.series.position", {
      current: currentIndex + 1,
      total: seriesSlugs.length,
    }),
    previous: seriesSlugs[currentIndex - 1]
      ? toPostLink(seriesSlugs[currentIndex - 1])
      : undefined,
    next: seriesSlugs[currentIndex + 1]
      ? toPostLink(seriesSlugs[currentIndex + 1])
      : undefined,
    first: seriesSlugs[0] ? toPostLink(seriesSlugs[0]) : undefined,
    isFirst: currentIndex === 0,
  };
}

function resolvePostTitle(
  slug: string,
  currentPost: ArticlePostModel,
  postContext: PostContextModel | undefined
) {
  if (slug === currentPost.slug) return currentPost.title;
  const contextLinks = [
    postContext?.previous,
    postContext?.next,
    ...(postContext?.related ?? []),
  ].filter(Boolean) as PostLink[];
  return (
    contextLinks.find(link => link.slug === slug)?.title ??
    getPublicArticleTitle(slug)
  );
}

function buildMainAbstraction(
  post: ArticlePostModel,
  headings: ArticleHeading[]
) {
  const priorityTagSlugs = [
    "agent-loop",
    "harness-engine",
    "context-compiler",
    "agentic-rag",
    "knowledge-base",
    "isohc",
    "residual-stability",
    "rope",
    "position-encoding",
  ];
  const primaryTag = priorityTagSlugs
    .map(slug => (post.tags ?? []).find(tag => tag.slug === slug))
    .find(Boolean);
  const technicalHeading = headings.find(heading => {
    const normalized = normalizeText(stripHeadingPrefix(heading.text));
    return (
      heading.level <= 2 &&
      !normalized.includes("boundary") &&
      !normalized.includes("motivation") &&
      !normalized.includes("references") &&
      !normalized.includes("core takeaway")
    );
  });

  const parts = [
    primaryTag?.name,
    technicalHeading ? stripHeadingPrefix(technicalHeading.text) : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" / ") : "";
}

function buildRequiredBackground(tags: ArticleTag[]) {
  const genericSlugs = new Set([
    "agent-systems",
    "transformer",
    "evaluation",
    "observability",
    "ai",
  ]);
  const backgroundTags = tags
    .filter(tag => !genericSlugs.has(tag.slug))
    .slice(0, 4)
    .map(tag => tag.name);

  return backgroundTags.join(" / ");
}

function buildImplementationMapping(
  content: string,
  headings: ArticleHeading[],
  t: Translate
) {
  const signals: string[] = [];
  if (/```/.test(content)) signals.push(t("post.entry.signalCode"));
  if (/\n\|.+\|\n\|[-:\s|]+\|/.test(content))
    signals.push(t("post.entry.signalTable"));
  if (/\$\$|\\\(|\\\[/.test(content))
    signals.push(t("post.entry.signalFormula"));
  if (
    headings.some(heading =>
      /implementation|runtime stack|architecture|stack map/i.test(heading.text)
    )
  ) {
    signals.push(t("post.entry.signalArchitecture"));
  }
  if (headings.some(heading => /evaluation|evidence/i.test(heading.text))) {
    signals.push(t("post.entry.signalEvaluation"));
  }

  return Array.from(new Set(signals)).slice(0, 4).join(" / ");
}

function extractSectionPreview(content: string, targetHeadings: string[]) {
  const lines = content.split(/\r?\n/);
  const targetSet = targetHeadings.map(normalizeText);

  for (let index = 0; index < lines.length; index++) {
    const headingMatch = /^(#{2,3})\s+(.+)$/.exec(lines[index]);
    if (!headingMatch) continue;

    const headingText = normalizeText(stripHeadingPrefix(headingMatch[2]));
    if (!targetSet.some(target => headingText.includes(target))) continue;

    const bodyLines: string[] = [];
    for (let bodyIndex = index + 1; bodyIndex < lines.length; bodyIndex++) {
      if (/^#{1,3}\s+/.test(lines[bodyIndex])) break;
      bodyLines.push(lines[bodyIndex]);
    }

    const preview = cleanText(bodyLines.join("\n"));
    if (preview) return truncateText(preview, 260);
  }

  return "";
}

function stripHeadingPrefix(value: string) {
  return value.replace(/^\s*\d+[\).\s-]+/, "").trim();
}

function cleanText(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>#|-]/g, " ")
    .replace(/\$\$/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: string) {
  return cleanText(value).toLowerCase();
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength
    ? `${value.slice(0, maxLength).trim()}...`
    : value;
}

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  const [activeHeading, setActiveHeading] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: post, isLoading } = trpc.posts.getBySlug.useQuery(slug || "", {
    enabled: Boolean(slug),
    retry: false,
  });
  const { data: postContext } = trpc.discovery.postContext.useQuery(
    { slug: slug || "" },
    { enabled: Boolean(slug && post) }
  );
  useSeo(
    post
      ? buildArticleMetadata(siteUrl, post as any)!
      : buildRouteMetadata(siteUrl, {
          title: t("post.notFound"),
          description: t("post.notFound"),
          path: slug ? `/post/${slug}` : "/",
          locale: language === "zh" ? "zh-CN" : "en-US",
          noindex: true,
        }),
    post ? buildArticleJsonLd(siteUrl, post as any) : null
  );

  // Extract headings for TOC
  const [headings, setHeadings] = useState<
    { id: string; text: string; level: number }[]
  >([]);

  useEffect(() => {
    if (post?.content) {
      const headingRegex = /^(#{1,6})\s+(.+)$/gm;
      const matches = Array.from(post.content.matchAll(headingRegex));
      const extractedHeadings = matches.map((match, index) => ({
        id: `heading-${index}`,
        text: match[2].replace(/\*\*/g, ""),
        level: match[1].length,
      }));
      setHeadings(extractedHeadings);
    }
  }, [post?.content]);

  useEffect(() => {
    if (headings.length === 0 || !window.location.hash) return;

    const targetId = decodeURIComponent(window.location.hash.slice(1));
    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [headings, post?.slug]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const nextId = visible[0]?.target.id;
        if (nextId) setActiveHeading(nextId);
      },
      {
        rootMargin: "-18% 0px -65% 0px",
        threshold: [0, 1],
      }
    );

    headings.forEach(heading => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const copyToClipboard = useCallback(
    async (value: string, successMessage: string) => {
      try {
        await navigator.clipboard.writeText(value);
        toast.success(successMessage);
        return true;
      } catch {
        toast.error(t("common.clipboardUnavailable"));
        return false;
      }
    },
    [t]
  );

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const title = post?.title || "";

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      wechat: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`,
    };

    if (platform === "copy") {
      await copyToClipboard(url, t("post.linkCopied"));
    } else if (platform === "wechat") {
      // Open QR code in new window for WeChat sharing
      window.open(shareUrls.wechat, "_blank", "width=400,height=400");
      toast.info(t("post.wechatQRHint"));
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
  };

  const copyEmail = async () => {
    await copyToClipboard("zedpl28174@gmail.com", t("common.emailCopied"));
  };

  const copyCode = useCallback(
    async (code: string, id: string) => {
      const copied = await copyToClipboard(code, t("post.codeCopied"));
      if (!copied) return;
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    },
    [copyToClipboard, t]
  );

  // Calculate reading time
  const calculateReadingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return minutes;
  };

  if (isLoading) {
    return (
      <div className="space-page flex items-center justify-center">
        <SpaceBackdrop subtle />
        <Loader2 className="relative z-10 h-10 w-10 animate-spin text-teal-200" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-page flex items-center justify-center">
        <SpaceBackdrop subtle />
        <div className="glass-panel relative z-10 p-8 text-center">
          <h1 className="mb-4 text-2xl font-bold text-white">
            {t("post.notFound")}
          </h1>
          <Link href="/">
            <Button variant="outline" className="glass-button">
              {t("post.backHome")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const articlePost = post as ArticlePostModel;
  const readingTime = calculateReadingTime(articlePost.content || "");
  const postTags = Array.isArray(articlePost.tags) ? articlePost.tags : [];
  const visibleHeaderTags = postTags.slice(0, 4);
  const remainingHeaderTagCount = Math.max(
    0,
    postTags.length - visibleHeaderTags.length
  );
  const postCategory = articlePost.category;
  const continueTrackHref =
    postCategory?.slug === "ai-applications" ? "/applications" : "/algorithms";
  const continueTrackLabel =
    postCategory?.slug === "ai-applications"
      ? t("home.applicationsLabel")
      : t("home.algorithmsLabel");
  const articleEntryItems = buildArticleEntryItems(
    articlePost,
    headings,
    t
  ).slice(0, 4);
  const seriesContext = buildSeriesContext(
    articlePost,
    postContext as PostContextModel | undefined,
    t
  );

  return (
    <div className="space-page text-foreground">
      <SpaceBackdrop subtle />
      {/* Reading Progress Bar */}
      <div className="reading-progress-bar fixed left-0 top-0 z-[60] h-1" />

      <SiteHeader backHref="/" backLabel={t("nav.back")} compact />

      <div className="container relative z-10 max-w-7xl px-4 py-8 sm:px-6 md:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Main Content */}
          <article className="glass-panel reading-surface max-w-4xl p-5 sm:p-8 lg:p-10">
            {/* Post Header */}
            <div className="mb-8">
              <h1 className="article-page-title mb-5">{post.title}</h1>

              {/* Author Info */}
              <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-white/10 pb-5">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-teal-200" />
                  <span className="font-medium text-white">
                    {t("post.authorName")}
                  </span>
                </div>
                <div className="h-4 w-px bg-white/15" />
                <a
                  href="https://scholar.google.com/citations?user=6X9HlDAAAAAJ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-teal-100"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  {t("nav.scholar")}
                </a>
                <button
                  onClick={copyEmail}
                  className="flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-teal-100"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {t("nav.email")}
                </button>
              </div>

              <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString(
                        language === "zh" ? "zh-CN" : "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                    : t("post.unpublished")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  {post.viewCount} {t("post.reads")}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {readingTime} {t("post.minRead")}
                </span>
              </div>

              {(postCategory || visibleHeaderTags.length > 0) && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {postCategory && (
                    <Link
                      href={`/categories/${postCategory.slug}`}
                      className="article-tag article-tag-primary gap-1.5"
                    >
                      <Folder className="h-3.5 w-3.5" />
                      {postCategory.name}
                    </Link>
                  )}
                  {visibleHeaderTags.map((tag: any) => (
                    <Link
                      key={tag.slug}
                      href={`/tags/${tag.slug}`}
                      className="article-tag gap-1.5"
                    >
                      <Tags className="h-3.5 w-3.5" />
                      {tag.name}
                    </Link>
                  ))}
                  {remainingHeaderTagCount > 0 && (
                    <span className="article-tag article-tag-muted">
                      {t("post.moreTags", { count: remainingHeaderTagCount })}
                    </span>
                  )}
                </div>
              )}

              {(articleEntryItems.length > 0 || seriesContext) && (
                <section
                  className="article-entry-layer"
                  aria-labelledby="article-entry-title"
                >
                  <div className="article-entry-heading">
                    <p className="article-entry-kicker">
                      {t("post.entry.kicker")}
                    </p>
                    <h2 id="article-entry-title">{t("post.entry.title")}</h2>
                  </div>

                  {articleEntryItems.length > 0 && (
                    <dl className="article-entry-grid">
                      {articleEntryItems.map(item => (
                        <div
                          key={item.key}
                          className={
                            item.muted
                              ? "article-entry-item article-entry-item-muted"
                              : "article-entry-item"
                          }
                        >
                          <dt>{item.label}</dt>
                          <dd>{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {seriesContext && (
                    <div className="article-series-inline">
                      <div className="min-w-0">
                        <span className="article-series-label">
                          {t("post.series.label")}
                        </span>
                        <p className="article-series-title">
                          {seriesContext.title}
                        </p>
                        <p className="article-series-meta">
                          {seriesContext.positionLabel}
                          {seriesContext.promise
                            ? ` / ${seriesContext.promise}`
                            : ""}
                        </p>
                      </div>
                      <div className="article-series-actions">
                        {!seriesContext.isFirst && seriesContext.first && (
                          <Link
                            href={`/post/${seriesContext.first.slug}`}
                            className="article-series-action"
                          >
                            {t("post.series.start")}
                          </Link>
                        )}
                        {seriesContext.previous && (
                          <Link
                            href={`/post/${seriesContext.previous.slug}`}
                            className="article-series-action"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            {t("post.series.previous")}
                          </Link>
                        )}
                        {seriesContext.next ? (
                          <Link
                            href={`/post/${seriesContext.next.slug}`}
                            className="article-series-action article-series-action-primary"
                          >
                            {t("post.series.next")}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <Link
                            href={continueTrackHref}
                            className="article-series-action"
                          >
                            {t("post.series.track")}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  <div
                    className="article-agent-prompts"
                    aria-label={t("post.agentCompanion.title")}
                  >
                    <div className="article-agent-prompts-heading">
                      <BookOpen className="h-4 w-4 text-teal-200" />
                      <span>{t("post.agentCompanion.title")}</span>
                    </div>
                    <div className="article-agent-prompt-list">
                      {articleAgentPromptKeys.map(key => {
                        const prompt = t(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            className="article-agent-prompt"
                            onClick={() => openBlogAgentWithPrompt(prompt)}
                          >
                            {prompt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              <div
                className="article-secondary-actions"
                aria-label={t("post.share")}
              >
                <span className="article-secondary-label">
                  {t("post.share")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-button h-8 gap-1.5 text-xs"
                  onClick={() => handleShare("twitter")}
                >
                  <Twitter className="h-3.5 w-3.5" />
                  {t("post.twitter")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-button h-8 gap-1.5 text-xs"
                  onClick={() => handleShare("linkedin")}
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  {t("post.linkedin")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-button h-8 gap-1.5 text-xs"
                  onClick={() => handleShare("wechat")}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {t("post.wechat")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-button h-8 gap-1.5 text-xs"
                  onClick={() => handleShare("copy")}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {t("post.copyLink")}
                </Button>
                {isAdmin && (
                  <Link href={`/write/${post.slug}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="glass-button h-8 gap-1.5 text-xs"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      {t("post.edit")}
                    </Button>
                  </Link>
                )}
              </div>

              <div className="mt-7">
                <ResearchWaveVisual
                  variant={postVisualVariant(post.slug)}
                  className="article-header-visual h-[120px] sm:h-[150px]"
                />
              </div>
            </div>

            {/* Cover Image */}
            {post.coverImage && (
              <div className="mb-10 rounded-lg overflow-hidden">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  decoding="async"
                  fetchPriority="high"
                  sizes="(min-width: 1024px) 896px, calc(100vw - 48px)"
                  className="h-auto w-full"
                />
              </div>
            )}

            {headings.length > 0 && (
              <details className="mb-8 rounded-lg border border-white/10 bg-slate-950/35 p-4 lg:hidden">
                <summary className="cursor-pointer text-sm font-semibold text-white">
                  {t("post.toc")}
                </summary>
                <nav className="mt-3 grid gap-2">
                  {headings.map(heading => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      className="text-sm text-slate-400 hover:text-teal-100"
                      style={{
                        paddingLeft: `${(heading.level - 1) * 0.75}rem`,
                      }}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </details>
            )}

            {/* Post Content */}
            <div className="article-prose">
              <Suspense
                fallback={
                  <div className="h-24 animate-pulse rounded-lg bg-slate-800/40" />
                }
              >
                <MarkdownRenderer
                  content={post.content}
                  headings={headings}
                  copiedCode={copiedCode}
                  copyCodeLabel={t("post.copyCode")}
                  onCopyCode={copyCode}
                />
              </Suspense>
            </div>

            {/* Author Footer */}
            <div className="mt-16 border-t border-white/10 pt-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="section-title">{t("post.discoveryTitle")}</h2>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="glass-button"
                >
                  <Link href={continueTrackHref}>
                    {t("post.continueTrack", { track: continueTrackLabel })}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {seriesContext &&
                (seriesContext.previous || seriesContext.next) && (
                  <div className="article-series-footer mb-6">
                    <div className="mb-4">
                      <span className="article-series-label">
                        {t("post.series.continuity")}
                      </span>
                      <p className="article-series-title">
                        {seriesContext.title} / {seriesContext.positionLabel}
                      </p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {seriesContext.previous && (
                        <Link
                          href={`/post/${seriesContext.previous.slug}`}
                          className="article-series-footer-link"
                        >
                          <span className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-400">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            {t("post.series.previous")}
                          </span>
                          <span className="line-clamp-2 text-sm font-semibold leading-6 text-white">
                            {seriesContext.previous.title}
                          </span>
                        </Link>
                      )}
                      {seriesContext.next && (
                        <Link
                          href={`/post/${seriesContext.next.slug}`}
                          className="article-series-footer-link md:text-right"
                        >
                          <span className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-400 md:justify-end">
                            {t("post.series.next")}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                          <span className="line-clamp-2 text-sm font-semibold leading-6 text-white">
                            {seriesContext.next.title}
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                )}

              {(postContext?.previous || postContext?.next) && (
                <div className="grid gap-3 md:grid-cols-2">
                  {postContext.previous && (
                    <Link
                      href={`/post/${postContext.previous.slug}`}
                      className="rounded-lg border border-white/10 bg-slate-950/35 p-4 transition hover:border-teal-200/35"
                    >
                      <span className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-400">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        {t("post.previous")}
                      </span>
                      <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-white">
                        {postContext.previous.title}
                      </h3>
                    </Link>
                  )}
                  {postContext.next && (
                    <Link
                      href={`/post/${postContext.next.slug}`}
                      className="rounded-lg border border-white/10 bg-slate-950/35 p-4 text-right transition hover:border-teal-200/35"
                    >
                      <span className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-400">
                        {t("post.next")}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                      <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-white">
                        {postContext.next.title}
                      </h3>
                    </Link>
                  )}
                </div>
              )}

              {postContext?.related?.length ? (
                <div className="mt-8">
                  <h3 className="mb-3 text-sm font-semibold text-white">
                    {t("post.related")}
                  </h3>
                  <div className="grid gap-3">
                    {postContext.related.map((related: any) => (
                      <Link
                        key={related.id}
                        href={`/post/${related.slug}`}
                        className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200 transition hover:border-teal-200/35 hover:text-white"
                      >
                        <span className="line-clamp-1">{related.title}</span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-teal-200" />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-10 grid gap-8 border-t border-white/10 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
                <ArticleFeedback
                  postId={post.id}
                  postTitle={post.title}
                  embedded
                />
                <SubscriptionForm surface="article" embedded />
              </div>
            </div>

            <div className="mt-16 border-t border-white/10 pt-8">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {t("post.authorName")}
                  </h3>
                  <p className="mb-4 text-sm text-slate-400">
                    {t("post.authorBio")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="https://scholar.google.com/citations?user=6X9HlDAAAAAJ"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="glass-button h-8 gap-2"
                      >
                        <GraduationCap className="h-4 w-4" />
                        {t("post.googleScholar")}
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      className="glass-button h-8 gap-2"
                      onClick={copyEmail}
                    >
                      <Mail className="h-4 w-4" />
                      {t("post.contact")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Table of Contents */}
          <aside className="hidden lg:block">
            <div className="glass-panel toc-surface sticky top-24 p-5">
              <h3 className="section-title mb-4">{t("post.toc")}</h3>
              <nav className="space-y-2">
                {headings.map(heading => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={`block text-sm transition-colors ${
                      activeHeading === heading.id
                        ? "text-teal-100 font-medium"
                        : "text-slate-400 hover:text-white"
                    }`}
                    style={{ paddingLeft: `${(heading.level - 1) * 0.75}rem` }}
                    onClick={e => {
                      e.preventDefault();
                      document.getElementById(heading.id)?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
