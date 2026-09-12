const smoothRange = (from: number, to: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

export interface MotionState {
  approach: number;
  expansion: number;
  copyOpacity: number;
  copyY: number;
  split: number;
}

export const sharedMotionState: MotionState = {
  approach: 0,
  expansion: 0,
  copyOpacity: 0,
  copyY: 0,
  split: 0,
};

/** A reversible scroll sequence, independent of scrolling direction and elapsed time. */
export function getScrollMotion(
  progress: number,
  gather = 0,
  target?: MotionState
): MotionState {
  const res = target ?? {
    approach: 0,
    expansion: 0,
    copyOpacity: 0,
    copyY: 0,
    split: 0,
  };
  res.approach = smoothRange(0, 0.35, progress);
  res.expansion = smoothRange(0.15, 0.95, progress);
  res.copyOpacity = 1 - smoothRange(0.78, 1, progress);
  res.copyY = -32 * smoothRange(0.02, 0.5, progress);
  res.split =
    smoothRange(0.12, 0.92, progress) *
    (1 - Math.max(0, Math.min(1, gather)));
  return res;
}
