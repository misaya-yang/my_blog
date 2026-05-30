import { applyTitleTemplate, joinUrl, siteConfig } from "./site.js";

type SeoTaxonomy = {
  name: string;
  slug: string;
};

export type SeoPost = {
  title: string;
  slug: string;
  content?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  status?: "draft" | "published";
  visibility?: "hidden" | "admin" | "public";
  publishedAt?: Date | string | null;
  updatedAt?: Date | string | null;
  category?: SeoTaxonomy | null;
  tags?: SeoTaxonomy[];
};

export type RouteMetadata = {
  title: string;
  fullTitle: string;
  description: string;
  canonicalUrl: string;
  path: string;
  type: "website" | "article";
  image: string;
  locale: string;
  publishedAt?: string;
  updatedAt?: string;
  category?: string;
  tags?: string[];
  noindex?: boolean;
};

export function absoluteAssetUrl(baseUrl: string, value?: string | null) {
  if (!value) return joinUrl(baseUrl, siteConfig.defaultOgImage);
  if (/^https?:\/\//i.test(value)) return value;
  return joinUrl(baseUrl, value);
}

export function buildRouteMetadata(
  baseUrl: string,
  input: {
    title?: string;
    description?: string;
    path?: string;
    type?: "website" | "article";
    image?: string | null;
    locale?: string;
    noindex?: boolean;
  } = {}
): RouteMetadata {
  const title = input.title ?? siteConfig.defaultTitle;
  const path = input.path ?? "/";

  return {
    title,
    fullTitle: applyTitleTemplate(title),
    description: input.description ?? siteConfig.defaultDescription,
    canonicalUrl: joinUrl(baseUrl, path),
    path,
    type: input.type ?? "website",
    image: absoluteAssetUrl(baseUrl, input.image),
    locale: input.locale ?? siteConfig.defaultLocale,
    noindex: input.noindex,
  };
}

export function buildArticleMetadata(baseUrl: string, post: SeoPost | null | undefined) {
  if (!post) return null;
  const description = post.excerpt || post.content?.replace(/[#*$\\`\n]/g, " ").slice(0, 220) || siteConfig.defaultDescription;

  return {
    ...buildRouteMetadata(baseUrl, {
      title: post.title,
      description,
      path: `/post/${post.slug}`,
      type: "article",
      image: post.coverImage,
    }),
    publishedAt: toIsoString(post.publishedAt),
    updatedAt: toIsoString(post.updatedAt),
    category: post.category?.name,
    tags: post.tags?.map((tag) => tag.name) ?? [],
  };
}

export function buildHomeJsonLd(baseUrl: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: joinUrl(baseUrl, "/"),
      description: siteConfig.defaultDescription,
      inLanguage: siteConfig.alternateLocales,
      author: {
        "@type": "Person",
        name: siteConfig.authorName,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: siteConfig.authorName,
      email: siteConfig.authorEmail,
      url: joinUrl(baseUrl, "/about"),
      sameAs: [siteConfig.scholarUrl],
    },
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: siteConfig.name,
      url: joinUrl(baseUrl, "/"),
      description: siteConfig.feedDescription,
      author: {
        "@type": "Person",
        name: siteConfig.authorName,
      },
    },
  ];
}

export function buildArticleJsonLd(baseUrl: string, post: SeoPost | null | undefined) {
  const metadata = buildArticleMetadata(baseUrl, post);
  if (!metadata || !post) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: metadata.description,
    author: {
      "@type": "Person",
      name: siteConfig.authorName,
      email: siteConfig.authorEmail,
      sameAs: siteConfig.scholarUrl,
    },
    datePublished: metadata.publishedAt,
    dateModified: metadata.updatedAt ?? metadata.publishedAt,
    mainEntityOfPage: metadata.canonicalUrl,
    url: metadata.canonicalUrl,
    image: metadata.image,
    articleSection: metadata.category,
    keywords: metadata.tags,
  };
}

function toIsoString(value?: Date | string | null) {
  if (!value) return undefined;
  return new Date(value).toISOString();
}
