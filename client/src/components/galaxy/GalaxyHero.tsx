import { useEffect, useRef, useState } from "react";
import type { createGalaxy } from "./galaxyScene";

export function GalaxyHero() {
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
    if (reduced || !host.current) return;
    let cancelled = false;
    // Three.js is fetched only on the homepage, after the accessible static scene.
    import("./galaxyScene")
      .then(({ createGalaxy }) => {
        if (cancelled || !host.current) return;
        try {
          scene.current = createGalaxy(host.current);
        } catch {
          /* The static scene remains visible if WebGL is unavailable. */
        }
      })
      .catch(() => {
        /* Retain the static scene on a failed chunk request. */
      });
    return () => {
      cancelled = true;
      scene.current?.dispose();
      scene.current = null;
    };
  }, [reduced]);
  return (
    <div className="galaxy-visual">
      <div className="galaxy-scene" ref={host} aria-hidden="true">
        <img
          className="galaxy-poster"
          src="/images/galaxy-poster.png"
          width="837"
          height="600"
          alt=""
        />
      </div>
    </div>
  );
}
