import React, { useEffect, useMemo, useState } from "react";
import { Link } from "../../router";
import { rewardForRank } from "../content/seasonRewards";
import { fetchLeaderboardMe, type LeaderboardMeResponse } from "../leaderboard/leaderboardClient";
import { EVOFISH_LEADERBOARD_LAST_SUBMIT_KEY, EVOFISH_LEADERBOARD_SUBMIT_EVENT } from "../leaderboard/leaderboardIdentity";
import { resetEvoFishNextRun } from "../state/nextSaveStore";

type RunPayload = {
  playerId?: string;
  nickname?: string;
  level?: number;
  tier?: number;
  maxMass?: number;
  kills?: number;
  bossKills?: number;
  artifacts?: number;
  darkCaveCleared?: boolean;
  survivalSeconds?: number;
  skinId?: string;
  form?: string;
};

type SubmitResult = {
  ok?: boolean;
  automatic?: boolean;
  queued?: boolean;
  flagged?: boolean;
  rank?: number | null;
  error?: string;
  run?: {
    score?: number;
    rank?: number;
  } | null;
};

type SubmitEntry = {
  at?: string;
  attemptAt?: number;
  result?: SubmitResult;
  payload?: RunPayload;
};

type Snapshot = {
  id: string;
  payload: RunPayload;
  result: SubmitResult;
  score: number;
  rank: number | null;
  at: number;
};

function asNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function calculateScore(payload: RunPayload) {
  return Math.max(0,
    Math.floor(asNumber(payload.level, 1)) * 100 +
    Math.floor(asNumber(payload.tier, 1)) * 35 +
    Math.floor(asNumber(payload.kills, 0)) * 12 +
    Math.floor(asNumber(payload.bossKills, 0)) * 650 +
    Math.floor(asNumber(payload.artifacts, 0)) * 320 +
    Math.floor(asNumber(payload.maxMass, 1)) * 7 +
    Math.floor(asNumber(payload.survivalSeconds, 20) * 1.5) +
    (payload.darkCaveCleared ? 2500 : 0)
  );
}

function format(value: number) {
  return Math.max(0, Math.floor(value || 0)).toLocaleString("ru-RU");
}

function readLastAutomaticSubmit(): Snapshot | null {
  try {
    const raw = localStorage.getItem(EVOFISH_LEADERBOARD_LAST_SUBMIT_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as SubmitEntry;
    const result = entry.result || {};
    const payload = entry.payload || {};
    const at = Number(entry.attemptAt || (entry.at ? new Date(entry.at).getTime() : 0));
    const fresh = Number.isFinite(at) && Date.now() - at <= 120_000;
    if (!fresh || !result.automatic || !payload.playerId) return null;

    const score = Math.max(0, Math.floor(asNumber(result.run?.score, calculateScore(payload))));
    const rank = result.rank || result.run?.rank || null;
    return {
      id: `${at}_${payload.playerId}_${score}`,
      payload,
      result,
      score,
      rank,
      at
    };
  } catch {
    return null;
  }
}

export function RunCompleteOverlay() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [me, setMe] = useState<LeaderboardMeResponse | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const next = readLastAutomaticSubmit();
      if (!next || next.id === dismissedId) return;
      setSnapshot(next);
    };

    sync();
    const timer = window.setInterval(sync, 1000);
    const onSubmit = () => sync();
    window.addEventListener(EVOFISH_LEADERBOARD_SUBMIT_EVENT, onSubmit as EventListener);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(EVOFISH_LEADERBOARD_SUBMIT_EVENT, onSubmit as EventListener);
    };
  }, [dismissedId]);

  useEffect(() => {
    if (!snapshot) return;
    let live = true;
    window.setTimeout(() => {
      fetchLeaderboardMe()
        .then((result) => { if (live) setMe(result); })
        .catch(() => {});
    }, 700);
    return () => { live = false; };
  }, [snapshot?.id]);

  const rank = me?.rank || snapshot?.rank || null;
  const reward = useMemo(() => rewardForRank(rank), [rank]);

  if (!snapshot) return null;

  const payload = snapshot.payload;
  const flagged = Boolean(snapshot.result.flagged);
  const handlePlayAgain = () => {
    resetEvoFishNextRun();
    window.location.assign(`/game/play?run=${Date.now()}`);
  };
  const handleClose = () => {
    setDismissedId(snapshot.id);
    setSnapshot(null);
  };

  return (
    <div className="efRunCompleteOverlay" role="dialog" aria-modal="true">
      <section className="efRunCompleteCard">
        <button className="efRunCompleteClose" onClick={handleClose} aria-label="Закрыть">×</button>
        <span className="efRunCompleteEyebrow">RUN COMPLETE · SEASON LIVE</span>
        <h2>Забег завершён</h2>
        <p className="efRunCompleteLead">Результат отправлен в онлайн-рейтинг. Лучший score по твоему ID остаётся в сезоне.</p>

        <div className="efRunCompleteScore">
          <article><span>Score</span><b>{format(snapshot.score)}</b></article>
          <article><span>Место</span><b>{rank ? `#${rank}` : "—"}</b></article>
          <article><span>LV</span><b>{Math.floor(asNumber(payload.level, 1))}</b></article>
          <article><span>Kills</span><b>{format(asNumber(payload.kills, 0))}</b></article>
        </div>

        <div className="efRunCompleteStats">
          <span>Mass {format(asNumber(payload.maxMass, 1))}</span>
          <span>Tier {Math.floor(asNumber(payload.tier, 1))}</span>
          <span>Artifacts {format(asNumber(payload.artifacts, 0))}</span>
          <span>{payload.darkCaveCleared ? "Dark Cave ✓" : "Dark Cave —"}</span>
        </div>

        <section className="efRunReward">
          <div>
            <span>Текущая сезонная награда</span>
            <h3>{reward.placement} · {reward.title}</h3>
            <p>{flagged ? "Результат отмечен для проверки и пока не попадает в публичный TOP." : "Если сезон закончится сейчас, этот ранг даст такой набор."}</p>
          </div>
          <ul>{reward.rewards.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <div className="efRunCompleteActions">
          <button className="primary" onClick={handlePlayAgain}>Играть снова</button>
          <Link to="/game/leaderboard">Лидеры</Link>
          <Link to="/game/season">Сезон</Link>
          <Link to="/game/skins">Улучшения</Link>
        </div>
      </section>

      <style>{`.efRunCompleteOverlay{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:max(16px,env(safe-area-inset-top)) 14px max(16px,env(safe-area-inset-bottom));background:radial-gradient(circle at 50% 20%,rgba(120,240,255,.16),transparent 36%),rgba(1,6,12,.76);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efRunCompleteCard{width:min(680px,100%);position:relative;border:1px solid rgba(150,230,255,.20);border-radius:34px;padding:20px;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.052));box-shadow:0 30px 110px rgba(0,0,0,.52);display:grid;gap:14px}.efRunCompleteClose{position:absolute;right:14px;top:14px;width:38px;height:38px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(2,16,27,.46);color:#e7f2ff;font-size:24px;font-weight:900}.efRunCompleteEyebrow,.efRunCompleteScore span,.efRunReward span{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:rgba(231,242,255,.56);font-weight:1000}.efRunCompleteCard h2{margin:4px 0 0;font-size:40px;line-height:1}.efRunCompleteLead,.efRunReward p{margin:0;color:rgba(231,242,255,.70);line-height:1.45}.efRunCompleteScore{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.efRunCompleteScore article{border:1px solid rgba(255,255,255,.10);background:rgba(2,16,27,.38);border-radius:20px;padding:12px;display:grid;gap:5px}.efRunCompleteScore b{font-size:22px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efRunCompleteStats{display:flex;gap:8px;flex-wrap:wrap}.efRunCompleteStats span{padding:8px 10px;border-radius:999px;background:rgba(120,240,255,.10);border:1px solid rgba(120,240,255,.16);font-weight:900;font-size:12px}.efRunReward{border:1px solid rgba(255,220,120,.24);border-radius:24px;padding:14px;background:linear-gradient(135deg,rgba(255,220,120,.10),rgba(120,240,255,.06));display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,.55fr);gap:12px}.efRunReward h3{margin:4px 0;font-size:22px}.efRunReward ul{margin:0;padding:0;list-style:none;display:grid;gap:6px}.efRunReward li{padding:8px 10px;border-radius:14px;background:rgba(2,16,27,.36);border:1px solid rgba(255,255,255,.08);font-size:12px;font-weight:850}.efRunCompleteActions{display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:8px}.efRunCompleteActions a,.efRunCompleteActions button{min-height:46px;border-radius:999px;border:1px solid rgba(120,240,255,.24);background:rgba(120,240,255,.10);color:#e7f2ff;text-decoration:none;font-weight:1000;display:inline-flex;align-items:center;justify-content:center;padding:0 14px}.efRunCompleteActions .primary{background:linear-gradient(135deg,rgba(120,240,255,.22),rgba(255,220,120,.12));border-color:rgba(120,240,255,.38)}@media(max-width:620px){.efRunCompleteCard{border-radius:28px;padding:16px}.efRunCompleteCard h2{font-size:32px}.efRunCompleteScore,.efRunReward,.efRunCompleteActions{grid-template-columns:1fr 1fr}.efRunCompleteActions .primary{grid-column:1/-1}}@media(max-width:430px){.efRunCompleteScore,.efRunReward,.efRunCompleteActions{grid-template-columns:1fr}}`}</style>
    </div>
  );
}
