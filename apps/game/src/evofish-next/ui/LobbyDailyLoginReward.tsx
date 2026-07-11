import React from "react";

type Reward = { day: number; pearls: number; corals: number };
type State = { lastClaimDate: string; streak: number };

const KEY = "evofish_daily_login_v2";
const REWARDS: Reward[] = [
  { day: 1, pearls: 300, corals: 0 },
  { day: 2, pearls: 500, corals: 0 },
  { day: 3, pearls: 750, corals: 1 },
  { day: 4, pearls: 1000, corals: 0 },
  { day: 5, pearls: 1500, corals: 1 },
  { day: 6, pearls: 2500, corals: 2 },
  { day: 7, pearls: 5000, corals: 5 },
];

function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

function readState(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { lastClaimDate: "", streak: 0 };
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      lastClaimDate: typeof parsed.lastClaimDate === "string" ? parsed.lastClaimDate : "",
      streak: Math.max(0, Math.floor(Number(parsed.streak) || 0)),
    };
  } catch {
    return { lastClaimDate: "", streak: 0 };
  }
}

function saveKey() {
  const id = (localStorage.getItem("evofish_next_active_profile_v1") || "main").trim() || "main";
  return id === "main" ? "evofish_next_save_v1" : `evofish_next_save_v1__profile_${id}`;
}

function grant(reward: Reward) {
  const key = saveKey();
  const raw = localStorage.getItem(key);
  if (!raw) return false;
  const save = JSON.parse(raw) as Record<string, unknown>;
  const economy = save.economy && typeof save.economy === "object" ? { ...(save.economy as Record<string, unknown>) } : {};
  economy.pearls = Math.max(0, Math.floor(Number(economy.pearls) || 0)) + reward.pearls;
  economy.corals = Math.max(0, Math.floor(Number(economy.corals) || 0)) + reward.corals;
  save.economy = economy;
  localStorage.setItem(key, JSON.stringify(save));
  window.dispatchEvent(new CustomEvent("evofish_next_save_changed"));
  return true;
}

export function LobbyDailyLoginReward() {
  const [state, setState] = React.useState<State>(() => readState());
  const [open, setOpen] = React.useState(true);
  const [message, setMessage] = React.useState("");
  const today = dateKey();
  const claimed = state.lastClaimDate === today;
  const nextStreak = claimed ? state.streak : state.lastClaimDate === yesterdayKey() ? state.streak + 1 : 1;
  const day = ((Math.max(1, nextStreak) - 1) % 7) + 1;
  const reward = REWARDS[day - 1];

  const claim = () => {
    if (claimed) return;
    if (!grant(reward)) {
      setMessage("Сначала создай профиль EvoFish.");
      return;
    }
    const next = { lastClaimDate: today, streak: nextStreak };
    localStorage.setItem(KEY, JSON.stringify(next));
    setState(next);
    setMessage(`Получено: ${reward.pearls.toLocaleString("ru-RU")} жемчуга${reward.corals ? ` + ${reward.corals} крист.` : ""}`);
  };

  return (
    <div className="efDailyLobby">
      <button className="efDailyFab" onClick={() => setOpen((v) => !v)}>🎁{!claimed ? <b>!</b> : null}</button>
      {open ? (
        <section className="efDailyPanel">
          <header><div><small>ЕЖЕДНЕВНЫЙ ВХОД</small><h2>День {day} из 7</h2></div><button onClick={() => setOpen(false)}>×</button></header>
          <div className="efDailyTrack">{REWARDS.map((item) => <div key={item.day} className={item.day === day ? "active" : ""}><span>День {item.day}</span><strong>{item.corals ? "💎" : "🐚"}</strong><em>{item.pearls.toLocaleString("ru-RU")}</em></div>)}</div>
          <div className="efDailyClaim"><span>Сегодня: 🐚 {reward.pearls.toLocaleString("ru-RU")}{reward.corals ? ` · 💎 ${reward.corals}` : ""}</span><button disabled={claimed} onClick={claim}>{claimed ? "Получено ✓" : "Забрать"}</button></div>
          {message ? <p>{message}</p> : null}
        </section>
      ) : null}
      <style>{`
        .efDailyLobby{position:fixed;right:max(12px,env(safe-area-inset-right));top:calc(max(10px,env(safe-area-inset-top)) + 72px);z-index:50000;font-family:system-ui,-apple-system,sans-serif;color:#fff}.efDailyFab{position:absolute;right:0;top:0;width:56px;height:56px;border-radius:18px;border:1px solid rgba(120,230,255,.4);background:linear-gradient(145deg,#16445d,#071724);font-size:26px;box-shadow:0 14px 34px rgba(0,0,0,.38)}.efDailyFab b{position:absolute;right:-4px;top:-4px;width:21px;height:21px;border-radius:50%;background:#ff5269;font-size:13px;line-height:21px}.efDailyPanel{position:absolute;right:0;top:66px;width:min(620px,calc(100vw - 20px));padding:16px;border-radius:22px;background:linear-gradient(180deg,rgba(6,31,47,.98),rgba(2,14,24,.98));border:1px solid rgba(120,230,255,.25);box-shadow:0 24px 70px rgba(0,0,0,.55)}.efDailyPanel header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.efDailyPanel h2{margin:2px 0 0;font-size:22px}.efDailyPanel header small{color:#79e8ff;font-weight:900;letter-spacing:.14em}.efDailyPanel header button{width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font-size:24px}.efDailyTrack{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}.efDailyTrack div{padding:8px 3px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(120,230,255,.12);display:grid;place-items:center;gap:4px;opacity:.62}.efDailyTrack div.active{opacity:1;border-color:#69e5ff;background:rgba(55,190,225,.18)}.efDailyTrack span{font-size:8px}.efDailyTrack strong{font-size:18px}.efDailyTrack em{font-size:9px;font-style:normal;font-weight:900}.efDailyClaim{margin-top:12px;padding:12px;border-radius:15px;background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:space-between;gap:10px}.efDailyClaim span{font-size:13px;font-weight:900}.efDailyClaim button{min-height:40px;padding:0 15px;border-radius:13px;border:1px solid rgba(100,240,255,.4);background:linear-gradient(180deg,#39cfe9,#167ca7);color:#fff;font-weight:1000}.efDailyClaim button:disabled{background:rgba(255,255,255,.07);color:#74d4a7}.efDailyPanel p{margin:10px 0 0;color:#8ff1c5;font-size:12px}@media(max-width:640px){.efDailyLobby{top:calc(max(8px,env(safe-area-inset-top)) + 58px);right:max(8px,env(safe-area-inset-right))}.efDailyFab{width:50px;height:50px}.efDailyPanel{top:58px;padding:13px}.efDailyTrack{gap:4px}.efDailyTrack div{padding:6px 2px}.efDailyTrack span{font-size:7px}.efDailyTrack strong{font-size:16px}.efDailyTrack em{font-size:8px}.efDailyClaim{flex-direction:column;align-items:stretch}.efDailyClaim button{width:100%}}
      `}</style>
    </div>
  );
}
