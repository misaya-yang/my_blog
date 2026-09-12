import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { Pause, Play } from "lucide-react";
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
  const [needsFallback, setNeedsFallback] = useState(false);
  const scene = useRef<ReturnType<typeof createGalaxy> | null>(null);
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
    if (!host.current) return;
    let cancelled = false;
    const surface = host.current;
    const showFallback = () => {
      if (!cancelled) setNeedsFallback(true);
    };
    const hideFallback = () => {
      if (!cancelled) setNeedsFallback(false);
    };
    surface.addEventListener("webglcontextlost", showFallback, true);
    surface.addEventListener("webglcontextrestored", hideFallback, true);
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let contentObserver: MutationObserver | undefined;
    const initialize = () => {
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
            scene.current.setPaused(pausedRef.current);
          } catch {
            showFallback();
          }
        })
        .catch(() => {
          showFallback();
        });
    };
    const schedule = () => {
      contentObserver?.disconnect();
      // Let critical text paint before compiling WebGL shaders on the main thread.
      if ("requestIdleCallback" in window)
        idle = window.requestIdleCallback(initialize, { timeout: 1500 });
      else timer = setTimeout(initialize, 100);
    };
    const waitForReading = () => {
      if (
        !pageRef.current.startsWith("/post/") ||
        document.querySelector(".article-prose h2, .article-prose p")
      ) {
        schedule();
      } else {
        contentObserver = new MutationObserver(() => {
          if (document.querySelector(".article-prose h2, .article-prose p")) {
            if (timer) clearTimeout(timer);
            schedule();
          }
        });
        contentObserver.observe(document.getElementById("root")!, {
          childList: true,
          subtree: true,
        });
        timer = setTimeout(schedule, 2500);
      }
    };
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        observer.disconnect();
        waitForReading();
      },
      { rootMargin: "200px" }
    );
    observer.observe(host.current);
    return () => {
      observer.disconnect();
      surface.removeEventListener("webglcontextlost", showFallback, true);
      surface.removeEventListener("webglcontextrestored", hideFallback, true);
      contentObserver?.disconnect();
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer) clearTimeout(timer);
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
  useEffect(() => {
    scene.current?.setPaused(paused);
  }, [paused]);
  return (
    <>
      <div
        className="galaxy-visual"
        data-page={page}
        role="group"
        aria-label={
          language === "zh" ? "交互玫瑰星场" : "Interactive rose field"
        }
      >
        <div className="galaxy-scene" ref={host} aria-hidden="true">
          <img
            className="galaxy-poster"
            src={needsFallback ? "/images/rose-lvy-source.png" : undefined}
            width="837"
            height="600"
            alt=""
            decoding="async"
            fetchPriority="low"
          />
        </div>
      </div>
      <span id="galaxy-keyboard-description" className="sr-only">
        {language === "zh"
          ? "方向键旋转，空格暂停或继续，Escape 恢复姿态。"
          : "Arrow keys rotate, Space pauses or resumes, Escape restores orientation."}
      </span>
      {!reduced && !needsFallback && (
        <button
          type="button"
          className="galaxy-motion-toggle"
          aria-label={
            language === "zh"
              ? paused
                ? "继续粒子动画"
                : "暂停粒子动画"
              : paused
                ? "Resume particle animation"
                : "Pause particle animation"
          }
          aria-describedby="galaxy-keyboard-description"
          aria-pressed={paused}
          onClick={() => setPaused(value => !value)}
          onKeyDown={event => {
            if (event.key.startsWith("Arrow") || event.key === "Escape") {
              scene.current?.handleKey(event.nativeEvent);
            }
          }}
        >
          {paused ? (
            <Play size={15} aria-hidden="true" />
          ) : (
            <Pause size={15} aria-hidden="true" />
          )}
        </button>
      )}
    </>
  );
}
