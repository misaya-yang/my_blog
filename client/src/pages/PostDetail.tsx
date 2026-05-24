import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  Calendar,
  Eye,
  Moon,
  Sun,
  User,
  Share2,
  Edit,
  ArrowLeft,
  Copy,
  Check,
  Mail,
  GraduationCap,
  Twitter,
  Linkedin,
  MessageCircle,
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
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

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAdmin, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [, setLocation] = useLocation();
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
      toast.info("Scan QR code to share on WeChat");
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText("zedpl28174@gmail.com");
    toast.success(language === "en" ? "Email copied!" : "邮箱已复制！");
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {t("post.notFound")}
          </h1>
          <Link href="/">
            <Button variant="outline">{t("post.backHome")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const readingTime = calculateReadingTime(post.content || "");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-primary z-[60] transition-all duration-150"
        style={{ width: `${readingProgress}%` }}
      />

      {/* Header */}
      <header className="border-b border-border/40 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="container flex items-center justify-between h-16 px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lg font-semibold text-foreground hover:text-primary transition-colors"
          >
            <BookOpen className="h-5 w-5" />
            <span className="tracking-tight">AI Tech Blog</span>
          </Link>

          <nav className="flex items-center gap-1.5">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm text-muted-foreground gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("nav.back")}
              </Button>
            </Link>
            <div className="w-px h-5 bg-border/60 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-xs font-medium px-2.5"
            >
              {language === "en" ? "中文" : "EN"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            {isAuthenticated ? (
              <Button size="sm" variant="ghost" className="text-sm">
                <User className="h-3.5 w-3.5 mr-1.5" />
                {isAdmin ? t("nav.admin") : t("nav.user")}
              </Button>
            ) : (
              <a href="/login">
                <Button size="sm" variant="outline" className="text-sm">
                  {t("nav.login")}
                </Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      <div className="container max-w-7xl py-10 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-12">
          {/* Main Content */}
          <article className="max-w-3xl">
            {/* Post Header */}
            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-5 leading-tight tracking-tight">
                {post.title}
              </h1>

              {/* Author Info */}
              <div className="flex flex-wrap items-center gap-3 mb-5 pb-5 border-b border-border/40">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Misaya Yang</span>
                </div>
                <div className="w-px h-4 bg-border/60" />
                <a
                  href="https://scholar.google.com/citations?user=6X9HlDAAAAAJ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  Scholar
                </a>
                <button
                  onClick={copyEmail}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
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
                  {readingTime} min read
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => handleShare("twitter")}
                >
                  <Twitter className="h-3.5 w-3.5" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => handleShare("linkedin")}
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => handleShare("wechat")}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WeChat
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => handleShare("copy")}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {t("post.copyLink")}
                </Button>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 gap-1.5"
                    onClick={() => toast.info(t("post.editSoon"))}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    {t("post.edit")}
                  </Button>
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
            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-headings:tracking-tight prose-p:leading-relaxed prose-li:leading-relaxed prose-pre:relative prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
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
                        className="text-3xl font-bold mt-12 mb-5"
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
                        className="text-2xl font-bold mt-10 mb-4 pb-2 border-b border-border/40"
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
                        className="text-xl font-semibold mt-8 mb-3"
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
                            className="absolute top-3 right-3 p-2 rounded-md bg-muted/80 hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
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
            <div className="mt-16 pt-8 border-t border-border/40">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Misaya Yang</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Researcher focusing on Deep Learning, Transformers, Large Language Models, and Position Encoding.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="https://scholar.google.com/citations?user=6X9HlDAAAAAJ"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="gap-2 h-8">
                        <GraduationCap className="h-4 w-4" />
                        Google Scholar
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 h-8"
                      onClick={copyEmail}
                    >
                      <Mail className="h-4 w-4" />
                      Contact
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Table of Contents */}
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">
                Table of Contents
              </h3>
              <nav className="space-y-2">
                {headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={`block text-sm transition-colors ${
                      activeHeading === heading.id
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
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
