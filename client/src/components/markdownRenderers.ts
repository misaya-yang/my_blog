import { lazyPreloadable } from "@/lib/lazyPreloadable";

// Formulas bring KaTeX; articles without them get the lighter renderer.
export const MarkdownRenderer = lazyPreloadable(
  () => import("@/components/MarkdownRenderer")
);
export const MathMarkdownRenderer = lazyPreloadable(
  () => import("@/components/MathMarkdownRenderer")
);

/** Fetches the renderer an article needs ahead of showing it. */
export const preloadMarkdownRenderer = (math: boolean): Promise<unknown> =>
  (math ? MathMarkdownRenderer : MarkdownRenderer).preload();
