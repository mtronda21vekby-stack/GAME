export type UserStatus = "Bronze" | "Silver" | "Crown";

export function levelFromXp(xp: number): number {
  // плавный рост без таблиц
  // lvl 1 ~ 0-99, lvl 10 ~ 900-1100, дальше медленнее
  const v = Math.max(0, xp);
  return Math.max(1, Math.floor(Math.sqrt(v / 120)) + 1);
}

export function statusFromXp(xp: number): UserStatus {
  if (xp >= 5000) return "Crown";
  if (xp >= 1200) return "Silver";
  return "Bronze";
}

export function nextLevelXp(level: number): number {
  const l = Math.max(1, level);
  // обратная к levelFromXp
  return Math.floor(((l - 1) ** 2) * 120);
}
