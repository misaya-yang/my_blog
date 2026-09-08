/** Local tangents keep ambient motion on the source strokes instead of rotating them. */
export function createContourFlow(points: readonly number[]): Float32Array {
  const cell = 0.16;
  const bins = new Map<string, number[]>();
  const key = (x: number, y: number) => `${x},${y}`;
  for (let i = 0; i < points.length; i += 2) {
    const k = key(
      Math.floor(points[i] / cell),
      Math.floor(points[i + 1] / cell)
    );
    const bin = bins.get(k) ?? [];
    bin.push(i);
    bins.set(k, bin);
  }
  const flow = new Float32Array(points.length);
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i],
      y = points[i + 1];
    const bx = Math.floor(x / cell),
      by = Math.floor(y / cell);
    let xx = 0,
      xy = 0,
      yy = 0,
      count = 0;
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        for (const j of bins.get(key(bx + dx, by + dy)) ?? []) {
          const vx = points[j] - x,
            vy = points[j + 1] - y;
          if (j === i || vx * vx + vy * vy > cell * cell) continue;
          xx += vx * vx;
          xy += vx * vy;
          yy += vy * vy;
          count++;
        }
      }
    if (count < 2) continue;
    const angle = Math.atan2(2 * xy, xx - yy) / 2;
    let tx = Math.cos(angle),
      ty = Math.sin(angle);
    const signature = Math.abs(x) < 0.65 && Math.abs(y) < 0.7;
    if ((signature ? ty : tx * -y + ty * x) < 0) {
      tx = -tx;
      ty = -ty;
    }
    const distance = signature ? 0.045 : 0.08;
    flow[i] = tx * distance;
    flow[i + 1] = ty * distance;
  }
  return flow;
}
