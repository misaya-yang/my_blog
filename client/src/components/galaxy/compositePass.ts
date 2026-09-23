import {
  Color,
  NoBlending,
  ShaderMaterial,
  Texture,
  Vector2,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three";
import { FullScreenQuad, Pass } from "three/addons/postprocessing/Pass.js";

/**
 * The single full-screen output pass. Particles accumulate additively into a
 * linear HDR target in both themes; only the transfer function differs:
 *
 * - Night: the buffer holds emitted light. It is tone mapped (ACES) over the
 *   page background, so dense regions roll off to white instead of clipping.
 * - Day: the buffer holds optical density (per-channel absorbance of each
 *   particle's ink). Paper transmits exp(-density), the Beer–Lambert law, so
 *   overlapping ink deepens and keeps its hue instead of greying toward white
 *   the way linear alpha blending does.
 *
 * Bloom, vignette, film grain and the sRGB encode all happen here, replacing
 * the bloom composite, OutputPass and the old full-screen atmosphere mesh.
 */
const COMPOSITE_FRAGMENT = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform sampler2D tBloom;
  uniform float uBloomStrength;
  uniform float uLight;
  uniform vec3 uBackground;
  uniform float uExposure;
  uniform float uInkDensity;
  uniform float uInkBleed;
  uniform float uVignette;
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  // Stephen Hill's ACES fit, as three.js ships it for ACESFilmicToneMapping.
  vec3 RRTAndODTFit(vec3 v) {
    vec3 a = v * (v + 0.0245786) - 0.000090537;
    vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
    return a / b;
  }
  vec3 acesFilmic(vec3 color) {
    const mat3 inputMatrix = mat3(
      vec3(0.59719, 0.07600, 0.02840),
      vec3(0.35458, 0.90834, 0.13383),
      vec3(0.04823, 0.01566, 0.83777));
    const mat3 outputMatrix = mat3(
      vec3(1.60475, -0.10208, -0.00327),
      vec3(-0.53108, 1.10813, -0.07276),
      vec3(-0.07367, -0.00605, 1.07602));
    color *= uExposure / 0.6;
    color = inputMatrix * color;
    color = RRTAndODTFit(color);
    color = outputMatrix * color;
    return clamp(color, 0.0, 1.0);
  }
  vec3 srgbEncode(vec3 linear) {
    return mix(
      linear * 12.92,
      pow(linear, vec3(0.41666)) * 1.055 - 0.055,
      step(vec3(0.0031308), linear));
  }

  void main() {
    vec3 accumulated = texture2D(tDiffuse, vUv).rgb;
    vec3 bloom = texture2D(tBloom, vUv).rgb * uBloomStrength;
    vec2 centered = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
    float vignette = 1.0 - uVignette * smoothstep(0.47, 1.15, length(centered));

    vec3 night = uBackground + acesFilmic((accumulated + bloom) * vignette);
    vec3 density = (accumulated + bloom * uInkBleed) * uInkDensity;
    vec3 day = uBackground * exp(-density);
    vec3 color = srgbEncode(clamp(mix(night, day, uLight), 0.0, 1.0));

    // ±1.2/255 of animated grain dithers the soft gradients against banding.
    float grain = fract(sin(dot(gl_FragCoord.xy + uTime * 61.7, vec2(12.9898, 78.233))) * 43758.5453);
    gl_FragColor = vec4(color + (grain - 0.5) * (2.4 / 255.0), 1.0);
  }
`;

const QUAD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export type CompositeSettings = {
  light: boolean;
  background: Color;
  bloomStrength: number;
  exposure?: number;
  inkDensity?: number;
  inkBleed?: number;
  vignette?: number;
};

export class CompositePass extends Pass {
  readonly material: ShaderMaterial;
  /** Supplied by the bloom pass each frame; null draws without bloom. */
  bloomTexture: Texture | null = null;
  bloomStrength = 0;
  private readonly quad: FullScreenQuad;
  private readonly blackTexture: Texture;

  constructor(settings: CompositeSettings) {
    super();
    this.needsSwap = false;
    this.blackTexture = new Texture();
    this.material = new ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tBloom: { value: this.blackTexture },
        uBloomStrength: { value: 0 },
        uLight: { value: 0 },
        uBackground: { value: new Color() },
        uExposure: { value: 1 },
        uInkDensity: { value: 1 },
        uInkBleed: { value: 0.35 },
        uVignette: { value: 0.5 },
        uTime: { value: 0 },
        uResolution: { value: new Vector2(1, 1) },
      },
      vertexShader: QUAD_VERTEX,
      fragmentShader: COMPOSITE_FRAGMENT,
      depthTest: false,
      depthWrite: false,
      blending: NoBlending,
      toneMapped: false,
    });
    this.quad = new FullScreenQuad(this.material);
    this.apply(settings);
  }

  apply(settings: CompositeSettings) {
    const uniforms = this.material.uniforms;
    uniforms.uLight.value = settings.light ? 1 : 0;
    (uniforms.uBackground.value as Color).copy(settings.background);
    this.bloomStrength = settings.bloomStrength;
    uniforms.uExposure.value = settings.exposure ?? 1;
    uniforms.uInkDensity.value = settings.inkDensity ?? 1;
    uniforms.uInkBleed.value = settings.inkBleed ?? 0.35;
    uniforms.uVignette.value = settings.light ? 0 : (settings.vignette ?? 0.5);
  }

  set time(value: number) {
    this.material.uniforms.uTime.value = value;
  }

  setSize(width: number, height: number) {
    this.material.uniforms.uResolution.value.set(
      Math.max(1, width),
      Math.max(1, height)
    );
  }

  render(
    renderer: WebGLRenderer,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget
  ) {
    const uniforms = this.material.uniforms;
    uniforms.tDiffuse.value = readBuffer.texture;
    uniforms.tBloom.value = this.bloomTexture ?? this.blackTexture;
    uniforms.uBloomStrength.value = this.bloomTexture ? this.bloomStrength : 0;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.quad.render(renderer);
  }

  dispose() {
    this.material.dispose();
    this.quad.dispose();
    this.blackTexture.dispose();
  }
}
