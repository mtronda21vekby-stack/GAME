import { clamp } from "../../experience/core/math";
import type { QualityTier, SceneLightingProfile } from "../../experience/types";
import type { SceneLifecycleSnapshot } from "./SceneLifecycle";
import type { ExperienceSceneId } from "../experienceShellConfig";

export const SCENE_LIGHTING_PROFILES: Readonly<Record<ExperienceSceneId, Readonly<SceneLightingProfile>>> = {
  "crown-chamber": {
    exposure: 1.02, background: 0x010305, fogColor: 0x02070a, fogDensity: 0.032,
    keyColor: 0xd6f5f2, keyIntensity: 2.8, rimColor: 0x43e6f2, rimIntensity: 3.8,
    fillColor: 0x8ba0aa, fillIntensity: 0.72, coreColor: 0x63eff5, coreIntensity: 3.2, bloomStrength: 0.18,
  },
  "world-gate": {
    exposure: 0.9, background: 0x010409, fogColor: 0x06101c, fogDensity: 0.047,
    keyColor: 0xa8d9e3, keyIntensity: 1.7, rimColor: 0x62dcec, rimIntensity: 3.2,
    fillColor: 0x545a78, fillIntensity: 0.42, coreColor: 0x7d6ee7, coreIntensity: 2.7, bloomStrength: 0.14,
  },
  "evofish-abyss": {
    exposure: 0.86, background: 0x00121b, fogColor: 0x022735, fogDensity: 0.071,
    keyColor: 0x7ddde7, keyIntensity: 1.45, rimColor: 0x279bb7, rimIntensity: 2.2,
    fillColor: 0x24647a, fillIntensity: 0.5, coreColor: 0x4fc8d8, coreIntensity: 1.6, bloomStrength: 0.08,
  },
  "crown-front-reactor": {
    exposure: 0.91, background: 0x090302, fogColor: 0x170704, fogDensity: 0.052,
    keyColor: 0xd9c4b6, keyIntensity: 2.0, rimColor: 0x56cbd8, rimIntensity: 1.45,
    fillColor: 0x78685e, fillIntensity: 0.46, coreColor: 0xff6f2f, coreIntensity: 4.4, bloomStrength: 0.12,
  },
  "network-core": {
    exposure: 0.94, background: 0x01070b, fogColor: 0x04151d, fogDensity: 0.033,
    keyColor: 0xbde9ec, keyIntensity: 1.95, rimColor: 0x55e1ec, rimIntensity: 2.8,
    fillColor: 0x556d7a, fillIntensity: 0.5, coreColor: 0x77e8ee, coreIntensity: 2.6, bloomStrength: 0.1,
  },
  "collection-vault": {
    exposure: 0.98, background: 0x020609, fogColor: 0x07131a, fogDensity: 0.029,
    keyColor: 0xe0f0ea, keyIntensity: 2.35, rimColor: 0x7bdddf, rimIntensity: 2.4,
    fillColor: 0x65727a, fillIntensity: 0.58, coreColor: 0x9b8ce8, coreIntensity: 2.0, bloomStrength: 0.08,
  },
  identity: {
    exposure: 1.0, background: 0x010306, fogColor: 0x050b10, fogDensity: 0.031,
    keyColor: 0xe0f7f4, keyIntensity: 2.5, rimColor: 0x65ecf3, rimIntensity: 3.1,
    fillColor: 0x71858f, fillIntensity: 0.64, coreColor: 0x9cf5f5, coreIntensity: 3.25, bloomStrength: 0.14,
  },
};

export const OCEAN_TO_VAULT_NEUTRAL_PROFILE: Readonly<SceneLightingProfile> = {
  exposure: 0.89,
  background: 0x03080b,
  fogColor: 0x0a1519,
  fogDensity: 0.059,
  keyColor: 0xe4efef,
  keyIntensity: 1.72,
  rimColor: 0xa8dfe2,
  rimIntensity: 1.78,
  fillColor: 0x66767b,
  fillIntensity: 0.48,
  coreColor: 0xeaf5f2,
  coreIntensity: 2.35,
  bloomStrength: 0.09,
};

const COLOR_KEYS = ["background", "fogColor", "keyColor", "rimColor", "fillColor", "coreColor"] as const;
const NUMBER_KEYS = ["exposure", "fogDensity", "keyIntensity", "rimIntensity", "fillIntensity", "coreIntensity", "bloomStrength"] as const;

function lerpColor(from: number, to: number, amount: number) {
  const fromR = (from >> 16) & 255;
  const fromG = (from >> 8) & 255;
  const fromB = from & 255;
  const toR = (to >> 16) & 255;
  const toG = (to >> 8) & 255;
  const toB = to & 255;
  const channel = (left: number, right: number) => Math.round(left + (right - left) * amount);
  return (channel(fromR, toR) << 16) | (channel(fromG, toG) << 8) | channel(fromB, toB);
}

export function interpolateLightingProfiles(
  from: Readonly<SceneLightingProfile>,
  to: Readonly<SceneLightingProfile>,
  amount: number,
  target: SceneLightingProfile = { ...from },
) {
  const normalized = clamp(amount);
  for (const key of COLOR_KEYS) target[key] = lerpColor(from[key], to[key], normalized);
  for (const key of NUMBER_KEYS) target[key] = from[key] + (to[key] - from[key]) * normalized;
  target.exposure = Math.min(1.06, Math.max(0.78, target.exposure));
  target.fogDensity = Math.min(0.085, Math.max(0.018, target.fogDensity));
  target.bloomStrength = Math.min(0.2, Math.max(0, target.bloomStrength));
  return target;
}

export function resolveSceneLightingProfile(
  lifecycle: SceneLifecycleSnapshot,
  quality: QualityTier,
  reducedMotion: boolean,
  target?: SceneLightingProfile,
) {
  const transition = lifecycle.transition;
  const profile = transition
    ? transition.id === "ocean-to-reactor"
      ? transition.amount <= 0.5
        ? interpolateLightingProfiles(
          SCENE_LIGHTING_PROFILES[transition.from],
          OCEAN_TO_VAULT_NEUTRAL_PROFILE,
          transition.amount * 2,
          target,
        )
        : interpolateLightingProfiles(
          OCEAN_TO_VAULT_NEUTRAL_PROFILE,
          SCENE_LIGHTING_PROFILES[transition.to],
          (transition.amount - 0.5) * 2,
          target,
        )
      : interpolateLightingProfiles(
        SCENE_LIGHTING_PROFILES[transition.from],
        SCENE_LIGHTING_PROFILES[transition.to],
        transition.amount,
        target,
      )
    : interpolateLightingProfiles(
      SCENE_LIGHTING_PROFILES[lifecycle.primary],
      SCENE_LIGHTING_PROFILES[lifecycle.primary],
      0,
      target,
    );
  if (quality === "low") profile.bloomStrength = 0;
  else if (quality === "medium") profile.bloomStrength *= 0.35;
  if (reducedMotion) profile.bloomStrength = 0;
  return profile;
}
