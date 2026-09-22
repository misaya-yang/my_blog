export type RenderQualityTier = 0 | 1 | 2;

export interface RenderQualityInput {
  devicePixelRatio: number;
  mobile: boolean;
  coarsePointer: boolean;
  light: boolean;
  /** Number of visible bright stars after the viewport's instance limit. */
  starCount: number;
}

export interface RenderQualityProfile {
  tier: RenderQualityTier;
  dpr: number;
  bloomEnabled: boolean;
  trailCount: number;
}

/** A scene-lifetime quality ceiling; resizing and theme changes cannot raise it. */
export class RenderQuality {
  private currentTier: RenderQualityTier = 0;

  get tier(): RenderQualityTier {
    return this.currentTier;
  }

  degrade(): boolean {
    if (this.currentTier === 2) return false;
    this.currentTier = this.currentTier === 0 ? 1 : 2;
    return true;
  }

  apply(input: RenderQualityInput): RenderQualityProfile {
    const cap =
      this.currentTier > 0
        ? 1
        : input.mobile && input.coarsePointer
          ? 1.25
          : 1.5;
    return {
      tier: this.currentTier,
      dpr: Math.min(input.devicePixelRatio, cap),
      bloomEnabled: !input.light && this.currentTier < 2,
      trailCount:
        this.currentTier === 2
          ? 0
          : Math.floor(input.starCount * (this.currentTier === 1 ? 0.5 : 1)),
    };
  }
}
