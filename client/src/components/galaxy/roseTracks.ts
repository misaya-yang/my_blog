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
 * petals overlap, the way the source drawing reads. Depth is a cupped bowl:
 * outer layers rise toward the viewer and each petal's tip lifts a little
 * more than its notches, so the rose keeps its volume when it turns.
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
};

export const PETAL_LAYERS: readonly PetalLayer[] = [
  { radius: 2.95, petals: 5, offset: 0.35, lobe: 0.15, cx: 0, cy: 0.02 },
  {
    radius: 2.2,
    petals: 5,
    offset: 0.35 + Math.PI / 5,
    lobe: 0.14,
    cx: -0.04,
    cy: 0.05,
  },
  { radius: 1.55, petals: 4, offset: 0.9, lobe: 0.12, cx: 0.05, cy: 0.02 },
  { radius: 1.08, petals: 3, offset: 2.1, lobe: 0.09, cx: 0.0, cy: -0.03 },
];
const OUTER_RADIUS = PETAL_LAYERS[0].radius;
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
    const reach = Math.hypot(x, y) / OUTER_RADIUS;
    const z = -1.05 + Math.pow(reach, 1.7) * 1.5 + (lobe - 0.6) * 0.3 * reach;
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
  for (const stroke of strokes)
    add(
      stroke.map(
        ([x, y]) => new Vector3((x - 635) * 0.006, (655 - y) * 0.006, -1.42)
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
