import React, { useMemo, useState } from "react";
import { Link } from "../../router";
import type { EvoFishFormId, EvoFishSkinDefinition } from "../core/types";
import { EVOFISH_FORMS } from "../content/forms";
import { getSkinProgressRequirement, getSkinUnlockReasons, canUseSkinInNext } from "../content/skinUnlockRules";
import { EVOFISH_SKINS, getSkinsForForm } from "../content/skins";
import { SkinPreview } from "../render/SkinPreview";
import { buySkin, canBuySkin, equipSkin, isSkinOwned, loadEvoFishNextSave, saveEvoFishNextSave } from "../state/nextSaveStore";
import { EVOFISH_NEXT_VERSION } from "../version";

const FORM_ORDER: EvoFishFormId[] = ["fish", "shark", "megalodon"];

function priceLabel(skin: EvoFishSkinDefinition) {
  if (skin.unlock.type === "free") return "Бесплатно";
  if (skin.unlock.type === "currency") return `${skin.unlock.amount} ${skin.unlock.currency === "pearls" ? "жемчуг" : "кораллы"}`;
  return `Achievement: ${skin.unlock.achievementId}`;
}

function rarityLabel(rarity: EvoFishSkinDefinition["rarity"]) {
  const map: Record<EvoFishSkinDefinition["rarity"], string> = {
    common: "Common",
    premium: "Premium",
    rare: "Rare",
    epic: "Epic",
    legendary: "Legendary"
  };
  return map[rarity];
}

function lockLabel(reasons: { label: string }[]) {
  return reasons[0]?.label || "Недоступно";
}

export function SkinLab() {
  const [form, setForm] = useState<EvoFishFormId>("fish");
  const [selectedId, setSelectedId] = useState("default");
  const [save, setSave] = useState(() => loadEvoFishNextSave());

  const skins = useMemo(() => getSkinsForForm(form), [form]);
  const selected = useMemo<EvoFishSkinDefinition>(
    () => skins.find((skin) => skin.id === selectedId) ?? skins[0] ?? EVOFISH_SKINS[0],
    [selectedId, skins]
  );
  const selectedForm = selected.form === "any" ? form : selected.form;
  const selectedReq = getSkinProgressRequirement(selected);
  const selectedLocks = getSkinUnlockReasons(save, selected);
  const selectedUsable = canUseSkinInNext(save, selected);
  const owned = isSkinOwned(save, selected.id);
  const equipped = save.loadout.equippedSkinId === selected.id;
  const canBuy = canBuySkin(save, selected.id);
  const canAct = !equipped && (owned ? selectedUsable : canBuy);

  const applySelectedSkin = () => {
    if (!canAct) return;
    const next = owned ? equipSkin(save, selected.id) : buySkin(save, selected.id);
    setSave(next);
    saveEvoFishNextSave(next);
  };

  const actionText = equipped
    ? "Надето"
    : owned && selectedUsable
      ? "Надеть"
      : owned
        ? lockLabel(selectedLocks)
        : canBuy
          ? "Купить и надеть"
          : lockLabel(selectedLocks);

  return (
    <main className="efNextLab">
      <header className="efNextTopbar">
        <div>
          <div className="efNextKicker">EvoFish Next</div>
          <h1>Skin Lab</h1>
          <p>Shop Bridge: скины теперь открываются по LV/Tier/Form и валюте. Валюта приходит из Next Game.</p>
        </div>
        <div className="efNextActions">
          <span>{EVOFISH_NEXT_VERSION}</span>
          <span>LV {save.progress.level} · Tier {save.progress.tier}</span>
          <span>{EVOFISH_FORMS[save.progress.form].name}</span>
          <span>{save.economy.pearls} жемчуг</span>
          <span>{save.economy.corals} кораллы</span>
          <Link to="/game/next" className="efBack">Next Game</Link>
          <Link to="/game" className="efBack">Назад в игру</Link>
        </div>
      </header>

      <section className="efFormTabs" aria-label="Формы">
        {FORM_ORDER.map((id) => {
          const def = EVOFISH_FORMS[id];
          const minLevel = id === "shark" ? 30 : id === "megalodon" ? 60 : 1;
          const locked = save.progress.level < minLevel;
          return (
            <button key={id} className={`${id === form ? "active" : ""} ${locked ? "locked" : ""}`} onClick={() => setForm(id)}>
              <b>{def.name}</b>
              <span>{locked ? `Откроется на LV ${minLevel}` : `${getSkinsForForm(id).length} skins`}</span>
            </button>
          );
        })}
      </section>

      <section className="efLabStage">
        <div className="efHeroPreview">
          <SkinPreview skin={selected} form={selectedForm} size="lg" />
        </div>
        <div className="efHeroInfo">
          <div className="efRarity">{rarityLabel(selected.rarity)}</div>
          <h2>{selected.name}</h2>
          <p>{selected.description}</p>
          <button className="efPrimaryAction" disabled={!canAct} onClick={applySelectedSkin}>{actionText}</button>
          {selectedLocks.length ? (
            <div className="efLockList">
              {selectedLocks.map((reason) => <span key={reason.code}>{reason.label}</span>)}
            </div>
          ) : (
            <div className="efLockList ok"><span>Доступно</span></div>
          )}
          <div className="efInfoGrid">
            <div><span>ID</span><b>{selected.id}</b></div>
            <div><span>FORM</span><b>{selected.form === "any" ? "Any" : EVOFISH_FORMS[selected.form].name}</b></div>
            <div><span>PRICE</span><b>{priceLabel(selected)}</b></div>
            <div><span>REQUIRE</span><b>LV {selectedReq.minLevel || 1} · Tier {selectedReq.minTier || 1}</b></div>
            <div><span>PATTERN</span><b>{selected.pattern}</b></div>
            <div><span>STATUS</span><b>{equipped ? "Equipped" : owned ? "Owned" : selectedLocks.length ? "Locked" : "Available"}</b></div>
          </div>
          <div className="efPalette">
            <span style={{ background: selected.palette.primary }} />
            <span style={{ background: selected.palette.secondary }} />
            <span style={{ background: selected.palette.accent }} />
            {selected.palette.glow ? <span style={{ background: selected.palette.glow }} /> : null}
          </div>
          <div className="efTags">
            {selected.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </div>
      </section>

      <section className="efSkinGrid">
        {skins.map((skin) => {
          const previewForm = skin.form === "any" ? form : skin.form;
          const cardOwned = isSkinOwned(save, skin.id);
          const cardEquipped = save.loadout.equippedSkinId === skin.id;
          const cardLocks = getSkinUnlockReasons(save, skin);
          const cardUsable = canUseSkinInNext(save, skin);
          const cardLocked = cardLocks.length > 0 || (cardOwned && !cardUsable);
          const status = cardEquipped
            ? "Надето"
            : cardOwned && cardUsable
              ? "Куплен"
              : cardLocked
                ? lockLabel(cardLocks)
                : priceLabel(skin);

          return (
            <button key={skin.id} className={`efSkinCard ${skin.id === selected.id ? "active" : ""} ${cardLocked ? "locked" : ""}`} onClick={() => setSelectedId(skin.id)}>
              <SkinPreview skin={skin} form={previewForm} size="sm" />
              <div className="efSkinCardBody">
                <b>{skin.name}</b>
                <span>{status}</span>
              </div>
            </button>
          );
        })}
      </section>

      <style>{`
        .efNextLab{min-height:100vh;padding:calc(env(safe-area-inset-top) + 18px) max(16px,env(safe-area-inset-right)) calc(env(safe-area-inset-bottom) + 24px) max(16px,env(safe-area-inset-left));background:radial-gradient(circle at 50% 0%,rgba(70,220,255,.18),transparent 34%),#031827;color:#e7f2ff;box-sizing:border-box;overflow:auto}
        .efNextTopbar{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;max-width:1180px;margin:0 auto 18px}.efNextKicker{font-size:12px;font-weight:950;letter-spacing:.14em;text-transform:uppercase;color:rgba(120,240,255,.72)}.efNextTopbar h1{margin:4px 0 6px;font-size:34px;line-height:1}.efNextTopbar p{margin:0;max-width:680px;color:rgba(231,242,255,.72);font-size:14px;line-height:1.45}.efNextActions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}.efNextActions span,.efBack{display:inline-flex;align-items:center;min-height:34px;padding:0 12px;border-radius:999px;border:1px solid rgba(150,230,255,.16);background:rgba(255,255,255,.06);color:#e7f2ff;text-decoration:none;font-size:12px;font-weight:900}
        .efFormTabs{max-width:1180px;margin:0 auto 16px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.efFormTabs button{border:1px solid rgba(150,230,255,.12);border-radius:18px;background:rgba(255,255,255,.045);color:#e7f2ff;min-height:62px;text-align:left;padding:12px;display:flex;flex-direction:column;gap:5px}.efFormTabs button.active{background:linear-gradient(180deg,rgba(120,240,255,.22),rgba(90,160,255,.12));border-color:rgba(120,240,255,.28)}.efFormTabs button.locked{opacity:.62}.efFormTabs span{font-size:12px;color:rgba(231,242,255,.64)}
        .efLabStage{max-width:1180px;margin:0 auto 18px;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);gap:14px}.efHeroPreview,.efHeroInfo{border:1px solid rgba(150,230,255,.14);border-radius:26px;background:linear-gradient(180deg,rgba(5,28,45,.72),rgba(2,14,25,.72));box-shadow:0 22px 70px rgba(0,0,0,.26);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}.efHeroPreview{display:flex;align-items:center;justify-content:center;min-height:340px;padding:18px}.efHeroInfo{padding:20px}.efRarity{display:inline-flex;min-height:28px;align-items:center;padding:0 10px;border-radius:999px;background:rgba(120,240,255,.12);border:1px solid rgba(120,240,255,.18);font-size:11px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.efHeroInfo h2{margin:14px 0 8px;font-size:30px;line-height:1}.efHeroInfo p{margin:0 0 16px;color:rgba(231,242,255,.72);line-height:1.45}.efPrimaryAction{width:100%;min-height:46px;margin:0 0 10px;border:0;border-radius:16px;background:linear-gradient(180deg,rgba(120,240,255,.28),rgba(90,160,255,.16));color:#e7f2ff;font-weight:950}.efPrimaryAction:disabled{opacity:.48}.efLockList{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 14px}.efLockList span{font-size:11px;padding:6px 9px;border-radius:999px;border:1px solid rgba(255,120,120,.18);background:rgba(255,90,90,.10);color:rgba(255,210,210,.90);font-weight:900}.efLockList.ok span{border-color:rgba(110,255,180,.18);background:rgba(110,255,180,.10);color:rgba(210,255,230,.90)}.efInfoGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.efInfoGrid div{border:1px solid rgba(255,255,255,.09);border-radius:15px;background:rgba(255,255,255,.045);padding:10px}.efInfoGrid span{display:block;font-size:10px;font-weight:950;color:rgba(231,242,255,.48);letter-spacing:.08em}.efInfoGrid b{display:block;margin-top:4px;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.efPalette{display:flex;gap:8px;margin-top:14px}.efPalette span{width:32px;height:32px;border-radius:999px;border:1px solid rgba(255,255,255,.18)}.efTags{margin-top:14px;display:flex;gap:7px;flex-wrap:wrap}.efTags span{font-size:11px;padding:5px 8px;border-radius:999px;background:rgba(255,255,255,.06);color:rgba(231,242,255,.72)}
        .efSkinGrid{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.efSkinCard{border:1px solid rgba(150,230,255,.11);border-radius:22px;background:rgba(255,255,255,.045);padding:10px;color:#e7f2ff;text-align:left}.efSkinCard.active{border-color:rgba(120,240,255,.34);background:rgba(120,240,255,.10)}.efSkinCard.locked{opacity:.62}.efSkinCardBody{padding:8px 2px 2px}.efSkinCardBody b{display:block;font-size:13px}.efSkinCardBody span{display:block;margin-top:4px;font-size:11px;color:rgba(231,242,255,.60)}.efSkinPreview svg{display:block;width:100%;height:auto}.efSkinPreview.sm svg{border-radius:15px}.efSkinPreview.md{max-width:360px}.efSkinPreview.lg{width:min(560px,100%)}
        @media(max-width:900px){.efNextTopbar{display:block}.efNextActions{justify-content:flex-start;margin-top:12px}.efLabStage{grid-template-columns:1fr}.efHeroPreview{min-height:250px}.efSkinGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.efNextTopbar h1{font-size:28px}}
        @media(max-width:520px){.efFormTabs{grid-template-columns:1fr}.efSkinGrid{grid-template-columns:1fr}.efInfoGrid{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
