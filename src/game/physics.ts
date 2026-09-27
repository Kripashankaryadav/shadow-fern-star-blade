import { clamp, terrainHeight, wrapPi } from "./math";
import { basisFromYawPitch, game } from "./state";
import { consumeLook, input } from "./input";
import { useGameStore } from "./store";
import { WORLD_MAX_X, WORLD_MAX_Z, WORLD_MIN_X, WORLD_MIN_Z } from "./worldData";

const ACCEL = 48;
const BOOST_ACCEL = 92;
const STRAFE_ACCEL = 38;
const VERT_ACCEL = 36;
const DRAG = 1.55;
const BOOST_DRAG = 0.85;
const MAX_SPEED = 48;
const BOOST_SPEED = 82;
const YAW_RATE = 2.35;
const BANK_MAX = 0.62;
const DRAIN = 0.32;
const REGEN = 0.14;

export function stepPhysics(dt: number) {
  const d = game.drone;
  if (!d.alive) return;

  const settings = useGameStore.getState().settings;
  const look = consumeLook();
  const sens = settings.mouseSens * settings.flightSens;
  const invert = settings.invertY ? -1 : 1;

  d.yaw += -look.dx * sens;
  d.yaw += -look.lx * 2.4 * dt * settings.flightSens;
  d.pitch += -look.dy * sens * invert;
  d.pitch += -look.ly * 1.8 * dt * invert * settings.flightSens;

  const steer = -input.strafe;
  const yawIn = input.yaw + steer * 0.72;
  const yawSpeed = YAW_RATE * (input.drift ? 1.85 : 1) * settings.flightSens;
  d.yaw += yawIn * yawSpeed * dt;
  d.yaw = wrapPi(d.yaw);
  d.pitch = clamp(d.pitch, -1.32, 1.32);

  d.yawRate = dampRate(d.yawRate, yawIn * yawSpeed, 14, dt);

  const targetRoll = clamp(steer * BANK_MAX + input.yaw * 0.28, -0.95, 0.95) * (input.drift ? 1.35 : 1);
  d.roll = expDamp(d.roll, targetRoll, 8, dt);
  d.rollRate = (targetRoll - d.roll) * 8;

  basisFromYawPitch(d.yaw, d.pitch);

  d.boosting = input.boost && d.boost > 0.06;
  if (d.boosting) d.boost = Math.max(0, d.boost - DRAIN * dt);
  else d.boost = Math.min(1, d.boost + REGEN * dt);
  d.drifting = input.drift;

  const maxSpd = d.boosting ? BOOST_SPEED : MAX_SPEED;
  const accel = d.boosting ? BOOST_ACCEL : ACCEL;

  d.velocity.addScaledVector(game.forward, input.throttle * accel * dt);
  d.velocity.addScaledVector(game.right, input.strafe * STRAFE_ACCEL * dt);
  d.velocity.y += input.vertical * VERT_ACCEL * dt;

  if (input.brake && input.throttle <= 0) {
    d.velocity.multiplyScalar(Math.exp(-3.2 * dt));
  }

  if (input.vertical === 0) {
    d.velocity.y = expDamp(d.velocity.y, 0, 1.8, dt);
  } else {
    d.velocity.y -= 4.2 * dt;
  }

  const drag = d.boosting ? BOOST_DRAG : DRAG;
  d.velocity.multiplyScalar(Math.exp(-drag * dt));

  const spd = d.velocity.length();
  if (spd > maxSpd) d.velocity.multiplyScalar(maxSpd / spd);

  if (!d.drifting && spd > 1) {
    const aligned = game.forward.clone().multiplyScalar(spd);
    aligned.y = d.velocity.y;
    d.velocity.lerp(aligned, 1 - Math.exp(-(d.boosting ? 1.1 : 2.2) * dt));
  }

  d.position.addScaledVector(d.velocity, dt);

  const ground = terrainHeight(d.position.x, d.position.z) + 1.15;
  if (d.position.y < ground) {
    d.position.y = ground;
    if (d.velocity.y < 0) d.velocity.y *= -0.15;
    d.velocity.x *= 0.72;
    d.velocity.z *= 0.72;
  }
  d.position.y = clamp(d.position.y, ground, 210);

  if (d.position.x < WORLD_MIN_X) {
    d.position.x = WORLD_MIN_X;
    d.velocity.x *= -0.3;
  }
  if (d.position.x > WORLD_MAX_X) {
    d.position.x = WORLD_MAX_X;
    d.velocity.x *= -0.3;
  }
  if (d.position.z < WORLD_MIN_Z) {
    d.position.z = WORLD_MIN_Z;
    d.velocity.z *= -0.3;
  }
  if (d.position.z > WORLD_MAX_Z) {
    d.position.z = WORLD_MAX_Z;
    d.velocity.z *= -0.3;
  }
}

function expDamp(cur: number, target: number, lambda: number, dt: number) {
  return cur + (target - cur) * (1 - Math.exp(-lambda * dt));
}

function dampRate(cur: number, target: number, lambda: number, dt: number) {
  return expDamp(cur, target, lambda, dt);
}
