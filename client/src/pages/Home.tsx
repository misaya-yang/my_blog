import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  Calendar,
  Edit,
  Eye,
  Moon,
  Search,
  Sun,
  User,
  ArrowRight,
  Mail,
  GraduationCap,
  Rss,
  ArrowUp,
} from "lucide-react";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Home() {
  const { isAdmin, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { data: posts, isLoading } = trpc.posts.list.useQuery({
    status: "published",
    limit: 20,
    orderBy: "publishedAt",
  });

  const { data: categories } = trpc.categories.list.useQuery();

  const filteredPosts = posts?.posts?.filter((post: any) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalViews = posts?.posts?.reduce(
    (sum: number, p: any) => sum + (p.viewCount || 0),
    0
  ) || 0;

  // Scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyEmail = () => {
    navigator.clipboard.writeText("zedpl28174@gmail.com");
    toast.success(language === "en" ? "Email copied!" : "邮箱已复制！");
  };

  // Calculate reading time (words per minute: 200 for English, 300 for Chinese)
  const calculateReadingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return minutes;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 sticky top-0 bg-background/80 backdrop-blur-md z-50 transition-all">
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
              <Button variant="ghost" size="sm" className="text-sm font-medium">
                {t("nav.home")}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm font-medium text-muted-foreground"
              onClick={() => toast.info(t("archive.soon"))}
            >
              {t("nav.archive")}
            </Button>
            <a
              href="https://scholar.google.com/citations?user=6X9HlDAAAAAJ"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="text-sm font-medium gap-1.5">
                <GraduationCap className="h-4 w-4" />
                Scholar
              </Button>
            </a>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm font-medium gap-1.5"
              onClick={copyEmail}
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
            {isAdmin && (
              <Link href="/write">
                <Button size="sm" variant="default" className="ml-1">
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  {t("nav.write")}
                </Button>
              </Link>
            )}
            <div className="w-px h-5 bg-border/60 mx-2" />
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

      {/* Hero Section with Author Info */}
      <section className="py-20 md:py-28 border-b border-border/40">
        <div className="container max-w-4xl px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight tracking-tight">
              {t("home.title")}
            </h1>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {t("home.subtitle")}
            </p>

            {/* Author Card */}
            <div className="flex flex-wrap items-center gap-3 mb-10">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="font-medium text-foreground">Misaya Yang</span>
              </div>
              <div className="w-px h-4 bg-border/60" />
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
                zedpl28174@gmail.com
              </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("home.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-sm bg-muted/30 border-border/60"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border/40 bg-muted/20">
        <div className="container max-w-4xl px-6 py-5">
          <div className="flex gap-10">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {posts?.posts?.length || 0}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("home.articles")}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {categories?.length || 0}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("home.categories")}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {totalViews}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("home.views")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="py-12">
        <div className="container max-w-4xl px-6">
          {isLoading ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse py-8 border-b border-border/40 last:border-0">
                  <div className="h-6 bg-muted/50 rounded w-3/4 mb-4" />
                  <div className="h-4 bg-muted/50 rounded w-1/3 mb-5" />
                  <div className="h-4 bg-muted/50 rounded w-full mb-2" />
                  <div className="h-4 bg-muted/50 rounded w-5/6" />
                </div>
              ))}
            </div>
          ) : filteredPosts && filteredPosts.length > 0 ? (
            <div className="divide-y divide-border/40">
              {filteredPosts.map((post: any) => {
                const readingTime = calculateReadingTime(post.content || "");
                return (
                  <Link key={post.id} href={`/post/${post.slug}`}>
                    <article className="py-8 group cursor-pointer first:pt-0 transition-all hover:bg-muted/10 -mx-4 px-4 rounded-lg">
                      <h2 className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors mb-3 leading-tight">
                        {post.title}
                      </h2>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(post.publishedAt).toLocaleDateString(
                            language === "zh" ? "zh-CN" : "en-US",
                            {
                              year: "numeric",
                              month: language === "zh" ? "long" : "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" />
                          {post.viewCount || 0} {t("post.reads")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5" />
                          {readingTime} min read
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                        {post.excerpt || post.content?.replace(/[#*$\\`\n]/g, " ").substring(0, 200) + "..."}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        {t("home.readMore")}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </article>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-muted-foreground text-sm">{t("home.noArticles")}</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-12 bg-muted/10">
        <div className="container max-w-4xl px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">About</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Research blog by Misaya Yang, focusing on Deep Learning, Transformers, and Algorithm Research.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Contact</h3>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-primary justify-start gap-2"
                  onClick={copyEmail}
                >
                  <Mail className="h-3.5 w-3.5" />
                  zedpl28174@gmail.com
                </Button>
                <a
                  href="https://scholar.google.com/citations?user=6X9HlDAAAAAJ"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-primary justify-start gap-2"
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    Google Scholar
                  </Button>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Subscribe</h3>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-8"
                onClick={() => toast.info("RSS feed coming soon!")}
              >
                <Rss className="h-3.5 w-3.5" />
                RSS Feed
              </Button>
            </div>
          </div>
          <div className="pt-6 border-t border-border/40 text-center text-xs text-muted-foreground">
            <p>{t("footer.copyright")}</p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          size="icon"
          className="fixed bottom-8 right-8 rounded-full shadow-lg z-40"
          onClick={scrollToTop}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
