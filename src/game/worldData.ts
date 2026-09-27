import { hash2, mulberry32, terrainHeight } from "./math";
import type { Aabb, BridgeDef, CheckpointDef, InstanceItem, ObstacleDef, RingDef } from "./types";

export const START = { x: 0, y: 16, z: 28, yaw: 0 };
export const WORLD_MIN_X = -230;
export const WORLD_MAX_X = 230;
export const WORLD_MIN_Z = -1420;
export const WORLD_MAX_Z = 90;
export const RACE_BUDGET = 150;

export const CHECKPOINTS: CheckpointDef[] = [
  { x: 0, y: 16, z: -36, yaw: 0, r: 10 },
  { x: -38, y: 18, z: -108, yaw: 0.35, r: 9 },
  { x: 32, y: 15, z: -178, yaw: -0.28, r: 9 },
  { x: 0, y: 11, z: -248, yaw: 0, r: 8 },
  { x: 0, y: 22, z: -328, yaw: 0, r: 10 },
  { x: 42, y: 20, z: -412, yaw: -0.42, r: 9 },
  { x: -34, y: 34, z: -512, yaw: 0.38, r: 9 },
  { x: 22, y: 26, z: -604, yaw: -0.22, r: 9 },
  { x: 0, y: 15, z: -692, yaw: 0, r: 8 },
  { x: -42, y: 24, z: -782, yaw: 0.28, r: 9 },
  { x: 12, y: 16, z: -882, yaw: 0, r: 9 },
  { x: 40, y: 14, z: -982, yaw: -0.18, r: 8 },
  { x: -26, y: 20, z: -1104, yaw: 0.22, r: 9 },
  { x: 0, y: 18, z: -1236, yaw: 0, r: 11 },
];

const rand = mulberry32(1337);

function item(
  x: number,
  y: number,
  z: number,
  sx = 1,
  sy = 1,
  sz = 1,
  ry = 0,
): InstanceItem {
  return { x, y, z, sx, sy, sz, ry };
}

function aabbFromItem(it: InstanceItem, kind: Aabb["kind"] = "solid"): Aabb {
  return {
    minx: it.x - it.sx * 0.5,
    maxx: it.x + it.sx * 0.5,
    miny: it.y - it.sy * 0.5,
    maxy: it.y + it.sy * 0.5,
    minz: it.z - it.sz * 0.5,
    maxz: it.z + it.sz * 0.5,
    kind,
  };
}

export const buildings: InstanceItem[] = [];
export const windows: InstanceItem[] = [];
export const streetLights: InstanceItem[] = [];
export const trees: InstanceItem[] = [];
export const rocks: InstanceItem[] = [];
export const containers: InstanceItem[] = [];
export const pipes: InstanceItem[] = [];
export const towers: InstanceItem[] = [];
export const tanks: InstanceItem[] = [];
export const poles: InstanceItem[] = [];
export const collision: Aabb[] = [];
export const rings: RingDef[] = [];
export const bridges: BridgeDef[] = [];
export const obstacles: ObstacleDef[] = [];

function keepTrackClear(x: number, z: number, pad = 16) {
  for (const cp of CHECKPOINTS) {
    const dx = x - cp.x;
    const dz = z - cp.z;
    if (dx * dx + dz * dz < (pad + 14) * (pad + 14)) return false;
  }
  if (Math.abs(x) < pad && z < 40 && z > -1280) return false;
  return true;
}

for (let gx = -5; gx <= 5; gx++) {
  for (let gz = 0; gz <= 8; gz++) {
    const x = gx * 38 + (rand() - 0.5) * 10;
    const z = -gz * 44 - 24 + (rand() - 0.5) * 8;
    if (!keepTrackClear(x, z, 18)) continue;
    const w = 9 + rand() * 16;
    const d = 9 + rand() * 16;
    const h = 16 + rand() * 78;
    const b = item(x, h * 0.5, z, w, h, d, (rand() - 0.5) * 0.04);
    buildings.push(b);
    collision.push(aabbFromItem(b));
  }
}

for (let i = 0; i < 22; i++) {
  const side = i % 2 === 0 ? -1 : 1;
  const z = -20 - i * 36;
  streetLights.push(item(side * 15, 5.5, z, 0.18, 11, 0.18, 0));
}

bridges.push(
  { x: 0, y: 20, z: -328, w: 18, span: 48 },
  { x: 18, y: 18, z: -468, w: 14, span: 36 },
  { x: -12, y: 22, z: -590, w: 16, span: 40 },
  { x: 8, y: 16, z: -900, w: 16, span: 32 },
  { x: -6, y: 18, z: -1048, w: 18, span: 36 },
);

for (const br of bridges) {
  collision.push({
    minx: br.x - br.span * 0.5,
    maxx: br.x + br.span * 0.5,
    miny: br.y,
    maxy: br.y + 1.4,
    minz: br.z - br.w * 0.5,
    maxz: br.z + br.w * 0.5,
    kind: "solid",
  });
  const pillarH = br.y;
  collision.push({
    minx: br.x - br.span * 0.48,
    maxx: br.x - br.span * 0.48 + 2.2,
    miny: 0,
    maxy: pillarH,
    minz: br.z - 1.1,
    maxz: br.z + 1.1,
    kind: "solid",
  });
  collision.push({
    minx: br.x + br.span * 0.48 - 2.2,
    maxx: br.x + br.span * 0.48,
    miny: 0,
    maxy: pillarH,
    minz: br.z - 1.1,
    maxz: br.z + 1.1,
    kind: "solid",
  });
}

collision.push(
  { minx: -18, maxx: -12.5, miny: 0, maxy: 16, minz: -272, maxz: -224, kind: "solid" },
  { minx: 12.5, maxx: 18, miny: 0, maxy: 16, minz: -272, maxz: -224, kind: "solid" },
  { minx: -18, maxx: 18, miny: 14.2, maxy: 17.5, minz: -272, maxz: -224, kind: "solid" },
  { minx: -16, maxx: -10.5, miny: 0, maxy: 18, minz: -718, maxz: -666, kind: "solid" },
  { minx: 10.5, maxx: 16, miny: 0, maxy: 18, minz: -718, maxz: -666, kind: "solid" },
  { minx: -16, maxx: 16, miny: 16, maxy: 22, minz: -718, maxz: -666, kind: "solid" },
);

for (let i = 0; i < 140; i++) {
  const x = (rand() - 0.5) * 400;
  const z = -380 - rand() * 480;
  if (!keepTrackClear(x, z, 20)) continue;
  const h = terrainHeight(x, z);
  if (h < 8) continue;
  const scale = 0.7 + rand() * 1.4;
  trees.push(item(x, h + scale * 1.35, z, scale, scale * (0.9 + rand() * 0.4), scale, rand() * Math.PI * 2));
}

for (let i = 0; i < 90; i++) {
  const x = (rand() - 0.5) * 420;
  const z = -360 - rand() * 520;
  if (!keepTrackClear(x, z, 16)) continue;
  const h = terrainHeight(x, z);
  const s = 1.2 + rand() * 3.4;
  rocks.push(item(x, h + s * 0.35, z, s, s * (0.5 + rand() * 0.5), s * 0.8, rand() * 6));
  if (s > 3.2) {
    collision.push({
      minx: x - s * 0.45,
      maxx: x + s * 0.45,
      miny: h,
      maxy: h + s * 0.8,
      minz: z - s * 0.4,
      maxz: z + s * 0.4,
      kind: "solid",
    });
  }
}

for (let i = 0; i < 18; i++) {
  const x = (i % 2 === 0 ? -1 : 1) * (48 + (i % 5) * 6);
  const z = -400 - i * 24;
  poles.push(item(x, terrainHeight(x, z) + 7, z, 0.22, 14, 0.22, 0));
}

for (let gx = -4; gx <= 4; gx++) {
  for (let gz = 0; gz <= 7; gz++) {
    const x = gx * 28 + (rand() - 0.5) * 6;
    const z = -900 - gz * 42 + (rand() - 0.5) * 8;
    if (!keepTrackClear(x, z, 16)) continue;
    const kind = rand();
    if (kind < 0.45) {
      const c = item(x, 3.2, z, 6.5, 6.4, 3.2, Math.floor(rand() * 4) * 1.57);
      containers.push(c);
      collision.push(aabbFromItem(c));
    } else if (kind < 0.7) {
      const t = item(x, 7, z, 4.2, 14, 4.2, 0);
      tanks.push(t);
      collision.push({
        minx: x - 2.1,
        maxx: x + 2.1,
        miny: 0,
        maxy: 14,
        minz: z - 2.1,
        maxz: z + 2.1,
        kind: "solid",
      });
    } else {
      const tw = item(x, 16, z, 3.2, 32, 3.2, 0);
      towers.push(tw);
      collision.push({
        minx: x - 1.7,
        maxx: x + 1.7,
        miny: 0,
        maxy: 32,
        minz: z - 1.7,
        maxz: z + 1.7,
        kind: "solid",
      });
    }
  }
}

for (let i = 0; i < 24; i++) {
  const x = (rand() - 0.5) * 180;
  const z = -920 - rand() * 280;
  if (!keepTrackClear(x, z, 14)) continue;
  const len = 18 + rand() * 40;
  const horizontal = rand() > 0.4;
  if (horizontal) {
    pipes.push(item(x, 8 + rand() * 10, z, len, 1.4, 1.4, rand() * 0.4));
  } else {
    pipes.push(item(x, 12, z, 1.4, len * 0.6, 1.4, 0));
  }
}

obstacles.push(
  { type: "turbine", x: 24, y: 16, z: -1008, period: 2.8, phase: 0, r: 9 },
  { type: "turbine", x: -30, y: 18, z: -1072, period: 3.2, phase: 1.1, r: 9 },
  { type: "laser", x: 0, y: 12, z: -1148, period: 2.4, phase: 0, r: 8 },
  { type: "spinner", x: 18, y: 14, z: -958, period: 3.6, phase: 0.4, r: 7 },
  { type: "mover", x: -20, y: 16, z: -1188, ax: -28, az: -1188, bx: 28, bz: -1188, period: 4.5, phase: 0, r: 5 },
);

collision.push({
  minx: -4,
  maxx: 4,
  miny: 0,
  maxy: 28,
  minz: -1296,
  maxz: -1288,
  kind: "solid",
});

for (let i = 0; i < CHECKPOINTS.length; i++) {
  const a = CHECKPOINTS[i]!;
  const b = CHECKPOINTS[Math.min(i + 1, CHECKPOINTS.length - 1)]!;
  rings.push({
    x: (a.x + b.x) * 0.5 + (hash2(i, 2) - 0.5) * 10,
    y: (a.y + b.y) * 0.5 + 2,
    z: (a.z + b.z) * 0.5,
  });
}

const cellSize = 48;
const grid = new Map<string, Aabb[]>();

function cellKey(cx: number, cz: number) {
  return `${cx}|${cz}`;
}

for (const box of collision) {
  const mincx = Math.floor(box.minx / cellSize);
  const maxcx = Math.floor(box.maxx / cellSize);
  const mincz = Math.floor(box.minz / cellSize);
  const maxcz = Math.floor(box.maxz / cellSize);
  for (let cx = mincx; cx <= maxcx; cx++) {
    for (let cz = mincz; cz <= maxcz; cz++) {
      const k = cellKey(cx, cz);
      let arr = grid.get(k);
      if (!arr) {
        arr = [];
        grid.set(k, arr);
      }
      arr.push(box);
    }
  }
}

export function queryAabbs(x: number, z: number, radius: number): Aabb[] {
  const mincx = Math.floor((x - radius) / cellSize);
  const maxcx = Math.floor((x + radius) / cellSize);
  const mincz = Math.floor((z - radius) / cellSize);
  const maxcz = Math.floor((z + radius) / cellSize);
  const out: Aabb[] = [];
  const seen = new Set<Aabb>();
  for (let cx = mincx; cx <= maxcx; cx++) {
    for (let cz = mincz; cz <= maxcz; cz++) {
      const arr = grid.get(cellKey(cx, cz));
      if (!arr) continue;
      for (const b of arr) {
        if (seen.has(b)) continue;
        seen.add(b);
        out.push(b);
      }
    }
  }
  return out;
}

export const WATER = { x: 72, y: 2.2, z: -620, w: 90, d: 280 };
