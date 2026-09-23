import {
  DataTexture,
  FloatType,
  HalfFloatType,
  Matrix4,
  NearestFilter,
  RGBAFormat,
  Vector2,
  type Texture,
  type WebGLRenderer,
} from "three";
import {
  GPUComputationRenderer,
  type Variable,
} from "three/addons/misc/GPUComputationRenderer.js";

export const PARTICLE_MOTION_WIDTH = 128;
export const PARTICLE_MOTION_HEIGHT = 64;
export const PARTICLE_MOTION_CAPACITY =
  PARTICLE_MOTION_WIDTH * PARTICLE_MOTION_HEIGHT;

export interface ParticleMotionPointer {
  /** Kept for callers that track the last stroke; the field uses `to`. */
  from: { x: number; y: number };
  /** Cursor in CSS pixels relative to the rendered canvas, +Y down. */
  to: { x: number; y: number };
  /** Cursor velocity in CSS pixels per second. */
  velocity: { x: number; y: number };
  /** True while the cursor hovers the scene; the field eases in and out. */
  active: boolean;
}

export interface ParticleMotionStep {
  /** 128 × 64 RGBA: unperturbed view-space XYZ and visibility in A. */
  baseTexture?: Texture;
  /** CPU fallback only: identical RGBA layout, at least count × 4 entries. */
  basePositions?: Float32Array;
  projectionMatrix: Matrix4;
  width: number;
  height: number;
  pointer?: ParticleMotionPointer;
  /** Radius of influence around the cursor, CSS pixels. */
  radiusPx?: number;
  /** How far the cursor parts particles at its centre, CSS pixels. */
  strength?: number;
  maxDisplacementPx?: number;
}

/** Parting field defaults, CSS pixels; haze and gas reuse them. */
export const PARTING_RADIUS_PX = 150;
export const PARTING_PX = 62;
const DEFAULT_RADIUS = PARTING_RADIUS_PX;
const DEFAULT_PARTING = PARTING_PX;
const DEFAULT_MAX_DISPLACEMENT = 90;
const MAX_POINTER_SPEED = 2400;
/** Share of cursor velocity carried as a wake, in seconds of travel. */
const WAKE_GAIN = 0.05;
const WAKE_LIMIT = 36;
const PRESENCE_RATE = 7;

// A parting field: every particle near the cursor has a target offset that
// pushes it radially out of a soft disc (monotonic, so neighbours never cross
// and the rim stays clean) plus a short wake along the cursor's travel. Each
// particle follows its target on a critically damped spring whose stiffness
// depends on a stable per-particle mass, so the rim ripples organically and
// everything settles back without overshoot. The spring is integrated
// exactly, so 30, 60 and 120 Hz agree.
const COMPUTE_SHARED = /* glsl */ `
  uniform sampler2D uBase;
  uniform mat4 uProjection;
  uniform vec2 uViewport;
  uniform vec2 uCursor;
  uniform vec2 uCursorVelocity;
  uniform float uPresence;
  uniform float uRadius;
  uniform float uParting;
  uniform float uMaxDisplacement;
  uniform float uDt;
  uniform float uCount;

  void advanceMotion(out vec2 nextOffset, out vec2 nextVelocity) {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    float index = floor(gl_FragCoord.y) * resolution.x + floor(gl_FragCoord.x);
    if (index >= uCount) {
      nextOffset = vec2(0.0);
      nextVelocity = vec2(0.0);
      return;
    }
    vec2 offset = texture2D(textureOffset, uv).xy;
    vec2 velocity = texture2D(textureVelocity, uv).xy;
    vec4 base = texture2D(uBase, uv);
    float mass = 0.75 + mod(index * 17.0 + 13.0, 97.0) / 96.0 * 0.75;
    float omega = 9.0 / sqrt(mass);
    vec2 target = vec2(0.0);
    vec4 projected = uProjection * vec4(base.xyz, 1.0);
    if (uPresence > 0.001 && base.a > 0.0 && projected.w > 0.0) {
      vec2 point = (projected.xy / projected.w * vec2(1.0, -1.0) + 1.0) * 0.5 * uViewport;
      vec2 delta = point - uCursor;
      float distance = length(delta);
      float angle = mod(index * 2.39996, 6.2831853);
      vec2 direction = distance > 0.5 ? delta / distance : vec2(cos(angle), sin(angle));
      float reach = clamp(distance / uRadius, 0.0, 1.0);
      float falloff = (1.0 - reach) * (1.0 - reach);
      float jitter = 0.82 + mod(index * 37.0 + 19.0, 101.0) / 100.0 * 0.36;
      vec2 wake = uCursorVelocity * ${WAKE_GAIN.toFixed(3)};
      float wakeLength = length(wake);
      if (wakeLength > ${WAKE_LIMIT.toFixed(1)}) wake *= ${WAKE_LIMIT.toFixed(1)} / wakeLength;
      vec2 px = direction * uParting * falloff * jitter + wake * falloff * falloff;
      target = px * vec2(1.0, -1.0) * (2.0 / uViewport.y)
        * uPresence * clamp(base.a, 0.0, 1.0);
    }
    vec2 error = offset - target;
    float decay = exp(-omega * uDt);
    vec2 slope = velocity + omega * error;
    nextOffset = target + (error + slope * uDt) * decay;
    nextVelocity = (velocity - omega * slope * uDt) * decay;
    float limit = uMaxDisplacement * 2.0 / uViewport.y;
    float length2 = length(nextOffset);
    if (length2 > limit) {
      vec2 normal = nextOffset / length2;
      nextOffset = normal * limit;
      nextVelocity -= normal * max(dot(nextVelocity, normal), 0.0);
    }
  }
`;

const OFFSET_SHADER = `${COMPUTE_SHARED}
  void main() {
    vec2 offset, velocity;
    advanceMotion(offset, velocity);
    gl_FragColor = vec4(offset, 0.0, 0.0);
  }
`;
const VELOCITY_SHADER = `${COMPUTE_SHARED}
  void main() {
    vec2 offset, velocity;
    advanceMotion(offset, velocity);
    gl_FragColor = vec4(velocity, 0.0, 0.0);
  }
`;

function stateTexture() {
  const texture = new DataTexture(
    new Float32Array(PARTICLE_MOTION_CAPACITY * 4),
    PARTICLE_MOTION_WIDTH,
    PARTICLE_MOTION_HEIGHT,
    RGBAFormat,
    FloatType
  );
  texture.minFilter = texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Persistent particle motion independent of the artwork's orientation.
 *
 * Output RG = height-normalized screen offset / velocity (+X right, +Y up).
 * Convert offset to view space with `offset * -viewZ / projection[1][1]`.
 * B/A are reserved and zero. GPU texels use index = y * 128 + x; refresh the
 * output uniforms after every step because the render targets ping-pong.
 *
 * The caller owns baseTexture and must reset after viewport changes, page
 * transitions or visibility suspension. No GPU readback is performed here.
 */
export class ParticleMotion {
  readonly mode: "gpu" | "cpu";
  readonly fallbackReason: string | null;
  private gpu: GPUComputationRenderer | null = null;
  private offsetVariable: Variable | null = null;
  private velocityVariable: Variable | null = null;
  private readonly zero = stateTexture();
  private readonly cpuOffset = stateTexture();
  private readonly cpuVelocity = stateTexture();
  private disposed = false;
  private readonly uniforms = {
    uBase: { value: null as Texture | null },
    uProjection: { value: new Matrix4() },
    uViewport: { value: new Vector2() },
    uCursor: { value: new Vector2() },
    uCursorVelocity: { value: new Vector2() },
    uPresence: { value: 0 },
    uRadius: { value: DEFAULT_RADIUS },
    uParting: { value: DEFAULT_PARTING },
    uMaxDisplacement: { value: DEFAULT_MAX_DISPLACEMENT },
    uDt: { value: 0 },
    uCount: { value: 0 },
  };

  constructor(
    renderer: WebGLRenderer | null,
    readonly count: number,
    options: { forceCPU?: boolean } = {}
  ) {
    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > PARTICLE_MOTION_CAPACITY
    )
      throw new RangeError(
        `Particle count must be 1–${PARTICLE_MOTION_CAPACITY}`
      );
    this.uniforms.uCount.value = count;
    let reason: string | null = null;
    const canRenderFloat =
      renderer?.extensions?.has("EXT_color_buffer_float") ||
      renderer?.extensions?.has("EXT_color_buffer_half_float");
    if (options.forceCPU) reason = "CPU motion requested";
    else if (!renderer || !canRenderFloat)
      reason = "Floating-point render targets unavailable";
    else {
      try {
        const gpu = new GPUComputationRenderer(
          PARTICLE_MOTION_WIDTH,
          PARTICLE_MOTION_HEIGHT,
          renderer
        );
        this.gpu = gpu;
        gpu.setDataType(HalfFloatType);
        // Each variable owns its initial texture; GPUComputationRenderer
        // disposes those, but not the compute materials in Three r180.
        this.offsetVariable = gpu.addVariable(
          "textureOffset",
          OFFSET_SHADER,
          stateTexture()
        );
        this.velocityVariable = gpu.addVariable(
          "textureVelocity",
          VELOCITY_SHADER,
          stateTexture()
        );
        for (const variable of [this.offsetVariable, this.velocityVariable]) {
          gpu.setVariableDependencies(variable, [
            this.offsetVariable,
            this.velocityVariable,
          ]);
          Object.assign(variable.material.uniforms, this.uniforms);
          variable.material.toneMapped = false;
        }
        const error = gpu.init();
        if (error) throw new Error(error);
        const currentTarget = renderer.getRenderTarget();
        try {
          const gl = renderer.getContext();
          for (const variable of [this.offsetVariable, this.velocityVariable]) {
            for (const target of variable.renderTargets) {
              renderer.setRenderTarget(target);
              if (
                gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
                gl.FRAMEBUFFER_COMPLETE
              )
                throw new Error("Particle motion framebuffer incomplete");
            }
          }
        } finally {
          renderer.setRenderTarget(currentTarget);
        }
      } catch (error) {
        reason = error instanceof Error ? error.message : String(error);
        this.disposeGPU();
      }
    }
    this.mode = this.gpu ? "gpu" : "cpu";
    this.fallbackReason = reason;
  }

  get textures(): { offset: Texture; velocity: Texture } {
    return {
      offset:
        this.gpu && this.offsetVariable
          ? this.gpu.getCurrentRenderTarget(this.offsetVariable).texture
          : this.cpuOffset,
      velocity:
        this.gpu && this.velocityVariable
          ? this.gpu.getCurrentRenderTarget(this.velocityVariable).texture
          : this.cpuVelocity,
    };
  }

  /** Eased cursor presence, 0..1: the field opens and closes smoothly. */
  get presence() {
    return this.uniforms.uPresence.value;
  }

  step(dt: number, options: ParticleMotionStep) {
    if (this.disposed || !Number.isFinite(dt) || dt <= 0) return;
    if (options.width <= 0 || options.height <= 0) return;
    const u = this.uniforms;
    u.uDt.value = Math.min(dt, 0.1);
    u.uBase.value = options.baseTexture ?? null;
    u.uProjection.value.copy(options.projectionMatrix);
    u.uViewport.value.set(options.width, options.height);
    u.uRadius.value = Math.max(1, options.radiusPx ?? DEFAULT_RADIUS);
    u.uParting.value = Math.max(0, options.strength ?? DEFAULT_PARTING);
    u.uMaxDisplacement.value = Math.max(
      0,
      options.maxDisplacementPx ?? DEFAULT_MAX_DISPLACEMENT
    );
    const pointer = options.pointer;
    const goal = pointer?.active ? 1 : 0;
    u.uPresence.value +=
      (goal - u.uPresence.value) * (1 - Math.exp(-u.uDt.value * PRESENCE_RATE));
    if (u.uPresence.value < 0.001 && !goal) u.uPresence.value = 0;
    if (pointer) {
      u.uCursor.value.set(pointer.to.x, pointer.to.y);
      u.uCursorVelocity.value
        .set(pointer.velocity.x, pointer.velocity.y)
        .clampLength(0, MAX_POINTER_SPEED);
    }
    if (!pointer?.active) u.uCursorVelocity.value.set(0, 0);
    if (this.gpu) {
      if (!options.baseTexture)
        throw new Error("GPU particle motion requires baseTexture");
      this.gpu.compute();
    } else this.stepCPU(options.basePositions);
  }

  private stepCPU(base?: Float32Array) {
    const u = this.uniforms;
    const active = u.uPresence.value > 0.001;
    if (active && (!base || base.length < this.count * 4))
      throw new Error("CPU particle motion requires count × 4 basePositions");
    const offset = this.cpuOffset.image.data as Float32Array;
    const velocity = this.cpuVelocity.image.data as Float32Array;
    const m = u.uProjection.value.elements;
    const width = u.uViewport.value.x;
    const height = u.uViewport.value.y;
    const dt = u.uDt.value;
    const cursorX = u.uCursor.value.x;
    const cursorY = u.uCursor.value.y;
    const radius = u.uRadius.value;
    const parting = u.uParting.value;
    const presence = u.uPresence.value;
    const limit = (u.uMaxDisplacement.value * 2) / height;
    let wakeX = u.uCursorVelocity.value.x * WAKE_GAIN;
    let wakeY = u.uCursorVelocity.value.y * WAKE_GAIN;
    const wakeLength = Math.hypot(wakeX, wakeY);
    if (wakeLength > WAKE_LIMIT) {
      wakeX *= WAKE_LIMIT / wakeLength;
      wakeY *= WAKE_LIMIT / wakeLength;
    }
    for (let index = 0; index < this.count; index++) {
      const i = index * 4;
      const mass = 0.75 + (((index * 17 + 13) % 97) / 96) * 0.75;
      const omega = 9 / Math.sqrt(mass);
      let targetX = 0;
      let targetY = 0;
      if (active && base && base[i + 3] > 0) {
        const x = base[i];
        const y = base[i + 1];
        const z = base[i + 2];
        const w = m[3] * x + m[7] * y + m[11] * z + m[15];
        if (w > 0) {
          const projectedX = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
          const projectedY = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
          const dx = (projectedX + 1) * 0.5 * width - cursorX;
          const dy = (1 - projectedY) * 0.5 * height - cursorY;
          const distance = Math.hypot(dx, dy);
          const angle = (index * 2.39996) % (Math.PI * 2);
          const dirX = distance > 0.5 ? dx / distance : Math.cos(angle);
          const dirY = distance > 0.5 ? dy / distance : Math.sin(angle);
          const reach = Math.min(1, distance / radius);
          const falloff = (1 - reach) * (1 - reach);
          const jitter = 0.82 + (((index * 37 + 19) % 101) / 100) * 0.36;
          const gain = (2 / height) * presence * Math.min(1, base[i + 3]);
          targetX =
            (dirX * parting * falloff * jitter + wakeX * falloff * falloff) *
            gain;
          targetY =
            -(dirY * parting * falloff * jitter + wakeY * falloff * falloff) *
            gain;
        }
      }
      const decay = Math.exp(-omega * dt);
      const errorX = offset[i] - targetX;
      const errorY = offset[i + 1] - targetY;
      const slopeX = velocity[i] + omega * errorX;
      const slopeY = velocity[i + 1] + omega * errorY;
      let nextX = targetX + (errorX + slopeX * dt) * decay;
      let nextY = targetY + (errorY + slopeY * dt) * decay;
      let nextVelocityX = (velocity[i] - omega * slopeX * dt) * decay;
      let nextVelocityY = (velocity[i + 1] - omega * slopeY * dt) * decay;
      const distance = Math.hypot(nextX, nextY);
      if (distance > limit) {
        const normalX = nextX / distance;
        const normalY = nextY / distance;
        nextX = normalX * limit;
        nextY = normalY * limit;
        const outward = Math.max(
          nextVelocityX * normalX + nextVelocityY * normalY,
          0
        );
        nextVelocityX -= normalX * outward;
        nextVelocityY -= normalY * outward;
      }
      offset[i] = nextX;
      offset[i + 1] = nextY;
      velocity[i] = nextVelocityX;
      velocity[i + 1] = nextVelocityY;
    }
    this.cpuOffset.needsUpdate = true;
    this.cpuVelocity.needsUpdate = true;
  }

  reset() {
    if (this.disposed) return;
    this.uniforms.uPresence.value = 0;
    this.uniforms.uCursorVelocity.value.set(0, 0);
    if (this.gpu && this.offsetVariable && this.velocityVariable) {
      // Clearing only the current target resurrects old displacement on the
      // next swap. Both variables' two targets must be cleared.
      for (const variable of [this.offsetVariable, this.velocityVariable])
        for (const target of variable.renderTargets)
          this.gpu.renderTexture(this.zero, target);
    }
    for (const texture of [this.cpuOffset, this.cpuVelocity]) {
      (texture.image.data as Float32Array).fill(0);
      texture.needsUpdate = true;
    }
  }

  private disposeGPU() {
    this.offsetVariable?.material.dispose();
    this.velocityVariable?.material.dispose();
    this.gpu?.dispose();
    this.gpu = null;
    this.offsetVariable = this.velocityVariable = null;
  }

  dispose() {
    if (this.disposed) return;
    this.disposeGPU();
    this.zero.dispose();
    this.cpuOffset.dispose();
    this.cpuVelocity.dispose();
    this.disposed = true;
  }
}
