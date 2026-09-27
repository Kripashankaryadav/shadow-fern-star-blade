import { create } from "zustand";
import { loadSave, writeSave, type SaveData } from "./save";
import type { Mode, Overlay, Phase, Quality, Results, Settings, Weather } from "./types";

const save = loadSave();

export interface UIState {
  phase: Phase;
  mode: Mode;
  overlay: Overlay;
  challengeId: number;
  results: Results | null;
  loadingProgress: number;
  loadingLabel: string;
  canvasReady: boolean;
  settings: Settings;
  appliedQuality: Quality;
  weather: Weather;
  bestRaceTime: number | null;
  bestScore: number;
  bestTimeTrial: number | null;
  isMobile: boolean;
  showMobile: boolean;
  setPhase: (p: Phase) => void;
  setOverlay: (o: Overlay) => void;
  setMode: (m: Mode) => void;
  setChallenge: (id: number) => void;
  setResults: (r: Results | null) => void;
  setLoading: (p: number, label: string) => void;
  setCanvasReady: (v: boolean) => void;
  patchSettings: (p: Partial<Settings>) => void;
  setAppliedQuality: (q: Quality) => void;
  setWeather: (w: Weather) => void;
  recordScore: (score: number, time: number, mode: Mode) => void;
}

function persist(partial: Partial<SaveData>, settings: Settings) {
  const cur = loadSave();
  writeSave({
    ...cur,
    ...partial,
    settings,
  });
}

export const useGameStore = create<UIState>((set, get) => ({
  phase: "boot",
  mode: "race",
  overlay: null,
  challengeId: 0,
  results: null,
  loadingProgress: 0.08,
  loadingLabel: "INITIALIZING FLIGHT SYSTEM...",
  canvasReady: false,
  settings: save.settings,
  appliedQuality: "medium",
  weather: "clear",
  bestRaceTime: save.bestRaceTime,
  bestScore: save.bestScore,
  bestTimeTrial: save.bestTimeTrial,
  isMobile: false,
  showMobile: false,
  setPhase: (phase) => set({ phase }),
  setOverlay: (overlay) => set({ overlay }),
  setMode: (mode) => set({ mode }),
  setChallenge: (challengeId) => set({ challengeId }),
  setResults: (results) => set({ results }),
  setLoading: (loadingProgress, loadingLabel) => set({ loadingProgress, loadingLabel }),
  setCanvasReady: (canvasReady) => set({ canvasReady }),
  patchSettings: (p) => {
    const settings = { ...get().settings, ...p };
    set({ settings });
    persist({}, settings);
  },
  setAppliedQuality: (appliedQuality) => set({ appliedQuality }),
  setWeather: (weather) => set({ weather }),
  recordScore: (score, time, mode) => {
    const s = get();
    const next = {
      bestScore: Math.max(s.bestScore, score),
      bestRaceTime:
        mode === "race" && !s.results?.fail
          ? s.bestRaceTime == null
            ? time
            : Math.min(s.bestRaceTime, time)
          : s.bestRaceTime,
      bestTimeTrial:
        mode === "timeTrial"
          ? s.bestTimeTrial == null
            ? time
            : Math.min(s.bestTimeTrial, time)
          : s.bestTimeTrial,
    };
    set(next);
    persist(next, s.settings);
  },
}));
