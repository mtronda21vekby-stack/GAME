import { userStorage } from "./storage";

export type FeatureFlags = Record<string, boolean>;

const KEY = "featureFlags";

export function getFlags(): FeatureFlags {
  return userStorage.getJSON<FeatureFlags>(KEY, {
    fpsCounter: false,
    experimentalMotion: true
  });
}

export function setFlag(name: string, value: boolean) {
  const flags = getFlags();
  flags[name] = value;
  userStorage.setJSON(KEY, flags);
}

export function isEnabled(name: string): boolean {
  return !!getFlags()[name];
}
