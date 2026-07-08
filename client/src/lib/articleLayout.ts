export const ARTICLE_READER_LAYOUT = {
  proseMeasure: {
    min: 66,
    target: 74,
    max: 78,
  },
  tocRailMinViewportPx: 1360,
  tocRailWidthRem: 15.5,
} as const;

export type ArticleRailMode = "inline-toc" | "toc-rail";

export function getArticleRailMode(viewportWidthPx: number): ArticleRailMode {
  return viewportWidthPx >= ARTICLE_READER_LAYOUT.tocRailMinViewportPx
    ? "toc-rail"
    : "inline-toc";
}

export function isArticleProseMeasureHealthy(measureCh: number) {
  const { min, max } = ARTICLE_READER_LAYOUT.proseMeasure;
  return measureCh >= min && measureCh <= max;
}
