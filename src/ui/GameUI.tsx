import { Volume2, VolumeX } from "lucide-react";
import { audio } from "@/game/audio";
import { formatTime } from "@/game/math";
import { startPlay } from "@/game/race";
import { game } from "@/game/state";
import { useGameStore } from "@/game/store";
import type { Mode, Weather } from "@/game/types";
import { HUD } from "./HUD";
import { MobileControls } from "./MobileControls";

const STAGES = [
  "INITIALIZING FLIGHT SYSTEM...",
  "LOADING TERRAIN...",
  "LOADING CITY...",
  "LOADING PHYSICS...",
  "CALIBRATING DRONE...",
];

export function GameUI() {
  const phase = useGameStore((s) => s.phase);
  const overlay = useGameStore((s) => s.overlay);

  return (
    <>
      {phase === "boot" && <Loading />}
      {phase === "menu" && overlay == null && <MainMenu />}
      {phase === "playing" && <HUD />}
      {phase === "paused" && <PauseMenu />}
      {phase === "results" && <Results />}
      {(overlay === "settings" || (phase === "paused" && overlay === "settings")) && <Settings />}
      {overlay === "controls" && <Controls />}
      {overlay === "modes" && <Modes />}
      {phase === "menu" && <SoundButton />}
      <MobileControls />
    </>
  );
}

function SoundButton() {
  const muted = useGameStore((s) => s.settings.muted);
  return (
    <button
      type="button"
      className="sound-toggle"
      aria-label={muted ? "Unmute" : "Mute"}
      onClick={() => {
        audio.unlock();
        useGameStore.getState().patchSettings({ muted: !muted });
        audio.applyVolumes();
      }}
    >
      {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
    </button>
  );
}

function Loading() {
  const p = useGameStore((s) => s.loadingProgress);
  const label = useGameStore((s) => s.loadingLabel);
  return (
    <div className="overlay menu">
      <div className="boot-mark" />
      <p className="boot-kicker">FPV SYSTEMS ONLINE</p>
      <h1 className="boot-title">DRONE RUSH</h1>
      <p className="boot-tag">FLY BEYOND LIMITS</p>
      <div className="boot-bar">
        <span style={{ width: `${Math.round(p * 100)}%` }} />
      </div>
      <p className="boot-stage">{label || STAGES[0]}</p>
    </div>
  );
}

function play(mode: Mode, challenge = 0) {
  audio.unlock();
  startPlay(mode, challenge);
}

function MainMenu() {
  const setOverlay = useGameStore((s) => s.setOverlay);
  return (
    <div className="overlay menu">
      <p className="menu-kicker">AERO / RACE OPS</p>
      <h1 className="menu-title">DRONE RUSH</h1>
      <p className="menu-tag">FLY BEYOND LIMITS</p>
      <div className="overlay-panel">
        <div className="menu-actions">
          <button type="button" className="btn btn-primary" onClick={() => play("race")}>
            START RACE
          </button>
          <button type="button" className="btn" onClick={() => play("freeFlight")}>
            FREE FLIGHT
          </button>
          <div className="menu-row">
            <button type="button" className="btn btn-ghost" onClick={() => setOverlay("settings")}>
              SETTINGS
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setOverlay("controls")}>
              CONTROLS
            </button>
          </div>
          <div className="menu-row">
            <button type="button" className="btn btn-ghost" onClick={() => play("timeTrial")}>
              TIME TRIAL
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setOverlay("modes")}>
              CHALLENGE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PauseMenu() {
  const setPhase = useGameStore((s) => s.setPhase);
  const setOverlay = useGameStore((s) => s.setOverlay);
  const mode = useGameStore((s) => s.mode);
  return (
    <div className="overlay">
      <div className="overlay-panel">
        <p className="menu-kicker">DRONE RUSH</p>
        <h2 className="menu-title" style={{ fontSize: "2.4rem" }}>
          PAUSED
        </h2>
        <div className="menu-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setPhase("playing");
              game.refs.canvas?.requestPointerLock?.();
            }}
          >
            RESUME
          </button>
          <button type="button" className="btn" onClick={() => play(mode)}>
            RESTART
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setOverlay("settings")}>
            SETTINGS
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setOverlay(null);
              setPhase("menu");
            }}
          >
            EXIT
          </button>
        </div>
      </div>
    </div>
  );
}

function Results() {
  const results = useGameStore((s) => s.results);
  const mode = useGameStore((s) => s.mode);
  const setPhase = useGameStore((s) => s.setPhase);
  if (!results) return null;
  return (
    <div className="overlay">
      <div className="overlay-panel">
        <p className="menu-kicker">{results.fail ? "SIGNAL LOST" : "FLIGHT LOG"}</p>
        <h2 className="menu-title" style={{ fontSize: "2.2rem" }}>
          {results.title}
        </h2>
        <div className="results-grid">
          <div>
            <span>TIME</span>
            <b>{formatTime(results.time)}</b>
          </div>
          <div>
            <span>SCORE</span>
            <b>{results.score}</b>
          </div>
          <div>
            <span>MAX SPEED</span>
            <b>{Math.round(results.maxSpeed)}</b>
          </div>
          <div>
            <span>TRICKS</span>
            <b>{results.tricks}</b>
          </div>
          <div>
            <span>GATES</span>
            <b>{results.checkpoints}</b>
          </div>
          <div>
            <span>BEST</span>
            <b>{results.best ? "NEW" : "—"}</b>
          </div>
        </div>
        <div className="menu-actions">
          <button type="button" className="btn btn-primary" onClick={() => play(mode === "freeFlight" ? "race" : mode)}>
            {results.fail ? "RETRY" : "NEXT RACE"}
          </button>
          <button type="button" className="btn" onClick={() => play(mode)}>
            RETRY
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => play("freeFlight")}>
            FREE FLIGHT
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setPhase("menu")}>
            EXIT
          </button>
        </div>
      </div>
    </div>
  );
}

function Settings() {
  const s = useGameStore((s) => s.settings);
  const patch = useGameStore((s) => s.patchSettings);
  const setOverlay = useGameStore((s) => s.setOverlay);
  const weather = useGameStore((s) => s.weather);
  const q = s.quality;
  return (
    <div className="overlay">
      <div className="overlay-panel wide">
        <p className="menu-kicker">SYSTEM</p>
        <h2 className="menu-title" style={{ fontSize: "2rem" }}>
          SETTINGS
        </h2>
        <div className="settings-grid">
          <div className="setting-row">
            <label>GRAPHICS</label>
            <div className="seg" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
              {(["auto", "low", "medium", "high", "ultra"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={q === v ? "on" : ""}
                  onClick={() => {
                    patch({ quality: v });
                    useGameStore.getState().setAppliedQuality(v === "auto" ? "medium" : v);
                  }}
                >
                  {v.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <Slider
            label="MOUSE SENSITIVITY"
            min={0.0008}
            max={0.006}
            step={0.0002}
            value={s.mouseSens}
            onChange={(v) => patch({ mouseSens: v })}
          />
          <Slider
            label="FLIGHT SENSITIVITY"
            min={0.5}
            max={1.8}
            step={0.05}
            value={s.flightSens}
            onChange={(v) => patch({ flightSens: v })}
          />
          <Slider label="FOV" min={60} max={95} step={1} value={s.fov} onChange={(v) => patch({ fov: v })} />
          <div className="toggle">
            <span>INVERT Y</span>
            <button type="button" className={s.invertY ? "on" : ""} onClick={() => patch({ invertY: !s.invertY })}>
              {s.invertY ? "ON" : "OFF"}
            </button>
          </div>
          <div className="toggle">
            <span>CAMERA SHAKE</span>
            <button
              type="button"
              className={s.cameraShake ? "on" : ""}
              onClick={() => patch({ cameraShake: !s.cameraShake })}
            >
              {s.cameraShake ? "ON" : "OFF"}
            </button>
          </div>
          <div className="toggle">
            <span>SHOW FPS</span>
            <button type="button" className={s.showFps ? "on" : ""} onClick={() => patch({ showFps: !s.showFps })}>
              {s.showFps ? "ON" : "OFF"}
            </button>
          </div>
          <div className="setting-row">
            <label>WEATHER</label>
            <div className="seg" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {(["clear", "rain", "storm"] as Weather[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  className={weather === w ? "on" : ""}
                  onClick={() => useGameStore.getState().setWeather(w)}
                >
                  {w.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <Slider
            label="MASTER VOLUME"
            min={0}
            max={1}
            step={0.02}
            value={s.master}
            onChange={(v) => {
              patch({ master: v });
              audio.applyVolumes();
            }}
          />
          <Slider
            label="ENGINE"
            min={0}
            max={1}
            step={0.02}
            value={s.engine}
            onChange={(v) => {
              patch({ engine: v });
              audio.applyVolumes();
            }}
          />
          <Slider
            label="EFFECTS"
            min={0}
            max={1}
            step={0.02}
            value={s.effects}
            onChange={(v) => {
              patch({ effects: v });
              audio.applyVolumes();
            }}
          />
          <Slider
            label="MUSIC"
            min={0}
            max={1}
            step={0.02}
            value={s.music}
            onChange={(v) => {
              patch({ music: v });
              audio.applyVolumes();
            }}
          />
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setOverlay(null)}>
          CLOSE
        </button>
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="setting-row">
      <label>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Controls() {
  const setOverlay = useGameStore((s) => s.setOverlay);
  const rows: [string, string][] = [
    ["W / S", "FORWARD / BACK"],
    ["A / D", "STRAFE + BANK"],
    ["Q / E", "YAW"],
    ["MOUSE", "LOOK / PITCH"],
    ["SPACE / SHIFT", "ASCEND / DESCEND"],
    ["R", "BOOST"],
    ["CTRL", "DRIFT"],
    ["V", "FPV / CHASE CAM"],
    ["ESC", "PAUSE"],
  ];
  return (
    <div className="overlay">
      <div className="overlay-panel">
        <p className="menu-kicker">INPUT MAP</p>
        <h2 className="menu-title" style={{ fontSize: "2rem" }}>
          CONTROLS
        </h2>
        <div className="controls-list">
          {rows.flatMap(([k, v]) => [
            <span key={k}>{k}</span>,
            <span key={k + "v"}>{v}</span>,
          ])}
        </div>
        <p className="boot-stage" style={{ marginTop: 12 }}>
          A banks left. D banks right. Hold W to race the canyon.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setOverlay(null)}>
          CLOSE
        </button>
      </div>
    </div>
  );
}

function Modes() {
  const setOverlay = useGameStore((s) => s.setOverlay);
  return (
    <div className="overlay">
      <div className="overlay-panel">
        <p className="menu-kicker">SPECIAL OPS</p>
        <h2 className="menu-title" style={{ fontSize: "2rem" }}>
          CHALLENGE
        </h2>
        <div className="menu-actions">
          <button type="button" className="btn btn-primary" onClick={() => play("challenge", 0)}>
            10 GATES / 40S
          </button>
          <button type="button" className="btn" onClick={() => play("challenge", 1)}>
            UNDER 5 BRIDGES
          </button>
          <button type="button" className="btn" onClick={() => play("challenge", 2)}>
            HOLD 150 KM/H
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setOverlay(null)}>
            BACK
          </button>
        </div>
      </div>
    </div>
  );
}

