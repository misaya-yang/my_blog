import { describe, expect, it } from "vitest";

import {
  getRouteScrollLocation,
  getRouteScrollStorageKey,
  getRouteScrollTarget,
  parseRouteScrollY,
  readSavedRouteScrollY,
  saveRouteScrollY,
  shouldPersistRouteScroll,
} from "./routeScrollRestoration";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe("route scroll restoration", () => {
  it("keeps query state for public list routes while ignoring hash targets", () => {
    expect(getRouteScrollLocation("/search?q=rlhf#results")).toBe(
      "/search?q=rlhf"
    );
    expect(getRouteScrollLocation("/tags/rlhf?page=2#posts")).toBe(
      "/tags/rlhf?page=2"
    );
    expect(getRouteScrollStorageKey("/archive?month=2026-07#timeline")).toBe(
      "misaya:route-scroll:v1:/archive?month=2026-07"
    );
  });

  it("persists only public, home, and reader route positions", () => {
    expect(shouldPersistRouteScroll("/")).toBe(true);
    expect(shouldPersistRouteScroll("/applications")).toBe(true);
    expect(shouldPersistRouteScroll("/post/agent-loop#method")).toBe(true);
    expect(shouldPersistRouteScroll("/manage")).toBe(false);
    expect(shouldPersistRouteScroll("/write/draft")).toBe(false);
    expect(shouldPersistRouteScroll("/login")).toBe(false);
    expect(shouldPersistRouteScroll("/unknown")).toBe(false);
  });

  it("stores and reads a bounded integer scroll value", () => {
    const storage = createStorage();

    expect(saveRouteScrollY("/search?q=agent", 421.8, storage)).toBe(true);
    expect(readSavedRouteScrollY("/search?q=agent#top", storage)).toBe(422);
    expect(saveRouteScrollY("/manage", 800, storage)).toBe(false);
    expect(readSavedRouteScrollY("/manage", storage)).toBeNull();
  });

  it("ignores invalid stored values", () => {
    expect(parseRouteScrollY(null)).toBeNull();
    expect(parseRouteScrollY("")).toBeNull();
    expect(parseRouteScrollY("-4")).toBeNull();
    expect(parseRouteScrollY("NaN")).toBeNull();
    expect(parseRouteScrollY("36.7")).toBe(37);
  });

  it("restores only history navigation and leaves hash routes alone", () => {
    expect(
      getRouteScrollTarget({
        location: "/search?q=rlhf",
        savedY: 640,
        isHistoryNavigation: true,
      })
    ).toBe(640);
    expect(
      getRouteScrollTarget({
        location: "/search?q=rlhf",
        savedY: 640,
        isHistoryNavigation: false,
      })
    ).toBe(0);
    expect(
      getRouteScrollTarget({
        location: "/post/agent-loop#method",
        savedY: 640,
        isHistoryNavigation: true,
      })
    ).toBeNull();
  });
});
