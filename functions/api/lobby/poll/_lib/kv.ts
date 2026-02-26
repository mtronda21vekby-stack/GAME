// functions/api/lobby/poll/_lib/kv.ts
import { getMetricsKV } from "../../_lib/auth";

export function safeRoom(raw: string): string {
  const r = String(raw || "main").trim();
  return r.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "main";
}

export function safeId(raw: string): string {
  const s = String(raw || "").trim();
  const v = s.replace(/[^a-zA-Z0-9_\-:.]/g, "").slice(0, 96);
  return v || "";
}

export function safeName(raw: string): string {
  const s = String(raw || "").trim().replace(/\s+/g, " ");
  return (s || "Игрок").slice(0, 18);
}

export function safeText(raw: string): string {
  const s = String(raw || "").trim().replace(/\s+/g, " ");
  return s.slice(0, 180);
}

export type Player = { id: string; name: string; ready: boolean; joinedAt: number; lastSeen: number };
export type ChatItem = { id: string; at: number; fromName: string; text: string };

export function keys(room: string) {
  const r = safeRoom(room);
  return {
    pfxPlayers: `lobby:v1:${r}:p:`,
    keyChat: `lobby:v1:${r}:chat`,
  };
}

export async function listPlayers(env: any, room: string): Promise<Player[]> {
  const kv = getMetricsKV(env);
  if (!kv) return [];

  const { pfxPlayers } = keys(room);
  const listed = await kv.list({ prefix: pfxPlayers, limit: 32 });

  const now = Date.now();
  const out: Player[] = [];

  for (const k of listed.keys) {
    const v = await kv.get(k.name, "json");
    const p = v as Player | null;
    if (!p?.id) continue;
    // remove dead (TTL should do it, but keep safe)
    if (now - (p.lastSeen || 0) > 90_000) continue;
    out.push(p);
  }

  out.sort((a, b) => {
    if (a.ready !== b.ready) return a.ready ? -1 : 1;
    return (a.joinedAt || 0) - (b.joinedAt || 0);
  });

  return out.slice(0, 8);
}

export async function upsertPlayer(env: any, room: string, p: Player) {
  const kv = getMetricsKV(env);
  if (!kv) return false;

  const { pfxPlayers } = keys(room);
  const key = `${pfxPlayers}${p.id}`;
  // keep presence alive (seconds)
  await kv.put(key, JSON.stringify(p), { expirationTtl: 75 });
  return true;
}

export async function getChat(env: any, room: string): Promise<ChatItem[]> {
  const kv = getMetricsKV(env);
  if (!kv) return [];
  const { keyChat } = keys(room);
  const items = (await kv.get(keyChat, "json")) as ChatItem[] | null;
  if (!Array.isArray(items)) return [];
  return items.slice(-60);
}

export async function addChat(env: any, room: string, item: ChatItem) {
  const kv = getMetricsKV(env);
  if (!kv) return false;

  const { keyChat } = keys(room);
  const prev = (await kv.get(keyChat, "json")) as ChatItem[] | null;
  const arr = Array.isArray(prev) ? prev.slice(-60) : [];
  arr.push(item);
  const next = arr.slice(-60);

  await kv.put(keyChat, JSON.stringify(next), { expirationTtl: 60 * 60 * 24 }); // 24h history
  return true;
}
