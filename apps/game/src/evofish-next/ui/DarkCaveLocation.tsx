import React, { useMemo, useState } from "react";
import { navigate } from "../../router";
import { loadEvoFishNextSave } from "../state/nextSaveStore";

const DEEP_STORAGE_KEY = "evofish_deep_treasures_v1";
const REQUIRED_LEVEL = 45;

type DeepTreasuresState = {
  diamonds?: number;
  coins?: number;
  darkCaveKeys?: number;
  darkCaveUnlocked?: boolean;
};

function format(value: number) {
  return Math.max(0, Math.floor(value || 0)).toLocaleString("ru-RU");
}

function readDeepState(): DeepTreasuresState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DEEP_STORAGE_KEY);
    return raw ? JSON.parse(raw) as DeepTreasuresState : {};
  } catch {
    return {};
  }
}

const CAVE_NODES = [
  { title: "Вход в бездну", status: "Открыто", reward: "Жемчуг и опыт", danger: "Низкая" },
  { title: "Кристальный коридор", status: "Скоро", reward: "Алмазы", danger: "Средняя" },
  { title: "Гнездо древних рыб", status: "Скоро", reward: "Редкий сундук", danger: "Высокая" },
  { title: "Трон DARK CAVE", status: "Скоро", reward: "Мифический скин", danger: "Экстремальная" }
];

export function DarkCaveLocation() {
  const [save] = useState(() => loadEvoFishNextSave());
  const [deep] = useState(() => readDeepState());
  const unlocked = Boolean(deep.darkCaveUnlocked);
  const levelReady = save.account.level >= REQUIRED_LEVEL;
  const accessAllowed = unlocked && levelReady;
  const gateText = useMemo(() => {
    if (!levelReady) return `DARK CAVE доступна с ${REQUIRED_LEVEL} уровня`;
    if (!unlocked) return "Сначала открой ворота за 3 ключа";
    return "Локация открыта";
  }, [levelReady, unlocked]);

  return (
    <main className="efDarkCave">
      <div className="efDarkCaveFx" aria-hidden="true"><i /><i /><i /><i /></div>
      <section className="efDarkCaveShell">
        <header className="efDarkCaveHeader">
          <button type="button" onClick={() => navigate("/game/deep-treasures")}>← Сокровища глубин</button>
          <div>
            <span>ПОСТОЯННАЯ ЛОКАЦИЯ</span>
            <h1>DARK CAVE</h1>
            <p>{gateText}</p>
          </div>
          <aside>
            <b>Уровень: {save.account.level}</b>
            <b>Алмазы: {format(deep.diamonds || 0)}</b>
            <b>Монеты: {format(deep.coins || 0)}</b>
          </aside>
        </header>

        {!accessAllowed ? (
          <section className="efDarkLocked">
            <div className="efDarkSeal">🔒</div>
            <h2>{gateText}</h2>
            <p>Вернись в раздел “Сокровища глубин”, собери ключи DARK CAVE и открой ворота.</p>
            <button type="button" onClick={() => navigate("/game/deep-treasures")}>К воротам DARK CAVE</button>
          </section>
        ) : (
          <section className="efDarkContent">
            <article className="efDarkHero">
              <span>🌑</span>
              <h2>Бездна открыта</h2>
              <p>Это основа новой зоны. Сейчас включен безопасный режим: карта, узлы фарма и визуал без изменения боевой системы. Следующим шагом можно подключить врагов, босса и элитную рулетку DARK CAVE.</p>
              <button type="button" onClick={() => navigate("/game/play")}>Начать забег</button>
            </article>

            <section className="efDarkNodes" aria-label="Зоны DARK CAVE">
              {CAVE_NODES.map((node) => (
                <article key={node.title} className={node.status === "Открыто" ? "open" : "locked"}>
                  <span>{node.status}</span>
                  <h3>{node.title}</h3>
                  <p>Награда: {node.reward}</p>
                  <p>Опасность: {node.danger}</p>
                </article>
              ))}
            </section>
          </section>
        )}
      </section>

      <style>{`
        .efDarkCave{min-height:100vh;min-height:100dvh;background:radial-gradient(circle at 50% 14%,rgba(34,211,255,.16),transparent 32%),radial-gradient(circle at 50% 110%,rgba(92,53,255,.18),transparent 34%),linear-gradient(180deg,#020710,#000);color:#eefbff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;overflow:hidden}.efDarkCaveFx{position:fixed;inset:0;pointer-events:none}.efDarkCaveFx:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.025),transparent,rgba(255,255,255,.018)),radial-gradient(circle at 50% 50%,transparent 0 28%,rgba(0,0,0,.42) 72%)}.efDarkCaveFx i{position:absolute;width:8px;height:8px;border-radius:999px;background:rgba(93,225,255,.48);box-shadow:0 0 28px rgba(93,225,255,.42);animation:darkRise 12s linear infinite}.efDarkCaveFx i:nth-child(1){left:11%;bottom:-20px}.efDarkCaveFx i:nth-child(2){left:36%;bottom:-34px;animation-delay:-5s}.efDarkCaveFx i:nth-child(3){left:72%;bottom:-22px;animation-delay:-8s}.efDarkCaveFx i:nth-child(4){left:91%;bottom:-42px;animation-delay:-2s}@keyframes darkRise{to{transform:translateY(-115vh);opacity:.1}}.efDarkCaveShell{position:relative;z-index:1;width:min(1280px,calc(100vw - 28px));margin:0 auto;padding:max(18px,env(safe-area-inset-top)) 0 calc(32px + env(safe-area-inset-bottom));display:grid;gap:16px}.efDarkCaveHeader{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:16px}.efDarkCaveHeader button,.efDarkLocked button,.efDarkHero button{appearance:none;border:0;border-radius:999px;min-height:46px;padding:0 18px;font-family:inherit;font-weight:1000;cursor:pointer;background:linear-gradient(90deg,#35d8ff,#b56bff);color:#04111f}.efDarkCaveHeader>div span{display:block;color:#8beaff;font-size:12px;font-weight:1000;letter-spacing:.18em}.efDarkCaveHeader h1{font-size:clamp(52px,10vw,132px);line-height:.85;margin:8px 0;text-shadow:0 0 48px rgba(53,216,255,.2)}.efDarkCaveHeader p{margin:0;color:rgba(238,251,255,.72)}.efDarkCaveHeader aside{display:grid;gap:8px;min-width:180px}.efDarkCaveHeader aside b,.efDarkLocked,.efDarkHero,.efDarkNodes article{border:1px solid rgba(100,220,255,.22);background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.025)),rgba(4,18,32,.68);box-shadow:0 26px 90px rgba(0,0,0,.44),inset 0 1px 0 rgba(255,255,255,.09);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efDarkCaveHeader aside b{border-radius:14px;padding:10px 12px;text-align:right}.efDarkLocked{min-height:520px;border-radius:34px;display:grid;place-items:center;text-align:center;padding:28px}.efDarkSeal{font-size:94px;filter:drop-shadow(0 0 34px rgba(255,214,102,.28))}.efDarkLocked h2{font-size:clamp(30px,5vw,62px);margin:10px 0}.efDarkLocked p{max-width:620px;color:rgba(238,251,255,.7)}.efDarkContent{display:grid;grid-template-columns:minmax(300px,.85fr) minmax(320px,1.15fr);gap:16px}.efDarkHero{border-radius:34px;padding:28px;min-height:520px;display:grid;align-content:end;position:relative;overflow:hidden}.efDarkHero:before{content:"";position:absolute;inset:12%;border-radius:999px;border:1px solid rgba(53,216,255,.18);box-shadow:inset 0 0 90px rgba(53,216,255,.08),0 0 90px rgba(53,216,255,.08)}.efDarkHero span{font-size:86px}.efDarkHero h2{font-size:clamp(34px,5vw,70px);margin:8px 0}.efDarkHero p{color:rgba(238,251,255,.72);line-height:1.5;max-width:620px}.efDarkHero>*{position:relative}.efDarkNodes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.efDarkNodes article{border-radius:26px;padding:20px;min-height:210px;display:grid;align-content:end}.efDarkNodes article span{justify-self:start;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:1000;background:rgba(255,255,255,.08);color:#8beaff}.efDarkNodes article h3{font-size:26px;margin:14px 0 8px}.efDarkNodes article p{margin:3px 0;color:rgba(238,251,255,.72)}.efDarkNodes article.locked{opacity:.58;filter:saturate(.72)}.efDarkNodes article.open{border-color:rgba(255,214,102,.38);box-shadow:0 26px 90px rgba(0,0,0,.44),0 0 50px rgba(255,214,102,.08)}@media(max-width:900px){.efDarkCaveHeader,.efDarkContent{grid-template-columns:1fr}.efDarkCaveHeader aside{grid-template-columns:repeat(3,1fr)}.efDarkCaveHeader aside b{text-align:left}.efDarkNodes{grid-template-columns:1fr}}@media(max-width:620px){.efDarkCaveShell{width:min(100%,calc(100vw - 18px))}.efDarkCaveHeader aside{grid-template-columns:1fr}.efDarkLocked,.efDarkHero{min-height:430px;border-radius:24px}.efDarkNodes article{min-height:170px}}
      `}</style>
    </main>
  );
}

export default DarkCaveLocation;
