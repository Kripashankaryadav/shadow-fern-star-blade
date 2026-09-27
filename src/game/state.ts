import * as THREE from "three";
import type { CameraMode, Mode } from "./types";
import { CHECKPOINTS, START } from "./worldData";

export interface DroneState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  yaw: number;
  pitch: number;
  roll: number;
  yawRate: number;
  pitchRate: number;
  rollRate: number;
  boost: number;
  boosting: boolean;
  drifting: boolean;
  alive: boolean;
}

export interface RaceState {
  mode: Mode;
  nextGate: number;
  gatesHit: number;
  ringsHit: number;
  score: number;
  combo: number;
  comboTimer: number;
  time: number;
  live: boolean;
  finished: boolean;
  failed: boolean;
  maxSpeed: number;
  tricks: number;
  bridges: number;
  speedHold: number;
  lastCheckpoint: number;
  challengeId: number;
}

export const game = {
  drone: {
    position: new THREE.Vector3(START.x, START.y, START.z),
    velocity: new THREE.Vector3(),
    yaw: START.yaw,
    pitch: 0,
    roll: 0,
    yawRate: 0,
    pitchRate: 0,
    rollRate: 0,
    boost: 1,
    boosting: false,
    drifting: false,
    alive: true,
  } as DroneState,
  forward: new THREE.Vector3(0, 0, -1),
  right: new THREE.Vector3(1, 0, 0),
  up: new THREE.Vector3(0, 1, 0),
  race: {
    mode: "race" as Mode,
    nextGate: 0,
    gatesHit: 0,
    ringsHit: 0,
    score: 0,
    combo: 0,
    comboTimer: 0,
    time: 0,
    live: false,
    finished: false,
    failed: false,
    maxSpeed: 0,
    tricks: 0,
    bridges: 0,
    speedHold: 0,
    lastCheckpoint: 0,
    challengeId: 0,
  } as RaceState,
  camera: {
    mode: "fpv" as CameraMode,
    fov: 75,
    trauma: 0,
    lookYaw: 0,
    lookPitch: 0,
  },
  crash: {
    active: false,
    timer: 0,
    slowMo: 1,
  },
  timeOfDay: 0.38,
  simTime: 0,
  hud: {
    gateFlash: 0,
    trickText: "",
    trickTimer: 0,
    goTimer: 0,
    nearGate: -1,
  },
  collectedRings: new Uint8Array(32),
  visitedBridges: new Uint8Array(8),
  laserOn: false,
  obstacleT: 0,
  burst: null as null | ((x: number, y: number, z: number, n: number) => void) ,
  rollAccum: 0,
  pitchAccum: 0,
  lowAcc: 0,
  turnAcc: 0,
  fps: 60,
  refs: {
    droneGroup: null as THREE.Group | null,
    props: [] as THREE.Object3D[],
    motors: [] as THREE.Mesh[],
    canvas: null as HTMLCanvasElement | null,
    minimap: null as HTMLCanvasElement | null,
    rainGeo: null as THREE.BufferGeometry | null,
    rainPos: null as Float32Array | null,
    traffic: null as THREE.InstancedMesh | null,
    turbines: [] as THREE.Object3D[],
    sun: null as THREE.DirectionalLight | null,
    hemi: null as THREE.HemisphereLight | null,
    fog: null as THREE.Fog | null,
    skyMat: null as THREE.ShaderMaterial | null,
    waterMat: null as THREE.ShaderMaterial | null,
    buildingMat: null as THREE.ShaderMaterial | null,
    cityGroup: null as THREE.Group | null,
    mtnGroup: null as THREE.Group | null,
    indGroup: null as THREE.Group | null,
    gateMats: [] as THREE.MeshStandardMaterial[],
    enemyGroups: [] as THREE.Group[],
    enemyPos: [] as THREE.Vector3[],
  },
  hudDom: {
    speed: null as HTMLElement | null,
    alt: null as HTMLElement | null,
    boost: null as HTMLElement | null,
    time: null as HTMLElement | null,
    score: null as HTMLElement | null,
    combo: null as HTMLElement | null,
    gate: null as HTMLElement | null,
    trick: null as HTMLElement | null,
    fps: null as HTMLElement | null,
    crash: null as HTMLElement | null,
  },
};

export function resetDrone(checkpoint = -1) {
  const d = game.drone;
  const src =
    checkpoint >= 0 && checkpoint < CHECKPOINTS.length
      ? CHECKPOINTS[Math.max(0, checkpoint)]!
      : { x: START.x, y: START.y, z: START.z, yaw: START.yaw };
  d.position.set(src.x, src.y + (checkpoint >= 0 ? 3 : 0), src.z);
  d.velocity.set(0, 0, 0);
  d.yaw = src.yaw;
  d.pitch = 0;
  d.roll = 0;
  d.yawRate = 0;
  d.pitchRate = 0;
  d.rollRate = 0;
  d.boost = 1;
  d.boosting = false;
  d.drifting = false;
  d.alive = true;
  game.crash.active = false;
  game.crash.timer = 0;
  game.crash.slowMo = 1;
  game.camera.trauma = 0;
  game.rollAccum = 0;
  game.pitchAccum = 0;
}

export function resetRace(mode: Mode, challengeId = 0) {
  game.race.mode = mode;
  game.race.nextGate = 0;
  game.race.gatesHit = 0;
  game.race.ringsHit = 0;
  game.race.score = 0;
  game.race.combo = 0;
  game.race.comboTimer = 0;
  game.race.time = 0;
  game.race.live = true;
  game.race.finished = false;
  game.race.failed = false;
  game.race.maxSpeed = 0;
  game.race.tricks = 0;
  game.race.bridges = 0;
  game.race.speedHold = 0;
  game.race.lastCheckpoint = 0;
  game.race.challengeId = challengeId;
  game.collectedRings.fill(0);
  game.visitedBridges.fill(0);
  game.hud.trickText = "";
  game.hud.trickTimer = 0;
  game.hud.gateFlash = 0;
  game.hud.goTimer = 0.9;
  game.hud.nearGate = -1;
  resetDrone(-1);
  for (const mat of game.refs.gateMats) {
    mat.emissive.setHex(0x3d8a9c);
    mat.color.setHex(0x8ec8d8);
  }
}

export function basisFromYawPitch(yaw: number, pitch: number) {
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const sy = Math.sin(yaw);
  const cy = Math.cos(yaw);
  game.forward.set(-sy * cp, sp, -cy * cp);
  game.right.set(cy, 0, -sy);
  game.up.crossVectors(game.right, game.forward).normalize();
  game.right.crossVectors(game.forward, game.up).normalize();
}
