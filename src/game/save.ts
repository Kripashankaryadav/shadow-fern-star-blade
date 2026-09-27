import type { Settings } from "./types";

const KEY = "drone-rush-v1";
const VERSION = 1;

export const defaultSettings: Settings = {
  quality: "auto",
  mouseSens: 0.0024,
  flightSens: 1,
  invertY: false,
  cameraShake: true,
  fov: 75,
  master: 0.7,
  engine: 0.55,
  effects: 0.7,
  music: 0.28,
  muted: false,
  showFps: false,
};

export interface SaveData {
  version: number;
  settings: Settings;
  bestRaceTime: number | null;
  bestScore: number;
  bestTimeTrial: number | null;
}

const defaults: SaveData = {
  version: VERSION,
  settings: { ...defaultSettings },
  bestRaceTime: null,
  bestScore: 0,
  bestTimeTrial: null,
};

function migrate(raw: SaveData): SaveData {
  const s = { ...defaults, ...raw, settings: { ...defaultSettings, ...raw.settings } };
  s.version = VERSION;
  return s;
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults, settings: { ...defaultSettings } };
    const parsed = JSON.parse(raw) as SaveData;
    return migrate(parsed);
  } catch {
    return { ...defaults, settings: { ...defaultSettings } };
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, version: VERSION }));
  } catch {
    /* quota / private mode */
  }
}
