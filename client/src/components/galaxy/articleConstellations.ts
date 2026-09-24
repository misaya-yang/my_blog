export const ARTICLE_CONSTELLATION_MOTIFS = [
  "leo",
  "centaur",
  "lyre",
  "cygnus",
  "crown",
] as const;
export type ArticleConstellationMotif =
  (typeof ARTICLE_CONSTELLATION_MOTIFS)[number];
/**
 * The home page draws one large figure in the open sky beside its content,
 * picked at random per visit: the article motifs plus a spiral galaxy and
 * two more constellations. Articles keep their own five, so every article's
 * sky stays what it was.
 */
export const HOME_FIGURE_MOTIFS = [
  ...ARTICLE_CONSTELLATION_MOTIFS,
  "spiral",
  "cassiopeia",
  "orion",
] as const;
export type FigureMotif = (typeof HOME_FIGURE_MOTIFS)[number];
type Point2 = readonly [number, number];
type Point3 = [number, number, number];

// Artistic star-path motifs, not astronomical coordinates or animal silhouettes.
// Each set has three connected strokes with distinct roles, rather than nested
// copies of one loop. Shared knots remain coincident after the seeded transform.
/** Two logarithmic arms leaving a small core ring, seen tilted. */
function spiralGalaxy(): Point2[][] {
  const start = 0.45,
    end = 2.95,
    sweep = Math.PI * 2.2;
  const growth = Math.log(end / start) / sweep;
  const tilt = 0.7;
  const arm = (offset: number): Point2[] =>
    Array.from({ length: 21 }, (_, i) => {
      const angle = (i / 20) * sweep;
      const radius = start * Math.exp(growth * angle);
      return [
        radius * Math.cos(angle + offset),
        radius * Math.sin(angle + offset) * tilt,
      ];
    });
  // The core ring passes through both arms' first knots, so the figure is
  // one connected drawing.
  const core: Point2[] = Array.from({ length: 13 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    return [start * Math.cos(angle), start * Math.sin(angle) * tilt];
  });
  return [arm(0), arm(Math.PI), core];
}

const motifs: Record<FigureMotif, readonly (readonly Point2[])[]> = {
  leo: [
    [
      [-2.3, 2.1],
      [-1.2, 2.9],
      [0, 2.4],
      [-0.15, 1.4],
      [-1, 0.65],
      [-1.2, -0.45],
    ],
    [
      [-1.2, -0.45],
      [0.4, -0.1],
      [2.75, -1],
    ],
    [
      [0.4, -0.1],
      [1.9, -2.1],
      [2.75, -1],
    ],
  ],
  centaur: [
    [
      [-1.55, 2.85],
      [-0.95, 1.4],
      [0.1, 0.65],
      [1.1, -0.2],
      [2.6, -1.05],
    ],
    [
      [-0.95, 1.4],
      [0.25, 2.4],
      [1.7, 2.05],
    ],
    [
      [-1.9, -2.2],
      [0.1, 0.65],
      [1.1, -0.2],
      [1.5, -2.7],
    ],
  ],
  lyre: [
    [
      [-1.8, 2.9],
      [-0.85, 2.5],
      [0.1, 1.2],
    ],
    [
      [0.1, 1.2],
      [-1.5, -0.8],
      [0.3, -2.5],
    ],
    [
      [0.1, 1.2],
      [1.9, -0.5],
      [0.3, -2.5],
    ],
  ],
  cygnus: [
    [
      [-0.2, 2.9],
      [0.1, 0.85],
      [0.5, -1.1],
      [0.15, -2.9],
    ],
    [
      [-2.8, 1.1],
      [-1.25, 0.4],
      [0.1, 0.85],
    ],
    [
      [0.1, 0.85],
      [1.4, 1.25],
      [2.9, 0.25],
    ],
  ],
  crown: [
    [
      [-2.85, -0.3],
      [-2.4, 1.1],
      [-1.2, 2.5],
      [0.4, 2.7],
    ],
    [
      [0.4, 2.7],
      [1.8, 1.65],
      [2.65, 0.15],
      [2.2, -1.4],
    ],
    [
      [-2.85, -0.3],
      [-1.9, -1.35],
      [-0.65, -1.5],
    ],
  ],
  spiral: spiralGalaxy(),
  cassiopeia: [
    [
      [-2.75, 0.9],
      [-1.4, -0.6],
      [0, 0.35],
    ],
    [
      [0, 0.35],
      [1.35, -0.75],
      [2.75, 0.6],
    ],
    [
      [-1.4, -0.6],
      [-1.1, -2.1],
      [0.2, -2.85],
    ],
  ],
  orion: [
    [
      [-0.05, 3],
      [-1.3, 2.55],
      [-0.55, 0.1],
      [-1.5, -2.75],
    ],
    [
      [1.2, 2.4],
      [0.55, -0.1],
      [1.4, -2.6],
    ],
    [
      [-0.55, 0.1],
      [0, 0],
      [0.55, -0.1],
    ],
  ],
};

export type ConstellationOptions = {
  /** A chosen motif; otherwise the first random draw picks an article motif. */
  motif?: FigureMotif;
  /**
   * "mirror": the right figure mirrors the left (article gutters).
   * "echo": both copies share one transform and differ only in their slight
   * hand-drawn wobble, so together they draw one figure twice as dense.
   */
  pair?: "mirror" | "echo";
};

/** Rows 0/2/4 compose the left figure; 1/3/5 compose its right counterpart. */
export function createArticleConstellation(
  random: () => number,
  { motif: chosen, pair = "mirror" }: ConstellationOptions = {}
): {
  motif: FigureMotif;
  rows: Point3[][];
} {
  const motif =
    chosen ??
    ARTICLE_CONSTELLATION_MOTIFS[
      Math.min(
        ARTICLE_CONSTELLATION_MOTIFS.length - 1,
        Math.floor(random() * ARTICLE_CONSTELLATION_MOTIFS.length)
      )
    ];
  const rows: Point3[][] = Array.from({ length: 6 }, () => []);
  let angle = 0,
    scale = 1;
  for (let side = 0; side < 2; side++) {
    if (side === 0 || pair === "mirror") {
      angle = (random() - 0.5) * 0.26;
      scale = 0.9 + random() * 0.08;
    }
    const phase = random() * Math.PI * 2;
    const cosine = Math.cos(angle),
      sine = Math.sin(angle);
    const mirror = side === 0 || pair === "echo" ? 1 : -1;
    const transform = ([x, y]: Point2): Point3 => {
      const px = x + Math.sin(y * 1.1 + phase) * 0.035;
      const py = y + Math.sin(x * 0.9 + phase) * 0.025;
      return [
        (px * cosine - py * sine) * scale * mirror,
        (px * sine + py * cosine) * scale,
        Math.sin(x * 0.65 + y * 0.45 + phase) * 0.1,
      ];
    };
    motifs[motif].forEach((stroke, index) => {
      rows[index * 2 + side] = stroke.map(transform);
    });
  }
  return { motif, rows };
}
