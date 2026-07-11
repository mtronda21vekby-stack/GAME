import React from "react";

type DailyReward = {
  day: number;
  pearls: number;
  corals: number;
  label: string;
};

type DailyLoginState = {
  lastClaimDate: string;
  streak: number;
  totalClaims: number;
};

const DAILY_LOGIN_KEY = "evofish_daily_login_v1";

const REWARDS: DailyReward[] = [
  { day: 1, pearls: 300, corals: 0, label: "Стартовый запас" },
  { day: 2, pearls: 500, corals: 0, label: "Жемчужный улов" },
  { day: 3, pearls: 750, corals: 1, label: "Коралловый бонус" },
  { day: 4, pearls: 1_000, corals: 0, label: "Глубокий запас" },
  { day: 5, pearls: 1_500, corals: 1, label: "Редкая находка" },
  { day: 6, pearls: 2_500, corals: 2, label: "Большой улов" },
  { day: 7, pearls: 5_000, corals: 5, label: "Недельный сундук" },
];

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function previousDateKey(date = new Date()) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - 1);
  return localDateKey(copy);
}

function safeReadState(): DailyLoginState {
  try {
    const raw = localStorage.getItem(DAILY_LOGIN_KEY);
    if (!raw) return { lastClaimDate: "", streak: 0, totalClaims: 0 };
    const parsed = JSON.parse(raw) as Partial<DailyLoginState>;
    return {
      lastClaimDate: typeof parsed.lastClaimDate === "string" ? parsed.lastClaimDate : "",
      streak: Math.max(0, Math.floor(Number(parsed.streak) || 0)),
      totalClaims: Math.max(0, Math.floor(Number(parsed.totalClaims) || 0)),
    };
  } catch {
    return { lastClaimDate: "", streak: 0, totalClaims: 0 };
  }
}

function safeWriteState(state: DailyLoginState) {
  try {
    localStorage.setItem(DAILY_LOGIN_KEY, JSON.stringify(state));
  } catch {
    // Local rewards remain optional when storage is blocked.
  }
}

function activeSaveKey() {
  try {
    const profileId = (localStorage.getItem("evofish_next_active_profile_v1") || "main").trim() || "main";
    return profileId === "main" ? "evofish_next_save_v1" : `evofish_next_save_v1__profile_${profileId}`;
  } catch {
    return "evofish_next_save_v1";
  }
}

function applyReward(reward: DailyReward) {
  const primaryKey = activeSaveKey();
  const keys = primaryKey === "evofish_next_save_v1" ? [primaryKey] : [primaryKey, "evofish_next_save_v1"];

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const save = JSON.parse(raw) as Record<string, unknown>;
      const economy = save.economy && typeof save.economy === "object"
        ? { ...(save.economy as Record<string, unknown>) }
        : {};
      economy.pearls = Math.max(0, Math.floor(Number(economy.pearls) || 0)) + reward.pearls;
      economy.corals = Math.max(0, Math.floor(Number(economy.corals) || 0)) + reward.corals;
      save.economy = economy;
      localStorage.setItem(key, JSON.stringify(save));
      window.dispatchEvent(new CustomEvent("evofish_next_save_changed"));
      window.dispatchEvent(new Event("storage"));
      return true;
    } catch {
      // Try fallback save key.
    }
  }

  return false;
}

function rewardForStreak(streak: number) {
  return REWARDS[(Math.max(1, streak) - 1) % REWARDS.length];
}

export function DailyLoginReward() {
  const [state, setState] = React.useState<DailyLoginState>(() => safeReadState());
  const [expanded, setExpanded] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const today = localDateKey();
  const alreadyClaimed = state.lastClaimDate === today;
  const nextStreak = state.lastClaimDate === previousDateKey() ? state.streak + 1 : state.lastClaimDate === today ? state.streak : 1;
  const reward = rewardForStreak(alreadyClaimed ? state.streak : nextStreak);
  const activeDay = ((Math.max(1, alreadyClaimed ? state.streak : nextStreak) - 1) % 7) + 1;

  React.useEffect(() => {
    if (!alreadyClaimed) setExpanded(true);
  }, [alreadyClaimed]);

  const claim = () => {
    if (alreadyClaimed) return;
    const ok = applyReward(reward);
    if (!ok) {
      setMessage("Сначала запусти EvoFish один раз, чтобы создать профиль сохранения.");
      return;
    }

    const next: DailyLoginState = {
      lastClaimDate: today,
      streak: nextStreak,
      totalClaims: state.totalClaims + 1,
    };
    safeWriteState(next);
    setState(next);
    setMessage(`Получено: ${reward.pearls.toLocaleString("ru-RU")} жемчуга${reward.corals ? ` и ${reward.corals} крист.` : ""}`);
  };

  return (
    <div className={`dailyLogin ${expanded ? "open" : ""}`}>
      <button className="dailyLoginFab" onClick={() => setExpanded((value) => !value)} aria-label="Ежедневная награда">
        <span>🎁</span>
        {!alreadyClaimed ? <b>!</b> : null}
      </button>

      {expanded ? (
        <section className="dailyLoginPanel" aria-label="Ежедневный вход">
          <header>
            <div>
              <span className="dailyEyebrow">ЕЖЕДНЕВНЫЙ ВХОД</span>
              <h2>Серия: {Math.max(1, alreadyClaimed ? state.streak : nextStreak)} дней</h2>
            </div>
            <button className="dailyClose" onClick={() => setExpanded(false)} aria-label="Закрыть">×</button>
          </header>

          <div className="dailyRewardTrack">
            {REWARDS.map((item) => {
              const claimed = alreadyClaimed && item.day <= activeDay;
              const current = item.day === activeDay;
              return (
                <div key={item.day} className={`dailyRewardDay ${claimed ? "claimed" : ""} ${current ? "current" : ""}`}>
                  <span>День {item.day}</span>
                  <strong>{item.day === 7 ? "🧰" : item.corals ? "💎" : "🐚"}</strong>
                  <small>{item.pearls.toLocaleString("ru-RU")}</small>
                  {item.corals ? <em>+{item.corals} 💎</em> : <em>жемчуг</em>}
                </div>
              );
            })}
          </div>

          <div className="dailyToday">
            <div>
              <span>Сегодня: {reward.label}</span>
              <b>🐚 {reward.pearls.toLocaleString("ru-RU")}{reward.corals ? `  ·  💎 ${reward.corals}` : ""}</b>
            </div>
            <button disabled={alreadyClaimed} onClick={claim}>
              {alreadyClaimed ? "Получено ✓" : "Забрать подарок"}
            </button>
          </div>
          {message ? <p className="dailyMessage">{message}</p> : null}
        </section>
      ) : null}

      <style>{`
        .dailyLogin{position:fixed;right:max(14px,env(safe-area-inset-right));top:calc(max(14px,env(safe-area-inset-top)) + 76px);z-index:30000;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#eefaff}
        .dailyLoginFab{position:absolute;right:0;top:0;width:58px;height:58px;border-radius:19px;border:1px solid rgba(126,235,255,.34);background:linear-gradient(145deg,rgba(20,74,99,.96),rgba(4,24,39,.96));box-shadow:0 14px 34px rgba(0,0,0,.38),inset 0 1px rgba(255,255,255,.13);display:grid;place-items:center;font-size:28px;cursor:pointer}
        .dailyLoginFab b{position:absolute;right:-4px;top:-5px;min-width:22px;height:22px;border-radius:999px;background:#ff5368;border:2px solid #071925;color:#fff;font-size:13px;line-height:18px}
        .dailyLoginPanel{position:absolute;right:0;top:68px;width:min(620px,calc(100vw - 24px));padding:18px;border-radius:24px;border:1px solid rgba(126,235,255,.25);background:linear-gradient(180deg,rgba(5,31,48,.98),rgba(2,16,28,.98));box-shadow:0 22px 70px rgba(0,0,0,.52);overflow:hidden}
        .dailyLoginPanel:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 0,rgba(90,223,255,.18),transparent 34%),radial-gradient(circle at 10% 100%,rgba(89,255,192,.10),transparent 35%);pointer-events:none}
        .dailyLoginPanel header,.dailyToday,.dailyRewardTrack,.dailyMessage{position:relative;z-index:1}
        .dailyLoginPanel header{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}
        .dailyEyebrow{display:block;color:#72e8ff;font-size:11px;font-weight:1000;letter-spacing:.16em;margin-bottom:4px}.dailyLoginPanel h2{font-size:22px;line-height:1.1;margin:0;color:#fff}.dailyClose{width:36px;height:36px;min-width:36px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font-size:25px;line-height:1;cursor:pointer}
        .dailyRewardTrack{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:7px;margin-bottom:14px}
        .dailyRewardDay{min-width:0;padding:9px 4px;border-radius:14px;border:1px solid rgba(126,235,255,.12);background:rgba(255,255,255,.035);display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;opacity:.64}.dailyRewardDay span{font-size:9px;font-weight:900;white-space:nowrap}.dailyRewardDay strong{font-size:21px}.dailyRewardDay small{font-size:10px;font-weight:1000;color:#fff}.dailyRewardDay em{font-size:8px;font-style:normal;color:#9eb8c7}.dailyRewardDay.current{opacity:1;border-color:rgba(98,235,255,.58);background:linear-gradient(180deg,rgba(65,190,225,.22),rgba(65,130,225,.09));box-shadow:0 0 22px rgba(70,220,255,.12)}.dailyRewardDay.claimed{opacity:.82}.dailyRewardDay.claimed:after{content:"✓";color:#6fffc1;font-weight:1000;font-size:11px}
        .dailyToday{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px;border-radius:17px;border:1px solid rgba(126,235,255,.17);background:rgba(255,255,255,.045)}.dailyToday div{display:grid;gap:4px}.dailyToday span{font-size:12px;color:#a9c4d2}.dailyToday b{font-size:15px;color:#fff}.dailyToday button{min-height:42px;padding:0 16px;border-radius:14px;border:1px solid rgba(100,240,255,.40);background:linear-gradient(180deg,#39cfe9,#167ca7);color:#fff;font-weight:1000;cursor:pointer;white-space:nowrap}.dailyToday button:disabled{cursor:default;background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.11);color:#78dcb2}
        .dailyMessage{margin:10px 2px 0;color:#8ff1c5;font-size:11px;font-weight:800}
        @media(max-width:700px){.dailyLogin{top:calc(max(8px,env(safe-area-inset-top)) + 62px);right:max(10px,env(safe-area-inset-right))}.dailyLoginFab{width:50px;height:50px;border-radius:17px;font-size:24px}.dailyLoginPanel{top:58px;padding:14px;border-radius:20px}.dailyLoginPanel h2{font-size:19px}.dailyRewardTrack{gap:4px}.dailyRewardDay{padding:7px 2px;border-radius:11px}.dailyRewardDay span{font-size:7.5px}.dailyRewardDay strong{font-size:17px}.dailyRewardDay small{font-size:8.5px}.dailyRewardDay em{font-size:7px}.dailyToday{align-items:stretch;flex-direction:column}.dailyToday button{width:100%}}
      `}</style>
    </div>
  );
}
