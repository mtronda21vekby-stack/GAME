import { userStorage } from "./storage";

export type UserProfile = {
  nickname: string;
  status: string;
  avatarDataUrl: string; // "" если нет
  updatedAt: number;
};

const KEY = "profile.v1";
const MAX_AVATAR_BYTES = 420_000;

function clamp(s: string, n: number) {
  return (s || "").trim().slice(0, n);
}

function safeNick(raw: string) {
  const s = clamp(raw, 18).replace(/\s+/g, " ");
  return s.length ? s : "Игрок";
}

function safeStatus(raw: string) {
  return clamp(raw, 42);
}

export function getProfile(): UserProfile {
  const legacyNick = userStorage.getString("nickname", "");
  const raw = userStorage.getString(KEY, "");
  if (raw) {
    try {
      const p = JSON.parse(raw) as Partial<UserProfile>;
      const nickname = safeNick(p.nickname ?? legacyNick ?? "");
      const status = safeStatus(p.status ?? "");
      const avatarDataUrl = typeof p.avatarDataUrl === "string" ? p.avatarDataUrl : "";
      const updatedAt = typeof p.updatedAt === "number" ? p.updatedAt : Date.now();
      return { nickname, status, avatarDataUrl, updatedAt };
    } catch {}
  }
  const nickname = safeNick(legacyNick || "");
  return { nickname, status: "", avatarDataUrl: "", updatedAt: Date.now() };
}

export function setProfile(next: Partial<UserProfile>) {
  const prev = getProfile();
  const merged: UserProfile = {
    nickname: safeNick(next.nickname ?? prev.nickname),
    status: safeStatus(next.status ?? prev.status),
    avatarDataUrl: typeof next.avatarDataUrl === "string" ? next.avatarDataUrl : prev.avatarDataUrl,
    updatedAt: Date.now(),
  };

  // legacy compat
  userStorage.setString("nickname", merged.nickname);

  const json = JSON.stringify(merged);
  userStorage.setString(KEY, json);
  return merged;
}

export function clearAvatar() {
  return setProfile({ avatarDataUrl: "" });
}

export function clearProfile() {
  userStorage.setString(KEY, "");
  userStorage.setString("nickname", "");
}

export function validateAvatarDataUrl(dataUrl: string) {
  if (!dataUrl) return { ok: true as const };
  if (!dataUrl.startsWith("data:image/")) return { ok: false as const, reason: "Неверный формат изображения" };
  if (dataUrl.length > MAX_AVATAR_BYTES) return { ok: false as const, reason: "Файл слишком большой" };
  return { ok: true as const };
}
