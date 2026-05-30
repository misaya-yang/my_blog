import { useAuth } from "@/_core/hooks/useAuth";
import { ResearchWaveVisual, SiteHeader, SpaceBackdrop } from "@/components/ResearchShell";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  Calendar,
  Eye,
  User,
  Edit,
  Copy,
  Check,
  Mail,
  GraduationCap,
  Twitter,
  Linkedin,
  MessageCircle,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.min.css";

import { toast } from "sonner";

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
  const [activeHeading, setActiveHeading] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);

  const { data: post, isLoading } = trpc.posts.getBySlug.useQuery(slug || "");

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
              <div className="mb-5">
                <ResearchWaveVisual
                  variant={postVisualVariant(post.slug)}
                  className="h-[240px] sm:h-[300px]"
                />
              </div>
              <h1 className="mb-5 font-serif text-4xl font-semibold leading-tight text-white md:text-6xl">
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
            </div>

            {/* Cover Image */}
            {post.coverImage && (
              <div className="mb-10 rounded-lg overflow-hidden">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Post Content */}
            <div className="article-prose">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                components={{
                  h1: ({ children, ...props }: any) => {
                    const text = String(children).replace(/\*\*/g, "");
                    const index = headings.findIndex((h) => h.text === text);
                    return (
                      <h1
                        id={index >= 0 ? headings[index].id : undefined}
                        className="mb-5 mt-12 text-3xl font-semibold"
                        {...props}
                      >
                        {children}
                      </h1>
                    );
                  },
                  h2: ({ children, ...props }: any) => {
                    const text = String(children).replace(/\*\*/g, "");
                    const index = headings.findIndex((h) => h.text === text);
                    return (
                      <h2
                        id={index >= 0 ? headings[index].id : undefined}
                        className="mb-4 mt-10 border-b border-sky-200/10 pb-2 text-2xl font-semibold"
                        {...props}
                      >
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ children, ...props }: any) => {
                    const text = String(children).replace(/\*\*/g, "");
                    const index = headings.findIndex((h) => h.text === text);
                    return (
                      <h3
                        id={index >= 0 ? headings[index].id : undefined}
                        className="mb-3 mt-8 text-xl font-semibold"
                        {...props}
                      >
                        {children}
                      </h3>
                    );
                  },
                  pre: ({ children, ...props }: any) => {
                    const codeElement = children?.props;
                    const code = codeElement?.children?.[0];
                    const codeId = `code-${Math.random().toString(36).slice(2)}`;

                    return (
                      <div className="relative group">
                        <pre className="overflow-x-auto" {...props}>
                          {children}
                        </pre>
                        {code && (
                          <button
                            onClick={() => copyCode(code, codeId)}
                            className="absolute right-3 top-3 rounded-md bg-slate-900/80 p-2 opacity-0 transition-colors hover:bg-slate-800 group-hover:opacity-100"
                          >
                            {copiedCode === codeId ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  },
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Author Footer */}
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
