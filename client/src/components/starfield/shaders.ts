/** Points in the chain that trails the pointer; the dust reacts to each. */
export const TRAIL_SAMPLES = 5;
/** Camera distance in rose radii; sets how strongly depth reads. */
export const CAMERA_DISTANCE = 5.2;

/**
 * Every point is one camera-facing quad. The vertex shader places it: points
 * of the rose are evaluated on the rose's surface from (s, v, n), so the
 * whole figure unfurls, breathes and changes form through a few uniforms.
 *
 * Screen quantities are device pixels, origin at the viewport centre, y up.
 */
export const PARTICLE_VERTEX = /* glsl */ `
  #define TRAIL ${TRAIL_SAMPLES}
  #define TAU 6.28318530718
  #define CAMERA ${CAMERA_DISTANCE.toFixed(2)}

  attribute vec4 aParam;
  attribute vec4 aSeed;
  attribute vec4 aLook;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uDpr;
  uniform vec2 uCenter;
  uniform float uRadius;
  uniform vec4 uQuatHeart;
  uniform vec4 uQuatRim;
  uniform float uPresence;
  uniform float uDisperse;
  uniform float uGrow;
  uniform float uOpen;
  uniform float uWrite;
  uniform float uPen;
  uniform float uBreath;
  uniform float uFlow;
  uniform float uLight;
  uniform float uGain;

  uniform float uTurns;
  uniform float uPetals;
  uniform float uOpenOuter;
  uniform float uOpenInner;
  uniform float uNotch;
  uniform float uRuffle;
  uniform float uDepth;
  uniform float uInnerLength;
  uniform float uTwist;
  uniform float uSignature;
  uniform float uWarmth;
  uniform float uScriptZ;

  uniform vec2 uSkyShift;
  uniform float uSkyDim;
  uniform vec4 uQuiet;
  uniform vec4 uTrail[TRAIL];
  uniform vec2 uTrailVel[TRAIL];
  uniform vec3 uPointer;
  uniform float uFocus;
  uniform float uAperture;

  varying vec2 vUv;
  varying vec3 vColor;
  varying float vHot;
  varying vec4 vShape;
  varying vec2 vEdge;

  vec3 rotate(vec4 q, vec3 v) {
    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
  }

  float openingAt(float s) {
    float opening = uOpenOuter * pow(uOpenInner / uOpenOuter, s);
    // The bud stands nearly closed; the outer petals breathe a little.
    return opening * mix(0.24, 1.0, uOpen) + uBreath * (1.0 - s);
  }

  // 0 on a petal's lobes, 1 in the notch between two petals.
  float petalEdge(float theta) {
    float t = 1.0 - 2.0 * fract(theta * uPetals / TAU);
    float e = 1.25 * t * t - 0.25;
    return e * e;
  }

  float petalReach(float theta, float s, float edge) {
    float notch = uNotch * (1.0 - 0.6 * s);
    float ruffle = 1.0 + (1.0 - s) * uRuffle * 0.03 * sin(theta * uPetals * 6.0 + 1.7);
    // The sheet's outer end tucks under the turn above it instead of
    // stopping in the open.
    float tuck = mix(0.7, 1.0, smoothstep(0.0, 1.3 / (uPetals * uTurns), s));
    return (1.0 - notch * edge) * ruffle * tuck;
  }

  float petalLength(float s) {
    return mix(1.0, uInnerLength, s) * mix(0.7, 1.0, uOpen);
  }

  // Radius of the rim seen down the axis, at spiral angle theta.
  float rimRadius(float theta, float s) {
    float opening = openingAt(s);
    return petalReach(theta, s, petalEdge(theta)) * petalLength(s)
      * (sin(opening) + 0.15 * cos(opening));
  }

  vec3 rosePoint(float s, float v, float n, out float theta, out float lobe, out float radial) {
    theta = s * uTurns * TAU + uTwist;
    float opening = openingAt(s);
    float edge = petalEdge(theta);
    lobe = 1.0 - edge;
    float reach = petalReach(theta, s, edge) * petalLength(s);
    float belly = 1.95653 * v * v * (1.27689 * v - 1.0) * (1.27689 * v - 1.0);
    float sn = sin(opening);
    float cs = cos(opening);
    radial = reach * (v * sn + belly * cs) + n * cs;
    float height = reach * (v * cs - belly * sn) - n * sn
      + (1.0 - s) * uRuffle * 0.03 * sin(theta * uPetals * 4.0 + uTime * 0.21) * v;
    return vec3(radial * cos(theta), radial * sin(theta), height * uDepth);
  }

  // Night: emitted light. Cool rims, a blush through the middle, a warm heart.
  vec3 starColor(float s, float temperature) {
    float w = clamp(s + uWarmth * 0.34 + temperature * 0.1, 0.0, 1.0);
    vec3 color = mix(vec3(0.52, 0.72, 1.0), vec3(1.0, 0.8, 0.86), smoothstep(0.16, 0.62, w));
    color = mix(color, vec3(1.0, 0.8, 0.58), smoothstep(0.6, 1.0, w));
    color = mix(color, vec3(1.0, 0.56, 0.3), step(1.5, temperature));
    color = mix(color, vec3(0.34, 0.5, 1.0), step(1.5, -temperature));
    return color;
  }

  // Day: the same points as ink on paper, written as absorbance, so that
  // overlapping ink deepens and keeps its hue instead of greying. Blue-black
  // on the outer rims, through indigo and plum, to madder at the heart; each
  // point sits a little to one side of its neighbours' hue, and a few are
  // set apart in ochre or ultramarine. The signature is a seal's cinnabar.
  vec3 inkColor(float s, float temperature, float tint, float seal) {
    float w = clamp(s + uWarmth * 0.34 + temperature * 0.1 + (tint - 0.5) * 0.22, 0.0, 1.0);
    vec3 ink = mix(vec3(3.1, 2.6, 1.55), vec3(2.45, 2.3, 1.0), smoothstep(0.0, 0.3, w));
    ink = mix(ink, vec3(1.5, 2.3, 1.3), smoothstep(0.28, 0.66, w));
    ink = mix(ink, vec3(0.55, 2.2, 1.7), smoothstep(0.62, 1.0, w));
    ink = mix(ink, vec3(0.42, 1.25, 2.6), step(1.5, temperature));
    ink = mix(ink, vec3(2.9, 1.5, 0.45), step(1.5, -temperature));
    return mix(ink, vec3(0.3, 2.3, 2.4), seal);
  }

  void main() {
    float kind = aParam.w;
    float bright = aLook.x;
    float temperature = aLook.z;
    float alpha = 1.0;
    float s = 0.0;
    float figure = 1.0;
    vec3 p = vec3(0.0);
    vec4 q = uQuatHeart;
    vec2 px;
    float depth = 0.0;
    float mass = 0.55 + 1.6 * aSeed.x * aSeed.x + 0.12 * bright;

    if (kind < 1.5) {
      // Rim streams and veil dust ride the spiral, slowly, toward the rims.
      s = fract(aParam.x - uTime * uFlow * aLook.w);
      float theta;
      float lobe;
      float radial;
      p = rosePoint(s, aParam.y, aParam.z, theta, lobe, radial);

      // Tucked under the next petal in: what the inner turn covers is hidden,
      // which is what separates one petal's arc from the next.
      float turn = 1.0 / uTurns;
      float covered = rimRadius(theta + TAU, min(1.0, s + turn));
      float heart = rimRadius(theta, s) * 0.72;
      covered = mix(covered, heart, smoothstep(1.0 - turn - 0.05, 1.0 - turn + 0.05, s));
      alpha *= smoothstep(covered * 0.9, covered * 1.0, radial);

      // The spiral is not a loop: ease points in and out at its two ends.
      alpha *= smoothstep(0.0, 0.03, s) * (1.0 - smoothstep(0.975, 1.0, s));
      // Petal tips carry the light; the notches fall back.
      float tip = smoothstep(0.0, 0.85, lobe);
      alpha *= kind < 0.5 ? mix(0.34, 1.0, tip) : mix(0.5, 1.0, tip);
      // Light comes from the heart: inner petals glow, outer ones cool off,
      // and a slow wave of it travels along the spiral.
      bright *= mix(0.74, kind < 0.5 ? 1.45 : 1.05, s * sqrt(s));
      bright *= 1.0 + 0.2 * sin(theta - uTime * 0.3);
      // The spiral draws itself from the heart outward.
      float front = 1.0 - uGrow * 1.24;
      alpha *= smoothstep(front, front + 0.16, s);
      bright *= 1.0 + 2.2 * exp(-pow((s - front - 0.1) / 0.06, 2.0)) * (1.0 - smoothstep(0.85, 1.0, uGrow));

      q = normalize(mix(uQuatRim, uQuatHeart, smoothstep(0.0, 1.0, s)));
    } else if (kind < 2.5) {
      // The signature; where a figure carries none, a small cluster of stamens.
      vec3 cluster = normalize(aSeed.xyz - 0.5 + 1e-3) * pow(aSeed.w, 0.6) * vec3(0.13, 0.13, 0.08);
      p = mix(cluster, vec3(aParam.xy, 0.0), uSignature);
      p.z += uScriptZ;
      float written = smoothstep(aParam.z - 0.03, aParam.z + 0.004, uWrite);
      alpha *= mix(smoothstep(0.7, 1.0, uGrow), written, uSignature);
      bright *= 1.0 + 1.5 * uSignature * exp(-pow((aParam.z - uPen) / 0.04, 2.0));
      bright *= mix(0.5, 1.3, uSignature);
      s = 1.0;
      mass *= 2.4;
    } else if (kind < 3.5) {
      // Pollen in slow orbit, faster nearer the heart.
      float radius = length(aParam.xy);
      float angle = uTime * 0.016 * aLook.w / (0.35 + radius);
      float c = cos(angle);
      float sn = sin(angle);
      p = vec3(aParam.x * c - aParam.y * sn, aParam.x * sn + aParam.y * c,
        aParam.z + 0.05 * sin(uTime * 0.13 * aLook.w + aSeed.y * TAU));
      s = clamp(1.0 - radius * 0.62, 0.0, 1.0);
      alpha *= smoothstep(0.35, 1.0, uGrow) * (1.0 - smoothstep(1.7, 2.4, radius) * 0.7);
      q = uQuatRim;
      mass *= 0.7;
    } else if (kind < 4.5) {
      figure = 0.0;
    } else if (kind < 5.5) {
      p = vec3(
        aParam.x + 0.16 * sin(uTime * 0.05 * aLook.w + aSeed.x * TAU),
        aParam.y + 0.12 * sin(uTime * 0.04 * aLook.w + aSeed.y * TAU),
        aParam.z);
      s = aSeed.z;
      // Soft discs read as light at night and as stains on paper.
      alpha *= smoothstep(0.5, 1.0, uGrow) * (1.0 - uLight);
      q = uQuatRim;
      mass = 0.5;
    } else {
      p = vec3(0.0, 0.0, uScriptZ - 0.04);
      s = 1.0;
      alpha *= smoothstep(0.55, 1.0, uGrow);
      mass = 50.0;
    }

    float persp = 1.0;
    if (figure > 0.5) {
      // Leaving the page, the figure loosens into drifting dust.
      float scatter = uDisperse * (0.5 + 0.95 * aSeed.x);
      vec3 away = normalize(aSeed.yzw - 0.5 + 1e-3);
      p = p * (1.0 + 0.42 * scatter) + away * scatter * (0.2 + 0.85 * aSeed.w);
      alpha *= 1.0 - 0.82 * uDisperse;

      vec3 view = rotate(q, p);
      depth = view.z;
      // Nearer points catch a little more light.
      bright *= 1.0 + 0.4 * clamp(view.z, -0.5, 0.6);
      persp = CAMERA / (CAMERA - view.z);
      px = uCenter + view.xy * persp * uRadius;
      alpha *= uPresence;

      // The pointer's wake: a short chain of soft points trails the hand.
      // Each parts the dust around it and carries it a little way along. The
      // parting is zero under the hand itself and falls away smoothly, so
      // nothing snaps; light dust yields most, bright stars hardly at all.
      vec2 push = vec2(0.0);
      for (int i = 0; i < TRAIL; i++) {
        vec4 node = uTrail[i];
        vec2 delta = (px - node.xy) / node.w;
        float fall = exp(-dot(delta, delta) * 1.5) * node.z;
        push += (delta * node.w * 0.4 + uTrailVel[i]) * fall;
      }
      px += push * min(1.7, 1.0 / mass);
    } else {
      // The far sky: fixed to the page, drifting slightly against it.
      vec2 extent = uResolution * 0.5 + 60.0 * uDpr;
      px = aParam.xy * extent + uSkyShift * aParam.z;
      px = mod(px + extent, 2.0 * extent) - extent;
      alpha *= uSkyDim * mix(1.0, 0.5, uLight);
      s = aSeed.z * 0.5;
    }

    // Text columns stay quiet.
    float column = 1.0 - smoothstep(uQuiet.y, uQuiet.y + uQuiet.z, abs(px.x - uQuiet.x));
    alpha *= 1.0 - uQuiet.w * column;

    // A soft light follows the pointer through the dust.
    vec2 toPointer = px - uPointer.xy;
    float lit = uPointer.z * exp(-dot(toPointer, toPointer) / (uDpr * uDpr * 11000.0));
    bright *= 1.0 + figure * lit * mix(0.85, 0.2, smoothstep(0.6, 3.0, bright));

    float prominence = smoothstep(1.1, 8.5, bright);
    float star = smoothstep(0.94, 1.02, aLook.y);
    float scale = clamp(pow(uRadius / (uDpr * 330.0), 0.5), 0.55, 1.2);
    scale = mix(1.0, scale, figure);
    // Dark dots on a light ground read thinner than light on dark.
    float core = aLook.y * uDpr * mix(1.0, persp, 0.85) * scale * mix(1.0, 1.12, uLight);
    float ext = mix(2.4, mix(5.0, 9.5, prominence), star);
    float halo = star * mix(0.05, 0.16, prominence);
    float spike = smoothstep(4.5, 9.0, aLook.x);

    if (kind > 5.5) {
      // The heart's glow: one wide, soft sprite.
      core = uRadius * 0.34 * mix(0.55, 1.0, uSignature);
      ext = 2.4;
      halo = 0.0;
      spike = 0.0;
      bright = mix(0.055, 0.03, uLight) * mix(0.6, 1.0, uSignature);
      prominence = 0.0;
    }

    // Depth of field: the whole flower sits inside the focal band and stays
    // sharp; dust well off it spreads and dims, and the few motes near the
    // lens open into discs.
    float blur = max(0.0, abs(depth - uFocus) - 0.22) * uAperture * uRadius * figure;
    if (kind > 4.5 && kind < 5.5) blur *= 4.6;
    float spread = sqrt(core * core + blur * blur);
    float bokeh = smoothstep(1.4, 3.6, blur / core) * step(kind, 5.5);
    float energy = (core * core) / (spread * spread);
    // Below a pixel, hold the size and trade it for brightness: no flicker.
    float floorPx = mix(0.62, 0.8, smoothstep(1.0, 2.0, uDpr));
    float drawn = max(spread, floorPx);
    energy *= (spread * spread) / (drawn * drawn);
    // Small and in focus, a point is drawn hard-edged; depth blur and sheer
    // size (the few real stars, the heart's glow) soften it.
    float soft = max(
      smoothstep(0.35, 1.4, blur / core),
      smoothstep(1.1, 2.2, drawn / uDpr));
    // On paper a large point is a drop of ink, not a glow: keep its edge.
    soft *= mix(1.0, 0.3, uLight * step(kind, 5.5));

    // Bright stars scintillate, dust holds steady.
    float twinkle = 1.0 + star * 0.16 * sin(uTime * (0.7 + 1.7 * aSeed.y) + aSeed.z * TAU);

    float night = bright * alpha * energy * twinkle;
    // Ink does not glow: compress the range and keep dots solid.
    // The rims are drawn with a loaded pen, the veil with a dry one, and the
    // signature is pressed on.
    float load = kind < 0.5 ? 1.2 : (kind < 1.5 ? 0.95 : (kind < 2.5 ? mix(0.7, 1.5, uSignature) : 1.0));
    float day = pow(aLook.x, 0.42) * alpha * energy * (kind > 5.5 ? 0.05 : 1.15 * load)
      * mix(1.0, 1.2, lit);
    ext = mix(ext, mix(2.4, 3.6, prominence), uLight * step(kind, 5.5));
    halo *= mix(1.0, 0.22, uLight);
    spike *= mix(1.0, 0.55, uLight);

    vec3 nightColor = mix(starColor(s, temperature), vec3(1.0), 0.3 * prominence) * night;
    float seal = kind > 1.5 && kind < 2.5 ? uSignature : 0.0;
    vec3 dayColor = inkColor(s, temperature, aSeed.w, seal) * day;
    vColor = mix(nightColor, dayColor, uLight) * uGain;
    vHot = night * prominence * 0.7 * (1.0 - uLight) * uGain;

    float reach = mix(ext, 1.18, bokeh);
    vShape = vec4(reach, halo, spike, bokeh);
    vEdge = vec2(drawn, soft);
    vUv = position.xy;

    float size = drawn * reach;
    vec2 corner = px + position.xy * size;
    // Nothing to draw: collapse the quad instead of rasterising it.
    float visible = step(0.0008, max(night, day * uLight));
    gl_Position = vec4(corner / (uResolution * 0.5) * visible, 0.0, 1.0);
    if (visible < 0.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  }
`;

export const PARTICLE_FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vHot;
  varying vec4 vShape;
  varying vec2 vEdge;

  void main() {
    float d2 = dot(vUv, vUv);
    if (d2 > 1.0) discard;
    float d = sqrt(d2);
    float x = d * vShape.x;
    // In focus, a point is a disc with one device pixel of feather: crisp at
    // any size and any pixel ratio, with only a breath of skirt. Where depth
    // or size softens it, it opens into a gaussian.
    float feather = clamp(0.75 / vEdge.x, 0.05, 0.9);
    float pip = 1.0 - smoothstep(1.0 - feather, 1.0 + feather, x);
    float gauss = exp(-x * x * 0.5);
    float core = mix(1.4 * pip + 0.1 * gauss, gauss, vEdge.y);
    float halo = vShape.y * exp(-x * 0.62);
    vec2 a = abs(vUv);
    float spike = vShape.z * 0.42 * (
      exp(-a.y * vShape.x * 1.5) * exp(-a.x * 4.2) +
      exp(-a.x * vShape.x * 1.5) * exp(-a.y * 4.2));
    float disc = smoothstep(1.0, 0.84, d) * (0.55 + 0.45 * d2) * 2.0;
    float glow = mix(core + halo + spike, disc, vShape.w);
    // Fade to nothing at the quad's edge, whatever the profile.
    glow *= 1.0 - smoothstep(0.72, 1.0, d);
    gl_FragColor = vec4(vColor * glow + vec3(vHot * core), 1.0);
  }
`;

export const QUAD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * The one full-screen pass. The particle buffer holds emitted light at night
 * and ink absorbance by day; only the transfer function differs.
 */
export const COMPOSITE_FRAGMENT = /* glsl */ `
  uniform sampler2D tScene;
  uniform sampler2D tBloom;
  uniform float uBloom;
  uniform float uBleed;
  uniform float uInk;
  uniform float uLight;
  uniform float uExposure;
  uniform float uGain;
  uniform vec3 uNight;
  uniform vec3 uPaper;
  uniform vec3 uAir;
  uniform vec3 uGlow;
  uniform vec2 uResolution;
  uniform float uTime;
  varying vec2 vUv;

  // Stephen Hill's ACES fit: highlights roll off toward white, not clip.
  vec3 fit(vec3 v) {
    vec3 a = v * (v + 0.0245786) - 0.000090537;
    vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
    return a / b;
  }
  vec3 aces(vec3 color) {
    const mat3 inputMatrix = mat3(
      vec3(0.59719, 0.07600, 0.02840),
      vec3(0.35458, 0.90834, 0.13383),
      vec3(0.04823, 0.01566, 0.83777));
    const mat3 outputMatrix = mat3(
      vec3(1.60475, -0.10208, -0.00327),
      vec3(-0.53108, 1.10813, -0.07276),
      vec3(-0.07367, -0.00605, 1.07602));
    return clamp(outputMatrix * fit(inputMatrix * color), 0.0, 1.0);
  }
  vec3 encode(vec3 linear) {
    return mix(
      linear * 12.92,
      pow(linear, vec3(0.41666)) * 1.055 - 0.055,
      step(vec3(0.0031308), linear));
  }
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec3 scene = texture2D(tScene, vUv).rgb * uGain;
    vec3 bloom = texture2D(tBloom, vUv).rgb * uGain;

    // A breath of air around the figure lifts it off the black.
    vec2 fromGlow = (gl_FragCoord.xy - uResolution * 0.5 - uGlow.xy) / max(uGlow.z, 1.0);
    float air = exp(-dot(fromGlow, fromGlow));

    vec3 night = uNight + uAir * air + aces((scene + bloom * uBloom) * uExposure);
    vec3 day = uPaper * exp(-(scene * uInk + bloom * uBleed));
    vec3 color = encode(clamp(mix(night, day, uLight), 0.0, 1.0));

    // Triangular dither keeps the soft gradients free of banding.
    float n = hash(gl_FragCoord.xy + fract(uTime) * 61.7)
      + hash(gl_FragCoord.xy * 1.37 + 17.0 + fract(uTime) * 23.1) - 1.0;
    gl_FragColor = vec4(color + n / 255.0, 1.0);
  }
`;
