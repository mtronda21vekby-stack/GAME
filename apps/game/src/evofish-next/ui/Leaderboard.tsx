import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "../../router";
import {
  buildLeaderboardPayloadFromSave,
  fetchLeaderboardMe,
  fetchLeaderboardOnline,
  fetchLeaderboardSeason,
  fetchLeaderboardTop,
  getLeaderboardPlayerId,
  leaderboardSubmitCooldownSeconds,
  submitLeaderboardRun,
  syncLeaderboardProfile,
  type LeaderboardMeResponse,
  type LeaderboardOnlineResponse,
  type LeaderboardRow,
  type LeaderboardSeasonResponse,
  type LeaderboardTopResponse
} from "../leaderboard/leaderboardClient";
import { EVOFISH_NEXT_VERSION } from "../version";

const LIVE_REFRESH_MS = 5_000;

function format(value: number) {
  return Math.max(0, Math.floor(value || 0)).toLocaleString("ru-RU");
}

function playerCode(value?: string | null) {
  const clean = String(value || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-6)
    .toUpperCase();
  return `ID ${clean || "LOCAL"}`;
}

function timeLeft(endsAt?: string) {
  if (!endsAt) return "—";
  const ms = new Date(endsAt).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return "скоро новый сезон";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return `${days}д ${hours}ч`;
}

function rowTone(row: LeaderboardRow, myId: string) {
  return row.playerId === myId ? "me" : row.rank && row.rank <= 3 ? "top" : "";
}

function playerSafeStatus(top: LeaderboardTopResponse | null) {
  if (!top) return "Загрузка рейтинга…";
  if (top.ok) return "Live-рейтинг обновлён.";
  return "Онлайн-сезон скоро будет доступен.";
}

function formatUpdatedAt(value: number | null) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function Leaderboard() {
  const [season, setSeason] = useState<LeaderboardSeasonResponse | null>(null);
  const [top, setTop] = useState<LeaderboardTopResponse | null>(null);
  const [me, setMe] = useState<LeaderboardMeResponse | null>(null);
  const [online, setOnline] = useState<LeaderboardOnlineResponse | null>(null);
  const [cooldown, setCooldown] = useState(() => leaderboardSubmitCooldownSeconds());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [message, setMessage] = useState("Загрузка рейтинга…");
  const [submitting, setSubmitting] = useState(false);
  const profileSyncedRef = useRef(false);
  const myId = useMemo(() => getLeaderboardPlayerId(), []);

  const ensureProfileSynced = useCallback(async () => {
    if (profileSyncedRef.current) return;
    profileSyncedRef.current = true;
    await syncLeaderboardProfile().catch(() => {});
  }, []);

  const reload = useCallback(async (mode: "initial" | "live" = "live") => {
    if (mode === "initial") setLoading(true);
    else setRefreshing(true);

    if (mode === "initial") await ensureProfileSynced();

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
    setCooldown(leaderboardSubmitCooldownSeconds());
    setLastUpdated(Date.now());
    setLoading(false);
    setRefreshing(false);
    setMessage(playerSafeStatus(topResult));
  }, [ensureProfileSynced]);

  useEffect(() => {
    reload("initial");
    const timer = window.setInterval(() => reload("live"), LIVE_REFRESH_MS);
    const cooldownTimer = window.setInterval(() => setCooldown(leaderboardSubmitCooldownSeconds()), 1000);
    const onFocus = () => reload("live");
    const onVisible = () => { if (!document.hidden) reload("live"); };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(cooldownTimer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reload]);

  const submitCurrent = async () => {
    const currentCooldown = leaderboardSubmitCooldownSeconds();
    if (currentCooldown > 0) {
      setCooldown(currentCooldown);
      setMessage(`Результат уже отправлен. Повтор через ${currentCooldown} сек.`);
      return;
    }

    setSubmitting(true);
    setMessage("Отправляю текущий результат…");
    const result = await submitLeaderboardRun(buildLeaderboardPayloadFromSave());
    if (result.ok) setMessage(result.flagged ? "Результат отправлен, но отмечен для проверки." : `Результат отправлен${result.rank ? ` · место #${result.rank}` : ""}.`);
    else if (result.error === "submit_cooldown") setMessage(`Результат уже отправлен. Повтор через ${result.retryAfterSeconds || 60} сек.`);
    else setMessage("Онлайн-сезон сейчас недоступен. Результат можно отправить позже.");
    setCooldown(leaderboardSubmitCooldownSeconds());
    setSubmitting(false);
    await reload("live");
  };

  const rows = top?.rows || [];
  const best = me?.best || null;
  const offline = top ? !top.ok : false;
  const onlineCount = online?.online || 0;
  const submitDisabled = submitting || offline || cooldown > 0;

  return (
    <main className="efLeaderboard">
      <section className="efLbShell">
        <header className="efLbHero">
          <div>
            <Link to="/game" className="efLbBack">← Назад</Link>
            <span>ONLINE · LIVE AUTO REFRESH</span>
            <h1>Лидеры</h1>
            <p>Live-рейтинг обновляется сам каждые 5 секунд. Никнейм синхронизируется с аккаунтом перед загрузкой таблицы.</p>
          </div>
          <button onClick={submitCurrent} disabled={submitDisabled}>{offline ? "Сезон скоро" : submitting ? "Отправка…" : cooldown > 0 ? `Повтор через ${cooldown}с` : "Отправить вручную"}</button>
        </header>

        <section className="efLbStats">
          <article><span>Сезон</span><b>{season?.season?.title || "—"}</b><small>До конца: {timeLeft(season?.season?.endsAt)}</small></article>
          <article><span>Live update</span><b>{refreshing ? "Обновляю…" : "5 сек"}</b><small>последнее: {formatUpdatedAt(lastUpdated)}</small></article>
          <article><span>Online now</span><b>{format(onlineCount)}</b><small>{online?.ok ? "активны за 90 сек" : "ожидает подключение"}</small></article>
          <article><span>Моё место</span><b>{me?.rank ? `#${me.rank}` : "—"}</b><small>{playerCode(myId)}</small></article>
          <article><span>Мой лучший score</span><b>{best ? format(best.score) : "—"}</b><small>{best ? `LV ${best.level} · ${format(best.kills)} kills` : "ещё нет результата"}</small></article>
          <article><span>Статус</span><b>{offline ? "Сезон скоро" : "Online"}</b><small>{message}</small></article>
        </section>

        {offline ? (
          <section className="efLbOffline">
            <h2>Сезонный рейтинг запускается</h2>
            <p>Рейтинг уже встроен в игру. Как только онлайн-база будет подключена на сервере, результаты начнут появляться здесь автоматически.</p>
          </section>
        ) : null}

        <section className={`efLbBoard ${refreshing ? "refreshing" : ""}`}>
          <div className="efLbBoardHead">
            <span>#</span><span>Игрок / ID</span><span>Score</span><span>LV</span><span>Kills</span><span>Пещера</span>
          </div>
          {loading ? <div className="efLbEmpty">Загрузка…</div> : null}
          {!loading && rows.length === 0 ? <div className="efLbEmpty">Пока нет результатов. Играй — live score обновится автоматически.</div> : null}
          {rows.map((row) => (
            <article key={row.id} className={`efLbRow ${rowTone(row, myId)}`}>
              <span className="rank">#{row.rank || "—"}</span>
              <span className="player"><b>{row.nickname}</b><small>{playerCode(row.playerId)} · {row.form || "fish"} · {row.skinId || "default"}</small></span>
              <span>{format(row.score)}</span>
              <span>LV {row.level}</span>
              <span>{format(row.kills)}</span>
              <span>{row.darkCaveCleared ? "✓" : "—"}</span>
            </article>
          ))}
        </section>
      </section>
      <style>{`.efLeaderboard{min-height:100vh;background:radial-gradient(circle at 15% 0,rgba(54,245,255,.16),transparent 36%),#020b15;color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efLbShell{width:min(1120px,calc(100vw - 28px));margin:0 auto;padding:max(22px,env(safe-area-inset-top)) 0 max(24px,env(safe-area-inset-bottom));display:grid;gap:14px}.efLbHero,.efLbStats article,.efLbBoard,.efLbOffline{border:1px solid rgba(150,230,255,.15);background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.035));box-shadow:0 24px 80px rgba(0,0,0,.30);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efLbHero{border-radius:34px;padding:20px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center}.efLbBack{display:inline-flex;margin-bottom:10px;color:#9eefff;text-decoration:none;font-weight:900}.efLbHero span,.efLbStats span{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:rgba(231,242,255,.56);font-weight:1000}.efLbHero h1{margin:4px 0;font-size:42px;line-height:1}.efLbHero p,.efLbStats small,.efLbOffline p{margin:0;color:rgba(231,242,255,.68);line-height:1.45}.efLbHero button{min-height:50px;border-radius:999px;border:1px solid rgba(120,240,255,.30);background:linear-gradient(135deg,rgba(120,240,255,.18),rgba(255,220,120,.10));color:#e7f2ff;font-weight:1000;padding:0 17px;cursor:pointer}.efLbHero button:disabled{opacity:.55}.efLbStats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.efLbStats article{border-radius:22px;padding:12px;display:grid;gap:5px}.efLbStats b{font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efLbOffline{border-color:rgba(255,220,120,.24);border-radius:26px;padding:16px}.efLbOffline h2{margin:0 0 6px}.efLbBoard{border-radius:28px;padding:10px;overflow:hidden;transition:border-color .2s,box-shadow .2s}.efLbBoard.refreshing{border-color:rgba(120,240,255,.34);box-shadow:0 0 0 3px rgba(120,240,255,.06),0 24px 80px rgba(0,0,0,.30)}.efLbBoardHead,.efLbRow{display:grid;grid-template-columns:54px minmax(0,1.6fr) minmax(84px,.8fr) 72px 80px 78px;gap:8px;align-items:center}.efLbBoardHead{padding:8px 10px;color:rgba(231,242,255,.50);font-size:11px;text-transform:uppercase;letter-spacing:.11em;font-weight:1000}.efLbRow{min-height:58px;border-top:1px solid rgba(255,255,255,.07);padding:8px 10px}.efLbRow.me{background:linear-gradient(90deg,rgba(120,240,255,.16),rgba(255,220,120,.08));border-radius:16px;border-top:0;margin:4px 0}.efLbRow.top .rank{color:#fff3a0}.efLbRow span{overflow:hidden;text-overflow:ellipsis}.efLbRow .rank{font-weight:1000;color:#9eefff}.efLbRow .player{display:grid}.efLbRow .player b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efLbRow .player small{color:rgba(231,242,255,.55);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efLbEmpty{padding:24px;text-align:center;color:rgba(231,242,255,.62)}@media(max-width:1100px){.efLbStats{grid-template-columns:1fr 1fr 1fr}}@media(max-width:760px){.efLbHero{grid-template-columns:1fr}.efLbHero button{width:100%}.efLbStats{grid-template-columns:1fr 1fr}.efLbBoard{overflow:auto}.efLbBoardHead,.efLbRow{min-width:650px}}@media(max-width:520px){.efLbStats{grid-template-columns:1fr}.efLbHero h1{font-size:36px}}`}</style>
    </main>
  );
}
