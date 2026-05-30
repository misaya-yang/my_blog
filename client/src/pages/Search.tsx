import { SiteHeader, SpaceBackdrop } from "@/components/ResearchShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { getClientSiteUrl, useSeo } from "@/lib/seo";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { buildRouteMetadata } from "@shared/metadata";
import { BookOpen, Calendar, Folder, Search as SearchIcon, Tags } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";

function formatDate(value: string | Date | null, locale: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return <>{text}</>;
  const index = text.toLowerCase().indexOf(normalized);
  if (index === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-sky-300/20 px-1 text-sky-100">
        {text.slice(index, index + normalized.length)}
      </mark>
      {text.slice(index + normalized.length)}
    </>
  );
}

export default function Search() {
  const { language, t } = useLanguage();
  const siteUrl = getClientSiteUrl();
  const locale = language === "zh" ? "zh-CN" : "en-US";
  const [, navigate] = useLocation();
  const search = useSearch();
  const query = useMemo(() => new URLSearchParams(search).get("q")?.trim() ?? "", [search]);
  const [input, setInput] = useState(query);
  const { data, isLoading } = trpc.discovery.search.useQuery({
    query,
    limit: 20,
    offset: 0,
  });
  useSeo(
    buildRouteMetadata(siteUrl, {
      title: query ? t("discovery.resultsFor", { query, count: data?.total ?? 0 }) : t("discovery.searchTitle"),
      description: t("discovery.searchSubtitle"),
      path: query ? `/search?q=${encodeURIComponent(query)}` : "/search",
      locale,
    })
  );

  useEffect(() => {
    setInput(query);
  }, [query]);

  useEffect(() => {
    if (!isLoading && query && data?.total === 0) {
      trackAnalyticsEvent("search_zero_results", { query });
    }
  }, [data?.total, isLoading, query]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next = input.trim();
    navigate(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  };

  return (
    <div className="space-page">
      <SpaceBackdrop subtle />
      <SiteHeader active="search" />

      <main className="container relative z-10 px-4 py-10 sm:px-6 md:py-14">
        <section className="max-w-4xl">
          <div className="signal-chip mb-6">
            <SearchIcon className="h-4 w-4 text-sky-300" />
            {t("discovery.searchKicker")}
          </div>
          <h1 className="font-serif text-4xl font-semibold leading-tight text-white md:text-6xl">
            {t("discovery.searchTitle")}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
            {t("discovery.searchSubtitle")}
          </p>
        </section>

        <form onSubmit={handleSubmit} className="glass-panel mt-9 flex max-w-4xl gap-3 p-3">
          <SearchIcon className="ml-2 mt-3 h-5 w-5 shrink-0 text-slate-400" />
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t("discovery.searchPlaceholder")}
            className="h-11 border-0 bg-transparent text-base text-white shadow-none placeholder:text-slate-500 focus-visible:ring-0"
          />
          <Button type="submit" className="h-11 bg-sky-400 text-slate-950 hover:bg-sky-300">
            {t("discovery.searchButton")}
          </Button>
        </form>

        <section className="glass-panel mt-8 p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-title">
              {query
                ? t("discovery.resultsFor", { query, count: data?.total ?? 0 })
                : t("discovery.latestPublic")}
            </h2>
            <Link href="/archive" className="nav-ink">
              {t("nav.archive")}
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="article-skeleton h-28" />
              ))}
            </div>
          ) : data?.results?.length ? (
            <div className="divide-y divide-sky-200/10">
              {data.results.map((post: any) => (
                <article key={post.id} className="py-5">
                  <Link
                    href={`/post/${post.slug}`}
                    className="text-xl font-semibold leading-8 text-white hover:text-sky-200"
                  >
                    {post.title}
                  </Link>
                  <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-300">
                    <HighlightedText
                      text={post.matchExcerpt || post.excerpt || post.content?.slice(0, 220) || ""}
                      query={query}
                    />
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(post.publishedAt, locale)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      {post.readingMinutes} {t("home.minRead")}
                    </span>
                    {post.category && (
                      <Link href={`/categories/${post.category.slug}`} className="inline-flex items-center gap-1.5 hover:text-sky-200">
                        <Folder className="h-3.5 w-3.5" />
                        {post.category.name}
                      </Link>
                    )}
                    {post.tags?.slice(0, 4).map((tag: any) => (
                      <Link key={tag.slug} href={`/tags/${tag.slug}`} className="inline-flex items-center gap-1 rounded-md border border-sky-200/10 px-2 py-1 hover:border-sky-300/40 hover:text-sky-200">
                        <Tags className="h-3 w-3" />
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-14 text-center text-sm text-slate-400">
              {t("discovery.searchEmpty")}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
