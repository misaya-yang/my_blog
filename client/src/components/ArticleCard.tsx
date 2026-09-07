import { ArrowRight, BookOpen, Calendar } from "lucide-react";
import { getContentSeriesBySlug } from "@shared/content-series";
import { estimateReadingMinutes } from "@shared/reading-time";
import { Link } from "wouter";
import { langAttr } from "@/lib/contentLang";

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
  featured?: boolean;
};

type ArticleVisualTheme =
  | "trace"
  | "mesh"
  | "flow"
  | "field"
  | "packet"
  | "harness";

const ARTICLE_THUMBNAILS: Record<ArticleVisualTheme, string> = {
  trace: "/images/article-thumbs/agent-trace-ladder.jpg",
  mesh: "/images/article-thumbs/retrieval-evidence-mesh.jpg",
  flow: "/images/article-thumbs/residual-flow-map.jpg",
  field: "/images/article-thumbs/position-encoding-field.jpg",
  packet: "/images/article-thumbs/context-compiler-packet.jpg",
  harness: "/images/article-thumbs/evaluation-harness-loop.jpg",
};

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

function seriesLabel(
  post: ArticleCardPost,
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  const series = post.seriesSlug
    ? getContentSeriesBySlug(post.seriesSlug)
    : null;
  return series ? t(series.titleKey) : post.seriesTitle;
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
  if (/flow|matching|generative|diffusion/.test(post.slug ?? "")) {
    return t("track.topic.generativeModeling");
  }

  return t("track.topic.rope");
}

function buildExcerpt(post: ArticleCardPost): string {
  if (post.excerpt) return post.excerpt;
  const content = post.content?.replace(/[#*$\\`\n]/g, " ").trim() ?? "";
  return content ? `${content.slice(0, 220)}...` : "";
}

function visualTheme(
  post: ArticleCardPost,
  track?: ArticleTrack
): ArticleVisualTheme {
  const text = [
    post.slug,
    post.seriesSlug,
    post.category?.slug,
    ...(post.tags ?? []).map(tag => tag.slug),
  ]
    .filter(Boolean)
    .join(" ");

  if (/evaluation|eval|harness|benchmark|score/.test(text)) {
    return pickTheme(text, ["harness", "trace", "packet"]);
  }
  if (/agent|loop|tool|runtime/.test(text)) {
    return pickTheme(text, ["trace", "harness", "packet"]);
  }
  if (/rag|retrieval|evidence|source/.test(text)) return "mesh";
  if (/context|compiler|packet|prompt/.test(text)) return "packet";
  if (/rope|position|encoding|long-context/.test(text)) return "field";
  if (/flow-matching|generative|diffusion|rectified|transport/.test(text)) {
    return "flow";
  }
  if (/residual|isohc|mixing|stability/.test(text)) return "flow";
  return track === "applications" ? "packet" : "field";
}

function pickTheme<T extends ArticleVisualTheme>(text: string, themes: T[]): T {
  const hash = Array.from(text).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  );
  return themes[hash % themes.length];
}

export function getArticleCover(post: ArticleCardPost, track?: ArticleTrack) {
  return post.coverImage || ARTICLE_THUMBNAILS[visualTheme(post, track)];
}

export function ArticleCard({
  post,
  index,
  language,
  t,
  track,
  featured = false,
}: ArticleCardProps) {
  const visibleTags = Array.isArray(post.tags) ? post.tags.slice(0, 1) : [];
  const series = seriesLabel(post, t);
  const theme = visualTheme(post, track);
  const thumbnailSrc = ARTICLE_THUMBNAILS[theme];
  const locale = language === "zh" ? "zh-CN" : "en-US";

  return (
    <article
      className={
        featured
          ? "article-card article-card-featured liquid-surface group"
          : "article-card liquid-surface group"
      }
    >
      <Link href={`/post/${post.slug}`} aria-label={post.title}>
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt=""
            className="article-visual article-visual-image object-cover"
          />
        ) : (
          <img
            src={thumbnailSrc}
            alt=""
            width={640}
            height={360}
            loading={featured ? "eager" : "lazy"}
            decoding="async"
            className={`article-visual article-visual-thumb article-visual-${theme}`}
          />
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
          {series && (
            <span className="article-tag">
              {series}
              {post.seriesOrder ? ` #${post.seriesOrder}` : ""}
            </span>
          )}
          {!series &&
            visibleTags.map(tag => (
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
          <h3 className="article-title" {...langAttr(post.title)}>
            {post.title}
          </h3>
        </Link>
        <p className="article-excerpt" {...langAttr(buildExcerpt(post))}>
          {buildExcerpt(post)}
        </p>
        <div className="article-meta">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(post.publishedAt, locale, t("common.draft"))}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {post.readingMinutes ||
              estimateReadingMinutes(post.content || "")}{" "}
            {t("home.minRead")}
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
