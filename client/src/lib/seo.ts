import { useEffect } from "react";
import type { RouteMetadata } from "@shared/metadata";
import { joinUrl, normalizeSiteUrl, siteConfig } from "@shared/site";

export function getClientSiteUrl() {
  const configured = import.meta.env.VITE_SITE_URL as string | undefined;
  if (configured) return normalizeSiteUrl(configured);
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

export function useSeo(metadata: RouteMetadata, jsonLd?: unknown | unknown[] | null) {
  useEffect(() => {
    document.title = metadata.fullTitle;
    document.documentElement.lang = metadata.locale;

    upsertMeta("name", "description", metadata.description);
    upsertMeta("name", "author", siteConfig.authorName);
    upsertMeta("name", "robots", metadata.noindex ? "noindex,nofollow" : "index,follow");
    upsertMeta("property", "og:site_name", siteConfig.name);
    upsertMeta("property", "og:title", metadata.title);
    upsertMeta("property", "og:description", metadata.description);
    upsertMeta("property", "og:type", metadata.type);
    upsertMeta("property", "og:url", metadata.canonicalUrl);
    upsertMeta("property", "og:image", metadata.image);
    upsertMeta("property", "og:locale", metadata.locale);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", metadata.title);
    upsertMeta("name", "twitter:description", metadata.description);
    upsertMeta("name", "twitter:image", metadata.image);

    removeMeta("property", "article:published_time");
    removeMeta("property", "article:modified_time");
    removeMeta("property", "article:section");
    removeMetaList("property", "article:tag");

    if (metadata.type === "article") {
      if (metadata.publishedAt) {
        upsertMeta("property", "article:published_time", metadata.publishedAt);
      }
      if (metadata.updatedAt) {
        upsertMeta("property", "article:modified_time", metadata.updatedAt);
      }
      if (metadata.category) {
        upsertMeta("property", "article:section", metadata.category);
      }
      metadata.tags?.forEach((tag) => appendMeta("property", "article:tag", tag));
    }

    upsertLink("canonical", metadata.canonicalUrl);
    upsertLink("icon", joinUrl(getClientSiteUrl(), siteConfig.favicon), "image/svg+xml");
    upsertLink("manifest", joinUrl(getClientSiteUrl(), siteConfig.manifest));
    upsertAlternateRss();
    upsertJsonLd(jsonLd);
  }, [metadata, jsonLd]);
}

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function appendMeta(attribute: "name" | "property", key: string, content: string) {
  const element = document.createElement("meta");
  element.setAttribute(attribute, key);
  element.content = content;
  document.head.appendChild(element);
}

function removeMeta(attribute: "name" | "property", key: string) {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove();
}

function removeMetaList(attribute: "name" | "property", key: string) {
  document.head.querySelectorAll(`meta[${attribute}="${key}"]`).forEach((element) => element.remove());
}

function upsertLink(rel: string, href: string, type?: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
  if (type) element.type = type;
}

function upsertAlternateRss() {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="alternate"][type="application/rss+xml"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "alternate";
    element.type = "application/rss+xml";
    document.head.appendChild(element);
  }
  element.title = `${siteConfig.name} RSS`;
  element.href = joinUrl(getClientSiteUrl(), siteConfig.feedPath);
}

function upsertJsonLd(jsonLd?: unknown | unknown[] | null) {
  document.head.querySelector("#route-json-ld")?.remove();
  if (!jsonLd) return;

  const element = document.createElement("script");
  element.id = "route-json-ld";
  element.type = "application/ld+json";
  element.textContent = JSON.stringify(jsonLd);
  document.head.appendChild(element);
}
