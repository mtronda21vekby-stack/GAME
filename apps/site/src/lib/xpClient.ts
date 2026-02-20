import { getOrCreateGuestId } from "./guest";
import type { XpEvent } from "@blackcrown/core";

type Progress = {
  xp: number;
  level: number;
  status: "Bronze" | "Silver" | "Crown";
  nextLevelXp: number;
};

const cooldownMap = new Map<string, number>();

function now() {
  return Date.now();
}

export async function sendXpEvent(e: XpEvent): Promise<Progress | null> {
  const gid = getOrCreateGuestId();

  // лёгкий клиентский антиспам (сервер всё равно решает окончательно)
  const key = `${e.type}:${e.key ?? ""}`;
  const t = cooldownMap.get(key) ?? 0;
  if (t > now()) return null;
  cooldownMap.set(key, now() + 1500);

  const res = await fetch("/api/user/xp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-bc-guest": gid,
      "accept": "application/json",
    },
    body: JSON.stringify({ event: e }),
    keepalive: true,
  });

  if (!res.ok) return null;
  return (await res.json()) as Progress;
}
