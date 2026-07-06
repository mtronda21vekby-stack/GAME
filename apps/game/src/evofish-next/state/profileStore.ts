import { defaultNextAccount, renameNextAccount } from "../content/account";
import { migrateLegacySkinSave, type EvoFishNextSkinSave } from "./skinSaveAdapter";
import { EVOFISH_NEXT_SAVE_EVENT, EVOFISH_NEXT_SAVE_KEY, loadEvoFishNextSave, saveEvoFishNextSave } from "./nextSaveStore";

export const EVOFISH_PROFILE_INDEX_KEY = "evofish_profile_index_v1";
export const EVOFISH_ACTIVE_PROFILE_KEY = "evofish_active_profile_v1";
export const EVOFISH_PROFILE_EVENT = "evofish_profile_changed";

export type EvoFishPlayerProfile = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastLevel: number;
  lastTier: number;
  lastPearls: number;
  lastCorals: number;
};

export type EvoFishProfileIndex = {
  schemaVersion: 1;
  activeProfileId: string;
  profiles: EvoFishPlayerProfile[];
};

function nowIso() {
  return new Date().toISOString();
}

function profileSaveKey(profileId: string) {
  return `${EVOFISH_NEXT_SAVE_KEY}__profile_${profileId}`;
}

function profileId() {
  return `profile_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function safeRead<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local profiles are optional in locked/private browser modes.
  }
}

function notifyProfileChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVOFISH_PROFILE_EVENT));
  window.dispatchEvent(new CustomEvent(EVOFISH_NEXT_SAVE_EVENT));
}

function profileFromSave(id: string, save: EvoFishNextSkinSave, fallbackName = "Игрок") : EvoFishPlayerProfile {
  const stamp = nowIso();
  return {
    id,
    name: save.account?.name || fallbackName,
    createdAt: stamp,
    updatedAt: stamp,
    lastLevel: Math.max(1, Math.floor(save.progress?.level || 1)),
    lastTier: Math.max(1, Math.floor(save.progress?.tier || 1)),
    lastPearls: Math.max(0, Math.floor(save.economy?.pearls || 0)),
    lastCorals: Math.max(0, Math.floor(save.economy?.corals || 0))
  };
}

function touchProfile(profile: EvoFishPlayerProfile, save: EvoFishNextSkinSave): EvoFishPlayerProfile {
  return {
    ...profile,
    name: save.account?.name || profile.name,
    updatedAt: nowIso(),
    lastLevel: Math.max(1, Math.floor(save.progress?.level || profile.lastLevel || 1)),
    lastTier: Math.max(1, Math.floor(save.progress?.tier || profile.lastTier || 1)),
    lastPearls: Math.max(0, Math.floor(save.economy?.pearls || 0)),
    lastCorals: Math.max(0, Math.floor(save.economy?.corals || 0))
  };
}

function defaultProfileIndex(): EvoFishProfileIndex {
  const save = loadEvoFishNextSave();
  const id = "default";
  safeWrite(profileSaveKey(id), save);
  try { localStorage.setItem(EVOFISH_ACTIVE_PROFILE_KEY, id); } catch {}
  const index: EvoFishProfileIndex = {
    schemaVersion: 1,
    activeProfileId: id,
    profiles: [profileFromSave(id, save, save.account?.name || "Игрок")]
  };
  safeWrite(EVOFISH_PROFILE_INDEX_KEY, index);
  return index;
}

function normalizeIndex(index: EvoFishProfileIndex | null): EvoFishProfileIndex {
  if (!index?.profiles?.length) return defaultProfileIndex();
  const profiles = index.profiles.filter((profile) => profile.id && profile.name).slice(0, 8);
  if (!profiles.length) return defaultProfileIndex();
  const active = profiles.some((profile) => profile.id === index.activeProfileId) ? index.activeProfileId : profiles[0].id;
  const next: EvoFishProfileIndex = { schemaVersion: 1, activeProfileId: active, profiles };
  safeWrite(EVOFISH_PROFILE_INDEX_KEY, next);
  try { localStorage.setItem(EVOFISH_ACTIVE_PROFILE_KEY, active); } catch {}
  return next;
}

export function loadEvoFishProfileIndex(): EvoFishProfileIndex {
  return normalizeIndex(safeRead<EvoFishProfileIndex>(EVOFISH_PROFILE_INDEX_KEY));
}

export function getActiveEvoFishProfile() {
  const index = loadEvoFishProfileIndex();
  return index.profiles.find((profile) => profile.id === index.activeProfileId) || index.profiles[0];
}

export function syncActiveEvoFishProfile() {
  const index = loadEvoFishProfileIndex();
  const active = index.profiles.find((profile) => profile.id === index.activeProfileId) || index.profiles[0];
  const save = loadEvoFishNextSave();
  safeWrite(profileSaveKey(active.id), save);
  const profiles = index.profiles.map((profile) => profile.id === active.id ? touchProfile(profile, save) : profile);
  const next = { ...index, profiles };
  safeWrite(EVOFISH_PROFILE_INDEX_KEY, next);
  return next;
}

function freshSaveForProfile(name: string, id: string): EvoFishNextSkinSave {
  const fallback = migrateLegacySkinSave(null);
  const account = renameNextAccount({ ...defaultNextAccount(), id }, name);
  return { ...fallback, account };
}

export function createEvoFishProfile(name: string) {
  const index = syncActiveEvoFishProfile();
  if (index.profiles.length >= 8) return index;
  const id = profileId();
  const save = freshSaveForProfile(name || `Игрок ${index.profiles.length + 1}`, id);
  safeWrite(profileSaveKey(id), save);
  saveEvoFishNextSave(save);
  const profile = profileFromSave(id, save, save.account.name);
  const next: EvoFishProfileIndex = { schemaVersion: 1, activeProfileId: id, profiles: [...index.profiles, profile] };
  safeWrite(EVOFISH_PROFILE_INDEX_KEY, next);
  try { localStorage.setItem(EVOFISH_ACTIVE_PROFILE_KEY, id); } catch {}
  notifyProfileChange();
  return next;
}

export function switchEvoFishProfile(profileId: string) {
  const index = syncActiveEvoFishProfile();
  const target = index.profiles.find((profile) => profile.id === profileId);
  if (!target) return index;
  const profileSave = safeRead<EvoFishNextSkinSave>(profileSaveKey(target.id)) || freshSaveForProfile(target.name, target.id);
  saveEvoFishNextSave(profileSave);
  const next: EvoFishProfileIndex = { ...index, activeProfileId: target.id };
  safeWrite(EVOFISH_PROFILE_INDEX_KEY, next);
  try { localStorage.setItem(EVOFISH_ACTIVE_PROFILE_KEY, target.id); } catch {}
  notifyProfileChange();
  return next;
}

export function renameEvoFishProfile(profileId: string, name: string) {
  const index = loadEvoFishProfileIndex();
  const profile = index.profiles.find((item) => item.id === profileId);
  if (!profile) return index;
  const save = safeRead<EvoFishNextSkinSave>(profileSaveKey(profileId)) || loadEvoFishNextSave();
  const nextSave = { ...save, account: renameNextAccount(save.account, name) };
  safeWrite(profileSaveKey(profileId), nextSave);
  if (index.activeProfileId === profileId) saveEvoFishNextSave(nextSave);
  const profiles = index.profiles.map((item) => item.id === profileId ? touchProfile({ ...item, name: nextSave.account.name }, nextSave) : item);
  const next = { ...index, profiles };
  safeWrite(EVOFISH_PROFILE_INDEX_KEY, next);
  notifyProfileChange();
  return next;
}

export function deleteEvoFishProfile(profileId: string) {
  const index = loadEvoFishProfileIndex();
  if (index.profiles.length <= 1) return index;
  const profiles = index.profiles.filter((profile) => profile.id !== profileId);
  if (profiles.length === index.profiles.length) return index;
  try { localStorage.removeItem(profileSaveKey(profileId)); } catch {}
  const nextActive = index.activeProfileId === profileId ? profiles[0].id : index.activeProfileId;
  const next: EvoFishProfileIndex = { schemaVersion: 1, activeProfileId: nextActive, profiles };
  safeWrite(EVOFISH_PROFILE_INDEX_KEY, next);
  try { localStorage.setItem(EVOFISH_ACTIVE_PROFILE_KEY, nextActive); } catch {}
  if (index.activeProfileId === profileId) switchEvoFishProfile(nextActive);
  notifyProfileChange();
  return next;
}
