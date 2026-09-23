export type RenderQualityTier = 0 | 1 | 2;

export interface RenderQualityInput {
  devicePixelRatio: number;
  mobile: boolean;
  coarsePointer: boolean;
  light: boolean;
  /** Reading pages sit behind text: a softer, cheaper canvas is invisible. */
  reading?: boolean;
  /** Number of visible bright stars after the viewport's instance limit. */
  starCount: number;
}

export interface RenderQualityProfile {
  tier: RenderQualityTier;
  dpr: number;
  bloomEnabled: boolean;
  trailCount: number;
}

/** Discrete render scales; each change reallocates targets, so few steps. */
export const RENDER_SCALES = [1, 0.85, 0.7, 0.55] as const;

const SLOW_RATIO = 1.25;
const FAST_RATIO = 1.08;
const SLOW_WINDOW_MS = 900;
const MIN_CHANGE_GAP_MS = 2000;
const BASE_RECOVERY_MS = 4000;
const MAX_RECOVERY_MS = 60000;

/**
 * Adaptive quality. Resolution is the first lever: frame time that stays over
 * budget lowers the render scale, sustained headroom raises it again. Each
 * change needs a gap, and an upgrade that is quickly undone doubles the wait
 * before the next attempt, so the scale settles instead of oscillating.
 * Only when the smallest scale is still too slow do trails and then bloom go.
 */
export class RenderQuality {
  private currentTier: RenderQualityTier = 0;
  private scaleIndex = 0;
  private averageMs = 0;
  private slowSince = -1;
  private fastSince = -1;
  private lastChange = -Infinity;
  private lastObserved = -Infinity;
  private lastUpgrade = -Infinity;
  private recoveryMs = BASE_RECOVERY_MS;

  get tier(): RenderQualityTier {
    return this.currentTier;
  }

  get scale(): number {
    return RENDER_SCALES[this.scaleIndex];
  }

  /** Steps down one level: resolution first, then trails, then bloom. */
  degrade(): boolean {
    if (this.scaleIndex < RENDER_SCALES.length - 1) {
      this.scaleIndex++;
      return true;
    }
    if (this.currentTier === 2) return false;
    this.currentTier = this.currentTier === 0 ? 1 : 2;
    return true;
  }

  private upgrade(): boolean {
    if (this.currentTier > 0) {
      this.currentTier = this.currentTier === 2 ? 1 : 0;
      return true;
    }
    if (this.scaleIndex === 0) return false;
    this.scaleIndex--;
    return true;
  }

  /**
   * Feeds one frame interval measured against the frame budget.
   * Returns true when the profile changed and should be re-applied.
   */
  observe(frameMs: number, budgetMs: number, now: number): boolean {
    // Ignore stalls from tab switches or debugger pauses, and forget windows
    // that were interrupted: a paused loop says nothing about current load.
    const resumed = now - this.lastObserved > 250;
    this.lastObserved = now;
    if (frameMs > 250) return false;
    if (resumed) {
      this.slowSince = this.fastSince = -1;
      this.averageMs = 0;
    }
    this.averageMs = this.averageMs
      ? this.averageMs + (frameMs - this.averageMs) * 0.08
      : frameMs;
    const slow = this.averageMs > budgetMs * SLOW_RATIO;
    const fast = this.averageMs < budgetMs * FAST_RATIO;
    this.slowSince = slow ? (this.slowSince < 0 ? now : this.slowSince) : -1;
    this.fastSince = fast ? (this.fastSince < 0 ? now : this.fastSince) : -1;
    if (now - this.lastChange < MIN_CHANGE_GAP_MS) return false;

    if (slow && now - this.slowSince >= SLOW_WINDOW_MS) {
      if (!this.degrade()) return false;
      if (now - this.lastUpgrade < MIN_CHANGE_GAP_MS * 2)
        this.recoveryMs = Math.min(MAX_RECOVERY_MS, this.recoveryMs * 2);
      this.markChange(now);
      return true;
    }
    if (fast && now - this.fastSince >= this.recoveryMs) {
      if (!this.upgrade()) return false;
      this.lastUpgrade = now;
      this.markChange(now);
      return true;
    }
    return false;
  }

  private markChange(now: number) {
    this.lastChange = now;
    this.slowSince = this.fastSince = -1;
    // Frames right after a reallocation are not representative.
    this.averageMs = 0;
  }

  apply(input: RenderQualityInput): RenderQualityProfile {
    const cap = input.reading
      ? 1
      : input.mobile && input.coarsePointer
        ? 1.25
        : 1.5;
    return {
      tier: this.currentTier,
      dpr:
        Math.round(Math.min(input.devicePixelRatio, cap) * this.scale * 100) /
        100,
      bloomEnabled: this.currentTier < 2,
      trailCount:
        this.currentTier === 2 || input.reading
          ? 0
          : Math.floor(input.starCount * (this.currentTier === 1 ? 0.5 : 1)),
    };
  }
}
