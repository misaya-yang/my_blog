import { Vector4 } from "three";

export const CONSTELLATION_LOCAL_RADIUS = 3.2;
export type ConstellationLayout = readonly [
  Readonly<{ x: number; y: number; z: number; w: number }>,
  Readonly<{ x: number; y: number; z: number; w: number }>,
];

export interface ConstellationLayoutOptions {
  width: number;
  height: number;
  /** Unoccupied widths in CSS pixels, measured from each viewport edge. */
  leftGutter: number;
  rightGutter: number;
  /** Stable article seed in turns; whole turns produce the same layout. */
  seedPhase?: number;
}

/** NDC centers and scales; one local unit occupies equal CSS pixels on X/Y. */
export function calculateConstellationLayout({
  width,
  height,
  leftGutter,
  rightGutter,
  seedPhase = 0,
}: ConstellationLayoutOptions): readonly [Vector4, Vector4] {
  width = Number.isFinite(width) ? Math.max(1, width) : 1;
  height = Number.isFinite(height) ? Math.max(1, height) : 1;
  const phase = Number.isFinite(seedPhase)
    ? seedPhase - Math.floor(seedPhase)
    : 0;
  const variation = Math.sin(phase * Math.PI * 2);
  const make = (gutter: number, side: -1 | 1, centerY: number) => {
    gutter = Number.isFinite(gutter) ? gutter : width * 0.15;
    gutter = Math.max(0, Math.min(width / 2, gutter));
    const radius = Math.max(60, Math.min(150, gutter * 0.42));
    return new Vector4(
      side * (1 - gutter / width),
      centerY,
      (2 * radius) / (width * CONSTELLATION_LOCAL_RADIUS),
      (2 * radius) / (height * CONSTELLATION_LOCAL_RADIUS)
    );
  };
  // Narrow gutters intentionally crop the motifs at the viewport edges rather
  // than flattening them into ribbons or moving them behind the reading column.
  return [
    make(leftGutter, -1, 0.18 + variation * 0.06),
    make(rightGutter, 1, -0.2 - variation * 0.05),
  ];
}

/**
 * Stable 24% selection, shared by dust, stars and their historical positions.
 * The integer range is exactly representable by GLSL highp float; unlike a
 * sine hash this selects identical IDs on CPU and GPU.
 * GLSL: mod(floor(clamp(phase,0.,1.)*65536.)*37.+floor(row)*17.,100.)<24.
 */
export function retainConstellationParticle(
  row: number,
  phase: number
): number {
  const id = Math.floor(Math.max(0, Math.min(1, phase)) * 65536);
  return (id * 37 + Math.floor(row) * 17) % 100 < 24 ? 1 : 0;
}
