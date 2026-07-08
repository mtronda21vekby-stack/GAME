import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "../../router";
import { fetchLeaderboardMe, fetchLeaderboardOnline, fetchLeaderboardSeason, fetchLeaderboardTop, getLeaderboardPlayerId, syncLeaderboardProfile, type LeaderboardMeResponse, type LeaderboardOnlineResponse, type LeaderboardRow, type LeaderboardSeasonResponse, type LeaderboardTopResponse } from "../leaderboard/leaderboardClient";
import { EVOFISH_SEASON_1, rewardForRank } from "../content/seasonRewards";

function format(value: number) {
  return Math.max(0, Math.floor(value || 0)).toLocaleString("ru-RU");
}

function timeLeft(endsAt?: string) {
  if (!endsAt) return "—";
  const ms = new Date(endsAt).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return "скоро новый сезон";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return `${days}д ${hours}ч`;
}

function playerCode(value?: string | null) {
  const clean = String(value || "").replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  return `ID ${clean || "LOCAL"}`;
}

function topRows(rows: LeaderboardRow[]) {
  return rows.slice(0, 3);
}

export function SeasonHub() {
  const [season, setSeason] = useState<LeaderboardSeasonResponse | null>(null);
  const [top, setTop] = useState<LeaderboardTopResponse | null>(null);
  const [me, setMe] = useState<LeaderboardMeResponse | null>(null);
  const [online, setOnline] = useState<LeaderboardOnlineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const myId = useMemo(() => getLeaderboardPlayerId(), []);

  const reload = useCallback(async () => {
    await syncLeaderboardProfile().catch(() => {});
    const [seasonResult, topResult, meResult, onlineResult] = await Promise.all([
      fetchLeaderboardSeason(),
      fetchLeaderboardTop(100),
      fetchLeaderboardMe(),
      fetchLeaderboardOnline()
    ]);
    setSeason(seasonResult);
    setTop(topResult);
    setMe(meResult);
    setOnline(onlineResult);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    const timer = window.setInterval(reload, 10000);
    const onVisible = () => { if (!document.hidden) reload(); };
    window.addEventListener("focus", reload);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", reload);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reload]);

  const rows = top?.rows || [];
  const podium = topRows(rows);
  const myRank = me?.rank || null;
  const myBest = me?.best || null;
  const myReward = rewardForRank(myRank);
  const onlineCount = online?.online || 0;

  return (
    <main className="efSeason">
      <section className="efSeasonShell">
        <nav className="efSeasonNav">
          <Link to="/game">Главная</Link>
          <Link to="/game/account">Аккаунт</Link>
          <Link to="/game/play">Играть</Link>
          <Link to="/game/leaderboard">Лидеры</Link>
          <Link to="/game/skins">Скины</Link>
          <Link to="/game/settings">Настройки</Link>
        </nav>

        <header className="efSeasonHero">
          <div>
            <span>BLACKCROWN SEASON</span>
            <h1>{EVOFISH_SEASON_1.title}</h1>
            <p>{EVOFISH_SEASON_1.description}</p>
          </div>
          <Link className="efSeasonPlay" to="/game/play">Играть сезон</Link>
        </header>

        <section className="efSeasonStats">
          <article><span>До конца</span><b>{timeLeft(season?.season?.endsAt)}</b><small>{season?.season?.title || EVOFISH_SEASON_1.theme}</small></article>
          <article><span>В игре сейчас</span><b>{format(onlineCount)}</b><small>активные игроки</small></article>
          <article><span>Моё место</span><b>{myRank ? `#${myRank}` : "—"}</b><small>{playerCode(myId)}</small></article>
          <article><span>Мой счёт</span><b>{myBest ? format(myBest.score) : "—"}</b><small>{myBest ? `LV ${myBest.level} · ${format(myBest.kills)} убийств` : "сыграй забег"}</small></article>
        </section>

        <section className="efSeasonRewardNow">
          <div>
            <span>Текущая сезонная награда</span>
            <h2>{myReward.placement} · {myReward.title}</h2>
            <p>{myRank ? `Если сезон закончится сейчас, твой ранг #${myRank} даст этот набор.` : "Сыграй live-забег, чтобы закрепиться в таблице и открыть сезонную награду."}</p>
          </div>
          <ul>
            {myReward.rewards.map((reward) => <li key={reward}>{reward}</li>)}
          </ul>
        </section>

        <section className="efSeasonGrid">
          {EVOFISH_SEASON_1.rewards.map((reward) => (
            <article key={reward.id} className={`efSeasonReward ${reward.id === myReward.id ? "active" : ""}`}>
              <span>{reward.placement}</span>
              <h3>{reward.title}</h3>
              <p>{reward.requirement}</p>
              <small>{reward.spotlight}</small>
              <ul>{reward.rewards.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </section>

        <section className="efSeasonSplit">
          <article className="efSeasonPanel">
            <span>TOP 3 сейчас</span>
            <h2>Зал славы</h2>
            {loading ? <p>Загрузка TOP 3…</p> : null}
            {!loading && podium.length === 0 ? <p>Пока нет результатов. Первый забег откроет таблицу.</p> : null}
            {podium.map((row) => (
              <div key={row.id} className={`efSeasonPodium ${row.playerId === myId ? "me" : ""}`}>
                <b>#{row.rank || "—"}</b>
                <span>{row.nickname}<small>{playerCode(row.playerId)} · LV {row.level}</small></span>
                <em>{format(row.score)}</em>
              </div>
            ))}
          </article>

          <article className="efSeasonPanel">
            <span>Цели сезона</span>
            <h2>Что делать дальше</h2>
            <div className="efSeasonGoals">
              {EVOFISH_SEASON_1.goals.map((goal, index) => <p key={goal}><b>{index + 1}</b>{goal}</p>)}
            </div>
            <div className="efSeasonActions">
              <Link to="/game/play">Играть</Link>
              <Link to="/game/leaderboard">Открыть TOP</Link>
            </div>
          </article>
        </section>

        <nav className="efLobbyBottomNav" aria-label="Основная навигация">
          <Link to="/game"><span>⌂</span><b>Лобби</b></Link>
          <Link to="/game/progress"><span>◇</span><b>Достижения</b></Link>
          <Link to="/game/account"><span>◉</span><b>Профиль</b></Link>
        </nav>
      </section>

      <style>{`.efSeason{min-height:100vh;background:radial-gradient(circle at 12% 0,rgba(112,247,255,.18),transparent 34%),radial-gradient(circle at 86% 8%,rgba(255,220,120,.12),transparent 34%),#020b15;color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efSeasonShell{width:min(1160px,calc(100vw - 28px));margin:0 auto;padding:max(22px,env(safe-area-inset-top)) 0 max(24px,env(safe-area-inset-bottom));display:grid;gap:14px}.efSeasonNav{position:sticky;top:max(8px,env(safe-area-inset-top));z-index:5;display:flex;gap:8px;overflow:auto;padding:8px;border-radius:999px;border:1px solid rgba(150,230,255,.13);background:rgba(2,11,21,.72);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efSeasonNav a{white-space:nowrap;text-decoration:none;color:#e7f2ff;border:1px solid rgba(150,230,255,.14);background:rgba(255,255,255,.055);border-radius:999px;padding:9px 13px;font-weight:950;font-size:13px}.efSeasonHero,.efSeasonStats article,.efSeasonRewardNow,.efSeasonReward,.efSeasonPanel{border:1px solid rgba(150,230,255,.15);background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.035));box-shadow:0 24px 80px rgba(0,0,0,.30);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efSeasonHero{border-radius:34px;padding:22px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center}.efSeasonHero span,.efSeasonStats span,.efSeasonRewardNow span,.efSeasonReward span,.efSeasonPanel>span{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:rgba(231,242,255,.56);font-weight:1000}.efSeasonHero h1{margin:6px 0;font-size:44px;line-height:1}.efSeasonHero p,.efSeasonStats small,.efSeasonRewardNow p,.efSeasonReward p,.efSeasonPanel p{margin:0;color:rgba(231,242,255,.68);line-height:1.45}.efSeasonPlay,.efSeasonActions a{min-height:50px;border-radius:999px;border:1px solid rgba(120,240,255,.30);background:linear-gradient(135deg,rgba(120,240,255,.20),rgba(255,220,120,.09));color:#e7f2ff;text-decoration:none;font-weight:1000;padding:0 18px;display:inline-flex;align-items:center;justify-content:center}.efSeasonStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.efSeasonStats article{border-radius:22px;padding:12px;display:grid;gap:5px}.efSeasonStats b{font-size:18px}.efSeasonRewardNow{border-radius:30px;padding:18px;display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.55fr);gap:16px;align-items:center;border-color:rgba(255,220,120,.24)}.efSeasonRewardNow h2,.efSeasonPanel h2{margin:6px 0;font-size:28px}.efSeasonRewardNow ul,.efSeasonReward ul{margin:0;padding:0;list-style:none;display:grid;gap:7px}.efSeasonRewardNow li,.efSeasonReward li{padding:9px 11px;border-radius:14px;background:rgba(2,16,27,.38);border:1px solid rgba(255,255,255,.08);font-weight:850}.efSeasonGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.efSeasonReward{border-radius:26px;padding:15px;display:grid;gap:8px}.efSeasonReward.active{border-color:rgba(255,220,120,.46);box-shadow:0 0 0 3px rgba(255,220,120,.07),0 24px 80px rgba(0,0,0,.30)}.efSeasonReward h3{margin:0;font-size:19px}.efSeasonReward small{color:#fff3a0;font-weight:950}.efSeasonReward li{font-size:12px}.efSeasonSplit{display:grid;grid-template-columns:1fr 1fr;gap:12px}.efSeasonPanel{border-radius:28px;padding:16px;display:grid;gap:10px}.efSeasonPodium{display:grid;grid-template-columns:54px minmax(0,1fr) auto;gap:10px;align-items:center;min-height:56px;border-radius:18px;padding:10px;border:1px solid rgba(255,255,255,.08);background:rgba(2,16,27,.36)}.efSeasonPodium.me{border-color:rgba(120,240,255,.34);background:linear-gradient(90deg,rgba(120,240,255,.14),rgba(255,220,120,.08))}.efSeasonPodium b{font-size:20px;color:#fff3a0}.efSeasonPodium span{display:grid;font-weight:1000}.efSeasonPodium small{color:rgba(231,242,255,.56);font-size:11px}.efSeasonPodium em{font-style:normal;font-weight:1000}.efSeasonGoals{display:grid;gap:8px}.efSeasonGoals p{display:grid;grid-template-columns:30px minmax(0,1fr);gap:8px;align-items:center;padding:8px;border-radius:16px;background:rgba(2,16,27,.30);border:1px solid rgba(255,255,255,.07)}.efSeasonGoals b{width:30px;height:30px;border-radius:12px;display:grid;place-items:center;background:rgba(120,240,255,.14);color:#9eefff}.efSeasonActions{display:flex;gap:8px;flex-wrap:wrap}@media(max-width:980px){.efSeasonHero,.efSeasonRewardNow,.efSeasonSplit{grid-template-columns:1fr}.efSeasonStats,.efSeasonGrid{grid-template-columns:1fr 1fr}.efSeasonPlay{width:100%}}@media(max-width:560px){.efSeasonStats,.efSeasonGrid{grid-template-columns:1fr}.efSeasonHero h1{font-size:36px}}`}</style>
      <style>{`.efSeason{isolation:isolate;position:relative;overflow-x:hidden;background:#020915!important;background-image:linear-gradient(180deg,rgba(2,9,21,.14),rgba(2,9,21,.72)),url("/game/assets/lobby/lobby-bg-station-16x9.png")!important;background-size:cover!important;background-position:center!important;background-attachment:fixed!important}.efSeason:before{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse at 50% 18%,rgba(53,216,255,.20),transparent 36%),linear-gradient(90deg,rgba(2,9,21,.42),transparent 32%,transparent 68%,rgba(2,9,21,.42))}.efSeasonShell{position:relative;z-index:1;padding-bottom:calc(98px + env(safe-area-inset-bottom))!important}.efSeasonHero,.efSeasonStats article,.efSeasonRewardNow,.efSeasonReward,.efSeasonPanel,.efSeasonNav{border-radius:8px!important;border-color:rgba(88,210,255,.22)!important;background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.025)),rgba(5,18,32,.62)!important;box-shadow:0 18px 60px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.08)!important}.efLobbyBottomNav{position:fixed;left:50%;bottom:max(12px,env(safe-area-inset-bottom));z-index:20;transform:translateX(-50%);width:min(520px,calc(100vw - 24px));border:1px solid rgba(88,210,255,.25);border-radius:999px;padding:8px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.025)),rgba(5,18,32,.72);box-shadow:0 18px 60px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efLobbyBottomNav a{min-height:54px;border-radius:999px;display:grid;place-items:center;align-content:center;gap:2px;text-decoration:none;color:rgba(234,247,255,.62);font-size:11px;font-weight:950}.efLobbyBottomNav span{font-size:16px}.efLobbyBottomNav b{font-size:11px}@media(max-width:560px){.efLobbyBottomNav{width:calc(100vw - 18px)}}`}</style>
    </main>
  );
}
