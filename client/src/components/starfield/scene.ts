import {
  AddEquation,
  Camera,
  Color,
  CustomBlending,
  DataTexture,
  Euler,
  HalfFloatType,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  BufferAttribute,
  LinearFilter,
  Mesh,
  NoBlending,
  OneFactor,
  Quaternion,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  WebGLRenderer,
} from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { BloomPyramidPass } from "./bloomPyramid";
import { buildParticles } from "./particles";
import { RenderQuality } from "./quality";
import {
  FORM_KEYS,
  formForPath,
  normalizePath,
  openingAt,
  outerRadius,
  type RoseForm,
} from "./roseForm";
import {
  COMPOSITE_FRAGMENT,
  PARTICLE_FRAGMENT,
  PARTICLE_VERTEX,
  QUAD_VERTEX,
  TRAIL_SAMPLES,
} from "./shaders";
import { TurnMotion } from "./turnMotion";

/** Page colours behind the field. Keep in sync with styles/starfield.css. */
export const NIGHT_SKY = "#07080b";
export const DAY_PAPER = "#f4f0e8";

/** Where a page wants its figure: the box's inscribed circle is the footprint. */
export const ANCHOR_SELECTOR = "[data-rose-anchor]";
/** A text column the sky stays out of. */
export const QUIET_SELECTOR = "[data-rose-quiet]";

const KEY_TURN = Math.PI / 12;
const INTRO_SECONDS = 4.2;
/** A press becomes a drag once it has travelled this far, in CSS pixels. */
const DRAG_SLOP = 4;
/** Things a press belongs to before it belongs to the rose. */
const INTERACTIVE =
  "a,button,input,textarea,select,summary,label,[role='button'],[contenteditable='true'],[data-rose-ignore]";
/** How quickly each point of the pointer's chain closes on the one ahead. */
const CHAIN_RATES = [24, 12, 8.5, 6.4, 5];
const CHAIN_WEIGHTS = [0.5, 0.42, 0.34, 0.26, 0.18];

/** Whether the element itself carries text a reader might want to select. */
const hasOwnText = (element: Element | null) => {
  for (let node = element?.firstChild; node; node = node.nextSibling)
    if (node.nodeType === 3 && node.nodeValue?.trim()) return true;
  return false;
};

export interface StarfieldOptions {
  light: boolean;
  reducedMotion: boolean;
  page: string;
}

export interface StarfieldHandle {
  setTheme(light: boolean): void;
  setPage(path: string): void;
  setPaused(paused: boolean): void;
  handleKey(event: KeyboardEvent): void;
  dispose(): void;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (from: number, to: number, x: number) => {
  const t = clamp01((x - from) / (to - from));
  return t * t * (3 - 2 * t);
};
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
/** Frame-rate independent approach of `value` toward `target`. */
const approach = (value: number, target: number, rate: number, dt: number) =>
  value + (target - value) * (1 - Math.exp(-rate * dt));

export function createStarfield(
  host: HTMLElement,
  options: StarfieldOptions
): StarfieldHandle {
  const reduced = options.reducedMotion;
  const renderer = new WebGLRenderer({
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
  });
  renderer.autoClear = false;
  const canvas = renderer.domElement;
  canvas.dataset.starfield = "true";
  // The buffer is sized in device pixels; the element always spans the host.
  // Left to its intrinsic size a canvas shows its buffer scaled up.
  canvas.style.cssText = "display:block;width:100%;height:100%";
  host.appendChild(canvas);

  // Light adds up beyond 1 before tone mapping, so the buffer is half-float
  // where the device can render to one.
  const hdr =
    renderer.extensions.has("EXT_color_buffer_float") ||
    renderer.extensions.has("EXT_color_buffer_half_float");
  const gain = hdr ? 1 : 0.2;

  const particles = buildParticles();
  const geometry = new InstancedBufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(
      new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]),
      3
    )
  );
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.setAttribute(
    "aParam",
    new InstancedBufferAttribute(particles.param, 4)
  );
  geometry.setAttribute(
    "aSeed",
    new InstancedBufferAttribute(particles.seed, 4)
  );
  geometry.setAttribute(
    "aLook",
    new InstancedBufferAttribute(particles.look, 4)
  );
  geometry.instanceCount = particles.count;

  const trail = Array.from(
    { length: TRAIL_SAMPLES },
    () => new Vector4(0, 0, 0, 1)
  );
  const trailVelocity = Array.from(
    { length: TRAIL_SAMPLES },
    () => new Vector2()
  );
  // The chain itself, in CSS pixels.
  const chain = Array.from({ length: TRAIL_SAMPLES }, () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    energy: 0,
  }));
  let chainPlaced = false;

  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new Vector2(1, 1) },
    uDpr: { value: 1 },
    uCenter: { value: new Vector2() },
    uRadius: { value: 100 },
    uQuatHeart: { value: new Quaternion() },
    uQuatRim: { value: new Quaternion() },
    uPresence: { value: 0 },
    uDisperse: { value: 0 },
    uGrow: { value: reduced ? 1 : 0 },
    uOpen: { value: reduced ? 1 : 0 },
    uWrite: { value: reduced ? 1.1 : 0 },
    uPen: { value: -1 },
    uBreath: { value: 0 },
    uFlow: { value: 0.0013 },
    uLight: { value: options.light ? 1 : 0 },
    uGain: { value: gain },
    uTurns: { value: 4 },
    uPetals: { value: 3.6 },
    uOpenOuter: { value: 1.6 },
    uOpenInner: { value: 0.46 },
    uNotch: { value: 0.46 },
    uRuffle: { value: 1 },
    uDepth: { value: 0.8 },
    uInnerLength: { value: 0.62 },
    uTwist: { value: 0 },
    uSignature: { value: 1 },
    uWarmth: { value: 0 },
    uScriptZ: { value: 0.2 },
    uSkyShift: { value: new Vector2() },
    uSkyDim: { value: 1 },
    uQuiet: { value: new Vector4(0, 0, 1, 0) },
    uTrail: { value: trail },
    uTrailVel: { value: trailVelocity },
    uPointer: { value: new Vector3() },
    uFocus: { value: 0.12 },
    uAperture: { value: 0.0022 },
  };
  const material = new ShaderMaterial({
    vertexShader: PARTICLE_VERTEX,
    fragmentShader: PARTICLE_FRAGMENT,
    uniforms,
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneFactor,
    depthTest: false,
    depthWrite: false,
    transparent: true,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.add(mesh);
  const camera = new Camera();

  const target = new WebGLRenderTarget(1, 1, {
    type: hdr ? HalfFloatType : UnsignedByteType,
    depthBuffer: false,
    stencilBuffer: false,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
  });
  const bloom = new BloomPyramidPass({
    levels: 6,
    resolutionScale: 0.5,
    threshold: 0.9,
    knee: 0.8,
    radius: 0.62,
    strength: 1,
  });
  bloom.pyramidOnly = true;
  const black = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  black.needsUpdate = true;

  const compositeUniforms = {
    tScene: { value: target.texture },
    tBloom: { value: black as DataTexture | WebGLRenderTarget["texture"] },
    uBloom: { value: 0.58 },
    uBleed: { value: 0.2 },
    uInk: { value: 1.4 },
    uLight: { value: options.light ? 1 : 0 },
    uExposure: { value: 1.05 },
    uGain: { value: 1 / gain },
    uNight: { value: new Color(NIGHT_SKY) },
    uPaper: { value: new Color(DAY_PAPER) },
    uAir: { value: new Color(0.012, 0.02, 0.042) },
    uGlow: { value: new Vector3(0, 0, 1) },
    uResolution: { value: new Vector2(1, 1) },
    uTime: { value: 0 },
  };
  const composite = new FullScreenQuad(
    new ShaderMaterial({
      vertexShader: QUAD_VERTEX,
      fragmentShader: COMPOSITE_FRAGMENT,
      uniforms: compositeUniforms,
      depthTest: false,
      depthWrite: false,
      blending: NoBlending,
    })
  );

  // --- State ---------------------------------------------------------------
  const quality = new RenderQuality();
  const turn = new TurnMotion();
  const home = new Quaternion();
  const homeEuler = new Euler();
  let width = 1;
  let height = 1;
  let dpr = 1;
  let time = 0;
  let intro = reduced ? INTRO_SECONDS : 0;
  let light = options.light ? 1 : 0;
  let lightTarget = light;
  let paused = false;
  let disposed = false;
  let contextLost = false;
  let frame = 0;
  let last = 0;
  let dirty = true;
  let page = normalizePath(options.page);
  let form: RoseForm = { ...formForPath(page) };
  let formTarget: RoseForm = formForPath(page);

  // The figure's place on the page, in document CSS pixels.
  const place = { x: 0, y: 0, size: 0, follow: 1, level: 1 };
  const placeTarget = { x: 0, y: 0, size: 0, follow: 1, level: 1 };
  let placed = false;
  let anchor: HTMLElement | null = null;
  // An anchor the layout has hidden (display: none) asks for no figure.
  let anchorShown = false;
  let anchorMissingSince = 0;
  let presence = 0;
  let quiet: HTMLElement | null = null;
  const quietBox = { x: 0, half: 0, strength: 0 };
  let quietStrength = 0;

  const pointer = { x: 0, y: 0, seen: false, fine: true, moved: -100 };
  const parallax = new Vector2();
  let pointerLight = 0;
  let hover = 0;
  // 1 at a page change, easing to 0: the figure loosens and gathers again.
  let turnOver = 0;
  let wakeGate = 1;
  let swayEase = 1;
  // A press on the artwork; it turns the rose once it has clearly moved.
  let press: {
    id: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
    turning: boolean;
  } | null = null;
  let grabbable = false;
  const root = host.ownerDocument.documentElement;

  const invalidate = () => {
    dirty = true;
  };

  // --- Layout --------------------------------------------------------------
  const measure = () => {
    if (!anchor || !anchor.isConnected)
      anchor = document.querySelector<HTMLElement>(ANCHOR_SELECTOR);
    anchorShown = false;
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        anchorShown = true;
        placeTarget.level = Number(anchor.dataset.rosePresence ?? 1) || 1;
        placeTarget.x = rect.left + rect.width / 2 + window.scrollX;
        placeTarget.y = rect.top + rect.height / 2 + window.scrollY;
        placeTarget.size = Math.min(rect.width, rect.height);
        placeTarget.follow = Number(anchor.dataset.roseFollow ?? 1) || 1;
        if (!placed) {
          Object.assign(place, placeTarget);
          placed = true;
        }
      }
    }
    if (!quiet || !quiet.isConnected)
      quiet = document.querySelector<HTMLElement>(QUIET_SELECTOR);
    if (quiet) {
      const rect = quiet.getBoundingClientRect();
      quietBox.x = rect.left + rect.width / 2 - width / 2;
      quietBox.half = rect.width / 2;
      quietBox.strength = 1;
    } else quietBox.strength = 0;
    invalidate();
  };

  const resize = () => {
    // The host's own box, not the window: a scrollbar narrows the page, and
    // a buffer sized for the window would be squeezed into it and resampled.
    width = Math.max(1, host.clientWidth || window.innerWidth);
    height = Math.max(1, host.clientHeight || window.innerHeight);
    const compact = width < 720;
    dpr = quality.pixelRatio(window.devicePixelRatio);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    const size = renderer.getDrawingBufferSize(new Vector2());
    target.setSize(size.x, size.y);
    bloom.setSize(size.x, size.y);
    uniforms.uResolution.value.copy(size);
    uniforms.uDpr.value = size.x / width;
    compositeUniforms.uResolution.value.copy(size);
    // Small screens draw a share of the dust; the signature stays whole.
    const share = compact ? 0.56 : 1;
    geometry.instanceCount =
      particles.fixed + Math.floor((particles.count - particles.fixed) * share);
    measure();
  };

  const bodyObserver =
    typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
  bodyObserver?.observe(document.body);
  let observedOnce = false;
  const hostObserver =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(() => {
          // The first callback only reports the size already measured.
          if (observedOnce) resize();
          observedOnce = true;
        })
      : null;
  hostObserver?.observe(host);

  // --- Input ---------------------------------------------------------------
  const toField = (clientX: number, clientY: number, out: Vector2) =>
    out.set(
      (clientX - width / 2) * uniforms.uDpr.value,
      (height / 2 - clientY) * uniforms.uDpr.value
    );
  const scratch = new Vector2();

  /** Whether a viewport point lies on the visible artwork. */
  const overFigure = (clientX: number, clientY: number) => {
    if (!placed || presence < 0.3) return false;
    const x = place.x - window.scrollX;
    const y = place.y - window.scrollY * place.follow;
    return Math.hypot(clientX - x, clientY - y) <= place.size * 0.52;
  };
  /**
   * Whether a press on this element is the rose's to take. The page's own
   * box for the figure always is; elsewhere over the artwork, anything
   * interactive or textual keeps its press.
   */
  const yields = (element: Element | null, touch: boolean) => {
    if (!element?.closest) return false;
    if (element.closest(ANCHOR_SELECTOR)) return true;
    // Touch scrolls the page except where the page says otherwise.
    if (touch) return false;
    return !element.closest(INTERACTIVE) && !hasOwnText(element);
  };
  const setGrabbable = (next: boolean) => {
    if (next === grabbable) return;
    grabbable = next;
    if (next) root.setAttribute("data-rose-hover", "true");
    else root.removeAttribute("data-rose-hover");
  };

  const onPointerMove = (event: PointerEvent) => {
    if (press && event.pointerId === press.id) {
      if (!press.turning) {
        const far =
          Math.hypot(
            event.clientX - press.startX,
            event.clientY - press.startY
          ) > DRAG_SLOP;
        if (!far) return;
        press.turning = true;
        press.x = event.clientX;
        press.y = event.clientY;
        turn.begin();
        root.setAttribute("data-rose-dragging", "true");
        host.ownerDocument.getSelection()?.removeAllRanges();
        // Keep the drag when the hand leaves the window.
        try {
          root.setPointerCapture(event.pointerId);
        } catch {
          /* The pointer is already gone; pointerup still ends the drag. */
        }
      }
      // A drag across the figure turns it a little over half a turn.
      const perPixel = Math.min(0.012, Math.max(0.0035, 3.6 / place.size));
      turn.drag(event.clientX - press.x, event.clientY - press.y, perPixel);
      press.x = event.clientX;
      press.y = event.clientY;
      invalidate();
      return;
    }
    if (event.pointerType === "touch") return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.seen = true;
    pointer.fine = event.pointerType !== "pen" || event.pressure === 0;
    pointer.moved = time;
    setGrabbable(
      !reduced &&
        event.buttons === 0 &&
        overFigure(event.clientX, event.clientY) &&
        yields(event.target as Element | null, false)
    );
    invalidate();
  };
  const onPointerLeave = () => {
    pointer.seen = false;
    setGrabbable(false);
  };
  const endPress = (event?: PointerEvent) => {
    if (!press || (event && event.pointerId !== press.id)) return;
    const { id, turning } = press;
    press = null;
    if (!turning) return;
    turn.release();
    root.removeAttribute("data-rose-dragging");
    try {
      root.releasePointerCapture(id);
    } catch {
      /* Already released. */
    }
    invalidate();
  };
  const onPointerUp = (event: PointerEvent) => endPress(event);
  const onBlur = () => endPress();
  const onPointerDown = (event: PointerEvent) => {
    if (reduced || press || event.button !== 0 || !event.isPrimary) return;
    if (!overFigure(event.clientX, event.clientY)) return;
    if (!yields(event.target as Element | null, event.pointerType === "touch"))
      return;
    press = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      turning: false,
    };
  };
  // A press on the rose is never the start of a text selection.
  const onSelectStart = (event: Event) => {
    if (press) event.preventDefault();
  };
  const onScroll = () => invalidate();
  const onVisibility = () => {
    last = 0;
    invalidate();
    schedule();
  };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
  };
  const onContextRestored = () => {
    contextLost = false;
    resize();
    schedule();
  };

  window.addEventListener("resize", resize);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointermove", onPointerMove, {
    passive: true,
    capture: true,
  });
  window.addEventListener("pointerdown", onPointerDown, true);
  window.addEventListener("pointerup", onPointerUp, true);
  window.addEventListener("pointercancel", onPointerUp, true);
  window.addEventListener("blur", onBlur);
  document.addEventListener("selectstart", onSelectStart);
  document.documentElement.addEventListener("pointerleave", onPointerLeave);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);

  // --- Frame ---------------------------------------------------------------
  const heartQuat = uniforms.uQuatHeart.value;
  const rimQuat = uniforms.uQuatRim.value;

  const update = (dt: number) => {
    const moving = !reduced && !paused;
    if (moving) {
      time += dt;
      intro += dt;
    }
    const settle = reduced ? 1e6 : 1;

    // Theme and form ease; nothing snaps.
    light = approach(light, lightTarget, 5 * settle, dt);
    if (Math.abs(light - lightTarget) < 0.002) light = lightTarget;
    let formMoving = false;
    for (const key of FORM_KEYS) {
      const next = approach(form[key], formTarget[key], 2.6 * settle, dt);
      if (Math.abs(next - formTarget[key]) > 1e-4) formMoving = true;
      form[key] = next;
    }

    // Place: ease across a page change, follow scroll exactly.
    if (!anchor || !anchor.isConnected) measure();
    if (!anchor || !anchorShown) {
      if (!anchorMissingSince) anchorMissingSince = performance.now();
    } else anchorMissingSince = 0;
    const hasAnchor =
      placed &&
      (!anchorMissingSince || performance.now() - anchorMissingSince < 500);
    for (const key of ["x", "y", "size", "follow", "level"] as const)
      place[key] = approach(place[key], placeTarget[key], 5 * settle, dt);
    const scrollY = window.scrollY;
    const leave = Math.max(1, (place.y + place.size * 0.5) / place.follow);
    const progress = clamp01(scrollY / leave);
    const presenceTarget = hasAnchor
      ? place.level * (1 - smooth(0.62, 1, progress))
      : 0;
    presence = approach(presence, presenceTarget, 4 * settle, dt);
    quietStrength = approach(quietStrength, quietBox.strength, 4 * settle, dt);

    // Turning: the hand, then a little life of its own.
    turn.advance(moving ? dt : 0);
    const aim = pointer.seen && pointer.fine && !reduced ? 1 : 0;
    parallax.x = approach(
      parallax.x,
      aim * ((pointer.x / width) * 2 - 1),
      2.4,
      dt
    );
    parallax.y = approach(
      parallax.y,
      aim * ((pointer.y / height) * 2 - 1),
      2.4,
      dt
    );
    const swayX = reduced
      ? 0
      : 0.03 * Math.sin(time * 0.17) + parallax.y * 0.07;
    const swayY = reduced
      ? 0
      : 0.045 * Math.sin(time * 0.11 + 1.3) + parallax.x * 0.1;
    homeEuler.set(form.tiltX, form.tiltY, form.tiltZ, "XYZ");
    home.setFromEuler(homeEuler);
    // The hand has the rose while it turns: its own sway waits.
    const ease = turn.phase === "dragging" || turn.phase === "gliding" ? 0 : 1;
    swayEase = approach(swayEase, ease, 3, dt);
    TurnMotion.pose(
      turn.spin,
      swayX * swayEase,
      swayY * swayEase,
      home,
      heartQuat
    );
    TurnMotion.pose(
      turn.rimSpin,
      swayX * 1.2 * swayEase,
      swayY * 1.2 * swayEase,
      home,
      rimQuat
    );

    // Intro: the spiral draws out from the heart, opens, and is signed.
    const grow = easeOut(intro / 2.5);
    const open = easeInOut((intro - 0.2) / 3.3);
    const write = clamp01((intro - 1.8) / 2) * 1.08;
    let pen = -1;
    if (!reduced && intro > INTRO_SECONDS + 4) {
      const cycle = (time % 13) / 2.6;
      if (cycle < 1) pen = -0.1 + cycle * 1.2;
    }

    const scale = uniforms.uDpr.value;
    const u = uniforms;
    u.uTime.value = time;
    u.uGrow.value = reduced ? 1 : grow;
    u.uOpen.value = reduced ? 1 : open;
    u.uWrite.value = reduced ? 1.1 : write;
    u.uPen.value = pen;
    u.uBreath.value = reduced ? 0 : 0.03 * Math.sin(time * 0.21);
    u.uLight.value = light;
    u.uPresence.value = presence;
    // Changing pages, the figure loosens a little as it travels and takes
    // its new form, then gathers: one figure becoming another, not a cut.
    turnOver = approach(turnOver, 0, 2.6, dt);
    if (turnOver < 0.004) turnOver = 0;
    const loosen = reduced ? 0 : 0.26 * 4 * turnOver * (1 - turnOver);
    u.uDisperse.value = Math.max(smooth(0.1, 0.92, progress), loosen);
    u.uTurns.value = form.turns;
    u.uPetals.value = form.petals;
    u.uOpenOuter.value = form.openOuter;
    u.uOpenInner.value = form.openInner;
    u.uNotch.value = form.notch;
    u.uRuffle.value = form.ruffle;
    u.uDepth.value = form.depth;
    u.uInnerLength.value = form.innerLength;
    u.uTwist.value = form.twist + time * 0.011;
    u.uSignature.value = form.signature;
    u.uWarmth.value = form.warmth;
    // The script floats inside the cup, below the innermost rim.
    const innerOpening = openingAt(form, 1);
    u.uScriptZ.value =
      form.innerLength *
      (Math.cos(innerOpening) - 0.15 * Math.sin(innerOpening)) *
      form.depth *
      0.55;
    u.uFocus.value = u.uScriptZ.value * 0.6;

    const radius =
      (place.size * 0.5 * scale) / (outerRadius(formTarget) * 1.04);
    u.uRadius.value = Math.max(1, radius);
    u.uCenter.value.set(
      (place.x - window.scrollX - width / 2) * scale,
      (height / 2 - (place.y - scrollY * place.follow)) * scale
    );
    u.uSkyShift.value.set(
      -parallax.x * 14 * scale,
      (scrollY * 0.16 + parallax.y * 10) * scale
    );
    u.uSkyDim.value = 1;
    u.uQuiet.value.set(
      quietBox.x * scale,
      quietBox.half * scale,
      90 * scale,
      quietStrength * (0.86 + 0.1 * light)
    );

    // Pointer: a chain of points trails the hand, each easing after the one
    // ahead. Their own speed is what stirs the dust, so the wake rises with
    // the motion, spreads along its path, and settles as the chain gathers
    // again. Hovering stirs; a drag turns, and stills the wake.
    const hovering =
      pointer.seen && pointer.fine && !reduced && !paused && !press?.turning
        ? 1
        : 0;
    const step = Math.max(dt, 1e-3);
    hover = approach(hover, hovering * presence, hovering ? 7 : 4, dt);
    wakeGate = approach(wakeGate, press?.turning ? 0 : 1, 14, dt);
    if (!chainPlaced && pointer.seen) {
      for (const node of chain) {
        node.x = pointer.x;
        node.y = pointer.y;
      }
      chainPlaced = true;
    }
    const reach = Math.min(96, Math.max(58, height * 0.085));
    let trailLive = false;
    for (let i = 0; i < TRAIL_SAMPLES; i++) {
      const node = chain[i];
      const aheadX = i ? chain[i - 1].x : pointer.x;
      const aheadY = i ? chain[i - 1].y : pointer.y;
      const close = 1 - Math.exp(-CHAIN_RATES[i] * dt);
      const stepX = (aheadX - node.x) * close;
      const stepY = (aheadY - node.y) * close;
      node.x += stepX;
      node.y += stepY;
      const blend = 1 - Math.exp(-14 * dt);
      node.vx += (stepX / step - node.vx) * blend;
      node.vy += (stepY / step - node.vy) * blend;
      const speed = Math.hypot(node.vx, node.vy);
      // Quick to rise, slow to fall: the dust eases back into place.
      const stirred = Math.min(1, speed / 760) * hover;
      node.energy = approach(
        node.energy,
        stirred,
        stirred > node.energy ? 11 : 2.3,
        dt
      );
      if (node.energy < 1e-3 && stirred === 0) node.energy = 0;
      if (node.energy > 0 || speed > 2) trailLive = true;
      toField(node.x, node.y, scratch);
      trail[i].set(
        scratch.x,
        scratch.y,
        node.energy * CHAIN_WEIGHTS[i] * wakeGate,
        reach * (1 + 0.16 * i) * scale
      );
      // Carried about a frame's travel along the motion, never far.
      const carry =
        speed > 1 ? Math.min(speed * 0.017, reach * 0.17) / speed : 0;
      trailVelocity[i].set(node.vx * carry * scale, -node.vy * carry * scale);
    }
    const lightAim = hovering && time - pointer.moved < 2.5 ? 1 : 0;
    pointerLight = approach(pointerLight, lightAim, lightAim ? 5 : 1.4, dt);
    // The light rides the head of the chain, so it glides after the hand.
    toField(chain[0].x, chain[0].y, scratch);
    u.uPointer.value.set(scratch.x, scratch.y, pointerLight * presence);

    compositeUniforms.uLight.value = light;
    compositeUniforms.uTime.value = time;
    compositeUniforms.uGlow.value.set(
      u.uCenter.value.x,
      u.uCenter.value.y,
      u.uRadius.value * 1.25
    );
    const air = presence * (1 - 0.7 * u.uDisperse.value) * (1 - light);
    compositeUniforms.uAir.value.setRGB(
      0.0011 * air,
      0.0019 * air,
      0.0042 * air
    );

    // Keep drawing while anything is still moving.
    const figureLive = presence > 0.004 && moving;
    return (
      figureLive ||
      trailLive ||
      (moving && turn.active) ||
      formMoving ||
      turnOver > 0 ||
      light !== lightTarget ||
      Math.abs(presence - presenceTarget) > 0.002 ||
      pointerLight > 0.004 ||
      (moving && intro < INTRO_SECONDS + 0.5)
    );
  };

  const draw = () => {
    renderer.setRenderTarget(target);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, camera);
    if (hdr) {
      bloom.render(renderer, target, target);
      compositeUniforms.tBloom.value = bloom.output ?? black;
    }
    renderer.setRenderTarget(null);
    composite.render(renderer);
  };

  const tick = (now: number) => {
    frame = 0;
    if (disposed) return;
    if (contextLost || document.hidden) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
    const frameMs = last ? now - last : 16.7;
    last = now;
    const live = update(dt);
    if (live || dirty) {
      draw();
      dirty = false;
      canvas.dataset.ready = "true";
      if (live && !reduced && quality.observe(frameMs, now)) resize();
    } else last = 0;
    schedule();
  };
  function schedule() {
    if (frame || disposed) return;
    frame = requestAnimationFrame(tick);
  }

  // Each touch-action applies to the element the gesture starts on.
  resize();
  schedule();

  if (import.meta.env.DEV)
    (window as unknown as Record<string, unknown>).__starfield = {
      uniforms,
      compositeUniforms,
      turn,
      get state() {
        return { time, intro, presence, place, form, page, dpr, light };
      },
      /** Jumps the intro to a point in seconds. */
      setIntro(seconds: number) {
        intro = seconds;
        invalidate();
      },
      /** Tries a form without navigating. */
      setForm(partial: Partial<RoseForm>) {
        formTarget = { ...formTarget, ...partial };
        invalidate();
      },
    };

  return {
    setTheme(next) {
      lightTarget = next ? 1 : 0;
      invalidate();
    },
    setPage(path) {
      const key = normalizePath(path);
      if (key === page) return;
      page = key;
      formTarget = formForPath(key);
      turnOver = 1;
      anchor = null;
      quiet = null;
      turn.home();
      measure();
      invalidate();
    },
    setPaused(next) {
      paused = next;
      invalidate();
    },
    handleKey(event) {
      if (reduced) return;
      if (event.key === "Escape") turn.home();
      else if (event.key === "ArrowLeft") turn.nudge(0, -KEY_TURN);
      else if (event.key === "ArrowRight") turn.nudge(0, KEY_TURN);
      else if (event.key === "ArrowUp") turn.nudge(-KEY_TURN, 0);
      else if (event.key === "ArrowDown") turn.nudge(KEY_TURN, 0);
      else return;
      event.preventDefault();
      invalidate();
    },
    dispose() {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      bodyObserver?.disconnect();
      hostObserver?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", onPointerUp, true);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("selectstart", onSelectStart);
      document.documentElement.removeEventListener(
        "pointerleave",
        onPointerLeave
      );
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      root.removeAttribute("data-rose-dragging");
      root.removeAttribute("data-rose-hover");
      geometry.dispose();
      material.dispose();
      target.dispose();
      bloom.dispose();
      black.dispose();
      composite.material.dispose();
      composite.dispose();
      renderer.dispose();
      canvas.remove();
      if (import.meta.env.DEV)
        delete (window as unknown as Record<string, unknown>).__starfield;
    },
  };
}
