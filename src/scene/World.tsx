import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  buildings,
  containers,
  pipes,
  poles,
  rocks,
  streetLights,
  tanks,
  towers,
  trees,
  WATER,
} from "@/game/worldData";
import { terrainHeight } from "@/game/math";
import { game } from "@/game/state";
import { getMaterials } from "./materials";
import type { InstanceItem } from "@/game/types";

function Instanced({
  geometry,
  material,
  items,
  castShadow = false,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  items: InstanceItem[];
  castShadow?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < items.length; i++) {
      const it = items[i]!;
      dummy.position.set(it.x, it.y, it.z);
      dummy.rotation.set(0, it.ry, 0);
      dummy.scale.set(it.sx, it.sy, it.sz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  if (items.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow={castShadow}
      receiveShadow
      frustumCulled={false}
    />
  );
}

function makeTerrain(width: number, depth: number, segs: number, ox: number, oz: number) {
  const geo = new THREE.PlaneGeometry(width, depth, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + ox;
    const z = pos.getZ(i) + oz;
    pos.setY(i, terrainHeight(x, z));
  }
  geo.computeVertexNormals();
  return geo;
}

export function World() {
  const mats = getMaterials();
  const cityRef = useRef<THREE.Group>(null);
  const mtnRef = useRef<THREE.Group>(null);
  const indRef = useRef<THREE.Group>(null);
  const trafficRef = useRef<THREE.InstancedMesh>(null);

  const geos = useMemo(
    () => ({
      box: new THREE.BoxGeometry(1, 1, 1),
      cone: new THREE.ConeGeometry(1, 2.4, 6),
      sphere: new THREE.IcosahedronGeometry(1, 0),
      cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
      city: makeTerrain(520, 460, 20, 0, -160),
      mtn: makeTerrain(560, 560, 40, 0, -620),
      ind: makeTerrain(520, 520, 16, 0, -1120),
    }),
    [],
  );

  useLayoutEffect(() => {
    game.refs.cityGroup = cityRef.current;
    game.refs.mtnGroup = mtnRef.current;
    game.refs.indGroup = indRef.current;
    game.refs.traffic = trafficRef.current;
    game.refs.skyMat = mats.sky;
    game.refs.waterMat = mats.water;
    game.refs.buildingMat = mats.building;
    return () => {
      Object.values(geos).forEach((g) => g.dispose());
    };
  }, [geos, mats]);

  const treeItems = trees;
  const rockItems = rocks;

  return (
    <>
      <group ref={cityRef}>
        <mesh
          geometry={geos.city}
          material={mats.cityGround}
          position={[0, 0, -160]}
          receiveShadow
        />
        <mesh material={mats.road} position={[0, 0.05, -180]} receiveShadow>
          <boxGeometry args={[22, 0.08, 420]} />
        </mesh>
        <mesh material={mats.road} position={[0, 0.05, -120]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[18, 0.08, 280]} />
        </mesh>
        <Instanced geometry={geos.box} material={mats.building} items={buildings} castShadow />
        <Instanced geometry={geos.cyl} material={mats.metal} items={streetLights} />
        <mesh material={mats.concrete} position={[-15.2, 8, -248]}>
          <boxGeometry args={[5.4, 16, 48]} />
        </mesh>
        <mesh material={mats.concrete} position={[15.2, 8, -248]}>
          <boxGeometry args={[5.4, 16, 48]} />
        </mesh>
        <mesh material={mats.concrete} position={[0, 15.8, -248]}>
          <boxGeometry args={[36, 1.6, 48]} />
        </mesh>
        <mesh material={mats.road} position={[0, 20.8, -328]} receiveShadow>
          <boxGeometry args={[48, 1.2, 18]} />
        </mesh>
        <mesh material={mats.concrete} position={[-22, 10, -328]}>
          <boxGeometry args={[2.2, 20, 2.2]} />
        </mesh>
        <mesh material={mats.concrete} position={[22, 10, -328]}>
          <boxGeometry args={[2.2, 20, 2.2]} />
        </mesh>
        <mesh material={mats.neon} position={[-48, 38, -90]}>
          <boxGeometry args={[8, 3.2, 0.4]} />
        </mesh>
        <mesh material={mats.neon} position={[52, 44, -150]}>
          <boxGeometry args={[0.4, 4, 10]} />
        </mesh>
        <instancedMesh ref={trafficRef} args={[geos.box, mats.metal, 8]} frustumCulled={false} />
      </group>

      <group ref={mtnRef}>
        <mesh geometry={geos.mtn} material={mats.terrain} position={[0, 0, -620]} receiveShadow />
        <Instanced geometry={geos.cone} material={mats.pine} items={treeItems} />
        <Instanced geometry={geos.sphere} material={mats.rock} items={rockItems} />
        <Instanced geometry={geos.cyl} material={mats.metal} items={poles} />
        <mesh material={mats.water} position={[WATER.x, WATER.y, WATER.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[WATER.w, WATER.d, 12, 18]} />
        </mesh>
        <mesh material={mats.rock} position={[-13.2, 9, -692]}>
          <boxGeometry args={[5.4, 18, 52]} />
        </mesh>
        <mesh material={mats.rock} position={[13.2, 9, -692]}>
          <boxGeometry args={[5.4, 18, 52]} />
        </mesh>
        <mesh material={mats.rock} position={[0, 18.5, -692]}>
          <boxGeometry args={[32, 3, 52]} />
        </mesh>
        <mesh material={mats.neon} position={[70, 28, -720]} rotation={[0, 0.2, 0.4]}>
          <boxGeometry args={[2.4, 18, 0.4]} />
        </mesh>
        <mesh material={mats.road} position={[18, 18.6, -468]}>
          <boxGeometry args={[36, 1.1, 14]} />
        </mesh>
        <mesh material={mats.road} position={[-12, 22.6, -590]}>
          <boxGeometry args={[40, 1.1, 16]} />
        </mesh>
      </group>

      <group ref={indRef}>
        <mesh geometry={geos.ind} material={mats.concrete} position={[0, 0, -1120]} receiveShadow />
        <Instanced geometry={geos.box} material={mats.rust} items={containers} castShadow />
        <Instanced geometry={geos.cyl} material={mats.metal} items={tanks} />
        <Instanced geometry={geos.box} material={mats.metal} items={towers} />
        <Instanced geometry={geos.cyl} material={mats.metal} items={pipes} />
        <mesh material={mats.neon} position={[0, 14, -1088]}>
          <cylinderGeometry args={[6, 8, 10, 10]} />
        </mesh>
        <mesh material={mats.metal} position={[0, 22, -1088]}>
          <torusGeometry args={[7, 0.5, 6, 16]} />
        </mesh>
        <mesh material={mats.road} position={[8, 16.6, -900]}>
          <boxGeometry args={[32, 1.1, 16]} />
        </mesh>
        <mesh material={mats.road} position={[-6, 18.6, -1048]}>
          <boxGeometry args={[36, 1.1, 18]} />
        </mesh>
      </group>
    </>
  );
}
