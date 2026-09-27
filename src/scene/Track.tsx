import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CHECKPOINTS, obstacles, rings } from "@/game/worldData";
import { game } from "@/game/state";
import { getMaterials } from "./materials";

function Gate({
  i,
  x,
  y,
  z,
  yaw,
  r,
}: {
  i: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  r: number;
}) {
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: "#8ec8d8",
      emissive: "#3d8a9c",
      emissiveIntensity: 1.1,
      metalness: 0.2,
      roughness: 0.45,
      transparent: true,
      opacity: 0.92,
    });
    return m;
  }, []);
  useLayoutEffect(() => {
    game.refs.gateMats[i] = mat;
    return () => {
      mat.dispose();
    };
  }, [i, mat]);
  const finish = i === CHECKPOINTS.length - 1;
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <mesh material={mat} rotation={[0, 0, 0]}>
        <torusGeometry args={[r, finish ? 0.42 : 0.28, 8, 28]} />
      </mesh>
      <mesh material={mat} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.08]}>
        <torusGeometry args={[r * 0.72, 0.08, 6, 20]} />
      </mesh>
    </group>
  );
}

function Turbine({
  x,
  y,
  z,
  i,
}: {
  x: number;
  y: number;
  z: number;
  i: number;
}) {
  const blades = useRef<THREE.Group>(null);
  const mats = getMaterials();
  useLayoutEffect(() => {
    if (blades.current) game.refs.turbines[i] = blades.current;
  }, [i]);
  return (
    <group position={[x, y, z]}>
      <mesh material={mats.metal} position={[0, -6, 0]}>
        <cylinderGeometry args={[0.7, 1.1, 12, 8]} />
      </mesh>
      <group ref={blades}>
        <mesh material={mats.metal} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[14, 0.25, 1.6]} />
        </mesh>
        <mesh material={mats.metal} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
          <boxGeometry args={[14, 0.25, 1.6]} />
        </mesh>
      </group>
    </group>
  );
}

export function Track() {
  const mats = getMaterials();
  const laser = useRef<THREE.Mesh>(null);
  const mover = useRef<THREE.Mesh>(null);
  useLayoutEffect(() => {
    (game.refs as { laser?: THREE.Mesh | null; mover?: THREE.Mesh | null }).laser = laser.current;
    (game.refs as { mover?: THREE.Mesh | null }).mover = mover.current;
  }, []);

  return (
    <group>
      {CHECKPOINTS.map((g, i) => (
        <Gate key={i} i={i} x={g.x} y={g.y} z={g.z} yaw={g.yaw} r={g.r} />
      ))}
      {rings.map((rg, i) => (
        <mesh key={`r${i}`} position={[rg.x, rg.y, rg.z]} material={mats.neon} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[2.2, 0.12, 6, 16]} />
        </mesh>
      ))}
      <Turbine x={24} y={16} z={-1008} i={0} />
      <Turbine x={-30} y={18} z={-1072} i={1} />
      <mesh ref={laser} position={[0, 12, -1148]} material={mats.neon}>
        <boxGeometry args={[18, 0.35, 0.35]} />
      </mesh>
      <mesh position={[18, 14, -958]} material={mats.metal}>
        <octahedronGeometry args={[3.5, 0]} />
      </mesh>
      <mesh ref={mover} position={[-20, 16, -1188]} material={mats.rust}>
        <boxGeometry args={[8, 1.2, 6]} />
      </mesh>
      {obstacles.length ? null : null}
    </group>
  );
}
