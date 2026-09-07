import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import type { createGalaxy } from "./galaxyScene";

export function GalaxyHero() {
  const [page] = useLocation();
  const pageRef = useRef(page);
  pageRef.current = page;
  const { theme } = useTheme();
  const { language } = useLanguage();
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createGalaxy> | null>(null);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!host.current) return;
    let cancelled = false;
    // Public routes share this renderer; route changes update its composition.
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        import("./galaxyScene")
          .then(({ createGalaxy }) => {
            if (cancelled || !host.current) return;
            try {
              scene.current = createGalaxy(
                host.current,
                themeRef.current === "light",
                reduced,
                pageRef.current
              );
            } catch {
              /* The static scene remains visible if WebGL is unavailable. */
            }
          })
          .catch(() => {
            /* Retain the static scene on a failed chunk request. */
          });
      },
      { rootMargin: "200px" }
    );
    observer.observe(host.current);
    return () => {
      observer.disconnect();
      cancelled = true;
      scene.current?.dispose();
      scene.current = null;
    };
  }, [reduced]);
  useEffect(() => {
    scene.current?.setTheme(theme === "light");
  }, [theme]);
  useEffect(() => {
    scene.current?.setPage(page);
  }, [page]);
  return (
    <>
      <div
        className="galaxy-visual"
        data-page={page}
        role="group"
        tabIndex={reduced ? undefined : 0}
        aria-label={
          language === "zh"
            ? "交互星系：拖动可 360 度旋转，方向键旋转，空格暂停或继续，Esc 复位"
            : "Interactive galaxy: drag for 360-degree rotation or use arrow keys, Space to pause or resume, Escape to reset"
        }
      >
        <div className="galaxy-scene" ref={host} aria-hidden="true">
          <img
            className="galaxy-poster"
            src={
              theme === "light"
                ? "/images/galaxy-poster-light.svg"
                : "/images/galaxy-poster.png"
            }
            width="837"
            height="600"
            alt=""
          />
        </div>
      </div>
      <span className="galaxy-keyboard-hint" aria-hidden="true">
        {language === "zh"
          ? "方向键旋转 · 空格暂停 · Esc 复位"
          : "Arrows to rotate · Space to pause · Esc to reset"}
      </span>
    </>
  );
}
