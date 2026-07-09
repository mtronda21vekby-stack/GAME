import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EVOFISH_FORMS } from "../content/forms";
import { EVOFISH_SKINS } from "../content/skins";
import { canUseSkinInNext } from "../content/skinUnlockRules";
import { SkinPreview } from "../render/SkinPreview";
import {
  equipSkin,
  isSkinOwned,
  loadEvoFishNextSave,
  saveEvoFishNextSave,
  subscribeEvoFishNextSaveChanges
} from "../state/nextSaveStore";

const LOBBY_PATHS = new Set(["/", "/game", "/game/lobby", "/game/next", "/game/next/lobby", "/next", "/next/lobby"]);

function normalizedPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function isLobbyPath() {
  return LOBBY_PATHS.has(normalizedPath());
}

function formatOwnedLabel(count: number) {
  if (count === 1) return "1 куплен";
  return `${count} куплено`;
}

export function LobbySkinCarousel() {
  const [save, setSave] = useState(() => loadEvoFishNextSave());
  const [path, setPath] = useState(() => normalizedPath());
  const [host, setHost] = useState<HTMLElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const currentForm = save.progress.form || "fish";

  useEffect(() => subscribeEvoFishNextSaveChanges(() => setSave(loadEvoFishNextSave())), []);

  useEffect(() => {
    const onPop = () => setPath(normalizedPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const findHost = () => setHost(document.querySelector<HTMLElement>(".efHubCenter"));
    findHost();
    const timer = window.setInterval(findHost, 500);
    return () => window.clearInterval(timer);
  }, [path]);

  const ownedSkins = useMemo(() => {
    return EVOFISH_SKINS.filter((skin) => {
      const fitsCurrentForm = skin.form === "any" || skin.form === currentForm;
      return fitsCurrentForm && isSkinOwned(save, skin.id) && canUseSkinInNext(save, skin);
    });
  }, [save, currentForm]);

  useEffect(() => {
    if (!ownedSkins.length) return;
    const selectedStillVisible = ownedSkins.some((skin) => skin.id === save.loadout.equippedSkinId);
    if (selectedStillVisible) return;

    const fresh = loadEvoFishNextSave();
    const fallback = ownedSkins[0];
    saveEvoFishNextSave(equipSkin(fresh, fallback.id));
    setSave(loadEvoFishNextSave());
  }, [ownedSkins, save.loadout.equippedSkinId]);

  if (!LOBBY_PATHS.has(path) || !host || ownedSkins.length === 0) return null;

  const activeIndex = Math.max(0, ownedSkins.findIndex((skin) => skin.id === save.loadout.equippedSkinId));
  const activeSkin = ownedSkins[activeIndex] || ownedSkins[0];

  const selectSkin = (skinId: string) => {
    const fresh = loadEvoFishNextSave();
    const skin = ownedSkins.find((item) => item.id === skinId);
    if (!skin || !isSkinOwned(fresh, skin.id) || !canUseSkinInNext(fresh, skin)) return;
    const next = equipSkin(fresh, skin.id);
    saveEvoFishNextSave(next);
    setSave(loadEvoFishNextSave());
  };

  const move = (direction: -1 | 1) => {
    if (!ownedSkins.length) return;
    const nextIndex = (activeIndex + direction + ownedSkins.length) % ownedSkins.length;
    const nextSkin = ownedSkins[nextIndex];
    selectSkin(nextSkin.id);
    window.setTimeout(() => {
      stripRef.current?.querySelector<HTMLElement>(`[data-skin-id="${nextSkin.id}"]`)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }, 30);
  };

  return createPortal(
    <section className="efLobbySkinPicker" aria-label="Выбор купленного скина">
      <button className="efLobbySkinArrow" type="button" onClick={() => move(-1)} aria-label="Предыдущий скин">‹</button>
      <div className="efLobbySkinBody">
        <div className="efLobbySkinMeta">
          <span>Скин перед стартом · {EVOFISH_FORMS[currentForm].name}</span>
          <b>{activeSkin.name}</b>
          <em>{formatOwnedLabel(ownedSkins.length)} · только купленные</em>
        </div>
        <div className="efLobbySkinStrip" ref={stripRef}>
          {ownedSkins.map((skin) => {
            const active = skin.id === activeSkin.id;
            return (
              <button
                key={skin.id}
                data-skin-id={skin.id}
                className={`efLobbySkinChip ${active ? "active" : ""}`}
                type="button"
                aria-pressed={active}
                onClick={() => selectSkin(skin.id)}
              >
                <SkinPreview skin={skin} form={currentForm} size="sm" variant="sprite" />
                <small>{skin.name}</small>
              </button>
            );
          })}
        </div>
      </div>
      <button className="efLobbySkinArrow" type="button" onClick={() => move(1)} aria-label="Следующий скин">›</button>
      <style>{`
        .efLobbySkinPicker{width:min(620px,calc(100vw - 26px));display:grid;grid-template-columns:42px minmax(0,1fr) 42px;gap:8px;align-items:center;margin:10px auto 0;position:relative;z-index:6;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}.efLobbySkinBody{min-width:0;border:1px solid rgba(88,210,255,.24);border-radius:24px;padding:10px;background:linear-gradient(180deg,rgba(255,255,255,.105),rgba(255,255,255,.035)),rgba(5,18,32,.56);box-shadow:0 18px 54px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.10);backdrop-filter:blur(18px) saturate(1.14);-webkit-backdrop-filter:blur(18px) saturate(1.14)}.efLobbySkinMeta{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 8px;align-items:end;text-align:left;margin:0 2px 8px}.efLobbySkinMeta span{grid-column:1/-1;color:rgba(150,232,255,.78);font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-weight:1000}.efLobbySkinMeta b{font-size:15px;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efLobbySkinMeta em{font-style:normal;color:rgba(234,247,255,.58);font-size:11px;font-weight:900;white-space:nowrap}.efLobbySkinStrip{display:grid;grid-auto-flow:column;grid-auto-columns:82px;gap:8px;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;padding:2px 2px 6px;scrollbar-width:none}.efLobbySkinStrip::-webkit-scrollbar{display:none}.efLobbySkinChip{scroll-snap-align:center;min-width:0;height:74px;border-radius:18px;border:1px solid rgba(88,210,255,.18);background:rgba(5,18,32,.42);color:#eaf7ff;display:grid;grid-template-rows:minmax(0,1fr) auto;gap:3px;align-items:center;justify-items:center;padding:7px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;overflow:hidden}.efLobbySkinChip .efSkinPreview{width:100%;max-height:44px}.efLobbySkinChip .efSkinSpriteImg,.efLobbySkinChip .efSkinSpriteSvg{max-height:42px;object-fit:contain}.efLobbySkinChip small{max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:rgba(234,247,255,.68);font-size:10px;font-weight:900}.efLobbySkinChip.active{border-color:rgba(53,216,255,.58);background:linear-gradient(180deg,rgba(53,216,255,.20),rgba(53,216,255,.055)),rgba(7,27,45,.76);box-shadow:0 0 0 3px rgba(53,216,255,.08),0 12px 34px rgba(0,0,0,.22)}.efLobbySkinArrow{width:42px;height:64px;border-radius:999px;border:1px solid rgba(88,210,255,.26);background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.04)),rgba(5,18,32,.68);color:#eaf7ff;font-size:34px;line-height:1;font-weight:700;display:grid;place-items:center;box-shadow:0 14px 38px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.11);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}.efLobbySkinArrow:active,.efLobbySkinChip:active{transform:scale(.96)}@media(max-width:720px){.efLobbySkinPicker{grid-template-columns:36px minmax(0,1fr) 36px;margin-top:7px;width:min(100%,calc(100vw - 22px))}.efLobbySkinBody{border-radius:20px;padding:8px}.efLobbySkinArrow{width:36px;height:58px;font-size:30px}.efLobbySkinStrip{grid-auto-columns:74px;gap:7px}.efLobbySkinChip{height:68px;border-radius:16px}.efLobbySkinMeta{grid-template-columns:1fr}.efLobbySkinMeta em{white-space:normal}}
      `}</style>
    </section>,
    host
  );
}
