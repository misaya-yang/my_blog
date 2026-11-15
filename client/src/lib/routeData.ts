import { useEffect } from "react";
import { setRouteDataPrefetcher } from "@/lib/routeTransition";
import { trackConfigs } from "@/lib/tracks";
import { preloadMarkdownRenderer } from "@/components/markdownRenderers";
import { trpc } from "@/lib/trpc";
import { hasMarkdownMath } from "@shared/markdown-math";

const FRESH = { staleTime: 60_000 };

const decode = (part: string) => {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
};

/**
 * Teaches the route transition how to fetch a page's content ahead of a
 * visit, so the page arrives whole. Each input mirrors that page's own
 * query; one that drifts only costs the head start, never correctness.
 */
export function useRouteDataPrefetch() {
  const utils = trpc.useUtils();
  useEffect(
    () =>
      setRouteDataPrefetcher(pathname => {
        const [, section = "", rest = ""] = pathname
          .replace(/\/+$/, "")
          .split("/");
        const slug = decode(rest);
        if (!section)
          return utils.posts.list.prefetch(
            {
              status: "published",
              summaryOnly: true,
              limit: 20,
              orderBy: "publishedAt",
            },
            FRESH
          );
        if (section === "post" && slug)
          return utils.posts.getBySlug.prefetch(slug, FRESH).then(() => {
            // The article's text decides which renderer it needs (formulas
            // bring KaTeX); have that in hand too before the page opens.
            const content = utils.posts.getBySlug.getData(slug)?.content;
            if (content)
              return preloadMarkdownRenderer(hasMarkdownMath(content));
          });
        if (section === "archive")
          return utils.discovery.archive.prefetch(undefined, FRESH);
        if (section === "algorithms" || section === "applications")
          return utils.posts.list.prefetch(
            {
              status: "published",
              categorySlug: trackConfigs[section].categorySlug,
              limit: 20,
              orderBy: "publishedAt",
            },
            FRESH
          );
        if (section === "tags" && slug)
          return utils.discovery.tag.prefetch(
            { slug, limit: 50, offset: 0 },
            FRESH
          );
        if (section === "categories" && slug)
          return utils.discovery.category.prefetch(
            { slug, limit: 50, offset: 0 },
            FRESH
          );
      }),
    [utils]
  );
}
