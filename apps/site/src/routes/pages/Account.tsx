import React from "react";
import { Button } from "@blackcrown/ui";
import { HeroArt } from "@blackcrown/assets";
import { userStorage } from "@blackcrown/core";
import { openTelegramBot } from "../../lib/telegram";
import { getReducedMotion, setReducedMotion } from "../../lib/prefs";
import { nav, navExternal } from "../../lib/nav";
import { SiteHeader } from "../../components/SiteHeader";
import {
  StoreItem,
  ensureStoreInit,
  getStoreItems,
  getStoreState,
  formatCoins,
  rarityAccent,
  rarityLabel,
} from "../../lib/store";

const KEY_NICK = "nickname";
const KEY_STATUS = "profile.status";
const KEY_AVATAR = "profile.avatar";
const KEY_GAME_FPS = "game.fps";
const KEY_GAME_QUALITY = "game.quality";
const KEY_GAME_INPUT = "game.inputMode";

const KEY_EQUIP_SKIN = "profile.equip.skin";
const KEY_EQUIP_BADGE = "profile.equip.badge";

/* ===== Progress / XP (MVP) ===== */
const KEY_GUEST_ID = "guest.id";
const KEY_XP = "progress.xp";
const KEY_XP_TOTAL_EVENTS = "progress.xp.events.total";
const XP_EVENT_PREFIX = "progress.xp.cooldown.";

type Tier = "Bronze" | "Silver" | "Crown";

type Progress = {
  guestId: string;
  xp: number;
  level: number;
  tier: Tier;
  levelXp: number; // xp inside current level
  levelNeed: number; // xp needed to next level
};

type ApiProgress = {
  xp?: number;
  level?: number;
  tier?: Tier | string;
  guestId?: string;
};

const AVATARS: { id: string; label: string; bg: string }[] = [
  { id: "0", label: "Aurora", bg: "linear-gradient(135deg, rgba(94,234,212,0.95), rgba(99,102,241,0.95))" },
  { id: "1", label: "Neon", bg: "linear-gradient(135deg, rgba(251,113,133,0.95), rgba(147,51,234,0.95))" },
  { id: "2", label: "Ocean", bg: "linear-gradient(135deg, rgba(56,189,248,0.95), rgba(34,197,94,0.95))" },
  { id: "3", label: "Solar", bg: "linear-gradient(135deg, rgba(245,158,11,0.95), rgba(239,68,68,0.95))" },
  { id: "4", label: "Steel", bg: "linear-gradient(135deg, rgba(148,163,184,0.95), rgba(71,85,105,0.95))" },
  { id: "5", label: "Royal", bg: "linear-gradient(135deg, rgba(99,102,241,0.95), rgba(236,72,153,0.95))" },
  { id: "6", label: "Mint", bg: "linear-gradient(135deg, rgba(16,185,129,0.95), rgba(59,130,246,0.95))" },
  { id: "7", label: "Night", bg: "linear-gradient(135deg, rgba(2,6,23,0.95), rgba(30,64,175,0.95))" },
];

function getString(key: string, fallback = "") {
  return userStorage.getString(key, fallback) || fallback;
}

function setString(key: string, value: string) {
  userStorage.setString(key, value);
}

function getBool(key: string, fallback: boolean) {
  const v = getString(key, fallback ? "1" : "0");
  return v === "1";
}

function setBool(key: string, v: boolean) {
  setString(key, v ? "1" : "0");
}

function clampStr(s: string, max: number) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) : t;
}

/* ===== Progress helpers ===== */

function getOrCreateGuestId(): string {
  const existing = getString(KEY_GUEST_ID, "");
  if (existing) return existing;

  let id = "";
  try {
    // Safari поддерживает crypto.randomUUID на новых версиях
    // но держим fallback на всякий
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyCrypto = crypto as any;
    if (anyCrypto?.randomUUID) id = anyCrypto.randomUUID();
  } catch {
    // ignore
  }
  if (!id) id = `g_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;

  setString(KEY_GUEST_ID, id);
  return id;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function getXp(): number {
  const raw = getString(KEY_XP, "0");
  const n = Number(raw);
  return Number.isFinite(n) ? clampInt(n, 0, 2_000_000_000) : 0;
}

function setXp(xp: number) {
  setString(KEY_XP, String(clampInt(xp, 0, 2_000_000_000)));
}

function tierFromXp(xp: number): Tier {
  // Порог можно менять позже в одном месте
  if (xp >= 8000) return "Crown";
  if (xp >= 2500) return "Silver";
  return "Bronze";
}

/**
 * Математика уровня: дешёвая, стабильная, без зависимости от backend.
 * XP per level растёт плавно.
 */
function levelFromXp(xp: number) {
  // базовый шаг уровня (можно тюнить)
  const base = 250;
  const level = Math.max(1, Math.floor(Math.sqrt(xp / base)) + 1);
  const prevNeed = (level - 1) * (level - 1) * base;
  const nextNeed = level * level * base;
  const inside = Math.max(0, xp - prevNeed);
  const need = Math.max(1, nextNeed - prevNeed);
  return { level, inside, need };
}

function buildProgress(xp: number): Progress {
  const guestId = getOrCreateGuestId();
  const { level, inside, need } = levelFromXp(xp);
  const tier = tierFromXp(xp);
  return { guestId, xp, level, tier, levelXp: inside, levelNeed: need };
}

function getCooldownKey(event: string) {
  return `${XP_EVENT_PREFIX}${event}`;
}

function nowMs() {
  return Date.now();
}

function canAward(event: string, cooldownMs: number) {
  const k = getCooldownKey(event);
  const last = Number(getString(k, "0"));
  if (!Number.isFinite(last) || last <= 0) return true;
  return nowMs() - last >= cooldownMs;
}

function markAward(event: string) {
  setString(getCooldownKey(event), String(nowMs()));
}

async function postXpEvent(event: string) {
  try {
    const res = await fetch("/api/user/xp", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ event }),
      credentials: "include",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ApiProgress;
    if (typeof json?.xp === "number" && Number.isFinite(json.xp)) {
      return buildProgress(json.xp);
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchProgress(): Promise<Progress | null> {
  try {
    const res = await fetch("/api/user/progress", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ApiProgress;
    if (typeof json?.xp === "number" && Number.isFinite(json.xp)) {
      // tier/level можно доверять частично, но для консистентности считаем сами
      return buildProgress(json.xp);
    }
    return null;
  } catch {
    return null;
  }
}

function Pill(props: { children: React.ReactNode; tone?: "soft" | "accent" }) {
  const tone = props.tone ?? "soft";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        border: tone === "accent" ? "1px solid rgba(255,255,255,0.16)" : "1px solid rgba(255,255,255,0.10)",
        background: tone === "accent" ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.86)",
        fontWeight: 900,
        fontSize: 12,
        letterSpacing: "0.02em",
      }}
    >
      {props.children}
    </span>
  );
}

function Card(props: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="glassStrong bc-motion"
      style={{
        borderRadius: 22,
        padding: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 34px 120px rgba(0,0,0,0.30)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontWeight: 980, fontSize: 16, letterSpacing: "-0.01em" }}>{props.title}</div>
        {props.right}
      </div>
      <div style={{ marginTop: 12 }}>{props.children}</div>
    </div>
  );
}

function LabelRow(props: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
        <div style={{ fontWeight: 950 }}>{props.label}</div>
        {props.hint ? <div style={{ opacity: 0.72, fontWeight: 850, fontSize: 12 }}>{props.hint}</div> : null}
      </div>
      {props.children}
    </div>
  );
}

function Segmented(props: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        borderRadius: 16,
        padding: 8,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.16)",
      }}
    >
      {props.options.map((o) => {
        const active = o.value === props.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => props.onChange(o.value)}
            style={{
              height: 40,
              padding: "0 12px",
              borderRadius: 12,
              border: active ? "1px solid rgba(255,255,255,0.16)" : "1px solid rgba(255,255,255,0.08)",
              background: active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
              color: "var(--text)",
              fontWeight: 950,
              cursor: "pointer",
              outline: "none",
            }}
            aria-pressed={active}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function TierBadge(props: { tier: Tier }) {
  const { tier } = props;
  const text =
    tier === "Crown" ? "Crown" : tier === "Silver" ? "Silver" : "Bronze";

  const glow =
    tier === "Crown"
      ? "0 0 18px rgba(255,106,0,0.40)"
      : tier === "Silver"
      ? "0 0 18px rgba(180,210,255,0.32)"
      : "0 0 16px rgba(255,170,90,0.26)";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.90)",
        fontWeight: 950,
        fontSize: 12,
        letterSpacing: "0.02em",
        textShadow: glow,
      }}
    >
      {text}
    </span>
  );
}

function ProgressBar(props: { value: number; max: number }) {
  const ratio = props.max <= 0 ? 0 : Math.max(0, Math.min(1, props.value / props.max));
  return (
    <div
      aria-label="Прогресс уровня"
      style={{
        height: 10,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.18)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.round(ratio * 100)}%`,
          background: "linear-gradient(90deg, rgba(90,180,255,0.85), rgba(255,106,0,0.70))",
          borderRadius: 999,
          transform: "translateZ(0)",
        }}
      />
    </div>
  );
}

export function Account() {
  // --- profile ---
  const [nick, setNick] = React.useState(() => getString(KEY_NICK, ""));
  const [status, setStatus] = React.useState(() => getString(KEY_STATUS, ""));
  const [avatarId, setAvatarId] = React.useState(() => getString(KEY_AVATAR, "0"));

  // --- prefs ---
  const [reducedMotion, setReducedMotionUI] = React.useState(() => getReducedMotion());
  const [fps, setFps] = React.useState(() => getBool(KEY_GAME_FPS, false));
  const [quality, setQuality] = React.useState(() => getString(KEY_GAME_QUALITY, "high"));
  const [inputMode, setInputMode] = React.useState(() => getString(KEY_GAME_INPUT, "auto"));

  // --- equipment ---
  const [equipSkin, setEquipSkin] = React.useState(() => getString(KEY_EQUIP_SKIN, ""));
  const [equipBadge, setEquipBadge] = React.useState(() => getString(KEY_EQUIP_BADGE, ""));

  // --- store ---
  const [items] = React.useState<StoreItem[]>(() => getStoreItems());
  const [store, setStore] = React.useState(() => {
    ensureStoreInit();
    return getStoreState();
  });

  // --- progress ---
  const [progress, setProgress] = React.useState<Progress>(() => buildProgress(getXp()));

  const [savedPulse, setSavedPulse] = React.useState(0);

  const ownedSet = React.useMemo(() => new Set(store.owned), [store.owned]);
  const ownedItems = React.useMemo(() => items.filter((x) => ownedSet.has(x.id)), [items, ownedSet]);

  const avatar = React.useMemo(() => AVATARS.find((a) => a.id === avatarId) ?? AVATARS[0], [avatarId]);
  const initials = React.useMemo(() => clampStr(nick || "Игрок", 2).toUpperCase(), [nick]);

  const equippedSkinItem = React.useMemo(() => {
    if (!equipSkin) return null;
    if (!ownedSet.has(equipSkin)) return null;
    return items.find((x) => x.id === equipSkin) ?? null;
  }, [equipSkin, ownedSet, items]);

  const equippedBadgeItem = React.useMemo(() => {
    if (!equipBadge) return null;
    if (!ownedSet.has(equipBadge)) return null;
    return items.find((x) => x.id === equipBadge) ?? null;
  }, [equipBadge, ownedSet, items]);

  const avatarBg = React.useMemo(() => {
    if (equippedSkinItem && equippedSkinItem.category === "skins") {
      return `${equippedSkinItem.art.glow}, ${equippedSkinItem.art.gradient}`;
    }
    return avatar.bg;
  }, [equippedSkinItem, avatar.bg]);

  const pulseSaved = React.useCallback(() => setSavedPulse((x) => x + 1), []);

  const refreshStore = React.useCallback(() => {
    setStore(getStoreState());
  }, []);

  const refreshProgressLocal = React.useCallback(() => {
    setProgress(buildProgress(getXp()));
  }, []);

  const awardXp = React.useCallback(
    async (event: string, xpAdd: number, cooldownMs: number) => {
      if (!canAward(event, cooldownMs)) return;

      // Сначала пробуем сервер (если есть)
      const server = await postXpEvent(event);
      if (server) {
        markAward(event);
        setProgress(server);
        return;
      }

      // Локальный fallback
      const before = getXp();
      const next = before + xpAdd;
      setXp(next);

      // счетчик событий (не обязателен, но пригодится для анти-спама/аналитики позже)
      const total = Number(getString(KEY_XP_TOTAL_EVENTS, "0"));
      const safeTotal = Number.isFinite(total) ? total + 1 : 1;
      setString(KEY_XP_TOTAL_EVENTS, String(safeTotal));

      markAward(event);
      setProgress(buildProgress(next));
    },
    []
  );

  React.useEffect(() => {
    window.addEventListener("focus", refreshStore);
    window.addEventListener("popstate", refreshStore);
    return () => {
      window.removeEventListener("focus", refreshStore);
      window.removeEventListener("popstate", refreshStore);
    };
  }, [refreshStore]);

  // подтягиваем прогресс с сервера, если он есть (иначе остаётся локальный)
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const p = await fetchProgress();
      if (!alive) return;
      if (p) setProgress(p);
      else refreshProgressLocal();
    })();
    return () => {
      alive = false;
    };
  }, [refreshProgressLocal]);

  // MVP начисление XP за визит аккаунта (редко)
  React.useEffect(() => {
    awardXp("visit_account", 12, 12 * 60 * 60 * 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = React.useCallback(() => {
    const n = clampStr(nick, 18);
    const s = clampStr(status, 64);
    setNick(n);
    setStatus(s);
    setString(KEY_NICK, n);
    setString(KEY_STATUS, s);
    setString(KEY_AVATAR, avatarId);
    pulseSaved();

    // XP: за сохранение профиля (редко)
    awardXp("save_profile", 18, 10 * 60 * 1000);
  }, [nick, status, avatarId, pulseSaved, awardXp]);

  const resetProfile = React.useCallback(() => {
    setNick("");
    setStatus("");
    setAvatarId("0");
    setEquipSkin("");
    setEquipBadge("");
    setString(KEY_NICK, "");
    setString(KEY_STATUS, "");
    setString(KEY_AVATAR, "0");
    setString(KEY_EQUIP_SKIN, "");
    setString(KEY_EQUIP_BADGE, "");
    pulseSaved();
  }, [pulseSaved]);

  const savePrefs = React.useCallback(
    (next: { reducedMotion?: boolean; fps?: boolean; quality?: string; inputMode?: string }) => {
      if (typeof next.reducedMotion === "boolean") {
        setReducedMotion(next.reducedMotion);
        setReducedMotionUI(next.reducedMotion);
      }
      if (typeof next.fps === "boolean") {
        setBool(KEY_GAME_FPS, next.fps);
        setFps(next.fps);
      }
      if (typeof next.quality === "string") {
        setString(KEY_GAME_QUALITY, next.quality);
        setQuality(next.quality);
      }
      if (typeof next.inputMode === "string") {
        setString(KEY_GAME_INPUT, next.inputMode);
        setInputMode(next.inputMode);
      }
      pulseSaved();

      // XP: за настройку (с anti-spam)
      awardXp("save_prefs", 10, 7 * 60 * 1000);
    },
    [pulseSaved, awardXp]
  );

  const equip = React.useCallback(
    (item: StoreItem) => {
      if (!ownedSet.has(item.id)) return;

      if (item.category === "skins") {
        setEquipSkin(item.id);
        setString(KEY_EQUIP_SKIN, item.id);
        pulseSaved();
        awardXp("equip_skin", 6, 5 * 60 * 1000);
        return;
      }

      if (item.category === "badges") {
        setEquipBadge(item.id);
        setString(KEY_EQUIP_BADGE, item.id);
        pulseSaved();
        awardXp("equip_badge", 6, 5 * 60 * 1000);
        return;
      }
    },
    [ownedSet, pulseSaved, awardXp]
  );

  const unequip = React.useCallback(
    (kind: "skin" | "badge") => {
      if (kind === "skin") {
        setEquipSkin("");
        setString(KEY_EQUIP_SKIN, "");
        pulseSaved();
        return;
      }
      setEquipBadge("");
      setString(KEY_EQUIP_BADGE, "");
      pulseSaved();
    },
    [pulseSaved]
  );

  return (
    <main className="bcSiteRoot">
      <section className="bcHero" style={{ minHeight: "auto" }}>
        <div className="bcHeroBg" aria-hidden="true">
          <img className="bcHeroAurora" alt="" src={HeroArt.aurora} />
          <div className="bcHeroVignette" />
          <div className="bcHeroNoise" style={{ backgroundImage: `url(${HeroArt.noise})` }} />
        </div>

        <SiteHeader showLobby={true} showStoreButton={false} showAccountPill={true} />

        <div style={{ maxWidth: 980, margin: "0 auto", padding: "18px 14px 14px" }}>
          <div className="glassStrong" style={{ borderRadius: 22, padding: 18 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Pill tone="accent">Аккаунт</Pill>
              <Pill>Коллекция</Pill>
              <Pill>Настройки</Pill>
              <Pill>
                <span style={{ opacity: 0.82 }}>Баланс:</span> {formatCoins(store.balance)}
              </Pill>

              <Pill tone="accent">
                Level <span style={{ opacity: 0.9 }}>{progress.level}</span>
              </Pill>
              <TierBadge tier={progress.tier} />
              <Pill>
                <span style={{ opacity: 0.82 }}>XP:</span> {progress.xp}
              </Pill>

              {equippedSkinItem ? (
                <Pill tone="accent">
                  Skin: <span style={{ opacity: 0.9 }}>{equippedSkinItem.title}</span>
                </Pill>
              ) : null}

              {equippedBadgeItem ? (
                <Pill tone="accent">
                  Badge: <span style={{ opacity: 0.9 }}>{equippedBadgeItem.title}</span>
                </Pill>
              ) : null}
            </div>

            <h1 className="bcH1" style={{ marginTop: 12 }}>
              Аккаунт
              <br />
              BlackCrown
            </h1>

            <p className="bcLead" style={{ marginTop: 10 }}>
              Профиль, статус, настройки, прогресс и коллекция из магазина. Всё хранится локально.
            </p>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ opacity: 0.82, fontWeight: 900 }}>
                  До следующего уровня: {Math.max(0, progress.levelNeed - progress.levelXp)} XP
                </div>
                <div style={{ opacity: 0.72, fontWeight: 850, fontSize: 12 }}>
                  Guest ID: {progress.guestId.slice(0, 8)}
                </div>
              </div>
              <ProgressBar value={progress.levelXp} max={progress.levelNeed} />
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="primary" onClick={saveProfile}>
                Сохранить
              </Button>
              <Button variant="secondary" onClick={() => nav("/store")}>
                Открыть магазин
              </Button>
              <Button variant="secondary" onClick={openTelegramBot}>
                AI-Coach в Telegram
              </Button>
              <Button variant="ghost" onClick={() => nav("/support")}>
                Поддержка
              </Button>
            </div>

            <div aria-live="polite" style={{ marginTop: 10, opacity: 0.72, fontWeight: 850, fontSize: 12 }} key={savedPulse}>
              {savedPulse > 0 ? "Сохранено" : ""}
            </div>
          </div>
        </div>
      </section>

      <section className="bcSection" style={{ paddingTop: 10 }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 14px" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1.05fr 0.95fr" as any }}>
              <Card
                title="Профиль"
                right={
                  <Button variant="ghost" onClick={resetProfile}>
                    Очистить
                  </Button>
                }
              >
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                    <div
                      aria-label="Аватар"
                      style={{
                        width: 66,
                        height: 66,
                        borderRadius: 20,
                        background: avatarBg,
                        border: "1px solid rgba(255,255,255,0.12)",
                        boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                        display: "grid",
                        placeItems: "center",
                        color: "rgba(255,255,255,0.92)",
                        fontWeight: 980,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {initials.slice(0, 2)}
                    </div>

                    <div style={{ display: "grid", gap: 6, minWidth: 220, flex: "1 1 260px" }}>
                      <LabelRow label="Никнейм" hint="до 18 символов">
                        <input
                          value={nick}
                          onChange={(e) => setNick(clampStr(e.target.value, 18))}
                          placeholder="Введите никнейм"
                          autoComplete="nickname"
                          inputMode="text"
                          style={{
                            width: "100%",
                            height: 46,
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.06)",
                            color: "var(--text)",
                            padding: "0 12px",
                            outline: "none",
                            fontWeight: 900,
                          }}
                        />
                      </LabelRow>

                      <LabelRow label="Статус" hint="до 64 символов">
                        <input
                          value={status}
                          onChange={(e) => setStatus(clampStr(e.target.value, 64))}
                          placeholder="Короткая подпись"
                          inputMode="text"
                          style={{
                            width: "100%",
                            height: 46,
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.06)",
                            color: "var(--text)",
                            padding: "0 12px",
                            outline: "none",
                            fontWeight: 900,
                          }}
                        />
                      </LabelRow>
                    </div>
                  </div>

                  <LabelRow label="База аватара" hint="локальная палитра">
                    <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                      {AVATARS.map((a) => {
                        const active = a.id === avatarId;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              setAvatarId(a.id);
                              setString(KEY_AVATAR, a.id);
                              pulseSaved();
                              awardXp("pick_avatar", 6, 10 * 60 * 1000);
                            }}
                            aria-label={`Аватар ${a.label}`}
                            style={{
                              height: 46,
                              borderRadius: 14,
                              border: active ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.10)",
                              background: a.bg,
                              cursor: "pointer",
                              boxShadow: active ? "0 16px 44px rgba(0,0,0,0.38)" : "none",
                              outline: "none",
                            }}
                          />
                        );
                      })}
                    </div>
                  </LabelRow>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button variant="primary" onClick={saveProfile}>
                      Сохранить профиль
                    </Button>
                    <Button variant="secondary" onClick={() => navExternal("/game/")}>
                      В игру
                    </Button>
                    <Button variant="ghost" onClick={() => navExternal("/lobby/")}>
                      В Lobby
                    </Button>
                  </div>
                </div>
              </Card>

              <Card title="Настройки">
                <div style={{ display: "grid", gap: 14 }}>
                  <LabelRow label="Анимации" hint="комфортный режим">
                    <Segmented
                      value={reducedMotion ? "reduce" : "full"}
                      options={[
                        { value: "full", label: "Полные" },
                        { value: "reduce", label: "Мягкие" },
                      ]}
                      onChange={(v) => savePrefs({ reducedMotion: v === "reduce" })}
                    />
                  </LabelRow>

                  <LabelRow label="FPS counter в игре" hint="по умолчанию выключен">
                    <Segmented
                      value={fps ? "on" : "off"}
                      options={[
                        { value: "off", label: "Off" },
                        { value: "on", label: "On" },
                      ]}
                      onChange={(v) => savePrefs({ fps: v === "on" })}
                    />
                  </LabelRow>

                  <LabelRow label="Качество" hint="для контейнера игры">
                    <Segmented
                      value={quality}
                      options={[
                        { value: "low", label: "Low" },
                        { value: "med", label: "Med" },
                        { value: "high", label: "High" },
                      ]}
                      onChange={(v) => savePrefs({ quality: v })}
                    />
                  </LabelRow>

                  <LabelRow label="Input mode" hint="для игры">
                    <Segmented
                      value={inputMode}
                      options={[
                        { value: "auto", label: "Auto" },
                        { value: "touch", label: "Touch" },
                        { value: "gamepad", label: "Gamepad" },
                      ]}
                      onChange={(v) => savePrefs({ inputMode: v })}
                    />
                  </LabelRow>
                </div>
              </Card>
            </div>

            <Card
              title="Коллекция"
              right={
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button variant="secondary" onClick={() => nav("/store")}>
                    В магазин
                  </Button>
                  <Button variant="ghost" onClick={refreshStore}>
                    Обновить
                  </Button>
                </div>
              }
            >
              {ownedItems.length === 0 ? (
                <div style={{ opacity: 0.86, lineHeight: 1.55, fontWeight: 850 }}>
                  Коллекция пуста. Открой магазин и получи предметы — они появятся здесь.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button variant="secondary" onClick={() => unequip("skin")}>
                      Снять Skin
                    </Button>
                    <Button variant="secondary" onClick={() => unequip("badge")}>
                      Снять Badge
                    </Button>
                    <Button variant="secondary" onClick={openTelegramBot}>
                      AI-Coach
                    </Button>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {ownedItems.slice(0, 24).map((it) => {
                      const isSkin = it.category === "skins";
                      const isBadge = it.category === "badges";
                      const isActive = (isSkin && it.id === equipSkin) || (isBadge && it.id === equipBadge);

                      return (
                        <div
                          key={it.id}
                          className="bc-motion"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            padding: 12,
                            borderRadius: 18,
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: "rgba(0,0,0,0.16)",
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ display: "flex", gap: 12, alignItems: "center", flex: "1 1 280px" }}>
                            <div
                              style={{
                                width: 46,
                                height: 46,
                                borderRadius: 16,
                                border: "1px solid rgba(255,255,255,0.12)",
                                backgroundImage: `${it.art.glow}, ${it.art.gradient}`,
                                boxShadow: "0 18px 52px rgba(0,0,0,0.35)",
                              }}
                            />

                            <div style={{ display: "grid", gap: 4 }}>
                              <div style={{ fontWeight: 980 }}>{it.title}</div>

                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                <span style={{ fontWeight: 900, color: rarityAccent(it.rarity) }}>{rarityLabel(it.rarity)}</span>
                                <span style={{ opacity: 0.78, fontWeight: 850 }}>{isSkin ? "Skin" : isBadge ? "Badge" : "Bundle"}</span>
                                {isActive ? <Pill tone="accent">Активно</Pill> : null}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {isSkin || isBadge ? (
                              <Button
                                variant={isActive ? "secondary" : "primary"}
                                onClick={() => {
                                  if (!isActive) equip(it);
                                }}
                              >
                                {isActive ? "Активно" : "Применить"}
                              </Button>
                            ) : (
                              <Button variant="secondary" onClick={() => nav("/store")}>
                                Открыть
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>

            <Card title="Сервисы">
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ opacity: 0.86, lineHeight: 1.55, fontWeight: 850 }}>
                  AI-Coach в Telegram помогает с прогрессом, механиками и стратегиями.
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button variant="primary" onClick={openTelegramBot}>
                    Открыть AI-Coach
                  </Button>
                  <Button variant="secondary" onClick={() => nav("/store")}>
                    Магазин
                  </Button>
                  <Button variant="ghost" onClick={() => nav("/about")}>
                    О платформе
                  </Button>
                </div>
              </div>
            </Card>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", opacity: 0.78 }}>
              <a className="bcLink" href="/privacy">
                Privacy
              </a>
              <a className="bcLink" href="/terms">
                Terms
              </a>
              <a className="bcLink" href="/support">
                Поддержка
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Account;
