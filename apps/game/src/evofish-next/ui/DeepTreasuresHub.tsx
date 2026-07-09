import React, { useEffect, useMemo, useState } from "react";
import { navigate } from "../../router";
import { loadEvoFishNextSave, saveEvoFishNextSave } from "../state/nextSaveStore";
import { xpToNextAccountLevel } from "../content/account";

type RewardKind = "xp" | "pearls" | "diamonds" | "coins" | "darkCaveKey" | "rareChest" | "veryRareSkin" | "mythicSkin";
type RewardStatus = "pending" | "claimed" | "lost";
type DeepTab = "roulette" | "gate" | "keys" | "history" | "skins";

type RewardDefinition = {
  kind: RewardKind;
  label: string;
  chance: number;
  baseAmount: number;
  amountLabel: string;
  tone: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
};

type PendingReward = {
  id: string;
  kind: RewardKind;
  label: string;
  baseAmount: number;
  multiplier: number;
  amountLabel: string;
  tone: RewardDefinition["tone"];
};

type RewardHistoryItem = {
  id: string;
  label: string;
  kind: RewardKind;
  amount: number;
  multiplier: number;
  status: RewardStatus;
  createdAt: string;
  tone: RewardDefinition["tone"];
};

type DeepTreasuresState = {
  diamonds: number;
  coins: number;
  darkCaveKeys: number;
  darkCaveUnlocked: boolean;
  rewardHistory: RewardHistoryItem[];
  unlockedRareSkins: Record<string, boolean>;
  spinsWithoutKey: number;
  spinsWithoutVeryRareSkin: number;
};

const SPIN_COST = 5000;
const REQUIRED_LEVEL = 45;
const REQUIRED_KEYS = 3;
const MAX_HISTORY = 30;
const STORAGE_KEY = "evofish_deep_treasures_v1";

const REWARDS: RewardDefinition[] = [
  { kind: "xp", label: "Опыт", chance: 35, baseAmount: 650, amountLabel: "XP", tone: "common" },
  { kind: "pearls", label: "Жемчуг", chance: 25, baseAmount: 1800, amountLabel: "жемчуга", tone: "uncommon" },
  { kind: "diamonds", label: "Алмазы", chance: 15, baseAmount: 35, amountLabel: "алмазов", tone: "rare" },
  { kind: "coins", label: "Монеты", chance: 12, baseAmount: 2500, amountLabel: "монет", tone: "common" },
  { kind: "darkCaveKey", label: "Ключ DARK CAVE", chance: 8, baseAmount: 1, amountLabel: "ключ", tone: "legendary" },
  { kind: "rareChest", label: "Редкий сундук", chance: 3, baseAmount: 1, amountLabel: "сундук", tone: "epic" },
  { kind: "veryRareSkin", label: "Очень редкий скин", chance: 1.8, baseAmount: 1, amountLabel: "скин", tone: "legendary" },
  { kind: "mythicSkin", label: "Мифический скин", chance: 0.2, baseAmount: 1, amountLabel: "скин", tone: "mythic" }
];

const RARE_SKINS = [
  { id: "abyss-phantom", title: "Фантом Бездны", rarity: "Очень редкий", glow: "✦" },
  { id: "dark-cave-crown", title: "Корона DARK CAVE", rarity: "Мифический", glow: "👑" }
] as const;

function format(value: number) {
  return Math.max(0, Math.floor(value || 0)).toLocaleString("ru-RU");
}

function makeDefaultState(): DeepTreasuresState {
  return {
    diamonds: 0,
    coins: 0,
    darkCaveKeys: 0,
    darkCaveUnlocked: false,
    rewardHistory: [],
    unlockedRareSkins: {},
    spinsWithoutKey: 0,
    spinsWithoutVeryRareSkin: 0
  };
}

function readState(): DeepTreasuresState {
  if (typeof window === "undefined") return makeDefaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeDefaultState();
    const parsed = JSON.parse(raw) as Partial<DeepTreasuresState>;
    return {
      ...makeDefaultState(),
      ...parsed,
      diamonds: Math.max(0, Math.floor(parsed.diamonds || 0)),
      coins: Math.max(0, Math.floor(parsed.coins || 0)),
      darkCaveKeys: Math.max(0, Math.floor(parsed.darkCaveKeys || 0)),
      rewardHistory: Array.isArray(parsed.rewardHistory) ? parsed.rewardHistory.slice(0, MAX_HISTORY) : [],
      unlockedRareSkins: parsed.unlockedRareSkins || {},
      spinsWithoutKey: Math.max(0, Math.floor(parsed.spinsWithoutKey || 0)),
      spinsWithoutVeryRareSkin: Math.max(0, Math.floor(parsed.spinsWithoutVeryRareSkin || 0))
    };
  } catch {
    return makeDefaultState();
  }
}

function writeState(state: DeepTreasuresState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, rewardHistory: state.rewardHistory.slice(0, MAX_HISTORY) }));
}

function addAccountXp(save: ReturnType<typeof loadEvoFishNextSave>, amount: number) {
  let xp = Math.max(0, Math.floor(save.account.xp + amount));
  let level = Math.max(1, Math.floor(save.account.level || 1));
  let xpToNext = Math.max(1, Math.floor(save.account.xpToNext || xpToNextAccountLevel(level)));

  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    xpToNext = xpToNextAccountLevel(level);
  }

  return {
    ...save,
    account: {
      ...save.account,
      level,
      xp,
      xpToNext,
      totalXp: Math.max(0, Math.floor(save.account.totalXp || 0)) + Math.max(0, Math.floor(amount))
    }
  };
}

function adjustedRewards(state: DeepTreasuresState) {
  return REWARDS.map((reward) => {
    let chance = reward.chance;
    if (reward.kind === "darkCaveKey" && state.spinsWithoutKey >= 40) {
      chance += Math.min(6, Math.floor((state.spinsWithoutKey - 39) / 5) * 0.75);
    }
    if ((reward.kind === "veryRareSkin" || reward.kind === "mythicSkin") && state.spinsWithoutVeryRareSkin >= 70) {
      chance += reward.kind === "veryRareSkin" ? Math.min(2.2, Math.floor((state.spinsWithoutVeryRareSkin - 69) / 10) * 0.25) : Math.min(0.35, Math.floor((state.spinsWithoutVeryRareSkin - 69) / 15) * 0.04);
    }
    return { ...reward, chance };
  });
}

function rollReward(state: DeepTreasuresState): PendingReward {
  const rewards = adjustedRewards(state);
  const total = rewards.reduce((sum, reward) => sum + reward.chance, 0);
  let cursor = Math.random() * total;
  for (const reward of rewards) {
    cursor -= reward.chance;
    if (cursor <= 0) {
      return { ...reward, id: crypto.randomUUID(), multiplier: 1 };
    }
  }
  const fallback = rewards[0];
  return { ...fallback, id: crypto.randomUUID(), multiplier: 1 };
}

function rewardText(reward: PendingReward | RewardHistoryItem) {
  const amount = Math.max(1, Math.floor(reward.baseAmount ? reward.baseAmount * reward.multiplier : reward.amount));
  if (reward.kind === "darkCaveKey" || reward.kind === "rareChest" || reward.kind === "veryRareSkin" || reward.kind === "mythicSkin") return `${reward.label} ×${amount}`;
  return `${format(amount)} ${"amountLabel" in reward ? reward.amountLabel : ""}`.trim();
}

function addHistory(state: DeepTreasuresState, reward: PendingReward, status: RewardStatus): DeepTreasuresState {
  const amount = Math.max(1, Math.floor(reward.baseAmount * reward.multiplier));
  return {
    ...state,
    rewardHistory: [
      { id: reward.id, label: reward.label, kind: reward.kind, amount, multiplier: reward.multiplier, status, createdAt: new Date().toISOString(), tone: reward.tone },
      ...state.rewardHistory
    ].slice(0, MAX_HISTORY)
  };
}

function applyRewardToState(state: DeepTreasuresState, reward: PendingReward) {
  const amount = Math.max(1, Math.floor(reward.baseAmount * reward.multiplier));
  const next = { ...state, unlockedRareSkins: { ...state.unlockedRareSkins } };

  if (reward.kind === "diamonds") next.diamonds += amount;
  if (reward.kind === "coins") next.coins += amount;
  if (reward.kind === "darkCaveKey") next.darkCaveKeys += amount;
  if (reward.kind === "veryRareSkin") next.unlockedRareSkins["abyss-phantom"] = true;
  if (reward.kind === "mythicSkin") next.unlockedRareSkins["dark-cave-crown"] = true;

  return next;
}

function applyRewardToSave(reward: PendingReward) {
  const amount = Math.max(1, Math.floor(reward.baseAmount * reward.multiplier));
  const save = loadEvoFishNextSave();
  if (reward.kind === "pearls") saveEvoFishNextSave({ ...save, economy: { ...save.economy, pearls: save.economy.pearls + amount } });
  if (reward.kind === "xp") saveEvoFishNextSave(addAccountXp(save, amount));
}

function statusText(status: RewardStatus) {
  if (status === "claimed") return "Забрано";
  if (status === "lost") return "Потеряно";
  return "Ожидает";
}

export function DeepTreasuresHub() {
  const [save, setSave] = useState(() => loadEvoFishNextSave());
  const [state, setState] = useState(() => readState());
  const [tab, setTab] = useState<DeepTab>("roulette");
  const [pending, setPending] = useState<PendingReward | null>(null);
  const [message, setMessage] = useState("Глубинная рулетка готова к прокруту.");
  const [chestFailIndex, setChestFailIndex] = useState<number | null>(null);
  const [chestOpen, setChestOpen] = useState<number | null>(null);

  const chances = useMemo(() => adjustedRewards(state), [state]);

  const refresh = () => {
    setSave(loadEvoFishNextSave());
    setState(readState());
  };

  useEffect(() => {
    writeState(state);
  }, [state]);

  const commitState = (next: DeepTreasuresState) => {
    setState(next);
    writeState(next);
  };

  const startSpin = () => {
    const freshSave = loadEvoFishNextSave();
    const freshState = readState();
    if (pending) {
      setMessage("Сначала забери награду или рискни удвоить.");
      return;
    }
    if (freshSave.economy.pearls < SPIN_COST) {
      setMessage("Недостаточно жемчуга");
      return;
    }

    const paidSave = { ...freshSave, economy: { ...freshSave.economy, pearls: freshSave.economy.pearls - SPIN_COST } };
    saveEvoFishNextSave(paidSave);
    setSave(paidSave);

    const reward = rollReward(freshState);
    const counters = {
      ...freshState,
      spinsWithoutKey: reward.kind === "darkCaveKey" ? 0 : freshState.spinsWithoutKey + 1,
      spinsWithoutVeryRareSkin: reward.kind === "veryRareSkin" || reward.kind === "mythicSkin" ? 0 : freshState.spinsWithoutVeryRareSkin + 1
    };
    commitState(counters);
    setPending(reward);
    setChestFailIndex(null);
    setChestOpen(null);
    setMessage(`Выпало: ${reward.label}. Забрать или удвоить?`);
  };

  const claimReward = () => {
    if (!pending) return;
    applyRewardToSave(pending);
    const awarded = applyRewardToState(readState(), pending);
    const withHistory = addHistory(awarded, pending, "claimed");
    commitState(withHistory);
    setPending(null);
    setChestFailIndex(null);
    setChestOpen(null);
    setMessage(`Награда получена: ${rewardText(pending)}`);
    refresh();
  };

  const startRisk = () => {
    if (!pending) return;
    if (pending.multiplier >= 16) {
      setMessage("Максимальный множитель x16. Забери награду.");
      return;
    }
    setChestFailIndex(Math.floor(Math.random() * 3));
    setChestOpen(null);
    setMessage("Выбери сундук. В двух сундуках победа, один забирает награду.");
  };

  const chooseChest = (index: number) => {
    if (!pending || chestFailIndex === null || chestOpen !== null) return;
    setChestOpen(index);
    if (index === chestFailIndex) {
      const withHistory = addHistory(readState(), pending, "lost");
      commitState(withHistory);
      setPending(null);
      setMessage("Награда потеряна");
      return;
    }

    const nextReward = { ...pending, multiplier: Math.min(16, pending.multiplier * 2) };
    setPending(nextReward);
    setChestFailIndex(null);
    setMessage(`Успех. Текущий множитель: x${nextReward.multiplier}`);
  };

  const openDarkCave = () => {
    const fresh = readState();
    if (save.account.level < REQUIRED_LEVEL) {
      setMessage(`DARK CAVE откроется на ${REQUIRED_LEVEL} уровне`);
      return;
    }
    if (fresh.darkCaveUnlocked) {
      setMessage("Вход в DARK CAVE открыт. Локация готова.");
      return;
    }
    if (fresh.darkCaveKeys < REQUIRED_KEYS) {
      setMessage("Нужно 3 ключа DARK CAVE");
      return;
    }
    const next = { ...fresh, darkCaveKeys: fresh.darkCaveKeys - REQUIRED_KEYS, darkCaveUnlocked: true };
    commitState(next);
    setMessage("Ворота DARK CAVE открыты навсегда");
  };

  const gateStatus = save.account.level < REQUIRED_LEVEL
    ? `DARK CAVE откроется на ${REQUIRED_LEVEL} уровне`
    : state.darkCaveUnlocked
      ? "Ворота открыты"
      : state.darkCaveKeys >= REQUIRED_KEYS
        ? "Можно открыть ворота"
        : "Нужно 3 ключа DARK CAVE";

  return (
    <main className="efDeepTreasures">
      <div className="efDeepGlow" aria-hidden="true"><i /><i /><i /></div>
      <section className="efDeepShell">
        <header className="efDeepHeader">
          <button className="efDeepBack" type="button" onClick={() => navigate("/game")}>← Лобби</button>
          <div>
            <span>НОВАЯ ЛОКАЦИЯ · DARK CAVE</span>
            <h1>Сокровища глубин</h1>
            <p>Прокрут стоит {format(SPIN_COST)} жемчуга. Собери 3 ключа и открой ворота с 45 уровня.</p>
          </div>
          <aside className="efDeepWallet" aria-label="Кошелек">
            <b>Жемчуг: {format(save.economy.pearls)}</b>
            <b>Алмазы: {format(state.diamonds)}</b>
            <b>Монеты: {format(state.coins)}</b>
          </aside>
        </header>

        <nav className="efDeepTabs" aria-label="Разделы Сокровищ глубин">
          <button className={tab === "roulette" ? "active" : ""} onClick={() => setTab("roulette")}>Рулетка</button>
          <button className={tab === "gate" ? "active" : ""} onClick={() => setTab("gate")}>Ворота DARK CAVE</button>
          <button className={tab === "keys" ? "active" : ""} onClick={() => setTab("keys")}>Ключи</button>
          <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>История наград</button>
          <button className={tab === "skins" ? "active" : ""} onClick={() => setTab("skins")}>Редкие скины</button>
        </nav>

        <section className="efDeepMessage">{message}</section>

        {tab === "roulette" ? (
          <section className="efDeepGrid">
            <article className="efDeepRouletteCard">
              <div className="efRouletteWheel" data-spin={pending ? "true" : "false"}>
                {REWARDS.map((reward, index) => <span key={reward.kind} style={{ transform: `rotate(${index * 45}deg)` }}>{reward.label}</span>)}
                <strong>{pending ? pending.label : "SPIN"}</strong>
              </div>
              {pending ? (
                <div className={`efPendingReward ${pending.tone}`}>
                  <span>Текущая награда</span>
                  <h2>{pending.label}</h2>
                  <p>{rewardText(pending)} · множитель x{pending.multiplier}</p>
                  <div className="efDeepActions">
                    <button type="button" onClick={claimReward}>Забрать</button>
                    <button type="button" disabled={pending.multiplier >= 16} onClick={startRisk}>Удвоить</button>
                  </div>
                </div>
              ) : (
                <div className="efDeepActions">
                  <button type="button" onClick={startSpin}>Прокрутить за {format(SPIN_COST)} жемчуга</button>
                </div>
              )}
            </article>

            <article className="efDeepPanel">
              <h2>Шансы выпадения</h2>
              <div className="efChanceList">
                {chances.map((reward) => (
                  <div key={reward.kind} className={reward.tone}>
                    <span>{reward.label}</span>
                    <b>{reward.chance.toFixed(reward.chance % 1 ? 1 : 0)}%</b>
                  </div>
                ))}
              </div>
            </article>

            <article className="efDeepPanel efChestPanel">
              <h2>Удвоение</h2>
              <p>Два сундука дают победу. Один сундук забирает награду. Цепочка: x2, x4, x8, x16.</p>
              <div className="efChestGrid">
                {[0, 1, 2].map((index) => (
                  <button key={index} type="button" disabled={!pending || chestFailIndex === null || chestOpen !== null} onClick={() => chooseChest(index)} className={chestOpen === index ? (index === chestFailIndex ? "fail" : "win") : ""}>
                    {chestOpen === index ? (index === chestFailIndex ? "✕" : "✓") : "?"}
                    <span>Сундук {index + 1}</span>
                  </button>
                ))}
              </div>
            </article>
          </section>
        ) : null}

        {tab === "gate" ? (
          <section className="efDeepGate">
            <div className="efGateVisual"><span>🔒</span><b>DARK CAVE</b><i /></div>
            <article className="efDeepPanel">
              <h2>{gateStatus}</h2>
              <p>Уровень игрока: {save.account.level} / {REQUIRED_LEVEL}</p>
              <p>Ключи DARK CAVE: {Math.min(state.darkCaveKeys, REQUIRED_KEYS)} / {REQUIRED_KEYS}</p>
              <button type="button" onClick={openDarkCave}>{state.darkCaveUnlocked ? "Войти в DARK CAVE" : "Открыть ворота"}</button>
            </article>
          </section>
        ) : null}

        {tab === "keys" ? (
          <section className="efDeepPanel">
            <h2>Ключи</h2>
            <div className="efKeyProgress"><b>Ключи DARK CAVE: {state.darkCaveKeys} / {REQUIRED_KEYS}</b><span>{state.darkCaveUnlocked ? "Ворота открыты" : "Ворота закрыты"}</span></div>
          </section>
        ) : null}

        {tab === "history" ? (
          <section className="efDeepPanel">
            <h2>История наград</h2>
            <div className="efHistoryList">
              {state.rewardHistory.length ? state.rewardHistory.map((item) => (
                <div key={item.id} className={item.tone}>
                  <span>{item.label}</span>
                  <b>{format(item.amount)} · x{item.multiplier}</b>
                  <em>{statusText(item.status)}</em>
                </div>
              )) : <p>История пока пустая.</p>}
            </div>
          </section>
        ) : null}

        {tab === "skins" ? (
          <section className="efSkinPreviewGrid">
            {RARE_SKINS.map((skin) => (
              <article key={skin.id} className={`efSkinPreviewCard ${state.unlockedRareSkins[skin.id] ? "unlocked" : "locked"}`}>
                <div>{skin.glow}</div>
                <span>{skin.rarity}</span>
                <h2>{skin.title}</h2>
                <p>{state.unlockedRareSkins[skin.id] ? "Открыт" : "Не открыт"}</p>
              </article>
            ))}
          </section>
        ) : null}
      </section>

      <style>{`
        .efDeepTreasures{min-height:100vh;min-height:100dvh;background:radial-gradient(circle at 50% -10%,rgba(31,213,255,.20),transparent 34%),radial-gradient(circle at 50% 115%,rgba(2,3,12,.88),#020814 50%),linear-gradient(180deg,#031827,#020713);color:#ecfbff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;overflow-x:hidden}.efDeepGlow{position:fixed;inset:0;pointer-events:none;overflow:hidden}.efDeepGlow:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.025),transparent,rgba(82,218,255,.035))}.efDeepGlow i{position:absolute;border-radius:999px;background:rgba(116,230,255,.45);box-shadow:0 0 28px rgba(53,216,255,.35);animation:efDeepRise 10s linear infinite}.efDeepGlow i:nth-child(1){left:12%;bottom:-40px;width:8px;height:8px}.efDeepGlow i:nth-child(2){left:67%;bottom:-60px;width:11px;height:11px;animation-delay:-4s}.efDeepGlow i:nth-child(3){left:86%;bottom:-50px;width:6px;height:6px;animation-delay:-7s}@keyframes efDeepRise{to{transform:translateY(-110vh);opacity:.15}}.efDeepShell{position:relative;z-index:1;width:min(1320px,calc(100vw - 28px));margin:0 auto;padding:max(18px,env(safe-area-inset-top)) 0 calc(38px + env(safe-area-inset-bottom));display:grid;gap:16px}.efDeepHeader{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:16px;align-items:center}.efDeepHeader>div span{display:block;color:#8beaff;font-size:12px;font-weight:1000;letter-spacing:.18em}.efDeepHeader h1{font-size:clamp(38px,7vw,86px);line-height:.9;margin:8px 0;text-transform:uppercase}.efDeepHeader p{margin:0;color:rgba(236,251,255,.72);max-width:760px}.efDeepBack,.efDeepTabs button,.efDeepActions button,.efDeepPanel button,.efChestGrid button{appearance:none;font-family:inherit;cursor:pointer;touch-action:manipulation}.efDeepBack{border:1px solid rgba(100,220,255,.25);background:rgba(2,17,32,.64);color:#ecfbff;border-radius:999px;padding:12px 16px;font-weight:1000}.efDeepWallet{display:grid;gap:7px;min-width:190px}.efDeepWallet b,.efDeepMessage,.efDeepPanel,.efDeepRouletteCard,.efPendingReward,.efSkinPreviewCard{border:1px solid rgba(95,220,255,.23);background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.026)),rgba(3,20,36,.68);box-shadow:0 24px 80px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.10);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efDeepWallet b{border-radius:14px;padding:10px 12px;text-align:right}.efDeepTabs{display:flex;gap:9px;overflow-x:auto;padding-bottom:2px}.efDeepTabs button{white-space:nowrap;border:1px solid rgba(95,220,255,.18);background:rgba(2,17,32,.58);color:#ecfbff;border-radius:999px;padding:12px 15px;font-weight:1000}.efDeepTabs button.active{background:linear-gradient(90deg,rgba(53,216,255,.24),rgba(255,214,102,.16));border-color:rgba(255,214,102,.42);box-shadow:0 0 24px rgba(53,216,255,.13)}.efDeepMessage{border-radius:18px;padding:13px 16px;color:#d8f8ff;font-weight:900}.efDeepGrid{display:grid;grid-template-columns:minmax(280px,1.05fr) minmax(260px,.75fr) minmax(260px,.72fr);gap:16px;align-items:start}.efDeepRouletteCard,.efDeepPanel{border-radius:28px;padding:18px}.efRouletteWheel{position:relative;width:min(100%,430px);aspect-ratio:1;margin:0 auto 18px;border-radius:999px;border:1px solid rgba(255,214,102,.35);background:conic-gradient(from 0deg,rgba(255,255,255,.10),rgba(53,216,255,.18),rgba(255,214,102,.17),rgba(186,92,255,.18),rgba(255,255,255,.10));box-shadow:inset 0 0 80px rgba(0,0,0,.42),0 0 70px rgba(53,216,255,.16);display:grid;place-items:center;overflow:hidden}.efRouletteWheel[data-spin="true"]{animation:efWheelPulse 1.2s ease-in-out infinite alternate}@keyframes efWheelPulse{to{filter:brightness(1.25)}}.efRouletteWheel span{position:absolute;inset:22px;text-align:center;font-size:11px;font-weight:1000;color:rgba(236,251,255,.72);transform-origin:center}.efRouletteWheel strong{width:38%;aspect-ratio:1;border-radius:999px;display:grid;place-items:center;text-align:center;padding:12px;background:rgba(2,10,22,.84);border:1px solid rgba(255,214,102,.45);font-size:clamp(18px,3vw,28px);box-shadow:0 0 38px rgba(255,214,102,.13)}.efDeepActions{display:flex;flex-wrap:wrap;gap:10px}.efDeepActions button,.efDeepPanel button{border:0;border-radius:999px;min-height:48px;padding:0 18px;background:linear-gradient(90deg,#35d8ff,#ffd666);color:#03111d;font-weight:1000}.efDeepActions button:disabled{opacity:.45;cursor:not-allowed}.efPendingReward{border-radius:22px;padding:16px}.efPendingReward h2,.efDeepPanel h2{margin:4px 0 8px}.efPendingReward span,.efDeepPanel p{color:rgba(236,251,255,.72)}.efChanceList,.efHistoryList{display:grid;gap:9px}.efChanceList div,.efHistoryList div{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;border-radius:14px;padding:10px 12px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.075)}.legendary,.efChanceList .legendary,.efHistoryList .legendary{border-color:rgba(255,214,102,.40)!important;box-shadow:0 0 26px rgba(255,214,102,.10)}.mythic,.efChanceList .mythic,.efHistoryList .mythic{border-color:rgba(207,112,255,.48)!important;box-shadow:0 0 34px rgba(207,112,255,.18)}.rare{border-color:rgba(59,139,255,.32)!important}.epic{border-color:rgba(142,100,255,.34)!important}.efChestPanel p{line-height:1.45}.efChestGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.efChestGrid button{min-height:116px;border-radius:22px;border:1px solid rgba(255,214,102,.24);background:rgba(255,255,255,.06);color:#ecfbff;font-size:30px;font-weight:1000;display:grid;place-items:center}.efChestGrid button span{font-size:12px;color:rgba(236,251,255,.72)}.efChestGrid button.win{background:rgba(50,255,174,.16);border-color:rgba(50,255,174,.42)}.efChestGrid button.fail{background:rgba(255,62,96,.16);border-color:rgba(255,62,96,.42)}.efDeepGate{display:grid;grid-template-columns:minmax(280px,.9fr) minmax(280px,1fr);gap:16px;align-items:stretch}.efGateVisual{min-height:420px;border-radius:32px;border:1px solid rgba(255,214,102,.24);background:radial-gradient(circle at 50% 30%,rgba(53,216,255,.17),transparent 34%),linear-gradient(180deg,rgba(2,8,18,.22),rgba(0,0,0,.44));display:grid;place-items:center;text-align:center;position:relative;overflow:hidden}.efGateVisual span{font-size:82px;filter:drop-shadow(0 0 24px rgba(255,214,102,.35))}.efGateVisual b{position:absolute;bottom:28px;font-size:clamp(30px,5vw,62px);letter-spacing:.12em}.efGateVisual i{position:absolute;inset:auto 18% 110px;height:2px;background:linear-gradient(90deg,transparent,#35d8ff,transparent);box-shadow:0 0 28px #35d8ff}.efKeyProgress{display:grid;gap:8px;padding:20px;border-radius:20px;background:rgba(255,255,255,.055);border:1px solid rgba(255,214,102,.22)}.efKeyProgress b{font-size:28px}.efKeyProgress span{color:#ffd666;font-weight:1000}.efSkinPreviewGrid{display:grid;grid-template-columns:repeat(2,minmax(260px,1fr));gap:16px}.efSkinPreviewCard{border-radius:28px;padding:24px;min-height:260px;display:grid;align-content:end;position:relative;overflow:hidden}.efSkinPreviewCard div{position:absolute;right:22px;top:18px;font-size:60px;filter:drop-shadow(0 0 26px rgba(255,214,102,.3))}.efSkinPreviewCard h2{font-size:34px;margin:6px 0}.efSkinPreviewCard.locked{filter:saturate(.62);opacity:.76}.efSkinPreviewCard.unlocked{border-color:rgba(255,214,102,.45);box-shadow:0 0 70px rgba(255,214,102,.12)}@media(max-width:980px){.efDeepHeader{grid-template-columns:1fr}.efDeepWallet{grid-template-columns:repeat(3,1fr)}.efDeepWallet b{text-align:left}.efDeepGrid,.efDeepGate,.efSkinPreviewGrid{grid-template-columns:1fr}}@media(max-width:620px){.efDeepShell{width:min(100%,calc(100vw - 18px))}.efDeepWallet{grid-template-columns:1fr}.efDeepTabs button{padding:10px 12px;font-size:12px}.efDeepRouletteCard,.efDeepPanel{border-radius:20px;padding:14px}.efChestGrid button{min-height:92px}.efGateVisual{min-height:300px}}
      `}</style>
    </main>
  );
}

export default DeepTreasuresHub;
