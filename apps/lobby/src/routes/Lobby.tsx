// apps/lobby/src/routes/Lobby.tsx
import React from "react";
import { userStorage } from "@blackcrown/core";

type HubMode = "next" | "classic";

type HubProfile = {
  nickname: string;
  level: number;
  xp: number;
  xpToNext: number;
  pearls: number;
  corals: number;
};

type NavItem = {
  label: string;
  path: string;
  icon: string;
  notify?: boolean;
};

type QuickAction = {
  label: string;
  subtitle: string;
  icon: string;
  path?: string;
  accent?: "cyan" | "gold" | "coral" | "pearl";
};

const SIDE_NAV_ITEMS: NavItem[] = [
  { label: "Магазин", path: "/game/skins?tab=shop", icon: "◇" },
  { label: "Скины", path: "/game/skins", icon: "◈" },
  { label: "Мутации", path: "/game/play?panel=mutations", icon: "✣" },
  { label: "Инвентарь", path: "/game/profiles", icon: "▣" },
  { label: "Квесты", path: "/game/progress?panel=quests", icon: "✦", notify: true },
  { label: "События", path: "/game/season", icon: "◎" },
  { label: "Крафт", path: "/game/play?panel=craft", icon: "⬡" },
];

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Лобби", path: "/lobby", icon: "◎" },
  { label: "Достижения", path: "/game/progress", icon: "✦" },
  { label: "Профиль", path: "/game/account", icon: "◉" },
];

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Сезон", subtitle: "Глубина I", icon: "◎", path: "/game/season", accent: "cyan" },
  { label: "Лидерборд", subtitle: "Топ 100", icon: "◇", path: "/game/leaderboard", accent: "gold" },
  { label: "Награда", subtitle: "Доступна", icon: "✦", path: "/game/season", accent: "pearl" },
  { label: "Скины", subtitle: "0 / 25", icon: "◈", path: "/game/skins", accent: "cyan" },
  { label: "Задания", subtitle: "0 / 10", icon: "✣", path: "/game/progress?panel=quests", accent: "coral" },
];

function nav(path: string) {
  window.location.assign(path);
}

function getNick() {
  return userStorage.getString("nickname", "") || "Игрок";
}

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
    pearls: 0,
    corals: 0,
  };

  try {
    const activeProfileId = (localStorage.getItem("evofish_next_active_profile_v1") || "main").trim() || "main";
    const activeSaveKey = activeProfileId === "main" ? "evofish_next_save_v1" : `evofish_next_save_v1__profile_${activeProfileId}`;
    const raw = localStorage.getItem(activeSaveKey) || localStorage.getItem("evofish_next_save_v1");
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

function modeTitle(mode: HubMode) {
  return mode === "next" ? "EvoFish Next" : "EvoFish Classic";
}

function formatCount(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function Lobby() {
  const [selectedMode, setSelectedMode] = React.useState<HubMode>("next");
  const [profile, setProfile] = React.useState<HubProfile>(() => readHubProfile(getNick()));

  React.useEffect(() => {
    const refreshProfile = () => setProfile(readHubProfile(getNick()));
    const onVisible = () => {
      if (!document.hidden) refreshProfile();
    };

    window.addEventListener("focus", refreshProfile);
    window.addEventListener("storage", refreshProfile);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("focus", refreshProfile);
      window.removeEventListener("storage", refreshProfile);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const playMode = React.useCallback((mode: HubMode) => {
    nav(launchPath(mode));
  }, []);

  return (
    <main className="bcSiteRoot">
      <LobbyStyles />
      <LobbyBackground />
      <LobbyAtmosphere />

      <div className="bcLobbyUiLayer">
        <section className="bcHub" aria-label="EvoFish lobby">
          <header className="hubTop">
            <PlayerPanel profile={profile} />
            <div className="hubTopActions">
              <CurrencyBar profile={profile} />
              <button className="hubSettingsButton" type="button" aria-label="Настройки">
                ⚙
              </button>
            </div>
          </header>

          <div className="hubShell">
            <SideNav items={SIDE_NAV_ITEMS} />

            <section className="hubCenter" aria-label="EvoFish Next">
              <div className="hubHero">
                <div className="hubHeroCopy">
                  <span className="hubEyebrow">ОКЕАНСКАЯ СТАНЦИЯ</span>
                  <h1>EvoFish Next</h1>
                </div>

                <FishSphere selectedMode={selectedMode} />

                <PrimaryPlayButton onClick={() => playMode(selectedMode)} />
              </div>
            </section>

            <aside className="hubRightRail" aria-label="Режимы и действия">
              <ModeSelector selectedMode={selectedMode} onSelect={setSelectedMode} onPlay={playMode} />
              <QuickActions items={QUICK_ACTIONS} />
            </aside>
          </div>

          <BottomNav items={BOTTOM_NAV_ITEMS} />
        </section>
      </div>
    </main>
  );
}

function LobbyBackground() {
  return <div className="hubStationBackdrop" aria-hidden="true" />;
}

function LobbyAtmosphere() {
  return (
    <div className="hubAtmosphere" aria-hidden="true">
      <div className="hubRays" />
      <div className="hubHaze" />
      <div className="hubBubbles hubBubblesA" />
      <div className="hubBubbles hubBubblesB" />
      <div className="hubParticles" />
      <div className="hubShimmer" />
    </div>
  );
}

function PlayerPanel({ profile }: { profile: HubProfile }) {
  const displayName = profile.nickname;
  const displayLevel = profile.level;
  const displayXp = profile.xp;
  const displayXpToNext = profile.xpToNext;
  const progress = progressPercent(displayXp, displayXpToNext);

  return (
    <section className="hubProfilePanel" aria-label="Профиль игрока">
      <div className="hubAvatar" aria-hidden="true">
        {displayName.slice(0, 1).toUpperCase()}
      </div>
      <div className="hubProfileText">
        <strong className="hubProfileName">{displayName}</strong>
        <span className="hubProfileMeta">
          LV {displayLevel} · XP {formatCount(displayXp)} / {formatCount(displayXpToNext)}
        </span>
        <div className="hubProgress" aria-label={`XP ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    </section>
  );
}

function CurrencyBar({ profile }: { profile: HubProfile }) {
  return (
    <section className="hubCurrencyBar" aria-label="Валюта">
      <CurrencyPill kind="pearl" label="Жемчуг" value={profile.pearls} />
      <CurrencyPill kind="coral" label="Коралл" value={profile.corals} />
    </section>
  );
}

function CurrencyPill({ kind, label, value }: { kind: "pearl" | "coral"; label: string; value: number }) {
  return (
    <div className={`hubCurrency is-${kind}`}>
      <i aria-hidden="true" />
      <span>
        <strong>{formatCount(value)}</strong>
        <em>{label}</em>
      </span>
    </div>
  );
}

function FishSphere({ selectedMode }: { selectedMode: HubMode }) {
  return (
    <div className="hubSphereStage">
      <div className="hubSphere" aria-hidden="true">
        <div className="hubSphereCaustics" />
        <div className="hubFish">
          <img
            src="/lobby/assets/fish/fish_standard.png"
            alt=""
            onError={(event) => {
              event.currentTarget.style.display = "none";
              event.currentTarget.parentElement?.classList.add("hasFallback");
            }}
          />
          <span className="hubFishFallback" />
        </div>
      </div>
      <div className="hubSphereCaption">{modeTitle(selectedMode)} · выбранный режим</div>
    </div>
  );
}

function PrimaryPlayButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="hubPrimaryPlayButton" type="button" onClick={onClick}>
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
    <section className="hubModes" aria-label="Режимы EvoFish">
      <ModeCard
        mode="next"
        title="EvoFish Next"
        subtitle="Новая версия"
        badge="РЕКОМЕНД."
        cta="Играть в Next"
        selected={selectedMode === "next"}
        featured
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
    </section>
  );
}

function ModeCard({
  mode,
  title,
  subtitle,
  badge,
  cta,
  selected,
  featured,
  onSelect,
  onPlay,
}: {
  mode: HubMode;
  title: string;
  subtitle: string;
  badge?: string;
  cta: string;
  selected: boolean;
  featured?: boolean;
  onSelect: (mode: HubMode) => void;
  onPlay: (mode: HubMode) => void;
}) {
  return (
    <article
      className={`hubModeCard ${featured ? "isFeatured" : ""} ${selected ? "isSelected" : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onSelect(mode)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(mode);
        }
      }}
    >
      <div className="hubModeHeader">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {badge ? <span className="hubModeBadge">{badge}</span> : null}
      </div>
      <button
        className="hubModeButton"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onSelect(mode);
          onPlay(mode);
        }}
      >
        {cta}
      </button>
    </article>
  );
}

function SideNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={`hubSectionMenu ${open ? "isOpen" : ""}`}>
      <button className="hubSectionMenuButton" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">☰</span>
        <strong>Разделы</strong>
      </button>
      {open ? (
        <div className="hubSectionMenuPanel" role="menu">
          {items.map((item) => (
            <button key={item.label} className="hubSectionMenuItem" type="button" role="menuitem" onClick={() => nav(item.path)}>
              <span aria-hidden="true">{item.icon}</span>
              <strong>{item.label}</strong>
              {item.notify ? <i aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function QuickActions({ items }: { items: QuickAction[] }) {
  return (
    <section className="hubQuickGrid" aria-label="Быстрые действия">
      {items.map((item) => (
        <QuickActionCard key={item.label} item={item} />
      ))}
    </section>
  );
}

function QuickActionCard({ item }: { item: QuickAction }) {
  const canNavigate = Boolean(item.path);

  return (
    <button
      className={`hubQuickCard is-${item.accent ?? "cyan"}`}
      type="button"
      onClick={() => {
        if (item.path) nav(item.path);
      }}
      aria-disabled={!canNavigate}
    >
      <span className="hubQuickIcon" aria-hidden="true">
        {item.icon}
      </span>
      <span className="hubQuickCopy">
        <strong>{item.label}</strong>
        <em>{item.subtitle}</em>
      </span>
    </button>
  );
}

function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="hubBottomNav" aria-label="Нижняя навигация">
      {items.map((item) => (
        <button
          key={item.label}
          className={`hubBottomNavButton ${item.label === "Лобби" ? "isActive" : ""}`}
          type="button"
          onClick={() => nav(item.path)}
        >
          <span aria-hidden="true">{item.icon}</span>
          <em>{item.label}</em>
        </button>
      ))}
    </nav>
  );
}

function LobbyStyles() {
  return (
    <style>{`
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
        --coral: #ff6b8f;
        --pearl: #dff8ff;
        position: relative;
        min-height: 100vh;
        min-height: 100dvh;
        overflow-x: hidden;
        color: var(--text);
        background:
          radial-gradient(ellipse at 50% 22%, rgba(53,216,255,.22), transparent 42%),
          linear-gradient(180deg, var(--bg-navy), var(--bg-deep));
        isolation: isolate;
      }

      .bcSiteRoot,
      .bcSiteRoot * {
        box-sizing: border-box;
      }

      .hubStationBackdrop {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background:
          radial-gradient(ellipse at 50% 24%, rgba(53,216,255,.08), transparent 34%),
          linear-gradient(90deg, rgba(2,9,21,.34), rgba(2,9,21,.04) 38%, rgba(2,9,21,.06) 62%, rgba(2,9,21,.38)),
          linear-gradient(180deg, rgba(2,9,21,.03) 0%, rgba(2,9,21,.12) 52%, rgba(2,9,21,.58) 100%),
          url("/lobby/assets/lobby/lobby-bg-station-16x9.png"),
          radial-gradient(ellipse at 50% 8%, rgba(53,216,255,.26), transparent 36%),
          linear-gradient(180deg, #061827 0%, #020915 100%);
        background-size: cover, cover, cover, cover, cover, cover;
        background-position: center center;
        transform: translateZ(0);
      }

      .hubAtmosphere {
        position: fixed;
        inset: 0;
        z-index: 1;
        overflow: hidden;
        pointer-events: none;
      }

      .hubRays {
        position: absolute;
        inset: -8% 0 auto 0;
        height: 62%;
        opacity: .48;
        background:
          conic-gradient(from 178deg at 50% 0%, transparent 0deg, rgba(53,216,255,.23) 7deg, transparent 15deg, rgba(223,248,255,.13) 21deg, transparent 31deg, rgba(53,216,255,.16) 38deg, transparent 48deg),
          radial-gradient(ellipse at 50% 0%, rgba(201,250,255,.38), transparent 56%);
        filter: blur(6px);
        mix-blend-mode: screen;
        animation: hubRayShift 10s ease-in-out infinite alternate;
      }

      .hubHaze {
        position: absolute;
        inset: auto -18% -24% -18%;
        height: 54%;
        opacity: .52;
        background:
          radial-gradient(ellipse at 50% 28%, rgba(53,216,255,.20), transparent 58%),
          linear-gradient(180deg, transparent, rgba(3,16,30,.82));
        filter: blur(20px);
        animation: hubHazeFloat 12s ease-in-out infinite alternate;
      }

      .hubBubbles {
        position: absolute;
        inset: 0;
        opacity: .36;
        background-image:
          radial-gradient(circle at 12% 86%, rgba(223,248,255,.54) 0 1px, rgba(53,216,255,.14) 2px 4px, transparent 5px),
          radial-gradient(circle at 74% 78%, rgba(223,248,255,.45) 0 1px, rgba(53,216,255,.12) 2px 5px, transparent 6px),
          radial-gradient(circle at 88% 92%, rgba(223,248,255,.42) 0 1px, rgba(53,216,255,.11) 2px 4px, transparent 5px);
        background-size: 290px 420px, 380px 520px, 250px 360px;
        animation: hubBubbleRise 18s linear infinite;
      }

      .hubBubblesB {
        opacity: .22;
        background-size: 420px 560px, 310px 450px, 520px 680px;
        animation-duration: 28s;
        animation-delay: -9s;
      }

      .hubParticles {
        position: absolute;
        inset: 0;
        opacity: .30;
        background-image:
          radial-gradient(circle at 16% 22%, rgba(223,248,255,.60) 0 1px, transparent 2px),
          radial-gradient(circle at 78% 24%, rgba(120,240,255,.50) 0 1px, transparent 2px),
          radial-gradient(circle at 62% 84%, rgba(255,255,255,.40) 0 1px, transparent 2px),
          radial-gradient(circle at 38% 66%, rgba(53,216,255,.42) 0 1px, transparent 2px);
        background-size: 280px 240px, 340px 300px, 300px 280px, 460px 390px;
        animation: hubParticleDrift 22s linear infinite;
      }

      .hubShimmer {
        position: absolute;
        inset: 0;
        opacity: .20;
        background:
          linear-gradient(115deg, transparent 0 38%, rgba(223,248,255,.10) 43%, transparent 48% 100%),
          linear-gradient(65deg, transparent 0 58%, rgba(53,216,255,.08) 63%, transparent 68% 100%);
        background-size: 520px 100%, 680px 100%;
        mix-blend-mode: screen;
        animation: hubShimmer 16s ease-in-out infinite;
      }

      .bcLobbyUiLayer {
        position: relative;
        z-index: 5;
        min-height: 100vh;
        min-height: 100dvh;
        pointer-events: auto;
      }

      .bcHub {
        width: min(1540px, 100%);
        min-height: 100vh;
        min-height: 100dvh;
        margin: 0 auto;
        padding: clamp(14px, 2vw, 28px);
        padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px));
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: clamp(10px, 1.5vw, 18px);
      }

      .hubTop {
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .hubTopActions {
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
      }

      .hubProfilePanel,
      .hubCurrencyBar,
      .hubSettingsButton,
      .hubSectionMenuButton,
      .hubSectionMenuPanel,
      .hubHero,
      .hubModeCard,
      .hubQuickCard,
      .hubBottomNav {
        border: 1px solid var(--panel-border);
        border-radius: 8px;
        background:
          linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.025)),
          var(--panel);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.08),
          0 18px 60px rgba(0,0,0,.32);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }

      .hubProfilePanel {
        min-width: min(280px, 100%);
        display: grid;
        grid-template-columns: 48px minmax(0, 1fr);
        align-items: center;
        gap: 12px;
        padding: 10px;
      }

      .hubAvatar {
        width: 48px;
        height: 48px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        color: #031524;
        font-size: 18px;
        font-weight: 950;
        letter-spacing: 0;
        background:
          radial-gradient(circle at 34% 28%, #ffffff 0 10%, #9ff5ff 31%, var(--cyan) 62%, #08749b 100%);
        box-shadow: 0 0 28px rgba(53,216,255,.36);
      }

      .hubProfileText {
        min-width: 0;
        display: grid;
        gap: 5px;
      }

      .hubProfileName {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 15px;
        font-weight: 950;
      }

      .hubProfileMeta {
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
        flex: 0 1 auto;
        display: flex;
        gap: 6px;
        padding: 6px;
      }

      .hubCurrency {
        min-width: 94px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 7px 9px;
        border-radius: 8px;
        border: 1px solid rgba(234,247,255,.10);
        background: rgba(2,9,21,.34);
      }

      .hubCurrency i {
        position: relative;
        width: 26px;
        height: 26px;
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        border-radius: 50%;
        font-style: normal;
        line-height: 1;
        overflow: hidden;
      }

      .hubCurrency.is-pearl i {
        background:
          radial-gradient(circle at 32% 24%, #ffffff 0 12%, #e9fbff 24%, #a8f1ff 54%, #5bcce5 100%);
        box-shadow: 0 0 18px rgba(223,248,255,.42);
      }

      .hubCurrency.is-pearl i:before {
        content: "";
        position: absolute;
        left: 6px;
        top: 5px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255,255,255,.86);
        filter: blur(.2px);
      }

      .hubCurrency.is-coral i {
        border-radius: 8px;
        background:
          radial-gradient(circle at 50% 72%, rgba(255,170,190,.18), transparent 54%),
          rgba(255,107,143,.10);
        box-shadow: 0 0 18px rgba(255,107,143,.42);
      }

      .hubCurrency.is-coral i:before {
        content: "";
        position: absolute;
        left: 10px;
        top: 4px;
        width: 6px;
        height: 20px;
        border-radius: 999px;
        background: linear-gradient(180deg, #ffd5df, var(--coral) 54%, #bd2b58);
        box-shadow:
          -6px 5px 0 -1px #ff91aa,
          6px 2px 0 -1px #ff6b8f,
          -3px -3px 0 -1px #ffb4c5;
        transform: rotate(10deg);
      }

      .hubCurrency.is-coral i:after {
        content: "";
        position: absolute;
        left: 7px;
        bottom: 4px;
        width: 12px;
        height: 5px;
        border-radius: 999px;
        background: rgba(255,213,223,.82);
        transform: rotate(-12deg);
      }

      .hubCurrency span,
      .hubQuickCopy {
        min-width: 0;
        display: grid;
        gap: 2px;
      }

      .hubCurrency strong {
        font-size: 14px;
        line-height: 1;
      }

      .hubCurrency em {
        color: var(--muted);
        font-size: 10px;
        font-style: normal;
        font-weight: 850;
      }

      .hubSettingsButton {
        width: 48px;
        height: 48px;
        min-width: 48px;
        min-height: 48px;
        max-width: 48px;
        max-height: 48px;
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        border-radius: 9999px;
        color: var(--text);
        background: rgba(5,18,32,.70);
        font: inherit;
        font-size: 20px;
        cursor: pointer;
        appearance: none;
        transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
      }

      .hubSettingsButton:hover {
        border-color: rgba(101,232,255,.62);
        background: rgba(53,216,255,.12);
        box-shadow: 0 0 26px rgba(53,216,255,.20);
        transform: translateY(-1px) scale(1.03);
      }

      .hubSettingsButton:active {
        transform: scale(.96);
      }

      .hubShell {
        min-width: 0;
        display: grid;
        grid-template-columns: minmax(520px, 760px) minmax(240px, 320px);
        justify-content: center;
        align-items: center;
        gap: clamp(14px, 2vw, 26px);
      }

      .hubSectionMenu {
        position: relative;
        display: block;
        grid-column: 1 / -1;
        justify-self: center;
        width: min(100%, 240px);
        margin: 0 auto;
        z-index: 8;
      }

      .hubSectionMenuButton {
        width: 100%;
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        border-radius: 999px;
        color: var(--text);
        background:
          linear-gradient(180deg, rgba(53,216,255,.12), rgba(255,255,255,.022)),
          rgba(5,18,32,.58);
        font: inherit;
        font-weight: 950;
        cursor: pointer;
        appearance: none;
        -webkit-tap-highlight-color: transparent;
        transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
      }

      .hubSectionMenuButton span {
        width: 26px;
        height: 26px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        color: var(--cyan);
        background: rgba(53,216,255,.10);
        border: 1px solid rgba(88,210,255,.18);
        line-height: 1;
      }

      .hubSectionMenuButton:hover {
        border-color: rgba(101,232,255,.62);
        box-shadow: 0 0 26px rgba(53,216,255,.18);
        transform: translateY(-1px);
      }

      .hubSectionMenuButton:active {
        transform: scale(.98);
      }

      .hubSectionMenuPanel {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        display: grid;
        gap: 6px;
        padding: 8px;
        z-index: 30;
        border-radius: 8px;
        background:
          linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.025)),
          rgba(5,18,32,.88);
      }

      .hubSectionMenuItem {
        min-height: 42px;
        display: grid;
        grid-template-columns: 30px minmax(0, 1fr) 10px;
        align-items: center;
        gap: 8px;
        border: 1px solid rgba(88,210,255,.16);
        border-radius: 8px;
        color: var(--text);
        background: rgba(5,18,32,.54);
        padding: 7px 9px;
        font: inherit;
        font-weight: 900;
        text-align: left;
        cursor: pointer;
      }

      .hubSectionMenuItem span {
        width: 28px;
        height: 28px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        color: var(--cyan);
        background: rgba(53,216,255,.10);
      }

      .hubSectionMenuItem i {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #ff4c73;
        box-shadow: 0 0 0 3px rgba(255,76,115,.14), 0 0 14px rgba(255,76,115,.55);
      }

      .hubModeButton,
      .hubQuickCard,
      .hubBottomNavButton,
      .hubPrimaryPlayButton {
        font: inherit;
        appearance: none;
        -webkit-tap-highlight-color: transparent;
      }

      .hubCenter {
        min-width: 0;
        grid-column: 1;
        grid-row: 2;
        display: grid;
        justify-items: center;
        align-self: center;
        gap: 12px;
      }

      .hubRightRail {
        min-width: 0;
        grid-column: 2;
        grid-row: 2;
        align-self: center;
        display: grid;
        gap: 10px;
      }

      .hubHero {
        position: relative;
        width: min(100%, 720px);
        min-height: clamp(470px, calc(100dvh - 220px), 660px);
        overflow: visible;
        display: grid;
        grid-template-rows: auto 1fr auto;
        place-items: center;
        padding: clamp(14px, 2.4vw, 26px);
        border-color: transparent;
        background: transparent;
        box-shadow:
          0 28px 90px rgba(0,0,0,.14);
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
      }

      .hubHero:before {
        content: none;
      }

      .hubHeroCopy {
        position: relative;
        z-index: 1;
        display: grid;
        gap: 4px;
        text-align: center;
      }

      .hubEyebrow {
        color: var(--cyan);
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .18em;
        text-transform: uppercase;
        text-shadow: 0 0 18px rgba(53,216,255,.38);
      }

      .hubHeroCopy h1 {
        margin: 0;
        font-size: clamp(28px, 4.1vw, 48px);
        line-height: .98;
        letter-spacing: 0;
        text-shadow: 0 0 28px rgba(53,216,255,.28);
      }

      .hubSphereStage {
        position: relative;
        z-index: 1;
        width: min(100%, 560px);
        display: grid;
        place-items: center;
        padding: 4px 0 8px;
      }

      .hubSphereStage:after {
        content: "";
        position: absolute;
        left: 50%;
        bottom: 20px;
        width: min(78%, 430px);
        height: 74px;
        transform: translateX(-50%);
        border-radius: 50%;
        pointer-events: none;
        background:
          radial-gradient(ellipse at 50% 50%, rgba(53,216,255,.42), rgba(53,216,255,.12) 42%, transparent 70%);
        filter: blur(18px);
        opacity: .70;
      }

      .hubSphere {
        position: relative;
        width: clamp(340px, min(30vw, 44dvh), 520px);
        aspect-ratio: 1;
        display: grid;
        place-items: center;
        overflow: hidden;
        border-radius: 50%;
        border: 1px solid rgba(159,237,255,.56);
        background:
          radial-gradient(circle at 36% 24%, rgba(255,255,255,.28), transparent 12%),
          radial-gradient(circle at 54% 62%, rgba(53,216,255,.18), transparent 42%),
          radial-gradient(circle at 50% 50%, rgba(12,71,105,.42), rgba(3,24,42,.28) 58%, rgba(53,216,255,.18) 100%);
        box-shadow:
          inset 0 0 46px rgba(176,247,255,.30),
          inset 0 -36px 86px rgba(28,184,255,.20),
          0 0 58px rgba(53,216,255,.30),
          0 30px 78px rgba(0,0,0,.38);
        backdrop-filter: blur(12px) saturate(1.18);
        -webkit-backdrop-filter: blur(12px) saturate(1.18);
        animation: hubSphereBreath 4.8s ease-in-out infinite;
      }

      .hubSphere:before,
      .hubSphere:after,
      .hubSphereCaustics {
        content: "";
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
      }

      .hubSphere:before {
        inset: 7%;
        background:
          radial-gradient(ellipse at 45% 86%, rgba(53,216,255,.52), transparent 18%),
          radial-gradient(circle at 24% 24%, rgba(255,255,255,.24), transparent 10%),
          radial-gradient(ellipse at 32% 26%, rgba(255,255,255,.18), transparent 42%);
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
        animation: hubParticleDrift 18s linear infinite;
      }

      .hubSphereCaustics {
        inset: 8%;
        opacity: .24;
        background:
          repeating-radial-gradient(ellipse at 50% 76%, transparent 0 12px, rgba(84,226,255,.20) 13px 14px, transparent 15px 28px),
          radial-gradient(ellipse at 50% 86%, rgba(223,248,255,.14), transparent 34%);
        filter: blur(.4px);
        mix-blend-mode: screen;
        animation: hubCaustics 8s ease-in-out infinite alternate;
      }

      .hubFish {
        position: relative;
        z-index: 2;
        width: 76%;
        max-width: 400px;
        display: grid;
        place-items: center;
        filter:
          drop-shadow(0 20px 28px rgba(0,0,0,.40))
          drop-shadow(0 0 20px rgba(53,216,255,.22));
        animation: hubFishFloat 3.8s ease-in-out infinite;
      }

      .hubFish img {
        display: block;
        width: 100%;
        height: auto;
        object-fit: contain;
        background: transparent;
        border: 0;
        box-shadow: none;
      }

      .hubFishFallback {
        display: none;
        position: relative;
        width: min(100%, 300px);
        aspect-ratio: 2.25 / 1;
        border-radius: 52% 48% 46% 54% / 54% 52% 48% 46%;
        background:
          radial-gradient(circle at 78% 36%, #fff 0 8%, #101318 9% 15%, transparent 16%),
          linear-gradient(120deg, #164fc5 0%, #1c77ff 55%, #0f3fae 100%);
        box-shadow: inset -18px -20px 36px rgba(2,9,21,.22), inset 18px 14px 26px rgba(255,255,255,.12);
      }

      .hubFish.hasFallback .hubFishFallback {
        display: block;
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
        width: clamp(320px, 36vw, 520px);
        min-height: 76px;
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
        border: 1px solid rgba(255,255,255,.12);
        border-radius: inherit;
        pointer-events: none;
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
        width: 100%;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        min-width: 0;
      }

      .hubModeCard {
        min-width: 0;
        padding: 11px;
        display: grid;
        gap: 8px;
        cursor: pointer;
        background:
          linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.018)),
          rgba(5,18,32,.46);
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
          radial-gradient(ellipse at 30% 0%, rgba(53,216,255,.20), transparent 52%),
          linear-gradient(180deg, rgba(255,255,255,.082), rgba(255,255,255,.022)),
          rgba(5,18,32,.54);
      }

      .hubModeHeader {
        min-width: 0;
        display: grid;
        align-items: flex-start;
        gap: 6px;
      }

      .hubModeHeader h2 {
        margin: 0;
        font-size: clamp(16px, 1.45vw, 20px);
        letter-spacing: 0;
      }

      .hubModeHeader p {
        margin: 4px 0 0;
        color: var(--muted);
        font-size: 12px;
        font-weight: 850;
      }

      .hubModeBadge {
        flex: 0 0 auto;
        width: max-content;
        padding: 5px 8px;
        border-radius: 999px;
        color: #061827;
        background: linear-gradient(90deg, var(--gold), #ffe29a);
        box-shadow: 0 0 20px rgba(245,184,75,.24);
        font-size: 10px;
        font-weight: 950;
      }

      .hubModeButton {
        min-height: 34px;
        border: 1px solid rgba(88,210,255,.34);
        border-radius: 999px;
        color: var(--text);
        background: rgba(53,216,255,.10);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.10);
        font-weight: 950;
        font-size: 12px;
        cursor: pointer;
        transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
      }

      .hubModeButton:hover {
        border-color: rgba(101,232,255,.74);
        background: rgba(53,216,255,.16);
        box-shadow: 0 0 22px rgba(53,216,255,.18);
        transform: translateY(-1px);
      }

      .hubModeButton:active {
        transform: scale(.98);
      }

      .hubQuickGrid {
        width: 100%;
        align-self: center;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 10px;
      }

      .hubQuickCard {
        min-width: 0;
        min-height: 64px;
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr);
        align-items: center;
        gap: 10px;
        padding: 12px;
        color: var(--text);
        text-align: left;
        cursor: pointer;
        transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
      }

      .hubQuickCard:hover {
        border-color: rgba(101,232,255,.62);
        background:
          linear-gradient(180deg, rgba(53,216,255,.10), rgba(255,255,255,.02)),
          var(--panel);
        box-shadow: 0 0 28px rgba(53,216,255,.16), 0 18px 60px rgba(0,0,0,.32);
        transform: translateY(-2px);
      }

      .hubQuickCard.is-gold .hubQuickIcon {
        color: var(--gold);
        background: rgba(245,184,75,.12);
        border-color: rgba(245,184,75,.22);
        text-shadow: 0 0 14px rgba(245,184,75,.42);
      }

      .hubQuickCard.is-coral .hubQuickIcon {
        color: var(--coral);
        background: rgba(255,107,143,.12);
        border-color: rgba(255,107,143,.22);
        text-shadow: 0 0 14px rgba(255,107,143,.42);
      }

      .hubQuickCard.is-pearl .hubQuickIcon {
        color: var(--pearl);
        background: rgba(223,248,255,.11);
        border-color: rgba(223,248,255,.20);
        text-shadow: 0 0 14px rgba(223,248,255,.34);
      }

      .hubQuickCard:active {
        transform: scale(.98);
      }

      .hubQuickIcon {
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        color: var(--cyan);
        background: rgba(53,216,255,.10);
        border: 1px solid rgba(88,210,255,.18);
        font-size: 15px;
        text-shadow: 0 0 14px rgba(53,216,255,.45);
      }

      .hubQuickCopy strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
        font-weight: 950;
      }

      .hubQuickCopy em {
        color: var(--muted);
        font-size: 12px;
        font-style: normal;
        font-weight: 850;
      }

      .hubBottomNav {
        position: fixed;
        left: max(12px, env(safe-area-inset-left, 0px));
        right: max(12px, env(safe-area-inset-right, 0px));
        bottom: max(12px, env(safe-area-inset-bottom, 0px));
        z-index: 20;
        width: min(420px, 48vw, calc(100vw - 24px));
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 4px;
        padding: 5px;
        border-radius: 999px;
        background:
          linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.025)),
          rgba(5,18,32,.78);
      }

      .hubBottomNavButton {
        min-width: 0;
        min-height: 44px;
        display: grid;
        place-items: center;
        gap: 3px;
        border: 1px solid transparent;
        border-radius: 999px;
        color: var(--muted);
        background: transparent;
        cursor: pointer;
        transition: color .18s ease, background .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease;
      }

      .hubBottomNavButton span {
        font-size: 17px;
        line-height: 1;
      }

      .hubBottomNavButton em {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 10px;
        font-style: normal;
        font-weight: 950;
      }

      .hubBottomNavButton:hover {
        color: var(--text);
        transform: translateY(-1px);
      }

      .hubBottomNavButton.isActive {
        color: var(--text);
        border-color: rgba(101,232,255,.42);
        background: rgba(53,216,255,.12);
        box-shadow: inset 0 0 20px rgba(53,216,255,.10), 0 0 24px rgba(53,216,255,.16);
        animation: hubActivePulse 3s ease-in-out infinite;
      }

      @media (min-width: 1280px) {
        .hubShell {
          grid-template-columns: minmax(600px, 820px) minmax(260px, 340px);
        }
      }

      @keyframes hubRayShift {
        from { transform: translateX(-1.5%) scaleX(1); opacity: .40; }
        to { transform: translateX(1.5%) scaleX(1.08); opacity: .56; }
      }

      @keyframes hubHazeFloat {
        from { transform: translate3d(-2%, 0, 0) scale(1); }
        to { transform: translate3d(2%, -3%, 0) scale(1.04); }
      }

      @keyframes hubBubbleRise {
        from { background-position: 0 640px, 0 720px, 0 600px; }
        to { background-position: 0 -260px, 0 -340px, 0 -280px; }
      }

      @keyframes hubParticleDrift {
        from { background-position: 0 0, 0 0, 0 0, 0 0; }
        to { background-position: 90px -180px, -120px -150px, 70px -210px, -80px -120px; }
      }

      @keyframes hubShimmer {
        0%, 100% { background-position: -440px 0, 620px 0; }
        50% { background-position: 720px 0, -500px 0; }
      }

      @keyframes hubSphereBreath {
        0%, 100% { transform: scale(1); box-shadow: inset 0 0 46px rgba(176,247,255,.30), inset 0 -36px 86px rgba(28,184,255,.20), 0 0 58px rgba(53,216,255,.30), 0 30px 78px rgba(0,0,0,.38); }
        50% { transform: scale(1.018); box-shadow: inset 0 0 58px rgba(176,247,255,.36), inset 0 -42px 96px rgba(28,184,255,.24), 0 0 72px rgba(53,216,255,.38), 0 34px 86px rgba(0,0,0,.40); }
      }

      @keyframes hubFishFloat {
        0%, 100% { transform: translate3d(0, 0, 0) rotate(-1deg); }
        50% { transform: translate3d(0, -12px, 0) rotate(1deg); }
      }

      @keyframes hubCaustics {
        from { transform: rotate(-3deg) scale(1); opacity: .24; }
        to { transform: rotate(3deg) scale(1.04); opacity: .38; }
      }

      @keyframes hubButtonShine {
        0%, 58% { left: -42%; opacity: 0; }
        68% { opacity: .82; }
        100% { left: 120%; opacity: 0; }
      }

      @keyframes hubActivePulse {
        0%, 100% { box-shadow: inset 0 0 20px rgba(53,216,255,.10), 0 0 20px rgba(53,216,255,.13); }
        50% { box-shadow: inset 0 0 26px rgba(53,216,255,.18), 0 0 28px rgba(53,216,255,.22); }
      }

      @media (max-width: 1023px) {
        .bcHub {
          width: 100%;
        }

        .hubShell {
          grid-template-columns: minmax(0, 1fr);
          align-items: start;
        }

        .hubSectionMenu {
          grid-column: 1;
          width: min(100%, 320px);
        }

        .hubCenter,
        .hubRightRail {
          grid-column: 1;
          grid-row: auto;
        }

        .hubHero {
          min-height: min(600px, calc(100dvh - 220px));
        }

        .hubRightRail {
          width: min(100%, 720px);
          margin: 0 auto;
        }

        .hubModes {
          grid-template-columns: minmax(0, 1.18fr) minmax(220px, .82fr);
          gap: 12px;
        }

        .hubQuickGrid {
          width: min(100%, 720px);
          margin: 0 auto;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .hubQuickCard {
          min-height: 76px;
        }
      }

      @media (max-width: 767px) {
        .bcHub {
          padding: 10px;
          padding-bottom: calc(86px + env(safe-area-inset-bottom, 0px));
          gap: 10px;
        }

        .hubTop {
          align-items: stretch;
          gap: 8px;
        }

        .hubProfilePanel {
          min-width: 0;
          grid-template-columns: 42px minmax(0, 1fr);
          padding: 8px;
        }

        .hubAvatar {
          width: 42px;
          height: 42px;
          font-size: 16px;
        }

        .hubTopActions {
          align-items: stretch;
          gap: 6px;
        }

        .hubCurrencyBar {
          flex-direction: column;
          justify-content: center;
          padding: 4px;
          gap: 4px;
        }

        .hubCurrency {
          min-width: 0;
          width: 88px;
          padding: 5px 7px;
          gap: 6px;
        }

        .hubCurrency i {
          width: 22px;
          height: 22px;
          font-size: 12px;
        }

        .hubCurrency strong {
          font-size: 12px;
        }

        .hubCurrency em {
          font-size: 9px;
        }

        .hubSettingsButton {
          width: 44px;
          height: 44px;
          min-width: 44px;
          min-height: 44px;
          max-width: 44px;
          max-height: 44px;
        }

        .hubSectionMenuPanel {
          position: fixed;
          left: 10px;
          right: 10px;
          top: auto;
          bottom: calc(72px + env(safe-area-inset-bottom, 0px));
          width: auto;
          max-height: min(430px, calc(100dvh - 120px));
          overflow: auto;
          overscroll-behavior: contain;
        }

        .hubHero {
          min-height: min(560px, calc(100dvh - 210px));
          padding: 14px 10px;
          background: transparent;
        }

        .hubEyebrow {
          font-size: 9px;
          letter-spacing: .14em;
        }

        .hubSphere {
          width: clamp(260px, 76vw, 360px);
        }

        .hubPrimaryPlayButton {
          width: min(92%, 390px);
          min-height: 60px;
        }

        .hubModes {
          grid-template-columns: minmax(0, 1fr);
        }

        .hubQuickGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .hubQuickCard {
          min-height: 74px;
          padding: 10px;
        }

        .hubBottomNav {
          left: 8px;
          right: 8px;
          bottom: max(8px, env(safe-area-inset-bottom, 0px));
          width: min(360px, calc(100vw - 16px));
        }

        .hubBottomNavButton {
          min-height: 42px;
        }

        .hubBottomNavButton em {
          font-size: 9px;
        }
      }

      @media (max-width: 390px) {
        .hubProfileMeta {
          font-size: 11px;
        }

        .hubCurrency {
          width: 78px;
        }

        .hubBottomNavButton em {
          font-size: 8px;
        }

        .hubQuickCard {
          grid-template-columns: 30px minmax(0, 1fr);
          gap: 8px;
        }

        .hubQuickIcon {
          width: 30px;
          height: 30px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .bcSiteRoot *,
        .bcSiteRoot *:before,
        .bcSiteRoot *:after {
          animation-duration: .01ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
          transition-duration: .01ms !important;
        }
      }
    `}</style>
  );
}
