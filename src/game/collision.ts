import { game, resetDrone } from "./state";
import { queryAabbs } from "./worldData";
import { audio } from "./audio";

const RADIUS = 1.15;

export function stepCollision() {
  const d = game.drone;
  if (!d.alive || game.crash.active) return;

  const boxes = queryAabbs(d.position.x, d.position.z, RADIUS + 2);
  const px = d.position.x;
  const py = d.position.y;
  const pz = d.position.z;
  const spd = d.velocity.length();

  for (const b of boxes) {
    if (b.kind === "hurt" && !game.laserOn) continue;
    const nx = Math.max(b.minx, Math.min(px, b.maxx));
    const ny = Math.max(b.miny, Math.min(py, b.maxy));
    const nz = Math.max(b.minz, Math.min(pz, b.maxz));
    const dx = px - nx;
    const dy = py - ny;
    const dz = pz - nz;
    const dist2 = dx * dx + dy * dy + dz * dz;
    if (dist2 < RADIUS * RADIUS) {
      if (spd > 12 || b.kind === "hurt") {
        beginCrash();
        return;
      }
      const dist = Math.sqrt(dist2) || 0.0001;
      const push = (RADIUS - dist) / dist;
      d.position.x += dx * push;
      d.position.y += dy * push;
      d.position.z += dz * push;
      d.velocity.multiplyScalar(0.45);
    } else if (dist2 < (RADIUS + 3.2) * (RADIUS + 3.2) && spd > 22) {
      nearMiss();
    }
  }
}

function nearMiss() {
  if (game.hud.trickTimer > 0.5) return;
  awardTrick("NEAR MISS", 250);
}

export function awardTrick(name: string, pts: number) {
  const r = game.race;
  if (!r.live) return;
  r.combo = Math.min(12, r.combo + 1);
  r.comboTimer = 4;
  r.tricks += 1;
  const gained = Math.round(pts * (1 + r.combo * 0.12));
  r.score += gained;
  game.hud.trickText = `${name} +${gained}`;
  game.hud.trickTimer = 1.4;
  audio.trick();
}

export function beginCrash() {
  const d = game.drone;
  d.alive = false;
  game.crash.active = true;
  game.crash.timer = 0.72;
  game.crash.slowMo = 0.22;
  game.camera.trauma = Math.min(1, game.camera.trauma + 0.7);
  audio.crash();
  game.burst?.(d.position.x, d.position.y, d.position.z, 16);
}

export function stepCrash(dt: number) {
  if (!game.crash.active) return;
  game.crash.timer -= dt;
  if (game.hudDom.crash) {
    game.hudDom.crash.style.opacity = String(Math.min(1, game.crash.timer * 2.2));
  }
  if (game.crash.timer <= 0) {
    game.crash.active = false;
    game.crash.slowMo = 1;
    if (game.hudDom.crash) game.hudDom.crash.style.opacity = "0";
    resetDrone(game.race.lastCheckpoint);
    if (game.race.live && game.race.mode !== "freeFlight") game.race.time += 2;
  }
}
