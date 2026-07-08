import type { SourceCard } from "./types";

export const AGENT_COLLAPSED_SOURCE_LIMIT = 2;

export function getVisibleSourceCards<T>(
  sources: T[],
  expanded: boolean,
  collapsedLimit = AGENT_COLLAPSED_SOURCE_LIMIT
) {
  return expanded ? sources : sources.slice(0, collapsedLimit);
}

export function getHiddenSourceCount(
  sources: unknown[],
  collapsedLimit = AGENT_COLLAPSED_SOURCE_LIMIT
) {
  return Math.max(0, sources.length - collapsedLimit);
}

export function getSourcePreviewTitle(
  source: Pick<SourceCard, "sectionTitle" | "heading" | "postTitle">,
  fallbackTitle: string
) {
  return (
    source.sectionTitle ??
    source.heading ??
    source.postTitle ??
    fallbackTitle
  );
}
