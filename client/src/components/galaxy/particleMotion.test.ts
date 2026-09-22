import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DataTexture,
  HalfFloatType,
  PerspectiveCamera,
  ShaderMaterial,
  Texture,
  type WebGLRenderer,
} from "three";

const gpuCalls = vi.hoisted(() => ({
  instances: [] as any[],
  initError: null as string | null,
}));

// This mock validates orchestration, ownership and ping-pong reset only.
// Shader compilation and raster results require the real-browser GPU audit.
vi.mock("three/addons/misc/GPUComputationRenderer.js", () => ({
  GPUComputationRenderer: class {
    variables: any[] = [];
    currentTextureIndex = 0;
    setDataType = vi.fn();
    renderTexture = vi.fn();
    compute = vi.fn(() => {
      this.currentTextureIndex = 1 - this.currentTextureIndex;
    });
    dispose = vi.fn();
    constructor(
      readonly width: number,
      readonly height: number
    ) {
      gpuCalls.instances.push(this);
    }
    addVariable(
      name: string,
      fragmentShader: string,
      initialValueTexture: Texture
    ) {
      const variable = {
        name,
        material: new ShaderMaterial({ fragmentShader }),
        initialValueTexture,
        renderTargets: [{ texture: new Texture() }, { texture: new Texture() }],
      };
      this.variables.push(variable);
      return variable;
    }
    setVariableDependencies(variable: any, dependencies: any[]) {
      variable.dependencies = dependencies;
    }
    init() {
      return gpuCalls.initError;
    }
    getCurrentRenderTarget(variable: any) {
      return variable.renderTargets[this.currentTextureIndex];
    }
  },
}));

import {
  PARTICLE_MOTION_CAPACITY,
  ParticleMotion,
  type ParticleMotionStep,
} from "./particleMotion";

const owned: ParticleMotion[] = [];
const cpu = (count = 1) => {
  const motion = new ParticleMotion(null, count, { forceCPU: true });
  owned.push(motion);
  return motion;
};
const data = (motion: ParticleMotion, key: "offset" | "velocity") =>
  (motion.textures[key] as DataTexture).image.data as Float32Array;
const base = (width = 1280, height = 800): ParticleMotionStep => {
  const camera = new PerspectiveCamera(50, width / height, 0.1, 100);
  return {
    projectionMatrix: camera.projectionMatrix,
    width,
    height,
    basePositions: new Float32Array([0, 0, -10, 1]),
    pointer: {
      from: { x: width / 2 - 40, y: height / 2 },
      to: { x: width / 2 + 40, y: height / 2 },
      velocity: { x: 400, y: 0 },
      active: true,
    },
  };
};
const positionPx = (motion: ParticleMotion, height = 800, index = 0) => [
  data(motion, "offset")[index * 4] * height * 0.5,
  -data(motion, "offset")[index * 4 + 1] * height * 0.5,
];

beforeEach(() => {
  gpuCalls.instances.length = 0;
  gpuCalls.initError = null;
});
afterEach(() => {
  owned.splice(0).forEach(motion => motion.dispose());
});

describe("persistent particle motion CPU behavior", () => {
  it("moves only nearby visible particles and preserves identity-specific inertia", () => {
    const motion = cpu(4);
    const options = base();
    options.basePositions = new Float32Array([
      0, 0, -10, 1, 0, 0, -10, 1, 20, 0, -10, 1, 0, 0, -10, 0,
    ]);
    for (let i = 0; i < 30; i++) motion.step(1 / 60, options);
    expect(positionPx(motion)[0]).toBeGreaterThan(10);
    expect(positionPx(motion, 800, 1)[0]).not.toBeCloseTo(
      positionPx(motion)[0],
      1
    );
    expect(positionPx(motion, 800, 2)).toEqual([0, -0]);
    expect(positionPx(motion, 800, 3)).toEqual([0, -0]);
  });

  it("separates coincident particles sideways by stable identity within the flow cone", () => {
    const motion = cpu(16);
    const options = base();
    options.basePositions = new Float32Array(16 * 4);
    for (let i = 0; i < 16; i++)
      options.basePositions.set([0, 0, -10, 1], i * 4);
    const sweep = () => {
      for (let i = 0; i < 12; i++) motion.step(1 / 60, options);
    };
    sweep();
    const firstOffset = data(motion, "offset").slice();
    const firstVelocity = data(motion, "velocity").slice();
    const ratios = Array.from({ length: 16 }, (_, index) => {
      const i = index * 4;
      expect(firstVelocity[i]).toBeGreaterThan(0);
      return firstVelocity[i + 1] / firstVelocity[i];
    });
    expect(Math.min(...ratios)).toBeLessThan(-0.1);
    expect(Math.max(...ratios)).toBeGreaterThan(0.1);
    expect(ratios.every(ratio => Math.abs(ratio) <= 0.25)).toBe(true);
    motion.reset();
    sweep();
    expect(data(motion, "offset")).toEqual(firstOffset);
    expect(data(motion, "velocity")).toEqual(firstVelocity);
  });

  it("pushes opposite flanks outward without generating force for a stationary cursor", () => {
    const options = base();
    const motion = cpu();
    options.basePositions![1] = 0.4;
    motion.step(1 / 60, options);
    const upper = data(motion, "velocity")[1] / data(motion, "velocity")[0];
    motion.reset();
    options.basePositions![1] = -0.4;
    motion.step(1 / 60, options);
    const lower = data(motion, "velocity")[1] / data(motion, "velocity")[0];
    expect(upper).toBeGreaterThan(lower);
    motion.reset();
    options.pointer!.velocity = { x: 0, y: 0 };
    for (let i = 0; i < 60; i++) motion.step(1 / 60, options);
    expect(data(motion, "offset").some(Boolean)).toBe(false);
    expect(data(motion, "velocity").some(Boolean)).toBe(false);
  });

  it("uses the same CSS radius and force for both directions and aspect ratios", () => {
    const results: number[] = [];
    for (const [width, height] of [
      [1280, 800],
      [390, 844],
      [768, 768],
    ]) {
      for (const vertical of [false, true]) {
        const motion = cpu();
        const options = base(width, height);
        if (vertical) {
          options.pointer = {
            from: { x: width / 2, y: height / 2 - 40 },
            to: { x: width / 2, y: height / 2 + 40 },
            velocity: { x: 0, y: 400 },
            active: true,
          };
        }
        for (let i = 0; i < 12; i++) motion.step(1 / 60, options);
        results.push(positionPx(motion, height)[vertical ? 1 : 0]);
      }
    }
    expect(Math.max(...results) - Math.min(...results)).toBeLessThan(0.00002);
  });

  it("coasts after a brief sweep, then returns without oscillating", () => {
    const motion = cpu();
    const options = base();
    motion.step(1 / 30, options);
    const released = positionPx(motion)[0];
    options.pointer!.active = false;
    const recovery: number[] = [];
    for (let i = 0; i < 240; i++) {
      motion.step(1 / 60, options);
      recovery.push(positionPx(motion)[0]);
    }
    expect(recovery[0]).toBeGreaterThan(released);
    const peak = recovery.indexOf(Math.max(...recovery));
    expect(peak).toBeGreaterThan(0);
    expect(recovery.every(value => value >= 0)).toBe(true);
    expect(
      recovery.slice(peak + 1).every((value, i) => value <= recovery[peak + i])
    ).toBe(true);
    expect(recovery[119]).toBeLessThan(0.1);
    expect(recovery[239]).toBeLessThan(0.001);
  });

  it("agrees at 30, 60 and 120 Hz during a one-second sweep and recovery", () => {
    const results = [30, 60, 120].map(hz => {
      const motion = cpu();
      const options = base();
      for (let i = 0; i < hz; i++) motion.step(1 / hz, options);
      const swept = positionPx(motion);
      options.pointer!.active = false;
      for (let i = 0; i < hz; i++) motion.step(1 / hz, options);
      return [...swept, ...positionPx(motion)];
    });
    for (const axis of [0, 1]) {
      expect(
        Math.max(...results.map(r => r[axis])) -
          Math.min(...results.map(r => r[axis]))
      ).toBeLessThan(0.3);
      expect(
        Math.max(...results.map(r => r[axis + 2])) -
          Math.min(...results.map(r => r[axis + 2]))
      ).toBeLessThan(0.05);
    }
  });

  it("holds continuous long sweeps without queue overwrite, then reverses smoothly", () => {
    const motion = cpu();
    const options = base();
    const positions: number[] = [];
    for (let i = 0; i < 360; i++) {
      motion.step(1 / 60, options);
      positions.push(positionPx(motion)[0]);
    }
    expect(positions[359]).toBeGreaterThan(30);
    expect(
      Math.max(
        ...positions.slice(60).map((p, i) => Math.abs(p - positions[59 + i]))
      )
    ).toBeLessThan(0.2);
    options.pointer!.velocity.x = -400;
    const previous = positions[359];
    motion.step(1 / 60, options);
    expect(Math.abs(positionPx(motion)[0] - previous)).toBeLessThan(2);
    for (let i = 0; i < 120; i++) motion.step(1 / 60, options);
    expect(positionPx(motion)[0]).toBeLessThan(-20);
  });

  it("limits displacement, ignores invalid time, and clears both states on reset", () => {
    const motion = cpu();
    const options = base();
    options.maxDisplacementPx = 18;
    options.pointer!.velocity.x = 100000;
    for (let i = 0; i < 120; i++) {
      motion.step(1 / 60, options);
      expect(Math.abs(positionPx(motion)[0])).toBeLessThanOrEqual(18.00001);
    }
    const before = data(motion, "offset").slice();
    motion.step(0, options);
    motion.step(Number.NaN, options);
    motion.step(-1, options);
    expect(data(motion, "offset")).toEqual(before);
    motion.reset();
    expect(data(motion, "offset").some(Boolean)).toBe(false);
    expect(data(motion, "velocity").some(Boolean)).toBe(false);
    motion.step(1 / 60, {
      ...options,
      pointer: undefined,
      basePositions: undefined,
    });
    expect(positionPx(motion)).toEqual([0, -0]);
  });

  it("requires CPU base positions only while applying a pointer force", () => {
    const motion = cpu();
    const options = base();
    delete options.basePositions;
    expect(() => motion.step(1 / 60, options)).toThrow("basePositions");
    options.pointer!.active = false;
    expect(() => motion.step(1 / 60, options)).not.toThrow();
  });

  it("rejects counts outside the fixed texture capacity", () => {
    for (const count of [0, -1, 1.5, PARTICLE_MOTION_CAPACITY + 1])
      expect(() => new ParticleMotion(null, count)).toThrow(RangeError);
  });
});

describe("GPU ping-pong orchestration (mocked renderer, no GPU execution)", () => {
  const renderer = (complete = true) =>
    ({
      extensions: { has: () => true },
      getRenderTarget: vi.fn(() => null),
      setRenderTarget: vi.fn(),
      getContext: () => ({
        FRAMEBUFFER: 1,
        FRAMEBUFFER_COMPLETE: 2,
        checkFramebufferStatus: () => (complete ? 2 : 0),
      }),
    }) as unknown as WebGLRenderer;
  const gpu = (rendererValue = renderer()) => {
    const motion = new ParticleMotion(rendererValue, 300);
    owned.push(motion);
    return motion;
  };

  it("uses two half-float variables sharing previous offset and velocity", () => {
    const motion = gpu();
    const compute = gpuCalls.instances[0];
    expect(motion.mode).toBe("gpu");
    expect([compute.width, compute.height]).toEqual([128, 64]);
    expect(compute.setDataType).toHaveBeenCalledWith(HalfFloatType);
    expect(compute.variables).toHaveLength(2);
    for (const variable of compute.variables)
      expect(variable.dependencies).toEqual(compute.variables);
    const before = motion.textures;
    const texture = new Texture();
    motion.step(1 / 60, { ...base(), baseTexture: texture });
    expect(compute.compute).toHaveBeenCalledOnce();
    expect(motion.textures.offset).not.toBe(before.offset);
    expect(motion.textures.velocity).not.toBe(before.velocity);
    expect(compute.variables[0].material.uniforms.uBase.value).toBe(texture);
    expect(compute.variables[1].material.uniforms.uDt.value).toBe(1 / 60);
  });

  it("reset clears all four targets so a swap cannot resurrect old motion", () => {
    const motion = gpu();
    const compute = gpuCalls.instances[0];
    motion.reset();
    expect(compute.renderTexture).toHaveBeenCalledTimes(4);
    expect(
      compute.renderTexture.mock.calls.map((call: any[]) => call[1])
    ).toEqual(
      compute.variables.flatMap((variable: any) => variable.renderTargets)
    );
    for (const [texture] of compute.renderTexture.mock.calls)
      expect(texture.image.data.some(Boolean)).toBe(false);
  });

  it("falls back when float targets or their framebuffer are unavailable", () => {
    const noExtension = renderer();
    noExtension.extensions.has = () => false;
    const unavailable = gpu(noExtension);
    expect(unavailable.mode).toBe("cpu");
    expect(unavailable.fallbackReason).toContain("unavailable");
    const incomplete = gpu(renderer(false));
    expect(incomplete.mode).toBe("cpu");
    expect(incomplete.fallbackReason).toContain("incomplete");
    expect(gpuCalls.instances[0].dispose).toHaveBeenCalledOnce();
  });

  it("disposes compute materials separately and never disposes the borrowed base texture", () => {
    const motion = gpu();
    const compute = gpuCalls.instances[0];
    const materialDisposals = compute.variables.map((v: any) =>
      vi.spyOn(v.material, "dispose")
    );
    const baseTexture = new Texture();
    const baseDisposal = vi.spyOn(baseTexture, "dispose");
    motion.step(1 / 60, { ...base(), baseTexture });
    motion.dispose();
    motion.dispose();
    expect(compute.dispose).toHaveBeenCalledOnce();
    materialDisposals.forEach((spy: any) => expect(spy).toHaveBeenCalledOnce());
    expect(baseDisposal).not.toHaveBeenCalled();
  });
});
