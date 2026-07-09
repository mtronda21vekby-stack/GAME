import React, { useEffect, useState } from "react";
import { readBalanceDebugSnapshot } from "../systems/balanceDebugSystem";

type Snapshot = {
  playerLevel: number;
  enemyTarget: number;
  normal: number;
  strong: number;
  big: number;
  near: number;
  nearMin: number;
  nearMax: number;
  nearAvg: number;
  minBigDistance: number;
  playerHitbox: number;
  enemyHitboxMin: number;
  enemyHitboxMax: number;
  director: string;
};

function loadEnabled() {
  try {
    return localStorage.getItem("evofish_next_balance_qa_visible_v1") === "1";
  } catch {
    return false;
  }
}

function saveEnabled(enabled: boolean) {
  try {
    localStorage.setItem("evofish_next_balance_qa_visible_v1", enabled ? "1" : "0");
  } catch {
    // optional
  }
}

export function BalanceQAOverlay() {
  const [open, setOpen] = useState(loadEnabled);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(() => readBalanceDebugSnapshot());

  useEffect(() => {
    const refresh = () => setSnapshot(readBalanceDebugSnapshot());
    const timer = window.setInterval(refresh, 500);
    window.addEventListener("evofish_balance_debug_changed", refresh as EventListener);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("evofish_balance_debug_changed", refresh as EventListener);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const toggle = () => {
    setOpen((current) => {
      saveEnabled(!current);
      return !current;
    });
  };

  return (
    <section className={`efBalanceQA ${open ? "open" : ""}`}>
      <button className="efQaButton" onClick={toggle}>QA</button>
      {open && snapshot ? (
        <div className="efQaPanel">
          <b>Balance QA</b>
          <span>LV {snapshot.playerLevel} · enemies {snapshot.enemyTarget}</span>
          <em>N {snapshot.normal} · S {snapshot.strong} · BIG {snapshot.big}</em>
          <em>Near {snapshot.near}: LV {snapshot.nearMin}-{snapshot.nearMax} · avg {snapshot.nearAvg.toFixed(1)}</em>
          <em>Big min: {snapshot.minBigDistance}px</em>
          <em>Hitbox P {snapshot.playerHitbox}px · E {snapshot.enemyHitboxMin}-{snapshot.enemyHitboxMax}px</em>
          <small>{snapshot.director}</small>
        </div>
      ) : null}
      <style>{`
        .efBalanceQA{position:fixed;left:max(10px,env(safe-area-inset-left));bottom:calc(max(10px,env(safe-area-inset-bottom)) + 84px);z-index:10004;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;color:#e7f2ff;pointer-events:auto}.efQaButton{width:38px;height:30px;border-radius:12px;border:1px solid rgba(150,230,255,.20);background:rgba(2,16,27,.54);color:#78f0ff;font-size:11px;font-weight:1000;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}.efQaPanel{margin-top:6px;width:210px;border-radius:16px;border:1px solid rgba(150,230,255,.18);background:rgba(2,16,27,.72);box-shadow:0 14px 44px rgba(0,0,0,.30);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);padding:9px;display:grid;gap:3px}.efQaPanel b{font-size:13px;color:#fff3a0}.efQaPanel span,.efQaPanel em,.efQaPanel small{font-style:normal;font-size:10px;color:rgba(231,242,255,.78)}.efQaPanel small{color:rgba(120,240,255,.82)}@media(max-width:520px){.efBalanceQA{bottom:calc(max(10px,env(safe-area-inset-bottom)) + 78px)}.efQaPanel{width:196px}}
      `}</style>
    </section>
  );
}
