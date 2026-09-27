import { Pause } from "lucide-react";
import { useEffect, useRef } from "react";
import { game } from "@/game/state";
import { useGameStore } from "@/game/store";

export function HUD() {
  const showFps = useGameStore((s) => s.settings.showFps);
  const speed = useRef<HTMLSpanElement>(null);
  const alt = useRef<HTMLSpanElement>(null);
  const boost = useRef<HTMLSpanElement>(null);
  const time = useRef<HTMLSpanElement>(null);
  const score = useRef<HTMLSpanElement>(null);
  const combo = useRef<HTMLSpanElement>(null);
  const gate = useRef<HTMLDivElement>(null);
  const trick = useRef<HTMLDivElement>(null);
  const fps = useRef<HTMLDivElement>(null);
  const crash = useRef<HTMLDivElement>(null);
  const map = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    game.hudDom.speed = speed.current;
    game.hudDom.alt = alt.current;
    game.hudDom.boost = boost.current;
    game.hudDom.time = time.current;
    game.hudDom.score = score.current;
    game.hudDom.combo = combo.current;
    game.hudDom.gate = gate.current;
    game.hudDom.trick = trick.current;
    game.hudDom.fps = fps.current;
    game.hudDom.crash = crash.current;
    game.refs.minimap = map.current;
  }, []);

  return (
    <div className="hud">
      <div className="hud-vignette" />
      <div className="crash-flash" ref={crash} />

      <div className="hud-speed">
        <span className="hud-label">SPEED</span>
        <div>
          <span className="hud-value" ref={speed}>
            0
          </span>
          <span className="hud-unit">KM/H</span>
        </div>
      </div>

      <div className="hud-top">
        <div className="hud-chip">
          <span className="hud-label">SCORE</span>
          <div className="hud-value" ref={score}>
            0
          </div>
          <div className="combo-chip" ref={combo} />
        </div>
        <div />
        <button
          type="button"
          className="pause-btn"
          aria-label="Pause"
          onClick={() => useGameStore.getState().setPhase("paused")}
        >
          <Pause size={16} />
        </button>
      </div>

      {showFps ? <div className="fps-chip" ref={fps} /> : <div className="fps-chip" ref={fps} style={{ opacity: 0 }} />}

      <div className="hud-center">
        <div className="reticle" />
      </div>
      <div className="gate-banner" ref={gate}>
        CHECKPOINT 01
      </div>
      <div className="trick-pop" ref={trick} />

      <div className="hud-alt">
        <span className="hud-label">ALTITUDE</span>
        <div>
          <span className="hud-value" ref={alt}>
            0
          </span>
          <span className="hud-unit">M</span>
        </div>
      </div>

      <div className="hud-bottom">
        <div className="minimap-wrap">
          <canvas ref={map} width={112} height={112} />
        </div>
        <div className="hud-chip boost-bar">
          <span className="hud-label">BOOST</span>
          <div className="bar-track">
            <span className="bar-fill" ref={boost} />
          </div>
        </div>
        <div className="hud-chip time-chip">
          <span className="hud-label">TIME</span>
          <div className="hud-value" ref={time}>
            00:00.00
          </div>
        </div>
      </div>
    </div>
  );
}
