export type HeadingAnchor = {
  id: string;
  text: string;
  level: number;
};

const FALLBACK_HEADING_PREFIX = "heading";
const FENCE_START_PATTERN = /^ {0,3}(`{3,}|~{3,})/;
const MARKDOWN_HEADING_PATTERN = /^ {0,3}(#{1,6})\s+(.+?)\s*$/;

export function extractMarkdownHeadings(markdown: string) {
  const headings: Array<{ text: string; level: number }> = [];
  let fence: { marker: "`" | "~"; length: number } | null = null;

  for (const line of markdown.split(/\r?\n/)) {
    const fenceMatch = FENCE_START_PATTERN.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1][0] as "`" | "~";
      const length = fenceMatch[1].length;
      if (!fence) {
        fence = { marker, length };
      } else if (fence.marker === marker && length >= fence.length) {
        fence = null;
      }
      continue;
    }

    if (fence) continue;

    const headingMatch = MARKDOWN_HEADING_PATTERN.exec(line);
    if (!headingMatch) continue;

    const text = headingMatch[2]
      .replace(/\s+#+\s*$/, "")
      .replace(/\*\*/g, "")
      .trim();
    if (!text) continue;

    headings.push({
      text,
      level: headingMatch[1].length,
    });
  }

  return headings;
}

export function extractMarkdownHeadingAnchors(markdown: string) {
  return createUniqueHeadingAnchors(extractMarkdownHeadings(markdown));
}

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
