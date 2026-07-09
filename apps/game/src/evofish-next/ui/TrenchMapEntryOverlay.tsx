import React, { useMemo, useState } from "react";
import { navigate } from "../../router";
import { loadEvoFishNextSave } from "../state/nextSaveStore";

const STORAGE_KEY = "evofish_deep_treasures_v1";
const REQUIRED_ACCOUNT_LEVEL = 25;
const REQUIRED_CHARACTER_LEVEL = 45;
const REQUIRED_KEYS = 3;

type TrenchState = {
  trenchKeys?: number;
  darkCaveKeys?: number;
  deepTrenchUnlocked?: boolean;
  darkCaveUnlocked?: boolean;
};

function readTrenchState(): Required<Pick<TrenchState, "trenchKeys">> & { deepTrenchUnlocked: boolean } {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      trenchKeys: Math.max(0, Math.floor(parsed.trenchKeys ?? parsed.darkCaveKeys ?? 0)),
      deepTrenchUnlocked: Boolean(parsed.deepTrenchUnlocked || parsed.darkCaveUnlocked)
    };
  } catch {
    return { trenchKeys: 0, deepTrenchUnlocked: false };
  }
}

function format(value: number) {
  return Math.max(0, Math.floor(value || 0)).toLocaleString("ru-RU");
}

export function TrenchMapEntryOverlay() {
  const [save, setSave] = useState(() => loadEvoFishNextSave());
  const [state, setState] = useState(() => readTrenchState());
  const [open, setOpen] = useState(false);

  const accountReady = save.account.level >= REQUIRED_ACCOUNT_LEVEL;
  const characterReady = save.progress.level >= REQUIRED_CHARACTER_LEVEL;
  const keysReady = state.trenchKeys >= REQUIRED_KEYS;
  const unlocked = state.deepTrenchUnlocked;
  const canOpen = accountReady && characterReady && keysReady;

  const status = useMemo(() => {
    if (unlocked) return "Открыта";
    if (canOpen) return "Можно открыть";
    return "Закрыта";
  }, [unlocked, canOpen]);

  const refresh = () => {
    setSave(loadEvoFishNextSave());
    setState(readTrenchState());
  };

  const enter = () => {
    refresh();
    if (readTrenchState().deepTrenchUnlocked) navigate("/game/trench");
    else navigate("/game/deep-treasures");
  };

  return (
    <aside className={`efTrenchMapEntry ${open ? "open" : ""}`}>
      <button className="efTrenchMini" type="button" onClick={() => { refresh(); setOpen((value) => !value); }}>
        <span>🌊</span>
        <b>ВПАДИНА</b>
        <em>{status}</em>
      </button>

      {open ? (
        <section className="efTrenchCard">
          <div className="efTrenchCardHead">
            <span>НОВАЯ ЛОКАЦИЯ</span>
            <button type="button" onClick={() => setOpen(false)}>×</button>
          </div>
          <h2>ВПАДИНА</h2>
          <p>Высокоуровневая карта глубин. Видна на стартовой карте и открывается через прогрессию.</p>
          <div className="efTrenchReqs">
            <b className={accountReady ? "ok" : "bad"}>Аккаунт: {format(save.account.level)} / {REQUIRED_ACCOUNT_LEVEL}</b>
            <b className={characterReady ? "ok" : "bad"}>Персонаж: {format(save.progress.level)} / {REQUIRED_CHARACTER_LEVEL}</b>
            <b className={keysReady ? "ok" : "bad"}>Ключи: {Math.min(state.trenchKeys, REQUIRED_KEYS)} / {REQUIRED_KEYS}</b>
          </div>
          <div className="efTrenchActions">
            <button type="button" onClick={() => navigate("/game/deep-treasures")}>Рулетка</button>
            <button type="button" className="primary" onClick={enter}>{unlocked ? "Войти" : canOpen ? "Открыть" : "Требования"}</button>
          </div>
        </section>
      ) : null}

      <style>{`
        .efTrenchMapEntry{position:fixed;right:max(14px,env(safe-area-inset-right));top:calc(214px + env(safe-area-inset-top));z-index:64;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;color:#ecfbff;pointer-events:auto}.efTrenchMini{appearance:none;border:1px solid rgba(255,214,102,.38);border-radius:18px;padding:9px 12px;min-width:150px;display:grid;grid-template-columns:auto 1fr;grid-template-areas:"icon title" "icon state";gap:0 8px;text-align:left;background:linear-gradient(135deg,rgba(53,216,255,.18),rgba(255,214,102,.14)),rgba(3,18,32,.82);color:#ecfbff;box-shadow:0 18px 50px rgba(0,0,0,.34),0 0 28px rgba(53,216,255,.14);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);font:inherit;cursor:pointer}.efTrenchMini span{grid-area:icon;width:36px;height:36px;border-radius:999px;display:grid;place-items:center;background:rgba(53,216,255,.14);box-shadow:inset 0 0 22px rgba(53,216,255,.16)}.efTrenchMini b{grid-area:title;font-size:13px;font-weight:1000;letter-spacing:.04em}.efTrenchMini em{grid-area:state;font-style:normal;color:#ffd666;font-size:11px;font-weight:900}.efTrenchCard{position:absolute;right:0;top:58px;width:min(330px,calc(100vw - 24px));border:1px solid rgba(95,220,255,.28);border-radius:24px;padding:16px;background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.028)),rgba(3,18,32,.92);box-shadow:0 28px 80px rgba(0,0,0,.46),0 0 46px rgba(53,216,255,.14);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efTrenchCardHead{display:flex;align-items:center;justify-content:space-between;gap:10px}.efTrenchCardHead span{color:#8beaff;font-size:11px;font-weight:1000;letter-spacing:.18em}.efTrenchCardHead button{appearance:none;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#ecfbff;width:32px;height:32px;border-radius:999px;font-weight:1000}.efTrenchCard h2{font-size:34px;line-height:.95;margin:10px 0 8px}.efTrenchCard p{margin:0 0 12px;color:rgba(236,251,255,.72);line-height:1.35}.efTrenchReqs{display:grid;gap:7px}.efTrenchReqs b{border-radius:12px;padding:9px 10px;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.08);font-size:13px}.efTrenchReqs b.ok{color:#54ffc2;border-color:rgba(84,255,194,.22)}.efTrenchReqs b.bad{color:#ff7a93;border-color:rgba(255,122,147,.22)}.efTrenchActions{display:grid;grid-template-columns:1fr 1.15fr;gap:9px;margin-top:12px}.efTrenchActions button{appearance:none;border:1px solid rgba(95,220,255,.24);border-radius:999px;min-height:44px;background:rgba(53,216,255,.12);color:#ecfbff;font:inherit;font-weight:1000;cursor:pointer}.efTrenchActions button.primary{border:0;background:linear-gradient(90deg,#35d8ff,#ffd666);color:#03111d;box-shadow:0 0 28px rgba(255,214,102,.18)}@media(max-width:720px){.efTrenchMapEntry{top:calc(116px + env(safe-area-inset-top));right:10px}.efTrenchMini{min-width:132px;padding:8px 10px}.efTrenchMini b{font-size:12px}.efTrenchCard{width:calc(100vw - 20px)}}
      `}</style>
    </aside>
  );
}

export default TrenchMapEntryOverlay;
