import { describe, expect, it, vi } from "vitest";
import {
  HalfFloatType,
  LinearFilter,
  ClampToEdgeWrapping,
  Vector2,
  WebGLRenderTarget,
  WebGLRenderer,
  ShaderMaterial,
} from "three";
import { BloomPyramidPass } from "./bloomPyramid";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";

describe("BloomPyramidPass", () => {
  const createMockRenderer = () => {
    let currentTarget: WebGLRenderTarget | null = null;
    const renderLog: Array<{
      target: WebGLRenderTarget | null;
      material: ShaderMaterial;
      inputBufferTexture: any;
      supportBufferTexture: any;
      sceneTexture: any;
      bloomTexture: any;
    }> = [];

    const renderer = {
      autoClear: true,
      getRenderTarget: vi.fn(() => currentTarget),
      setRenderTarget: vi.fn((target: WebGLRenderTarget | null) => {
        currentTarget = target;
      }),
      render: vi.fn((scene: any) => {
        const quadMesh = scene?.children?.[0] ?? scene;
        const mat = (quadMesh?.material ?? {}) as ShaderMaterial;
        renderLog.push({
          target: currentTarget,
          material: mat,
          inputBufferTexture: mat.uniforms?.inputBuffer?.value ?? null,
          supportBufferTexture: mat.uniforms?.supportBuffer?.value ?? null,
          sceneTexture: mat.uniforms?.scene?.value ?? null,
          bloomTexture: mat.uniforms?.bloom?.value ?? null,
        });
      }),
    } as unknown as WebGLRenderer;

    return { renderer, renderLog, getCurrentTarget: () => currentTarget };
  };

  describe("initialization and options", () => {
    it("initializes with default options", () => {
      const pass = new BloomPyramidPass();
      expect(pass.strength).toBe(0.75);
      expect(pass.radius).toBe(0.65);
      expect(pass.threshold).toBe(0.6);
      expect(pass.knee).toBe(0.35);
      expect(pass.downMips).toHaveLength(0);
      expect(pass.upMips).toHaveLength(0);
      expect(pass.mips).toHaveLength(0);
      pass.dispose();
    });

    it("accepts custom constructor options", () => {
      const pass = new BloomPyramidPass({
        levels: 4,
        resolutionScale: 0.25,
        threshold: 0.85,
        knee: 0.25,
        strength: 0.55,
        radius: 0.7,
      });

      expect(pass.strength).toBe(0.55);
      expect(pass.radius).toBe(0.7);
      expect(pass.threshold).toBe(0.85);
      expect(pass.knee).toBe(0.25);

      pass.setSize(1000, 800);
      expect(pass.downMips).toHaveLength(4);
      expect(pass.upMips).toHaveLength(3);
      pass.dispose();
    });

    it("updates uniforms reactively via property getters/setters", () => {
      const pass = new BloomPyramidPass();
      pass.radius = 0.82;
      pass.threshold = 0.9;
      pass.knee = 0.15;
      pass.strength = 0.45;

      expect(pass.radius).toBe(0.82);
      expect(pass.threshold).toBe(0.9);
      expect(pass.knee).toBe(0.15);
      expect(pass.strength).toBe(0.45);
      pass.dispose();
    });
  });

  describe("mip level allocation & resolution hierarchy (setSize)", () => {
    it("allocates separate downsample and upsample mip chains with proper dimensions", () => {
      const pass = new BloomPyramidPass({ levels: 6, resolutionScale: 0.5 });
      pass.setSize(1280, 800);

      // Downsample targets: 6 levels
      expect(pass.downMips).toHaveLength(6);
      // Upsample targets: 5 levels (levels - 1)
      expect(pass.upMips).toHaveLength(5);
      // Backwards compatibility getter
      expect(pass.mips).toBe(pass.downMips);

      // Level 0: 1280 * 0.5 = 640, 800 * 0.5 = 400
      expect(pass.downMips[0].width).toBe(640);
      expect(pass.downMips[0].height).toBe(400);
      expect(pass.upMips[0].width).toBe(640);
      expect(pass.upMips[0].height).toBe(400);

      // Level 1: 320 x 200
      expect(pass.downMips[1].width).toBe(320);
      expect(pass.downMips[1].height).toBe(200);
      expect(pass.upMips[1].width).toBe(320);
      expect(pass.upMips[1].height).toBe(200);

      // Level 2: 160 x 100
      expect(pass.downMips[2].width).toBe(160);
      expect(pass.downMips[2].height).toBe(100);
      expect(pass.upMips[2].width).toBe(160);
      expect(pass.upMips[2].height).toBe(100);

      // Level 3: 80 x 50
      expect(pass.downMips[3].width).toBe(80);
      expect(pass.downMips[3].height).toBe(50);
      expect(pass.upMips[3].width).toBe(80);
      expect(pass.upMips[3].height).toBe(50);

      // Level 4: 40 x 25
      expect(pass.downMips[4].width).toBe(40);
      expect(pass.downMips[4].height).toBe(25);
      expect(pass.upMips[4].width).toBe(40);
      expect(pass.upMips[4].height).toBe(25);

      // Level 5 (coarsest downsample mip): 20 x 12
      expect(pass.downMips[5].width).toBe(20);
      expect(pass.downMips[5].height).toBe(12);

      // Check render target configuration
      for (const target of [...pass.downMips, ...pass.upMips]) {
        expect(target.texture.type).toBe(HalfFloatType);
        expect(target.texture.minFilter).toBe(LinearFilter);
        expect(target.texture.magFilter).toBe(LinearFilter);
        expect(target.texture.wrapS).toBe(ClampToEdgeWrapping);
        expect(target.texture.wrapT).toBe(ClampToEdgeWrapping);
        expect(target.depthBuffer).toBe(false);
        expect(target.stencilBuffer).toBe(false);
      }

      pass.dispose();
    });

    it("clamps minimum mip dimensions to 1x1 on small viewports", () => {
      const pass = new BloomPyramidPass({ levels: 6, resolutionScale: 0.5 });
      pass.setSize(10, 8);

      expect(pass.downMips[0].width).toBe(5);
      expect(pass.downMips[0].height).toBe(4);
      // Deep levels should not shrink below 1
      for (const target of pass.downMips) {
        expect(target.width).toBeGreaterThanOrEqual(1);
        expect(target.height).toBeGreaterThanOrEqual(1);
      }
      for (const target of pass.upMips) {
        expect(target.width).toBeGreaterThanOrEqual(1);
        expect(target.height).toBeGreaterThanOrEqual(1);
      }
      pass.dispose();
    });

    it("retains existing render targets when physical dimensions are unchanged", () => {
      const pass = new BloomPyramidPass({ levels: 3 });
      pass.setSize(800, 600);
      const down = [...pass.downMips];
      const up = [...pass.upMips];
      const disposeSpies = [...down, ...up].map(target =>
        vi.spyOn(target, "dispose")
      );

      pass.setSize(800, 600);
      pass.setSize(800.2, 600.8);
      pass.downMips.forEach((target, index) =>
        expect(target).toBe(down[index])
      );
      pass.upMips.forEach((target, index) => expect(target).toBe(up[index]));
      for (const spy of disposeSpies) expect(spy).not.toHaveBeenCalled();
      pass.dispose();
    });

    it("uses composer physical pixels and applies its resolution scale exactly once", () => {
      const renderer = {
        getSize: (target: Vector2) => target.set(1000, 800),
        getPixelRatio: () => 1.5,
      } as unknown as WebGLRenderer;
      const composer = new EffectComposer(renderer);
      const pass = new BloomPyramidPass({ levels: 3, resolutionScale: 0.5 });
      composer.addPass(pass);
      // Composer owns CSS-to-physical conversion: 1000 * 1.5 * 0.5.
      expect(pass.downMips[0].width).toBe(750);
      expect(pass.downMips[0].height).toBe(600);
      expect(composer.readBuffer.texture.type).toBe(HalfFloatType);

      composer.setPixelRatio(1);
      expect(pass.downMips[0].width).toBe(500);
      expect(pass.downMips[0].height).toBe(400);
      const mip = pass.downMips[0];
      const disposeSpy = vi.spyOn(mip, "dispose");
      composer.setSize(1000, 800);
      expect(pass.downMips[0]).toBe(mip);
      expect(disposeSpy).not.toHaveBeenCalled();

      composer.setSize(390, 844);
      expect(pass.downMips[0].width).toBe(195);
      expect(pass.downMips[0].height).toBe(422);
      expect(disposeSpy).toHaveBeenCalledTimes(1);
      pass.dispose();
      composer.dispose();
    });

    it("disposes previous render targets when dimensions change", () => {
      const pass = new BloomPyramidPass({ levels: 3 });
      pass.setSize(800, 600);
      const oldDownMips = [...pass.downMips];
      const oldUpMips = [...pass.upMips];
      const spies = [...oldDownMips, ...oldUpMips].map(t =>
        vi.spyOn(t, "dispose")
      );

      pass.setSize(1024, 768);
      for (const spy of spies) {
        expect(spy).toHaveBeenCalledTimes(1);
      }
      pass.dispose();
    });
  });

  describe("rendering & feedback loop elimination (BUG-01)", () => {
    it.each([0, 0.55])(
      "restores renderer state and writes to screen when requested (strength %s)",
      strength => {
        const { renderer, renderLog, getCurrentTarget } = createMockRenderer();
        const pass = new BloomPyramidPass({ strength, levels: 2 });
        pass.setSize(800, 600);
        pass.renderToScreen = true;
        const readBuffer = new WebGLRenderTarget(800, 600);
        const writeBuffer = new WebGLRenderTarget(800, 600);
        const previousTarget = new WebGLRenderTarget(64, 64);
        renderer.setRenderTarget(previousTarget);
        renderer.autoClear = false;

        pass.render(renderer, writeBuffer, readBuffer);
        expect(renderLog.at(-1)?.target).toBeNull();
        expect(getCurrentTarget()).toBe(previousTarget);
        expect(renderer.autoClear).toBe(false);
        if (strength > 0) {
          expect(
            Object.keys(renderLog.at(-1)!.material.uniforms).sort()
          ).toEqual(["bloom", "scene", "strength"]);
        }

        pass.dispose();
        readBuffer.dispose();
        writeBuffer.dispose();
        previousTarget.dispose();
      }
    );

    it("guarantees NO WebGL framebuffer feedback loops during pyramid downsample & upsample", () => {
      const { renderer, renderLog } = createMockRenderer();
      const pass = new BloomPyramidPass({ levels: 6, resolutionScale: 0.5 });
      pass.setSize(1280, 720);

      const readBuffer = new WebGLRenderTarget(1280, 720);
      const writeBuffer = new WebGLRenderTarget(1280, 720);

      pass.render(renderer, writeBuffer, readBuffer);

      // Verify that every single render pass strictly avoids binding the active
      // render target's texture as any input sampler uniform.
      expect(renderLog.length).toBeGreaterThan(0);
      for (let step = 0; step < renderLog.length; step++) {
        const item = renderLog[step];
        const targetTexture = item.target?.texture;

        if (targetTexture) {
          // P0 Feedback Loop check: render target must never equal inputBuffer or supportBuffer
          expect(
            item.inputBufferTexture,
            `Step ${step}: target texture is bound as inputBuffer`
          ).not.toBe(targetTexture);

          expect(
            item.supportBufferTexture,
            `Step ${step}: target texture is bound as supportBuffer`
          ).not.toBe(targetTexture);

          expect(
            item.sceneTexture,
            `Step ${step}: target texture is bound as scene`
          ).not.toBe(targetTexture);

          expect(
            item.bloomTexture,
            `Step ${step}: target texture is bound as bloom`
          ).not.toBe(targetTexture);
        }
      }

      // Expected pass structure:
      // 1 luminance threshold pass (render to downMips[0])
      // 5 downsample passes (render to downMips[1..5])
      // 5 upsample passes (render to upMips[4..0])
      // 1 composite pass (render to writeBuffer)
      // Total passes = 1 + 5 + 5 + 1 = 12
      expect(renderLog).toHaveLength(12);

      // Check step 0: threshold pass
      expect(renderLog[0].target).toBe(pass.downMips[0]);
      expect(renderLog[0].inputBufferTexture).toBe(readBuffer.texture);

      // Check downsample steps 1..5
      for (let i = 1; i <= 5; i++) {
        expect(renderLog[i].target).toBe(pass.downMips[i]);
        expect(renderLog[i].inputBufferTexture).toBe(
          pass.downMips[i - 1].texture
        );
      }

      // Check upsample steps 6..10
      // Step 6: upsample from downMips[5] + downMips[4] -> upMips[4]
      expect(renderLog[6].target).toBe(pass.upMips[4]);
      expect(renderLog[6].inputBufferTexture).toBe(pass.downMips[5].texture);
      expect(renderLog[6].supportBufferTexture).toBe(pass.downMips[4].texture);

      // Step 7: upsample from upMips[4] + downMips[3] -> upMips[3]
      expect(renderLog[7].target).toBe(pass.upMips[3]);
      expect(renderLog[7].inputBufferTexture).toBe(pass.upMips[4].texture);
      expect(renderLog[7].supportBufferTexture).toBe(pass.downMips[3].texture);

      // Step 8: upsample from upMips[3] + downMips[2] -> upMips[2]
      expect(renderLog[8].target).toBe(pass.upMips[2]);
      expect(renderLog[8].inputBufferTexture).toBe(pass.upMips[3].texture);
      expect(renderLog[8].supportBufferTexture).toBe(pass.downMips[2].texture);

      // Step 9: upsample from upMips[2] + downMips[1] -> upMips[1]
      expect(renderLog[9].target).toBe(pass.upMips[1]);
      expect(renderLog[9].inputBufferTexture).toBe(pass.upMips[2].texture);
      expect(renderLog[9].supportBufferTexture).toBe(pass.downMips[1].texture);

      // Step 10: upsample from upMips[1] + downMips[0] -> upMips[0]
      expect(renderLog[10].target).toBe(pass.upMips[0]);
      expect(renderLog[10].inputBufferTexture).toBe(pass.upMips[1].texture);
      expect(renderLog[10].supportBufferTexture).toBe(pass.downMips[0].texture);

      // Step 11: composite pass
      expect(renderLog[11].target).toBe(writeBuffer);
      expect(renderLog[11].sceneTexture).toBe(readBuffer.texture);
      expect(renderLog[11].bloomTexture).toBe(pass.upMips[0].texture);

      pass.dispose();
      readBuffer.dispose();
      writeBuffer.dispose();
    });

    it("bypasses pyramid processing and blits scene when strength <= 0 (light mode)", () => {
      const { renderer, renderLog } = createMockRenderer();
      const pass = new BloomPyramidPass({ strength: 0 });
      pass.setSize(800, 600);

      const readBuffer = new WebGLRenderTarget(800, 600);
      const writeBuffer = new WebGLRenderTarget(800, 600);

      pass.render(renderer, writeBuffer, readBuffer);

      // In light mode (strength = 0), exactly 1 blit pass occurs directly to writeBuffer
      expect(renderLog).toHaveLength(1);
      expect(renderLog[0].target).toBe(writeBuffer);
      expect(renderLog[0].sceneTexture).toBe(readBuffer.texture);

      pass.dispose();
      readBuffer.dispose();
      writeBuffer.dispose();
    });

    it("handles uninitialized targets (before setSize) safely via copy pass", () => {
      const { renderer, renderLog } = createMockRenderer();
      const pass = new BloomPyramidPass();
      // Notice: setSize is NOT called, so mips.length === 0

      const readBuffer = new WebGLRenderTarget(800, 600);
      const writeBuffer = new WebGLRenderTarget(800, 600);

      expect(() =>
        pass.render(renderer, writeBuffer, readBuffer)
      ).not.toThrow();
      expect(renderLog).toHaveLength(1);
      expect(renderLog[0].target).toBe(writeBuffer);

      pass.dispose();
      readBuffer.dispose();
      writeBuffer.dispose();
    });

    it("correctly handles single level (levels = 1) without upsample loop error", () => {
      const { renderer, renderLog } = createMockRenderer();
      const pass = new BloomPyramidPass({ levels: 1 });
      pass.setSize(800, 600);

      expect(pass.downMips).toHaveLength(1);
      expect(pass.upMips).toHaveLength(0);

      const readBuffer = new WebGLRenderTarget(800, 600);
      const writeBuffer = new WebGLRenderTarget(800, 600);

      pass.render(renderer, writeBuffer, readBuffer);

      // Levels = 1: 1 threshold pass + 0 downsample + 0 upsample + 1 composite pass = 2 passes
      expect(renderLog).toHaveLength(2);
      expect(renderLog[0].target).toBe(pass.downMips[0]);
      expect(renderLog[1].target).toBe(writeBuffer);
      expect(renderLog[1].bloomTexture).toBe(pass.downMips[0].texture);

      pass.dispose();
      readBuffer.dispose();
      writeBuffer.dispose();
    });
  });

  describe("lifecycle & memory cleanup", () => {
    it("disposes all allocated render targets and materials upon dispose()", () => {
      const pass = new BloomPyramidPass({ levels: 5 });
      pass.setSize(800, 600);

      const downSpies = pass.downMips.map(t => vi.spyOn(t, "dispose"));
      const upSpies = pass.upMips.map(t => vi.spyOn(t, "dispose"));

      pass.dispose();

      for (const spy of downSpies) {
        expect(spy).toHaveBeenCalledTimes(1);
      }
      for (const spy of upSpies) {
        expect(spy).toHaveBeenCalledTimes(1);
      }
      expect(pass.downMips).toHaveLength(0);
      expect(pass.upMips).toHaveLength(0);
      expect(pass.mips).toHaveLength(0);
    });
  });
});
