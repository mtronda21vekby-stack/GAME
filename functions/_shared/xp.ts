// functions/_shared/xp.ts
export type UserStatus = "Bronze" | "Silver" | "Crown";

export function statusFromXp(xp: number): UserStatus {
  if (xp >= 5000) return "Crown";
  if (xp >= 1000) return "Silver";
  return "Bronze";
}

// XP к следующему уровню (пер-уровень), можно подстроить позже без миграций
export function nextLevelXp(level: number): number {
  const L = Math.max(1, Math.floor(level));
  return 100 + (L - 1) * 35; // 100, 135, 170, ...
}

// Суммарный XP, необходимый чтобы достичь level (level=1 => 0)
function totalXpToReachLevel(level: number): number {
  const L = Math.max(1, Math.floor(level));
  const n = L - 1;
  // сумма арифм прогрессии: n*100 + 35*n*(n-1)/2
  return n * 100 + (35 * n * (n - 1)) / 2;
}

export function levelFromXp(xp: number): number {
  const X = Math.max(0, Math.floor(xp));

  // быстрый безопасный поиск (уровни небольшие)
  let level = 1;
  while (true) {
    const next = totalXpToReachLevel(level + 1);
    if (X < next) return level;
    level += 1;
    if (level > 999) return 999;
  }
}

export function progressFromXp(xp: number) {
  const X = Math.max(0, Math.floor(xp));
  const level = levelFromXp(X);
  const base = totalXpToReachLevel(level);
  const need = nextLevelXp(level);
  const inLevel = X - base;
  const toNext = Math.max(0, need - inLevel);

  return {
    xp: X,
    level,
    status: statusFromXp(X),
    levelXp: inLevel,
    nextLevelNeed: need,
    toNext,
  };
}
