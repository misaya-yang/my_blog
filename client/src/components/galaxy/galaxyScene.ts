import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Quaternion,
  Euler,
  Vector3,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  PlaneGeometry,
  NormalBlending,
  Vector2,
  Vector4,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "three";
import { projectTrackball, trackballDelta } from "./trackball";
import { getPageScene } from "./pageScene";
import { getScrollMotion } from "./scrollMotion";

export function createGalaxy(
  host: HTMLElement,
  light = false,
  reducedMotion = false,
  page = "/"
) {
  let mobile = host.clientWidth < 600;
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: false,

    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.dataset.instance = crypto.randomUUID();
  host.appendChild(renderer.domElement);
  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, 0.1, 40);
  camera.position.z = 10.4;
  const group = new Group();
  group.rotation.set(0.52, -0.16, -0.3);
  scene.add(group);
  // Dust and luminous stars have independent geometry and optical profiles.
  // Billboard stars keep a broad halo without relying on hardware point-size limits.
  const count = 10500;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const starCount = 650;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  let seed = 42;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const palette = ["#559edb", "#bddfff", "#eef1f7", "#e38a49"].map(
    value => new Color(value)
  );
  // A broad cloud and its braided streams share one volume, rather than tracing a symbol.
  function sample(index: number) {
    const radius = Math.pow(random(), 0.65) * 4.1;
    const stream = index % 3;
    const diffuse = index % 4 === 0;
    const angle = diffuse
      ? random() * Math.PI * 2
      : (stream * Math.PI * 2) / 3 +
        radius * 0.9 +
        (random() + random() - 1) * 0.5;
    const thickness = diffuse ? 2.5 : 0.35 + radius * 0.18;
    return [
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      (random() + random() - 1) * thickness +
        Math.sin(angle * 2.0) * radius * 0.16,
    ];
  }
  for (let i = 0; i < count; i++) {
    const p =
      i % 9 === 0
        ? [(random() - 0.5) * 9.5, (random() - 0.5) * 8, (random() - 0.5) * 4]
        : sample(i);
    positions.set(p, i * 3);
    palette[i % 13 === 0 ? 3 : i % 3].toArray(colors, i * 3);
    sizes[i] = 0.8 + Math.pow(random(), 2) * 2.0;
  }
  for (let i = 0; i < starCount; i++) {
    const p = sample(i + 13);
    // Brighter stars are scattered through a volume, not packed into a singularity.
    p[0] += (random() - 0.5) * 0.25;
    p[1] += (random() - 0.5) * 0.25;
    if (i % 19 === 0) p[2] += 0.6;
    starPositions.set(p, i * 3);
    palette[i % 11 === 0 ? 3 : i % 3].toArray(starColors, i * 3);
    starSizes[i] =
      i % 17 === 0 ? 0.8 + random() * 0.6 : 0.32 + Math.pow(random(), 3) * 0.5;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
  const controls = host.parentElement!;
  const deformation = `
    uniform float uTime;
    uniform vec3 uPagePose;
    uniform vec2 uPreviousPointer;
    uniform float uEnergy;
    uniform float uDisperse;
    uniform float uSplit;
    uniform float uPreviousSplit;
    uniform float uSideX;
    uniform vec2 uPointer;
    uniform float uHover;
    uniform float uAspect;
    vec4 particleView(vec3 original, float age) {
      float radius = length(original);
      float angle = (uTime - age) * 0.055 / (1.0 + radius * 0.08);
      mat2 orbit = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      vec3 p = original;
      p.xy = orbit * p.xy;
      p.z += sin((uTime - age) * 0.65 + original.x * 1.7 + original.y) * 0.07;
      float burst = uDisperse;
      vec3 radial = normalize(original + vec3(0.0001));
      vec3 tangent = normalize(vec3(-original.y, original.x, original.z * 0.15) + vec3(0.0001));
      p += radial * burst * (0.35 + radius * 0.65) + tangent * burst * 0.45;
      vec4 view = modelViewMatrix * vec4(p, 1.0);
      vec3 seed = fract(sin(vec3(dot(original,vec3(12.9898,78.233,37.719)), dot(original,vec3(39.346,11.135,83.155)), dot(original,vec3(73.156,52.235,9.151)))) * 43758.5453);
      float split = mix(uSplit,uPreviousSplit,min(age*0.8,1.0));
      float local = clamp((split-seed.x*0.18)/0.82,0.0,1.0);
      float blend = local*local*(3.0-2.0*local);
      vec3 destination = (seed*2.0-1.0) * vec3(uSideX*1.3,uSideX/uAspect*1.3,5.0);
      float cp = cos(uPagePose.x), sp = sin(uPagePose.x);
      destination.xy = mat2(cp,-sp,sp,cp) * destination.xy;
      destination.z += sin(destination.x * 0.4 + uPagePose.x) * uPagePose.y * 2.0;
      destination += vec3(sin((uTime-age)*0.18+seed.y*6.283),cos((uTime-age)*0.13+seed.z*6.283),sin((uTime-age)*0.11+seed.x*6.283))*0.45;
      vec4 dispersedView = modelViewMatrix * vec4(destination,1.0);
      dispersedView.z = -4.5 - abs(dispersedView.z + 4.5) * 0.6;
      vec3 bend = (modelViewMatrix * vec4(sin(original.y*0.7),cos(original.z*0.6),sin(original.x*0.7),0.0)).xyz;
      view.xyz = mix(view.xyz,dispersedView.xyz,blend) + bend*sin(blend*3.14159)*1.1;
      vec4 projected = projectionMatrix * view;
      vec2 delta = projected.xy / projected.w - mix(uPointer, uPreviousPointer, min(age * 0.65, 1.0));
      delta.x *= uAspect;
      float influence = exp(-dot(delta, delta) * 22.0) * uHover;
      vec2 direction = normalize(delta + vec2(0.0001));
      view.xy += (direction + vec2(-direction.y, direction.x) * 0.45) * influence * 0.38;
      view.z += influence * 0.7;
      return view;
    }
  `;
  const uniforms = {
    uCopyBounds: { value: new Vector4(-2, -2, -1, -1) },
    uCopyOpacity: { value: 1 },
    uQuietBoxes: {
      value: Array.from({ length: 4 }, () => new Vector4(-2, -2, -1, -1)),
    },
    uReading: { value: 0 },
    uGatherZone: { value: new Vector2(-2, -1) },
    uSplit: { value: 0 },
    uPreviousSplit: { value: 0 },
    uSideX: { value: 0 },
    uTime: { value: 0 },
    uPagePose: { value: new Vector3() },
    uPreviousPointer: { value: new Vector2(4, 4) },
    uEnergy: { value: 0 },
    uLight: { value: light ? 1 : 0 },
    uPointer: { value: new Vector2(4, 4) },
    uHover: { value: 0 },
    uAspect: { value: 1 },
    uDisperse: { value: 0 },
    uPixelRatio: { value: renderer.getPixelRatio() },
  };
  const atmosphereGeometry = new PlaneGeometry(2, 2);
  const atmosphereMaterial = new ShaderMaterial({
    uniforms,
    depthTest: false,
    depthWrite: false,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float uLight; uniform float uTime; uniform float uAspect;
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        float a = fract(sin(dot(i,vec2(127.1,311.7)))*43758.54);
        float b = fract(sin(dot(i+vec2(1,0),vec2(127.1,311.7)))*43758.54);
        float c = fract(sin(dot(i+vec2(0,1),vec2(127.1,311.7)))*43758.54);
        float d = fract(sin(dot(i+vec2(1,1),vec2(127.1,311.7)))*43758.54);
        return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
      }
      void main() {
        vec2 p = (vUv - vec2(0.58,0.55)) * vec2(uAspect,1.0);
        float n = noise(p*4.0 + uTime*0.003)*0.55 + noise(p*11.0)*0.28 + noise(p*27.0)*0.17;
        float mist = pow(n,2.0) * exp(-dot(p,p)*2.2);
        vec3 night = vec3(0.0015,0.003,0.0055) + vec3(0.007,0.014,0.021)*mist;
        vec3 day = vec3(0.9387,0.9560,0.9734) - vec3(0.085,0.062,0.028)*mist;
        gl_FragColor = vec4(mix(night,day,uLight),1.0);
        #include <colorspace_fragment>
      }`,
  });
  const atmosphere = new Mesh(atmosphereGeometry, atmosphereMaterial);
  atmosphere.frustumCulled = false;
  atmosphere.renderOrder = -1;
  scene.add(atmosphere);
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: light ? NormalBlending : AdditiveBlending,
    uniforms,
    vertexShader: `${deformation}
      attribute float aSize;
      uniform float uPixelRatio;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 view = particleView(position, 0.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp(aSize * uPixelRatio * 9.0 / -view.z, 1.0, 6.0);
      }`,
    fragmentShader: `varying vec3 vColor; uniform float uDisperse; uniform float uLight;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float warm = smoothstep(0.05,0.45,vColor.r-vColor.b);
        vec3 ink = mix(vec3(0.025,0.09,0.18),vec3(0.23,0.12,0.065),warm);
        gl_FragColor = vec4(mix(vColor, ink, uLight), (1.0 - smoothstep(0.25, 1.0, d)) * 0.8 * (1.0 - uDisperse * 0.25));
        #include <colorspace_fragment>
      }`,
  });
  const dust = new Points(geometry, material);
  dust.frustumCulled = false;
  dust.renderOrder = 1;
  group.add(dust);
  const starGeometry = new InstancedBufferGeometry();
  starGeometry.setAttribute(
    "position",
    new BufferAttribute(
      new Float32Array([
        -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0,
      ]),
      3
    )
  );
  starGeometry.setIndex([0, 1, 2, 0, 2, 3]);
  starGeometry.setAttribute(
    "aCenter",
    new InstancedBufferAttribute(starPositions, 3)
  );
  starGeometry.setAttribute(
    "aColor",
    new InstancedBufferAttribute(starColors, 3)
  );
  starGeometry.setAttribute(
    "aSize",
    new InstancedBufferAttribute(starSizes, 1)
  );
  starGeometry.instanceCount = starCount;
  const starMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: light ? NormalBlending : AdditiveBlending,
    uniforms,
    vertexShader: `${deformation}
      attribute vec3 aCenter; attribute vec3 aColor; attribute float aSize;
      varying vec2 vUv; varying vec3 vColor; varying float vBrightness;
      void main() {
        vUv = position.xy * 2.0;
        vColor = aColor;
        vBrightness = 0.94 + 0.06 * sin(uTime * 0.6 + aCenter.x * 4.0);
        vec4 center = particleView(aCenter, 0.0);
        center.xy += position.xy * aSize;
        gl_Position = projectionMatrix * center;
      }`,
    fragmentShader: `varying vec2 vUv; varying vec3 vColor; varying float vBrightness;
      uniform float uDisperse; uniform float uLight;
      void main() {
        float r = length(vUv);
        if (r > 1.0) discard;
        float core = 1.0 - smoothstep(mix(0.045, 0.025, uLight), mix(0.115, 0.065, uLight), r);
        float corona = exp(-r*r*85.0) * 0.36;
        float halo = exp(-r*r*mix(6.0,18.0,uLight)) * 0.085;
        float alpha = (core + corona + halo) * vBrightness * (1.0 - uDisperse * 0.25);
        vec3 emission = mix(vColor * 1.15, vec3(1.25), core * 0.38);
        float warm = smoothstep(0.05,0.45,vColor.r-vColor.b);
        vec3 tint = mix(vec3(0.015,0.07,0.16),vec3(0.23,0.12,0.065),warm);
        vec3 ink = mix(tint, vec3(0.97,0.99,1.0), core);
        float lightAlpha = (core + corona * 1.3 + halo * 0.65) * (1.0 - uDisperse * 0.25);
        gl_FragColor = vec4(mix(emission, ink, uLight), mix(alpha, lightAlpha, uLight));
        #include <colorspace_fragment>
      }`,
  });
  // Broad, low-opacity splats connect the stars into a continuous 3D dust volume.
  // Daylight uses absorption beneath the white highlights; night uses faint scattering.
  const volumeGeometry = new InstancedBufferGeometry();
  volumeGeometry.setAttribute(
    "position",
    starGeometry.getAttribute("position")
  );
  volumeGeometry.setIndex([0, 1, 2, 0, 2, 3]);
  volumeGeometry.setAttribute(
    "aCenter",
    new InstancedBufferAttribute(positions, 3)
  );
  volumeGeometry.instanceCount = 1600;
  const volumeMaterial = new ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: light ? NormalBlending : AdditiveBlending,
    vertexShader: `${deformation}
      attribute vec3 aCenter; varying vec2 vUv;
      void main() {
        vUv = position.xy * 2.0;
        vec4 center = particleView(aCenter, 0.0);
        center.xy += position.xy * 0.70;
        gl_Position = projectionMatrix * center;
      }`,
    fragmentShader: `varying vec2 vUv; uniform float uLight; uniform float uDisperse;
      void main() {
        float r2 = dot(vUv,vUv);
        if (r2 > 1.0) discard;
        float alpha = exp(-r2*4.8) * mix(0.006,0.03,uLight) * pow(1.0-uDisperse,2.0);
        gl_FragColor = vec4(mix(vec3(0.06,0.19,0.31),vec3(0.008,0.025,0.06),uLight),alpha);
        #include <colorspace_fragment>
      }`,
  });
  const volume = new Mesh(volumeGeometry, volumeMaterial);
  volume.frustumCulled = false;
  group.add(volume);
  const stars = new Mesh(starGeometry, starMaterial);
  stars.frustumCulled = false;
  stars.renderOrder = 2;
  group.add(stars);
  const trailGeometry = new InstancedBufferGeometry();
  const trailSegments = 12;
  const trailVertices = [],
    trailIndices = [];
  for (let i = 0; i <= trailSegments; i++) {
    trailVertices.push(i / trailSegments, -1, 0, i / trailSegments, 1, 0);
    if (i < trailSegments) {
      const j = i * 2;
      trailIndices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
  }
  trailGeometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(trailVertices), 3)
  );
  trailGeometry.setIndex(trailIndices);
  trailGeometry.setAttribute(
    "aCenter",
    new InstancedBufferAttribute(starPositions, 3)
  );
  trailGeometry.setAttribute(
    "aColor",
    new InstancedBufferAttribute(starColors, 3)
  );
  trailGeometry.instanceCount = starCount;
  const trailMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: light ? NormalBlending : AdditiveBlending,
    uniforms,
    vertexShader: `${deformation}
      attribute vec3 aCenter; attribute vec3 aColor;
      varying float vAge; varying float vEdge; varying vec3 vColor;
      void main() {
        vAge = position.x; vEdge = position.y; vColor = aColor;
        float age = vAge * (0.9 + uEnergy * 0.65);
        vec4 center = particleView(aCenter, age);
        vec4 next = particleView(aCenter, age + 0.05);
        vec2 tangent = normalize(next.xy - center.xy + vec2(0.00001));
        center.xy += vec2(-tangent.y, tangent.x) * position.y * 0.013 * (1.0 - vAge);
        gl_Position = projectionMatrix * center;
      }`,
    fragmentShader: `varying float vAge; varying float vEdge; varying vec3 vColor;
      uniform float uLight; uniform float uDisperse;
      void main() {
        float alpha = pow(1.0 - vAge, 1.8) * (1.0 - vEdge * vEdge) * 0.46 * (1.0 - uDisperse * 0.255);
        vec3 ink = vec3(0.008, 0.05, 0.14);
        gl_FragColor = vec4(mix(vColor, ink, uLight), alpha);
        #include <colorspace_fragment>
      }`,
  });
  const trails = new Mesh(trailGeometry, trailMaterial);
  trails.frustumCulled = false;
  trails.renderOrder = 2;
  group.add(trails);
  // Reserve contrast around the real text bounds while keeping a single continuous scene.
  for (const opticalMaterial of [
    material,
    starMaterial,
    trailMaterial,
    volumeMaterial,
  ]) {
    opticalMaterial.vertexShader =
      `varying float vReadability;
      uniform vec4 uCopyBounds; uniform float uCopyOpacity;
      uniform vec4 uQuietBoxes[4];
      uniform float uReading; uniform vec2 uGatherZone;
      float readableArea(vec4 clip) {
        vec2 p = clip.xy / clip.w * 0.5 + 0.5;
        float x = smoothstep(uCopyBounds.x-0.05,uCopyBounds.x,p.x) * (1.0-smoothstep(uCopyBounds.z,uCopyBounds.z+0.08,p.x));
        float y = smoothstep(uCopyBounds.y-0.04,uCopyBounds.y,p.y) * (1.0-smoothstep(uCopyBounds.w,uCopyBounds.w+0.04,p.y));
        float edge = mix(0.12,1.0,smoothstep(0.44,0.90,abs(p.x-0.5)*2.0));
        float openBand = smoothstep(uGatherZone.x,uGatherZone.x+0.06,p.y) * (1.0-smoothstep(uGatherZone.y-0.06,uGatherZone.y,p.y));
        float quiet = 1.0;
        for (int i=0;i<4;i++) {
          vec4 b = uQuietBoxes[i];
          float qx = smoothstep(b.x-0.04,b.x+0.02,p.x)*(1.0-smoothstep(b.z-0.02,b.z+0.04,p.x));
          float qy = smoothstep(b.y-0.025,b.y+0.02,p.y)*(1.0-smoothstep(b.w-0.02,b.w+0.025,p.y));
          quiet *= 1.0-qx*qy*0.99;
        }
        return quiet * (1.0-x*y*0.96*uCopyOpacity) * mix(1.0,max(edge,openBand*smoothstep(0.34,0.48,p.x)),uReading);
      }
` +
      opticalMaterial.vertexShader.replace(
        /gl_Position = projectionMatrix \* (view|center);/g,
        "$& vReadability = readableArea(gl_Position);"
      );
    opticalMaterial.fragmentShader =
      "varying float vReadability;\n" +
      opticalMaterial.fragmentShader.replace(
        "#include <colorspace_fragment>",
        "gl_FragColor.a *= vReadability;\n#include <colorspace_fragment>"
      );
  }
  let frame = 0,
    disposed = false,
    visible = true,
    lost = false,
    paused = reducedMotion;
  let lastTime = 0,
    elapsed = 0,
    hover = 0,
    targetHover = 0;
  const orientation = new Quaternion().setFromEuler(
    new Euler(0.38, -0.25, -0.4)
  );
  const initialOrientation = orientation.clone();
  const angularAxis = new Vector3(0, 1, 0);
  const increment = new Quaternion();
  const autoAxis = new Vector3(0.18, 0.9, 0.3).normalize();
  let angularSpeed = 0,
    dragging = false,
    activePointer = -1,
    lastMoveTime = 0;
  let dragPoint = new Vector3();
  const pointer = new Vector2(4, 4);
  const pointerTarget = new Vector2(4, 4);
  const previousPointer = new Vector2(4, 4);
  let pageScene = getPageScene(page);
  let hero: HTMLElement | null = null,
    stage: HTMLElement | null = null,
    gatherTarget: HTMLElement | null = null,
    foot: HTMLElement | null = null,
    copy: HTMLElement | null = null;
  const pagePose = new Vector3(pageScene.phase, pageScene.tilt, pageScene.pace);
  function bindHome() {
    const home = document.querySelector(".public-universe .observatory-home");
    hero = home?.querySelector(".observatory-hero-scroll") ?? null;
    stage = home?.querySelector(".observatory-hero") ?? null;
    gatherTarget = home?.querySelector(".observatory-directions") ?? null;
    foot = home?.querySelector(".observatory-hero-foot") ?? null;
    copy = home?.querySelector(".observatory-hero-copy") ?? null;
  }
  let quietNodes: Element[] = [];
  let gather = 0;
  let scrollProgress = pageScene.mode === "home" ? 0 : 1;
  let bounds = host.getBoundingClientRect();
  function paint(dt = 0.016) {
    const smoothing = 1 - Math.exp(-dt * 9);
    if (pageScene.mode === "home" && !stage?.isConnected) bindHome();
    if (pageScene.mode === "author" && !copy?.isConnected)
      copy = document.querySelector(".author-page .about-letter");
    bounds = host.getBoundingClientRect();
    if (!quietNodes.length || quietNodes.some(node => !node.isConnected)) {
      quietNodes = Array.from(
        document.querySelectorAll(
          ".public-universe :is(.paper-reader-main,.paper-toc-rail,.search-results-surface,.archive-timeline,.observatory-featured,.observatory-notes,.track-article-ledger,.page-hero,.taxonomy-notes-surface,.taxonomy-side-panel,.about-focus-ledger,.about-links-rail)"
        )
      );
    }
    let quietIndex = 0;
    for (const node of quietNodes) {
      const r = node.getBoundingClientRect();
      if (
        !r.width ||
        !r.height ||
        r.bottom < bounds.top ||
        r.top > bounds.bottom ||
        quietIndex >= 4
      )
        continue;
      uniforms.uQuietBoxes.value[quietIndex++].set(
        (r.left - bounds.left) / bounds.width,
        1 - (r.bottom - bounds.top) / bounds.height,
        (r.right - bounds.left) / bounds.width,
        1 - (r.top - bounds.top) / bounds.height
      );
    }
    for (; quietIndex < 4; quietIndex++)
      uniforms.uQuietBoxes.value[quietIndex].set(-2, -2, -1, -1);
    if (copy?.isConnected) {
      const textRect = copy.getBoundingClientRect();
      uniforms.uCopyBounds.value.set(
        (textRect.left - bounds.left) / bounds.width,
        1 - (textRect.bottom - bounds.top) / bounds.height,
        (textRect.right - bounds.left) / bounds.width,
        1 - (textRect.top - bounds.top) / bounds.height
      );
    } else uniforms.uCopyBounds.value.set(-2, -2, -1, -1);
    const rect = hero?.getBoundingClientRect();
    const stageHeight = stage?.clientHeight || bounds.height;
    const travel = rect ? rect.height - stageHeight : 0;
    const progress =
      pageScene.mode !== "home"
        ? 1
        : reducedMotion || !rect
          ? 0
          : Math.min(
              1,
              Math.max(
                0,
                (68 - rect.top) / (travel > 20 ? travel : stageHeight)
              )
            );
    scrollProgress += (progress - scrollProgress) * (1 - Math.exp(-dt * 14));
    const targetRect = gatherTarget?.getBoundingClientRect() ?? {
      top: -10000,
      bottom: -9999,
      height: 1,
    };
    const distance =
      Math.abs(
        targetRect.top +
          targetRect.height / 2 -
          (bounds.top + bounds.height / 2)
      ) / bounds.height;
    const proximity =
      reducedMotion || mobile
        ? 0
        : Math.max(0, Math.min(1, (0.75 - distance) / 0.5));
    const gatherGoal = proximity * proximity * (3 - 2 * proximity);
    gather += (gatherGoal - gather) * (1 - Math.exp(-dt * 14));
    const motion = getScrollMotion(scrollProgress, gather);
    const split = pageScene.mode === "author" ? 0.45 : motion.split;
    uniforms.uSplit.value = split;
    uniforms.uPagePose.value.lerp(pagePose, smoothing);
    uniforms.uPreviousSplit.value +=
      (split - uniforms.uPreviousSplit.value) * (1 - Math.exp(-dt * 8));
    uniforms.uReading.value = motion.expansion;
    uniforms.uGatherZone.value.set(
      1 - (targetRect.bottom - bounds.top) / bounds.height,
      1 - (targetRect.top - bounds.top) / bounds.height
    );
    uniforms.uDisperse.value = motion.expansion * 0.1 * (1 - gather);
    uniforms.uCopyOpacity.value =
      pageScene.mode === "author" ? 1 : motion.copyOpacity;
    camera.position.z = 10.4 - motion.approach * 0.55 + gather * 3.6;
    uniforms.uSideX.value =
      Math.tan((camera.fov * Math.PI) / 360) *
      camera.position.z *
      camera.aspect *
      0.98;
    stage?.style.setProperty("--hero-copy-opacity", String(motion.copyOpacity));
    stage?.style.setProperty("--hero-copy-y", `${motion.copyY}px`);
    host.style.opacity = String(1 - motion.split * 0.28);
    const copyHidden = pageScene.mode === "home" && motion.copyOpacity < 0.01;
    if (copy && copy.inert !== copyHidden) copy.inert = copyHidden;
    if (foot && foot.inert !== copyHidden) foot.inert = copyHidden;
    uniforms.uTime.value = elapsed;
    hover += (targetHover - hover) * smoothing;
    pointer.lerp(pointerTarget, smoothing);
    uniforms.uPointer.value.copy(pointer);
    uniforms.uHover.value = hover;
    previousPointer.lerp(pointer, 1 - Math.exp(-dt * 2.2));
    uniforms.uPreviousPointer.value.copy(previousPointer);
    uniforms.uEnergy.value +=
      (Math.min(1, angularSpeed / 3 + pointer.distanceTo(previousPointer)) -
        uniforms.uEnergy.value) *
      smoothing;
    if (!dragging && !paused) {
      if (angularSpeed > 0.002) {
        increment.setFromAxisAngle(angularAxis, angularSpeed * dt);
        orientation.premultiply(increment).normalize();
        angularSpeed *= Math.exp(-dt * 2.8);
      }
      increment.setFromAxisAngle(autoAxis, dt * 0.045);
      orientation.premultiply(increment).normalize();
    }
    group.quaternion.copy(orientation);
    group.position.x = mobile
      ? 0
      : pageScene.mode === "author"
        ? 2.8
        : 1.0 + gather * 1.8;
    group.position.y = mobile ? 1.1 * (1 - gather) : 0;
    renderer.render(scene, camera);
  }
  function tick(now: number) {
    frame = 0;
    if (disposed || !visible || document.hidden || lost || paused) return;
    const delta = now - lastTime;
    if (delta >= (mobile ? 1000 / 30 : 1000 / 60) - 1) {
      const dt = Math.min(delta / 1000, 0.05);
      elapsed += dt * (uniforms.uPagePose.value.z || 1);
      lastTime = now;
      paint(dt);
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = performance.now();
    const running =
      !disposed && visible && !document.hidden && !lost && !paused;
    host.dataset.motion = running ? "running" : "paused";
    if (running) frame = requestAnimationFrame(tick);
  }
  const requestPaint = () => {
    if (frame || disposed || !visible || document.hidden || lost) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      paint();
    });
  };
  const resize = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height || lost) return;
    mobile = width < 600;
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.5));
    uniforms.uPixelRatio.value = renderer.getPixelRatio();
    uniforms.uAspect.value = width / height;
    geometry.setDrawRange(0, mobile ? 5600 : count);
    starGeometry.instanceCount = mobile ? 360 : starCount;
    trailGeometry.instanceCount = mobile ? 180 : starCount;
    volumeGeometry.instanceCount = mobile ? 700 : 1600;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    paint();
  });
  resize.observe(host);
  if (copy) resize.observe(copy);
  const intersection = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  });
  intersection.observe(host);
  const move = (event: PointerEvent) => {
    if (reducedMotion) return;
    pointerTarget.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      1 - ((event.clientY - bounds.top) / bounds.height) * 2
    );
    targetHover = 1;
    if (dragging && event.pointerId === activePointer) {
      const next = projectTrackball(
        event.clientX - bounds.left,
        event.clientY - bounds.top,
        bounds.width,
        bounds.height
      );
      const delta = trackballDelta(dragPoint, next);
      orientation.premultiply(delta).normalize();
      const angle = 2 * Math.acos(Math.min(1, Math.abs(delta.w)));
      if (angle > 0.00001) {
        angularAxis.set(delta.x, delta.y, delta.z).normalize();
        angularSpeed = Math.min(
          8,
          angle / Math.max((event.timeStamp - lastMoveTime) / 1000, 0.008)
        );
      }
      dragPoint.copy(next);
      lastMoveTime = event.timeStamp;
    }
    requestPaint();
  };
  const down = (event: PointerEvent) => {
    if (reducedMotion) return;
    if (event.button !== 0 || !event.isPrimary) return;
    bounds = host.getBoundingClientRect();
    dragging = true;
    activePointer = event.pointerId;
    dragPoint = projectTrackball(
      event.clientX - bounds.left,
      event.clientY - bounds.top,
      bounds.width,
      bounds.height
    );
    lastMoveTime = event.timeStamp;
    angularSpeed = 0;
    controls.setPointerCapture(event.pointerId);
    controls.dataset.dragging = "true";
    move(event);
  };
  const up = (event: PointerEvent) => {
    if (event.pointerId !== activePointer) return;
    dragging = false;
    activePointer = -1;
    if (event.type === "pointercancel" || event.timeStamp - lastMoveTime > 100)
      angularSpeed = 0;
    controls.dataset.dragging = "false";
    if (controls.hasPointerCapture(event.pointerId))
      controls.releasePointerCapture(event.pointerId);
    if (event.pointerType !== "mouse") targetHover = 0;
  };
  const leave = () => {
    targetHover = 0;
    requestPaint();
  };
  const key = (event: KeyboardEvent) => {
    if (reducedMotion) return;
    if (
      ![
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        " ",
        "Escape",
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    if (event.key === " ") {
      paused = !paused;
      sync();
    } else if (event.key === "Escape") {
      orientation.copy(initialOrientation);
      angularSpeed = 0;
    } else {
      angularAxis.set(
        event.key === "ArrowUp" || event.key === "ArrowDown" ? 1 : 0,
        event.key === "ArrowLeft" || event.key === "ArrowRight" ? 1 : 0,
        0
      );
      const direction =
        event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1;
      orientation
        .premultiply(
          increment.setFromAxisAngle(angularAxis, (direction * Math.PI) / 12)
        )
        .normalize();
      angularSpeed = 0;
    }
    requestPaint();
  };
  window.addEventListener("scroll", requestPaint, { passive: true });
  controls.addEventListener("pointermove", move);
  controls.addEventListener("pointerdown", down);
  controls.addEventListener("pointerup", up);
  controls.addEventListener("pointercancel", up);
  controls.addEventListener("pointerleave", leave);
  controls.addEventListener("keydown", key);
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    host.dataset.ready = "false";
    sync();
  };
  const contextRestored = () => {
    lost = false;
    host.dataset.ready = "true";
    paint();
    sync();
  };
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  renderer.domElement.addEventListener("webglcontextrestored", contextRestored);
  document.addEventListener("visibilitychange", sync);
  host.dataset.ready = "true";
  host.dataset.mode = pageScene.mode;
  host.dataset.variant = pageScene.phase.toFixed(6);
  if (pageScene.mode === "home") pagePose.set(0, 0, 1);
  sync();
  return {
    setPage(path: string) {
      pageScene = getPageScene(path);
      quietNodes = [];
      pagePose.set(
        pageScene.mode === "home" ? 0 : pageScene.phase,
        pageScene.mode === "home" ? 0 : pageScene.tilt,
        pageScene.mode === "home" ? 1 : pageScene.pace
      );
      hero = stage = gatherTarget = foot = copy = null;
      host.dataset.mode = pageScene.mode;
      host.dataset.variant = pageScene.phase.toFixed(6);
      requestPaint();
    },
    setTheme(isLight: boolean) {
      uniforms.uLight.value = isLight ? 1 : 0;
      material.blending =
        starMaterial.blending =
        trailMaterial.blending =
        volumeMaterial.blending =
          isLight ? NormalBlending : AdditiveBlending;
      material.needsUpdate =
        starMaterial.needsUpdate =
        trailMaterial.needsUpdate =
        volumeMaterial.needsUpdate =
          true;
      requestPaint();
    },
    dispose() {
      disposed = true;
      sync();
      resize.disconnect();
      intersection.disconnect();
      window.removeEventListener("scroll", requestPaint);
      document.removeEventListener("visibilitychange", sync);
      controls.removeEventListener("pointermove", move);
      controls.removeEventListener("pointerdown", down);
      controls.removeEventListener("pointerup", up);
      controls.removeEventListener("pointercancel", up);
      controls.removeEventListener("pointerleave", leave);
      controls.removeEventListener("keydown", key);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      renderer.domElement.removeEventListener(
        "webglcontextrestored",
        contextRestored
      );
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      geometry.dispose();
      material.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      trailGeometry.dispose();
      trailMaterial.dispose();
      volumeGeometry.dispose();
      volumeMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      host.dataset.ready = "false";
    },
  };
}
