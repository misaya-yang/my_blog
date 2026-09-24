import type { Matrix4, Vector3 } from "three";
import { HEART_Z, PETAL_TRACKS, TRACK_SAMPLES } from "./roseTracks";
import {
  retainConstellationParticle,
  type ConstellationLayout,
} from "./constellationLayout";

type PackedOutput = Float32Array | Float64Array;

/** Same clamped texel interpolation as the GPU's trackPoint/ambientLookup. */
export function samplePackedTrack<T extends PackedOutput = Float32Array>(
  packed: Float32Array,
  row: number,
  phase: number,
  out: T = new Float32Array(4) as T,
  offset = 0
): T {
  const sample = clamp(phase) * TRACK_SAMPLES;
  const index = Math.floor(sample);
  const fraction = sample - index;
  const first = (row * (TRACK_SAMPLES + 1) + index) * 4;
  const second =
    (row * (TRACK_SAMPLES + 1) + Math.min(index + 1, TRACK_SAMPLES)) * 4;
  for (let channel = 0; channel < 4; channel++)
    out[offset + channel] = mix(
      packed[first + channel],
      packed[second + channel],
      fraction
    );
  return out;
}

export interface ParticleBaseOptions {
  positions: Float32Array;
  orbits: Float32Array;
  tracks: Float32Array;
  ambientFrom: Float32Array;
  ambientTo: Float32Array;
  /** Each row: closed, world-space length, endpoint fade fraction, reserved. */
  ambientMetaFrom: Float32Array;
  ambientMetaTo: Float32Array;
  ambientMorph: number;
  ambientBlend: number;
  time: number;
  intro: number;
  scatterRadius: number;
  viewMatrix: Matrix4;
  split: number;
  disperse: number;
  pagePose: Vector3;
  sideX: number;
  aspect: number;
  ambientDrift: Vector3;
  /** Article motifs: two NDC centers/scales, replacing narrow side-bank compression. */
  constellationLayout?: ConstellationLayout;
  /** Percentage of particles a constellation keeps; defaults to the article 24. */
  constellationRetain?: number;
  /** 1 while the rose faces the reader: the signature then stands upright. */
  facing?: number;
  /** Per petal layer, its turn relative to the heart as a quaternion (xyzw). */
  layerTwists?: Float32Array;
  /** Brightness by particle index; missing values use the ordinary dust tier. */
  brights?: Float32Array;
  /** Dust occupies the first N slots; the remaining slots are luminous stars. */
  dustCount?: number;
  /** Frozen prior view-space positions/visibility for an interrupted navigation. */
  navigationFrom?: Float32Array;
  navigationProgress?: number;
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const fract = (value: number) => value - Math.floor(value);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
function smoothstep(start: number, end: number, value: number) {
  if (start === end) return value < start ? 0 : 1;
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}
const hash = (value: number) => fract(Math.sin(value) * 43758.5453);

function endpointVisibility(meta: Float32Array, offset: number, phase: number) {
  if (meta[offset] > 0.5) return 1;
  const fade = meta[offset + 2];
  return smoothstep(0, fade, phase) * (1 - smoothstep(1 - fade, 1, phase));
}

/**
 * CPU fallback for evaluateParticle + final intro/flow visibility. RGBA contains
 * unperturbed view-space XYZ and visibility; pointer displacement is applied
 * separately by ParticleMotion. Caller-owned output can be reused each frame.
 *
 * Curve lookup, transforms and stage ordering match the GPU. Sine-hash seeds in
 * intro/scroll can choose different scatter positions from GPU float/trigonometric implementations;
 * the settled home curves and signature do not depend on those hashes.
 */
export function sampleParticleBases(
  options: ParticleBaseOptions,
  out = new Float32Array((options.positions.length / 3) * 4)
): Float32Array {
  const {
    positions,
    orbits,
    tracks,
    ambientFrom,
    ambientTo,
    ambientMetaFrom,
    ambientMetaTo,
    ambientMorph,
    ambientBlend,
    time,
    intro,
    scatterRadius,
    viewMatrix,
    split,
    disperse,
    pagePose,
    sideX,
    aspect,
    ambientDrift,
    constellationLayout,
    constellationRetain,
    brights,
    layerTwists,
    navigationFrom,
  } = options;
  const upright = 1 - clamp(options.facing ?? 1);
  const count = positions.length / 3;
  if (
    !Number.isInteger(count) ||
    orbits.length < count * 4 ||
    out.length < count * 4
  )
    throw new RangeError(
      "Particle bases require RGB positions and matching RGBA orbit/output slots"
    );
  if (navigationFrom && navigationFrom.length < count * 4)
    throw new RangeError(
      "Navigation source must contain one RGBA slot per particle"
    );
  const dustCount = options.dustCount ?? count;
  const navigationProgress = clamp(options.navigationProgress ?? 1);
  const e = viewMatrix.elements;
  const scale = Math.hypot(e[0], e[1], e[2]);
  const heartX = e[12] + e[8] * HEART_Z;
  const heartY = e[13] + e[9] * HEART_Z;
  const heartZ = e[14] + e[10] * HEART_Z;
  const edgeOn = Math.abs(e[10]) / Math.max(scale, 0.0001);
  const cp = Math.cos(pagePose.x),
    sp = Math.sin(pagePose.x);
  // Four scratch vectors per call, rather than temporary vectors per particle.
  const sampled = new Float64Array(4),
    neighbor = new Float64Array(4);
  const previousAmbient = new Float64Array(4),
    nextAmbient = new Float64Array(4);

  for (let i = 0; i < count; i++) {
    const positionIndex = i * 3,
      slot = i * 4;
    const ox = positions[positionIndex],
      oy = positions[positionIndex + 1],
      oz = positions[positionIndex + 2];
    const row = orbits[slot],
      originPhase = orbits[slot + 1];
    const signature = row >= PETAL_TRACKS;
    const phase = fract(originPhase + time * orbits[slot + 2]);
    let flow = signature
      ? smoothstep(0, 0.025, phase) * (1 - smoothstep(0.975, 1, phase))
      : 1;
    samplePackedTrack(tracks, row, phase, sampled);
    samplePackedTrack(
      tracks,
      row,
      signature ? Math.min(phase + 0.002, 1) : fract(phase + 0.002),
      neighbor
    );
    let tx = neighbor[0] - sampled[0] + 0.000001;
    let ty = neighbor[1] - sampled[1] + 0.000001;
    const tangentLength = Math.hypot(tx, ty);
    tx /= tangentLength;
    ty /= tangentLength;
    const across = orbits[slot + 3] * sampled[3];
    let x = sampled[0] - ty * across;
    let y = sampled[1] + tx * across;
    let z =
      sampled[2] +
      (signature ? 0 : Math.sin(originPhase * 109) * Math.abs(across) * 1.5);
    if (!signature && layerTwists) {
      // v + 2 q×(q×v + w v), as layerTwist() in the particle shader.
      const q = Math.floor(row + 0.5) * 4;
      const qx = layerTwists[q],
        qy = layerTwists[q + 1],
        qz = layerTwists[q + 2],
        qw = layerTwists[q + 3];
      const cx = qy * z - qz * y + qw * x,
        cy = qz * x - qx * z + qw * y,
        cz = qx * y - qy * x + qw * z;
      x += 2 * (qy * cz - qz * cy);
      y += 2 * (qz * cx - qx * cz);
      z += 2 * (qx * cy - qy * cx);
    }
    let introVisibility = 1,
      travel = 1;

    if (intro < 1) {
      const sx = hash(ox * 12.9898 + oy * 78.233);
      const sy = hash(ox * 39.346 + oy * 11.135);
      const sz = hash(oy * 73.156 + ox * 52.235);
      const angle = sy * 6.2831853;
      const radius = Math.sqrt(sz) * scatterRadius;
      const scatteredX = Math.cos(angle) * radius * 1.3;
      const scatteredY = Math.sin(angle) * radius * 0.85;
      const seen = clamp((intro - sz * 0.14) / 0.22);
      const rim =
        1 - smoothstep(0.72, 1, radius / Math.max(scatterRadius, 0.001));
      const t = clamp((intro - sx * 0.22 - sy * 0.08 - 0.1) / 0.55);
      let local = 1;
      if (t < 1) {
        local = t * t * t * (t * (t * 6 - 15) + 10);
        local = mix(local, Math.sin(local * 1.5707963), 0.5);
      }
      introVisibility = mix(seen * seen * (3 - 2 * seen) * rim, 1, local);
      const arc = Math.sin(local * 3.14159265) * (0.5 + sz * 0.35);
      const cosine = Math.cos(arc),
        sine = Math.sin(arc);
      x = mix(scatteredX * cosine - scatteredY * sine, x, local);
      y = mix(scatteredX * sine + scatteredY * cosine, y, local);
      z = mix((sx - 0.5) * 0.8, z, local);
      travel = local;
    }

    if (ambientBlend > 0.001) {
      const meta = row * 4;
      const oldPhase = fract(
        originPhase + (time * 0.24) / Math.max(ambientMetaFrom[meta + 1], 0.1)
      );
      const newPhase = fract(
        originPhase + (time * 0.24) / Math.max(ambientMetaTo[meta + 1], 0.1)
      );
      samplePackedTrack(ambientFrom, row, oldPhase, previousAmbient);
      samplePackedTrack(ambientTo, row, newPhase, nextAmbient);
      flow = mix(
        flow,
        mix(
          endpointVisibility(ambientMetaFrom, meta, oldPhase),
          endpointVisibility(ambientMetaTo, meta, newPhase),
          ambientMorph
        ),
        ambientBlend
      );
      const drift = Math.sin(time * ambientDrift.z * 6.283 + oz * 0.5);
      const spread = across * (0.35 + 0.65 * Math.sin(oz * 3.7));
      const figureX =
        mix(previousAmbient[0], nextAmbient[0], ambientMorph) +
        Math.sin(time * 0.31 + oy * 2.3 + originPhase * 6.283) * 0.07 +
        ambientDrift.x * drift -
        ty * spread;
      const figureY =
        mix(previousAmbient[1], nextAmbient[1], ambientMorph) +
        Math.cos(time * 0.23 + ox * 1.9 + originPhase * 4.1) * 0.07 +
        ambientDrift.y * drift +
        tx * spread;
      x = mix(x, figureX, ambientBlend);
      y = mix(y, figureY, ambientBlend);
      z = mix(
        z,
        mix(previousAmbient[2], nextAmbient[2], ambientMorph),
        ambientBlend
      );
    }

    if (disperse !== 0) {
      const radius = Math.hypot(ox, oy, oz);
      const radialScale =
        (disperse * (0.35 + radius * 0.65)) /
        Math.hypot(ox + 0.0001, oy + 0.0001, oz + 0.0001);
      const tangentScale =
        (disperse * 0.45) /
        Math.hypot(-oy + 0.0001, ox + 0.0001, oz * 0.15 + 0.0001);
      x += (ox + 0.0001) * radialScale + (-oy + 0.0001) * tangentScale;
      y += (oy + 0.0001) * radialScale + (ox + 0.0001) * tangentScale;
      z += (oz + 0.0001) * radialScale + (oz * 0.15 + 0.0001) * tangentScale;
    }
    let vx = e[0] * x + e[4] * y + e[8] * z + e[12];
    let vy = e[1] * x + e[5] * y + e[9] * z + e[13];
    let vz = e[2] * x + e[6] * y + e[10] * z + e[14];
    if (signature) {
      const rigid = Math.max(ambientBlend, upright);
      vx = mix(heartX + x * scale, vx, rigid);
      vy = mix(heartY + y * scale, vy, rigid);
      vz = mix(heartZ, vz, rigid);
      flow *= mix(
        1,
        smoothstep(0.12, 0.45, edgeOn),
        rigid * (1 - ambientBlend)
      );
    }

    if (split > 0 && ambientBlend < 1) {
      const sx = hash(ox * 12.9898 + oy * 78.233 + oz * 37.719);
      const sy = hash(ox * 39.346 + oy * 11.135 + oz * 83.155);
      const sz = hash(ox * 73.156 + oy * 52.235 + oz * 9.151);
      const local = clamp((split - sx * 0.18) / 0.82);
      const weight = local * local * (3 - 2 * local) * (1 - ambientBlend);
      const dx = (sx * 2 - 1) * sideX * 1.3;
      const dy = (((sy * 2 - 1) * sideX) / aspect) * 1.3;
      // GLSL mat2(cp,-sp,sp,cp) is column-major.
      const rotatedX = cp * dx + sp * dy;
      const rotatedY = -sp * dx + cp * dy;
      const dz =
        (sz * 2 - 1) * 5 +
        Math.sin(rotatedX * 0.4 + pagePose.x) * pagePose.y * 2;
      const destinationX = rotatedX + Math.sin(time * 0.08 + sy * 6.283) * 0.12;
      const destinationY = rotatedY + Math.cos(time * 0.07 + sz * 6.283) * 0.12;
      const dispersedX =
        e[0] * destinationX + e[4] * destinationY + e[8] * dz + e[12];
      const dispersedY =
        e[1] * destinationX + e[5] * destinationY + e[9] * dz + e[13];
      const dispersedZ =
        e[2] * destinationX + e[6] * destinationY + e[10] * dz + e[14];
      const bx = Math.sin(oy * 0.7),
        by = Math.cos(oz * 0.6),
        bz = Math.sin(ox * 0.7);
      const bend = Math.sin(weight * 3.14159) * 1.1;
      vx =
        mix(vx, dispersedX, weight) +
        (e[0] * bx + e[4] * by + e[8] * bz) * bend;
      vy =
        mix(vy, dispersedY, weight) +
        (e[1] * bx + e[5] * by + e[9] * bz) * bend;
      vz =
        mix(vz, -4.5 - Math.abs(dispersedZ + 4.5) * 0.6, weight) +
        (e[2] * bx + e[6] * by + e[10] * bz) * bend;
    }
    if (constellationLayout) {
      const layout = constellationLayout[Math.floor(row) % 2];
      const halfHeight = -vz * Math.tan((Math.PI * 42) / 360);
      // Project the local motif without applying the rose's 3D orientation;
      // matching X/Y CSS scale preserves its shape even in a narrow gutter.
      vx = mix(
        vx,
        (layout.x + x * layout.z) * halfHeight * aspect,
        ambientBlend
      );
      vy = mix(vy, (layout.y + y * layout.w) * halfHeight, ambientBlend);
      flow *= mix(
        1,
        retainConstellationParticle(row, originPhase, constellationRetain),
        ambientBlend
      );
    } else {
      const bank = Math.floor(row) % 2 === 0 ? -1 : 1;
      vx = mix(
        vx,
        bank * 0.82 * -vz * Math.tan((Math.PI * 42) / 360) * aspect + vx * 0.13,
        ambientBlend
      );
    }
    const introVis =
      i < dustCount
        ? introVisibility *
          mix(
            smoothstep(0.25, 0.9, travel),
            1,
            smoothstep(1.85, 2, brights?.[i] ?? 1)
          )
        : introVisibility;
    const visibility = smoothstep(0, 0.16, introVis) * flow;
    if (navigationFrom && navigationProgress < 1) {
      out[slot] = mix(navigationFrom[slot], vx, navigationProgress);
      out[slot + 1] = mix(navigationFrom[slot + 1], vy, navigationProgress);
      out[slot + 2] = mix(navigationFrom[slot + 2], vz, navigationProgress);
      out[slot + 3] = mix(
        navigationFrom[slot + 3],
        visibility,
        navigationProgress
      );
    } else {
      out[slot] = vx;
      out[slot + 1] = vy;
      out[slot + 2] = vz;
      out[slot + 3] = visibility;
    }
  }
  out.fill(0, count * 4);
  return out;
}
