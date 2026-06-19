import { createSourceCardSemanticAnchorId } from "@shared/heading-anchors";
import type { SourceCard } from "./types";

export function getSourceHref(source: SourceCard) {
  if (!source.postSlug) return "#";
  const anchorId = getSourceAnchorId(source);
  return anchorId
    ? `/post/${source.postSlug}#${encodeURIComponent(anchorId)}`
    : `/post/${source.postSlug}`;
}

export function getSourceAnchorId(source: SourceCard) {
  if (source.anchorId?.trim()) return source.anchorId.trim();
  const stableAnchor = createSourceCardSemanticAnchorId(source);
  return stableAnchor ?? getSourceFallbackAnchorId(source);
}

export function getSourceFallbackAnchorId(source: SourceCard) {
  const chunkIndex = parseSourceChunkIndex(source.sourceId);
  if (chunkIndex === null) return null;
  return `heading-${Math.max(0, chunkIndex - 2)}`;
}

export function formatSourceExcerpt(source: SourceCard) {
  if (source.compactExcerpt?.trim()) return source.compactExcerpt.trim();

  const heading = source.heading ? normalizeSourceText(source.heading) : "";
  let excerpt = source.excerpt
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/#{1,6}\s+/g, " ")
    .replace(/[*_>]+/g, " ")
    .replace(/\$\$/g, "$")
    .replace(/\s+/g, " ")
    .trim();

  if (heading) {
    const normalizedExcerpt = normalizeSourceText(excerpt);
    if (normalizedExcerpt.startsWith(heading)) {
      excerpt = excerpt.slice(source.heading?.length ?? 0).trim();
    }
  }

  return excerpt.length > 150 ? `${excerpt.slice(0, 147).trim()}...` : excerpt;
}

export function normalizeSourceText(value: string) {
  return value
    .replace(/[#*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function parseSourceChunkIndex(sourceId: string) {
  const match = /(?::|^)(\d+)$/.exec(sourceId);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}
