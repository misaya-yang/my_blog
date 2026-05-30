import { ArrowRight, BookOpen, Calendar, Eye } from "lucide-react";
import { Link } from "wouter";

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

function topicLabel(post: any, track?: "algorithms" | "applications") {
  if (post.category?.name) return post.category.name;
  if (track === "applications") {
    if (post.slug?.includes("harness")) return "Harness Engine";
    if (post.slug?.includes("rag")) return "RAG";
    return "Agent Systems";
  }
  return post.slug?.includes("isohc") ? "Residual Mixing" : "RoPE";
}

export function ArticleCard({
  post,
  index,
  language,
  t,
  track,
}: {
  post: any;
  index: number;
  language: "en" | "zh";
  t: (key: string, vars?: Record<string, string | number>) => string;
  track?: "algorithms" | "applications";
}) {
  const visibleTags = Array.isArray(post.tags) ? post.tags.slice(0, 3) : [];
  const articleNumber = String(index + 1).padStart(2, "0");

  return (
    <article className="article-card group">
      <Link href={`/post/${post.slug}`} aria-label={post.title}>
        {post.coverImage ? (
          <img src={post.coverImage} alt="" className="article-visual object-cover" />
        ) : (
          <div className="article-visual article-visual-ledger" aria-hidden="true">
            <span>{articleNumber}</span>
          </div>
        )}
      </Link>
        <div className="article-copy">
          <div className="article-tags">
            <span className="article-tag article-tag-primary">
              {index === 0 ? t("home.tagLatest") : t("home.tagResearch")}
            </span>
            {post.category?.slug ? (
              <Link className="article-tag" href={`/categories/${post.category.slug}`}>
                {topicLabel(post, track)}
              </Link>
            ) : (
              <span className="article-tag">{topicLabel(post, track)}</span>
            )}
            {visibleTags.map((tag: any) => (
              <Link key={tag.slug} className="article-tag" href={`/tags/${tag.slug}`}>
                {tag.name}
              </Link>
            ))}
          </div>
          <Link href={`/post/${post.slug}`}>
            <h3 className="article-title">{post.title}</h3>
          </Link>
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
              {post.readingMinutes || readingTime(post.content || "")} {t("home.minRead")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {post.viewCount || 0} {t("home.reads")}
            </span>
            <Link href={`/post/${post.slug}`} className="article-read-link">
              {t("home.readMore")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </article>
  );
}
