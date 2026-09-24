import { TRACK_SAMPLES, PETAL_TRACKS } from "./roseTracks";
import { CatmullRomCurve3, Vector3 } from "three";
import {
  createArticleConstellation,
  HOME_FIGURE_MOTIFS,
  type FigureMotif,
} from "./articleConstellations";

export const AMBIENT_ROWS = PETAL_TRACKS + 2;
export const AMBIENT_ENDPOINT_FADE = 0.035;

type AmbientPoint = [number, number, number];
type Contour = { points: AmbientPoint[]; closed: boolean };

export type AmbientTrack = Contour & {
  /** World-space arc length; use this to derive a constant-distance flow rate. */
  length: number;
  /** Fraction of the open path reserved for fading at each endpoint. */
  endpointFade: number;
};

export type AmbientProfile = {
  family: "rhodonea" | "lissajous" | "orbits" | "ribbon" | "constellation";
  /** Present on article routes and the home figure. */
  motif?: FigureMotif;
  driftX: number;
  driftY: number;
  driftSpeed: number;
  twinkle: number;
  glow: number;
  /** Arc-length samples, with topology independent of the corresponding rose row. */
  rows: AmbientTrack[];
};

/** Deterministic PRNG so one article always wears the same sky. */
function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashPath(path: string, salt: number) {
  const key = path.split(/[?#]/)[0] || "/";
  let hash = 2166136261 ^ salt;
  for (const char of key)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return hash >>> 0;
}

type Range = [number, number];
const lerp = ([a, b]: Range, t: number) => a + (b - a) * t;

/**
 * A seeded ambient constellation for everything that is not the home rose.
 * Four outer contours carry the figure; two closed inner motifs remain near
 * the heart. Ribbons are open paths, not loops with a hidden cross-screen seam.
 */
export function getAmbientProfile(path: string): AmbientProfile {
  const random = mulberry32(hashPath(path, 0x9e3779b9));
  if (/^\/post\/[^/]+\/?$/.test(path.split(/[?#]/)[0]))
    return constellationProfile(random, createArticleConstellation(random));
  const families: AmbientProfile["family"][] = [
    "rhodonea",
    "lissajous",
    "orbits",
    "ribbon",
  ];
  const family = families[Math.floor(random() * families.length)];
  const outer: Contour[] = [];
  const scale = lerp([2.6, 3.3], random());
  const twist = lerp([-0.7, 0.7], random());

  if (family === "rhodonea") {
    const petals = 3 + Math.floor(random() * 4);
    const inner = Math.max(3, petals - (random() < 0.5 ? 1 : 2));
    for (let row = 0; row < PETAL_TRACKS; row++) {
      const k = row % 2 === 0 ? petals : inner;
      const phase = (row / PETAL_TRACKS) * Math.PI;
      const radius = scale * (1 - row * 0.17);
      outer.push({
        closed: true,
        points: contour(t => {
          const angle = t * Math.PI * 2;
          // A rounded minimum avoids the zero-radius cusp of abs(cos(...)),
          // which otherwise reverses a particle within one texture interval.
          const wave = Math.cos(k * (angle + phase)) * 0.92 + 0.08;
          const r = (radius * Math.hypot(wave, 0.1)) / Math.hypot(1, 0.1);
          return [
            r * Math.cos(angle + twist * row),
            r * Math.sin(angle + twist * row),
            Math.sin(angle * 2 + row) * 0.3,
          ];
        }),
      });
    }
  } else if (family === "lissajous") {
    const a = 1 + Math.floor(random() * 3);
    const b = a + 1 + Math.floor(random() * 2);
    for (let row = 0; row < PETAL_TRACKS; row++) {
      const drift = (row / PETAL_TRACKS) * Math.PI * 0.5;
      const radius = scale * (1 - row * 0.16);
      outer.push({
        closed: true,
        points: contour(t => {
          const angle = t * Math.PI * 2;
          return [
            radius * Math.sin(a * angle + drift + twist),
            radius * Math.sin(b * angle) * 0.82,
            Math.sin((a + b) * angle + row) * 0.42,
          ];
        }),
      });
    }
  } else if (family === "orbits") {
    const shells = 2 + Math.floor(random() * 2);
    for (let row = 0; row < PETAL_TRACKS; row++) {
      const shell = row % shells;
      const squash = lerp([0.42, 0.86], random());
      const roll = twist + shell * 1.1;
      const radius = scale * (1 - shell * 0.22);
      outer.push({
        closed: true,
        points: contour(t => {
          const angle = t * Math.PI * 2;
          const [x, y] = [
            radius * Math.cos(angle),
            radius * Math.sin(angle) * squash,
          ];
          return [
            x * Math.cos(roll) - y * Math.sin(roll),
            x * Math.sin(roll) + y * Math.cos(roll),
            Math.sin(angle) * 0.5 + shell * 0.2,
          ];
        }),
      });
    }
  } else {
    const bands = 3 + Math.floor(random() * 2);
    const frequency = lerp([1.5, 3], random());
    for (let row = 0; row < PETAL_TRACKS; row++) {
      const band = row % bands;
      const amplitude = lerp([0.5, 1.1], random()) * (1 - row * 0.12);
      const offset = (band - 1) * 0.7;
      outer.push({
        closed: false,
        points: contour(t => {
          const x = (t - 0.5) * scale * 2.6;
          const envelope = Math.cos((t - 0.5) * Math.PI);
          return [
            x,
            (Math.sin(x * frequency + twist * 3 + band) * amplitude + offset) *
              envelope,
            Math.sin(x * 0.8 + band * 2) * 0.35,
          ];
        }, false),
      });
    }
  }

  // These parametric motifs return to their start with the same tangent.
  // Their topology must not inherit the home signature's open-stroke flag.
  const innerKind = random();
  const inner: Contour[] = [0, 1].map(index => ({
    closed: true,
    points: contour(t => {
      const angle = t * Math.PI * 2;
      if (innerKind < 0.5) {
        const r = 0.5 + 0.16 * Math.cos(3 * angle + index);
        return [r * Math.cos(angle), r * Math.sin(angle) * 0.8, -0.9];
      }
      return [
        0.62 * Math.sin(2 * angle + index * 1.6),
        0.5 * Math.sin(3 * angle + index),
        -0.9 + Math.cos(angle) * 0.12,
      ];
    }),
  }));

  return {
    family,
    driftX: lerp([-0.16, 0.16], random()),
    driftY: lerp([-0.1, 0.12], random()),
    driftSpeed: lerp([0.05, 0.14], random()),
    twinkle: lerp([0.8, 1.35], random()),
    glow: lerp([0.35, 1], random()),
    rows: describeContours([...outer, ...inner]),
  };
}

/**
 * The home page's figure for one visit: a random motif, never the one the
 * previous visit in this tab showed, drawn as a single figure.
 */
export function getHomeFigureProfile(
  seed: number,
  previous?: string | null,
  forced?: FigureMotif
): AmbientProfile {
  const random = mulberry32(seed);
  const choices = HOME_FIGURE_MOTIFS.filter(motif => motif !== previous);
  const pick =
    choices[
      Math.min(choices.length - 1, Math.floor(random() * choices.length))
    ];
  const motif = forced ?? pick;
  return constellationProfile(
    random,
    createArticleConstellation(random, { motif, pair: "echo" })
  );
}

function constellationProfile(
  random: () => number,
  figure: ReturnType<typeof createArticleConstellation>
): AmbientProfile {
  const rows = figure.rows.map(points => {
    const curve = new CatmullRomCurve3(
      points.map(point => new Vector3(...point)),
      false,
      "centripetal"
    );
    const scratch = new Vector3();
    return {
      closed: false,
      points: contour(
        t => curve.getPoint(t, scratch).toArray() as AmbientPoint,
        false
      ),
    };
  });
  return {
    family: "constellation",
    motif: figure.motif,
    driftX: lerp([-0.035, 0.035], random()),
    driftY: lerp([-0.025, 0.025], random()),
    driftSpeed: lerp([0.025, 0.05], random()),
    twinkle: lerp([0.8, 1.15], random()),
    glow: 0.5,
    rows: describeContours(rows),
  };
}

function describeContours(rows: Contour[]): AmbientTrack[] {
  return rows.map(row => ({
    ...row,
    length: row.points
      .slice(1)
      .reduce(
        (sum, point, index) => sum + distance(point, row.points[index]),
        0
      ),
    endpointFade: row.closed ? 0 : AMBIENT_ENDPOINT_FADE,
  }));
}

function distance(a: AmbientPoint, b: AmbientPoint) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Integrate the curve densely, then invert arc length into evenly spaced texels. */
function contour(sample: (t: number) => AmbientPoint, closed = true) {
  const subdivisions = TRACK_SAMPLES * 16;
  let source = Array.from({ length: subdivisions + 1 }, (_, i) =>
    sample(i / subdivisions)
  );
  if (closed) {
    // Put the texture seam on a gentle part of the curve, not at a petal tip.
    // The identity of the loop is unchanged; only its phase origin moves.
    const stride = subdivisions / TRACK_SAMPLES;
    let seam = 0,
      bestAlignment = -Infinity;
    for (let i = 0; i < subdivisions; i += stride) {
      const previous = source[(i - stride + subdivisions) % subdivisions];
      const center = source[i];
      const next = source[(i + stride) % subdivisions];
      const incoming = center.map((value, axis) => value - previous[axis]);
      const outgoing = next.map((value, axis) => value - center[axis]);
      const magnitude = Math.hypot(...incoming) * Math.hypot(...outgoing);
      const alignment =
        magnitude > 0
          ? incoming.reduce(
              (sum, value, axis) => sum + value * outgoing[axis],
              0
            ) / magnitude
          : -Infinity;
      if (alignment > bestAlignment) {
        bestAlignment = alignment;
        seam = i;
      }
    }
    source = Array.from(
      { length: subdivisions + 1 },
      (_, i) => source[(i + seam) % subdivisions]
    );
  }
  const cumulative = new Float64Array(subdivisions + 1);
  for (let i = 1; i <= subdivisions; i++)
    cumulative[i] = cumulative[i - 1] + distance(source[i], source[i - 1]);
  const total = cumulative[subdivisions];
  const points: AmbientPoint[] = [[...source[0]]];
  let segment = 1;
  for (let i = 1; i < TRACK_SAMPLES; i++) {
    const target = (i / TRACK_SAMPLES) * total;
    while (segment < subdivisions && cumulative[segment] < target) segment++;
    const span = cumulative[segment] - cumulative[segment - 1];
    const fraction = span > 0 ? (target - cumulative[segment - 1]) / span : 0;
    const a = source[segment - 1],
      b = source[segment];
    points.push([
      a[0] + (b[0] - a[0]) * fraction,
      a[1] + (b[1] - a[1]) * fraction,
      a[2] + (b[2] - a[2]) * fraction,
    ]);
  }
  points.push([...source[subdivisions]]);
  return points;
}

/** RGBA = xyz + ribbon width. Topology and endpoint fading belong to rows, not alpha. */
export function bakeAmbientTracks(profile: AmbientProfile) {
  const data = new Float32Array((TRACK_SAMPLES + 1) * profile.rows.length * 4);
  profile.rows.forEach((row, rowIndex) => {
    row.points.forEach((point, i) => {
      const offset = (rowIndex * (TRACK_SAMPLES + 1) + i) * 4;
      data.set([point[0], point[1], point[2], 1], offset);
    });
  });
  return data;
}
