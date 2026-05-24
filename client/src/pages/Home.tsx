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

function formatDate(value: string | Date | null, locale: string) {
  if (!value) return "Draft";
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const focusTags = [
  "Transformer 架构",
  "大语言模型 (LLM)",
  "位置编码",
  "RoPE",
  "长序列建模",
  "频域分析",
  "注意力机制",
  "效率优化",
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
    toast.success(language === "en" ? "Email copied" : "邮箱已复制");
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
              <span>探索前沿</span>
              <span className="text-slate-500">·</span>
              <span>理解智能</span>
              <span className="text-slate-500">·</span>
              <span>推动创新</span>
            </div>

            <h1 className="max-w-5xl font-serif text-5xl font-semibold leading-[1.08] text-white md:text-7xl">
              深度学习与算法研究
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
              分享关于 Transformer、大语言模型、位置编码及前沿 AI 技术的研究与思考，
              专注于理解本质，追求更高效、更可靠的智能系统。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="glass-panel flex items-center gap-3 px-3 py-2">
                <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-sky-300 to-blue-700 text-sm font-semibold text-white">
                  MY
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Misaya Yang</p>
                  <p className="text-xs text-slate-400">研究者 / 博客作者</p>
                </div>
              </div>
              <a
                href="https://scholar.google.com/citations?user=6X9HlDAAAAAJ"
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel inline-flex items-center gap-2 px-5 py-3 text-sm text-white transition-colors hover:border-sky-300/60"
              >
                <GraduationCap className="h-4 w-4 text-sky-300" />
                Google Scholar
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
                placeholder="搜索文章、关键词、主题..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-11 border-0 bg-transparent px-0 text-base text-white shadow-none placeholder:text-slate-500 focus-visible:ring-0"
              />
              <kbd className="hidden rounded-md border border-slate-600/70 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-400 sm:inline-flex">
                ⌘ K
              </kbd>
            </div>

            <div className="mt-5 grid max-w-4xl gap-3 sm:grid-cols-3">
              <StatTile icon={<FileText className="h-5 w-5" />} value={posts?.posts?.length || 0} label="文章 / 持续更新中" />
              <StatTile icon={<Folder className="h-5 w-5" />} value={categories?.length || 0} label="分类 / 系统化整理" />
              <StatTile icon={<Eye className="h-5 w-5" />} value={totalViews} label="阅读量 / 总计浏览次数" />
            </div>
          </div>

          <aside className="grid gap-5 self-start lg:pt-1">
            <section className="glass-panel p-6">
              <div className="mb-4 flex items-center gap-2 text-white">
                <UserRound className="h-5 w-5 text-sky-300" />
                <h2 className="text-lg font-semibold">关于我</h2>
              </div>
              <p className="text-sm leading-7 text-slate-300">
                热衷于深度学习与算法研究，关注大模型的训练与推理、位置编码机制、
                长序列建模以及前沿 AI 技术的落地与应用。
              </p>

              <div className="mt-6 flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5 text-cyan-300" />
                <h3 className="text-sm font-semibold">研究方向</h3>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {focusTags.slice(0, 6).map((tag) => (
                  <span key={tag} className="rounded-lg border border-sky-200/15 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-200">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-2 text-white">
                <BookOpen className="h-5 w-5 text-blue-300" />
                <h3 className="text-sm font-semibold">近期关注</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>• 频域视角下的位置编码与外推能力</li>
                <li>• 大模型高效训练与推理优化</li>
                <li>• 可解释性与泛化能力研究</li>
              </ul>
            </section>

            <section className="glass-panel p-5">
              <div className="mb-4 flex items-center gap-2 text-white">
                <Tags className="h-5 w-5 text-blue-300" />
                <h2 className="text-base font-semibold">热门标签</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {(tags?.length ? tags : focusTags.map((name, index) => ({ id: index, name }))).slice(0, 12).map((tag: any) => (
                  <span key={tag.id ?? tag.name} className="rounded-lg border border-slate-600/50 bg-slate-900/55 px-3 py-1.5 text-xs text-slate-300">
                    {tag.name}
                  </span>
                ))}
              </div>
            </section>
          </aside>
        </section>

        <section id="research-index" className="container grid gap-7 px-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="glass-panel p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="section-title">最新文章</h2>
              {isAdmin && (
                <Link href="/manage">
                  <Button variant="outline" size="sm" className="glass-button">
                    管理文章
                  </Button>
                </Link>
              )}
            </div>

            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2].map((item) => (
                  <div key={item} className="h-44 animate-pulse rounded-lg border border-sky-200/10 bg-slate-800/35" />
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="grid gap-4">
                {filteredPosts.map((post: any, index: number) => (
                  <Link key={post.id} href={`/post/${post.slug}`}>
                    <article className="group grid gap-4 rounded-lg border border-sky-200/10 bg-slate-950/35 p-3 transition-all hover:border-sky-300/45 hover:bg-slate-900/55 md:grid-cols-[320px_minmax(0,1fr)]">
                      <ResearchWaveVisual
                        variant={post.slug?.includes("isohc") ? "orbit" : "wave"}
                        className="min-h-[190px]"
                      />
                      <div className="flex min-w-0 flex-col justify-center p-1 md:p-3">
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-200">
                            {index === 0 ? "最新" : "研究"}
                          </span>
                          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-300">
                            {post.slug?.includes("isohc") ? "Residual Mixing" : "位置编码"}
                          </span>
                        </div>
                        <h3 className="font-serif text-2xl font-semibold leading-snug text-white transition-colors group-hover:text-sky-200 md:text-3xl">
                          {post.title}
                        </h3>
                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-400">
                          {post.excerpt ||
                            `${post.content?.replace(/[#*$\\`\n]/g, " ").slice(0, 220)}...`}
                        </p>
                        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(post.publishedAt, language === "zh" ? "zh-CN" : "en-US")}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" />
                            {readingTime(post.content || "")} 分钟阅读
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5" />
                            {post.viewCount || 0} 次阅读
                          </span>
                          <span className="ml-auto inline-flex items-center gap-1 text-blue-300">
                            阅读全文 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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

          <aside className="glass-panel self-start p-5">
            <h2 className="section-title">研究索引</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between rounded-lg border border-sky-200/10 bg-slate-950/35 px-4 py-3">
                <span>EVQ-Cosh</span>
                <span className="text-sky-300">RoPE</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-sky-200/10 bg-slate-950/35 px-4 py-3">
                <span>IsoHC</span>
                <span className="text-sky-300">Stability</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-sky-200/10 bg-slate-950/35 px-4 py-3">
                <span>Long Context</span>
                <span className="text-sky-300">Scaling</span>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <footer className="relative z-10 border-t border-sky-200/10 bg-slate-950/40">
        <div className="container flex flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>© 2026 AI Tech Blog. All rights reserved.</p>
          <p>Misaya Yang · Transformer systems · Long-context mechanisms</p>
        </div>
      </footer>
    </div>
  );
}
