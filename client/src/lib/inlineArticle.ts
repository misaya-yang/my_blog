import superjson from "superjson";

let parsed: { slug: string; article: unknown } | null | undefined;

/**
 * The server renders each public article's data into the page as JSON, so
 * the first view needs no second request for it. Returns that article when
 * it is the one asked for.
 */
export function readInlineArticle<T>(slug: string): T | undefined {
  if (parsed === undefined) {
    parsed = null;
    const node =
      typeof document === "undefined"
        ? null
        : document.getElementById("article-data");
    if (node?.textContent) {
      try {
        parsed = {
          slug: node.dataset.slug ?? "",
          article: superjson.parse(node.textContent),
        };
      } catch {
        parsed = null;
      }
    }
  }
  return parsed && parsed.slug === slug ? (parsed.article as T) : undefined;
}
