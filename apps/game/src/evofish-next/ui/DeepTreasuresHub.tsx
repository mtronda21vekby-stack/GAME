import React, { useEffect, useMemo, useState } from "react";
import { navigate } from "../../router";
import { xpToNextAccountLevel } from "../content/account";
import { EVOFISH_SKIN_BY_ID } from "../content/skins";
import { loadEvoFishNextSave, saveEvoFishNextSave } from "../state/nextSaveStore";

type RewardKind = "xp" | "pearls" | "diamonds" | "ancientCrystal" | "trenchKey" | "rareChest" | "veryRareSkin" | "mythicSkin";
type RewardStatus = "claimed" | "lost";
type DeepTab = "roulette" | "gate" | "keys" | "history" | "skins";
type RewardTone = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
type ReelPhase = "idle" | "rolling" | "settled";

type RewardDefinition = {
  kind: RewardKind;
  label: string;
  chance: number;
  baseAmount: number;
  amountLabel: string;
  tone: RewardTone;
  icon: string;
};

type PendingReward = RewardDefinition & {
  id: string;
  multiplier: number;
};

type RewardHistoryItem = {
  id: string;
  label: string;
  kind: RewardKind;
  amount: number;
  multiplier: number;
  status: RewardStatus;
  createdAt: string;
  tone: RewardTone;
};

type DeepTreasuresState = {
  diamonds: number;
  ancientCrystals: number;
  trenchKeys: number;
  deepTrenchUnlocked: boolean;
  rewardHistory: RewardHistoryItem[];
  unlockedRareSkins: Record<string, boolean>;
  spinsWithoutKey: number;
  spinsWithoutVeryRareSkin: number;
};

const SPIN_COST = 5000;
const REQUIRED_ACCOUNT_LEVEL = 25;
const REQUIRED_CHARACTER_LEVEL = 45;
const REQUIRED_KEYS = 3;
const MAX_HISTORY = 30;
const STORAGE_KEY = "evofish_deep_treasures_v1";
const VERY_RARE_SKIN_ID = "mega_nebula";
const MYTHIC_SKIN_ID = "shark_shadow";
const WINNING_INDEX = 42;
const REEL_CARD_WIDTH = 168;
const REEL_CARD_GAP = 10;
const REEL_CARD_STEP = REEL_CARD_WIDTH + REEL_CARD_GAP;
const REEL_TARGET_OFFSET = WINNING_INDEX * REEL_CARD_STEP + REEL_CARD_WIDTH / 2;

const REWARDS: RewardDefinition[] = [
  { kind: "xp", label: "Опыт", chance: 35, baseAmount: 650, amountLabel: "опыта", tone: "common", icon: "✦" },
  { kind: "pearls", label: "Жемчуг", chance: 25, baseAmount: 1800, amountLabel: "жемчуга", tone: "uncommon", icon: "🐚" },
  { kind: "diamonds", label: "Алмазы", chance: 15, baseAmount: 35, amountLabel: "алмазов", tone: "rare", icon: "💎" },
  { kind: "ancientCrystal", label: "Ancient Crystal", chance: 12, baseAmount: 45, amountLabel: "кристаллов", tone: "epic", icon: "🔮" },
  { kind: "trenchKey", label: "Ключ ВПАДИНЫ", chance: 8, baseAmount: 1, amountLabel: "ключ", tone: "legendary", icon: "🔑" },
  { kind: "rareChest", label: "Древний сундук", chance: 3, baseAmount: 1, amountLabel: "сундук", tone: "epic", icon: "📦" },
  { kind: "veryRareSkin", label: "Очень редкий скин", chance: 1.8, baseAmount: 1, amountLabel: "скин", tone: "legendary", icon: "✦" },
  { kind: "mythicSkin", label: "Мифический скин", chance: 0.2, baseAmount: 1, amountLabel: "скин", tone: "mythic", icon: "👑" }
];

const RARE_SKINS = [
  { id: VERY_RARE_SKIN_ID, title: EVOFISH_SKIN_BY_ID[VERY_RARE_SKIN_ID]?.name || "Мега Туманность", rarity: "Очень редкий", glow: "✦" },
  { id: MYTHIC_SKIN_ID, title: EVOFISH_SKIN_BY_ID[MYTHIC_SKIN_ID]?.name || "Акула Тень", rarity: "Мифический", glow: "👑" }
] as const;

function format(value: number) {
  return Math.max(0, Math.floor(value || 0)).toLocaleString("ru-RU");
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `trench-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function makeDefaultState(): DeepTreasuresState {
  return {
    diamonds: 0,
    ancientCrystals: 0,
    trenchKeys: 0,
    deepTrenchUnlocked: false,
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
    const parsed = JSON.parse(raw) as Partial<DeepTreasuresState> & {
      coins?: number;
      darkCaveKeys?: number;
      darkCaveUnlocked?: boolean;
    };
    const trenchKeys = parsed.trenchKeys ?? parsed.darkCaveKeys ?? 0;
    return {
      ...makeDefaultState(),
      ...parsed,
      diamonds: Math.max(0, Math.floor(parsed.diamonds || 0)),
      ancientCrystals: Math.max(0, Math.floor(parsed.ancientCrystals || 0)),
      trenchKeys: Math.max(0, Math.floor(trenchKeys)),
      deepTrenchUnlocked: Boolean(parsed.deepTrenchUnlocked || parsed.darkCaveUnlocked),
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

function adjustedRewards(state: DeepTreasuresState): RewardDefinition[] {
  return REWARDS.map((reward) => {
    let chance = reward.chance;
    if (reward.kind === "trenchKey" && state.spinsWithoutKey >= 40) {
      chance += Math.min(6, Math.floor((state.spinsWithoutKey - 39) / 5) * 0.75);
    }
    if ((reward.kind === "veryRareSkin" || reward.kind === "mythicSkin") && state.spinsWithoutVeryRareSkin >= 70) {
      chance += reward.kind === "veryRareSkin"
        ? Math.min(2.2, Math.floor((state.spinsWithoutVeryRareSkin - 69) / 10) * 0.25)
        : Math.min(0.35, Math.floor((state.spinsWithoutVeryRareSkin - 69) / 15) * 0.04);
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
    if (cursor <= 0) return { ...reward, id: makeId(), multiplier: 1 };
  }
  return { ...rewards[0], id: makeId(), multiplier: 1 };
}

function sampleVisualReward(state: DeepTreasuresState): PendingReward {
  const reward = rollReward(state);
  return { ...reward, id: makeId(), multiplier: 1 };
}

function buildReel(state: DeepTreasuresState, winner?: PendingReward) {
  const reel = Array.from({ length: 56 }, () => sampleVisualReward(state));
  if (winner) reel[WINNING_INDEX] = winner;
  return reel;
}

function pendingAmount(reward: PendingReward) {
  return Math.max(1, Math.floor(reward.baseAmount * reward.multiplier));
}

function pendingRewardText(reward: PendingReward) {
  const amount = pendingAmount(reward);
  if (reward.kind === "trenchKey" || reward.kind === "rareChest" || reward.kind === "veryRareSkin" || reward.kind === "mythicSkin") return `${reward.label} ×${amount}`;
  return `${format(amount)} ${reward.amountLabel}`;
}

function addHistory(state: DeepTreasuresState, reward: PendingReward, status: RewardStatus): DeepTreasuresState {
  return {
    ...state,
    rewardHistory: [
      { id: reward.id, label: reward.label, kind: reward.kind, amount: pendingAmount(reward), multiplier: reward.multiplier, status, createdAt: new Date().toISOString(), tone: reward.tone },
      ...state.rewardHistory
    ].slice(0, MAX_HISTORY)
  };
}

function grantSkinToSave(kind: "veryRareSkin" | "mythicSkin", state: DeepTreasuresState) {
  const skinId = kind === "veryRareSkin" ? VERY_RARE_SKIN_ID : MYTHIC_SKIN_ID;
  const save = loadEvoFishNextSave();
  if (!EVOFISH_SKIN_BY_ID[skinId]) return { state: { ...state, diamonds: state.diamonds + 150 }, message: "Скин не найден в коллекции. Выдана компенсация алмазами." };
  if (save.loadout.ownedSkins[skinId]) return { state: { ...state, diamonds: state.diamonds + (kind === "mythicSkin" ? 500 : 250) }, message: "Скин уже был открыт. Выдана компенсация алмазами." };
  saveEvoFishNextSave({ ...save, loadout: { ...save.loadout, ownedSkins: { ...save.loadout.ownedSkins, [skinId]: true }, equippedSkinId: skinId } });
  return { state: { ...state, unlockedRareSkins: { ...state.unlockedRareSkins, [skinId]: true } }, message: `Новый скин получен: ${EVOFISH_SKIN_BY_ID[skinId].name}` };
}

function applyRewardToState(state: DeepTreasuresState, reward: PendingReward) {
  const amount = pendingAmount(reward);
  let next = { ...state, unlockedRareSkins: { ...state.unlockedRareSkins } };
  let message = "";
  if (reward.kind === "diamonds") next.diamonds += amount;
  if (reward.kind === "ancientCrystal") next.ancientCrystals += amount;
  if (reward.kind === "trenchKey") next.trenchKeys += amount;
  if (reward.kind === "rareChest") next.ancientCrystals += amount * 25;
  if (reward.kind === "veryRareSkin" || reward.kind === "mythicSkin") {
    const grant = grantSkinToSave(reward.kind, next);
    next = grant.state;
    message = grant.message;
  }
  return { state: next, message };
}

function applyRewardToSave(reward: PendingReward) {
  const amount = pendingAmount(reward);
  const save = loadEvoFishNextSave();
  if (reward.kind === "pearls") saveEvoFishNextSave({ ...save, economy: { ...save.economy, pearls: save.economy.pearls + amount } });
  if (reward.kind === "xp") saveEvoFishNextSave(addAccountXp(save, amount));
}

function statusText(status: RewardStatus) {
  return status === "claimed" ? "Забрано" : "Потеряно";
}

function RewardCard(props: { reward: PendingReward; winning?: boolean }) {
  const reward = props.reward;
  return (
    <article className={`efReelCard ${reward.tone} ${props.winning ? "winner" : ""}`}>
      <span className="efReelIcon">{reward.icon}</span>
      <b>{reward.label}</b>
      <small>{pendingRewardText(reward)}</small>
      <em>{reward.tone === "common" ? "обычное" : reward.tone === "uncommon" ? "необычное" : reward.tone === "rare" ? "редкое" : reward.tone === "epic" ? "эпическое" : reward.tone === "legendary" ? "легендарное" : "мифическое"}</em>
    </article>
  );
}

export function DeepTreasuresHub() {
  const [save, setSave] = useState(() => loadEvoFishNextSave());
  const [state, setState] = useState(() => readState());
  const [tab, setTab] = useState<DeepTab>("roulette");
  const [pending, setPending] = useState<PendingReward | null>(null);
  const [message, setMessage] = useState("Древняя рулетка ВПАДИНЫ готова к прокруту.");
  const [chestFailIndex, setChestFailIndex] = useState<number | null>(null);
  const [chestOpen, setChestOpen] = useState<number | null>(null);
  const [reel, setReel] = useState<PendingReward[]>(() => buildReel(readState()));
  const [reelPhase, setReelPhase] = useState<ReelPhase>("idle");
  const [winningId, setWinningId] = useState<string>("");
  const chances = useMemo(() => adjustedRewards(state), [state]);
  const isRolling = reelPhase === "rolling";

  useEffect(() => { writeState(state); }, [state]);

  const refresh = () => {
    setSave(loadEvoFishNextSave());
    setState(readState());
  };

  const commitState = (next: DeepTreasuresState) => {
    setState(next);
    writeState(next);
  };

  const startSpin = () => {
    const freshSave = loadEvoFishNextSave();
    const freshState = readState();
    if (pending || isRolling) {
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
    const nextState = {
      ...freshState,
      spinsWithoutKey: reward.kind === "trenchKey" ? 0 : freshState.spinsWithoutKey + 1,
      spinsWithoutVeryRareSkin: reward.kind === "veryRareSkin" || reward.kind === "mythicSkin" ? 0 : freshState.spinsWithoutVeryRareSkin + 1
    };
    commitState(nextState);
    setPending(null);
    setWinningId(reward.id);
    setReel(buildReel(nextState, reward));
    setReelPhase("idle");
    setChestFailIndex(null);
    setChestOpen(null);
    setMessage("Рулетка запущена. Лента выбирает награду...");

    window.setTimeout(() => setReelPhase("rolling"), 40);
    window.setTimeout(() => {
      setReelPhase("settled");
      setPending(reward);
      setMessage(`Выпало: ${reward.label}. Забрать или удвоить?`);
    }, 3600);
  };

  const claimReward = () => {
    if (!pending || isRolling) return;
    applyRewardToSave(pending);
    const applied = applyRewardToState(readState(), pending);
    const withHistory = addHistory(applied.state, pending, "claimed");
    commitState(withHistory);
    setPending(null);
    setChestFailIndex(null);
    setChestOpen(null);
    setMessage(applied.message || `Награда получена: ${pendingRewardText(pending)}`);
    refresh();
  };

  const startRisk = () => {
    if (!pending || isRolling) return;
    if (pending.multiplier >= 16) {
      setMessage("Максимальный множитель x16. Забери награду.");
      return;
    }
    setChestFailIndex(Math.floor(Math.random() * 3));
    setChestOpen(null);
    setMessage("Выбери сундук. В двух сундуках победа, один забирает награду.");
  };

  const chooseChest = (index: number) => {
    if (!pending || chestFailIndex === null || chestOpen !== null || isRolling) return;
    setChestOpen(index);
    if (index === chestFailIndex) {
      commitState(addHistory(readState(), pending, "lost"));
      setPending(null);
      setMessage("Награда потеряна");
      return;
    }
    const nextReward = { ...pending, multiplier: Math.min(16, pending.multiplier * 2) };
    setPending(nextReward);
    setChestFailIndex(null);
    setMessage(`Успех. Текущий множитель: x${nextReward.multiplier}`);
  };

  const openTrench = () => {
    const freshSave = loadEvoFishNextSave();
    const fresh = readState();
    if (fresh.deepTrenchUnlocked) {
      navigate("/game/trench");
      return;
    }
    if (freshSave.account.level < REQUIRED_ACCOUNT_LEVEL) {
      setMessage(`Аккаунт должен быть ${REQUIRED_ACCOUNT_LEVEL} уровня`);
      return;
    }
    if (freshSave.progress.level < REQUIRED_CHARACTER_LEVEL) {
      setMessage(`Персонаж должен быть ${REQUIRED_CHARACTER_LEVEL} уровня`);
      return;
    }
    if (fresh.trenchKeys < REQUIRED_KEYS) {
      setMessage("Нужно 3 ключа ВПАДИНЫ");
      return;
    }
    commitState({ ...fresh, trenchKeys: fresh.trenchKeys - REQUIRED_KEYS, deepTrenchUnlocked: true });
    setMessage("ВПАДИНА открыта навсегда. Теперь можно войти в новую карту.");
  };

  const accountReady = save.account.level >= REQUIRED_ACCOUNT_LEVEL;
  const characterReady = save.progress.level >= REQUIRED_CHARACTER_LEVEL;
  const keysReady = state.trenchKeys >= REQUIRED_KEYS;
  const gateStatus = state.deepTrenchUnlocked ? "ВПАДИНА открыта" : accountReady && characterReady && keysReady ? "Можно открыть ВПАДИНУ" : "Локация закрыта";

  return (
    <main className="efDeepTreasures">
      <div className="efDeepGlow" aria-hidden="true"><i /><i /><i /></div>
      <section className="efDeepShell">
        <header className="efDeepHeader">
          <button className="efDeepBack" type="button" onClick={() => navigate("/game")}>← Лобби</button>
          <div><span>НОВАЯ КАРТА · ВПАДИНА</span><h1>{tab === "roulette" ? "Древняя рулетка ВПАДИНЫ" : "ВПАДИНА"}</h1><p>Ленточная рулетка, ключи ВПАДИНЫ, Ancient Crystal и редкие скины.</p></div>
          <aside className="efDeepWallet" aria-label="Кошелек"><b>Жемчуг: {format(save.economy.pearls)}</b><b>Алмазы: {format(state.diamonds)}</b><b>Ancient Crystal: {format(state.ancientCrystals)}</b><b>Ключи: {format(state.trenchKeys)}</b></aside>
        </header>

        <nav className="efDeepTabs" aria-label="Разделы ВПАДИНЫ">
          <button type="button" className={tab === "roulette" ? "active" : ""} onClick={() => setTab("roulette")}>Древняя рулетка</button>
          <button type="button" className={tab === "gate" ? "active" : ""} onClick={() => setTab("gate")}>Карта ВПАДИНА</button>
          <button type="button" className={tab === "keys" ? "active" : ""} onClick={() => setTab("keys")}>Ключи</button>
          <button type="button" className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>История наград</button>
          <button type="button" className={tab === "skins" ? "active" : ""} onClick={() => setTab("skins")}>Редкие скины</button>
        </nav>

        <section className="efDeepMessage">{message}</section>

        {tab === "roulette" ? (
          <section className="efDeepGrid">
            <article className="efReelPanel">
              <div className="efReelViewport">
                <div className="efReelMarker"><span /></div>
                <div className="efReelTrackWrap">
                  <div
                    key={`${winningId}-${reel.length}`}
                    className={`efReelTrack ${reelPhase}`}
                    style={{ "--target-offset": `${REEL_TARGET_OFFSET}px` } as React.CSSProperties}
                  >
                    {reel.map((reward, index) => <RewardCard key={`${reward.id}-${index}`} reward={reward} winning={reward.id === winningId && index === WINNING_INDEX} />)}
                  </div>
                </div>
              </div>
              <div className="efDeepActions"><button type="button" disabled={Boolean(pending) || isRolling} onClick={startSpin}>Прокрутить за {format(SPIN_COST)} жемчуга</button></div>
              {pending ? <div className={`efPendingReward ${pending.tone}`}><span>Выигрыш</span><h2>{pending.label}</h2><p>{pendingRewardText(pending)} · множитель x{pending.multiplier}</p><div className="efDeepActions"><button type="button" onClick={claimReward}>Забрать</button><button type="button" disabled={pending.multiplier >= 16} onClick={startRisk}>Удвоить</button></div></div> : null}
            </article>

            <article className="efDeepPanel"><h2>Шансы выпадения</h2><div className="efChanceList">{chances.map((reward) => <div key={reward.kind} className={reward.tone}><span>{reward.icon} {reward.label}</span><b>{reward.chance.toFixed(reward.chance % 1 ? 1 : 0)}%</b></div>)}</div></article>

            <article className="efDeepPanel efChestPanel"><h2>Удвоение</h2><p>Два сундука дают победу. Один сундук забирает награду. Цепочка: x2, x4, x8, x16.</p><div className="efChestGrid">{[0, 1, 2].map((index) => <button key={index} type="button" disabled={!pending || chestFailIndex === null || chestOpen !== null} onClick={() => chooseChest(index)} className={chestOpen === index ? (index === chestFailIndex ? "fail" : "win") : ""}>{chestOpen === index ? (index === chestFailIndex ? "✕" : "✓") : "?"}<span>Сундук {index + 1}</span></button>)}</div></article>
          </section>
        ) : null}

        {tab === "gate" ? <section className="efDeepGate"><div className="efGateVisual"><span>{state.deepTrenchUnlocked ? "🌊" : "🔒"}</span><b>ВПАДИНА</b><i /></div><article className="efDeepPanel"><h2>{gateStatus}</h2><p className={accountReady ? "ok" : "bad"}>Аккаунт: {save.account.level} / {REQUIRED_ACCOUNT_LEVEL}</p><p className={characterReady ? "ok" : "bad"}>Персонаж: {save.progress.level} / {REQUIRED_CHARACTER_LEVEL}</p><p className={keysReady ? "ok" : "bad"}>Ключи ВПАДИНЫ: {Math.min(state.trenchKeys, REQUIRED_KEYS)} / {REQUIRED_KEYS}</p><button type="button" onClick={openTrench}>{state.deepTrenchUnlocked ? "Войти во ВПАДИНУ" : "Открыть ВПАДИНУ"}</button></article></section> : null}
        {tab === "keys" ? <section className="efDeepPanel"><h2>Ключи</h2><div className="efKeyProgress"><b>Ключи ВПАДИНЫ: {state.trenchKeys} / {REQUIRED_KEYS}</b><span>{state.deepTrenchUnlocked ? "ВПАДИНА открыта" : "ВПАДИНА закрыта"}</span></div></section> : null}
        {tab === "history" ? <section className="efDeepPanel"><h2>История наград</h2><div className="efHistoryList">{state.rewardHistory.length ? state.rewardHistory.map((item) => <div key={item.id} className={item.tone}><span>{item.label}</span><b>{format(item.amount)} · x{item.multiplier}</b><em>{statusText(item.status)}</em></div>) : <p>История пока пустая.</p>}</div></section> : null}
        {tab === "skins" ? <section className="efSkinPreviewGrid">{RARE_SKINS.map((skin) => <article key={skin.id} className={`efSkinPreviewCard ${save.loadout.ownedSkins[skin.id] || state.unlockedRareSkins[skin.id] ? "unlocked" : "locked"}`}><div>{skin.glow}</div><span>{skin.rarity}</span><h2>{skin.title}</h2><p>{save.loadout.ownedSkins[skin.id] || state.unlockedRareSkins[skin.id] ? "Открыт" : "Не открыт"}</p></article>)}</section> : null}
      </section>

      <style>{`
        .efDeepTreasures{min-height:100vh;min-height:100dvh;background:radial-gradient(circle at 50% -10%,rgba(31,213,255,.20),transparent 34%),radial-gradient(circle at 50% 115%,rgba(2,3,12,.88),#020814 50%),linear-gradient(180deg,#031827,#020713);color:#ecfbff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;overflow-x:hidden}.efDeepGlow{position:fixed;inset:0;pointer-events:none;overflow:hidden}.efDeepGlow i{position:absolute;border-radius:999px;background:rgba(116,230,255,.45);box-shadow:0 0 28px rgba(53,216,255,.35);animation:efDeepRise 10s linear infinite}.efDeepGlow i:nth-child(1){left:12%;bottom:-40px;width:8px;height:8px}.efDeepGlow i:nth-child(2){left:67%;bottom:-60px;width:11px;height:11px;animation-delay:-4s}.efDeepGlow i:nth-child(3){left:86%;bottom:-50px;width:6px;height:6px;animation-delay:-7s}@keyframes efDeepRise{to{transform:translateY(-110vh);opacity:.15}}.efDeepShell{position:relative;z-index:1;width:min(1320px,calc(100vw - 28px));margin:0 auto;padding:max(18px,env(safe-area-inset-top)) 0 calc(38px + env(safe-area-inset-bottom));display:grid;gap:16px}.efDeepHeader{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:16px;align-items:center}.efDeepHeader>div span{display:block;color:#8beaff;font-size:12px;font-weight:1000;letter-spacing:.18em}.efDeepHeader h1{font-size:clamp(34px,5vw,76px);line-height:.9;margin:8px 0;text-transform:uppercase}.efDeepHeader p{margin:0;color:rgba(236,251,255,.72);max-width:760px}.efDeepBack,.efDeepTabs button,.efDeepActions button,.efDeepPanel button,.efChestGrid button{appearance:none;font-family:inherit;cursor:pointer;touch-action:manipulation}.efDeepBack{border:1px solid rgba(100,220,255,.25);background:rgba(2,17,32,.64);color:#ecfbff;border-radius:999px;padding:12px 16px;font-weight:1000}.efDeepWallet{display:grid;gap:7px;min-width:210px}.efDeepWallet b,.efDeepMessage,.efDeepPanel,.efReelPanel,.efPendingReward,.efSkinPreviewCard{border:1px solid rgba(95,220,255,.23);background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.026)),rgba(3,20,36,.68);box-shadow:0 24px 80px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.10);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efDeepWallet b{border-radius:14px;padding:10px 12px;text-align:right}.efDeepTabs{display:flex;gap:9px;overflow-x:auto;padding-bottom:2px}.efDeepTabs button{white-space:nowrap;border:1px solid rgba(95,220,255,.18);background:rgba(2,17,32,.58);color:#ecfbff;border-radius:999px;padding:12px 15px;font-weight:1000}.efDeepTabs button.active{background:linear-gradient(90deg,rgba(53,216,255,.24),rgba(255,214,102,.16));border-color:rgba(255,214,102,.42);box-shadow:0 0 24px rgba(53,216,255,.13)}.efDeepMessage{border-radius:18px;padding:13px 16px;color:#d8f8ff;font-weight:900}.efDeepGrid{display:grid;grid-template-columns:minmax(360px,1fr) minmax(260px,.58fr) minmax(260px,.58fr);gap:16px;align-items:start}.efReelPanel,.efDeepPanel{border-radius:28px;padding:18px}.efReelViewport{position:relative;min-height:240px;border-radius:28px;overflow:hidden;background:radial-gradient(circle at 50% 50%,rgba(53,216,255,.18),transparent 48%),linear-gradient(180deg,rgba(255,255,255,.08),rgba(0,0,0,.25));border:1px solid rgba(255,214,102,.22);box-shadow:inset 0 0 80px rgba(0,0,0,.36),0 0 70px rgba(53,216,255,.13)}.efReelViewport:before,.efReelViewport:after{content:"";position:absolute;top:0;bottom:0;width:18%;z-index:3;pointer-events:none}.efReelViewport:before{left:0;background:linear-gradient(90deg,rgba(2,8,18,.95),transparent)}.efReelViewport:after{right:0;background:linear-gradient(270deg,rgba(2,8,18,.95),transparent)}.efReelTrackWrap{position:absolute;inset:24px 0;display:flex;align-items:center}.efReelTrack{display:flex;gap:10px;will-change:transform;transform:translate3d(0,0,0)}.efReelTrack.rolling{transition:transform 3.45s cubic-bezier(.08,.82,.12,1);transform:translate3d(calc(50% - var(--target-offset)),0,0)}.efReelTrack.settled{transform:translate3d(calc(50% - var(--target-offset)),0,0)}.efReelMarker{position:absolute;inset:0;display:grid;place-items:center;z-index:4;pointer-events:none}.efReelMarker:before{content:"";position:absolute;top:8px;bottom:8px;width:3px;border-radius:999px;background:linear-gradient(180deg,transparent,#ffd666,#35d8ff,#ffd666,transparent);box-shadow:0 0 28px rgba(255,214,102,.55),0 0 48px rgba(53,216,255,.28)}.efReelMarker span{position:absolute;top:12px;width:32px;height:32px;clip-path:polygon(50% 100%,0 0,100% 0);background:#ffd666;filter:drop-shadow(0 0 18px rgba(255,214,102,.55))}.efReelCard{flex:0 0 168px;min-height:178px;border-radius:22px;padding:14px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(255,255,255,.11),rgba(255,255,255,.035)),rgba(4,18,32,.86);display:grid;align-content:center;text-align:center;gap:7px;box-shadow:inset 0 1px 0 rgba(255,255,255,.10)}.efReelCard .efReelIcon{font-size:38px;filter:drop-shadow(0 0 18px rgba(53,216,255,.20))}.efReelCard b{font-size:14px}.efReelCard small{color:rgba(236,251,255,.72);font-weight:900}.efReelCard em{font-style:normal;font-size:11px;color:rgba(236,251,255,.58);text-transform:uppercase;font-weight:1000}.efReelCard.uncommon{border-color:rgba(76,255,190,.26)}.efReelCard.rare{border-color:rgba(68,154,255,.42);box-shadow:0 0 26px rgba(68,154,255,.10)}.efReelCard.epic{border-color:rgba(172,103,255,.48);box-shadow:0 0 30px rgba(172,103,255,.14)}.efReelCard.legendary{border-color:rgba(255,214,102,.58);box-shadow:0 0 42px rgba(255,214,102,.16)}.efReelCard.mythic{border-color:rgba(255,84,84,.78);box-shadow:0 0 56px rgba(255,84,84,.20),0 0 34px rgba(255,214,102,.13)}.efReelCard.winner{animation:efWinnerPulse .9s ease-in-out infinite alternate}@keyframes efWinnerPulse{to{filter:brightness(1.35);transform:translateY(-4px)}}.efDeepActions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.efDeepActions button,.efDeepPanel button{border:0;border-radius:999px;min-height:48px;padding:0 18px;background:linear-gradient(90deg,#35d8ff,#ffd666);color:#03111d;font-weight:1000}.efDeepActions button:disabled{opacity:.45;cursor:not-allowed}.efPendingReward{border-radius:22px;padding:16px;margin-top:14px}.efPendingReward h2,.efDeepPanel h2{margin:4px 0 8px}.efPendingReward span,.efDeepPanel p{color:rgba(236,251,255,.72)}.efDeepPanel p.ok{color:#54ffc2;font-weight:1000}.efDeepPanel p.bad{color:#ff6d8b;font-weight:1000}.efChanceList,.efHistoryList{display:grid;gap:9px}.efChanceList div,.efHistoryList div{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;border-radius:14px;padding:10px 12px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.075)}.legendary,.efChanceList .legendary,.efHistoryList .legendary{border-color:rgba(255,214,102,.40)!important;box-shadow:0 0 26px rgba(255,214,102,.10)}.mythic,.efChanceList .mythic,.efHistoryList .mythic{border-color:rgba(207,112,255,.48)!important;box-shadow:0 0 34px rgba(207,112,255,.18)}.rare{border-color:rgba(59,139,255,.32)!important}.epic{border-color:rgba(142,100,255,.34)!important}.efChestPanel p{line-height:1.45}.efChestGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.efChestGrid button{min-height:116px;border-radius:22px;border:1px solid rgba(255,214,102,.24);background:rgba(255,255,255,.06);color:#ecfbff;font-size:30px;font-weight:1000;display:grid;place-items:center}.efChestGrid button span{font-size:12px;color:rgba(236,251,255,.72)}.efChestGrid button.win{background:rgba(50,255,174,.16);border-color:rgba(50,255,174,.42)}.efChestGrid button.fail{background:rgba(255,62,96,.16);border-color:rgba(255,62,96,.42)}.efDeepGate{display:grid;grid-template-columns:minmax(280px,.9fr) minmax(280px,1fr);gap:16px;align-items:stretch}.efGateVisual{min-height:420px;border-radius:32px;border:1px solid rgba(255,214,102,.24);background:radial-gradient(circle at 50% 30%,rgba(53,216,255,.17),transparent 34%),linear-gradient(180deg,rgba(2,8,18,.22),rgba(0,0,0,.44));display:grid;place-items:center;text-align:center;position:relative;overflow:hidden}.efGateVisual span{font-size:82px;filter:drop-shadow(0 0 24px rgba(255,214,102,.35))}.efGateVisual b{position:absolute;bottom:28px;font-size:clamp(30px,5vw,62px);letter-spacing:.12em}.efGateVisual i{position:absolute;inset:auto 18% 110px;height:2px;background:linear-gradient(90deg,transparent,#35d8ff,transparent);box-shadow:0 0 28px #35d8ff}.efKeyProgress{display:grid;gap:8px;padding:20px;border-radius:20px;background:rgba(255,255,255,.055);border:1px solid rgba(255,214,102,.22)}.efKeyProgress b{font-size:28px}.efKeyProgress span{color:#ffd666;font-weight:1000}.efSkinPreviewGrid{display:grid;grid-template-columns:repeat(2,minmax(260px,1fr));gap:16px}.efSkinPreviewCard{border-radius:28px;padding:24px;min-height:260px;display:grid;align-content:end;position:relative;overflow:hidden}.efSkinPreviewCard div{position:absolute;right:22px;top:18px;font-size:60px;filter:drop-shadow(0 0 26px rgba(255,214,102,.3))}.efSkinPreviewCard h2{font-size:34px;margin:6px 0}.efSkinPreviewCard.locked{filter:saturate(.62);opacity:.76}.efSkinPreviewCard.unlocked{border-color:rgba(255,214,102,.45);box-shadow:0 0 70px rgba(255,214,102,.12)}@media(max-width:1080px){.efDeepGrid{grid-template-columns:1fr}.efReelViewport{min-height:220px}}@media(max-width:980px){.efDeepHeader{grid-template-columns:1fr}.efDeepWallet{grid-template-columns:repeat(2,1fr)}.efDeepWallet b{text-align:left}.efDeepGate,.efSkinPreviewGrid{grid-template-columns:1fr}}@media(max-width:620px){.efDeepShell{width:min(100%,calc(100vw - 18px))}.efDeepWallet{grid-template-columns:1fr}.efDeepTabs button{padding:10px 12px;font-size:12px}.efReelPanel,.efDeepPanel{border-radius:20px;padding:14px}.efReelViewport{min-height:210px}.efChestGrid button{min-height:92px}.efGateVisual{min-height:300px}}
      `}</style>
    </main>
  );
}

export default DeepTreasuresHub;
