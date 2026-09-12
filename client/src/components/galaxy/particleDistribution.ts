const TAU = Math.PI * 2;

/** Broad, asymmetric concentrations separated by airy stretches; never an empty gap. */
export function ribbonDensity(track: number, phase: number) {
  const angle = phase * TAU;
  const field =
    0.5 +
    0.28 * Math.sin(angle * 2 + track * 2.13) +
    0.15 * Math.cos(angle * 3 - track * 1.31) +
    0.07 * Math.sin(angle * 7 + track * 0.73);
  return 0.12 + 0.88 * field ** 1.6;
}

export function ribbonWidth(track: number, phase: number) {
  const angle = phase * TAU;
  return (
    0.45 +
    1.15 * (0.5 + 0.5 * Math.sin(angle * 3 + track * 1.71)) ** 2 +
    0.25 * (0.5 + 0.5 * Math.cos(angle * 5 - track * 0.91))
  );
}

/** Inverse CDF preserves particle identity and continuous, constant-speed circulation. */
export function createPhaseSampler(track: number, luminous = false) {
  const steps = 512;
  const cdf = [0];
  for (let i = 0; i < steps; i++) {
    const density = ribbonDensity(track, (i + 0.5) / steps);
    cdf.push(cdf[i] + (luminous ? 0.3 + density * 0.7 : density));
  }
  const total = cdf[steps];
  return (quantile: number) => {
    const target = Math.max(0, Math.min(1, quantile)) * total;
    let low = 0,
      high = steps;
    while (high - low > 1) {
      const middle = (low + high) >>> 1;
      if (cdf[middle] <= target) low = middle;
      else high = middle;
    }
    return (low + (target - cdf[low]) / (cdf[high] - cdf[low])) / steps;
  };
}
