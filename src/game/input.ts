import { radialDeadzone } from "./math";
import { useGameStore } from "./store";

const GAME_CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyQ",
  "KeyE",
  "KeyR",
  "KeyV",
  "Space",
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Escape",
  "KeyP",
]);

export const input = {
  keys: new Set<string>(),
  injected: null as string[] | null,
  steerOverride: null as number | null,
  mouseDX: 0,
  mouseDY: 0,
  pointerLocked: false,
  throttle: 0,
  strafe: 0,
  vertical: 0,
  yaw: 0,
  boost: false,
  drift: false,
  brake: false,
  lookX: 0,
  lookY: 0,
  pausePressed: false,
  camPressed: false,
  _pauseWas: false,
  _camWas: false,
  touchMoveX: 0,
  touchMoveY: 0,
  touchLookX: 0,
  touchLookY: 0,
  touchBoost: false,
  touchUp: false,
  touchDown: false,
  touchBrake: false,
};

function held(code: string) {
  if (input.injected) return input.injected.includes(code);
  return input.keys.has(code);
}

export function bindInput() {
  const onDown = (e: KeyboardEvent) => {
    if (e.repeat) {
      if (GAME_CODES.has(e.code)) e.preventDefault();
      return;
    }
    input.keys.add(e.code);
    if (GAME_CODES.has(e.code)) e.preventDefault();
  };
  const onUp = (e: KeyboardEvent) => {
    input.keys.delete(e.code);
  };
  const clear = () => input.keys.clear();
  const onMouse = (e: MouseEvent) => {
    if (!input.pointerLocked) return;
    input.mouseDX += e.movementX;
    input.mouseDY += e.movementY;
  };
  const onLock = () => {
    input.pointerLocked = document.pointerLockElement != null;
    const phase = useGameStore.getState().phase;
    if (!input.pointerLocked && phase === "playing" && !useGameStore.getState().showMobile) {
      useGameStore.getState().setPhase("paused");
    }
  };

  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);
  window.addEventListener("blur", clear);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clear();
  });
  window.addEventListener("mousemove", onMouse);
  document.addEventListener("pointerlockchange", onLock);

  return () => {
    window.removeEventListener("keydown", onDown);
    window.removeEventListener("keyup", onUp);
    window.removeEventListener("blur", clear);
    window.removeEventListener("mousemove", onMouse);
    document.removeEventListener("pointerlockchange", onLock);
  };
}

export function sampleInput() {
  const inj = input.injected;
  const w = inj ? inj.includes("KeyW") : held("KeyW") || held("ArrowUp");
  const s = inj ? inj.includes("KeyS") : held("KeyS") || held("ArrowDown");
  const a = inj ? inj.includes("KeyA") : held("KeyA") || held("ArrowLeft");
  const d = inj ? inj.includes("KeyD") : held("KeyD") || held("ArrowRight");
  const q = held("KeyQ");
  const e = held("KeyE");

  input.boost = false;
  input.drift = false;
  let throttle = (w ? 1 : 0) - (s ? 1 : 0) + input.touchMoveY;
  let strafe = (d ? 1 : 0) - (a ? 1 : 0) + input.touchMoveX;
  if (input.steerOverride != null) {
    strafe = -input.steerOverride;
  }

  const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : null;
  if (pads) {
    for (const p of pads) {
      if (!p || p.mapping !== "standard") continue;
      const ls = radialDeadzone(p.axes[0] ?? 0, p.axes[1] ?? 0);
      const rs = radialDeadzone(p.axes[2] ?? 0, p.axes[3] ?? 0);
      throttle += -ls.y;
      strafe += ls.x;
      input.lookX += rs.x;
      input.lookY += rs.y;
      if (p.buttons[0]?.pressed) input.touchUp = true;
      if (p.buttons[1]?.pressed) input.touchDown = true;
      if ((p.buttons[7]?.value ?? 0) > 0.4 || p.buttons[2]?.pressed) input.boost = true;
      if (p.buttons[4]?.pressed || p.buttons[5]?.pressed) input.drift = true;
      if (p.buttons[9]?.pressed) input.pausePressed = true;
    }
  }

  input.throttle = Math.max(-1, Math.min(1, throttle));
  input.strafe = Math.max(-1, Math.min(1, strafe));
  input.vertical =
    (held("Space") || input.touchUp ? 1 : 0) -
    (held("ShiftLeft") || held("ShiftRight") || input.touchDown ? 1 : 0);
  input.yaw = (q ? 1 : 0) - (e ? 1 : 0);
  input.boost = held("KeyR") || input.touchBoost || input.boost;
  input.drift = held("ControlLeft") || held("ControlRight") || input.drift;
  input.brake = s || input.touchBrake;
  input.lookX += input.touchLookX;
  input.lookY += input.touchLookY;

  const pauseKey = held("Escape") || held("KeyP");
  input.pausePressed = pauseKey && !input._pauseWas;
  input._pauseWas = pauseKey;
  const camKey = held("KeyV");
  input.camPressed = camKey && !input._camWas;
  input._camWas = camKey;
}

export function consumeLook() {
  const dx = input.mouseDX;
  const dy = input.mouseDY;
  input.mouseDX = 0;
  input.mouseDY = 0;
  const lx = input.lookX;
  const ly = input.lookY;
  input.lookX = 0;
  input.lookY = 0;
  return { dx, dy, lx, ly };
}

export function setInjectedKeys(codes: string[]) {
  input.injected = codes.length ? codes.slice() : null;
  if (!codes.length) input.steerOverride = null;
}
