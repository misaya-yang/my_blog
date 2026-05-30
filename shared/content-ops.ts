type ContentOpsPost = {
  id: number;
  title: string;
  status?: "draft" | "published";
  visibility?: "hidden" | "admin" | "public";
  excerpt?: string | null;
  coverImage?: string | null;
  categoryId?: number | null;
  tags?: unknown[] | null;
  updatedAt?: string | Date | null;
  publishedAt?: string | Date | null;
  featuredRank?: number | null;
};

export type ContentHealthSummary = {
  total: number;
  drafts: number;
  publishedPublic: number;
  ownerOnlyPreviews: number;
  hidden: number;
  missingExcerpt: number;
  missingCategory: number;
  missingTags: number;
  missingSeoFields: number;
  updatedRecently: number;
};

export function sortCuratedPosts<T extends ContentOpsPost>(posts: T[]) {
  return [...posts].sort((a, b) => {
    const aRank = a.featuredRank ?? Number.POSITIVE_INFINITY;
    const bRank = b.featuredRank ?? Number.POSITIVE_INFINITY;
    if (aRank !== bRank) return aRank - bRank;

    const aDate = toTime(a.publishedAt);
    const bDate = toTime(b.publishedAt);
    if (aDate !== bDate) return bDate - aDate;

    return a.title.localeCompare(b.title);
  });
}

export function getContentHealthSummary(
  posts: ContentOpsPost[],
  now = new Date()
): ContentHealthSummary {
  const recentCutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  return posts.reduce<ContentHealthSummary>(
    (summary, post) => {
      summary.total += 1;
      if (post.status === "draft") summary.drafts += 1;
      if (post.status === "published" && post.visibility === "public") summary.publishedPublic += 1;
      if (post.visibility === "admin") summary.ownerOnlyPreviews += 1;
      if (post.visibility === "hidden") summary.hidden += 1;
      if (!post.excerpt?.trim()) summary.missingExcerpt += 1;
      if (!post.categoryId) summary.missingCategory += 1;
      if (!post.tags?.length) summary.missingTags += 1;
      if (!post.excerpt?.trim() || !post.coverImage?.trim()) summary.missingSeoFields += 1;
      if (toTime(post.updatedAt) >= recentCutoff) summary.updatedRecently += 1;
      return summary;
    },
    {
      total: 0,
      drafts: 0,
      publishedPublic: 0,
      ownerOnlyPreviews: 0,
      hidden: 0,
      missingExcerpt: 0,
      missingCategory: 0,
      missingTags: 0,
      missingSeoFields: 0,
      updatedRecently: 0,
    }
  );
}

function toTime(value: string | Date | null | undefined) {
  if (!value) return 0;
  return new Date(value).getTime();
}
