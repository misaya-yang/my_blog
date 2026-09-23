import { describe, expect, it } from "vitest";
import { Matrix4, PerspectiveCamera, Vector3 } from "three";
import { bakeAmbientTracks, getAmbientProfile } from "./ambientScene";
import {
  calculateConstellationLayout,
  retainConstellationParticle,
} from "./constellationLayout";
import {
  bakeTracks,
  createRoseTracks,
  sampleTrack,
  TRACK_SAMPLES,
  HEART_Z,
} from "./roseTracks";
import {
  samplePackedTrack,
  sampleParticleBases,
  type ParticleBaseOptions,
} from "./sampleParticleBase";

const rose = createRoseTracks();
const packedRose = bakeTracks(rose);
for (let i = 3; i < packedRose.length; i += 4) packedRose[i] = 1;
const profile = getAmbientProfile("/archive");
const ambient = bakeAmbientTracks(profile);
const meta = new Float32Array(
  profile.rows.flatMap(row => [
    row.closed ? 1 : 0,
    row.length,
    row.endpointFade,
    0,
  ])
);

function options(rows = [0, 1, 2, 3, 4, 5]): ParticleBaseOptions {
  return {
    positions: new Float32Array(
      rows.flatMap(row => sampleTrack(rose[row], 0.3125).toArray())
    ),
    orbits: new Float32Array(
      rows.flatMap(row => [row, 0.3125, 1 / rose[row].period, 0])
    ),
    tracks: packedRose,
    ambientFrom: ambient,
    ambientTo: ambient,
    ambientMetaFrom: meta,
    ambientMetaTo: meta,
    ambientMorph: 1,
    ambientBlend: 0,
    time: 0,
    intro: 1,
    scatterRadius: 11,
    viewMatrix: new Matrix4(),
    split: 0,
    disperse: 0,
    pagePose: new Vector3(),
    sideX: 5,
    aspect: 1.6,
    ambientDrift: new Vector3(),
  };
}

function straightTrack(offset = 0) {
  const data = new Float32Array((TRACK_SAMPLES + 1) * 6 * 4);
  for (let row = 0; row < 6; row++)
    for (let i = 0; i <= TRACK_SAMPLES; i++)
      data.set(
        [offset + i / TRACK_SAMPLES, 0, 0, 1],
        (row * (TRACK_SAMPLES + 1) + i) * 4
      );
  return data;
}

describe("CPU base-particle fallback", () => {
  it("samples packed rows by clamped interpolation and reuses the supplied output", () => {
    const output = new Float32Array(12).fill(-99);
    const paths = straightTrack(2);
    expect(
      samplePackedTrack(paths, 4, 0.3125 + 0.5 / TRACK_SAMPLES, output, 4)
    ).toBe(output);
    expect(output[4]).toBeCloseTo(2.3125 + 0.5 / TRACK_SAMPLES, 6);
    expect([...output.slice(5, 8)]).toEqual([0, 0, 1]);
    expect(output[0]).toBe(-99);
    expect(samplePackedTrack(paths, 0, -0.5)[0]).toBe(2);
    expect(samplePackedTrack(paths, 0, 1.5)[0]).toBe(3);
  });

  it("preserves settled rose tracks and follows their continuous periods", () => {
    for (let row = 0; row < 6; row++) {
      const input = options([row]);
      const atStart = sampleParticleBases(input);
      const expected = sampleTrack(rose[row], 0.3125);
      expect(atStart[0]).toBeCloseTo(expected.x, 4);
      expect(atStart[1]).toBeCloseTo(expected.y, 4);
      expect(atStart[2]).toBeCloseTo(expected.z, 4);
      expect(atStart[3]).toBe(1);
      const afterCycle = sampleParticleBases({
        ...input,
        time: 1 / input.orbits[2],
      });
      for (let axis = 0; axis < 4; axis++)
        expect(afterCycle[axis]).toBeCloseTo(atStart[axis], 5);
      const moving = sampleParticleBases({ ...input, time: 1 });
      expect(
        Math.hypot(
          moving[0] - atStart[0],
          moving[1] - atStart[1],
          moving[2] - atStart[2]
        )
      ).toBeGreaterThan(0.08);
    }
  });

  it("billboards the home signature and keeps reading particles in a side bank without flattening Y/Z", () => {
    const input = options([4]);
    const view = new Matrix4()
      .makeRotationY(0.9)
      .scale(new Vector3(1.5, 1.5, 1.5))
      .setPosition(2, -1, -10);
    const home = sampleParticleBases({ ...input, viewMatrix: view });
    const stroke = sampleTrack(rose[4], 0.3125);
    const heart = new Vector3(0, 0, HEART_Z).applyMatrix4(view);
    expect(home[0]).toBeCloseTo(heart.x + stroke.x * 1.5, 4);
    expect(home[1]).toBeCloseTo(heart.y + stroke.y * 1.5, 4);
    expect(home[2]).toBeCloseTo(heart.z, 4);

    const local = sampleParticleBases({ ...input, ambientBlend: 1 });
    // Rotation around X leaves the bank's horizontal placement out of the
    // expected Y/Z transform, so this does not reimplement the bank formula.
    const ambientView = new Matrix4()
      .makeRotationX(0.9)
      .scale(new Vector3(1.5, 1.5, 1.5))
      .setPosition(2, -1, -10);
    const transformed = sampleParticleBases({
      ...input,
      ambientBlend: 1,
      viewMatrix: ambientView,
    });
    const expected = new Vector3(local[0], local[1], local[2]).applyMatrix4(
      ambientView
    );
    const camera = new PerspectiveCamera(42, input.aspect, 0.1, 40);
    const projected = new Vector3(
      transformed[0],
      transformed[1],
      transformed[2]
    ).applyMatrix4(camera.projectionMatrix);
    expect(projected.x).toBeLessThan(-0.65);
    expect(projected.x).toBeGreaterThan(-1);
    expect(transformed[1]).toBeCloseTo(expected.y, 5);
    expect(transformed[2]).toBeCloseTo(expected.z, 5);
  });

  it("keeps dim dust invisible before seating while bright motes and stars can appear", () => {
    const input = options([0, 0, 0]);
    const brights = new Float32Array([0.5, 2, 2]);
    const beginning = sampleParticleBases({
      ...input,
      brights,
      dustCount: 2,
      intro: 0,
    });
    expect([beginning[3], beginning[7], beginning[11]]).toEqual([0, 0, 0]);
    const traveling = sampleParticleBases({
      ...input,
      brights,
      dustCount: 2,
      intro: 0.2,
    });
    expect(traveling[3]).toBe(0);
    expect(traveling[7]).toBeGreaterThan(0);
    expect(traveling[11]).toBeCloseTo(traveling[7], 6);
    const seated = sampleParticleBases({
      ...input,
      brights,
      dustCount: 2,
      intro: 0.95,
    });
    expect([seated[3], seated[7], seated[11]]).toEqual([1, 1, 1]);
    const stable = sampleParticleBases({ ...input, brights, dustCount: 2 });
    for (let i = 0; i < stable.length; i++)
      expect(seated[i]).toBeCloseTo(stable[i], 5);
  });

  it("uses each ambient track's length, topology and independent morph phase", () => {
    const input = options([0]);
    const paths = straightTrack();
    const short = new Float32Array([1, 2.4, 0, 0]);
    const long = new Float32Array([1, 4.8, 0, 0]);
    const shared = {
      ...input,
      ambientBlend: 1,
      ambientFrom: paths,
      ambientTo: paths,
      time: 10,
    };
    const a = sampleParticleBases({
      ...shared,
      ambientMetaFrom: short,
      ambientMetaTo: short,
    });
    const b = sampleParticleBases({
      ...shared,
      ambientMetaFrom: long,
      ambientMetaTo: long,
    });
    // Half a path of motion survives the reading bank's narrow horizontal span.
    expect(b[0] - a[0]).toBeCloseTo(0.5 * 0.13, 5);
    const halfway = sampleParticleBases({
      ...shared,
      ambientMetaFrom: short,
      ambientMetaTo: long,
      ambientMorph: 0.5,
    });
    expect(halfway[0]).toBeCloseTo((a[0] + b[0]) / 2, 5);

    const open = new Float32Array([0, 2.4, 0.035, 0]);
    const endpointOrbits = new Float32Array([0, 0, 0, 0]);
    const atEndpoint = {
      ...shared,
      time: 0,
      orbits: endpointOrbits,
      ambientMetaFrom: open,
      ambientMetaTo: open,
    };
    expect(sampleParticleBases(atEndpoint)[3]).toBe(0);
    expect(
      sampleParticleBases({
        ...atEndpoint,
        ambientMetaFrom: short,
        ambientMetaTo: short,
      })[3]
    ).toBe(1);
    expect(
      sampleParticleBases({
        ...atEndpoint,
        ambientMetaFrom: open,
        ambientMetaTo: short,
        ambientMorph: 0.5,
      })[3]
    ).toBe(0.5);
  });

  it("keeps each track in its assigned reading bank as its unbanked path crosses the center", () => {
    const input = options([0, 1]);
    const paths = straightTrack(-0.5);
    const camera = new PerspectiveCamera(42, input.aspect, 0.1, 40);
    const viewMatrix = new Matrix4().makeTranslation(0, 0, -10);
    for (const phase of [0.1, 0.45, 0.5, 0.55, 0.9]) {
      const output = sampleParticleBases({
        ...input,
        ambientBlend: 1,
        ambientFrom: paths,
        ambientTo: paths,
        orbits: new Float32Array([0, phase, 0, 0, 1, phase, 0, 0]),
        viewMatrix,
      });
      const left = new Vector3(output[0], output[1], output[2]).applyMatrix4(
        camera.projectionMatrix
      );
      const right = new Vector3(output[4], output[5], output[6]).applyMatrix4(
        camera.projectionMatrix
      );
      expect(left.x).toBeLessThan(-0.65);
      expect(left.x).toBeGreaterThan(-1);
      expect(right.x).toBeGreaterThan(0.65);
      expect(right.x).toBeLessThan(1);
    }
  });

  it("reverses scrolling exactly and interpolates from a frozen navigation frame", () => {
    const input = options();
    input.viewMatrix.makeTranslation(0, 0, -10);
    const initial = sampleParticleBases(input);
    const output = new Float32Array(initial.length + 8).fill(999);
    expect(
      sampleParticleBases({ ...input, split: 0.6, disperse: 0.08 }, output)
    ).toBe(output);
    expect([...output.slice(0, initial.length)]).not.toEqual([...initial]);
    for (const value of output) expect(Number.isFinite(value)).toBe(true);
    sampleParticleBases(input, output);
    expect([...output.slice(0, initial.length)]).toEqual([...initial]);
    expect([...output.slice(initial.length)]).toEqual(new Array(8).fill(0));

    const destination = { ...input, split: 0.5, disperse: 0.08 };
    const target = sampleParticleBases(destination);
    expect(
      sampleParticleBases({
        ...destination,
        navigationFrom: initial,
        navigationProgress: 0,
      })
    ).toEqual(initial);
    const halfway = sampleParticleBases({
      ...destination,
      navigationFrom: initial,
      navigationProgress: 0.5,
    });
    for (let i = 0; i < halfway.length; i++)
      expect(halfway[i]).toBeCloseTo((initial[i] + target[i]) / 2, 5);
  });

  it("projects article motifs with equal CSS scales independently of the rose orientation", () => {
    const width = 1440,
      height = 900;
    const layout = calculateConstellationLayout({
      width,
      height,
      leftGutter: 240,
      rightGutter: 180,
    });
    const input = options([0, 1]);
    const packed = (x: number, y: number) => {
      const data = straightTrack();
      for (let i = 0; i < data.length; i += 4) data.set([x, y, -0.3, 1], i);
      return data;
    };
    const closed = new Float32Array([1, 4, 0, 0, 1, 4, 0, 0]);
    const camera = new PerspectiveCamera(42, width / height, 0.1, 100);
    const render = (x: number, y: number, rotated = false) => {
      const tracks = packed(x, y);
      const output = sampleParticleBases({
        ...input,
        positions: new Float32Array(6),
        orbits: new Float32Array([0, 0, 0, 0, 1, 0, 0, 0]),
        ambientFrom: tracks,
        ambientTo: tracks,
        ambientMetaFrom: closed,
        ambientMetaTo: closed,
        ambientBlend: 1,
        aspect: width / height,
        constellationLayout: layout,
        viewMatrix: rotated
          ? new Matrix4()
              .makeRotationY(1.1)
              .scale(new Vector3(2, 2, 2))
              .setPosition(4, -3, -12)
          : new Matrix4().makeTranslation(0, 0, -10),
      });
      return [0, 4].map(slot =>
        new Vector3(
          output[slot],
          output[slot + 1],
          output[slot + 2]
        ).applyMatrix4(camera.projectionMatrix)
      );
    };
    const center = render(0, 0);
    const horizontal = render(1, 0);
    const vertical = render(0, 1);
    const rotated = render(0, 0, true);
    for (let side = 0; side < 2; side++) {
      expect(center[side].x).toBeCloseTo(layout[side].x, 6);
      expect(center[side].y).toBeCloseTo(
        layout[side].y + 0.07 * layout[side].w,
        6
      );
      expect(rotated[side].x).toBeCloseTo(center[side].x, 6);
      expect(rotated[side].y).toBeCloseTo(center[side].y, 6);
      const dx = ((horizontal[side].x - center[side].x) * width) / 2;
      const dy = ((vertical[side].y - center[side].y) * height) / 2;
      expect(dx).toBeCloseTo(dy, 3);
      expect(dx).toBeCloseTo((layout[side].z * width) / 2, 3);
    }
  });

  it("retains the same article particle identities for dust and stars and fades selection with ambient blend", () => {
    const input = options([0, 0, 0, 0]);
    const orbits = new Float32Array([
      0,
      0,
      0,
      0,
      0,
      1 / 65536,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1 / 65536,
      0,
      0,
    ]);
    const layout = calculateConstellationLayout({
      width: 1280,
      height: 800,
      leftGutter: 200,
      rightGutter: 200,
    });
    const closed = new Float32Array([1, 4, 0, 0]);
    const shared = {
      ...input,
      orbits,
      dustCount: 2,
      ambientMetaFrom: closed,
      ambientMetaTo: closed,
      viewMatrix: new Matrix4().makeTranslation(0, 0, -10),
      constellationLayout: layout,
    };
    expect(retainConstellationParticle(0, 0)).toBe(1);
    expect(retainConstellationParticle(0, 1 / 65536)).toBe(0);
    for (const blend of [0, 0.25, 0.5, 0.75, 1]) {
      const output = sampleParticleBases({ ...shared, ambientBlend: blend });
      expect([output[3], output[11]]).toEqual([1, 1]);
      expect(output[7]).toBeCloseTo(1 - blend, 6);
      expect(output[15]).toBeCloseTo(output[7], 6);
    }
  });
});
