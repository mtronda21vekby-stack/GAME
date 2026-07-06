import { defaultNextAccount, renameNextAccount } from "../content/account";
import { migrateLegacySkinSave, type EvoFishNextSkinSave } from "./skinSaveAdapter";
import { EVOFISH_NEXT_SAVE_EVENT, EVOFISH_NEXT_SAVE_KEY, loadEvoFishNextSave, saveEvoFishNextSave } from "./nextSaveStore";

export const EVOFISH_PROFILE_INDEX_KEY = "evofish_profile_index_v1";
export const EVOFISH_ACTIVE_PROFILE_KEY = "evofish_next_active_profile_v1";
export const EVOFISH_PROFILE_EVENT = "evofish_profile_changed";

export type EvoFishPlayerProfile = { id: string; name: string; createdAt: string; updatedAt: string; lastLevel: number; lastTier: number; lastPearls: number; lastCorals: number };
export type EvoFishProfileIndex = { schemaVersion: 1; activeProfileId: string; profiles: EvoFishPlayerProfile[] };

const stamp = () => new Date().toISOString();
const keyFor = (id: string) => `${EVOFISH_NEXT_SAVE_KEY}__profile_${id}`;
const makeId = () => `profile_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

function read<T>(key: string): T | null { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : null; } catch { return null; } }
function write(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function active(id: string) { try { localStorage.setItem(EVOFISH_ACTIVE_PROFILE_KEY, id); } catch {} }
function notify() { if (typeof window === "undefined") return; window.dispatchEvent(new CustomEvent(EVOFISH_PROFILE_EVENT)); window.dispatchEvent(new CustomEvent(EVOFISH_NEXT_SAVE_EVENT)); }

function fromSave(id: string, save: EvoFishNextSkinSave): EvoFishPlayerProfile {
  const createdAt = stamp();
  return { id, name: save.account?.name || "Игрок", createdAt, updatedAt: createdAt, lastLevel: Math.max(1, Math.floor(save.progress?.level || 1)), lastTier: Math.max(1, Math.floor(save.progress?.tier || 1)), lastPearls: Math.max(0, Math.floor(save.economy?.pearls || 0)), lastCorals: Math.max(0, Math.floor(save.economy?.corals || 0)) };
}

function touch(profile: EvoFishPlayerProfile, save: EvoFishNextSkinSave): EvoFishPlayerProfile {
  return { ...profile, name: save.account?.name || profile.name, updatedAt: stamp(), lastLevel: Math.max(1, Math.floor(save.progress?.level || profile.lastLevel || 1)), lastTier: Math.max(1, Math.floor(save.progress?.tier || profile.lastTier || 1)), lastPearls: Math.max(0, Math.floor(save.economy?.pearls || 0)), lastCorals: Math.max(0, Math.floor(save.economy?.corals || 0)) };
}

function fresh(name: string, id: string): EvoFishNextSkinSave {
  const save = migrateLegacySkinSave(null);
  return { ...save, account: renameNextAccount({ ...defaultNextAccount(), id }, name) };
}

function firstIndex(): EvoFishProfileIndex {
  const save = loadEvoFishNextSave();
  const id = "default";
  write(keyFor(id), save);
  active(id);
  const index = { schemaVersion: 1 as const, activeProfileId: id, profiles: [fromSave(id, save)] };
  write(EVOFISH_PROFILE_INDEX_KEY, index);
  return index;
}

export function loadEvoFishProfileIndex(): EvoFishProfileIndex {
  const raw = read<EvoFishProfileIndex>(EVOFISH_PROFILE_INDEX_KEY);
  if (!raw?.profiles?.length) return firstIndex();
  const profiles = raw.profiles.filter((profile) => profile.id && profile.name).slice(0, 8);
  if (!profiles.length) return firstIndex();
  const activeProfileId = profiles.some((profile) => profile.id === raw.activeProfileId) ? raw.activeProfileId : profiles[0].id;
  const index = { schemaVersion: 1 as const, activeProfileId, profiles };
  write(EVOFISH_PROFILE_INDEX_KEY, index);
  active(activeProfileId);
  return index;
}

export function syncActiveEvoFishProfile() {
  const index = loadEvoFishProfileIndex();
  const current = index.profiles.find((profile) => profile.id === index.activeProfileId) || index.profiles[0];
  const save = loadEvoFishNextSave();
  write(keyFor(current.id), save);
  const next = { ...index, profiles: index.profiles.map((profile) => profile.id === current.id ? touch(profile, save) : profile) };
  write(EVOFISH_PROFILE_INDEX_KEY, next);
  active(current.id);
  return next;
}

export function createEvoFishProfile(name: string) {
  const index = syncActiveEvoFishProfile();
  if (index.profiles.length >= 8) return index;
  const id = makeId();
  const save = fresh(name || `Игрок ${index.profiles.length + 1}`, id);
  write(keyFor(id), save);
  saveEvoFishNextSave(save);
  const next = { schemaVersion: 1 as const, activeProfileId: id, profiles: [...index.profiles, fromSave(id, save)] };
  write(EVOFISH_PROFILE_INDEX_KEY, next);
  active(id);
  notify();
  return next;
}

export function switchEvoFishProfile(id: string) {
  const index = syncActiveEvoFishProfile();
  const target = index.profiles.find((profile) => profile.id === id);
  if (!target) return index;
  const save = read<EvoFishNextSkinSave>(keyFor(id)) || fresh(target.name, id);
  saveEvoFishNextSave(save);
  const next = { ...index, activeProfileId: id };
  write(EVOFISH_PROFILE_INDEX_KEY, next);
  active(id);
  notify();
  return next;
}

export function renameEvoFishProfile(id: string, name: string) {
  const index = loadEvoFishProfileIndex();
  const profile = index.profiles.find((item) => item.id === id);
  if (!profile) return index;
  const save = read<EvoFishNextSkinSave>(keyFor(id)) || loadEvoFishNextSave();
  const nextSave = { ...save, account: renameNextAccount(save.account, name) };
  write(keyFor(id), nextSave);
  if (index.activeProfileId === id) saveEvoFishNextSave(nextSave);
  const next = { ...index, profiles: index.profiles.map((item) => item.id === id ? touch({ ...item, name: nextSave.account.name }, nextSave) : item) };
  write(EVOFISH_PROFILE_INDEX_KEY, next);
  notify();
  return next;
}

export function deleteEvoFishProfile(id: string) {
  const index = loadEvoFishProfileIndex();
  if (index.profiles.length <= 1) return index;
  const profiles = index.profiles.filter((profile) => profile.id !== id);
  if (profiles.length === index.profiles.length) return index;
  try { localStorage.removeItem(keyFor(id)); } catch {}
  const activeProfileId = index.activeProfileId === id ? profiles[0].id : index.activeProfileId;
  const next = { schemaVersion: 1 as const, activeProfileId, profiles };
  write(EVOFISH_PROFILE_INDEX_KEY, next);
  active(activeProfileId);
  if (index.activeProfileId === id) switchEvoFishProfile(activeProfileId);
  notify();
  return next;
}
