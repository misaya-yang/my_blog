import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Quaternion,
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
  NoToneMapping,
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
import { ParticleField } from "./particleField";
import { sampleParticleBases } from "./sampleParticleBase";
import { calculateConstellationLayout } from "./constellationLayout";
import { createPhaseSampler, ribbonWidth } from "./particleDistribution";
import { bakeAmbientTracks, getAmbientProfile } from "./ambientScene";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { CompositePass } from "./compositePass";
import { BloomPyramidPass } from "./bloomPyramid";
import { projectTrackball, trackballDelta } from "./trackball";
import { getPageScene } from "./pageScene";
import { getScrollMotion, type MotionState } from "./scrollMotion";
import { RenderQuality } from "./renderQuality";
import {
  NebulaGasLayer,
  bakeNebulaGas,
  bakeNebulaHaze,
  createHazeMaterialSource,
  createHazePoints,
} from "./nebulaGas";

function smoothstep01(x: number) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

// Page backgrounds the opaque canvas renders onto; keep in sync with
// --observatory-bg in styles/observatory.css.
const NIGHT_SKY = new Color("#0b0c0e");
const DAY_PAPER = new Color("#f8fafc");

/**
 * Calculates dust particle brightness according to cubic power-law distribution.
 * Range: [0.35, 2.00]
 */
export function calculateDustBrightness(rand: number): number {
  return 0.35 + Math.pow(rand, 3) * 1.65;
}

/**
 * Calculates star brightness according to a steep power law (x^4.5): only a
 * few dozen stars carry halos and spikes, the rest read as fine grain.
 * Standard range: [0.40, 3.00]
 * Clustered heart stars range: [2.00, 2.60]
 */
export function calculateStarBrightness(rand: number, isHeart = false): number {
  return isHeart ? 2.0 + rand * 0.6 : 0.4 + Math.pow(rand, 4.5) * 2.6;
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
  const rawT = Math.min(1, Math.max(0, (uIntro - delay - 0.1) / 0.55));
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
  let mobile = host.clientWidth < 900;
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
  group.rotation.copy(RotationMotion.homeEuler);
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
  const ambientFromData = new Float32Array(trackData.length);
  const ambientFromTexture = new DataTexture(
    ambientFromData,
    TRACK_SAMPLES + 1,
    tracks.length,
    RGBAFormat,
    FloatType
  );
  ambientFromTexture.minFilter = ambientFromTexture.magFilter = NearestFilter;
  ambientFromTexture.needsUpdate = true;
  const flows = new Float32Array(count * 4);
  const colors = new Float32Array(count * 3);
  const dayColors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const brights = new Float32Array(count);
  const starCount = 300;
  const heartStarCount = 12;
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
  const dayPalette = ["#235fa8", "#3185ac", "#a8793f", "#455d86"].map(
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
    const bright =
      particle.orbit[0] >= PETAL_TRACKS
        ? 1.65
        : calculateDustBrightness(random());
    brights[i] = bright;
    const color =
      bright > 1.35 ? (random() < 0.55 ? 1 : 2) : random() < 0.62 ? 0 : 3;
    palette[color].toArray(colors, i * 3);
    dayPalette[color === 2 && i % 5 !== 0 ? 0 : color].toArray(
      dayColors,
      i * 3
    );
    sizes[i] =
      particle.orbit[0] >= PETAL_TRACKS
        ? 1.35
        : bright > 1.0
          ? 1.4 + random() * 0.9
          : 0.65 + random() * 0.65;
  }
  for (let i = 0; i < starCount; i++) {
    const heart = i < heartStarCount;
    const particle = sample(
      i,
      true,
      heart ? PETAL_TRACKS + (i % 2) : undefined
    );
    starPositions.set(particle.point, i * 3);
    starFlows.set(particle.orbit, i * 4);
    // Size is the visible core diameter in CSS pixels, independent of halo.
    const bright = calculateStarBrightness(random(), heart);
    starBrights[i] = bright;
    const color =
      bright > 1.6 ? (random() < 0.5 ? 1 : 2) : random() < 0.7 ? 0 : 3;
    palette[color].toArray(starColors, i * 3);
    dayPalette[color === 2 && i % 5 !== 0 ? 0 : color].toArray(
      dayStarColors,
      i * 3
    );
    starSizes[i] = heart
      ? 2.5 + random() * 0.7
      : 1.6 + Math.pow((bright - 0.4) / 2.6, 0.65) * 3.0;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aOrbit", new BufferAttribute(flows, 4));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.setAttribute("aDayColor", new BufferAttribute(dayColors, 3));
  geometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
  geometry.setAttribute("aBright", new BufferAttribute(brights, 1));
  const controls = host.parentElement!;

  const deformation = `
    uniform float uTime; uniform float uLight; uniform float uIntro;
    uniform float uScatterRadius;
    attribute vec4 aOrbit;
    uniform sampler2D uTracks;
    uniform float uTrackRows;
    uniform sampler2D uAmbientTracks;
    uniform sampler2D uAmbientFromTracks;
    uniform vec4 uAmbientMeta[6]; uniform vec4 uAmbientFromMeta[6];
    uniform float uAmbientMorph;
    uniform sampler2D uNavigationFrom; uniform float uNavigationProgress;
    uniform float uAmbientBlend;
    uniform float uConstellation;
    uniform vec4 uConstellationLayout[2];
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
    vec4 ambientLookup(sampler2D paths, float phase) {
      float sampleIndex = clamp(phase,0.0,1.0)*512.0;
      float row = (aOrbit.x+0.5)/uTrackRows;
      vec4 a = texture2D(paths,vec2((floor(sampleIndex)+0.5)/513.0,row));
      vec4 b = texture2D(paths,vec2((min(floor(sampleIndex)+1.0,512.0)+0.5)/513.0,row));
      return mix(a,b,fract(sampleIndex));
    }
    vec4 ambientPoint(float age, out float visibility) {
      int row = int(aOrbit.x);
      vec4 oldMeta = uAmbientFromMeta[row], newMeta = uAmbientMeta[row];
      float oldPhase = fract(aOrbit.y+(uTime-age)*0.24/max(oldMeta.y,0.1));
      float newPhase = fract(aOrbit.y+(uTime-age)*0.24/max(newMeta.y,0.1));
      float oldFade = oldMeta.x>0.5 ? 1.0 : smoothstep(0.0,oldMeta.z,oldPhase)*(1.0-smoothstep(1.0-oldMeta.z,1.0,oldPhase));
      float newFade = newMeta.x>0.5 ? 1.0 : smoothstep(0.0,newMeta.z,newPhase)*(1.0-smoothstep(1.0-newMeta.z,1.0,newPhase));
      visibility = mix(oldFade,newFade,uAmbientMorph);
      return mix(ambientLookup(uAmbientFromTracks,oldPhase),ambientLookup(uAmbientTracks,newPhase),uAmbientMorph);
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
    float cursorLight(vec4 view) {
      vec4 projected = projectionMatrix * view;
      vec2 delta = (projected.xy / projected.w - uPointer) * vec2(uAspect,1.0);
      return exp(-dot(delta,delta)*24.0)*uHover;
    }
    // Starfall convergence: a viewport-wide scattered field fades in first,
    // then each star departs on a staggered schedule and is captured along a
    // curved arc around the heart, easing into place with a soft snap.
    struct ParticleSample { vec4 view; float intro; float travel; float ambient; float flow; };
    vec3 applyIntro(vec3 p, vec3 original, inout ParticleSample result) {
      if (uIntro >= 1.0) { result.intro = 1.0; result.travel = 1.0; return p; }
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
      result.intro = mix(fieldFade, 1.0, local);
      float arc = sin(local*3.14159265) * (0.5 + iseed.z*0.35);
      float c = cos(arc), s = sin(arc);
      vec3 orbiting = vec3(
        scattered.x*c - scattered.y*s,
        scattered.x*s + scattered.y*c,
        scattered.z);
      result.travel = local;
      return mix(orbiting, p, local);
    }
    ParticleSample evaluateParticle(vec3 original, float age) {
      ParticleSample result; result.intro=1.0; result.travel=1.0; result.flow=flowFade(original);
      mat4 particleMatrix = modelViewMatrix;
      result.ambient = uAmbientBlend;
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
      p = applyIntro(p, original, result);
      // The per-article constellation: off the rose tracks, onto seeded
      // contours with a slow drift, morphed only where the rose is not the subject.
      if (uAmbientBlend > 0.001) {
        float ambientVisibility;
        vec4 ambient = ambientPoint(age,ambientVisibility);
        result.flow = mix(result.flow,ambientVisibility,uAmbientBlend);
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
        view = mix(heart + vec4(p.xy*scale,0.0,0.0),view,uAmbientBlend);
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
      // Reading constellations occupy two stable banks outside the text column.
      // Track identity picks the bank, so crossing its own center never teleports.
      float bank = mod(aOrbit.x,2.0)<0.5 ? -1.0 : 1.0;
      if (uConstellation > 0.5) {
        // Preserve each figure's proportions in CSS pixels. Reading motifs do
        // not inherit the rose's tilt or get squeezed into a vertical stripe.
        vec4 constellationBox = uConstellationLayout[bank < 0.0 ? 0 : 1];
        vec2 projected = constellationBox.xy + p.xy*constellationBox.zw;
        vec2 target = projected*(-view.z)/vec2(projectionMatrix[0][0],projectionMatrix[1][1]);
        view.xy = mix(view.xy,target,uAmbientBlend);
        float id = floor(clamp(aOrbit.y,0.0,1.0)*65536.0);
        float retained = mod(id*37.0+floor(aOrbit.x)*17.0,100.0)<24.0 ? 1.0 : 0.0;
        result.flow *= mix(1.0,retained,uAmbientBlend);
      } else {
        view.x = mix(view.x,bank*0.82*(-view.z)/projectionMatrix[0][0]+view.x*0.13,uAmbientBlend);
      }
      if (uNavigationProgress < 1.0) {
        vec4 previous=texture2D(uNavigationFrom,aFieldUV);
        view.xyz=mix(previous.xyz,view.xyz,uNavigationProgress);
      }
      result.view = view;
      return result;
    }
    vec4 particleView(vec3 original, float age) { return evaluateParticle(original,age).view; }
  `;
  const renderDeformation = `
    attribute vec4 aOrbit; attribute vec2 aParticleUV;
    uniform sampler2D uParticleCurrent; uniform sampler2D uParticleHistory;
    uniform float uHistoryHead; uniform float uHistoryCount;
    uniform float uTime; uniform float uLight; uniform float uIntro;
    uniform float uAmbientBlend; uniform float uAmbientTwinkle;
    uniform float uEnergy; uniform float uDisperse;
    struct ParticleSample { vec4 view; float intro; float travel; float ambient; float flow; };
    ParticleSample evaluateParticle(vec3 original, float age) {
      vec4 value=texture2D(uParticleCurrent,aParticleUV);
      ParticleSample result;
      result.view=vec4(value.xyz,1.0); result.intro=value.w;
      result.travel=1.0; result.ambient=uAmbientBlend; result.flow=1.0;
      return result;
    }
    float flowFade(vec3 original) { return 1.0; }
    float cursorLight(vec4 view) { return 0.0; }
    vec4 historyPoint(float frameAge) {
      float bounded=clamp(frameAge,0.0,max(0.0,uHistoryCount-1.0));
      float slotA=mod(uHistoryHead-floor(bounded)+12.0,12.0);
      float slotB=mod(slotA-1.0+12.0,12.0);
      vec4 a=texture2D(uParticleHistory,vec2(aParticleUV.x,(aParticleUV.y+slotA)/12.0));
      vec4 b=texture2D(uParticleHistory,vec2(aParticleUV.x,(aParticleUV.y+slotB)/12.0));
      return mix(a,b,fract(bounded));
    }
  `;
  const uniforms = {
    uParticleCurrent: { value: null as import("three").Texture | null },
    uParticleHistory: { value: null as import("three").Texture | null },
    uHistoryHead: { value: 0 },
    uHistoryCount: { value: 0 },
    uMobile: { value: mobile && coarsePointer ? 1 : 0 },
    uTracks: { value: trackTexture },
    uTrackRows: { value: tracks.length },

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

    uScatterRadius: { value: 11 },
    uAmbientTracks: { value: ambientTexture },
    uAmbientFromTracks: { value: ambientFromTexture },
    uAmbientMeta: {
      value: Array.from({ length: 6 }, () => new Vector4(1, 10, 0, 0)),
    },
    uAmbientFromMeta: {
      value: Array.from({ length: 6 }, () => new Vector4(1, 10, 0, 0)),
    },
    uAmbientMorph: { value: 1 },
    uNavigationFrom: { value: null as import("three").Texture | null },
    uNavigationProgress: { value: 1 },
    uAmbientBlend: { value: 0 },
    uConstellation: { value: 0 },
    uConstellationLayout: { value: [new Vector4(), new Vector4()] },
    uAmbientDrift: { value: new Vector3() },
    uAmbientTwinkle: { value: 1 },
    uAmbientGlow: { value: 1 },
    uInkWeight: { value: 1 },
    uNebula: { value: 0 },
    uFocus: { value: 10 },
  };
  let ambientTarget = 0;
  // One bake per navigation: six contour rows sampled on the CPU (microseconds),
  // uploaded into the ambient texture; everything downstream stays on the GPU.
  const applyAmbient = (path: string) => {
    const profile = getAmbientProfile(path);
    uniforms.uConstellation.value = /^\/post\/[^/?#]+/.test(path) ? 1 : 0;
    const blend = uniforms.uAmbientMorph.value;
    for (let i = 0; i < ambientData.length; i++)
      ambientFromData[i] += (ambientData[i] - ambientFromData[i]) * blend;
    uniforms.uAmbientFromMeta.value.forEach((meta, i) =>
      meta.lerp(uniforms.uAmbientMeta.value[i], blend)
    );
    ambientData.set(bakeAmbientTracks(profile));
    profile.rows.forEach((row, i) =>
      uniforms.uAmbientMeta.value[i].set(
        row.closed ? 1 : 0,
        row.length,
        row.endpointFade,
        0
      )
    );
    ambientTexture.needsUpdate = true;
    ambientFromTexture.needsUpdate = true;
    uniforms.uAmbientMorph.value = 0;
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
  ambientFromData.set(ambientData);
  uniforms.uAmbientFromMeta.value.forEach((meta, i) =>
    meta.copy(uniforms.uAmbientMeta.value[i])
  );
  uniforms.uAmbientMorph.value = 1;
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
    blending: AdditiveBlending,
    vertexShader: `uniform float uTime; uniform float uPixelRatio; uniform float uScrollPhase; uniform vec2 uCanvasSize;
      attribute float aSize; varying vec3 vColor; varying float vTwinkle;
      void main() {
        vColor = color;
        float phase = dot(position,vec3(2.7,4.3,1.2));
        float seed = fract(sin(phase*3.17)*43758.5453);
        float pulse = 0.5+0.5*sin(uTime*(0.60+seed*0.55)+phase);
        vTwinkle = 0.38+0.62*pulse*pulse;
        vec3 p = position;
        vec4 view = modelViewMatrix*vec4(p,1.0);
        vec2 driftPixels = vec2(
          sin(uTime*(0.22+seed*0.15)+phase+uScrollPhase*0.11),
          cos(uTime*(0.18+seed*0.12)+phase*1.31+uScrollPhase*0.13))*(2.0+seed*2.0);
        view.xy += driftPixels * 2.0 * (-view.z) / (projectionMatrix[1][1]*uCanvasSize.y/uPixelRatio);
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
        float sparkle = mix(vTwinkle,0.70+vTwinkle*0.30,uLight);
        gl_FragColor = lightOutput(vColor,day,(core+glow)*sparkle*0.88);
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
    blending: AdditiveBlending,
    uniforms,
    vertexShader: `${renderDeformation}
      attribute float aSize; attribute vec3 aDayColor; attribute float aBright;
      uniform float uPixelRatio; uniform float uFocus;
      varying vec3 vColor; varying float vFlow; varying float vBright; varying float vIntro; varying float vAmbient;
      varying float vDefocus;
      void main() {
        ParticleSample particle = evaluateParticle(position,0.0);
        vFlow = particle.flow;
        vColor = mix(color, aDayColor, uLight);
        vBright = aBright;
        // The scattered field belongs to the stars and the brightest motes only;
        // dim dust materializes as it seats into the rose, like the reference sky.
        float brightBias = smoothstep(1.85, 2.0, aBright);
        float seatGate = smoothstep(0.25, 0.9, particle.travel);
        float introVis = particle.intro * mix(seatGate, 1.0, brightBias);
        vIntro = particle.intro;
        vAmbient = particle.ambient;
        vec4 view = particle.view;
        gl_Position = projectionMatrix * view;
        gl_PointSize = aSize * uPixelRatio * clamp(10.0/-view.z,0.85,1.15) * mix(1.0,1.45,uLight) * mix(0.4, 1.0, sqrt(introVis))
          * mix(1.0, mix(1.0, 0.85, uLight), particle.ambient)
          * mix(0.55, 1.0, max(seatGate, brightBias));
        // Cheap depth of field: motes away from the rose's focal depth grow
        // into soft discs and give up brightness roughly by area.
        vDefocus = smoothstep(0.9, 3.2, abs(-view.z - uFocus)) * (1.0 - particle.ambient);
        gl_PointSize *= 1.0 + vDefocus * 1.4;
      }`,
    fragmentShader: `varying vec3 vColor; varying float vFlow; varying float vBright; varying float vIntro; varying float vAmbient; uniform float uDisperse; uniform float uLight;
      varying float vDefocus;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float blurEdge = vDefocus * 0.75;
        float grow = 1.0 + vDefocus * 1.4;
        // Night emits light, so the brightest motes roll toward white. Day
        // deposits the same mote's ink; its density comes from the alpha.
        float highlight = smoothstep(1.7, 2.2, vBright) * 0.6;
        vec3 emission = mix(vColor, vec3(1.0), highlight) * (1.0 + vBright * 0.22);
        float ambientAlpha = mix(1.0, 0.6, vAmbient);
        float energy = mix(0.38,0.88,smoothstep(0.35,2.0,vBright));
        gl_FragColor = lightOutput(
          emission,
          vColor,
          (1.0 - smoothstep(0.85-fwidth(d)-blurEdge, 0.85+fwidth(d), d))
            * energy * vFlow * (1.0 - uDisperse * 0.25) * vIntro
            * ambientAlpha / (grow * grow * 0.7 + 0.3)
        );
        #include <colorspace_fragment>
      }`,
  });
  const dust = new Points(geometry, material);
  dust.frustumCulled = false;
  dust.renderOrder = 1;
  group.add(dust);
  // Volumetric mass around the streams: sub-pixel haze in the main pass and
  // quarter-resolution gas composited later.
  const hazeCount = 8000;
  const hazeMaterial = new ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: AdditiveBlending,
    ...createHazeMaterialSource(),
  });
  const haze = createHazePoints(bakeNebulaHaze(tracks, hazeCount), hazeMaterial);
  group.add(haze);
  const nebulaGas = new NebulaGasLayer(bakeNebulaGas(tracks, 600));
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
    blending: AdditiveBlending,
    uniforms,
    vertexShader: `${renderDeformation}
      attribute vec3 aCenter; attribute vec3 aColor; attribute vec3 aDayColor; attribute float aSize; attribute float aBright;
      uniform vec2 uCanvasSize; uniform float uPixelRatio; uniform float uMobile;
      varying vec2 vUv; varying vec3 vColor; varying float vBrightness; varying float vProminence; varying float vLens; varying float vCoreRadius; varying float vForeshorten; varying float vIntro; varying float vCrystalSeed;
      void main() {
        vUv = position.xy * 2.0;
        vCrystalSeed = fract(sin(dot(aCenter.xy,vec2(12.9,78.2)))*43758.5);
        vColor = mix(aColor,aDayColor,uLight);
        vBrightness = (0.82 + 0.18*sin(uTime*0.42*uAmbientTwinkle+length(aCenter.xy)*1.15))*flowFade(aCenter)*mix(0.7, 1.5, aBright / 3.0);
        // Diffraction spikes belong to the few brightest stars only.
        vProminence = smoothstep(2.2,3.0,aBright);
        ParticleSample particle = evaluateParticle(aCenter,0.0);
        vec4 center = particle.view;
        vLens = cursorLight(center);
        vIntro = particle.intro;
        vec3 travel = center.xyz-historyPoint(1.0).xyz;
        vForeshorten = mix(1.0,0.55+0.45*clamp(length(travel.xy)/max(length(travel),0.00001),0.0,1.0),step(2.0,uHistoryCount));
        // Bound the luminous core in screen pixels independently from its halo.
        // Traveling stars stay slim; halos and glints bloom once they seat.
        float depth = clamp(10.0 / -center.z,0.7,1.3);
        float diameter = mix(10.0 + aSize*5.0, 3.0+aSize*1.8, uLight)*depth*mix(1.0,0.75,uMobile)*mix(0.45, 1.0, sqrt(particle.intro))
          * mix(0.55, 1.0, smoothstep(0.2, 0.85, particle.travel));
        float corePixels = aSize*0.7*depth*mix(mix(1.0,0.72,uMobile),1.30,uLight);
        vCoreRadius = corePixels / (diameter*0.5);
        float worldSize = diameter * 2.0 * (-center.z) / (projectionMatrix[1][1] * uCanvasSize.y / uPixelRatio);
        center.xy += position.xy * worldSize;
        gl_Position = projectionMatrix * center;
      }`,
    fragmentShader: `varying vec2 vUv; varying vec3 vColor; varying float vBrightness; varying float vProminence; varying float vLens; varying float vCoreRadius; varying float vForeshorten; varying float vIntro; varying float vCrystalSeed;
      uniform float uDisperse; uniform float uLight;
      void main() {
        float r = length(vUv);
        if (r > 1.0) discard;
        float core = exp(-r*r/(vCoreRadius*vCoreRadius)*1.5);
        float corona = exp(-r*r/(vCoreRadius*vCoreRadius)*0.25);
        float halo = exp(-r*r*9.0);
        float glint = (exp(-abs(vUv.x)*90.0)*exp(-abs(vUv.y)*12.0)
          + exp(-abs(vUv.y)*90.0)*exp(-abs(vUv.x)*12.0))*vProminence;
        // Only genuinely bright stars carry a corona; the rest are fine grain.
        float lift = smoothstep(0.85, 1.35, vBrightness);
        float profile = core + (corona*0.14 + halo*0.02)*lift + glint*(0.025 + vProminence*0.12);
        float whiteCore = smoothstep(0.75,1.4,vBrightness);
        vec3 emission = mix(vColor,vec3(1.0),core*(0.35+whiteCore*0.45))*(1.0+core*(1.0+whiteCore*3.0));
        // Day: the same profile deposits ink, a dense core inside a soft aura.
        float dayProfile = (core*1.05 + corona*0.3 + halo*0.05) * mix(0.45, 1.0, lift);
        gl_FragColor = lightOutput(
          emission,
          vColor,
          mix(profile,dayProfile,uLight)*(vBrightness+vLens*0.15)*vForeshorten*(1.0-uDisperse*0.25)*vIntro);
        #include <colorspace_fragment>
      }`,
  });
  const stars = new Mesh(starGeometry, starMaterial);
  stars.frustumCulled = false;
  stars.renderOrder = 3;
  group.add(stars);
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
  const trailMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms,
    vertexShader: `${renderDeformation}
      attribute vec3 aCenter; attribute vec3 aColor;
      varying float vAge; varying float vEdge; varying vec3 vColor; varying float vMotion; varying float vIntroTrail;
      void main() {
        vAge = position.x; vEdge = position.y; vColor = aColor;
        vec4 current=texture2D(uParticleCurrent,aParticleUV);
        float frameAge=vAge*mix(4.0,10.0,uEnergy);
        vec4 historical=historyPoint(frameAge);
        vec4 center=vec4(mix(current.xyz,historical.xyz,min(frameAge,1.0)),1.0);
        vec4 nextHistory=historyPoint(frameAge+1.0);
        vec4 next=vec4(nextHistory.xyz,1.0);
        vec4 screenA=projectionMatrix*center,screenB=projectionMatrix*next;
        float segmentLength=length(screenA.xy/screenA.w-screenB.xy/screenB.w);
        vIntroTrail=min(current.w,min(historical.w,nextHistory.w))*smoothstep(0.5,1.0,uIntro)
          *step(2.0,uHistoryCount)*(1.0-smoothstep(0.05,0.12,segmentLength));
        vMotion = clamp((length(next.xy-center.xy)-0.018)*12.0,0.0,1.0);
        vec2 tangent = normalize(next.xy - center.xy + vec2(0.00001));
        center.xy += vec2(-tangent.y, tangent.x) * position.y * (0.003+uEnergy*0.008+vMotion*0.008) * (1.0 - vAge);
        gl_Position = projectionMatrix * center;
      }`,
    fragmentShader: `varying float vAge; varying float vEdge; varying vec3 vColor; varying float vMotion; varying float vIntroTrail;
      uniform float uLight; uniform float uDisperse; uniform float uEnergy;
      void main() {
        float alpha = pow(1.0 - vAge, 1.8) * (1.0 - vEdge * vEdge) * mix(0.506,0.42,uLight) * (1.0 - uDisperse * 0.255) * vIntroTrail;
        gl_FragColor = lightOutput(vColor, vec3(0.12, 0.26, 0.48), alpha*max(0.12+uEnergy*0.88,vMotion));
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
    hazeMaterial,
    starMaterial,
    trailMaterial,
    distantMaterial,
  ]) {
    // Mask pixels, not billboard vertices: large near stars otherwise interpolate
    // an unmasked corner across text even when their center is inside the reader.
    opticalMaterial.fragmentShader =
      `
      uniform float uLight; uniform float uSplit; uniform float uInkWeight;
      uniform vec4 uCopyBounds; uniform float uCopyOpacity;
      // Both themes accumulate additively. Night writes emitted light; day
      // writes the ink's per-channel absorbance, which the composite turns
      // into paper transmittance (Beer–Lambert).
      vec4 lightOutput(vec3 emission, vec3 ink, float alpha) {
        vec3 absorbance = -log(clamp(ink, vec3(0.015), vec3(0.98)));
        return vec4(mix(emission, absorbance * uInkWeight, uLight), alpha);
      }
      uniform vec4 uQuietBoxes[4];
      uniform float uReading; uniform vec2 uGatherZone;
      uniform vec2 uCanvasSize;
      float readableArea() {
        vec2 p = gl_FragCoord.xy / uCanvasSize;
        float x = smoothstep(uCopyBounds.x-0.05,uCopyBounds.x,p.x) * (1.0-smoothstep(uCopyBounds.z,uCopyBounds.z+0.08,p.x));
        float y = smoothstep(uCopyBounds.y-0.04,uCopyBounds.y,p.y) * (1.0-smoothstep(uCopyBounds.w,uCopyBounds.w+0.04,p.y));
        float edge = mix(mix(0.12,0.16,uLight),mix(0.85,0.9,uLight),smoothstep(0.44,0.90,abs(p.x-0.5)*2.0));
        float openBand = smoothstep(uGatherZone.x,uGatherZone.x+0.06,p.y) * (1.0-smoothstep(uGatherZone.y-0.06,uGatherZone.y,p.y));
        float quiet = 1.0;
        for (int i=0;i<4;i++) {
          vec4 b = uQuietBoxes[i];
          float qx = smoothstep(b.x-0.05,b.x-0.01,p.x)*(1.0-smoothstep(b.z+0.01,b.z+0.05,p.x));
          float qy = smoothstep(b.y-0.03,b.y-0.005,p.y)*(1.0-smoothstep(b.w+0.005,b.w+0.03,p.y));
          quiet *= 1.0-qx*qy*0.95;
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
    "if (fract(sin(vSeed)*43758.5453) > mix(1.0,0.38,uReading)*mix(1.0,0.65,vAmbient)*readableArea()) discard;\n        float d = length(gl_PointCoord"
  );
  material.vertexShader = material.vertexShader
    .replace(
      "varying vec3 vColor;",
      "varying float vSeed; varying vec3 vColor;"
    )
    .replace(
      "vFlow = particle.flow;",
      "vSeed = dot(position,vec3(12.3,8.1,3.7)); vFlow = particle.flow;"
    );
  material.fragmentShader = "varying float vSeed;\n" + material.fragmentShader;

  const totalParticles = count + starCount;
  const fieldPositions = new Float32Array(totalParticles * 3);
  const fieldOrbits = new Float32Array(totalParticles * 4);
  const fieldBrights = new Float32Array(totalParticles);
  fieldPositions.set(positions);
  fieldPositions.set(starPositions, count * 3);
  fieldOrbits.set(flows);
  fieldOrbits.set(starFlows, count * 4);
  fieldBrights.set(brights);
  fieldBrights.set(starBrights, count);
  const particleUV = (start: number, n: number) => {
    const uv = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const id = start + i;
      uv[i * 2] = ((id % 128) + 0.5) / 128;
      uv[i * 2 + 1] = (Math.floor(id / 128) + 0.5) / 64;
    }
    return uv;
  };
  geometry.setAttribute(
    "aParticleUV",
    new BufferAttribute(particleUV(0, count), 2)
  );
  starGeometry.setAttribute(
    "aParticleUV",
    new InstancedBufferAttribute(particleUV(count, starCount), 2)
  );
  trailGeometry.setAttribute(
    "aParticleUV",
    new InstancedBufferAttribute(particleUV(count, starCount), 2)
  );
  // Particle draw ranges and instance counts initialized immediately for mobile
  if (mobile && coarsePointer) {
    geometry.setDrawRange(0, 2800);
    starGeometry.instanceCount = coarsePointer ? 128 : 200;
    trailGeometry.instanceCount = coarsePointer ? 128 : 200;
    distantGeometry.setDrawRange(0, coarsePointer ? 60 : 90);
  }

  // One scene render feeds a mip-pyramid bloom and a single composite pass
  // that tone maps (night) or applies ink transmittance (day) and encodes sRGB.
  renderer.toneMapping = NoToneMapping;
  const bloomPass = new BloomPyramidPass({
    levels: mobile ? 3 : 4,
    threshold: 0.85,
    knee: 0.25,
    strength: bloomStrength(),
  });
  bloomPass.pyramidOnly = true;
  const compositePass = new CompositePass(themeSettings());
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(bloomPass);
  composer.addPass(compositePass);
  compositePass.nebulaTexture = nebulaGas.target.texture;
  function bloomStrength() {
    // Day reuses the pyramid as a faint ink bleed around dense strokes.
    return light ? 1 : mobile ? 0.42 : 0.55;
  }
  function themeSettings() {
    return {
      light,
      background: light ? DAY_PAPER : NIGHT_SKY,
      bloomStrength: bloomStrength(),
      inkDensity: 1,
      inkBleed: 0.18,
      vignette: 0.5,
      // Hundreds of splats overlap; these bring the summed veil to a haze.
      nebulaStrength: (light ? 0.026 : 0.015) * (mobile ? 0.75 : 1),
    };
  }

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
  const rotation = new RotationMotion(RotationMotion.defaultHomeQuaternion());
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
  const brush = {
    from: new Vector2(),
    to: new Vector2(),
    velocity: new Vector2(),
    active: false,
  };
  const brushPrevious = new Vector2();
  let lastPointerStamp = 0;
  const dragCenter = new Vector3();
  let dragRadius = 100;
  let field: ParticleField | undefined;
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
  const frameIntervals: number[] = [];
  let statsAt = 0;
  const viewPose = new Matrix4();
  const artworkCenter = new Vector3();
  const heartWorld = new Vector3();
  const pivotOffset = new Vector3();
  const rotatedPivot = new Vector3();
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

    if (uniforms.uConstellation.value > 0.5) {
      const columns = Array.from(
        document.querySelectorAll(
          ".public-universe :is(.paper-reader-main,.paper-toc-rail)"
        )
      )
        .map(node => node.getBoundingClientRect())
        .filter(rect => rect.width > 0);
      const leftGutter = columns.length
        ? Math.max(
            0,
            Math.min(...columns.map(rect => rect.left)) - bounds.left - 12
          )
        : bounds.width * 0.15;
      const rightGutter = columns.length
        ? Math.max(
            0,
            bounds.right - Math.max(...columns.map(rect => rect.right)) - 12
          )
        : bounds.width * 0.15;
      const layout = calculateConstellationLayout({
        width: bounds.width,
        height: bounds.height,
        leftGutter,
        rightGutter,
        seedPhase: pageScene.phase / (Math.PI * 2),
      });
      uniforms.uConstellationLayout.value.forEach((value, side) =>
        value.copy(layout[side])
      );
    }

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
          ".public-universe :is(.paper-reader-main,.paper-toc-rail,.public-search-form,.search-results-surface,.archive-timeline,.observatory-featured,.observatory-notes,.track-article-ledger,.track-path-section,.page-hero,.taxonomy-notes-surface,.taxonomy-side-panel,.about-focus-ledger,.about-links-rail)"
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
  field = new ParticleField(renderer, {
    forceCPU:
      import.meta.env.DEV &&
      typeof window.location?.search === "string" &&
      new URLSearchParams(window.location.search).get("particle-renderer") ===
        "cpu",
    positions: fieldPositions,
    orbits: fieldOrbits,
    brights: fieldBrights,
    dustCount: count,
    deformation,
    uniforms,
  });
  const cpuBase = new Float32Array(128 * 64 * 4);
  const cpuMetaFrom = new Float32Array(24),
    cpuMetaTo = new Float32Array(24);
  function paint(dt = 0.016) {
    const smoothing = paused || reducedMotion ? 1 : 1 - Math.exp(-dt * 9);
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
              Math.max(0, (68 - heroTop) / (travel > 20 ? travel : stageHeight))
            );
    scrollProgress +=
      (progress - scrollProgress) *
      (paused || reducedMotion ? 1 : 1 - Math.exp(-dt * 14));
    const distance =
      Math.abs(
        targetTop + targetHeight / 2 - (bounds.top + bounds.height / 2)
      ) / bounds.height;
    const proximity =
      reducedMotion || mobile
        ? 0
        : Math.max(0, Math.min(1, (0.75 - distance) / 0.5));
    const gatherGoal = proximity * proximity * (3 - 2 * proximity);
    gather +=
      (gatherGoal - gather) *
      (paused || reducedMotion ? 1 : 1 - Math.exp(-dt * 14));
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
      stage.style.setProperty(
        "--hero-copy-opacity",
        String(motion.copyOpacity)
      );
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
    hover +=
      (targetHover - hover) *
      (1 - Math.exp(-dt * (targetHover > hover ? 10 : 3.5)));
    pointer.lerp(pointerTarget, smoothing);
    uniforms.uPointer.value.copy(pointer);
    uniforms.uHover.value = hover;
    previousPointer.lerp(pointer, 1 - Math.exp(-dt * 2.2));
    uniforms.uPreviousPointer.value.copy(previousPointer);
    uniforms.uEnergy.value +=
      (Math.min(1, rotation.speed / 3 + flowSpeed * 0.65) -
        uniforms.uEnergy.value) *
      smoothing;
    // Pointer speed is deliberately NOT energy: global trail response to a
    // flick made the whole rose streak. Trails only follow real particle motion.

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
    group.position.z = 0;
    pivotOffset.set(0, 0, -1.42).applyQuaternion(initialOrientation);
    rotatedPivot.set(0, 0, -1.42).applyQuaternion(orientation);
    group.position.add(
      pivotOffset.sub(rotatedPivot).multiplyScalar(group.scale.x)
    );
    camera.updateMatrixWorld();
    group.updateMatrixWorld();
    viewPose.multiplyMatrices(camera.matrixWorldInverse, group.matrixWorld);
    // The luminous lvy heart, not the group origin, anchors the flare and the
    // trackball pivot; in screen space the two differ only by depth.
    heartWorld.set(0, 0, -1.42).applyMatrix4(group.matrixWorld);
    uniforms.uFocus.value = camera.position.z - heartWorld.z;
    heartWorld.project(camera);
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
      (paused || reducedMotion ? 1 : 1 - Math.exp(-dt * 5));
    uniforms.uAmbientMorph.value = Math.min(
      1,
      uniforms.uAmbientMorph.value + (paused || reducedMotion ? 1 : dt / 0.8)
    );
    uniforms.uNavigationProgress.value = Math.min(
      1,
      uniforms.uNavigationProgress.value +
        (paused || reducedMotion ? 1 : dt / 0.8)
    );
    if (import.meta.env.DEV) {
      host.dataset.returnAngle = orientation
        .angleTo(initialOrientation)
        .toFixed(4);
      host.dataset.artworkCenter = `${artworkCenter.x.toFixed(1)},${artworkCenter.y.toFixed(1)}`;
      host.dataset.artworkRadius = artworkRadius.toFixed(1);
      host.dataset.elapsed = elapsed.toFixed(3);
      host.dataset.intro = intro.toFixed(3);
    }
    uniforms.uCanvasSize.value.set(
      bounds.width * renderer.getPixelRatio(),
      bounds.height * renderer.getPixelRatio()
    );
    bloomPass.strength = bloomStrength();
    if (field) {
      // Integrate the whole stroke since the last frame, not just the last
      // pointer event; coalesced or sparse mouse events must carry equal energy.
      if (brush.active)
        brush.velocity
          .subVectors(brush.to, brush.from)
          .divideScalar(Math.max(dt, 1 / 240));
      if (field.needsCPUBase) {
        uniforms.uAmbientMeta.value.forEach((v, i) =>
          v.toArray(cpuMetaTo, i * 4)
        );
        uniforms.uAmbientFromMeta.value.forEach((v, i) =>
          v.toArray(cpuMetaFrom, i * 4)
        );
        sampleParticleBases(
          {
            positions: fieldPositions,
            orbits: fieldOrbits,
            brights: fieldBrights,
            dustCount: count,
            tracks: trackData,
            ambientFrom: ambientFromData,
            ambientTo: ambientData,
            ambientMetaFrom: cpuMetaFrom,
            ambientMetaTo: cpuMetaTo,
            ambientMorph: uniforms.uAmbientMorph.value,
            ambientBlend: uniforms.uAmbientBlend.value,
            time: elapsed,
            intro,
            scatterRadius: uniforms.uScatterRadius.value,
            viewMatrix: viewPose,
            split,
            disperse: uniforms.uDisperse.value,
            pagePose: uniforms.uPagePose.value,
            sideX: uniforms.uSideX.value,
            aspect: camera.aspect,
            ambientDrift: uniforms.uAmbientDrift.value,
            constellationLayout:
              uniforms.uConstellation.value > 0.5
                ? (uniforms.uConstellationLayout.value as [Vector4, Vector4])
                : undefined,
            navigationFrom: uniforms.uNavigationFrom.value?.image?.data as
              | Float32Array
              | undefined,
            navigationProgress: uniforms.uNavigationProgress.value,
          },
          cpuBase
        );
      }
      field.update({
        matrixWorld: group.matrixWorld,
        camera,
        dt: paused ? 0 : dt,
        pointer: brush,
        width: bounds.width,
        height: bounds.height,
        paused,
        basePositions: field.needsCPUBase ? cpuBase : undefined,
      });
      uniforms.uParticleCurrent.value = field.textures.current;
      uniforms.uParticleHistory.value = field.textures.history;
      uniforms.uHistoryHead.value = field.historyHead;
      uniforms.uHistoryCount.value = field.historyCount;
      if (import.meta.env.DEV) {
        host.dataset.motionBackend = field.needsCPUBase ? "cpu" : "gpu";
        host.dataset.inputActive = String(brush.active);
      }
      brush.active = false;
    }
    // The nebula belongs to the assembled rose: it condenses at the end of the
    // intro and thins out as the rose disperses or yields to a constellation.
    const introGate = Math.min(1, Math.max(0, (intro - 0.55) / 0.45));
    uniforms.uNebula.value =
      introGate * introGate * (3 - 2 * introGate) *
      (1 - uniforms.uAmbientBlend.value) *
      (1 - smoothstep01((uniforms.uSplit.value - 0.05) / 0.6));
    nebulaGas.render(renderer, camera, group.matrixWorld, {
      light,
      opacity: uniforms.uNebula.value,
      time: elapsed,
    });
    compositePass.bloomTexture = bloomPass.enabled ? bloomPass.output : null;
    compositePass.time = elapsed;
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
  const quality = new RenderQuality();
  let lastInteraction = -Infinity;
  const noteInteraction = () => {
    lastInteraction = performance.now();
  };
  // Reading pages keep drifting, but an idle drift behind text does not need
  // 60 fps. Input, rotation and page transitions restore the full rate.
  function frameBudget(now: number) {
    if (mobile && coarsePointer) return 1000 / 30;
    if (pageScene.mode === "home") return 1000 / 60;
    const settling =
      intro < 1 ||
      uniforms.uNavigationProgress.value < 1 ||
      uniforms.uAmbientMorph.value < 1 ||
      rotation.phase !== "idle";
    return settling || now - lastInteraction < 1500 ? 1000 / 60 : 1000 / 30;
  }
  function tick(now: number) {
    frame = 0;
    if (disposed || !visible || document.hidden || lost || paused) return;
    const delta = now - lastTime;
    const budget = frameBudget(now);
    if (delta >= budget - 3) {
      if (quality.observe(delta, budget, now)) applyQuality();

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
  function cancelInput() {
    finishDrag(true);
    lastPointerStamp = 0;
    brush.active = false;
    brush.velocity.set(0, 0);
    targetHover = hover = 0;
    field?.resetMotion();
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    cancelInput();
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
  function applyQuality() {
    const width = bounds.width,
      height = bounds.height;
    const visibleStars = mobile && coarsePointer ? 128 : starCount;
    const profile = quality.apply({
      devicePixelRatio,
      mobile,
      coarsePointer,
      light,
      reading: pageScene.mode !== "home",
      starCount: visibleStars,
    });
    renderer.setPixelRatio(profile.dpr);
    renderer.setSize(width, height);
    composer.setPixelRatio(profile.dpr);
    composer.setSize(width, height);
    nebulaGas.setSize(width * profile.dpr, height * profile.dpr);
    compositePass.apply(themeSettings());
    uniforms.uPixelRatio.value = profile.dpr;
    uniforms.uCanvasSize.value.set(width * profile.dpr, height * profile.dpr);
    uniforms.uMobile.value = mobile && coarsePointer ? 1 : 0;
    uniforms.uAspect.value = width / height;
    geometry.setDrawRange(0, mobile && coarsePointer ? 2800 : count);
    haze.geometry.setDrawRange(
      0,
      mobile && coarsePointer ? Math.floor(hazeCount * 0.4) : hazeCount
    );
    starGeometry.instanceCount = visibleStars;
    trailGeometry.instanceCount = profile.trailCount;
    distantGeometry.setDrawRange(
      0,
      mobile ? (coarsePointer ? 60 : 90) : distantCount
    );
    bloomPass.enabled = profile.bloomEnabled;
    host.dataset.quality = String(profile.tier);
    host.dataset.renderScale = quality.scale.toFixed(2);
  }
  const resize = new ResizeObserver(() => {
    cancelInput();
    updateLayoutRects();
    const width = bounds.width;
    const height = bounds.height;
    if (!width || !height || lost) return;
    mobile = width < 900;
    applyQuality();
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
  let layoutFrame = 0;
  const contentObserver =
    typeof MutationObserver === "undefined"
      ? null
      : new MutationObserver(() => {
          if (layoutFrame || disposed) return;
          layoutFrame = requestAnimationFrame(() => {
            layoutFrame = 0;
            if (disposed) return;
            quietNodes = [];
            updateLayoutRects();
            requestPaint();
          });
        });
  const contentRoot = document.getElementById?.("root");
  if (contentRoot)
    contentObserver?.observe(contentRoot, { childList: true, subtree: true });
  const move = (event: PointerEvent) => {
    noteInteraction();
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
    const stamp = event.timeStamp / 1000;
    const px = event.clientX - bounds.left,
      py = event.clientY - bounds.top;
    const gap = stamp - lastPointerStamp;
    const eligible =
      !paused &&
      pageScene.mode === "home" &&
      uniforms.uSplit.value < 0.85 &&
      (event.buttons === 0 || (dragging && event.pointerId === activePointer));
    if (eligible && lastPointerStamp > 0 && gap > 0 && gap < 0.4) {
      if (!brush.active) brush.from.copy(brushPrevious);
      brush.to.set(px, py);
      brush.velocity.set(
        (px - brushPrevious.x) / Math.max(gap, 1 / 240),
        (py - brushPrevious.y) / Math.max(gap, 1 / 240)
      );
      brush.active = true;
    }
    brushPrevious.set(px, py);
    lastPointerStamp = stamp;
    if (hover < 0.01) pointer.copy(pointerTarget);
    targetHover = eligible ? 1 : 0;
    if (dragging && event.pointerId === activePointer) {
      projectTrackball(
        event.clientX - bounds.left - dragCenter.x + dragRadius,
        event.clientY - bounds.top - dragCenter.y + dragRadius,
        dragRadius * 2,
        dragRadius * 2,
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
    noteInteraction();
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
    dragCenter.copy(artworkCenter);
    dragRadius = artworkRadius;
    lastPointerStamp = 0;
    dragging = true;
    activePointer = event.pointerId;
    projectTrackball(
      event.clientX - bounds.left - dragCenter.x + dragRadius,
      event.clientY - bounds.top - dragCenter.y + dragRadius,
      dragRadius * 2,
      dragRadius * 2,
      dragPoint
    );
    lastMoveTime = event.timeStamp;
    rotation.begin();
    controls.setPointerCapture(event.pointerId);
    controls.dataset.dragging = "true";
    move(event);
  };
  function finishDrag(cancelled = false) {
    if (!dragging) return;
    const pointerId = activePointer;
    dragging = false;
    activePointer = -1;
    lastPointerStamp = 0;
    rotation.release(cancelled);
    controls.dataset.dragging = "false";
    if (controls.hasPointerCapture(pointerId))
      controls.releasePointerCapture(pointerId);
  }
  const up = (event: PointerEvent) => {
    if (event.pointerId !== activePointer) return;
    finishDrag(event.type !== "pointerup");
    if (event.pointerType !== "mouse") targetHover = 0;
  };
  const leave = () => {
    cancelInput();
    targetHover = 0;
    requestPaint();
  };
  const key = (event: KeyboardEvent) => {
    noteInteraction();
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
      field?.resetHistory();
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
      field?.resetHistory();
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
    uniforms.uNavigationProgress.value = 1;
    uniforms.uNavigationFrom.value = null;
    field?.resetHistory();
    host.dataset.ready = "true";

    // 1. Mark all textures for GPU re-upload
    trackTexture.needsUpdate = true;
    ambientTexture.needsUpdate = true;

    // 2. Mark all materials dirty for shader program re-compilation
    material.needsUpdate = true;
    starMaterial.needsUpdate = true;
    trailMaterial.needsUpdate = true;
    distantMaterial.needsUpdate = true;

    // 3. Mark all geometry attributes dirty for VBO re-upload
    geometry.attributes.position.needsUpdate = true;
    if (geometry.attributes.aOrbit)
      geometry.attributes.aOrbit.needsUpdate = true;
    if (geometry.attributes.color) geometry.attributes.color.needsUpdate = true;
    if (geometry.attributes.aDayColor)
      geometry.attributes.aDayColor.needsUpdate = true;
    if (geometry.attributes.aSize) geometry.attributes.aSize.needsUpdate = true;
    if (geometry.attributes.aBright)
      geometry.attributes.aBright.needsUpdate = true;

    starGeometry.attributes.position.needsUpdate = true;
    if (starGeometry.attributes.aOrbit)
      starGeometry.attributes.aOrbit.needsUpdate = true;
    if (starGeometry.attributes.color)
      starGeometry.attributes.color.needsUpdate = true;
    if (starGeometry.attributes.aDayColor)
      starGeometry.attributes.aDayColor.needsUpdate = true;
    if (starGeometry.attributes.aSize)
      starGeometry.attributes.aSize.needsUpdate = true;
    if (starGeometry.attributes.aBright)
      starGeometry.attributes.aBright.needsUpdate = true;

    trailGeometry.attributes.position.needsUpdate = true;
    if (trailGeometry.attributes.aCenter)
      trailGeometry.attributes.aCenter.needsUpdate = true;
    if (trailGeometry.attributes.aColor)
      trailGeometry.attributes.aColor.needsUpdate = true;

    distantGeometry.attributes.position.needsUpdate = true;
    if (distantGeometry.attributes.color)
      distantGeometry.attributes.color.needsUpdate = true;
    if (distantGeometry.attributes.aSize)
      distantGeometry.attributes.aSize.needsUpdate = true;


    // 4. Rebuild render targets for EffectComposer and BloomPyramidPass
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    composer.setSize(width, height);

    // 5. Clear pointer wake & layout
    cancelInput();
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
    // Live uniform access for look development (DEV builds only).
    (window as unknown as Record<string, unknown>).__galaxyTune = {
      scene: uniforms,
      composite: compositePass.material.uniforms,
      gas: nebulaGas.material.uniforms,
      paint: () => paint(0.016),
    };
  }
  return {
    setPage(path: string) {
      if (field) {
        uniforms.uNavigationFrom.value = field.freezeBase();
        uniforms.uNavigationProgress.value = 0;
      }
      cancelInput();
      finishDrag(true);
      rotation.reset();
      field?.resetHistory();
      // BUG-07: Preserve intro = 1.0 on page navigation when already settled or under reducedMotion.
      // This guarantees smooth ambient constellation cross-fading without re-scattering particles.
      intro = 1;
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
      // Reading pages use a lower resolution ceiling and no trails.
      if (bounds.width && bounds.height && !lost) applyQuality();
      requestPaint();
    },
    getIntro() {
      return intro;
    },
    setTheme(isLight: boolean) {
      light = isLight;
      applyQuality();
      bloomPass.strength = bloomStrength();
      compositePass.apply(themeSettings());
      geometry.setDrawRange(0, mobile && coarsePointer ? 2800 : count);
      uniforms.uLight.value = isLight ? 1 : 0;
      requestPaint();
    },
    setPaused(value: boolean) {
      paused = reducedMotion || value;
      if (paused && elapsed < 0.03) {
        intro = 1;
        uniforms.uIntro.value = 1;
      }
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
      contentObserver?.disconnect();
      cancelAnimationFrame(layoutFrame);
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
      ambientFromTexture.dispose();
      field?.dispose();
      bloomPass.dispose();
      compositePass.dispose();
      composer.dispose();
      nebulaGas.dispose();
      haze.geometry.dispose();
      hazeMaterial.dispose();
      geometry.dispose();
      material.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      trailGeometry.dispose();
      trailMaterial.dispose();
      distantGeometry.dispose();
      distantMaterial.dispose();
      if (typeof window !== "undefined") {
        delete (window as unknown as Record<string, unknown>).__galaxyIntro;
        delete (window as unknown as Record<string, unknown>).__galaxyTune;
      }
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      host.dataset.ready = "false";
    },
  };
}
