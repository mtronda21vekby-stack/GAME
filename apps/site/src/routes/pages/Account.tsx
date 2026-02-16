import React from "react";
import { Button, Modal } from "@blackcrown/ui";
import { Icons, HeroArt } from "@blackcrown/assets";
import { userStorage } from "@blackcrown/core";
import { openTelegramBot } from "../../lib/telegram";
import { getReducedMotion, setReducedMotion } from "../../lib/prefs";

function nav(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

function navExternal(path: string) {
  window.location.assign(path);
}

const KEY_NICK = "nickname";
const KEY_STATUS = "profile.status";
const KEY_AVATAR = "profile.avatar";
const KEY_AVATAR_IMG = "profile.avatarImage";
const KEY_PROFILE_UPDATED = "profile.updatedAt";

const KEY_GAME_FPS = "game.fps";
const KEY_GAME_QUALITY = "game.quality";
const KEY_GAME_INPUT = "game.inputMode";

const TG_BOT_URL = "https://t.me/GGBF6_WARZON_BOT";

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

function nowTs() {
  return Date.now();
}

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

function formatSavedAt(ts: number) {
  if (!ts) return "";
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // ignore
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function Pill(props: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.82)",
        fontWeight: 850,
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

type ProfileExport = {
  v: 1;
  nickname: string;
  status: string;
  avatarId: string;
  avatarImage?: string;
  updatedAt: number;
  prefs: {
    reducedMotion: boolean;
    gameFps: boolean;
    gameQuality: string;
    gameInputMode: string;
  };
};

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function Account() {
  const [isWide, setIsWide] = React.useState(() => {
    try {
      return window.matchMedia?.("(min-width: 980px)")?.matches ?? true;
    } catch {
      return true;
    }
  });

  React.useEffect(() => {
    let mql: MediaQueryList | null = null;
    try {
      mql = window.matchMedia?.("(min-width: 980px)") ?? null;
    } catch {
      mql = null;
    }
    if (!mql) return;

    const onChange = () => setIsWide(mql!.matches);

    // Safari fallback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyMql = mql as any;
    if (anyMql.addEventListener) anyMql.addEventListener("change", onChange);
    else anyMql.addListener?.(onChange);

    setIsWide(mql.matches);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyMql2 = mql as any;
      if (anyMql2.removeEventListener) anyMql2.removeEventListener("change", onChange);
      else anyMql2.removeListener?.(onChange);
    };
  }, []);

  const [nick, setNick] = React.useState(() => getString(KEY_NICK, ""));
  const [status, setStatus] = React.useState(() => getString(KEY_STATUS, ""));
  const [avatarId, setAvatarId] = React.useState(() => getString(KEY_AVATAR, "0"));
  const [avatarImg, setAvatarImg] = React.useState(() => getString(KEY_AVATAR_IMG, ""));
  const [updatedAt, setUpdatedAt] = React.useState(() => Number(getString(KEY_PROFILE_UPDATED, "0")) || 0);

  const [reducedMotion, setReducedMotionUI] = React.useState(() => getReducedMotion());
  const [fps, setFps] = React.useState(() => getBool(KEY_GAME_FPS, false));
  const [quality, setQuality] = React.useState(() => getString(KEY_GAME_QUALITY, "high"));
  const [inputMode, setInputMode] = React.useState(() => getString(KEY_GAME_INPUT, "auto"));

  const [toast, setToast] = React.useState<string>("");
  const toastTimer = React.useRef<number | null>(null);

  const [exportOpen, setExportOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [importText, setImportText] = React.useState("");

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  }

  React.useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const avatar = AVATARS.find((a) => a.id === avatarId) ?? AVATARS[0];
  const baseName = clampStr(nick || "Игрок", 18);
  const initials = clampStr(baseName, 2).toUpperCase();
  const savedAt = formatSavedAt(updatedAt);

  function persistProfile(next: { nickname?: string; status?: string; avatarId?: string; avatarImg?: string }) {
    if (typeof next.nickname === "string") setString(KEY_NICK, next.nickname);
    if (typeof next.status === "string") setString(KEY_STATUS, next.status);
    if (typeof next.avatarId === "string") setString(KEY_AVATAR, next.avatarId);
    if (typeof next.avatarImg === "string") setString(KEY_AVATAR_IMG, next.avatarImg);

    const ts = nowTs();
    setString(KEY_PROFILE_UPDATED, String(ts));
    setUpdatedAt(ts);
  }

  function saveProfile() {
    const n = clampStr(nick, 18);
    const s = clampStr(status, 64);
    setNick(n);
    setStatus(s);
    persistProfile({ nickname: n, status: s, avatarId, avatarImg });
    showToast("Профиль сохранён");
  }

  function resetProfile() {
    setNick("");
    setStatus("");
    setAvatarId("0");
    setAvatarImg("");
    persistProfile({ nickname: "", status: "", avatarId: "0", avatarImg: "" });
    showToast("Профиль очищен");
  }

  function savePrefs(next: { reducedMotion?: boolean; fps?: boolean; quality?: string; inputMode?: string }) {
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
    showToast("Настройки сохранены");
  }

  function resetPrefs() {
    setReducedMotion(false);
    setReducedMotionUI(false);
    setBool(KEY_GAME_FPS, false);
    setFps(false);
    setString(KEY_GAME_QUALITY, "high");
    setQuality("high");
    setString(KEY_GAME_INPUT, "auto");
    setInputMode("auto");
    showToast("Настройки сброшены");
  }

  function buildExport(): ProfileExport {
    return {
      v: 1,
      nickname: clampStr(nick, 18),
      status: clampStr(status, 64),
      avatarId,
      avatarImage: avatarImg ? avatarImg : undefined,
      updatedAt: nowTs(),
      prefs: {
        reducedMotion: !!reducedMotion,
        gameFps: !!fps,
        gameQuality: quality || "high",
        gameInputMode: inputMode || "auto",
      },
    };
  }

  async function onCopyExport() {
    const payload = JSON.stringify(buildExport(), null, 2);
    const ok = await copyText(payload);
    showToast(ok ? "Экспорт скопирован" : "Не удалось скопировать");
  }

  function onApplyImport() {
    const parsed = safeJsonParse<ProfileExport>(importText);
    if (!parsed || parsed.v !== 1) {
      showToast("Неверный формат импорта");
      return;
    }

    const n = clampStr(parsed.nickname || "", 18);
    const s = clampStr(parsed.status || "", 64);
    const aId = typeof parsed.avatarId === "string" ? parsed.avatarId : "0";
    const aImg = typeof parsed.avatarImage === "string" ? parsed.avatarImage : "";

    setNick(n);
    setStatus(s);
    setAvatarId(aId);
    setAvatarImg(aImg);
    persistProfile({ nickname: n, status: s, avatarId: aId, avatarImg: aImg });

    const p = parsed.prefs || ({} as ProfileExport["prefs"]);
    if (typeof p.reducedMotion === "boolean") {
      setReducedMotion(p.reducedMotion);
      setReducedMotionUI(p.reducedMotion);
    }
    if (typeof p.gameFps === "boolean") {
      setBool(KEY_GAME_FPS, p.gameFps);
      setFps(p.gameFps);
    }
    if (typeof p.gameQuality === "string") {
      setString(KEY_GAME_QUALITY, p.gameQuality);
      setQuality(p.gameQuality);
    }
    if (typeof p.gameInputMode === "string") {
      setString(KEY_GAME_INPUT, p.gameInputMode);
      setInputMode(p.gameInputMode);
    }

    setImportOpen(false);
    setImportText("");
    showToast("Импорт применён");
  }

  async function onCopyTelegram() {
    const ok = await copyText(TG_BOT_URL);
    showToast(ok ? "Ссылка скопирована" : "Не удалось скопировать");
  }

  async function onPickAvatarImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Нужна картинка");
      return;
    }

    const maxBytes = 300 * 1024;
    if (file.size > maxBytes) {
      showToast("Файл слишком большой (до 300KB)");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = () => reject(new Error("read error"));
      r.readAsDataURL(file);
    }).catch(() => "");

    if (!dataUrl) {
      showToast("Не удалось загрузить");
      return;
    }

    setAvatarImg(dataUrl);
    persistProfile({ avatarImg: dataUrl });
    showToast("Аватар обновлён");
  }

  return (
    <main className="bcSiteRoot">
      <section className="bcHero" style={{ minHeight: "auto" }}>
        <div className="bcHeroBg" aria-hidden="true">
          <img className="bcHeroAurora" alt="" src={HeroArt.aurora} />
          <div className="bcHeroVignette" />
          <div className="bcHeroNoise" style={{ backgroundImage: `url(${HeroArt.noise})` }} />
        </div>

        <header className="bcTop">
          <button type="button" className="bcBrand" onClick={() => nav("/")} aria-label="BlackCrown Home">
            <img alt="" src={Icons.crown} width="20" height="20" />
            <div style={{ fontWeight: 950 }}>BlackCrown</div>
          </button>

          <nav className="bcNav" aria-label="Навигация">
            <a className="bcLink" href="/about">
              О проекте
            </a>
            <a className="bcLink" href="/support">
              Поддержка
            </a>
            <a className="bcLink" href="/privacy">
              Privacy
            </a>
            <a className="bcLink" href="/terms">
              Terms
            </a>
          </nav>

          <div className="bcRight">
            <Button variant="secondary" onClick={() => navExternal("/lobby/")}>
              Lobby
            </Button>
            <Button variant="primary" leftIconSrc={Icons.play} onClick={() => navExternal("/game/")}>
              Играть
            </Button>
          </div>
        </header>

        <div style={{ maxWidth: 980, margin: "0 auto", padding: "18px 14px 14px" }}>
          <div className="glassStrong" style={{ borderRadius: 22, padding: 18 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Pill>Профиль</Pill>
              <Pill>Настройки</Pill>
              <Pill>Сервисы</Pill>
              {savedAt ? <Pill>Сохранено: {savedAt}</Pill> : null}
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <div
                aria-label="Аватар"
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center",
                  background: avatar.bg,
                }}
              >
                {avatarImg ? (
                  <img alt="" src={avatarImg} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 980, letterSpacing: "0.02em" }}>{initials}</div>
                )}
              </div>

              <div style={{ display: "grid", gap: 6, minWidth: 220, flex: "1 1 360px" }}>
                <div style={{ fontWeight: 980, fontSize: 18, letterSpacing: "-0.01em" }}>{baseName || "Игрок"}</div>
                <div style={{ opacity: 0.82, fontWeight: 850, lineHeight: 1.35 }}>{status ? status : "Премиум-профиль BlackCrown"}</div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button variant="primary" onClick={saveProfile}>
                  Сохранить
                </Button>
                <Button variant="secondary" onClick={openTelegramBot}>
                  AI-Coach в Telegram
                </Button>
                <Button variant="ghost" onClick={() => nav("/support")}>
                  Поддержка
                </Button>
              </div>

              {toast ? (
                <div
                  aria-live="polite"
                  style={{
                    width: "100%",
                    marginTop: 6,
                    opacity: 0.78,
                    fontWeight: 850,
                    fontSize: 12,
                  }}
                >
                  {toast}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="bcSection" style={{ paddingTop: 10 }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 14px" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: isWide ? ("1.05fr 0.95fr" as const) : ("1fr" as const),
              }}
            >
              <Card title="Профиль" right={<Button variant="ghost" onClick={resetProfile}>Очистить</Button>}>
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={{ display: "grid", gap: 10 }}>
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

                  <LabelRow label="Аватар" hint="градиент или картинка">
                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                        {AVATARS.map((a) => {
                          const active = a.id === avatarId && !avatarImg;
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => {
                                setAvatarId(a.id);
                                setAvatarImg("");
                                persistProfile({ avatarId: a.id, avatarImg: "" });
                                showToast("Аватар обновлён");
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

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <label
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "10px 12px",
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: "rgba(255,255,255,0.06)",
                            cursor: "pointer",
                            fontWeight: 900,
                            color: "var(--text)",
                          }}
                        >
                          Загрузить картинку
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => onPickAvatarImage(e.target.files?.[0] ?? null)}
                          />
                        </label>

                        {avatarImg ? (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setAvatarImg("");
                              persistProfile({ avatarImg: "" });
                              showToast("Картинка удалена");
                            }}
                          >
                            Убрать картинку
                          </Button>
                        ) : null}

                        <div style={{ opacity: 0.72, fontWeight: 850, fontSize: 12 }}>до 300KB</div>
                      </div>
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

              <Card
                title="Настройки"
                right={
                  <Button variant="ghost" onClick={resetPrefs}>
                    Сбросить
                  </Button>
                }
              >
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

            <Card title="Сервисы">
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ opacity: 0.86, lineHeight: 1.55, fontWeight: 850 }}>
                  AI-Coach в Telegram помогает с прогрессом, механиками и стратегиями. На телефоне откроется Telegram, на ПК/Xbox —
                  веб-версия.
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button variant="primary" onClick={openTelegramBot}>
                    Открыть AI-Coach
                  </Button>
                  <Button variant="secondary" onClick={onCopyTelegram}>
                    Скопировать ссылку
                  </Button>
                  <Button variant="ghost" onClick={() => nav("/about")}>
                    О платформе
                  </Button>
                </div>
              </div>
            </Card>

            <Card title="Данные">
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ opacity: 0.86, lineHeight: 1.55, fontWeight: 850 }}>
                  Экспорт/импорт профиля и настроек — чтобы быстро переносить конфиг между устройствами.
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button variant="secondary" onClick={() => setExportOpen(true)}>
                    Экспорт
                  </Button>
                  <Button variant="secondary" onClick={() => setImportOpen(true)}>
                    Импорт
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      resetPrefs();
                      resetProfile();
                    }}
                  >
                    Сбросить всё
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Modal open={exportOpen} title="Экспорт" onClose={() => setExportOpen(false)}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ opacity: 0.86, fontWeight: 850, lineHeight: 1.5 }}>
            Скопируй JSON и сохрани. Его можно импортировать на другом устройстве.
          </div>
          <textarea
            readOnly
            value={JSON.stringify(buildExport(), null, 2)}
            style={{
              width: "100%",
              minHeight: 220,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.22)",
              color: "var(--text)",
              padding: 12,
              outline: "none",
              fontWeight: 850,
              lineHeight: 1.35,
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Button variant="ghost" onClick={() => setExportOpen(false)}>
              Закрыть
            </Button>
            <Button variant="primary" onClick={onCopyExport}>
              Скопировать
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={importOpen} title="Импорт" onClose={() => setImportOpen(false)}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ opacity: 0.86, fontWeight: 850, lineHeight: 1.5 }}>
            Вставь JSON экспорта. Профиль и настройки будут заменены.
          </div>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{"v":1,...}'
            style={{
              width: "100%",
              minHeight: 220,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.22)",
              color: "var(--text)",
              padding: 12,
              outline: "none",
              fontWeight: 850,
              lineHeight: 1.35,
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Button variant="ghost" onClick={() => setImportOpen(false)}>
              Отмена
            </Button>
            <Button variant="primary" onClick={onApplyImport}>
              Применить
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
