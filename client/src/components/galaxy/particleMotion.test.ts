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
  // base() projects (0, 0, -10) to the canvas centre (640, 400).
  const at = (options: ParticleMotionStep, x: number, y: number) => {
    options.pointer!.to = { x, y };
    options.pointer!.from = { x, y };
    options.pointer!.velocity = { x: 0, y: 0 };
    return options;
  };
  const settle = (
    motion: ParticleMotion,
    options: ParticleMotionStep,
    seconds: number,
    hz = 60
  ) => {
    for (let i = 0; i < Math.round(seconds * hz); i++)
      motion.step(1 / hz, options);
  };

  it("parts nearby visible particles radially away from a resting cursor", () => {
    const motion = cpu(4);
    const options = at(base(), 610, 400);
    options.basePositions = new Float32Array([
      0, 0, -10, 1, 0, 0, -10, 1, 20, 0, -10, 1, 0, 0, -10, 0,
    ]);
    settle(motion, options, 1.5);
    // 30 px right of the cursor: pushed further right, not up or down.
    expect(positionPx(motion)[0]).toBeGreaterThan(20);
    expect(Math.abs(positionPx(motion)[1])).toBeLessThan(0.01);
    // Stable identities: a coincident particle parts by a different amount.
    expect(positionPx(motion, 800, 1)[0]).not.toBeCloseTo(
      positionPx(motion)[0],
      1
    );
    // Far outside the radius, and invisible particles, stay put.
    expect(positionPx(motion, 800, 2)).toEqual([0, -0]);
    expect(positionPx(motion, 800, 3)).toEqual([0, -0]);
    const mirrored = cpu();
    settle(mirrored, at(base(), 670, 400), 1.5);
    expect(positionPx(mirrored)[0]).toBeLessThan(-20);
  });

  it("pushes harder near the cursor and fades to nothing at the radius", () => {
    const offsets = [20, 60, 110, 149].map(distance => {
      const motion = cpu();
      settle(motion, at(base(), 640 - distance, 400), 1.5);
      return positionPx(motion)[0];
    });
    for (let i = 1; i < offsets.length; i++)
      expect(offsets[i]).toBeLessThan(offsets[i - 1]);
    expect(offsets[3]).toBeLessThan(0.05);
    // The parting map stays monotonic: nearer particles never overtake.
    const radii = [20, 60, 110].map((distance, i) => distance + offsets[i]);
    expect(radii[1]).toBeGreaterThan(radii[0]);
    expect(radii[2]).toBeGreaterThan(radii[1]);
  });

  it("opens without overshoot and flows back when the cursor leaves", () => {
    const motion = cpu();
    const options = at(base(), 610, 400);
    const opening: number[] = [];
    for (let i = 0; i < 120; i++) {
      motion.step(1 / 60, options);
      opening.push(positionPx(motion)[0]);
    }
    const final = opening[opening.length - 1];
    expect(Math.max(...opening)).toBeLessThanOrEqual(final + 1e-6);
    expect(opening.every((v, i) => i === 0 || v >= opening[i - 1] - 1e-9)).toBe(
      true
    );
    options.pointer!.active = false;
    const closing: number[] = [];
    for (let i = 0; i < 150; i++) {
      motion.step(1 / 60, options);
      closing.push(positionPx(motion)[0]);
    }
    expect(closing.every(value => value >= -1e-6)).toBe(true);
    expect(closing[closing.length - 1]).toBeLessThan(0.05);
    expect(motion.presence).toBeLessThan(0.01);
  });

  it("agrees at 30, 60 and 120 Hz while opening and closing", () => {
    const results = [30, 60, 120].map(hz => {
      const motion = cpu();
      const options = at(base(), 610, 390);
      settle(motion, options, 0.5, hz);
      const opened = positionPx(motion);
      options.pointer!.active = false;
      settle(motion, options, 0.5, hz);
      return [...opened, ...positionPx(motion)];
    });
    for (let axis = 0; axis < 4; axis++)
      expect(
        Math.max(...results.map(r => r[axis])) -
          Math.min(...results.map(r => r[axis]))
      ).toBeLessThan(0.6);
  });

  it("adds a bounded wake along the cursor's travel", () => {
    const still = cpu();
    settle(still, at(base(), 640, 430), 1);
    const moving = cpu();
    const options = at(base(), 640, 430);
    options.pointer!.velocity = { x: 600, y: 0 };
    settle(moving, options, 1);
    // Directly above the cursor: the wake carries it along +x.
    expect(Math.abs(positionPx(still)[0])).toBeLessThan(0.01);
    expect(positionPx(moving)[0]).toBeGreaterThan(3);
    const fast = cpu();
    options.pointer!.velocity = { x: 1e6, y: 0 };
    settle(fast, options, 1);
    expect(positionPx(fast)[0]).toBeLessThan(40);
  });

  it("spreads coincident particles under the cursor in stable directions", () => {
    const run = () => {
      const motion = cpu(16);
      const options = at(base(), 640, 400);
      options.basePositions = new Float32Array(16 * 4);
      for (let i = 0; i < 16; i++)
        options.basePositions.set([0, 0, -10, 1], i * 4);
      settle(motion, options, 1);
      return Array.from({ length: 16 }, (_, i) => positionPx(motion, 800, i));
    };
    const first = run();
    const angles = first.map(([x, y]) => Math.atan2(y, x));
    expect(new Set(angles.map(a => a.toFixed(2))).size).toBe(16);
    first.forEach(([x, y]) => expect(Math.hypot(x, y)).toBeGreaterThan(40));
    expect(run()).toEqual(first);
  });

  it("limits displacement, ignores invalid time, and clears both states on reset", () => {
    const motion = cpu();
    const options = at(base(), 630, 400);
    options.maxDisplacementPx = 18;
    options.strength = 400;
    for (let i = 0; i < 120; i++) {
      motion.step(1 / 60, options);
      expect(Math.hypot(...positionPx(motion))).toBeLessThanOrEqual(18.00001);
    }
    const before = data(motion, "offset").slice();
    motion.step(0, options);
    motion.step(Number.NaN, options);
    motion.step(-1, options);
    expect(data(motion, "offset")).toEqual(before);
    motion.reset();
    expect(data(motion, "offset").some(Boolean)).toBe(false);
    expect(data(motion, "velocity").some(Boolean)).toBe(false);
    expect(motion.presence).toBe(0);
    motion.step(1 / 60, {
      ...options,
      pointer: undefined,
      basePositions: undefined,
    });
    expect(positionPx(motion)).toEqual([0, -0]);
  });

  it("requires CPU base positions only while the field is open", () => {
    const options = base();
    delete options.basePositions;
    expect(() => cpu().step(1 / 60, options)).toThrow("basePositions");
    options.pointer!.active = false;
    expect(() => cpu().step(1 / 60, options)).not.toThrow();
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
