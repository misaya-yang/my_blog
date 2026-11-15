import { useCallback } from "react";
import type { BaseLocationHook } from "wouter";
import { useBrowserLocation } from "wouter/use-browser-location";
import { preloadPage } from "@/routePages";

/**
 * Changing pages in three beats: the page being left dims while the next
 * one is fetched, fades as the routes swap, and the new page's blocks rise
 * into place (styles/page-flow.css).
 * The header and the star field are never part of it, so they hold still
 * while everything else changes.
 */

/** The page being left dims for at least this long: a visible answer. */
const HOLD_MIN_MS = 110;
/**
 * ...and for at most this long while the next page's code and content load.
 * Past this a held page reads as a stalled click, so the routes swap and the
 * new page shows its own loading state.
 */
const HOLD_MAX_MS = 380;
/** Then it fades out, and the routes swap. */
const LEAVE_MS = 120;

const dataReady = new Map<string, Promise<unknown>>();
type DataPrefetcher = (pathname: string) => Promise<unknown> | void;
let prefetchData: DataPrefetcher | null = null;

/**
 * Lets the app say how to fetch a page's data ahead of going there. Kept as
 * a hook-up, not an import, so this module knows nothing about the API.
 */
export function setRouteDataPrefetcher(prefetch: DataPrefetcher) {
  prefetchData = prefetch;
  return () => {
    if (prefetchData === prefetch) prefetchData = null;
  };
}

/**
 * Starts loading the code for a route, once; with `data`, its content too,
 * so the page arrives whole instead of through a loading state. Resolves
 * when what was asked for is in hand (or has failed: the page itself will
 * ask again and say so).
 */
export function preloadRoute(to: string, data = false): Promise<unknown> {
  let pathname: string;
  try {
    pathname = new URL(to, location.href).pathname;
  } catch {
    return Promise.resolve();
  }
  const waits: Promise<unknown>[] = [preloadPage(pathname)];
  if (data && prefetchData) {
    let content = dataReady.get(pathname);
    if (!content) {
      content = Promise.resolve(prefetchData(pathname)).catch(() => {});
      dataReady.set(pathname, content);
      // The query cache decides how long an answer stays fresh; this only
      // keeps one hover from asking twice in a row.
      window.setTimeout(() => dataReady.delete(pathname), 30_000);
    }
    waits.push(content);
  }
  return Promise.all(waits);
}

/** Whether going to `to` leaves the current page, not just its hash or query. */
function leavesPage(to: string) {
  try {
    const next = new URL(to, location.href);
    return (
      next.origin === location.origin && next.pathname !== location.pathname
    );
  } catch {
    return false;
  }
}

let pending: (() => void) | null = null;
let staging = false;
const wait = (ms: number) =>
  new Promise<void>(resolve => window.setTimeout(resolve, ms));

/**
 * Runs a navigation once the destination is ready to be shown. The current
 * page dims at once and stays until the next one's code and content are in
 * hand (never long), then fades as the routes swap. A second navigation in
 * the meantime replaces the first: the latest destination wins.
 */
export function stageNavigation(to: string, go: () => void) {
  const root = document.documentElement;
  const still =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  if (
    still ||
    document.hidden ||
    !leavesPage(to) ||
    !document.querySelector(".public-universe")
  ) {
    go();
    return;
  }
  const ready = preloadRoute(to, true);
  pending = go;
  if (staging) return;
  staging = true;
  root.dataset.routePhase = "pending";
  void Promise.race([
    Promise.all([ready, wait(HOLD_MIN_MS)]),
    wait(HOLD_MAX_MS),
  ])
    .then(() => {
      root.dataset.routePhase = "leave";
      return wait(LEAVE_MS);
    })
    .then(() => {
      staging = false;
      const run = pending;
      pending = null;
      // From the first move between pages on, new pages make an entrance.
      // The first page of a visit never does: it should simply be there.
      root.dataset.routeNav = "true";
      run?.();
      // Two frames: the new page has mounted and painted its first frame.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!staging) delete root.dataset.routePhase;
        })
      );
    });
}

if (typeof window !== "undefined") {
  // Back and forward cannot be held back, but the page they land on still
  // makes its entrance.
  window.addEventListener("popstate", () => {
    document.documentElement.dataset.routeNav = "true";
  });
  // Pointing at a link is intent enough to fetch the code it leads to;
  // resting on it, pressing it or focusing it fetches the content as well.
  const linkOf = (event: Event) => {
    const target = event.target as Element | null;
    const href = target?.closest?.("a[href]")?.getAttribute("href");
    return href?.startsWith("/") ? href : null;
  };
  let dwell = 0;
  document.addEventListener(
    "pointerover",
    event => {
      window.clearTimeout(dwell);
      const href = linkOf(event);
      if (!href) return;
      preloadRoute(href);
      dwell = window.setTimeout(() => preloadRoute(href, true), 90);
    },
    { passive: true }
  );
  const commit = (event: Event) => {
    const href = linkOf(event);
    if (href) preloadRoute(href, true);
  };
  document.addEventListener("pointerdown", commit, { passive: true });
  document.addEventListener("touchstart", commit, { passive: true });
  document.addEventListener("focusin", commit);
}

/** The browser location, with navigations staged through the leave fade. */
export const useStagedLocation: BaseLocationHook = (...options) => {
  const [path, navigate] = useBrowserLocation(
    ...(options as Parameters<typeof useBrowserLocation>)
  );
  const staged = useCallback(
    (...args: Parameters<typeof navigate>) =>
      stageNavigation(String(args[0]), () => navigate(...args)),
    [navigate]
  );
  return [path, staged];
};
