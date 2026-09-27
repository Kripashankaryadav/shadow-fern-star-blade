import * as THREE from "three";
import { game } from "./state";

const MAX = 80;

export function createParticleState() {
  const pos = new Float32Array(MAX * 3);
  const vel = new Float32Array(MAX * 3);
  const life = new Float32Array(MAX);
  for (let i = 0; i < MAX; i++) life[i] = 0;
  return { pos, vel, life, geo: null as THREE.BufferGeometry | null };
}

export const sparks = createParticleState();

export function burst(x: number, y: number, z: number, n: number) {
  let spawned = 0;
  for (let i = 0; i < MAX && spawned < n; i++) {
    if ((sparks.life[i] ?? 0) > 0) continue;
    sparks.life[i] = 0.45 + Math.random() * 0.35;
    const i3 = i * 3;
    sparks.pos[i3] = x;
    sparks.pos[i3 + 1] = y;
    sparks.pos[i3 + 2] = z;
    sparks.vel[i3] = (Math.random() - 0.5) * 22;
    sparks.vel[i3 + 1] = Math.random() * 16;
    sparks.vel[i3 + 2] = (Math.random() - 0.5) * 22;
    spawned++;
  }
}

export function stepParticles(dt: number) {
  const pos = sparks.pos;
  const vel = sparks.vel;
  for (let i = 0; i < MAX; i++) {
    const l = sparks.life[i] ?? 0;
    if (l <= 0) continue;
    const nl = l - dt;
    sparks.life[i] = nl;
    const i3 = i * 3;
    vel[i3 + 1] -= 18 * dt;
    pos[i3] += vel[i3] * dt;
    pos[i3 + 1] += vel[i3 + 1] * dt;
    pos[i3 + 2] += vel[i3 + 2] * dt;
    if (nl <= 0) {
      pos[i3 + 1] = -999;
    }
  }
  sparks.geo?.attributes.position && (sparks.geo.attributes.position.needsUpdate = true);
}

game.burst = burst;
