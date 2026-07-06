import React, { useMemo, useState } from "react";
import { Link } from "../../router";
import type { EvoFishFormId, EvoFishSkinDefinition } from "../core/types";
import { EVOFISH_FORMS } from "../content/forms";
import { getSkinProgressRequirement, getSkinUnlockReasons, canUseSkinInNext } from "../content/skinUnlockRules";
import { EVOFISH_SKINS, getSkinsForForm } from "../content/skins";
import { SkinPreview } from "../render/SkinPreview";
import { buySkin, canBuySkin, equipSkin, isSkinOwned, loadEvoFishNextSave, saveEvoFishNextSave } from "../state/nextSaveStore";

const FORM_ORDER: EvoFishFormId[] = ["fish", "shark", "megalodon"];

function priceLabel(skin: EvoFishSkinDefinition) {
  if (skin.unlock.type === "free") return "Бесплатно";
  if (skin.unlock.type === "currency") return `${skin.unlock.amount} ${skin.unlock.currency === "pearls" ? "жемчуг" : "кораллы"}`;
  return `Достижение: ${skin.unlock.achievementId}`;
}

function rarityLabel(rarity: EvoFishSkinDefinition["rarity"]) {
  const map: Record<EvoFishSkinDefinition["rarity"], string> = {
    common: "Обычный",
    premium: "Премиум",
    rare: "Редкий",
    epic: "Эпический",
    legendary: "Легендарный"
  };
  return map[rarity];
}

function lockLabel(reasons: { label: string }[]) {
  return reasons[0]?.label || "Недоступно";
}

function statusLabel(equipped: boolean, owned: boolean, locked: boolean) {
  if (equipped) return "Надето";
  if (owned) return "Куплен";
  if (locked) return "Закрыт";
  return "Доступен";
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
          <div className="efNextKicker">EvoFish Collection</div>
          <h1>Коллекция скинов</h1>
          <p>Выбирай облик для текущей формы, покупай за игровую валюту и сразу примеряй его в витрине.</p>
        </div>
        <div className="efNextActions">
          <span>LV {save.progress.level} · Tier {save.progress.tier}</span>
          <span>{EVOFISH_FORMS[save.progress.form].name}</span>
          <span>{save.economy.pearls} жемчуг</span>
          <span>{save.economy.corals} кораллы</span>
          <Link to="/game/next" className="efBack">Лобби</Link>
          <Link to="/game" className="efBack">Главная</Link>
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
              <span>{locked ? `Откроется на LV ${minLevel}` : `${getSkinsForForm(id).length} обликов`}</span>
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
            <div><span>Форма</span><b>{selected.form === "any" ? "Все формы" : EVOFISH_FORMS[selected.form].name}</b></div>
            <div><span>Цена</span><b>{priceLabel(selected)}</b></div>
            <div><span>Требование</span><b>LV {selectedReq.minLevel || 1} · Tier {selectedReq.minTier || 1}</b></div>
            <div><span>Состояние</span><b>{statusLabel(equipped, owned, selectedLocks.length > 0)}</b></div>
          </div>
          <div className="efPalette">
            <span style={{ background: selected.palette.primary }} />
            <span style={{ background: selected.palette.secondary }} />
            <span style={{ background: selected.palette.accent }} />
            {selected.palette.glow ? <span style={{ background: selected.palette.glow }} /> : null}
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
        .efNextLab{min-height:100vh;position:relative;padding:calc(env(safe-area-inset-top) + 18px) max(16px,env(safe-area-inset-right)) calc(env(safe-area-inset-bottom) + 24px) max(16px,env(safe-area-inset-left));background:linear-gradient(180deg,#031827 0%,#020b15 70%,#010711 100%);color:#e7f2ff;box-sizing:border-box;overflow:auto}.efNextLab:before{content:"";position:fixed;inset:-18%;background:radial-gradient(ellipse at 50% 0%,rgba(70,220,255,.20),transparent 36%),radial-gradient(ellipse at 88% 22%,rgba(255,220,120,.12),transparent 30%);pointer-events:none}.efNextLab:after{content:"";position:fixed;inset:0;opacity:.20;background-image:radial-gradient(circle at 20% 20%,rgba(220,250,255,.50) 0 1px,transparent 2px),radial-gradient(circle at 76% 32%,rgba(120,240,255,.35) 0 1px,transparent 2px),radial-gradient(circle at 66% 82%,rgba(255,255,255,.28) 0 1px,transparent 2px);background-size:280px 240px,340px 300px,300px 280px;pointer-events:none}
        .efNextTopbar,.efFormTabs,.efLabStage,.efSkinGrid{position:relative;z-index:1}.efNextTopbar{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;max-width:1180px;margin:0 auto 18px}.efNextKicker{font-size:12px;font-weight:950;letter-spacing:.14em;text-transform:uppercase;color:rgba(120,240,255,.72)}.efNextTopbar h1{margin:4px 0 6px;font-size:34px;line-height:1}.efNextTopbar p{margin:0;max-width:680px;color:rgba(231,242,255,.72);font-size:14px;line-height:1.45}.efNextActions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}.efNextActions span,.efBack{display:inline-flex;align-items:center;min-height:34px;padding:0 12px;border-radius:999px;border:1px solid rgba(150,230,255,.16);background:rgba(255,255,255,.06);color:#e7f2ff;text-decoration:none;font-size:12px;font-weight:900}
        .efFormTabs{max-width:1180px;margin:0 auto 16px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.efFormTabs button{border:1px solid rgba(150,230,255,.14);border-radius:18px;background:rgba(255,255,255,.05);color:#e7f2ff;min-height:62px;text-align:left;padding:12px;display:flex;flex-direction:column;gap:5px}.efFormTabs button.active{background:linear-gradient(180deg,rgba(120,240,255,.22),rgba(90,160,255,.12));border-color:rgba(120,240,255,.30)}.efFormTabs button.locked{opacity:.62}.efFormTabs span{font-size:12px;color:rgba(231,242,255,.64)}
        .efLabStage{max-width:1180px;margin:0 auto 18px;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);gap:14px}.efHeroPreview,.efHeroInfo{border:1px solid rgba(150,230,255,.15);border-radius:26px;background:linear-gradient(180deg,rgba(5,28,45,.76),rgba(2,14,25,.72));box-shadow:0 22px 70px rgba(0,0,0,.30);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}.efHeroPreview{display:flex;align-items:center;justify-content:center;min-height:340px;padding:18px;position:relative;overflow:hidden}.efHeroPreview:before{content:"";position:absolute;inset:16px;border-radius:24px;border:1px solid rgba(255,255,255,.07);box-shadow:inset 0 0 70px rgba(70,220,255,.08)}.efHeroPreview>*{position:relative}.efHeroInfo{padding:20px}.efRarity{display:inline-flex;min-height:28px;align-items:center;padding:0 10px;border-radius:999px;background:rgba(120,240,255,.12);border:1px solid rgba(120,240,255,.18);font-size:11px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.efHeroInfo h2{margin:14px 0 8px;font-size:30px;line-height:1}.efHeroInfo p{margin:0 0 16px;color:rgba(231,242,255,.72);line-height:1.45}.efPrimaryAction{width:100%;min-height:46px;margin:0 0 10px;border:0;border-radius:16px;background:linear-gradient(180deg,rgba(120,240,255,.30),rgba(90,160,255,.17));color:#e7f2ff;font-weight:950}.efPrimaryAction:disabled{opacity:.48}.efLockList{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 14px}.efLockList span{font-size:11px;padding:6px 9px;border-radius:999px;border:1px solid rgba(255,120,120,.18);background:rgba(255,90,90,.10);color:rgba(255,210,210,.90);font-weight:900}.efLockList.ok span{border-color:rgba(110,255,180,.18);background:rgba(110,255,180,.10);color:rgba(210,255,230,.90)}
        .efInfoGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.efInfoGrid div{border:1px solid rgba(255,255,255,.09);border-radius:15px;background:rgba(255,255,255,.045);padding:10px}.efInfoGrid span{display:block;font-size:10px;font-weight:950;color:rgba(231,242,255,.48);letter-spacing:.08em}.efInfoGrid b{display:block;margin-top:4px;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.efPalette{display:flex;gap:8px;margin-top:14px}.efPalette span{width:32px;height:32px;border-radius:999px;border:1px solid rgba(255,255,255,.18)}
        .efSkinGrid{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.efSkinCard{border:1px solid rgba(150,230,255,.12);border-radius:22px;background:rgba(255,255,255,.05);padding:10px;color:#e7f2ff;text-align:left}.efSkinCard.active{border-color:rgba(120,240,255,.34);background:rgba(120,240,255,.11)}.efSkinCard.locked{opacity:.62}.efSkinCardBody{padding:8px 2px 2px}.efSkinCardBody b{display:block;font-size:13px}.efSkinCardBody span{display:block;margin-top:4px;font-size:11px;color:rgba(231,242,255,.60)}.efSkinPreview svg{display:block;width:100%;height:auto}.efSkinPreview.sm svg{border-radius:15px}.efSkinPreview.md{max-width:360px}.efSkinPreview.lg{width:min(560px,100%)}
        @media(max-width:900px){.efNextTopbar{display:block}.efNextActions{justify-content:flex-start;margin-top:12px}.efLabStage{grid-template-columns:1fr}.efHeroPreview{min-height:250px}.efSkinGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.efNextTopbar h1{font-size:28px}}@media(max-width:520px){.efFormTabs{grid-template-columns:1fr}.efSkinGrid{grid-template-columns:1fr}.efInfoGrid{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
