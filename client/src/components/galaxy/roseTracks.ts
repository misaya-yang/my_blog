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

/** Nested, offset contours traced from rose-lvy-source.png, not radial oval lobes. */
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
  // Pixel coordinates retain the source's irregular, wrapping petal silhouette.
  // Each contour encircles the recessed heart instead of returning through it.
  const contours = [
    [
      [668, 72],
      [788, 147],
      [908, 226],
      [925, 312],
      [1084, 319],
      [1171, 440],
      [1186, 541],
      [1200, 700],
      [1163, 810],
      [1085, 871],
      [1030, 885],
      [934, 1004],
      [826, 1070],
      [716, 1138],
      [575, 1145],
      [501, 1100],
      [445, 1000],
      [374, 1026],
      [290, 1012],
      [220, 958],
      [129, 938],
      [90, 862],
      [78, 755],
      [100, 620],
      [181, 533],
      [206, 484],
      [258, 393],
      [340, 343],
      [306, 278],
      [335, 208],
      [355, 129],
      [454, 99],
      [575, 89],
    ],
    [
      [347, 348],
      [432, 284],
      [486, 246],
      [584, 239],
      [664, 251],
      [737, 291],
      [792, 369],
      [831, 443],
      [850, 514],
      [884, 560],
      [946, 604],
      [1057, 691],
      [1070, 761],
      [1046, 824],
      [1028, 884],
      [926, 891],
      [881, 947],
      [806, 980],
      [695, 972],
      [564, 943],
      [480, 904],
      [440, 875],
      [366, 877],
      [272, 875],
      [244, 837],
      [225, 755],
      [250, 671],
      [278, 574],
      [295, 468],
    ],
    [
      [438, 489],
      [480, 441],
      [493, 376],
      [582, 342],
      [645, 364],
      [683, 342],
      [756, 345],
      [830, 403],
      [891, 494],
      [902, 566],
      [888, 644],
      [891, 713],
      [865, 778],
      [838, 835],
      [795, 873],
      [722, 894],
      [639, 908],
      [555, 892],
      [492, 854],
      [462, 797],
      [421, 743],
      [397, 714],
      [372, 616],
    ],
    [
      [618, 493],
      [663, 508],
      [752, 550],
      [800, 616],
      [802, 681],
      [787, 744],
      [740, 787],
      [674, 825],
      [602, 848],
      [559, 824],
      [514, 795],
      [470, 748],
      [451, 693],
      [467, 628],
      [502, 556],
      [552, 512],
    ],
  ];
  contours.forEach((contour, layer) => {
    add(
      contour.map(([x, y]) => {
        const px = (x - 635) * 0.006,
          py = (655 - y) * 0.006;
        const angle = Math.atan2(py, px);
        return new Vector3(
          px,
          py,
          -1.2 +
            Math.pow(Math.hypot(px, py) / 3.4, 1.4) * 2.0 +
            (0.6 + Math.hypot(px, py) * 0.45) * Math.cos(angle + layer * 1.7)
        );
      }),
      true
    );
  });
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
