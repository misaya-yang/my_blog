import { TRACK_SAMPLES, PETAL_TRACKS } from "./roseTracks";

export const AMBIENT_ROWS = PETAL_TRACKS + 2;

export type AmbientProfile = {
  family: "rhodonea" | "lissajous" | "orbits" | "ribbon";
  driftX: number;
  driftY: number;
  driftSpeed: number;
  twinkle: number;
  glow: number;
  /** Sampled contours, one row per rose track (4 outer closed + 2 inner open). */
  rows: Array<{ points: Array<[number, number, number]>; closed: boolean }>;
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
 * Four outer closed contours carry the figure; two open inner strokes keep
 * a small motif near the heart so the lvy script never loses its anchor.
 */
export function getAmbientProfile(path: string): AmbientProfile {
  const random = mulberry32(hashPath(path, 0x9e3779b9));
  const families: AmbientProfile["family"][] = [
    "rhodonea",
    "lissajous",
    "orbits",
    "ribbon",
  ];
  const family = families[Math.floor(random() * families.length)];
  const outer: AmbientProfile["rows"] = [];
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
          const r = radius * Math.abs(Math.cos(k * (angle + phase)) * 0.92 + 0.08);
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
        closed: true,
        points: contour(t => {
          const x = (t - 0.5) * scale * 2.6;
          const envelope = Math.cos((t - 0.5) * Math.PI);
          return [
            x,
            (Math.sin(x * frequency + twist * 3 + band) * amplitude
              + offset) * envelope,
            Math.sin(x * 0.8 + band * 2) * 0.35,
          ];
        }),
      });
    }
  }

  // Two small open strokes near the heart keep an inner motif anchored.
  const innerKind = random();
  const inner: AmbientProfile["rows"] = [0, 1].map(index => ({
    closed: false,
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
    rows: [...outer, ...inner],
  };
}

function contour(sample: (t: number) => [number, number, number]) {
  const points: Array<[number, number, number]> = [];
  for (let i = 0; i <= TRACK_SAMPLES; i++)
    points.push(sample(i / TRACK_SAMPLES));
  return points;
}

/** Same layout as roseTracks.bakeTracks: (rows × samples+1) × rgba float. */
export function bakeAmbientTracks(profile: AmbientProfile) {
  const data = new Float32Array(
    (TRACK_SAMPLES + 1) * profile.rows.length * 4
  );
  profile.rows.forEach((row, rowIndex) => {
    row.points.forEach((point, i) => {
      const offset = (rowIndex * (TRACK_SAMPLES + 1) + i) * 4;
      data.set([point[0], point[1], point[2], row.closed ? 1 : 0], offset);
    });
  });
  return data;
}
