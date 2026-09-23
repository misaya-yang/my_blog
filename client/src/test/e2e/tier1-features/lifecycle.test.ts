import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Use MockSurface to simulate DOM host and canvas elements
class MockDomElement extends EventTarget {
  dataset: Record<string, string> = {};
  style = {
    opacity: "1",
    setProperty: vi.fn(),
  };
  parentElement: MockDomElement | null = null;
  children: MockDomElement[] = [];
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
  querySelectorAll() {
    return [];
  }
  appendChild(child: MockDomElement) {
    child.parentElement = this;
    this.children.push(child);
  }
  remove() {
    if (this.parentElement) {
      this.parentElement.children = this.parentElement.children.filter(x => x !== this);
    }
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

const mockGeometriesDisposed: any[] = [];
const mockMaterialsDisposed: any[] = [];
const mockForceContextLoss = vi.fn();

vi.mock("three", async importOriginal => {
  const real = await importOriginal<typeof import("three")>();
  return {
    ...real,
    WebGLRenderer: class {
      domElement = new MockDomElement();
      info = { memory: { geometries: 6, textures: 15 } };
      ratio = 1;
      setPixelRatio(value: number) {
        this.ratio = value;
      }
      getPixelRatio() {
        return this.ratio;
      }
      setClearColor() {}
      getRenderTarget() {
        return null;
      }
      setRenderTarget() {}
      getClearAlpha() {
        return 0;
      }
      setClearAlpha() {}
      clear() {}
      setSize() {}
      render() {}
      dispose() {}
      forceContextLoss = mockForceContextLoss;
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

import { createGalaxy } from "@/components/galaxy/galaxyScene";

describe("Tier 1: Feature Coverage - Lifecycle, Teardown & Context Resilience (F16-F19)", () => {
  let host: MockDomElement;
  let controls: MockDomElement;
  let win: EventTarget & { scrollY: number };
  let doc: EventTarget & { hidden: boolean; documentElement: MockDomElement };
  let scene: ReturnType<typeof createGalaxy>;
  let now = 1000;
  let frameId = 0;
  let frames: Map<number, FrameRequestCallback>;

  const pump = (count = 1) => {
    for (let i = 0; i < count; i++) {
      now += 1000 / 60;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach(cb => cb(now));
    }
  };

  beforeEach(() => {
    frames = new Map();
    now = 1000;
    win = Object.assign(new EventTarget(), { scrollY: 0 });
    doc = Object.assign(new EventTarget(), {
      hidden: false,
      documentElement: new MockDomElement(),
      querySelector: () => null,
      querySelectorAll: () => [],
    });

    vi.stubGlobal("window", win);
    vi.stubGlobal("document", doc);
    vi.stubGlobal("devicePixelRatio", 1);
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frames.set(++frameId, cb);
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

    controls = new MockDomElement();
    host = new MockDomElement();
    controls.appendChild(host);
    scene = createGalaxy(host as unknown as HTMLElement);
    pump();
  });

  afterEach(() => {
    scene?.dispose();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("removes all DOM and window event listeners on dispose()", () => {
    const removeListenerSpy = vi.spyOn(win, "removeEventListener");
    scene.dispose();

    expect(removeListenerSpy).toHaveBeenCalledWith("pointermove", expect.any(Function));
    expect(removeListenerSpy).toHaveBeenCalledWith("pointerup", expect.any(Function), true);
    expect(removeListenerSpy).toHaveBeenCalledWith("pointercancel", expect.any(Function), true);
    expect(removeListenerSpy).toHaveBeenCalledWith("blur", expect.any(Function));
  });

  it("cancels pending animation frames and leaves zero orphaned rAF loops", () => {
    expect(frames.size).toBeGreaterThan(0);
    scene.dispose();
    expect(frames.size).toBe(0);

    // Further ticks do not register any new frames
    pump(5);
    expect(frames.size).toBe(0);
  });

  it("removes renderer canvas element from host and triggers forceContextLoss()", () => {
    expect(host.children.length).toBe(1);
    scene.dispose();

    expect(host.children.length).toBe(0);
    expect(mockForceContextLoss).toHaveBeenCalled();
  });

  it("handles webglcontextlost event by pausing motion and setting data-ready to false", () => {
    const canvas = host.children[0];
    const lostEvent = new Event("webglcontextlost", { cancelable: true });
    canvas.dispatchEvent(lostEvent);

    expect(host.dataset.ready).toBe("false");
    expect(host.dataset.motion).toBe("paused");
  });

  it("handles webglcontextrestored event by resetting data-ready and resuming rendering", () => {
    const canvas = host.children[0];
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    expect(host.dataset.ready).toBe("false");

    canvas.dispatchEvent(new Event("webglcontextrestored"));
    pump();

    expect(host.dataset.ready).toBe("true");
    expect(host.dataset.motion).toBe("running");
  });

  it("pauses animation when document visibility is hidden and resumes when visible", () => {
    doc.hidden = true;
    doc.dispatchEvent(new Event("visibilitychange"));
    expect(frames.size).toBe(0); // Suspends rAF queue

    doc.hidden = false;
    doc.dispatchEvent(new Event("visibilitychange"));
    pump();
    expect(host.dataset.motion).toBe("running");
    expect(frames.size).toBeGreaterThan(0);
  });

  it("supports explicit pause and resume without recreating the canvas or context", () => {
    scene.setPaused(true);
    pump(2);
    const frozenTime = host.dataset.elapsed;
    pump(30);
    expect(host.dataset.elapsed).toBe(frozenTime);

    scene.setPaused(false);
    pump(30);
    expect(Number(host.dataset.elapsed)).toBeGreaterThan(Number(frozenTime));
    expect(host.children).toHaveLength(1); // Single canvas preserved
  });
});
