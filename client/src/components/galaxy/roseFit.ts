export interface RoseFitView {
  /** Canvas size in CSS pixels. */
  width: number;
  height: number;
  /** Vertical field of view in degrees. */
  fov: number;
  /** Camera distance to the group's origin plane. */
  distance: number;
}

export interface RoseFitRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface RoseFit {
  scale: number;
  x: number;
  y: number;
}

/**
 * Places the rose so its projected outline fills a pixel rectangle. The points
 * are the petal contours already rotated into the home orientation; the fit
 * includes perspective, so near petals that project larger are measured as
 * they are drawn rather than by a hand-tuned world size.
 */
export function fitRose(
  points: Float32Array,
  view: RoseFitView,
  rect: RoseFitRect,
  maxScale = 1,
  target: RoseFit = { scale: 1, x: 0, y: 0 }
): RoseFit {
  const f = 1 / Math.tan((view.fov * Math.PI) / 360);
  const aspect = view.width / Math.max(1, view.height);
  const d = view.distance;
  const rectWidth = Math.max(1, rect.right - rect.left);
  const rectHeight = Math.max(1, rect.bottom - rect.top);
  let scale = Math.min(1, maxScale);
  let x = 0;
  let y = 0;
  let minX = 0,
    maxX = 0,
    minY = 0,
    maxY = 0;
  const measure = () => {
    minX = minY = Infinity;
    maxX = maxY = -Infinity;
    for (let i = 0; i < points.length; i += 3) {
      const depth = Math.max(0.5, d - scale * points[i + 2]);
      const px =
        (((x + scale * points[i]) * f) / (aspect * depth) + 1) *
        0.5 *
        view.width;
      const py =
        (1 - ((y + scale * points[i + 1]) * f) / depth) * 0.5 * view.height;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
  };
  // Each pass rescales, then recentres; perspective makes the problem mildly
  // nonlinear, and a few passes settle it well below a pixel.
  for (let pass = 0; pass < 4; pass++) {
    measure();
    const ratio = Math.min(
      rectWidth / Math.max(1e-6, maxX - minX),
      rectHeight / Math.max(1e-6, maxY - minY)
    );
    scale = Math.min(maxScale, scale * ratio);
    measure();
    const worldPerPixelX = (2 / view.width) * ((aspect * d) / f);
    const worldPerPixelY = (2 / view.height) * (d / f);
    x += ((rect.left + rect.right) / 2 - (minX + maxX) / 2) * worldPerPixelX;
    y -= ((rect.top + rect.bottom) / 2 - (minY + maxY) / 2) * worldPerPixelY;
  }
  target.scale = scale;
  target.x = x;
  target.y = y;
  return target;
}
