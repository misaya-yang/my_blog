import { ResearchWaveVisual } from "@/components/ResearchShell";
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

function visualVariant(post: any, track?: "algorithms" | "applications") {
  if (track === "applications") return "matrix";
  if (post.slug?.includes("isohc")) return "orbit";
  return "wave";
}

function topicLabel(post: any, track?: "algorithms" | "applications") {
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
  return (
    <Link href={`/post/${post.slug}`}>
      <article className="article-card group">
        <ResearchWaveVisual
          variant={visualVariant(post, track)}
          className="article-visual"
        />
        <div className="article-copy">
          <div className="article-tags">
            <span className="article-tag article-tag-primary">
              {index === 0 ? t("home.tagLatest") : t("home.tagResearch")}
            </span>
            <span className="article-tag">{topicLabel(post, track)}</span>
          </div>
          <h3 className="article-title">{post.title}</h3>
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
  );
}
