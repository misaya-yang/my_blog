import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import type { StarfieldHandle } from "./scene";

/**
 * The site's sky: one fixed canvas behind every public page. Pages say where
 * their figure goes with a `data-rose-anchor` box; this component only owns
 * the canvas's life and the controls that go with it.
 */
export function Starfield() {
  const [page] = useLocation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const zh = language === "zh";
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<StarfieldHandle | null>(null);
  const pageRef = useRef(page);
  pageRef.current = page;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const [fallback, setFallback] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const [reduced, setReduced] = useState(
    () =>
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const surface = host.current;
    if (!surface) return;
    let cancelled = false;
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const lost = () => !cancelled && setFallback(true);
    const restored = () => !cancelled && setFallback(false);
    surface.addEventListener("webglcontextlost", lost, true);
    surface.addEventListener("webglcontextrestored", restored, true);
    const start = () => {
      import("./scene")
        .then(({ createStarfield }) => {
          if (cancelled || !host.current) return;
          try {
            scene.current = createStarfield(host.current, {
              light: themeRef.current === "light",
              reducedMotion: reduced,
              page: pageRef.current,
            });
            scene.current.setPaused(pausedRef.current);
            setFallback(false);
          } catch {
            setFallback(true);
          }
        })
        .catch(() => !cancelled && setFallback(true));
    };
    // Text paints first; shaders compile once the main thread is free.
    if ("requestIdleCallback" in window)
      idle = window.requestIdleCallback(start, { timeout: 1200 });
    else timer = setTimeout(start, 80);
    return () => {
      cancelled = true;
      surface.removeEventListener("webglcontextlost", lost, true);
      surface.removeEventListener("webglcontextrestored", restored, true);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer) clearTimeout(timer);
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
  useEffect(() => {
    scene.current?.setPaused(paused);
  }, [paused]);

  return (
    <>
      <div
        className="starfield"
        ref={host}
        aria-hidden="true"
        data-fallback={fallback || undefined}
      />
      <span id="starfield-keys" className="sr-only">
        {zh
          ? "方向键转动玫瑰，Escape 恢复姿态。"
          : "Arrow keys turn the rose, Escape restores its pose."}
      </span>
      {!reduced && !fallback && (
        <button
          type="button"
          className="starfield-toggle"
          aria-label={
            zh
              ? paused
                ? "继续星场动画"
                : "暂停星场动画"
              : paused
                ? "Resume star field motion"
                : "Pause star field motion"
          }
          aria-describedby="starfield-keys"
          aria-pressed={paused}
          onClick={() => setPaused(value => !value)}
          onKeyDown={event => {
            if (event.key.startsWith("Arrow") || event.key === "Escape")
              scene.current?.handleKey(event.nativeEvent);
          }}
        >
          {paused ? (
            <Play size={14} aria-hidden="true" />
          ) : (
            <Pause size={14} aria-hidden="true" />
          )}
        </button>
      )}
    </>
  );
}
