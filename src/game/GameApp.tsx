import { useEffect } from "react";
import { bindInput } from "./input";
import { applySettingsQuality } from "./performance";
import { useGameStore } from "./store";
import { audio } from "./audio";
import { GameCanvas } from "@/scene/GameCanvas";
import { GameUI } from "@/ui/GameUI";

export function GameApp() {
  useEffect(() => {
    const unbind = bindInput();
    applySettingsQuality();
    const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 820;
    useGameStore.setState({ isMobile: mobile, showMobile: mobile });

    const stages: [number, string][] = [
      [0.18, "INITIALIZING FLIGHT SYSTEM..."],
      [0.4, "LOADING TERRAIN..."],
      [0.62, "LOADING CITY..."],
      [0.8, "LOADING PHYSICS..."],
      [0.94, "CALIBRATING DRONE..."],
      [1, "READY"],
    ];
    let i = 0;
    const id = window.setInterval(() => {
      const st = stages[i++];
      if (!st) {
        window.clearInterval(id);
        return;
      }
      useGameStore.getState().setLoading(st[0], st[1]);
    }, 220);

    const vis = () => {
      if (!document.hidden) audio.unlock();
    };
    document.addEventListener("visibilitychange", vis);

    return () => {
      unbind();
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  const progress = useGameStore((s) => s.loadingProgress);
  const ready = useGameStore((s) => s.canvasReady);
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    if (phase === "boot" && ready && progress >= 1) {
      const t = window.setTimeout(() => useGameStore.getState().setPhase("menu"), 180);
      return () => window.clearTimeout(t);
    }
  }, [phase, ready, progress]);

  return (
    <div className="game-root">
      <GameCanvas />
      <GameUI />
    </div>
  );
}
