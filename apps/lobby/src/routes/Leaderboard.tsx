import React from "react";
import { userStorage } from "@blackcrown/core";

type LeaderboardPeriod = "today" | "week" | "all";

type LeaderboardEntry = {
  id: string;
  rank: number;
  name: string;
  level: number;
  xp: number;
  score: number;
  pearls: number;
  league: string;
  isCurrentPlayer?: boolean;
};

type PlayerRank = {
  nickname: string;
  level: number;
  xp: number;
  xpToNext: number;
  pearls: number;
  corals: number;
};

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

function readActiveSave(): Record<string, unknown> {
  try {
    const activeProfileId = (localStorage.getItem("evofish_next_active_profile_v1") || "main").trim() || "main";
    const activeSaveKey = activeProfileId === "main" ? "evofish_next_save_v1" : `evofish_next_save_v1__profile_${activeProfileId}`;
    const saveKeys = activeSaveKey === "evofish_next_save_v1" ? [activeSaveKey] : [activeSaveKey, "evofish_next_save_v1"];

    for (const key of saveKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      return readRecord(JSON.parse(raw));
    }
  } catch {
    return {};
  }

  return {};
}

function readPlayerRank(): PlayerRank {
  const fallbackNick = userStorage.getString("nickname", "") || "Игрок";
  const base: PlayerRank = {
    nickname: fallbackNick,
    level: 1,
    xp: 0,
    xpToNext: 260,
    pearls: 0,
    corals: 0,
  };

  try {
    const save = readActiveSave();
    if (!Object.keys(save).length) return base;

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

function formatCount(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function progressPercent(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

function buildLeaderboard(player: PlayerRank, period: LeaderboardPeriod): LeaderboardEntry[] {
  const periodBoost = period === "today" ? 0 : period === "week" ? 420 : 1400;
  const playerScore = Math.max(10, player.xp + player.level * 180 + periodBoost);
  const generated: Omit<LeaderboardEntry, "rank">[] = [
    { id: "abyss-01", name: "AbyssRay", level: 44, xp: 15820 + periodBoost, score: 26400 + periodBoost, pearls: 4200, league: "Apex" },
    { id: "coral-02", name: "CoralX", level: 39, xp: 12640 + periodBoost, score: 21150 + periodBoost, pearls: 3150, league: "Ocean" },
    { id: "wave-03", name: "WaveFox", level: 34, xp: 10320 + periodBoost, score: 18420 + periodBoost, pearls: 2760, league: "Ocean" },
    { id: "deep-04", name: "DeepManta", level: 29, xp: 8120 + periodBoost, score: 15100 + periodBoost, pearls: 2120, league: "Reef" },
    { id: "kelp-05", name: "KelpRush", level: 24, xp: 6400 + periodBoost, score: 12460 + periodBoost, pearls: 1680, league: "Reef" },
    { id: "current", name: player.nickname, level: player.level, xp: player.xp, score: playerScore, pearls: player.pearls, league: "Next", isCurrentPlayer: true },
    { id: "pearl-06", name: "PearlWay", level: 18, xp: 4260 + periodBoost, score: 8620 + periodBoost, pearls: 950, league: "Tide" },
    { id: "blue-07", name: "BlueFin", level: 15, xp: 3180 + periodBoost, score: 7240 + periodBoost, pearls: 780, league: "Tide" },
    { id: "tide-08", name: "TideKid", level: 11, xp: 2140 + periodBoost, score: 5310 + periodBoost, pearls: 520, league: "Stream" },
    { id: "fin-09", name: "FinNova", level: 8, xp: 1240 + periodBoost, score: 3920 + periodBoost, pearls: 340, league: "Stream" },
  ];

  return generated
    .slice()
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function rankClass(rank: number) {
  if (rank === 1) return "isGold";
  if (rank === 2) return "isSilver";
  if (rank === 3) return "isBronze";
  return "";
}

export function Leaderboard() {
  const [period, setPeriod] = React.useState<LeaderboardPeriod>("week");
  const [player, setPlayer] = React.useState<PlayerRank>(() => readPlayerRank());

  React.useEffect(() => {
    const refresh = () => setPlayer(readPlayerRank());
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const rows = React.useMemo(() => buildLeaderboard(player, period), [period, player]);
  const currentEntry = rows.find((entry) => entry.isCurrentPlayer) ?? rows[rows.length - 1];
  const xpProgress = progressPercent(player.xp, player.xpToNext);

  return (
    <main className="leaderboardScreen">
      <LeaderboardStyles />
      <div className="leaderboardBackdrop" aria-hidden="true" />
      <div className="leaderboardGlow" aria-hidden="true" />

      <section className="leaderboardShell" aria-label="Топ игроков EvoFish Next">
        <header className="leaderboardHeader">
          <button className="leaderboardBack" type="button" onClick={() => window.location.assign("/lobby")}>
            ‹ Лобби
          </button>
          <div>
            <span>ОКЕАНСКАЯ ЛИГА</span>
            <h1>Топ игроков</h1>
            <p>Рейтинг EvoFish Next по прогрессу, уровню и активности.</p>
          </div>
        </header>

        <div className="leaderboardTabs" role="tablist" aria-label="Период рейтинга">
          {[
            ["today", "Сегодня"],
            ["week", "Неделя"],
            ["all", "Все время"],
          ].map(([id, label]) => (
            <button key={id} className={period === id ? "isActive" : ""} type="button" onClick={() => setPeriod(id as LeaderboardPeriod)}>
              {label}
            </button>
          ))}
        </div>

        <section className="playerRankCard">
          <div className="playerRankAvatar">{player.nickname.slice(0, 1).toUpperCase()}</div>
          <div className="playerRankText">
            <span>Твоя позиция</span>
            <strong>#{currentEntry?.rank ?? "—"} · {player.nickname}</strong>
            <em>LV {player.level} · XP {formatCount(player.xp)} / {formatCount(player.xpToNext)}</em>
            <div className="leaderboardProgress"><i style={{ width: `${xpProgress}%` }} /></div>
          </div>
          <div className="playerRankScore">
            <span>Score</span>
            <strong>{formatCount(currentEntry?.score ?? 0)}</strong>
          </div>
        </section>

        <section className="leaderboardGrid">
          <div className="leaderboardPanel">
            <div className="leaderboardPanelTitle">
              <strong>Рейтинг</strong>
              <span>{period === "today" ? "Сегодня" : period === "week" ? "За неделю" : "За всё время"}</span>
            </div>

            <div className="leaderboardRows">
              {rows.map((entry) => (
                <article key={entry.id} className={`leaderboardRow ${rankClass(entry.rank)} ${entry.isCurrentPlayer ? "isCurrentPlayer" : ""}`}>
                  <div className="leaderboardRank">#{entry.rank}</div>
                  <div className="leaderboardUserIcon">{entry.name.slice(0, 1).toUpperCase()}</div>
                  <div className="leaderboardUser">
                    <strong>{entry.name}</strong>
                    <span>LV {entry.level} · {entry.league}</span>
                  </div>
                  <div className="leaderboardStat">
                    <strong>{formatCount(entry.score)}</strong>
                    <span>Score</span>
                  </div>
                  <div className="leaderboardPearls">
                    <i />
                    <span>{formatCount(entry.pearls)}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="leaderboardRewards">
            <div className="leaderboardPanelTitle">
              <strong>Награды</strong>
              <span>Сезонные цели</span>
            </div>
            <RewardCard place="Топ 1" reward="Мифический сундук" tone="gold" />
            <RewardCard place="Топ 10" reward="850 жемчуг" tone="cyan" />
            <RewardCard place="Топ 100" reward="120 кораллов" tone="coral" />
            <button className="leaderboardPlay" type="button" onClick={() => window.location.assign("/game/?mode=next")}>Играть</button>
          </aside>
        </section>
      </section>
    </main>
  );
}

function RewardCard({ place, reward, tone }: { place: string; reward: string; tone: "gold" | "cyan" | "coral" }) {
  return (
    <article className={`rewardCard is-${tone}`}>
      <strong>{place}</strong>
      <span>{reward}</span>
    </article>
  );
}

function LeaderboardStyles() {
  return (
    <style>{`
      .leaderboardScreen {
        --bg-deep: #020915;
        --bg-navy: #061827;
        --cyan: #35d8ff;
        --panel: rgba(5,18,32,.72);
        --panel-strong: rgba(7,27,45,.86);
        --panel-border: rgba(88,210,255,.25);
        --text: #eaf7ff;
        --muted: rgba(234,247,255,.62);
        --gold: #f5b84b;
        --coral: #ff6b8f;
        min-height: 100vh;
        min-height: 100dvh;
        position: relative;
        isolation: isolate;
        overflow-x: hidden;
        color: var(--text);
        background: radial-gradient(ellipse at 50% 16%, rgba(53,216,255,.20), transparent 42%), linear-gradient(180deg, #061827, #020915);
      }

      .leaderboardScreen, .leaderboardScreen * { box-sizing: border-box; }

      .leaderboardBackdrop {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background:
          linear-gradient(90deg, rgba(2,9,21,.45), rgba(2,9,21,.04) 50%, rgba(2,9,21,.45)),
          url('/lobby/assets/lobby/lobby-bg-station-16x9.png'),
          linear-gradient(180deg, #061827, #020915);
        background-size: cover;
        background-position: center;
        opacity: .76;
      }

      .leaderboardGlow {
        position: fixed;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background:
          radial-gradient(ellipse at 50% 0%, rgba(180,255,255,.25), transparent 42%),
          radial-gradient(ellipse at 50% 82%, rgba(53,216,255,.16), transparent 56%);
        mix-blend-mode: screen;
      }

      .leaderboardShell {
        position: relative;
        z-index: 2;
        width: min(1180px, 100%);
        margin: 0 auto;
        padding: clamp(14px, 2vw, 28px);
        padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
        display: grid;
        gap: 14px;
      }

      .leaderboardHeader,
      .leaderboardTabs,
      .playerRankCard,
      .leaderboardPanel,
      .leaderboardRewards {
        border: 1px solid var(--panel-border);
        background: linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.025)), var(--panel);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 18px 60px rgba(0,0,0,.32);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        border-radius: 24px;
      }

      .leaderboardHeader {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px;
      }

      .leaderboardHeader span {
        color: var(--cyan);
        font-size: 11px;
        font-weight: 950;
        letter-spacing: .18em;
      }

      .leaderboardHeader h1 {
        margin: 2px 0 4px;
        font-size: clamp(30px, 5vw, 56px);
        line-height: .95;
      }

      .leaderboardHeader p {
        margin: 0;
        color: var(--muted);
        font-weight: 800;
      }

      .leaderboardBack,
      .leaderboardTabs button,
      .leaderboardPlay {
        font: inherit;
        color: var(--text);
        border: 1px solid rgba(88,210,255,.28);
        background: rgba(5,18,32,.66);
        border-radius: 999px;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }

      .leaderboardBack {
        flex: 0 0 auto;
        padding: 10px 14px;
        font-weight: 950;
      }

      .leaderboardTabs {
        width: min(440px, 100%);
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
        padding: 6px;
        border-radius: 999px;
      }

      .leaderboardTabs button {
        min-height: 40px;
        font-weight: 950;
        color: var(--muted);
      }

      .leaderboardTabs button.isActive {
        color: var(--text);
        border-color: rgba(101,232,255,.70);
        background: rgba(53,216,255,.14);
        box-shadow: 0 0 24px rgba(53,216,255,.18);
      }

      .playerRankCard {
        display: grid;
        grid-template-columns: 62px minmax(0, 1fr) auto;
        align-items: center;
        gap: 14px;
        padding: 14px;
      }

      .playerRankAvatar,
      .leaderboardUserIcon {
        display: grid;
        place-items: center;
        border-radius: 50%;
        background: radial-gradient(circle at 34% 28%, #ffffff 0 10%, #9ff5ff 31%, var(--cyan) 62%, #08749b 100%);
        color: #031524;
        font-weight: 950;
        box-shadow: 0 0 28px rgba(53,216,255,.36);
      }

      .playerRankAvatar { width: 62px; height: 62px; font-size: 24px; }
      .leaderboardUserIcon { width: 42px; height: 42px; font-size: 17px; }

      .playerRankText { min-width: 0; display: grid; gap: 5px; }
      .playerRankText span, .playerRankScore span { color: var(--cyan); font-size: 11px; font-weight: 950; letter-spacing: .12em; text-transform: uppercase; }
      .playerRankText strong { font-size: clamp(18px, 3.5vw, 26px); }
      .playerRankText em { color: var(--muted); font-style: normal; font-weight: 850; }

      .leaderboardProgress {
        height: 7px;
        border-radius: 999px;
        overflow: hidden;
        background: rgba(234,247,255,.12);
      }
      .leaderboardProgress i {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--cyan), #78ffd8, var(--gold));
      }

      .playerRankScore { text-align: right; display: grid; gap: 4px; }
      .playerRankScore strong { font-size: 24px; }

      .leaderboardGrid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 310px;
        gap: 14px;
      }

      .leaderboardPanel, .leaderboardRewards { padding: 14px; }
      .leaderboardPanelTitle { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; margin-bottom: 12px; }
      .leaderboardPanelTitle strong { font-size: 20px; }
      .leaderboardPanelTitle span { color: var(--muted); font-weight: 850; }

      .leaderboardRows { display: grid; gap: 8px; }
      .leaderboardRow {
        display: grid;
        grid-template-columns: 54px 42px minmax(0, 1fr) auto auto;
        align-items: center;
        gap: 10px;
        min-height: 64px;
        padding: 10px;
        border-radius: 18px;
        border: 1px solid rgba(88,210,255,.16);
        background: rgba(5,18,32,.52);
      }

      .leaderboardRow.isCurrentPlayer {
        border-color: rgba(101,232,255,.74);
        background: linear-gradient(90deg, rgba(53,216,255,.16), rgba(5,18,32,.58));
        box-shadow: 0 0 30px rgba(53,216,255,.16);
      }

      .leaderboardRow.isGold { border-color: rgba(245,184,75,.64); box-shadow: inset 0 0 28px rgba(245,184,75,.08); }
      .leaderboardRow.isSilver { border-color: rgba(223,248,255,.52); }
      .leaderboardRow.isBronze { border-color: rgba(217,141,85,.58); }

      .leaderboardRank { font-weight: 950; color: var(--cyan); }
      .leaderboardRow.isGold .leaderboardRank { color: var(--gold); }
      .leaderboardUser { min-width: 0; display: grid; gap: 3px; }
      .leaderboardUser strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .leaderboardUser span, .leaderboardStat span { color: var(--muted); font-size: 12px; font-weight: 850; }
      .leaderboardStat { text-align: right; display: grid; gap: 2px; }
      .leaderboardStat strong { font-size: 18px; }
      .leaderboardPearls { display: flex; align-items: center; gap: 6px; color: var(--muted); font-weight: 900; }
      .leaderboardPearls i { width: 16px; height: 16px; border-radius: 50%; background: radial-gradient(circle at 30% 24%, #fff, #a8f1ff 56%, #5bcce5); box-shadow: 0 0 16px rgba(223,248,255,.34); }

      .leaderboardRewards { display: grid; gap: 10px; align-content: start; }
      .rewardCard {
        padding: 14px;
        border-radius: 18px;
        border: 1px solid rgba(88,210,255,.16);
        background: rgba(5,18,32,.48);
        display: grid;
        gap: 4px;
      }
      .rewardCard strong { font-size: 18px; }
      .rewardCard span { color: var(--muted); font-weight: 850; }
      .rewardCard.is-gold { border-color: rgba(245,184,75,.62); }
      .rewardCard.is-cyan { border-color: rgba(53,216,255,.54); }
      .rewardCard.is-coral { border-color: rgba(255,107,143,.54); }

      .leaderboardPlay {
        min-height: 48px;
        font-weight: 950;
        background: linear-gradient(90deg, rgba(53,216,255,.16), rgba(120,255,216,.10));
      }

      @media (max-width: 860px) {
        .leaderboardGrid { grid-template-columns: minmax(0, 1fr); }
        .leaderboardHeader { align-items: flex-start; flex-direction: column; }
        .playerRankCard { grid-template-columns: 54px minmax(0, 1fr); }
        .playerRankScore { grid-column: 1 / -1; text-align: left; }
        .leaderboardRow { grid-template-columns: 42px 38px minmax(0, 1fr) auto; }
        .leaderboardPearls { display: none; }
      }

      @media (max-width: 520px) {
        .leaderboardShell { padding: 10px; }
        .leaderboardRow { grid-template-columns: 38px 34px minmax(0, 1fr) auto; gap: 8px; padding: 8px; }
        .leaderboardUserIcon { width: 34px; height: 34px; font-size: 14px; }
        .leaderboardStat strong { font-size: 15px; }
      }
    `}</style>
  );
}

export default Leaderboard;
