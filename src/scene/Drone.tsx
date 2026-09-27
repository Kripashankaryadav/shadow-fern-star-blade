import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { game } from "@/game/state";
import { getMaterials } from "./materials";

function Arm({
  x,
  z,
  body,
  accent,
}: {
  x: number;
  z: number;
  body: THREE.Material;
  accent: THREE.Material;
}) {
  const motor = useRef<THREE.Mesh>(null);
  const prop = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    if (motor.current) game.refs.motors.push(motor.current);
    if (prop.current) game.refs.props.push(prop.current);
  }, []);
  return (
    <group position={[x, 0.02, z]}>
      <mesh material={body} position={[-x * 0.42, 0, -z * 0.42]} rotation={[0, Math.atan2(x, z), 0.04]}>
        <boxGeometry args={[0.12, 0.07, 1.05]} />
      </mesh>
      <mesh ref={motor} material={accent}>
        <cylinderGeometry args={[0.16, 0.18, 0.16, 8]} />
      </mesh>
      <group ref={prop} position={[0, 0.1, 0]}>
        <mesh material={body} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.08, 0.02, 0.95]} />
        </mesh>
        <mesh material={body} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.08, 0.02, 0.95]} />
        </mesh>
      </group>
    </group>
  );
}

export function DroneMesh({ enemy = false }: { enemy?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mats = getMaterials();
  const body = enemy ? mats.enemy : mats.droneBody;
  const accent = enemy ? mats.enemy : mats.droneAccent;
  const dark = enemy ? mats.enemy : mats.droneDark;

  useLayoutEffect(() => {
    if (enemy) {
      if (group.current) game.refs.enemyGroups.push(group.current);
      return;
    }
    game.refs.droneGroup = group.current;
    return () => {
      if (game.refs.droneGroup === group.current) game.refs.droneGroup = null;
    };
  }, [enemy]);

  return (
    <group ref={group}>
      <mesh material={body} castShadow>
        <boxGeometry args={[0.95, 0.22, 1.25]} />
      </mesh>
      <mesh material={dark} position={[0, 0.16, 0.05]} scale={[0.7, 0.35, 0.7]}>
        <sphereGeometry args={[0.42, 10, 8]} />
      </mesh>
      <mesh material={accent} position={[0, -0.02, 0.72]}>
        <boxGeometry args={[0.28, 0.12, 0.18]} />
      </mesh>
      <mesh material={body} position={[0.55, 0.02, 0]} rotation={[0, 0, 0.35]}>
        <boxGeometry args={[0.55, 0.04, 0.32]} />
      </mesh>
      <mesh material={body} position={[-0.55, 0.02, 0]} rotation={[0, 0, -0.35]}>
        <boxGeometry args={[0.55, 0.04, 0.32]} />
      </mesh>
      <Arm x={0.92} z={0.92} body={body} accent={accent} />
      <Arm x={-0.92} z={0.92} body={body} accent={accent} />
      <Arm x={0.92} z={-0.92} body={body} accent={accent} />
      <Arm x={-0.92} z={-0.92} body={body} accent={accent} />
      <mesh material={accent} position={[0.4, -0.08, -0.4]}>
        <boxGeometry args={[0.08, 0.04, 0.08]} />
      </mesh>
      <mesh material={accent} position={[-0.4, -0.08, -0.4]}>
        <boxGeometry args={[0.08, 0.04, 0.08]} />
      </mesh>
    </group>
  );
}
