export type Phase = "boot" | "menu" | "playing" | "paused" | "results";
export type Mode = "race" | "timeTrial" | "freeFlight" | "challenge";
export type Quality = "low" | "medium" | "high" | "ultra";
export type Weather = "clear" | "rain" | "storm";
export type CameraMode = "fpv" | "chase";

export type Overlay = null | "settings" | "controls" | "modes";

export interface Settings {
  quality: Quality | "auto";
  mouseSens: number;
  flightSens: number;
  invertY: boolean;
  cameraShake: boolean;
  fov: number;
  master: number;
  engine: number;
  effects: number;
  music: number;
  muted: boolean;
  showFps: boolean;
}

export interface Results {
  mode: Mode;
  time: number;
  score: number;
  maxSpeed: number;
  checkpoints: number;
  tricks: number;
  best: boolean;
  title: string;
  fail: boolean;
}

export interface CheckpointDef {
  x: number;
  y: number;
  z: number;
  yaw: number;
  r: number;
}

export interface Aabb {
  minx: number;
  miny: number;
  minz: number;
  maxx: number;
  maxy: number;
  maxz: number;
  kind: "solid" | "hurt";
}

export interface InstanceItem {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  ry: number;
  hue?: number;
}

export interface RingDef {
  x: number;
  y: number;
  z: number;
}

export interface BridgeDef {
  x: number;
  y: number;
  z: number;
  w: number;
  span: number;
}

export interface ObstacleDef {
  type: "turbine" | "laser" | "spinner" | "mover";
  x: number;
  y: number;
  z: number;
  ax?: number;
  az?: number;
  bx?: number;
  bz?: number;
  period: number;
  phase: number;
  r: number;
}
