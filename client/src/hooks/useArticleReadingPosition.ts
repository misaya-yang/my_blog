import { useEffect, useState } from "react";

/** Last heading above the reading line, including long gaps and skipped sections. */
export function headingAtPosition(offsets: number[], position: number) {
  let low = 0;
  let high = offsets.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (offsets[middle] <= position) low = middle + 1;
    else high = middle;
  }
  return Math.max(0, low - 1);
}

export function useArticleReadingPosition(headings: { id: string }[]) {
  const [active, setActive] = useState("");
  useEffect(() => {
    if (!headings.length) {
      setActive("");
      return;
    }
    let elements: HTMLElement[] = [];
    let offsets: number[] = [];
    let frame = 0;
    let disposed = false;
    let layoutDirty = true;
    let pendingHash = true;
    const update = () => {
      frame = 0;
      if (layoutDirty) {
        elements = headings.flatMap(({ id }) => {
          const element = document.getElementById(id);
          return element ? [element] : [];
        });
        offsets = elements.map(
          element => element.getBoundingClientRect().top + window.scrollY
        );
        layoutDirty = false;
      }
      if (!elements.length) return;
      if (pendingHash) {
        pendingHash = false;
        try {
          const id = decodeURIComponent(location.hash.slice(1));
          const target = elements.find(element => element.id === id);
          target?.scrollIntoView({ block: "start", behavior: "auto" });
        } catch {
          /* An invalid fragment must not prevent reading. */
        }
      }
      const readingLine = Math.min(180, Math.max(128, innerHeight * 0.18));
      setActive(elements[headingAtPosition(offsets, scrollY + readingLine)].id);
    };
    const schedule = () => {
      if (!frame && !disposed) frame = requestAnimationFrame(update);
    };
    const measure = () => {
      layoutDirty = true;
      schedule();
    };
    const article =
      document.querySelector(".paper-reader-main") ?? document.body;
    const resize = new ResizeObserver(measure);
    resize.observe(article);
    // Markdown is lazy loaded. The TOC exists before the actual heading nodes.
    const mount = new MutationObserver(measure);
    mount.observe(article, { childList: true, subtree: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    const restoreHash = () => {
      pendingHash = true;
      schedule();
    };
    window.addEventListener("hashchange", restoreHash);
    document.fonts.ready.then(() => {
      if (!disposed) measure();
    });
    schedule();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      mount.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      window.removeEventListener("hashchange", restoreHash);
    };
  }, [headings]);
  return active;
}
