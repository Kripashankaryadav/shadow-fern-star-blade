import { input } from "@/game/input";
import { useGameStore } from "@/game/store";
import { useRef } from "react";

function Stick({
  side,
  onAxis,
}: {
  side: "left" | "right";
  onAxis: (x: number, y: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const nub = useRef<HTMLDivElement>(null);
  const pid = useRef<number | null>(null);

  const setNub = (x: number, y: number) => {
    if (!nub.current) return;
    nub.current.style.transform = `translate(calc(-50% + ${x * 28}px), calc(-50% + ${y * 28}px))`;
  };

  const handle = (clientX: number, clientY: number) => {
    const el = root.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = clientX - (r.left + r.width / 2);
    const dy = clientY - (r.top + r.height / 2);
    const m = Math.hypot(dx, dy);
    const rad = r.width * 0.42;
    const k = m > rad ? rad / m : 1;
    const x = (dx * k) / rad;
    const y = (dy * k) / rad;
    setNub(x, y);
    onAxis(x, y);
  };

  return (
    <div
      ref={root}
      className={`stick ${side === "left" ? "stick-left" : "stick-right"}`}
      onPointerDown={(e) => {
        pid.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        handle(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pid.current !== e.pointerId) return;
        handle(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (pid.current !== e.pointerId) return;
        pid.current = null;
        setNub(0, 0);
        onAxis(0, 0);
      }}
      onPointerCancel={() => {
        pid.current = null;
        setNub(0, 0);
        onAxis(0, 0);
      }}
    >
      <div className="stick-nub" ref={nub} />
    </div>
  );
}

export function MobileControls() {
  const show = useGameStore((s) => s.showMobile);
  const phase = useGameStore((s) => s.phase);
  if (!show || phase !== "playing") return null;

  return (
    <div className="mobile-ui">
      <Stick
        side="left"
        onAxis={(x, y) => {
          input.touchMoveX = x;
          input.touchMoveY = -y;
        }}
      />
      <Stick
        side="right"
        onAxis={(x, y) => {
          input.touchLookX = x;
          input.touchLookY = y;
        }}
      />
      <div className="mobile-left-btns">
        <button type="button" onPointerDown={() => (input.touchUp = true)} onPointerUp={() => (input.touchUp = false)}>
          UP
        </button>
        <button
          type="button"
          onPointerDown={() => (input.touchDown = true)}
          onPointerUp={() => (input.touchDown = false)}
        >
          DOWN
        </button>
      </div>
      <div className="mobile-btns">
        <button
          type="button"
          onPointerDown={() => (input.touchBoost = true)}
          onPointerUp={() => (input.touchBoost = false)}
        >
          BOOST
        </button>
        <button
          type="button"
          onPointerDown={() => (input.touchBrake = true)}
          onPointerUp={() => (input.touchBrake = false)}
        >
          BRAKE
        </button>
      </div>
    </div>
  );
}
