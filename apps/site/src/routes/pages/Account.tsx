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

  React.useEffect(() => {
    window.addEventListener("focus", refreshStore);
    window.addEventListener("popstate", refreshStore);
    return () => {
      window.removeEventListener("focus", refreshStore);
      window.removeEventListener("popstate", refreshStore);
    };
  }, [refreshStore]);

  const saveProfile = React.useCallback(() => {
    const n = clampStr(nick, 18);
    const s = clampStr(status, 64);
    setNick(n);
    setStatus(s);
    setString(KEY_NICK, n);
    setString(KEY_STATUS, s);
    setString(KEY_AVATAR, avatarId);
    pulseSaved();
  }, [nick, status, avatarId, pulseSaved]);

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
    },
    [pulseSaved]
  );

  const equip = React.useCallback(
    (item: StoreItem) => {
      if (!ownedSet.has(item.id)) return;

      if (item.category === "skins") {
        setEquipSkin(item.id);
        setString(KEY_EQUIP_SKIN, item.id);
        pulseSaved();
        return;
      }

      if (item.category === "badges") {
        setEquipBadge(item.id);
        setString(KEY_EQUIP_BADGE, item.id);
        pulseSaved();
        return;
      }
    },
    [ownedSet, pulseSaved]
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
              Профиль, статус, настройки и коллекция из магазина. Всё хранится локально.
            </p>

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
