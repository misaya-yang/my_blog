import {
  HalfFloatType,
  LinearFilter,
  ClampToEdgeWrapping,
  NoBlending,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three";
import { FullScreenQuad, Pass } from "three/addons/postprocessing/Pass.js";

const QUAD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// First tap of the pyramid: box downsample of the scene with a soft-knee
// luminance gate, mirroring the smoothstep threshold of pmndrs' LuminanceMaterial.
const LUMINANCE_DOWNSAMPLE = /* glsl */ `
  uniform sampler2D inputBuffer;
  uniform vec2 texelSize;
  uniform float threshold;
  uniform float knee;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(inputBuffer, vUv + vec2(-texelSize.x, -texelSize.y));
    color += texture2D(inputBuffer, vUv + vec2(texelSize.x, -texelSize.y));
    color += texture2D(inputBuffer, vUv + vec2(-texelSize.x, texelSize.y));
    color += texture2D(inputBuffer, vUv + vec2(texelSize.x, texelSize.y));
    color *= 0.25;
    float luminance = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
    gl_FragColor = vec4(color.rgb * smoothstep(threshold, threshold + knee, luminance), 1.0);
  }
`;

const DOWNSAMPLE = /* glsl */ `
  uniform sampler2D inputBuffer;
  uniform vec2 texelSize;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(inputBuffer, vUv + vec2(-texelSize.x, -texelSize.y));
    color += texture2D(inputBuffer, vUv + vec2(texelSize.x, -texelSize.y));
    color += texture2D(inputBuffer, vUv + vec2(-texelSize.x, texelSize.y));
    color += texture2D(inputBuffer, vUv + vec2(texelSize.x, texelSize.y));
    gl_FragColor = color * 0.25;
  }
`;

// Tent-filtered upsample blended over the level below (Jimenez/CoD scheme as
// pmndrs renders it: mix(base, tent, radius)). Blending rather than adding
// bounds the energy so six levels cannot compound into a fireball.
const UPSAMPLE = /* glsl */ `
  uniform sampler2D inputBuffer;
  uniform sampler2D supportBuffer;
  uniform vec2 texelSize;
  uniform float radius;
  varying vec2 vUv;
  void main() {
    vec4 sum = texture2D(inputBuffer, vUv + vec2(-texelSize.x, -texelSize.y)) * 1.0;
    sum += texture2D(inputBuffer, vUv + vec2(0.0, -texelSize.y)) * 2.0;
    sum += texture2D(inputBuffer, vUv + vec2(texelSize.x, -texelSize.y)) * 1.0;
    sum += texture2D(inputBuffer, vUv + vec2(-texelSize.x, 0.0)) * 2.0;
    sum += texture2D(inputBuffer, vUv) * 4.0;
    sum += texture2D(inputBuffer, vUv + vec2(texelSize.x, 0.0)) * 2.0;
    sum += texture2D(inputBuffer, vUv + vec2(-texelSize.x, texelSize.y)) * 1.0;
    sum += texture2D(inputBuffer, vUv + vec2(0.0, texelSize.y)) * 2.0;
    sum += texture2D(inputBuffer, vUv + vec2(texelSize.x, texelSize.y)) * 1.0;
    vec4 tent = sum * (1.0 / 16.0);
    vec4 base = texture2D(supportBuffer, vUv);
    gl_FragColor = mix(base, tent, radius);
  }
`;

const COMPOSITE = /* glsl */ `
  uniform sampler2D scene;
  uniform sampler2D bloom;
  uniform vec2 texelSize;
  uniform float strength;
  uniform vec2 uFlareCenter;
  uniform float uFlare;
  uniform float uAspect;
  varying vec2 vUv;
  void main() {
    vec4 base = texture2D(scene, vUv);
    // One restrained optical accent anchored on the luminous heart: a soft halo
    // and a single horizontal anamorphic streak, ignited by the intro timeline.
    vec2 delta = vUv - uFlareCenter;
    delta.x *= uAspect;
    float distanceToHeart = length(delta);
    float halo = exp(-distanceToHeart * distanceToHeart * 420.0) * 0.15
      + exp(-distanceToHeart * 10.0) * 0.04;
    float streak = exp(-abs(delta.y) * 240.0)
      * exp(-abs(delta.x) * 6.5)
      * (1.0 - smoothstep(0.34, 0.5, abs(delta.x))) * 0.085;
    vec3 optics = vec3(0.96, 0.96, 1.0) * (halo + streak) * uFlare;
    gl_FragColor = vec4(
      base.rgb + texture2D(bloom, vUv).rgb * strength + optics,
      base.a
    );
  }
`;

const COPY = /* glsl */ `
  uniform sampler2D scene;
  varying vec2 vUv;
  void main() {
    gl_FragColor = texture2D(scene, vUv);
  }
`;

export type BloomPyramidOptions = {
  levels?: number;
  resolutionScale?: number;
  threshold?: number;
  knee?: number;
  strength?: number;
  radius?: number;
};

/**
 * Scene pass that extracts a mip-pyramid bloom from the rendered frame and
 * composites it back additively, replacing the previous arrangement in which
 * the whole scene was rendered a second time into a star-only bloom layer.
 */
export class BloomPyramidPass extends Pass {
  strength: number;
  flare = 0;
  flareCenter = new Vector2(0.5, 0.5);

  private levels: number;
  private resolutionScale: number;
  private downsampleTargets: WebGLRenderTarget[] = [];
  private upsampleTargets: WebGLRenderTarget[] = [];
  private fullscreenQuad: FullScreenQuad;
  private thresholdMaterial: ShaderMaterial;
  private downsampleMaterial: ShaderMaterial;
  private upsampleMaterial: ShaderMaterial;
  private compositeMaterial: ShaderMaterial;
  private copyMaterial: ShaderMaterial;

  constructor(options: BloomPyramidOptions = {}) {
    super();
    this.levels = Math.max(1, options.levels ?? 6);
    this.resolutionScale = options.resolutionScale ?? 0.5;
    this.strength = options.strength ?? 0.75;
    this.thresholdMaterial = new ShaderMaterial({
      uniforms: {
        inputBuffer: { value: null },
        texelSize: { value: new Vector2() },
        threshold: { value: options.threshold ?? 0.6 },
        knee: { value: options.knee ?? 0.35 },
      },
      vertexShader: QUAD_VERTEX,
      fragmentShader: LUMINANCE_DOWNSAMPLE,
      depthTest: false,
      depthWrite: false,
      blending: NoBlending,
    });
    this.downsampleMaterial = new ShaderMaterial({
      uniforms: {
        inputBuffer: { value: null },
        texelSize: { value: new Vector2() },
      },
      vertexShader: QUAD_VERTEX,
      fragmentShader: DOWNSAMPLE,
      depthTest: false,
      depthWrite: false,
      blending: NoBlending,
    });
    this.upsampleMaterial = new ShaderMaterial({
      uniforms: {
        inputBuffer: { value: null },
        supportBuffer: { value: null },
        texelSize: { value: new Vector2() },
        radius: { value: options.radius ?? 0.65 },
      },
      vertexShader: QUAD_VERTEX,
      fragmentShader: UPSAMPLE,
      depthTest: false,
      depthWrite: false,
      blending: NoBlending,
    });
    this.compositeMaterial = new ShaderMaterial({
      uniforms: {
        scene: { value: null },
        bloom: { value: null },
        texelSize: { value: new Vector2() },
        strength: { value: this.strength },
        uFlareCenter: { value: this.flareCenter },
        uFlare: { value: 0 },
        uAspect: { value: 1 },
      },
      vertexShader: QUAD_VERTEX,
      fragmentShader: COMPOSITE,
      depthTest: false,
      depthWrite: false,
      blending: NoBlending,
    });
    this.copyMaterial = new ShaderMaterial({
      uniforms: { scene: { value: null } },
      vertexShader: QUAD_VERTEX,
      fragmentShader: COPY,
      depthTest: false,
      depthWrite: false,
      blending: NoBlending,
    });
    this.fullscreenQuad = new FullScreenQuad(this.copyMaterial);
  }

  get radius(): number {
    return this.upsampleMaterial.uniforms.radius.value;
  }
  set radius(value: number) {
    this.upsampleMaterial.uniforms.radius.value = value;
  }

  get threshold(): number {
    return this.thresholdMaterial.uniforms.threshold.value;
  }
  set threshold(value: number) {
    this.thresholdMaterial.uniforms.threshold.value = value;
  }

  get knee(): number {
    return this.thresholdMaterial.uniforms.knee.value;
  }
  set knee(value: number) {
    this.thresholdMaterial.uniforms.knee.value = value;
  }

  get downMips(): WebGLRenderTarget[] {
    return this.downsampleTargets;
  }

  get upMips(): WebGLRenderTarget[] {
    return this.upsampleTargets;
  }

  /**
   * Backwards-compatible getter for downsample targets.
   */
  get mips(): WebGLRenderTarget[] {
    return this.downsampleTargets;
  }

  setSize(width: number, height: number) {
    for (const mip of this.downsampleTargets) mip.dispose();
    for (const mip of this.upsampleTargets) mip.dispose();
    this.downsampleTargets = [];
    this.upsampleTargets = [];

    let mipWidth = Math.max(1, Math.floor(width * this.resolutionScale));
    let mipHeight = Math.max(1, Math.floor(height * this.resolutionScale));

    for (let i = 0; i < this.levels; i++) {
      const downMip = new WebGLRenderTarget(mipWidth, mipHeight, {
        type: HalfFloatType,
        depthBuffer: false,
        stencilBuffer: false,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        wrapS: ClampToEdgeWrapping,
        wrapT: ClampToEdgeWrapping,
      });
      this.downsampleTargets.push(downMip);

      if (i < this.levels - 1) {
        const upMip = new WebGLRenderTarget(mipWidth, mipHeight, {
          type: HalfFloatType,
          depthBuffer: false,
          stencilBuffer: false,
          minFilter: LinearFilter,
          magFilter: LinearFilter,
          wrapS: ClampToEdgeWrapping,
          wrapT: ClampToEdgeWrapping,
        });
        this.upsampleTargets.push(upMip);
      }

      mipWidth = Math.max(1, Math.floor(mipWidth * 0.5));
      mipHeight = Math.max(1, Math.floor(mipHeight * 0.5));
    }
  }

  render(
    renderer: WebGLRenderer,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget
  ) {
    const previousTarget = renderer.getRenderTarget();
    const previousAutoClear = renderer.autoClear;
    renderer.autoClear = false;

    if (this.strength <= 0 || this.downsampleTargets.length === 0) {
      // Light theme keeps no bloom; a single blit forwards the scene untouched.
      this.copyMaterial.uniforms.scene.value = readBuffer.texture;
      this.fullscreenQuad.material = this.copyMaterial;
      renderer.setRenderTarget(writeBuffer);
      this.fullscreenQuad.render(renderer);
      renderer.autoClear = previousAutoClear;
      renderer.setRenderTarget(previousTarget);
      return;
    }

    // Gate and shrink the HDR scene into the first downsample mip.
    this.thresholdMaterial.uniforms.inputBuffer.value = readBuffer.texture;
    this.thresholdMaterial.uniforms.texelSize.value.set(
      1 / readBuffer.width,
      1 / readBuffer.height
    );
    this.fullscreenQuad.material = this.thresholdMaterial;
    renderer.setRenderTarget(this.downsampleTargets[0]);
    this.fullscreenQuad.render(renderer);

    // Walk down the pyramid with plain box taps.
    for (let i = 1; i < this.downsampleTargets.length; i++) {
      this.downsampleMaterial.uniforms.inputBuffer.value =
        this.downsampleTargets[i - 1].texture;
      this.downsampleMaterial.uniforms.texelSize.value.set(
        1 / this.downsampleTargets[i - 1].width,
        1 / this.downsampleTargets[i - 1].height
      );
      this.fullscreenQuad.material = this.downsampleMaterial;
      renderer.setRenderTarget(this.downsampleTargets[i]);
      this.fullscreenQuad.render(renderer);
    }

    // Walk back up, tent-filtering into separate upsample mips.
    // Decoupling downsample targets from upsample targets eliminates the WebGL
    // framebuffer feedback loop hazard where a buffer was simultaneously bound
    // as the active render target and sampled as supportBuffer.
    for (let i = this.downsampleTargets.length - 2; i >= 0; i--) {
      const inputTarget =
        i === this.downsampleTargets.length - 2
          ? this.downsampleTargets[i + 1]
          : this.upsampleTargets[i + 1];
      const supportTarget = this.downsampleTargets[i];
      const outputTarget = this.upsampleTargets[i];

      this.upsampleMaterial.uniforms.inputBuffer.value = inputTarget.texture;
      this.upsampleMaterial.uniforms.supportBuffer.value = supportTarget.texture;
      this.upsampleMaterial.uniforms.texelSize.value.set(
        1 / inputTarget.width,
        1 / inputTarget.height
      );
      this.fullscreenQuad.material = this.upsampleMaterial;
      renderer.setRenderTarget(outputTarget);
      this.fullscreenQuad.render(renderer);
    }

    const bloomTexture =
      this.upsampleTargets.length > 0
        ? this.upsampleTargets[0].texture
        : this.downsampleTargets[0].texture;

    this.compositeMaterial.uniforms.scene.value = readBuffer.texture;
    this.compositeMaterial.uniforms.bloom.value = bloomTexture;
    this.compositeMaterial.uniforms.strength.value = this.strength;
    this.compositeMaterial.uniforms.uFlare.value = this.flare;
    this.compositeMaterial.uniforms.uFlareCenter.value = this.flareCenter;
    this.compositeMaterial.uniforms.uAspect.value =
      readBuffer.width / readBuffer.height;
    this.fullscreenQuad.material = this.compositeMaterial;
    renderer.setRenderTarget(writeBuffer);
    this.fullscreenQuad.render(renderer);

    renderer.autoClear = previousAutoClear;
    renderer.setRenderTarget(previousTarget);
  }

  dispose() {
    for (const mip of this.downsampleTargets) mip.dispose();
    for (const mip of this.upsampleTargets) mip.dispose();
    this.downsampleTargets = [];
    this.upsampleTargets = [];
    this.thresholdMaterial.dispose();
    this.downsampleMaterial.dispose();
    this.upsampleMaterial.dispose();
    this.compositeMaterial.dispose();
    this.copyMaterial.dispose();
    this.fullscreenQuad.dispose();
  }
}
