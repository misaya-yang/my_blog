export type HeadingAnchor = {
  id: string;
  text: string;
  level: number;
};

const FALLBACK_HEADING_PREFIX = "heading";

export function createHeadingAnchorId(text: string, fallbackIndex?: number) {
  const normalized = normalizeHeadingAnchorText(text);
  if (normalized) return normalized;
  if (typeof fallbackIndex === "number") {
    return `${FALLBACK_HEADING_PREFIX}-${Math.max(0, fallbackIndex)}`;
  }
  return null;
}

export function createSourceCardSemanticAnchorId(source: {
  sectionTitle?: string | null;
  heading?: string | null;
}) {
  return createHeadingAnchorId(source.sectionTitle ?? source.heading ?? "");
}

export function createUniqueHeadingAnchors(
  headings: Array<{ text: string; level: number }>
): HeadingAnchor[] {
  const seen = new Map<string, number>();

  return headings.map((heading, index) => {
    const baseId =
      createHeadingAnchorId(heading.text, index) ??
      `${FALLBACK_HEADING_PREFIX}-${index}`;
    const occurrence = seen.get(baseId) ?? 0;
    seen.set(baseId, occurrence + 1);

    return {
      ...heading,
      id: occurrence === 0 ? baseId : `${baseId}-${occurrence + 1}`,
    };
  });
}

function normalizeHeadingAnchorText(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[`*_~()[\]{}<>]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff\u3400-\u4dbf]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .toLowerCase();
}
