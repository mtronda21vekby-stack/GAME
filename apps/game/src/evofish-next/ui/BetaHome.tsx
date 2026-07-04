import React, { useState } from "react";
import { Link } from "../../router";
import { getMutationTotalLevel } from "../content/mutations";
import { inspectEvoFishNextSave, loadEvoFishNextSave, repairEvoFishNextSave, resetEvoFishNextRun, type EvoFishSaveDoctorReport } from "../state/nextSaveStore";

function format(value: number) { return Math.max(0, Math.floor(value || 0)).toLocaleString("ru-RU"); }
function statusLabel(report: EvoFishSaveDoctorReport) { if (report.status === "healthy") return "Сохранение в порядке"; if (report.status === "needs_repair") return "Нужен ремонт сохранения"; if (report.status === "repaired") return "Сохранение восстановлено"; if (report.status === "reset") return "Забег перезапущен"; return "Ошибка сохранения"; }
function statusTone(report: EvoFishSaveDoctorReport) { if (report.status === "healthy" || report.status === "repaired" || report.status === "reset") return "good"; if (report.status === "needs_repair") return "warn"; return "bad"; }

export function BetaHome() {
  const [save, setSave] = useState(() => loadEvoFishNextSave());
  const [doctor, setDoctor] = useState(() => inspectEvoFishNextSave());
  const mutations = getMutationTotalLevel(save.mutations);
  const ownedSkins = Object.keys(save.loadout.ownedSkins || {}).length;
  const achievements = Object.keys(save.achievements.unlocked || {}).length;
  const needsRepair = doctor.status !== "healthy";
  const refresh = (report?: EvoFishSaveDoctorReport) => { setSave(loadEvoFishNextSave()); setDoctor(report || inspectEvoFishNextSave()); };

  return (
    <main className="efBetaHome">
      <section className="efBetaHomeShell">
        <header className="efBetaHomeHero">
          <div>
            <span>BLACKCROWN · EVOFISH</span>
            <h1>EvoFish</h1>
            <p>Расти, собирай ресурсы, открывай мутации, соревнуйся в сезонном рейтинге и прокачивай скины рыб.</p>
          </div>
          <Link className="efHeroPlay" to="/game/play">Играть</Link>
        </header>

        <section className="efBetaHomeStats">
          <article><span>Уровень</span><b>LV {save.progress.level}</b><small>Tier {save.progress.tier} · Mass {save.progress.mass.toFixed(2)}</small></article>
          <article><span>Жемчуг</span><b>🦪 {format(save.economy.pearls)}</b><small>для покупки скинов</small></article>
          <article><span>Кристаллы</span><b>💎 {format(save.economy.corals)}</b><small>для мутаций</small></article>
          <article><span>Коллекция</span><b>{ownedSkins} скинов</b><small>{mutations} мутаций · {achievements} достижений</small></article>
        </section>

        <section className="efBetaActionGrid public">
          <Link className="efBetaAction primary" to="/game/play"><b>Играть</b><span>Продолжить забег, собрать ресурсы, победить хищников и вырасти дальше.</span><em>PLAY</em></Link>
          <Link className="efBetaAction" to="/game/skins"><b>Скины</b><span>Открывай новые облики для рыбы, акулы и мегалодона.</span><em>SKINS</em></Link>
          <Link className="efBetaAction" to="/game/progress"><b>Прогресс</b><span>Задания, достижения, награды и текущая прокачка.</span><em>PROGRESS</em></Link>
          <Link className="efBetaAction" to="/game/leaderboard"><b>Лидеры</b><span>Онлайн TOP 100 сезона, твой лучший результат и место в рейтинге.</span><em>ONLINE</em></Link>
        </section>

        {needsRepair ? (
          <section className={`efPlayerSupport ${statusTone(doctor)}`}>
            <div><span>Состояние сохранения</span><h2>{statusLabel(doctor)}</h2><p>{doctor.issues[0] || "Можно попробовать восстановить сохранение."}</p></div>
            <div className="efPlayerSupportActions"><button onClick={() => refresh(repairEvoFishNextSave())}>Восстановить</button><button onClick={() => refresh(resetEvoFishNextRun())}>Новый забег</button></div>
          </section>
        ) : null}
      </section>
      <style>{`.efBetaHome{min-height:100vh;background:#020b15;color:#e7f2ff;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.efBetaHomeShell{width:min(1120px,calc(100vw - 28px));margin:0 auto;padding:max(22px,env(safe-area-inset-top)) 0 max(24px,env(safe-area-inset-bottom));display:grid;gap:14px}.efBetaHomeHero,.efBetaHomeStats article,.efBetaAction,.efPlayerSupport{border:1px solid rgba(150,230,255,.15);background:linear-gradient(180deg,rgba(255,255,255,.085),rgba(255,255,255,.035));box-shadow:0 24px 80px rgba(0,0,0,.30);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.efBetaHomeHero{border-radius:34px;padding:20px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;background:radial-gradient(circle at 12% 0,rgba(120,240,255,.18),transparent 38%),linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.035))}.efBetaHomeHero span,.efBetaHomeStats span,.efPlayerSupport span{font-size:11px;letter-spacing:.13em;text-transform:uppercase;color:rgba(231,242,255,.56);font-weight:1000}.efBetaHomeHero h1{margin:6px 0;font-size:44px;line-height:1}.efBetaHomeHero p,.efBetaAction span,.efPlayerSupport p{margin:0;color:rgba(231,242,255,.68);line-height:1.45}.efHeroPlay{min-height:54px;min-width:132px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:1px solid rgba(120,240,255,.30);background:linear-gradient(135deg,rgba(120,240,255,.20),rgba(255,220,120,.09));color:#e7f2ff;text-decoration:none;font-weight:1000;box-shadow:0 16px 42px rgba(0,0,0,.24)}.efBetaHomeStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.efBetaHomeStats article{border-radius:22px;padding:12px;display:grid;gap:5px}.efBetaHomeStats b{font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.efBetaHomeStats small{color:rgba(231,242,255,.62);font-size:11px}.efBetaActionGrid{display:grid;gap:12px}.efBetaActionGrid.public{grid-template-columns:1.25fr 1fr 1fr 1fr}.efBetaAction{min-height:138px;border-radius:28px;padding:17px;text-decoration:none;color:#e7f2ff;display:grid;gap:7px;align-content:center;position:relative;overflow:hidden}.efBetaAction:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 84% 18%,rgba(120,240,255,.16),transparent 44%);pointer-events:none}.efBetaAction.primary{border-color:rgba(120,240,255,.30);background:linear-gradient(135deg,rgba(120,240,255,.20),rgba(255,220,120,.08))}.efBetaAction b,.efBetaAction span,.efBetaAction em{position:relative}.efBetaAction b{font-size:22px}.efBetaAction em{font-style:normal;color:#fff3a0;font-size:11px;font-weight:1000;letter-spacing:.12em}.efPlayerSupport{border-radius:28px;padding:16px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center}.efPlayerSupport.good{border-color:rgba(110,255,180,.22)}.efPlayerSupport.warn{border-color:rgba(255,220,120,.26)}.efPlayerSupport.bad{border-color:rgba(255,120,120,.28)}.efPlayerSupport h2{margin:4px 0;font-size:22px}.efPlayerSupportActions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.efPlayerSupportActions button{min-height:38px;border-radius:999px;border:1px solid rgba(120,240,255,.22);background:rgba(120,240,255,.10);color:#e7f2ff;padding:0 13px;font-weight:1000;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}@media(max-width:1020px){.efBetaActionGrid.public{grid-template-columns:1fr 1fr}.efBetaHomeHero,.efPlayerSupport{grid-template-columns:1fr}.efHeroPlay{width:100%}.efPlayerSupportActions{justify-content:flex-start}.efBetaHomeStats{grid-template-columns:1fr 1fr}}@media(max-width:560px){.efBetaHomeStats,.efBetaActionGrid.public{grid-template-columns:1fr}.efBetaHomeHero h1{font-size:36px}.efBetaAction{min-height:112px}}`}</style>
    </main>
  );
}
