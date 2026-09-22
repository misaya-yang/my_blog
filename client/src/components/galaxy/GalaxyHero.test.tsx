import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Node-only component lifecycle harness. The real component's asynchronous
// initialization runs; hook scheduling and the scene/GPU are test doubles.
const lifecycle = vi.hoisted(() => ({
  effects: [] as Array<() => void | (() => void)>,
  states: [] as unknown[],
  stateIndex: 0,
  createGalaxy: vi.fn(),
}));

vi.mock("react", async importOriginal => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useEffect: (effect: () => void | (() => void)) =>
      lifecycle.effects.push(effect),
    useRef: (current: unknown) => ({ current }),
    useState: (initial: unknown) => {
      const index = lifecycle.stateIndex++;
      if (!(index in lifecycle.states))
        lifecycle.states[index] =
          typeof initial === "function" ? initial() : initial;
      return [
        lifecycle.states[index],
        (value: unknown) => {
          lifecycle.states[index] =
            typeof value === "function"
              ? value(lifecycle.states[index])
              : value;
        },
      ];
    },
  };
});
vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "dark" }),
}));
vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en" }),
}));
vi.mock("wouter", () => ({ useLocation: () => ["/"] }));
vi.mock("./galaxyScene", () => ({ createGalaxy: lifecycle.createGalaxy }));

import { GalaxyHero } from "./GalaxyHero";

function findElement(
  node: React.ReactNode,
  className: string
): React.ReactElement<any> | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, className);
      if (match) return match;
    }
  } else if (
    React.isValidElement<{ className?: string; children?: React.ReactNode }>(
      node
    )
  ) {
    if (node.props.className === className) return node;
    return findElement(node.props.children, className);
  }
}

describe("GalaxyHero scene recreation", () => {
  let intersect: (entries: Array<{ isIntersecting: boolean }>) => void;
  let initialize: () => void;
  let cleanups: Array<() => void>;
  const render = () => {
    lifecycle.stateIndex = 0;
    return GalaxyHero();
  };

  beforeEach(() => {
    lifecycle.effects = [];
    // Models the retained React state after an earlier WebGL loss/failed load.
    lifecycle.states = [true];
    lifecycle.stateIndex = 0;
    lifecycle.createGalaxy.mockReset();
    cleanups = [];
    vi.stubGlobal("React", React);
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal("window", {
      requestIdleCallback: (callback: () => void) => {
        initialize = callback;
        return 1;
      },
      cancelIdleCallback: vi.fn(),
    });
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof intersect) {
          intersect = callback;
        }
        observe() {}
        disconnect() {}
      }
    );
  });
  afterEach(() => {
    cleanups.forEach(cleanup => cleanup());
    vi.unstubAllGlobals();
  });

  const mount = () => {
    const tree = render();
    const host = findElement(tree, "galaxy-scene")!;
    host.props.ref.current = new EventTarget();
    for (const effect of lifecycle.effects) {
      const cleanup = effect();
      if (cleanup) cleanups.push(cleanup);
    }
    intersect([{ isIntersecting: true }]);
    return tree;
  };

  it("clears a retained fallback after successful initialization and restores the pause control", async () => {
    const scene = {
      setPaused: vi.fn(),
      setTheme: vi.fn(),
      setPage: vi.fn(),
      dispose: vi.fn(),
    };
    lifecycle.createGalaxy.mockReturnValue(scene);
    expect(findElement(mount(), "galaxy-motion-toggle")).toBeUndefined();
    initialize();
    await vi.dynamicImportSettled();
    expect(scene.setPaused).toHaveBeenCalledWith(false);
    const tree = render();
    expect(findElement(tree, "galaxy-poster")!.props.src).toBeUndefined();
    expect(findElement(tree, "galaxy-motion-toggle")!.props["aria-label"]).toBe(
      "Pause particle animation"
    );
  });

  it("keeps fallback visible if replacement scene initialization fails", async () => {
    lifecycle.createGalaxy.mockImplementation(() => {
      throw new Error("WebGL unavailable");
    });
    mount();
    initialize();
    await vi.dynamicImportSettled();
    const tree = render();
    expect(findElement(tree, "galaxy-poster")!.props.src).toBe(
      "/images/rose-lvy-source.png"
    );
    expect(findElement(tree, "galaxy-motion-toggle")).toBeUndefined();
  });
});
