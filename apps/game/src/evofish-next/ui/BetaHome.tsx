import React, { useState } from "react";
import { Link } from "../../router";
import { renameNextAccount } from "../content/account";
import { getMutationTotalLevel } from "../content/mutations";
import { EVOFISH_SKIN_BY_ID } from "../content/skins";
import { SkinPreview } from "../render/SkinPreview";
import {
  inspectEvoFishNextSave,
  loadEvoFishNextSave,
  repairEvoFishNextSave,
  resetEvoFishNextRun,
  saveEvoFishNextSave,
  type EvoFishSaveDoctorReport
} from "../state/nextSaveStore";

function format(value: number) {
  return Math.max(0, Math.floor(value || 0)).toLocaleString("ru-RU");
}

function statusLabel(report: EvoFishSaveDoctorReport) {
  if (report.status === "healthy") return "Сохранение в порядке";
  if (report.status === "needs_repair") return "Нужен ремонт сохранения";
  if (report.status === "repaired") return "Сохранение восстановлено";
  if (report.status === "reset") return "Забег перезапущен";
  return "Ошибка сохранения";
}

function statusTone(report: EvoFishSaveDoctorReport) {
  if (report.status === "healthy" || report.status === "repaired" || report.status === "reset") return "good";
  if (report.status === "needs_repair") return "warn";
  return "bad";
}

export function BetaHome() {
  const [save, setSave] = useState(() => loadEvoFishNextSave());
  const [doctor, setDoctor] = useState(() => inspectEvoFishNextSave());
  const [draftName, setDraftName] = useState(() => save.account.name);
  const [nameSaved, setNameSaved] = useState(false);
  const mutations = getMutationTotalLevel(save.mutations);
  const ownedSkins = Object.keys(save.loadout.ownedSkins || {}).length;
  const achievements = Object.keys(save.achievements.unlocked || {}).length;
  const needsRepair = doctor.status !== "healthy";
  const heroSkin = EVOFISH_SKIN_BY_ID[save.loadout.equippedSkinId] || EVOFISH_SKIN_BY_ID.default;
  const heroForm = save.progress.form || "fish";

  const refresh = (report?: EvoFishSaveDoctorReport) => {
    const nextSave = loadEvoFishNextSave();
    setSave(nextSave);
    setDoctor(report || inspectEvoFishNextSave());
    setDraftName(nextSave.account.name);
  };

  const saveNickname = () => {
    const fresh = loadEvoFishNextSave();
    saveEvoFishNextSave({ ...fresh, account: renameNextAccount(fresh.account, draftName) });
    refresh();
    setNameSaved(true);
    window.setTimeout(() => setNameSaved(false), 1800);
  };

  return (
    <main className="efBetaHome">
      <section className="efBetaHomeShell">
        <nav className="efLobbyNav" aria-label="EvoFish navigation">
          <Link to="/game">Главная</Link>
          <Link to="/game/play">Играть</Link>
          <Link to="/game/leaderboard">Лидеры</Link>
          <Link to="/game/skins">Скины</Link>
          <Link to="/game/progress">Прогресс</Link>
          <Link to="/game/season">Сезон</Link>
        </nav>

        <header className="efBetaHomeHero">
          <div className="efHomeHeroCopy">
            <span>BLACKCROWN OCEAN PASS</span>
            <h1>EvoFish</h1>
            <p>Расти в открытой воде, собирай ресурсы, открывай мутации и поднимайся в сезонном TOP 100.</p>
            <Link className="efHeroPlay" to="/game/play">Играть</Link>
          </div>
          <div className="efHomeHeroPreview" aria-label="Текущий скин">
            <SkinPreview skin={heroSkin} form={heroForm} size="md" />
            <i className="drop a" />
            <i className="drop b" />
            <i className="drop c" />
          </div>
        </header>

        <section className="efAccountQuickCard">
          <div className="efAccountAvatar">{save.account.name.slice(0, 1).toUpperCase()}</div>
          <div className="efAccountInfo">
            <span>Аккаунт игрока</span>
            <h2>{save.account.name}</h2>
            <p>Уровень {save.account.level} · {format(save.account.totalXp)} XP · забегов {save.account.runs}</p>
          </div>
          <div className="efNameEditInline">
            <input value={draftName} maxLength={18} placeholder="Введите никнейм" onChange={(event) => setDraftName(event.currentTarget.value)} />
            <button onClick={saveNickname}>{nameSaved ? "Сохранено" : "Сохранить ник"}</button>
          </div>
        </section>

        <section className="efBetaHomeStats">
          <article><span>Уровень</span><b>LV {save.progress.level}</b><small>Tier {save.progress.tier} · масса {save.progress.mass.toFixed(2)}</small></article>
          <article><span>Жемчуг</span><b>{format(save.economy.pearls)}</b><small>валюта для обликов</small></article>
          <article><span>Кораллы</span><b>{format(save.economy.corals)}</b><small>валюта для мутаций</small></article>
          <article><span>Коллекция</span><b>{ownedSkins} обликов</b><small>{mutations} мутаций · {achievements} достижений</small></article>
        </section>

        <section className="efBetaActionGrid public">
          <Link className="efBetaAction primary" to="/game/play"><b>Играть</b><span>Продолжить забег, собрать ресурсы, победить хищников и вырасти дальше.</span></Link>
          <Link className="efBetaAction season" to="/game/season"><b>Сезон 1</b><span>Neon Abyss: награды TOP 1, TOP 10, TOP 100 и сезонные цели.</span></Link>
          <Link className="efBetaAction" to="/game/account"><b>Аккаунт</b><span>Никнейм, общий XP, лучший забег и статистика игрока.</span></Link>
          <Link className="efBetaAction" to="/game/skins"><b>Скины</b><span>Открывай новые облики для рыбы, акулы и мегалодона.</span></Link>
          <Link className="efBetaAction" to="/game/progress"><b>Прогресс</b><span>Задания, достижения, награды и текущая прокачка.</span></Link>
          <Link className="efBetaAction" to="/game/leaderboard"><b>Лидеры</b><span>TOP 100 сезона, живой счёт и твоё место в рейтинге.</span></Link>
        </section>

        {needsRepair ? (
          <section className={`efPlayerSupport ${statusTone(doctor)}`}>
            <div>
              <span>Состояние сохранения</span>
              <h2>{statusLabel(doctor)}</h2>
              <p>{doctor.issues[0] || "Можно попробовать восстановить сохранение."}</p>
            </div>
            <div className="efPlayerSupportActions">
              <button onClick={() => refresh(repairEvoFishNextSave())}>Восстановить</button>
              <button onClick={() => refresh(resetEvoFishNextRun())}>Новый забег</button>
            </div>
          </section>
        ) : null}
      </section>
      <style>{`
        .efBetaHome{min-height:100vh;background:linear-gradient(180deg,#031827,#020b15 62%,#010711);color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efBetaHomeShell{width:min(1120px,calc(100vw - 28px));margin:0 auto;padding:max(22px,env(safe-area-inset-top)) 0 max(24px,env(safe-area-inset-bottom));display:grid;gap:14px}.efLobbyNav{position:sticky;top:max(8px,env(safe-area-inset-top));z-index:5;display:flex;gap:8px;overflow:auto;padding:8px;border:1px solid rgba(150,230,255,.16);border-radius:999px;background:rgba(2,11,21,.66);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}.efLobbyNav a{white-space:nowrap;text-decoration:none;color:#e7f2ff;border:1px solid rgba(150,230,255,.14);background:rgba(255,255,255,.055);border-radius:999px;padding:9px 13px;font-weight:950;font-size:13px}.efBetaHomeHero,.efBetaHomeStats article,.efBetaAction,.efPlayerSupport,.efAccountQuickCard{border:1px solid rgba(150,230,255,.15);background:linear-gradient(180deg,rgba(255,255,255,.095),rgba(255,255,255,.038));box-shadow:0 24px 80px rgba(0,0,0,.34);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efBetaHomeHero{border-radius:34px;padding:20px;display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.52fr);gap:16px;align-items:center;min-height:310px;background:linear-gradient(150deg,rgba(120,240,255,.14),rgba(255,220,120,.055) 46%,rgba(255,255,255,.035))}.efHomeHeroCopy{display:grid;gap:10px}.efBetaHomeHero span,.efBetaHomeStats span,.efPlayerSupport span,.efAccountInfo span{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:rgba(231,242,255,.58);font-weight:1000}.efBetaHomeHero h1{margin:0;font-size:54px;line-height:.96}.efBetaHomeHero p,.efBetaAction span,.efPlayerSupport p,.efAccountInfo p{margin:0;color:rgba(231,242,255,.72);line-height:1.45}.efHeroPlay{min-height:54px;width:max-content;min-width:150px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:1px solid rgba(120,240,255,.34);background:linear-gradient(135deg,rgba(120,240,255,.24),rgba(255,220,120,.12));color:#e7f2ff;text-decoration:none;font-weight:1000}.efHomeHeroPreview{min-height:270px;display:grid;place-items:center;border-radius:28px;background:linear-gradient(180deg,rgba(3,26,44,.52),rgba(2,12,23,.28));overflow:hidden}.efAccountQuickCard{border-radius:28px;padding:14px;display:grid;grid-template-columns:auto minmax(0,1fr) minmax(260px,.7fr);gap:12px;align-items:center}.efAccountAvatar{width:54px;height:54px;border-radius:19px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(120,240,255,.30),rgba(255,220,120,.18));border:1px solid rgba(255,255,255,.16);font-weight:1000;font-size:22px}.efAccountInfo h2{margin:4px 0;font-size:24px;line-height:1}.efNameEditInline{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.efNameEditInline input{min-height:42px;border-radius:15px;border:1px solid rgba(150,230,255,.18);background:rgba(2,16,27,.45);color:#e7f2ff;padding:0 12px;font-size:15px;font-weight:900;outline:none}.efNameEditInline button,.efPlayerSupportActions button{min-height:42px;border-radius:15px;border:1px solid rgba(120,240,255,.24);background:rgba(120,240,255,.13);color:#e7f2ff;padding:0 13px;font-weight:1000}.efBetaHomeStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.efBetaHomeStats article{border-radius:24px;padding:16px;display:grid;gap:5px}.efBetaHomeStats b{font-size:22px}.efBetaHomeStats small{color:rgba(231,242,255,.62)}.efBetaActionGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.efBetaAction{border-radius:26px;padding:16px;text-decoration:none;color:#e7f2ff;display:grid;gap:8px;min-height:104px}.efBetaAction b{font-size:22px}.efBetaAction.primary{background:linear-gradient(135deg,rgba(120,240,255,.22),rgba(255,220,120,.12));border-color:rgba(120,240,255,.34)}.efBetaAction.season{border-color:rgba(255,220,120,.30)}.efPlayerSupport{border-radius:28px;padding:16px;display:flex;justify-content:space-between;gap:12px;align-items:center}.efPlayerSupportActions{display:flex;gap:8px}@media(max-width:820px){.efBetaHomeHero,.efAccountQuickCard{grid-template-columns:1fr}.efBetaHomeStats,.efBetaActionGrid{grid-template-columns:1fr 1fr}.efBetaHomeHero h1{font-size:44px}.efNameEditInline{grid-template-columns:1fr}}@media(max-width:540px){.efBetaHomeStats,.efBetaActionGrid{grid-template-columns:1fr}}
      `}</style>
    </main>
  );
}
