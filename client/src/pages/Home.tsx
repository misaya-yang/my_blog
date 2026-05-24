import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Edit,
  Eye,
  GraduationCap,
  LogOut,
  Mail,
  Moon,
  Search,
  Sun,
  UserRound,
} from "lucide-react";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";

function readingTime(content: string) {
  const chinese = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const english = (content.match(/[a-zA-Z]+/g) || []).length;
  return Math.max(1, Math.ceil((chinese + english) / 320));
}

function formatDate(value: string | Date | null, locale: string) {
  if (!value) return "Draft";
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Home() {
  const { isAdmin, isAuthenticated, displayName, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery.trim().toLowerCase());

  const { data: posts, isLoading } = trpc.posts.list.useQuery({
    status: "published",
    limit: 20,
    orderBy: "publishedAt",
  });

  const { data: categories } = trpc.categories.list.useQuery();

  const filteredPosts = useMemo(() => {
    const list = posts?.posts ?? [];
    if (!deferredSearch) return list;
    return list.filter((post: any) => {
      const haystack = `${post.title} ${post.excerpt ?? ""} ${post.content ?? ""}`.toLowerCase();
      return haystack.includes(deferredSearch);
    });
  }, [deferredSearch, posts?.posts]);

  const totalViews =
    posts?.posts?.reduce((sum: number, post: any) => sum + (post.viewCount || 0), 0) || 0;

  const copyEmail = () => {
    navigator.clipboard.writeText("zedpl28174@gmail.com");
    toast.success(language === "en" ? "Email copied" : "邮箱已复制");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/88 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center border border-border/80 bg-card text-sm font-semibold">
              MY
            </span>
            <span className="hidden text-sm font-semibold sm:block">Misaya Research</span>
          </Link>

          <nav className="flex items-center gap-1">
            <a
              href="https://scholar.google.com/citations?user=6X9HlDAAAAAJ"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Scholar</span>
              </Button>
            </a>
            <Button variant="ghost" size="sm" className="gap-2" onClick={copyEmail}>
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </Button>
            {isAdmin && (
              <Link href="/write">
                <Button size="sm" className="gap-2">
                  <Edit className="h-4 w-4" />
                  写作
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={toggleLanguage}>
              {language === "en" ? "中文" : "EN"}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {isAuthenticated ? (
              <Button variant="ghost" size="sm" className="gap-2" onClick={logout}>
                <UserRound className="h-4 w-4" />
                <span className="hidden max-w-28 truncate sm:inline">{displayName}</span>
                <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="outline">
                  {t("nav.login")}
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container px-6 py-10 md:py-14">
        <section className="grid gap-10 border-b border-border/60 pb-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm text-muted-foreground">Deep learning notes, proofs, and experiments</p>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              把深度学习研究写成可以复查的现场记录。
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
              这里整理 Transformer、位置编码、长上下文和实验方法论。文章会尽量保留推导的骨架、
              证据的边界，以及那些论文正文里放不下的判断。
            </p>
          </div>

          <aside className="self-end border-l border-border/70 pl-6">
            <h2 className="text-sm font-semibold">Current Focus</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              EVQ-Cosh, RoPE frequency allocation, long-context diagnostics, and how to make
              research claims survive reproduction pressure.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-2xl font-semibold">{posts?.posts?.length || 0}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t("home.articles")}</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">{categories?.length || 0}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t("home.categories")}</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">{totalViews}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t("home.views")}</div>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-8 py-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <h2 className="text-sm font-semibold">Research Index</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              按发布时间排列。每篇文章都尽量标明主张、证据和限制。
            </p>
            <div className="relative mt-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("home.search")}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="min-w-0">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-28 animate-pulse border border-border/60 bg-muted/20" />
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="divide-y divide-border/60 border-y border-border/60">
                {filteredPosts.map((post: any) => (
                  <Link key={post.id} href={`/post/${post.slug}`}>
                    <article className="group grid gap-4 py-7 transition-colors hover:bg-muted/20 md:grid-cols-[150px_minmax(0,1fr)_32px]">
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(post.publishedAt, language === "zh" ? "zh-CN" : "en-US")}
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="h-3.5 w-3.5" />
                          {post.viewCount || 0} {t("post.reads")}
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-3.5 w-3.5" />
                          {readingTime(post.content || "")} min
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-2xl font-semibold leading-snug transition-colors group-hover:text-primary">
                          {post.title}
                        </h3>
                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
                          {post.excerpt ||
                            `${post.content?.replace(/[#*$\\`\n]/g, " ").slice(0, 220)}...`}
                        </p>
                      </div>

                      <ArrowRight className="mt-2 hidden h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary md:block" />
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="border-y border-border/60 py-16 text-center text-sm text-muted-foreground">
                {t("home.noArticles")}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="container flex flex-col gap-3 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>{t("footer.copyright")}</p>
          <p>Misaya Yang · Transformer systems · Long-context mechanisms</p>
        </div>
      </footer>
    </div>
  );
}
