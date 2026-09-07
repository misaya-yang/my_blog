import { useEffect } from "react";

/** Restore public reading positions after lazy routes mount, using Wouter's history events. */
export function ScrollRestoration() {
  useEffect(() => {
    const positions = new Map<string, number>();
    const previousMode = history.scrollRestoration;
    history.scrollRestoration = "manual";
    let current = location.href;
    let restoring = false;
    let stopRestore = () => {};
    const remember = () => {
      if (!restoring) positions.set(current, window.scrollY);
    };
    const navigate = (event: Event) => {
      const next = location.href;
      if (next === current && event.type !== "initial") return;
      const oldPath = new URL(current).pathname;
      current = next;
      stopRestore();
      // Native hash navigation and the article TOC already position their own targets.
      if (
        oldPath === location.pathname &&
        event.type !== "popstate" &&
        event.type !== "initial"
      )
        return;
      const saved = event.type === "popstate" ? positions.get(next) : undefined;
      restoring = true;
      let frame = 0;
      const observer = new MutationObserver(() => schedule());
      const resize = new ResizeObserver(() => schedule());
      const timer = window.setTimeout(() => stopRestore(), 5000);
      stopRestore = () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
        observer.disconnect();
        resize.disconnect();
        restoring = false;
      };
      function restore() {
        frame = 0;
        if (
          document.querySelector(
            ".route-loading-page, .article-loading-surface, .observatory-loading"
          )
        )
          return;
        let anchor: HTMLElement | null = null;
        try {
          anchor = document.getElementById(
            decodeURIComponent(location.hash.slice(1))
          );
        } catch {
          /* Invalid URL escapes have no anchor. */
        }
        const top =
          saved ??
          (anchor ? anchor.getBoundingClientRect().top + scrollY - 90 : 0);
        if (document.documentElement.scrollHeight - innerHeight < top) return;
        window.scrollTo({ top, behavior: "instant" });
        stopRestore();
      }
      function schedule() {
        if (!frame) frame = requestAnimationFrame(restore);
      }
      observer.observe(document.getElementById("root")!, {
        childList: true,
        subtree: true,
      });
      resize.observe(document.getElementById("root")!);
      schedule();
    };
    const cancel = () => stopRestore();
    const cancelOnKey = (event: KeyboardEvent) => {
      if (
        [
          "ArrowDown",
          "ArrowUp",
          "PageDown",
          "PageUp",
          "Home",
          "End",
          " ",
        ].includes(event.key)
      )
        cancel();
    };
    window.addEventListener("scroll", remember, { passive: true });
    document.addEventListener("click", remember, true);
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", cancelOnKey);
    const events = ["pushState", "replaceState", "popstate", "hashchange"];
    events.forEach(type => window.addEventListener(type, navigate));
    if (location.hash) navigate(new Event("initial"));
    return () => {
      stopRestore();
      history.scrollRestoration = previousMode;
      window.removeEventListener("scroll", remember);
      document.removeEventListener("click", remember, true);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", cancelOnKey);
      events.forEach(type => window.removeEventListener(type, navigate));
    };
  }, []);
  return null;
}
