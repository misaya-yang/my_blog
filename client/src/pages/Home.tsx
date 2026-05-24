import { useAuth } from "@/_core/hooks/useAuth";
import {
  ResearchWaveVisual,
  SiteHeader,
  SpaceBackdrop,
  StatTile,
} from "@/components/ResearchShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Eye,
  FileText,
  Folder,
  GraduationCap,
  Mail,
  Search,
  Sparkles,
  Tags,
  UserRound,
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";

function readingTime(content: string) {
  const chinese = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const english = (content.match(/[a-zA-Z]+/g) || []).length;
  return Math.max(1, Math.ceil((chinese + english) / 320));
}

function formatDate(value: string | Date | null, locale: string, fallback: string) {
  if (!value) return fallback;
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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

export default function Home() {
  const { isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery.trim().toLowerCase());

  const { data: posts, isLoading } = trpc.posts.list.useQuery({
    status: "published",
    limit: 20,
    orderBy: "publishedAt",
  });

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: tags } = trpc.tags.list.useQuery();

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
    toast.success(t("common.emailCopied"));
  };

  return (
    <div className="space-page">
      <SpaceBackdrop />
      <SiteHeader active="home" />

      <main className="relative z-10">
        <section className="container grid gap-8 px-4 pb-9 pt-12 sm:px-6 md:pt-16 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0">
            <div className="signal-chip mb-8">
              <Sparkles className="h-4 w-4 text-sky-300" />
              <span>{t("home.chip1")}</span>
              <span className="text-slate-500">·</span>
              <span>{t("home.chip2")}</span>
              <span className="text-slate-500">·</span>
              <span>{t("home.chip3")}</span>
            </div>

            <h1 className="max-w-5xl font-serif text-5xl font-semibold leading-[1.08] text-white md:text-7xl">
              {t("home.title")}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
              {t("home.subtitle")}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="glass-panel flex items-center gap-3 px-3 py-2">
                <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-sky-300 to-blue-700 text-sm font-semibold text-white">
                  MY
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{t("home.authorName")}</p>
                  <p className="text-xs text-slate-400">{t("home.authorRole")}</p>
                </div>
              </div>
              <a
                href="https://scholar.google.com/citations?user=6X9HlDAAAAAJ"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel inline-flex items-center gap-2 px-5 py-3 text-sm text-white transition-colors hover:border-sky-300/60"
              >
                <GraduationCap className="h-4 w-4 text-sky-300" />
                {t("home.googleScholar")}
              </a>
              <button
                type="button"
                onClick={copyEmail}
                className="glass-panel inline-flex items-center gap-2 px-5 py-3 text-sm text-white transition-colors hover:border-sky-300/60"
              >
                <Mail className="h-4 w-4 text-sky-300" />
                zedpl28174@gmail.com
              </button>
            </div>

            <div className="glass-panel mt-8 flex max-w-4xl items-center gap-4 px-5 py-4">
              <Search className="h-6 w-6 shrink-0 text-slate-400" />
              <Input
                placeholder={t("home.searchPlaceholder")}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-11 border-0 bg-transparent px-0 text-base text-white shadow-none placeholder:text-slate-500 focus-visible:ring-0"
              />
              <kbd className="hidden rounded-md border border-slate-600/70 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-400 sm:inline-flex">
                ⌘ K
              </kbd>
            </div>

            <div className="mt-5 grid max-w-4xl gap-3 sm:grid-cols-3">
              <StatTile icon={<FileText className="h-5 w-5" />} value={posts?.posts?.length || 0} label={t("home.statArticles")} />
              <StatTile icon={<Folder className="h-5 w-5" />} value={categories?.length || 0} label={t("home.statCategories")} />
              <StatTile icon={<Eye className="h-5 w-5" />} value={totalViews} label={t("home.statViews")} />
            </div>
          </div>

          <aside className="grid gap-5 self-start lg:pt-1">
            <section className="glass-panel p-6">
              <div className="mb-4 flex items-center gap-2 text-white">
                <UserRound className="h-5 w-5 text-sky-300" />
                <h2 className="text-lg font-semibold">{t("home.aboutTitle")}</h2>
              </div>
              <p className="text-sm leading-7 text-slate-300">
                {t("home.aboutDescription")}
              </p>

              <div className="mt-6 flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5 text-cyan-300" />
                <h3 className="text-sm font-semibold">{t("home.researchDirection")}</h3>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {focusTagKeys.slice(0, 6).map((key) => (
                  <span key={key} className="rounded-lg border border-sky-200/15 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-200">
                    {t(key)}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-2 text-white">
                <BookOpen className="h-5 w-5 text-blue-300" />
                <h3 className="text-sm font-semibold">{t("home.recentFocus")}</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>• {t("home.recentFocus1")}</li>
                <li>• {t("home.recentFocus2")}</li>
                <li>• {t("home.recentFocus3")}</li>
              </ul>
            </section>

            <section className="glass-panel p-5">
              <div className="mb-4 flex items-center gap-2 text-white">
                <Tags className="h-5 w-5 text-blue-300" />
                <h2 className="text-base font-semibold">{t("home.hotTags")}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {(tags?.length ? tags : focusTagKeys.map((key, index) => ({ id: index, name: t(key) }))).slice(0, 12).map((tag: any) => (
                  <span key={tag.id ?? tag.name} className="rounded-lg border border-slate-600/50 bg-slate-900/55 px-3 py-1.5 text-xs text-slate-300">
                    {tag.name}
                  </span>
                ))}
              </div>
            </section>
          </aside>
        </section>

        <section id="research-index" className="container research-grid px-4 pb-16 sm:px-6">
          <div className="glass-panel research-section-panel">
            <div className="section-heading-row">
              <h2 className="section-title">{t("home.latestArticles")}</h2>
              {isAdmin && (
                <Link href="/manage">
                  <Button variant="outline" size="sm" className="glass-button">
                    {t("nav.manageArticles")}
                  </Button>
                </Link>
              )}
            </div>

            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2].map((item) => (
                  <div key={item} className="article-skeleton" />
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="grid gap-4">
                {filteredPosts.map((post: any, index: number) => (
                  <Link key={post.id} href={`/post/${post.slug}`}>
                    <article className="article-card group">
                      <ResearchWaveVisual
                        variant={post.slug?.includes("isohc") ? "orbit" : "wave"}
                        className="article-visual"
                      />
                      <div className="article-copy">
                        <div className="article-tags">
                          <span className="article-tag article-tag-primary">
                            {index === 0 ? t("home.tagLatest") : t("home.tagResearch")}
                          </span>
                          <span className="article-tag">
                            {post.slug?.includes("isohc") ? t("home.tagResidualMixing") : t("home.tagRoPE")}
                          </span>
                        </div>
                        <h3 className="article-title">
                          {post.title}
                        </h3>
                        <p className="article-excerpt">
                          {post.excerpt ||
                            `${post.content?.replace(/[#*$\\`\n]/g, " ").slice(0, 220)}...`}
                        </p>
                        <div className="article-meta">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(post.publishedAt, language === "zh" ? "zh-CN" : "en-US", t("common.draft"))}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" />
                            {readingTime(post.content || "")} {t("home.minRead")}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5" />
                            {post.viewCount || 0} {t("home.reads")}
                          </span>
                          <span className="article-read-link">
                            {t("home.readMore")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
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
              <div className="research-index-row">
                <span>EVQ-Cosh</span>
                <span className="text-sky-300">RoPE</span>
              </div>
              <div className="research-index-row">
                <span>IsoHC</span>
                <span className="text-sky-300">Stability</span>
              </div>
              <div className="research-index-row">
                <span>Long Context</span>
                <span className="text-sky-300">Scaling</span>
              </div>
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
