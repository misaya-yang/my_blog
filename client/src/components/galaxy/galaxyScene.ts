import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "three";

export function createGalaxy(host: HTMLElement) {
  let mobile = host.clientWidth < 600;
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, 0.1, 40);
  camera.position.z = 8.8;
  const group = new Group();
  group.rotation.set(0.52, -0.16, -0.3);
  scene.add(group);
  // Dust and luminous stars have independent geometry and optical profiles.
  // Billboard stars keep a broad halo without relying on hardware point-size limits.
  const count = 5200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const starCount = 520;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  let seed = 42;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const palette = ["#55b6ef", "#b9e5ff", "#fff1d4", "#ff973e"].map(
    value => new Color(value)
  );
  function sample(index: number) {
    const central = index % 9 === 0;
    const radius = Math.sqrt(random()) * (central ? 1.1 : 3.55);
    const diffuse = central || index % 4 === 0;
    const scatter = (random() + random() - 1) * (0.38 + radius * 0.13);
    const angle = diffuse
      ? random() * Math.PI * 2
      : (index % 2) * Math.PI + radius * 1.22 + scatter;
    return [
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      (random() - 0.5) * (diffuse ? 1.5 : 0.55),
    ];
  }
  for (let i = 0; i < count; i++) {
    const p =
      i % 11 === 0
        ? [(random() - 0.5) * 9.5, (random() - 0.5) * 8, (random() - 0.5) * 4]
        : sample(i);
    positions.set(p, i * 3);
    palette[i % 5 === 0 ? 3 : i % 3].toArray(colors, i * 3);
    sizes[i] = 1.0 + random() * 1.65;
  }
  for (let i = 0; i < starCount; i++) {
    const p = sample(i + 13);
    // Brighter stars are scattered through a volume, not packed into a singularity.
    p[0] += (random() - 0.5) * 0.25;
    p[1] += (random() - 0.5) * 0.25;
    if (i % 9 === 0) p[2] += 1.2;
    starPositions.set(p, i * 3);
    palette[i % 6 === 0 ? 3 : i % 3].toArray(starColors, i * 3);
    starSizes[i] =
      i % 9 === 0 ? 0.7 + random() * 0.45 : 0.24 + Math.pow(random(), 2) * 0.48;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
  const uniforms = {
    uTime: { value: 0 },
    uDisperse: { value: 0 },
    uPixelRatio: { value: renderer.getPixelRatio() },
  };
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: AdditiveBlending,
    uniforms,
    vertexShader: `attribute float aSize;
      uniform float uDisperse; uniform float uPixelRatio;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 view = modelViewMatrix * vec4(position * (1.0 + uDisperse * 0.2), 1.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp(aSize * uPixelRatio * 9.0 / -view.z, 1.0, 6.0);
      }`,
    fragmentShader: `varying vec3 vColor; uniform float uDisperse;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        gl_FragColor = vec4(vColor, (1.0 - smoothstep(0.25, 1.0, d)) * 0.8 * (1.0 - uDisperse * 0.8));
        #include <colorspace_fragment>
      }`,
  });
  group.add(new Points(geometry, material));
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
    blending: AdditiveBlending,
    uniforms,
    vertexShader: `attribute vec3 aCenter; attribute vec3 aColor; attribute float aSize;
      uniform float uTime; uniform float uDisperse;
      varying vec2 vUv; varying vec3 vColor; varying float vBrightness;
      void main() {
        vUv = position.xy * 2.0;
        vColor = aColor;
        vBrightness = 0.94 + 0.06 * sin(uTime * 0.6 + aCenter.x * 4.0);
        vec4 center = modelViewMatrix * vec4(aCenter * (1.0 + uDisperse * 0.2), 1.0);
        center.xy += position.xy * aSize;
        gl_Position = projectionMatrix * center;
      }`,
    fragmentShader: `varying vec2 vUv; varying vec3 vColor; varying float vBrightness;
      uniform float uDisperse;
      void main() {
        float r = length(vUv);
        if (r > 1.0) discard;
        float core = 1.0 - smoothstep(0.045, 0.115, r);
        float corona = exp(-r*r*85.0) * 0.36;
        float halo = exp(-r*r*6.0) * 0.085;
        float alpha = (core + corona + halo) * vBrightness * (1.0 - uDisperse * 0.8);
        vec3 emission = mix(vColor * 1.45, vec3(1.8), core * 0.88);
        gl_FragColor = vec4(emission, alpha);
        #include <colorspace_fragment>
      }`,
  });
  const stars = new Mesh(starGeometry, starMaterial);
  stars.frustumCulled = false;
  group.add(stars);
  let frame = 0,
    disposed = false,
    visible = true,
    lost = false;
  let lastTime = 0,
    elapsed = 0,
    pointerX = 0,
    pointerY = 0;
  const hero = host.closest(".observatory-hero") as HTMLElement;
  function paint() {
    const rect = hero.getBoundingClientRect();
    material.uniforms.uDisperse.value = Math.min(
      1,
      Math.max(0, -rect.top / Math.max(rect.height, 1))
    );
    material.uniforms.uTime.value = elapsed;
    group.rotation.z = -0.38 + elapsed * 0.014 + pointerX * 0.06;
    group.rotation.x = 0.52 + pointerY * 0.07;
    renderer.render(scene, camera);
  }
  function tick(now: number) {
    frame = 0;
    if (disposed || !visible || document.hidden || lost) return;
    const delta = now - lastTime;
    if (delta >= (mobile ? 1000 / 30 : 1000 / 60) - 1) {
      elapsed = Math.min(4.2, elapsed + delta / 1000);
      lastTime = now;
      paint();
    }
    if (elapsed < 4.2) frame = requestAnimationFrame(tick);
    else host.dataset.motion = "settled";
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = performance.now();
    const running = !disposed && visible && !document.hidden && !lost;
    host.dataset.motion = running ? "running" : "paused";
    if (running) frame = requestAnimationFrame(tick);
  }
  const resize = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height || lost) return;
    mobile = width < 600;
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.5));
    material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    geometry.setDrawRange(0, mobile ? 3200 : count);
    starGeometry.instanceCount = mobile ? 350 : starCount;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    paint();
  });
  resize.observe(host);
  const intersection = new IntersectionObserver(
    entries => {
      visible = entries[0].isIntersecting;
      sync();
    },
    { threshold: 0 }
  );
  intersection.observe(host);
  const move = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const rect = host.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width - 0.5;
    pointerY = (event.clientY - rect.top) / rect.height - 0.5;
    requestPaint();
  };
  // Input-driven updates share one RAF; no drawing or layout reads in scroll handlers.
  const requestPaint = () => {
    if (frame || disposed || !visible || document.hidden || lost) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      paint();
    });
  };
  window.addEventListener("scroll", requestPaint, { passive: true });
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
  host.addEventListener("pointermove", move);
  document.addEventListener("visibilitychange", sync);
  host.dataset.ready = "true";
  sync();
  return {
    dispose() {
      disposed = true;
      sync();
      resize.disconnect();
      intersection.disconnect();
      window.removeEventListener("scroll", requestPaint);
      document.removeEventListener("visibilitychange", sync);
      host.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      renderer.domElement.removeEventListener(
        "webglcontextrestored",
        contextRestored
      );
      geometry.dispose();
      material.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      host.dataset.ready = "false";
    },
  };
}
