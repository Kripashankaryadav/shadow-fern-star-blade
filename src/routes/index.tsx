import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [App, setApp] = useState<ComponentType | null>(null);

  useEffect(() => {
    let live = true;
    void import("@/game/GameApp").then((mod) => {
      if (live) setApp(() => mod.GameApp);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!App) return <BootScreen />;
  return <App />;
}

function BootScreen() {
  return (
    <div className="game-root boot-screen">
      <div className="boot-mark" />
      <p className="boot-kicker">FPV SYSTEMS ONLINE</p>
      <h1 className="boot-title">DRONE RUSH</h1>
      <p className="boot-tag">FLY BEYOND LIMITS</p>
      <div className="boot-bar">
        <span style={{ width: "18%" }} />
      </div>
      <p className="boot-stage">INITIALIZING FLIGHT SYSTEM...</p>
    </div>
  );
}
