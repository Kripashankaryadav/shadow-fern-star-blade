import { useGameStore } from "./store";
import type { Quality } from "./types";
import { game } from "./state";

let ema = 60;
let lowTime = 0;
let lastDrop = 0;

export function detectQuality(): Quality {
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  const mobile = matchMedia("(pointer: coarse)").matches || innerWidth < 820;
  if (mobile || cores <= 4 || mem <= 4) return "low";
  if (cores >= 12 && mem >= 8) return "high";
  return "medium";
}

export function dprFor(q: Quality) {
  if (q === "low") return 1;
  if (q === "medium") return 1;
  if (q === "high") return Math.min(1.5, window.devicePixelRatio || 1);
  return Math.min(2, window.devicePixelRatio || 1);
}

export function farFor(q: Quality) {
  if (q === "low") return 280;
  if (q === "medium") return 420;
  if (q === "high") return 620;
  return 860;
}

export function samplePerf(dt: number) {
  const fps = dt > 0 ? 1 / dt : 60;
  ema = ema * 0.92 + fps * 0.08;
  game.fps = ema;
  const settings = useGameStore.getState().settings;
  if (settings.quality !== "auto") return;
  if (ema < 42) lowTime += dt;
  else lowTime = Math.max(0, lowTime - dt * 0.5);
  const now = performance.now();
  if (lowTime > 2.2 && now - lastDrop > 8000) {
    lastDrop = now;
    lowTime = 0;
    const cur = useGameStore.getState().appliedQuality;
    const next: Quality = cur === "ultra" ? "high" : cur === "high" ? "medium" : "low";
    if (next !== cur) useGameStore.getState().setAppliedQuality(next);
  }
}

export function applySettingsQuality() {
  const s = useGameStore.getState().settings.quality;
  const q = s === "auto" ? detectQuality() : s;
  useGameStore.getState().setAppliedQuality(q);
}
