import React, { useMemo, useState } from "react";
import { navigate } from "../../router";

const STORAGE_KEY = "evofish_deep_treasures_v1";
const COMP_KEY = "evofish_trench_key_compensation_v1";

type PendingReward = {
  kind?: string;
  label?: string;
  amount?: number;
  multiplier?: number;
};

type TrenchStore = {
  trenchKeys?: number;
  darkCaveKeys?: number;
  pendingReward?: PendingReward | null;
};

function readStore(): TrenchStore {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeStore(store: TrenchStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function pendingText(pending?: PendingReward | null) {
  if (!pending) return "";
  const multiplier = Math.max(1, Math.floor(Number(pending.multiplier || 1)));
  const baseAmount = Math.max(1, Math.floor(Number(pending.amount || 1)));
  const total = baseAmount * multiplier;
  return `${pending.label || "Награда"} ×${total}`;
}

export function TrenchRewardSafetyOverlay() {
  const [store, setStore] = useState(() => readStore());
  const [claimed, setClaimed] = useState(() => localStorage.getItem(COMP_KEY) === "1");
  const pending = store.pendingReward || null;

  const hasPending = Boolean(pending?.kind);
  const showCompensation = !claimed;

  const title = useMemo(() => {
    if (hasPending) return "Незабранная награда";
    if (showCompensation) return "Компенсация за ключ";
    return "";
  }, [hasPending, showCompensation]);

  if (!hasPending && !showCompensation) return null;

  const refresh = () => setStore(readStore());

  const claimCompensation = () => {
    const fresh = readStore();
    const currentKeys = Math.max(0, Math.floor(Number(fresh.trenchKeys ?? fresh.darkCaveKeys ?? 0)));
    const next = { ...fresh, trenchKeys: currentKeys + 1 };
    writeStore(next);
    localStorage.setItem(COMP_KEY, "1");
    setStore(next);
    setClaimed(true);
  };

  return (
    <aside className="efRewardSafety">
      <div>
        <span>{hasPending ? "🔒" : "🔑"}</span>
        <b>{title}</b>
        <p>{hasPending ? pendingText(pending) : "+1 ключ ВПАДИНЫ за прошлый баг"}</p>
      </div>
      <div className="efRewardSafetyActions">
        {hasPending ? <button type="button" onClick={() => navigate("/game/deep-treasures")}>Забрать</button> : <button type="button" onClick={claimCompensation}>Получить</button>}
        <button type="button" className="ghost" onClick={refresh}>Обновить</button>
      </div>
      <style>{`
        .efRewardSafety{position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom));z-index:90;transform:translateX(-50%);width:min(520px,calc(100vw - 20px));border:1px solid rgba(255,214,102,.42);border-radius:22px;padding:12px;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;background:linear-gradient(135deg,rgba(255,214,102,.16),rgba(53,216,255,.16)),rgba(3,18,32,.94);color:#ecfbff;box-shadow:0 24px 80px rgba(0,0,0,.42),0 0 42px rgba(255,214,102,.16);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efRewardSafety>div:first-child{display:grid;grid-template-columns:auto 1fr;grid-template-areas:"icon title" "icon text";gap:1px 10px}.efRewardSafety span{grid-area:icon;width:42px;height:42px;border-radius:999px;display:grid;place-items:center;background:rgba(255,214,102,.14);box-shadow:inset 0 0 22px rgba(255,214,102,.12)}.efRewardSafety b{grid-area:title;font-size:14px;font-weight:1000;letter-spacing:.04em}.efRewardSafety p{grid-area:text;margin:0;color:rgba(236,251,255,.72);font-size:13px;font-weight:800}.efRewardSafetyActions{display:flex;gap:8px}.efRewardSafetyActions button{appearance:none;border:0;border-radius:999px;min-height:42px;padding:0 14px;background:linear-gradient(90deg,#35d8ff,#ffd666);color:#03111d;font:inherit;font-weight:1000;cursor:pointer}.efRewardSafetyActions button.ghost{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#ecfbff}@media(max-width:620px){.efRewardSafety{grid-template-columns:1fr}.efRewardSafetyActions{display:grid;grid-template-columns:1fr 1fr}.efRewardSafetyActions button{width:100%}}
      `}</style>
    </aside>
  );
}

export default TrenchRewardSafetyOverlay;
