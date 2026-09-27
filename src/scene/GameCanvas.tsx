import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { game } from "@/game/state";
import { useGameStore } from "@/game/store";
import { dprFor } from "@/game/performance";
import { gfxUniforms } from "./materials";
import { World } from "./World";
import { DroneMesh } from "./Drone";
import { Track } from "./Track";
import { WeatherFx } from "./Weather";
import { GameLoop } from "./GameLoop";

function Lights() {
  const quality = useGameStore((s) => s.appliedQuality);
  return (
    <>
      <hemisphereLight
        args={["#c5d2de", "#1a1814", 0.55]}
        ref={(l) => {
          if (l) game.refs.hemi = l;
        }}
      />
      <ambientLight intensity={0.12} />
      <directionalLight
        castShadow={quality !== "low"}
        intensity={1.25}
        position={[80, 140, 40]}
        shadow-mapSize-width={quality === "ultra" ? 2048 : quality === "high" ? 1024 : 512}
        shadow-mapSize-height={quality === "ultra" ? 2048 : quality === "high" ? 1024 : 512}
        shadow-camera-near={10}
        shadow-camera-far={420}
        shadow-camera-left={-140}
        shadow-camera-right={140}
        shadow-camera-top={140}
        shadow-camera-bottom={-140}
        ref={(l) => {
          if (l) game.refs.sun = l;
        }}
      />
    </>
  );
}

function Enemies() {
  return (
    <>
      <DroneMesh enemy />
      <DroneMesh enemy />
      <DroneMesh enemy />
    </>
  );
}

export function GameCanvas() {
  const quality = useGameStore((s) => s.appliedQuality);
  const shadows = quality !== "low";

  return (
    <Canvas
      dpr={dprFor(quality)}
      shadows={shadows}
      gl={{
        antialias: quality === "ultra",
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      camera={{ fov: 75, near: 0.25, far: 520, position: [4, 13, 18] }}
      onCreated={({ gl, scene, camera }) => {
        gl.setClearColor("#07080b");
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.92;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.shadowMap.enabled = shadows;
        gl.shadowMap.type = THREE.BasicShadowMap;
        const fog = new THREE.Fog(gfxUniforms.fogColor.value, 80, 420);
        scene.fog = fog;
        game.refs.fog = fog;
        game.refs.canvas = gl.domElement;
        camera.lookAt(0, 12, 10);
        useGameStore.getState().setCanvasReady(true);
      }}
      onPointerDown={() => {
        const st = useGameStore.getState();
        if (st.phase === "playing" && !st.showMobile) {
          game.refs.canvas?.requestPointerLock?.();
        }
      }}
    >
      <Lights />
      <World />
      <Track />
      <DroneMesh />
      <Enemies />
      <WeatherFx />
      <GameLoop />
    </Canvas>
  );
}
