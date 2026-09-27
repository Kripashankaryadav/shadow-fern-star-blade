import * as THREE from "three";
import { game } from "./state";
import { CHECKPOINTS } from "./worldData";
import { mA } from "./math";

export interface Enemy {
  pos: THREE.Vector3;
  yaw: number;
  gate: number;
  speed: number;
  offset: THREE.Vector3;
  t: number;
}

export const enemies: Enemy[] = [
  { pos: new THREE.Vector3(6, 16, 10), yaw: 0, gate: 0, speed: 34, offset: new THREE.Vector3(6, 1.5, 0), t: 0 },
  { pos: new THREE.Vector3(-8, 18, 4), yaw: 0, gate: 0, speed: 30, offset: new THREE.Vector3(-7, 2.2, 4), t: 0.4 },
  { pos: new THREE.Vector3(0, 20, -8), yaw: 0, gate: 0, speed: 38, offset: new THREE.Vector3(4, 3, -2), t: 1.1 },
];

const dummy = new THREE.Object3D();

export function resetEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]!;
    e.gate = 0;
    e.pos.set(START_OFF[i]![0], START_OFF[i]![1], START_OFF[i]![2]);
    e.yaw = 0;
  }
}

const START_OFF = [
  [6, 16, 10],
  [-8, 18, 4],
  [3, 19, -6],
];

export function stepEnemies(dt: number) {
  if (!game.race.live && usePlayingOnly()) return;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]!;
    const target = CHECKPOINTS[Math.min(e.gate, CHECKPOINTS.length - 1)]!;
    const tx = target.x + e.offset.x;
    const ty = target.y + e.offset.y;
    const tz = target.z + e.offset.z;
    const dx = tx - e.pos.x;
    const dy = ty - e.pos.y;
    const dz = tz - e.pos.z;
    const dist = Math.hypot(dx, dy, dz) || 0.001;
    const sp = e.speed * (0.85 + Math.sin(game.simTime * 0.4 + i) * 0.12);
    e.pos.x += (dx / dist) * sp * dt;
    e.pos.y += (dy / dist) * sp * dt;
    e.pos.z += (dz / dist) * sp * dt;
    e.yaw = Math.atan2(-dx, -dz);
    if (dist < 12 && e.gate < CHECKPOINTS.length - 1) e.gate += 1;

    const g = game.refs.enemyGroups[i];
    if (g) {
      g.position.copy(e.pos);
      g.rotation.set(0, e.yaw, Math.sin(game.simTime * 4 + i) * 0.12);
    }
  }

  const mesh = game.refs.traffic;
  if (mesh) {
    for (let i = 0; i < 8; i++) {
      const ang = game.simTime * 0.12 + i * 0.785;
      dummy.position.set(Math.sin(ang) * 160, 56 + (i % 3) * 8, Math.cos(ang) * 90 - 200);
      dummy.lookAt(dummy.position.x + Math.cos(ang) * 4, dummy.position.y, dummy.position.z - Math.sin(ang) * 4);
      dummy.scale.set(4.5, 1.2, 2.2);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
}

function usePlayingOnly() {
  return false;
}

void mA;
