import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { audio } from "@/game/audio";
import { stepCollision, stepCrash } from "@/game/collision";
import { resetEnemies, stepEnemies } from "@/game/enemies";
import { input, sampleInput, setInjectedKeys } from "@/game/input";
import { clamp, damp, formatTime, terrainHeight, vA, vB, vC, eA, qA } from "@/game/math";
import { stepParticles } from "@/game/particles";
import { farFor, samplePerf } from "@/game/performance";
import { stepPhysics } from "@/game/physics";
import { startPlay, stepRace } from "@/game/race";
import { game } from "@/game/state";
import { useGameStore } from "@/game/store";
import { gfxUniforms } from "./materials";
import { CHECKPOINTS } from "@/game/worldData";

const FIXED = 1 / 60;
const camPos = new THREE.Vector3();
const camTarget = new THREE.Vector3();
let hudClock = 0;
const fogDay = new THREE.Color("#87a0b4");
const fogNight = new THREE.Color("#0a1018");

export function GameLoop() {
  const acc = useRef(0);

  useEffect(() => {
    window.__controlsTest = {
      getYaw: () => game.drone.yaw,
      getSpeed: () => game.drone.velocity.length(),
      setSteer: (v) => {
        input.steerOverride = v;
      },
      setKeys: (codes) => {
        const st = useGameStore.getState();
        if (st.phase !== "playing") startPlay(st.mode || "race");
        setInjectedKeys(codes);
      },
    };
    window.__game = game;
    return () => {
      delete window.__controlsTest;
    };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const ui = useGameStore.getState();
    game.simTime += dt;
    game.timeOfDay = (game.timeOfDay + dt / 420) % 1;

    sampleInput();
    updateEnvironment(dt, state.camera as THREE.PerspectiveCamera, ui.appliedQuality, state.scene);

    if (ui.phase === "boot") return;

    if (ui.phase === "menu") {
      idleMenu(dt);
      updateCamera(state.camera as THREE.PerspectiveCamera, dt, "menu");
      spinProps(dt, 12);
      audio.setEngine(0.12, false, false);
      return;
    }

    if (input.pausePressed && ui.phase === "playing") {
      ui.setPhase("paused");
      document.exitPointerLock?.();
      return;
    }
    if (input.pausePressed && ui.phase === "paused") {
      ui.setPhase("playing");
      game.refs.canvas?.requestPointerLock?.();
    }
    if (input.camPressed) {
      game.camera.mode = game.camera.mode === "fpv" ? "chase" : "fpv";
    }

    if (ui.phase === "paused") {
      applyDronePose();
      updateCamera(state.camera as THREE.PerspectiveCamera, dt, game.camera.mode);
      audio.setEngine(0, false, false);
      return;
    }

    const slow = game.crash.active ? game.crash.slowMo : 1;
    const simDt = dt * slow;

    if (ui.phase === "playing") {
      acc.current += simDt;
      let steps = 0;
      while (acc.current >= FIXED && steps < 5) {
        stepPhysics(FIXED);
        stepCollision();
        acc.current -= FIXED;
        steps++;
      }
      stepCrash(dt);
      stepRace(simDt);
      stepEnemies(simDt);
      stepParticles(dt);
      stepObstacles(dt);
      applyDronePose();
      spinProps(dt, 18 + game.drone.velocity.length() * 2.4);
      updateCamera(state.camera as THREE.PerspectiveCamera, dt, game.camera.mode);
      const spd01 = clamp(game.drone.velocity.length() / 70, 0, 1);
      audio.setEngine(spd01, game.drone.boosting, true);
    } else if (ui.phase === "results") {
      applyDronePose();
      updateCamera(state.camera as THREE.PerspectiveCamera, dt, "cine");
      audio.setEngine(0.08, false, true);
    }

    writeHud(dt);
    drawMinimap();
    samplePerf(dt);
  });

  return null;
}

function idleMenu(dt: number) {
  const d = game.drone;
  d.position.set(0, 12 + Math.sin(game.simTime * 1.1) * 0.28, 10);
  d.yaw = Math.sin(game.simTime * 0.25) * 0.35;
  d.pitch = Math.sin(game.simTime * 0.7) * 0.05;
  d.roll = Math.sin(game.simTime * 0.9) * 0.12;
  applyDronePose();
}

function applyDronePose() {
  const g = game.refs.droneGroup;
  if (!g) return;
  const d = game.drone;
  g.position.copy(d.position);
  eA.set(d.pitch, d.yaw, d.roll, "YXZ");
  g.quaternion.setFromEuler(eA);
  for (const m of game.refs.motors) {
    const mat = m.material as THREE.MeshStandardMaterial;
    if (mat.emissiveIntensity != null) {
      mat.emissiveIntensity = 0.45 + (d.boosting ? 1.4 : d.velocity.length() * 0.02);
    }
  }
}

function spinProps(dt: number, speed: number) {
  for (const p of game.refs.props) p.rotation.y += speed * dt;
}

function updateCamera(cam: THREE.PerspectiveCamera, dt: number, mode: string) {
  const d = game.drone;
  const settings = useGameStore.getState().settings;
  const spd = d.velocity.length();
  const shakeOn = settings.cameraShake ? 1 : 0;
  if (d.boosting) game.camera.trauma = Math.min(1, game.camera.trauma + dt * 0.6);
  game.camera.trauma = Math.max(0, game.camera.trauma - dt * 1.8);
  const shake = game.camera.trauma * game.camera.trauma * shakeOn;

  const baseFov = settings.fov;
  const targetFov = baseFov + spd * 0.22 + (d.boosting ? 14 : 0) - (input.brake ? 6 : 0);
  cam.fov = damp(cam.fov, clamp(targetFov, 60, 108), 4, dt);
  cam.updateProjectionMatrix();

  if (mode === "menu") {
    const t = game.simTime * 0.22;
    camPos.set(Math.sin(t) * 5.2 + 1.4, 12.4, 16 + Math.cos(t) * 2.4);
    cam.position.lerp(camPos, 1 - Math.exp(-3 * dt));
    cam.lookAt(d.position.x, d.position.y + 0.2, d.position.z);
    return;
  }

  if (mode === "cine") {
    const t = game.simTime * 0.35;
    camPos.set(
      d.position.x + Math.sin(t) * 9,
      d.position.y + 3.2,
      d.position.z + Math.cos(t) * 9,
    );
    cam.position.lerp(camPos, 1 - Math.exp(-2.2 * dt));
    cam.lookAt(d.position);
    return;
  }

  const fwd = game.forward;
  const up = game.up;

  if (mode === "fpv") {
    vA.copy(d.position).addScaledVector(up, 0.28).addScaledVector(fwd, 0.62);
    vA.addScaledVector(fwd, -spd * 0.012);
    if (input.brake) vA.addScaledVector(fwd, 0.25);
    camTarget.copy(vA);
    dampVec3(cam.position, camTarget, 18, dt);
    eA.set(d.pitch, d.yaw, d.roll * 0.85, "YXZ");
    qA.setFromEuler(eA);
    cam.quaternion.slerp(qA, 1 - Math.exp(-16 * dt));
  } else {
    vA.copy(d.position).addScaledVector(fwd, -8.2).addScaledVector(up, 2.6);
    vA.y = Math.max(vA.y, terrainHeight(vA.x, vA.z) + 1.4);
    dampVec3(cam.position, vA, 7, dt);
    vB.copy(d.position).addScaledVector(fwd, 4);
    cam.lookAt(vB);
    cam.rotateZ(d.roll * 0.35);
  }

  if (shake > 0.002) {
    cam.position.x += (Math.random() - 0.5) * shake * 0.28;
    cam.position.y += (Math.random() - 0.5) * shake * 0.22;
    cam.rotation.z += (Math.random() - 0.5) * shake * 0.03;
  }
}

function dampVec3(cur: THREE.Vector3, target: THREE.Vector3, lambda: number, dt: number) {
  cur.lerp(target, 1 - Math.exp(-lambda * dt));
}

function updateEnvironment(dt: number, cam: THREE.PerspectiveCamera, quality: string, scene?: THREE.Scene) {
  const sunH = Math.sin(game.timeOfDay * Math.PI * 2);
  const uSun = clamp(sunH * 0.5 + 0.5, 0.05, 1);
  const night = clamp(1 - uSun * 1.4, 0, 1);
  gfxUniforms.time.value = game.simTime;
  gfxUniforms.sun.value = uSun;
  gfxUniforms.night.value = night;
  const ang = game.timeOfDay * Math.PI * 2;
  gfxUniforms.sunDir.value.set(Math.cos(ang) * 0.65, Math.max(0.12, sunH), Math.sin(ang) * 0.45).normalize();

  gfxUniforms.fogColor.value.copy(fogDay).lerp(fogNight, night);
  const far = farFor(quality as "low");
  gfxUniforms.fogNear.value = far * 0.22;
  gfxUniforms.fogFar.value = far * 0.92;
  cam.far = far;
  cam.near = 0.25;

  if (game.refs.fog) {
    game.refs.fog.color.copy(gfxUniforms.fogColor.value);
    game.refs.fog.near = gfxUniforms.fogNear.value;
    game.refs.fog.far = gfxUniforms.fogFar.value;
  }
  if (scene) scene.background = gfxUniforms.fogColor.value;
  if (game.refs.sun) {
    game.refs.sun.position.copy(gfxUniforms.sunDir.value).multiplyScalar(180);
    game.refs.sun.intensity = 0.25 + uSun * 1.35;
    game.refs.sun.color.setRGB(1, 0.95 - night * 0.2, 0.88 - night * 0.3);
  }
  if (game.refs.hemi) {
    game.refs.hemi.intensity = 0.25 + uSun * 0.45;
  }

  const z = game.drone.position.z;
  if (game.refs.cityGroup) game.refs.cityGroup.visible = z > -560;
  if (game.refs.mtnGroup) game.refs.mtnGroup.visible = z < -180 && z > -1080;
  if (game.refs.indGroup) game.refs.indGroup.visible = z < -760;

  const weather = useGameStore.getState().weather;
  const rainPos = game.refs.rainPos;
  const raining = weather !== "clear";
  if (rainPos) {
    const storm = weather === "storm" ? 1.6 : 1;
    for (let i = 0; i < rainPos.length; i += 3) {
      if (!raining) {
        rainPos[i + 1] = -40;
        continue;
      }
      rainPos[i + 1] -= (38 * storm) * dt;
      if ((rainPos[i + 1] ?? 0) < -4) {
        rainPos[i] = game.drone.position.x + (Math.random() - 0.5) * 36;
        rainPos[i + 1] = game.drone.position.y + 8 + Math.random() * 22;
        rainPos[i + 2] = game.drone.position.z + (Math.random() - 0.5) * 36;
      }
    }
    const attr = game.refs.rainGeo?.attributes.position;
    if (attr) attr.needsUpdate = true;
  }

  void dt;
}

function stepObstacles(dt: number) {
  game.obstacleT += dt;
  game.laserOn = Math.sin(game.obstacleT * 2.4) > 0.15;
  const t0 = game.refs.turbines[0];
  const t1 = game.refs.turbines[1];
  if (t0) t0.rotation.y += dt * 1.8;
  if (t1) t1.rotation.y -= dt * 1.45;
  const laser = (game.refs as { laser?: THREE.Mesh }).laser;
  if (laser) laser.visible = game.laserOn;
  const mover = (game.refs as { mover?: THREE.Mesh }).mover;
  if (mover) {
    mover.position.x = Math.sin(game.obstacleT * 1.4) * 26;
  }
}

function writeHud(dt: number) {
  hudClock += dt;
  if (hudClock < 0.05) return;
  hudClock = 0;
  const d = game.drone;
  const r = game.race;
  const spd = Math.round(d.velocity.length() * 3.6);
  const alt = Math.max(0, Math.round(d.position.y - terrainHeight(d.position.x, d.position.z)));
  setTxt(game.hudDom.speed, String(spd));
  setTxt(game.hudDom.alt, String(alt));
  setTxt(game.hudDom.time, formatTime(r.time));
  setTxt(game.hudDom.score, String(r.score | 0));
  setTxt(game.hudDom.combo, r.combo > 1 ? `COMBO x${r.combo}` : "");
  if (game.hudDom.boost) {
    const el = game.hudDom.boost;
    el.style.width = `${Math.round(d.boost * 100)}%`;
    el.classList.toggle("hot", d.boosting);
  }
  if (game.hudDom.gate) {
    const show = game.hud.nearGate >= 0 || game.hud.gateFlash > 0;
    game.hudDom.gate.classList.toggle("show", show);
    const idx = game.hud.nearGate >= 0 ? game.hud.nearGate : Math.max(0, r.nextGate - 1);
    game.hudDom.gate.textContent = `CHECKPOINT ${String(idx + 1).padStart(2, "0")}`;
  }
  if (game.hudDom.trick) {
    game.hudDom.trick.classList.toggle("show", game.hud.trickTimer > 0);
    if (game.hud.trickTimer > 0) game.hudDom.trick.textContent = game.hud.trickText;
  }
  if (game.hudDom.fps) {
    const q = useGameStore.getState().appliedQuality.toUpperCase();
    game.hudDom.fps.textContent = `FPS ${Math.round(game.fps)}   ${q}`;
  }
}

function setTxt(el: HTMLElement | null, v: string) {
  if (el && el.textContent !== v) el.textContent = v;
}

function drawMinimap() {
  const c = game.refs.minimap;
  if (!c) return;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  const w = c.width;
  const h = c.height;
  ctx.fillStyle = "rgba(8,10,14,0.85)";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(142,200,216,0.25)";
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  const d = game.drone;
  const scale = 0.22;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-d.yaw);
  ctx.strokeStyle = "rgba(139,149,161,0.35)";
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(0, -200);
  ctx.stroke();
  for (let i = 0; i < CHECKPOINTS.length; i++) {
    const g = CHECKPOINTS[i]!;
    const x = (g.x - d.position.x) * scale;
    const y = (g.z - d.position.z) * scale;
    ctx.fillStyle = i < game.race.nextGate ? "#7dba8a" : i === game.race.nextGate ? "#8ec8d8" : "#5c6570";
    ctx.beginPath();
    ctx.arc(x, y, i === CHECKPOINTS.length - 1 ? 3.2 : 2.1, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const e of game.refs.enemyGroups) {
    const x = (e.position.x - d.position.x) * scale;
    const y = (e.position.z - d.position.z) * scale;
    ctx.fillStyle = "#d67a6a";
    ctx.fillRect(x - 1.4, y - 1.4, 2.8, 2.8);
  }
  ctx.restore();
  ctx.fillStyle = "#e8eef3";
  ctx.beginPath();
  ctx.moveTo(w / 2, h / 2 - 6);
  ctx.lineTo(w / 2 + 4, h / 2 + 5);
  ctx.lineTo(w / 2 - 4, h / 2 + 5);
  ctx.closePath();
  ctx.fill();
}

void resetEnemies;
void vC;
