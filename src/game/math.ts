import * as THREE from "three";

export const vA = new THREE.Vector3();
export const vB = new THREE.Vector3();
export const vC = new THREE.Vector3();
export const vD = new THREE.Vector3();
export const vUp = new THREE.Vector3(0, 1, 0);
export const qA = new THREE.Quaternion();
export const qB = new THREE.Quaternion();
export const eA = new THREE.Euler();
export const mA = new THREE.Matrix4();
export const mB = new THREE.Matrix4();

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function damp(current: number, target: number, lambda: number, dt: number) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export function dampVec(current: THREE.Vector3, target: THREE.Vector3, lambda: number, dt: number) {
  current.lerp(target, 1 - Math.exp(-lambda * dt));
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2(x: number, z: number) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function noise2(x: number, z: number) {
  return (
    Math.sin(x * 0.012) * Math.cos(z * 0.01) +
    Math.sin(x * 0.027 + z * 0.019) * 0.45 +
    Math.sin((x + z) * 0.008) * 0.7
  );
}

/** Mountain height; city/industrial floors handled in terrainHeight. */
export function mountainHeight(x: number, z: number) {
  const n = noise2(x, z);
  const corridor = clamp((Math.abs(x) - 42) / 28, 0, 1);
  return 6 + n * 16 + corridor * corridor * 52;
}

export function terrainHeight(x: number, z: number) {
  if (z > -360) return 0;
  if (z > -420) {
    const t = (-z - 360) / 60;
    return mountainHeight(x, z) * t;
  }
  if (z > -840) return mountainHeight(x, z);
  if (z > -920) {
    const t = 1 - (-z - 840) / 80;
    return mountainHeight(x, z) * t;
  }
  return 0.4;
}

export function wrapPi(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

export function formatTime(seconds: number) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const rem = s - m * 60;
  const whole = Math.floor(rem);
  const cs = Math.floor((rem - whole) * 100);
  return `${String(m).padStart(2, "0")}:${String(whole).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export function radialDeadzone(x: number, y: number, dz = 0.15) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = (m - dz) / (1 - dz) / m;
  return { x: x * scale, y: y * scale };
}
