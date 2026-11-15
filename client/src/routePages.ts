import { lazyPreloadable } from "@/lib/lazyPreloadable";

/**
 * The public pages, each in its own chunk, and the way to fetch one ahead of
 * a visit. The router renders these; the route transition preloads them.
 */
export const Home = lazyPreloadable(() => import("./pages/Home"));
export const PostDetail = lazyPreloadable(() => import("./pages/PostDetail"));
export const Archive = lazyPreloadable(() => import("./pages/Archive"));
export const Search = lazyPreloadable(() => import("./pages/Search"));
export const About = lazyPreloadable(() => import("./pages/About"));
export const AlgorithmsPage = lazyPreloadable(() =>
  import("./pages/Track").then(module => ({ default: module.AlgorithmsPage }))
);
export const ApplicationsPage = lazyPreloadable(() =>
  import("./pages/Track").then(module => ({ default: module.ApplicationsPage }))
);
export const TagPage = lazyPreloadable(() =>
  import("./pages/TaxonomyPage").then(module => ({ default: module.TagPage }))
);
export const CategoryPage = lazyPreloadable(() =>
  import("./pages/TaxonomyPage").then(module => ({
    default: module.CategoryPage,
  }))
);

const PAGES: [RegExp, { preload(): Promise<unknown> }][] = [
  [/^\/$/, Home],
  [/^\/post\//, PostDetail],
  [/^\/algorithms\/?$/, AlgorithmsPage],
  [/^\/applications\/?$/, ApplicationsPage],
  [/^\/archive\/?$/, Archive],
  [/^\/search\/?$/, Search],
  [/^\/about\/?$/, About],
  [/^\/tags\//, TagPage],
  [/^\/categories\//, CategoryPage],
];

/** Fetches the code for the page at `pathname`, once. */
export function preloadPage(pathname: string): Promise<unknown> {
  const page = PAGES.find(([pattern]) => pattern.test(pathname));
  // A failed fetch is retried when the reader actually goes there.
  return page ? page[1].preload().catch(() => undefined) : Promise.resolve();
}
