import { terrainHeight } from "./math";
import { awardTrick } from "./collision";
import { audio } from "./audio";
import { game, resetRace } from "./state";
import { resetEnemies } from "./enemies";
import { useGameStore } from "./store";
import { bridges, CHECKPOINTS, RACE_BUDGET, rings } from "./worldData";
import type { Mode, Results } from "./types";

export function stepRace(dt: number) {
  const r = game.race;
  if (!r.live) return;

  r.time += dt;
  const spd = game.drone.velocity.length();
  const kmh = spd * 3.6;
  if (kmh > r.maxSpeed) r.maxSpeed = kmh;

  if (r.comboTimer > 0) {
    r.comboTimer -= dt;
    if (r.comboTimer <= 0) r.combo = 0;
  }
  if (game.hud.trickTimer > 0) game.hud.trickTimer -= dt;
  if (game.hud.gateFlash > 0) game.hud.gateFlash -= dt;
  if (game.hud.goTimer > 0) game.hud.goTimer -= dt;

  if (r.mode === "race" && r.time > RACE_BUDGET) {
    fail("TIME UP");
    return;
  }

  const p = game.drone.position;
  let nearest = -1;
  let nearestD = 48;
  for (let i = 0; i < CHECKPOINTS.length; i++) {
    const g = CHECKPOINTS[i]!;
    const dx = p.x - g.x;
    const dy = p.y - g.y;
    const dz = p.z - g.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < nearestD) {
      nearestD = dist;
      nearest = i;
    }
    const isNext = i === r.nextGate;
    const free = r.mode === "freeFlight" && dist < g.r && !gateAlready(i);
    if ((isNext || free) && dist < g.r) hitGate(i, kmh);
  }
  game.hud.nearGate = nearestD < 42 ? nearest : -1;

  for (let i = 0; i < rings.length; i++) {
    if (game.collectedRings[i]) continue;
    const rg = rings[i]!;
    const dist = Math.hypot(p.x - rg.x, p.y - rg.y, p.z - rg.z);
    if (dist < 4.2) {
      game.collectedRings[i] = 1;
      r.ringsHit += 1;
      r.score += 150;
      audio.ring();
      game.drone.boost = Math.min(1, game.drone.boost + 0.18);
      game.burst?.(rg.x, rg.y, rg.z, 10);
    }
  }

  for (let i = 0; i < bridges.length; i++) {
    if (game.visitedBridges[i]) continue;
    const b = bridges[i]!;
    if (
      Math.abs(p.x - b.x) < b.span * 0.4 &&
      Math.abs(p.z - b.z) < b.w * 0.7 &&
      p.y < b.y - 1.2 &&
      p.y > 2
    ) {
      game.visitedBridges[i] = 1;
      r.bridges += 1;
      awardTrick("BRIDGE PASS", 400);
    }
  }

  const alt = p.y - terrainHeight(p.x, p.z);
  if (alt < 5.5 && spd > 16) {
    game.lowAcc += dt;
    if (game.lowAcc > 1) {
      game.lowAcc = 0;
      awardTrick("LOW FLIGHT", 300);
    }
  } else {
    game.lowAcc = 0;
  }

  game.rollAccum += Math.abs(game.drone.rollRate) * dt;
  game.pitchAccum += Math.abs(game.drone.pitch) > 0.9 ? dt : 0;
  if (game.rollAccum > 5.2) {
    game.rollAccum = 0;
    awardTrick("BARREL ROLL", 500);
  }
  if (game.pitchAccum > 1.15) {
    game.pitchAccum = 0;
    awardTrick("FLIP", 600);
  }
  if (Math.abs(game.drone.yawRate) > 2.6 && spd > 20) {
    game.turnAcc += dt;
    if (game.turnAcc > 0.45) {
      game.turnAcc = 0;
      awardTrick("SHARP TURN", 200);
    }
  } else {
    game.turnAcc = 0;
  }

  if (kmh >= 150) r.speedHold += dt;
  else r.speedHold = Math.max(0, r.speedHold - dt * 0.5);

  if (r.mode === "challenge") {
    const id = r.challengeId;
    if (id === 0 && r.gatesHit >= 10) win("GATES COMPLETE");
    if (id === 0 && r.time > 40) fail("OUT OF TIME");
    if (id === 1 && r.bridges >= 5) win("LOW PASSES COMPLETE");
    if (id === 2 && r.speedHold >= 20) win("SPEED HOLD COMPLETE");
  }
}

function gateAlready(i: number) {
  return i < game.race.nextGate;
}

function hitGate(i: number, kmh: number) {
  const r = game.race;
  if (i < r.nextGate) return;
  r.nextGate = i + 1;
  r.gatesHit += 1;
  r.lastCheckpoint = i;
  const bonus = 500 + Math.round(kmh * 2);
  r.score += Math.round(bonus * (1 + r.combo * 0.08));
  r.combo = Math.min(12, r.combo + 1);
  r.comboTimer = 4;
  game.hud.gateFlash = 1.6;
  audio.checkpoint();
  const mat = game.refs.gateMats[i];
  if (mat) {
    mat.emissive.setHex(0x7dba8a);
    mat.color.setHex(0xb8e0c4);
  }
  const g = CHECKPOINTS[i]!;
  game.burst?.(g.x, g.y, g.z, 12);
  if (kmh > 140) awardTrick("GATE RUSH", 350);

  if (r.mode !== "challenge" && r.mode !== "freeFlight" && r.nextGate >= CHECKPOINTS.length) {
    win("RACE COMPLETE");
  }
  if (r.mode === "freeFlight" && r.nextGate >= CHECKPOINTS.length) {
    win("COURSE COMPLETE");
  }
}

function win(title: string) {
  const r = game.race;
  if (r.finished) return;
  r.live = false;
  r.finished = true;
  r.failed = false;
  const remain = r.mode === "race" ? Math.max(0, RACE_BUDGET - r.time) : 0;
  r.score += Math.round(remain * 18);
  audio.finish();
  publishResults(title, false);
}

function fail(title: string) {
  const r = game.race;
  if (r.finished) return;
  r.live = false;
  r.finished = true;
  r.failed = true;
  publishResults(title, true);
}

function publishResults(title: string, failFlag: boolean) {
  const r = game.race;
  const prevBest =
    r.mode === "timeTrial"
      ? useGameStore.getState().bestTimeTrial
      : useGameStore.getState().bestRaceTime;
  const best = !failFlag && (prevBest == null || r.time < prevBest);
  const results: Results = {
    mode: r.mode,
    time: r.time,
    score: r.score,
    maxSpeed: r.maxSpeed,
    checkpoints: r.gatesHit,
    tricks: r.tricks,
    best,
    title,
    fail: failFlag,
  };
  useGameStore.getState().setResults(results);
  useGameStore.getState().recordScore(r.score, r.time, r.mode);
  useGameStore.getState().setPhase("results");
}

export function startPlay(mode: Mode, challengeId = 0) {
  useGameStore.getState().setMode(mode);
  useGameStore.getState().setChallenge(challengeId);
  useGameStore.getState().setResults(null);
  useGameStore.getState().setOverlay(null);
  resetRace(mode, challengeId);
  resetEnemies();
  useGameStore.getState().setPhase("playing");
  const canvas = game.refs.canvas;
  if (canvas && !useGameStore.getState().showMobile) {
    canvas.requestPointerLock?.();
  }
}
