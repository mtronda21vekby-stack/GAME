export type NextAccountState = {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  totalXp: number;
  runs: number;
  totalKills: number;
  bestMass: number;
  lastRunXp: number;
  lastRunKills: number;
  lastRunMass: number;
};

export function xpToNextAccountLevel(level: number) {
  return Math.round(260 * Math.pow(1.28, Math.max(0, level - 1)));
}

export function defaultNextAccount(): NextAccountState {
  return {
    id: "local-kqyln",
    name: "KQYLN",
    level: 1,
    xp: 0,
    xpToNext: xpToNextAccountLevel(1),
    totalXp: 0,
    runs: 0,
    totalKills: 0,
    bestMass: 1.2,
    lastRunXp: 0,
    lastRunKills: 0,
    lastRunMass: 1.2
  };
}

export function normalizeNextAccount(account: Partial<NextAccountState> | null | undefined): NextAccountState {
  const fallback = defaultNextAccount();
  const level = Math.max(1, Math.floor(account?.level || fallback.level));
  const xpToNext = Math.max(1, Math.floor(account?.xpToNext || xpToNextAccountLevel(level)));

  return {
    id: String(account?.id || fallback.id),
    name: String(account?.name || fallback.name).slice(0, 18),
    level,
    xp: Math.max(0, Math.floor(account?.xp || 0)),
    xpToNext,
    totalXp: Math.max(0, Math.floor(account?.totalXp || 0)),
    runs: Math.max(0, Math.floor(account?.runs || 0)),
    totalKills: Math.max(0, Math.floor(account?.totalKills || 0)),
    bestMass: Math.max(1.2, Number(account?.bestMass || fallback.bestMass)),
    lastRunXp: Math.max(0, Math.floor(account?.lastRunXp || 0)),
    lastRunKills: Math.max(0, Math.floor(account?.lastRunKills || 0)),
    lastRunMass: Math.max(1.2, Number(account?.lastRunMass || fallback.lastRunMass))
  };
}

export function calculateRunAccountXp(input: { kills: number; mass: number; level: number; tier: number; zoneRisk?: number }) {
  const killXp = Math.max(0, Math.floor(input.kills || 0)) * 18;
  const massXp = Math.max(0, Math.floor(Math.max(1, input.mass || 1) * 16));
  const progressXp = Math.max(0, Math.floor(input.level || 1) - 1) * 9 + Math.max(0, Math.floor(input.tier || 1) - 1) * 11;
  const riskXp = Math.max(0, Math.floor(input.zoneRisk || 0)) * 8;
  return Math.max(25, killXp + massXp + progressXp + riskXp);
}

export function awardNextAccountRun(account: NextAccountState, run: { xp: number; kills: number; mass: number }): NextAccountState {
  const next = normalizeNextAccount(account);
  let xp = next.xp + Math.max(0, Math.floor(run.xp));
  let level = next.level;
  let xpToNext = next.xpToNext;

  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    xpToNext = xpToNextAccountLevel(level);
  }

  return {
    ...next,
    level,
    xp,
    xpToNext,
    totalXp: next.totalXp + Math.max(0, Math.floor(run.xp)),
    runs: next.runs + 1,
    totalKills: next.totalKills + Math.max(0, Math.floor(run.kills)),
    bestMass: Math.max(next.bestMass, Number(run.mass || 1.2)),
    lastRunXp: Math.max(0, Math.floor(run.xp)),
    lastRunKills: Math.max(0, Math.floor(run.kills)),
    lastRunMass: Math.max(1.2, Number(run.mass || 1.2))
  };
}
