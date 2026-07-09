import React, { useMemo, useState } from "react";
import { navigate } from "../../router";
import { xpToNextAccountLevel } from "../content/account";
import { EVOFISH_SKIN_BY_ID } from "../content/skins";
import { loadEvoFishNextSave, saveEvoFishNextSave } from "../state/nextSaveStore";

type Kind = "xp" | "pearls" | "diamonds" | "ancientCrystal" | "trenchKey" | "ancientChest" | "veryRareSkin" | "mythicSkin";
type Tone = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
type Tab = "roulette" | "location" | "history" | "skins";

type Reward = { kind: Kind; label: string; chance: number; amount: number; unit: string; icon: string; tone: Tone; id?: string; multiplier?: number };
type HistoryItem = { id: string; label: string; amount: number; status: string; tone: Tone };
type TrenchState = { diamonds: number; ancientCrystals: number; trenchKeys: number; deepTrenchUnlocked: boolean; history: HistoryItem[]; skins: Record<string, boolean>; dryKey: number; drySkin: number; pendingReward: Reward | null };

const STORAGE_KEY = "evofish_deep_treasures_v1";
const SPIN_COST = 5000;
const ACCOUNT_LV = 25;
const CHARACTER_LV = 45;
const REQUIRED_KEYS = 3;
const VERY_RARE_SKIN_ID = "mega_nebula";
const MYTHIC_SKIN_ID = "shark_shadow";
const WIN_INDEX = 42;
const CARD_W = 174;
const GAP = 12;
const TARGET = WIN_INDEX * (CARD_W + GAP) + CARD_W / 2;

const REWARDS: Reward[] = [
  { kind: "xp", label: "Опыт", chance: 35, amount: 650, unit: "опыта", icon: "✦", tone: "common" },
  { kind: "pearls", label: "Жемчуг", chance: 25, amount: 1800, unit: "жемчуга", icon: "🐚", tone: "uncommon" },
  { kind: "diamonds", label: "Алмазы", chance: 15, amount: 35, unit: "алмазов", icon: "💎", tone: "rare" },
  { kind: "ancientCrystal", label: "Ancient Crystal", chance: 12, amount: 45, unit: "кристаллов", icon: "🔮", tone: "epic" },
  { kind: "trenchKey", label: "Ключ ВПАДИНЫ", chance: 8, amount: 1, unit: "ключ", icon: "🔑", tone: "legendary" },
  { kind: "ancientChest", label: "Древний сундук", chance: 3, amount: 1, unit: "сундук", icon: "📦", tone: "epic" },
  { kind: "veryRareSkin", label: "Очень редкий скин", chance: 1.8, amount: 1, unit: "скин", icon: "✦", tone: "legendary" },
  { kind: "mythicSkin", label: "Мифический скин", chance: 0.2, amount: 1, unit: "скин", icon: "👑", tone: "mythic" }
];

function format(n: number) { return Math.max(0, Math.floor(n || 0)).toLocaleString("ru-RU"); }
function id() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function amount(r: Reward) { return Math.max(1, Math.floor(r.amount * (r.multiplier || 1))); }
function text(r: Reward) { return ["trenchKey", "ancientChest", "veryRareSkin", "mythicSkin"].includes(r.kind) ? `${r.label} ×${amount(r)}` : `${format(amount(r))} ${r.unit}`; }
function defaultState(): TrenchState { return { diamonds: 0, ancientCrystals: 0, trenchKeys: 0, deepTrenchUnlocked: false, history: [], skins: {}, dryKey: 0, drySkin: 0, pendingReward: null }; }
function normalizeReward(raw: unknown): Reward | null {
  const reward = raw as Partial<Reward> | null;
  if (!reward || typeof reward !== "object") return null;
  const base = REWARDS.find((item) => item.kind === reward.kind);
  if (!base) return null;
  return { ...base, id: typeof reward.id === "string" ? reward.id : id(), multiplier: Math.max(1, Math.min(16, Math.floor(Number(reward.multiplier || 1)))) };
}
function readState(): TrenchState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const pendingReward = normalizeReward(parsed.pendingReward);
    return { ...defaultState(), ...parsed, diamonds: Math.max(0, parsed.diamonds || 0), ancientCrystals: Math.max(0, parsed.ancientCrystals || 0), trenchKeys: Math.max(0, parsed.trenchKeys ?? parsed.darkCaveKeys ?? 0), deepTrenchUnlocked: Boolean(parsed.deepTrenchUnlocked || parsed.darkCaveUnlocked), history: Array.isArray(parsed.history) ? parsed.history.slice(0, 30) : Array.isArray(parsed.rewardHistory) ? parsed.rewardHistory.slice(0, 30) : [], skins: parsed.skins || parsed.unlockedRareSkins || {}, dryKey: Math.max(0, parsed.dryKey || parsed.spinsWithoutKey || 0), drySkin: Math.max(0, parsed.drySkin || parsed.spinsWithoutVeryRareSkin || 0), pendingReward };
  } catch { return defaultState(); }
}
function writeState(state: TrenchState) { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, history: state.history.slice(0, 30) })); }
function addXp(save: ReturnType<typeof loadEvoFishNextSave>, xpAmount: number) {
  let xp = save.account.xp + Math.max(0, Math.floor(xpAmount));
  let level = Math.max(1, save.account.level || 1);
  let need = Math.max(1, save.account.xpToNext || xpToNextAccountLevel(level));
  while (xp >= need) { xp -= need; level += 1; need = xpToNextAccountLevel(level); }
  return { ...save, account: { ...save.account, level, xp, xpToNext: need, totalXp: (save.account.totalXp || 0) + xpAmount } };
}
function chances(state: TrenchState) {
  return REWARDS.map((r) => ({ ...r, chance: r.chance + (r.kind === "trenchKey" && state.dryKey > 40 ? Math.min(6, (state.dryKey - 40) * 0.12) : 0) + ((r.kind === "veryRareSkin" || r.kind === "mythicSkin") && state.drySkin > 70 ? Math.min(2, (state.drySkin - 70) * 0.03) : 0) }));
}
function roll(state: TrenchState): Reward {
  const pool = chances(state);
  let cursor = Math.random() * pool.reduce((sum, r) => sum + r.chance, 0);
  for (const r of pool) { cursor -= r.chance; if (cursor <= 0) return { ...r, id: id(), multiplier: 1 }; }
  return { ...pool[0], id: id(), multiplier: 1 };
}
function buildReel(state: TrenchState, win?: Reward) {
  const list = Array.from({ length: 58 }, () => ({ ...roll(state), id: id(), multiplier: 1 }));
  if (win) list[WIN_INDEX] = win;
  return list;
}
function grantSkin(kind: Kind, state: TrenchState) {
  const skinId = kind === "mythicSkin" ? MYTHIC_SKIN_ID : VERY_RARE_SKIN_ID;
  const save = loadEvoFishNextSave();
  const skin = EVOFISH_SKIN_BY_ID[skinId];
  if (!skin || save.loadout.ownedSkins[skinId]) return { state: { ...state, diamonds: state.diamonds + (kind === "mythicSkin" ? 500 : 250) }, message: "Скин уже был открыт. Выдана компенсация алмазами." };
  saveEvoFishNextSave({ ...save, loadout: { ...save.loadout, ownedSkins: { ...save.loadout.ownedSkins, [skinId]: true }, equippedSkinId: skinId } });
  return { state: { ...state, skins: { ...state.skins, [skinId]: true } }, message: `Новый скин получен: ${skin.name}` };
}
function applyReward(base: TrenchState, reward: Reward) {
  const a = amount(reward);
  let state = { ...base, pendingReward: null, skins: { ...base.skins } };
  let message = `Награда получена: ${text(reward)}`;
  const save = loadEvoFishNextSave();
  if (reward.kind === "xp") saveEvoFishNextSave(addXp(save, a));
  if (reward.kind === "pearls") saveEvoFishNextSave({ ...save, economy: { ...save.economy, pearls: save.economy.pearls + a } });
  if (reward.kind === "diamonds") state.diamonds += a;
  if (reward.kind === "ancientCrystal") state.ancientCrystals += a;
  if (reward.kind === "trenchKey") state.trenchKeys += a;
  if (reward.kind === "ancientChest") state.ancientCrystals += 25;
  if (reward.kind === "veryRareSkin" || reward.kind === "mythicSkin") { const result = grantSkin(reward.kind, state); state = result.state; message = result.message; }
  return { state, message };
}
function ReelCard({ reward, win }: { reward: Reward; win?: boolean }) {
  return <article className={`efCaseCard ${reward.tone} ${win ? "win" : ""}`}><span>{reward.icon}</span><b>{reward.label}</b><small>{text(reward)}</small><em>{reward.tone}</em></article>;
}

export function DeepTreasuresHub() {
  const initial = readState();
  const [save, setSave] = useState(() => loadEvoFishNextSave());
  const [state, setState] = useState<TrenchState>(() => initial);
  const [tab, setTab] = useState<Tab>("roulette");
  const [message, setMessage] = useState(initial.pendingReward ? `Незабранная награда сохранена: ${initial.pendingReward.label}` : "Древняя рулетка ВПАДИНЫ готова.");
  const [pending, setPending] = useState<Reward | null>(() => initial.pendingReward);
  const [reel, setReel] = useState<Reward[]>(() => buildReel(initial, initial.pendingReward || undefined));
  const [phase, setPhase] = useState<"idle" | "spin" | "done">(initial.pendingReward ? "done" : "idle");
  const [winId, setWinId] = useState(initial.pendingReward?.id || "");
  const [failChest, setFailChest] = useState<number | null>(null);
  const [openChest, setOpenChest] = useState<number | null>(null);
  const pool = useMemo(() => chances(state), [state]);
  const rolling = phase === "spin";
  const accountReady = save.account.level >= ACCOUNT_LV;
  const characterReady = save.progress.level >= CHARACTER_LV;
  const keysReady = state.trenchKeys >= REQUIRED_KEYS;
  function commit(next: TrenchState) { setState(next); writeState(next); }
  function spin() {
    const freshSave = loadEvoFishNextSave();
    const fresh = readState();
    if (fresh.pendingReward) { setPending(fresh.pendingReward); setPhase("done"); setWinId(fresh.pendingReward.id || ""); setMessage(`Незабранная награда сохранена: ${fresh.pendingReward.label}`); return; }
    if (pending || rolling) return setMessage("Сначала забери награду или рискни удвоить.");
    if (freshSave.economy.pearls < SPIN_COST) return setMessage("Недостаточно жемчуга.");
    saveEvoFishNextSave({ ...freshSave, economy: { ...freshSave.economy, pearls: freshSave.economy.pearls - SPIN_COST } });
    const reward = roll(fresh);
    const next = { ...fresh, pendingReward: null, dryKey: reward.kind === "trenchKey" ? 0 : fresh.dryKey + 1, drySkin: reward.kind === "veryRareSkin" || reward.kind === "mythicSkin" ? 0 : fresh.drySkin + 1 };
    commit(next); setSave(loadEvoFishNextSave()); setPending(null); setWinId(reward.id || ""); setReel(buildReel(next, reward)); setPhase("idle"); setMessage("Лента запущена...");
    setTimeout(() => setPhase("spin"), 40);
    setTimeout(() => { const escrow = { ...readState(), pendingReward: reward }; commit(escrow); setPhase("done"); setPending(reward); setMessage(`Выпало: ${reward.label}. Награда сохранена — нажми ЗАБРАТЬ или УДВОИТЬ.`); }, 3550);
  }
  function claim() {
    if (!pending || rolling) return;
    const result = applyReward(readState(), pending);
    commit({ ...result.state, pendingReward: null, history: [{ id: id(), label: pending.label, amount: amount(pending), status: "Забрано", tone: pending.tone }, ...result.state.history].slice(0, 30) });
    setPending(null); setFailChest(null); setOpenChest(null); setSave(loadEvoFishNextSave()); setMessage(result.message);
  }
  function doubleStart() { if (!pending || rolling) return; setFailChest(Math.floor(Math.random() * 3)); setOpenChest(null); setMessage("Выбери сундук. Ошибка = награда сгорит."); }
  function pickChest(i: number) {
    if (!pending || failChest === null || openChest !== null) return;
    setOpenChest(i);
    if (i === failChest) { const fresh = readState(); commit({ ...fresh, pendingReward: null, history: [{ id: id(), label: pending.label, amount: amount(pending), status: "Сгорело", tone: pending.tone }, ...fresh.history].slice(0, 30) }); setPending(null); return setMessage("Награда сгорела."); }
    const next = { ...pending, multiplier: Math.min(16, (pending.multiplier || 1) * 2) };
    commit({ ...readState(), pendingReward: next });
    setPending(next); setFailChest(null); setMessage(`Успех. Множитель x${next.multiplier}. Награда сохранена.`);
  }
  function openTrench() {
    const freshSave = loadEvoFishNextSave(); const fresh = readState();
    if (fresh.pendingReward) return setMessage("Сначала забери или удвой сохраненную награду.");
    if (fresh.deepTrenchUnlocked) return navigate("/game/trench");
    if (freshSave.account.level < ACCOUNT_LV) return setMessage("Аккаунт должен быть 25 уровня.");
    if (freshSave.progress.level < CHARACTER_LV) return setMessage("Персонаж должен быть 45 уровня.");
    if (fresh.trenchKeys < REQUIRED_KEYS) return setMessage("Нужно 3 ключа ВПАДИНЫ.");
    commit({ ...fresh, trenchKeys: fresh.trenchKeys - REQUIRED_KEYS, deepTrenchUnlocked: true }); setMessage("ВПАДИНА открыта навсегда.");
  }
  return <main className="efCasePage"><section className="efCaseShell"><header className="efCaseTop"><button onClick={() => navigate("/game")}>← Лобби</button><div><span>НОВАЯ КАРТА · ВПАДИНА</span><h1>{tab === "roulette" ? "Древняя рулетка ВПАДИНЫ" : "ВПАДИНА"}</h1><p>Кейсовая лента, Ancient Crystal, ключи и редкие скины. Награды теперь сохраняются до получения.</p></div><aside><b>Жемчуг: {format(save.economy.pearls)}</b><b>Алмазы: {format(state.diamonds)}</b><b>Ancient Crystal: {format(state.ancientCrystals)}</b><b>Ключи: {format(state.trenchKeys)}</b></aside></header><nav className="efCaseTabs"><button className={tab === "roulette" ? "on" : ""} onClick={() => setTab("roulette")}>Рулетка</button><button className={tab === "location" ? "on" : ""} onClick={() => setTab("location")}>ВПАДИНА</button><button className={tab === "history" ? "on" : ""} onClick={() => setTab("history")}>История</button><button className={tab === "skins" ? "on" : ""} onClick={() => setTab("skins")}>Скины</button></nav><div className="efCaseMsg">{message}</div>{tab === "roulette" ? <section className="efCaseGrid"><article className="efCaseMain"><div className="efCaseViewport"><i /><div className={`efCaseTrack ${phase}`} style={{ "--target": `${TARGET}px` } as React.CSSProperties}>{reel.map((r, i) => <ReelCard key={`${r.id}-${i}`} reward={r} win={r.id === winId && i === WIN_INDEX} />)}</div></div><button className="efSpinButton" disabled={Boolean(pending) || rolling} onClick={spin}>ОТКРЫТЬ ЗА {format(SPIN_COST)} ЖЕМЧУГА</button>{pending ? <div className={`efWinPanel ${pending.tone}`}><div><span>НАГРАДА СОХРАНЕНА</span><h2>{pending.label}</h2><p>{text(pending)} · множитель x{pending.multiplier || 1}</p></div><div className="efWinActions"><button className="take" onClick={claim}>ЗАБРАТЬ</button><button className="double" disabled={(pending.multiplier || 1) >= 16} onClick={doubleStart}>УДВОИТЬ x2<small>Риск: при проигрыше награда сгорит</small></button></div></div> : null}</article><aside className="efOdds"><h2>Шансы</h2>{pool.map((r) => <p key={r.kind} className={r.tone}><span>{r.icon} {r.label}</span><b>{r.chance.toFixed(r.chance % 1 ? 1 : 0)}%</b></p>)}<h2>Удвоение</h2><div className="efChests">{[0,1,2].map((i) => <button key={i} disabled={!pending || failChest === null || openChest !== null} className={openChest === i ? (i === failChest ? "bad" : "good") : ""} onClick={() => pickChest(i)}>{openChest === i ? (i === failChest ? "✕" : "✓") : "?"}<span>Сундук {i + 1}</span></button>)}</div></aside></section> : null}{tab === "location" ? <section className="efLocation"><div><span>{state.deepTrenchUnlocked ? "🌊" : "🔒"}</span><h2>{state.deepTrenchUnlocked ? "ВПАДИНА открыта" : "ВПАДИНА закрыта"}</h2><p className={accountReady ? "ok" : "bad"}>Аккаунт: {save.account.level} / {ACCOUNT_LV}</p><p className={characterReady ? "ok" : "bad"}>Персонаж: {save.progress.level} / {CHARACTER_LV}</p><p className={keysReady ? "ok" : "bad"}>Ключи: {Math.min(state.trenchKeys, REQUIRED_KEYS)} / {REQUIRED_KEYS}</p><button onClick={openTrench}>{state.deepTrenchUnlocked ? "ВОЙТИ ВО ВПАДИНУ" : "ОТКРЫТЬ ВПАДИНУ"}</button></div></section> : null}{tab === "history" ? <section className="efHistory"><h2>История</h2>{state.history.length ? state.history.map((h) => <p key={h.id} className={h.tone}><span>{h.label}</span><b>{format(h.amount)}</b><em>{h.status}</em></p>) : <p>История пустая.</p>}</section> : null}{tab === "skins" ? <section className="efSkinGrid">{[{ id: VERY_RARE_SKIN_ID, title: EVOFISH_SKIN_BY_ID[VERY_RARE_SKIN_ID]?.name || "Мега Туманность", r: "Очень редкий" }, { id: MYTHIC_SKIN_ID, title: EVOFISH_SKIN_BY_ID[MYTHIC_SKIN_ID]?.name || "Акула Тень", r: "Мифический" }].map((s) => <article key={s.id} className={save.loadout.ownedSkins[s.id] || state.skins[s.id] ? "owned" : "locked"}><span>👑</span><h2>{s.title}</h2><p>{s.r}</p><b>{save.loadout.ownedSkins[s.id] || state.skins[s.id] ? "Открыт" : "Закрыт"}</b></article>)}</section> : null}</section><style>{`.efCasePage{min-height:100vh;background:radial-gradient(circle at 50% -12%,rgba(53,216,255,.22),transparent 36%),linear-gradient(180deg,#031827,#01040a);color:#effbff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efCaseShell{width:min(1360px,calc(100vw - 28px));margin:0 auto;padding:18px 0 42px;display:grid;gap:14px}.efCaseTop{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center}.efCaseTop button,.efSpinButton,.efWinActions button,.efLocation button{border:0;border-radius:999px;min-height:48px;padding:0 18px;font:inherit;font-weight:1000;cursor:pointer}.efCaseTop button{background:rgba(7,26,42,.76);color:#effbff;border:1px solid rgba(95,220,255,.25)}.efCaseTop span{color:#8beaff;font-size:12px;font-weight:1000;letter-spacing:.18em}.efCaseTop h1{font-size:clamp(34px,6vw,82px);margin:6px 0;line-height:.9}.efCaseTop p{margin:0;color:rgba(239,251,255,.68)}.efCaseTop aside{display:grid;gap:7px}.efCaseTop aside b,.efCaseMsg,.efCaseMain,.efOdds,.efLocation>div,.efHistory,.efSkinGrid article{border:1px solid rgba(95,220,255,.23);background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.025)),rgba(3,18,32,.72);box-shadow:0 24px 80px rgba(0,0,0,.34);backdrop-filter:blur(18px)}.efCaseTop aside b{padding:10px 12px;border-radius:14px}.efCaseTabs{display:flex;gap:9px;overflow-x:auto}.efCaseTabs button{border:1px solid rgba(95,220,255,.18);background:rgba(3,18,32,.62);color:#effbff;border-radius:999px;padding:12px 16px;font-weight:1000}.efCaseTabs button.on{border-color:rgba(255,214,102,.48);background:rgba(255,214,102,.14)}.efCaseMsg{border-radius:18px;padding:14px 16px;font-weight:900}.efCaseGrid{display:grid;grid-template-columns:1fr 340px;gap:16px}.efCaseMain,.efOdds{border-radius:28px;padding:18px}.efCaseViewport{position:relative;height:260px;border-radius:26px;overflow:hidden;border:1px solid rgba(255,214,102,.28);background:radial-gradient(circle at 50% 50%,rgba(53,216,255,.16),transparent 48%),rgba(0,0,0,.24)}.efCaseViewport:before,.efCaseViewport:after{content:"";position:absolute;top:0;bottom:0;width:18%;z-index:3;pointer-events:none}.efCaseViewport:before{left:0;background:linear-gradient(90deg,#020814,transparent)}.efCaseViewport:after{right:0;background:linear-gradient(270deg,#020814,transparent)}.efCaseViewport i{position:absolute;z-index:4;left:50%;top:8px;bottom:8px;width:3px;background:linear-gradient(180deg,transparent,#ffd666,#35d8ff,#ffd666,transparent);box-shadow:0 0 32px rgba(255,214,102,.7)}.efCaseTrack{position:absolute;top:38px;left:0;display:flex;gap:12px;transform:translate3d(0,0,0)}.efCaseTrack.spin{transition:transform 3.45s cubic-bezier(.08,.82,.12,1);transform:translate3d(calc(50% - var(--target)),0,0)}.efCaseTrack.done{transform:translate3d(calc(50% - var(--target)),0,0)}.efCaseCard{flex:0 0 174px;height:184px;border-radius:22px;padding:14px;display:grid;place-items:center;text-align:center;gap:6px;border:1px solid rgba(255,255,255,.14);background:linear-gradient(180deg,rgba(255,255,255,.11),rgba(255,255,255,.035)),rgba(4,18,32,.9)}.efCaseCard span{font-size:38px}.efCaseCard b{font-size:14px}.efCaseCard small{font-weight:900;color:rgba(239,251,255,.72)}.efCaseCard em{font-style:normal;text-transform:uppercase;font-size:11px;color:rgba(239,251,255,.55);font-weight:1000}.efCaseCard.rare{border-color:rgba(68,154,255,.48);box-shadow:0 0 28px rgba(68,154,255,.12)}.efCaseCard.epic{border-color:rgba(172,103,255,.56);box-shadow:0 0 34px rgba(172,103,255,.16)}.efCaseCard.legendary{border-color:rgba(255,214,102,.68);box-shadow:0 0 46px rgba(255,214,102,.19)}.efCaseCard.mythic{border-color:rgba(255,74,74,.8);box-shadow:0 0 58px rgba(255,74,74,.24),0 0 36px rgba(255,214,102,.18)}.efCaseCard.win{animation:winPulse .8s ease-in-out infinite alternate}@keyframes winPulse{to{transform:translateY(-5px);filter:brightness(1.35)}}.efSpinButton{width:100%;margin-top:14px;background:linear-gradient(90deg,#35d8ff,#ffd666);color:#03111d}.efWinPanel{margin-top:14px;border-radius:24px;padding:18px;display:grid;grid-template-columns:1fr minmax(280px,.8fr);gap:16px;border:1px solid rgba(255,214,102,.35);background:rgba(3,18,32,.78)}.efWinPanel span{color:#ffd666;font-weight:1000}.efWinPanel h2{font-size:34px;margin:4px 0}.efWinActions{display:grid;gap:10px}.efWinActions .take{background:rgba(53,216,255,.18);color:#effbff;border:1px solid rgba(95,220,255,.34)}.efWinActions .double{min-height:76px;background:linear-gradient(90deg,#ffd666,#35d8ff);color:#03111d;box-shadow:0 0 38px rgba(255,214,102,.22)}.efWinActions small{display:block;font-size:11px;margin-top:3px}.efOdds p,.efHistory p{display:grid;grid-template-columns:1fr auto auto;gap:10px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.055)}.efChests{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.efChests button{min-height:94px;border-radius:18px;border:1px solid rgba(255,214,102,.28);background:rgba(255,255,255,.06);color:#effbff;font-size:28px;font-weight:1000}.efChests span{display:block;font-size:11px}.efChests .good{background:rgba(50,255,174,.18)}.efChests .bad{background:rgba(255,62,96,.18)}.efLocation>div{border-radius:30px;padding:24px;text-align:center}.efLocation span{font-size:76px}.efLocation h2{font-size:46px;margin:6px 0}.efLocation p.ok{color:#54ffc2;font-weight:1000}.efLocation p.bad{color:#ff6d8b;font-weight:1000}.efLocation button{background:linear-gradient(90deg,#35d8ff,#ffd666);color:#03111d}.efSkinGrid{display:grid;grid-template-columns:repeat(2,minmax(260px,1fr));gap:16px}.efSkinGrid article{min-height:230px;border-radius:28px;padding:24px;display:grid;align-content:end}.efSkinGrid span{font-size:54px}.efSkinGrid .owned{border-color:rgba(255,214,102,.5)}@media(max-width:940px){.efCaseTop,.efCaseGrid,.efWinPanel{grid-template-columns:1fr}.efCaseTop aside{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.efCaseShell{width:min(100%,calc(100vw - 18px))}.efCaseTop aside,.efSkinGrid{grid-template-columns:1fr}.efCaseViewport{height:230px}}`}</style></main>;
}

export default DeepTreasuresHub;
