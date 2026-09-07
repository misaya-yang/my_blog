const smoothRange = (from: number, to: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

/** A reversible scroll sequence, independent of scrolling direction and elapsed time. */
export function getScrollMotion(progress: number, gather = 0) {
  return {
    approach: smoothRange(0, 0.35, progress),
    expansion: smoothRange(0.15, 0.95, progress),
    copyOpacity: 1 - smoothRange(0.78, 1, progress),
    copyY: -32 * smoothRange(0.02, 0.5, progress),
    split:
      smoothRange(0.12, 0.92, progress) *
      (1 - Math.max(0, Math.min(1, gather))),
  };
}
