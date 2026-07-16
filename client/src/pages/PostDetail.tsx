import { useAuth } from "@/_core/hooks/useAuth";
import { ArticleFeedback } from "@/components/ArticleFeedback";
import {
  SeriesProgress,
  type SeriesProgressLink,
} from "@/components/SeriesProgress";
import {
  SiteHeader,
  SpaceBackdrop,
} from "@/components/ResearchShell";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { openBlogAgentWithPrompt } from "@/components/agent/routeContext";
import { Button } from "@/components/ui/button";
import { ARTICLE_READER_LAYOUT } from "@/lib/articleLayout";
import { getPublicArticleTitle } from "@/lib/publicArticles";
import { trackConfigs } from "@/lib/tracks";
import { trpc } from "@/lib/trpc";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import {
  buildArticleJsonLd,
  buildArticleMetadata,
  buildRouteMetadata,
} from "@shared/metadata";
import { extractMarkdownHeadingAnchors } from "@shared/heading-anchors";
import {
  estimateArticleReadingMinutes,
  stripMatchingMarkdownTitle,
} from "@shared/reading-time";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Eye,
  Edit,
  Copy,
  Folder,
  Mail,
  GraduationCap,
  Tags,
  Twitter,
  Linkedin,
  MessageCircle,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useCallback,
  useRef,
  type CSSProperties,
} from "react";

import { toast } from "sonner";

const MarkdownRenderer = lazy(() => import("@/components/MarkdownRenderer"));

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

export type ArticleHeading = {
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

export type ArticleCompletionLink = {
  kind: "series-next" | "post-next" | "track" | "related";
  href: string;
  label: string;
  title: string;
  primary: boolean;
};

export type ArticleRequestState = "loading" | "ready" | "not-found" | "error";

export function getArticleRequestState(input: {
  isLoading: boolean;
  isError: boolean;
  errorCode?: string;
  hasPost: boolean;
}): ArticleRequestState {
  if (input.isLoading) return "loading";
  if (input.isError) {
    return input.errorCode === "NOT_FOUND" ? "not-found" : "error";
  }
  return input.hasPost ? "ready" : "not-found";
}

const articleAgentPromptKeys = [
  "agent.prompts.postAbstraction",
  "agent.prompts.nextReading",
];

const articleReaderLayoutStyle = {
  "--article-prose-min": `${ARTICLE_READER_LAYOUT.proseMeasure.min}ch`,
  "--article-prose-target": `${ARTICLE_READER_LAYOUT.proseMeasure.target}ch`,
  "--article-prose-max": `${ARTICLE_READER_LAYOUT.proseMeasure.max}ch`,
  "--article-toc-rail-width": `${ARTICLE_READER_LAYOUT.tocRailWidthRem}rem`,
  "--article-continuation-max": `${ARTICLE_READER_LAYOUT.continuation.maxMeasure}ch`,
  "--article-response-split-min": `${ARTICLE_READER_LAYOUT.continuation.responseSplitMinViewportPx}px`,
} as CSSProperties;

export function buildArticleCompletionLinks({
  seriesNext,
  postNext,
  related = [],
  continueTrackHref,
  continueTrackLabel,
  t,
}: {
  seriesNext?: PostLink | null;
  postNext?: PostLink | null;
  related?: PostLink[] | null;
  continueTrackHref: string;
  continueTrackLabel: string;
  t: Translate;
}): ArticleCompletionLink[] {
  const links: ArticleCompletionLink[] = [];
  const usedSlugs = new Set<string>();
  let hasPrimary = false;

  const addArticleLink = (
    kind: ArticleCompletionLink["kind"],
    label: string,
    link?: PostLink | null,
    primary = false
  ) => {
    if (!link || usedSlugs.has(link.slug)) return;
    links.push({
      kind,
      href: `/post/${link.slug}`,
      label,
      title: link.title,
      primary,
    });
    usedSlugs.add(link.slug);
    hasPrimary ||= primary;
  };

  addArticleLink(
    "series-next",
    t("post.handoff.nextInSeries"),
    seriesNext,
    true
  );

  if (!hasPrimary) {
    addArticleLink("post-next", t("post.handoff.nextArticle"), postNext, true);
  }

  links.push({
    kind: "track",
    href: continueTrackHref,
    label: t("post.handoff.continueTrack"),
    title: continueTrackLabel,
    primary: !hasPrimary,
  });

  for (const link of related ?? []) {
    if (links.length >= 3) break;
    addArticleLink("related", t("post.handoff.related"), link);
  }

  return links.slice(0, 3);
}

export function resolveArticleHashTarget(
  hash: string,
  headings: ArticleHeading[]
) {
  const encodedTarget = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!encodedTarget) return null;

  let targetId: string;
  try {
    targetId = decodeURIComponent(encodedTarget);
  } catch {
    return null;
  }

  if (!targetId) return null;
  return headings.some(heading => heading.id === targetId) ? targetId : null;
}

export function getArticleHeadingScrollBehavior(
  prefersReducedMotion: boolean
): ScrollBehavior {
  return prefersReducedMotion ? "auto" : "smooth";
}

function getPreferredArticleHeadingScrollBehavior() {
  return getArticleHeadingScrollBehavior(
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
}

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

function MobileToc({
  headings,
  t,
}: {
  headings: ArticleHeading[];
  t: Translate;
}) {
  if (headings.length === 0) return null;

  return (
    <details className="mobile-toc-shell">
      <summary className="cursor-pointer text-sm font-semibold text-white">
        {t("post.toc")}
      </summary>
      <nav className="mobile-toc-nav mt-3 grid gap-2">
        {headings.map(heading => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className="text-sm text-slate-400 hover:text-sky-100"
            style={{
              paddingLeft: `${(heading.level - 1) * 0.75}rem`,
            }}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </details>
  );
}

function scrollToArticleHeading(
  id: string,
  updateHash = false,
  behavior = getPreferredArticleHeadingScrollBehavior()
) {
  const element = document.getElementById(id);
  if (!element) return;

  if (updateHash) {
    window.history.pushState(null, "", `#${encodeURIComponent(id)}`);
  }

  element.scrollIntoView({
    behavior,
    block: "start",
  });
}

function ArticleLoadingState({ t }: { t: Translate }) {
  return (
    <div className="space-page text-foreground">
      <SpaceBackdrop subtle />
      <SiteHeader backHref="/" backLabel={t("nav.back")} compact />
      <main className="container relative z-10 max-w-7xl px-4 py-8 sm:px-6 md:py-12">
        <section className="solid-reading reading-surface article-loading-surface">
          <div className="article-loading-header">
            <p className="technical-label">{t("post.loadingKicker")}</p>
            <h1>{t("post.loadingTitle")}</h1>
            <p>{t("post.loadingBody")}</p>
          </div>
          <div className="route-loading-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="article-loading-actions">
            <Button asChild variant="outline" className="glass-button">
              <Link href="/">{t("post.backHome")}</Link>
            </Button>
            <Button asChild variant="outline" className="glass-button">
              <Link href="/search">{t("nav.search")}</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

function ArticleUnavailableState({
  kind,
  t,
  onRetry,
}: {
  kind: "not-found" | "error";
  t: Translate;
  onRetry?: () => void;
}) {
  const isError = kind === "error";

  return (
    <div className="space-page text-foreground">
      <SpaceBackdrop subtle />
      <SiteHeader backHref="/" backLabel={t("nav.back")} compact />
      <main className="container relative z-10 max-w-7xl px-4 py-8 sm:px-6 md:py-12">
        <section
          className="article-unavailable-surface solid-reading reading-surface"
          aria-labelledby="article-unavailable-title"
        >
          <p className="technical-label">{t("post.loadingKicker")}</p>
          <h1 id="article-unavailable-title">
            {t(isError ? "post.loadErrorTitle" : "post.notFound")}
          </h1>
          <p>
            {t(isError ? "post.loadErrorBody" : "post.notFoundBody")}
          </p>
          <div className="article-loading-actions">
            {isError && onRetry ? (
              <Button type="button" onClick={onRetry}>
                {t("common.retry")}
              </Button>
            ) : null}
            <Button asChild variant="outline" className="glass-button">
              <Link href="/">{t("post.backHome")}</Link>
            </Button>
            <Button asChild variant="outline" className="glass-button">
              <Link href="/search">{t("nav.search")}</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  const [activeHeading, setActiveHeading] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const {
    data: post,
    isLoading,
    isError,
    error: postError,
    refetch: refetchPost,
  } = trpc.posts.getBySlug.useQuery(slug || "", {
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
  const copyResetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (post?.content) {
      const articleContent = stripMatchingMarkdownTitle(
        post.content,
        post.title
      );
      setHeadings(extractMarkdownHeadingAnchors(articleContent));
    }
  }, [post?.content, post?.title]);

  useEffect(() => {
    if (headings.length === 0 || !window.location.hash) return;

    const targetId = resolveArticleHashTarget(window.location.hash, headings);
    if (!targetId) return;

    window.requestAnimationFrame(() => {
      scrollToArticleHeading(targetId);
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

  useEffect(
    () => () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    },
    []
  );

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
      window.open(
        shareUrls.wechat,
        "_blank",
        "noopener,noreferrer,width=400,height=400"
      );
      toast.info(t("post.wechatQRHint"));
    } else if (shareUrls[platform]) {
      window.open(
        shareUrls[platform],
        "_blank",
        "noopener,noreferrer,width=600,height=400"
      );
    }
  };

  const copyEmail = async () => {
    await copyToClipboard("zedpl28174@gmail.com", t("common.emailCopied"));
  };

  const copyCode = useCallback(
    async (code: string, id: string) => {
      const copied = await copyToClipboard(code, t("post.codeCopied"));
      if (!copied) return;
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
      setCopiedCode(id);
      copyResetTimerRef.current = window.setTimeout(() => {
        setCopiedCode(null);
        copyResetTimerRef.current = null;
      }, 2000);
    },
    [copyToClipboard, t]
  );

  const requestState = getArticleRequestState({
    isLoading,
    isError,
    errorCode: postError?.data?.code,
    hasPost: Boolean(post),
  });

  if (requestState === "loading") {
    return <ArticleLoadingState t={t} />;
  }

  if (requestState === "error") {
    return (
      <ArticleUnavailableState
        kind="error"
        t={t}
        onRetry={() => void refetchPost()}
      />
    );
  }

  if (requestState === "not-found" || !post) {
    return <ArticleUnavailableState kind="not-found" t={t} />;
  }

  const articlePost = post as ArticlePostModel;
  const readableContent = stripMatchingMarkdownTitle(
    articlePost.content || "",
    articlePost.title
  );
  const articlePostForReading = { ...articlePost, content: readableContent };
  const readingTime = estimateArticleReadingMinutes(articlePost);
  const postTags = Array.isArray(articlePost.tags) ? articlePost.tags : [];
  const visibleHeaderTags = postTags.slice(0, 1);
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
    articlePostForReading,
    headings,
    t
  );
  const primaryEntryItem =
    articleEntryItems.find(item => item.key === "core") ?? articleEntryItems[0];
  const secondaryEntryItems = articleEntryItems.filter(
    item => item.key !== primaryEntryItem?.key
  );
  const articlePostContext = postContext as PostContextModel | undefined;
  const seriesContext = buildSeriesContext(articlePost, articlePostContext, t);
  const seriesLinks: SeriesProgressLink[] = seriesContext
    ? ([
        !seriesContext.isFirst && seriesContext.first
          ? {
              href: `/post/${seriesContext.first.slug}`,
              label: t("post.series.start"),
              direction: "start" as const,
            }
          : null,
        seriesContext.previous
          ? {
              href: `/post/${seriesContext.previous.slug}`,
              label: t("post.series.previous"),
              direction: "previous" as const,
            }
          : null,
        seriesContext.next
          ? {
              href: `/post/${seriesContext.next.slug}`,
              label: t("post.series.next"),
              direction: "next" as const,
              primary: true,
            }
          : {
              href: continueTrackHref,
              label: t("post.series.track"),
              direction: "track" as const,
            },
      ].filter(Boolean) as SeriesProgressLink[])
    : [];
  const briefSeriesLinks: SeriesProgressLink[] = seriesContext
    ? [
        seriesContext.next
          ? {
              href: `/post/${seriesContext.next.slug}`,
              label: t("post.series.next"),
              direction: "next" as const,
              primary: true,
            }
          : {
              href: continueTrackHref,
              label: t("post.series.track"),
              direction: "track" as const,
              primary: true,
            },
      ]
    : [];
  return (
    <div className="space-page text-foreground">
      <SpaceBackdrop subtle />
      {/* Reading Progress Bar */}
      <div className="reading-progress-bar fixed left-0 top-0 z-[60] h-1" />

      <SiteHeader backHref="/" backLabel={t("nav.back")} compact />

      <main className="paper-reader-container container relative z-10 max-w-7xl px-4 py-8 sm:px-6 md:py-12">
        <div
          className="paper-reader-cockpit"
          data-toc-rail-min-width={ARTICLE_READER_LAYOUT.tocRailMinViewportPx}
          style={articleReaderLayoutStyle}
        >
          <aside className="paper-brief-rail hidden xl:block">
            <div className="paper-brief-card glass-dock liquid-panel sticky top-24">
              <p className="technical-label">{t("post.readerMap")}</p>
              <h2>{t("post.entry.kicker")}</h2>
              <dl className="paper-brief-stats">
                <div>
                  <dt>{t("post.minRead")}</dt>
                  <dd>{readingTime}</dd>
                </div>
                <div>
                  <dt>{t("post.reads")}</dt>
                  <dd>{post.viewCount}</dd>
                </div>
              </dl>
              <div className="paper-brief-route">
                <span>{t("post.readerRoute")}</span>
                <Link href={continueTrackHref}>{continueTrackLabel}</Link>
              </div>
              {(postCategory || visibleHeaderTags.length > 0) && (
                <div
                  className="paper-brief-tags"
                  aria-label={t("post.readerSignals")}
                >
                  {postCategory && (
                    <Link href={`/categories/${postCategory.slug}`}>
                      {postCategory.name}
                    </Link>
                  )}
                  {visibleHeaderTags.map((tag: any) => (
                    <Link key={tag.slug} href={`/tags/${tag.slug}`}>
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="paper-brief-action glass-button"
                onClick={() =>
                  openBlogAgentWithPrompt(t("agent.prompts.postAbstraction"))
                }
              >
                <BookOpen className="h-3.5 w-3.5" />
                {t("post.agentCompanion.title")}
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <article className="reading-surface solid-reading liquid-readable paper-reader-main p-5 sm:p-8 lg:p-10">
            {/* Post Header */}
            <div className="article-reading-header">
              <h1 className="article-page-title">{post.title}</h1>

              <div className="article-reading-meta">
                <time
                  dateTime={
                    post.publishedAt
                      ? new Date(post.publishedAt).toISOString()
                      : undefined
                  }
                  className="flex items-center gap-1.5"
                >
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
                </time>
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
                <div className="article-reading-tags">
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

              {(primaryEntryItem || seriesContext) && (
                <section
                  className="article-entry-layer"
                  aria-label={t("post.entry.title")}
                >
                  <div className="article-entry-brief">
                    {primaryEntryItem && (
                      <dl className="article-entry-grid article-entry-grid-compact">
                        <div
                          className={
                            primaryEntryItem.muted
                              ? "article-entry-item article-entry-item-muted"
                              : "article-entry-item"
                          }
                        >
                          <dt>{primaryEntryItem.label}</dt>
                          <dd>{primaryEntryItem.value}</dd>
                        </div>
                      </dl>
                    )}
                  </div>

                  {seriesContext && (
                    <SeriesProgress
                      variant="compact"
                      label={t("post.series.label")}
                      title={seriesContext.title}
                      meta={seriesContext.positionLabel}
                      promise={seriesContext.promise}
                      links={briefSeriesLinks}
                    />
                  )}

                  {secondaryEntryItems.length > 0 && (
                    <details className="article-entry-details">
                      <summary>{t("post.entry.more")}</summary>
                      <dl className="article-entry-grid">
                        {secondaryEntryItems.map(item => (
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
                    </details>
                  )}
                </section>
              )}
            </div>

            {/* Cover Image */}
            {post.coverImage && (
              <div className="article-cover-frame mb-10 overflow-hidden rounded-lg">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  width={1200}
                  height={675}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  sizes="(min-width: 1024px) 896px, calc(100vw - 48px)"
                  className="h-auto w-full"
                />
              </div>
            )}

            <MobileToc headings={headings} t={t} />

            {/* Post Content */}
            <div className="article-prose">
              <Suspense
                fallback={<div className="h-24 rounded-lg bg-slate-800/40" />}
              >
                <MarkdownRenderer
                  content={readableContent}
                  headings={headings}
                  copiedCode={copiedCode}
                  language={language}
                  copyCodeLabel={t("post.copyCode")}
                  tableLabel={t("post.scrollableTable")}
                  onCopyCode={copyCode}
                />
              </Suspense>
            </div>

            <section
              className="article-continuation-shell"
              aria-labelledby="article-continuation-title"
            >
              <div className="article-continuation-head">
                <div>
                  <p className="technical-label">{t("post.handoff.kicker")}</p>
                  <h2 id="article-continuation-title" className="section-title">
                    {t("post.discoveryTitle")}
                  </h2>
                </div>
                <div className="article-continuation-head-actions">
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
                  <button
                    type="button"
                    className="article-continuation-agent"
                    onClick={() =>
                      openBlogAgentWithPrompt(t(articleAgentPromptKeys[0]))
                    }
                  >
                    <BookOpen className="h-4 w-4" />
                    {t("post.agentCompanion.title")}
                  </button>
                </div>
              </div>

              <div className="article-continuation-path">
                {seriesContext &&
                  (seriesContext.previous || seriesContext.next) && (
                    <SeriesProgress
                      variant="footer"
                      className="article-series-continuation"
                      label={t("post.series.continuity")}
                      title={seriesContext.title}
                      meta={seriesContext.positionLabel}
                      links={
                        [
                          seriesContext.previous
                            ? {
                                href: `/post/${seriesContext.previous.slug}`,
                                label: seriesContext.previous.title,
                                direction: "previous" as const,
                              }
                            : null,
                          seriesContext.next
                            ? {
                                href: `/post/${seriesContext.next.slug}`,
                                label: seriesContext.next.title,
                                direction: "next" as const,
                                primary: true,
                              }
                            : null,
                        ].filter(Boolean) as SeriesProgressLink[]
                      }
                    />
                  )}

                {!seriesContext &&
                  (postContext?.previous || postContext?.next) && (
                    <div className="article-adjacent-nav">
                      {postContext.previous && (
                        <Link
                          href={`/post/${postContext.previous.slug}`}
                          className="article-nav-card glass-control rounded-lg p-4 transition"
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
                          className="article-nav-card glass-control rounded-lg p-4 text-right transition"
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
                  <div className="article-related-cluster">
                    <h3>{t("post.related")}</h3>
                    <div className="article-related-list">
                      {postContext.related.map((related: any) => (
                        <Link
                          key={related.id}
                          href={`/post/${related.slug}`}
                          className="article-related-link glass-control flex items-center justify-between gap-4 rounded-lg px-4 py-3 text-sm text-slate-200 transition hover:text-white"
                        >
                          <span className="line-clamp-1">{related.title}</span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-sky-200" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="article-reader-response-grid">
                <ArticleFeedback
                  postId={post.id}
                  postTitle={post.title}
                  className="article-feedback-panel"
                  embedded
                />
                <SubscriptionForm
                  surface="article"
                  className="article-subscription-panel"
                  embedded
                />
              </div>

              <div className="article-continuation-meta">
                <div className="article-author-note">
                  <h3>{t("post.authorName")}</h3>
                  <p>{t("post.authorBio")}</p>
                  <div className="article-author-actions">
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

                <div
                  className="article-secondary-actions glass-dock liquid-surface"
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
              </div>
            </section>
          </article>

          {/* Table of Contents */}
          <aside className="paper-toc-rail">
            <div className="toc-surface glass-dock liquid-panel sticky top-24 p-5">
              <h3 className="section-title mb-4">{t("post.toc")}</h3>
              <nav className="space-y-2">
                {headings.map(heading => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={`block text-sm transition-colors ${
                      activeHeading === heading.id
                        ? "text-sky-100 font-medium"
                        : "text-slate-400 hover:text-white"
                    }`}
                    style={{ paddingLeft: `${(heading.level - 1) * 0.75}rem` }}
                    onClick={e => {
                      e.preventDefault();
                      scrollToArticleHeading(heading.id, true);
                    }}
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
