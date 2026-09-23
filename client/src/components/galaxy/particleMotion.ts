import {
  DataTexture,
  FloatType,
  HalfFloatType,
  Matrix4,
  NearestFilter,
  RGBAFormat,
  Vector2,
  Vector4,
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
  /** CSS pixels relative to the rendered canvas, with +Y pointing down. */
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** CSS pixels per second. Passing zero must stop applying force. */
  velocity: { x: number; y: number };
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
  radiusPx?: number;
  strength?: number;
  maxDisplacementPx?: number;
}

const DEFAULT_RADIUS = 96;
const DEFAULT_STRENGTH = 0.5;
const DEFAULT_MAX_DISPLACEMENT = 72;
const MAX_POINTER_SPEED = 1800;
// Shared coefficients keep CPU fallback and GPU flow within the same 25% cone.
const LATERAL_SEED_GAIN = 0.15;
const LATERAL_OUTWARD_GAIN = 0.1;

// A cascade of two first-order systems has real, negative poles: velocity
// relaxes towards the pointer flow and offset relaxes towards its moving orbit.
// The exact solution avoids explicit-Euler jitter and oscillating springs.
const COMPUTE_SHARED = /* glsl */ `
  uniform sampler2D uBase;
  uniform mat4 uProjection;
  uniform vec2 uViewport;
  uniform vec4 uPointerSegment;
  uniform vec2 uPointerVelocity;
  uniform float uPointerActive;
  uniform float uRadius;
  uniform float uStrength;
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
    // This integer permutation is identical in GLSL and JS and does not depend
    // on theme, random resampling or the current time.
    float mass = 0.75 + mod(index * 17.0 + 13.0, 97.0) / 96.0 * 0.75;
    float dragRate = 6.8 / mass;
    float returnRate = 3.0 / mass;
    vec2 targetVelocity = vec2(0.0);
    vec4 projected = uProjection * vec4(base.xyz, 1.0);
    if (uPointerActive > 0.5 && base.a > 0.0 && projected.w > 0.0) {
      vec2 point = (projected.xy / projected.w * vec2(1.0, -1.0) + 1.0)
        * 0.5 * uViewport + offset * vec2(1.0, -1.0) * uViewport.y * 0.5;
      vec2 segment = uPointerSegment.zw - uPointerSegment.xy;
      float along = clamp(dot(point - uPointerSegment.xy, segment)
        / max(dot(segment, segment), 0.0001), 0.0, 1.0);
      vec2 delta = point - (uPointerSegment.xy + segment * along);
      float radiusSq = dot(delta, delta) / (uRadius * uRadius);
      float weight = exp(-2.0 * radiusSq) * (1.0 - smoothstep(1.0, 4.0, radiusSq));
      float speed = length(uPointerVelocity);
      vec2 normal = vec2(-uPointerVelocity.y, uPointerVelocity.x) / max(speed, 0.0001);
      float seed = mod(index * 37.0 + 19.0, 101.0) / 50.0 - 1.0;
      float outward = clamp(dot(delta, normal) / uRadius, -1.0, 1.0);
      float lateral = seed * ${LATERAL_SEED_GAIN} + outward * ${LATERAL_OUTWARD_GAIN};
      vec2 flow = uPointerVelocity + normal * speed * lateral;
      targetVelocity = flow * vec2(1.0, -1.0) * (2.0 / uViewport.y)
        * uStrength * weight * clamp(base.a, 0.0, 1.0) / mass;
    }
    float dragDecay = exp(-dragRate * uDt);
    float returnDecay = exp(-returnRate * uDt);
    nextVelocity = targetVelocity + (velocity - targetVelocity) * dragDecay;
    nextOffset = offset * returnDecay + targetVelocity * (1.0 - returnDecay) / returnRate
      + (velocity - targetVelocity) * (returnDecay - dragDecay) / (dragRate - returnRate);
    float limit = uMaxDisplacement * 2.0 / uViewport.y;
    float distance = length(nextOffset);
    if (distance > limit) {
      vec2 normal = nextOffset / distance;
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
    uPointerSegment: { value: new Vector4() },
    uPointerVelocity: { value: new Vector2() },
    uPointerActive: { value: 0 },
    uRadius: { value: DEFAULT_RADIUS },
    uStrength: { value: DEFAULT_STRENGTH },
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

  step(dt: number, options: ParticleMotionStep) {
    if (this.disposed || !Number.isFinite(dt) || dt <= 0) return;
    if (options.width <= 0 || options.height <= 0) return;
    const u = this.uniforms;
    u.uDt.value = Math.min(dt, 0.1);
    u.uBase.value = options.baseTexture ?? null;
    u.uProjection.value.copy(options.projectionMatrix);
    u.uViewport.value.set(options.width, options.height);
    u.uRadius.value = Math.max(1, options.radiusPx ?? DEFAULT_RADIUS);
    u.uStrength.value = Math.max(0, options.strength ?? DEFAULT_STRENGTH);
    u.uMaxDisplacement.value = Math.max(
      0,
      options.maxDisplacementPx ?? DEFAULT_MAX_DISPLACEMENT
    );
    const pointer = options.pointer;
    u.uPointerActive.value = pointer?.active ? 1 : 0;
    if (pointer?.active) {
      u.uPointerSegment.value.set(
        pointer.from.x,
        pointer.from.y,
        pointer.to.x,
        pointer.to.y
      );
      u.uPointerVelocity.value.set(pointer.velocity.x, pointer.velocity.y);
      u.uPointerVelocity.value.clampLength(0, MAX_POINTER_SPEED);
    } else u.uPointerVelocity.value.set(0, 0);
    if (this.gpu) {
      if (!options.baseTexture)
        throw new Error("GPU particle motion requires baseTexture");
      this.gpu.compute();
    } else this.stepCPU(options.basePositions);
  }

  private stepCPU(base?: Float32Array) {
    const u = this.uniforms;
    const active = u.uPointerActive.value > 0;
    if (active && (!base || base.length < this.count * 4))
      throw new Error("CPU particle motion requires count × 4 basePositions");
    const offset = this.cpuOffset.image.data as Float32Array;
    const velocity = this.cpuVelocity.image.data as Float32Array;
    const m = u.uProjection.value.elements;
    const width = u.uViewport.value.x;
    const height = u.uViewport.value.y;
    const dt = u.uDt.value;
    const fromX = u.uPointerSegment.value.x;
    const fromY = u.uPointerSegment.value.y;
    const segmentX = u.uPointerSegment.value.z - fromX;
    const segmentY = u.uPointerSegment.value.w - fromY;
    const segmentLengthSq = Math.max(
      segmentX * segmentX + segmentY * segmentY,
      0.0001
    );
    const radiusSq = u.uRadius.value * u.uRadius.value;
    const limit = (u.uMaxDisplacement.value * 2) / height;
    const pointerSpeed = u.uPointerVelocity.value.length();
    const normalX =
      -u.uPointerVelocity.value.y / Math.max(pointerSpeed, 0.0001);
    const normalY = u.uPointerVelocity.value.x / Math.max(pointerSpeed, 0.0001);
    for (let index = 0; index < this.count; index++) {
      const i = index * 4;
      const mass = 0.75 + (((index * 17 + 13) % 97) / 96) * 0.75;
      const dragRate = 6.8 / mass;
      const returnRate = 3 / mass;
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
          const pointX = ((projectedX + 1) * width + offset[i] * height) * 0.5;
          const pointY =
            ((1 - projectedY) * height - offset[i + 1] * height) * 0.5;
          const along = Math.max(
            0,
            Math.min(
              1,
              ((pointX - fromX) * segmentX + (pointY - fromY) * segmentY) /
                segmentLengthSq
            )
          );
          const dx = pointX - (fromX + segmentX * along);
          const dy = pointY - (fromY + segmentY * along);
          const distanceSq = (dx * dx + dy * dy) / radiusSq;
          const edge = Math.max(0, Math.min(1, (distanceSq - 1) / 3));
          const weight =
            Math.exp(-2 * distanceSq) * (1 - edge * edge * (3 - 2 * edge));
          const gain =
            ((2 / height) *
              u.uStrength.value *
              weight *
              Math.min(1, base[i + 3])) /
            mass;
          // The seed separates coincident particles; signed distance gently
          // pushes either flank away from the stroke, without random bursts.
          const seed = ((index * 37 + 19) % 101) / 50 - 1;
          const outward = Math.max(
            -1,
            Math.min(1, (dx * normalX + dy * normalY) / u.uRadius.value)
          );
          const lateral =
            seed * LATERAL_SEED_GAIN + outward * LATERAL_OUTWARD_GAIN;
          targetX =
            (u.uPointerVelocity.value.x + normalX * pointerSpeed * lateral) *
            gain;
          targetY =
            -(u.uPointerVelocity.value.y + normalY * pointerSpeed * lateral) *
            gain;
        }
      }
      const dragDecay = Math.exp(-dragRate * dt);
      const returnDecay = Math.exp(-returnRate * dt);
      const targetGain = (1 - returnDecay) / returnRate;
      const velocityGain = (returnDecay - dragDecay) / (dragRate - returnRate);
      let nextX =
        offset[i] * returnDecay +
        targetX * targetGain +
        (velocity[i] - targetX) * velocityGain;
      let nextY =
        offset[i + 1] * returnDecay +
        targetY * targetGain +
        (velocity[i + 1] - targetY) * velocityGain;
      let nextVelocityX = targetX + (velocity[i] - targetX) * dragDecay;
      let nextVelocityY = targetY + (velocity[i + 1] - targetY) * dragDecay;
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
    this.uniforms.uPointerActive.value = 0;
    this.uniforms.uPointerVelocity.value.set(0, 0);
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
