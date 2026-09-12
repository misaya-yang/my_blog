import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Quaternion,
  Euler,
  Vector3,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  Matrix4,
  DataTexture,
  FloatType,
  RGBAFormat,
  NearestFilter,
  ACESFilmicToneMapping,
  NoToneMapping,
  PlaneGeometry,
  NormalBlending,
  Vector2,
  Vector4,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "three";
import {
  createRoseTracks,
  bakeTracks,
  TRACK_SAMPLES,
  PETAL_TRACKS,
  sampleTrack,
} from "./roseTracks";
import { RotationMotion } from "./rotationMotion";
import { PointerWake, WAKE_SAMPLES, WAKE_LIFETIME } from "./pointerWake";
import { createPhaseSampler, ribbonWidth } from "./particleDistribution";
import { bakeAmbientTracks, getAmbientProfile } from "./ambientScene";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { BloomPyramidPass } from "./bloomPyramid";
import { projectTrackball, trackballDelta } from "./trackball";
import { getPageScene } from "./pageScene";
import { getScrollMotion, type MotionState } from "./scrollMotion";

/**
 * Calculates dust particle brightness according to cubic power-law distribution.
 * Range: [0.35, 2.00]
 */
export function calculateDustBrightness(rand: number): number {
  return 0.35 + Math.pow(rand, 3) * 1.65;
}

/**
 * Calculates star brightness according to power-law distribution (x^2.6).
 * Standard range: [0.40, 3.00]
 * Clustered heart stars range: [2.00, 2.60]
 */
export function calculateStarBrightness(rand: number, isHeart = false): number {
  return isHeart ? 2.0 + rand * 0.6 : 0.4 + Math.pow(rand, 2.6) * 2.6;
}

/**
 * Evaluates diffraction spike prominence gate: smoothstep(2.2, 3.0, aBright).
 * Only high-magnitude stars (aBright >= 2.2) receive diffraction spikes.
 */
export function calculateProminence(aBright: number): number {
  const min = 2.2;
  const max = 3.0;
  const x = Math.max(0, Math.min(1, (aBright - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

/**
 * Evaluates the intro reveal convergence progress for a star/dust particle.
 * Guarantees all particles reach 100% convergence (t = 1.0, local = 1.0)
 * before uIntro reaches 1.0 (specifically by uIntro = 0.95), eliminating any snapping pop.
 */
export function evaluateIntroConvergence(
  uIntro: number,
  iseed: { x: number; y: number; z: number }
): {
  t: number;
  local: number;
  introT: number;
  travelT: number;
  isFullyConverged: boolean;
} {
  if (uIntro >= 1.0) {
    return {
      t: 1.0,
      local: 1.0,
      introT: 1.0,
      travelT: 1.0,
      isFullyConverged: true,
    };
  }
  const seen = Math.min(1, Math.max(0, (uIntro - iseed.z * 0.14) / 0.22));
  const delay = iseed.x * 0.22 + iseed.y * 0.08;
  const rawT = Math.min(1, Math.max(0, (uIntro - delay - 0.10) / 0.55));
  const t = rawT >= 1.0 - 1e-5 ? 1.0 : rawT;
  if (t >= 1.0) {
    return {
      t: 1.0,
      local: 1.0,
      introT: 1.0,
      travelT: 1.0,
      isFullyConverged: true,
    };
  }
  let local = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  local = 0.5 * (local + Math.sin(local * 1.5707963));
  const fieldFade = seen * seen * (3.0 - 2.0 * seen);
  const introT = fieldFade + (1.0 - fieldFade) * local;
  return {
    t,
    local,
    introT,
    travelT: local,
    isFullyConverged: false,
  };
}

export function createGalaxy(
  host: HTMLElement,
  light = false,
  reducedMotion = false,
  page = "/"
) {
  let mobile = host.clientWidth < 640;
  const coarsePointer =
    typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: false,

    powerPreference: "low-power",
  });
  renderer.setPixelRatio(
    Math.min(devicePixelRatio, mobile && coarsePointer ? 1.25 : 1.5)
  );
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.dataset.instance = crypto.randomUUID();
  host.appendChild(renderer.domElement);
  host.style.contain = "strict";
  host.style.willChange = "transform, opacity";
  host.style.transform = "translateZ(0)";
  if (host.parentElement) {
    host.parentElement.style.contain = "layout paint size";
    host.parentElement.style.willChange = "transform";
  }
  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, 0.1, 40);
  camera.position.z = 10.4;
  const group = new Group();
  group.rotation.set(0.28, -0.5, -0.4);
  scene.add(group);
  // Dust and luminous stars have independent geometry and optical profiles.
  // Billboard stars keep a broad halo without relying on hardware point-size limits.
  const count = 4600;
  const positions = new Float32Array(count * 3);
  const tracks = createRoseTracks();
  const phaseSamplers = tracks.map((_, i) => createPhaseSampler(i));
  const starPhaseSamplers = tracks.map((_, i) => createPhaseSampler(i, true));
  const trackData = bakeTracks(tracks);
  tracks.forEach((track, row) => {
    for (let i = 0; i <= TRACK_SAMPLES; i++) {
      trackData[(row * (TRACK_SAMPLES + 1) + i) * 4 + 3] = track.signature
        ? 1
        : ribbonWidth(row, i / TRACK_SAMPLES);
    }
  });
  const trackTexture = new DataTexture(
    trackData,
    TRACK_SAMPLES + 1,
    tracks.length,
    RGBAFormat,
    FloatType
  );
  trackTexture.minFilter = trackTexture.magFilter = NearestFilter;
  trackTexture.needsUpdate = true;
  // Second contour set: the per-article constellation the rose morphs into
  // wherever the brand rose itself is not the subject.
  const ambientData = new Float32Array(trackData.length);
  const ambientTexture = new DataTexture(
    ambientData,
    TRACK_SAMPLES + 1,
    tracks.length,
    RGBAFormat,
    FloatType
  );
  ambientTexture.minFilter = ambientTexture.magFilter = NearestFilter;
  ambientTexture.needsUpdate = true;
  const flows = new Float32Array(count * 4);
  const colors = new Float32Array(count * 3);
  const dayColors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const brights = new Float32Array(count);
  const starCount = 300;
  const heartStarCount = 24;
  const starFlows = new Float32Array(starCount * 4);
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const dayStarColors = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  const starBrights = new Float32Array(starCount);
  let seed = 42;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const palette = ["#9ad8ff", "#e3f3ff", "#ffb878", "#b5d4ff"].map(
    value => new Color(value)
  );
  // Day inks must hold their own against near-white paper: deeper and more
  // chromatic than the night palette, since day cannot lean on additive glow.
  const dayPalette = ["#14508f", "#0e6b7a", "#a8541c", "#4a5fa5"].map(
    value => new Color(value)
  );
  const petalLength = tracks
    .slice(0, PETAL_TRACKS)
    .reduce((sum, track) => sum + track.length, 0);
  const petalDistribution = tracks
    .slice(0, PETAL_TRACKS)
    .map(
      (_, index) =>
        tracks
          .slice(0, index + 1)
          .reduce((sum, track) => sum + track.length, 0) / petalLength
    );
  // Track density follows arc length, so short inner contours do not accumulate stars.
  // Heart stars pin to the signature strokes so the lvy script becomes the brightest region.
  function sample(index: number, star = false, forceTrackId?: number) {
    const signature = !star && index % 13 === 0;
    const choice = (index * 0.61803398875) % 1;
    const trackId =
      forceTrackId ??
      (signature
        ? PETAL_TRACKS + (index % 2)
        : petalDistribution.findIndex(end => choice < end));
    const track = tracks[trackId];
    const quantile = random();
    const phase = signature
      ? quantile
      : (star ? starPhaseSamplers : phaseSamplers)[trackId](quantile);
    // A narrow stream with occasional detached motes, rather than a filled strip.
    const transverse = random() * 2 - 1;
    const across =
      forceTrackId != null
        ? (random() * 2 - 1) * 0.045
        : signature
          ? 0.005
          : Math.sign(transverse) *
            Math.pow(Math.abs(transverse), 1.8) *
            (star ? 0.1 : index % 9 === 0 ? 0.35 : 0.15);
    const point = sampleTrack(track, phase).toArray();
    return { point, orbit: [trackId, phase, 1 / track.period, across] };
  }
  for (let i = 0; i < count; i++) {
    const particle = sample(i);
    positions.set(particle.point, i * 3);
    flows.set(particle.orbit, i * 4);
    // Power-law brightness: a few luminous motes carry the eye, the rest stay dim.
    // Colour follows brightness (bright = white or warm, dim = blue) instead of a
    // repeating modulo pattern that imposed a rhythm along every stream.
    const bright = calculateDustBrightness(random());
    brights[i] = bright;
    const color =
      bright > 1.35
        ? random() < 0.55
          ? 1
          : 2
        : random() < 0.62
          ? 0
          : 3;
    palette[color].toArray(colors, i * 3);
    dayPalette[color].toArray(dayColors, i * 3);
    sizes[i] =
      particle.orbit[0] >= PETAL_TRACKS
        ? 1.65
        : (i % 4 === 0 ? 2.1 + random() * 1.1 : 1.2 + random() * 0.7) *
          (0.78 + 0.5 * Math.min(1, bright / 2));
  }
  for (let i = 0; i < starCount; i++) {
    const heart = i < heartStarCount;
    const particle = sample(i, true, heart ? PETAL_TRACKS + (i % 2) : undefined);
    starPositions.set(particle.point, i * 3);
    starFlows.set(particle.orbit, i * 4);
    // Size is the visible core diameter in CSS pixels, independent of halo.
    const bright = calculateStarBrightness(random(), heart);
    starBrights[i] = bright;
    const color =
      bright > 1.6 ? (random() < 0.5 ? 1 : 2) : random() < 0.7 ? 0 : 3;
    palette[color].toArray(starColors, i * 3);
    dayPalette[color].toArray(dayStarColors, i * 3);
    starSizes[i] = heart
      ? 2.8 + random() * 0.8
      : 1.7 + Math.pow((bright - 0.4) / 2.6, 1.1) * 2.3;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aOrbit", new BufferAttribute(flows, 4));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.setAttribute("aDayColor", new BufferAttribute(dayColors, 3));
  geometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
  geometry.setAttribute("aBright", new BufferAttribute(brights, 1));
  const controls = host.parentElement!;
  const pointerWake = new PointerWake();
  const deformation = `
    uniform float uTime; uniform float uLight; uniform float uIntro;
    uniform vec2 uMomentum; uniform float uScatterRadius;
    attribute vec4 aOrbit;
    uniform sampler2D uTracks;
    uniform float uTrackRows;
    uniform sampler2D uAmbientTracks;
    uniform float uAmbientBlend;
    uniform vec3 uAmbientDrift;
    uniform float uAmbientTwinkle;
    vec4 trackPoint(float phase) {
      float sampleIndex = clamp(phase,0.0,1.0)*512.0;
      float row = (aOrbit.x+0.5)/uTrackRows;
      vec4 a = texture2D(uTracks,vec2((floor(sampleIndex)+0.5)/513.0,row));
      vec4 b = texture2D(uTracks,vec2((min(floor(sampleIndex)+1.0,512.0)+0.5)/513.0,row));
      return mix(a,b,fract(sampleIndex));
    }
    // Same layout as uTracks, carrying the per-article constellation instead.
    vec4 ambientPoint(float phase) {
      float sampleIndex = clamp(phase,0.0,1.0)*512.0;
      float row = (aOrbit.x+0.5)/uTrackRows;
      vec4 a = texture2D(uAmbientTracks,vec2((floor(sampleIndex)+0.5)/513.0,row));
      vec4 b = texture2D(uAmbientTracks,vec2((min(floor(sampleIndex)+1.0,512.0)+0.5)/513.0,row));
      return mix(a,b,fract(sampleIndex));
    }
    float flowPhase(float age) { return fract(aOrbit.y+(uTime-age)*aOrbit.z); }
    float flowFade(vec3 p) {
      if (aOrbit.x < ${PETAL_TRACKS}.0) return 1.0;
      float f = flowPhase(0.0);
      return smoothstep(0.0,0.025,f)*(1.0-smoothstep(0.975,1.0,f));
    }
    uniform vec3 uPagePose;
    uniform vec2 uPreviousPointer;
    uniform float uEnergy;
    uniform float uDisperse;
    uniform float uSplit;
    uniform float uPreviousSplit;
    uniform float uScrollPhase;
    uniform float uPreviousScrollPhase;
    uniform float uSideX;
    uniform vec2 uPointer;
    uniform float uHover;
    uniform float uAspect;
    uniform vec4 uWakeSegments[${WAKE_SAMPLES}];
    uniform vec4 uWakeImpulses[${WAKE_SAMPLES}];
    uniform float uWakeTime; uniform float uWakeRadius;
    uniform float uWakeActive;
    vec2 wakeOffset(vec2 point, float historyAge, vec3 seed) {
      if (uWakeActive < 0.5) return vec2(0.0);
      vec2 offset = vec2(0.0); float weight = 0.0;
      for (int i=0;i<${WAKE_SAMPLES};i++) {
        vec4 impulse = uWakeImpulses[i];
        float age = uWakeTime-historyAge-impulse.z;
        if (impulse.w < 0.5 || age < 0.0 || age >= ${WAKE_LIFETIME}) continue;
        vec4 segment = uWakeSegments[i]; vec2 travel = segment.zw-segment.xy;
        float along = clamp(dot(point-segment.xy,travel)/max(dot(travel,travel),0.000001),0.0,1.0);
        vec2 distance = point-mix(segment.xy,segment.zw,along);
        float spatial = exp(-dot(distance,distance)/(uWakeRadius*uWakeRadius)*2.0);
        // Per-particle inertia, with honest physics: every particle is pushed by
        // impulse/mass, and light ones stop fast while heavy ones drift on. The
        // differential response shreds the patch into individual motions instead
        // of one slow coherent smear across the rose.
        float mass = 0.45 + seed.x*seed.x*1.6;
        float fade = (1.0-exp(-age*18.0))*exp(-age*(0.8+seed.z*0.45)/mass)
          *(1.0-smoothstep(0.7,${WAKE_LIFETIME},age));
        float influence = spatial*fade;
        vec2 direction = normalize(impulse.xy+vec2(0.00001));
        vec2 lateral = vec2(-direction.y,direction.x);
        vec2 outward = normalize(distance + vec2(cos(seed.x*6.283),sin(seed.x*6.283))*0.008);
        float force = min(length(impulse.xy), 0.05);
        vec2 scattering = impulse.xy*((0.5+seed.x*0.8)/mass)
          + lateral*(seed.y-0.5)*force*2.0
          + outward*force*(0.12+seed.z*0.45);
        offset += scattering*influence; weight += influence;
      }
      return offset/max(1.0,weight);
    }
    float cursorLight(vec4 view) {
      vec4 projected = projectionMatrix * view;
      vec2 delta = (projected.xy / projected.w - uPointer) * vec2(uAspect,1.0);
      return exp(-dot(delta,delta)*24.0)*uHover;
    }
    // Starfall convergence: a viewport-wide scattered field fades in first,
    // then each star departs on a staggered schedule and is captured along a
    // curved arc around the heart, easing into place with a soft snap.
    float gIntroT = 1.0;
    float gTravelT = 1.0;
    float gAmbientT = 0.0;
    vec3 applyIntro(vec3 p, vec3 original) {
      if (uIntro >= 1.0) { gIntroT = 1.0; gTravelT = 1.0; return p; }
      vec3 iseed = fract(sin(vec3(
        dot(original.xy, vec2(12.9898, 78.233)),
        dot(original.xy, vec2(39.346, 11.135)),
        dot(original.yx, vec2(73.156, 52.235))) ) * 43758.5453);
      // A round field wide enough to spill past every viewport edge: a uniform
      // rectangle reads as a block of stars, a disk with a feathered rim reads
      // as a sky. The rim also fades each star's presence for a soft boundary.
      float angle = iseed.y * 6.2831853;
      float scatterR = sqrt(iseed.z) * uScatterRadius;
      vec3 scattered = vec3(
        cos(angle) * scatterR * 1.3,
        sin(angle) * scatterR * 0.85,
        (iseed.x - 0.5) * 0.8);
      float seen = clamp((uIntro - iseed.z*0.14) / 0.22, 0.0, 1.0);
      float rim = 1.0 - smoothstep(0.72, 1.0, scatterR / max(uScatterRadius, 0.001));
      float delay = iseed.x * 0.22 + iseed.y * 0.08;
      float t = clamp((uIntro - delay - 0.10) / 0.55, 0.0, 1.0);
      float local = 1.0;
      if (t < 1.0) {
        local = t*t*t*(t*(t*6.0-15.0)+10.0);
        local = mix(local, sin(local*1.5707963), 0.5);
      }
      float fieldFade = seen*seen*(3.0-2.0*seen) * rim;
      gIntroT = mix(fieldFade, 1.0, local);
      float arc = sin(local*3.14159265) * (0.5 + iseed.z*0.35);
      float c = cos(arc), s = sin(arc);
      vec3 orbiting = vec3(
        scattered.x*c - scattered.y*s,
        scattered.x*s + scattered.y*c,
        scattered.z);
      gTravelT = local;
      return mix(orbiting, p, local);
    }
    vec4 particleView(vec3 original, float age) {
      mat4 particleMatrix = modelViewMatrix;
      gAmbientT = uAmbientBlend;
      float historicalSplit = uSplit;
      float radius = length(original);
      float scroll = mix(uScrollPhase,uPreviousScrollPhase,min(age*1.6,1.0));
      float phase = flowPhase(age);
      vec4 trackSample = trackPoint(phase);
      vec3 p = trackSample.xyz;
      vec3 neighbor = trackPoint(aOrbit.x < ${PETAL_TRACKS}.0 ? fract(phase+0.002) : min(phase+0.002,1.0)).xyz;
      vec2 tangent2 = normalize(neighbor.xy-p.xy+vec2(0.000001));
      float across = aOrbit.w*trackSample.w;
      p.xy += vec2(-tangent2.y,tangent2.x)*across;
      p.z += aOrbit.x < ${PETAL_TRACKS}.0 ? sin(aOrbit.y*109.0)*abs(across)*1.5 : 0.0;
      p = applyIntro(p, original);
      // The per-article constellation: off the rose tracks, onto seeded
      // contours with a slow drift, morphed only where the rose is not the subject.
      if (uAmbientBlend > 0.001) {
        vec4 ambient = ambientPoint(phase);
        vec2 wander = vec2(
          sin(uTime*0.31 + original.y*2.3 + aOrbit.y*6.283),
          cos(uTime*0.23 + original.x*1.9 + aOrbit.y*4.1)) * 0.07;
        vec2 figure = ambient.xy + wander
          + uAmbientDrift.xy * sin(uTime*uAmbientDrift.z*6.283 + original.z*0.5);
        figure += vec2(-tangent2.y, tangent2.x) * across * (0.35 + 0.65*sin(original.z*3.7));
        p = mix(p, vec3(figure, ambient.z), uAmbientBlend);
      }
      float burst = uDisperse;
      vec3 radial = normalize(original + vec3(0.0001));
      vec3 tangent = normalize(vec3(-original.y, original.x, original.z * 0.15) + vec3(0.0001));
      p += radial * burst * (0.35 + radius * 0.65) + tangent * burst * 0.45;
      vec4 view = particleMatrix * vec4(p, 1.0);
      if (aOrbit.x >= ${PETAL_TRACKS}.0) {
        // Keep the handwritten strokes readable while their recessed anchor follows the flower.
        vec4 heart = particleMatrix * vec4(0.0,0.0,-1.42,1.0);
        float scale = length(particleMatrix[0].xyz);
        view = heart + vec4(p.xy*scale,0.0,0.0);
      }
      vec3 seed = fract(sin(vec3(dot(original,vec3(12.9898,78.233,37.719)), dot(original,vec3(39.346,11.135,83.155)), dot(original,vec3(73.156,52.235,9.151)))) * 43758.5453);
      float split = historicalSplit;
      float local = clamp((split-seed.x*0.18)/0.82,0.0,1.0);
      float blend = local*local*(3.0-2.0*local);
      vec3 destination = (seed*2.0-1.0) * vec3(uSideX*1.3,uSideX/uAspect*1.3,5.0);
      float cp = cos(uPagePose.x), sp = sin(uPagePose.x);
      destination.xy = mat2(cp,-sp,sp,cp) * destination.xy;
      destination.z += sin(destination.x * 0.4 + uPagePose.x) * uPagePose.y * 2.0;
      destination += vec3(sin((uTime-age)*0.08+seed.y*6.283),cos((uTime-age)*0.07+seed.z*6.283),0.0)*0.12;
      vec4 dispersedView = particleMatrix * vec4(destination,1.0);
      dispersedView.z = -4.5 - abs(dispersedView.z + 4.5) * 0.6;
      vec3 bend = (particleMatrix * vec4(sin(original.y*0.7),cos(original.z*0.6),sin(original.x*0.7),0.0)).xyz;
      // Wherever the constellation takes over, the dispersal stands down.
      float splitWeight = blend * (1.0 - uAmbientBlend);
      view.xyz = mix(view.xyz,dispersedView.xyz,splitWeight) + bend*sin(splitWeight*3.14159)*1.1;
      vec4 projected = projectionMatrix * view;
      vec2 delta = projected.xy / projected.w - mix(uPointer, uPreviousPointer, min(age * 0.65, 1.0));
      delta.x *= uAspect;
      float influence = exp(-dot(delta, delta) * 24.0) * uHover;
      vec2 travel = (uPointer-uPreviousPointer) * vec2(uAspect,1.0);
      travel *= min(1.0, 0.055 / max(length(travel), 0.0001));
      vec2 wakeDelta = delta + travel*0.45;
      float wake = exp(-dot(wakeDelta,wakeDelta)*30.0)*uHover;
      // A continuous lens: zero displacement at its center, no repulsion hole.
      // Momentum adds a tight directional carry: particles inherit pointer
      // velocity in a small patch and coast, like a hand brushing one cluster.
      float momentumSpatial = exp(-dot(delta,delta)*110.0)*uHover;
      vec2 carry = uMomentum*momentumSpatial*(0.3+seed.y*0.35);
      vec2 offset = delta*influence*0.06 + travel*wake*0.2 + carry + vec2(-delta.y,delta.x)*wake*uEnergy*0.06;
      view.xy += offset / vec2(uAspect,1.0) * (-view.z) / projectionMatrix[1][1];
      vec2 localWake = wakeOffset(projected.xy/projected.w*vec2(uAspect,1.0),age,seed);
      float wakeScale = aOrbit.x >= ${PETAL_TRACKS}.0 ? 0.25 : 1.0;
      view.xy += localWake * wakeScale * (-view.z) / projectionMatrix[1][1];
      view.z += influence*0.045;
      return view;
    }
  `;
  const uniforms = {
    uWakeSegments: { value: pointerWake.segments },
    uWakeImpulses: { value: pointerWake.impulses },
    uWakeTime: { value: performance.now() / 1000 },
    uWakeRadius: { value: 0.2 },
    uWakeActive: { value: 0 },
    uMobile: { value: mobile && coarsePointer ? 1 : 0 },
    uTracks: { value: trackTexture },
    uTrackRows: { value: tracks.length },
    uPoseHistory: { value: Array.from({ length: 16 }, () => new Matrix4()) },
    uStateHistory: { value: Array.from({ length: 16 }, () => new Vector4()) },
    uCanvasSize: { value: new Vector2(1, 1) },
    uCopyBounds: { value: new Vector4(-2, -2, -1, -1) },
    uCopyOpacity: { value: 1 },
    uQuietBoxes: {
      value: Array.from({ length: 4 }, () => new Vector4(-2, -2, -1, -1)),
    },
    uReading: { value: 0 },
    uGatherZone: { value: new Vector2(-2, -1) },
    uSplit: { value: 0 },
    uPreviousSplit: { value: 0 },
    uScrollPhase: { value: 0 },
    uPreviousScrollPhase: { value: 0 },
    uSideX: { value: 0 },
    uTime: { value: 0 },
    uPagePose: { value: new Vector3() },
    uPreviousPointer: { value: new Vector2(4, 4) },
    uEnergy: { value: 0 },
    uLight: { value: light ? 1 : 0 },
    uPointer: { value: new Vector2(4, 4) },
    uHover: { value: 0 },
    uAspect: { value: 1 },
    uDisperse: { value: 0 },
    uPixelRatio: { value: renderer.getPixelRatio() },
    uIntro: { value: reducedMotion ? 1 : 0 },
    uMomentum: { value: new Vector2() },
    uScatterRadius: { value: 11 },
    uAmbientTracks: { value: ambientTexture },
    uAmbientBlend: { value: 0 },
    uAmbientDrift: { value: new Vector3() },
    uAmbientTwinkle: { value: 1 },
    uAmbientGlow: { value: 1 },
  };
  let ambientTarget = 0;
  // One bake per navigation: six contour rows sampled on the CPU (microseconds),
  // uploaded into the ambient texture; everything downstream stays on the GPU.
  const applyAmbient = (path: string) => {
    const profile = getAmbientProfile(path);
    ambientData.set(bakeAmbientTracks(profile));
    ambientTexture.needsUpdate = true;
    uniforms.uAmbientDrift.value.set(
      profile.driftX,
      profile.driftY,
      profile.driftSpeed
    );
    uniforms.uAmbientTwinkle.value = profile.twinkle;
    uniforms.uAmbientGlow.value = profile.glow;
    ambientTarget = getPageScene(path).mode === "home" ? 0 : 1;
  };
  applyAmbient(page);
  const atmosphereGeometry = new PlaneGeometry(2, 2);
  const atmosphereMaterial = new ShaderMaterial({
    uniforms,
    depthTest: false,
    depthWrite: false,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float uLight; uniform float uTime; uniform float uAspect;
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        float a = fract(sin(dot(i,vec2(127.1,311.7)))*43758.54);
        float b = fract(sin(dot(i+vec2(1,0),vec2(127.1,311.7)))*43758.54);
        float c = fract(sin(dot(i+vec2(0,1),vec2(127.1,311.7)))*43758.54);
        float d = fract(sin(dot(i+vec2(1,1),vec2(127.1,311.7)))*43758.54);
        return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
      }
      void main() {
        vec2 p = (vUv - vec2(0.58,0.55)) * vec2(uAspect,1.0);
        float n = noise(p*4.0 + uTime*0.003)*0.55 + noise(p*11.0)*0.28 + noise(p*27.0)*0.17;
        float mist = pow(n,2.0) * exp(-dot(p,p)*2.2);
        float grain = fract(sin(dot(gl_FragCoord.xy + uTime*61.7, vec2(12.9898,78.233))) * 43758.5453);
        vec3 night = vec3(0.006,0.009,0.012) + vec3(0.005,0.004,0.009)*mist + (grain-0.5)*0.0065;
        vec3 day = vec3(0.925,0.94,0.958) + vec3(0.012,0.010,0.008)*exp(-dot(p,p)*1.4) + (grain-0.5)*0.0045;
        gl_FragColor = vec4(mix(night,day,uLight),1.0);
        #include <colorspace_fragment>
      }`,
  });
  const atmosphere = new Mesh(atmosphereGeometry, atmosphereMaterial);
  atmosphere.frustumCulled = false;
  atmosphere.renderOrder = -1;
  scene.add(atmosphere);
  // A sparse, independent distance layer continues beyond the central volume.
  const distantCount = 180;
  const distantPositions = new Float32Array(distantCount * 3);
  const distantColors = new Float32Array(distantCount * 3);
  const distantSizes = new Float32Array(distantCount);
  for (let i = 0; i < distantCount; i++) {
    distantPositions.set(
      [
        (((i % 18) + 0.2 + random() * 0.6) / 18 - 0.5) * 24,
        ((Math.floor(i / 18) + 0.2 + random() * 0.6) / 10 - 0.5) * 17,
        -2 - random() * 5,
      ],
      i * 3
    );
    palette[i % 31 === 0 ? 3 : i % 3].toArray(distantColors, i * 3);
    distantSizes[i] = i % 17 === 0 ? 14 : 7 + random() * 4;
  }
  const distantGeometry = new BufferGeometry();
  distantGeometry.setAttribute(
    "position",
    new BufferAttribute(distantPositions, 3)
  );
  distantGeometry.setAttribute("color", new BufferAttribute(distantColors, 3));
  distantGeometry.setAttribute("aSize", new BufferAttribute(distantSizes, 1));
  const distantMaterial = new ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: light ? NormalBlending : AdditiveBlending,
    vertexShader: `uniform float uTime; uniform float uPixelRatio; uniform float uScrollPhase;
      attribute float aSize; varying vec3 vColor; varying float vTwinkle;
      void main() {
        vColor = color;
        float phase = dot(position,vec3(2.7,4.3,1.2));
        vTwinkle = 0.74+0.26*sin(uTime*0.38+phase);
        vec3 p = position;
        p.xy += vec2(sin(uTime*0.023+phase+uScrollPhase*0.11),cos(uTime*0.019+phase+uScrollPhase*0.13))*0.25;
        vec4 view = modelViewMatrix*vec4(p,1.0);
        gl_Position = projectionMatrix*view;
        gl_PointSize = clamp(aSize*uPixelRatio*10.0/-view.z,3.0,30.0);
      }`,
    fragmentShader: `uniform float uLight; varying vec3 vColor; varying float vTwinkle;
      void main() {
        float r = length(gl_PointCoord-0.5)*2.0;
        if (r>1.0) discard;
        float core = 1.0-smoothstep(mix(0.055,0.12,uLight),mix(0.20,0.30,uLight),r);
        float glow = exp(-r*r*14.0)*mix(0.10,0.0,uLight);
        float warm = smoothstep(0.05,0.45,vColor.r-vColor.b);
        vec3 day = mix(vec3(0.18,0.34,0.56),vec3(0.51,0.36,0.21),warm);
        gl_FragColor = vec4(mix(vColor,day,uLight),(core+glow)*vTwinkle*mix(0.7,0.90,uLight));
        #include <colorspace_fragment>
      }`,
  });
  const distantStars = new Points(distantGeometry, distantMaterial);
  distantStars.renderOrder = 0;
  scene.add(distantStars);
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: light ? NormalBlending : AdditiveBlending,
    uniforms,
    vertexShader: `${deformation}
      attribute float aSize; attribute vec3 aDayColor; attribute float aBright;
      uniform float uPixelRatio;
      varying vec3 vColor; varying float vFlow; varying float vBright; varying float vIntro; varying float vAmbient;
      void main() {
        vFlow = flowFade(position);
        vColor = mix(color, aDayColor, uLight);
        vBright = aBright;
        // The scattered field belongs to the stars and the brightest motes only;
        // dim dust materializes as it seats into the rose, like the reference sky.
        float brightBias = smoothstep(1.85, 2.0, aBright);
        float seatGate = smoothstep(0.25, 0.9, gTravelT);
        float introVis = gIntroT * mix(seatGate, 1.0, brightBias);
        vIntro = smoothstep(0.0, 0.16, introVis);
        vAmbient = gAmbientT;
        vec4 view = particleView(position, 0.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = aSize * uPixelRatio * clamp(10.0/-view.z,0.85,1.25) * mix(1.3,1.55,uLight) * mix(0.4, 1.0, sqrt(introVis))
          * mix(1.0, mix(1.0, 0.85, uLight), gAmbientT)
          * mix(0.55, 1.0, max(seatGate, brightBias));
      }`,
    fragmentShader: `varying vec3 vColor; varying float vFlow; varying float vBright; varying float vIntro; varying float vAmbient; uniform float uDisperse; uniform float uLight;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        // The constellation must survive both blendings. Night adds light, so
        // density becomes glow and the brightest motes roll to white; day stacks
        // ink, so density becomes mud and white erases itself on paper. Day
        // keeps the figure legible through darker, more saturated anchors and
        // near-opaque stipple cores instead of alpha or whitening.
        float highlight = smoothstep(1.7, 2.2, vBright) * 0.6;
        vec3 nightInk = mix(vColor, vec3(1.0), highlight) * (1.0 + vBright * 0.22);
        vec3 dayInk = mix(vColor, vColor * vec3(0.58, 0.55, 0.50), highlight)
          * (1.0 - vBright * 0.08);
        float ambientAlpha = mix(1.0, mix(0.62, 0.56 + min(vBright, 2.0) * 0.18, uLight), vAmbient);
        gl_FragColor = vec4(
          mix(nightInk, dayInk, uLight),
          (1.0 - smoothstep(0.85-fwidth(d), 0.85+fwidth(d), d))
            * mix(0.94,1.0,uLight) * vFlow * (1.0 - uDisperse * 0.25) * vIntro
            * ambientAlpha
        );
        #include <colorspace_fragment>
      }`,
  });
  const dust = new Points(geometry, material);
  dust.frustumCulled = false;
  dust.renderOrder = 1;
  group.add(dust);
  const starGeometry = new InstancedBufferGeometry();
  starGeometry.setAttribute(
    "position",
    new BufferAttribute(
      new Float32Array([
        -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0,
      ]),
      3
    )
  );
  starGeometry.setIndex([0, 1, 2, 0, 2, 3]);
  starGeometry.setAttribute(
    "aCenter",
    new InstancedBufferAttribute(starPositions, 3)
  );
  starGeometry.setAttribute(
    "aColor",
    new InstancedBufferAttribute(starColors, 3)
  );
  starGeometry.setAttribute(
    "aSize",
    new InstancedBufferAttribute(starSizes, 1)
  );
  starGeometry.setAttribute(
    "aDayColor",
    new InstancedBufferAttribute(dayStarColors, 3)
  );
  starGeometry.setAttribute(
    "aOrbit",
    new InstancedBufferAttribute(starFlows, 4)
  );
  starGeometry.setAttribute(
    "aBright",
    new InstancedBufferAttribute(starBrights, 1)
  );
  starGeometry.instanceCount = starCount;
  const starMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: light ? NormalBlending : AdditiveBlending,
    uniforms,
    vertexShader: `${deformation}
      attribute vec3 aCenter; attribute vec3 aColor; attribute vec3 aDayColor; attribute float aSize; attribute float aBright;
      uniform vec2 uCanvasSize; uniform float uPixelRatio; uniform float uMobile;
      varying vec2 vUv; varying vec3 vColor; varying float vBrightness; varying float vProminence; varying float vLens; varying float vCoreRadius; varying float vForeshorten; varying float vIntro;
      void main() {
        vUv = position.xy * 2.0;
        vColor = mix(aColor,aDayColor,uLight);
        vBrightness = (0.82 + 0.18*sin(uTime*0.42*uAmbientTwinkle+length(aCenter.xy)*1.15))*flowFade(aCenter)*mix(0.7, 1.5, aBright / 3.0);
        // Diffraction spikes belong to the few brightest stars only.
        vProminence = smoothstep(2.2,3.0,aBright);
        vec4 center = particleView(aCenter, 0.0);
        vLens = cursorLight(center);
        vIntro = smoothstep(0.0, 0.16, gIntroT);
        vec3 travel = center.xyz-particleView(aCenter,0.04).xyz;
        vForeshorten = 0.35+0.65*clamp(length(travel.xy)/max(length(travel),0.00001),0.0,1.0);
        // Bound the luminous core in screen pixels independently from its halo.
        // Traveling stars stay slim; halos and glints bloom once they seat.
        float depth = clamp(10.0 / -center.z,0.7,1.3);
        float diameter = (10.0 + aSize*5.0)*depth*mix(1.0,0.75,uMobile)*mix(0.45, 1.0, sqrt(gIntroT))
          * mix(0.55, 1.0, smoothstep(0.2, 0.85, gTravelT));
        float corePixels = aSize*0.7*depth*mix(mix(1.0,0.72,uMobile),1.30,uLight);
        vCoreRadius = corePixels / (diameter*0.5);
        float worldSize = diameter * 2.0 * (-center.z) / (projectionMatrix[1][1] * uCanvasSize.y / uPixelRatio);
        center.xy += position.xy * worldSize;
        gl_Position = projectionMatrix * center;
      }`,
    fragmentShader: `varying vec2 vUv; varying vec3 vColor; varying float vBrightness; varying float vProminence; varying float vLens; varying float vCoreRadius; varying float vForeshorten; varying float vIntro;
      uniform float uDisperse; uniform float uLight;
      void main() {
        float r = length(vUv);
        if (r > 1.0) discard;
        float core = exp(-r*r/(vCoreRadius*vCoreRadius)*1.5);
        float corona = exp(-r*r/(vCoreRadius*vCoreRadius)*0.25);
        float halo = exp(-r*r*9.0);
        float glint = (exp(-abs(vUv.x)*90.0)*exp(-abs(vUv.y)*12.0)
          + exp(-abs(vUv.y)*90.0)*exp(-abs(vUv.x)*12.0))*vProminence;
        float night = core + corona*0.23 + halo*0.035 + glint*(0.03 + vProminence*0.14);
        // Day cannot bloom, so the halo becomes a watercolor aura: the star's
        // own ink bleeding softly into the paper around a solid dark core.
        float day = core + corona*0.20 + halo*0.085 + glint*(0.08 + vProminence*0.12);
        vec3 emission = mix(vColor,vec3(1.0),core*vProminence*0.7)*(1.0+core*(0.4+vProminence*2.2));
        gl_FragColor = vec4(mix(emission,vColor,uLight),mix(night,day,uLight)*(vBrightness+vLens*0.15)*vForeshorten*(1.0-uDisperse*0.25)*vIntro);
        #include <colorspace_fragment>
      }`,
  });
  const stars = new Mesh(starGeometry, starMaterial);
  stars.frustumCulled = false;
  stars.renderOrder = 3;
  group.add(stars);
  // A soft luminous heart behind the lvy script: the brightest region of the
  // composition and the primary feed for the bloom pyramid, igniting as the
  // blossom reveal completes. The star layer split is gone — bloom is now
  // extracted from the scene itself.
  const heartGeometry = new BufferGeometry();
  heartGeometry.setAttribute(
    "position",
    new BufferAttribute(
      new Float32Array([
        -1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0,
      ]),
      3
    )
  );
  heartGeometry.setAttribute(
    "uv",
    new BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), 2)
  );
  const heartMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: light ? NormalBlending : AdditiveBlending,
    uniforms,
    vertexShader: `uniform float uIntro; uniform vec2 uCanvasSize; uniform float uPixelRatio; uniform float uLight;
      varying vec2 vUv;
      void main() {
        vUv = uv * 2.0 - 1.0;
        float reveal = smoothstep(0.5, 0.9, uIntro);
        vec4 center = modelViewMatrix * vec4(0.0, 0.0, -1.42, 1.0);
        float diameter = mix(0.25, 2.4, reveal)
          * (-center.z) / (projectionMatrix[1][1] * uCanvasSize.y / uPixelRatio);
        center.xy += position.xy * diameter * 0.5;
        gl_Position = projectionMatrix * center;
      }`,
    fragmentShader: `uniform float uIntro; uniform float uAmbientGlow; uniform float uAmbientBlend;
      varying vec2 vUv;
      void main() {
        float r = length(vUv);
        if (r > 1.0) discard;
        float glow = exp(-r*r*7.5)*1.2 + exp(-r*r*2.4)*0.28 + exp(-r*r*0.85)*0.07;
        float reveal = smoothstep(0.5, 0.9, uIntro);
        // The heart belongs to the assembled rose; it fades as the bloom
        // disperses, then returns at the article's seeded presence.
        // uLight and uSplit arrive through the shared readableArea preamble.
        float presence = (1.0 - uSplit * 0.7) * mix(1.0, uAmbientGlow, uAmbientBlend)
          * mix(1.0, 0.5, uLight * uAmbientBlend);
        vec3 tint = mix(vec3(1.0, 0.96, 0.88), vec3(0.35, 0.32, 0.28), uLight);
        gl_FragColor = vec4(tint * glow, glow * reveal * presence * mix(0.42, 0.32, uLight));
        #include <colorspace_fragment>
      }`,
  });
  const heartGlow = new Mesh(heartGeometry, heartMaterial);
  heartGlow.frustumCulled = false;
  heartGlow.renderOrder = 1.5;
  group.add(heartGlow);
  const trailGeometry = new InstancedBufferGeometry();
  const trailSegments = 12;
  const trailVertices = [],
    trailIndices = [];
  for (let i = 0; i <= trailSegments; i++) {
    trailVertices.push(i / trailSegments, -1, 0, i / trailSegments, 1, 0);
    if (i < trailSegments) {
      const j = i * 2;
      trailIndices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
  }
  trailGeometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(trailVertices), 3)
  );
  trailGeometry.setIndex(trailIndices);
  trailGeometry.setAttribute(
    "aCenter",
    new InstancedBufferAttribute(starPositions, 3)
  );
  trailGeometry.setAttribute(
    "aColor",
    new InstancedBufferAttribute(starColors, 3)
  );
  trailGeometry.setAttribute(
    "aOrbit",
    new InstancedBufferAttribute(starFlows, 4)
  );
  trailGeometry.instanceCount = starCount;
  // Only trail vertices need the historical transform array.
  const trailDeformation =
    "uniform mat4 uPoseHistory[16]; uniform vec4 uStateHistory[16];\n" +
    deformation
      .replace(
        "mat4 particleMatrix = modelViewMatrix;",
        `float hi = clamp(age*30.0,0.0,15.0);
       int h = int(floor(hi)); int j = min(h+1,15);
       vec4 state = mix(uStateHistory[h],uStateHistory[j],fract(hi));
       mat4 particleMatrix = uPoseHistory[h]*(1.0-fract(hi))+uPoseHistory[j]*fract(hi);
       age = max(0.0,uTime-state.x);`
      )
      .replace(
        "float historicalSplit = uSplit;",
        "float historicalSplit = state.y;"
      );
  const trailMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: light ? NormalBlending : AdditiveBlending,
    uniforms,
    vertexShader: `${trailDeformation}
      attribute vec3 aCenter; attribute vec3 aColor;
      varying float vAge; varying float vEdge; varying vec3 vColor; varying float vMotion; varying float vIntroTrail;
      void main() {
        vAge = position.x; vEdge = position.y; vColor = aColor;
        float age = vAge * mix(0.12,0.32,uEnergy);
        vec4 center = particleView(aCenter, age);
        vec4 next = particleView(aCenter, min(age + 0.033, 0.5));
        // Trails belong to the settled, living rose; during the starfall they
        // read as artificial meteor streaks, so travel keeps them heavily dimmed.
        vIntroTrail = smoothstep(0.0, 0.2, gIntroT) * mix(0.3, 1.0, gTravelT);
        vMotion = clamp((length(next.xy-center.xy)-0.018)*12.0,0.0,1.0);
        vec2 tangent = normalize(next.xy - center.xy + vec2(0.00001));
        center.xy += vec2(-tangent.y, tangent.x) * position.y * (0.003+uEnergy*0.008+vMotion*0.008) * (1.0 - vAge);
        gl_Position = projectionMatrix * center;
      }`,
    fragmentShader: `varying float vAge; varying float vEdge; varying vec3 vColor; varying float vMotion; varying float vIntroTrail;
      uniform float uLight; uniform float uDisperse; uniform float uEnergy;
      void main() {
        float alpha = pow(1.0 - vAge, 1.8) * (1.0 - vEdge * vEdge) * mix(0.506,0.42,uLight) * (1.0 - uDisperse * 0.255) * vIntroTrail;
        vec3 ink = vec3(0.12, 0.26, 0.48);
        gl_FragColor = vec4(mix(vColor, ink, uLight), alpha*max(0.12+uEnergy*0.88,vMotion));
        #include <colorspace_fragment>
      }`,
  });
  const trails = new Mesh(trailGeometry, trailMaterial);
  trails.frustumCulled = false;
  trails.renderOrder = 2;
  group.add(trails);
  // Reserve contrast around the real text bounds while keeping a single continuous scene.
  for (const opticalMaterial of [
    material,
    starMaterial,
    trailMaterial,
    distantMaterial,
    heartMaterial,
  ]) {
    // Mask pixels, not billboard vertices: large near stars otherwise interpolate
    // an unmasked corner across text even when their center is inside the reader.
    opticalMaterial.fragmentShader =
      `
      uniform float uLight; uniform float uSplit;
      uniform vec4 uCopyBounds; uniform float uCopyOpacity;
      uniform vec4 uQuietBoxes[4];
      uniform float uReading; uniform vec2 uGatherZone;
      uniform vec2 uCanvasSize;
      float readableArea() {
        vec2 p = gl_FragCoord.xy / uCanvasSize;
        float x = smoothstep(uCopyBounds.x-0.05,uCopyBounds.x,p.x) * (1.0-smoothstep(uCopyBounds.z,uCopyBounds.z+0.08,p.x));
        float y = smoothstep(uCopyBounds.y-0.04,uCopyBounds.y,p.y) * (1.0-smoothstep(uCopyBounds.w,uCopyBounds.w+0.04,p.y));
        float edge = mix(mix(0.40,0.72,uLight),mix(0.85,1.0,uLight),smoothstep(0.44,0.90,abs(p.x-0.5)*2.0));
        float openBand = smoothstep(uGatherZone.x,uGatherZone.x+0.06,p.y) * (1.0-smoothstep(uGatherZone.y-0.06,uGatherZone.y,p.y));
        float quiet = 1.0;
        for (int i=0;i<4;i++) {
          vec4 b = uQuietBoxes[i];
          float qx = smoothstep(b.x-0.04,b.x+0.02,p.x)*(1.0-smoothstep(b.z-0.02,b.z+0.04,p.x));
          float qy = smoothstep(b.y-0.025,b.y+0.02,p.y)*(1.0-smoothstep(b.w-0.02,b.w+0.025,p.y));
          quiet *= 1.0-qx*qy*mix(0.70,0.38,uLight);
        }
        return quiet * (1.0-x*y*0.96*uCopyOpacity) * mix(1.0,max(edge,openBand*smoothstep(0.34,0.48,p.x)),uReading);
      }
` +
      opticalMaterial.fragmentShader
        .replaceAll("uniform float uLight;", "")
        .replace(
          "#include <colorspace_fragment>",
          "gl_FragColor.a *= readableArea();\n#include <colorspace_fragment>"
        );
  }

  material.fragmentShader = material.fragmentShader.replace(
    "float d = length(gl_PointCoord",
    "if (fract(sin(vSeed)*43758.5453) < max(uSplit*(1.0-vAmbient), vAmbient*uLight*0.30)) discard;\n        float d = length(gl_PointCoord"
  );
  material.vertexShader = material.vertexShader
    .replace(
      "varying vec3 vColor;",
      "varying float vSeed; varying vec3 vColor;"
    )
    .replace(
      "vFlow = flowFade(position);",
      "vSeed = dot(position,vec3(12.3,8.1,3.7)); vFlow = flowFade(position);"
    );
  material.fragmentShader = "varying float vSeed;\n" + material.fragmentShader;

  // Particle draw ranges and instance counts initialized immediately for mobile
  if (mobile) {
    geometry.setDrawRange(0, 2800);
    starGeometry.instanceCount = coarsePointer ? 128 : 200;
    trailGeometry.instanceCount = coarsePointer ? 128 : 200;
    distantGeometry.setDrawRange(0, coarsePointer ? 60 : 90);
  }

  // One scene render feeds both the output and a mip-pyramid bloom extracted
  // from the frame itself; the former star-only second pass is gone.
  renderer.toneMapping = ACESFilmicToneMapping;
  const bloomPass = new BloomPyramidPass({
    levels: mobile ? 3 : 4,
    threshold: 0.85,
    knee: 0.25,
    strength: light ? 0 : mobile ? 0.42 : 0.55,
  });
  bloomPass.enabled = !light;
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(bloomPass);
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  let frame = 0,
    disposed = false,
    visible = true,
    lost = false,
    paused = reducedMotion;
  let lastTime = 0,
    elapsed = 0,
    hover = 0,
    targetHover = 0;
  let intro = reducedMotion ? 1 : 0;
  const rotation = new RotationMotion(
    // Projection-balanced home pose: the grid-searched orientation keeps the
    // rose's projected mass even across left/right halves (50/50) instead of
    // dumping 71% of the figure on the left of the heart.
    RotationMotion.defaultHomeQuaternion()
  );
  const orientation = rotation.orientation;
  const initialOrientation = rotation.home;
  const angularAxis = new Vector3(0, 1, 0);
  const increment = new Quaternion();
  let dragging = false,
    activePointer = -1,
    lastMoveTime = 0;
  const dragPoint = new Vector3();
  const nextDragPoint = new Vector3();
  const deltaRotation = new Quaternion();
  const pointer = new Vector2(4, 4);
  const pointerTarget = new Vector2(4, 4);
  const previousPointer = new Vector2(4, 4);
  const momentumTarget = new Vector2();
  const velocityPointer = new Vector2(4, 4);
  const pointerVelocity = new Vector2();
  let lastPointerStamp = 0;
  let pageScene = getPageScene(page);
  let hero: HTMLElement | null = null,
    stage: HTMLElement | null = null,
    gatherTarget: HTMLElement | null = null,
    foot: HTMLElement | null = null,
    copy: HTMLElement | null = null;
  const pagePose = new Vector3(pageScene.phase, pageScene.tilt, pageScene.pace);
  function bindHome() {
    const home = document.querySelector(".public-universe .observatory-home");
    hero = home?.querySelector(".observatory-hero-scroll") ?? null;
    stage = home?.querySelector(".observatory-hero") ?? null;
    gatherTarget = home?.querySelector(".observatory-directions") ?? null;
    foot = home?.querySelector(".observatory-hero-foot") ?? null;
    copy = home?.querySelector(".observatory-hero-copy") ?? null;
  }
  let quietNodes: Element[] = [];
  let gather = 0;
  let scrollProgress = pageScene.mode === "home" ? 0 : 1;
  let lastFlowSample = 0;
  let historyClock = 0,
    historyReady = false;
  const frameIntervals: number[] = [];
  let statsAt = 0;
  const viewPose = new Matrix4();
  const artworkCenter = new Vector3();
  const heartWorld = new Vector3();
  let artworkRadius = 100;

  // Cached layout state to eliminate forced synchronous reflows in paint() (BUG-05)
  const bounds = {
    left: 0,
    top: 0,
    right: 1280,
    bottom: 800,
    width: 1280,
    height: 800,
  };
  let heroTop = 0;
  let heroHeight = 0;
  let hasHero = false;
  let stageHeight = 800;
  let targetTop = -10000;
  let targetBottom = -9999;
  let targetHeight = 1;
  let copyRight = 0;
  let hasCopy = false;
  let lastCopyOpacity = -1;
  let lastCopyY = -9999;
  let lastHostOpacity = -1;
  let observedCopy: HTMLElement | null = null;
  const motionScratch: MotionState = {
    approach: 0,
    expansion: 0,
    copyOpacity: 0,
    copyY: 0,
    split: 0,
  };

  function updateLayoutRects() {
    if (disposed) return;
    if (pageScene.mode === "home" && !stage?.isConnected) bindHome();
    if (pageScene.mode === "author" && !copy?.isConnected)
      copy = document.querySelector(".author-page .about-letter");

    if (copy && copy !== observedCopy) {
      if (observedCopy) resize.unobserve(observedCopy);
      resize.observe(copy);
      observedCopy = copy;
    }

    const b = host.getBoundingClientRect();
    bounds.left = b.left;
    bounds.top = b.top;
    bounds.right = b.right;
    bounds.bottom = b.bottom;
    bounds.width = b.width;
    bounds.height = b.height;

    stageHeight = stage?.clientHeight || bounds.height;

    if (hero?.isConnected) {
      const hr = hero.getBoundingClientRect();
      heroTop = hr.top;
      heroHeight = hr.height;
      hasHero = true;
    } else {
      hasHero = false;
      heroTop = 0;
      heroHeight = 0;
    }

    if (gatherTarget?.isConnected) {
      const gr = gatherTarget.getBoundingClientRect();
      targetTop = gr.top;
      targetBottom = gr.bottom;
      targetHeight = gr.height;
    } else {
      targetTop = -10000;
      targetBottom = -9999;
      targetHeight = 1;
    }

    if (copy?.isConnected) {
      const cr = copy.getBoundingClientRect();
      copyRight = cr.right;
      hasCopy = true;
      uniforms.uCopyBounds.value.set(
        (cr.left - bounds.left) / bounds.width,
        1 - (cr.bottom - bounds.top) / bounds.height,
        (cr.right - bounds.left) / bounds.width,
        1 - (cr.top - bounds.top) / bounds.height
      );
    } else {
      copyRight = bounds.left;
      hasCopy = false;
      uniforms.uCopyBounds.value.set(-2, -2, -1, -1);
    }

    if (!quietNodes.length || quietNodes.some(node => !node.isConnected)) {
      quietNodes = Array.from(
        document.querySelectorAll(
          ".public-universe :is(.paper-reader-main,.paper-toc-rail,.search-results-surface,.archive-timeline,.observatory-featured,.observatory-notes,.track-article-ledger,.track-path-section,.page-hero,.taxonomy-notes-surface,.taxonomy-side-panel,.about-focus-ledger,.about-links-rail)"
        )
      );
    }

    let quietIndex = 0;
    for (let i = 0; i < quietNodes.length; i++) {
      const node = quietNodes[i];
      const r = node.getBoundingClientRect();
      if (
        !r.width ||
        !r.height ||
        r.bottom < bounds.top ||
        r.top > bounds.bottom ||
        quietIndex >= 4
      ) {
        continue;
      }
      uniforms.uQuietBoxes.value[quietIndex++].set(
        (r.left - bounds.left) / bounds.width,
        1 - (r.bottom - bounds.top) / bounds.height,
        (r.right - bounds.left) / bounds.width,
        1 - (r.top - bounds.top) / bounds.height
      );
    }
    for (; quietIndex < 4; quietIndex++) {
      uniforms.uQuietBoxes.value[quietIndex].set(-2, -2, -1, -1);
    }

    uniforms.uGatherZone.value.set(
      1 - (targetBottom - bounds.top) / bounds.height,
      1 - (targetTop - bounds.top) / bounds.height
    );
  }
  function paint(dt = 0.016) {
    const smoothing = 1 - Math.exp(-dt * 9);
    // Bounded scroll energy affects trails; only reversible layout progress owns shape.
    const flowTarget = reducedMotion
      ? 0
      : Math.min(1, Math.max(0, window.scrollY) / Math.max(1, bounds.height));
    const lastFlow = uniforms.uScrollPhase.value;
    uniforms.uScrollPhase.value +=
      (flowTarget - lastFlow) * (paused ? 1 : 1 - Math.exp(-dt * 12));
    const flowSpeed = Math.min(
      2,
      Math.abs(uniforms.uScrollPhase.value - lastFlow) / Math.max(dt, 0.008)
    );
    uniforms.uPreviousScrollPhase.value +=
      (uniforms.uScrollPhase.value - uniforms.uPreviousScrollPhase.value) *
      (1 - Math.exp(-dt * 4.5));
    if (import.meta.env.DEV && performance.now() - lastFlowSample > 250) {
      lastFlowSample = performance.now();
      host.dataset.scrollPhase = uniforms.uScrollPhase.value.toFixed(3);
      host.dataset.scrollSpeed = flowSpeed.toFixed(3);
      host.dataset.pointerInfluence = hover.toFixed(2);
    }
    const travel = hasHero ? heroHeight - stageHeight : 0;
    const progress =
      pageScene.mode !== "home"
        ? 1
        : reducedMotion || !hasHero
          ? 0
          : Math.min(
              1,
              Math.max(
                0,
                (68 - heroTop) / (travel > 20 ? travel : stageHeight)
              )
            );
    scrollProgress += (progress - scrollProgress) * (1 - Math.exp(-dt * 14));
    const distance =
      Math.abs(
        targetTop +
          targetHeight / 2 -
          (bounds.top + bounds.height / 2)
      ) / bounds.height;
    const proximity =
      reducedMotion || mobile
        ? 0
        : Math.max(0, Math.min(1, (0.75 - distance) / 0.5));
    const gatherGoal = proximity * proximity * (3 - 2 * proximity);
    gather += (gatherGoal - gather) * (1 - Math.exp(-dt * 14));
    const motion = getScrollMotion(scrollProgress, gather, motionScratch);
    const split = pageScene.mode === "author" ? 0.45 : motion.split;
    uniforms.uSplit.value = split;
    uniforms.uPagePose.value.lerp(pagePose, smoothing);
    uniforms.uPreviousSplit.value +=
      (split - uniforms.uPreviousSplit.value) * (1 - Math.exp(-dt * 8));
    uniforms.uReading.value = motion.expansion;
    uniforms.uDisperse.value = motion.expansion * 0.1 * (1 - gather);
    uniforms.uCopyOpacity.value =
      pageScene.mode === "author" ? 1 : motion.copyOpacity;
    camera.position.z = 10.4 - motion.approach * 0.55 + gather * 3.6;
    uniforms.uSideX.value =
      Math.tan((camera.fov * Math.PI) / 360) *
      camera.position.z *
      camera.aspect *
      0.98;
    if (stage && Math.abs(motion.copyOpacity - lastCopyOpacity) > 0.005) {
      lastCopyOpacity = motion.copyOpacity;
      stage.style.setProperty("--hero-copy-opacity", String(motion.copyOpacity));
    }
    if (stage && Math.abs(motion.copyY - lastCopyY) > 0.2) {
      lastCopyY = motion.copyY;
      stage.style.setProperty("--hero-copy-y", `${motion.copyY}px`);
    }
    const currentHostOpacity = 1 - motion.split * 0.28;
    if (Math.abs(currentHostOpacity - lastHostOpacity) > 0.005) {
      lastHostOpacity = currentHostOpacity;
      host.style.opacity = String(currentHostOpacity);
    }
    const copyHidden = pageScene.mode === "home" && motion.copyOpacity < 0.01;
    if (copy && copy.inert !== copyHidden) copy.inert = copyHidden;
    if (foot && foot.inert !== copyHidden) foot.inert = copyHidden;
    uniforms.uTime.value = elapsed;
    if (!paused) uniforms.uWakeTime.value = performance.now() / 1000;
    uniforms.uWakeRadius.value =
      (2 * Math.min(48, Math.max(28, bounds.height * 0.042))) / bounds.height;
    const activeWake = pointerWake.activeCount(uniforms.uWakeTime.value);
    uniforms.uWakeActive.value = activeWake > 0 ? 1 : 0;
    if (import.meta.env.DEV)
      host.dataset.wakeSegments = String(activeWake);
    hover +=
      (targetHover - hover) *
      (1 - Math.exp(-dt * (targetHover > hover ? 10 : 3.5)));
    pointer.lerp(pointerTarget, smoothing);
    uniforms.uPointer.value.copy(pointer);
    uniforms.uHover.value = hover;
    previousPointer.lerp(pointer, 1 - Math.exp(-dt * 2.2));
    uniforms.uPreviousPointer.value.copy(previousPointer);
    uniforms.uEnergy.value +=
      (Math.min(
        1,
        rotation.speed / 3 + flowSpeed * 0.65
      ) -
        uniforms.uEnergy.value) *
      smoothing;
    // Pointer speed is deliberately NOT energy: global trail response to a
    // flick made the whole rose streak. Trails only follow real particle motion.
    momentumTarget.multiplyScalar(Math.exp(-dt * 2.0));
    uniforms.uMomentum.value.lerp(momentumTarget, 1 - Math.exp(-dt * 7));
    if (!paused) rotation.advance(dt);
    host.dataset.interaction = rotation.phase;
    group.quaternion.copy(orientation);
    // Ambient flow follows local strokes; user input owns the 3D orientation.
    const splitBlend = uniforms.uSplit.value;
    const worldHeight =
      2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const worldWidth = worldHeight * camera.aspect;
    // Fit the complete rose beside the copy instead of hiding overlapping petals.
    const roseLeft = Math.max(
      bounds.width * 0.43,
      copyRight - bounds.left + 24
    );
    const roseRight = bounds.width - 30;
    const roseWidth = Math.max(120, roseRight - roseLeft);
    const homeScale = Math.min(
      1,
      ((roseWidth / bounds.width) * worldWidth) / 8.6,
      worldHeight / 10.1
    );
    const homeX =
      ((roseLeft + roseRight) / 2 / bounds.width - 0.5) * worldWidth;
    const homeComposition = pageScene.mode === "home" ? 1 - splitBlend : 0;
    group.position.x = mobile
      ? 0
      : pageScene.mode === "author"
        ? 2.8
        : homeX * homeComposition +
          (1.0 + gather * 1.8) * (1 - homeComposition);
    const mobileBottom = hasCopy
      ? (1 - uniforms.uCopyBounds.value.w) * bounds.height - 28
      : bounds.height * 0.44;
    const mobileHeight = Math.max(140, mobileBottom - 96);
    const mobileScale = Math.min(
      worldWidth / 7.6,
      ((mobileHeight / bounds.height) * worldHeight) / 7.6
    );
    group.scale.setScalar(
      mobile
        ? mobileScale * homeComposition + splitBlend
        : homeScale * homeComposition + (1 - homeComposition)
    );
    group.position.y = mobile
      ? (0.5 - (96 + mobileBottom) / 2 / bounds.height) *
        worldHeight *
        (1 - splitBlend)
      : 0;
    camera.updateMatrixWorld();
    group.updateMatrixWorld();
    viewPose.multiplyMatrices(camera.matrixWorldInverse, group.matrixWorld);
    // The luminous lvy heart, not the group origin, anchors the flare and the
    // trackball pivot; in screen space the two differ only by depth.
    heartWorld.set(0, 0, -1.42).applyMatrix4(group.matrixWorld).project(camera);
    artworkCenter.set(
      ((heartWorld.x + 1) * bounds.width) / 2,
      ((1 - heartWorld.y) * bounds.height) / 2,
      0
    );
    artworkRadius = (3.2 * group.scale.x * bounds.height) / worldHeight;
    if (!paused && intro < 1) intro = Math.min(1, intro + dt / 3.2);
    uniforms.uIntro.value = intro;
    // Starfield radius in group-local units: wide enough to spill past every
    // viewport edge at the current group scale, so no boundary is ever visible.
    uniforms.uScatterRadius.value =
      (Math.max(worldWidth, worldHeight) * 0.62) /
      Math.max(group.scale.x, 0.05);
    // Crossfade the constellation in whenever navigation leaves the home stage.
    uniforms.uAmbientBlend.value +=
      (ambientTarget - uniforms.uAmbientBlend.value) *
      (1 - Math.exp(-dt * 5));
    if (import.meta.env.DEV) {
      host.dataset.returnAngle = orientation
        .angleTo(initialOrientation)
        .toFixed(4);
      host.dataset.artworkCenter = `${artworkCenter.x.toFixed(1)},${artworkCenter.y.toFixed(1)}`;
      host.dataset.artworkRadius = artworkRadius.toFixed(1);
      host.dataset.elapsed = elapsed.toFixed(3);
      host.dataset.intro = intro.toFixed(3);
    }
    historyClock += dt;
    if (!historyReady) {
      uniforms.uPoseHistory.value.forEach(matrix => matrix.copy(viewPose));
      uniforms.uStateHistory.value.forEach(state =>
        state.set(elapsed, split, 0, 0)
      );
      historyReady = true;
    } else if (historyClock >= 1 / 30) {
      for (let i = 15; i > 0; i--) {
        uniforms.uPoseHistory.value[i].copy(uniforms.uPoseHistory.value[i - 1]);
        uniforms.uStateHistory.value[i].copy(
          uniforms.uStateHistory.value[i - 1]
        );
      }
      historyClock %= 1 / 30;
    }
    uniforms.uPoseHistory.value[0].copy(viewPose);
    uniforms.uStateHistory.value[0].set(elapsed, split, 0, 0);
    uniforms.uCanvasSize.value.set(
      bounds.width * renderer.getPixelRatio(),
      bounds.height * renderer.getPixelRatio()
    );
    bloomPass.strength = light ? 0 : mobile ? 0.42 : 0.55;
    // The heart flare is a hero beat: it only plays on the home stage.
    const flareT = Math.min(1, Math.max(0, (intro - 0.55) / 0.4));
    bloomPass.flare =
      light || pageScene.mode !== "home"
        ? 0
        : flareT * flareT * (3 - 2 * flareT) * 0.8;
    bloomPass.flareCenter.set(
      artworkCenter.x / bounds.width,
      1 - artworkCenter.y / bounds.height
    );
    renderer.toneMapping = light ? NoToneMapping : ACESFilmicToneMapping;
    composer.render(dt);
    if (import.meta.env.DEV) {
      // Surface GLSL program failures in the dataset: shader compile errors
      // only log to console otherwise, which throttled tooling never sees.
      const programs = renderer.info.programs;
      const failed = programs?.find(
        program => (program as unknown as { diagnostics?: string }).diagnostics
      );
      if (failed)
        host.dataset.shaderError = String(
          (failed as unknown as { diagnostics?: string }).diagnostics
        ).slice(0, 500);
      else delete host.dataset.shaderError;
    }
  }
  let slowFrameCount = 0;
  let governorTier = 0;
  function tick(now: number) {
    frame = 0;
    if (disposed || !visible || document.hidden || lost || paused) return;
    const delta = now - lastTime;
    if (delta >= (mobile && coarsePointer ? 1000 / 30 : 1000 / 60) - 3) {
      if (delta > 36) {
        slowFrameCount++;
        if (slowFrameCount >= 45) {
          slowFrameCount = 0;
          if (governorTier === 0) {
            governorTier = 1;
            renderer.setPixelRatio(Math.min(renderer.getPixelRatio(), 1.0));
            trailGeometry.instanceCount = Math.floor(
              trailGeometry.instanceCount * 0.5
            );
          } else if (governorTier === 1) {
            governorTier = 2;
            bloomPass.enabled = false;
            trailGeometry.instanceCount = 0;
          }
        }
      } else if (delta < 20 && slowFrameCount > 0) {
        slowFrameCount--;
      }

      if (import.meta.env.DEV) {
        frameIntervals.push(delta);
        if (frameIntervals.length > 180) frameIntervals.shift();
        if (now - statsAt > 2000) {
          statsAt = now;
          const sorted = [...frameIntervals].sort((a, b) => a - b);
          host.dataset.fps = (
            1000 /
            (frameIntervals.reduce((a, b) => a + b, 0) / frameIntervals.length)
          ).toFixed(1);
          host.dataset.frameP95 =
            sorted[Math.floor((sorted.length - 1) * 0.95)].toFixed(1);
          host.dataset.geometries = String(renderer.info.memory.geometries);
          host.dataset.textures = String(renderer.info.memory.textures);
        }
      }
      const dt = Math.min(delta / 1000, 0.05);
      elapsed += dt * (uniforms.uPagePose.value.z || 1);
      lastTime = now;
      paint(dt);
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    historyReady = false;
    pointerWake.clear();
    lastTime = performance.now();
    const running =
      !disposed && visible && !document.hidden && !lost && !paused;
    host.dataset.motion = running ? "running" : "paused";
    if (running) frame = requestAnimationFrame(tick);
  }
  const requestPaint = () => {
    if (frame || disposed || !visible || document.hidden || lost) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      paint();
    });
  };
  const resize = new ResizeObserver(() => {
    updateLayoutRects();
    const width = bounds.width;
    const height = bounds.height;
    if (!width || !height || lost) return;
    mobile = width < 640;
    renderer.setPixelRatio(
      Math.min(devicePixelRatio, mobile && coarsePointer ? 1.25 : 1.5)
    );
    uniforms.uMobile.value = mobile && coarsePointer ? 1 : 0;
    frameIntervals.length = 0;
    uniforms.uPixelRatio.value = renderer.getPixelRatio();
    uniforms.uCanvasSize.value.set(
      width * renderer.getPixelRatio(),
      height * renderer.getPixelRatio()
    );
    uniforms.uAspect.value = width / height;
    geometry.setDrawRange(0, mobile ? 2800 : count);
    starGeometry.instanceCount = mobile
      ? coarsePointer
        ? 128
        : 200
      : starCount;
    trailGeometry.instanceCount = mobile
      ? coarsePointer
        ? 128
        : 200
      : starCount;
    distantGeometry.setDrawRange(
      0,
      mobile ? (coarsePointer ? 60 : 90) : distantCount
    );
    renderer.setSize(width, height);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(width, height);
    bloomPass.setSize(width, height);
    historyReady = false;
    pointerWake.clear();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    paint();
  });
  resize.observe(host);
  if (copy) resize.observe(copy);
  const intersection = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  });
  intersection.observe(host);
  const move = (event: PointerEvent) => {
    if (reducedMotion) return;
    // Recover even if pointerup was lost outside the browser/capture surface.
    if (
      dragging &&
      event.pointerId === activePointer &&
      (event.buttons & 1) === 0
    )
      finishDrag();
    pointerTarget.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      1 - ((event.clientY - bounds.top) / bounds.height) * 2
    );
    // Track stroke velocity so the wake carries momentum, not just proximity.
    const stamp = event.timeStamp / 1000;
    if (lastPointerStamp > 0 && stamp > lastPointerStamp) {
      const moveDt = Math.max(1 / 240, stamp - lastPointerStamp);
      pointerVelocity.set(
        (pointerTarget.x - velocityPointer.x) / moveDt,
        (pointerTarget.y - velocityPointer.y) / moveDt
      );
      const speed = pointerVelocity.length();
      if (speed > 1.6) pointerVelocity.multiplyScalar(1.6 / speed);
      momentumTarget.lerp(pointerVelocity, 0.4);
    }
    velocityPointer.copy(pointerTarget);
    lastPointerStamp = stamp;
    if (hover < 0.01) {
      pointer.copy(pointerTarget);
      previousPointer.copy(pointerTarget);
    }
    targetHover = 1;
    // The wake belongs to hover and swipe. While pressed, the drag owns the
    // pointer: the rose rotates as one coherent mass instead of taking wake
    // hits that shred it locally on the smallest gesture.
    if (
      !paused &&
      event.buttons === 0 &&
      pageScene.mode === "home" &&
      uniforms.uSplit.value < 0.85
    ) {
      pointerWake.push(
        event.clientX - bounds.left,
        event.clientY - bounds.top,
        performance.now() / 1000,
        bounds.width,
        bounds.height
      );
    } else pointerWake.release();
    if (dragging && event.pointerId === activePointer) {
      projectTrackball(
        event.clientX - bounds.left - artworkCenter.x + artworkRadius,
        event.clientY - bounds.top - artworkCenter.y + artworkRadius,
        artworkRadius * 2,
        artworkRadius * 2,
        nextDragPoint
      );
      trackballDelta(dragPoint, nextDragPoint, deltaRotation);
      rotation.move(deltaRotation, (event.timeStamp - lastMoveTime) / 1000);
      dragPoint.copy(nextDragPoint);
      lastMoveTime = event.timeStamp;
    }
    requestPaint();
  };
  const down = (event: PointerEvent) => {
    if (reducedMotion) return;
    if (event.button !== 0 || !event.isPrimary || paused) return;
    if ((event.target as Element).closest("button,a,input,textarea,select"))
      return;
    if (pageScene.mode !== "home" || uniforms.uSplit.value > 0.5) return;
    if (
      Math.hypot(
        event.clientX - bounds.left - artworkCenter.x,
        event.clientY - bounds.top - artworkCenter.y
      ) >
      artworkRadius * 1.15
    )
      return;
    updateLayoutRects();
    pointerWake.release();
    dragging = true;
    activePointer = event.pointerId;
    projectTrackball(
      event.clientX - bounds.left - artworkCenter.x + artworkRadius,
      event.clientY - bounds.top - artworkCenter.y + artworkRadius,
      artworkRadius * 2,
      artworkRadius * 2,
      dragPoint
    );
    lastMoveTime = event.timeStamp;
    rotation.begin();
    controls.setPointerCapture(event.pointerId);
    controls.dataset.dragging = "true";
    move(event);
  };
  const finishDrag = (cancelled = false) => {
    if (!dragging) return;
    const pointerId = activePointer;
    dragging = false;
    activePointer = -1;
    pointerWake.release();
    rotation.release(cancelled);
    controls.dataset.dragging = "false";
    if (controls.hasPointerCapture(pointerId))
      controls.releasePointerCapture(pointerId);
  };
  const up = (event: PointerEvent) => {
    if (event.pointerId !== activePointer) return;
    finishDrag(event.type !== "pointerup");
    if (event.pointerType !== "mouse") targetHover = 0;
  };
  const leave = () => {
    pointerWake.release();
    finishDrag(true);
    targetHover = 0;
    requestPaint();
  };
  const key = (event: KeyboardEvent) => {
    if (reducedMotion) return;
    if (
      ![
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        " ",
        "Escape",
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    if (event.key === " ") {
      paused = !paused;
      sync();
    } else if (event.key === "Escape") {
      rotation.reset();
      historyReady = false;
    } else {
      angularAxis.set(
        event.key === "ArrowUp" || event.key === "ArrowDown" ? 1 : 0,
        event.key === "ArrowLeft" || event.key === "ArrowRight" ? 1 : 0,
        0
      );
      const direction =
        event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1;
      orientation
        .premultiply(
          increment.setFromAxisAngle(angularAxis, (direction * Math.PI) / 12)
        )
        .normalize();
      rotation.phase = "returning";
      rotation.speed = 0;
      historyReady = false;
    }
    requestPaint();
  };
  const onScroll = () => {
    updateLayoutRects();
    requestPaint();
  };
  const onWindowResize = () => {
    updateLayoutRects();
    requestPaint();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onWindowResize, { passive: true });
  // Track the pointer across reading surfaces too; only artwork starts a drag.
  window.addEventListener("pointermove", move);
  controls.addEventListener("pointerdown", down);
  window.addEventListener("pointerup", up, true);
  window.addEventListener("pointercancel", up, true);
  controls.addEventListener("lostpointercapture", up);
  document.documentElement.addEventListener("pointerleave", leave);
  window.addEventListener("blur", leave);
  controls.addEventListener("keydown", key);
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    host.dataset.ready = "false";
    sync();
  };
  const contextRestored = () => {
    lost = false;
    historyReady = false;
    host.dataset.ready = "true";

    // 1. Mark all textures for GPU re-upload
    trackTexture.needsUpdate = true;
    ambientTexture.needsUpdate = true;

    // 2. Mark all materials dirty for shader program re-compilation
    material.needsUpdate = true;
    starMaterial.needsUpdate = true;
    trailMaterial.needsUpdate = true;
    distantMaterial.needsUpdate = true;
    heartMaterial.needsUpdate = true;
    atmosphereMaterial.needsUpdate = true;

    // 3. Mark all geometry attributes dirty for VBO re-upload
    geometry.attributes.position.needsUpdate = true;
    if (geometry.attributes.aOrbit) geometry.attributes.aOrbit.needsUpdate = true;
    if (geometry.attributes.color) geometry.attributes.color.needsUpdate = true;
    if (geometry.attributes.aDayColor) geometry.attributes.aDayColor.needsUpdate = true;
    if (geometry.attributes.aSize) geometry.attributes.aSize.needsUpdate = true;
    if (geometry.attributes.aBright) geometry.attributes.aBright.needsUpdate = true;

    starGeometry.attributes.position.needsUpdate = true;
    if (starGeometry.attributes.aOrbit) starGeometry.attributes.aOrbit.needsUpdate = true;
    if (starGeometry.attributes.color) starGeometry.attributes.color.needsUpdate = true;
    if (starGeometry.attributes.aDayColor) starGeometry.attributes.aDayColor.needsUpdate = true;
    if (starGeometry.attributes.aSize) starGeometry.attributes.aSize.needsUpdate = true;
    if (starGeometry.attributes.aBright) starGeometry.attributes.aBright.needsUpdate = true;

    trailGeometry.attributes.position.needsUpdate = true;
    if (trailGeometry.attributes.aCenter) trailGeometry.attributes.aCenter.needsUpdate = true;
    if (trailGeometry.attributes.aColor) trailGeometry.attributes.aColor.needsUpdate = true;

    distantGeometry.attributes.position.needsUpdate = true;
    if (distantGeometry.attributes.color) distantGeometry.attributes.color.needsUpdate = true;
    if (distantGeometry.attributes.aSize) distantGeometry.attributes.aSize.needsUpdate = true;

    heartGeometry.attributes.position.needsUpdate = true;
    if (heartGeometry.attributes.uv) heartGeometry.attributes.uv.needsUpdate = true;

    atmosphereGeometry.attributes.position.needsUpdate = true;
    if (atmosphereGeometry.attributes.uv) atmosphereGeometry.attributes.uv.needsUpdate = true;

    // 4. Rebuild render targets for EffectComposer and BloomPyramidPass
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    composer.setSize(width, height);
    bloomPass.setSize(width, height);

    // 5. Clear pointer wake & layout
    pointerWake.clear();
    updateLayoutRects();
    paint();
    sync();
  };
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  renderer.domElement.addEventListener("webglcontextrestored", contextRestored);
  document.addEventListener("visibilitychange", sync);
  host.dataset.ready = "true";
  host.dataset.mode = pageScene.mode;
  host.dataset.variant = pageScene.phase.toFixed(6);
  if (pageScene.mode === "home") pagePose.set(0, 0, 1);
  updateLayoutRects();
  sync();
  // Dev-only tuning hook: lets tooling drive the reveal timeline while the
  // render loop is throttled (occluded panes), without touching shipping paths.
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__galaxyIntro = {
      get: () => intro,
      set: (value: number) => {
        intro = Math.min(1, Math.max(0, value));
        uniforms.uIntro.value = intro;
        // Synchronous on purpose: rAF is suspended when the pane is occluded.
        paint(0.016);
      },
    };
  }
  return {
    setPage(path: string) {
      pointerWake.clear();
      finishDrag(true);
      rotation.reset();
      historyReady = false;
      // BUG-07: Preserve intro = 1.0 on page navigation when already settled or under reducedMotion.
      // This guarantees smooth ambient constellation cross-fading without re-scattering particles.
      intro = reducedMotion || intro >= 1.0 ? 1 : 0;
      uniforms.uIntro.value = intro;
      if (import.meta.env.DEV) {
        host.dataset.intro = intro.toFixed(3);
      }
      pageScene = getPageScene(path);
      applyAmbient(path);
      quietNodes = [];
      hero = stage = gatherTarget = foot = copy = null;
      updateLayoutRects();
      pagePose.set(
        pageScene.mode === "home" ? 0 : pageScene.phase,
        pageScene.mode === "home" ? 0 : pageScene.tilt,
        pageScene.mode === "home" ? 1 : pageScene.pace
      );
      host.dataset.mode = pageScene.mode;
      host.dataset.variant = pageScene.phase.toFixed(6);
      requestPaint();
    },
    getIntro() {
      return intro;
    },
    setTheme(isLight: boolean) {
      light = isLight;
      bloomPass.enabled = !isLight;
      bloomPass.strength = isLight ? 0 : mobile ? 0.42 : 0.55;
      geometry.setDrawRange(0, mobile ? 2800 : count);
      uniforms.uLight.value = isLight ? 1 : 0;
      material.blending =
        starMaterial.blending =
        trailMaterial.blending =
        distantMaterial.blending =
        heartMaterial.blending =
          isLight ? NormalBlending : AdditiveBlending;
      material.needsUpdate =
        starMaterial.needsUpdate =
        trailMaterial.needsUpdate =
        distantMaterial.needsUpdate =
        heartMaterial.needsUpdate =
          true;
      requestPaint();
    },
    setPaused(value: boolean) {
      paused = reducedMotion || value;
      if (paused) finishDrag(true);
      historyReady = false;
      sync();
      requestPaint();
    },
    handleKey(event: KeyboardEvent) {
      key(event);
    },
    dispose() {
      disposed = true;
      sync();
      resize.disconnect();
      intersection.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onWindowResize);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", move);
      controls.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);
      controls.removeEventListener("lostpointercapture", up);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      controls.removeEventListener("keydown", key);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      renderer.domElement.removeEventListener(
        "webglcontextrestored",
        contextRestored
      );
      trackTexture.dispose();
      ambientTexture.dispose();
      bloomPass.dispose();
      outputPass.dispose();
      composer.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      geometry.dispose();
      material.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      trailGeometry.dispose();
      trailMaterial.dispose();
      distantGeometry.dispose();
      distantMaterial.dispose();
      heartGeometry.dispose();
      heartMaterial.dispose();
      if (typeof window !== "undefined") {
        delete (window as unknown as Record<string, unknown>).__galaxyIntro;
      }
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      host.dataset.ready = "false";
    },
  };
}
