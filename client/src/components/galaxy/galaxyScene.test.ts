import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
vi.mock("three/addons/postprocessing/UnrealBloomPass.js", () => ({
  UnrealBloomPass: class {
    separableBlurMaterials = [];
    renderTargetsHorizontal = [{ texture: {} }];
    dispose() {}
  },
}));
vi.mock("three/addons/postprocessing/ShaderPass.js", () => ({
  ShaderPass: class {
    uniforms: object;
    constructor(shader: { uniforms: object }) {
      this.uniforms = shader.uniforms;
    }
    dispose() {}
  },
}));
vi.mock("three/addons/postprocessing/OutputPass.js", () => ({
  OutputPass: class {
    dispose() {}
  },
}));

import { createGalaxy } from "./galaxyScene";

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
    pump(90);
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
    pump(115);
    expect(host.dataset.interaction).toBe("idle");
    expect(Number(host.dataset.returnAngle)).toBeLessThan(0.003);
  });
  it("also scatters locally while pressed, then releases without latching", () => {
    const x = beginDrag();
    pump(4);
    pointer(win, "pointermove", x + 140, 1);
    pump();
    expect(Number(host.dataset.wakeSegments)).toBeGreaterThan(0);
    pointer(win, "pointerup", x + 140, 0);
    expect(controls.dataset.dragging).toBe("false");
    pump(120);
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
      pump(115);
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
