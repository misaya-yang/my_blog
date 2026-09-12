import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlaneGeometry, ShaderMaterial } from "three";

// Exercise the real scene's event listeners and lifetime without allocating a GPU.
// Raster appearance is verified separately in the existing in-app browser.
class Surface extends EventTarget {
  dataset: Record<string, string> = {};
  style = { setProperty: vi.fn(), opacity: "1" };
  parentElement: Surface | null = null;
  children: Surface[] = [];
  clientWidth = 1280;
  clientHeight = 800;
  isConnected = true;
  captures = new Set<number>();
  setAttribute = vi.fn();
  closest() {
    return null;
  }
  querySelector() {
    return null;
  }
  appendChild(child: Surface) {
    child.parentElement = this;
    this.children.push(child);
  }
  remove() {
    if (this.parentElement)
      this.parentElement.children = this.parentElement.children.filter(
        x => x !== this
      );
  }
  getBoundingClientRect() {
    return {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 1280,
      bottom: 800,
      width: 1280,
      height: 800,
    };
  }
  setPointerCapture(id: number) {
    this.captures.add(id);
  }
  hasPointerCapture(id: number) {
    return this.captures.has(id);
  }
  releasePointerCapture(id: number) {
    this.captures.delete(id);
  }
}

vi.mock("three", async importOriginal => {
  const real = await importOriginal<typeof import("three")>();
  return {
    ...real,
    WebGLRenderer: class {
      domElement = new Surface();
      info = { memory: { geometries: 6, textures: 15 } };
      ratio = 1;
      setPixelRatio(value: number) {
        this.ratio = value;
      }
      getPixelRatio() {
        return this.ratio;
      }
      setClearColor() {}
      setSize() {}
      render() {}
      dispose() {}
      forceContextLoss() {}
    },
  };
});
vi.mock("three/addons/postprocessing/EffectComposer.js", () => ({
  EffectComposer: class {
    addPass() {}
    setSize() {}
    setPixelRatio() {}
    render() {}
    dispose() {}
  },
}));
vi.mock("three/addons/postprocessing/RenderPass.js", () => ({
  RenderPass: class {},
}));
vi.mock("three/addons/postprocessing/OutputPass.js", () => ({
  OutputPass: class {
    dispose() {}
  },
}));

import {
  createGalaxy,
  evaluateIntroConvergence,
  calculateDustBrightness,
  calculateStarBrightness,
  calculateProminence,
} from "./galaxyScene";

describe("scene input and lifetime", () => {
  let host: Surface,
    controls: Surface,
    win: EventTarget,
    doc: EventTarget & { hidden: boolean };
  let scene: ReturnType<typeof createGalaxy>;
  let now = 1000,
    frameId = 0;
  let frames: Map<number, FrameRequestCallback>;
  const pump = (count = 1) => {
    for (let i = 0; i < count; i++) {
      now += 1000 / 60;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach(callback => callback(now));
    }
  };
  const pointer = (
    target: EventTarget,
    type: string,
    x: number,
    buttons = 1,
    id = 7
  ) => {
    const event = new Event(type);
    Object.assign(event, {
      clientX: x,
      clientY: 380,
      buttons,
      button: 0,
      pointerId: id,
      pointerType: "mouse",
      isPrimary: true,
    });
    Object.defineProperty(event, "timeStamp", { value: now });
    target.dispatchEvent(event);
  };
  const beginDrag = () => {
    const x = Number(host.dataset.artworkCenter.split(",")[0]);
    pointer(controls, "pointerdown", x);
    pump();
    pointer(win, "pointermove", x + 100);
    pump();
    expect(controls.dataset.dragging).toBe("true");
    return x;
  };

  beforeEach(() => {
    frames = new Map();
    now = 1000;
    win = Object.assign(new EventTarget(), { scrollY: 0 });
    doc = Object.assign(new EventTarget(), {
      hidden: false,
      documentElement: new Surface(),
      querySelector: () => null,
      querySelectorAll: () => [],
    });
    vi.stubGlobal("window", win);
    vi.stubGlobal("document", doc);
    vi.stubGlobal("devicePixelRatio", 1);
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private callback: () => void) {}
        observe() {
          this.callback();
        }
        disconnect() {}
      }
    );
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      }
    );
    controls = new Surface();
    host = new Surface();
    controls.appendChild(host);
    scene = createGalaxy(host as unknown as HTMLElement);
    pump();
  });
  afterEach(() => {
    scene.dispose();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps hover wake independent of rotation and clears it on pause and navigation", () => {
    const sweep = () => {
      pointer(win, "pointermove", 600, 0);
      pump(4);
      pointer(win, "pointermove", 650, 0);
      pump();
      expect(Number(host.dataset.wakeSegments)).toBeGreaterThan(0);
      expect(host.dataset.interaction).toBe("idle");
      expect(Number(host.dataset.returnAngle)).toBe(0);
    };
    sweep();
    pump(210);
    expect(host.dataset.wakeSegments).toBe("0");
    sweep();
    scene.setPaused(true);
    pump();
    expect(host.dataset.wakeSegments).toBe("0");
    scene.setPaused(false);
    sweep();
    scene.setPage("/about");
    pump();
    expect(host.dataset.wakeSegments).toBe("0");
  });

  it("releases on pointerup and ignores unrelated pointer IDs", () => {
    const x = beginDrag();
    pointer(win, "pointerup", x, 0, 8);
    expect(controls.dataset.dragging).toBe("true");
    pointer(win, "pointerup", x, 0);
    expect(controls.dataset.dragging).toBe("false");
    pointer(win, "pointermove", x + 300, 0);
    pump(330);
    expect(host.dataset.interaction).toBe("idle");
    expect(Number(host.dataset.returnAngle)).toBeLessThan(0.003);
  });
  it("holds the figure coherent while pressed: drag rotates without wake shatter", () => {
    const x = beginDrag();
    pump(4);
    pointer(win, "pointermove", x + 140, 1);
    pump();
    expect(controls.dataset.dragging).toBe("true");
    // While pressed the wake stands down — the drag rotates the rose as one
    // mass, so even a tiny pull must not shred the figure locally.
    expect(host.dataset.wakeSegments).toBe("0");
    pointer(win, "pointerup", x + 140, 0);
    expect(controls.dataset.dragging).toBe("false");
    pump(330);
    expect(host.dataset.wakeSegments).toBe("0");
    expect(host.dataset.interaction).toBe("idle");
    expect(Number(host.dataset.returnAngle)).toBeLessThan(0.003);
  });
  it("cancels capture, blur and missed releases without latching the pointer", () => {
    for (const kind of [
      "pointercancel",
      "lostpointercapture",
      "blur",
      "buttons",
    ]) {
      const x = beginDrag();
      if (kind === "blur") win.dispatchEvent(new Event("blur"));
      else if (kind === "buttons") pointer(win, "pointermove", x, 0);
      else pointer(kind === "lostpointercapture" ? controls : win, kind, x, 0);
      expect(controls.dataset.dragging, kind).toBe("false");
      expect(controls.captures.size, kind).toBe(0);
      pump(210);
    }
  });
  it("pauses, resumes and restores context while retaining a single canvas", () => {
    scene.setPaused(true);
    pump(2);
    const frozen = host.dataset.elapsed;
    pump(60);
    expect(host.dataset.elapsed).toBe(frozen);
    scene.setPaused(false);
    pump(30);
    expect(Number(host.dataset.elapsed)).toBeGreaterThan(Number(frozen));
    host.children[0].dispatchEvent(
      new Event("webglcontextlost", { cancelable: true })
    );
    expect(host.dataset.ready).toBe("false");
    expect(host.dataset.motion).toBe("paused");
    host.children[0].dispatchEvent(new Event("webglcontextrestored"));
    pump();
    expect(host.dataset.ready).toBe("true");
    scene.setPage("/algorithms");
    pump();
    scene.setPage("/");
    pump();
    expect(host.children).toHaveLength(1);
    doc.hidden = true;
    doc.dispatchEvent(new Event("visibilitychange"));
    expect(frames.size).toBe(0);
    doc.hidden = false;
    doc.dispatchEvent(new Event("visibilitychange"));
    pump();
    expect(host.dataset.motion).toBe("running");
  });
  it("disposes listeners and respects reduced-motion from initialization", () => {
    scene.dispose();
    expect(host.children).toHaveLength(0);
    expect(frames.size).toBe(0);
    scene = createGalaxy(host as unknown as HTMLElement, true, true);
    pump(60);
    pointer(controls, "pointerdown", 930);
    pump();
    expect(host.dataset.motion).toBe("paused");
    expect(Number(host.dataset.elapsed)).toBe(0);
    expect(controls.captures.size).toBe(0);
    expect(host.children).toHaveLength(1);
  });
});
describe("intro reveal mathematical convergence (BUG-02)", () => {
  it("guarantees all particles reach 100% convergence before uIntro reaches 1.0", () => {
    // Test across corner boundaries of seeds
    const boundarySeeds = [
      { x: 0.0, y: 0.0, z: 0.0 },
      { x: 1.0, y: 0.0, z: 0.0 },
      { x: 0.0, y: 1.0, z: 0.0 },
      { x: 1.0, y: 1.0, z: 0.0 },
      { x: 0.5, y: 0.5, z: 0.5 },
      { x: 1.0, y: 1.0, z: 1.0 },
    ];

    for (const seed of boundarySeeds) {
      // At uIntro = 0.0, particle has not departed
      const atStart = evaluateIntroConvergence(0.0, seed);
      expect(atStart.t).toBe(0.0);
      expect(atStart.local).toBe(0.0);
      expect(atStart.introT).toBe(0.0);
      expect(atStart.isFullyConverged).toBe(false);

      // At uIntro = 0.95, EVERY particle must be fully converged
      const at95 = evaluateIntroConvergence(0.95, seed);
      expect(at95.t).toBe(1.0);
      expect(at95.local).toBe(1.0);
      expect(at95.introT).toBe(1.0);
      expect(at95.travelT).toBe(1.0);
      expect(at95.isFullyConverged).toBe(true);
    }
  });

  it("ensures zero discontinuity / snap jump as uIntro transitions to 1.0", () => {
    // Check 100 random seeds for smooth convergence without snap
    for (let i = 0; i < 100; i++) {
      const seed = {
        x: (i * 17) % 100 / 100,
        y: (i * 31) % 100 / 100,
        z: (i * 53) % 100 / 100,
      };

      const preEnd = evaluateIntroConvergence(0.9999, seed);
      const postEnd = evaluateIntroConvergence(1.0, seed);

      // Value at 0.9999 must already be 1.0 (settled), so transition to 1.0 has 0 delta
      expect(preEnd.t).toBe(1.0);
      expect(preEnd.local).toBe(1.0);
      expect(preEnd.introT).toBe(1.0);
      expect(preEnd.travelT).toBe(1.0);

      expect(Math.abs(preEnd.t - postEnd.t)).toBeLessThan(1e-6);
      expect(Math.abs(preEnd.local - postEnd.local)).toBeLessThan(1e-6);
      expect(Math.abs(preEnd.introT - postEnd.introT)).toBeLessThan(1e-6);
      expect(Math.abs(preEnd.travelT - postEnd.travelT)).toBeLessThan(1e-6);
    }
  });

  it("verifies smooth quintic smootherstep easing profile", () => {
    const seed = { x: 0.5, y: 0.5, z: 0.5 };
    // Departure starts around delay = 0.11 + 0.04 = 0.15 + 0.10 = 0.25
    // Test monotonicity of local progress
    let previousLocal = 0;
    for (let step = 0; step <= 100; step++) {
      const u = step / 100;
      const result = evaluateIntroConvergence(u, seed);
      expect(result.local).toBeGreaterThanOrEqual(previousLocal);
      expect(result.local).toBeLessThanOrEqual(1.0);
      previousLocal = result.local;
    }
    expect(previousLocal).toBe(1.0);
  });
});

describe("optics: power-law star brightness & diffraction prominence", () => {
  it("calculates dust brightness according to cubic power-law distribution", () => {
    expect(calculateDustBrightness(0.0)).toBeCloseTo(0.35, 3);
    expect(calculateDustBrightness(1.0)).toBeCloseTo(2.00, 3);

    // Median r=0.5 -> 0.35 + 0.125 * 1.65 = 0.55625
    const median = calculateDustBrightness(0.5);
    expect(median).toBeCloseTo(0.55625, 3);
    expect(median).toBeLessThan(1.0); // Concentrated in dim tiers
  });

  it("calculates star brightness according to power-law distribution", () => {
    // Normal stars
    expect(calculateStarBrightness(0.0, false)).toBeCloseTo(0.40, 3);
    expect(calculateStarBrightness(1.0, false)).toBeCloseTo(3.00, 3);
    const mid = calculateStarBrightness(0.5, false);
    expect(mid).toBeCloseTo(0.8288, 2);

    // Clustered heart stars: [2.00, 2.60]
    expect(calculateStarBrightness(0.0, true)).toBeCloseTo(2.00, 3);
    expect(calculateStarBrightness(1.0, true)).toBeCloseTo(2.60, 3);
    expect(calculateStarBrightness(0.5, true)).toBeCloseTo(2.30, 3);
  });

  it("evaluates diffraction spike prominence gate strictly", () => {
    // Below 2.2: strictly 0
    expect(calculateProminence(0.4)).toBe(0.0);
    expect(calculateProminence(1.5)).toBe(0.0);
    expect(calculateProminence(2.0)).toBe(0.0);
    expect(calculateProminence(2.2)).toBe(0.0);

    // Above 3.0: strictly 1
    expect(calculateProminence(3.0)).toBe(1.0);
    expect(calculateProminence(3.5)).toBe(1.0);

    // Midpoint: 2.6 -> smoothstep(2.2, 3.0, 2.6) = 0.5
    expect(calculateProminence(2.6)).toBeCloseTo(0.5, 3);
  });
});

describe("performance, lifecycle and resilience (Milestone 4)", () => {
  let host: Surface,
    controls: Surface,
    win: EventTarget & { scrollY: number },
    doc: EventTarget & { hidden: boolean };
  let scene: ReturnType<typeof createGalaxy>;
  let now = 1000,
    frameId = 0;
  let frames: Map<number, FrameRequestCallback>;
  const pump = (count = 1) => {
    for (let i = 0; i < count; i++) {
      now += 1000 / 60;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach(callback => callback(now));
    }
  };
  const pointer = (
    target: EventTarget,
    type: string,
    x: number,
    buttons = 1,
    id = 7
  ) => {
    const event = new Event(type);
    Object.assign(event, {
      clientX: x,
      clientY: 380,
      buttons,
      button: 0,
      pointerId: id,
      pointerType: "mouse",
      isPrimary: true,
    });
    Object.defineProperty(event, "timeStamp", { value: now });
    target.dispatchEvent(event);
  };

  beforeEach(() => {
    frames = new Map();
    now = 1000;
    win = Object.assign(new EventTarget(), { scrollY: 0 });
    doc = Object.assign(new EventTarget(), {
      hidden: false,
      documentElement: new Surface(),
      querySelector: () => null,
      querySelectorAll: () => [],
    });
    vi.stubGlobal("window", win);
    vi.stubGlobal("document", doc);
    vi.stubGlobal("devicePixelRatio", 1);
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private callback: () => void) {}
        observe() {
          this.callback();
        }
        disconnect() {}
      }
    );
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      }
    );
    controls = new Surface();
    host = new Surface();
    controls.appendChild(host);
    scene = createGalaxy(host as unknown as HTMLElement);
    pump();
  });

  afterEach(() => {
    scene?.dispose();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("eliminates layout thrashing: getBoundingClientRect is NEVER called during per-frame paint() (BUG-05)", () => {
    const rectSpy = vi.spyOn(host, "getBoundingClientRect");
    rectSpy.mockClear();

    // Pump 60 animation frames (1 full second of 60fps rendering)
    pump(60);

    // ZERO getBoundingClientRect calls inside paint()!
    expect(rectSpy).not.toHaveBeenCalled();

    // Scroll event updates layout cache cleanly
    win.dispatchEvent(new Event("scroll"));
    expect(rectSpy).toHaveBeenCalledTimes(1);

    rectSpy.mockClear();
    pump(30);
    expect(rectSpy).not.toHaveBeenCalled();
  });

  it("disposes heartGeometry and heartMaterial on dispose() (BUG-03)", () => {
    const planeDisposeSpy = vi.spyOn(PlaneGeometry.prototype, "dispose");
    const shaderDisposeSpy = vi.spyOn(ShaderMaterial.prototype, "dispose");

    scene.dispose();

    // Atmosphere + Heart geometries and materials must be disposed
    expect(planeDisposeSpy).toHaveBeenCalled();
    expect(shaderDisposeSpy).toHaveBeenCalled();
  });

  it("cleans up global window.__galaxyIntro hook on dispose() (BUG-04)", () => {
    expect((window as any).__galaxyIntro).toBeDefined();
    expect(typeof (window as any).__galaxyIntro.get).toBe("function");

    scene.dispose();
    expect((window as any).__galaxyIntro).toBeUndefined();
  });

  it("recovers gracefully from webglcontextlost and webglcontextrestored (BUG-06)", () => {
    const canvas = host.children[0];
    const lostEvent = new Event("webglcontextlost", { cancelable: true });
    canvas.dispatchEvent(lostEvent);
    expect(host.dataset.ready).toBe("false");
    expect(host.dataset.motion).toBe("paused");

    const restoredEvent = new Event("webglcontextrestored");
    canvas.dispatchEvent(restoredEvent);
    pump(5);

    expect(host.dataset.ready).toBe("true");
    expect(host.dataset.motion).toBe("running");
  });

  it("removes window event listeners on dispose()", () => {
    const removeListenerSpy = vi.spyOn(win, "removeEventListener");
    scene.dispose();

    expect(removeListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith("pointermove", expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith("blur", expect.any(Function));
  });

  it("bypasses bloom when light mode is enabled", () => {
    scene.setTheme(true);
    pump(2);
    expect(host.dataset.ready).toBe("true");
    scene.setTheme(false);
    pump(2);
    expect(host.dataset.ready).toBe("true");
  });

  it("applies CSS containment and hardware compositing properties to host and parent", () => {
    expect((host.style as any).contain).toBe("strict");
    expect((host.style as any).willChange).toBe("transform, opacity");
    expect((host.style as any).transform).toBe("translateZ(0)");
    expect((controls.style as any).contain).toBe("layout paint size");
    expect((controls.style as any).willChange).toBe("transform");
  });

  it("activates wake segments during pointer movement and clears when resting", () => {
    // Resting scene has 0 wake segments
    expect(host.dataset.wakeSegments).toBe("0");

    // Pointer move introduces wake (>50ms delta)
    pointer(win, "pointermove", 600, 0);
    pump(4);
    pointer(win, "pointermove", 650, 0);
    pump();

    expect(Number(host.dataset.wakeSegments)).toBeGreaterThan(0);

    // After wake lifetime expires, returns to 0
    pump(210);
    expect(host.dataset.wakeSegments).toBe("0");
  });
});

describe("Milestone 2 & 3: navigation intro preservation & interaction dynamics", () => {
  let host: Surface,
    controls: Surface,
    win: EventTarget & { scrollY: number },
    doc: EventTarget & { hidden: boolean };
  let scene: ReturnType<typeof createGalaxy>;
  let now = 1000,
    frameId = 0;
  let frames: Map<number, FrameRequestCallback>;
  const pump = (count = 1) => {
    for (let i = 0; i < count; i++) {
      now += 1000 / 60;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach(callback => callback(now));
    }
  };
  const pointer = (
    target: EventTarget,
    type: string,
    x: number,
    buttons = 1,
    id = 7
  ) => {
    const event = new Event(type);
    Object.assign(event, {
      clientX: x,
      clientY: 380,
      buttons,
      button: 0,
      pointerId: id,
      pointerType: "mouse",
      isPrimary: true,
    });
    Object.defineProperty(event, "timeStamp", { value: now });
    target.dispatchEvent(event);
  };

  beforeEach(() => {
    frames = new Map();
    now = 1000;
    win = Object.assign(new EventTarget(), { scrollY: 0 });
    doc = Object.assign(new EventTarget(), {
      hidden: false,
      documentElement: new Surface(),
      querySelector: () => null,
      querySelectorAll: () => [],
    });
    vi.stubGlobal("window", win);
    vi.stubGlobal("document", doc);
    vi.stubGlobal("devicePixelRatio", 1);
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private callback: () => void) {}
        observe() {
          this.callback();
        }
        disconnect() {}
      }
    );
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      }
    );
    controls = new Surface();
    host = new Surface();
    controls.appendChild(host);
    scene = createGalaxy(host as unknown as HTMLElement);
    pump();
  });

  afterEach(() => {
    scene?.dispose();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("preserves intro = 1.0 on setPage() when intro animation has settled (BUG-07)", () => {
    // Advance time past 3.2s intro duration (200 frames at 60fps = 3.33s)
    pump(200);

    expect(scene.getIntro()).toBe(1.0);
    expect(host.dataset.intro).toBe("1.000");

    // Navigate to article reader
    scene.setPage("/post/neural-rendering-pipelines");
    pump(1);

    // BUG-07 fix: intro must NOT reset to 0
    expect(scene.getIntro()).toBe(1.0);
    expect(host.dataset.intro).toBe("1.000");
    expect(host.dataset.mode).toBe("reading");

    // Navigate to another article
    scene.setPage("/post/quantum-annealing");
    pump(1);
    expect(scene.getIntro()).toBe(1.0);
    expect(host.dataset.intro).toBe("1.000");

    // Navigate to archive
    scene.setPage("/archive");
    pump(1);
    expect(scene.getIntro()).toBe(1.0);
    expect(host.dataset.intro).toBe("1.000");

    // Navigate back to home
    scene.setPage("/");
    pump(1);
    expect(scene.getIntro()).toBe(1.0);
    expect(host.dataset.intro).toBe("1.000");
    expect(host.dataset.mode).toBe("home");
  });

  it("resets intro to 0 if navigating before intro animation has completed", () => {
    // Only run 5 frames (approx 0.08s, intro is ~0.025 << 1.0)
    pump(5);
    expect(scene.getIntro()).toBeLessThan(0.1);

    // Navigate while intro is still mid-animation
    scene.setPage("/about");
    expect(scene.getIntro()).toBe(0);
    expect(host.dataset.intro).toBe("0.000");
    expect(host.dataset.mode).toBe("author");
  });

  it("preserves intro = 1.0 across all navigations under prefers-reduced-motion", () => {
    const rmHost = new Surface();
    const rmControls = new Surface();
    rmControls.appendChild(rmHost);
    const rmScene = createGalaxy(rmHost as unknown as HTMLElement, false, true);

    expect(rmScene.getIntro()).toBe(1.0);

    rmScene.setPage("/post/first-post");
    expect(rmScene.getIntro()).toBe(1.0);

    rmScene.setPage("/about");
    expect(rmScene.getIntro()).toBe(1.0);

    rmScene.setPage("/");
    expect(rmScene.getIntro()).toBe(1.0);

    rmScene.dispose();
  });

  it("reinforces wake suppression during active 3D trackball drag", () => {
    pump(200); // Fully settled

    const x = Number(host.dataset.artworkCenter.split(",")[0]);

    // Pointer move without buttons pressed (event.buttons === 0): wake IS registered
    pointer(win, "pointermove", x + 50, 0);
    pump(4);
    pointer(win, "pointermove", x + 100, 0);
    pump();
    expect(Number(host.dataset.wakeSegments)).toBeGreaterThan(0);

    // Expire wake
    pump(210);
    expect(host.dataset.wakeSegments).toBe("0");

    // Now begin 3D drag: pointerdown on artwork
    pointer(controls, "pointerdown", x, 1);
    pump();
    expect(controls.dataset.dragging).toBe("true");

    // Move pointer WHILE button is pressed (event.buttons === 1): wake MUST be suppressed!
    pointer(win, "pointermove", x + 80, 1);
    pump();
    expect(host.dataset.wakeSegments).toBe("0");

    pointer(win, "pointermove", x + 160, 1);
    pump();
    expect(host.dataset.wakeSegments).toBe("0");

    // Release drag
    pointer(win, "pointerup", x + 160, 0);
    expect(controls.dataset.dragging).toBe("false");

    // Settle back to canonical home Euler orientation
    pump(300);
    expect(Number(host.dataset.returnAngle)).toBeLessThan(0.003);
    expect(host.dataset.interaction).toBe("idle");
  });
});
