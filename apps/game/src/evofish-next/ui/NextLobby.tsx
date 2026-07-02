import React, { useMemo, useState } from "react";
import { Link } from "../../router";
import { renameNextAccount } from "../content/account";
import { EVOFISH_FORMS } from "../content/forms";
import { EVOFISH_SKIN_BY_ID } from "../content/skins";
import { SkinPreview } from "../render/SkinPreview";
import { loadEvoFishNextSave, saveEvoFishNextSave } from "../state/nextSaveStore";
import { EVOFISH_NEXT_VERSION } from "../version";

function pct(current: number, max: number) {
  return `${Math.max(0, Math.min(100, (current / Math.max(1, max)) * 100))}%`;
}

export function NextLobby() {
  const initialSave = useMemo(() => loadEvoFishNextSave(), []);
  const [save, setSave] = useState(initialSave);
  const [draftName, setDraftName] = useState(initialSave.account.name);
  const account = save.account;
  const progress = save.progress;
  const skin = EVOFISH_SKIN_BY_ID[save.loadout.equippedSkinId] || EVOFISH_SKIN_BY_ID.default;
  const form = progress.form || "fish";
  const runReady = progress.mass <= 1.25 && progress.level <= 1 && progress.tier <= 1;

  const saveNickname = () => {
    const next = {
      ...save,
      account: renameNextAccount(save.account, draftName)
    };
    saveEvoFishNextSave(next);
    setSave(loadEvoFishNextSave());
  };

  return (
    <main className="efLobby">
      <div className="efLobbyBg" />
      <section className="efLobbyHero">
        <div className="efLobbyTop">
          <div className="efLobbyAccount">
            <div className="efAvatar">{account.name.slice(0, 1).toUpperCase()}</div>
            <div className="efAccountBody">
              <span>BLACKCROWN ACCOUNT · {EVOFISH_NEXT_VERSION}</span>
              <h1>{account.name}</h1>
              <p>Account LV {account.level} · {account.totalXp} total XP · {account.runs} runs</p>
              <div className="efNameEdit">
                <input
                  value={draftName}
                  maxLength={18}
                  placeholder="Введите никнейм"
                  onChange={(event) => setDraftName(event.currentTarget.value)}
                />
                <button onClick={saveNickname}>Save</button>
              </div>
            </div>
          </div>

          <div className="efLevelCard">
            <div>
              <b>LV {account.level}</b>
              <span>{account.xp} / {account.xpToNext} XP</span>
            </div>
            <i><em style={{ width: pct(account.xp, account.xpToNext) }} /></i>
          </div>
        </div>

        <div className="efLobbyGrid">
          <div className="efFishStage">
            <SkinPreview skin={skin} form={form} size="lg" />
            <div className="efFishMeta">
              <b>{skin.name}</b>
              <span>{EVOFISH_FORMS[form].name} · Mass {progress.mass.toFixed(2)} · HP {Math.round(progress.hp)} / {Math.round(progress.hpMax)}</span>
              <em>{runReady ? "Fresh fish ready" : "Current run loaded"}</em>
            </div>
          </div>

          <div className="efStatsPanel">
            <article>
              <span>Best Mass</span>
              <b>{account.bestMass.toFixed(2)}</b>
            </article>
            <article>
              <span>Total Kills</span>
              <b>{account.totalKills}</b>
            </article>
            <article>
              <span>Last Run</span>
              <b>+{account.lastRunXp} XP</b>
            </article>
            <article>
              <span>Wallet</span>
              <b>{save.economy.pearls}P · {save.economy.corals}C</b>
            </article>
          </div>
        </div>

        <div className="efModeGrid">
          <Link className="efModeCard primary" to="/game/next/play">
            <b>EvoFish Next</b>
            <span>Resources · Apex · Craft · Account XP</span>
            <em>PLAY</em>
          </Link>
          <Link className="efModeCard" to="/game/classic">
            <b>Classic EvoFish</b>
            <span>Старая классика перенесена в режим Classic.</span>
            <em>CLASSIC</em>
          </Link>
          <Link className="efModeCard" to="/game/next/skins">
            <b>Skin Lab</b>
            <span>Скины, формы, покупки и визуал.</span>
            <em>SKINS</em>
          </Link>
        </div>

        <div className="efLobbyNote">
          Один общий lobby для всех режимов. Next теперь основной режим: ресурсы на карте, опасные рыбы, run-сброс рыбки и account XP. Classic доступен отдельной кнопкой.
        </div>
      </section>

      <style>{`
        .efLobby{min-height:100vh;position:relative;overflow:hidden;background:#020b15;color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efLobbyBg{position:absolute;inset:-20%;background:radial-gradient(circle at 22% 16%,rgba(120,240,255,.22),transparent 34%),radial-gradient(circle at 78% 22%,rgba(255,220,120,.16),transparent 30%),linear-gradient(180deg,#06233a,#020b15 70%)}.efLobbyHero{position:relative;z-index:1;width:min(1080px,calc(100vw - 28px));margin:0 auto;padding:max(22px,env(safe-area-inset-top)) 0 max(22px,env(safe-area-inset-bottom));display:grid;gap:16px}.efLobbyTop{display:grid;grid-template-columns:1fr .44fr;gap:16px}.efLobbyAccount,.efLevelCard,.efFishStage,.efStatsPanel,.efLobbyNote,.efModeCard{border:1px solid rgba(150,230,255,.15);background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.035));box-shadow:0 24px 80px rgba(0,0,0,.35);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efLobbyAccount{display:flex;gap:14px;align-items:flex-start;border-radius:28px;padding:16px}.efAvatar{width:58px;height:58px;border-radius:20px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(120,240,255,.28),rgba(255,220,120,.20));border:1px solid rgba(255,255,255,.18);font-weight:1000;font-size:24px;flex:0 0 auto}.efAccountBody{display:grid;gap:5px;min-width:0;flex:1}.efLobbyAccount span{font-size:11px;letter-spacing:.14em;color:rgba(231,242,255,.56);font-weight:950}.efLobbyAccount h1{margin:0;font-size:32px;line-height:1;word-break:break-word}.efLobbyAccount p,.efFishMeta span,.efLobbyNote,.efModeCard span{margin:0;color:rgba(231,242,255,.70)}.efNameEdit{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin-top:8px}.efNameEdit input{min-height:42px;border-radius:15px;border:1px solid rgba(150,230,255,.18);background:rgba(2,16,27,.45);color:#e7f2ff;padding:0 12px;font-size:15px;font-weight:900;outline:none}.efNameEdit input:focus{border-color:rgba(120,240,255,.42);box-shadow:0 0 0 3px rgba(120,240,255,.10)}.efNameEdit button{min-height:42px;border-radius:15px;border:1px solid rgba(120,240,255,.24);background:rgba(120,240,255,.13);color:#e7f2ff;padding:0 13px;font-weight:1000}.efLevelCard{border-radius:24px;padding:16px;display:grid;gap:10px;align-content:center}.efLevelCard div{display:flex;justify-content:space-between;gap:12px}.efLevelCard b{font-size:22px}.efLevelCard span{font-size:13px;color:rgba(231,242,255,.70);font-weight:800}.efLevelCard i{height:10px;border-radius:999px;background:rgba(255,255,255,.10);overflow:hidden}.efLevelCard em{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#78f0ff,#fff3a0)}.efLobbyGrid{display:grid;grid-template-columns:1.18fr .82fr;gap:16px}.efFishStage{border-radius:32px;min-height:350px;padding:18px;display:grid;align-content:center;justify-items:center;position:relative;overflow:hidden}.efFishStage:before{content:"";position:absolute;inset:12px;border-radius:28px;border:1px solid rgba(255,255,255,.06);background:radial-gradient(circle at 50% 48%,rgba(120,240,255,.12),transparent 46%)}.efFishStage>*{position:relative}.efFishMeta{margin-top:10px;text-align:center;display:grid;gap:4px}.efFishMeta b{font-size:20px}.efFishMeta em{font-style:normal;color:#fff3a0;font-weight:950;font-size:12px;text-transform:uppercase;letter-spacing:.08em}.efStatsPanel{border-radius:32px;padding:14px;display:grid;gap:10px}.efStatsPanel article{padding:14px;border-radius:20px;background:rgba(2,16,27,.36);border:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;gap:12px;align-items:center}.efStatsPanel span{font-size:12px;color:rgba(231,242,255,.58);font-weight:900}.efStatsPanel b{font-size:18px}.efModeGrid{display:grid;grid-template-columns:1.2fr .9fr .9fr;gap:12px}.efModeCard{min-height:96px;border-radius:24px;padding:16px;display:grid;gap:6px;align-content:center;text-decoration:none;color:#e7f2ff;position:relative;overflow:hidden}.efModeCard:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 82% 20%,rgba(120,240,255,.14),transparent 42%);pointer-events:none}.efModeCard.primary{border-color:rgba(120,240,255,.28);background:linear-gradient(135deg,rgba(120,240,255,.18),rgba(255,220,120,.08))}.efModeCard b{font-size:18px;position:relative}.efModeCard span{font-size:13px;position:relative}.efModeCard em{position:relative;font-style:normal;color:#fff3a0;font-size:11px;font-weight:1000;letter-spacing:.12em}.efLobbyNote{border-radius:22px;padding:14px;font-size:13px;line-height:1.45}@media(max-width:760px){.efLobbyHero{gap:12px}.efLobbyTop,.efLobbyGrid,.efModeGrid{grid-template-columns:1fr}.efLobbyAccount h1{font-size:26px}.efNameEdit{grid-template-columns:1fr}.efFishStage{min-height:270px}.efStatsPanel{grid-template-columns:1fr 1fr}.efStatsPanel article{display:grid;gap:4px}.efStatsPanel b{font-size:16px}.efModeCard{min-height:82px}}
      `}</style>
    </main>
  );
}
