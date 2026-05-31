import { ArrowRight, BookOpen, Calendar, Eye } from "lucide-react";
import { Link } from "wouter";

export type ArticleTrack = "algorithms" | "applications";

export type ArticleCardTag = {
  id?: string | number;
  name: string;
  slug: string;
};

export type ArticleCardPost = {
  id: string | number;
  slug: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  coverImage?: string | null;
  publishedAt?: string | Date | null;
  readingMinutes?: number | null;
  viewCount?: number | null;
  seriesSlug?: string | null;
  seriesTitle?: string | null;
  seriesOrder?: number | null;
  category?: {
    name?: string | null;
    slug?: string | null;
  } | null;
  tags?: ArticleCardTag[] | null;
};

type ArticleCardProps = {
  post: ArticleCardPost;
  index: number;
  language: "en" | "zh";
  t: (key: string, vars?: Record<string, string | number>) => string;
  track?: ArticleTrack;
};

function readingTime(content: string): number {
  const chinese = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const english = (content.match(/[a-zA-Z]+/g) || []).length;
  return Math.max(1, Math.ceil((chinese + english) / 320));
}

function formatDate(
  value: string | Date | null | undefined,
  locale: string,
  fallback: string
): string {
  if (!value) return fallback;
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function topicLabel(
  post: ArticleCardPost,
  t: (key: string, vars?: Record<string, string | number>) => string,
  track?: ArticleTrack
): string {
  if (post.category?.name) return post.category.name;
  return fallbackTopicLabel(post, t, track);
}

function fallbackTopicLabel(
  post: ArticleCardPost,
  t: (key: string, vars?: Record<string, string | number>) => string,
  track?: ArticleTrack
): string {
  if (track === "applications") {
    if (post.slug?.includes("harness")) return t("track.topic.harnessEngine");
    if (post.slug?.includes("rag")) return t("track.topic.ragRetrieval");
    return t("track.topic.agentSystems");
  }

  if (post.slug?.includes("isohc")) {
    return t("track.topic.residualMixing");
  }

  return t("track.topic.rope");
}

function buildExcerpt(post: ArticleCardPost): string {
  if (post.excerpt) return post.excerpt;
  const content = post.content?.replace(/[#*$\\`\n]/g, " ").trim() ?? "";
  return content ? `${content.slice(0, 220)}...` : "";
}

export function ArticleCard({
  post,
  index,
  language,
  t,
  track,
}: ArticleCardProps) {
  const visibleTags = Array.isArray(post.tags) ? post.tags.slice(0, 2) : [];
  const articleNumber = String(index + 1).padStart(2, "0");
  const locale = language === "zh" ? "zh-CN" : "en-US";

  return (
    <article className="article-card group">
      <Link href={`/post/${post.slug}`} aria-label={post.title}>
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt=""
            className="article-visual object-cover"
          />
        ) : (
          <div
            className="article-visual article-visual-ledger"
            aria-hidden="true"
          >
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
            <Link
              className="article-tag"
              href={`/categories/${post.category.slug}`}
            >
              {topicLabel(post, t, track)}
            </Link>
          ) : (
            <span className="article-tag">{topicLabel(post, t, track)}</span>
          )}
          {post.seriesTitle && (
            <span className="article-tag">
              {post.seriesTitle}
              {post.seriesOrder ? ` #${post.seriesOrder}` : ""}
            </span>
          )}
          {visibleTags.map(tag => (
            <Link
              key={tag.slug}
              className="article-tag"
              href={`/tags/${tag.slug}`}
            >
              {tag.name}
            </Link>
          ))}
        </div>
        <Link href={`/post/${post.slug}`}>
          <h3 className="article-title">{post.title}</h3>
        </Link>
        <p className="article-excerpt">{buildExcerpt(post)}</p>
        <div className="article-meta">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(post.publishedAt, locale, t("common.draft"))}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {post.readingMinutes || readingTime(post.content || "")}{" "}
            {t("home.minRead")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {post.viewCount || 0} {t("home.reads")}
          </span>
          <Link href={`/post/${post.slug}`} className="article-read-link">
            {t("home.readMore")}{" "}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}
