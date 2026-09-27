import * as THREE from "three";

const U = {
  time: { value: 0 },
  night: { value: 0 },
  sun: { value: 1 },
  sunDir: { value: new THREE.Vector3(0.3, 1, 0.2).normalize() },
  fogColor: { value: new THREE.Color("#87a0b4") },
  fogNear: { value: 80 },
  fogFar: { value: 420 },
};

export const gfxUniforms = U;

function fogChunkVert() {
  return `
    varying vec3 vWorldPos;
    varying vec3 vN;
  `;
}

function lambertVert() {
  return `
    ${fogChunkVert()}
    void main() {
      vec4 transformed = vec4(position, 1.0);
      vec3 nrm = normal;
#ifdef USE_INSTANCING
      transformed = instanceMatrix * transformed;
      nrm = mat3(instanceMatrix) * nrm;
#endif
      vec4 wp = modelMatrix * transformed;
      vWorldPos = wp.xyz;
      vN = normalize(mat3(modelMatrix) * nrm);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `;
}

function fogMix(extra: string) {
  return `
    varying vec3 vWorldPos;
    varying vec3 vN;
    uniform vec3 uSunDir;
    uniform vec3 uFogColor;
    uniform float uFogNear;
    uniform float uFogFar;
    uniform float uNight;
    uniform float uSun;
    void main() {
      ${extra}
      float depth = distance(vWorldPos, cameraPosition);
      float fogF = smoothstep(uFogNear, uFogFar, depth);
      col = mix(col, uFogColor, fogF);
      gl_FragColor = vec4(col, 1.0);
    }
  `;
}

let cache: ReturnType<typeof build> | null = null;

function build() {
  const shared = {
    uSunDir: U.sunDir,
    uFogColor: U.fogColor,
    uFogNear: U.fogNear,
    uFogFar: U.fogFar,
    uNight: U.night,
    uSun: U.sun,
    uTime: U.time,
  };

  const building = new THREE.ShaderMaterial({
    uniforms: { ...shared },
    vertexShader: lambertVert(),
    fragmentShader: fogMix(`
      vec3 n = normalize(vN);
      float ndl = max(dot(n, uSunDir), 0.0);
      vec3 hemi = mix(vec3(0.08, 0.07, 0.06), vec3(0.45, 0.52, 0.6) * uSun, n.y * 0.5 + 0.5);
      vec3 albedo = vec3(0.09, 0.11, 0.14);
      float fx = fract(vWorldPos.x * 0.42);
      float fy = fract(vWorldPos.y * 0.36);
      float wall = max(abs(n.x), abs(n.z));
      float win = step(0.45, fx) * step(0.4, fy) * step(0.55, wall) * step(3.0, vWorldPos.y);
      float id = fract(sin(dot(floor(vWorldPos.xy * 0.36), vec2(12.7, 4.2))) * 43758.5);
      float lit = step(0.32, id) * uNight + step(0.88, id) * 0.25;
      vec3 emissive = vec3(0.62, 0.84, 0.92) * win * lit * 1.8;
      vec3 col = albedo * (hemi + vec3(1.0, 0.95, 0.85) * ndl * 0.65 * uSun) + emissive;
    `),
  });

  const terrain = new THREE.ShaderMaterial({
    uniforms: { ...shared },
    vertexShader: lambertVert(),
    fragmentShader: fogMix(`
      vec3 n = normalize(vN);
      float ndl = max(dot(n, uSunDir), 0.0);
      float h = vWorldPos.y;
      vec3 grass = vec3(0.16, 0.22, 0.14);
      vec3 rock = vec3(0.22, 0.20, 0.18);
      vec3 snow = vec3(0.82, 0.86, 0.88);
      vec3 sand = vec3(0.18, 0.17, 0.14);
      vec3 col = mix(sand, grass, smoothstep(2.0, 10.0, h));
      col = mix(col, rock, 1.0 - smoothstep(0.55, 0.88, n.y));
      col = mix(col, snow, smoothstep(38.0, 58.0, h) * smoothstep(0.6, 0.9, n.y));
      vec3 hemi = mix(vec3(0.09, 0.08, 0.07), vec3(0.5, 0.58, 0.62) * uSun, n.y * 0.5 + 0.5);
      col *= hemi + vec3(1.0, 0.96, 0.88) * ndl * 0.7 * uSun;
    `),
  });

  const cityGround = new THREE.MeshLambertMaterial({ color: "#1a1e26" });
  const road = new THREE.MeshLambertMaterial({ color: "#12151a" });
  const concrete = new THREE.MeshLambertMaterial({ color: "#2a2e34" });
  const rust = new THREE.MeshLambertMaterial({ color: "#3a332c" });
  const metal = new THREE.MeshStandardMaterial({
    color: "#4a5560",
    metalness: 0.72,
    roughness: 0.38,
  });
  const pine = new THREE.MeshLambertMaterial({ color: "#1d3a28" });
  const trunk = new THREE.MeshLambertMaterial({ color: "#3a2a1c" });
  const rock = new THREE.MeshLambertMaterial({ color: "#5a564e" });
  const neon = new THREE.MeshStandardMaterial({
    color: "#8ec8d8",
    emissive: "#8ec8d8",
    emissiveIntensity: 1.4,
  });
  const droneBody = new THREE.MeshStandardMaterial({
    color: "#1c2128",
    metalness: 0.55,
    roughness: 0.35,
  });
  const droneAccent = new THREE.MeshStandardMaterial({
    color: "#8ec8d8",
    emissive: "#3d8a9c",
    emissiveIntensity: 0.7,
    metalness: 0.4,
    roughness: 0.4,
  });
  const droneDark = new THREE.MeshStandardMaterial({
    color: "#0e1116",
    metalness: 0.6,
    roughness: 0.4,
  });
  const enemy = new THREE.MeshStandardMaterial({
    color: "#2a1c1c",
    emissive: "#5a2a24",
    emissiveIntensity: 0.45,
    metalness: 0.5,
    roughness: 0.4,
  });
  const spark = new THREE.PointsMaterial({
    color: "#d7eef4",
    size: 0.28,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const rain = new THREE.PointsMaterial({
    color: "#9aa8b4",
    size: 0.12,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });

  const sky = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { ...shared },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vDir;
      uniform float uSun;
      uniform float uNight;
      void main() {
        vec3 d = normalize(vDir);
        vec3 zenith = mix(vec3(0.02, 0.03, 0.06), vec3(0.28, 0.48, 0.72), uSun);
        vec3 hor = mix(vec3(0.04, 0.05, 0.08), vec3(0.62, 0.58, 0.52), uSun);
        float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(hor, zenith, pow(h, 1.25));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const water = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { ...shared },
    vertexShader: `
      varying vec2 vUv;
      uniform float uTime;
      void main() {
        vUv = uv;
        vec3 p = position;
        p.y += sin(p.x * 0.18 + uTime) * 0.28 + cos(p.z * 0.16 + uTime * 0.85) * 0.22;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uSun;
      void main() {
        float w = sin(vUv.x * 28.0 + uTime) * 0.5 + sin(vUv.y * 22.0 - uTime * 1.05) * 0.5;
        vec3 deep = vec3(0.05, 0.12, 0.16);
        vec3 hi = vec3(0.22, 0.42, 0.44);
        vec3 col = mix(deep, hi, w * 0.35 + 0.42) * (0.5 + uSun * 0.5);
        gl_FragColor = vec4(col, 0.82);
      }
    `,
  });

  return {
    building,
    terrain,
    cityGround,
    road,
    concrete,
    rust,
    metal,
    pine,
    trunk,
    rock,
    neon,
    droneBody,
    droneAccent,
    droneDark,
    enemy,
    spark,
    rain,
    sky,
    water,
  };
}

export function getMaterials() {
  if (!cache) cache = build();
  return cache;
}

export function disposeMaterials() {
  if (!cache) return;
  for (const v of Object.values(cache)) v.dispose();
  cache = null;
}
