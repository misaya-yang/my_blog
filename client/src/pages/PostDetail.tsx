import { useAuth } from "@/_core/hooks/useAuth";
import { ArticleFeedback } from "@/components/ArticleFeedback";
import { ResearchWaveVisual, SiteHeader, SpaceBackdrop } from "@/components/ResearchShell";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { buildArticleJsonLd, buildArticleMetadata, buildRouteMetadata } from "@shared/metadata";
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
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { lazy, Suspense, useEffect, useState, useCallback } from "react";

import { toast } from "sonner";

const MarkdownRenderer = lazy(() => import("@/components/MarkdownRenderer"));

function postVisualVariant(slug?: string) {
  if (slug?.includes("agent") || slug?.includes("harness") || slug?.includes("rag")) {
    return "matrix";
  }
  return slug?.includes("isohc") ? "orbit" : "wave";
}

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  const [activeHeading, setActiveHeading] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);

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

  // Reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll spy for TOC
  useEffect(() => {
    const handleScroll = () => {
      const headingElements = headings.map((h) =>
        document.getElementById(h.id)
      );
      const scrollPosition = window.scrollY + 100;

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i];
        if (element && element.offsetTop <= scrollPosition) {
          setActiveHeading(headings[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || "";

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      wechat: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`,
    };

    if (platform === "copy") {
      navigator.clipboard.writeText(url);
      toast.success(t("post.linkCopied"));
    } else if (platform === "wechat") {
      // Open QR code in new window for WeChat sharing
      window.open(shareUrls.wechat, "_blank", "width=400,height=400");
      toast.info(t("post.wechatQRHint"));
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText("zedpl28174@gmail.com");
    toast.success(t("common.emailCopied"));
  };

  const copyCode = useCallback(
    (code: string, id: string) => {
      navigator.clipboard.writeText(code);
      setCopiedCode(id);
      toast.success(t("post.codeCopied"));
      setTimeout(() => setCopiedCode(null), 2000);
    },
    [t]
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
        <div className="relative z-10 h-10 w-10 animate-spin rounded-full border-b-2 border-sky-300"></div>
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
            <Button variant="outline" className="glass-button">{t("post.backHome")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const readingTime = calculateReadingTime(post.content || "");
  const postTags = Array.isArray((post as any).tags) ? (post as any).tags : [];
  const postCategory = (post as any).category;
  const continueTrackHref = postCategory?.slug === "ai-applications" ? "/applications" : "/algorithms";
  const continueTrackLabel = postCategory?.slug === "ai-applications"
    ? t("home.applicationsLabel")
    : t("home.algorithmsLabel");

  return (
    <div className="space-page text-foreground">
      <SpaceBackdrop subtle />
      {/* Reading Progress Bar */}
      <div
        className="fixed left-0 top-0 z-[60] h-1 bg-gradient-to-r from-blue-500 via-sky-300 to-cyan-300 transition-all duration-150"
        style={{ width: `${readingProgress}%` }}
      />

      <SiteHeader backHref="/" backLabel={t("nav.back")} compact />

      <div className="container relative z-10 max-w-7xl px-4 py-8 sm:px-6 md:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Main Content */}
          <article className="glass-panel max-w-4xl p-5 sm:p-8 lg:p-10">
            {/* Post Header */}
            <div className="mb-8">
              <h1 className="display-title mb-5 text-4xl leading-tight text-white md:text-6xl">
                {post.title}
              </h1>

              {/* Author Info */}
              <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-sky-200/10 pb-5">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-sky-300" />
                  <span className="font-medium text-white">{t("post.authorName")}</span>
                </div>
                <div className="h-4 w-px bg-sky-200/20" />
                <a
                  href="https://scholar.google.com/citations?user=6X9HlDAAAAAJ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-sky-200"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  {t("nav.scholar")}
                </a>
                <button
                  onClick={copyEmail}
                  className="flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-sky-200"
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

              {(postCategory || postTags.length > 0) && (
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
                  {postTags.map((tag: any) => (
                    <Link key={tag.slug} href={`/tags/${tag.slug}`} className="article-tag gap-1.5">
                      <Tags className="h-3.5 w-3.5" />
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
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
                  className="h-[150px] sm:h-[180px]"
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
              <details className="mb-8 rounded-lg border border-sky-200/10 bg-slate-950/35 p-4 lg:hidden">
                <summary className="cursor-pointer text-sm font-semibold text-white">
                  {t("post.toc")}
                </summary>
                <nav className="mt-3 grid gap-2">
                  {headings.map((heading) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      className="text-sm text-slate-400 hover:text-sky-200"
                      style={{ paddingLeft: `${(heading.level - 1) * 0.75}rem` }}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </details>
            )}

            {/* Post Content */}
            <div className="article-prose">
              <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-slate-800/40" />}>
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
            <div className="mt-16 border-t border-sky-200/10 pt-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="section-title">{t("post.discoveryTitle")}</h2>
                <Button asChild variant="outline" size="sm" className="glass-button">
                  <Link href={continueTrackHref}>
                    {t("post.continueTrack", { track: continueTrackLabel })}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {(postContext?.previous || postContext?.next) && (
                <div className="grid gap-3 md:grid-cols-2">
                  {postContext.previous && (
                    <Link
                      href={`/post/${postContext.previous.slug}`}
                      className="rounded-lg border border-sky-200/10 bg-slate-950/35 p-4 transition hover:border-sky-300/45"
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
                      className="rounded-lg border border-sky-200/10 bg-slate-950/35 p-4 text-right transition hover:border-sky-300/45"
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
                  <h3 className="mb-3 text-sm font-semibold text-white">{t("post.related")}</h3>
                  <div className="grid gap-3">
                    {postContext.related.map((related: any) => (
                      <Link
                        key={related.id}
                        href={`/post/${related.slug}`}
                        className="flex items-center justify-between gap-4 rounded-lg border border-sky-200/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-200 transition hover:border-sky-300/45 hover:text-white"
                      >
                        <span className="line-clamp-1">{related.title}</span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-sky-300" />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-10 grid gap-8 border-t border-sky-200/10 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
                <ArticleFeedback postId={post.id} postTitle={post.title} embedded />
                <SubscriptionForm surface="article" embedded />
              </div>
            </div>

            <div className="mt-16 border-t border-sky-200/10 pt-8">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="mb-2 text-lg font-semibold text-white">{t("post.authorName")}</h3>
                  <p className="mb-4 text-sm text-slate-400">
                    {t("post.authorBio")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="https://scholar.google.com/citations?user=6X9HlDAAAAAJ"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="glass-button h-8 gap-2">
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
            <div className="glass-panel sticky top-24 p-5">
              <h3 className="section-title mb-4">
                {t("post.toc")}
              </h3>
              <nav className="space-y-2">
                {headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={`block text-sm transition-colors ${
                      activeHeading === heading.id
                        ? "text-sky-200 font-medium"
                        : "text-slate-400 hover:text-white"
                    }`}
                    style={{ paddingLeft: `${(heading.level - 1) * 0.75}rem` }}
                    onClick={(e) => {
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
