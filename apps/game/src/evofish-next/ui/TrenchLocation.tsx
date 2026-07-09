import React, { useState } from "react";
import { navigate } from "../../router";
import { loadEvoFishNextSave, saveEvoFishNextSave } from "../state/nextSaveStore";

const STORAGE_KEY = "evofish_deep_treasures_v1";
const REQUIRED_ACCOUNT_LEVEL = 25;
const REQUIRED_CHARACTER_LEVEL = 45;
const CHEST_COST = 100;

type TrenchState = { diamonds?: number; ancientCrystals?: number; trenchKeys?: number; deepTrenchUnlocked?: boolean; darkCaveKeys?: number; darkCaveUnlocked?: boolean; };
type ChestReward = { label: string; description: string; tone: "rare" | "epic" | "legendary"; apply: (state: TrenchState) => TrenchState; applySave?: () => void };

function format(value: number) { return Math.max(0, Math.floor(value || 0)).toLocaleString("ru-RU"); }
function normalizeState(state: TrenchState): TrenchState { return { ...state, diamonds: Math.max(0, Math.floor(state.diamonds || 0)), ancientCrystals: Math.max(0, Math.floor(state.ancientCrystals || 0)), trenchKeys: Math.max(0, Math.floor(state.trenchKeys ?? state.darkCaveKeys ?? 0)), deepTrenchUnlocked: Boolean(state.deepTrenchUnlocked || state.darkCaveUnlocked) }; }
function readState(): TrenchState { if (typeof window === "undefined") return {}; try { const raw = window.localStorage.getItem(STORAGE_KEY); return normalizeState(raw ? JSON.parse(raw) as TrenchState : {}); } catch { return {}; } }
function writeState(state: TrenchState) { if (typeof window === "undefined") return; window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state))); }
function addPearls(amount: number) { const save = loadEvoFishNextSave(); saveEvoFishNextSave({ ...save, economy: { ...save.economy, pearls: save.economy.pearls + amount } }); }
function rollChestReward(): ChestReward {
  const roll = Math.random() * 100;
  if (roll < 45) return { label: "Алмазы", description: "+120 алмазов", tone: "rare", apply: (state) => ({ ...state, diamonds: Math.max(0, Math.floor(state.diamonds || 0)) + 120 }) };
  if (roll < 75) return { label: "Жемчуг", description: "+15 000 жемчуга", tone: "epic", apply: (state) => state, applySave: () => addPearls(15000) };
  if (roll < 92) return { label: "Ancient Crystal", description: "+180 Ancient Crystal", tone: "epic", apply: (state) => ({ ...state, ancientCrystals: Math.max(0, Math.floor(state.ancientCrystals || 0)) + 180 }) };
  return { label: "Ключ ВПАДИНЫ", description: "+1 ключ ВПАДИНЫ", tone: "legendary", apply: (state) => ({ ...state, trenchKeys: Math.max(0, Math.floor(state.trenchKeys ?? state.darkCaveKeys ?? 0)) + 1 }) };
}

const NODES = [
  { title: "Край разлома", status: "Открыто", reward: "Жемчуг, опыт, Ancient Crystal", danger: "Высокая" },
  { title: "Кристальные ребра", status: "Открыто", reward: "Ancient Crystal", danger: "Очень высокая" },
  { title: "Гнездо бездны", status: "Открыто", reward: "Древний сундук", danger: "Элитная" },
  { title: "Сердце ВПАДИНЫ", status: "Скоро", reward: "Мифический скин", danger: "Босс" }
];

export function TrenchLocation() {
  const [save, setSave] = useState(() => loadEvoFishNextSave());
  const [state, setState] = useState(() => readState());
  const [chestMessage, setChestMessage] = useState("Древний сундук стоит 100 Ancient Crystal.");
  const [lastRewardTone, setLastRewardTone] = useState<ChestReward["tone"]>("rare");
  const trenchKeys = Math.max(0, Math.floor(state.trenchKeys ?? state.darkCaveKeys ?? 0));
  const ancientCrystals = Math.max(0, Math.floor(state.ancientCrystals || 0));
  const unlocked = Boolean(state.deepTrenchUnlocked || state.darkCaveUnlocked);
  const accountReady = save.account.level >= REQUIRED_ACCOUNT_LEVEL;
  const characterReady = save.progress.level >= REQUIRED_CHARACTER_LEVEL;
  const accessAllowed = unlocked && accountReady && characterReady;

  const openAncientChest = () => {
    const fresh = normalizeState(readState());
    const crystals = Math.max(0, Math.floor(fresh.ancientCrystals || 0));
    if (crystals < CHEST_COST) {
      setLastRewardTone("rare");
      setChestMessage(`Недостаточно Ancient Crystal: ${crystals} / ${CHEST_COST}`);
      return;
    }
    const reward = rollChestReward();
    const paid = { ...fresh, ancientCrystals: crystals - CHEST_COST };
    const next = normalizeState(reward.apply(paid));
    reward.applySave?.();
    writeState(next);
    setState(next);
    setSave(loadEvoFishNextSave());
    setLastRewardTone(reward.tone);
    setChestMessage(`Древний сундук: ${reward.description}`);
  };

  return (
    <main className="efTrench">
      <div className="efTrenchFx" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <section className="efTrenchShell">
        <header className="efTrenchHeader">
          <button type="button" onClick={() => navigate("/game/deep-treasures")}>← К открытию</button>
          <div><span>НОВАЯ КАРТА</span><h1>ВПАДИНА</h1><p>Эндгейм-регион глубин: древняя рулетка, кристаллы, элитные зоны и будущий босс.</p></div>
          <aside><b>Аккаунт: {save.account.level}</b><b>Персонаж: {save.progress.level}</b><b>Ключи: {format(trenchKeys)}</b><b>Кристаллы: {format(ancientCrystals)}</b></aside>
        </header>

        {!accessAllowed ? (
          <section className="efTrenchLocked">
            <div>🔒</div><h2>ВПАДИНА закрыта</h2>
            <p className={accountReady ? "ok" : "bad"}>Аккаунт: {save.account.level} / {REQUIRED_ACCOUNT_LEVEL}</p>
            <p className={characterReady ? "ok" : "bad"}>Персонаж: {save.progress.level} / {REQUIRED_CHARACTER_LEVEL}</p>
            <p className={unlocked ? "ok" : "bad"}>Открытие ключами: {unlocked ? "Выполнено" : "Не выполнено"}</p>
            <button type="button" onClick={() => navigate("/game/deep-treasures")}>Открыть ВПАДИНУ</button>
          </section>
        ) : (
          <section className="efTrenchContent">
            <article className="efTrenchHero"><span>🌊</span><h2>Новая карта открыта</h2><p>ВПАДИНА доступна навсегда. Здесь уже работает Древний сундук за Ancient Crystal. Дальше можно подключать мобов, босса и отдельный боевой биом.</p><div><button type="button" onClick={() => navigate("/game/play")}>Начать забег</button><button type="button" onClick={() => navigate("/game/deep-treasures")}>Древняя рулетка</button></div></article>
            <section className="efTrenchNodes">{NODES.map((node) => <article key={node.title} className={node.status === "Открыто" ? "open" : "locked"}><span>{node.status}</span><h3>{node.title}</h3><p>Награда: {node.reward}</p><p>Опасность: {node.danger}</p></article>)}<article className={`efAncientChest ${lastRewardTone}`}><span>Работает</span><h3>Древний сундук</h3><p>{chestMessage}</p><p>Пул: алмазы, жемчуг, Ancient Crystal, ключ ВПАДИНЫ</p><p>Баланс: {format(ancientCrystals)} Ancient Crystal</p><button type="button" onClick={openAncientChest}>Открыть за {CHEST_COST}</button></article></section>
          </section>
        )}
      </section>
      <style>{`.efTrench{min-height:100vh;min-height:100dvh;background:radial-gradient(circle at 50% 12%,rgba(29,210,255,.18),transparent 33%),radial-gradient(circle at 50% 105%,rgba(0,0,0,.95),#01040a 56%),linear-gradient(180deg,#031528,#000);color:#eefbff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;overflow:hidden}.efTrenchFx{position:fixed;inset:0;pointer-events:none}.efTrenchFx:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.024),transparent,rgba(255,255,255,.018)),radial-gradient(circle at 50% 50%,transparent 0 24%,rgba(0,0,0,.48) 74%)}.efTrenchFx i{position:absolute;border-radius:999px;background:rgba(82,230,255,.42);box-shadow:0 0 28px rgba(82,230,255,.38);animation:trenchRise 13s linear infinite}.efTrenchFx i:nth-child(1){left:8%;bottom:-30px;width:8px;height:8px}.efTrenchFx i:nth-child(2){left:28%;bottom:-40px;width:5px;height:5px;animation-delay:-5s}.efTrenchFx i:nth-child(3){left:58%;bottom:-34px;width:10px;height:10px;animation-delay:-8s}.efTrenchFx i:nth-child(4){left:78%;bottom:-50px;width:7px;height:7px;animation-delay:-2s}.efTrenchFx i:nth-child(5){left:92%;bottom:-46px;width:12px;height:12px;animation-delay:-10s}@keyframes trenchRise{to{transform:translateY(-116vh);opacity:.08}}.efTrenchShell{position:relative;z-index:1;width:min(1320px,calc(100vw - 28px));margin:0 auto;padding:max(18px,env(safe-area-inset-top)) 0 calc(34px + env(safe-area-inset-bottom));display:grid;gap:16px}.efTrenchHeader{display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center}.efTrenchHeader button,.efTrenchLocked button,.efTrenchHero button,.efAncientChest button{appearance:none;border:0;border-radius:999px;min-height:46px;padding:0 18px;background:linear-gradient(90deg,#35d8ff,#ffd666);color:#03111d;font-family:inherit;font-weight:1000;cursor:pointer}.efTrenchHeader span{color:#8beaff;font-size:12px;font-weight:1000;letter-spacing:.18em}.efTrenchHeader h1{font-size:clamp(54px,10vw,132px);line-height:.85;margin:8px 0}.efTrenchHeader p{margin:0;color:rgba(238,251,255,.72)}.efTrenchHeader aside{display:grid;gap:7px;min-width:190px}.efTrenchHeader aside b,.efTrenchLocked,.efTrenchHero,.efTrenchNodes article{border:1px solid rgba(100,220,255,.22);background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.025)),rgba(4,18,32,.68);box-shadow:0 26px 90px rgba(0,0,0,.44),inset 0 1px 0 rgba(255,255,255,.09);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efTrenchHeader aside b{border-radius:14px;padding:10px 12px;text-align:right}.efTrenchLocked{min-height:520px;border-radius:34px;display:grid;place-items:center;text-align:center;padding:28px}.efTrenchLocked div{font-size:92px}.efTrenchLocked h2{font-size:clamp(32px,5vw,66px);margin:8px 0}.efTrenchLocked p{margin:4px 0;font-weight:1000}.efTrenchLocked p.ok{color:#54ffc2}.efTrenchLocked p.bad{color:#ff6d8b}.efTrenchContent{display:grid;grid-template-columns:minmax(300px,.9fr) minmax(320px,1.1fr);gap:16px}.efTrenchHero{border-radius:34px;padding:28px;min-height:520px;display:grid;align-content:end;position:relative;overflow:hidden}.efTrenchHero:before{content:"";position:absolute;inset:12%;border-radius:999px;border:1px solid rgba(53,216,255,.18);box-shadow:inset 0 0 90px rgba(53,216,255,.08),0 0 90px rgba(53,216,255,.08)}.efTrenchHero>*{position:relative}.efTrenchHero span{font-size:92px}.efTrenchHero h2{font-size:clamp(34px,5vw,70px);margin:8px 0}.efTrenchHero p{color:rgba(238,251,255,.72);line-height:1.5}.efTrenchHero div{display:flex;gap:10px;flex-wrap:wrap}.efTrenchNodes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.efTrenchNodes article{border-radius:26px;padding:20px;min-height:210px;display:grid;align-content:end}.efTrenchNodes article span{justify-self:start;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:1000;background:rgba(255,255,255,.08);color:#8beaff}.efTrenchNodes article h3{font-size:26px;margin:14px 0 8px}.efTrenchNodes article p{margin:3px 0;color:rgba(238,251,255,.72)}.efTrenchNodes article.locked{opacity:.58;filter:saturate(.72)}.efTrenchNodes article.open{border-color:rgba(255,214,102,.38);box-shadow:0 26px 90px rgba(0,0,0,.44),0 0 50px rgba(255,214,102,.08)}.efAncientChest{border-color:rgba(255,214,102,.42)!important;box-shadow:0 26px 90px rgba(0,0,0,.44),0 0 60px rgba(255,214,102,.12)!important}.efAncientChest.epic{border-color:rgba(158,105,255,.54)!important}.efAncientChest.legendary{border-color:rgba(255,214,102,.7)!important}@media(max-width:920px){.efTrenchHeader,.efTrenchContent{grid-template-columns:1fr}.efTrenchHeader aside{grid-template-columns:repeat(2,1fr)}.efTrenchHeader aside b{text-align:left}.efTrenchNodes{grid-template-columns:1fr}}@media(max-width:620px){.efTrenchShell{width:min(100%,calc(100vw - 18px))}.efTrenchHeader aside{grid-template-columns:1fr}.efTrenchLocked,.efTrenchHero{min-height:430px;border-radius:24px}.efTrenchNodes article{min-height:170px}}`}</style>
    </main>
  );
}

export default TrenchLocation;
