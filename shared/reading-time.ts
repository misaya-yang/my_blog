const DEFAULT_READING_UNITS_PER_MINUTE = 320;
const CJK_CHARACTER_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g;
const LATIN_WORD_PATTERN = /[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g;

export function countReadableUnits(content: string | null | undefined) {
  const text = normalizeMarkdownForReading(content ?? "");
  const cjkCharacters = text.match(CJK_CHARACTER_PATTERN)?.length ?? 0;
  const latinWords =
    text.replace(CJK_CHARACTER_PATTERN, " ").match(LATIN_WORD_PATTERN)
      ?.length ?? 0;

  return cjkCharacters + latinWords;
}

export function estimateReadingMinutes(
  content: string | null | undefined,
  unitsPerMinute = DEFAULT_READING_UNITS_PER_MINUTE
) {
  const safeUnitsPerMinute =
    Number.isFinite(unitsPerMinute) && unitsPerMinute > 0
      ? unitsPerMinute
      : DEFAULT_READING_UNITS_PER_MINUTE;

  return Math.max(
    1,
    Math.ceil(countReadableUnits(content) / safeUnitsPerMinute)
  );
}

export function estimateArticleReadingMinutes(input: {
  title?: string | null;
  content?: string | null;
}) {
  return estimateReadingMinutes(
    stripMatchingMarkdownTitle(input.content ?? "", input.title ?? "")
  );
}

export function stripMatchingMarkdownTitle(content: string, title: string) {
  const lines = content.split(/\r?\n/);
  const firstContentIndex = lines.findIndex(line => line.trim().length > 0);
  if (firstContentIndex < 0) return content;

  const match = /^#\s+(.+?)\s*$/.exec(lines[firstContentIndex]);
  if (!match) return content;

  const markdownTitle = normalizeComparableText(match[1].replace(/\*\*/g, ""));
  const pageTitle = normalizeComparableText(title);
  if (!markdownTitle || markdownTitle !== pageTitle) return content;

  const nextLines = [...lines];
  nextLines.splice(firstContentIndex, 1);
  if (nextLines[firstContentIndex]?.trim() === "") {
    nextLines.splice(firstContentIndex, 1);
  }
  return nextLines.join("\n").trimStart();
}

function normalizeMarkdownForReading(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, block =>
      block.replace(/^```[^\n]*\n?/, " ").replace(/```$/, " ")
    )
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/[$#>*_~|`\\()[\]{}:;,.!?=-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeComparableText(content: string) {
  return normalizeMarkdownForReading(content).toLowerCase();
}
