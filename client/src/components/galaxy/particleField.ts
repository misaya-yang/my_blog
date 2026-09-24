import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  FloatType,
  HalfFloatType,
  NearestFilter,
  NoBlending,
  Points,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector4,
  WebGLRenderTarget,
  type Camera,
  type IUniform,
  type Matrix4,
  type Texture,
  type WebGLRenderer,
} from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import {
  ParticleMotion,
  PARTICLE_MOTION_CAPACITY,
  PARTICLE_MOTION_HEIGHT,
  PARTICLE_MOTION_WIDTH,
  type ParticleMotionPointer,
} from "./particleMotion";

export const PARTICLE_HISTORY_SLOTS = 12;
const HISTORY_INTERVAL = 1 / 30;
const WIDTH = PARTICLE_MOTION_WIDTH;
const HEIGHT = PARTICLE_MOTION_HEIGHT;
const STRIDE = PARTICLE_MOTION_CAPACITY * 4;
/**
 * Seconds after the cursor has gone and the parting has closed before the
 * springs count as settled. By then every offset is far below a pixel, so the
 * motion and combine passes stop and the draws read the base pose directly.
 */
const SETTLE_SECONDS = 1.2;
const scratchViewport = new Vector4();
const scratchScissor = new Vector4();
const scratchClearColor = new Color();

export interface ParticleFieldOptions {
  forceCPU?: boolean;
  /** Dust first, followed by stars. All attributes retain stable identities. */
  positions: Float32Array;
  orbits: Float32Array;
  brights: Float32Array;
  dustCount: number;
  /** Declares aOrbit and ParticleSample/evaluateParticle, without pointer motion. */
  deformation: string;
  uniforms: Record<string, IUniform>;
}

export interface ParticleFieldUpdate {
  matrixWorld: Matrix4;
  camera: Camera;
  dt: number;
  pointer?: ParticleMotionPointer;
  width: number;
  height: number;
  paused: boolean;
  /** Required when needsCPUBase: view XYZ plus the final visible alpha. */
  basePositions?: Float32Array;
}

function dataTexture(height = HEIGHT) {
  const texture = new DataTexture(
    new Float32Array(WIDTH * height * 4),
    WIDTH,
    height,
    RGBAFormat,
    FloatType
  );
  texture.minFilter = texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function target(height = HEIGHT) {
  return new WebGLRenderTarget(WIDTH, height, {
    type: HalfFloatType,
    format: RGBAFormat,
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  });
}

const FULLSCREEN_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy,0.0,1.0); }
`;

/**
 * One base evaluation and motion update per particle, reused by every draw.
 * All output texels are view-space XYZ + visibility. History is a vertical
 * atlas: slot * 64 + particle row, newest slot = historyHead. No GPU readback.
 */
export class ParticleField {
  readonly needsCPUBase: boolean;
  readonly fallbackReason: string | null;
  historyHead = 0;
  historyCount = 0;
  private historyTime = 0;
  private disposed = false;
  /** Seconds since the cursor last touched the field. */
  private quiet = Infinity;
  /** Settled: offsets are zero and the base pose is the current pose. */
  private resting = true;
  private readonly count: number;
  private motion: ParticleMotion;
  private readonly cpuBase = dataTexture();
  private readonly cpuCurrent = dataTexture();
  private readonly cpuFrozen = dataTexture();
  private readonly cpuHistory = dataTexture(HEIGHT * PARTICLE_HISTORY_SLOTS);
  private readonly weights = dataTexture();
  private baseTarget: WebGLRenderTarget | null = null;
  private currentTarget: WebGLRenderTarget | null = null;
  private frozenTarget: WebGLRenderTarget | null = null;
  private historyTarget: WebGLRenderTarget | null = null;
  private basePoints: Points<BufferGeometry, ShaderMaterial> | null = null;
  private readonly baseScene = new Scene();
  private quad: FullScreenQuad | null = null;
  private combineMaterial: ShaderMaterial | null = null;
  private copyMaterial: ShaderMaterial | null = null;

  constructor(
    private readonly renderer: WebGLRenderer,
    options: ParticleFieldOptions
  ) {
    this.count = options.positions.length / 3;
    if (
      !Number.isInteger(this.count) ||
      this.count < 1 ||
      this.count > PARTICLE_MOTION_CAPACITY ||
      options.orbits.length !== this.count * 4 ||
      options.brights.length !== this.count ||
      options.dustCount < 0 ||
      options.dustCount > this.count
    )
      throw new RangeError(
        "Particle field attributes have inconsistent lengths"
      );
    const weights = this.weights.image.data as Float32Array;
    for (let i = 0; i < this.count; i++)
      weights[i * 4] = options.orbits[i * 4] >= 4 ? 0.25 : 1;
    // Test renderers deliberately omit GPU methods. A real unsupported device
    // also takes this path, using the caller's CPU evaluation of the same tracks.
    const capable =
      !options.forceCPU &&
      typeof renderer?.getRenderTarget === "function" &&
      typeof renderer?.setRenderTarget === "function" &&
      typeof renderer?.extensions?.has === "function" &&
      (renderer.extensions.has("EXT_color_buffer_float") ||
        renderer.extensions.has("EXT_color_buffer_half_float"));
    this.motion = new ParticleMotion(renderer, this.count, {
      forceCPU: !capable,
    });
    let reason = this.motion.fallbackReason;
    if (this.motion.mode === "gpu") {
      try {
        this.createGPU(options);
        this.withRendererState(() => {
          const gl = renderer.getContext();
          for (const renderTarget of [
            this.baseTarget!,
            this.currentTarget!,
            this.frozenTarget!,
            this.historyTarget!,
          ]) {
            this.bindTarget(renderTarget);
            if (
              gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
              gl.FRAMEBUFFER_COMPLETE
            )
              throw new Error("Particle field framebuffer incomplete");
            renderer.clear();
          }
        });
      } catch (error) {
        reason = error instanceof Error ? error.message : String(error);
        this.disposeGPU();
        this.motion.dispose();
        this.motion = new ParticleMotion(null, this.count, { forceCPU: true });
      }
    }
    this.needsCPUBase = this.motion.mode === "cpu";
    this.fallbackReason = reason;
  }

  /** Eased cursor presence of the parting field, 0..1. */
  get presence(): number {
    return this.motion.presence;
  }

  get textures(): { base: Texture; current: Texture; history: Texture } {
    return {
      base: this.baseTarget?.texture ?? this.cpuBase,
      current:
        (this.resting ? this.baseTarget : this.currentTarget)?.texture ??
        this.cpuCurrent,
      history: this.historyTarget?.texture ?? this.cpuHistory,
    };
  }

  private createGPU(options: ParticleFieldOptions) {
    this.baseTarget = target();
    this.currentTarget = target();
    this.frozenTarget = target();
    this.historyTarget = target(HEIGHT * PARTICLE_HISTORY_SLOTS);
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(options.positions, 3)
    );
    geometry.setAttribute("aOrbit", new BufferAttribute(options.orbits, 4));
    geometry.setAttribute("aBright", new BufferAttribute(options.brights, 1));
    const fieldUV = new Float32Array(this.count * 2);
    for (let i = 0; i < this.count; i++) {
      fieldUV[i * 2] = ((i % WIDTH) + 0.5) / WIDTH;
      fieldUV[i * 2 + 1] = (Math.floor(i / WIDTH) + 0.5) / HEIGHT;
    }
    geometry.setAttribute("aFieldUV", new BufferAttribute(fieldUV, 2));
    geometry.setAttribute(
      "aParticleIndex",
      new BufferAttribute(
        Float32Array.from({ length: this.count }, (_, i) => i),
        1
      )
    );
    const material = new ShaderMaterial({
      uniforms: {
        ...options.uniforms,
        uFieldDustCount: { value: options.dustCount },
      },
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      vertexShader: `attribute vec2 aFieldUV;
        ${options.deformation}
        attribute float aParticleIndex;
        attribute float aBright;
        uniform float uFieldDustCount;
        varying vec4 vParticleState;
        void main() {
          ParticleSample particle = evaluateParticle(position,0.0);
          float introVisibility = particle.intro;
          if (aParticleIndex < uFieldDustCount) {
            float brightBias = smoothstep(1.85,2.0,aBright);
            float seatGate = smoothstep(0.25,0.9,particle.travel);
            introVisibility *= mix(seatGate,1.0,brightBias);
          }
          float alpha=particle.flow*smoothstep(0.0,0.16,introVisibility);
          if(uNavigationProgress<1.0) alpha=mix(texture2D(uNavigationFrom,aFieldUV).w,alpha,uNavigationProgress);
          vParticleState = vec4(particle.view.xyz,alpha);
          vec2 texel = vec2(mod(aParticleIndex,${WIDTH}.0),floor(aParticleIndex/${WIDTH}.0));
          gl_Position = vec4((texel+0.5)/vec2(${WIDTH}.0,${HEIGHT}.0)*2.0-1.0,0.0,1.0);
          gl_PointSize = 1.0;
        }`,
      fragmentShader: `varying vec4 vParticleState;
        void main() { gl_FragColor = vParticleState; }`,
    });
    this.basePoints = new Points(geometry, material);
    this.basePoints.frustumCulled = false;
    this.basePoints.matrixAutoUpdate = false;
    this.baseScene.add(this.basePoints);
    this.combineMaterial = new ShaderMaterial({
      uniforms: {
        uBase: { value: this.baseTarget.texture },
        uOffset: { value: this.motion.textures.offset },
        uWeights: { value: this.weights },
        uProjectionScale: { value: 1 },
      },
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      vertexShader: FULLSCREEN_VERTEX,
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D uBase, uOffset, uWeights;
        uniform float uProjectionScale;
        void main() {
          vec4 state = texture2D(uBase,vUv);
          vec2 offset = texture2D(uOffset,vUv).xy;
          float weight = texture2D(uWeights,vUv).r;
          state.xy += offset * weight * (-state.z) / uProjectionScale;
          gl_FragColor = state;
        }`,
    });
    this.copyMaterial = new ShaderMaterial({
      uniforms: { uSource: { value: this.currentTarget.texture } },
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      vertexShader: FULLSCREEN_VERTEX,
      fragmentShader: `varying vec2 vUv; uniform sampler2D uSource;
        void main() { gl_FragColor = texture2D(uSource,vUv); }`,
    });
    this.quad = new FullScreenQuad(this.combineMaterial);
  }

  update(options: ParticleFieldUpdate) {
    if (this.disposed || options.width <= 0 || options.height <= 0) return;
    if (this.needsCPUBase) this.updateCPU(options);
    else this.withRendererState(() => this.updateGPU(options));
  }

  private updateGPU(options: ParticleFieldUpdate) {
    const renderer = this.renderer;
    this.basePoints!.matrix.copy(options.matrixWorld);
    this.basePoints!.matrixWorldNeedsUpdate = true;
    this.bindTarget(this.baseTarget!);
    renderer.clear();
    renderer.render(this.baseScene, options.camera);
    const active = !!options.pointer?.active || this.motion.presence > 0;
    if (active) this.quiet = 0;
    else if (!options.paused) this.quiet += Math.max(0, options.dt);
    const resting = !active && this.quiet > SETTLE_SECONDS;
    // Snap the last sub-pixel remainder to exactly zero as the field rests.
    if (resting && !this.resting) this.motion.reset();
    this.resting = resting;
    if (!resting) {
      if (!options.paused)
        this.motion.step(options.dt, {
          ...options,
          baseTexture: this.baseTarget!.texture,
          projectionMatrix: options.camera.projectionMatrix,
        });
      this.combineMaterial!.uniforms.uOffset.value =
        this.motion.textures.offset;
      this.combineMaterial!.uniforms.uProjectionScale.value =
        options.camera.projectionMatrix.elements[5];
      this.bindTarget(this.currentTarget!);
      this.quad!.material = this.combineMaterial!;
      this.quad!.render(renderer);
    }
    if (this.shouldRecord(options.dt, options.paused)) {
      this.bindTarget(
        this.historyTarget!,
        this.historyHead * HEIGHT,
        HEIGHT,
        true
      );
      this.copyMaterial!.uniforms.uSource.value = this.textures.current;
      this.quad!.material = this.copyMaterial!;
      this.quad!.render(renderer);
    }
  }

  private updateCPU(options: ParticleFieldUpdate) {
    const source = options.basePositions;
    if (!source || source.length < this.count * 4)
      throw new Error("CPU particle field requires count × 4 basePositions");
    const base = this.cpuBase.image.data as Float32Array;
    const current = this.cpuCurrent.image.data as Float32Array;
    const weights = this.weights.image.data as Float32Array;
    base.set(source.subarray(0, this.count * 4));
    this.cpuBase.needsUpdate = true;
    if (!options.paused)
      this.motion.step(options.dt, {
        ...options,
        basePositions: base,
        projectionMatrix: options.camera.projectionMatrix,
      });
    const offset = (this.motion.textures.offset as DataTexture).image
      .data as Float32Array;
    const projectionScale = options.camera.projectionMatrix.elements[5];
    for (let i = 0; i < this.count * 4; i += 4) {
      const scale = (-base[i + 2] * weights[i]) / projectionScale;
      current[i] = base[i] + offset[i] * scale;
      current[i + 1] = base[i + 1] + offset[i + 1] * scale;
      current[i + 2] = base[i + 2];
      current[i + 3] = base[i + 3];
    }
    this.cpuCurrent.needsUpdate = true;
    if (this.shouldRecord(options.dt, options.paused)) {
      (this.cpuHistory.image.data as Float32Array).set(
        current,
        this.historyHead * STRIDE
      );
      this.cpuHistory.addUpdateRange(this.historyHead * STRIDE, STRIDE);
      this.cpuHistory.needsUpdate = true;
    }
  }

  private shouldRecord(dt: number, paused: boolean) {
    if (this.historyCount === 0) {
      this.historyCount = 1;
      return true;
    }
    if (paused || !Number.isFinite(dt) || dt <= 0) return false;
    this.historyTime += Math.min(dt, 0.1);
    if (this.historyTime + 1e-6 < HISTORY_INTERVAL) return false;
    this.historyTime %= HISTORY_INTERVAL;
    this.historyHead = (this.historyHead + 1) % PARTICLE_HISTORY_SLOTS;
    this.historyCount = Math.min(this.historyCount + 1, PARTICLE_HISTORY_SLOTS);
    return true;
  }

  /** Freeze the already mixed base pose, so rapid page changes resume in place. */
  freezeBase(): Texture {
    if (this.disposed) return this.cpuFrozen;
    if (this.frozenTarget && this.copyMaterial && this.quad) {
      this.withRendererState(() => {
        this.bindTarget(this.frozenTarget!);
        this.copyMaterial!.uniforms.uSource.value = this.baseTarget!.texture;
        this.quad!.material = this.copyMaterial!;
        try {
          this.quad!.render(this.renderer);
        } finally {
          this.copyMaterial!.uniforms.uSource.value =
            this.currentTarget!.texture;
        }
      });
      return this.frozenTarget.texture;
    }
    (this.cpuFrozen.image.data as Float32Array).set(
      this.cpuBase.image.data as Float32Array
    );
    this.cpuFrozen.needsUpdate = true;
    return this.cpuFrozen;
  }

  resetHistory() {
    if (this.disposed) return;
    this.historyHead = this.historyCount = 0;
    this.historyTime = 0;
    (this.cpuHistory.image.data as Float32Array).fill(0);
    this.cpuHistory.clearUpdateRanges();
    this.cpuHistory.needsUpdate = true;
    if (this.historyTarget)
      this.withRendererState(() => {
        this.bindTarget(this.historyTarget!);
        this.renderer.clear();
      });
  }

  resetMotion() {
    if (this.disposed) return;
    this.quiet = Infinity;
    if (this.needsCPUBase) this.motion.reset();
    else this.withRendererState(() => this.motion.reset());
    this.resetHistory();
  }

  private bindTarget(
    renderTarget: WebGLRenderTarget,
    y = 0,
    height = renderTarget.height,
    clipped = false
  ) {
    // RT rectangles are physical texels. Renderer.setViewport/setScissor use
    // CSS units and multiply by DPR even while a render target is bound.
    renderTarget.viewport.set(0, y, renderTarget.width, height);
    renderTarget.scissor.copy(renderTarget.viewport);
    renderTarget.scissorTest = clipped;
    this.renderer.setRenderTarget(renderTarget);
  }

  private withRendererState(operation: () => void) {
    const renderer = this.renderer;
    const previousTarget = renderer.getRenderTarget();
    const cubeFace = renderer.getActiveCubeFace();
    const mipLevel = renderer.getActiveMipmapLevel();
    const viewport = renderer.getViewport(scratchViewport);
    const scissor = renderer.getScissor(scratchScissor);
    const scissorTest = renderer.getScissorTest();
    const clearColor = renderer.getClearColor(scratchClearColor);
    const clearAlpha = renderer.getClearAlpha();
    const autoClear = renderer.autoClear;
    const xr = renderer.xr.enabled;
    try {
      renderer.autoClear = false;
      renderer.xr.enabled = false;
      renderer.setScissorTest(false);
      renderer.setClearColor(0, 0);
      operation();
    } finally {
      renderer.setViewport(viewport);
      renderer.setScissor(scissor);
      renderer.setScissorTest(scissorTest);
      renderer.setClearColor(clearColor, clearAlpha);
      renderer.autoClear = autoClear;
      renderer.xr.enabled = xr;
      // Restore logical canvas state first. Binding last reapplies the saved
      // target's physical viewport/scissor without another DPR multiplication.
      renderer.setRenderTarget(previousTarget, cubeFace, mipLevel);
    }
  }

  private disposeGPU() {
    this.basePoints?.geometry.dispose();
    this.basePoints?.material.dispose();
    if (this.basePoints) this.baseScene.remove(this.basePoints);
    this.basePoints = null;
    this.combineMaterial?.dispose();
    this.copyMaterial?.dispose();
    this.quad?.dispose();
    this.combineMaterial = this.copyMaterial = null;
    this.quad = null;
    this.baseTarget?.dispose();
    this.currentTarget?.dispose();
    this.frozenTarget?.dispose();
    this.historyTarget?.dispose();
    this.baseTarget =
      this.currentTarget =
      this.frozenTarget =
      this.historyTarget =
        null;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.motion.dispose();
    this.disposeGPU();
    this.cpuBase.dispose();
    this.cpuCurrent.dispose();
    this.cpuFrozen.dispose();
    this.cpuHistory.dispose();
    this.weights.dispose();
  }
}
