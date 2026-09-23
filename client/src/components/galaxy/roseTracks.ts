import { CatmullRomCurve3, Vector3 } from "three";

export const TRACK_SAMPLES = 512;
export const PETAL_TRACKS = 4;
export type RoseTrack = {
  curve: CatmullRomCurve3;
  closed: boolean;
  signature: boolean;
  length: number;
  period: number;
};

/**
 * One layer of petals around the heart. The outline is a circle whose radius
 * swells into `petals` rounded lobes and pinches into a soft notch where two
 * petals overlap, the way the source drawing reads.
 *
 * Depth follows the reference galaxy rather than a flower cup: the rose is a
 * drawing in a plane, and each layer weaves gently in front of and behind
 * that plane, alternating in sign from layer to layer. Turned, the layers
 * separate and cross like the arms of a galaxy seen at an angle; nothing
 * curves the whole rose one way, so no view of it reads as a bowl.
 */
export type PetalLayer = {
  radius: number;
  petals: number;
  /** Angle of the first notch, in radians. */
  offset: number;
  /** Lobe depth as a fraction of the radius. */
  lobe: number;
  /** Small offset of the layer centre; nested petals are never concentric. */
  cx: number;
  cy: number;
  /** Signed amplitude of the layer's weave out of the plane. */
  depth: number;
  /** Angle where the weave crosses the plane, in radians. */
  weave: number;
};

export const PETAL_LAYERS: readonly PetalLayer[] = [
  {
    radius: 2.95,
    petals: 5,
    offset: 0.35,
    lobe: 0.15,
    cx: 0,
    cy: 0.02,
    depth: 0.62,
    weave: 0.4,
  },
  {
    radius: 2.2,
    petals: 5,
    offset: 0.35 + Math.PI / 5,
    lobe: 0.14,
    cx: -0.04,
    cy: 0.05,
    depth: -0.5,
    weave: 2.3,
  },
  {
    radius: 1.55,
    petals: 4,
    offset: 0.9,
    lobe: 0.12,
    cx: 0.05,
    cy: 0.02,
    depth: 0.42,
    weave: 4.1,
  },
  {
    radius: 1.08,
    petals: 3,
    offset: 2.1,
    lobe: 0.09,
    cx: 0.0,
    cy: -0.03,
    depth: -0.3,
    weave: 5.6,
  },
];
/** The heart, where the signature sits, is the rose's centre and pivot. */
export const HEART_Z = 0;
/** Horizontal shear that reduces the signature's italic lean. */
const SIGNATURE_UPRIGHT = 0.24;
const CONTOUR_POINTS = 120;

export function petalContour(layer: PetalLayer, points = CONTOUR_POINTS) {
  return Array.from({ length: points }, (_, i) => {
    const angle = (i / points) * Math.PI * 2;
    // |sin| peaks mid-petal and reaches zero at each notch; the 0.45 power
    // keeps the lobe broad and rounded and the notch narrow.
    const lobe = Math.pow(
      Math.abs(Math.sin(((angle - layer.offset) * layer.petals) / 2)),
      0.45
    );
    const r = layer.radius * (1 - layer.lobe + layer.lobe * lobe * 1.4);
    const x = layer.cx + Math.cos(angle) * r;
    const y = layer.cy + Math.sin(angle) * r;
    // A long, slow weave with a gentler second harmonic, so a layer is
    // never simply a tilted ring; petal tips lift a touch off their notches.
    const z =
      layer.depth *
        (0.8 * Math.sin(angle - layer.weave) +
          0.35 * Math.sin(2 * (angle - layer.weave) + 1.1)) +
      (lobe - 0.6) * 0.12;
    return new Vector3(x, y, z);
  });
}

/** Four nested petal layers around the recessed heart, then the signature. */
export function createRoseTracks(): RoseTrack[] {
  const tracks: RoseTrack[] = [];
  const add = (points: Vector3[], closed: boolean, signature = false) => {
    const curve = new CatmullRomCurve3(points, closed, "centripetal");
    curve.arcLengthDivisions = 2048;
    const length = curve.getLength();
    tracks.push({
      curve,
      closed,
      signature,
      length,
      period: signature ? length / 0.14 : length / 0.24,
    });
  };
  for (const layer of PETAL_LAYERS) add(petalContour(layer), true);
  // Original handwritten signature, independent open strokes in the recessed heart.
  const strokes = [
    [
      [529, 695],
      [552, 674],
      [578, 616],
      [610, 547],
      [625, 535],
      [617, 574],
      [587, 628],
      [558, 671],
      [559, 688],
      [575, 687],
      [602, 665],
      [624, 647],
      [631, 650],
      [626, 660],
      [616, 665],
    ],
    [
      [613, 665],
      [645, 650],
      [649, 663],
      [659, 665],
      [674, 653],
      [658, 699],
      [645, 739],
      [624, 767],
      [597, 778],
      [581, 774],
      [583, 756],
      [604, 727],
      [645, 702],
      [691, 685],
      [744, 680],
    ],
  ];
  // A gentle shear stands the handwriting up: the traced strokes lean far
  // to the right, and on the tilted rose they read as falling over.
  for (const stroke of strokes)
    add(
      stroke.map(
        ([x, y]) =>
          new Vector3(
            (x - 635) * 0.006 - (655 - y) * 0.006 * SIGNATURE_UPRIGHT,
            (655 - y) * 0.006,
            HEART_Z
          )
      ),
      false,
      true
    );
  return tracks;
}

export function sampleTrack(
  track: RoseTrack,
  phase: number,
  target = new Vector3()
) {
  const u = track.closed
    ? ((phase % 1) + 1) % 1
    : Math.max(0, Math.min(1, phase));
  return track.curve.getPointAt(u, target);
}

/** Last texel repeats the first on closed tracks; interpolation never bridges a seam. */
export function bakeTracks(tracks: RoseTrack[]) {
  const data = new Float32Array((TRACK_SAMPLES + 1) * tracks.length * 4);
  const point = new Vector3();
  tracks.forEach((track, row) => {
    for (let i = 0; i <= TRACK_SAMPLES; i++) {
      sampleTrack(track, i / TRACK_SAMPLES, point);
      const offset = (row * (TRACK_SAMPLES + 1) + i) * 4;
      data.set([point.x, point.y, point.z, track.closed ? 1 : 0], offset);
    }
  });
  return data;
}
