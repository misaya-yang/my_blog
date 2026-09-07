import { useEffect, useRef, type ReactNode } from "react";

/** Content remains visible if scripting, animation, or the observer is unavailable. */
export function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    let animation: Animation | undefined;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => {
      if (media.matches) animation?.cancel();
    };
    media.addEventListener("change", reduce);
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        if (media.matches) {
          observer.disconnect();
          return;
        }
        animation = element.animate(
          [
            { opacity: 0.35, transform: "translateY(16px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" }
        );
        observer.disconnect();
      },
      { threshold: 0.08 }
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      animation?.cancel();
      media.removeEventListener("change", reduce);
    };
  }, []);
  return <div ref={ref}>{children}</div>;
}
