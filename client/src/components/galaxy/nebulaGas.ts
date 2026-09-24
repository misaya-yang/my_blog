import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Camera,
  Color,
  Group,
  HalfFloatType,
  LinearFilter,
  Matrix4,
  NoBlending,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { PETAL_TRACKS, sampleTrack, type RoseTrack } from "./roseTracks";

/**
 * The volumetric half of the rose. The streams of dust and stars draw the
 * petal contours as lines; a nebula needs mass around those lines. Two layers
 * supply it, both baked once on the CPU and static relative to the rose:
 *
 * - Gas: a few hundred large Gaussian splats, rendered at a quarter of the
 *   canvas width and height (their size makes full-resolution fill expensive
 *   and adds nothing) and broken up by domain-warped noise at that size.
 * - Haze: thousands of sub-pixel motes with a wide Gaussian falloff around
 *   each petal ridge, so the contour reads as a density gradient.
 */

export type NebulaSample = {
  positions: Float32Array;
  colors: Float32Array;
  dayColors: Float32Array;
  sizes: Float32Array;
  alphas: Float32Array;
  count: number;
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal via Box–Muller. */
function gaussian(random: () => number) {
  const u = Math.max(random(), 1e-7);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * random());
}

// Night emission ramp from the recessed heart outward: a warm core, a pale
// blue-white middle, then cold teal and deep blue at the rim.
const NIGHT_RAMP = ["#ffcf9e", "#dfe9ff", "#7fb6ea", "#2f5f9c"].map(
  value => new Color(value)
);
// Day inks for the same ramp: a faint warm grey at the heart, then cool
// slate toward the rim. Low chroma, so the wash reads as tone, not tint.
const DAY_RAMP = ["#b9aa98", "#b0b9c7", "#98a6bb", "#7f8ea8"].map(
  value => new Color(value)
);

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

const scratch = new Color();
function ramp(colors: Color[], t: number, out: Float32Array, offset: number) {
  const x = Math.min(0.999, Math.max(0, t)) * (colors.length - 1);
  const i = Math.floor(x);
  scratch.copy(colors[i]).lerp(colors[i + 1], x - i);
  scratch.toArray(out, offset);
}

type BakeOptions = {
  count: number;
  seed: number;
  /** Normal-direction spread (sigma) in rose units. */
  spread: number;
  /** Depth spread (sigma) in rose units. */
  depth: number;
  size: (random: () => number) => number;
  alpha: (random: () => number, offRidge: number, radius: number) => number;
};

function bake(tracks: RoseTrack[], options: BakeOptions): NebulaSample {
  const random = mulberry32(options.seed);
  const petals = tracks.slice(0, PETAL_TRACKS);
  const total = petals.reduce((sum, track) => sum + track.length, 0);
  const positions = new Float32Array(options.count * 3);
  const colors = new Float32Array(options.count * 3);
  const dayColors = new Float32Array(options.count * 3);
  const sizes = new Float32Array(options.count);
  const alphas = new Float32Array(options.count);
  let maxRadius = 0;
  for (const track of petals) {
    for (let i = 0; i < 64; i++) {
      const point = sampleTrack(track, i / 64);
      maxRadius = Math.max(maxRadius, Math.hypot(point.x, point.y));
    }
  }
  for (let i = 0; i < options.count; i++) {
    // Arc-length share per petal so short inner contours are not crowded.
    let pick = random() * total;
    let track = petals[0];
    for (const candidate of petals) {
      track = candidate;
      if ((pick -= candidate.length) <= 0) break;
    }
    const phase = random();
    const point = sampleTrack(track, phase);
    const ahead = sampleTrack(track, (phase + 0.002) % 1);
    const tx = ahead.x - point.x;
    const ty = ahead.y - point.y;
    const tl = Math.hypot(tx, ty) || 1;
    // Heavy-tailed offset: most mass hugs the ridge, some drifts far out.
    const wide = random() < 0.18 ? 2.6 : 1;
    const offset = gaussian(random) * options.spread * wide;
    const x = point.x + (-ty / tl) * offset;
    const y = point.y + (tx / tl) * offset;
    const z = point.z + gaussian(random) * options.depth;
    positions.set([x, y, z], i * 3);
    const radius = Math.hypot(x, y) / Math.max(maxRadius, 0.001);
    const hue = radius + (random() - 0.5) * 0.18;
    ramp(NIGHT_RAMP, hue, colors, i * 3);
    ramp(DAY_RAMP, hue, dayColors, i * 3);
    sizes[i] = options.size(random);
    alphas[i] = options.alpha(
      random,
      Math.min(1, Math.abs(offset) / (options.spread * 2.6)),
      radius
    );
  }
  return {
    positions,
    colors,
    dayColors,
    sizes,
    alphas,
    count: options.count,
  };
}

export function bakeNebulaGas(tracks: RoseTrack[], count: number) {
  return bake(tracks, {
    count,
    seed: 7331,
    spread: 0.28,
    depth: 0.35,
    // World-space diameters: broad veils with a few denser knots.
    size: random => 0.9 + Math.pow(random(), 1.6) * 1.9,
    // The heart thins out: every layer's veil overlaps there, and the
    // signature has to stay readable against it.
    alpha: (random, off, radius) =>
      (0.35 + random() * 0.65) *
      (1 - off * 0.55) *
      (0.35 + 0.65 * smoothstep(0.18, 0.6, radius)),
  });
}

export function bakeNebulaHaze(tracks: RoseTrack[], count: number) {
  return bake(tracks, {
    count,
    seed: 90210,
    spread: 0.16,
    depth: 0.22,
    // CSS-pixel diameters: sub-pixel to barely resolved.
    size: random => 0.8 + Math.pow(random(), 3) * 1.4,
    alpha: (random, off) =>
      (0.25 + Math.pow(random(), 2) * 0.75) * (1 - off * 0.7),
  });
}

function geometryFrom(sample: NebulaSample) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(sample.positions, 3));
  geometry.setAttribute("color", new BufferAttribute(sample.colors, 3));
  geometry.setAttribute("aDayColor", new BufferAttribute(sample.dayColors, 3));
  geometry.setAttribute("aSize", new BufferAttribute(sample.sizes, 1));
  geometry.setAttribute("aAlpha", new BufferAttribute(sample.alphas, 1));
  return geometry;
}

/**
 * Micro-haze drawn in the main scene at full resolution. The fragment shader
 * body calls `lightOutput`, which the scene's shared optical prefix provides
 * along with the text-protection mask.
 */
export function createHazeMaterialSource() {
  return {
    vertexShader: /* glsl */ `
      uniform float uPixelRatio; uniform float uLight; uniform float uNebula;
      uniform float uTime;
      uniform vec2 uCanvasSize; uniform vec2 uPartCursor;
      uniform float uPartPresence; uniform float uParting; uniform float uPartRadius;
      attribute vec3 aDayColor; attribute float aSize; attribute float aAlpha;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vColor = mix(color, aDayColor, uLight);
        vec3 p = position;
        // A slow shimmer keeps the haze alive without a flow simulation.
        float seed = fract(sin(dot(position, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        p.xy += vec2(sin(uTime * 0.11 + seed * 6.283), cos(uTime * 0.09 + seed * 4.1)) * 0.02;
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * view;
        // The cursor parts the haze with the same field as the dust, so the
        // opening stays clean instead of filling with static motes.
        if (uPartPresence > 0.001 && gl_Position.w > 0.0) {
          vec2 screen = (gl_Position.xy / gl_Position.w * 0.5 + 0.5) * uCanvasSize;
          vec2 delta = screen - uPartCursor;
          float d = length(delta);
          float q = 1.0 - clamp(d / uPartRadius, 0.0, 1.0);
          if (d > 0.5) screen += delta / d * uParting * q * q * uPartPresence;
          gl_Position.xy = (screen / uCanvasSize * 2.0 - 1.0) * gl_Position.w;
        }
        float size = aSize * uPixelRatio * clamp(10.0 / -view.z, 0.8, 1.25);
        // Sub-pixel motes keep a two-pixel footprint and give up alpha by
        // area instead, so they shimmer smoothly rather than flicker.
        float footprint = max(size, 2.0);
        vAlpha = aAlpha * uNebula * (size * size) / (footprint * footprint)
          * (0.8 + 0.2 * sin(uTime * (0.5 + seed) + seed * 40.0));
        gl_PointSize = footprint;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uLight;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        if (r > 1.0) discard;
        float falloff = exp(-r * r * 3.0);
        gl_FragColor = lightOutput(vColor * mix(0.9, 1.0, uLight), vColor, falloff * vAlpha * mix(0.55, 0.42, uLight));
        #include <colorspace_fragment>
      }`,
  };
}

export function createHazePoints(
  sample: NebulaSample,
  material: ShaderMaterial
) {
  const points = new Points(geometryFrom(sample), material);
  points.frustumCulled = false;
  points.renderOrder = 0.5;
  return points;
}

/**
 * Domain-warped fbm gives the gas filaments and dark lanes instead of the
 * round blobs its Gaussian splats would otherwise read as. Evaluated once per
 * gas texel (a sixteenth of the screen), not per screen pixel: the structure
 * is far softer than a texel, and at full resolution its 48 hashes per pixel
 * were the most expensive thing in the frame.
 */
const RESOLVE_FRAGMENT = /* glsl */ `
  uniform sampler2D tSplats;
  uniform float uTime;
  uniform float uAspect;
  uniform float uLight;
  varying vec2 vUv;
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float valueNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y);
  }
  float fbm(vec2 p) {
    float sum = 0.0, amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      sum += valueNoise(p) * amplitude;
      p = p * 2.03 + vec2(17.1, 9.2);
      amplitude *= 0.5;
    }
    return sum;
  }
  float nebulaStructure(vec2 p) {
    vec2 warp = vec2(fbm(p + uTime * 0.006), fbm(p + vec2(5.2, 1.3) - uTime * 0.005));
    float n = fbm(p * 1.6 + warp * 1.8);
    return smoothstep(0.22, 0.78, n);
  }
  void main() {
    vec3 gas = texture2D(tSplats, vUv).rgb;
    vec2 centered = (vUv - 0.5) * vec2(uAspect, 1.0);
    float structure = nebulaStructure(centered * 2.4);
    // Filaments brighten, lanes nearly empty; energy stays about constant.
    // On paper the same contrast turns blotchy, so day keeps it gentler.
    float shaped = structure * structure * (1.6 - 0.6 * structure);
    gas *= mix(mix(0.08, 2.0, shaped), mix(0.45, 1.45, shaped), uLight);
    gl_FragColor = vec4(gas, 1.0);
  }
`;

const QUAD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** The gas renders at a quarter of the canvas width and height. */
export const GAS_RESOLUTION = 0.25;

/**
 * Gas splats rendered into their own low-resolution target, then resolved
 * with the noise structure at that same resolution. The composite samples the
 * result and adds it as light (night) or as a thin wash of ink (day).
 */
export class NebulaGasLayer {
  /** Resolved gas: splats shaped by the noise structure. */
  readonly target: WebGLRenderTarget;
  readonly material: ShaderMaterial;
  private readonly splats: WebGLRenderTarget;
  private readonly resolveMaterial: ShaderMaterial;
  private readonly quad: FullScreenQuad;
  private readonly scene = new Scene();
  private readonly anchor = new Group();
  private readonly points: Points;

  constructor(sample: NebulaSample) {
    const options = {
      type: HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
    } as const;
    this.splats = new WebGLRenderTarget(1, 1, options);
    this.target = new WebGLRenderTarget(1, 1, options);
    this.material = new ShaderMaterial({
      uniforms: {
        uLight: { value: 0 },
        uNebula: { value: 0 },
        uViewportHeight: { value: 1 },
        uTime: { value: 0 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexColors: true,
      vertexShader: /* glsl */ `
        uniform float uViewportHeight; uniform float uLight; uniform float uTime;
        attribute vec3 aDayColor; attribute float aSize; attribute float aAlpha;
        varying vec3 vColor; varying float vAlpha;
        void main() {
          vColor = mix(color, aDayColor, uLight);
          vec3 p = position;
          float seed = fract(sin(dot(position, vec3(7.13, 157.1, 113.7))) * 43758.5453);
          p.xy += vec2(sin(uTime * 0.05 + seed * 6.283), cos(uTime * 0.04 + seed * 3.7)) * 0.08;
          vec4 view = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * view;
          // World diameter projected into this target's pixels.
          gl_PointSize = aSize * projectionMatrix[1][1] * uViewportHeight * 0.5 / -view.z;
          vAlpha = aAlpha * (0.85 + 0.15 * sin(uTime * 0.2 + seed * 20.0));
        }`,
      fragmentShader: /* glsl */ `
        uniform float uLight; uniform float uNebula;
        varying vec3 vColor; varying float vAlpha;
        void main() {
          vec2 d = gl_PointCoord - 0.5;
          float r2 = dot(d, d) * 4.0;
          if (r2 > 1.0) discard;
          float veil = exp(-r2 * 3.2) * (1.0 - r2);
          vec3 absorbance = -log(clamp(vColor, vec3(0.02), vec3(0.98)));
          gl_FragColor = vec4(mix(vColor, absorbance, uLight) * veil * vAlpha * uNebula, 1.0);
        }`,
    });
    this.resolveMaterial = new ShaderMaterial({
      uniforms: {
        tSplats: { value: this.splats.texture },
        uTime: { value: 0 },
        uAspect: { value: 1 },
        uLight: { value: 0 },
      },
      vertexShader: QUAD_VERTEX,
      fragmentShader: RESOLVE_FRAGMENT,
      depthTest: false,
      depthWrite: false,
      blending: NoBlending,
    });
    this.quad = new FullScreenQuad(this.resolveMaterial);
    this.points = new Points(geometryFrom(sample), this.material);
    this.points.frustumCulled = false;
    this.anchor.matrixAutoUpdate = false;
    this.anchor.add(this.points);
    this.scene.add(this.anchor);
  }

  /** Physical canvas size; the layer renders at GAS_RESOLUTION of it. */
  setSize(width: number, height: number) {
    const w = Math.max(1, Math.floor(width * GAS_RESOLUTION));
    const h = Math.max(1, Math.floor(height * GAS_RESOLUTION));
    this.splats.setSize(w, h);
    this.target.setSize(w, h);
    this.material.uniforms.uViewportHeight.value = h;
    this.resolveMaterial.uniforms.uAspect.value = width / Math.max(1, height);
  }

  /**
   * Draws and resolves the gas. Returns false when there is none to draw, so
   * the composite can skip sampling it.
   */
  render(
    renderer: WebGLRenderer,
    camera: Camera,
    roseMatrix: Matrix4,
    settings: { light: boolean; opacity: number; time: number }
  ) {
    if (settings.opacity <= 0.001) return false;
    const uniforms = this.material.uniforms;
    uniforms.uLight.value = settings.light ? 1 : 0;
    uniforms.uNebula.value = settings.opacity;
    uniforms.uTime.value = settings.time;
    this.resolveMaterial.uniforms.uTime.value = settings.time;
    this.resolveMaterial.uniforms.uLight.value = settings.light ? 1 : 0;
    const previous = renderer.getRenderTarget();
    const clearAlpha = renderer.getClearAlpha();
    renderer.setRenderTarget(this.splats);
    renderer.setClearAlpha(0);
    renderer.clear(true, false, false);
    this.anchor.matrix.copy(roseMatrix);
    this.anchor.matrixWorldNeedsUpdate = true;
    renderer.render(this.scene, camera);
    renderer.setRenderTarget(this.target);
    this.quad.render(renderer);
    renderer.setClearAlpha(clearAlpha);
    renderer.setRenderTarget(previous);
    return true;
  }

  dispose() {
    this.splats.dispose();
    this.target.dispose();
    this.material.dispose();
    this.resolveMaterial.dispose();
    this.quad.dispose();
    this.points.geometry.dispose();
  }
}
