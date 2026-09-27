import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { game } from "@/game/state";
import { getMaterials } from "./materials";
import { sparks } from "@/game/particles";

const RAIN = 70;

export function WeatherFx() {
  const mats = getMaterials();
  const rainPos = useMemo(() => {
    const a = new Float32Array(RAIN * 3);
    for (let i = 0; i < RAIN; i++) {
      a[i * 3] = (Math.random() - 0.5) * 40;
      a[i * 3 + 1] = Math.random() * 30;
      a[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return a;
  }, []);
  const rainGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
    return g;
  }, [rainPos]);
  const sparkGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(sparks.pos, 3));
    sparks.geo = g;
    return g;
  }, []);

  useLayoutEffect(() => {
    game.refs.rainGeo = rainGeo;
    game.refs.rainPos = rainPos;
    return () => {
      rainGeo.dispose();
      sparkGeo.dispose();
    };
  }, [rainGeo, rainPos, sparkGeo]);

  return (
    <>
      <points geometry={rainGeo} material={mats.rain} />
      <points geometry={sparkGeo} material={mats.spark} />
    </>
  );
}
