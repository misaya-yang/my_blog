import { vi } from "vitest";

/**
 * Headless DOM Surface mock for WebGL canvas and UI host testing.
 */
export class MockSurface extends EventTarget {
  dataset: Record<string, string> = {};
  style = {
    opacity: "1",
    setProperty: vi.fn((key: string, val: string) => {
      (this.style as Record<string, unknown>)[key] = val;
    }),
  } as Record<string, unknown> & { opacity: string; setProperty: ReturnType<typeof vi.fn> };
  parentElement: MockSurface | null = null;
  children: MockSurface[] = [];
  clientWidth = 1280;
  clientHeight = 800;
  isConnected = true;
  captures = new Set<number>();
  setAttribute = vi.fn();
  className = "";
  id = "";

  constructor(width = 1280, height = 800) {
    super();
    this.clientWidth = width;
    this.clientHeight = height;
  }

  closest(selector: string): MockSurface | null {
    if (selector.includes("hero-controls") || selector.includes("public-universe")) {
      return this.parentElement || this;
    }
    return null;
  }

  querySelector(selector: string): MockSurface | null {
    if (selector.includes("hero-controls")) {
      return this;
    }
    return null;
  }

  querySelectorAll(selector: string): MockSurface[] {
    return [];
  }

  appendChild(child: MockSurface) {
    child.parentElement = this;
    this.children.push(child);
  }

  remove() {
    if (this.parentElement) {
      this.parentElement.children = this.parentElement.children.filter(
        x => x !== this
      );
    }
  }

  getBoundingClientRect() {
    return {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: this.clientWidth,
      bottom: this.clientHeight,
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

/**
 * WCAG 2.1 relative luminance calculation.
 * Input: RGB channels normalized to [0, 1].
 */
export function calculateLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * WCAG 2.1 contrast ratio calculation: (L1 + 0.05) / (L2 + 0.05).
 */
export function calculateContrastRatio(l1: number, l2: number): number {
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

/**
 * Hex color parser to normalized [r, g, b] in [0, 1].
 */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

/**
 * Helper to dispatch simulated PointerEvent on targets.
 */
export function dispatchPointerEvent(
  target: EventTarget,
  type: string,
  options: {
    clientX?: number;
    clientY?: number;
    buttons?: number;
    pointerId?: number;
    pointerType?: string;
    timeStamp?: number;
  } = {}
) {
  const event = new Event(type);
  Object.assign(event, {
    clientX: options.clientX ?? 0,
    clientY: options.clientY ?? 0,
    buttons: options.buttons ?? 0,
    button: options.buttons ? 0 : -1,
    pointerId: options.pointerId ?? 1,
    pointerType: options.pointerType ?? "mouse",
    isPrimary: true,
  });
  if (options.timeStamp !== undefined) {
    Object.defineProperty(event, "timeStamp", { value: options.timeStamp });
  }
  target.dispatchEvent(event);
  return event;
}
