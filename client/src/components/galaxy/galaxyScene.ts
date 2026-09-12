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
  Matrix4,
  DataTexture,
  FloatType,
  RGBAFormat,
  NearestFilter,
  NeutralToneMapping,
  NoToneMapping,
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
import {
  createRoseTracks,
  bakeTracks,
  TRACK_SAMPLES,
  PETAL_TRACKS,
  sampleTrack,
} from "./roseTracks";
import { RotationMotion } from "./rotationMotion";
import { PointerWake, WAKE_SAMPLES, WAKE_LIFETIME } from "./pointerWake";
import { createPhaseSampler, ribbonWidth } from "./particleDistribution";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { projectTrackball, trackballDelta } from "./trackball";
import { getPageScene } from "./pageScene";
import { getScrollMotion } from "./scrollMotion";

export function createGalaxy(
  host: HTMLElement,
  light = false,
  reducedMotion = false,
  page = "/"
) {
  let mobile = host.clientWidth < 640;
  const coarsePointer =
    typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: false,

    powerPreference: "low-power",
  });
  renderer.setPixelRatio(
    Math.min(devicePixelRatio, mobile && coarsePointer ? 1.25 : 1.5)
  );
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
  const count = 4600;
  const positions = new Float32Array(count * 3);
  const tracks = createRoseTracks();
  const phaseSamplers = tracks.map((_, i) => createPhaseSampler(i));
  const starPhaseSamplers = tracks.map((_, i) => createPhaseSampler(i, true));
  const trackData = bakeTracks(tracks);
  tracks.forEach((track, row) => {
    for (let i = 0; i <= TRACK_SAMPLES; i++) {
      trackData[(row * (TRACK_SAMPLES + 1) + i) * 4 + 3] = track.signature
        ? 1
        : ribbonWidth(row, i / TRACK_SAMPLES);
    }
  });
  const trackTexture = new DataTexture(
    trackData,
    TRACK_SAMPLES + 1,
    tracks.length,
    RGBAFormat,
    FloatType
  );
  trackTexture.minFilter = trackTexture.magFilter = NearestFilter;
  trackTexture.needsUpdate = true;
  const flows = new Float32Array(count * 4);
  const colors = new Float32Array(count * 3);
  const dayColors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const starCount = 300;
  const starFlows = new Float32Array(starCount * 4);
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const dayStarColors = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  let seed = 42;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const palette = ["#9ad8ff", "#e3f3ff", "#ffb878", "#b5d4ff"].map(
    value => new Color(value)
  );
  const dayPalette = ["#195c9d", "#16778d", "#9b632c", "#405b95"].map(
    value => new Color(value)
  );
  const petalLength = tracks
    .slice(0, PETAL_TRACKS)
    .reduce((sum, track) => sum + track.length, 0);
  const petalDistribution = tracks
    .slice(0, PETAL_TRACKS)
    .map(
      (_, index) =>
        tracks
          .slice(0, index + 1)
          .reduce((sum, track) => sum + track.length, 0) / petalLength
    );
  // Track density follows arc length, so short inner contours do not accumulate stars.
  function sample(index: number, star = false) {
    const signature = !star && index % 13 === 0;
    const choice = (index * 0.61803398875) % 1;
    const trackId = signature
      ? PETAL_TRACKS + (index % 2)
      : petalDistribution.findIndex(end => choice < end);
    const track = tracks[trackId];
    const quantile = random();
    const phase = signature
      ? quantile
      : (star ? starPhaseSamplers : phaseSamplers)[trackId](quantile);
    // A narrow stream with occasional detached motes, rather than a filled strip.
    const transverse = random() * 2 - 1;
    const across = signature
      ? 0.005
      : Math.sign(transverse) *
        Math.pow(Math.abs(transverse), 1.8) *
        (star ? 0.1 : index % 9 === 0 ? 0.35 : 0.15);
    const point = sampleTrack(track, phase).toArray();
    return { point, orbit: [trackId, phase, 1 / track.period, across] };
  }
  for (let i = 0; i < count; i++) {
    const particle = sample(i);
    positions.set(particle.point, i * 3);
    flows.set(particle.orbit, i * 4);
    const color = i % 20 < 10 ? 0 : i % 20 < 14 ? 1 : i % 20 < 19 ? 2 : 3;
    palette[color].toArray(colors, i * 3);
    dayPalette[color].toArray(dayColors, i * 3);
    sizes[i] =
      particle.orbit[0] >= PETAL_TRACKS
        ? 1.65
        : i % 4 === 0
          ? 2.1 + random() * 1.1
          : 1.2 + random() * 0.7;
  }
  for (let i = 0; i < starCount; i++) {
    const particle = sample(i, true);
    starPositions.set(particle.point, i * 3);
    starFlows.set(particle.orbit, i * 4);
    const color = i % 4 === 0 ? (i % 12 === 0 ? 2 : 1) : i % 5 === 0 ? 2 : 0;
    palette[color].toArray(starColors, i * 3);
    dayPalette[color].toArray(dayStarColors, i * 3);
    // Size is the visible core diameter in CSS pixels, independent of halo.
    starSizes[i] = i % 2 === 0 ? 3.8 + random() * 1.0 : 2.0 + random() * 1.1;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aOrbit", new BufferAttribute(flows, 4));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.setAttribute("aDayColor", new BufferAttribute(dayColors, 3));
  geometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
  const controls = host.parentElement!;
  const pointerWake = new PointerWake();
  const deformation = `
    uniform float uTime; uniform float uLight;
    attribute vec4 aOrbit;
    uniform sampler2D uTracks;
    uniform float uTrackRows;
    vec4 trackPoint(float phase) {
      float sampleIndex = clamp(phase,0.0,1.0)*512.0;
      float row = (aOrbit.x+0.5)/uTrackRows;
      vec4 a = texture2D(uTracks,vec2((floor(sampleIndex)+0.5)/513.0,row));
      vec4 b = texture2D(uTracks,vec2((min(floor(sampleIndex)+1.0,512.0)+0.5)/513.0,row));
      return mix(a,b,fract(sampleIndex));
    }
    float flowPhase(float age) { return fract(aOrbit.y+(uTime-age)*aOrbit.z); }
    float flowFade(vec3 p) {
      if (aOrbit.x < ${PETAL_TRACKS}.0) return 1.0;
      float f = flowPhase(0.0);
      return smoothstep(0.0,0.025,f)*(1.0-smoothstep(0.975,1.0,f));
    }
    uniform vec3 uPagePose;
    uniform vec2 uPreviousPointer;
    uniform float uEnergy;
    uniform float uDisperse;
    uniform float uSplit;
    uniform float uPreviousSplit;
    uniform float uScrollPhase;
    uniform float uPreviousScrollPhase;
    uniform float uSideX;
    uniform vec2 uPointer;
    uniform float uHover;
    uniform float uAspect;
    uniform vec4 uWakeSegments[${WAKE_SAMPLES}];
    uniform vec4 uWakeImpulses[${WAKE_SAMPLES}];
    uniform float uWakeTime; uniform float uWakeRadius;
    vec2 wakeOffset(vec2 point, float historyAge, vec3 seed) {
      vec2 offset = vec2(0.0); float weight = 0.0;
      for (int i=0;i<${WAKE_SAMPLES};i++) {
        vec4 impulse = uWakeImpulses[i];
        float age = uWakeTime-historyAge-impulse.z;
        if (impulse.w < 0.5 || age < 0.0 || age >= ${WAKE_LIFETIME}) continue;
        vec4 segment = uWakeSegments[i]; vec2 travel = segment.zw-segment.xy;
        float along = clamp(dot(point-segment.xy,travel)/max(dot(travel,travel),0.000001),0.0,1.0);
        vec2 distance = point-mix(segment.xy,segment.zw,along);
        float spatial = exp(-dot(distance,distance)/(uWakeRadius*uWakeRadius)*2.0);
        // Each particle has its own drag, sideways scatter and recovery time.
        // A smooth attack avoids snapping an entire patch to a new position.
        float fade = (1.0-exp(-age*32.0))*exp(-age*(2.1+seed.z*2.0))
          *(1.0-smoothstep(0.85,${WAKE_LIFETIME},age));
        float influence = spatial*fade;
        vec2 direction = normalize(impulse.xy+vec2(0.00001));
        vec2 lateral = vec2(-direction.y,direction.x);
        vec2 outward = normalize(distance + vec2(cos(seed.x*6.283),sin(seed.x*6.283))*0.008);
        float force = length(impulse.xy);
        vec2 scattering = impulse.xy*(0.35+seed.x*0.8)
          + lateral*(seed.y-0.5)*force*2.1
          + outward*force*(0.15+seed.z*0.5);
        offset += scattering*influence; weight += influence;
      }
      return offset/max(1.0,weight);
    }
    float cursorLight(vec4 view) {
      vec4 projected = projectionMatrix * view;
      vec2 delta = (projected.xy / projected.w - uPointer) * vec2(uAspect,1.0);
      return exp(-dot(delta,delta)*24.0)*uHover;
    }
    vec4 particleView(vec3 original, float age) {
      mat4 particleMatrix = modelViewMatrix;
      float historicalSplit = uSplit;
      float radius = length(original);
      float scroll = mix(uScrollPhase,uPreviousScrollPhase,min(age*1.6,1.0));
      float phase = flowPhase(age);
      vec4 trackSample = trackPoint(phase);
      vec3 p = trackSample.xyz;
      vec3 neighbor = trackPoint(aOrbit.x < ${PETAL_TRACKS}.0 ? fract(phase+0.002) : min(phase+0.002,1.0)).xyz;
      vec2 tangent2 = normalize(neighbor.xy-p.xy+vec2(0.000001));
      float across = aOrbit.w*trackSample.w;
      p.xy += vec2(-tangent2.y,tangent2.x)*across;
      p.z += aOrbit.x < ${PETAL_TRACKS}.0 ? sin(aOrbit.y*109.0)*abs(across)*2.2 : 0.0;
      float burst = uDisperse;
      vec3 radial = normalize(original + vec3(0.0001));
      vec3 tangent = normalize(vec3(-original.y, original.x, original.z * 0.15) + vec3(0.0001));
      p += radial * burst * (0.35 + radius * 0.65) + tangent * burst * 0.45;
      vec4 view = particleMatrix * vec4(p, 1.0);
      if (aOrbit.x >= ${PETAL_TRACKS}.0) {
        // Keep the handwritten strokes readable while their recessed anchor follows the flower.
        vec4 heart = particleMatrix * vec4(0.0,0.0,-1.42,1.0);
        float scale = length(particleMatrix[0].xyz);
        view = heart + vec4(p.xy*scale,0.0,0.0);
      }
      vec3 seed = fract(sin(vec3(dot(original,vec3(12.9898,78.233,37.719)), dot(original,vec3(39.346,11.135,83.155)), dot(original,vec3(73.156,52.235,9.151)))) * 43758.5453);
      float split = historicalSplit;
      float local = clamp((split-seed.x*0.18)/0.82,0.0,1.0);
      float blend = local*local*(3.0-2.0*local);
      vec3 destination = (seed*2.0-1.0) * vec3(uSideX*1.3,uSideX/uAspect*1.3,5.0);
      float cp = cos(uPagePose.x), sp = sin(uPagePose.x);
      destination.xy = mat2(cp,-sp,sp,cp) * destination.xy;
      destination.z += sin(destination.x * 0.4 + uPagePose.x) * uPagePose.y * 2.0;
      destination += vec3(sin((uTime-age)*0.08+seed.y*6.283),cos((uTime-age)*0.07+seed.z*6.283),0.0)*0.12;
      vec4 dispersedView = particleMatrix * vec4(destination,1.0);
      dispersedView.z = -4.5 - abs(dispersedView.z + 4.5) * 0.6;
      vec3 bend = (particleMatrix * vec4(sin(original.y*0.7),cos(original.z*0.6),sin(original.x*0.7),0.0)).xyz;
      view.xyz = mix(view.xyz,dispersedView.xyz,blend) + bend*sin(blend*3.14159)*1.1;
      vec4 projected = projectionMatrix * view;
      vec2 delta = projected.xy / projected.w - mix(uPointer, uPreviousPointer, min(age * 0.65, 1.0));
      delta.x *= uAspect;
      float influence = exp(-dot(delta, delta) * 24.0) * uHover;
      vec2 travel = (uPointer-uPreviousPointer) * vec2(uAspect,1.0);
      travel *= min(1.0, 0.055 / max(length(travel), 0.0001));
      vec2 wakeDelta = delta + travel*0.45;
      float wake = exp(-dot(wakeDelta,wakeDelta)*30.0)*uHover;
      // A continuous lens: zero displacement at its center, no repulsion hole.
      vec2 offset = delta*influence*0.10 + travel*wake*0.18 + vec2(-delta.y,delta.x)*wake*uEnergy*0.06;
      view.xy += offset / vec2(uAspect,1.0) * (-view.z) / projectionMatrix[1][1];
      vec2 localWake = wakeOffset(projected.xy/projected.w*vec2(uAspect,1.0),age,seed);
      float wakeScale = aOrbit.x >= ${PETAL_TRACKS}.0 ? 0.25 : 1.0;
      view.xy += localWake * wakeScale * (-view.z) / projectionMatrix[1][1];
      view.z += influence*0.045;
      return view;
    }
  `;
  const uniforms = {
    uWakeSegments: { value: pointerWake.segments },
    uWakeImpulses: { value: pointerWake.impulses },
    uWakeTime: { value: performance.now() / 1000 },
    uWakeRadius: { value: 0.2 },
    uMobile: { value: mobile && coarsePointer ? 1 : 0 },
    uTracks: { value: trackTexture },
    uTrackRows: { value: tracks.length },
    uPoseHistory: { value: Array.from({ length: 16 }, () => new Matrix4()) },
    uStateHistory: { value: Array.from({ length: 16 }, () => new Vector4()) },
    uCanvasSize: { value: new Vector2(1, 1) },
    uCopyBounds: { value: new Vector4(-2, -2, -1, -1) },
    uCopyOpacity: { value: 1 },
    uQuietBoxes: {
      value: Array.from({ length: 4 }, () => new Vector4(-2, -2, -1, -1)),
    },
    uReading: { value: 0 },
    uGatherZone: { value: new Vector2(-2, -1) },
    uSplit: { value: 0 },
    uPreviousSplit: { value: 0 },
    uScrollPhase: { value: 0 },
    uPreviousScrollPhase: { value: 0 },
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
        vec3 night = vec3(0.006,0.009,0.012) + vec3(0.005,0.004,0.009)*mist;
        vec3 day = vec3(0.90,0.92,0.95) + vec3(0.025,0.020,0.015)*exp(-dot(p,p)*1.4);
        gl_FragColor = vec4(mix(night,day,uLight),1.0);
        #include <colorspace_fragment>
      }`,
  });
  const atmosphere = new Mesh(atmosphereGeometry, atmosphereMaterial);
  atmosphere.frustumCulled = false;
  atmosphere.renderOrder = -1;
  scene.add(atmosphere);
  // A sparse, independent distance layer continues beyond the central volume.
  const distantCount = 180;
  const distantPositions = new Float32Array(distantCount * 3);
  const distantColors = new Float32Array(distantCount * 3);
  const distantSizes = new Float32Array(distantCount);
  for (let i = 0; i < distantCount; i++) {
    distantPositions.set(
      [
        (((i % 18) + 0.2 + random() * 0.6) / 18 - 0.5) * 24,
        ((Math.floor(i / 18) + 0.2 + random() * 0.6) / 10 - 0.5) * 17,
        -2 - random() * 5,
      ],
      i * 3
    );
    palette[i % 31 === 0 ? 3 : i % 3].toArray(distantColors, i * 3);
    distantSizes[i] = i % 17 === 0 ? 14 : 7 + random() * 4;
  }
  const distantGeometry = new BufferGeometry();
  distantGeometry.setAttribute(
    "position",
    new BufferAttribute(distantPositions, 3)
  );
  distantGeometry.setAttribute("color", new BufferAttribute(distantColors, 3));
  distantGeometry.setAttribute("aSize", new BufferAttribute(distantSizes, 1));
  const distantMaterial = new ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: light ? NormalBlending : AdditiveBlending,
    vertexShader: `uniform float uTime; uniform float uPixelRatio; uniform float uScrollPhase;
      attribute float aSize; varying vec3 vColor; varying float vTwinkle;
      void main() {
        vColor = color;
        float phase = dot(position,vec3(2.7,4.3,1.2));
        vTwinkle = 0.74+0.26*sin(uTime*0.38+phase);
        vec3 p = position;
        p.xy += vec2(sin(uTime*0.023+phase+uScrollPhase*0.11),cos(uTime*0.019+phase+uScrollPhase*0.13))*0.25;
        vec4 view = modelViewMatrix*vec4(p,1.0);
        gl_Position = projectionMatrix*view;
        gl_PointSize = clamp(aSize*uPixelRatio*10.0/-view.z,3.0,30.0);
      }`,
    fragmentShader: `uniform float uLight; varying vec3 vColor; varying float vTwinkle;
      void main() {
        float r = length(gl_PointCoord-0.5)*2.0;
        if (r>1.0) discard;
        float core = 1.0-smoothstep(mix(0.055,0.12,uLight),mix(0.20,0.30,uLight),r);
        float glow = exp(-r*r*14.0)*mix(0.10,0.0,uLight);
        float warm = smoothstep(0.05,0.45,vColor.r-vColor.b);
        vec3 day = mix(vec3(0.18,0.34,0.56),vec3(0.51,0.36,0.21),warm);
        gl_FragColor = vec4(mix(vColor,day,uLight),(core+glow)*vTwinkle*mix(0.7,0.90,uLight));
        #include <colorspace_fragment>
      }`,
  });
  const distantStars = new Points(distantGeometry, distantMaterial);
  distantStars.renderOrder = 0;
  scene.add(distantStars);
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: light ? NormalBlending : AdditiveBlending,
    uniforms,
    vertexShader: `${deformation}
      attribute float aSize; attribute vec3 aDayColor;
      uniform float uPixelRatio;
      varying vec3 vColor; varying float vFlow;
      void main() {
        vFlow = flowFade(position);
        vColor = mix(color, aDayColor, uLight);
        vec4 view = particleView(position, 0.0);
        gl_Position = projectionMatrix * view;
        gl_PointSize = aSize * uPixelRatio * clamp(10.0/-view.z,0.85,1.25) * mix(1.3,1.55,uLight);
      }`,
    fragmentShader: `varying vec3 vColor; varying float vFlow; uniform float uDisperse; uniform float uLight;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float warm = smoothstep(0.05,0.45,vColor.r-vColor.b);
        vec3 ink = mix(vec3(0.07,0.20,0.48),vec3(0.55,0.12,0.26),warm);
        gl_FragColor = vec4(vColor, (1.0 - smoothstep(0.85-fwidth(d), 0.85+fwidth(d), d)) * mix(0.94,0.90,uLight) * vFlow * (1.0 - uDisperse * 0.25));
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
  starGeometry.setAttribute(
    "aDayColor",
    new InstancedBufferAttribute(dayStarColors, 3)
  );
  starGeometry.setAttribute(
    "aOrbit",
    new InstancedBufferAttribute(starFlows, 4)
  );
  starGeometry.instanceCount = starCount;
  const starMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: light ? NormalBlending : AdditiveBlending,
    uniforms,
    vertexShader: `${deformation}
      attribute vec3 aCenter; attribute vec3 aColor; attribute vec3 aDayColor; attribute float aSize;
      uniform vec2 uCanvasSize; uniform float uPixelRatio; uniform float uMobile;
      varying vec2 vUv; varying vec3 vColor; varying float vBrightness; varying float vProminence; varying float vLens; varying float vCoreRadius; varying float vForeshorten;
      void main() {
        vUv = position.xy * 2.0;
        vColor = mix(aColor,aDayColor,uLight);
        vBrightness = (0.82 + 0.18*sin(uTime*0.42+length(aCenter.xy)*1.15))*flowFade(aCenter);
        vProminence = smoothstep(2.9,3.5,aSize);
        vec4 center = particleView(aCenter, 0.0);
        vLens = cursorLight(center);
        vec3 travel = center.xyz-particleView(aCenter,0.04).xyz;
        vForeshorten = 0.35+0.65*clamp(length(travel.xy)/max(length(travel),0.00001),0.0,1.0);
        // Bound the luminous core in screen pixels independently from its halo.
        float depth = clamp(10.0 / -center.z,0.7,1.3);
        float diameter = (10.0 + aSize*5.0)*depth*mix(1.0,0.75,uMobile);
        float corePixels = aSize*0.7*depth*mix(mix(1.0,0.72,uMobile),1.30,uLight);
        vCoreRadius = corePixels / (diameter*0.5);
        float worldSize = diameter * 2.0 * (-center.z) / (projectionMatrix[1][1] * uCanvasSize.y / uPixelRatio);
        center.xy += position.xy * worldSize;
        gl_Position = projectionMatrix * center;
      }`,
    fragmentShader: `varying vec2 vUv; varying vec3 vColor; varying float vBrightness; varying float vProminence; varying float vLens; varying float vCoreRadius; varying float vForeshorten;
      uniform float uDisperse; uniform float uLight;
      void main() {
        float r = length(vUv);
        if (r > 1.0) discard;
        float core = exp(-r*r/(vCoreRadius*vCoreRadius)*1.5);
        float corona = exp(-r*r/(vCoreRadius*vCoreRadius)*0.25);
        float halo = exp(-r*r*9.0);
        float glint = (exp(-abs(vUv.x)*90.0)*exp(-abs(vUv.y)*12.0)
          + exp(-abs(vUv.y)*90.0)*exp(-abs(vUv.x)*12.0))*vProminence;
        float night = core + corona*0.23 + halo*0.035 + glint*0.045;
        float day = core + corona*0.20 + halo*0.012 + glint*0.09;
        vec3 emission = mix(vColor,vec3(1.0),core*vProminence*0.7)*(1.0+core*mix(0.4,3.2,vProminence));
        gl_FragColor = vec4(mix(emission,vColor,uLight),mix(night,day,uLight)*(vBrightness+vLens*0.15)*vForeshorten*(1.0-uDisperse*0.25));
        #include <colorspace_fragment>
      }`,
  });
  const stars = new Mesh(starGeometry, starMaterial);
  stars.frustumCulled = false;
  stars.renderOrder = 3;
  stars.layers.enable(1);
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
  trailGeometry.setAttribute(
    "aOrbit",
    new InstancedBufferAttribute(starFlows, 4)
  );
  trailGeometry.instanceCount = starCount;
  // Only trail vertices need the historical transform array.
  const trailDeformation =
    "uniform mat4 uPoseHistory[16]; uniform vec4 uStateHistory[16];\n" +
    deformation
      .replace(
        "mat4 particleMatrix = modelViewMatrix;",
        `float hi = clamp(age*30.0,0.0,15.0);
       int h = int(floor(hi)); int j = min(h+1,15);
       vec4 state = mix(uStateHistory[h],uStateHistory[j],fract(hi));
       mat4 particleMatrix = uPoseHistory[h]*(1.0-fract(hi))+uPoseHistory[j]*fract(hi);
       age = max(0.0,uTime-state.x);`
      )
      .replace(
        "float historicalSplit = uSplit;",
        "float historicalSplit = state.y;"
      );
  const trailMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: light ? NormalBlending : AdditiveBlending,
    uniforms,
    vertexShader: `${trailDeformation}
      attribute vec3 aCenter; attribute vec3 aColor;
      varying float vAge; varying float vEdge; varying vec3 vColor; varying float vMotion;
      void main() {
        vAge = position.x; vEdge = position.y; vColor = aColor;
        float age = vAge * mix(0.12,0.32,uEnergy);
        vec4 center = particleView(aCenter, age);
        vec4 next = particleView(aCenter, min(age + 0.033, 0.5));
        vMotion = clamp((length(next.xy-center.xy)-0.018)*12.0,0.0,1.0);
        vec2 tangent = normalize(next.xy - center.xy + vec2(0.00001));
        center.xy += vec2(-tangent.y, tangent.x) * position.y * (0.003+uEnergy*0.008+vMotion*0.008) * (1.0 - vAge);
        gl_Position = projectionMatrix * center;
      }`,
    fragmentShader: `varying float vAge; varying float vEdge; varying vec3 vColor; varying float vMotion;
      uniform float uLight; uniform float uDisperse; uniform float uEnergy;
      void main() {
        float alpha = pow(1.0 - vAge, 1.8) * (1.0 - vEdge * vEdge) * mix(0.506,0.30,uLight) * (1.0 - uDisperse * 0.255);
        vec3 ink = vec3(0.16, 0.31, 0.53);
        gl_FragColor = vec4(mix(vColor, ink, uLight), alpha*max(0.12+uEnergy*0.88,vMotion));
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
    distantMaterial,
  ]) {
    // Mask pixels, not billboard vertices: large near stars otherwise interpolate
    // an unmasked corner across text even when their center is inside the reader.
    opticalMaterial.fragmentShader =
      `
      uniform float uLight; uniform float uSplit;
      uniform vec4 uCopyBounds; uniform float uCopyOpacity;
      uniform vec4 uQuietBoxes[4];
      uniform float uReading; uniform vec2 uGatherZone;
      uniform vec2 uCanvasSize;
      float readableArea() {
        vec2 p = gl_FragCoord.xy / uCanvasSize;
        float x = smoothstep(uCopyBounds.x-0.05,uCopyBounds.x,p.x) * (1.0-smoothstep(uCopyBounds.z,uCopyBounds.z+0.08,p.x));
        float y = smoothstep(uCopyBounds.y-0.04,uCopyBounds.y,p.y) * (1.0-smoothstep(uCopyBounds.w,uCopyBounds.w+0.04,p.y));
        float edge = mix(mix(0.40,0.50,uLight),mix(0.85,1.0,uLight),smoothstep(0.44,0.90,abs(p.x-0.5)*2.0));
        float openBand = smoothstep(uGatherZone.x,uGatherZone.x+0.06,p.y) * (1.0-smoothstep(uGatherZone.y-0.06,uGatherZone.y,p.y));
        float quiet = 1.0;
        for (int i=0;i<4;i++) {
          vec4 b = uQuietBoxes[i];
          float qx = smoothstep(b.x-0.04,b.x+0.02,p.x)*(1.0-smoothstep(b.z-0.02,b.z+0.04,p.x));
          float qy = smoothstep(b.y-0.025,b.y+0.02,p.y)*(1.0-smoothstep(b.w-0.02,b.w+0.025,p.y));
          quiet *= 1.0-qx*qy*mix(0.70,0.68,uLight);
        }
        return quiet * (1.0-x*y*0.96*uCopyOpacity) * mix(1.0,max(edge,openBand*smoothstep(0.34,0.48,p.x)),uReading);
      }
` +
      opticalMaterial.fragmentShader
        .replaceAll("uniform float uLight;", "")
        .replace(
          "#include <colorspace_fragment>",
          "gl_FragColor.a *= readableArea();\n#include <colorspace_fragment>"
        );
  }

  material.fragmentShader = material.fragmentShader.replace(
    "float d = length(gl_PointCoord",
    "if (fract(sin(vSeed)*43758.5453) < uSplit*mix(0.94,0.98,uLight)) discard;\n        float d = length(gl_PointCoord"
  );
  material.vertexShader = material.vertexShader
    .replace(
      "varying vec3 vColor;",
      "varying float vSeed; varying vec3 vColor;"
    )
    .replace(
      "vFlow = flowFade(position);",
      "vSeed = dot(position,vec3(12.3,8.1,3.7)); vFlow = flowFade(position);"
    );
  material.fragmentShader = "varying float vSeed;\n" + material.fragmentShader;

  // Only stars enter the half-resolution linear-light bloom buffer.
  renderer.toneMapping = NeutralToneMapping;
  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new Vector2(1, 1), 0.52, 0.28, 1.3);
  // Truncate each Gaussian at three sigma; the addon's broad default kernel
  // makes isolated point highlights look like small square patches.
  for (const blur of bloomPass.separableBlurMaterials) {
    const weights = blur.uniforms.gaussianCoefficients.value as number[];
    const sigma = Math.max(0.75, (weights.length - 1) / 3);
    blur.uniforms.gaussianCoefficients.value = weights.map((_, i) =>
      Math.exp(-0.5 * (i / sigma) ** 2)
    );
  }
  bloomComposer.addPass(bloomPass);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const combinePass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      bloom: { value: null },
      strength: { value: light ? 0 : 1 },
    },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform sampler2D bloom; uniform float strength; varying vec2 vUv;
      void main(){vec4 base=texture2D(tDiffuse,vUv);gl_FragColor=vec4(base.rgb+texture2D(bloom,vUv).rgb*strength,base.a);}`,
  });
  combinePass.uniforms.bloom.value =
    bloomPass.renderTargetsHorizontal[0].texture;
  composer.addPass(combinePass);
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  let frame = 0,
    disposed = false,
    visible = true,
    lost = false,
    paused = reducedMotion;
  let lastTime = 0,
    elapsed = 0,
    hover = 0,
    targetHover = 0;
  const rotation = new RotationMotion(
    new Quaternion().setFromEuler(new Euler(0.12, -0.12, -0.025))
  );
  const orientation = rotation.orientation;
  const initialOrientation = rotation.home;
  const angularAxis = new Vector3(0, 1, 0);
  const increment = new Quaternion();
  let dragging = false,
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
  let lastFlowSample = 0;
  let historyClock = 0,
    historyReady = false;
  const frameIntervals: number[] = [];
  let statsAt = 0;
  let bloomWidth = 1,
    bloomHeight = 1;
  const viewPose = new Matrix4();
  const artworkCenter = new Vector3();
  let artworkRadius = 100;
  let bounds = host.getBoundingClientRect();
  function paint(dt = 0.016) {
    const smoothing = 1 - Math.exp(-dt * 9);
    // Bounded scroll energy affects trails; only reversible layout progress owns shape.
    const flowTarget = reducedMotion
      ? 0
      : Math.min(1, Math.max(0, window.scrollY) / Math.max(1, bounds.height));
    const lastFlow = uniforms.uScrollPhase.value;
    uniforms.uScrollPhase.value +=
      (flowTarget - lastFlow) * (paused ? 1 : 1 - Math.exp(-dt * 12));
    const flowSpeed = Math.min(
      2,
      Math.abs(uniforms.uScrollPhase.value - lastFlow) / Math.max(dt, 0.008)
    );
    uniforms.uPreviousScrollPhase.value +=
      (uniforms.uScrollPhase.value - uniforms.uPreviousScrollPhase.value) *
      (1 - Math.exp(-dt * 4.5));
    if (import.meta.env.DEV && performance.now() - lastFlowSample > 250) {
      lastFlowSample = performance.now();
      host.dataset.scrollPhase = uniforms.uScrollPhase.value.toFixed(3);
      host.dataset.scrollSpeed = flowSpeed.toFixed(3);
      host.dataset.pointerInfluence = hover.toFixed(2);
    }
    if (pageScene.mode === "home" && !stage?.isConnected) bindHome();
    if (pageScene.mode === "author" && !copy?.isConnected)
      copy = document.querySelector(".author-page .about-letter");
    bounds = host.getBoundingClientRect();
    if (!quietNodes.length || quietNodes.some(node => !node.isConnected)) {
      quietNodes = Array.from(
        document.querySelectorAll(
          ".public-universe :is(.paper-reader-main,.paper-toc-rail,.search-results-surface,.archive-timeline,.observatory-featured,.observatory-notes,.track-article-ledger,.track-path-section,.page-hero,.taxonomy-notes-surface,.taxonomy-side-panel,.about-focus-ledger,.about-links-rail)"
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
    if (!paused) uniforms.uWakeTime.value = performance.now() / 1000;
    uniforms.uWakeRadius.value =
      (2 * Math.min(100, Math.max(65, bounds.height * 0.11))) / bounds.height;
    if (import.meta.env.DEV)
      host.dataset.wakeSegments = String(
        pointerWake.activeCount(uniforms.uWakeTime.value)
      );
    hover +=
      (targetHover - hover) *
      (1 - Math.exp(-dt * (targetHover > hover ? 10 : 3.5)));
    pointer.lerp(pointerTarget, smoothing);
    uniforms.uPointer.value.copy(pointer);
    uniforms.uHover.value = hover;
    previousPointer.lerp(pointer, 1 - Math.exp(-dt * 2.2));
    uniforms.uPreviousPointer.value.copy(previousPointer);
    uniforms.uEnergy.value +=
      (Math.min(
        1,
        rotation.speed / 3 +
          pointer.distanceTo(previousPointer) +
          flowSpeed * 0.65
      ) -
        uniforms.uEnergy.value) *
      smoothing;
    if (!paused) rotation.advance(dt);
    host.dataset.interaction = rotation.phase;
    group.quaternion.copy(orientation);
    // Ambient flow follows local strokes; user input owns the 3D orientation.
    const splitBlend = uniforms.uSplit.value;
    const worldHeight =
      2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const worldWidth = worldHeight * camera.aspect;
    // Fit the complete rose beside the copy instead of hiding overlapping petals.
    const copyRight = copy?.getBoundingClientRect().right ?? bounds.left;
    const roseLeft = Math.max(
      bounds.width * 0.43,
      copyRight - bounds.left + 24
    );
    const roseRight = bounds.width - 30;
    const roseWidth = Math.max(120, roseRight - roseLeft);
    const homeScale = Math.min(
      1,
      ((roseWidth / bounds.width) * worldWidth) / 8.6,
      worldHeight / 9.4
    );
    const homeX =
      ((roseLeft + roseRight) / 2 / bounds.width - 0.5) * worldWidth;
    const homeComposition = pageScene.mode === "home" ? 1 - splitBlend : 0;
    group.position.x = mobile
      ? 0
      : pageScene.mode === "author"
        ? 2.8
        : homeX * homeComposition +
          (1.0 + gather * 1.8) * (1 - homeComposition);
    const mobileBottom = copy?.isConnected
      ? (1 - uniforms.uCopyBounds.value.w) * bounds.height - 28
      : bounds.height * 0.44;
    const mobileHeight = Math.max(140, mobileBottom - 96);
    const mobileScale = Math.min(
      worldWidth / 7.6,
      ((mobileHeight / bounds.height) * worldHeight) / 7.6
    );
    group.scale.setScalar(
      mobile
        ? mobileScale * homeComposition + splitBlend
        : homeScale * homeComposition + (1 - homeComposition)
    );
    group.position.y = mobile
      ? (0.5 - (96 + mobileBottom) / 2 / bounds.height) *
        worldHeight *
        (1 - splitBlend)
      : 0;
    camera.updateMatrixWorld();
    group.updateMatrixWorld();
    viewPose.multiplyMatrices(camera.matrixWorldInverse, group.matrixWorld);
    artworkCenter.copy(group.position).project(camera);
    artworkCenter.set(
      ((artworkCenter.x + 1) * bounds.width) / 2,
      ((1 - artworkCenter.y) * bounds.height) / 2,
      0
    );
    artworkRadius = (3.2 * group.scale.x * bounds.height) / worldHeight;
    if (import.meta.env.DEV) {
      host.dataset.returnAngle = orientation
        .angleTo(initialOrientation)
        .toFixed(4);
      host.dataset.artworkCenter = `${artworkCenter.x.toFixed(1)},${artworkCenter.y.toFixed(1)}`;
      host.dataset.artworkRadius = artworkRadius.toFixed(1);
      host.dataset.elapsed = elapsed.toFixed(3);
    }
    historyClock += dt;
    if (!historyReady) {
      uniforms.uPoseHistory.value.forEach(matrix => matrix.copy(viewPose));
      uniforms.uStateHistory.value.forEach(state =>
        state.set(elapsed, split, 0, 0)
      );
      historyReady = true;
    } else if (historyClock >= 1 / 30) {
      for (let i = 15; i > 0; i--) {
        uniforms.uPoseHistory.value[i].copy(uniforms.uPoseHistory.value[i - 1]);
        uniforms.uStateHistory.value[i].copy(
          uniforms.uStateHistory.value[i - 1]
        );
      }
      historyClock %= 1 / 30;
    }
    uniforms.uPoseHistory.value[0].copy(viewPose);
    uniforms.uStateHistory.value[0].set(elapsed, split, 0, 0);
    if (!light) {
      camera.layers.set(1);
      uniforms.uCanvasSize.value.set(bloomWidth, bloomHeight);
      bloomComposer.render(dt);
      camera.layers.set(0);
      uniforms.uCanvasSize.value.set(
        bounds.width * renderer.getPixelRatio(),
        bounds.height * renderer.getPixelRatio()
      );
    }
    renderer.toneMapping = light ? NoToneMapping : NeutralToneMapping;
    combinePass.uniforms.strength.value = light ? 0 : 1;
    composer.render(dt);
  }
  function tick(now: number) {
    frame = 0;
    if (disposed || !visible || document.hidden || lost || paused) return;
    const delta = now - lastTime;
    if (delta >= (mobile && coarsePointer ? 1000 / 30 : 1000 / 60) - 3) {
      if (import.meta.env.DEV) {
        frameIntervals.push(delta);
        if (frameIntervals.length > 180) frameIntervals.shift();
        if (now - statsAt > 2000) {
          statsAt = now;
          const sorted = [...frameIntervals].sort((a, b) => a - b);
          host.dataset.fps = (
            1000 /
            (frameIntervals.reduce((a, b) => a + b, 0) / frameIntervals.length)
          ).toFixed(1);
          host.dataset.frameP95 =
            sorted[Math.floor((sorted.length - 1) * 0.95)].toFixed(1);
          host.dataset.geometries = String(renderer.info.memory.geometries);
          host.dataset.textures = String(renderer.info.memory.textures);
        }
      }
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
    historyReady = false;
    pointerWake.clear();
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
    mobile = width < 640;
    renderer.setPixelRatio(
      Math.min(devicePixelRatio, mobile && coarsePointer ? 1.25 : 1.5)
    );
    uniforms.uMobile.value = mobile && coarsePointer ? 1 : 0;
    bloomPass.strength = mobile ? 0.18 : 0.28;
    frameIntervals.length = 0;
    uniforms.uPixelRatio.value = renderer.getPixelRatio();
    uniforms.uCanvasSize.value.set(
      width * renderer.getPixelRatio(),
      height * renderer.getPixelRatio()
    );
    uniforms.uAspect.value = width / height;
    geometry.setDrawRange(0, mobile ? 2800 : count);
    starGeometry.instanceCount = mobile
      ? coarsePointer
        ? 128
        : 200
      : starCount;
    trailGeometry.instanceCount = mobile
      ? coarsePointer
        ? 128
        : 200
      : starCount;
    distantGeometry.setDrawRange(0, mobile ? 90 : distantCount);
    renderer.setSize(width, height);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(width, height);
    bloomComposer.setPixelRatio(1);
    bloomWidth = Math.round(width * renderer.getPixelRatio() * 0.5);
    bloomHeight = Math.round(height * renderer.getPixelRatio() * 0.5);
    bloomComposer.setSize(bloomWidth, bloomHeight);
    historyReady = false;
    pointerWake.clear();
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
    // Recover even if pointerup was lost outside the browser/capture surface.
    if (
      dragging &&
      event.pointerId === activePointer &&
      (event.buttons & 1) === 0
    )
      finishDrag();
    pointerTarget.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      1 - ((event.clientY - bounds.top) / bounds.height) * 2
    );
    if (hover < 0.01) {
      pointer.copy(pointerTarget);
      previousPointer.copy(pointerTarget);
    }
    targetHover = 1;
    if (
      !paused &&
      (event.buttons === 0 || dragging) &&
      pageScene.mode === "home" &&
      uniforms.uSplit.value < 0.85
    ) {
      pointerWake.push(
        event.clientX - bounds.left,
        event.clientY - bounds.top,
        performance.now() / 1000,
        bounds.width,
        bounds.height
      );
    } else pointerWake.release();
    if (dragging && event.pointerId === activePointer) {
      const next = projectTrackball(
        event.clientX - bounds.left - artworkCenter.x + artworkRadius,
        event.clientY - bounds.top - artworkCenter.y + artworkRadius,
        artworkRadius * 2,
        artworkRadius * 2
      );
      const delta = trackballDelta(dragPoint, next);
      rotation.move(delta, (event.timeStamp - lastMoveTime) / 1000);
      dragPoint.copy(next);
      lastMoveTime = event.timeStamp;
    }
    requestPaint();
  };
  const down = (event: PointerEvent) => {
    if (reducedMotion) return;
    if (event.button !== 0 || !event.isPrimary || paused) return;
    if ((event.target as Element).closest("button,a,input,textarea,select"))
      return;
    if (pageScene.mode !== "home" || uniforms.uSplit.value > 0.5) return;
    if (
      Math.hypot(
        event.clientX - bounds.left - artworkCenter.x,
        event.clientY - bounds.top - artworkCenter.y
      ) >
      artworkRadius * 1.15
    )
      return;
    bounds = host.getBoundingClientRect();
    pointerWake.release();
    dragging = true;
    activePointer = event.pointerId;
    dragPoint = projectTrackball(
      event.clientX - bounds.left - artworkCenter.x + artworkRadius,
      event.clientY - bounds.top - artworkCenter.y + artworkRadius,
      artworkRadius * 2,
      artworkRadius * 2
    );
    lastMoveTime = event.timeStamp;
    rotation.begin();
    controls.setPointerCapture(event.pointerId);
    controls.dataset.dragging = "true";
    move(event);
  };
  const finishDrag = (cancelled = false) => {
    if (!dragging) return;
    const pointerId = activePointer;
    dragging = false;
    activePointer = -1;
    pointerWake.release();
    rotation.release(cancelled);
    controls.dataset.dragging = "false";
    if (controls.hasPointerCapture(pointerId))
      controls.releasePointerCapture(pointerId);
  };
  const up = (event: PointerEvent) => {
    if (event.pointerId !== activePointer) return;
    finishDrag(event.type !== "pointerup");
    if (event.pointerType !== "mouse") targetHover = 0;
  };
  const leave = () => {
    pointerWake.release();
    finishDrag(true);
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
      rotation.reset();
      historyReady = false;
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
      rotation.phase = "returning";
      rotation.speed = 0;
      historyReady = false;
    }
    requestPaint();
  };
  window.addEventListener("scroll", requestPaint, { passive: true });
  // Track the pointer across reading surfaces too; only artwork starts a drag.
  window.addEventListener("pointermove", move);
  controls.addEventListener("pointerdown", down);
  window.addEventListener("pointerup", up, true);
  window.addEventListener("pointercancel", up, true);
  controls.addEventListener("lostpointercapture", up);
  document.documentElement.addEventListener("pointerleave", leave);
  window.addEventListener("blur", leave);
  controls.addEventListener("keydown", key);
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    host.dataset.ready = "false";
    sync();
  };
  const contextRestored = () => {
    lost = false;
    historyReady = false;
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
      pointerWake.clear();
      finishDrag(true);
      rotation.reset();
      historyReady = false;
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
      light = isLight;
      geometry.setDrawRange(0, mobile ? 2800 : count);
      uniforms.uLight.value = isLight ? 1 : 0;
      material.blending =
        starMaterial.blending =
        trailMaterial.blending =
        distantMaterial.blending =
          isLight ? NormalBlending : AdditiveBlending;
      material.needsUpdate =
        starMaterial.needsUpdate =
        trailMaterial.needsUpdate =
        distantMaterial.needsUpdate =
          true;
      requestPaint();
    },
    setPaused(value: boolean) {
      paused = reducedMotion || value;
      if (paused) finishDrag(true);
      historyReady = false;
      sync();
      requestPaint();
    },
    handleKey(event: KeyboardEvent) {
      key(event);
    },
    dispose() {
      disposed = true;
      sync();
      resize.disconnect();
      intersection.disconnect();
      window.removeEventListener("scroll", requestPaint);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", move);
      controls.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);
      controls.removeEventListener("lostpointercapture", up);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      controls.removeEventListener("keydown", key);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      renderer.domElement.removeEventListener(
        "webglcontextrestored",
        contextRestored
      );
      trackTexture.dispose();
      bloomPass.dispose();
      bloomComposer.dispose();
      combinePass.dispose();
      outputPass.dispose();
      composer.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      geometry.dispose();
      material.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      trailGeometry.dispose();
      trailMaterial.dispose();
      distantGeometry.dispose();
      distantMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      host.dataset.ready = "false";
    },
  };
}
