import React, { useState } from "react";
import { Link } from "../../router";
import { renameNextAccount } from "../content/account";
import { getMutationTotalLevel } from "../content/mutations";
import { EVOFISH_SKIN_BY_ID } from "../content/skins";
import { SkinPreview } from "../render/SkinPreview";
import { inspectEvoFishNextSave, loadEvoFishNextSave, repairEvoFishNextSave, resetEvoFishNextRun, saveEvoFishNextSave, type EvoFishSaveDoctorReport } from "../state/nextSaveStore";

function format(value: number) { return Math.max(0, Math.floor(value || 0)).toLocaleString("ru-RU"); }
function statusLabel(report: EvoFishSaveDoctorReport) { if (report.status === "healthy") return "Сохранение в порядке"; if (report.status === "needs_repair") return "Нужен ремонт сохранения"; if (report.status === "repaired") return "Сохранение восстановлено"; if (report.status === "reset") return "Забег перезапущен"; return "Ошибка сохранения"; }
function statusTone(report: EvoFishSaveDoctorReport) { if (report.status === "healthy" || report.status === "repaired" || report.status === "reset") return "good"; if (report.status === "needs_repair") return "warn"; return "bad"; }

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
  const refresh = (report?: EvoFishSaveDoctorReport) => { setSave(loadEvoFishNextSave()); setDoctor(report || inspectEvoFishNextSave()); };

  const saveNickname = () => {
    const fresh = loadEvoFishNextSave();
    const next = { ...fresh, account: renameNextAccount(fresh.account, draftName) };
    saveEvoFishNextSave(next);
    const normalized = loadEvoFishNextSave();
    setSave(normalized);
    setDraftName(normalized.account.name);
    setNameSaved(true);
    window.setTimeout(() => setNameSaved(false), 1800);
  };

  return (
    <main className="efBetaHome">
      <section className="efBetaHomeShell">
        <nav className="efLobbyNav" aria-label="EvoFish navigation">
          <Link to="/game">Главная</Link>
          <Link to="/game/account">Аккаунт</Link>
          <Link to="/game/season">Сезон</Link>
          <Link to="/game/play">Играть</Link>
          <Link to="/game/skins">Скины</Link>
          <Link to="/game/progress">Прогресс</Link>
          <Link to="/game/leaderboard">Лидеры</Link>
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
            <div><span>Состояние сохранения</span><h2>{statusLabel(doctor)}</h2><p>{doctor.issues[0] || "Можно попробовать восстановить сохранение."}</p></div>
            <div className="efPlayerSupportActions"><button onClick={() => refresh(repairEvoFishNextSave())}>Восстановить</button><button onClick={() => refresh(resetEvoFishNextRun())}>Новый забег</button></div>
          </section>
        ) : null}
      </section>
      <style>{`
        .efBetaHome{min-height:100vh;position:relative;overflow:hidden;background:linear-gradient(180deg,#031827 0%,#020b15 62%,#010711 100%);color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}
        .efBetaHome:before{content:"";position:absolute;inset:-20% -10%;background:radial-gradient(ellipse at 28% 0%,rgba(111,231,255,.20),transparent 38%),radial-gradient(ellipse at 84% 18%,rgba(255,220,140,.12),transparent 34%),linear-gradient(115deg,transparent 0 42%,rgba(255,255,255,.055) 50%,transparent 60%);filter:blur(.2px);pointer-events:none}
        .efBetaHome:after{content:"";position:absolute;inset:0;opacity:.24;background-image:radial-gradient(circle at 12% 22%,rgba(156,238,255,.46) 0 1px,transparent 2px),radial-gradient(circle at 86% 18%,rgba(156,238,255,.34) 0 1px,transparent 2px),radial-gradient(circle at 74% 72%,rgba(255,255,255,.26) 0 1px,transparent 2px);background-size:260px 220px,330px 260px,300px 280px;pointer-events:none}
        .efBetaHomeShell{position:relative;z-index:1;width:min(1120px,calc(100vw - 28px));margin:0 auto;padding:max(22px,env(safe-area-inset-top)) 0 max(24px,env(safe-area-inset-bottom));display:grid;gap:14px}
        .efLobbyNav{position:sticky;top:max(8px,env(safe-area-inset-top));z-index:5;display:flex;gap:8px;overflow:auto;padding:8px;border:1px solid rgba(150,230,255,.16);border-radius:999px;background:rgba(2,11,21,.66);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 16px 48px rgba(0,0,0,.25)}
        .efLobbyNav a{white-space:nowrap;text-decoration:none;color:#e7f2ff;border:1px solid rgba(150,230,255,.14);background:rgba(255,255,255,.055);border-radius:999px;padding:9px 13px;font-weight:950;font-size:13px}.efLobbyNav a:first-child{background:linear-gradient(135deg,rgba(120,240,255,.18),rgba(255,220,120,.10));border-color:rgba(120,240,255,.28)}
        .efBetaHomeHero,.efBetaHomeStats article,.efBetaAction,.efPlayerSupport,.efAccountQuickCard{border:1px solid rgba(150,230,255,.15);background:linear-gradient(180deg,rgba(255,255,255,.095),rgba(255,255,255,.038));box-shadow:0 24px 80px rgba(0,0,0,.34);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
        .efBetaHomeHero{border-radius:34px;padding:20px;display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.52fr);gap:16px;align-items:center;min-height:310px;overflow:hidden;background:linear-gradient(150deg,rgba(120,240,255,.14),rgba(255,220,120,.055) 46%,rgba(255,255,255,.035))}
        .efHomeHeroCopy{display:grid;gap:10px;align-content:center}.efBetaHomeHero span,.efBetaHomeStats span,.efPlayerSupport span,.efAccountInfo span{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:rgba(231,242,255,.58);font-weight:1000}.efBetaHomeHero h1{margin:0;font-size:54px;line-height:.96}.efBetaHomeHero p,.efBetaAction span,.efPlayerSupport p,.efAccountInfo p{margin:0;color:rgba(231,242,255,.72);line-height:1.45}
        .efHeroPlay{margin-top:8px;min-height:54px;width:max-content;min-width:150px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:1px solid rgba(120,240,255,.34);background:linear-gradient(135deg,rgba(120,240,255,.24),rgba(255,220,120,.12));color:#e7f2ff;text-decoration:none;font-weight:1000;box-shadow:0 16px 42px rgba(0,0,0,.26)}
        .efHomeHeroPreview{position:relative;min-height:270px;display:grid;place-items:center;border-radius:28px;background:linear-gradient(180deg,rgba(3,26,44,.52),rgba(2,12,23,.28));overflow:hidden}.efHomeHeroPreview:before{content:"";position:absolute;inset:20px;border-radius:34px;border:1px solid rgba(150,230,255,.18);box-shadow:inset 0 0 48px rgba(70,220,255,.10)}.efHomeHeroPreview>*{position:relative}.efHomeHeroPreview .drop{position:absolute;width:7px;height:11px;border-radius:999px;background:linear-gradient(180deg,rgba(225,250,255,.82),rgba(90,220,255,.12));box-shadow:0 0 18px rgba(90,220,255,.24)}.efHomeHeroPreview .drop.a{left:16%;top:22%}.efHomeHeroPreview .drop.b{right:18%;top:30%;transform:scale(.72)}.efHomeHeroPreview .drop.c{right:28%;bottom:18%;transform:scale(.55)}
        .efAccountQuickCard{border-radius:28px;padding:14px;display:grid;grid-template-columns:auto minmax(0,1fr) minmax(260px,.7fr);gap:12px;align-items:center}.efAccountAvatar{width:54px;height:54px;border-radius:19px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(120,240,255,.30),rgba(255,220,120,.18));border:1px solid rgba(255,255,255,.16);font-weight:1000;font-size:22px}.efAccountInfo{min-width:0}.efAccountInfo h2{margin:4px 0;font-size:24px;line-height:1;overflow:hidden;text-overflow:ellipsis}
        .efNameEditInline{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.efNameEditInline input{min-height:42px;border-radius:15px;border:1px solid rgba(150,230,255,.18);background:rgba(2,16,27,.45);color:#e7f2ff;padding:0 12px;font-size:15px;font-weight:900;outline:none}.efNameEditInline input:focus{border-color:rgba(120,240,255,.42);box-shadow:0 0 0 3px rgba(120,240,255,.10)}.efNameEditInline button{min-height:42px;border-radius:15px;border:1px solid rgba(120,240,255,.24);background:rgba(120,240,255,.13);color:#e7f2ff;padding:0 13px;font-weight:1000}
        .efBetaHomeStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.efBetaHomeStats article{border-radius:22px;padding:12px;display:grid;gap:5px}.efBetaHomeStats b{font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efBetaHomeStats small{color:rgba(231,242,255,.62);font-size:11px}.efBetaActionGrid{display:grid;gap:12px}.efBetaActionGrid.public{grid-template-columns:repeat(6,minmax(0,1fr))}
        .efBetaAction{min-height:132px;border-radius:28px;padding:17px;text-decoration:none;color:#e7f2ff;display:grid;gap:7px;align-content:center;position:relative;overflow:hidden}.efBetaAction:before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(120,240,255,.10),transparent 62%);pointer-events:none}.efBetaAction.primary{border-color:rgba(120,240,255,.32);background:linear-gradient(135deg,rgba(120,240,255,.22),rgba(255,220,120,.08))}.efBetaAction.season{border-color:rgba(255,220,120,.32);background:linear-gradient(135deg,rgba(255,220,120,.16),rgba(120,240,255,.10))}.efBetaAction b,.efBetaAction span{position:relative}.efBetaAction b{font-size:21px}
        .efPlayerSupport{border-radius:28px;padding:16px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center}.efPlayerSupport.good{border-color:rgba(110,255,180,.22)}.efPlayerSupport.warn{border-color:rgba(255,220,120,.26)}.efPlayerSupport.bad{border-color:rgba(255,120,120,.28)}.efPlayerSupport h2{margin:4px 0;font-size:22px}.efPlayerSupportActions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.efPlayerSupportActions button{min-height:38px;border-radius:999px;border:1px solid rgba(120,240,255,.22);background:rgba(120,240,255,.10);color:#e7f2ff;padding:0 13px;font-weight:1000;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
        @media(max-width:1120px){.efBetaActionGrid.public{grid-template-columns:1fr 1fr 1fr}.efAccountQuickCard{grid-template-columns:auto minmax(0,1fr)}}@media(max-width:760px){.efBetaHomeHero,.efPlayerSupport,.efAccountQuickCard{grid-template-columns:1fr}.efHomeHeroPreview{min-height:220px}.efHeroPlay{width:100%}.efPlayerSupportActions{justify-content:flex-start}.efBetaHomeStats{grid-template-columns:1fr 1fr}.efNameEditInline{grid-template-columns:1fr}.efBetaActionGrid.public{grid-template-columns:1fr 1fr}}@media(max-width:560px){.efBetaHomeStats,.efBetaActionGrid.public{grid-template-columns:1fr}.efBetaHomeHero h1{font-size:42px}.efBetaAction{min-height:108px}}
      `}</style>
    </main>
  );
}
