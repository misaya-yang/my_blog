import { describe, expect, it, vi } from "vitest";
import {
  Color,
  DataTexture,
  Matrix4,
  PerspectiveCamera,
  Vector2,
  Vector4,
  WebGLRenderTarget,
  type WebGLRenderer,
} from "three";

// Isolate render-target placement. Real GPU appearance and particle physics
// have separate checks; this renderer models Three r180's DPR behavior.
vi.mock("./particleMotion", async () => {
  const { DataTexture } = await import("three");
  return {
    PARTICLE_MOTION_WIDTH: 128,
    PARTICLE_MOTION_HEIGHT: 64,
    PARTICLE_MOTION_CAPACITY: 8192,
    ParticleMotion: class {
      mode = "gpu";
      fallbackReason = null;
      textures = { offset: new DataTexture(), velocity: new DataTexture() };
      presence = 0;
      steps = 0;
      resets = 0;
      step(_dt: number, options: { pointer?: { active: boolean } }) {
        this.steps++;
        this.presence = options.pointer?.active ? 1 : 0;
      }
      reset() {
        this.resets++;
      }
      dispose() {
        this.textures.offset.dispose();
        this.textures.velocity.dispose();
      }
    },
  };
});

import { ParticleField } from "./particleField";

type Draw = {
  texture: WebGLRenderTarget["texture"] | undefined;
  targetSize: number[];
  viewport: number[];
  scissor: number[];
  clipped: boolean;
};

class DPRRenderer {
  extensions = { has: () => true };
  autoClear = true;
  xr = { enabled: true };
  target: WebGLRenderTarget | null = null;
  logicalViewport = new Vector4(7, 9, 800, 600);
  logicalScissor = new Vector4(3, 5, 500, 400);
  logicalScissorTest = false;
  physicalViewport = new Vector4();
  physicalScissor = new Vector4();
  physicalScissorTest = false;
  color = new Color(0x123456);
  alpha = 0.7;
  draws: Draw[] = [];
  clears: Draw[] = [];

  constructor(readonly dpr: number) {
    this.setRenderTarget(null);
  }
  getRenderTarget() {
    return this.target;
  }
  getActiveCubeFace() {
    return 0;
  }
  getActiveMipmapLevel() {
    return 0;
  }
  getViewport(out: Vector4) {
    return out.copy(this.logicalViewport);
  }
  getScissor(out: Vector4) {
    return out.copy(this.logicalScissor);
  }
  getScissorTest() {
    return this.logicalScissorTest;
  }
  getClearColor(out: Color) {
    return out.copy(this.color);
  }
  getClearAlpha() {
    return this.alpha;
  }
  getContext() {
    return {
      FRAMEBUFFER: 1,
      FRAMEBUFFER_COMPLETE: 2,
      checkFramebufferStatus: () => 2,
    };
  }
  setClearColor(value: Color | number, alpha: number) {
    this.color.set(value);
    this.alpha = alpha;
  }
  setViewport(value: Vector4 | number, y?: number, w?: number, h?: number) {
    if (value instanceof Vector4) this.logicalViewport.copy(value);
    else this.logicalViewport.set(value, y!, w!, h!);
    this.physicalViewport
      .copy(this.logicalViewport)
      .multiplyScalar(this.dpr)
      .round();
  }
  setScissor(value: Vector4 | number, y?: number, w?: number, h?: number) {
    if (value instanceof Vector4) this.logicalScissor.copy(value);
    else this.logicalScissor.set(value, y!, w!, h!);
    this.physicalScissor
      .copy(this.logicalScissor)
      .multiplyScalar(this.dpr)
      .round();
  }
  setScissorTest(value: boolean) {
    this.logicalScissorTest = this.physicalScissorTest = value;
  }
  setRenderTarget(target: WebGLRenderTarget | null) {
    this.target = target;
    if (target) {
      this.physicalViewport.copy(target.viewport);
      this.physicalScissor.copy(target.scissor);
      this.physicalScissorTest = target.scissorTest;
    } else {
      this.physicalViewport
        .copy(this.logicalViewport)
        .multiplyScalar(this.dpr)
        .floor();
      this.physicalScissor
        .copy(this.logicalScissor)
        .multiplyScalar(this.dpr)
        .floor();
      this.physicalScissorTest = this.logicalScissorTest;
    }
  }
  snapshot(): Draw {
    return {
      texture: this.target?.texture,
      targetSize: this.target ? [this.target.width, this.target.height] : [],
      viewport: this.physicalViewport.toArray(),
      scissor: this.physicalScissor.toArray(),
      clipped: this.physicalScissorTest,
    };
  }
  render() {
    this.draws.push(this.snapshot());
  }
  clear() {
    this.clears.push(this.snapshot());
  }
}

describe.each([1.5, 2])("particle-field physical texels at DPR %s", dpr => {
  it.each([false, true])(
    "preserves all atlas rows and renderer state (bound RT: %s)",
    bound => {
      const renderer = new DPRRenderer(dpr);
      const previous = bound ? new WebGLRenderTarget(512, 256) : null;
      if (previous) {
        previous.viewport.set(11, 13, 300, 200);
        previous.scissor.set(15, 17, 100, 80);
        previous.scissorTest = true;
        renderer.setRenderTarget(previous);
      }
      const before = renderer.snapshot();
      const field = new ParticleField(renderer as unknown as WebGLRenderer, {
        positions: new Float32Array([0, 0, -10]),
        orbits: new Float32Array([0, 0, 0, 0]),
        brights: new Float32Array([1]),
        dustCount: 1,
        deformation: "",
        uniforms: {},
      });
      expect(field.needsCPUBase).toBe(false);
      const camera = new PerspectiveCamera(40, 4 / 3, 0.1, 100);
      for (let i = 0; i < 24; i++) {
        field.update({
          matrixWorld: new Matrix4(),
          camera,
          dt: 1 / 30,
          width: 800,
          height: 600,
          paused: false,
        });
        expect(renderer.snapshot()).toEqual(before);
      }
      const atlasDraws = renderer.draws.filter(
        draw => draw.texture === field.textures.history
      );
      expect(atlasDraws).toHaveLength(24);
      expect(new Set(atlasDraws.map(draw => draw.viewport[1])).size).toBe(12);
      for (const draw of atlasDraws) {
        expect(draw.targetSize).toEqual([128, 768]);
        expect(draw.viewport).toEqual([0, draw.viewport[1], 128, 64]);
        expect(draw.scissor).toEqual(draw.viewport);
        expect(draw.clipped).toBe(true);
        expect(draw.viewport[1] + draw.viewport[3]).toBeLessThanOrEqual(768);
      }
      for (const draw of renderer.draws.filter(
        draw => draw.texture !== field.textures.history
      ))
        expect(draw.viewport).toEqual([0, 0, 128, 64]);
      field.freezeBase();
      expect(renderer.draws.at(-1)?.viewport).toEqual([0, 0, 128, 64]);
      expect(renderer.snapshot()).toEqual(before);
      field.resetHistory();
      expect(renderer.clears.at(-1)?.viewport).toEqual([0, 0, 128, 768]);
      expect(renderer.clears.at(-1)?.clipped).toBe(false);
      expect(renderer.snapshot()).toEqual(before);
      expect(renderer.autoClear).toBe(true);
      expect(renderer.xr.enabled).toBe(true);
      expect(renderer.color.getHex()).toBe(0x123456);
      expect(renderer.alpha).toBe(0.7);
      field.dispose();
      previous?.dispose();
    }
  );
});

describe("particle field at rest", () => {
  const options = {
    positions: new Float32Array([0, 0, -10]),
    orbits: new Float32Array([0, 0, 0, 0]),
    brights: new Float32Array([1]),
    dustCount: 1,
    deformation: "",
    uniforms: {},
  };
  const pointer = (active: boolean) => ({
    from: new Vector2(),
    to: new Vector2(),
    velocity: new Vector2(),
    active,
  });

  it("skips the motion passes until the cursor arrives, and again once it has settled", () => {
    const renderer = new DPRRenderer(1);
    const field = new ParticleField(
      renderer as unknown as WebGLRenderer,
      options
    );
    const motion = (
      field as unknown as { motion: { steps: number; resets: number } }
    ).motion;
    const camera = new PerspectiveCamera(40, 4 / 3, 0.1, 100);
    const update = (active: boolean, dt = 1 / 60) =>
      field.update({
        matrixWorld: new Matrix4(),
        camera,
        dt,
        pointer: pointer(active),
        width: 800,
        height: 600,
        paused: false,
      });
    // Nobody has touched the field: the draws read the base pose directly.
    update(false);
    expect(motion.steps).toBe(0);
    expect(field.textures.current).toBe(field.textures.base);
    // The cursor parts the field: motion runs and the combined pose is drawn.
    update(true);
    expect(motion.steps).toBe(1);
    expect(field.textures.current).not.toBe(field.textures.base);
    // After the cursor leaves, the springs get time to close the parting...
    for (let i = 0; i < 60; i++) update(false);
    expect(field.textures.current).not.toBe(field.textures.base);
    const stepsBeforeRest = motion.steps;
    // ...then the field rests, snapping the sub-pixel remainder to zero.
    for (let i = 0; i < 30; i++) update(false);
    expect(field.textures.current).toBe(field.textures.base);
    expect(motion.resets).toBe(1);
    const stepsAtRest = motion.steps;
    for (let i = 0; i < 30; i++) update(false);
    expect(motion.steps).toBe(stepsAtRest);
    expect(stepsAtRest).toBeGreaterThan(stepsBeforeRest);
    field.dispose();
  });
});
