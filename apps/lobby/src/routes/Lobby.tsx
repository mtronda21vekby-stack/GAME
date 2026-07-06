// apps/lobby/src/routes/Lobby.tsx
import React from "react";
import { Button } from "@blackcrown/ui";
import { userStorage } from "@blackcrown/core";

function nav(path: string) {
  window.location.assign(path);
}

function getNick() {
  return userStorage.getString("nickname", "") || "Игрок";
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function clampText(s: string, max = 180) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) : t;
}

function safeId() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyCrypto = crypto as any;
    if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  } catch {}
  return `bc_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function getClientId(): string {
  try {
    const k = "bc.lobby.clientId.v1";
    const ex = localStorage.getItem(k);
    if (ex) return ex;
    const id = safeId();
    localStorage.setItem(k, id);
    return id;
  } catch {
    return safeId();
  }
}

type LobbyStatus = "connecting" | "online" | "offline";
type NetMode = "ws" | "poll";
type HubMode = "next" | "classic";

type Player = {
  id: string;
  name: string;
  ready: boolean;
  joinedAt?: number;
  lastSeen?: number;
};

type ChatMsg = {
  id: string;
  from: string;
  text: string;
  t: number;
  local?: boolean;
};

type WsServerHello = {
  t: "hello";
  room: string;
  clientId: string;
  serverTime: number;
  seq: number;
  match?: any;
  you?: Player;
  players?: Player[];
  history?: { id: string; at: number; fromId: string; fromName: string; text: string }[];
};

type WsServerPlayers = {
  t: "players";
  seq: number;
  serverTime: number;
  match?: any;
  players: Player[];
};

type WsServerChat = {
  t: "chat";
  seq: number;
  serverTime: number;
  msg: { id: string; at: number; fromId: string; fromName: string; text: string };
};

type WsServerMatch = { t: "match"; seq: number; serverTime: number; match: any };
type WsServerStart = { t: "start"; seq: number; serverTime: number; matchId: string; seed: number; players: Player[] };
type WsServerError = { t: "error"; code: string; message: string };

type WsServerAny = WsServerHello | WsServerPlayers | WsServerChat | WsServerMatch | WsServerStart | WsServerError | any;

type WsClientJoin = { t: "join"; clientId?: string; name: string };
type WsClientReady = { t: "ready"; ready: boolean };
type WsClientChat = { t: "chat"; text: string; clientMsgId?: string };
type WsClientPing = { t: "ping"; at: number };

type PollStateResp = {
  ok: boolean;
  room: string;
  serverTime: number;
  players: Player[];
};

type PollChatResp = {
  ok: boolean;
  room: string;
  serverTime: number;
  items: { id: string; at: number; fromName: string; text: string }[];
};

type HubProfile = {
  nickname: string;
  level: number;
  xp: number;
  xpToNext: number;
  gems: number;
  coins: number;
  pearls: number;
  corals: number;
};

type NavItem = {
  label: string;
  path: string;
  icon: string;
  notify?: boolean;
};

const SIDE_NAV_ITEMS: NavItem[] = [
  { label: "Магазин", path: "/game/skins", icon: "◇" },
  { label: "Инвентарь", path: "/game/progress", icon: "▣" },
  { label: "Квесты", path: "/game/progress", icon: "✦", notify: true },
  { label: "События", path: "/game/season", icon: "◎" },
  { label: "Крафт", path: "/game/play", icon: "⬡" },
];

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Сообщество", path: "/", icon: "◌" },
  { label: "Лобби", path: "/lobby", icon: "◎" },
  { label: "PvP", path: "/game/?mode=next", icon: "◇" },
  { label: "Достижения", path: "/game/progress", icon: "✦" },
  { label: "Профиль", path: "/game/account", icon: "◉" },
];

function readNumber(value: unknown, fallback = 0) {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(n) ? n : fallback;
}

function readText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readHubProfile(fallbackNick: string): HubProfile {
  const base: HubProfile = {
    nickname: fallbackNick,
    level: 1,
    xp: 0,
    xpToNext: 260,
    gems: 0,
    coins: 0,
    pearls: 0,
    corals: 0,
  };

  try {
    const raw = localStorage.getItem("evofish_next_save_v1");
    if (!raw) return base;

    const save = readRecord(JSON.parse(raw));
    const account = readRecord(save.account ?? save.profile);
    const progress = readRecord(save.progress);
    const economy = readRecord(save.economy);

    return {
      nickname: readText(account.nickname ?? account.name ?? save.nickname ?? save.name, base.nickname),
      level: Math.max(1, Math.floor(readNumber(account.level ?? progress.level, base.level))),
      xp: Math.max(0, Math.floor(readNumber(account.xp ?? progress.xp ?? progress.tierXp, base.xp))),
      xpToNext: Math.max(1, Math.floor(readNumber(account.xpToNext ?? progress.xpToNext ?? progress.tierXpToNext, base.xpToNext))),
      gems: Math.max(0, Math.floor(readNumber(economy.gems ?? save.gems, base.gems))),
      coins: Math.max(0, Math.floor(readNumber(economy.coins ?? save.coins, base.coins))),
      pearls: Math.max(0, Math.floor(readNumber(economy.pearls ?? save.pearls, base.pearls))),
      corals: Math.max(0, Math.floor(readNumber(economy.corals ?? save.corals, base.corals))),
    };
  } catch {
    return base;
  }
}

function progressPercent(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

function launchPath(mode: HubMode) {
  return `/game/?mode=${mode}`;
}

function uniqChat(items: ChatMsg[], limit = 80) {
  const seen = new Set<string>();
  const out: ChatMsg[] = [];
  for (const it of items) {
    if (!it?.id) continue;
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  if (out.length > limit) return out.slice(out.length - limit);
  return out;
}

function wsUrl(roomId: string) {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  const base = `${proto}//${location.host}`;
  return `${base}/api/lobby/ws?room=${encodeURIComponent(roomId)}`;
}

/* ---------- POLL API ---------- */

async function pollHeartbeat(payload: { room: string; clientId: string; name: string; ready: boolean }) {
  try {
    const res = await fetch("/api/lobby/poll/heartbeat", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
      cache: "no-store",
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function pollState(room: string): Promise<PollStateResp | null> {
  try {
    const res = await fetch(`/api/lobby/poll/state?room=${encodeURIComponent(room)}`, {
      method: "GET",
      headers: { accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as PollStateResp;
    if (!json?.ok) return null;
    return json;
  } catch {
    return null;
  }
}

async function pollChat(room: string): Promise<PollChatResp | null> {
  try {
    const res = await fetch(`/api/lobby/poll/chat?room=${encodeURIComponent(room)}`, {
      method: "GET",
      headers: { accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as PollChatResp;
    if (!json?.ok) return null;
    return json;
  } catch {
    return null;
  }
}

async function pollSendChat(payload: { room: string; clientId: string; name: string; text: string }) {
  try {
    const res = await fetch("/api/lobby/poll/chat/send", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
      cache: "no-store",
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function Lobby() {
  const [room] = React.useState("main");

  const [status, setStatus] = React.useState<LobbyStatus>("connecting");
  const [mode, setMode] = React.useState<NetMode>("ws");

  const [players, setPlayers] = React.useState<Player[]>([]);
  const [history, setHistory] = React.useState<ChatMsg[]>([]);
  const [ready, setReady] = React.useState(false);
  const [text, setText] = React.useState("");
  const [selectedMode, setSelectedMode] = React.useState<HubMode>("next");

  const [matchLabel, setMatchLabel] = React.useState<"ожидание" | "старт" | "запущен">("ожидание");

  const listRef = React.useRef<HTMLDivElement | null>(null);

  const wsRef = React.useRef<WebSocket | null>(null);
  const aliveRef = React.useRef(true);
  const joinSentRef = React.useRef(false);
  const reconnectTimerRef = React.useRef<number | null>(null);
  const attemptRef = React.useRef(0);

  const myNickRef = React.useRef(getNick());
  const clientIdRef = React.useRef<string>(getClientId());
  const desiredReadyRef = React.useRef(false);
  const profile = React.useMemo(() => readHubProfile(myNickRef.current), []);

  const ClickFix = (
    <style>{`
      /* make lobby UI top-most and always clickable */
      .bcSiteRoot {
        --bg-deep: #020915;
        --bg-navy: #061827;
        --cyan: #35d8ff;
        --cyan-soft: rgba(53,216,255,.35);
        --panel: rgba(5,18,32,.72);
        --panel-strong: rgba(7,27,45,.86);
        --panel-border: rgba(88,210,255,.25);
        --text: #eaf7ff;
        --muted: rgba(234,247,255,.62);
        --gold: #f5b84b;
        min-height: 100vh;
        min-height: 100svh;
        position: relative;
        isolation: isolate;
        overflow-x: hidden;
        background:
          linear-gradient(180deg, rgba(2,9,21,.08), rgba(2,9,21,.72) 52%, #020915 100%),
          url("/assets/lobby/lobby-bg-station-16x9.png"),
          radial-gradient(ellipse at 50% 8%, rgba(53,216,255,.24), transparent 36%),
          linear-gradient(180deg, #061827 0%, #020915 100%);
        background-size: cover, cover, cover, cover;
        background-position: center top, center center, center, center;
        color: var(--text);
      }

      .bcSiteRoot:before {
        content: "";
        position: fixed;
        inset: 0;
        z-index: -3;
        pointer-events: none;
        background:
          radial-gradient(ellipse at 50% 18%, rgba(53,216,255,.26), transparent 38%),
          radial-gradient(ellipse at 18% 88%, rgba(245,184,75,.14), transparent 30%),
          radial-gradient(ellipse at 86% 78%, rgba(84,255,215,.11), transparent 32%),
          linear-gradient(180deg, rgba(2,9,21,.18), rgba(2,9,21,.82));
      }

      .bcSiteRoot:after {
        content: "";
        position: fixed;
        inset: 0;
        z-index: -2;
        opacity: .26;
        pointer-events: none;
        background-image:
          radial-gradient(circle at 18% 24%, rgba(220,250,255,.50) 0 1px, transparent 2px),
          radial-gradient(circle at 80% 26%, rgba(120,240,255,.38) 0 1px, transparent 2px),
          radial-gradient(circle at 62% 82%, rgba(255,255,255,.30) 0 1px, transparent 2px);
        background-size: 280px 240px, 340px 300px, 300px 280px;
        animation: hubParticles 18s linear infinite;
      }

      .bcLobbyUiLayer {
        position: relative;
        z-index: 2147483647;
        pointer-events: auto;
        min-height: 100vh;
        min-height: 100svh;
      }

      .bcLobbyUiLayer * {
        box-sizing: border-box;
        pointer-events: auto;
      }

      .hubMist {
        position: fixed;
        inset: auto -12% -22% -12%;
        height: 48%;
        z-index: -1;
        pointer-events: none;
        background:
          radial-gradient(ellipse at 50% 30%, rgba(53,216,255,.18), transparent 58%),
          linear-gradient(180deg, transparent, rgba(3,16,30,.76));
        filter: blur(18px);
      }

      .hubDrops {
        position: fixed;
        inset: 0;
        z-index: -1;
        pointer-events: none;
        opacity: .34;
        background-image:
          radial-gradient(circle at 12% 18%, rgba(179,239,255,.34) 0 2px, transparent 3px),
          radial-gradient(circle at 84% 32%, rgba(179,239,255,.28) 0 1px, transparent 2px),
          radial-gradient(circle at 76% 70%, rgba(179,239,255,.24) 0 2px, transparent 3px),
          radial-gradient(circle at 28% 82%, rgba(179,239,255,.22) 0 1px, transparent 2px);
        background-size: 420px 560px, 360px 420px, 520px 500px, 300px 360px;
        animation: hubDrops 24s ease-in-out infinite;
      }

      .bcHub {
        width: min(1460px, 100%);
        min-height: 100vh;
        min-height: 100svh;
        margin: 0 auto;
        padding: clamp(12px, 2vw, 26px);
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: clamp(12px, 2vw, 20px);
      }

      .hubTop {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-width: 0;
      }

      .hubPanel,
      .hubModeCard,
      .hubHero,
      .hubProfilePanel,
      .hubCurrencyBar,
      .hubSideNav,
      .hubBottomNav {
        border: 1px solid var(--panel-border);
        border-radius: 8px;
        background: linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.025)), var(--panel);
        box-shadow: 0 18px 60px rgba(0,0,0,.32);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }

      .hubProfilePanel {
        min-width: 260px;
        display: grid;
        grid-template-columns: 48px minmax(0, 1fr);
        gap: 12px;
        align-items: center;
        padding: 10px;
      }

      .hubAvatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #031524;
        font-weight: 950;
        letter-spacing: 0;
        background: radial-gradient(circle at 35% 30%, #ffffff 0 10%, #87f2ff 32%, #35d8ff 62%, #08749b 100%);
        box-shadow: 0 0 28px rgba(53,216,255,.35);
      }

      .hubProfileText {
        min-width: 0;
        display: grid;
        gap: 5px;
      }

      .hubProfileName {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 15px;
        font-weight: 950;
      }

      .hubProfileMeta,
      .hubTiny {
        color: var(--muted);
        font-size: 12px;
        font-weight: 850;
      }

      .hubProgress {
        height: 6px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(234,247,255,.12);
      }

      .hubProgress > span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--cyan), #78ffd8);
        box-shadow: 0 0 18px rgba(53,216,255,.42);
      }

      .hubCurrencyBar {
        flex: 1 1 420px;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 8px;
        min-width: 0;
      }

      .hubCurrency {
        min-width: 92px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 9px 10px;
        border-radius: 8px;
        background: rgba(2,9,21,.38);
        border: 1px solid rgba(234,247,255,.10);
      }

      .hubCurrency i {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--cyan);
        box-shadow: 0 0 18px var(--cyan-soft);
      }

      .hubCurrency.isGold i { background: var(--gold); box-shadow: 0 0 18px rgba(245,184,75,.34); }
      .hubCurrency.isPearl i { background: #d9f8ff; box-shadow: 0 0 18px rgba(217,248,255,.34); }
      .hubCurrency.isCoral i { background: #ff6f8f; box-shadow: 0 0 18px rgba(255,111,143,.34); }

      .hubCurrency strong {
        display: block;
        font-size: 14px;
        line-height: 1;
      }

      .hubCurrency span {
        display: block;
        margin-top: 2px;
        color: var(--muted);
        font-size: 10px;
        font-weight: 850;
      }

      .hubSettings {
        width: 48px;
        height: 48px;
        border: 1px solid var(--panel-border);
        border-radius: 50%;
        color: var(--text);
        background: rgba(5,18,32,.78);
        font-size: 22px;
        font-weight: 950;
        cursor: pointer;
        transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
      }

      .hubSettings:hover {
        border-color: rgba(101,232,255,.62);
        background: rgba(53,216,255,.12);
        box-shadow: 0 0 26px rgba(53,216,255,.18);
        transform: translateY(-1px) scale(1.03);
      }

      .hubSettings:active {
        transform: scale(.96);
      }

      .hubShell {
        min-width: 0;
        display: grid;
        grid-template-columns: minmax(82px, 118px) minmax(0, 1fr) minmax(284px, 350px);
        gap: clamp(12px, 2vw, 18px);
        align-items: start;
      }

      .hubSideNav {
        position: sticky;
        top: 16px;
        display: grid;
        gap: 8px;
        padding: 8px;
      }

      .hubSideNavButton {
        position: relative;
        min-height: 48px;
        width: 100%;
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr);
        align-items: center;
        gap: 9px;
        border: 1px solid rgba(88,210,255,.18);
        border-radius: 8px;
        color: var(--text);
        background: linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.018)), rgba(5,18,32,.62);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 12px 28px rgba(0,0,0,.18);
        padding: 8px 10px;
        font: inherit;
        font-weight: 950;
        text-align: left;
        cursor: pointer;
        transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
      }

      .hubSideNavButton:hover {
        border-color: rgba(88,210,255,.44);
        background: linear-gradient(180deg, rgba(53,216,255,.12), rgba(255,255,255,.025)), rgba(5,18,32,.76);
        box-shadow: inset 0 0 22px rgba(53,216,255,.09), 0 0 26px rgba(53,216,255,.15), 0 12px 28px rgba(0,0,0,.20);
        transform: translateX(2px);
      }

      .hubSideNavButton:active {
        transform: translateX(0) scale(.98);
      }

      .hubSideNavButton.isActive {
        border-color: rgba(101,232,255,.82);
        background: linear-gradient(180deg, rgba(53,216,255,.18), rgba(255,255,255,.04)), var(--panel-strong);
        box-shadow: inset 0 0 26px rgba(53,216,255,.18), 0 0 30px rgba(53,216,255,.20);
      }

      .hubSideIcon {
        width: 28px;
        height: 28px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        color: var(--cyan);
        background: rgba(53,216,255,.10);
        border: 1px solid rgba(88,210,255,.16);
        font-size: 15px;
        line-height: 1;
        text-shadow: 0 0 14px rgba(53,216,255,.45);
      }

      .hubSideLabel {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
        letter-spacing: 0;
      }

      .hubNotifyDot {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #ff4c73;
        box-shadow: 0 0 0 3px rgba(255,76,115,.14), 0 0 14px rgba(255,76,115,.55);
      }

      .hubCenter {
        min-width: 0;
        display: grid;
        gap: 14px;
      }

      .hubHero {
        position: relative;
        min-height: clamp(480px, 68vh, 720px);
        overflow: hidden;
        display: grid;
        grid-template-rows: auto 1fr auto;
        place-items: center;
        padding: clamp(16px, 3vw, 30px);
        background:
          radial-gradient(ellipse at 50% 34%, rgba(53,216,255,.18), transparent 36%),
          radial-gradient(ellipse at 50% 92%, rgba(53,216,255,.14), transparent 48%),
          linear-gradient(180deg, rgba(7,27,45,.62), rgba(2,9,21,.70));
      }

      .hubHero:before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: .32;
        background:
          radial-gradient(ellipse at 50% 0%, rgba(170,244,255,.42), transparent 26%),
          linear-gradient(180deg, rgba(53,216,255,.16), transparent 38%),
          radial-gradient(circle at 28% 34%, rgba(255,255,255,.16) 0 1px, transparent 2px),
          radial-gradient(circle at 74% 52%, rgba(255,255,255,.14) 0 1px, transparent 2px);
      }

      .hubHeroCopy {
        position: relative;
        z-index: 1;
        text-align: center;
        display: grid;
        gap: 6px;
      }

      .hubEyebrow {
        color: var(--cyan);
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .18em;
        text-transform: uppercase;
      }

      .hubHeroCopy h1 {
        margin: 0;
        font-size: clamp(34px, 7vw, 86px);
        line-height: .92;
        letter-spacing: 0;
        text-shadow: 0 0 38px rgba(53,216,255,.32);
      }

      .hubSphereStage {
        position: relative;
        z-index: 1;
        width: min(100%, 560px);
        display: grid;
        place-items: center;
        padding: 18px 0;
      }

      .hubSphere {
        position: relative;
        width: clamp(230px, 36vw, 440px);
        aspect-ratio: 1;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background:
          radial-gradient(circle at 36% 28%, rgba(255,255,255,.48), transparent 12%),
          radial-gradient(circle at 50% 58%, rgba(53,216,255,.18), transparent 42%),
          radial-gradient(circle at 50% 50%, rgba(5,96,145,.28), rgba(2,9,21,.18) 66%, rgba(53,216,255,.26) 100%);
        border: 1px solid rgba(159,237,255,.56);
        box-shadow:
          inset 0 0 42px rgba(176,247,255,.32),
          inset 0 -36px 82px rgba(28,184,255,.24),
          0 0 64px rgba(53,216,255,.30),
          0 34px 90px rgba(0,0,0,.42);
        animation: hubSphereBreath 4.8s ease-in-out infinite;
      }

      .hubSphere:before,
      .hubSphere:after {
        content: "";
        position: absolute;
        inset: 7%;
        border-radius: 50%;
        pointer-events: none;
      }

      .hubSphere:before {
        background:
          radial-gradient(ellipse at 45% 86%, rgba(53,216,255,.52), transparent 18%),
          radial-gradient(circle at 24% 24%, rgba(255,255,255,.24), transparent 10%),
          linear-gradient(140deg, rgba(255,255,255,.26), transparent 34%, rgba(53,216,255,.12) 62%, transparent);
        mix-blend-mode: screen;
      }

      .hubSphere:after {
        inset: 12%;
        opacity: .44;
        background:
          radial-gradient(circle at 30% 72%, rgba(117,232,255,.42) 0 1px, transparent 2px),
          radial-gradient(circle at 62% 28%, rgba(117,232,255,.36) 0 1px, transparent 2px),
          radial-gradient(circle at 76% 64%, rgba(255,255,255,.26) 0 1px, transparent 2px);
        background-size: 62px 58px, 86px 74px, 76px 80px;
      }

      .hubFish {
        position: relative;
        z-index: 2;
        width: 66%;
        max-width: 300px;
        display: grid;
        place-items: center;
        animation: hubFishFloat 3.8s ease-in-out infinite;
        filter: drop-shadow(0 20px 28px rgba(0,0,0,.40)) drop-shadow(0 0 20px rgba(53,216,255,.22));
      }

      .hubFish img {
        display: block;
        width: 100%;
        height: auto;
        object-fit: contain;
      }

      .hubFishFallback {
        position: relative;
        width: min(100%, 300px);
        aspect-ratio: 2.25 / 1;
        border-radius: 52% 48% 46% 54% / 54% 52% 48% 46%;
        background:
          radial-gradient(circle at 78% 36%, #fff 0 8%, #101318 9% 15%, transparent 16%),
          linear-gradient(120deg, #164fc5 0%, #1c77ff 55%, #0f3fae 100%);
        box-shadow: inset -18px -20px 36px rgba(2,9,21,.22), inset 18px 14px 26px rgba(255,255,255,.12);
      }

      .hubFishFallback:before {
        content: "";
        position: absolute;
        left: -22%;
        top: 22%;
        width: 30%;
        height: 56%;
        clip-path: polygon(100% 50%, 0 0, 18% 50%, 0 100%);
        background: linear-gradient(120deg, #1246be, #1b70ff);
      }

      .hubFishFallback:after {
        content: "";
        position: absolute;
        left: 48%;
        top: 42%;
        width: 22%;
        height: 24%;
        border-radius: 52% 48% 46% 54%;
        background: linear-gradient(120deg, #2b82ff, #1547ba);
        box-shadow: inset 5px 5px 10px rgba(255,255,255,.18);
      }

      .hubSphereCaption {
        margin-top: 12px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 900;
        text-align: center;
      }

      .hubPrimaryPlayButton {
        position: relative;
        z-index: 1;
        width: min(100%, 420px);
        min-height: 68px;
        overflow: hidden;
        border: 1px solid rgba(166,245,255,.82);
        border-radius: 999px;
        color: var(--text);
        background:
          linear-gradient(180deg, rgba(255,255,255,.20), rgba(255,255,255,.045)),
          radial-gradient(ellipse at 50% 0%, rgba(183,255,240,.34), transparent 48%),
          rgba(5,18,32,.66);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.34),
          inset 0 -18px 34px rgba(53,216,255,.14),
          0 0 0 1px rgba(53,216,255,.12),
          0 0 42px rgba(53,216,255,.44),
          0 22px 54px rgba(0,0,0,.38);
        font-size: clamp(21px, 4.8vw, 30px);
        font-weight: 950;
        letter-spacing: .18em;
        text-align: center;
        cursor: pointer;
        transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease;
      }

      .hubPrimaryPlayButton:before {
        content: "";
        position: absolute;
        inset: -80% auto -80% -40%;
        width: 32%;
        transform: rotate(18deg);
        background: linear-gradient(90deg, transparent, rgba(255,255,255,.78), transparent);
        animation: hubButtonShine 3.6s ease-in-out infinite;
      }

      .hubPrimaryPlayButton:after {
        content: "";
        position: absolute;
        inset: 6px;
        border-radius: inherit;
        pointer-events: none;
        border: 1px solid rgba(255,255,255,.12);
      }

      .hubPrimaryPlayButton span {
        position: relative;
        z-index: 1;
        display: inline-block;
        text-shadow: 0 0 18px rgba(53,216,255,.56);
      }

      .hubPrimaryPlayButton:hover {
        border-color: rgba(215,255,255,.96);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.38),
          inset 0 -18px 34px rgba(53,216,255,.20),
          0 0 0 1px rgba(53,216,255,.16),
          0 0 56px rgba(53,216,255,.60),
          0 26px 62px rgba(0,0,0,.42);
        transform: translateY(-2px) scale(1.025);
      }

      .hubPrimaryPlayButton:active {
        transform: scale(.975);
      }

      .hubModes {
        display: grid;
        grid-template-columns: minmax(0, 1.25fr) minmax(220px, .75fr);
        gap: 12px;
        min-width: 0;
      }

      .hubModeCard {
        min-width: 0;
        padding: 14px;
        display: grid;
        gap: 12px;
        cursor: pointer;
        transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease, background .2s ease;
      }

      .hubModeCard:hover,
      .hubModeCard.isSelected {
        border-color: rgba(101,232,255,.70);
        box-shadow: 0 0 34px rgba(53,216,255,.25), 0 18px 60px rgba(0,0,0,.32);
        transform: translateY(-2px);
      }

      .hubModeCard.isFeatured {
        background:
          radial-gradient(ellipse at 18% 16%, rgba(53,216,255,.26), transparent 42%),
          linear-gradient(180deg, rgba(11,45,72,.86), rgba(5,18,32,.72));
      }

      .hubModeHead {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }

      .hubModeCard h2 {
        margin: 0;
        font-size: clamp(20px, 2.2vw, 28px);
        line-height: 1.05;
        letter-spacing: 0;
      }

      .hubModeCard p {
        margin: 5px 0 0;
        color: var(--muted);
        font-size: 13px;
        font-weight: 850;
      }

      .hubBadge {
        flex: 0 0 auto;
        padding: 6px 9px;
        border-radius: 999px;
        color: #031524;
        background: var(--gold);
        font-size: 10px;
        font-weight: 950;
      }

      .hubModeActions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .hubModeButton {
        min-height: 40px;
        border: 1px solid rgba(152,240,255,.38);
        border-radius: 999px;
        color: var(--text);
        background: rgba(53,216,255,.13);
        padding: 0 14px;
        font-weight: 950;
        cursor: pointer;
      }

      .hubModeCard.isFeatured .hubModeButton {
        color: #02131f;
        background: linear-gradient(90deg, #67eaff, #b7fff0);
      }

      .rightRail {
        min-width: 0;
        display: grid;
        gap: 12px;
      }

      .hubPanel {
        min-width: 0;
        padding: 12px;
      }

      .hubPanelHead {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
        margin-bottom: 10px;
      }

      .hubPanelTitle {
        font-size: 14px;
        font-weight: 950;
      }

      .hubStatusPill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 24px;
        padding: 0 8px;
        border-radius: 999px;
        color: var(--muted);
        background: rgba(234,247,255,.06);
        border: 1px solid rgba(234,247,255,.10);
        font-size: 11px;
        font-weight: 900;
      }

      .hubStatusPill:before {
        content: "";
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #ff6f8f;
        box-shadow: 0 0 12px rgba(255,111,143,.40);
      }

      .hubStatusPill.isOnline:before {
        background: #62ffc8;
        box-shadow: 0 0 12px rgba(98,255,200,.40);
      }

      .hubInfoGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .hubOnlineCard,
      .hubInfoCardButton {
        min-height: 84px;
        padding: 10px;
        border-radius: 8px;
        border: 1px solid rgba(234,247,255,.10);
        background: rgba(2,9,21,.30);
        display: grid;
        align-content: space-between;
        gap: 8px;
      }

      .hubOnlineCard strong,
      .hubInfoCardButton strong {
        display: block;
        font-size: 20px;
        line-height: 1;
      }

      .hubInfoCardButton {
        position: relative;
        width: 100%;
        color: var(--text);
        text-align: left;
        font: inherit;
        cursor: pointer;
        background:
          linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.018)),
          rgba(2,9,21,.34);
        transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
      }

      .hubInfoCardButton:hover {
        border-color: rgba(88,210,255,.50);
        background:
          radial-gradient(ellipse at 12% 10%, rgba(53,216,255,.16), transparent 52%),
          linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.022)),
          rgba(2,9,21,.42);
        box-shadow: inset 0 0 24px rgba(53,216,255,.08), 0 0 24px rgba(53,216,255,.15);
        transform: translateY(-1px);
      }

      .hubInfoCardButton:active {
        transform: scale(.985);
      }

      .hubInfoIconRow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .hubInfoIcon {
        width: 26px;
        height: 26px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        color: var(--cyan);
        background: rgba(53,216,255,.11);
        border: 1px solid rgba(88,210,255,.18);
        font-size: 14px;
      }

      .hubInfoProgress {
        height: 5px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(234,247,255,.11);
      }

      .hubInfoProgress span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--cyan), #78ffd8);
        box-shadow: 0 0 16px rgba(53,216,255,.34);
      }

      .hubPlayerRows {
        display: grid;
        gap: 8px;
      }

      .hubPlayerRow {
        min-width: 0;
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
        padding: 9px;
        border-radius: 8px;
        border: 1px solid rgba(234,247,255,.10);
        background: rgba(2,9,21,.30);
      }

      .hubPlayerRow strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hubPanelActions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .hubPanelActions button {
        min-height: 38px;
      }

      .hubChatLog {
        height: 220px;
        overflow: auto;
        display: grid;
        align-content: start;
        gap: 10px;
        padding: 10px;
        border-radius: 8px;
        border: 1px solid rgba(234,247,255,.10);
        background: rgba(2,9,21,.36);
      }

      .hubChatMsg {
        display: grid;
        gap: 4px;
      }

      .hubChatMeta {
        display: flex;
        gap: 8px;
        align-items: baseline;
        min-width: 0;
      }

      .hubChatMeta strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hubChatText {
        color: rgba(234,247,255,.86);
        line-height: 1.38;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .hubChatForm {
        margin-top: 10px;
        display: flex;
        gap: 8px;
      }

      .hubChatInput {
        min-width: 0;
        flex: 1 1 auto;
        height: 42px;
        border-radius: 999px;
        border: 1px solid rgba(234,247,255,.12);
        background: rgba(2,9,21,.48);
        color: var(--text);
        padding: 0 12px;
        outline: none;
        font-weight: 850;
      }

      .hubChatInput:disabled {
        opacity: .58;
      }

      .hubBottomNav {
        position: fixed;
        left: 10px;
        right: 10px;
        bottom: 10px;
        z-index: 5;
        display: none;
        grid-template-columns: repeat(5, minmax(58px, 1fr));
        gap: 5px;
        padding: 6px;
        overflow-x: auto;
      }

      .hubBottomNavButton {
        min-width: 0;
        min-height: 58px;
        display: grid;
        place-items: center;
        align-content: center;
        gap: 4px;
        border: 1px solid transparent;
        border-radius: 999px;
        color: var(--muted);
        background: transparent;
        font: inherit;
        font-weight: 950;
        cursor: pointer;
        transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, color .18s ease, background .18s ease;
      }

      .hubBottomNavButton:hover {
        color: var(--text);
        background: rgba(53,216,255,.08);
        transform: translateY(-1px);
      }

      .hubBottomNavButton:active {
        transform: scale(.96);
      }

      .hubBottomNavButton.isActive {
        color: var(--text);
        border-color: rgba(88,210,255,.44);
        background:
          linear-gradient(180deg, rgba(53,216,255,.18), rgba(255,255,255,.035)),
          rgba(5,18,32,.72);
        box-shadow: inset 0 0 18px rgba(53,216,255,.12), 0 0 22px rgba(53,216,255,.18);
      }

      .hubBottomIcon {
        font-size: 17px;
        line-height: 1;
      }

      .hubBottomNavButton.isActive .hubBottomIcon {
        color: var(--cyan);
        text-shadow: 0 0 14px rgba(53,216,255,.54);
        animation: hubActivePulse 2.4s ease-in-out infinite;
      }

      .hubBottomLabel {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 10px;
        letter-spacing: 0;
      }

      @keyframes hubParticles {
        0% { transform: translate3d(0, 0, 0); }
        100% { transform: translate3d(0, -24px, 0); }
      }

      @keyframes hubDrops {
        0%, 100% { transform: translate3d(0, 0, 0); opacity: .30; }
        50% { transform: translate3d(0, -18px, 0); opacity: .42; }
      }

      @keyframes hubSphereBreath {
        0%, 100% { transform: scale(1); filter: saturate(1); }
        50% { transform: scale(1.025); filter: saturate(1.12); }
      }

      @keyframes hubFishFloat {
        0%, 100% { transform: translate3d(0, 0, 0) rotate(-1deg); }
        50% { transform: translate3d(0, -10px, 0) rotate(1deg); }
      }

      @keyframes hubButtonShine {
        0%, 42% { transform: translateX(0) rotate(18deg); opacity: 0; }
        54% { opacity: .82; }
        100% { transform: translateX(430%) rotate(18deg); opacity: 0; }
      }

      @keyframes hubActivePulse {
        0%, 100% { transform: scale(1); opacity: .82; }
        50% { transform: scale(1.12); opacity: 1; }
      }

      @media (max-width: 1120px) {
        .hubShell {
          grid-template-columns: minmax(76px, 104px) minmax(0, 1fr);
        }

        .rightRail {
          grid-column: 1 / -1;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .rightRail .hubPanel:first-child {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 760px) {
        .bcHub {
          padding: 10px 10px 88px;
        }

        .hubTop {
          align-items: stretch;
          flex-wrap: wrap;
        }

        .hubProfilePanel {
          flex: 1 1 100%;
          min-width: 0;
        }

        .hubCurrencyBar {
          flex: 1 1 calc(100% - 60px);
          justify-content: flex-start;
          overflow-x: auto;
        }

        .hubCurrency {
          min-width: 104px;
        }

        .hubShell {
          grid-template-columns: minmax(0, 1fr);
        }

        .hubSideNav {
          display: none;
        }

        .hubHero {
          min-height: 520px;
          padding: 14px 10px;
        }

        .hubSphere {
          width: min(76vw, 330px);
        }

        .hubModes,
        .rightRail {
          grid-template-columns: minmax(0, 1fr);
        }

        .rightRail .hubPanel:first-child {
          grid-column: auto;
        }

        .hubChatLog {
          height: 190px;
        }

        .hubBottomNav {
          display: grid;
        }
      }

      @media (max-width: 420px) {
        .hubHero {
          min-height: 470px;
        }

        .hubInfoGrid {
          grid-template-columns: minmax(0, 1fr);
        }

        .hubChatForm {
          flex-wrap: wrap;
        }

        .hubChatForm .bcButton,
        .hubChatForm button {
          width: 100%;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .bcSiteRoot:after,
        .hubDrops,
        .hubSphere,
        .hubFish,
        .hubPrimaryPlayButton:before,
        .hubBottomNavButton.isActive .hubBottomIcon {
          animation: none !important;
        }

        .hubModeCard,
        .hubSideNavButton,
        .hubBottomNavButton,
        .hubInfoCardButton,
        .hubPrimaryPlayButton {
          transition: none !important;
        }
      }

      /* kill any background overlays/canvas capturing touches */
      canvas,
      .MatrixBackground,
      .matrixCanvas,
      #matrix,
      .bcHeroBg,
      .bcHeroAurora,
      .bcHeroVignette,
      .bcHeroNoise,
      .bcBg,
      .bcBackground,
      .bcBackdrop {
        pointer-events: none !important;
        touch-action: none !important;
      }
    `}</style>
  );

  React.useEffect(() => {
    const sync = () => {
      myNickRef.current = getNick();
    };
    sync();
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync as any);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync as any);
    };
  }, []);

  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [history.length]);

  const closeWs = React.useCallback(() => {
    const ws = wsRef.current;
    wsRef.current = null;
    joinSentRef.current = false;

    if (reconnectTimerRef.current != null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (ws) {
      try {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      } catch {}
    }
  }, []);

  const sendWs = React.useCallback((msg: WsClientJoin | WsClientReady | WsClientChat | WsClientPing) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify(msg));
      return true;
    } catch {
      return false;
    }
  }, []);

  const scheduleReconnect = React.useCallback(() => {
    if (!aliveRef.current) return;
    if (reconnectTimerRef.current != null) return;

    const attempt = Math.min(8, attemptRef.current + 1);
    attemptRef.current = attempt;

    const backoff = Math.min(9000, 350 + attempt * 650);
    reconnectTimerRef.current = window.setTimeout(() => {
      reconnectTimerRef.current = null;
      connectRef.current?.();
    }, backoff) as unknown as number;
  }, []);

  const connectRef = React.useRef<(() => void) | null>(null);

  const connectWs = React.useCallback(() => {
    setMode("ws");
    closeWs();
    setStatus("connecting");

    const url = wsUrl(room);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    let opened = false;

    const doJoin = () => {
      if (joinSentRef.current) return;
      joinSentRef.current = true;

      sendWs({
        t: "join",
        clientId: clientIdRef.current,
        name: myNickRef.current,
      } satisfies WsClientJoin);

      const desired = desiredReadyRef.current;
      if (desired) sendWs({ t: "ready", ready: true } satisfies WsClientReady);
    };

    // If WS doesn't open quickly (WebView), auto-fallback to polling
    const fallbackTimer = window.setTimeout(() => {
      if (!aliveRef.current) return;
      if (opened) return;
      try {
        ws.close();
      } catch {}
      setMode("poll");
    }, 2200);

    ws.onopen = () => {
      opened = true;
      window.clearTimeout(fallbackTimer);
      if (!aliveRef.current) return;
      setStatus("online");
      attemptRef.current = 0;
      doJoin();
    };

    ws.onmessage = (ev) => {
      if (!aliveRef.current) return;

      let data: WsServerAny | null = null;
      try {
        data = JSON.parse(String(ev.data)) as WsServerAny;
      } catch {
        data = null;
      }
      if (!data || typeof data.t !== "string") return;

      if (data.t === "hello") {
        const h = data as WsServerHello;

        if (Array.isArray(h.players)) setPlayers(h.players.slice(0, 8));

        if (Array.isArray(h.history)) {
          const mapped: ChatMsg[] = h.history.map((m) => ({
            id: m.id,
            from: m.fromName,
            text: m.text,
            t: m.at,
          }));
          setHistory((prev) => uniqChat([...prev, ...mapped], 80));
        }

        const ms = h.match?.s;
        if (ms === "countdown") setMatchLabel("старт");
        else if (ms === "started") setMatchLabel("запущен");
        else setMatchLabel("ожидание");
        return;
      }

      if (data.t === "players") {
        const p = data as WsServerPlayers;
        if (Array.isArray(p.players)) setPlayers(p.players.slice(0, 8));
        const ms = p.match?.s;
        if (ms === "countdown") setMatchLabel("старт");
        else if (ms === "started") setMatchLabel("запущен");
        else setMatchLabel("ожидание");
        return;
      }

      if (data.t === "match") {
        const ms = (data as WsServerMatch).match?.s;
        if (ms === "countdown") setMatchLabel("старт");
        else if (ms === "started") setMatchLabel("запущен");
        else setMatchLabel("ожидание");
        return;
      }

      if (data.t === "chat") {
        const c = data as WsServerChat;
        const m = c.msg;
        if (!m?.id) return;
        setHistory((prev) => uniqChat([...prev, { id: m.id, from: m.fromName, text: m.text, t: m.at }], 80));
        return;
      }

      if (data.t === "start") {
        nav("/game/");
        return;
      }
    };

    ws.onerror = () => {
      // handled by close / fallback
    };

    ws.onclose = () => {
      window.clearTimeout(fallbackTimer);
      if (!aliveRef.current) return;

      // If we were in WS mode and it closes, try reconnect a few times, then fallback to poll.
      setStatus("offline");
      joinSentRef.current = false;

      if (mode === "ws") {
        if (attemptRef.current >= 3) {
          setMode("poll");
          return;
        }
        scheduleReconnect();
      }
    };
  }, [room, closeWs, sendWs, scheduleReconnect, mode]);

  connectRef.current = connectWs;

  // keepalive ping for WS
  React.useEffect(() => {
    if (mode !== "ws") return;
    if (status !== "online") return;

    const t = window.setInterval(() => {
      if (!aliveRef.current) return;
      if (document.visibilityState !== "visible") return;
      sendWs({ t: "ping", at: Date.now() } satisfies WsClientPing);
    }, 18_000);

    return () => window.clearInterval(t);
  }, [mode, status, sendWs]);

  // POLLING loop (fallback)
  React.useEffect(() => {
    if (mode !== "poll") return;

    let alive = true;

    const tick = async () => {
      const ok = await pollHeartbeat({
        room,
        clientId: clientIdRef.current,
        name: myNickRef.current,
        ready: desiredReadyRef.current,
      });

      if (!alive) return;
      setStatus(ok ? "online" : "offline");

      const s = await pollState(room);
      if (!alive) return;
      if (s?.ok) {
        setPlayers(Array.isArray(s.players) ? s.players.slice(0, 8) : []);
        setMatchLabel("ожидание");
      }

      const c = await pollChat(room);
      if (!alive) return;
      if (c?.ok && Array.isArray(c.items)) {
        const mapped: ChatMsg[] = c.items.map((m) => ({ id: m.id, from: m.fromName, text: m.text, t: m.at }));
        setHistory((prev) => uniqChat([...prev, ...mapped], 80));
      }
    };

    setStatus("connecting");
    void tick();

    const tHeart = window.setInterval(() => {
      if (!alive) return;
      if (document.visibilityState !== "visible") return;
      void tick();
    }, 1100);

    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      void tick();
    };

    window.addEventListener("focus", onVis);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      window.clearInterval(tHeart);
      window.removeEventListener("focus", onVis);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [mode, room]);

  // lifecycle start: try WS first
  React.useEffect(() => {
    aliveRef.current = true;
    connectWs();

    const onVis = () => {
      if (document.visibilityState !== "visible") return;

      // if in WS mode but socket dead -> reconnect
      if (mode === "ws") {
        const ws = wsRef.current;
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          connectWs();
        }
      }
    };

    window.addEventListener("focus", onVis);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      aliveRef.current = false;
      window.removeEventListener("focus", onVis);
      document.removeEventListener("visibilitychange", onVis);
      closeWs();
    };
  }, [connectWs, closeWs, mode]);

  const onlineCount = players.length;
  const canReady = onlineCount <= 8;
  const isOnline = status === "online";

  const toggleReady = React.useCallback(async () => {
    if (!canReady) return;

    const next = !desiredReadyRef.current;
    desiredReadyRef.current = next;
    setReady(next);

    if (mode === "ws") {
      if (!isOnline) return;
      sendWs({ t: "ready", ready: next } satisfies WsClientReady);
      return;
    }

    // poll mode: push immediately
    await pollHeartbeat({
      room,
      clientId: clientIdRef.current,
      name: myNickRef.current,
      ready: next,
    });
  }, [canReady, isOnline, mode, room, sendWs]);

  const sendChat = React.useCallback(async () => {
    if (!isOnline) return;

    const msg = clampText(text, 180);
    if (!msg) return;

    setText("");

    const optimistic: ChatMsg = {
      id: `local_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`,
      from: myNickRef.current,
      text: msg,
      t: Date.now(),
      local: true,
    };
    setHistory((prev) => uniqChat([...prev, optimistic], 80));

    if (mode === "ws") {
      sendWs({ t: "chat", text: msg, clientMsgId: safeId() } satisfies WsClientChat);
      return;
    }

    // poll
    await pollSendChat({
      room,
      clientId: clientIdRef.current,
      name: myNickRef.current,
      text: msg,
    });

    const c = await pollChat(room);
    if (c?.ok && Array.isArray(c.items)) {
      const mapped: ChatMsg[] = c.items.map((m) => ({ id: m.id, from: m.fromName, text: m.text, t: m.at }));
      setHistory((prev) => uniqChat([...prev, ...mapped], 80));
    }
  }, [isOnline, mode, room, sendWs, text]);

  const hardReconnect = React.useCallback(() => {
    attemptRef.current = 0;
    if (mode === "ws") {
      connectWs();
      return;
    }
    // poll mode: just re-run tick by switching mode briefly
    setMode("poll");
  }, [connectWs, mode]);

  const playMode = React.useCallback((nextMode: HubMode) => {
    nav(launchPath(nextMode));
  }, []);

  const playSelectedMode = React.useCallback(() => {
    playMode(selectedMode);
  }, [playMode, selectedMode]);

  return (
    <main className="bcSiteRoot">
      {ClickFix}
      <LobbyBackground />

      <div className="bcLobbyUiLayer">
        <div className="bcHub">
          <header className="hubTop">
            <PlayerPanel profile={profile} />
            <CurrencyBar profile={profile} />
            <button className="hubSettings" type="button" aria-label="Настройки" onClick={() => nav("/game/")}>
              ⚙
            </button>
          </header>

          <div className="hubShell">
            <SideNav />

            <section className="hubCenter" aria-label="EvoFish режимы">
              <div className="hubHero">
                <div className="hubHeroCopy">
                  <span className="hubEyebrow">Океанская станция</span>
                  <h1>EvoFish</h1>
                </div>

                <FishSphere mode={selectedMode} />

                <PrimaryPlayButton mode={selectedMode} onClick={playSelectedMode} />
              </div>

              <ModeSelector selectedMode={selectedMode} onSelect={setSelectedMode} onPlay={playMode} />
            </section>

            <aside className="rightRail" aria-label="Лобби">
              <LobbyInfoCards
                onlineCount={onlineCount}
                readyCount={players.filter((p) => p.ready).length}
                status={status}
                matchLabel={matchLabel}
                profile={profile}
              />

              <LobbyPlayersPanel
                players={players}
                ready={ready}
                canReady={canReady}
                isOnline={isOnline}
                netMode={mode}
                onToggleReady={toggleReady}
                onReconnect={hardReconnect}
                onPlay={playSelectedMode}
              />

              <LobbyChatPanel
                history={history}
                text={text}
                isOnline={isOnline}
                listRef={listRef}
                onTextChange={setText}
                onSend={sendChat}
              />
            </aside>
          </div>

          <BottomNav />
        </div>
      </div>
    </main>
  );
}

function formatCount(value: number) {
  return Math.max(0, Math.floor(value)).toLocaleString("ru-RU");
}

function lobbyStatusText(status: LobbyStatus) {
  if (status === "online") return "онлайн";
  if (status === "connecting") return "подключение";
  return "офлайн";
}

function LobbyBackground() {
  return (
    <>
      <div className="hubMist" aria-hidden="true" />
      <div className="hubDrops" aria-hidden="true" />
    </>
  );
}

function PlayerPanel({ profile }: { profile: HubProfile }) {
  const xpProgress = progressPercent(profile.xp, profile.xpToNext);
  const initial = profile.nickname.trim().slice(0, 1).toUpperCase() || "E";

  return (
    <section className="hubProfilePanel" aria-label="Профиль">
      <div className="hubAvatar" aria-hidden="true">
        {initial}
      </div>
      <div className="hubProfileText">
        <div className="hubProfileName">{profile.nickname}</div>
        <div className="hubProfileMeta">
          LV {profile.level} · XP {formatCount(profile.xp)} / {formatCount(profile.xpToNext)}
        </div>
        <div className="hubProgress" aria-hidden="true">
          <span style={{ width: `${xpProgress}%` }} />
        </div>
      </div>
    </section>
  );
}

function CurrencyBar({ profile }: { profile: HubProfile }) {
  const items = [
    { label: "Алмазы", value: profile.gems, cls: "" },
    { label: "Монеты", value: profile.coins, cls: "isGold" },
    { label: "Жемчуг", value: profile.pearls, cls: "isPearl" },
    { label: "Коралл", value: profile.corals, cls: "isCoral" },
  ];

  return (
    <section className="hubCurrencyBar" aria-label="Валюта">
      {items.map((item) => (
        <div className={`hubCurrency ${item.cls}`} key={item.label}>
          <i aria-hidden="true" />
          <div>
            <strong>{formatCount(item.value)}</strong>
            <span>{item.label}</span>
          </div>
        </div>
      ))}
    </section>
  );
}

function FishSphere({ mode }: { mode: HubMode }) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const label = mode === "next" ? "EvoFish Next" : "EvoFish Classic";

  return (
    <div className="hubSphereStage" aria-label={`${label} fish preview`}>
      <div className="hubSphere">
        <div className="hubFish">
          {imageFailed ? (
            <div className="hubFishFallback" aria-hidden="true" />
          ) : (
            <img
              src="/assets/fish/fish_standard.png"
              alt="Стандартная рыба EvoFish"
              draggable={false}
              onError={() => setImageFailed(true)}
            />
          )}
        </div>
      </div>
      <div className="hubSphereCaption">{label}</div>
    </div>
  );
}

function PrimaryPlayButton({ mode, onClick }: { mode: HubMode; onClick: () => void }) {
  return (
    <button
      className="hubPrimaryPlayButton"
      type="button"
      aria-label={mode === "next" ? "PLAY EvoFish Next" : "PLAY EvoFish Classic"}
      onClick={onClick}
    >
      <span>PLAY</span>
    </button>
  );
}

function ModeSelector({
  selectedMode,
  onSelect,
  onPlay,
}: {
  selectedMode: HubMode;
  onSelect: (mode: HubMode) => void;
  onPlay: (mode: HubMode) => void;
}) {
  return (
    <div className="hubModes" aria-label="Режимы EvoFish">
      <ModeCard
        mode="next"
        title="EvoFish Next"
        subtitle="Новая версия"
        cta="Играть в Next"
        featured
        selected={selectedMode === "next"}
        onSelect={onSelect}
        onPlay={onPlay}
      />
      <ModeCard
        mode="classic"
        title="EvoFish Classic"
        subtitle="Классический режим"
        cta="Играть в Classic"
        selected={selectedMode === "classic"}
        onSelect={onSelect}
        onPlay={onPlay}
      />
    </div>
  );
}

function ModeCard({
  mode,
  title,
  subtitle,
  cta,
  featured = false,
  selected,
  onSelect,
  onPlay,
}: {
  mode: HubMode;
  title: string;
  subtitle: string;
  cta: string;
  featured?: boolean;
  selected: boolean;
  onSelect: (mode: HubMode) => void;
  onPlay: (mode: HubMode) => void;
}) {
  const select = () => onSelect(mode);

  return (
    <article
      className={`hubModeCard ${featured ? "isFeatured" : ""} ${selected ? "isSelected" : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={select}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        select();
      }}
    >
      <div className="hubModeHead">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {featured ? <span className="hubBadge">РЕКОМЕНД.</span> : null}
      </div>
      <div className="hubModeActions">
        <span className="hubTiny">{selected ? "Выбран" : "Доступен"}</span>
        <button
          className="hubModeButton"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onPlay(mode);
          }}
        >
          {cta}
        </button>
      </div>
    </article>
  );
}

function SideNav() {
  const currentPath = window.location.pathname;

  return (
    <nav className="hubSideNav" aria-label="Разделы">
      {SIDE_NAV_ITEMS.map((item) => (
        <SideNavButton
          key={item.label}
          icon={item.icon}
          label={item.label}
          active={currentPath === item.path || currentPath.startsWith(`${item.path}/`)}
          notify={item.notify}
          onClick={() => nav(item.path)}
        />
      ))}
    </nav>
  );
}

function SideNavButton({
  icon,
  label,
  active = false,
  notify = false,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  notify?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`hubSideNavButton ${active ? "isActive" : ""}`} type="button" aria-current={active ? "page" : undefined} onClick={onClick}>
      <span className="hubSideIcon" aria-hidden="true">
        {icon}
      </span>
      <span className="hubSideLabel">{label}</span>
      {notify ? <span className="hubNotifyDot" aria-hidden="true" /> : null}
    </button>
  );
}

function LobbyInfoCards({
  onlineCount,
  readyCount,
  status,
  matchLabel,
  profile,
}: {
  onlineCount: number;
  readyCount: number;
  status: LobbyStatus;
  matchLabel: "ожидание" | "старт" | "запущен";
  profile: HubProfile;
}) {
  const seasonProgress = progressPercent(profile.xp, profile.xpToNext);

  return (
    <section className="hubPanel" aria-label="Информация">
      <div className="hubPanelHead">
        <div className="hubPanelTitle">Станция</div>
        <span className={`hubStatusPill ${status === "online" ? "isOnline" : ""}`}>{lobbyStatusText(status)}</span>
      </div>
      <div className="hubInfoGrid">
        <div className="hubOnlineCard">
          <span className="hubTiny">Online players</span>
          <strong>{onlineCount}/8</strong>
          <span className="hubTiny">{readyCount} готовы</span>
        </div>
        <InfoCardButton icon="◎" title="Season" value={`${seasonProgress}%`} detail={`LV ${profile.level}`} progress={seasonProgress} onClick={() => nav("/game/season")} />
        <InfoCardButton
          icon="◇"
          title="Leaderboard"
          value="Top 100"
          detail={`матч: ${matchLabel}`}
          progress={Math.max(8, Math.min(100, readyCount * 12 + onlineCount * 6))}
          onClick={() => nav("/game/leaderboard")}
        />
        <InfoCardButton
          icon="✦"
          title="Daily Reward"
          value={profile.pearls > 0 ? formatCount(profile.pearls) : "0"}
          detail="жемчуг"
          progress={profile.pearls > 0 ? 100 : 18}
          onClick={() => nav("/game/progress")}
        />
      </div>
    </section>
  );
}

function InfoCardButton({
  icon,
  title,
  value,
  detail,
  progress,
  onClick,
}: {
  icon: string;
  title: string;
  value: string;
  detail: string;
  progress: number;
  onClick: () => void;
}) {
  return (
    <button className="hubInfoCardButton" type="button" onClick={onClick}>
      <span className="hubInfoIconRow">
        <span className="hubTiny">{title}</span>
        <span className="hubInfoIcon" aria-hidden="true">
          {icon}
        </span>
      </span>
      <strong>{value}</strong>
      <span className="hubTiny">{detail}</span>
      <span className="hubInfoProgress" aria-hidden="true">
        <span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
      </span>
    </button>
  );
}

function LobbyPlayersPanel({
  players,
  ready,
  canReady,
  isOnline,
  netMode,
  onToggleReady,
  onReconnect,
  onPlay,
}: {
  players: Player[];
  ready: boolean;
  canReady: boolean;
  isOnline: boolean;
  netMode: NetMode;
  onToggleReady: () => void | Promise<void>;
  onReconnect: () => void;
  onPlay: () => void;
}) {
  return (
    <section className="hubPanel" aria-label="Игроки">
      <div className="hubPanelHead">
        <div>
          <div className="hubPanelTitle">Команда</div>
          <div className="hubTiny">{netMode === "ws" ? "онлайн" : "резервная связь"}</div>
        </div>
        <Button variant={ready ? "primary" : "secondary"} onClick={() => void onToggleReady()} disabled={!isOnline || !canReady}>
          {ready ? "Готов" : "Не готов"}
        </Button>
      </div>

      <div className="hubPlayerRows">
        {players.slice(0, 8).map((player) => (
          <div className="hubPlayerRow" key={player.id}>
            <strong>{player.name}</strong>
            <span className="hubTiny">{player.ready ? "готов" : "ждёт"}</span>
          </div>
        ))}
        {players.length === 0 ? <div className="hubTiny">Ожидание игроков</div> : null}
      </div>

      {!canReady ? <div className="hubTiny" style={{ marginTop: 10 }}>Комната заполнена.</div> : null}

      <div className="hubPanelActions" style={{ marginTop: 12 }}>
        <Button variant="ghost" onClick={onReconnect}>
          Переподключить
        </Button>
        <Button variant="secondary" onClick={onPlay} disabled={!isOnline}>
          В игру
        </Button>
      </div>
    </section>
  );
}

function LobbyChatPanel({
  history,
  text,
  isOnline,
  listRef,
  onTextChange,
  onSend,
}: {
  history: ChatMsg[];
  text: string;
  isOnline: boolean;
  listRef: React.RefObject<HTMLDivElement>;
  onTextChange: React.Dispatch<React.SetStateAction<string>>;
  onSend: () => void | Promise<void>;
}) {
  return (
    <section className="hubPanel" aria-label="Чат">
      <div className="hubPanelHead">
        <div className="hubPanelTitle">Чат</div>
        <span className={`hubStatusPill ${isOnline ? "isOnline" : ""}`}>{isOnline ? "в эфире" : "нет связи"}</span>
      </div>

      <div className="hubChatLog" ref={listRef}>
        {history.map((message) => (
          <div className="hubChatMsg" key={message.id}>
            <div className="hubChatMeta">
              <strong>{message.from}</strong>
              <span className="hubTiny">{fmtTime(message.t)}</span>
            </div>
            <div className="hubChatText">{message.text}</div>
          </div>
        ))}
        {history.length === 0 ? <div className="hubTiny">Сообщений пока нет.</div> : null}
      </div>

      <div className="hubChatForm">
        <input
          className="hubChatInput"
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder={isOnline ? "Написать сообщение" : "Чат офлайн"}
          disabled={!isOnline}
          onKeyDown={(event) => {
            if (!isOnline || event.key !== "Enter") return;
            event.preventDefault();
            void onSend();
          }}
        />
        <Button variant="primary" onClick={() => void onSend()} disabled={!isOnline}>
          Отправить
        </Button>
      </div>
    </section>
  );
}

function BottomNav() {
  return (
    <nav className="hubBottomNav" aria-label="Быстрая навигация">
      {BOTTOM_NAV_ITEMS.map((item) => (
        <BottomNavButton
          key={item.label}
          icon={item.icon}
          label={item.label}
          active={item.label === "Лобби"}
          onClick={() => nav(item.path)}
        />
      ))}
    </nav>
  );
}

function BottomNavButton({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`hubBottomNavButton ${active ? "isActive" : ""}`} type="button" aria-current={active ? "page" : undefined} onClick={onClick}>
      <span className="hubBottomIcon" aria-hidden="true">
        {icon}
      </span>
      <span className="hubBottomLabel">{label}</span>
    </button>
  );
}

export default Lobby;
