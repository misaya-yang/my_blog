import { useEffect, useRef } from "react";
import {
  classifyProductRoute,
  normalizeRoutePathname,
} from "@shared/route-contract";

const ROUTE_SCROLL_STORAGE_PREFIX = "misaya:route-scroll:v1:";

type RouteScrollStorage = Pick<Storage, "getItem" | "setItem">;

export function getRouteScrollLocation(location: string) {
  return location.split("#", 1)[0] || "/";
}

export function getCurrentBrowserRouteLocation(fallbackLocation: string) {
  if (typeof window === "undefined") return fallbackLocation;
  const currentLocation = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (!currentLocation) return fallbackLocation;

  return normalizeRoutePathname(currentLocation) ===
    normalizeRoutePathname(fallbackLocation)
    ? currentLocation
    : fallbackLocation;
}

export function getRouteScrollStorageKey(location: string) {
  return `${ROUTE_SCROLL_STORAGE_PREFIX}${getRouteScrollLocation(location)}`;
}

export function shouldPersistRouteScroll(location: string) {
  const { kind, known } = classifyProductRoute(location);
  return known && (kind === "home" || kind === "public" || kind === "reader");
}

export function parseRouteScrollY(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed);
}

export function readSavedRouteScrollY(
  location: string,
  storage = getRouteScrollStorage()
) {
  if (!storage || !shouldPersistRouteScroll(location)) return null;

  try {
    return parseRouteScrollY(storage.getItem(getRouteScrollStorageKey(location)));
  } catch {
    return null;
  }
}

export function saveRouteScrollY(
  location: string,
  scrollY: number,
  storage = getRouteScrollStorage()
) {
  if (!storage || !shouldPersistRouteScroll(location)) return false;

  try {
    storage.setItem(
      getRouteScrollStorageKey(location),
      String(Math.max(0, Math.round(scrollY)))
    );
    return true;
  } catch {
    return false;
  }
}

export function getRouteScrollTarget({
  location,
  savedY,
  isHistoryNavigation,
}: {
  location: string;
  savedY: number | null;
  isHistoryNavigation: boolean;
}) {
  if (location.includes("#")) return null;
  if (isHistoryNavigation && typeof savedY === "number") return savedY;
  return 0;
}

export function usePublicRouteScrollRestoration(location: string) {
  const didScrollMount = useRef(false);
  const isHistoryNavigation = useRef(false);
  const preNavigationSavedRoute = useRef<string | null>(null);
  const routeScrollLocation = getCurrentBrowserRouteLocation(location);

  useEffect(() => {
    const restoreCurrentRouteScroll = () => {
      const currentLocation = getWindowRouteLocation();
      const targetY = getRouteScrollTarget({
        location: currentLocation,
        savedY: readSavedRouteScrollY(currentLocation),
        isHistoryNavigation: true,
      });
      if (targetY !== null) scrollToRouteTarget(targetY);
    };
    const handlePopState = () => {
      isHistoryNavigation.current = true;
      window.setTimeout(restoreCurrentRouteScroll, 180);
    };
    const saveCurrentRouteScroll = () => {
      const currentLocation = getWindowRouteLocation();
      if (saveRouteScrollY(currentLocation, window.scrollY)) {
        preNavigationSavedRoute.current =
          getRouteScrollLocation(currentLocation);
      }
    };
    const handleClick = (event: MouseEvent) => {
      if (!isPlainPrimaryClick(event)) return;

      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || (anchor.target && anchor.target !== "_self")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const nextUrl = new URL(href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;

      const currentLocation = getWindowRouteLocation();
      const nextLocation = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
      if (nextLocation !== currentLocation) saveCurrentRouteScroll();
    };
    const previousScrollRestoration = window.history.scrollRestoration;

    window.history.scrollRestoration = "manual";
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("pagehide", saveCurrentRouteScroll);

    const navigationEntry = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming | undefined;
    if (navigationEntry?.type === "back_forward") {
      window.setTimeout(restoreCurrentRouteScroll, 180);
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("pagehide", saveCurrentRouteScroll);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    return () => {
      const routeKey = getRouteScrollLocation(routeScrollLocation);
      if (preNavigationSavedRoute.current === routeKey) {
        preNavigationSavedRoute.current = null;
        return;
      }

      saveRouteScrollY(routeScrollLocation, window.scrollY);
    };
  }, [routeScrollLocation]);

  useEffect(() => {
    if (!didScrollMount.current) {
      didScrollMount.current = true;
      return;
    }

    const targetY = getRouteScrollTarget({
      location: routeScrollLocation,
      savedY: readSavedRouteScrollY(routeScrollLocation),
      isHistoryNavigation: isHistoryNavigation.current,
    });
    isHistoryNavigation.current = false;

    if (targetY === null) return;

    const frame = window.requestAnimationFrame(() =>
      scrollToRouteTarget(targetY)
    );
    return () => window.cancelAnimationFrame(frame);
  }, [routeScrollLocation]);
}

function getRouteScrollStorage(): RouteScrollStorage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage ?? null;
}

function getWindowRouteLocation() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function isPlainPrimaryClick(event: MouseEvent) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey
  );
}

function scrollToRouteTarget(targetY: number) {
  const scrollToTarget = () => {
    window.scrollTo({
      top: targetY,
      left: 0,
      behavior: "auto",
    });
  };

  scrollToTarget();
  if (targetY > 0) {
    window.setTimeout(scrollToTarget, 180);
    window.setTimeout(scrollToTarget, 360);
  }
}
