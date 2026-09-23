import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BufferGeometry,
  DataTexture,
  Mesh,
  Scene,
  ShaderMaterial,
} from "three";
import { ParticleField } from "./particleField";
import { BloomPyramidPass } from "./bloomPyramid";

// Real scene/event/CPU-motion code, mocked renderer transport only. This suite
// does not compile shaders, render pixels, or certify GPU performance.
class Surface extends EventTarget {
  dataset: Record<string, string> = {};
  style = { setProperty: vi.fn(), opacity: "1" };
  parentElement: Surface | null = null;
  children: Surface[] = [];
  queries = new Map<string, Surface>();
  clientWidth = 1280;
  clientHeight = 800;
  left = 0;
  top = 0;
  inert = false;
  isConnected = true;
  captures = new Set<number>();
  setAttribute = vi.fn();
  closest() {
    return null;
  }
  querySelector(selector: string) {
    return this.queries.get(selector) ?? null;
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
      x: this.left,
      y: this.top,
      left: this.left,
      top: this.top,
      right: this.left + this.clientWidth,
      bottom: this.top + this.clientHeight,
      width: this.clientWidth,
      height: this.clientHeight,
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

const transport = vi.hoisted(() => ({
  renderers: [] as any[],
  composers: [] as any[],
}));
vi.mock("three", async importOriginal => {
  const real = await importOriginal<typeof import("three")>();
  return {
    ...real,
    WebGLRenderer: class {
      domElement = new Surface();
      info = { memory: { geometries: 0, textures: 0 } };
      ratio = 1;
      width = 0;
      height = 0;
      constructor() {
        transport.renderers.push(this);
      }
      setPixelRatio(value: number) {
        this.ratio = value;
      }
      getPixelRatio() {
        return this.ratio;
      }
      setClearColor() {}
      target: unknown = null;
      clearAlpha = 0;
      getRenderTarget() {
        return this.target;
      }
      setRenderTarget(target: unknown) {
        this.target = target;
      }
      getClearAlpha() {
        return this.clearAlpha;
      }
      setClearAlpha(value: number) {
        this.clearAlpha = value;
      }
      clear() {}
      setSize(width: number, height: number) {
        this.width = width;
        this.height = height;
      }
      render() {}
      dispose() {}
      forceContextLoss() {}
    },
  };
});
vi.mock("three/addons/postprocessing/EffectComposer.js", () => ({
  EffectComposer: class {
    passes: any[] = [];
    ratio = 1;
    width = 0;
    height = 0;
    constructor() {
      transport.composers.push(this);
    }
    addPass(pass: any) {
      this.passes.push(pass);
    }
    setSize(width: number, height: number) {
      this.width = width;
      this.height = height;
      this.passes.forEach(pass =>
        pass.setSize?.(width * this.ratio, height * this.ratio)
      );
    }
    setPixelRatio(ratio: number) {
      this.ratio = ratio;
      this.setSize(this.width, this.height);
    }
    render() {}
    dispose() {}
  },
}));
vi.mock("three/addons/postprocessing/RenderPass.js", () => ({
  RenderPass: class {
    constructor(readonly scene: Scene) {}
  },
}));

import {
  createGalaxy,
  evaluateIntroConvergence,
  calculateDustBrightness,
  calculateStarBrightness,
  calculateProminence,
} from "./galaxyScene";

describe("scene inputs, layout, quality and lifetime", () => {
  let host: Surface, controls: Surface;
  let win: EventTarget & { scrollY: number };
  let doc: EventTarget & { hidden: boolean };
  let scene: ReturnType<typeof createGalaxy>;
  let now: number, frameId: number;
  let frames: Map<number, FrameRequestCallback>;
  let queries: Map<string, Surface>;
  let quietSurfaces: Surface[];
  let contentRoot: Surface;
  let mutationCallback: () => void;
  let observeContent: ReturnType<typeof vi.fn>;
  let disconnectContent: ReturnType<typeof vi.fn>;
  let resizeCallback: () => void;
  let intersectionCallback: (entries: { isIntersecting: boolean }[]) => void;
  let fieldUpdate: ReturnType<typeof vi.spyOn>;
  const field = () => fieldUpdate.mock.instances.at(-1) as ParticleField;
  const pump = (count = 1, interval = 1000 / 60) => {
    for (let i = 0; i < count; i++) {
      now += interval;
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach(callback => callback(now));
    }
  };
  const artwork = () => host.dataset.artworkCenter.split(",").map(Number);
  const pointer = (
    target: EventTarget,
    type: string,
    x: number,
    buttons = 1,
    id = 7,
    y = artwork()[1]
  ) => {
    const event = new Event(type);
    Object.assign(event, {
      clientX: x,
      clientY: y,
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
    const [x] = artwork();
    pointer(controls, "pointerdown", x);
    pump();
    pointer(win, "pointermove", x + 80);
    pump();
    expect(controls.dataset.dragging).toBe("true");
    return x;
  };
  const sweep = () => {
    const [x] = artwork();
    pointer(win, "pointermove", x - 80, 0);
    pump();
    pointer(win, "pointermove", x + 40, 0);
    pump();
  };
  const displacement = () => {
    const current = (field().textures.current as DataTexture).image
      .data as Float32Array;
    const base = (field().textures.base as DataTexture).image
      .data as Float32Array;
    let maximum = 0;
    for (let i = 0; i < current.length; i += 4)
      maximum = Math.max(
        maximum,
        Math.hypot(current[i] - base[i], current[i + 1] - base[i + 1])
      );
    return maximum;
  };
  const renderObjects = () => {
    const composer = transport.composers.at(-1);
    const world = composer.passes.find((pass: any) => pass.scene)
      ?.scene as Scene;
    let trails: Mesh, stars: Mesh;
    world.traverse(object => {
      if (object instanceof Mesh && object.renderOrder === 2) trails = object;
      if (object instanceof Mesh && object.renderOrder === 3) stars = object;
    });
    return {
      world,
      composer,
      renderer: transport.renderers.at(-1),
      trails: trails!,
      stars: stars!,
      bloom: composer.passes.find(
        (pass: any) => pass instanceof BloomPyramidPass
      ) as BloomPyramidPass,
    };
  };
  beforeEach(() => {
    now = 1000;
    frameId = 0;
    frames = new Map();
    queries = new Map();
    quietSurfaces = [];
    contentRoot = new Surface();
    observeContent = vi.fn();
    disconnectContent = vi.fn();
    transport.renderers.length = transport.composers.length = 0;
    win = Object.assign(new EventTarget(), { scrollY: 0 });
    doc = Object.assign(new EventTarget(), {
      hidden: false,
      documentElement: new Surface(),
      querySelector: (selector: string) => queries.get(selector) ?? null,
      querySelectorAll: () => quietSurfaces,
      getElementById: (id: string) => (id === "root" ? contentRoot : null),
    });
    vi.stubGlobal("window", win);
    vi.stubGlobal("document", doc);
    vi.stubGlobal("devicePixelRatio", 2);
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          resizeCallback = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof intersectionCallback) {
          intersectionCallback = callback;
        }
        observe() {}
        disconnect() {}
      }
    );
    vi.stubGlobal(
      "MutationObserver",
      class {
        constructor(callback: () => void) {
          mutationCallback = callback;
        }
        observe = observeContent;
        disconnect = disconnectContent;
      }
    );
    fieldUpdate = vi.spyOn(ParticleField.prototype, "update");
    controls = new Surface();
    host = new Surface();
    controls.appendChild(host);
    scene = createGalaxy(host as unknown as HTMLElement);
    resizeCallback();
    pump();
  });
  afterEach(() => {
    scene.dispose();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("uses the actual CPU backend when float render targets are unavailable", () => {
    expect(host.dataset.motionBackend).toBe("cpu");
    const current = (field().textures.current as DataTexture).image
      .data as Float32Array;
    expect([...current].every(Number.isFinite)).toBe(true);
    expect(current.some(value => value !== 0)).toBe(true);
  });

  it("parts local particles during hover without rotating the rose, then clears on pause and navigation", () => {
    pump(200);
    sweep();
    expect(host.dataset.inputActive).toBe("true");
    expect(host.dataset.interaction).toBe("idle");
    expect(Number(host.dataset.returnAngle)).toBe(0);
    expect(displacement()).toBeGreaterThan(0.00001);
    pump();
    // A resting cursor keeps the particles parted around it.
    expect(host.dataset.inputActive).toBe("true");
    expect(displacement()).toBeGreaterThan(0);
    scene.setPaused(true);
    pump();
    expect(host.dataset.inputActive).toBe("false");
    expect(displacement()).toBe(0);
    scene.setPaused(false);
    sweep();
    scene.setPage("/about");
    pump();
    expect(host.dataset.inputActive).toBe("false");
    expect(displacement()).toBe(0);
  });

  it("releases on pointerup and ignores unrelated pointer IDs", () => {
    const x = beginDrag();
    pointer(win, "pointerup", x, 0, 8);
    expect(controls.dataset.dragging).toBe("true");
    pointer(win, "pointerup", x, 0);
    expect(controls.dataset.dragging).toBe("false");
    expect(controls.captures.size).toBe(0);
    pointer(win, "pointermove", x + 300, 0);
    // A flick glides on, rests, then turns home.
    pump(480);
    expect(host.dataset.interaction).toBe("idle");
    expect(Number(host.dataset.returnAngle)).toBeLessThan(0.003);
  });

  it("turns the rose on a pressed drag without smearing it with a wake", () => {
    pump(200);
    const x = beginDrag();
    pointer(win, "pointermove", x + 140, 1);
    pump();
    expect(host.dataset.inputActive).toBe("false");
    expect(Number(host.dataset.returnAngle)).toBeGreaterThan(0.01);
    expect(displacement()).toBeLessThan(0.00001);
    pointer(win, "pointerup", x + 140, 0);
    pump();
    expect(controls.dataset.dragging).toBe("false");
    expect(host.dataset.inputActive).toBe("false");
    // Let go mid-flick, the rose glides on before turning home.
    expect(host.dataset.interaction).toBe("gliding");
    pump(480);
    expect(host.dataset.interaction).toBe("idle");
    expect(Number(host.dataset.returnAngle)).toBeLessThan(0.003);
    expect(displacement()).toBeLessThan(0.001);
  });

  it.each(["pointercancel", "lostpointercapture", "blur", "buttons"])(
    "cancels %s without leaving pointer capture latched",
    kind => {
      const x = beginDrag();
      if (kind === "blur") win.dispatchEvent(new Event("blur"));
      else if (kind === "buttons") pointer(win, "pointermove", x, 0);
      else pointer(kind === "lostpointercapture" ? controls : win, kind, x, 0);
      expect(controls.dataset.dragging).toBe("false");
      expect(controls.captures.size).toBe(0);
    }
  );

  it("pauses and resumes elapsed time while retaining one canvas", () => {
    scene.setPaused(true);
    pump();
    const frozen = host.dataset.elapsed;
    pump(60);
    expect(host.dataset.elapsed).toBe(frozen);
    scene.setPaused(false);
    pump(30);
    expect(Number(host.dataset.elapsed)).toBeGreaterThan(Number(frozen));
    scene.setPage("/algorithms");
    pump();
    scene.setPage("/");
    pump();
    expect(host.children).toHaveLength(1);
  });

  it("clears capture and motion history when hidden, then resumes without stale input", () => {
    beginDrag();
    pump(10);
    expect(field().historyCount).toBeGreaterThan(1);
    doc.hidden = true;
    doc.dispatchEvent(new Event("visibilitychange"));
    expect(controls.captures.size).toBe(0);
    expect(controls.dataset.dragging).toBe("false");
    expect(field().historyCount).toBe(0);
    expect(frames.size).toBe(0);
    doc.hidden = false;
    doc.dispatchEvent(new Event("visibilitychange"));
    pump();
    expect(host.dataset.motion).toBe("running");
    expect(host.dataset.inputActive).toBe("false");
    expect(displacement()).toBe(0);
    expect(field().historyCount).toBe(1);
  });

  it("cancels a drag and resets history when the scene leaves the viewport", () => {
    beginDrag();
    intersectionCallback([{ isIntersecting: false }]);
    expect(controls.captures.size).toBe(0);
    expect(field().historyCount).toBe(0);
    expect(frames.size).toBe(0);
    intersectionCallback([{ isIntersecting: true }]);
    pump();
    expect(host.dataset.inputActive).toBe("false");
  });

  it("cancels an in-progress drag during resize and uses the new viewport", () => {
    beginDrag();
    host.clientWidth = 390;
    host.clientHeight = 844;
    resizeCallback();
    expect(controls.captures.size).toBe(0);
    expect(controls.dataset.dragging).toBe("false");
    expect(host.dataset.inputActive).toBe("false");
    expect(displacement()).toBe(0);
    const { renderer, composer, stars } = renderObjects();
    expect([renderer.width, renderer.height]).toEqual([390, 844]);
    expect([composer.width, composer.height]).toEqual([390, 844]);
    expect(
      (stars.material as ShaderMaterial).uniforms.uAspect.value
    ).toBeCloseTo(390 / 844);
  });

  it("settles paused scroll layout in one paint and reverses fully at the top", () => {
    const home = new Surface(),
      hero = new Surface(),
      stage = new Surface();
    const copy = new Surface(),
      foot = new Surface();
    hero.clientHeight = 1600;
    hero.top = 68;
    copy.clientWidth = 400;
    copy.clientHeight = 300;
    copy.top = 180;
    home.queries.set(".observatory-hero-scroll", hero);
    home.queries.set(".observatory-hero", stage);
    home.queries.set(".observatory-hero-copy", copy);
    home.queries.set(".observatory-hero-foot", foot);
    queries.set(".public-universe .observatory-home", home);
    scene.setPage("/");
    scene.setPaused(true);
    pump();
    const frozen = host.dataset.elapsed;
    stage.style.setProperty.mockClear();
    win.scrollY = 800;
    hero.top = -732;
    win.dispatchEvent(new Event("scroll"));
    pump();
    expect(stage.style.setProperty).toHaveBeenCalledWith(
      "--hero-copy-opacity",
      "0"
    );
    expect(stage.style.setProperty).toHaveBeenCalledWith(
      "--hero-copy-y",
      "-32px"
    );
    expect(copy.inert).toBe(true);
    expect(foot.inert).toBe(true);
    expect(host.style.opacity).toBe("0.72");
    expect(frames.size).toBe(0);
    win.scrollY = 0;
    hero.top = 68;
    win.dispatchEvent(new Event("scroll"));
    pump();
    expect(stage.style.setProperty).toHaveBeenLastCalledWith(
      "--hero-copy-y",
      "0px"
    );
    expect(copy.inert).toBe(false);
    expect(foot.inert).toBe(false);
    expect(host.style.opacity).toBe("1");
    expect(host.dataset.elapsed).toBe(frozen);
  });

  it("keeps reduced quality consistent across theme and viewport changes", () => {
    const { renderer, composer, bloom, stars, trails } = renderObjects();
    const trailCount = () => (trails.geometry as any).instanceCount as number;
    const assertProfile = (
      width: number,
      height: number,
      dpr: number,
      enabled: boolean,
      count: number
    ) => {
      expect(renderer.ratio).toBe(dpr);
      expect(composer.ratio).toBe(dpr);
      expect([renderer.width, renderer.height]).toEqual([width, height]);
      expect([composer.width, composer.height]).toEqual([width, height]);
      expect(
        (stars.material as ShaderMaterial).uniforms.uPixelRatio.value
      ).toBe(dpr);
      expect(
        (stars.material as ShaderMaterial).uniforms.uCanvasSize.value.toArray()
      ).toEqual([width * dpr, height * dpr]);
      expect(bloom.enabled).toBe(enabled);
      expect(trailCount()).toBe(count);
      expect([bloom.downMips[0].width, bloom.downMips[0].height]).toEqual([
        Math.floor(width * dpr * 0.5),
        Math.floor(height * dpr * 0.5),
      ]);
    };
    assertProfile(1280, 800, 1.5, true, 300);
    // Sustained overload lowers the render scale before anything else.
    pump(40, 40);
    expect(host.dataset.renderScale).toBe("0.85");
    expect(host.dataset.quality).toBe("0");
    const scaled = Math.round(1.5 * 0.85 * 100) / 100;
    assertProfile(1280, 800, scaled, true, 300);
    // Theme changes keep the adapted profile; day keeps bloom for ink bleed.
    scene.setTheme(true);
    pump();
    assertProfile(1280, 800, scaled, true, 300);
    host.clientWidth = 390;
    host.clientHeight = 844;
    resizeCallback();
    assertProfile(390, 844, scaled, true, 300);
    scene.setTheme(false);
    // A long overload walks every scale down, then drops trails and bloom.
    pump(600, 40);
    expect(host.dataset.quality).toBe("2");
    const floor = Math.round(1.5 * 0.55 * 100) / 100;
    assertProfile(390, 844, floor, false, 0);
    host.clientWidth = 1440;
    host.clientHeight = 900;
    resizeCallback();
    scene.setTheme(true);
    scene.setTheme(false);
    pump();
    expect(host.dataset.quality).toBe("2");
    assertProfile(1440, 900, floor, false, 0);
  });

  it("applies the touch-device instance budget and DPR ceiling to real scene objects", () => {
    scene.dispose();
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    host.clientWidth = 390;
    host.clientHeight = 844;
    scene = createGalaxy(host as unknown as HTMLElement);
    resizeCallback();
    pump();
    const { renderer, composer, stars, trails, world } = renderObjects();
    expect(renderer.ratio).toBe(1.25);
    expect(composer.ratio).toBe(1.25);
    expect((stars.geometry as any).instanceCount).toBe(128);
    expect((trails.geometry as any).instanceCount).toBe(128);
    let dustBudget = 0;
    world.traverse((object: any) => {
      if (object.isPoints && object.geometry.getAttribute("aOrbit"))
        dustBudget = object.geometry.drawRange.count;
    });
    expect(dustBudget).toBe(2800);
  });

  it("maps visible reading regions into normalized shader quiet boxes", () => {
    const text = new Surface(),
      offscreen = new Surface();
    text.left = 80;
    text.top = 200;
    text.clientWidth = 320;
    text.clientHeight = 100;
    offscreen.top = 900;
    quietSurfaces = [text, offscreen];
    scene.setPage("/post/reader-quiet-region");
    pump();
    const { stars } = renderObjects();
    const boxes = (stars.material as ShaderMaterial).uniforms.uQuietBoxes.value;
    expect(boxes[0].toArray()).toEqual([0.0625, 0.625, 0.3125, 0.75]);
    expect(boxes[1].toArray()).toEqual([-2, -2, -1, -1]);
    text.top = 400;
    win.dispatchEvent(new Event("scroll"));
    pump();
    expect(boxes[0].toArray()).toEqual([0.0625, 0.375, 0.3125, 0.5]);
  });

  it("clears stale quiet boxes after text leaves the viewport", () => {
    const text = new Surface();
    text.left = 80;
    text.top = 200;
    text.clientWidth = 320;
    text.clientHeight = 100;
    quietSurfaces = [text];
    scene.setPage("/post/reader-quiet-region");
    pump();
    const { stars } = renderObjects();
    const boxes = (stars.material as ShaderMaterial).uniforms.uQuietBoxes.value;
    expect(boxes[0].x).toBeGreaterThanOrEqual(0);
    text.top = 1000;
    win.dispatchEvent(new Event("scroll"));
    pump();
    expect(boxes.map((box: any) => box.toArray())).toEqual(
      Array.from({ length: 4 }, () => [-2, -2, -1, -1])
    );
  });

  it("refreshes asynchronously inserted About text bounds without a scroll event", () => {
    const shell = new Surface();
    shell.left = 16;
    shell.top = 80;
    shell.clientWidth = 200;
    shell.clientHeight = 40;
    quietSurfaces = [shell];
    scene.setPage("/about");
    scene.setPaused(true);
    pump();
    const { stars } = renderObjects();
    const uniforms = (stars.material as ShaderMaterial).uniforms;
    expect(uniforms.uCopyBounds.value.toArray()).toEqual([-2, -2, -1, -1]);
    expect(observeContent).toHaveBeenCalledWith(contentRoot, {
      childList: true,
      subtree: true,
    });

    const letter = new Surface(),
      text = new Surface();
    letter.left = 160;
    letter.top = 160;
    letter.clientWidth = 640;
    letter.clientHeight = 400;
    text.left = 80;
    text.top = 200;
    text.clientWidth = 320;
    text.clientHeight = 100;
    queries.set(".author-page .about-letter", letter);
    // The previous shell remains connected; the query must nevertheless refresh.
    quietSurfaces = [text];
    mutationCallback();
    mutationCallback();
    expect(frames.size).toBe(1);
    pump(2);
    const copyBounds = uniforms.uCopyBounds.value.toArray();
    [0.125, 0.3, 0.625, 0.8].forEach((value, index) =>
      expect(copyBounds[index]).toBeCloseTo(value, 8)
    );
    expect(uniforms.uQuietBoxes.value[0].toArray()).toEqual([
      0.0625, 0.625, 0.3125, 0.75,
    ]);
    expect(win.scrollY).toBe(0);
    expect(frames.size).toBe(0);
  });

  it("disconnects content observation and cancels queued layout reads on disposal", () => {
    scene.setPaused(true);
    pump();
    const rect = vi.spyOn(host, "getBoundingClientRect");
    mutationCallback();
    const queued = [...frames.values()];
    expect(queued).toHaveLength(1);
    scene.dispose();
    expect(disconnectContent).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    // Cover both a late observer callback and an already-delivered RAF callback.
    mutationCallback();
    queued.forEach(callback => callback(now));
    pump();
    expect(rect).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it("avoids per-frame layout reads but refreshes geometry on scroll", () => {
    const rect = vi.spyOn(host, "getBoundingClientRect");
    pump(30);
    expect(rect).not.toHaveBeenCalled();
    win.dispatchEvent(new Event("scroll"));
    expect(rect).toHaveBeenCalledTimes(1);
    rect.mockClear();
    pump(30);
    expect(rect).not.toHaveBeenCalled();
  });

  it("releases active input and resumes correctly after context loss", () => {
    beginDrag();
    const canvas = host.children[0];
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    expect(host.dataset.ready).toBe("false");
    expect(host.dataset.motion).toBe("paused");
    expect(controls.captures.size).toBe(0);
    expect(field().historyCount).toBe(0);
    canvas.dispatchEvent(new Event("webglcontextrestored"));
    pump();
    expect(host.dataset.ready).toBe("true");
    expect(host.dataset.motion).toBe("running");
    expect(host.dataset.inputActive).toBe("false");
  });

  it("removes owned resources, listeners, tuning hook and capture on disposal", () => {
    beginDrag();
    const geometryDispose = vi.spyOn(BufferGeometry.prototype, "dispose");
    const materialDispose = vi.spyOn(ShaderMaterial.prototype, "dispose");
    const data = field().textures.current as DataTexture;
    const textureDispose = vi.spyOn(data, "dispose");
    const remove = vi.spyOn(win, "removeEventListener");
    expect((window as any).__galaxyIntro).toBeDefined();
    scene.dispose();
    expect(geometryDispose).toHaveBeenCalled();
    expect(materialDispose).toHaveBeenCalled();
    expect(textureDispose).toHaveBeenCalledTimes(1);
    expect(controls.captures.size).toBe(0);
    expect(host.children).toHaveLength(0);
    expect(frames.size).toBe(0);
    expect((window as any).__galaxyIntro).toBeUndefined();
    for (const name of ["scroll", "resize", "pointermove", "blur"])
      expect(remove).toHaveBeenCalledWith(name, expect.any(Function));
  });

  it("respects reduced motion from initialization", () => {
    scene.dispose();
    scene = createGalaxy(host as unknown as HTMLElement, true, true);
    resizeCallback();
    pump(60);
    pointer(controls, "pointerdown", artwork()[0]);
    pump();
    expect(host.dataset.motion).toBe("paused");
    expect(Number(host.dataset.elapsed)).toBe(0);
    expect(host.dataset.inputActive).toBe("false");
    expect(controls.captures.size).toBe(0);
    expect(host.children).toHaveLength(1);
    expect(scene.getIntro()).toBe(1);
    scene.setPage("/about");
    scene.setPage("/");
    pump();
    expect(scene.getIntro()).toBe(1);
    expect(Number(host.dataset.elapsed)).toBe(0);
  });

  it("preserves a completed intro across navigation without adding a second canvas", () => {
    pump(200);
    expect(scene.getIntro()).toBe(1);
    for (const path of [
      "/post/neural-rendering-pipelines",
      "/algorithms",
      "/about",
      "/",
    ]) {
      scene.setPage(path);
      pump();
      expect(scene.getIntro()).toBe(1);
      expect(host.children).toHaveLength(1);
      expect(host.dataset.inputActive).toBe("false");
    }
  });

  it("freezes the current pose when navigation interrupts intro or another transition", () => {
    expect(scene.getIntro()).toBeLessThan(0.1);
    const { stars } = renderObjects();
    const uniforms = (stars.material as ShaderMaterial).uniforms;
    const initial = (
      (field().textures.base as DataTexture).image.data as Float32Array
    ).slice();
    scene.setPage("/about");
    expect(scene.getIntro()).toBe(1);
    expect(host.dataset.intro).toBe("1.000");
    expect(host.dataset.mode).toBe("author");
    expect(uniforms.uNavigationProgress.value).toBe(0);
    expect(uniforms.uNavigationFrom.value).toBeInstanceOf(DataTexture);
    const frozen = uniforms.uNavigationFrom.value.image.data as Float32Array;
    expect(frozen.every((value, index) => value === initial[index])).toBe(true);
    pump(3);
    expect(uniforms.uNavigationProgress.value).toBeGreaterThan(0);
    expect(uniforms.uNavigationProgress.value).toBeLessThan(1);
    const intermediate = (
      (field().textures.base as DataTexture).image.data as Float32Array
    ).slice();
    expect(intermediate.some((value, index) => value !== initial[index])).toBe(
      true
    );
    scene.setPage("/algorithms");
    expect(uniforms.uNavigationProgress.value).toBe(0);
    expect(
      (uniforms.uNavigationFrom.value.image.data as Float32Array).every(
        (value, index) => value === intermediate[index]
      )
    ).toBe(true);
    expect(scene.getIntro()).toBe(1);
  });

  it("keeps CSS containment on the persistent host", () => {
    expect((host.style as any).contain).toBe("strict");
    expect((host.style as any).transform).toBe("translateZ(0)");
    expect((controls.style as any).contain).toBe("layout paint size");
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
        x: ((i * 17) % 100) / 100,
        y: ((i * 31) % 100) / 100,
        z: ((i * 53) % 100) / 100,
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
    expect(calculateDustBrightness(1.0)).toBeCloseTo(2.0, 3);

    // Median r=0.5 -> 0.35 + 0.125 * 1.65 = 0.55625
    const median = calculateDustBrightness(0.5);
    expect(median).toBeCloseTo(0.55625, 3);
    expect(median).toBeLessThan(1.0); // Concentrated in dim tiers
  });

  it("calculates star brightness according to power-law distribution", () => {
    // Normal stars
    expect(calculateStarBrightness(0.0, false)).toBeCloseTo(0.4, 3);
    expect(calculateStarBrightness(1.0, false)).toBeCloseTo(3.0, 3);
    const mid = calculateStarBrightness(0.5, false);
    // Steep x^4.5 curve: the median star stays dim.
    expect(mid).toBeCloseTo(0.515, 2);

    // Clustered heart stars: [2.00, 2.60]
    expect(calculateStarBrightness(0.0, true)).toBeCloseTo(2.0, 3);
    expect(calculateStarBrightness(1.0, true)).toBeCloseTo(2.6, 3);
    expect(calculateStarBrightness(0.5, true)).toBeCloseTo(2.3, 3);
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
